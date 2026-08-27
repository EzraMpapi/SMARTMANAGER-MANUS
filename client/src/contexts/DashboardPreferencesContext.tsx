import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { trpc } from "../lib/trpc";
import { useAuthContext } from "./AuthContext";

export interface DashboardPreferences {
  compactDensity: boolean;
  showKpiBanner: boolean;
  showActivityTimeline: boolean;
  showPendingApprovals: boolean;
  accentColor: "gold" | "emerald";
  currency: "TZS" | "USD";
  timezone: string;
  fxRateOverride: number;
  departmentBudgets: Record<string, number>;
  showRevenueOverview: boolean;
  showSalesMix: boolean;
  showQuickActions: boolean;
  showTopProducts: boolean;
  showCashFlow: boolean;
  showBusinessHealth: boolean;
  showActionCenter: boolean;
  widgetOrder: Array<"revenue" | "salesMix" | "quickActions" | "products" | "cashFlow" | "businessHealth" | "activity" | "actionCenter">;
  kpiCardIds: Array<"revenue" | "expenses" | "net-result" | "orders" | "receivables">;
  performanceWindow: "30d" | "3m" | "6m" | "1y";
  sidebarPresentation: "expanded" | "compact";
  navigationSort: "priority" | "alphabetical";
  visibleNavigationGroupIds: Array<"home" | "sales-crm" | "operations" | "finance" | "people" | "specialized" | "analytics" | "administration">;
  showTopBarSearch: boolean;
  showGuidedTour: boolean;
  showConnectionStatus: boolean;
  showTopBarDate: boolean;
}

interface DashboardPreferencesContextType {
  preferences: DashboardPreferences;
  updatePreference: <K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => void;
  resetPreferences: () => void;
  formatMoney: (amountInTzs: number, overrideCurrency?: "TZS" | "USD") => string;
  formatLocalDate: (dateStringOrTimestamp: string | number | Date) => string;
  isPersisting: boolean;
  persistenceError: string | null;
}

const defaultDepartmentBudgets: Record<string, number> = {
  Operations: 25000,
  Sales: 15000,
  Finance: 10000,
  Warehouse: 20000,
  Admin: 30000,
};

const dashboardNavigationGroupIds = ["home", "sales-crm", "operations", "finance", "people", "specialized", "analytics", "administration"] as const;

const defaultPreferences: DashboardPreferences = {
  compactDensity: false,
  showKpiBanner: true,
  showActivityTimeline: true,
  showPendingApprovals: true,
  accentColor: "gold",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  fxRateOverride: 2600,
  departmentBudgets: defaultDepartmentBudgets,
  showRevenueOverview: true,
  showSalesMix: true,
  showQuickActions: true,
  showTopProducts: true,
  showCashFlow: true,
  showBusinessHealth: true,
  showActionCenter: true,
  widgetOrder: ["revenue", "salesMix", "quickActions", "products", "cashFlow", "businessHealth", "activity", "actionCenter"],
  kpiCardIds: ["revenue", "expenses", "net-result", "orders", "receivables"],
  performanceWindow: "30d",
  sidebarPresentation: "expanded",
  navigationSort: "priority",
  visibleNavigationGroupIds: [...dashboardNavigationGroupIds],
  showTopBarSearch: true,
  showGuidedTour: true,
  showConnectionStatus: true,
  showTopBarDate: true,
};

function normalizePreferences(value: Partial<DashboardPreferences> | null | undefined): DashboardPreferences {
  const requestedNavigationGroups = Array.isArray(value?.visibleNavigationGroupIds)
    ? new Set(value.visibleNavigationGroupIds.filter((id) => dashboardNavigationGroupIds.includes(id)))
    : new Set(defaultPreferences.visibleNavigationGroupIds);
  requestedNavigationGroups.add("home");
  return {
    ...defaultPreferences,
    ...(value || {}),
    accentColor: value?.accentColor === "emerald" ? "emerald" : "gold",
    currency: value?.currency === "USD" ? "USD" : "TZS",
    timezone: typeof value?.timezone === "string" && value.timezone.trim() ? value.timezone.trim() : defaultPreferences.timezone,
    fxRateOverride: Number.isFinite(Number(value?.fxRateOverride)) && Number(value?.fxRateOverride) > 0 ? Number(value?.fxRateOverride) : defaultPreferences.fxRateOverride,
    departmentBudgets: { ...defaultDepartmentBudgets, ...(value?.departmentBudgets || {}) },
    widgetOrder: Array.isArray(value?.widgetOrder) && value.widgetOrder.length ? Array.from(new Set(value.widgetOrder.filter((id) => defaultPreferences.widgetOrder.includes(id)))) as DashboardPreferences["widgetOrder"] : defaultPreferences.widgetOrder,
    kpiCardIds: Array.isArray(value?.kpiCardIds) && value.kpiCardIds.length ? Array.from(new Set(value.kpiCardIds.filter((id) => defaultPreferences.kpiCardIds.includes(id)))) as DashboardPreferences["kpiCardIds"] : defaultPreferences.kpiCardIds,
    performanceWindow: ["30d", "3m", "6m", "1y"].includes(value?.performanceWindow || "") ? value?.performanceWindow as DashboardPreferences["performanceWindow"] : defaultPreferences.performanceWindow,
    sidebarPresentation: value?.sidebarPresentation === "compact" ? "compact" : "expanded",
    navigationSort: value?.navigationSort === "alphabetical" ? "alphabetical" : "priority",
    visibleNavigationGroupIds: dashboardNavigationGroupIds.filter((id) => requestedNavigationGroups.has(id)) as DashboardPreferences["visibleNavigationGroupIds"],
    showTopBarSearch: value?.showTopBarSearch !== false,
    showGuidedTour: value?.showGuidedTour !== false,
    showConnectionStatus: value?.showConnectionStatus !== false,
    showTopBarDate: value?.showTopBarDate !== false,
  };
}

