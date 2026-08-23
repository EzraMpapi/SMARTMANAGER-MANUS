# Smart Manager Hospitality Architecture

## Core model

The hospitality module uses typed, company-scoped `hospitality_*` records. `hospitality_properties` own room types, rooms, rate plans, taxes, amenities, tables, venues, and operational configuration. `hospitality_guests` owns guest profile and KYC reference metadata. `hospitality_reservations` own arrival/departure, adults/children, booked room type or room, rate, status, and a linked `hospitality_folios` record.

A reservation moves through `Draft` → `Confirmed` → `Checked In` → `Checked Out` or `Cancelled` / `No Show`. Availability is computed from confirmed and checked-in stay windows. A range-overlap guard prevents double booking of a specific room. Check-in assigns an available room and moves the room to `Occupied`; check-out requires a balanced or explicitly permitted folio, moves the room to `Dirty`, and creates a housekeeping task.

## Commercial and operational flows

Folio lines are immutable commercial events: room charges, restaurant/POS charges, minibar, laundry, event, discount, tax, deposit, refund, and payment. The ledger computes payable totals rather than trusting browser totals. Hospitality payments use TZS by default and carry a reference, method, and allocation to a folio. The module can store finance document references for synchronisation without coupling its integrity to a front-end action.

Dining uses typed restaurant tables, menus, orders, order lines, kitchen statuses, and room-charge references. Inventory, procurement, laundry, supplier, event/banquet, loyalty, guest request, complaint, and review records remain typed and tenant-scoped, with external ERP record references where existing modules provide them.

## Security and audit

Every table uses RLS. Employees see only their assigned operational records; privileged HR/owner/manager roles can configure properties and make financial postings. A `hospitality_snapshot` function returns only the viewer-authorised operating view. A single `hospitality_action` procedure validates transitions, writes audit events, emits notifications, and returns confirmed record IDs.

## Tanzania configuration

All commercial records default to `TZS` and `Africa/Dar_es_Salaam`. Tax/levy rows are effective-dated property records; receipts, invoices, payment methods, deposits, and refunds contain reference fields suitable for local receipt/invoice and payment reconciliation workflows.
