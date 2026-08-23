# Tanzania Restaurant Tax, Mobile-Money, and Fiscal Receipt Configuration Review

**Review date:** 23 August 2026
**Scope:** Restaurant & F&B module, live Supabase project `rlhngsrihahhyxnjxrxm`, tax controls, mobile-money readiness, fiscal receipt persistence, and repository release state.

> **Tax configuration note:** This is an implementation review, not tax advice. A qualified Tanzania tax professional should confirm the tenant’s VAT registration, exemptions, reduced-rate eligibility, and filing treatment before activating production rules.

## Executive conclusion

The Restaurant module now has a **tenant-scoped Tanzania configuration layer in Supabase**. It supports tax profiles, fiscal registration metadata, non-official fiscal receipt queue records, mobile-money merchant profiles, protected mobile-money payment-intent readiness, audit trails, and a Command Center configuration screen. It deliberately remains **fail-closed**: no official TRA receipt number, verification code, QR payload, fiscal serial, or mobile-money collection success can be manufactured locally.

The live database contained **zero Restaurant outlets, zero paid Restaurant orders, and zero Restaurant mobile-money payment records** at review time. Consequently, no live configuration was overwritten and no test financial/fiscal data was inserted into a tenant.

| Area | Previous state | Current state |
|---|---|---|
| Tanzania tax | Outlet-level free-form tax rate only; default zero; no named tax profiles. | Tenant/outlet tax profiles with taxable, zero-rated, exempt, and special treatments; a default profile marker; explicit 18% guard for normal taxable treatment. |
| Fiscal receipts | Restaurant settlement posted internal POS and journal records but had no Restaurant fiscal receipt record. | Paid orders now idempotently create a local fiscal queue record. Official identifiers remain null until an approved provider response is received. |
| Fiscal configuration | Shared TRA MySQL model existed, but no Restaurant-scoped Supabase configuration. | Restaurant fiscal profile per outlet with TIN, VRN, location, device/VFD serial, environment, linked tax profile, and explicit non-active readiness state. |
| Mobile money | `Mobile Money` was a manual settlement method/reference only. | Merchant profiles for HarakaPay, M-Pesa, Tigo Pesa, Airtel Money, HaloPesa, or manual verification; protected payment-intent records; provider remains non-active until server-side credentials and signed callbacks are configured. |
| Security | No fiscal trigger existed. | RLS read policies, active-role action procedure, anonymous RPC denial, and no direct execute access on the fiscal enqueue trigger. |

## Tanzania-specific rule alignment

The TRA identifies the standard Mainland Tanzania VAT rate as **18%** and indicates that VAT registration and special/reduced scenarios depend on taxpayer circumstances. For that reason, the implementation does not hard-code 18% for every outlet: it stores tenant/outlet tax profiles and permits documented zero-rated, exempt, or special profiles. It prevents an ordinary `Taxable` profile from being saved at a non-18% rate; any different treatment must be classified and documented rather than disguised as standard VAT. [1]

TRA’s EFD guidance requires a receipt or invoice for each sale, describes EFP equipment for computerized retail outlets, lists bars and restaurants among the relevant sectors, and notes uniquely identifiable fiscal receipts, transmission of tax data, and daily Z-report behavior. [2] The module therefore creates a receipt queue when an order becomes paid, but does **not** claim fiscal issuance until an approved TRA/EFD/VFD provider supplies official identifiers.

| Configuration | System behavior | Activation condition |
|---|---|---|
| Standard VAT | `Taxable` profile is constrained to 18%. | Manager saves the tax profile and designates it as the outlet default. |
| Zero-rated/exempt/special treatment | Rate remains configurable with explicit treatment and legal-basis note. | Tenant confirms the treatment with its tax adviser/TRA documentation. |
| TRA fiscal queue | Creates `Awaiting Configuration` or `Queued` record after an order first reaches `Paid`. | Set up a complete fiscal profile and activate an approved provider integration. |
| Official fiscal identifiers | `official_receipt_number`, verification code, QR payload, and fiscal serial are nullable and never generated locally. | Provider returns verified official data. |
| Mobile-money collection | Merchant profiles and intent records are available but remain non-active. | Configure provider API secrets, callback signature, collection endpoint, and reconciliation rules server-side. |

