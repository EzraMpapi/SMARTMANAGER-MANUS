# Authenticated Mobile Action-Bar Evidence

## Scope

This evidence records non-destructive browser checks against the published, authenticated Smart Manager workspace. The checks used Chrome DevTools mobile emulation at **360 × 844** and **390 × 844**. No form was submitted and no business, tenant, or entitlement data was changed.

| Module | 360px result | 390px result | Dense-control evidence |
|---|---|---|---|
| CRM | No document overflow; the module title resolved correctly. | No document overflow; the module title resolved correctly. | The tab list exposed a 320px/350px client width with 895px scrollable content; the visible action group wrapped within its container. |
| Sales | No document overflow; the Sales module resolved correctly. | No document overflow; the Sales module resolved correctly. | The visible shared mobile action group matched the 320px/350px content width, wrapped, and did not exceed the viewport. |
| Finance | No document overflow; the Finance module resolved correctly. | No document overflow; the Finance module resolved correctly. | The Finance segmented controls remained inside the 360px/390px document width. |
| HR | No document overflow; the Human Resources module resolved correctly. | No document overflow; the Human Resources module resolved correctly. | The existing dashboard Module Health control provided an authorized, read-only entry path; no tenant module setting was changed. |

## Repeatable Browser Flow

The project includes `scripts/validateAuthenticatedMobileModules.mjs` for controlled, read-only reruns against an already-authenticated browser target. It resizes the active published workspace, navigates via existing UI controls, and reports only layout dimensions, module titles, tab scrollability, and action-group wrapping. It never enters, submits, creates, edits, or deletes operational data.

> HR validation used the existing dashboard Module Health entry path after the command-palette and sidebar surfaces did not expose it. The workspace configuration remained unchanged throughout the check.
