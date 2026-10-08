# KMKM DEMO DATA Seed Verification — 24 August 2026

## Scope and safety boundary

The live SMART MANAGER account `ezraincome@gmail.com` remains attached to the existing `KMKM` company (`0d550b0b-8f57-45d2-8d1b-df1a0f7a5ec6`). The seed intentionally adds persistent, clearly labeled Tanzanian demonstration records **inside that tenant only**. It does not create a company, change `profiles.company_id`, change ownership or memberships, modify subscription/billing configuration, alter RLS, update existing business rows, or delete any data. The implementation is recorded in [`supabase/demo_seed_kmkm_20260824.sql`](../supabase/demo_seed_kmkm_20260824.sql) [1].

The seed is one transaction and uses stable UUIDs plus `ON CONFLICT DO NOTHING`. Every seeded object carries the `smartmanager_demo_20260824` marker in JSON metadata where the table supports metadata, and the user-facing names/notes use `DEMO` or `DEMO DATA`. This makes reruns safe and provides a deterministic cleanup key without touching non-demo records [1].

## Persisted coverage

The live post-write verification returned **67 metric checks representing 72 persisted demo records**, with no zero-count metric [2]. The coverage is summarized below.

| Area | Persisted records | Connected examples |
|---|---:|---|
| Branch and inventory | 6 | Dar es Salaam CBD branch, central warehouse, supplier, two TZS stock items, opening movement |
| CRM, sales, procurement, expense, POS | 13 | Customer and supplier contacts; sales order → order item → invoice → invoice item → M-Pesa payment; purchase order and item; expense; POS shift, transaction, and item |
| HR and payroll | 9 | Department → position → employee → shift/attendance; August 2026 payroll run → payroll item → payslip; approved leave request |
| Hospitality | 9 | Branch → Ocean View Hotel → room type → room; guest → checked-in reservation → folio → room folio line → M-Pesa payment; housekeeping task |
| Restaurant and F&B | 4 | Hotel-linked outlet → table → menu item linked to inventory → served dine-in order linked to the guest folio |
| Fleet | 3 | Toyota Hiace vehicle → airport-transfer trip and scheduled preventive maintenance |
| Healthcare and pharmacy | 4 | Patient → appointment; pharmacy drug → stock record |
| School | 4 | Academic year, class, teacher, and student with class metadata |
| Microfinance | 2 | VICOBA client → disbursed TZS working-capital loan |
| Banking | 2 | Bank customer → posted M-Pesa transaction |
| Finance / general ledger | 6 | Three TZS accounts → posted balanced journal batch → two journal lines |
| Documents, notifications, workflows, marketing, ecommerce, network, support | 10 | Reference document, notification rule/log, invoice follow-up workflow, campaign, product/order, RFQ, support ticket/message |
| **Total** | **72** | **67 bounded metric checks; all non-zero** |

Amounts, currencies, dates, locations, and references are Tanzania-oriented. Monetary fields use `TZS`; locations include Dar es Salaam, Msasani, Masaki, Kariakoo, and Julius Nyerere International Airport. The payroll demonstration uses a TZS 2,500,000 gross example and records the previously verified statutory-rule labels (`TZ_PAYE`, `NSSF`, `WCF`, and `SDL`) as demo metadata; it does not change statutory configuration [1].

## Relationship verification

The live relationship checks confirmed all requested critical chains and the account tenant linkage [3]. Each check returned the expected positive result.

| Verification | Result |
|---|---:|
| `ezraincome@gmail.com` profile still points to KMKM | 1 matching profile |
| Sales order → order item → invoice → invoice item → sales payment | 1 complete chain |
| Reservation → guest → folio → folio line → hospitality payment | 1 complete chain |
| Restaurant order → outlet → table → hotel folio | 1 complete chain |
| HR employee → payroll item → payroll run → payslip | 1 complete chain |
| Finance journal batch → journal lines → chart-of-accounts records | 2 linked journal lines |

## Security and tenancy verification

The seed was first executed as a rollback-only transaction against the live Supabase database and completed without a schema or constraint error. The same reviewed SQL was then executed with `COMMIT`. Post-write reads were bounded to the KMKM company UUID and stable demo IDs [2].

Representative live checks showed RLS remains enabled on `branches`, `inventory_items`, `sales_orders`, `hr_employees`, `hospitality_reservations`, `restaurant_orders`, `flt_vehicles`, `hc_patients`, `mfi_clients`, `fin_accounts`, `workflows`, and `support_tickets`. Existing policy counts were present on each checked table; no RLS policy was created, removed, weakened, or bypassed by this seed [4].

No authenticated frontend/browser session was used in this operation. Therefore, this evidence confirms database persistence, tenant linkage, relational integrity, and representative RLS posture; it does **not** claim that a dashboard or module screen was visually observed after login. A normal login as `ezraincome@gmail.com` should be used for that final UI visibility check [3] [4].

## Protected module exclusion

Direct Community Groups/VICOBA group-member rows were intentionally omitted. The live `community_groups_assert_relationships()` trigger rejected raw direct inserts that lacked its required authorized module-context mechanism. The seed does not disable or bypass that trigger. MFI client and loan records remain included, and the omission is documented here rather than forcing an unsafe write.

## Rerun and cleanup approach

Rerunning the seed is idempotent because all demo records use stable identifiers and `ON CONFLICT DO NOTHING`. Cleanup, if later requested, should be performed as a separately reviewed, explicitly scoped deletion of rows carrying the `smartmanager_demo_20260824` marker or the documented stable UUID set, after checking dependent foreign keys. This seed itself performs no updates or deletes [1].

## Evidence references

[1]: ../supabase/demo_seed_kmkm_20260824.sql "KMKM-only persistent demo seed"
[2]: /home/ubuntu/.mcp/tool-results/2026-08-24_10-56-56.175163871_supabase_execute_sql_405d32e5.json "Live Supabase bounded post-write count verification"
[3]: /home/ubuntu/.mcp/tool-results/2026-08-24_10-58-12.154779671_supabase_execute_sql_7ad7d582.json "Live Supabase relationship verification"
[4]: /home/ubuntu/.mcp/tool-results/2026-08-24_10-58-35.309236357_supabase_execute_sql_076b8381.json "Live Supabase RLS and tenant-linkage verification"
