# Focused POS Retry, Denial-Recovery, and Device-Profile Acceptance

## Scope and safety boundary

This acceptance run covered only the user-prioritized controls: a controlled POS transport failure and recovery, a sanctioned **no-write** denial-recovery path, and browser-safe printer profile settings. Resend was not inspected, changed, or invoked. The physical mobile device and physical printer portions remain intentionally unclaimed because no supported hardware was attached to the test environment.

| Check | Verified result | Data impact |
| --- | --- | --- |
| POS transport failure | A one-time rejection scoped to `complete_pos_sale` created `POS-20260817-B0FC` as **Pending sync**. The user interface explicitly stated that it was not completed or counted in revenue. | No transaction existed in Supabase while pending. |
| POS recovery | Restoring normal transport and selecting **Retry sync** created one completed transaction, line, commit, and sync event. | QA item changed from 3 to 2 only after server confirmation. |
| POS cleanup | The temporary transaction, line, commit, sync event, and stock movement were removed. | Independent query confirmed every temporary row count was 0 and the QA quantity was restored to 3. |
| No-write denial recovery | A fully populated temporary Invoice draft received a one-time client-scoped synthetic 403 for only its header write. The draft remained open with every field preserved. | Independent server query returned no matching Invoice. The browser request path was restored and the draft was cancelled without saving. |
| Printer profile | The POS profile accepted **58 mm**, **80 mm**, and **A4** receipt widths; 58 mm plus Save-as-PDF was exercised locally, then restored to 80 mm browser printing. | Device preference only; no sale, file, credential, payment, or server record was created. |

## Controlled POS transport-retry result

The temporary sale was composed from the existing `QA POS Acceptance Item 20260816` in the authenticated KMKM staging workspace. The initial `complete_pos_sale` request was intentionally rejected once in the browser and nowhere else. The queue displayed a retryable **Pending sync** entry and a read-only Supabase check returned no transaction. This confirms the application did not misrepresent a failed transport attempt as a completed sale.

After normal transport was restored, a single retry confirmed the sale and rendered a completed receipt. Supabase showed one transaction with idempotency key `b61ba56f-6978-482e-8035-fd08dd8db233`, one line, one commit, and one sync event. Cleanup was executed with the exact company scope and record identifiers. The final verification returned zero rows for the temporary transaction artifacts and restored the QA item’s `qty_on_hand` to `3`.

## No-write denial-recovery result

The test did **not** weaken RLS, change a role, impersonate another tenant, or attempt an unauthorized server write. Instead, a one-time `403 permission denied` response was injected only into the temporary Invoice header request. The interception was consumed, all form fields remained visible in the open draft, the request implementation was restored immediately, and Supabase returned no matching Invoice row. This demonstrates the essential recovery boundary: a denied write does not close the form, does not claim success, and does not create a hidden local or server record.

## Mobile and printer boundary

The browser session can validate the device-independent receipt configuration and browser handoff, including the 58 mm, 80 mm, and A4 layout contract. It cannot validate a physical printer, actual mobile browser input, or printer-driver outcome without an attached supported device. Those physical checks remain a deployment acceptance item rather than a simulated success.