## Live Supabase implementation evidence

Forward-only migrations applied to the live Supabase project:

| Migration | Outcome |
|---|---|
| `20260823_035_restaurant_tanzania_fiscal_configuration.sql` | Created five Restaurant Tanzania tables, three protected functions, RLS tenant-read policies, and a paid-order fiscal-queue trigger. |
| `20260823_036_harden_restaurant_tanzania_fiscal_trigger.sql` | Removed anonymous and authenticated direct execution of the internal trigger helper. |
| `20260823_037_remove_restaurant_fiscal_trigger_rpc_access.sql` | Removed the remaining service-role direct RPC grant; trigger invocation remains internal only. |

Live verification found **5 Tanzania Restaurant tables** and **3 supporting functions**. The final function privilege review showed only the intended authenticated action/snapshot procedures and their service-role administrative visibility. The internal fiscal enqueue trigger had **no direct grant** to anonymous, authenticated, or service-role callers.

The database security advisor lists the authenticated `SECURITY DEFINER` snapshot/action functions as externally callable. This is intentional: the functions derive company context from `current_company_id()`, require authentication, validate active roles, and apply RLS/read scopes. Internal helpers and the fiscal trigger no longer appear as directly callable authorized surfaces.

## Mobile-money review

The Restaurant schema previously allowed `Mobile Money` as a settlement method with a user-provided reference. That can record a confirmed external payment, but it is not a provider collection integration. This review found all server-side HarakaPay environment settings absent in the current validation runtime: API key, collection URL, and callback URL were not configured. No collection was attempted and no customer phone number or payment was sent to a third-party provider.

The new merchant-profile and intent model is intentionally credential-free. It stores only non-secret merchant metadata, payment method intent, a masked phone suffix, amount, status, provider reference, and provider payload/audit evidence. It rejects a collection-intent request unless the profile is explicitly `Active`; profiles saved through the UI stay `Configured` until a production server integration validates credentials and callback signatures.

## Validation evidence

| Validation | Result |
|---|---|
| Focused Restaurant fiscal contracts | **1 file passed; 8 tests passed.** |
| Static validation | **`pnpm check` passed.** |
| Full repository regression | **171 files passed; 5 skipped; 674 tests passed; 8 skipped.** |
| Production client build | **Passed.** Existing optional analytics-variable and large-bundle warnings are non-blocking. |
| Live schema check | **Passed:** five new tables and three functions are present. |
| Live privilege check | **Passed:** no anonymous grant for the configuration snapshot/action procedures; internal fiscal trigger has no direct RPC grant. |
| Live data safety | **Passed:** no Restaurant test outlets, orders, tax profiles, merchant profiles, payments, or fiscal receipts were seeded. |

## Required activation work

The schema and UI are ready for authorized tenant configuration, but **official fiscal issuance and provider-backed collection remain deliberately off**. Before setting an outlet to operational production use, the tenant should complete the following controlled onboarding.

1. Confirm VAT registration/status, then create the appropriate default tax profile in the new **Tanzania fiscal** tab.
2. Enter the registered TIN, VRN where applicable, legal business/trading name, outlet location, and EFD/VFD device information. The profile remains `Awaiting Configuration` and cannot imply official TRA connection.
3. Obtain an approved TRA/EFD/VFD provider contract, API specification, production credentials, and certificate/serial requirements. Add a signed server-side provider adapter only after this material is available.
4. Obtain the selected mobile-money provider’s production collection credentials and webhook signature specification. Store secrets only in server configuration, verify callbacks, reconcile the provider transaction against the Restaurant intent, and only then set the merchant profile active.
5. Run an authorized acceptance transaction in a non-production tenant: taxable table order → settlement → fiscal queue record → provider submission/verified official receipt → provider payment callback → payment reconciliation → accounting review.

## References

[1]: https://www.tra.go.tz/page/value-added-tax-vat "Tanzania Revenue Authority — Value Added Tax"
[2]: https://www.tra.go.tz/page/know-about-e-fiscal-devices-efd "Tanzania Revenue Authority — Know About E-Fiscal Devices"
