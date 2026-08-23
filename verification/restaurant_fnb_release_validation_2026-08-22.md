# Restaurant & F&B Module — Release Validation

**Date:** 22 August 2026

**Scope:** Production Restaurant & F&B module for Smart Manager ERP

**Status:** **Validated for release**

## Release outcome

The legacy seed-based Restaurant route has been replaced by an authenticated, tenant-scoped Restaurant Command Center. The module persists all operational records through typed Restaurant tables and protected RPC procedures. The client only invokes authenticated database procedures and never uses a client-supplied company identifier for authorization.

| Domain | Released implementation |
|---|---|
| Outlet and dining setup | Restaurant outlets, dining areas, configured table positions, table capacity and availability, Tanzania time zone, TZS currency, configurable tax, and service-charge rates. |
| Service and POS | Dine-in, takeaway, delivery, room-charge, and bar order types; table allocation controls; order lines; KDS dispatch; state transitions; configurable discounts, tax, service charges, tips, split-payment allocation, cash, card, mobile money, bank transfer, customer credit, and room-charge settlement. |
| Kitchen and recipes | Kitchen tickets by station, New → Preparing → Ready → Completed status transitions, recipe ingredients, expected-waste percentage, and atomic stock deduction when an order is sent to kitchen. Insufficient recipe inventory prevents dispatch. |
| Menu and commercial controls | Categories, menu items, recipe cost fields, modifier groups/options, combo-item composition, promotions, and full TZS pricing. |
| Reservations and customers | Customer profiles, hospitality guest linkage, loyalty balance fields, dining reservations, covers, expected duration, and table-overlap prevention. |
| Inventory and purchasing | Shared inventory-item linkage, recipe consumption stock movements, wastage stock movements, suppliers, purchase requests/lines, and stock-in movements when a request is received. |
| Staff and finance | HR employee linkage, Restaurant staff-role assignments, controlled shifts/opening cash/closing cash, payment records, POS transaction records, shared sales-payment records, journal entries, audit events, refunds, and bill-split records. |
| Hospitality integration | Orders can carry a hotel folio and Room Charge payment allocation; settlement posts a typed Dining line to the corresponding hospitality folio. |
| Security and audit | Active-profile role checks, tenant RLS reads, internal authorization helpers hardened against direct signed-in execution, authenticated action procedures, service-only alert reconciliation, audit events, and database-backed workflow validation. |

## Live database validation

Live Supabase validation confirmed **14** critical Restaurant tables and **5** protected Restaurant procedures: `restaurant_snapshot`, `restaurant_action`, `restaurant_reconcile_alerts`, `restaurant_operations_snapshot`, and `restaurant_operations_action`.

| Procedure | Live execute grants | Validation conclusion |
|---|---|---|
| `restaurant_snapshot()` | `authenticated`, `service_role` | Authenticated tenant read model; no anonymous grant. |
| `restaurant_action(text, jsonb)` | `authenticated`, `service_role` | Authenticated operational mutation model; no anonymous grant. |
| `restaurant_operations_snapshot()` | `authenticated`, `service_role` | Authenticated team, purchasing, modifier, promotion, split, and refund read model; no anonymous grant. |
| `restaurant_operations_action(text, jsonb)` | `authenticated`, `service_role` | Authenticated advanced operational mutation model; no anonymous grant. |
| `restaurant_reconcile_alerts(uuid)` | `service_role` only | Scheduled low-stock alert reconciliation is service-only. |

The live security advisor initially identified direct signed-in execution for the two internal authorization helpers. Forward-only migration `20260822_034_harden_restaurant_helper_privileges.sql` revoked those grants from `authenticated`; the advisor recheck no longer reported `restaurant_is_manager` or `restaurant_can_operate`. The advisor continues to list the intentional authenticated `SECURITY DEFINER` snapshot/action procedures; each derives tenant context and validates active roles and operational state internally.

## Automated validation evidence

| Command | Result |
|---|---|
| `pnpm check` | **Passed** after command-center and scheduled-handler integration. |
| `pnpm exec vitest run server/restaurantFnbContracts.test.ts --reporter=verbose` | **1 file passed; 7 tests passed.** Covers typed persistence, RLS/role protections, lifecycle invariants, inventory/finance/hospitality integration, advanced operations, scheduler hardening, and live route mounting. |
| `pnpm test` | **171 test files passed, 5 skipped; 672 tests passed, 8 skipped.** One obsolete legacy Restaurant route assertion was updated during this work; the rerun is release-green. |
| `pnpm exec vite build` | **Passed.** Existing optional analytics-variable and large dashboard-bundle warnings remain non-blocking. |
| Live schema/function/privilege checks | **Passed.** Typed tables and procedures are deployed; no Restaurant procedure has anonymous execution. |

## Workflow verification and controlled-data limitation

The secure persisted path implements the requested lifecycle: **outlet/table → order → kitchen dispatch → recipe stock deduction → preparation/serving → split payment or room charge → receipt references → POS transaction/journal/audit reporting**. The action procedures protect invalid states including unavailable or conflicting tables, invalid reservation windows, inactive menu items, insufficient recipe stock, invalid payment allocations, and unauthorized staff actions.

A dedicated browser-authenticated Restaurant test tenant/session is not available in the validation environment. To avoid generating dummy restaurant sales, customer records, stock movements, and journal entries in a live tenant through service credentials, no synthetic live E2E transaction was created. The automated contract suite and live schema/privilege checks validate the operational boundary without contaminating tenant data. A final acceptance workflow should be executed by an authorized Restaurant user in a non-production tenant after deployment.

## Activation prerequisites

| Capability | Required production step |
|---|---|
| Daily low-stock reminders | Deploy this release, then configure a daily protected heartbeat to POST to `/api/scheduled/restaurantAlerts`. The handler is cron-authenticated, idempotent, and processes each Restaurant tenant separately. No schedule was created before deployment. |
| Realtime service view | The command centre safely refreshes operational snapshots every 20 seconds and on demand. For push/WebSocket UX, introduce a provider-approved realtime subscription after deployment and load testing. |
| Recipe stock deduction | Link every menu item to the correct shared inventory item through recipe ingredients and configure positive shared-inventory reorder levels. Orders without recipe rows remain sellable but have no ingredient consumption to deduct. |
| Payments and receipts | Configure authorized cashiers and payment references for mobile-money/card providers. The module records payment method and reference; a provider-specific mobile-money collection webhook is deliberately not invented without approved credentials and callback contract. |
| Final acceptance | In a non-production tenant, perform table/order → KDS → serving → stock deduction → payment/room charge → receipt/journal review, then verify a purchase receipt, wastage, split bill, and refund workflow. |

## Repository scope

The release includes the new Restaurant Command Center, production migrations `032`–`034`, protected scheduled alert handler, route registration, automated contract suite, adjusted legacy routing contract, and this report. The distinct tenant-billing administrator audit report remains deliberately uncommitted.
