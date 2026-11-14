# Reference Top Header Analysis

## Supplied visual direction

The requested rebuild follows a compact white enterprise command bar with a thin bottom border and a restrained, single-row visual rhythm. The desktop hierarchy is: left navigation toggle, centered global search with the `Ctrl + K` cue, then a right-aligned action rail. The reference action rail uses small outlined icon targets with compact numeric badges, a divider, a two-line workspace identity, another divider, and a profile block with avatar, name/role, and a chevron.

The circled secondary reference confirms the preferred right-side ordering: workspace identity and chevron, a small presence indicator, a layout-controls icon, a bell badge, a compact alert summary, then a profile identity card. The supplied third crop reinforces that the global search is centered independently of the action rail, while the search, action rail, workspace context, and profile all remain visually balanced within one header row.

## Implementation boundaries

The rebuild must recompose existing controls rather than invent data or alter application authority. Existing hamburger/sidebar behavior, global Command Palette opening, dashboard layout preferences, Notification Center panel and alert counts, Create menu, profile menu, company/workspace context, protected routing, RBAC, RLS, and tenant-scoped data inputs remain the source of behavior. New visual wrappers and auxiliary icon surfaces must retain accessible labels, focus visibility, keyboard reachability, and sensible mobile fallback.

## Isolated rebuild review

The initial 1440px isolated review confirms the compact white bar, thin dividers, left menu control, centered search, icon rail, and contained profile card. The 375px review confirms the same compact icon language, 40px touch targets, no horizontal overflow, and preserved mobile navigation. The final desktop grid keeps a broader right action column so the real workspace identity can appear at the standard large-desktop breakpoint rather than being deferred to an ultra-wide viewport.

The final desktop composition presents the real workspace identity directly after the centered global search, followed by connection state, layout customization, notifications, and the existing contained account identity menu. The mobile composition intentionally reduces this to the menu, compact brand, customization, notifications, Create, and account identity controls; each retained command surface is at least 40px and no route, alert, tenant input, or authorization rule was changed.

## Validation evidence

| Check | Result |
|---|---:|
| Isolated compiled desktop/mobile browser suite | 5 passed; 3 project-guard skips expected |
| Focused header contracts | 12 passed |
| Full regression suite | 269 files and 1,105 tests passed; 7 files and 15 tests skipped by existing configuration |
| TypeScript | `pnpm exec tsc --noEmit` passed |
| Read-only schema verifier | 201 referenced tables found within 556 deployed paths; no missing, tenant, or critical issue |
| Production build | 2,704 modules transformed; client and server bundles emitted successfully with a 4GB Node heap |

The existing large `BusinessSphereDashboard` chunk warning remains non-blocking and is not caused by this header rebuild.
