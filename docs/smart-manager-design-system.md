# SMART MANAGER ERP Design System

**Product:** SMART MANAGER ERP
**Brand promise:** *Simamia Biashara Yako. Popote, Wakati Wote.*
**Audience:** Tanzanian and international business operators, managers, finance teams, service teams, and administrators.
**Status:** v1 system contract for the repository-wide UI/UX transformation.

> The design system is an operational system, not decoration. It should help users understand where they are, what matters, what they can do, what needs attention, and what happens next.

## Design principles

SMART MANAGER uses a calm, high-trust enterprise visual language. The interface prioritizes operational efficiency, clear hierarchy, direct manipulation, readable density, and truthful states. Brand green and deep emerald establish identity and action; neutrals carry most surfaces; gold is reserved for selected emphasis and business insight. Tanzanian cues remain subtle and professional rather than turning the product into a flag-themed interface.

The system is data-aware and fail-closed. Confirmed server data is distinguishable from empty, loading, unavailable, demo, pending, and failed states. A visual affordance must not imply that a payment, settlement, approval, invitation, inventory movement, or other business operation succeeded until the server confirms it.

## Tokens

The canonical semantic tokens live in `client/src/index.css`. Components should consume semantic variables or shared variants rather than inventing page-specific colors.

| Token family | Canonical value | Use |
|---|---|---|
| Brand green | `#0B5D3B` | Primary identity, high-confidence actions, navigation accent. |
| Emerald | `#16A34A` | Success, active state, live status, secondary action emphasis. |
| Deep emerald | `#064E3B` | Dark navigation, high-contrast action state, brand depth. |
| Gold | `#C9A96E` | Selected insight, premium emphasis, non-critical highlight. |
| Ink | `#0F172A` | Primary text and strong headings. |
| Slate | `#475569` | Secondary text and supporting labels. |
| Canvas | `#F4F7F6` | Global light workspace background. |
| Surface | `#FFFFFF` | Cards, panels, dialogs, and input backgrounds. |
| Muted surface | `#F8FAFC` | Secondary panels, search fields, inactive controls. |
| Success | `#15803D` / `#DCFCE7` | Confirmed, healthy, completed. |
| Warning | `#B45309` / `#FEF3C7` | Pending, review, attention. |
| Danger | `#B91C1C` / `#FEE2E2` | Failed, destructive, blocked. |
| Information | `#0369A1` / `#E0F2FE` | Explanations and neutral system information. |
| Disabled | `#94A3B8` / `#F1F5F9` | Inactive controls and unavailable actions. |
| Focus | `#16A34A` | Visible keyboard focus ring. |

Dark mode uses the same semantic names with dark surfaces and readable foregrounds; it is not a raw color inversion. Business-state colors retain recognizable hue while meeting contrast requirements.

## Typography

The system uses Inter for interface text and Poppins for product headings and wordmarks. Typography must remain readable at 100% zoom and usable at 200% zoom.

| Role | Weight | Size guidance | Line height |
|---|---:|---:|---:|
| Display | 700–800 | 32–40px | 1.1–1.2 |
| H1 | 700 | 26–32px | 1.15–1.25 |
| H2 | 650–700 | 20–24px | 1.2–1.3 |
| H3 | 600–700 | 16–19px | 1.25–1.35 |
| H4 | 600 | 14–16px | 1.3 |
| Body | 400–500 | 13–15px | 1.5–1.65 |
| Body small | 400–500 | 12–13px | 1.45–1.6 |
| Label | 600–700 | 11–12px | 1.3 |
| Caption | 400–600 | 10–11px | 1.35 |
| Overline | 700 | 9–10px | 1.2; uppercase with tracking |

Text should communicate hierarchy through size, weight, spacing, and contrast. Avoid all-caps paragraphs, tiny critical instructions, and bolding every field.

## Spacing and layout

Use the Tailwind spacing scale as the implementation vocabulary, with these system anchors:

| Context | Default spacing |
|---|---:|
| Page horizontal padding | 12px mobile, 20px tablet, 28–32px desktop |
| Section gap | 24px |
| Module header to content | 16–20px |
| Panel/card padding | 16–20px |
| Form field gap | 12–16px |
| Table cell padding | 10–14px |
| Modal padding | 20–28px |
| Control gap | 8–12px |
| Minimum touch target | 44 × 44px |

Layouts must use `min-width: 0` on flexible children. Wide tables scroll inside their own intentional container; the page itself must never acquire horizontal overflow.

## Component contracts

### Buttons

Use the shared `Button` primitive for new typed UI. `default` is the primary action, `secondary` is a supportive action, `outline` is a bordered alternative, `ghost` is low emphasis, `link` is inline navigation, `destructive` requires confirmation, `success` is reserved for confirmed positive action, `warning` is for review/pending action, and `tertiary` is a neutral low-emphasis control. Icon-only actions must have an accessible name and a tooltip when the icon is not self-evident.

