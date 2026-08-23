import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { TRPCError } from "@trpc/server";
import { ENV } from "./_core/env";
import { resolveVerifiedProfile } from "./aiApprovals";
import { storagePut } from "./storage";

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const AVATAR_MIME_TYPES = ["image/png", "image/jpeg", "image/webp"] as const;
type AvatarMimeType = (typeof AVATAR_MIME_TYPES)[number];

export type ProfileIdentityUpdate = {
  preferredName?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  dateOfBirth?: string | null;
  gender?: string | null;
  phone?: string | null;
  address?: string | null;
  country?: string | null;
  preferredLanguage?: string | null;
  currencyDisplay?: string | null;
  timezone?: string | null;
  dateFormat?: string | null;
  theme?: string | null;
  notificationPreferences?: { email?: boolean; push?: boolean; sms?: boolean } | null;
};

type ProfileRow = Record<string, unknown> & {
  id: string;
  company_id: string;
  full_name?: string | null;
  email?: string | null;
  role?: string | null;
  customer_ref?: string | null;
  is_active?: boolean | null;
  created_at?: string | null;
  updated_at?: string | null;
};
type CompanyRow = Record<string, unknown> & { id?: string; name?: string | null; category?: string | null; region?: string | null; country?: string | null; logo?: string | null };
type EmployeeRow = Record<string, unknown> & { id?: string; profile_id?: string | null; company_id?: string; department_id?: string | null; position_id?: string | null; manager_employee_id?: string | null; employee_number?: string | null; employment_start_date?: string | null; employment_end_date?: string | null; timezone?: string | null; status?: string | null; created_at?: string | null };
type NotificationRow = { id?: string; title?: string | null; body?: string | null; type?: string | null; read_at?: string | null; created_at?: string | null };
type AuthUser = { id?: string; email?: string | null; last_sign_in_at?: string | null; user_metadata?: { full_name?: string; name?: string } };

const EDITABLE_FIELDS = new Set([
  "preferredName", "firstName", "middleName", "lastName", "fullName", "dateOfBirth", "gender", "phone", "address",
  "country", "preferredLanguage", "currencyDisplay", "timezone", "dateFormat", "theme", "notificationPreferences",
]);

function requireSupabase() {
  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
    throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Profile identity services are not configured for this workspace." });
  }
  return { url: ENV.supabaseUrl, anonKey: ENV.supabaseAnonKey };
}

