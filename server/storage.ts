// Supabase Storage adapter for server-side uploads.
// Objects stay private; the application returns same-origin /manus-storage/{key}
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
    const response = await fetch(`${config.supabaseUrl}/storage/v1/bucket`, {
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
    if (!response.ok && response.status !== 409) {
      const message = await response.text().catch(() => response.statusText);
      throw new Error(
        `Supabase storage bucket setup failed (${response.status}): ${message}`
      );
    }
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
  return { key, url: `/manus-storage/${key}` };
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `/manus-storage/${key}` };
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