const DashboardPreferencesContext = createContext<DashboardPreferencesContextType | undefined>(undefined);

export function DashboardPreferencesProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthContext();
  const liveSession = Boolean(auth.configured && auth.session?.access_token && ["AUTHENTICATED", "PROFILE_LOADING", "WORKSPACE_LOADING", "AUTHORIZED"].includes(auth.status));
  const persistedQuery = trpc.dashboardPreferences.get.useQuery(undefined, { enabled: liveSession, retry: false, staleTime: 5 * 60 * 1000 });
  const saveMutation = trpc.dashboardPreferences.save.useMutation();
  const hydratedRef = useRef(false);
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
    if (!liveSession && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("smart_manager_dashboard_prefs");
        if (stored) return normalizePreferences(JSON.parse(stored));
      } catch (_e) {
        // Isolated preview fallback remains intentionally best-effort.
      }
    }
    return defaultPreferences;
  });
  const [persistenceError, setPersistenceError] = useState<string | null>(null);

  useEffect(() => {
    if (!liveSession || !persistedQuery.data || hydratedRef.current) return;
    hydratedRef.current = true;
    setPreferences(normalizePreferences(persistedQuery.data.preferences));
  }, [liveSession, persistedQuery.data]);

  useEffect(() => {
    if (!liveSession && typeof window !== "undefined") {
      try {
        localStorage.setItem("smart_manager_dashboard_prefs", JSON.stringify(preferences));
      } catch (_e) {
        // Isolated preview fallback remains intentionally best-effort.
      }
    }
  }, [liveSession, preferences]);

  const persist = (next: DashboardPreferences, previous: DashboardPreferences) => {
    if (!liveSession) return;
    setPersistenceError(null);
    saveMutation.mutate(next, {
      onError: (error) => {
        setPreferences(previous);
        setPersistenceError(error.message || "Dashboard preferences could not be saved.");
      },
      onSuccess: () => setPersistenceError(null),
    });
  };

  const updatePreference = <K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => {
    setPreferences((previous) => {
      const next = normalizePreferences({ ...previous, [key]: value });
      persist(next, previous);
      return next;
    });
  };

  const resetPreferences = () => {
    setPreferences((previous) => {
      const next = normalizePreferences(defaultPreferences);
      persist(next, previous);
      return next;
    });
  };

  const formatMoney = (amountInTzs: number, overrideCurrency?: "TZS" | "USD") => {
    const cur = overrideCurrency || preferences.currency || "TZS";
    const val = Number(amountInTzs) || 0;
    const rate = Number(preferences.fxRateOverride) > 0 ? Number(preferences.fxRateOverride) : 2600;
    if (cur === "USD") {
      const usdVal = val / rate;
      return `US$ ${Math.round(usdVal).toLocaleString()}`;
    }
    return `TZS ${Math.round(val).toLocaleString()}`;
  };

  const formatLocalDate = (dateStringOrTimestamp: string | number | Date) => {
    try {
      const d = new Date(dateStringOrTimestamp);
      if (isNaN(d.getTime())) return String(dateStringOrTimestamp);
      return d.toLocaleString("en-GB", {
        timeZone: preferences.timezone || "Africa/Dar_es_Salaam",
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (_e) {
      return String(dateStringOrTimestamp);
    }
  };

  return (
    <DashboardPreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences, formatMoney, formatLocalDate, isPersisting: saveMutation.isPending, persistenceError }}>
      {children}
    </DashboardPreferencesContext.Provider>
  );
}

export function useDashboardPreferences() {
  const context = useContext(DashboardPreferencesContext);
  if (!context) {
    throw new Error("useDashboardPreferences must be used within DashboardPreferencesProvider");
  }
  return context;
}
