# SMART MANAGER E-Commerce Checkout, Payment, and Shipping Contract

**Status:** Design review only; not applied to Supabase.

**Date:** 26 August 2026

**Scope:** Public storefront checkout, customer identity linkage, inventory reservation, payment-provider confirmation, shipping fulfillment, webhook replay protection, returns/refunds, and tenant-safe RPC boundaries.

## 1. Architectural decision

The current repository is not a public customer storefront. It is an authenticated E-Commerce management workspace backed by `ecommerce_products`, `ecommerce_orders`, `inventory_items`, `sales_orders`, `sales_order_items`, `sales_payments`, `crm_contacts`, and shared ERP finance and inventory tables. The new contract must extend those systems rather than create a second product, customer, order, inventory, or accounting universe.

The preferred implementation is a server-confirmed ERP commerce layer. The browser may hold an anonymous cart identifier and view preferences, but it must never be authoritative for price, tax, discount, inventory, customer identity, payment status, shipment status, refund status, permissions, or order totals. A Shopify integration remains a valid alternative if the product decision is to outsource cart, checkout, payments, and fulfillment; this document assumes the project intentionally continues with its existing Supabase/ERP stack.

## 2. Confirmed integration anchors

| Existing entity | Role in the new contract | Required rule |
|---|---|---|
| `ecommerce_products` | Tenant-scoped commerce product/publishing envelope | Preserve current row identity and publication state; do not duplicate products. |
| `inventory_items` | Source of stock identity and quantity | Every sellable variant must resolve to one inventory item; reservation is the only safe deduction path. |
| `ecommerce_orders` | Existing order envelope used by the management workspace | Add a typed link from the checkout session; do not let the browser write arbitrary order totals or states. |
| `sales_orders` / `sales_order_items` | Existing ERP sales ledger where the finalized order should be posted | Posting must be server-side and idempotent; preserve the existing sales chain. |
| `sales_payments` | Existing finance-facing payment record | Link a provider-confirmed payment event to one canonical payment record; do not create a parallel balance. |
| `crm_contacts` | Customer master | Customer commerce accounts link to CRM contacts instead of duplicating customer identity. |
| `inventory_warehouses` / `inventory_stock_movements` | Fulfillment stock context | Reservations and releases must be represented by a reviewed movement/reservation contract. |

## 3. Proposed tables

All proposed tables require `id uuid primary key default gen_random_uuid()`, `company_id uuid not null references public.companies(id)`, `created_at timestamptz not null default now()`, and `updated_at timestamptz not null default now()` unless noted otherwise. All tables require RLS, explicit grants, tenant indexes, and pgTAP allow/deny tests before exposure.

### 3.1 Product and customer linkage

`public.commerce_product_variants` stores typed sellable variants without replacing `ecommerce_products` or `inventory_items`.

Required columns: `id`, `company_id`, `ecommerce_product_id uuid not null references public.ecommerce_products(id)`, `inventory_item_id uuid not null references public.inventory_items(id)`, `sku text not null`, `variant_name text`, `currency text not null`, `list_price numeric(18,2) not null check (list_price >= 0)`, `tax_code text`, `active boolean not null default true`, `metadata jsonb not null default '{}'::jsonb`, timestamps. Add unique `(company_id, sku)` and unique `(company_id, inventory_item_id)` when one inventory item maps to one sellable variant.

`public.commerce_product_media` stores approved product media metadata. Required columns: `id`, `company_id`, `product_variant_id uuid not null references public.commerce_product_variants(id)`, `storage_path text not null`, `alt_text text not null`, `sort_order integer not null default 0`, `is_primary boolean not null default false`, `mime_type text`, `checksum text`, timestamps. Storage access must be tenant-scoped; the database stores paths and checksums, not client-authoritative public URLs.

