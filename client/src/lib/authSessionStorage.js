const ACCESS_TOKEN_STORAGE_KEY = "bs_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "bs_refresh_token";
const SESSION_ACCESS_TOKEN_STORAGE_KEY = "bs_session_access_token";
const SESSION_REFRESH_TOKEN_STORAGE_KEY = "bs_session_refresh_token";

/** Stores only a confirmed Supabase session; callers must complete an approved auth ceremony first. */
export function persistAuthSession(result, remember = true) {
  if (!result?.access_token) return;
  const activeStorage = remember ? window.localStorage : window.sessionStorage;
  const inactiveStorage = remember ? window.sessionStorage : window.localStorage;
  const activeAccessKey = remember ? ACCESS_TOKEN_STORAGE_KEY : SESSION_ACCESS_TOKEN_STORAGE_KEY;
  const activeRefreshKey = remember ? REFRESH_TOKEN_STORAGE_KEY : SESSION_REFRESH_TOKEN_STORAGE_KEY;
  const inactiveAccessKey = remember ? SESSION_ACCESS_TOKEN_STORAGE_KEY : ACCESS_TOKEN_STORAGE_KEY;
  const inactiveRefreshKey = remember ? SESSION_REFRESH_TOKEN_STORAGE_KEY : REFRESH_TOKEN_STORAGE_KEY;
  inactiveStorage.removeItem(inactiveAccessKey);
  inactiveStorage.removeItem(inactiveRefreshKey);
  activeStorage.setItem(activeAccessKey, result.access_token);
  if (result.refresh_token) activeStorage.setItem(activeRefreshKey, result.refresh_token);
}

export function readStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || window.sessionStorage.getItem(SESSION_ACCESS_TOKEN_STORAGE_KEY);
}

export function readStoredAuthSession() {
  if (typeof window === "undefined") return null;
  const accessToken = readStoredAccessToken();
  const refreshToken = window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || window.sessionStorage.getItem(SESSION_REFRESH_TOKEN_STORAGE_KEY);
  return accessToken && refreshToken ? { access_token: accessToken, refresh_token: refreshToken } : null;
}

export function clearStoredAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_ACCESS_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_REFRESH_TOKEN_STORAGE_KEY);
}