Every button must visibly support default, hover, active, focus, disabled, and busy/loading states. Destructive actions must explain consequences before execution. Critical finance, permissions, and workflow actions must also respect server-side authorization and confirmation.

### Forms

Every field has a visible label or an equivalent accessible name. Required fields use a semantic required indicator and inline explanation. Validation is adjacent to the field, preserves entered values, and does not rely on color alone. Submit controls expose busy state and are disabled only when the operation is actually unavailable. Destructive or irreversible forms require confirmation and explain the consequence.

### Tables and data grids

Every data view defines a loading skeleton, error state, empty state, search/filter affordance where useful, and row-level context actions. Desktop may use dense tables; mobile uses priority columns, responsive cards, expandable rows, or an explicitly labeled horizontal scroll region. Bulk operations are permission-aware and report the server-confirmed result.

### Panels, KPI cards, and charts

Panels group related information without excessive nested cards. KPI surfaces show a label, confirmed value or explicit unavailable state, period/context, and a useful action. Charts include title, period, legend, tooltip, loading, empty, error, and accessible text interpretation. Decorative charts without business meaning are prohibited.

### Modals and drawers

Dialogs have a title, description, close control, cancel action where applicable, primary action, loading/error/success treatment, keyboard escape behavior, focus return, and mobile-safe sizing. Drawers are preferred for contextual editing when the user needs the underlying record for reference.

### Notifications and activity

Notifications use consistent category, severity, timestamp, read/unread, action, and permission semantics. Activity and audit entries expose who, what, when, where, action, status, and before/after values only when the user is authorized to see them.

## Navigation and context

The authenticated shell uses grouped navigation, persisted sidebar state, command search, quick create, alerts, profile, settings, and mobile navigation. The shell must make company, branch, workspace, role, period, and subscription context visible before actions that can affect business data. Collapsed navigation uses icons and tooltips; expanded navigation uses icons and labels. Navigation labels must come from the real module inventory and must not invent dead routes.

## Responsive rules

| Breakpoint | Composition |
|---|---|
| 1536px and above | Full shell, expanded navigation, multi-column command center, optional secondary insight rail. |
| 1280–1535px | Full shell with reduced secondary density; keep primary actions visible. |
| 1024–1279px | Collapsible sidebar, two-column workspaces where practical, drawer-based secondary panels. |
| 768–1023px | Compact header, two-column forms, scrollable local tabs, priority data views. |
| 430–767px | Mobile drawer/bottom navigation, stacked KPI groups, wrapped action bars, mobile cards or scoped table scroll. |
| 360–429px | Single-column forms, concise labels, hidden non-critical header utilities, no clipped text. |

## Accessibility contract

Use semantic landmarks, heading order, keyboard-reachable controls, visible focus rings, descriptive labels, `aria-current` for active navigation, `aria-expanded` and `aria-controls` for disclosure, live regions for asynchronous status, and `aria-busy` for in-flight actions. Respect `prefers-reduced-motion`. Color is never the only status signal. Focus must be returned to the triggering control after a dialog or drawer closes.

## Localization and Tanzania-first behavior

TZS is the default currency and `Africa/Dar_es_Salaam` is the default timezone. Dates and money must use the existing preference helpers and remain UTC-safe internally. User-facing copy should use the language context so English and Swahili can evolve without rewriting component structure. Provider, tax, and regulatory labels must remain truthful and must not imply a completed TRA, payment, or settlement operation without confirmed evidence.

## Implementation checklist

Before adding a component, search for an existing equivalent. Before changing a shared primitive, identify dependent modules. After each major surface, verify navigation, console/network behavior, permissions, responsive composition, forms, loading, errors, and success. Any production-blocked provider or deployment boundary must be documented rather than hidden.

## References

[1]: ../client/src/index.css "Global tokens and responsive base rules"
[2]: ../client/src/components/ui/button.tsx "Shared button primitive"
[3]: ../client/src/components/ui/card.tsx "Shared card primitive"
[4]: ../client/src/navigation/enterpriseNavigation.js "Navigation source of truth"
[5]: ../client/src/contexts/LanguageContext.tsx "English/Swahili language context"
[6]: ../client/src/contexts/DashboardPreferencesContext.tsx "Currency, timezone, and preference helpers"
[7]: ../client/src/BusinessSphereDashboard.jsx "Authenticated ERP shell and module switchboard"
[8]: ./smart-manager-ui-ux-transformation-audit-20260826.md "Repository-grounded transformation audit"

**Owner:** SMART MANAGER Product and Engineering
**Prepared by:** Manus AI
