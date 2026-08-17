# POS Receipt Browser-Dialog Handoff Evidence

## Scope

On 17 August 2026, with user approval, one additional temporary QA POS sale was created in the confirmed KMKM staging workspace solely to test the receipt-output handoff. The test used the existing QA item, a guest cash payment of TZS 1k, and the existing Ezra Income shift. No physical printer was selected and no file was saved.

## Browser-dialog handoff

The receipt panel appeared after the confirmed sale with receipt number `POS-20260817-BFF4`, one QA line item, and the receipt-output disclosure stating that the browser or system controls printer selection and save location. The POS output mode was selected as **Save as PDF**, then the receipt’s **Print Receipt** control was invoked.

The browser automation call timed out while the print handoff was active, which is consistent with a system-level print dialog taking control. A subsequent dismiss attempt also timed out, so the browser session was closed without selecting a printer, confirming a system dialog, or saving a file. This validates the application-to-browser handoff, but not the operating-system dialog’s final Save action.

| Check | Result |
| --- | --- |
| Receipt renders after server-confirmed sale | Passed |
| Save-as-PDF output mode selectable | Passed |
| Application invokes browser print handoff | Passed; browser automation blocked while handoff was active |
| Physical printer selected | No |
| PDF saved | No |

## Cleanup

The temporary transaction and its line, commit, and synchronization event were removed through the approved cleanup path. Final server verification returned zero matching transaction, item, commit, and sync-event records. The QA item’s quantity on hand was restored from two to three.

## Remaining device checks

Final operating-system dialog confirmation, actual PDF file creation, physical 58 mm/80 mm/A4 output, and mobile-device validation remain external-device prerequisites. The application does not claim that it can select a printer, control a system print dialog, or write directly to the user’s device folders.
