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

## Validation

The focused Finance regression suite passed with **2 files and 3 tests**, covering the running-ledger contract, server-before-state ordering, input preservation, and duplicate-submit protection. Static TypeScript validation also passed. A complete regression suite, production build, and authenticated non-destructive browser acceptance remain in the final validation phase.

No invoice, expense, payment, accounting setting, credential, RLS policy, external provider configuration, or Resend setting was changed while implementing this repair.