`public.commerce_customer_accounts` links commerce identity to the existing CRM master. Required columns: `id`, `company_id`, `contact_id uuid references public.crm_contacts(id)`, `auth_user_id uuid references auth.users(id)`, `email text`, `phone text`, `account_status text not null check (account_status in ('ACTIVE','SUSPENDED','GUEST'))`, `guest_key_hash text`, `created_by uuid references auth.users(id)`, timestamps. Enforce that `contact_id`, `auth_user_id`, and any guest key are tenant-consistent through RPC checks. Do not store raw guest tokens; store a one-way hash if guest checkout is approved.

`public.commerce_addresses` stores customer shipping and billing addresses. Required columns: `id`, `company_id`, `customer_account_id uuid not null references public.commerce_customer_accounts(id)`, `address_type text not null check (address_type in ('SHIPPING','BILLING'))`, `recipient_name text not null`, `phone text`, `line1 text not null`, `line2 text`, `city text not null`, `region text`, `postal_code text`, `country_code char(2) not null`, `is_default boolean not null default false`, timestamps. The client may read its own addresses; writes occur through a validated RPC. Add an index on `(company_id, customer_account_id)`.

### 3.2 Cart and checkout

`public.commerce_carts` stores a persistent server-side cart. Required columns: `id`, `company_id`, `customer_account_id uuid references public.commerce_customer_accounts(id)`, `session_key_hash text`, `status text not null check (status in ('OPEN','CHECKOUT_STARTED','CONVERTED','ABANDONED','EXPIRED'))`, `currency text not null`, `expires_at timestamptz`, timestamps. Enforce at least one owner: authenticated customer account or approved guest session hash. Add unique `(company_id, session_key_hash)` for active guest sessions and an index on `(company_id, status, updated_at)`.

`public.commerce_cart_items` stores requested quantities only; price is re-read from the server at checkout. Required columns: `id`, `company_id`, `cart_id uuid not null references public.commerce_carts(id) on delete cascade`, `product_variant_id uuid not null references public.commerce_product_variants(id)`, `quantity numeric(18,4) not null check (quantity > 0)`, `created_at`, `updated_at`. Enforce unique `(cart_id, product_variant_id)` and index `(company_id, cart_id)`.

`public.commerce_checkout_sessions` is the immutable checkout attempt and idempotency boundary. Required columns: `id`, `company_id`, `cart_id uuid not null references public.commerce_carts(id)`, `customer_account_id uuid references public.commerce_customer_accounts(id)`, `order_id uuid references public.ecommerce_orders(id)`, `sales_order_id uuid references public.sales_orders(id)`, `currency text not null`, `subtotal numeric(18,2) not null check (subtotal >= 0)`, `discount_total numeric(18,2) not null default 0 check (discount_total >= 0)`, `tax_total numeric(18,2) not null default 0 check (tax_total >= 0)`, `shipping_total numeric(18,2) not null default 0 check (shipping_total >= 0)`, `grand_total numeric(18,2) not null check (grand_total >= 0)`, `status text not null check (status in ('CREATED','PAYMENT_PENDING','PAID','FULFILLING','COMPLETED','CANCELLED','EXPIRED','PAYMENT_FAILED'))`, `shipping_address_id uuid references public.commerce_addresses(id)`, `billing_address_id uuid references public.commerce_addresses(id)`, `idempotency_key text not null`, `request_hash text not null`, `expires_at timestamptz`, timestamps. Enforce unique `(company_id, idempotency_key)` and index `(company_id, status, created_at)`.

`public.commerce_checkout_items` is an immutable price and tax snapshot. Required columns: `id`, `company_id`, `checkout_session_id uuid not null references public.commerce_checkout_sessions(id) on delete cascade`, `product_variant_id uuid not null references public.commerce_product_variants(id)`, `inventory_item_id uuid not null references public.inventory_items(id)`, `sku text not null`, `product_name_snapshot text not null`, `quantity numeric(18,4) not null check (quantity > 0)`, `unit_price numeric(18,2) not null check (unit_price >= 0)`, `tax_amount numeric(18,2) not null default 0`, `discount_amount numeric(18,2) not null default 0`, `line_total numeric(18,2) not null check (line_total >= 0)`, timestamps. No update or delete grant is exposed to browser roles.

