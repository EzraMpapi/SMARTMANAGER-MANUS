# Responsive and Accessibility Strategy

## Breakpoints

| Context | Layout | Behavior |
|---|---|---|
| Desktop ≥1024px | Persistent sidebar + wide command center | Two-column panels, visible charts, wide tables, keyboard-first shortcuts. |
| Tablet 640–1023px | Collapsed sidebar + contextual drawer | KPI grids reduce to two columns; secondary actions move into drawers; tables retain horizontal scroll. |
| Mobile ≤639px | Top bar + bottom navigation + full-width content | Actions wrap, forms stack, tables become scroll containers/cards, status remains above the fold, touch targets remain at least 44px. |

## Accessibility contract

Use semantic headings, labelled inputs, visible focus rings, keyboard-reachable menus and dialogs, sufficient color contrast, status text that does not rely on color alone, `aria-live` for asynchronous results, reduced-motion support, and explicit error/recovery instructions. Financial, clinical, identity, and security actions require confirmation and a visible audit/result state.

## State taxonomy

Every query or mutation surface has loading, empty, success, error, restricted, pending, and stale-data states. A “no records” state must be distinct from “data unavailable” and from “you are not authorized.”
