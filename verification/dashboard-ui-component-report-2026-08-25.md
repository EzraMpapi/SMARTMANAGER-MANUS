# SMART MANAGER Dashboard UI Component Report

**Report date:** 25 August 2026  
**Scope:** The authenticated dashboard shell, updated mobile command bar, responsive navigation, contained profile menu, overview surface, and module hand-off architecture.

## Design-system summary

The dashboard is a **command-center workspace** rather than a collection of isolated pages. Its layout prioritizes persistent navigation on desktop, a compact safe-area-aware navigation model on mobile, and a contained account menu that does not cover or disable the operating surface. Visual styling uses a neutral workspace canvas, emerald operational accent, low-contrast borders, rounded action surfaces, visible focus treatment, and bounded layers for popovers and menus.

## Shell and navigation components

| Component / source | Responsibility | Desktop behavior | Mobile and tablet behavior | Permission and data boundary |
|---|---|---|---|---|
| `BusinessSphereDashboard.jsx` | Owns authenticated application shell, active module routing, shell state, and workspace-level command surfaces | Provides the stable dashboard column and sticky command bar | Reduces top-bar density and applies safe-area-aware content and bottom-nav clearance | Receives authenticated session, role-filtered visible modules, subscription access, and company context |
| Desktop sidebar | Renders the left operational rail, grouped navigation, current-module state, alerts, command palette entry, and settings route | Sticky rail with optional compact mode; workspace groups remain available while content scrolls | Converts to an explicit drawer triggered by the menu button | `visibleModules`, navigation groups, role checks, and subscription/feature access determine entries |
| `enterpriseNavigation` | Defines the single navigation inventory and quick-create intent map | Orders Home, Sales & CRM, Operations, Finance, People, Specialized, Analytics, and Administration groups | Mobile tabs are selected from the same visible-module source rather than a second permission model | Runtime filtering is based on role definition, module entitlements, and server-confirmed subscription access |
| Mobile bottom navigation | Keeps the highest-priority workspace destinations reachable by thumb | Hidden in desktop layout | Fixed, safe-area-aware strip with up to five RBAC-filtered destinations and visible active state | Uses the exact same `visibleModules` model as the sidebar |
| Command palette | Provides fast module and record discovery | Available from the sidebar and command bar | Search is intentionally reduced on narrow screens to avoid crowded controls | Navigation remains subject to the visible module list and intent handler |
| Quick-create menu | Opens existing create intents for sales, finance, CRM, HR, POS, procurement, and inventory | Dropdown from the command bar | Icon-first touch target; labels appear where width allows | Items are calculated from visible modules and creation capability |

## Command bar and account components

| Component / source | Responsibility | Responsive behavior | Interaction and accessibility safeguards |
|---|---|---|---|
| `dashboard-topbar` | Sticky workspace command bar with company/module context and operational controls | At widths below 640px, uses a 60px minimum height, safe-area side padding, tighter context/action gaps, and no onboarding-tour control | Semantic `aria-label="Workspace command bar"`; menu trigger and primary mobile actions use at least 44px touch targets |
| `dashboard-topbar-context` | Presents menu trigger, compact logo, active-module label, and company context | Retains a constrained title area at narrow widths; compact logo is hidden below 380px before content can overlap | Text uses truncation instead of wrapping into action controls |
| `dashboard-topbar-actions` | Holds subscription state, command palette, creation, dark mode, notifications, and profile entry | Search hides below the `sm` breakpoint; dark mode hides below 480px; nonessential presence/date/status indicators use larger breakpoints | Action spacing narrows without shrinking tap targets below 44px |
| `NotificationCenter` | Aggregates workspace notifications and route hand-offs | Remains an icon-level command surface in narrow layouts | Keeps navigation callback boundaries rather than introducing a second data path |
| `ProfileMenu` in `ProfileIdentityCenter.jsx` | Opens account destinations and session controls | Bounded to `min(92vw, 320px)` width with a `min(58vh, 360px)` scrollable action region | Outside pointer events and Escape close the menu; focus restores to the trigger on Escape; no fixed backdrop covers the workspace |
| `ProfileIdentityPage` | Provides full profile overview, personal details, work identity, security, preferences, and activity views | Opens as the normal protected `profile` route rather than an oversized dashboard overlay | Profile fields, role, company, and security data remain server-authoritative and capability-gated |

## Overview and workspace layer

| Layer | Primary components | Purpose |
|---|---|---|
| Executive overview | `EnterpriseDashboardOverview`, `ExecutiveCommandCenter` | KPI windowing, operating alerts, quick actions, execution context, and executive insight surface |
| Commercial workspaces | CRM, sales, marketing, ecommerce command centers | Customer and revenue workflow hand-off from the shell |
| Operations workspaces | Inventory, POS, procurement, supply chain, warehouse command centers | Stock, order, fulfillment, and operational execution views |
| Finance workspaces | Finance, reporting, integrations command centers, subscription billing | Financial workflow, reporting, provider-confirmed subscription, and integration operations |
| People workspaces | HR, employee portal, documents, collaboration, workflow command centers | Workforce, document, employee self-service, and workflow management |
| Specialized verticals | Healthcare, pharmacy, school, hotel, restaurant, fleet, property, banking/MFI, microfinance, community, VICOBA | Sector-specific workspace routing through the same shell, permissions, and responsive rules |
| Intelligence and support | AI business signals, AI assistant, support center | Analysis and support entry points; mobile AI trigger remains above bottom navigation |

## Responsive behavior matrix

| Breakpoint | Navigation | Command bar | Content | Account menu |
|---|---|---|---|---|
| Desktop (`lg` and above) | Sticky left rail with grouped workspace navigation | Full company/module context and progressive operational controls | Main workspace shares the stable rail layout | Right-aligned contained menu |
| Tablet (`sm` to `lg`) | Drawer navigation plus responsive module context | Compact subscription/search/create/account controls | Padded, scrollable dashboard content | Bounded menu uses viewport-aware width |
| Phone (below `sm`) | Drawer trigger and fixed bottom navigation | Context/action groups tighten; secondary tour, search, status, and dark-mode controls progressively hide | Safe-area side padding and bottom-navigation clearance | Full-width-safe bounded menu with direct account actions |
| Very narrow phone (below 380px) | Same drawer/bottom-nav model | Compact logo hides; context title caps at 5.5rem; tour and alert surfaces hide | No horizontal page overflow from shell controls | Menu remains width-bounded and scrollable |

## Interaction test coverage

The authenticated profile-menu DOM test uses a controlled authenticated session object and exercises real rendered clicks. It verifies menu opening from the account trigger, the absence of a page-covering fixed overlay, navigation through the **My profile** menu item, Escape closure, and outside-pointer closure. The profile service test separately verifies that server-backed profile reads use verified user/company scope and that role/company mutation attempts fail before a write occurs.

| Verification | Result |
|---|---:|
| Authenticated profile-menu DOM interaction | **1 passed test** |
| Dashboard-shell interaction and profile service/contract subset | **15 passed tests** |
| Full serialized regression suite | **241 passed files, 6 skipped; 993 passed tests, 14 skipped** |
| TypeScript | **Passed** |
| Live schema verification | **201 referenced tables; 536 deployed tables; 0 missing tables; 0 tenant/critical contract issues** |

## Remaining boundary

This report does not claim a live production browser click-through using a real end-user session. That requires a disposable approved test account or a user-authorized browser sign-in. Existing automated coverage validates controlled authenticated DOM interaction and server-scoped profile behavior without bypassing tenant-aware production authentication.