### 3.3 Inventory reservation

`public.commerce_inventory_reservations` prevents overselling between checkout creation and payment expiry. Required columns: `id`, `company_id`, `checkout_session_id uuid not null references public.commerce_checkout_sessions(id)`, `inventory_item_id uuid not null references public.inventory_items(id)`, `warehouse_id uuid references public.inventory_warehouses(id)`, `quantity numeric(18,4) not null check (quantity > 0)`, `status text not null check (status in ('HELD','CONSUMED','RELEASED','EXPIRED','FAILED'))`, `expires_at timestamptz not null`, `released_at timestamptz`, `consumed_at timestamptz`, timestamps. Add a partial unique index for one active reservation per `(company_id, checkout_session_id, inventory_item_id, warehouse_id)` and indexes on `(company_id, inventory_item_id, status)` and `(company_id, expires_at)`.

Reservation creation must lock the relevant inventory rows in a short database transaction, verify available quantity from the approved inventory source, and fail closed on insufficient or ambiguous stock. A payment success event consumes the reservation; checkout expiry or payment failure releases it. No browser write may update quantity directly.

### 3.4 Payment and webhook replay protection

`public.commerce_payment_intents` stores the provider-neutral payment attempt. Required columns: `id`, `company_id`, `checkout_session_id uuid not null references public.commerce_checkout_sessions(id)`, `sales_payment_id uuid references public.sales_payments(id)`, `provider text not null`, `provider_account_ref text`, `provider_payment_ref text`, `amount numeric(18,2) not null check (amount >= 0)`, `currency text not null`, `status text not null check (status in ('REQUIRES_ACTION','PROCESSING','SUCCEEDED','FAILED','CANCELLED','REFUNDED','PARTIALLY_REFUNDED'))`, `provider_status text`, `failure_code text`, `failure_message text`, `idempotency_key text not null`, `metadata jsonb not null default '{}'::jsonb`, timestamps. Enforce unique `(company_id, provider, idempotency_key)` and, when present, unique `(company_id, provider, provider_payment_ref)`.

`public.commerce_payment_events` is an append-only provider-event ledger. Required columns: `id`, `company_id`, `payment_intent_id uuid references public.commerce_payment_intents(id)`, `provider text not null`, `provider_event_id text not null`, `event_type text not null`, `signature_verified boolean not null`, `payload_hash text not null`, `received_at timestamptz not null default now()`, `processed_at timestamptz`, `processing_status text not null check (processing_status in ('RECEIVED','PROCESSED','IGNORED','QUARANTINED','FAILED'))`, `failure_code text`, `payload jsonb not null`. Enforce unique `(provider, provider_event_id)` and do not expose payload or insert/update/delete privileges to browser roles.

`public.commerce_idempotency_keys` is a generic server mutation ledger. Required columns: `id`, `company_id`, `actor_user_id uuid references auth.users(id)`, `operation text not null`, `idempotency_key text not null`, `request_hash text not null`, `response_status integer`, `response_body jsonb`, `state text not null check (state in ('STARTED','SUCCEEDED','FAILED','EXPIRED'))`, `expires_at timestamptz not null`, timestamps. Enforce unique `(company_id, actor_user_id, operation, idempotency_key)`. Never use email, phone, national ID, or raw payment credentials as a key.

### 3.5 Shipping and fulfillment

`public.commerce_shipping_methods` stores tenant-approved shipping options and pricing rules. Required columns: `id`, `company_id`, `code text not null`, `name text not null`, `provider text`, `service_level text`, `active boolean not null default true`, `currency text not null`, `base_fee numeric(18,2) not null default 0`, `metadata jsonb not null default '{}'::jsonb`, timestamps. Enforce unique `(company_id, code)`.

