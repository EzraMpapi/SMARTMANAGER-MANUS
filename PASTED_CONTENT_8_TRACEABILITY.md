# Pasted Content 8: Secure Offline Capability Traceability

This document maps the offline-first proposal in `pasted_content_8.txt` to the existing Smart Manager persistence model. The current application is server-confirmed by design: permanent company records are not marked saved until Supabase confirms them in the authenticated tenant context. An unscoped browser cache must not become an alternate authority for inventory, revenue, invoices, payroll, or tenant security records.

| Attached directive | Current outcome | Integrity boundary |
| --- | --- | --- |
| IndexedDB as a broad offline database for all business records | **Not implemented.** | Generic browser data is not sufficiently tenant-scoped, versioned, encrypted, conflict-resolved, or auditable to become the primary record for business operations. |
| Offline create, update, and delete across modules | **Not implemented.** | The global boundary pauses permanent writes offline and preserves form data for retry rather than falsely displaying a local write as saved. |
| POS offline queue | **Existing limited workflow retained and clarified.** | A POS sale can only enter a clearly labelled pending-sync queue after a retryable transport failure. It has not completed, affected inventory/revenue/customer balances, or produced a confirmed receipt until the server accepts it. The queue is scoped to the active workspace and user and has idempotency/sync handling. |
| Automatic background sync | **Not claimed.** | The existing retry happens when the application receives an online event while the tab is open. True background sync needs a service worker, durable authenticated retry authorization, sync conflict policy, and reliable browser support/observability. |
| Offline authentication or stored sessions | **Not implemented.** | Login and tenant authorization remain server-backed. Cached credentials or an offline session store would require an explicit threat model, encryption/key lifecycle, expiry, revocation behavior, and device-management contract. |
| Cached asset or read-only view availability | **Bounded current view only.** | After connection loss, users can continue viewing what is already loaded in the tab; the application does not claim arbitrary historical records are available offline. |
| Offline files and local attachments | **Not implemented as durable files.** | Browser downloads remain user-controlled; durable file bytes belong in authorized server/S3 storage, not browser metadata. |

## Future architecture decision

Expanding beyond the current explicit POS pending-sync workflow requires choosing one of two product-level designs before implementation. A limited read-only offline mode can cache selected, tenant-encrypted snapshots with version/freshness labels and no writes. A true offline transaction mode requires operation-specific command schemas, idempotency keys, per-record versioning, conflict resolution, authorization re-check at sync time, audit records, encryption at rest, retention/clear controls, service-worker lifecycle management, and an end-to-end conflict/rollback acceptance suite. The choice must be approved before browser storage is introduced as a wider data path.
