# SMART MANAGER demo-data commissioning report

**Date:** 26 August 2026  
**Environment:** Live Supabase project `rlhngsrihahhyxnjxrxm`  
**Approved tenant:** KMKM (`0d550b0b-8f57-45d2-8d1b-df1a0f7a5ec6`)  
**Owner profile used for accounting/audit references:** `cfa31225-6481-4cc3-9af3-6f009a9259cb`  
**Seed marker:** `smartmanager_demo_full_20260826_v1`

## Executive result

A guarded, additive synthetic-data seed was implemented at [`supabase/seed/20260826_full_demo_commissioning.sql`](../supabase/seed/20260826_full_demo_commissioning.sql). It was first executed in a rollback-only transaction against the live schema, then executed once with the reviewed commit gate. Post-commit verification returned the expected record profile and zero failures in the bounded integrity checks.

The live database was not empty. It contained seven companies, seven workspaces, existing tenant data, and a mixed KMKM tenant with both earlier demo rows and non-demo rows. For that reason the seed did **not** create a company, reassign the owner profile, modify subscriptions, update existing rows, delete rows, truncate tables, alter RLS, change grants, create auth users, create storage objects, or call payment/SMS/WhatsApp/email providers. The chosen boundary was the owner’s already accessible KMKM tenant, and every new row carries the new marker or a deterministic `DEMO-*` identifier.

## Populated coverage

The verified post-commit counts are shown below. They are counts of newly marked synthetic rows, not total tenant rows.

| Module/table | Records | Relationship or purpose |
|---|---:|---|
| Inventory items | 320 | Product catalogue with SKU, stock, reorder and supplier metadata |
| Inventory stock movements | 320 | Opening stock movement per synthetic product |
| CRM contacts / leads / interactions | 150 / 100 / 150 | Customer pipeline and follow-up visibility |
| Sales orders / order lines | 500 / 1,000 | Two-line order history with deterministic customer and product references |
| Sales invoices / invoice lines / payments | 450 / 900 / 300 | Issued, paid and overdue invoice profiles with simulated payment references |
| Procurement orders / lines | 120 / 240 | Supplier and warehouse-linked procurement metadata |
| Finance expenses | 250 | Tanzania-oriented operating-expense history |
| POS shifts / transactions / items | 12 / 120 / 240 | Legacy POS dashboard history with simulated tender metadata |
| HR employees | 40 | Synthetic employees with no linked auth identity |
| Payroll runs / items / payslips | 6 / 240 / 240 | Six monthly payroll cycles with unique payroll-item and payslip links |
| HR attendance / leave requests | 200 / 30 | Attendance and approval-state visualisation |
| Bank customers / transactions | 120 / 120 | KYC-labelled synthetic customers and simulated transactions |
| MFI clients / loans / savings | 120 / 120 / 120 | Credit and savings lifecycle examples |
| MFI schedules / repayments | 240 / 120 | Due/paid schedule and repayment examples |
| VICOBA members / meetings / loans | 80 / 24 / 40 | Synthetic VICOBA summaries; no protected Community Groups raw writes |
| Projects / tasks | 12 / 60 | Delivery tracking examples |
| Healthcare patients / appointments | 60 / 120 | Synthetic, consent-labelled healthcare examples |
| School academic year / classes / teachers / students | 1 / 10 / 10 / 80 | Education dashboard examples |
| Documents / notifications / workflows | 20 / 60 / 6 | In-app/reference records only; no external delivery |

The seed therefore adds more than the minimum requested volume in the main operational areas, including 500 sales orders, 320 products, 150 CRM contacts, 120 bank/MFI examples, and 40 employees. It intentionally does not claim that every one of the 553 public tables is populated: many tables are specialized, protected, or require module-specific procedures and context that should not be bypassed with raw SQL.

## Relational and accounting verification

The post-commit verification query checked the following conditions:

| Check | Result |
|---|---:|
| Sales order-line orphans | 0 |
| Sales invoice orphans | 0 |
| Sales payment orphans | 0 |
| Payroll item orphans | 0 |
| Payslip orphans | 0 |
| Journal-line orphans | 0 |
| Unbalanced posted demo journals | 0 |
| Cross-tenant demo orders | 0 |

