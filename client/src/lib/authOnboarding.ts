export type PasswordChecks = {
  length: boolean;
  upper: boolean;
  lower: boolean;
  number: boolean;
  special: boolean;
};

export const PASSWORD_REQUIREMENT_LABELS: Array<[keyof PasswordChecks, string]> = [
  ["length", "At least 8 characters"],
  ["upper", "One uppercase letter"],
  ["lower", "One lowercase letter"],
  ["number", "One number"],
  ["special", "One special character"],
];

export function getPasswordChecks(value: string): PasswordChecks {
  return {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
    special: /[^A-Za-z0-9]/.test(value),
  };
}

export function passwordStrength(value: string): number {
  return Object.values(getPasswordChecks(value)).filter(Boolean).length;
}

export function isEnterprisePassword(value: string): boolean {
  return passwordStrength(value) === PASSWORD_REQUIREMENT_LABELS.length;
}

export function companyDefaultsForCountry(country: string): { currency: string; timezone: string } {
  if (country === "Tanzania") return { currency: "TZS", timezone: "Africa/Dar_es_Salaam" };
  if (country === "Kenya") return { currency: "KES", timezone: "Africa/Nairobi" };
  if (country === "Uganda") return { currency: "UGX", timezone: "Africa/Kampala" };
  if (country === "Rwanda") return { currency: "RWF", timezone: "Africa/Kigali" };
  if (country === "Zambia") return { currency: "ZMW", timezone: "Africa/Lusaka" };
  if (country === "Malawi") return { currency: "MWK", timezone: "Africa/Blantyre" };
  return { currency: "USD", timezone: "UTC" };
}

export type AuthScreen = "login" | "signup" | "forgot" | "reset" | "verify";

export function authScreenFromSearch(search: string): AuthScreen {
  const flow = new URLSearchParams(search).get("auth");
  return flow === "signup" || flow === "forgot" || flow === "reset" || flow === "verify" ? flow : "login";
}

export type OAuthCallbackPayload = {
  accessToken: string | null;
  refreshToken: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

/** Parses an implicit-flow callback without storing or logging its credentials. */
export function oauthCallbackFromHash(hash: string): OAuthCallbackPayload {
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return {
    accessToken: params.get("access_token"),
    refreshToken: params.get("refresh_token"),
    errorCode: params.get("error"),
    errorDescription: params.get("error_description"),
  };
}

export type OAuthCodeCallbackPayload = {
  code: string | null;
  state: string | null;
  errorCode: string | null;
  errorDescription: string | null;
};

/** Parses a PKCE authorization-code callback without storing or logging the code. */
export function oauthCodeCallbackFromSearch(search: string): OAuthCodeCallbackPayload {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  return {
    code: params.get("code"),
    state: params.get("state"),
    errorCode: params.get("error"),
    errorDescription: params.get("error_description"),
  };
}
