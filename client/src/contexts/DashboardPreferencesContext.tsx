import React, { createContext, useContext, useState, useEffect } from "react";

interface DashboardPreferences {
  compactDensity: boolean;
  showKpiBanner: boolean;
  showActivityTimeline: boolean;
  showPendingApprovals: boolean;
  accentColor: "gold" | "emerald";
  currency: "TZS" | "USD";
  timezone: string;
  fxRateOverride: number;
  departmentBudgets: Record<string, number>;
}

interface DashboardPreferencesContextType {
  preferences: DashboardPreferences;
  updatePreference: <K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => void;
  resetPreferences: () => void;
  formatMoney: (amountInTzs: number, overrideCurrency?: "TZS" | "USD") => string;
  formatLocalDate: (dateStringOrTimestamp: string | number | Date) => string;
}

const defaultDepartmentBudgets: Record<string, number> = {
  Operations: 25000,
  Sales: 15000,
  Finance: 10000,
  Warehouse: 20000,
  Admin: 30000,
};

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
};

const DashboardPreferencesContext = createContext<DashboardPreferencesContextType | undefined>(undefined);

export function DashboardPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("smart_manager_dashboard_prefs");
        if (stored) {
          const parsed = JSON.parse(stored);
          return {
            ...defaultPreferences,
            ...parsed,
            departmentBudgets: { ...defaultDepartmentBudgets, ...(parsed.departmentBudgets || {}) },
          };
        }
      } catch (_e) {
        // fallback
      }
    }
    return defaultPreferences;
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_manager_dashboard_prefs", JSON.stringify(preferences));
    }
  }, [preferences]);

  const updatePreference = <K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => {
    setPreferences(prev => ({ ...prev, [key]: value }));
  };

  const resetPreferences = () => setPreferences(defaultPreferences);

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
    <DashboardPreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences, formatMoney, formatLocalDate }}>
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
