import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { storagePut } from "./storage";

const MAX_LOGO_BYTES = 2 * 1024 * 1024;
const MANAGE_BRANDING_ROLES = new Set(["owner", "admin", "Organization Owner", "CEO", "Super Administrator", "System Administrator"]);
const MIME_EXTENSIONS: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/svg+xml": "svg",
};

export function canManageWorkspaceBrandingRole(role: string) {
  return MANAGE_BRANDING_ROLES.has(role);
}

type LogoPayload = { mimeType: keyof typeof MIME_EXTENSIONS; base64: string };
type WorkspaceSettings = {
  name: string;
  category?: string;
  country?: string;
  currency?: string;
  taxRate?: number;
  timezone?: string;
  businessScale?: string;
  receiptWidth?: string;
  receiptFooter?: string;
  receiptShowLogo?: boolean;
  phone?: string;
  email?: string;
  website?: string;
  address?: string;
  city?: string;
  tin?: string;
  taxId?: string;
  vrn?: string;
};
type BrandingInput = { primaryColor: string; accentColor: string; logo?: LogoPayload | null; removeLogo?: boolean; workspace?: WorkspaceSettings };

export function normalizeBrandColor(value: string) {
  const color = value.trim().toUpperCase();
  if (!/^#[0-9A-F]{6}$/.test(color)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a valid six-digit brand color." });
  }
  return color;
}

export function decodeLogoBase64(logo: LogoPayload) {
  const ext = MIME_EXTENSIONS[logo.mimeType];
  if (!ext || !/^[A-Za-z0-9+/]+={0,2}$/.test(logo.base64)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a PNG, JPEG, WebP, or SVG logo file." });
  }
  const bytes = Buffer.from(logo.base64, "base64");
  if (!bytes.length || bytes.length > MAX_LOGO_BYTES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Your logo must be a non-empty image under 2 MB." });
  }
  return { bytes, ext };
}

export function isRecognizedLogo(bytes: Buffer, mimeType: string) {
  if (mimeType === "image/png") return bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (mimeType === "image/jpeg") return bytes[0] === 0xff && bytes[1] === 0xd8;
  if (mimeType === "image/webp") return bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (mimeType === "image/svg+xml") return bytes.subarray(0, 1024).toString("utf8").replace(/^\uFEFF/, "").trimStart().startsWith("<svg");
  return false;
}

async function updateCompanyBranding(companyId: string, token: string, values: Record<string, string | number | boolean | null>) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace branding is not configured." });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`, {
    method: "PATCH",
    headers: {
      apikey: ENV.supabaseAnonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(values),
  });
  const rows = await response.json().catch(() => null) as Array<Record<string, unknown>> | null;
  if (!response.ok || !rows?.[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Branding could not be saved for this workspace." });
  return rows[0];
}

export async function saveWorkspaceBranding(req: CreateExpressContextOptions["req"], input: BrandingInput) {
  const { profile, token } = await resolveVerifiedProfile(req);
  if (!canManageWorkspaceBrandingRole(profile.role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only an organization administrator can change workspace branding." });
  }

  const primaryColor = normalizeBrandColor(input.primaryColor);
  const accentColor = normalizeBrandColor(input.accentColor);
  let logoUrl: string | undefined;

  if (input.logo) {
    const { bytes, ext } = decodeLogoBase64(input.logo);
    if (!isRecognizedLogo(bytes, input.logo.mimeType)) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "The selected file does not match its declared image type." });
    }
    const uploaded = await storagePut(`workspace-branding/${profile.company_id}/logo.${ext}`, bytes, input.logo.mimeType);
    logoUrl = uploaded.url;
  }

  const workspace = input.workspace;
  const company = await updateCompanyBranding(profile.company_id, token, {
    ...(workspace ? {
      name: workspace.name.trim(),
      category: workspace.category?.trim() || null,
      country: workspace.country?.trim() || null,
      currency: workspace.currency?.trim() || null,
      tax_rate: workspace.taxRate ?? null,
      timezone: workspace.timezone?.trim() || null,
      business_scale: workspace.businessScale?.trim() || null,
      receipt_width: workspace.receiptWidth?.trim() || null,
      receipt_footer: workspace.receiptFooter?.trim() || null,
      receipt_show_logo: workspace.receiptShowLogo ?? true,
      phone: workspace.phone?.trim() || null,
      email: workspace.email?.trim() || null,
      website: workspace.website?.trim() || null,
      address: workspace.address?.trim() || null,
      city: workspace.city?.trim() || null,
      tin: workspace.tin?.trim() || null,
      tax_id: workspace.taxId?.trim() || null,
      vrn: workspace.vrn?.trim() || null,
    } : {}),
    brand_primary_color: primaryColor,
    brand_accent_color: accentColor,
    ...(logoUrl ? { logo: logoUrl } : input.removeLogo ? { logo: null } : {}),
  });

  return {
    companyId: profile.company_id,
    company,
    logo: typeof company.logo === "string" ? company.logo : logoUrl ?? null,
    primaryColor: typeof company.brand_primary_color === "string" ? company.brand_primary_color : primaryColor,
    accentColor: typeof company.brand_accent_color === "string" ? company.brand_accent_color : accentColor,
  };
}
