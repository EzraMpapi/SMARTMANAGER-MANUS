import { TRPCError } from "@trpc/server";
import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { storagePut } from "./storage";
import { decodeLogoBase64, isRecognizedLogo, normalizeBrandColor, normalizeOrganizationIndustryFocus } from "./workspaceBranding";

const MANAGE_SETTINGS_ROLES = new Set(["owner", "Owner", "Organization Owner", "CEO", "Super Administrator", "System Administrator"]);
const MAX_COVER_BYTES = 5 * 1024 * 1024;
const MIN_IDLE_TIMEOUT_MINUTES = 5;
const MAX_IDLE_TIMEOUT_MINUTES = 120;
const DEFAULT_IDLE_TIMEOUT_MINUTES = 30;

type ImagePayload = { mimeType: "image/png" | "image/jpeg" | "image/webp"; base64: string };
type ProfileData = {
  tagline?: string; description?: string; businessType?: string; foundedYear?: string; regNumber?: string; postalCode?: string;
  facebook?: string; instagram?: string; twitter?: string; linkedin?: string; tiktok?: string; whatsappBusiness?: string;
  bankName?: string; bankAccountName?: string; bankAccountNo?: string; bankBranch?: string; bankSwift?: string;
  businessHours?: Record<string, { open?: string; close?: string; closed?: boolean }>;
  coverPhoto?: string | null;
  idleTimeoutMinutes?: number;
  loginBackgroundImage?: string | null;
  onboardingBackgroundImage?: string | null;
};
type SettingsInput = {
  name: string; country: string; currency: string; tin?: string; phone?: string; email?: string; address?: string; city?: string; website?: string;
  taxRate: number; timezone: string; businessScale: string; receiptWidth: string; receiptFooter?: string; receiptShowLogo: boolean;
  primaryColor: string; accentColor: string; industryFocus?: string; logo?: { mimeType: "image/png" | "image/jpeg" | "image/webp" | "image/svg+xml"; base64: string } | null; removeLogo?: boolean;
  cover?: ImagePayload | null; removeCover?: boolean;
  loginBackground?: ImagePayload | null; removeLoginBackground?: boolean;
  onboardingBackground?: ImagePayload | null; removeOnboardingBackground?: boolean;
  idleTimeoutMinutes?: number;
  profileData: ProfileData;
};

function decodeImageBase64(image: ImagePayload, label: string) {
  if (!/^[A-Za-z0-9+/]+={0,2}$/.test(image.base64)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Upload a PNG, JPEG, or WebP ${label} image.` });
  }
  const bytes = Buffer.from(image.base64, "base64");
  if (!bytes.length || bytes.length > MAX_COVER_BYTES) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Your ${label} image must be a non-empty image under 5 MB.` });
  }
  return { bytes, ext: image.mimeType === "image/png" ? "png" : image.mimeType === "image/jpeg" ? "jpg" : "webp" };
}

function normalizeIdleTimeoutMinutes(value: unknown) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return DEFAULT_IDLE_TIMEOUT_MINUTES;
  return Math.min(MAX_IDLE_TIMEOUT_MINUTES, Math.max(MIN_IDLE_TIMEOUT_MINUTES, Math.round(parsed)));
}

function requireSettingsManager(role: string) {
  if (!MANAGE_SETTINGS_ROLES.has(role)) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Only an organization administrator can change company settings." });
  }
}

function serviceHeaders() {
  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Secure Settings storage is not configured for this workspace." });
  }
  return { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
}

async function fetchCompany(companyId: string, token: string) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace Settings is not configured." });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}&select=*`, {
    headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}` },
  });
  const rows = await response.json().catch(() => null) as Array<Record<string, unknown>> | null;
  if (!response.ok || !rows?.[0]) throw new TRPCError({ code: "FORBIDDEN", message: "This company profile is unavailable for your current workspace." });
  return rows[0];
}

async function fetchProfileData(companyId: string, token: string): Promise<ProfileData> {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace Settings is not configured." });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/company_profile_settings?company_id=eq.${encodeURIComponent(companyId)}&select=profile_data`, {
    headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}` },
  });
  const rows = await response.json().catch(() => null) as Array<{ profile_data?: ProfileData }> | null;
  if (!response.ok) throw new TRPCError({ code: "FORBIDDEN", message: "Extended company settings could not be loaded for this workspace." });
  return rows?.[0]?.profile_data || {};
}

async function patchCompany(companyId: string, token: string, values: Record<string, unknown>) {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace Settings is not configured." });
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`, {
    method: "PATCH",
    headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", Prefer: "return=representation" },
    body: JSON.stringify(values),
  });
  const rows = await response.json().catch(() => null) as Array<Record<string, unknown>> | null;
  if (!response.ok || !rows?.[0]) throw new TRPCError({ code: "FORBIDDEN", message: "The server did not confirm the company settings update." });
  return rows[0];
}

