# POS Receipt Design and Integrity Traceability

This document maps `pasted_content_6.txt` to Smart Manager’s Point of Sale receipt flow. The receipt is rendered only after a confirmed POS transaction reaches the receipt panel. Its printed document consumes the sale’s confirmed line items, subtotal, VAT, total, payments, payment references, returns, change, configured business information, printer profile, and receipt copy count.

| Receipt requirement | Result | Integrity boundary |
| --- | --- | --- |
| Receipt number and ISO timestamp | **Implemented.** The printed receipt presents the confirmed transaction receipt number and an ISO 8601 timestamp when the POS record supplies a valid date. | A missing or invalid timestamp is labelled **Not recorded** rather than replaced with a generated business time. |
| Business, customer, item, tax, and payment details | **Implemented from configured or confirmed fields.** The print document presents only present company contact details, customer details, item quantity/unit/amount, VAT from the shared `TAX_RATE`, total, payment allocation, and reference. | Missing company/customer fields are omitted; they are not synthesized. Tax is calculated through the same POS receipt total contract rather than a receipt-local hard-coded rate. |
| Professional print layout | **Implemented.** The receipt supports 58 mm, 80 mm, or A4 profile widths, configured logo/footer, multiple copies, itemized totals, payment and return blocks, and print colors. | Values are HTML-escaped before entering the print window, preventing a customer name, item name, company field, or payment reference from altering the document markup. |
| Printer support | **Implemented within browser limits.** The print panel opens the native print dialog and honors the configured paper width, copy count, and PDF-only guidance. | Browser code cannot confirm that a physical printer accepted, printed, or retained a receipt. Hardware acceptance remains device validation work. |
| QR code, barcode, digital signature, or public verification | **Deferred.** | These require a server-verifiable receipt identity, public or authenticated verification endpoint, signing key management, and fraud/expiry rules. A decorative code would not prove a payment. |
| Direct email, SMS, or WhatsApp receipt delivery | **Not claimed as automatic.** Existing composer handoffs remain user-confirmed. | Automated delivery requires a configured, verified provider and durable delivery/audit records. |

The document makes no tax-law certification claim. Businesses remain responsible for their configured tax registrations, local retention rules, and any jurisdiction-specific fiscal-device integration.