async function requestJson<T>(path: string, token: string, init: RequestInit = {}) {
  const { url, anonKey } = requireSupabase();
  const response = await fetch(`${url}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.json().catch(() => null) as T | { message?: string; details?: string } | null;
  return { response, body };
}

async function authUser(token: string) {
  const { url, anonKey } = requireSupabase();
  const response = await fetch(`${url}/auth/v1/user`, { headers: { apikey: anonKey, authorization: `Bearer ${token}` } });
  const user = await response.json().catch(() => null) as AuthUser | null;
  if (!response.ok || !user?.id) throw new TRPCError({ code: "UNAUTHORIZED", message: "The current workspace session could not be verified." });
  return user;
}

function rowsOf<T>(body: unknown): T[] {
  return Array.isArray(body) ? body as T[] : [];
}

function rpcPayload(body: unknown): Record<string, unknown> | null {
  if (body && typeof body === "object" && !Array.isArray(body)) return body as Record<string, unknown>;
  return null;
}

async function getIdentityRpc(token: string) {
  const { response, body } = await requestJson<unknown>("get_current_profile_identity", token, { method: "POST", body: "{}" });
  if (response.ok) return { available: true, payload: rpcPayload(body) };
  if (response.status === 404 || response.status === 400 || response.status === 405) return { available: false, payload: null };
  throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The profile identity record could not be read." });
}

async function basicProfile(token: string, profileId: string, companyId: string) {
  const { response, body } = await requestJson<ProfileRow[]>(`profiles?select=id,company_id,full_name,email,role,customer_ref,is_active,created_at,updated_at&id=eq.${encodeURIComponent(profileId)}&company_id=eq.${encodeURIComponent(companyId)}&limit=1`, token);
  const rows = rowsOf<ProfileRow>(body);
  if (!response.ok || !rows[0]) throw new TRPCError({ code: "FORBIDDEN", message: "Your verified profile could not be read in this workspace." });
  return rows[0];
}

async function optionalRows<T>(path: string, token: string): Promise<T[]> {
  const { response, body } = await requestJson<T[]>(path, token);
  if (!response.ok) return [];
  return rowsOf<T>(body);
}

function stringValue(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function booleanValue(value: unknown) {
  return typeof value === "boolean" ? value : null;
}

function normalizedProfile(row: ProfileRow | Record<string, unknown>, auth: AuthUser, extended: boolean) {
  const value = (key: string, fallbackKey?: string) => row[key] ?? (fallbackKey ? row[fallbackKey] : undefined);
  const fullName = stringValue(value("fullName", "full_name")) || stringValue(value("full_name")) || stringValue(auth.user_metadata?.full_name) || stringValue(auth.user_metadata?.name) || stringValue(auth.email) || "Workspace user";
  const preferredName = stringValue(value("preferredName", "preferred_name"));
  const email = stringValue(value("email")) || stringValue(auth.email);
  const role = stringValue(value("role")) || "Employee";
  const isActive = booleanValue(value("isActive", "is_active"));
  return {
    id: stringValue(value("id")),
    companyId: stringValue(value("companyId", "company_id")),
    email,
    fullName,
    preferredName,
    firstName: stringValue(value("firstName", "first_name")),
    middleName: stringValue(value("middleName", "middle_name")),
    lastName: stringValue(value("lastName", "last_name")),
    role,
    phone: stringValue(value("phone")),
    address: stringValue(value("address")),
    country: stringValue(value("country")),
    gender: stringValue(value("gender")),
    dateOfBirth: stringValue(value("dateOfBirth", "date_of_birth")),
    preferredLanguage: stringValue(value("preferredLanguage", "preferred_language")),
    currencyDisplay: stringValue(value("currencyDisplay", "currency_display")),
    timezone: stringValue(value("timezone", "profile_timezone")),
    dateFormat: stringValue(value("dateFormat", "date_format")),
    theme: stringValue(value("theme", "theme_preference")),
    notificationPreferences: value("notificationPreferences", "notification_preferences") && typeof value("notificationPreferences", "notification_preferences") === "object" ? value("notificationPreferences", "notification_preferences") : null,
    avatarUrl: stringValue(value("avatarUrl", "avatar_url")),
    isActive,
    status: isActive === null ? "Unknown" : isActive ? "Active" : "Inactive",
    profileCompletedAt: stringValue(value("profileCompletedAt", "profile_completed_at")),
    createdAt: stringValue(value("createdAt", "created_at")),
    updatedAt: stringValue(value("updatedAt", "updated_at")),
    extendedFieldsAvailable: extended,
  };
}

function mapEmployee(employee: EmployeeRow | undefined) {
  if (!employee) return { assigned: false, source: "hr_employees", employeeId: null, employeeNumber: null, departmentId: null, positionId: null, managerEmployeeId: null, employmentStartDate: null, employmentEndDate: null, timezone: null, status: null };
  return {
    assigned: true,
    source: "hr_employees",
    employeeId: stringValue(employee.id),
    employeeNumber: stringValue(employee.employee_number),
    departmentId: stringValue(employee.department_id),
    positionId: stringValue(employee.position_id),
    managerEmployeeId: stringValue(employee.manager_employee_id),
    employmentStartDate: stringValue(employee.employment_start_date),
    employmentEndDate: stringValue(employee.employment_end_date),
    timezone: stringValue(employee.timezone),
    status: stringValue(employee.status),
  };
}

function profileCompletion(profile: ReturnType<typeof normalizedProfile>) {
  const checks = [profile.fullName, profile.email, profile.phone, profile.country, profile.timezone, profile.avatarUrl];
  const completed = checks.filter(Boolean).length;
  return { completed, total: checks.length, percentage: Math.round((completed / checks.length) * 100) };
}

export async function getProfileIdentity(req: CreateExpressContextOptions["req"]) {
  const { profile: verified, token } = await resolveVerifiedProfile(req);
  const auth = await authUser(token);
  const rpc = await getIdentityRpc(token);
  const basic = rpc.available && rpc.payload ? null : await basicProfile(token, verified.id, verified.company_id);
  const profile = normalizedProfile(rpc.payload || basic || verified, auth, rpc.available);
  const companyRows = await optionalRows<CompanyRow>(`companies?select=id,name,category,region,country,logo&id=eq.${encodeURIComponent(verified.company_id)}&limit=1`, token);
  const employeeRows = await optionalRows<EmployeeRow>(`hr_employees?select=id,company_id,profile_id,department_id,position_id,manager_employee_id,employee_number,employment_start_date,employment_end_date,timezone,status,created_at&company_id=eq.${encodeURIComponent(verified.company_id)}&profile_id=eq.${encodeURIComponent(verified.id)}&order=created_at.desc&limit=1`, token);
  const notifications = await optionalRows<NotificationRow>(`hr_notifications?select=id,title,body,type,read_at,created_at&company_id=eq.${encodeURIComponent(verified.company_id)}&profile_id=eq.${encodeURIComponent(verified.id)}&order=created_at.desc&limit=20`, token);
  const company = companyRows[0] ? { id: stringValue(companyRows[0].id), name: stringValue(companyRows[0].name), category: stringValue(companyRows[0].category), region: stringValue(companyRows[0].region), country: stringValue(companyRows[0].country), logo: stringValue(companyRows[0].logo) } : null;
  const work = mapEmployee(employeeRows[0]);
  const activity = notifications.map((item) => ({ id: stringValue(item.id), title: stringValue(item.title), body: stringValue(item.body), type: stringValue(item.type), readAt: stringValue(item.read_at), createdAt: stringValue(item.created_at) }));
  return {
    profile,
    company,
    work,
    security: {
      lastLoginAt: stringValue(auth.last_sign_in_at),
      currentSessionVerified: true,
      sessionDeviceDetailsAvailable: false,
      passwordChangeAvailable: false,
      note: "Password recovery and passkey controls remain managed by the existing authentication security flow.",
    },
    preferences: {
      theme: profile.theme,
      language: profile.preferredLanguage,
      currency: profile.currencyDisplay,
      timezone: profile.timezone,
      dateFormat: profile.dateFormat,
      notifications: profile.notificationPreferences,
    },
    notifications: activity,
    activity,
    completion: profileCompletion(profile),
    capabilities: {
      extendedFieldsAvailable: rpc.available,
      avatarLifecycleAvailable: rpc.available,
      workspaceSwitchingAvailable: false,
      sessionDeviceListAvailable: false,
      activityFeedAvailable: notifications.length > 0,
    },
  };
}

export async function updateProfileIdentity(req: CreateExpressContextOptions["req"], input: ProfileIdentityUpdate) {
  const { profile: verified, token } = await resolveVerifiedProfile(req);
  for (const key of Object.keys(input)) {
    if (!EDITABLE_FIELDS.has(key)) throw new TRPCError({ code: "FORBIDDEN", message: "This profile field is not self-service editable." });
  }
  const rpc = await getIdentityRpc(token);
  if (!rpc.available) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Profile self-service fields are awaiting the controlled identity-center migration." });
  const { response, body } = await requestJson<unknown>("update_current_profile_identity", token, { method: "POST", body: JSON.stringify({ p_payload: input }) });
  const payload = rpcPayload(body);
  if (!response.ok || !payload) throw new TRPCError({ code: response.status === 403 ? "FORBIDDEN" : "INTERNAL_SERVER_ERROR", message: "Your profile changes could not be confirmed by the workspace database." });
  return { ...(await getProfileIdentity(req)), saved: true, savedProfile: normalizedProfile(payload, await authUser(token), true), actorProfileId: verified.id };
}

function decodeAvatarBase64(mimeType: AvatarMimeType, base64: string) {
  if (!AVATAR_MIME_TYPES.includes(mimeType) || !/^[A-Za-z0-9+/]+={0,2}$/.test(base64)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Upload a PNG, JPEG, or WebP image." });
  }
  const bytes = Buffer.from(base64, "base64");
  if (!bytes.length || bytes.length > MAX_AVATAR_BYTES) throw new TRPCError({ code: "BAD_REQUEST", message: "Your profile photo must be a non-empty image under 2 MB." });
  const matches = mimeType === "image/png"
    ? bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
    : mimeType === "image/jpeg"
      ? bytes[0] === 0xff && bytes[1] === 0xd8
      : bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP";
  if (!matches) throw new TRPCError({ code: "BAD_REQUEST", message: "The selected file does not match its declared image type." });
  return bytes;
}

export function validateAvatarUpload(input: { mimeType: AvatarMimeType; base64: string }) {
  return decodeAvatarBase64(input.mimeType, input.base64);
}

async function setAvatarRpc(token: string, avatarUrl: string | null, avatarStorageKey: string | null) {
  const { response, body } = await requestJson<unknown>("set_current_profile_avatar", token, { method: "POST", body: JSON.stringify({ p_avatar_url: avatarUrl, p_avatar_storage_key: avatarStorageKey }) });
  const payload = rpcPayload(body);
  if (!response.ok || !payload) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "The profile photo could not be confirmed by the workspace database." });
  return payload;
}

export async function uploadProfileAvatar(req: CreateExpressContextOptions["req"], input: { mimeType: AvatarMimeType; base64: string }) {
  const { profile: verified, token } = await resolveVerifiedProfile(req);
  const rpc = await getIdentityRpc(token);
  if (!rpc.available) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Profile photo storage is awaiting the controlled identity-center migration." });
  const bytes = decodeAvatarBase64(input.mimeType, input.base64);
  const ext = input.mimeType === "image/jpeg" ? "jpg" : input.mimeType === "image/png" ? "png" : "webp";
  const uploaded = await storagePut(`profile-avatars/${verified.company_id}/${verified.id}/${crypto.randomUUID()}.${ext}`, bytes, input.mimeType);
  await setAvatarRpc(token, uploaded.url, uploaded.key);
  return { ...(await getProfileIdentity(req)), saved: true, avatar: { url: uploaded.url, key: uploaded.key } };
}

export async function removeProfileAvatar(req: CreateExpressContextOptions["req"]) {
  const { profile: verified, token } = await resolveVerifiedProfile(req);
  const rpc = await getIdentityRpc(token);
  if (!rpc.available) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Profile photo storage is awaiting the controlled identity-center migration." });
  await setAvatarRpc(token, null, null);
  return { ...(await getProfileIdentity(req)), saved: true, avatar: null };
}