The normalized sales chains use live composite foreign keys: `sales_order_items → sales_orders`, `sales_invoices → sales_orders`, `sales_invoice_items → sales_invoices`, and `sales_payments → sales_invoices`. Finance rows use valid `fin_accounts`, balanced Posted `fin_journal_batches`, and exactly-one-sided `fin_journal_lines`. Payroll rows use the live payroll-run and employee relationships and the unique payslip-per-payroll-item rule.

A post-commit security query confirmed `relrowsecurity = true` on all 15 checked core tables, with existing policy rows still present. The seed did not create, remove, or alter any RLS policy or grant. The query was read-only and did not attempt to bypass tenant controls.

## Safety and privacy controls

The seed is stored under `supabase/seed`, not `supabase/migrations`; it is not part of the normal deployment migration chain. It requires all of these same-session settings:

```sql
SET LOCAL app.demo_seed_environment = 'controlled_existing_tenant';
SET LOCAL app.allow_demo_seed = 'true';
SET LOCAL app.demo_seed_confirmation = 'I_UNDERSTAND_THIS_ADDS_SYNTHETIC_DATA';
SET LOCAL app.demo_seed_company_id = '0d550b0b-8f57-45d2-8d1b-df1a0f7a5ec6';
SET LOCAL app.demo_seed_owner_profile_id = 'cfa31225-6481-4cc3-9af3-6f009a9259cb';
SET LOCAL app.demo_seed_commit = 'true';
```

The SQL also hard-checks the approved company and owner profile, verifies the original demo branch and warehouse, and uses `ON CONFLICT DO NOTHING`. The seed contains no `UPDATE`, `DELETE`, `TRUNCATE`, `DROP`, auth-user creation, provider call, storage write, RLS policy change, or grant change. Synthetic emails use the reserved `.invalid` domain where email-shaped metadata is needed. Phones, national IDs, provider references, payment references, and patient/student metadata are clearly synthetic and must never be treated as real records.

Community Groups/VICOBA protected relationship tables were not written directly. The repository’s earlier live seed report documented that the relationship trigger rejects raw direct inserts without the authorized module context. Those workflows should be populated through the application’s supported procedures when they are specifically needed.

## Repeat and cleanup procedure

To re-run the same fixture, use a transaction in a controlled SQL session, set the six required values above, and execute the file. Re-runs are idempotent by stable UUIDs and `ON CONFLICT DO NOTHING`. The fixture intentionally performs no cleanup. If removal is later requested, prepare a separate reviewed delete plan using the marker plus the stable UUID set, inspect dependent foreign keys, obtain explicit approval, and execute it only as a controlled operation. Never add cleanup SQL to the seed itself.

## Evidence

- Dry-run result: rollback-only execution completed without a schema, UUID, foreign-key, check, or trigger error.
- Live verification result: `/home/ubuntu/.mcp/tool-results/2026-08-26_18-26-51.720317052_supabase_execute_sql_f1455ee4.json`.
- Live schema inventory: `/home/ubuntu/.mcp/tool-results/2026-08-26_18-12-51.095992073_supabase_list_tables_75d016d0.json`.
- Discovery and boundary notes: `/tmp/demo_seed_discovery_findings.md`.
- The project’s previous 72-record KMKM seed remains documented separately in `KMKM_DEMO_DATA_SEED_2026-08-24.md`.

## Validation evidence

The focused `server/demoSeedContract.test.ts` passed all 3 tests. `pnpm check` passed and `VERCEL=1 pnpm build` passed; the build retained an existing large-dashboard-chunk warning. A full Vitest invocation completed with 245 passing test files, 7 skipped files, and 11 failing tests in existing dashboard/UI contract areas; therefore this commissioning change does not claim a clean full-suite result or that those unrelated contract failures were repaired.

## Limitations

This operation validates live persistence, relational integrity, the approved tenant boundary, and seeded coverage. It does not claim that every dashboard was visually opened after login, that external payment/email/SMS/WhatsApp providers were contacted, or that protected workflows were exercised through every UI screen. Those require authenticated browser tests and provider-specific test credentials, which were intentionally not introduced by this data-only commissioning operation.
