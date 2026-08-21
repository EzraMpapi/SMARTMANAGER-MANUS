# Pharmacy Module Design Contract

## Scope and tenant boundary

The Pharmacy Module uses the existing Supabase tenant envelope for every pharmacy record: `id`, `company_id`, `name`, `status`, `amount`, `notes`, `data`, `created_at`, and `updated_at`. All new tables are protected by row-level security using `current_company_id()`. The server additionally resolves the authenticated profile before every protected procedure and rejects cross-company references.

## Domain records

| Area | Records | Primary responsibility |
|---|---|---|
| Master data | `phm_categories`, `phm_brands`, `phm_drugs`, `phm_suppliers` | Medicine identity, barcode, pricing, prescription and controlled-medicine flags, suppliers, and reorder policy. |
| Purchasing and receipt | `phm_purchase_orders`, `phm_purchase_order_items`, `phm_stock_receipts`, `phm_batches` | Supplier ordering, receipt evidence, lot/batch, purchase cost, shelf life, and accepted quantity. |
| Inventory control | `phm_stock`, `phm_stock_movements`, `phm_stock_transfers`, `phm_stock_adjustments` | FEFO-aware stock balance, immutable movement history, transfers, quarantine, and reasoned adjustments. |
| Clinical dispensing | `phm_dispense`, `phm_dispense_items`, `phm_controlled_medicine_register` | Prescription validation, partial or completed dispense, patient/prescriber linkage, controlled-medicine register, and traceable batch allocation. |
| Retail and financial operations | `phm_sales`, `phm_sale_items`, `phm_payments`, `phm_returns`, `phm_return_items` | Counter sales, payment method, tax, invoices/receipts, returns, supplier balances, and finance-facing totals. |
| Governance | `phm_notifications`, `phm_audit_logs` | Low-stock, expiry, controlled-medicine, and exception alerts with privacy-safe audit evidence. |

## Permission model

| Role group | Supported roles | Authorised operations |
|---|---|---|
| Pharmacy administration | Super Administrator, Organization Owner, CEO, Clinic Administrator, Pharmacy Manager | Full pharmacy access including configuration, pricing, audit review, and controlled-medicine governance. |
| Pharmacist | Pharmacist | Catalog and supplier read, clinical dispensing, controlled-medicine issuance, stock intake verification, batch/quarantine review, and operational reporting. |
| Pharmacy technician | Pharmacy Technician | Catalog read, stock receipt support, batch lookup, non-controlled dispensing preparation, and stock transfer requests. |
| Procurement | Procurement Officer, Inventory Manager | Supplier, purchase order, approved receipt, and supplier-balance workflows; no dispensing or controlled-medicine issue. |
| Cash and finance | Cashier, Billing Officer, Finance Manager, CFO | Sales, payment, invoice, receipt, return, supplier-balance, and finance reporting within their assigned scope. |
| Clinical read-only handoff | Doctor, Nurse | Prescription-status visibility only; neither role may change pharmacy stock, prices, payments, or controlled-medicine records. |

## Clinical and stock safeguards

Dispensing validates that the referenced patient and prescription are in the same tenant. Prescription-only medicines require a valid clinical prescription reference. Controlled medicines require a pharmacist-authorised action, prescriber reference, patient reference, batch allocation, and immutable register entry.

Stock is never decremented in the client. Protected server-side transactions allocate from eligible batches in **first-expiry-first-out** order and reject expired, quarantined, recalled, unavailable, or insufficient stock. Returns do not restore sellable stock without an explicit condition assessment; damaged or expired returns are quarantined. Every receipt, dispense, sale, transfer, return, and adjustment creates a movement and audit record.

## Tanzania-ready finance boundary

All monetary values use decimal TZS fields. Each sale captures a tax rate, tax amount, subtotal, discount, payment method, receipt number, invoice number, and insurance reference where applicable. Finance integration is an immutable cross-reference and audit boundary; the Pharmacy Module does not alter unrelated finance records or infer payment settlement.

## Existing system integration

The module consumes Healthcare patient, doctor, prescription, invoice, and insurance records only after tenant and permission checks. It interoperates with existing Inventory suppliers, warehouses, and stock infrastructure by cross-referencing rather than mutating arbitrary inventory records. The Pharmacy workspace replaces the legacy client-only `PharmacyManagementModule`, is lazy-loaded from the dashboard, and retains the Healthcare dispensing handoff.
