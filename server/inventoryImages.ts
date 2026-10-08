import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { resolveVerifiedProfile } from "./aiApprovals";
import { storagePut } from "./storage";
import { ENV } from "./_core/env";

const PRODUCT_IMAGE_BUCKET = "inventory-product-images";

// Saves product images in the project database storage (public bucket) so they persist on any host.
async function supabaseImagePut(path: string, bytes: Buffer, mimeType: string) {
  const base = ENV.supabaseUrl.replace(/\/+$/, "");
  const key = ENV.supabaseSecretKey;
  const headers = { apikey: key, Authorization: `Bearer ${key}` };
  const upload = () => fetch(`${base}/storage/v1/object/${PRODUCT_IMAGE_BUCKET}/${path}`, {
    method: "POST", headers: { ...headers, "Content-Type": mimeType, "x-upsert": "true", "cache-control": "31536000" }, body: new Uint8Array(bytes),
  });
  let res = await upload();
  if (res.status === 400 || res.status === 404) {
    const text = await res.clone().text().catch(() => "");
    if (/bucket/i.test(text) && /not.?found/i.test(text)) {
      await fetch(`${base}/storage/v1/bucket`, { method: "POST", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ id: PRODUCT_IMAGE_BUCKET, name: PRODUCT_IMAGE_BUCKET, public: true, file_size_limit: 3 * 1024 * 1024, allowed_mime_types: ["image/jpeg", "image/png", "image/webp"] }) });
      res = await upload();
    }
  }
  if (!res.ok) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: `Product image could not be saved (${res.status}).` });
  return { key: path, url: `${base}/storage/v1/object/public/${PRODUCT_IMAGE_BUCKET}/${path}` };
}

export const inventoryProductImageInput = z.object({
  fileName: z.string().trim().min(1).max(180),
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  base64: z.string().min(16).max(4_200_000),
}).strict();

export async function uploadInventoryProductImage(req: CreateExpressContextOptions["req"], input: z.infer<typeof inventoryProductImageInput>) {
  const { profile } = await resolveVerifiedProfile(req);
  const parsed = inventoryProductImageInput.parse(input);
  const bytes = Buffer.from(parsed.base64, "base64");
  if (!bytes.length || bytes.length > 3 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "Product images must be under 3 MB." });
  const signatureOk = parsed.mimeType === "image/png"
    ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : parsed.mimeType === "image/jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8
      : bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!signatureOk) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected product image is not a valid JPEG, PNG, or WebP file." });
  const safeName = parsed.fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${profile.company_id}/${profile.id}/${Date.now()}-${safeName}`;
  const stored = ENV.supabaseUrl && ENV.supabaseSecretKey
    ? await supabaseImagePut(path, bytes, parsed.mimeType)
    : await storagePut(`inventory-products/${path}`, bytes, parsed.mimeType);
  return { url: stored.url, key: stored.key, mimeType: parsed.mimeType };
}
