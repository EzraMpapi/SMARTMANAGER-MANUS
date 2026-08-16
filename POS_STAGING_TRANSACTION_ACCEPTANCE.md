# POS Staging Transaction Acceptance Protocol

This protocol validates the **real transactional** POS flows only in a separately approved staging workspace. It is intentionally not an unattended browser bot: opening shifts, completing sales, issuing returns, and moving cash make persistent stock and audit changes even in test environments. A designated operator must review the approved product, shift, amounts, and receipt references before each write.

## Environment verification gate

The public application domain does not itself establish that the active workspace is non-production. Before creating any QA record, the designated operator must confirm that the currently authenticated company is a dedicated staging workspace. If the environment cannot be positively identified as staging, the acceptance process stops without creating a product, shift, sale, cash movement, or return.

During the user-confirmed staging session, the POS surface showed an existing open shift for **Ezra Income** with a 1k opening float and no discoverable product. The QA flow must not close or alter that pre-existing shift. It may use the already open staging shift only after creating a clearly labelled, isolated QA inventory product and then remove all QA records after evidence capture.

## Safety preflight

Run the preflight with the exact staging identifier, approved test-product barcode or SKU, and approved shift label. Without the final acknowledgement flag, it emits the test plan only and creates no record.

```bash
node scripts/preparePosStagingTransactionAcceptance.mjs \
  --environment=staging \
  --test-product=<approved-barcode-or-sku> \
  --test-shift=<approved-shift-label>
```

After the designated operator confirms the values, rerun the same command with `--approved-staging-write`. The utility continues to provide the ordered checklist rather than clicking write controls, preserving cashier accountability and preventing accidental test data creation.

## Operator checklist

| Step | Expected server-confirmed result |
|---|---|
| Open shift | A `pos_shifts` record with the approved opening float; no duplicate open shift. |
| Scan and split sale | Exact product match, valid allocation, calculated change, confirmed sale ID, reduced inventory only after confirmation. |
| Hold and resume | Held cart remains excluded from inventory, revenue, receipt, and audit totals until it is converted. |
| Cash movement | Pay-in and pay-out are linked to the active confirmed shift and update expected cash. |
| Receipt | Browser output uses the counter-local profile; the receipt shows allocations and change. |
| Return | Confirmed return ID, bounded returned quantity, inventory restored only after RPC confirmation. |
| Shift close | Counted cash, expected cash, variance, and Z-report are visible. |
| Reconciliation | Only server-confirmed synchronized or attention-required events appear; device-only queues remain explicitly separate. |

The operator should retain only non-sensitive transaction IDs and the final Z-report reference in the staging release record. Do not include customer payment data, access tokens, or printer credentials.
