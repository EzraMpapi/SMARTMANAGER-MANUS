# Dashboard Customization TypeScript Reference

## Purpose

This reference shows a typed React state pattern for **personal dashboard customization**. It covers safe defaults, normalization of stored data, optimistic persistence, rollback on failed saves, and a presentation filter that cannot grant additional menu access.

> The hook owns only presentation state. A server must derive the authenticated user and company scope; the UI must derive authorized navigation before applying the user’s saved display preferences.

The examples are designed for React and TypeScript. They can be adapted to a tRPC client, React Query mutation, or another authenticated API client.

## 1. Domain Types and Default Values

Create a dedicated module such as `client/src/dashboard/dashboardCustomizationState.ts`.

```ts
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export const DASHBOARD_WIDGET_IDS = [
  "revenue",
  "salesMix",
  "quickActions",
  "products",
  "cashFlow",
  "businessHealth",
  "activity",
  "actionCenter",
] as const;

export const DASHBOARD_KPI_IDS = [
  "revenue",
  "expenses",
  "net-result",
  "orders",
  "receivables",
] as const;

export const DASHBOARD_NAVIGATION_GROUP_IDS = [
  "home",
  "sales-crm",
  "operations",
  "finance",
  "people",
  "specialized",
  "analytics",
  "administration",
] as const;

export type DashboardWidgetId = (typeof DASHBOARD_WIDGET_IDS)[number];
export type DashboardKpiId = (typeof DASHBOARD_KPI_IDS)[number];
export type DashboardNavigationGroupId =
  (typeof DASHBOARD_NAVIGATION_GROUP_IDS)[number];
export type PerformanceWindow = "30d" | "3m" | "6m" | "1y";
export type SidebarPresentation = "expanded" | "compact";
export type NavigationSort = "priority" | "alphabetical";
export type AccentColor = "gold" | "emerald";
export type Currency = "TZS" | "USD";

export interface DashboardPreferences {
  /** Increment only for incompatible stored-payload changes. */
  schemaVersion: 1;
  compactDensity: boolean;
  showKpiBanner: boolean;
  showActivityTimeline: boolean;
  showPendingApprovals: boolean;
  accentColor: AccentColor;
  currency: Currency;
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
  widgetOrder: DashboardWidgetId[];
  kpiCardIds: DashboardKpiId[];
  performanceWindow: PerformanceWindow;

  sidebarPresentation: SidebarPresentation;
  navigationSort: NavigationSort;
  visibleNavigationGroupIds: DashboardNavigationGroupId[];
  showTopBarSearch: boolean;
  showGuidedTour: boolean;
  showConnectionStatus: boolean;
  showTopBarDate: boolean;
}

export const DEFAULT_DASHBOARD_PREFERENCES: DashboardPreferences = {
  schemaVersion: 1,
  compactDensity: false,
  showKpiBanner: true,
  showActivityTimeline: true,
  showPendingApprovals: true,
  accentColor: "gold",
  currency: "TZS",
  timezone: "Africa/Dar_es_Salaam",
  fxRateOverride: 2600,
  departmentBudgets: {
    Operations: 25_000,
    Sales: 15_000,
    Finance: 10_000,
    Warehouse: 20_000,
    Admin: 30_000,
  },
  showRevenueOverview: true,
  showSalesMix: true,
  showQuickActions: true,
  showTopProducts: true,
  showCashFlow: true,
  showBusinessHealth: true,
  showActionCenter: true,
  widgetOrder: [...DASHBOARD_WIDGET_IDS],
  kpiCardIds: [...DASHBOARD_KPI_IDS],
  performanceWindow: "30d",
  sidebarPresentation: "expanded",
  navigationSort: "priority",
  visibleNavigationGroupIds: [...DASHBOARD_NAVIGATION_GROUP_IDS],
  showTopBarSearch: true,
  showGuidedTour: true,
  showConnectionStatus: true,
  showTopBarDate: true,
};
```

## 2. Normalization Helpers

Stored data may be incomplete after an application update, may have originated from a previous schema version, or may have been corrupted. Normalize it before storing it in React state. Normalization is not a replacement for server validation; it makes reads resilient and keeps the UI in a safe state.

