# Code Review: Tenant- and User-Scoped Storage Isolation in `resumeSession.ts`

**Reviewed file:** `client/src/lib/resumeSession.ts`

**Review scope:** Exact storage-key construction, read/write validation, dashboard integration, logout cleanup, URL sanitization, and the adjacent safe-draft helpers. No code was changed during this review.

## Executive conclusion

The resume-location record is correctly namespaced by the authenticated user ID and company ID, and the read path performs a second exact-ID check before accepting a record. The module is therefore appropriately designed as a **navigation convenience boundary**, not as a security authority. Real tenant security still comes from the authenticated session, server-side authorization, the verified company context, and the allowed-module list supplied by the dashboard.

The implementation has four important hardening gaps that should be addressed before treating the boundary as complete:

1. `invite`, OAuth `code`, `state`, and similar authentication/onboarding parameters are not removed by `sanitizeResumeLocation`; only `buildResumeUrl` removes `invite`, and only some token patterns are blocked.
2. `writeResumeLocation` calls `sanitizeResumeLocation` outside its `try` block, so an unexpected URL-construction exception could escape the persistence helper instead of failing closed.
3. `savedAt` is written but never used as a retention/expiry check, so stale locations remain in browser storage indefinitely.
4. `writeSafeDraft` is not tenant- or user-scoped and strips sensitive field names only at the top level; nested sensitive values can remain if callers pass nested objects.

## Exact isolation flow

### 1. Storage key construction — lines 35–39

```ts
export function getResumeLocationKey(userId: string, companyId: string): string {
  const safeUserId = encodeURIComponent(userId.trim());
  const safeCompanyId = encodeURIComponent(companyId.trim());
  return `${RESUME_LOCATION_STORAGE_PREFIX}:${safeUserId}:${safeCompanyId}`;
}
```

This creates a deterministic local-storage namespace of the form:

```text
smart_manager_resume_location_v1:<encoded-user-id>:<encoded-company-id>
```

Encoding prevents delimiter ambiguity and trimming avoids accidental key divergence caused by surrounding whitespace. Because the key is derived from both identities, a user’s record for Company A is not read from the Company B key.

This is **namespace isolation**, not confidentiality. Any script running in the same origin can inspect localStorage. The record is safe only because it contains navigation metadata rather than business data, credentials, or tokens.

### 2. Input identity validation — lines 41–46

```ts
if (context.userId && input?.userId && input.userId !== context.userId) return null;
if (context.companyId && input?.companyId && input.companyId !== context.companyId) return null;
const userId = String(input?.userId || context.userId || "").trim();
const companyId = String(input?.companyId || context.companyId || "").trim();
```

A supplied record identity must match the verified context when both are present. Missing identities are filled from the context, which is useful for callers that provide only navigation fields.

The important trust property is that `readResumeLocation` and the dashboard pass the authenticated/current company IDs as context; they do not trust a stored record to choose its own tenant.

### 3. Path and module authorization — lines 47–52

```ts
const allowed = new Set(context.allowedModuleIds);
const safe = new Set(context.safeModuleIds || []);

if (!userId || !companyId || !SAFE_PATHNAMES.has(pathname)) return null;
if (!allowed.has(moduleId) && !safe.has(moduleId)) return null;
```

The route is restricted to `/app`, and the module must be either in the role/subscription-derived `allowedModuleIds` list or in the explicit `safeModuleIds` shell list. This prevents a stored `module=finance` or `module=admin` value from becoming an authorization grant.

The dashboard applies this after the authenticated session, current profile, company, and subscription filtering are ready (`BusinessSphereDashboard.jsx`, approximately lines 47431–47455). URL state takes priority over stored state, but it is passed through the same allowed/safe module check.

### 4. Read-time key and record checks — lines 80–93

```ts
if (!activeStorage || !context.userId || !context.companyId) return null;
const raw = activeStorage.getItem(
  getResumeLocationKey(context.userId, context.companyId),
);
if (!raw) return null;
const parsed = JSON.parse(raw);
if (parsed?.version !== RESUME_LOCATION_VERSION) return null;
if (parsed.userId !== context.userId || parsed.companyId !== context.companyId) return null;
return sanitizeResumeLocation(parsed, context);
```

This is the strongest part of the implementation. The lookup key comes only from the current context, then the stored JSON is checked for the exact same user and company IDs, then the complete sanitizer rechecks route and module permission. A copied record under another company’s key, a tampered record with a different identity, an old version, an invalid route, or an unauthorized module is rejected.

All storage and JSON errors fail closed to `null`.

### 5. Write-time key selection — lines 95–105

```ts
const normalized = sanitizeResumeLocation(location, context);
if (!activeStorage || !normalized) return null;
activeStorage.setItem(
  getResumeLocationKey(normalized.userId, normalized.companyId),
  JSON.stringify(normalized),
);
```

The write key is derived from the sanitized identity, and the sanitizer prevents a caller from supplying a different user/company identity from the context. The dashboard only calls this after it has a non-demo access token and verified `currentUser.id` plus `company.id` (`BusinessSphereDashboard.jsx`, approximately lines 47400–47420).

### 6. Logout cleanup — `BusinessSphereDashboard.jsx`, approximately lines 47053–47059

