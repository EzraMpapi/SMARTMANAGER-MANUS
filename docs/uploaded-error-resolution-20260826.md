# Uploaded Banking/MFI and AI Assistant Error Resolution

**Date:** 2026-08-26
**Scope:** Targeted production-safe repairs for the Banking/MFI and Business Consultant failures evidenced in the uploaded photographs.

## Resolved issues

| Uploaded symptom | Verified cause | Repair | Data-safety result |
|---|---|---|---|
| Banking/MFI route stopped at `Coins is not defined` | The share-purchase button rendered Lucide’s `Coins` icon without importing it. | Added the missing `Coins` icon import. | Rendering-only fix; no business record, schema object, or permission changed. |
| `paymentInstructions` was reported as unavailable | The snapshot requested a non-existent `created_at` column from the live `bank_payment_instructions` table. The live contract provides `requested_at` instead. | Removed the unsupported column from the snapshot selection and retained `requested_at.desc` for ordering. | Restores a valid authenticated tenant-scoped read; no financial figure or payment instruction is created. |
| Account-opening form showed only **Select account type** | The workspace contained no recorded account types. The previous UI did not explain the prerequisite. | Added a visible status message and **Configure account type** action that takes an authorized user to the existing configuration form. | No seed account product was invented; the open-account form remains disabled until a real account type exists. |
| Business Consultant showed an unreachable-assistant toast with no nearby recovery control | The client restored the prompt after a failed provider request but had no inline retry state. | Added an accessible alert that retains the failed question and offers **Try again**. | No request is fabricated, no provider details or credentials are exposed, and the server retains its existing rate-limit and error mapping. |

## Live Supabase dependency evidence

Read-only metadata inspection of the active project confirmed that `bank_account_types` and `bank_payment_instructions` both exist, have RLS enabled, and use tenant select/write policies. `bank_payment_instructions` exposes `requested_at`, `confirmed_at`, and the required payment fields but not `created_at`. The application fix therefore aligns the query with the deployed schema; it does not apply SQL or change a policy.

> The empty account-type screen is a configuration state, not evidence that a default product should be created. The repair deliberately guides authorized users to configure one through the existing workflow.

## Files changed

| File | Purpose |
|---|---|
| `client/src/components/BankMfiWorkspace.jsx` | Imports `Coins` and adds the no-account-type recovery guidance. |
| `server/bankMfiOperations.ts` | Removes unsupported `created_at` from the payment-instruction REST projection. |
| `client/src/BusinessSphereDashboard.jsx` | Adds an accessible client-side AI retry state. |
| `server/bankMfiWorkspace.contract.test.ts` | Guards the Banking/MFI icon import, verified projection, and account-type recovery surface. |
| `server/assistantReachability.contract.test.ts` | Guards the safe failed-question retry behavior. |
| `docs/uploaded-error-evidence-20260826.md` | Preserves photo findings and the schema dependency audit. |

## Validation results

| Validation | Result |
|---|---|
| Focused Banking/MFI, Smart Assistant, and new recovery contracts | Passed: 4 files and 10 tests. |
| TypeScript | Passed: `pnpm check`. |
| Full serialized regression with a one-worker thread pool | Passed: 248 files and 1,015 tests; 7 files and 15 tests skipped because they are environment-gated. |
| Repository-to-live schema verifier | Passed: 201 referenced tables, 536 deployed tables, and no missing table, tenant-column, or critical-table issue. |

The initial fork-pool full-suite attempt ended with a generic worker exit after 199 files, despite passing all tests completed to that point. Re-running serially with one thread completed the full suite successfully. No production data, database migration, RLS policy, view, or RPC function was modified.