`public.commerce_shipments` stores the fulfillment attempt linked to one paid checkout/order. Required columns: `id`, `company_id`, `checkout_session_id uuid not null references public.commerce_checkout_sessions(id)`, `order_id uuid references public.ecommerce_orders(id)`, `shipping_method_id uuid not null references public.commerce_shipping_methods(id)`, `provider text`, `provider_shipment_ref text`, `tracking_number text`, `status text not null check (status in ('PENDING','LABEL_REQUESTED','LABEL_CREATED','READY_FOR_PICKUP','IN_TRANSIT','DELIVERED','FAILED','CANCELLED','RETURNED'))`, `recipient_address_id uuid not null references public.commerce_addresses(id)`, `estimated_delivery_at timestamptz`, `shipped_at timestamptz`, `delivered_at timestamptz`, timestamps. Enforce unique provider shipment references where present and index `(company_id, status, created_at)`.

`public.commerce_shipment_items` links shipment quantities to checkout lines. Required columns: `id`, `company_id`, `shipment_id uuid not null references public.commerce_shipments(id) on delete cascade`, `checkout_item_id uuid not null references public.commerce_checkout_items(id)`, `quantity numeric(18,4) not null check (quantity > 0)`, timestamps. Enforce unique `(shipment_id, checkout_item_id)`.

`public.commerce_shipment_events` is an append-only tracking ledger. Required columns: `id`, `company_id`, `shipment_id uuid not null references public.commerce_shipments(id)`, `provider_event_id text`, `event_type text not null`, `status text not null`, `location text`, `event_at timestamptz`, `payload_hash text`, `payload jsonb not null default '{}'::jsonb`, `created_at timestamptz not null default now()`. Enforce provider-event idempotency where a provider event ID exists.

### 3.6 Returns and refunds

`public.commerce_return_requests` stores a customer or staff return request linked to an existing order. Required columns: `id`, `company_id`, `order_id uuid not null references public.ecommerce_orders(id)`, `customer_account_id uuid references public.commerce_customer_accounts(id)`, `status text not null check (status in ('REQUESTED','APPROVED','REJECTED','RECEIVED','REFUNDED','CANCELLED'))`, `reason_code text not null`, `notes text`, `requested_at timestamptz not null default now()`, `decided_at timestamptz`, timestamps.

`public.commerce_refunds` stores a provider-confirmed refund attempt. Required columns: `id`, `company_id`, `payment_intent_id uuid not null references public.commerce_payment_intents(id)`, `return_request_id uuid references public.commerce_return_requests(id)`, `provider_ref text`, `amount numeric(18,2) not null check (amount > 0)`, `currency text not null`, `status text not null check (status in ('REQUESTED','PROCESSING','SUCCEEDED','FAILED'))`, `idempotency_key text not null`, timestamps. Enforce unique `(company_id, idempotency_key)` and provider reference uniqueness.

## 4. RPC contract

All mutating RPCs must be `security invoker` unless a reviewed service bridge requires `security definer`. Any `security definer` function must use `set search_path = ''`, schema-qualify every relation, revoke execute from `public` and `anon`, and grant only the intended role. No function should trust a client-supplied `company_id`; derive company membership from the authenticated profile and server authorization helper.

