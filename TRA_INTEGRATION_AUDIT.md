# Smart Manager ERP — TRA Integration & Tax Compliance Audit

**Verification date:** 19 August 2026  
**Scope:** Existing Tanzania-first tax, fiscal-record, VFD, VAT-preparation, audit, and official-service workflows in Smart Manager ERP.

## Executive summary

The project now presents TRA capabilities truthfully. The ERP stores tenant-scoped tax profiles and internal fiscal records, prepares VAT schedules, exposes existing anomaly and Z-report services, and gives users explicit links to the official TRA taxpayer portal and receipt-verification service. Direct TRA fiscalization is **not enabled** because the repository does not contain an authoritative production specification, approved adapter, production endpoint, credentials, certificates, or TRA onboarding evidence.

The direct-provider boundary is fail-closed. When a receipt-submission request reaches the server, the provider returns `OFFICIAL_ADAPTER_NOT_CONFIGURED` and the router blocks the request before creating a fiscalized receipt. The UI does not display fabricated receipt numbers, verification codes, QR data, buyer data, tax statuses, gateway uptime, or “TRA connected” claims.

## Capability classification

| Capability | Current state | Classification | Truthful user-facing behavior |
| --- | --- | --- | --- |
| Tenant tax profile | Available through `fiscalProfiles` and the protected TRA router | Internal ERP record | Users can save registered business details; the UI labels them as internal profile data. |
| Direct VFD / EFDMS receipt submission | Disabled | Future official adapter | Server-side submission fails closed until approved TRA technical and credential evidence is configured. |
| Fiscal record ledger | Available for existing server-confirmed records | Internal ERP evidence ledger | Records are shown only when returned for the current tenant; missing fields render as unavailable. |
| VAT schedule preparation | Available | Portal-based workflow | Filtered internal records can be exported as CSV/PDF or printed; the PDF explicitly states that it is not a TRA filing. |
| Tax returns and tax payments | Not automated | Official portal user action | Users open the official taxpayer portal and complete authenticated actions there. |
| Receipt verification | Public service link available | Official portal user action | Users open `https://verify.tra.go.tz/`; the ERP does not synthesize verification responses. |
| Daily Z-report archive | Existing service | Internal scheduled archive | Existing Heartbeat-backed archive logic remains available and must be presented as ERP archival evidence unless a verified TRA response is attached. |
| VAT anomaly monitoring | Existing service | Internal compliance monitoring | Existing threshold, cooldown, and event history services remain tenant-scoped and separate from TRA acknowledgements. |
| Gateway timeout alerts | Existing service | Internal operational monitoring | Existing alerts describe configured ERP gateway health; they do not prove TRA availability. |
| Multi-branch summary | Existing service | Internal aggregation | Branch summaries are derived from tenant fiscal records and are not official TRA statements. |

## Official-source boundary

The following public services are linked as explicit user actions:

- [TRA official website](https://www.tra.go.tz/)
- [TRA taxpayer portal](https://taxpayerportal.tra.go.tz/)
- [TRA receipt verification](https://verify.tra.go.tz/)

The browser sandbox could not independently load the official hosts during the source-verification pass. Search discovery and public URLs are not sufficient proof of an official production API. Third-party VFD documentation is not treated as TRA approval. Direct activation therefore remains blocked until the customer supplies authoritative TRA onboarding/specification evidence, approved endpoints, authentication method, sandbox/production details, certificate requirements, payload and response contracts, error catalogue, rate limits, and any required written authorization.

See [`TRA_OFFICIAL_SOURCE_EVIDENCE.md`](./TRA_OFFICIAL_SOURCE_EVIDENCE.md) for the detailed source record.

## Implemented code changes

### Backend

- `server/traFiscal.ts` now defines the explicit `FiscalProviderAdapter` boundary, `UnavailableFiscalProvider`, readiness states, official public links, and the non-fabricating submission result.
- `server/traFiscalRouter.ts` now uses the fail-closed provider, returns provider readiness and official links from `getConnectionStatus`, masks raw TRA response and QR fields from list responses, and blocks submission before inserting a record when no approved adapter is configured.
- Profile saves normalize an attempted `active` state to `misconfigured` until a verified adapter exists.

### Frontend

- `client/src/components/TraPortalModule.jsx` was rebuilt as a responsive TRA Integration Center around real server query states.
- The UI removes seeded TINs, VRNs, receipt numbers, response codes, QR information, gateway uptime, and fabricated buyer/receipt rows.
- The UI provides clear `READY`, `AWAITING CONFIGURATION`, and `UNAVAILABLE` states, internal-record labelling, tenant profile editing, VAT search/month filtering, CSV/PDF/print exports, and official portal/verification links.
- Internal PDF output carries an explicit “not a TRA filing or acknowledgement” notice.

### Tests

- `server/traFiscal.provider.test.ts` covers fail-closed production behavior, sandbox non-fiscalization, empty receipt/QR output, and explicit official links.

## Security and isolation controls

- All TRA router procedures remain protected and verify the authenticated workspace against `companyId`.
- Direct credentials, certificates, private keys, and portal sessions are not accepted by the browser UI and are not committed to the repository.
- No protected TRA page is scraped, embedded, or imitated.
- No fabricated TIN, VRN, receipt number, verification code, QR information, tax payment confirmation, or TRA acknowledgement is generated.
- Test and sandbox capability is not presented as a live TRA production integration.

## Remaining prerequisites for direct integration

Direct fiscalization remains intentionally unavailable until the following are supplied and validated on the server:

1. TRA-authoritative technical documentation and approval for the intended interface.
2. Approved sandbox and production endpoint metadata.
3. Tenant-specific authentication credentials, certificates, and key-rotation process.
4. Payload, response, idempotency, status-query, cancellation/void, error, rate-limit, and retry contracts.
5. A controlled end-to-end test plan and production authorization.

Until then, the supported path is **Prepare → Validate → Export → Open Official TRA Service → Reconcile internal evidence**.

## Validation status

The focused TRA provider regression tests pass, and TypeScript compilation passes after the current implementation. A full-suite and production-build validation must still be completed after the remaining project documentation and UI verification work.

## Non-fabrication policy

This report must not be edited to imply official TRA approval or direct production connectivity that has not been evidenced. Every future TRA capability must be classified as direct official integration, official portal user action, internal ERP preparation/monitoring, or future/blocked adapter work.
