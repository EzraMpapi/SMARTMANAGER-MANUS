import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { resolveVerifiedProfile } from "./aiApprovals";
import { storagePut } from "./storage";

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
  const stored = await storagePut(`inventory-products/${profile.company_id}/${profile.id}/${Date.now()}-${safeName}`, bytes, parsed.mimeType);
  return { url: stored.url, key: stored.key, mimeType: parsed.mimeType };
}
