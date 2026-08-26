# SMART MANAGER E-Commerce Architecture Map and Requirement Matrix

**Date:** 26 August 2026
**Source specification:** `/home/ubuntu/upload/pasted_content_2.txt`
**Scope:** Existing SMART MANAGER repository, current E-Commerce workspace, shared ERP inventory/CRM/sales/finance architecture, and live Supabase schema.

## Existing runtime architecture

The E-Commerce module is currently an authenticated in-shell workspace selected through the enterprise navigation registry. `client/src/BusinessSphereDashboard.jsx` mounts the `ECommerce` surface for the `ecommerce` module. The workspace has two tabs: an internal storefront-publishing view and an online-order view. It is not currently a public customer storefront route.

The existing data path is company-scoped and reuses the ERP inventory relationship. `ecommerce_products` is read with an embedded `inventory_items(name,category)` relation; product publication state and price are stored on the commerce row while the product name and category come from the inventory row. `ecommerce_orders` is read with its confirmed order rows and currently maps order items through the embedded `ecommerce_order_items` relation in the application contract. Mutations use the existing `sb(...)` Supabase adapter and only treat a returned affected row as a confirmed permanent change.

The wider commercial command-center layer already exposes a truthful E-Commerce performance section using confirmed product and order rows. Sales, CRM, inventory, POS, finance, reports, notifications, and audit surfaces are separate existing ERP modules connected through navigation and shared persistence helpers rather than a second commerce data stack.

## Live schema reconciliation

The live Supabase inventory was inspected before planning schema changes. Confirmed relevant tables include `ecommerce_products`, `ecommerce_orders`, `inventory_items`, `inventory_warehouses`, `inventory_stock_movements`, `inventory_transfers`, `inventory_suppliers`, `crm_contacts`, `sales_orders`, `sales_order_items`, `sales_order_returns`, `sales_payments`, and related finance/reporting tables. The live `ecommerce_products` and `ecommerce_orders` tables use the common company-scoped envelope (`id`, `company_id`, `name`, `status`, `amount`, `notes`, `data`, `created_at`, `updated_at`) rather than the richer column contract assumed by some legacy client mapping code. Both tables have primary keys, a company foreign key to `companies`, and RLS enabled.

No live commerce-specific tables for carts, cart items, wishlists, coupons, promotions, product reviews, shipping records, returns, refunds, or customer commerce accounts were identified in the inventory inspected for this implementation slice. Existing `sales_*`, `inventory_*`, `crm_*`, and POS tables remain the preferred integration points. New schema should only be introduced after a dedicated product decision, exact payload contract, server RPC boundary, RLS policy design, and migration review; this slice does not create duplicate entities or client-only business records.

## Requirement status matrix

| Specification area | Existing evidence | Status | Safe implementation direction |
|---|---|---|---|
| Admin E-Commerce dashboard | `ECommerce` plus `EcommerceCommandCenter` | Partial | Expand truthful KPI/status summaries from confirmed rows; label unsupported metrics as unavailable. |
| Product catalog and inventory linkage | `ecommerce_products` + `inventory_items` | Existing/partial | Improve discovery, filters, product card, stock, publish state, and inventory source labeling. |
| Public storefront | No public route; module is authenticated | Missing | Requires a separate public route and an approved customer-read data contract. |
| Product detail, variants, attributes, images | No confirmed commerce schema | Missing | Do not fabricate; design as gated follow-up after schema contract. |
| Cart, wishlist, checkout | No confirmed tables or mutation contracts | Missing | Do not use local state as business truth; require schema/RPC design. |
| Orders and order detail | `ecommerce_orders` exists; internal order panel exists | Partial | Improve filtering, status timeline, detail accessibility, and explicit confirmed-state handling. |
| Inventory reservation/fulfillment | Inventory and sales infrastructure exists; no confirmed commerce reservation contract | Partial | Link views to existing inventory/sales flows; do not invent reservation writes. |
| CRM/customer history | `crm_contacts`, sales, POS exist | Partial | Surface cross-module navigation and confirmed customer identities where available. |
| Promotions/coupons | Existing POS promotion structures; no confirmed E-Commerce promotion contract | Partial | Reuse only after field-level contract confirmation. |
| Reviews/returns/refunds/shipping | Some sales returns/payments exist; no E-Commerce-specific contracts confirmed | Partial | Use existing sales flows where mapped; otherwise show unavailable/gated state. |
| Analytics/reporting | Commercial command centers and report exports exist | Partial | Expand actual row-derived metrics; never invent conversion, attribution, or CLV. |
| Notifications | Shared notification and smart-alert infrastructure exists | Existing/partial | Add commerce events only through confirmed server event sources. |
| Security and tenant isolation | Company-scoped adapter, server gates, RLS tables, confirmed mutation checks | Existing; verify | Preserve server authorization and RLS; no browser-only bypasses. |
| Tanzania-ready UX | TZS formatting and local timezone helpers exist | Existing/partial | Use TZS and explicit provider-unavailable messaging; do not fake payment confirmation. |
| Responsive/mobile UX | Shared responsive shell and touch-target rules exist | Improvement needed | Normalize product/order controls, mobile filters, horizontal table fallback, and focus semantics. |
| Performance | Lazy modules and loading states exist; dashboard chunk remains large | Improvement needed | Keep data bounded, use existing lazy loading, and avoid loading unbounded commerce rows. |

## Non-negotiable safety decisions

The storefront must not display data that contradicts the ERP inventory source. Payment, shipping, refund, reservation, and settlement states must remain server-confirmed. Local storage may hold view preferences and recent search text, but it must not become the source of truth for carts, orders, payments, inventory, customers, coupons, or permissions. Any future commerce tables must be checked against this live inventory to prevent duplicate product, customer, order, or inventory systems.

## Next implementation slice

This cycle improves the live authenticated E-Commerce management surface and commercial command center: truthful metrics, catalog filtering, accessible controls, inventory source labels, order search/status filters, explicit order state, responsive tables, accessible order details, and documented boundaries for unavailable public-commerce capabilities. A public storefront, persistent cart, wishlist, and payment checkout remain a separate schema-and-RPC workstream because the current live database does not expose the required contracts.