```ts
const isIn = <T extends readonly string[]>(
  values: T,
  value: unknown,
): value is T[number] => typeof value === "string" && values.includes(value as T[number]);

function uniqueKnown<T extends readonly string[]>(
  candidate: unknown,
  allowed: T,
): T[number][] {
  if (!Array.isArray(candidate)) return [];
  return Array.from(
    new Set(candidate.filter((value): value is T[number] => isIn(allowed, value))),
  );
}

function completeWidgetOrder(candidate: unknown): DashboardWidgetId[] {
  const supplied = uniqueKnown(candidate, DASHBOARD_WIDGET_IDS);
  return Array.from(new Set([...supplied, ...DASHBOARD_WIDGET_IDS]));
}

function normalizeBudgets(candidate: unknown): Record<string, number> {
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return { ...DEFAULT_DASHBOARD_PREFERENCES.departmentBudgets };
  }

  const values = Object.entries(candidate as Record<string, unknown>)
    .slice(0, 50)
    .flatMap(([rawName, rawBudget]) => {
      const name = rawName.trim().slice(0, 80);
      const budget = Number(rawBudget);
      if (!name || !Number.isFinite(budget)) return [];
      return [[name, Math.min(1_000_000_000_000, Math.max(0, budget))] as const];
    });

  return {
    ...DEFAULT_DASHBOARD_PREFERENCES.departmentBudgets,
    ...Object.fromEntries(values),
  };
}

/** Safely converts unknown persisted data into a usable preference document. */
export function normalizeDashboardPreferences(
  candidate: Partial<DashboardPreferences> | null | undefined,
): DashboardPreferences {
  const value = candidate ?? {};
  const requestedGroups = uniqueKnown(
    value.visibleNavigationGroupIds,
    DASHBOARD_NAVIGATION_GROUP_IDS,
  );
  const groupSet = new Set(
    requestedGroups.length
      ? requestedGroups
      : DEFAULT_DASHBOARD_PREFERENCES.visibleNavigationGroupIds,
  );
  groupSet.add("home");

  const submittedKpis = uniqueKnown(value.kpiCardIds, DASHBOARD_KPI_IDS);
  const kpiCardIds = submittedKpis.length
    ? submittedKpis
    : [...DEFAULT_DASHBOARD_PREFERENCES.kpiCardIds];

  const fxRate = Number(value.fxRateOverride);

  return {
    ...DEFAULT_DASHBOARD_PREFERENCES,
    ...value,
    schemaVersion: 1,
    accentColor: value.accentColor === "emerald" ? "emerald" : "gold",
    currency: value.currency === "USD" ? "USD" : "TZS",
    timezone:
      typeof value.timezone === "string" && value.timezone.trim()
        ? value.timezone.trim().slice(0, 100)
        : DEFAULT_DASHBOARD_PREFERENCES.timezone,
    fxRateOverride:
      Number.isFinite(fxRate) && fxRate >= 1
        ? Math.min(fxRate, 1_000_000)
        : DEFAULT_DASHBOARD_PREFERENCES.fxRateOverride,
    departmentBudgets: normalizeBudgets(value.departmentBudgets),
    widgetOrder: completeWidgetOrder(value.widgetOrder),
    kpiCardIds,
    performanceWindow: ["30d", "3m", "6m", "1y"].includes(
      value.performanceWindow ?? "",
    )
      ? (value.performanceWindow as PerformanceWindow)
      : DEFAULT_DASHBOARD_PREFERENCES.performanceWindow,
    sidebarPresentation:
      value.sidebarPresentation === "compact" ? "compact" : "expanded",
    navigationSort:
      value.navigationSort === "alphabetical" ? "alphabetical" : "priority",
    visibleNavigationGroupIds: DASHBOARD_NAVIGATION_GROUP_IDS.filter((id) =>
      groupSet.has(id),
    ),
    showTopBarSearch: value.showTopBarSearch !== false,
    showGuidedTour: value.showGuidedTour !== false,
    showConnectionStatus: value.showConnectionStatus !== false,
    showTopBarDate: value.showTopBarDate !== false,
  };
}
```

The `completeWidgetOrder` helper deliberately retains all known widget IDs. A separate boolean controls whether a panel is visible. This preserves a stable ordering when a user hides and later restores a panel.

## 3. Authenticated Preference API Contract

The frontend API surface should contain no `companyId` or `userId` arguments. The server must derive those values from the verified session.

```ts
export interface DashboardPreferencesApi {
  get(): Promise<{
    preferences: Partial<DashboardPreferences> | null;
    updatedAt: string | null;
  }>;
  save(input: DashboardPreferences): Promise<{
    preferences: DashboardPreferences;
    updatedAt: string;
  }>;
}
```

For a tRPC application, wrap stable query and mutation functions in this interface. Do not use a direct browser `fetch` call that accepts a client-controlled tenant or user identifier.

```ts
// Example adapter; keep the containing component/provider stable with useMemo.
const api: DashboardPreferencesApi = {
  get: async () => trpc.dashboardPreferences.get.query(),
  save: async (input) => trpc.dashboardPreferences.save.mutate(input),
};
```

