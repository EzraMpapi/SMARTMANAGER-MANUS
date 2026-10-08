import { describe, expect, it, vi } from "vitest";
import { handleSchedulerRequest } from "../supabase/functions/standing-order-scheduler/lib";

const env = {
  get(name: string) {
    return {
      STANDING_ORDER_AUTOMATION_SECRET: "automation-test-secret",
      SUPABASE_URL: "https://example.supabase.co/",
      SUPABASE_SECRET_KEY: "service-test-secret",
      STANDING_ORDER_SCHEDULER_TIMEOUT_MS: "5000",
    }[name];
  },
};

function request(body: unknown, secret = "automation-test-secret") {
  return new Request("https://function.example/standing-order-scheduler", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      apikey: secret,
    },
    body: JSON.stringify(body),
  });
}

describe("Standing Order scheduler Edge Function draft", () => {
  it("rejects non-POST requests before reading credentials", async () => {
    const response = await handleSchedulerRequest(
      new Request("https://function.example/standing-order-scheduler", { method: "GET" }),
      { env, fetchImpl: vi.fn() },
    );
    expect(response.status).toBe(405);
  });

  it("rejects an invalid automation secret after the Vault-backed validator denies it", async () => {
    const fetchImpl = vi.fn(async () => new Response("false", { status: 200 }));
    const response = await handleSchedulerRequest(request({ source: "test" }, "wrong-secret"), { env, fetchImpl });
    expect(response.status).toBe(401);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(String(fetchImpl.mock.calls[0]?.[0])).toContain("/rpc/bank_validate_scheduler_secret");
  });

  it("calls the service-only bridge with a bounded, correlated payload", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      if (String(input).includes("bank_validate_scheduler_secret")) {
        return new Response("true", { status: 200 });
      }
      expect(init?.method).toBe("POST");
      expect((init?.headers as Record<string, string>).apikey).toBe("service-test-secret");
      expect((init?.headers as Record<string, string>).authorization).toBe("Bearer service-test-secret");
      const payload = JSON.parse(String(init?.body));
      expect(payload.p_run_date).toBe("2026-08-25");
      expect(payload.p_order_id).toBeNull();
      expect(payload.p_max_orders).toBe(1);
      expect(payload.p_execution_id).toMatch(/^[0-9a-f-]{36}$/i);
      return new Response(JSON.stringify({ processed: 1, posted: 1, pendingProvider: 0, failed: 0, skipped: 0, completed: 0 }), { status: 200 });
    });

    const response = await handleSchedulerRequest(
      request({ source: "test", maxOrders: 1 }),
      { env, fetchImpl, now: () => Date.parse("2026-08-25T00:30:00.000Z") },
    );
    const body = await response.json();
    expect(response.status).toBe(200);
    expect(body.ok).toBe(true);
    expect(body.runDate).toBe("2026-08-25");
    expect(body.summary).toEqual({ processed: 1, posted: 1, pendingProvider: 0, failed: 0, skipped: 0, completed: 0 });
  });

  it("returns 400 for invalid bounded input after authentication", async () => {
    const fetchImpl = vi.fn(async () => new Response("true", { status: 200 }));
    const response = await handleSchedulerRequest(request({ maxOrders: 0 }), { env, fetchImpl });
    expect(response.status).toBe(400);
    expect(await response.json()).toEqual({ ok: false, error: "maxOrders must be an integer between 1 and 250." });
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("does not expose upstream errors and returns a retryable failure status", async () => {
    const fetchImpl = vi.fn(async (input: RequestInfo | URL) => {
      if (String(input).includes("bank_validate_scheduler_secret")) {
        return new Response("true", { status: 200 });
      }
      return new Response("sensitive upstream detail", { status: 500 });
    });
    const response = await handleSchedulerRequest(request({ source: "test", maxOrders: 1 }), { env, fetchImpl });
    const body = await response.json();
    expect(response.status).toBe(502);
    expect(body.ok).toBe(false);
    expect(body.error).toBe("Standing Order scheduler execution failed.");
    expect(body).not.toHaveProperty("reason");
  });
});
