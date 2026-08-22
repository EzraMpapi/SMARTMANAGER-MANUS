# Smart Manager Hotel & Hospitality Audit

## Existing state

The project already exposes **Hotel Management** and **Restaurant Management** workspaces in the authenticated dashboard. The hotel workspace is a monolithic `HotelManagementModule` inside `BusinessSphereDashboard.jsx` and uses generic `htl_rooms` and `htl_bookings` tables.

The live `htl_rooms` and `htl_bookings` tables have only generic record columns: `id`, `company_id`, `name`, `status`, `amount`, `notes`, `data`, `created_at`, and `updated_at`. The UI adds front-desk state directly through local table-hook state, uses USD labels, calculates booking totals in the client, and does not provide a typed reservation lifecycle, overlap prevention, guest KYC, folio, payment, or audit integration.

## Production integration boundary

The hospitality implementation will be additive and tenant-scoped. It will preserve legacy tables, but create typed `hospitality_*` tables, secured role helpers, and transaction procedures for availability, reservation, check-in/out, folio posting, payment, housekeeping, dining/POS charges, events, guest services, and reporting. The legacy dashboard component will be replaced by a modular workspace that reads a confirmed hospitality snapshot and sends all state changes through secured command procedures.

## Existing systems to integrate

| Existing area | Hospitality integration |
| --- | --- |
| Finance | Folio charges, payments, invoices, refunds, and tax totals can reference finance records. |
| Inventory and Procurement | Stock-controlled menu/minibar/laundry consumption and supplier/purchase references can be linked where configured. |
| HR / Employee Portal | Housekeeping, front-desk, kitchen, maintenance, and event staffing can map to employee identities and shifts. |
| Restaurant | Table, menu, order, kitchen, and guest-room charge workflows will use typed hospitality dining records rather than browser-local table state. |
| Documents | Guest identification/KYC references use existing document storage records rather than embedding files in browser state. |

## Audit conclusion

The current module supplies a useful visual shell but is not a production hospitality system. The required build should replace its workflow core, persistence, permissions, availability checks, and financial effects while preserving the product’s existing UI conventions.
