# SMART MANAGER Button and Interactive-Control Audit

**Audit date:** 2026-08-24
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Scope:** Tracked client source under `client/`, existing server persistence boundaries, live Supabase table availability, and regression validation.

## Executive conclusion

The repository contains a large interactive surface, but a static scanner cannot prove runtime correctness for every control. The audit therefore combined deterministic inventory, source tracing, existing persistence-contract review, live Supabase catalog inspection, focused regression tests, and TypeScript validation.

Three verified disconnected actions were repaired, and two existing Pharmacy mutations were changed to update UI state only after Supabase confirmation. No speculative database tables were created. The remaining notification-only controls are documented below because their feature-specific persistence contracts or forms are not present in the repository; inventing tables or silently writing incomplete records would be unsafe.

## Inventory

| Measure | Result |
|---|---:|
| Tracked client source files scanned | 150 |
| Button tags found | 3,345 |
| Button-like `onClick` controls | 1,780 |
| Native/shared controls flagged by the scanner as lacking a local handler or submit role | 102 |
| Controls with placeholder-like surrounding copy | 583 |
| Controls with direct `alert()` context | 8 |
| Controls with browser-storage context | 10 |

The scanner is intentionally conservative and context-based. Its placeholder and no-handler counts include component definitions, wrapper components, close buttons, validation alerts, demo/showcase surfaces, and dynamically generated JSX. They are **review queues, not proof of defects**.

## Verified repairs

### Inventory reorder

The previously inert **Raise Purchase Order** action in the inventory item panel now:

1. Requires an active supplier and calculates a minimum reorder quantity.
2. Creates a company-scoped record in the existing `procurement_purchase_orders` table.
3. Creates the matching line record in `purchase_order_items`.
4. Stores feature-specific fields in the existing generic `data` envelope used by these live tables.
5. Removes the header if line-item persistence fails, and only closes the panel after confirmed success.

### Expense receipt

The previously inert **Receipt** action in the expense detail panel now produces a real printable receipt through the existing `printReport` helper. User-provided fields are HTML-escaped before being placed into the print document.

### Module manifest export

The quota-only **Download ZIP Archive** action in the presentation/inventory progress surface was replaced with a real JSON manifest download containing the 40 inventoried module records, status, category, source, notes, and timestamps. It no longer claims that a future quota reset queued an unavailable archive.

### Pharmacy persistence hardening

**Add Drug** and **Dispense** now use confirmed Supabase responses before changing local rows in configured mode. Dispensing also verifies that a live stock row exists and that the requested quantity does not exceed available stock before writing the dispensing and stock mutations.

## Supabase verification

A bounded connector query confirmed that the existing action tables are already present in production:

`bank_fixed_deposits`, `bank_standing_orders`, `crm_leads`, `hc_reports`, `hr_performance_reviews`, `phm_purchase_orders`, `phm_stock`, `procurement_purchase_orders`, `purchase_order_items`, `sch_books`, and `sch_exams`.

No table was missing from this verified set. No `apply_migration` call was justified, and no new tables were created. The existing RLS, tenant-boundary, and server persistence rules remain authoritative.

## Remaining review queue

The audit still found notification-only or form-placeholder controls in legacy/industry surfaces, including examples such as **Add OKR**, **Schedule Exam**, **Add Book**, **Receive Stock**, Pharmacy **Create Purchase Order**, **New Category**, **New Fixed Deposit**, and **New Standing Order**. These are not represented as successful database mutations today. They require feature-specific UX, validation, table-column mapping, and authorization review before implementation.

The correct next step for each is to define or confirm the owning persistence contract, then add a real form and server-confirmed mutation. They should not be made to write arbitrary generic rows merely to make a button appear connected.

## Validation

The following checks passed after the repairs:

- `pnpm vitest run server/buttonActionContracts.test.ts` — 5 tests passed.
- `pnpm check` — TypeScript completed successfully.

The new source-contract test covers the Inventory reorder mutation, duplicate-submission protection, Expense receipt export, JSON manifest export, and Pharmacy server-confirmed mutations.

## Files changed by this audit

- `client/src/BusinessSphereDashboard.jsx`
- `client/src/dashboardAdditionalModules.jsx`
- `server/buttonActionContracts.test.ts`
- `BUTTON_ACTION_AUDIT_20260824.md`

Unrelated untracked UI/PDF/browser artifacts were not staged or deleted.