```ts
if (session?.userId && session?.company?.id) {
  clearResumeLocation(window.localStorage, session.userId, session.company.id);
}
clearStoredAuthSession();
if (session?.accessToken) authSignOut(session.accessToken);
```

The current user/company record is removed before local auth state is cleared. This prevents a later session from inheriting the previous tenant’s active location. The cleanup is deliberately best-effort and cannot block logout.

## What is implemented well

| Area | Assessment |
| --- | --- |
| Tenant keying | Strong. The storage key includes both user and company IDs and encodes them. |
| Read trust model | Strong. The current context determines the key; stored identity is verified again. |
| Authorization | Strong when `allowedModuleIds` is correctly derived from current role, visibility, and subscription state. Stored state cannot grant a module. |
| Route boundary | Strong. Only `/app` is accepted by `sanitizeResumeLocation`. |
| Failure behavior | Strong. Storage, JSON, and quota failures return `null`/`false`; logout cleanup never blocks sign-out. |
| Credential query filtering | Good but incomplete. Common password/token/secret/payment names are blocked, and token-bearing hashes are removed. |
| Data minimization | Strong for resume records. Only route, sanitized URL state, module ID, identities, version, and timestamp are stored. |

## Findings requiring hardening

### High priority: onboarding/auth parameters are incompletely excluded

`sanitizeResumeLocation` removes query keys matching `SENSITIVE_KEY_PATTERN` and the exact `auth` key, but it does not remove `invite`, `code`, `state`, `nonce`, or other OAuth/onboarding parameters. Its hash guard removes hashes containing `access_token` or `refresh_token`, but not `invite`, `code`, or `state`.

`buildResumeUrl` does remove `invite` (lines 125–131), but callers can invoke `writeResumeLocation` directly, and the sanitizer itself should be the authoritative boundary. The documentation currently claims join codes and OAuth fragments are excluded more broadly than this function guarantees.

**Recommended correction:** expand the denylist to include `invite`, `code`, `state`, `nonce`, `session`, `id_token`, `sso`, `saml`, and provider-specific callback parameters; apply the same sanitizer to both search and hash keys rather than checking only the raw hash string.

### Medium priority: sanitizer exceptions can escape the write helper

`writeResumeLocation` calls `sanitizeResumeLocation(location, context)` before entering its `try` block. `sanitizeResumeLocation` constructs a `URL` and could theoretically throw on an unexpected input. The persistence contract should fail closed and return `null` for all malformed inputs.

**Recommended correction:** move normalization inside the `try` block or make `sanitizeResumeLocation` catch URL-construction errors and return `null`.

### Medium priority: no expiry policy despite storing `savedAt`

The record stores `savedAt`, but `readResumeLocation` does not reject old records. This creates indefinite retention of a user’s last route and query state in localStorage and can restore a stale module after permissions or product configuration change. Permission validation still runs, so this is not an authorization bypass, but it is a privacy and UX retention issue.

**Recommended correction:** enforce a bounded TTL, such as 30 days, and remove expired records when encountered.

### Medium priority: `safeModuleIds` is an explicit bypass list

The dashboard’s `resumeSafeShellModules` includes `dashboard`, `profile`, `support`, `notifications`, `settings`, and `billing`. Any module placed in this list is accepted even when it is absent from the current subscription/visibility-derived `allowedModuleIds`.

This is safe only if every entry is truly a non-entitled shell route and cannot expose subscription-gated data or mutation controls. `billing` deserves particular review; if it is subscription-controlled or data-bearing, it should not be in the unconditional safe list.

**Recommended correction:** keep the safe list limited to routes that are explicitly public-to-the-authenticated-shell, or validate safe modules with a separate server-confirmed policy rather than a client constant.

### Medium priority: safe drafts are not tenant- or user-scoped

`readSafeDraft` and `writeSafeDraft` accept an arbitrary caller-provided key and do not use `getResumeLocationKey` or any equivalent user/company namespace. They are therefore a generic browser-storage helper, not an isolated multi-tenant draft store.

Also, `writeSafeDraft` filters only top-level fields with `Object.entries(value)`. A nested object such as `{ profile: { password: "..." } }` is serialized with the nested password intact.

**Recommended correction:** provide a tenant/user-scoped draft-key builder and recursively remove sensitive keys or use explicit field allowlists for every draft schema. The existing onboarding flow’s session-scoped contract should remain the preferred path for signup data.

### Low priority: stale records for other identities are retained

`clearResumeLocation` removes only the current user/company key. That is correct for avoiding cross-user deletion, but a shared browser can accumulate old records for previous users or companies. Because the record is navigation-only and read keys are context-derived, this is not a cross-tenant read vulnerability.

**Optional correction:** on logout, remove only keys with the current application prefix that are demonstrably stale, or add a retention sweep; do not delete another active user’s record based solely on client-side assumptions.

## Final rating

**Current isolation rating: Strong for resume-location authorization and namespace separation; incomplete for sensitive callback-parameter filtering and generic draft isolation.**

The implementation should not be described as making localStorage a security boundary. Its correct security claim is narrower: it prevents accidental cross-user/cross-company resume restoration and cannot elevate module access when the dashboard supplies correct server-derived authorization context. The four hardening items above should be addressed if the attached requirements demand a fully defensive persistence layer.
