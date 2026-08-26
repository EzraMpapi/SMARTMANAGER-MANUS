# Sidebar Ordering and Command-Bar Redesign

**Date:** 26 August 2026  
**Scope:** Dashboard module discovery and responsive command-bar hierarchy.

## Sidebar ordering decision

The dashboard now offers two explicit navigation orders. **Priority** is the default and places modules marked as primary for the signed-in role at the beginning of the flat navigation list; the remaining modules retain the canonical group-and-item sequence after the list is flattened. **A–Z** provides a neutral alphabetical index of the same permitted modules. The choice is saved in the browser under `smart-manager:sidebar-module-order`, which makes it a per-device preference without changing a company-wide setting or a user permission.

Visibility, role filtering, subscription filtering, alert counts, locked settings affordance, route targets, and the mobile navigation path are unchanged. The new mode changes presentation order only.

## Command-bar redesign

The command bar now uses a grid with a flexible context column and an intrinsic action column, preventing the action cluster from compressing the workspace/module context. Small screens expose the menu, current module context, create control, notifications, and profile menu. Search becomes available at laptop widths; live status, subscription state, onboarding, date, presence, and alert surfaces progressively appear only where adequate horizontal space exists. The dark-mode toggle is now desktop/laptop-only, avoiding the prior compact-screen collision.

| Range | Context | Actions exposed |
|---|---|---|
| Phone | Current module and company label | Menu, create, notifications, profile |
| Tablet | Workspace and module breadcrumb | Core actions; optional controls stay hidden |
| Laptop | Full workspace context | Search, create, notifications, profile, theme |
| Desktop / widescreen | Full context and role marker | Live state, subscription, search, onboarding, date, alerts, presence, theme, profile |

## Validation

| Validation | Result |
|---|---:|
| Focused sidebar order, command-bar, shell, and dashboard contracts | **77 passed tests** |
| TypeScript | **Passed** |
| Full serialized regression suite | **241 passed files, 6 skipped; 995 passed tests, 14 skipped** |

No schema, RLS, authorization, tenant-isolation, or production-data change was required for this client-side interaction refinement.