| RPC | Caller | Input contract | Atomic responsibilities | Return contract |
|---|---|---|---|---|
| `commerce_cart_upsert_item` | `authenticated` or approved guest bridge | `cart_id`, `product_variant_id`, `quantity`, `idempotency_key` | Resolve tenant and variant; verify active product; upsert requested quantity; never reserve or charge stock. | Cart ID, line ID, current requested quantity, expiry, and server-calculated availability hint. |
| `commerce_cart_remove_item` | Cart owner | `cart_id`, `cart_item_id`, `idempotency_key` | Verify ownership and open status; remove one line; do not mutate inventory or orders. | Cart summary and removed line ID. |
| `commerce_checkout_create` | `authenticated` customer or approved guest bridge | `cart_id`, `shipping_address_id`, `billing_address_id`, `shipping_method_id`, `currency`, `idempotency_key`, `request_hash` | Lock cart and variants; re-price from server; validate tax/discount rules; verify address ownership; lock and create inventory reservations; snapshot checkout lines; create/link the existing order envelope; transition cart to `CHECKOUT_STARTED`; return one idempotent checkout. | Checkout ID, order ID, totals, currency, reservation expiry, payment-required amount, and allowed next states. |
| `commerce_payment_attempt_create` | `authenticated` checkout owner or server checkout bridge | `checkout_session_id`, `provider`, `idempotency_key`, `request_hash` | Verify checkout is payable; derive amount/currency from checkout; create one provider-neutral payment intent; never accept a browser total; do not mark paid. | Payment intent ID, provider, amount, currency, current status, and provider handoff token only if generated by a server-side provider adapter. |
| `commerce_payment_event_record` | service-role Edge Function only | `provider`, `provider_event_id`, `event_type`, `signature_verified`, `payload_hash`, sanitized payload | Insert once by provider event ID; quarantine unsigned, malformed, unknown, or cross-tenant events; do not trust event metadata for tenant assignment. | Event ID, `RECEIVED`/`DUPLICATE`/`QUARANTINED` decision. |
| `commerce_payment_event_apply` | service-role worker only | `payment_event_id` | Lock event and payment intent; verify event is signed and not processed; transition payment only through an allowed state machine; consume/release reservations; create/link `sales_payments`; update checkout/order state; append order status history; mark event processed atomically. | Applied event ID, payment intent state, checkout state, order state, and accounting-link IDs. |
| `commerce_checkout_expire` | scheduled service-role worker | `checkout_session_id` or bounded expiry batch | Lock expired unpaid checkout; release held reservations; mark checkout/cart/payment attempt expired; append status history; idempotently no-op if already terminal. | Counts and IDs of released, already terminal, and quarantined records. |
| `commerce_shipment_create` | authorized operations/fulfillment role | `checkout_session_id`, `shipping_method_id`, `idempotency_key` | Require provider-confirmed payment or approved manual-payment state; verify reservations consumed; create shipment and items; never ship unpaid orders; append order status history. | Shipment ID, status, shipping method, item quantities, and provider-adapter handoff state. |
| `commerce_shipment_event_record` | service-role shipping webhook worker | `provider`, `provider_event_id`, `shipment_id`, `event_type`, `payload_hash`, sanitized payload | Dedupe event; verify shipment belongs to tenant; append event; update shipment only through allowed transitions; update order fulfillment state. | Event decision, shipment state, order state. |
| `commerce_return_request_create` | customer or authorized support role | `order_id`, lines/quantities, reason code, notes, `idempotency_key` | Verify order/customer ownership and delivered/eligible state; cap quantities against shipped lines; create request; never refund automatically. | Return request ID, status, eligible lines, and next approval state. |
| `commerce_refund_request_create` | authorized finance role | `payment_intent_id`, `return_request_id`, amount, currency, `idempotency_key` | Verify approved return and remaining refundable amount; create pending refund; never mark succeeded or alter accounting before provider confirmation. | Refund ID, amount, provider state, and approval/audit identifiers. |
| `commerce_order_status_history_list` | customer owner or authorized tenant role | `order_id`, bounded limit/cursor | Apply RLS and return only safe status history; exclude provider payloads and secrets. | Paginated status history. |

Provider calls must be performed by a server-side adapter or Edge Function, not by a browser RPC. Provider mutations require a high-entropy idempotency key scoped to the logical operation. Stripe’s current guidance states that POST requests accept idempotency keys and that retries with the same key return the original result; the integration must still bind the key to a server-computed request hash and tenant/order context. [1]

