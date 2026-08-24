import { useCallback, useEffect, useMemo, useState } from "react";

export const SUBSCRIPTION_ACCESS_STATES = Object.freeze(["trial", "active", "grace", "pending", "expired", "required", "unknown"]);
const ACCESSIBLE_STATES = new Set(["trial", "active", "grace"]);
const MODULE_ALIASES = Object.freeze({ hotel: "hospitality", restaurant: "hospitality" });

function normalizeState(value) {
  const state = String(value || "").trim().toLowerCase();
  return SUBSCRIPTION_ACCESS_STATES.includes(state) ? state : "unknown";
}

function normalizeEntitlements(value) {
  if (Array.isArray(value)) return value.map((item) => String(item || "").trim().toLowerCase()).filter(Boolean);
  if (!value || typeof value !== "object") return [];
  return Object.entries(value).filter(([, enabled]) => enabled === true).map(([key]) => key.trim().toLowerCase()).filter(Boolean);
}

export function normalizeSubscriptionAccess(payload) {
  const source = payload?.access && typeof payload.access === "object" ? payload.access : (payload || {});
  const subscription = source.subscription && typeof source.subscription === "object" ? source.subscription : null;
  const plan = source.plan && typeof source.plan === "object" ? source.plan : null;
  const moduleEntitlements = normalizeEntitlements(source.moduleEntitlements ?? plan?.moduleEntitlements ?? plan?.module_entitlements);
  const state = normalizeState(source.state || source.status);
  return {
    companyId: typeof source.companyId === "string" ? source.companyId : "",
    viewer: source.viewer && typeof source.viewer === "object" ? source.viewer : {},
    status: typeof source.status === "string" ? source.status : state,
    state,
    allowed: source.allowed === true && ACCESSIBLE_STATES.has(state),
    reason: typeof source.reason === "string" ? source.reason : "Subscription access could not be confirmed.",
    accessUntil: source.accessUntil || null,
    subscription,
    plan,
    moduleEntitlements,
    trialActive: source.trialActive === true,
    unlimitedAccess: source.unlimitedAccess === true,
    trialStartedAt: source.trialStartedAt || subscription?.trial_started_at || null,
    trialEndsAt: source.trialEndsAt || subscription?.trial_ends_at || source.accessUntil || null,
  };
}

export function subscriptionAllowsModule(access, moduleId) {
  if (!access?.allowed) return false;
  if (moduleId === "dashboard") return true;
  if (access.unlimitedAccess === true && access.trialActive === true) return true;
  const requested = String(moduleId || "").trim().toLowerCase();
  const entitlement = MODULE_ALIASES[requested] || requested;
  return access.moduleEntitlements.includes(entitlement);
}

export function subscriptionStateLabel(access) {
  const state = normalizeState(access?.state);
  return {
    active: "Active",
    grace: "Grace period",
    pending: "Payment pending",
    expired: "Expired",
    required: "Subscription required",
    unknown: "Checking subscription",
  }[state];
}

export function useSubscriptionAccess({ accessToken, enabled = true } = {}) {
  const [request, setRequest] = useState({ status: "idle", payload: null, error: "" });

  const refresh = useCallback(async () => {
    if (!enabled || !accessToken) {
      setRequest({ status: "idle", payload: null, error: "" });
      return null;
    }
    setRequest((current) => ({ ...current, status: "loading", error: "" }));
    try {
      const response = await fetch("/api/billing/access", {
        headers: { accept: "application/json", "x-supabase-authorization": `Bearer ${accessToken}` },
        cache: "no-store",
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body?.error === "string" ? body.error : "Subscription access could not be confirmed.");
      setRequest({ status: "ready", payload: body, error: "" });
      return body;
    } catch (error) {
      setRequest({ status: "error", payload: null, error: error?.message || "Subscription access could not be confirmed." });
      return null;
    }
  }, [accessToken, enabled]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    if (!enabled || !accessToken || typeof window === "undefined") return undefined;
    const refreshAfterActivation = () => { void refresh(); };
    window.addEventListener("smart-manager:subscription-updated", refreshAfterActivation);
    return () => window.removeEventListener("smart-manager:subscription-updated", refreshAfterActivation);
  }, [accessToken, enabled, refresh]);

  const access = useMemo(() => normalizeSubscriptionAccess(request.payload), [request.payload]);
  return {
    ...request,
    access,
    loading: request.status === "loading",
    ready: request.status === "ready",
    refresh,
    allowsModule: (moduleId) => subscriptionAllowsModule(access, moduleId),
  };
}
