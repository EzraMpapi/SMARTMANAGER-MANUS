import React, { createContext, useContext, useState, useEffect } from "react";

interface DashboardPreferences {
  compactDensity: boolean;
  showKpiBanner: boolean;
  showActivityTimeline: boolean;
  showPendingApprovals: boolean;
  accentColor: "gold" | "emerald";
  currency: "TZS" | "USD";
}

interface DashboardPreferencesContextType {
  preferences: DashboardPreferences;
  updatePreference: <K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => void;
  resetPreferences: () => void;
  formatMoney: (amountInTzs: number, overrideCurrency?: "TZS" | "USD") => string;
}

const defaultPreferences: DashboardPreferences = {
  compactDensity: false,
  showKpiBanner: true,
  showActivityTimeline: true,
  showPendingApprovals: true,
  accentColor: "gold",
  currency: "TZS",
};

const TZS_TO_USD_RATE = 2600;

const DashboardPreferencesContext = createContext<DashboardPreferencesContextType | undefined>(undefined);

export function DashboardPreferencesProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() => {
    if (typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem("smart_manager_dashboard_prefs");
        if (stored) return { ...defaultPreferences, ...JSON.parse(stored) };
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
    if (cur === "USD") {
      const usdVal = val / TZS_TO_USD_RATE;
      return `US$ ${Math.round(usdVal).toLocaleString()}`;
    }
    return `TZS ${Math.round(val).toLocaleString()}`;
  };

  return (
    <DashboardPreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences, formatMoney }}>
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
