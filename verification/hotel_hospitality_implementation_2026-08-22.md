# Hotel & Hospitality Module — Implementation & Verification

**Date:** 22 August 2026  
**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`  
**Scope:** Production-oriented, tenant-scoped Hotel & Hospitality foundation integrated into Smart Manager’s authenticated workspace, Supabase persistence, Employee Portal, Finance, Inventory, Procurement, POS, and document-reference boundaries.

## Delivery summary

The legacy browser-local Hotel Management implementation has been replaced by a modular `HospitalityWorkspace`. The workspace uses authenticated RPC calls to read confirmed hospitality and POS snapshots and routes all implemented mutations through secured database procedures. It no longer calculates bookings, check-in/out, folio amounts, or room state solely in local browser state.

| Capability | Delivery |
| --- | --- |
| Property and branch setup | Typed `hospitality_properties` records with branch reference, TZS currency, and `Africa/Dar_es_Salaam` defaults. |
| Rooms and availability | Typed room types and rooms; stay-window overlap procedure prevents double booking for assigned rooms. |
| Guest management and KYC | Guest profiles, nationality/contact details, loyalty linkage, and KYC document-reference records. |
| Reservations and front desk | Confirmed reservation lifecycle, check-in assignment validation, folio creation, check-out balance control, and housekeeping hand-off. |
| Housekeeping and maintenance | Checkout clean tasks, room release on completion, maintenance records, employee-assignment fields, and operational statuses. |
| Folios, billing, payments | Folios, immutable folio lines, payments, deposits/refunds/discount line types, TZS currency, finance reference, and outstanding-balance protection. |
| Dining and POS | Restaurant tables, menus, menu items, orders, order lines, kitchen state transitions, room-charge posting, minibar postings, and laundry records. |
| Events and guest engagement | Venues, events/banquets, guest requests, complaints, reviews-ready data boundary, loyalty accounts/adjustments, and notifications. |
| Access and audit | Tenant RLS on hospitality tables, authenticated snapshots, privileged operational commands, audit log events, and internal-helper access remediation. |

## Workflow controls

The reservation command validates a non-empty arrival/departure range and rejects overlapping confirmed or checked-in reservations for the same room. Check-in requires a confirmed stay and room assignment, moves the room to `Occupied`, and creates an open folio. Checkout refuses a non-zero folio balance unless an authorised caller explicitly supplies the controlled outstanding flag; it then closes the folio, marks the room `Dirty`, and creates a checkout-clean task.

Restaurant orders have typed statuses, can receive items only while editable, and can be posted to a guest folio only when ready or served. Minibar and laundry workflows persist their source record and can create linked folio charges. Service commands create guest requests, complaints, maintenance records, events, and loyalty adjustments with audit writes.

## Live verification

| Verification | Result |
| --- | --- |
| Hospitality core migration | Applied live: `20260822_018_hospitality_core.sql`. |
| POS and services migration | Applied live: `20260822_019_hospitality_pos_and_services.sql`. |
| Guest engagement migration | Applied live: `20260822_020_hospitality_guest_engagement.sql`. |
| Helper-access remediation | Applied live: `20260822_021_hospitality_helper_access_remediation.sql`. |
| Core snapshot smoke test | Passed; returned rooms, guests, reservations, folios, housekeeping, events, requests, complaints, notifications, and other core keys. |
| POS snapshot smoke test | Passed; returned tables, menus, menu items, orders, and order lines. |
| Helper exposure check | Passed; authenticated users cannot directly execute `hospitality_is_privileged` or `hospitality_check_room_available`, while the secured snapshot remains available. |
| Type check | Passed. |
| Production client build | Passed. Existing analytics-template and bundle-size warnings are unrelated to this change. |
| Regression suite | Passed: 9 targeted Hospitality, Employee Portal, and HR persistence tests. |

## Controlled production setup prerequisite

No property, room, guest, reservation, menu, or payment data was seeded into the live tenant. This preserves data integrity and avoids presenting artificial hospitality records as a real property operation. An authorised property manager should first create the property profile, room types, rooms, taxes/levies, menus, employees, and finance/inventory reference mappings. A controlled pilot can then validate a real booking → check-in → dining room charge → housekeeping → payment → checkout workflow using the deployment’s audit logs and financial reference fields.

## Security note

The database security advisor still reports inherited warnings for pre-existing public or authenticated `SECURITY DEFINER` functions outside the hospitality change set. The Hospitality module’s direct anonymous grants are revoked. Its protected action procedures are intentionally executable by authenticated users and enforce an inner role check; internal authorization and availability helpers are not directly executable by authenticated users.