## 5. State machines and invariants

### Checkout

`CREATED → PAYMENT_PENDING → PAID → FULFILLING → COMPLETED` is the normal path. Allowed exceptional states are `PAYMENT_FAILED`, `CANCELLED`, and `EXPIRED`. No transition may skip payment confirmation or consume stock twice. Terminal states cannot be reopened by a browser call.

### Payment

`REQUIRES_ACTION → PROCESSING → SUCCEEDED` or `FAILED`; a succeeded payment may later become `PARTIALLY_REFUNDED` or `REFUNDED` only through a provider-confirmed refund path. The browser may initiate an attempt but cannot set `SUCCEEDED`, `PAID`, or `REFUNDED`.

### Reservation

`HELD → CONSUMED` on confirmed payment and order posting; `HELD → RELEASED` on payment failure/cancellation; `HELD → EXPIRED` through a bounded worker. Quantity must never become negative, and each reservation operation must be idempotent.

### Shipment

`PENDING → LABEL_REQUESTED → LABEL_CREATED → READY_FOR_PICKUP → IN_TRANSIT → DELIVERED`; failure, cancellation, and return transitions require explicit provider/staff evidence. Shipment status must never make an unpaid order appear fulfilled.

## 6. RLS, grants, and security tests

For every proposed public table:

1. Enable RLS and revoke all table privileges from `anon` and `authenticated` by default.
2. Grant only the minimum read operation required by the UI. Browser writes go through RPCs; direct insert/update/delete grants remain revoked.
3. Add explicit `SELECT`, `INSERT`, `UPDATE`, and `DELETE` policies where an operation is intentionally available. Every policy names its role and derives `company_id` from the authenticated profile or a server-controlled relationship.
4. Add indexes with `company_id` as the leading policy-filter column and index the relationship columns used by ownership checks.
5. Add pgTAP tests for tenant A/B reads, cross-tenant insert/update/delete attempts, direct `company_id` tampering, customer-to-order ownership, replayed provider event IDs, duplicate idempotency keys, negative/oversized quantities, payment-state forgery, reservation over-allocation, shipment-before-payment, and refund-overrun.
6. Keep provider payloads, signatures, raw address secrets, service credentials, and webhook signing secrets out of browser-readable tables and logs.

Supabase’s current guidance separates grants from policies, requires RLS for exposed tables, recommends explicit operation policies and indexes for policy filters, and recommends a safe explicit `search_path` for any `security definer` function. [2] [3]

## 7. Migration order

The migration must be split into reviewable waves rather than one irreversible DDL block:

| Wave | Contents | Gate |
|---|---|---|
| 0 | Product decision, provider choice, tax/shipping rules, guest checkout decision, customer identity policy | Written approval and field-level contract |
| 1 | Product variants, media metadata, customer account linkage, addresses | Live inventory/customer duplicate check; RLS pgTAP tests |
| 2 | Carts, cart items, checkout sessions/items, idempotency ledger | Price/tax invariants and retry tests |
| 3 | Inventory reservations and order/sales posting link | Concurrency, oversell, rollback, and reconciliation tests |
| 4 | Payment intents/events and service-only webhook bridge | Provider sandbox, raw-body signature verification, replay tests |
| 5 | Shipping methods, shipments, shipment items/events | Provider sandbox and shipment-state tests |
| 6 | Returns/refunds and customer-facing public route | Finance approval, refund caps, support workflow, accessibility and browser QA |

Do not apply any wave until its SQL, RPC signatures, grants, RLS policies, pgTAP tests, server adapter, audit events, and rollback/incident runbook are reviewed together.

## References

[1]: https://docs.stripe.com/api/idempotent_requests "Stripe — Idempotent requests"

[2]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase — Row Level Security"

[3]: https://supabase.com/docs/guides/database/functions "Supabase — Database Functions"
