# SMART MANAGER — Enterprise UI/UX Design System

## Design intent

Smart Manager should feel like a serious international SaaS/ERP platform while remaining recognizably Tanzania-first: confident, calm, operationally dense, and trustworthy with money, people, compliance, and evidence. The visual language unifies executive dashboards, frontline workflows, industry workspaces, portals, and administration without flattening their domain differences.

## Brand tokens

| Token | Value | Use |
|---|---|---|
| Noble gold | `#C9A96E` | Premium primary accent, focus ring, selected executive state |
| Emerald action | `#16A34A` | Confirmed actions, healthy status, success state |
| Deep slate | `#0B1120` | Dark shell, hero, authentication canvas |
| Noble navy | `#131C31` | Elevated shell panels and navigation depth |
| Workspace white | `#FFFFFF` | Operational canvas and form surfaces |
| Slate 50–900 | Tailwind slate scale | Borders, labels, muted text, disabled states |
| Tanzania green | `#008A45` | Regional identity cue, not a replacement for product green |
| Tanzania blue | `#1F75FE` | Information and service status |
| Tanzania yellow | `#FCD116` | Sparse highlight only; avoid warning ambiguity |
| Danger | `#DC2626` | Destructive actions, blocking errors, compliance risk |

## Typography and rhythm

Use **Poppins** for headings and navigation landmarks and **Inter** for body copy, tables, metadata, and form labels. Use a 4/8px spacing rhythm, 12px base corner radius, 16–24px workspace cards, and compact 12–14px operational type. Headings use strong hierarchy; labels remain sentence case and never rely on color alone.

## Component grammar

| Component | Default treatment | Required states |
|---|---|---|
| Primary button | Emerald or gold fill, high contrast, 10–12px radius | idle, hover, pressed, loading, disabled, permission-blocked |
| Secondary button | White/transparent with slate border | idle, hover, disabled |
| Destructive button | Red fill only after explicit confirmation | warning, confirm, deleting, blocked |
| KPI card | White/light card in workspace; glass card in shell/hero | loading, populated, stale, unavailable |
| Table | Dense rows, sticky header, visible status chip, responsive scroll container | empty, loading, error, selected, bulk mode |
| Form | Sectioned fields, inline validation, clear required markers | pristine, dirty, invalid, submitting, confirmed, server error |
| Modal/drawer | Focus-trapped, Esc-close, clear title and consequence | open, processing, success, error |
| Toast | Bottom-right desktop, bottom full-width mobile | success, error, info, warning, dismiss |
| Tabs | Segmented light strip with intrinsic readable width | selected, focus, overflow-scroll |
| Audit timeline | Actor, time, action, resource, evidence link | filtered, empty, export-ready |

## Accessibility contract

Maintain WCAG-minded contrast, visible focus rings, keyboard order matching visual order, labels associated with controls, error summaries that name fields, status conveyed by text plus color, reduced-motion behavior, 44px minimum touch targets on mobile, and screen-reader text for icon-only controls. Never hide a permission explanation behind a disabled control without an accessible reason.

## State language

Use `Draft`, `Pending`, `Awaiting approval`, `Approved`, `Processing`, `Confirmed`, `Scheduled`, `Held`, `Paid`, `Partially paid`, `Failed`, `Needs attention`, `Restricted`, and `Archived` consistently. A success toast is not sufficient evidence of persistence; the result view must show the confirmed record or an actionable server error.

## Responsive behavior

Desktop uses a persistent sidebar and two-column workspaces. Tablet collapses the sidebar and preserves split panes only when both panes remain readable. Mobile uses a top bar, horizontal tab strip, stacked KPI cards, full-width action groups, and dedicated horizontal table scrolling; it does not compress dense tables into unreadable columns.
