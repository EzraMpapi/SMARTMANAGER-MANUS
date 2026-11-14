type SchedulerEnv = {
  get(name: string): string | undefined;
};

type SchedulerSummary = {
  processed: number;
  posted: number;
  pendingProvider: number;
  failed: number;
  skipped: number;
  completed: number;
};

type SchedulerRequestBody = {
  runDate?: unknown;
  orderId?: unknown;
  maxOrders?: unknown;
  source?: unknown;
};

type SchedulerDependencies = {
  env?: SchedulerEnv;
  fetchImpl?: typeof fetch;
  now?: () => number;
};

const DEFAULT_TIME_ZONE = "Africa/Dar_es_Salaam";
const DEFAULT_MAX_ORDERS = 250;
const MAX_BODY_BYTES = 16_384;
const DEFAULT_TIMEOUT_MS = 20_000;
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

class SchedulerInputError extends Error {}
class SchedulerConfigurationError extends Error {}

const runtimeEnv: SchedulerEnv = {
  get(name) {
    return Deno.env.get(name);
  },
};

function resolveServiceKey(env: SchedulerEnv): string {
  const direct = (env.get("SUPABASE_SERVICE_ROLE_KEY") ?? env.get("SUPABASE_SECRET_KEY") ?? "").trim();
  if (direct) return direct;
  try {
    const secretKeys = JSON.parse(env.get("SUPABASE_SECRET_KEYS") ?? "{}") as Record<string, unknown>;
    const defaultKey = secretKeys.default;
    return typeof defaultKey === "string" ? defaultKey.trim() : "";
  } catch {
    return "";
  }
}

function json(body: Record<string, unknown>, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

function boundedText(value: unknown, maxLength: number): string | undefined {
  if (typeof value !== "string") return undefined;
  const normalized = value.trim();
  return normalized.length > 0 ? normalized.slice(0, maxLength) : undefined;
}

function isValidDate(value: string): boolean {
  if (!DATE_PATTERN.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function localDateInTimeZone(timeZone: string, now: number): string {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date(now));
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  const result = `${values.year}-${values.month}-${values.day}`;
  if (!isValidDate(result)) throw new Error("Unable to calculate the institution-local run date.");
  return result;
}

function constantTimeEqual(left: string, right: string): boolean {
  const leftBytes = new TextEncoder().encode(left);
  const rightBytes = new TextEncoder().encode(right);
  let difference = leftBytes.length ^ rightBytes.length;
  const length = Math.max(leftBytes.length, rightBytes.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (leftBytes[index] ?? 0) ^ (rightBytes[index] ?? 0);
  }
  return difference === 0;
}

async function readBody(request: Request): Promise<SchedulerRequestBody> {
  const contentLength = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(contentLength) && contentLength > MAX_BODY_BYTES) {
    throw new SchedulerInputError("Request body is too large.");
  }
  const raw = await request.text();
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    throw new SchedulerInputError("Request body is too large.");
  }
  if (!raw.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new SchedulerInputError("Request body must be valid JSON.");
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new SchedulerInputError("Request body must be a JSON object.");
  }
  return parsed as SchedulerRequestBody;
}

function parseRunRequest(body: SchedulerRequestBody, now: number) {
  const timeZone = DEFAULT_TIME_ZONE;
  const requestedRunDate = boundedText(body.runDate, 10);
  const runDate = requestedRunDate ?? localDateInTimeZone(timeZone, now);
  if (!isValidDate(runDate)) throw new SchedulerInputError("runDate must be an ISO date.");

  const orderId = body.orderId === null || body.orderId === undefined || body.orderId === ""
    ? null
    : boundedText(body.orderId, 36);
  if (orderId !== null && (!orderId || !UUID_PATTERN.test(orderId))) {
    throw new SchedulerInputError("orderId must be a UUID when supplied.");
  }

  const maxOrders = body.maxOrders === undefined || body.maxOrders === null || body.maxOrders === ""
    ? DEFAULT_MAX_ORDERS
    : Number(body.maxOrders);
  if (!Number.isInteger(maxOrders) || maxOrders < 1 || maxOrders > DEFAULT_MAX_ORDERS) {
    throw new SchedulerInputError(`maxOrders must be an integer between 1 and ${DEFAULT_MAX_ORDERS}.`);
  }

  const source = boundedText(body.source, 80) ?? "pg_cron";
  return { runDate, orderId, maxOrders, source };
}