async function upsertProfileData(companyId: string, profileData: ProfileData) {
  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/company_profile_settings?on_conflict=company_id`, {
    method: "POST",
    headers: { ...serviceHeaders(), Prefer: "resolution=merge-duplicates,return=representation" },
    body: JSON.stringify({ company_id: companyId, profile_data: profileData, updated_at: new Date().toISOString() }),
  });
  const rows = await response.json().catch(() => null) as Array<{ profile_data?: ProfileData }> | null;
  if (!response.ok || !rows?.[0]) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The server did not confirm the extended company settings update." });
  return rows[0].profile_data || profileData;
}

function cleanProfileData(data: ProfileData): ProfileData {
  return {
    tagline: data.tagline || "", description: data.description || "", businessType: data.businessType || "", foundedYear: data.foundedYear || "", regNumber: data.regNumber || "", postalCode: data.postalCode || "",
    facebook: data.facebook || "", instagram: data.instagram || "", twitter: data.twitter || "", linkedin: data.linkedin || "", tiktok: data.tiktok || "", whatsappBusiness: data.whatsappBusiness || "",
    bankName: data.bankName || "", bankAccountName: data.bankAccountName || "", bankAccountNo: data.bankAccountNo || "", bankBranch: data.bankBranch || "", bankSwift: data.bankSwift || "",
    businessHours: data.businessHours || {}, ...(data.coverPhoto ? { coverPhoto: data.coverPhoto } : {}),
    idleTimeoutMinutes: normalizeIdleTimeoutMinutes(data.idleTimeoutMinutes),
    ...(data.loginBackgroundImage ? { loginBackgroundImage: data.loginBackgroundImage } : {}),
    ...(data.onboardingBackgroundImage ? { onboardingBackgroundImage: data.onboardingBackgroundImage } : {}),
  };
}

export async function getWorkspaceSettings(req: CreateExpressContextOptions["req"]) {
  const { profile, token } = await resolveVerifiedProfile(req);
  const [company, profileData] = await Promise.all([fetchCompany(profile.company_id, token), fetchProfileData(profile.company_id, token)]);
  return { company, profileData };
}

export async function saveWorkspaceSettings(req: CreateExpressContextOptions["req"], input: SettingsInput) {
  const { profile, token } = await resolveVerifiedProfile(req);
  requireSettingsManager(profile.role);
  const previousCompany = await fetchCompany(profile.company_id, token);
  const previousProfileData = await fetchProfileData(profile.company_id, token);
  const primaryColor = normalizeBrandColor(input.primaryColor);
  const accentColor = normalizeBrandColor(input.accentColor);
  const industryFocus = normalizeOrganizationIndustryFocus(input.industryFocus);
  let logoUrl: string | undefined;
  let coverUrl: string | undefined;
  let loginBackgroundUrl: string | undefined;
  let onboardingBackgroundUrl: string | undefined;

  if (input.logo) {
    const { bytes, ext } = decodeLogoBase64(input.logo);
    if (!isRecognizedLogo(bytes, input.logo.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected logo does not match its declared image type." });
    logoUrl = (await storagePut(`workspace-branding/${profile.company_id}/logo.${ext}`, bytes, input.logo.mimeType)).url;
  }
  if (input.cover) {
    const { bytes, ext } = decodeImageBase64(input.cover, "cover");
    if (!isRecognizedLogo(bytes, input.cover.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected cover image does not match its declared image type." });
    coverUrl = (await storagePut(`workspace-branding/${profile.company_id}/cover.${ext}`, bytes, input.cover.mimeType)).url;
  }
  if (input.loginBackground) {
    const { bytes, ext } = decodeImageBase64(input.loginBackground, "login background");
    if (!isRecognizedLogo(bytes, input.loginBackground.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected login background does not match its declared image type." });
    loginBackgroundUrl = (await storagePut(`workspace-branding/${profile.company_id}/auth-login-background.${ext}`, bytes, input.loginBackground.mimeType)).url;
  }
  if (input.onboardingBackground) {
    const { bytes, ext } = decodeImageBase64(input.onboardingBackground, "onboarding background");
    if (!isRecognizedLogo(bytes, input.onboardingBackground.mimeType)) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected onboarding background does not match its declared image type." });
    onboardingBackgroundUrl = (await storagePut(`workspace-branding/${profile.company_id}/auth-onboarding-background.${ext}`, bytes, input.onboardingBackground.mimeType)).url;
  }

  const companyPatch = {
    name: input.name.trim(), country: input.country.trim(), currency: input.currency, tin: input.tin?.trim() || null, phone: input.phone?.trim() || null,
    email: input.email?.trim() || null, address: input.address?.trim() || null, city: input.city?.trim() || null, website: input.website?.trim() || null,
    tax_rate: input.taxRate, timezone: input.timezone, business_scale: input.businessScale, receipt_width: input.receiptWidth, receipt_footer: input.receiptFooter?.trim() || null,
    receipt_show_logo: input.receiptShowLogo, brand_primary_color: primaryColor, brand_accent_color: accentColor,
    ...(industryFocus ? { category: industryFocus } : {}), ...(logoUrl ? { logo: logoUrl } : input.removeLogo ? { logo: null } : {}),
  };
  const profileData = cleanProfileData({
    ...input.profileData,
    ...(coverUrl ? { coverPhoto: coverUrl } : input.removeCover ? { coverPhoto: null } : {}),
    idleTimeoutMinutes: normalizeIdleTimeoutMinutes(input.idleTimeoutMinutes ?? input.profileData.idleTimeoutMinutes),
    ...(loginBackgroundUrl ? { loginBackgroundImage: loginBackgroundUrl } : input.removeLoginBackground ? { loginBackgroundImage: null } : {}),
    ...(onboardingBackgroundUrl ? { onboardingBackgroundImage: onboardingBackgroundUrl } : input.removeOnboardingBackground ? { onboardingBackgroundImage: null } : {}),
  });

  try {
    const company = await patchCompany(profile.company_id, token, companyPatch);
    const savedProfileData = await upsertProfileData(profile.company_id, profileData);
    return { company, profileData: savedProfileData };
  } catch (error) {
    try {
      await patchCompany(profile.company_id, token, previousCompany);
      await upsertProfileData(profile.company_id, previousProfileData);
    } catch (_rollbackError) {
      // The error below stays explicit; the next authenticated reload is the source of truth if a rollback is unavailable.
    }
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Company settings could not be saved. No success state was shown; reload Settings and retry." });
  }
}
