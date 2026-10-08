// Supabase Storage adapter for server-side uploads.
// Objects stay private; the application returns same-origin /api/manus-storage/{key}
// paths and signs reads only inside the server boundary.

import { ENV } from "./_core/env";

function getSupabaseStorageConfig() {
  const supabaseUrl = ENV.supabaseUrl.replace(/\/+$/, "");
  const serviceKey = ENV.supabaseServiceKey;
  const bucket = ENV.supabaseStorageBucket;

  if (!supabaseUrl || !serviceKey) {
    throw new Error(
      "Storage config missing: set SUPABASE_URL (or VITE_SUPABASE_URL) and SUPABASE_SECRET_KEY"
    );
  }
  if (!bucket)
    throw new Error("Storage config missing: set SUPABASE_STORAGE_BUCKET");

  return { supabaseUrl, serviceKey, bucket };
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

function appendHashSuffix(relKey: string): string {
  const hash = crypto.randomUUID().replace(/-/g, "").slice(0, 8);
  const lastDot = relKey.lastIndexOf(".");
  if (lastDot === -1) return `${relKey}_${hash}`;
  return `${relKey.slice(0, lastDot)}_${hash}${relKey.slice(lastDot)}`;
}

function objectPathUrl(baseUrl: string, bucket: string, key: string): string {
  const encodedKey = key
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
  return `${baseUrl}/storage/v1/object/${encodeURIComponent(bucket)}/${encodedKey}`;
}

function authHeaders(serviceKey: string): Record<string, string> {
  return { Authorization: `Bearer ${serviceKey}`, apikey: serviceKey };
}

let bucketReady: Promise<void> | null = null;
async function ensureBucket(
  config: ReturnType<typeof getSupabaseStorageConfig>
): Promise<void> {
  if (bucketReady) return bucketReady;
  bucketReady = (async () => {
    const requestId = crypto.randomUUID();
    const startedAt = Date.now();
    const endpoint = `${config.supabaseUrl}/storage/v1/bucket`;
    let supabaseHost = "unknown";
    try { supabaseHost = new URL(config.supabaseUrl).host; } catch {}
    console.info("[Storage] ensureBucket.start", {
      requestId,
      bucket: config.bucket,
      supabaseHost,
      operation: "create-or-reuse-private-bucket",
    });

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: "POST",
        headers: {
          ...authHeaders(config.serviceKey),
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: config.bucket,
          name: config.bucket,
          public: false,
        }),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[Storage] ensureBucket.network_error", {
        requestId,
        bucket: config.bucket,
        supabaseHost,
        durationMs: Date.now() - startedAt,
        errorName: error instanceof Error ? error.name : "UnknownError",
        errorMessage: message.slice(0, 500),
      });
      throw new Error(`Supabase storage bucket request failed due to a network error (request ${requestId}).`);
    }

    if (response.ok) {
      console.info("[Storage] ensureBucket.created", { requestId, bucket: config.bucket, status: response.status, durationMs: Date.now() - startedAt });
      return;
    }
    if (response.status === 409) {
      console.warn("[Storage] ensureBucket.already_exists", { requestId, bucket: config.bucket, status: response.status, durationMs: Date.now() - startedAt, source: "http-status" });
      return;
    }
    const message = await response.text().catch(() => response.statusText);
    const payload: { statusCode?: number | string; error?: string; code?: string } | null = (() => {
      try { return JSON.parse(message) as { statusCode?: number | string; error?: string; code?: string }; } catch { return null; }
    })();
    const bucketAlreadyExists = payload?.statusCode === 409 || payload?.statusCode === "409" || payload?.error === "BucketAlreadyExists" || payload?.code === "BucketAlreadyExists" || /BucketAlreadyExists|resource already exists/i.test(message);
    if (bucketAlreadyExists) {
      console.warn("[Storage] ensureBucket.already_exists", { requestId, bucket: config.bucket, status: response.status, durationMs: Date.now() - startedAt, source: "response-payload", providerCode: payload?.error || payload?.code || "BucketAlreadyExists" });
      return;
    }
    const permissionFailure = response.status === 401 || response.status === 403;
    console.error(permissionFailure ? "[Storage] ensureBucket.permission_error" : "[Storage] ensureBucket.provider_error", {
      requestId,
      bucket: config.bucket,
      supabaseHost,
      status: response.status,
      statusText: response.statusText,
      durationMs: Date.now() - startedAt,
      providerCode: payload?.error || payload?.code || "unknown",
      providerStatusCode: payload?.statusCode || "unknown",
      responsePreview: message.slice(0, 500),
    });
    throw new Error(
      `Supabase storage bucket setup failed (${response.status})${permissionFailure ? " due to missing or invalid Storage permissions" : ""} (request ${requestId}).`
    );
  })().catch(error => {
    bucketReady = null;
    throw error;
  });
  return bucketReady;
}

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  const config = getSupabaseStorageConfig();
  await ensureBucket(config);
  const key = appendHashSuffix(normalizeKey(relKey));
  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const response = await fetch(
    objectPathUrl(config.supabaseUrl, config.bucket, key),
    {
      method: "POST",
      headers: {
        ...authHeaders(config.serviceKey),
        "Content-Type": contentType,
        "x-upsert": "false",
      },
      body: blob,
    }
  );
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Supabase storage upload failed (${response.status}): ${message}`
    );
  }
  return { key, url: `/api/manus-storage/${key}` };
}

export async function storagePutAtKey(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream",
): Promise<{ key: string; url: string }> {
  const config = getSupabaseStorageConfig();
  await ensureBucket(config);
  const key = normalizeKey(relKey);
  const blob = typeof data === "string"
    ? new Blob([data], { type: contentType })
    : new Blob([data as any], { type: contentType });
  const response = await fetch(objectPathUrl(config.supabaseUrl, config.bucket, key), {
    method: "POST",
    headers: { ...authHeaders(config.serviceKey), "Content-Type": contentType, "x-upsert": "true" },
    body: blob,
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Supabase storage exact-key upload failed (${response.status}): ${message}`);
  }
  return { key, url: `/api/manus-storage/${key}` };
}