function sanitizeSummary(value: unknown): SchedulerSummary {
  const source = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const integer = (field: keyof SchedulerSummary) => {
    const value = Number(source[field]);
    return Number.isSafeInteger(value) && value >= 0 ? value : 0;
  };
  return {
    processed: integer("processed"),
    posted: integer("posted"),
    pendingProvider: integer("pendingProvider"),
    failed: integer("failed"),
    skipped: integer("skipped"),
    completed: integer("completed"),
  };
}

export async function handleSchedulerRequest(
  request: Request,
  dependencies: SchedulerDependencies = {},
): Promise<Response> {
  const env = dependencies.env ?? runtimeEnv;
  const fetchImpl = dependencies.fetchImpl ?? fetch;
  const now = dependencies.now ?? Date.now;
  const startedAt = now();
  const executionId = crypto.randomUUID();

  if (request.method !== "POST") {
    return json({ ok: false, error: "Method not allowed." }, 405);
  }

  const suppliedSecret = request.headers.get("apikey")?.trim() ?? "";

  try {
    const supabaseUrl = env.get("SUPABASE_URL")?.replace(/\/$/, "") ?? "";
    const serviceKey = resolveServiceKey(env);
    if (!supabaseUrl || !serviceKey) {
      throw new SchedulerConfigurationError("Service-role Supabase configuration is missing.");
    }
    if (!suppliedSecret) {
      console.warn(JSON.stringify({ event: "standing_order_scheduler_unauthorized", executionId }));
      return json({ ok: false, error: "Unauthorized." }, 401);
    }

    const validatorResponse = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/bank_validate_scheduler_secret`, {
      method: "POST",
      headers: {
        apikey: serviceKey,
        authorization: `Bearer ${serviceKey}`,
        accept: "application/json",
        "content-type": "application/json",
      },
      body: JSON.stringify({ p_secret: suppliedSecret }),
    });
    const validatorBody: unknown = await validatorResponse.json().catch(() => null);
    if (!validatorResponse.ok || validatorBody !== true) {
      console.warn(JSON.stringify({ event: "standing_order_scheduler_unauthorized", executionId }));
      return json({ ok: false, error: "Unauthorized." }, 401);
    }

    const body = await readBody(request);
    const parsed = parseRunRequest(body, now());

    const timeoutMs = Number(env.get("STANDING_ORDER_SCHEDULER_TIMEOUT_MS") ?? DEFAULT_TIMEOUT_MS);
    const boundedTimeoutMs = Number.isInteger(timeoutMs) && timeoutMs >= 1_000 && timeoutMs <= 120_000
      ? timeoutMs
      : DEFAULT_TIMEOUT_MS;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), boundedTimeoutMs);

    let response: Response;
    try {
      response = await fetchImpl(`${supabaseUrl}/rest/v1/rpc/bank_scheduler_tick`, {
        method: "POST",
        signal: controller.signal,
        headers: {
          apikey: serviceKey,
          authorization: `Bearer ${serviceKey}`,
          accept: "application/json",
          "content-type": "application/json",
          prefer: "return=representation",
        },
        body: JSON.stringify({
          p_run_date: parsed.runDate,
          p_order_id: parsed.orderId,
          p_max_orders: parsed.maxOrders,
          p_execution_id: executionId,
        }),
      });
    } finally {
      clearTimeout(timeout);
    }

    const responseBody: unknown = await response.json().catch(() => null);
    if (!response.ok) {
      throw new Error(`Service bridge returned HTTP ${response.status}.`);
    }

    const summary = sanitizeSummary(responseBody);
    const durationMs = Math.max(0, now() - startedAt);
    console.info(JSON.stringify({
      event: "standing_order_scheduler_completed",
      executionId,
      source: parsed.source,
      runDate: parsed.runDate,
      durationMs,
      ...summary,
    }));
    return json({ ok: true, executionId, runDate: parsed.runDate, summary });
  } catch (error) {
    const durationMs = Math.max(0, now() - startedAt);
    const message = error instanceof Error ? error.message : "Unknown scheduler error.";
    const status = error instanceof SchedulerInputError ? 400 : error instanceof SchedulerConfigurationError ? 500 : 502;
    console.error(JSON.stringify({
      event: "standing_order_scheduler_failed",
      executionId,
      durationMs,
      reason: message.slice(0, 160),
      status,
    }));
    return json({
      ok: false,
      ...(status === 400 ? {} : { executionId }),
      error: status === 400 ? message : "Standing Order scheduler execution failed.",
    }, status);
  }
}