## 4. React Hook With Optimistic Persistence

The hook below applies a change immediately, saves it through the authenticated API, serializes saves to avoid out-of-order writes, and reverts only the latest optimistic change when its save fails.

```ts
export interface DashboardCustomizationState {
  preferences: DashboardPreferences;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  update: <K extends keyof DashboardPreferences>(
    key: K,
    value: DashboardPreferences[K],
  ) => void;
  patch: (changes: Partial<DashboardPreferences>) => void;
  reset: () => void;
  reload: () => Promise<void>;
  clearError: () => void;
}

interface UseDashboardCustomizationOptions {
  api: DashboardPreferencesApi;
  /** Use false until the authenticated session and verified company are ready. */
  enabled: boolean;
  initialPreferences?: Partial<DashboardPreferences>;
}

export function useDashboardCustomization({
  api,
  enabled,
  initialPreferences,
}: UseDashboardCustomizationOptions): DashboardCustomizationState {
  const [preferences, setPreferences] = useState<DashboardPreferences>(() =>
    normalizeDashboardPreferences(initialPreferences),
  );
  const [isLoading, setIsLoading] = useState(enabled);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keeps save operations in order. Newer settings are never overwritten by
  // an older network response.
  const saveQueueRef = useRef<Promise<void>>(Promise.resolve());
  const latestRevisionRef = useRef(0);
  const mountedRef = useRef(true);
  const preferencesRef = useRef(preferences);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const reload = useCallback(async () => {
    if (!enabled) {
      setPreferences(normalizeDashboardPreferences(initialPreferences));
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const result = await api.get();
      if (mountedRef.current) {
        const next = normalizeDashboardPreferences(result.preferences);
        preferencesRef.current = next;
        setPreferences(next);
      }
    } catch (caught) {
      if (mountedRef.current) {
        setError(
          caught instanceof Error
            ? caught.message
            : "Dashboard preferences could not be loaded.",
        );
      }
    } finally {
      if (mountedRef.current) setIsLoading(false);
    }
  }, [api, enabled, initialPreferences]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const enqueueSave = useCallback(
    (next: DashboardPreferences, previous: DashboardPreferences) => {
      if (!enabled) return;

      const revision = ++latestRevisionRef.current;
      setIsSaving(true);
      setError(null);

      saveQueueRef.current = saveQueueRef.current
        .catch(() => undefined)
        .then(async () => {
          try {
            const result = await api.save(next);
            if (mountedRef.current && revision === latestRevisionRef.current) {
              const persisted = normalizeDashboardPreferences(result.preferences);
              preferencesRef.current = persisted;
              setPreferences(persisted);
            }
          } catch (caught) {
            if (mountedRef.current && revision === latestRevisionRef.current) {
              preferencesRef.current = previous;
              setPreferences(previous);
              setError(
                caught instanceof Error
                  ? caught.message
                  : "Dashboard preferences could not be saved.",
              );
            }
          } finally {
            if (mountedRef.current && revision === latestRevisionRef.current) {
              setIsSaving(false);
            }
          }
        });
    },
    [api, enabled],
  );

  const patch = useCallback(
    (changes: Partial<DashboardPreferences>) => {
      const previous = preferencesRef.current;
      const next = normalizeDashboardPreferences({ ...previous, ...changes });
      preferencesRef.current = next;
      setPreferences(next);
      enqueueSave(next, previous);
    },
    [enqueueSave],
  );

  const update = useCallback(
    <K extends keyof DashboardPreferences>(
      key: K,
      value: DashboardPreferences[K],
    ) => patch({ [key]: value } as Partial<DashboardPreferences>),
    [patch],
  );

  const reset = useCallback(() => {
    const previous = preferencesRef.current;
    const next = normalizeDashboardPreferences(DEFAULT_DASHBOARD_PREFERENCES);
    preferencesRef.current = next;
    setPreferences(next);
    enqueueSave(next, previous);
  }, [enqueueSave]);

  return useMemo(
    () => ({
      preferences,
      isLoading,
      isSaving,
      error,
      update,
      patch,
      reset,
      reload,
      clearError: () => setError(null),
    }),
    [error, isLoading, isSaving, patch, preferences, reload, reset, update],
  );
}
```

### Example Component Usage

