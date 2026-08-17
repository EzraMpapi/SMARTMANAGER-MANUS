# Finance Workspace — Confirmed-Write Boundary Upgrade

## Scope and Priority

Finance was selected as the next functional area after CRM because it governs invoice settlement, expense creation, expense status changes, expense deletion, receivables, and the cash-basis ledger. These are high-impact accounting workflows where a client-side success state without a confirmed server response would misrepresent the tenant’s financial position.

## Verified Defects and Repair

| Workflow | Previous behavior | Repair |
| --- | --- | --- |
| Mark invoice paid | The local invoice was marked paid before the configured server write returned. | The UI now waits for a confirmed update row and uses its returned status and paid amount before changing the invoice state. |
| Delete invoice | The local invoice was removed before server deletion completed. | The UI removes the invoice only after the delete request succeeds. |
| Create expense | A local draft was added and announced before Supabase confirmed the insert. | The UI inserts and announces only the returned canonical expense row. A failed form remains open with its input intact. |
| Expense status change | The local status changed before the server update completed. | The returned server row is required before the status updates. |
| Delete expense | The drawer and table could close before server deletion completed. | Both remain until a successful delete response; a failure presents an error and preserves the context for retry. |
| Duplicate submissions | The expense form and detail action controls had no in-flight protection. | Saving states now disable repeated expense-form and status controls while their server request is pending. |
| Cash-flow overview | The live workspace showed a fixed chart despite zero confirmed invoices and expenses. | The chart now derives from cash-basis ledger entries only; with no confirmed movement it renders an explicit empty state instead of sample values. |
| KPI period language | All-record Finance totals were labeled `MTD`. | KPI context now identifies confirmed record counts or confirmed-record totals and does not imply an uncalculated reporting period. |
| Cash-flow units and empty categories | The cash-flow copy named millions despite ledger values being stored and displayed in TZS thousands, while a category panel was blank with no expenses. | The chart and tooltip now consistently state TZS thousands, and expenses by category has an explicit confirmed-data empty state. |

## Validation

The focused Finance regression suite passed with **2 files and 4 tests**, covering the running-ledger contract, server-before-state ordering, input preservation, duplicate-submit protection, confirmed-data cash-flow calculation, and accurate KPI context. The complete suite passed with **90 files / 299 tests**, alongside 5 intentionally gated files and 8 skips. Static TypeScript validation and the bounded-heap production build both passed, with 2,653 modules transformed.

Authenticated browser acceptance had first exposed the static cash-flow chart under an empty live Finance workspace. That chart has now been replaced; final post-release browser acceptance remains the last verification step before the Finance checklist entry is completed.

## Deployment Verification Note

Immediately after the final release checkpoint, the authenticated browser was still served a prior dashboard bundle: it retained the fixed cash-flow chart and `MTD` labels, while source inspection confirmed the new implementation. This is being treated as a deployment/cache propagation state, not as successful acceptance. The workspace will be rechecked only after a fresh published bundle contains the neutral cash-flow state.

The refined Finance implementation passed the complete regression suite again with **90 files / 299 tests** and the bounded-heap production build again with 2,653 modules transformed. The final build also contains the explicit no-cash-movement state, TZS-thousands chart labels, and the confirmed expense-category empty state.

## Production Entry Cache Mitigation

The public origin continued to reference an earlier Vite entry-script hash after multiple checkpoints, including cache-busting navigation and hard reloads. The production static server now applies `Cache-Control: no-store, max-age=0, must-revalidate` to HTML responses, including the single-page-app fallback, while leaving hashed static assets on their normal immutable path. This ensures current entry HTML can reference the latest hashed client assets rather than pinning users to an obsolete asset graph.

The mitigation adds a dedicated regression test. The complete suite now passes with **91 files / 300 tests**, alongside 5 intentionally gated files and 8 skips; TypeScript and the bounded-heap production build both pass.

No invoice, expense, payment, accounting setting, credential, RLS policy, external provider configuration, or Resend setting was changed while implementing this repair.
