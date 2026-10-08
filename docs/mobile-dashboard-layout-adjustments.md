# Mobile Dashboard Layout Adjustment Proposal

## Objective

Address the two issues found in the isolated mobile dashboard capture without changing routes, entitlement rules, tenant scope, dashboard data, or the existing AI workspace action. The recommended adjustment keeps five task-focused destinations in the bottom navigation and moves the AI entry point into the mobile command strip, where it no longer covers scrollable KPI content.

## 1. Keep the complete active navigation label visible

The current mobile-label span is capped at `48px` and uses `truncate`, which converts the active Dashboard label to `Dashbo...`. At a 375px viewport, five equally distributed navigation items have sufficient width for a 64px label. The label should remain visually constrained for unusually long module names but must expose the unabridged module name to assistive technology.

### Recommended markup adjustment

In `BusinessSphereDashboard.jsx`, add a full accessible name to each mobile destination and use a scoped label class:

```jsx
<button
  key={m.id}
  type="button"
  onClick={() => go(m.id)}
  aria-label={m.label}
  aria-current={on ? "page" : undefined}
  className="dashboard-mobile-nav-item flex-1 min-h-[64px] min-w-0 px-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#16A34A]/45"
  style={{ color: on ? "#16A34A" : "#9CA3AF" }}
>
  {/* existing icon and active dot */}
  <span className="dashboard-mobile-nav-label">{m.label.split(" ")[0]}</span>
</button>
```

### Recommended scoped CSS

```css
.dashboard-mobile-nav-item {
  flex: 1 1 20%;
  max-width: 20%;
}

.dashboard-mobile-nav-label {
  display: block;
  max-inline-size: 4.5rem;
  margin-top: .25rem;
  overflow: hidden;
  color: currentColor;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  text-align: center;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 359px) {
  .dashboard-mobile-nav-label {
    max-inline-size: 3.8rem;
    font-size: 9px;
  }
}
```

This makes **Dashboard** readable at the validated 375px width while retaining a graceful rule for modules with longer first words. If the module inventory already provides a `shortLabel`, it should be preferred over truncation:

```jsx
{m.shortLabel || m.label.split(" ")[0]}
```

## 2. Remove the dashboard KPI overlap created by the floating AI action

The present action is fixed on small screens at `bottom: calc(5.75rem + safe-area)`, directly over the scrolling content plane. Extra end padding protects only the final rows; it cannot prevent the action from covering a KPI card near the viewport bottom. Shifting this fixed element by a few pixels would reduce, but not eliminate, the overlap.

### Recommended layout: mobile command-strip AI action

Keep the floating control at `sm` and larger widths, but render the **same existing `go("ai")` action** as a compact button in the mobile top bar. It remains reachable on every mobile workspace, but it belongs to the fixed command-strip plane instead of obscuring data cards.

```jsx
{/* within the existing mobile top-bar action group */}
{active !== "ai" && visibleModules.some((m) => m.id === "ai") && (
  <button
    type="button"
    onClick={() => go("ai")}
    aria-label="Open AI Command Center"
    className="dashboard-topbar-ai-action lg:hidden"
  >
    <Sparkles size={18} aria-hidden="true" />
  </button>
)}

{/* retain the floating action only at sm and larger widths */}
{active !== "ai" && visibleModules.some((m) => m.id === "ai") && (
  <button
    type="button"
    onClick={() => go("ai")}
    aria-label="Open AI Command Center"
    className="dashboard-ai-fab hidden sm:flex"
  >
    <Sparkles size={22} aria-hidden="true" />
  </button>
)}
```

```css
.dashboard-topbar-ai-action {
  display: inline-grid;
  width: 2.75rem;
  height: 2.75rem;
  flex: 0 0 auto;
  place-items: center;
  border: 1px solid rgb(209 250 229);
  border-radius: .875rem;
  background: rgb(236 253 245);
  color: rgb(4 120 87);
  box-shadow: 0 2px 8px rgb(15 23 42 / .06);
  transition: transform 160ms var(--ease-out), background-color 160ms var(--ease-out);
}

.dashboard-topbar-ai-action:hover {
  background: rgb(209 250 229);
}

.dashboard-topbar-ai-action:active {
  transform: scale(.97);
}

.dashboard-topbar-ai-action:focus-visible {
  outline: 2px solid rgb(5 150 105);
  outline-offset: 2px;
}
```

The bottom navigation can remain at five equal destinations, preserving the existing order and touch targets. The main content may retain its current bottom safe-area padding because it still needs to clear the fixed navigation bar; the additional margin formerly needed for a floating control is no longer needed on narrow screens.

## Alternative: keep a mobile AI action in the navigation itself

If the product requires the AI action to remain in the bottom zone, include it as a sixth navigation item rather than a floating overlay. Each item becomes `16.666%` wide and must use a short visible label such as `AI`; this is preferable to an overlay, but it makes the bottom navigation denser and gives a lower visual priority to the five core operational destinations.

## Validation after implementation

Run the existing isolated desktop/mobile Playwright spec at 375px, add an assertion that the active label text is exactly `Dashboard`, and verify that no fixed AI action intersects the KPI card bounds. Retain the existing request-origin assertion so the validation continues to avoid production data and tenant access.
