# Browser Export Acceptance Evidence

## Authenticated Inventory CSV export — 17 August 2026

The authenticated KMKM owner workspace opened the Inventory module and displayed one confirmed stock item. The **CSV** export control was used without editing inventory, changing filters, or opening a print or system save dialog.

The application displayed the success notice **“Exported 1 rows to inventory.csv.”** The browser download manager then showed a completed `inventory.csv` download from the published Smart Manager domain. This validates that the CSV action generates a browser-managed file from the visible confirmed inventory dataset rather than claiming a server-side folder or local data-store write.

| Acceptance step | Result |
| --- | --- |
| Authenticated Inventory CSV control | Passed |
| Confirmed row count in application feedback | `1` row |
| Browser download-manager record | Completed `inventory.csv` |
| Inventory record mutation | None |

## Deliberate limits

The POS receipt **Save as PDF** path remains deferred because it requires a browser/system print dialog. Physical 58 mm, 80 mm, and configured A4 printer-profile acceptance remains deferred until supported hardware is available. These boundaries prevent the application from falsely claiming control over user download locations, system printer selection, or physical printer output.
