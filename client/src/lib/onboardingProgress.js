import { isEnterprisePassword } from "./authOnboarding";

export const ONBOARDING_PROGRESS_STORAGE_KEY = "bs_onboarding_progress_v1";

const ACCOUNT_FIELDS = ["fullName", "email", "phone"];
const COMPANY_FIELDS = ["name", "category", "country", "currency", "timezone", "website", "taxId", "brandColor", "brandAccentColor"];
const DEFAULT_COMPANY_PREFERENCES = {
  category: "general",
  country: "Tanzania",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  brandColor: "#0B5D3B",
  brandAccentColor: "#16A34A",
};

function asTrimmedString(value, maxLength = 500) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

function pickStringFields(source, fields) {
  return fields.reduce((result, key) => ({ ...result, [key]: asTrimmedString(source?.[key]) }), {});
}

export function sanitizeOnboardingProgress(progress, validModuleIds = []) {
  const allowedModules = new Set(validModuleIds);
  return {
    version: 1,
    mode: progress?.mode === "join" ? "join" : "create",
    // The UI always resumes at step 1 because passwords are never persisted.
    step: 1,
    account: pickStringFields(progress?.account, ACCOUNT_FIELDS),
    company: pickStringFields(progress?.company, COMPANY_FIELDS),
    selectedModules: Array.isArray(progress?.selectedModules)
      ? progress.selectedModules.filter((moduleId) => typeof moduleId === "string" && allowedModules.has(moduleId))
      : [],
    businessScale: progress?.businessScale === "small" ? "small" : "large",
    firstBranch: asTrimmedString(progress?.firstBranch),
    joinRole: asTrimmedString(progress?.joinRole, 100) || "Employee",
    customerRef: asTrimmedString(progress?.customerRef),
  };
}

export function hasOnboardingProgress(progress, validModuleIds = []) {
  const safe = sanitizeOnboardingProgress(progress, validModuleIds);
  const selectedModulesDifferFromDefault = validModuleIds.length > 0
    ? safe.selectedModules.length !== validModuleIds.length || validModuleIds.some((moduleId) => !safe.selectedModules.includes(moduleId))
    : safe.selectedModules.length > 0;
  const hasChangedCompanyPreference = Object.entries(DEFAULT_COMPANY_PREFERENCES)
    .some(([field, defaultValue]) => Boolean(safe.company[field]) && safe.company[field] !== defaultValue);
  return Boolean(
    Object.values(safe.account).some(Boolean)
      || safe.company.name
      || safe.company.website
      || safe.company.taxId
      || hasChangedCompanyPreference
      || selectedModulesDifferFromDefault
      || safe.mode === "join"
      || safe.businessScale === "small"
      || safe.firstBranch
      || safe.joinRole !== "Employee"
      || safe.customerRef,
  );
}

export function readOnboardingProgress(validModuleIds = []) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(ONBOARDING_PROGRESS_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return parsed?.version === 1 ? sanitizeOnboardingProgress(parsed, validModuleIds) : null;
  } catch {
    return null;
  }
}

export function writeOnboardingProgress(progress, validModuleIds = []) {
  if (typeof window === "undefined") return;
  try {
    const safe = sanitizeOnboardingProgress(progress, validModuleIds);
    if (!hasOnboardingProgress(safe, validModuleIds)) {
      window.sessionStorage.removeItem(ONBOARDING_PROGRESS_STORAGE_KEY);
      return;
    }
    window.sessionStorage.setItem(ONBOARDING_PROGRESS_STORAGE_KEY, JSON.stringify(safe));
  } catch {
    // Storage can be blocked by browser policy; onboarding continues without recovery.
  }
}

export function clearOnboardingProgress() {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(ONBOARDING_PROGRESS_STORAGE_KEY);
  } catch {
    // No action is required when browser storage is unavailable.
  }
}

export function getSignupProgressionStep({ account, company, step }) {
  if (step === 1) {
    const accountComplete = Boolean(
      account?.fullName?.trim()
        && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account?.email?.trim() || "")
        && isEnterprisePassword(account?.password || "")
        && account.password === account.confirmPassword,
    );
    return accountComplete ? 2 : 1;
  }
  if (step === 2) return company?.name?.trim()?.length > 1 ? 3 : 2;
  return 3;
}
