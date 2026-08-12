import React, { createContext, useContext, useState, useEffect } from "react";

interface DashboardPreferences {
  compactDensity: boolean;
  showKpiBanner: boolean;
  showActivityTimeline: boolean;
  showPendingApprovals: boolean;
  accentColor: "gold" | "emerald";
}

interface DashboardPreferencesContextType {
  preferences: DashboardPreferences;
  updatePreference: <K extends keyof DashboardPreferences>(key: K, value: DashboardPreferences[K]) => void;
  resetPreferences: () => void;
}

const defaultPreferences: DashboardPreferences = {
  compactDensity: false,
  showKpiBanner: true,
  showActivityTimeline: true,
  showPendingApprovals: true,
  accentColor: "gold",
};

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

  return (
    <DashboardPreferencesContext.Provider value={{ preferences, updatePreference, resetPreferences }}>
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
