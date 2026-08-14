# Tenant-Isolation Acceptance Status

**Status date:** 14 August 2026  
**Scope:** Final live two-company acceptance verification for BusinessSphere ERP

## Outcome

The nominated session was authenticated successfully and its tenant resolution was checked against the established Tenant A CRM acceptance record. The session resolved to the **same company** as Tenant A and could read that Tenant A record. It therefore is **not an independent Tenant B session** and cannot provide valid evidence of cross-company isolation.

No claim of two-tenant isolation is made from this result. No RLS policy, database table, function, or tenant membership was changed during this validation, and no cross-tenant write was attempted with the same-company session.

## Evidence retained

| Check | Result | Interpretation |
|---|---|---|
| Nominated session authenticated | Passed | The account can access the deployed ERP. |
| Tenant resolution completed | Passed | The session resolved through the authenticated `current_company_id()` path. |
| Tenant A acceptance record visible | Yes | Expected for a session in Tenant A's company. |
| Resolved company differs from Tenant A | No | The nominated account is not valid Tenant B evidence. |
| Forged foreign `company_id` insert | Rejected earlier with HTTP 403 / PostgreSQL 42501 | Existing RLS blocks client-supplied ownership spoofing. |

## Acceptance items already verified

The preceding live verification established confirmed Supabase persistence for application-created records, including successful create, reload/read, update, delete, refresh persistence, renewed-login persistence, truthful failure handling, and refresh-token-backed session recovery. The published dashboard also enforces server confirmation before treating permanent business data as saved.

## Remaining acceptance dependency

The final bilateral test requires a separately provisioned account whose authenticated `current_company_id()` resolves to a company other than Tenant A. When that account is available, the acceptance procedure must verify all of the following without weakening RLS or trusting a browser-supplied company identifier:

1. Tenant B cannot read Tenant A's nominated CRM record.
2. Tenant B cannot insert with Tenant A ownership, update Tenant A's record, or delete it.
3. Tenant B can create and read its own confirmed record.
4. After switching back, Tenant A cannot read Tenant B's confirmed record.

Until this independent identity is supplied, the two-company acceptance test is **explicitly deferred**, rather than substituted with another user belonging to the same company.
