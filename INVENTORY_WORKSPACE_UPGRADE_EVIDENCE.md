# Inventory Workspace — Confirmed-Stock Persistence Upgrade

## Scope and Priority

Inventory was selected after Finance because stock quantities directly affect sales availability, reorder decisions, stock valuation, warehouse operations, and POS behavior. The review targeted configured-workspace behavior where an optimistic local quantity or item record could diverge from the tenant’s confirmed server state after a rejected write.

## Verified Defects and Repair

| Workflow | Previous behavior | Repair |
| --- | --- | --- |
| Add inventory item | A local item appeared and the form closed before Supabase confirmed the insert. | The table now receives only the canonical row returned by the server. A failed form remains open with its entered values available for retry. |
| Bulk import | Imported drafts were added locally before the batch insert completed. | Configured imports now wait for the returned server rows before adding them to the stock list. Failed selected rows remain in the import flow for retry. |
| Manual stock adjustment | Quantity and selected-item state changed before the server update. | Quantity now changes only after the returned server item confirms the update. A rejected update leaves the visible quantity unchanged. |
| Adjustment audit event | The mutation path could imply a fully recorded adjustment even if the movement audit insert failed after the item update. | The UI distinguishes a confirmed quantity update from an unconfirmed movement-history event and directs the user to reconcile the item before relying on audit history. |
| Item deletion | The item disappeared locally before the server deletion was confirmed. | The item remains visible until a confirmed delete response arrives; a failed delete keeps the drawer and row available for retry. |
| Repeated actions | Inventory form and detail actions could be sent repeatedly while a request was in flight. | Creation, adjustment, and deletion controls now use saving states to prevent duplicate submissions while retaining failure context. |

## Validation

Focused Inventory persistence contracts passed with **1 file / 2 tests**, covering server-before-state ordering, failure preservation, and in-flight controls. Static TypeScript validation also passed. The complete suite passed with **92 files / 302 tests**, alongside 5 intentionally gated files and 8 skips. The bounded-heap production build passed with 2,653 modules transformed. Authenticated non-destructive browser acceptance remains the final validation phase.

No inventory item, stock movement, supplier, warehouse, POS record, RLS policy, credential, external provider setting, or Resend setting changed during this repair.
