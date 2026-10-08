import { normalizePreferences, type DashboardPreferences } from "../contexts/DashboardPreferencesContext";

export const DASHBOARD_LAYOUT_TRANSFER_FORMAT = "smart-manager-dashboard-layout" as const;
export const DASHBOARD_LAYOUT_TRANSFER_VERSION = 1 as const;

const transferableKeys = [
  "compactDensity",
  "showKpiBanner",
  "showActivityTimeline",
  "showPendingApprovals",
  "accentColor",
  "currency",
  "timezone",
  "fxRateOverride",
  "departmentBudgets",
  "showRevenueOverview",
  "showSalesMix",
  "showQuickActions",
  "showTopProducts",
  "showCashFlow",
  "showBusinessHealth",
  "showActionCenter",
  "widgetOrder",
  "kpiCardIds",
  "performanceWindow",
  "sidebarPresentation",
  "navigationSort",
  "visibleNavigationGroupIds",
  "showTopBarSearch",
  "showGuidedTour",
  "showConnectionStatus",
  "showTopBarDate",
] as const satisfies ReadonlyArray<keyof DashboardPreferences>;

type TransferablePreferences = Pick<DashboardPreferences, (typeof transferableKeys)[number]>;

export interface DashboardLayoutTransfer {
  format: typeof DASHBOARD_LAYOUT_TRANSFER_FORMAT;
  version: typeof DASHBOARD_LAYOUT_TRANSFER_VERSION;
  exportedAt: string;
  preferences: TransferablePreferences;
}

function pickTransferablePreferences(preferences: DashboardPreferences): TransferablePreferences {
  return transferableKeys.reduce((result, key) => {
    result[key] = preferences[key] as never;
    return result;
  }, {} as TransferablePreferences);
}

export function createDashboardLayoutTransfer(preferences: DashboardPreferences): DashboardLayoutTransfer {
  return {
    format: DASHBOARD_LAYOUT_TRANSFER_FORMAT,
    version: DASHBOARD_LAYOUT_TRANSFER_VERSION,
    exportedAt: new Date().toISOString(),
    preferences: pickTransferablePreferences(preferences),
  };
}

export function serializeDashboardLayout(preferences: DashboardPreferences): string {
  return JSON.stringify(createDashboardLayoutTransfer(preferences), null, 2);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function parseDashboardLayout(raw: string): Partial<DashboardPreferences> {
  if (typeof raw !== "string" || raw.length === 0 || raw.length > 256_000) {
    throw new Error("This dashboard layout file is empty or too large.");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("This dashboard layout file is not valid JSON.");
  }

  if (!isRecord(parsed) || parsed.format !== DASHBOARD_LAYOUT_TRANSFER_FORMAT || parsed.version !== DASHBOARD_LAYOUT_TRANSFER_VERSION || !isRecord(parsed.preferences)) {
    throw new Error("This file is not a supported Smart Manager dashboard layout.");
  }

  const preferences = parsed.preferences;
  const safePreferences: Partial<DashboardPreferences> = {};
  for (const key of transferableKeys) {
    if (key in preferences) {
      (safePreferences as Record<string, unknown>)[key] = preferences[key];
    }
  }
  return safePreferences;
}

export function importDashboardLayout(raw: string, current: DashboardPreferences, authorizedNavigationGroupIds?: readonly string[]): DashboardPreferences {
  const imported = parseDashboardLayout(raw);
  const allowedGroups = authorizedNavigationGroupIds ? new Set(["home", ...authorizedNavigationGroupIds]) : null;
  const importedGroups = Array.isArray(imported.visibleNavigationGroupIds)
    ? imported.visibleNavigationGroupIds.filter((groupId) => !allowedGroups || allowedGroups.has(groupId))
    : current.visibleNavigationGroupIds;

  return normalizePreferences({
    ...current,
    ...imported,
    visibleNavigationGroupIds: ["home", ...importedGroups.filter((groupId) => groupId !== "home")],
  });
}