```tsx
function CompactMenuSwitch({ state }: { state: DashboardCustomizationState }) {
  return (
    <button
      type="button"
      aria-pressed={state.preferences.sidebarPresentation === "compact"}
      disabled={state.isSaving}
      onClick={() =>
        state.update(
          "sidebarPresentation",
          state.preferences.sidebarPresentation === "compact"
            ? "expanded"
            : "compact",
        )
      }
    >
      {state.preferences.sidebarPresentation === "compact"
        ? "Use expanded menu"
        : "Use compact menu"}
    </button>
  );
}
```

## 5. Apply Preferences Only After Authorization

Preferences may hide or order an **already-authorized** navigation group. They must never construct the authorized menu.

```ts
export interface AuthorizedNavigationItem {
  id: string;
  label: string;
}

export interface AuthorizedNavigationGroup {
  id: DashboardNavigationGroupId;
  label: string;
  items: AuthorizedNavigationItem[];
}

export function getDisplayedNavigationGroups(
  authorizedGroups: AuthorizedNavigationGroup[],
  preferences: DashboardPreferences,
  activeDestinationId: string,
): AuthorizedNavigationGroup[] {
  const activeGroupId = authorizedGroups.find((group) =>
    group.items.some((item) => item.id === activeDestinationId),
  )?.id;

  return authorizedGroups.filter(
    (group) =>
      preferences.visibleNavigationGroupIds.includes(group.id) ||
      group.id === activeGroupId,
  );
}
```

The calling code must obtain `authorizedGroups` from role, company membership, enabled module, subscription, and server-confirmed permission logic. A stored value such as `"finance"` is only a display request; it has no effect when Finance is absent from `authorizedGroups`.

## 6. Integration Checklist

| Concern | Recommended implementation |
|---|---|
| Initial load | Enable `reload()` only after authentication and verified company scope are available. |
| Save | Send the preference document only; derive `company_id` and `user_id` on the server. |
| Loading state | Render a small skeleton or disable controls while `isLoading` is true. |
| Save state | Show a non-blocking saving indicator; avoid closing the drawer because a save is in progress. |
| Error state | Show `error` near the drawer footer with a retry action that calls `reload()` or reapplies the intended change. |
| Reset | Call `reset()` and persist the default document in the current authenticated user/company scope. |
| Local preview | If you support an unauthenticated isolated preview, make it explicit and never use that fallback as a live tenant source of truth. |
| Accessibility | Use real `<button>` controls, `aria-pressed` for toggles, and clear labels for ordering actions. |

## 7. Test Scenarios

Test the helper functions and hook behavior independently of the dashboard view.

```ts
import { describe, expect, it } from "vitest";

describe("normalizeDashboardPreferences", () => {
  it("always retains Home as a safe navigation group", () => {
    const value = normalizeDashboardPreferences({
      visibleNavigationGroupIds: ["finance"],
    });

    expect(value.visibleNavigationGroupIds).toEqual(["home", "finance"]);
  });

  it("drops unknown navigation identifiers and keeps known widget order", () => {
    const value = normalizeDashboardPreferences({
      visibleNavigationGroupIds: ["home", "not-a-group"] as never[],
      widgetOrder: ["quickActions", "not-a-widget"] as never[],
    });

    expect(value.visibleNavigationGroupIds).toEqual(["home"]);
    expect(value.widgetOrder[0]).toBe("quickActions");
    expect(value.widgetOrder).toHaveLength(DASHBOARD_WIDGET_IDS.length);
  });
});

describe("getDisplayedNavigationGroups", () => {
  it("cannot restore a group absent from the authorized model", () => {
    const authorized: AuthorizedNavigationGroup[] = [
      { id: "home", label: "Home", items: [{ id: "dashboard", label: "Dashboard" }] },
    ];
    const preferences = normalizeDashboardPreferences({
      visibleNavigationGroupIds: ["home", "finance"],
    });

    expect(getDisplayedNavigationGroups(authorized, preferences, "dashboard"))
      .toEqual(authorized);
  });
});
```

For the full application, add test cases for a Platform Administrator, subscription-limited manager, read-only employee, and external portal role. Each test should prove that preferences never add an unauthorized group, module, record, or write action.

## 8. Important Boundary Notes

1. **Do not trust local storage for live authorization.** It can be used only for a clearly labelled isolated preview fallback.
2. **Do not accept `userId` or `companyId` from the browser** in the save input. Resolve both values from the server-verified session.
3. **Do not treat visible group identifiers as route permission.** Continue enforcing access on the server and at route/data boundaries.
4. **Keep a stable API reference.** If an API object is built in a component, wrap it in `useMemo`; otherwise, the hook’s loading effect may run more often than intended.
5. **Evolve with `schemaVersion`.** Deploy tolerant reads before strict writes when adding new fields, and normalize older documents to safe defaults.
