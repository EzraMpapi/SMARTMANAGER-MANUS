# Sales Screenshot Error Notes

## Source image review — 17 August 2026

The supplied Sales Order screenshot is a 3456 × 4992 portrait image and was reviewed in five ordered overlapping crops. It shows the lower portion of the Sales Order form: date field, quotation reference area, line-item section, Add item control, rate/discount inputs, and totals.

The error toast in crop 4 is readable and states: **“Creating the order failed. The server did not confirm this change. Details: Could not find the ‘issue_date’ column of ‘sales_orders’ in the schema cache.”** The final crop contains only the lower device bezel and photo metadata.

This establishes a concrete payload-to-schema mismatch affecting Sales Order creation. It does not establish whether Invoice creation has the identical mismatch; that will be verified against the source and live schema separately.

The second 3456 × 4992 screenshot corroborates the same Sales Order context. Its first two ordered crops show the New Sales Order form with customer `NMB`, order date `07 / 02 / 2026`, quotation reference `QT-90`, and a line item. Its third crop independently repeats the same `sales_orders.issue_date` schema-cache error. The final two crops contain only the device and photo metadata.

## Live schema verification and repair

Direct schema inspection confirmed the screenshot diagnosis: `sales_orders` supported `order_date` but not `issue_date`. It also identified broader contract drift: the live invoice and Sales line-item tables were still generic and lacked the document fields and relationships the application already uses.

An additive migration repaired the Sales document contract. The code now sends `order_date` only for Sales Orders and retains `issue_date` only for quotations and invoices. The migration adds the required typed columns and company-scoped foreign-key relationships for headers, line items, payments, subscriptions, and order returns without dropping a table, removing a column, changing an RLS policy, or changing existing rows. Post-migration verification confirms the required fields exist and RLS remains enabled on Sales Orders, Invoices, line items, and payments.
