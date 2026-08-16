export const ORGANIZATION_INDUSTRY_OPTIONS = [
  { id: "general", label: "Universal business" },
  { id: "retail", label: "Retail & wholesale" },
  { id: "manufacturing", label: "Manufacturing" },
  { id: "services", label: "Professional services" },
  { id: "healthcare", label: "Healthcare" },
  { id: "education", label: "Education" },
  { id: "hospitality", label: "Hospitality" },
];

export const ORGANIZATION_INDUSTRY_IDS = new Set(ORGANIZATION_INDUSTRY_OPTIONS.map((option) => option.id));
const STORAGE_KEY = "smart_manager_last_confirmed_industry_focus";

export function normalizeOrganizationIndustryFocus(value) {
  return ORGANIZATION_INDUSTRY_IDS.has(String(value || "").trim()) ? String(value).trim() : "general";
}

// This is a presentation cache only. The canonical preference remains
// public.companies.category and is updated through an owner-authorized tRPC
// mutation. It allows the unauthenticated login scene to restore the most
// recently confirmed organization context without taking authorization input
// from browser storage.
export function rememberConfirmedOrganizationIndustryFocus(value) {
  const focus = normalizeOrganizationIndustryFocus(value);
  if (typeof window !== "undefined") window.localStorage.setItem(STORAGE_KEY, focus);
  return focus;
}

export function readRememberedOrganizationIndustryFocus() {
  if (typeof window === "undefined") return "general";
  return normalizeOrganizationIndustryFocus(window.localStorage.getItem(STORAGE_KEY));
}