export async function storageDownload(relKey: string): Promise<Buffer> {
  const config = getSupabaseStorageConfig();
  const response = await fetch(objectPathUrl(config.supabaseUrl, config.bucket, normalizeKey(relKey)), {
    method: "GET",
    headers: authHeaders(config.serviceKey),
  });
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Supabase storage download failed (${response.status}): ${message}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

export async function storageDelete(relKey: string): Promise<void> {
  const config = getSupabaseStorageConfig();
  const response = await fetch(`${config.supabaseUrl}/storage/v1/object/${encodeURIComponent(config.bucket)}`, {
    method: "DELETE",
    headers: { ...authHeaders(config.serviceKey), "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [normalizeKey(relKey)] }),
  });
  if (!response.ok && response.status !== 404) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Supabase storage delete failed (${response.status}): ${message}`);
  }
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/api/manus-storage/${key}` };
}

export async function storageGetSignedUrl(
  relKey: string,
  expiresIn = 3600
): Promise<string> {
  const config = getSupabaseStorageConfig();
  const key = normalizeKey(relKey);
  const encodedKey = key
    .split("/")
    .map(part => encodeURIComponent(part))
    .join("/");
  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/sign/${encodeURIComponent(config.bucket)}/${encodedKey}`,
    {
      method: "POST",
      headers: {
        ...authHeaders(config.serviceKey),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ expiresIn }),
    }
  );
  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(
      `Supabase storage signed URL failed (${response.status}): ${message}`
    );
  }
  const payload = (await response.json()) as {
    signedURL?: string;
    signedUrl?: string;
    url?: string;
  };
  const signedUrl = payload.signedURL ?? payload.signedUrl ?? payload.url;
  if (!signedUrl)
    throw new Error("Supabase storage returned an empty signed URL");
  return signedUrl.startsWith("http")
    ? signedUrl
    : `${config.supabaseUrl}/storage/v1${signedUrl}`;
}
