# Customer Support Workspace — First-Area Upgrade Evidence

## Objective and boundary

This record covers the first focused upgrade under the attached enterprise-transformation directive. It removes a fabricated operational metric, improves the verified search and feedback flow, preserves the existing authenticated service boundary, and adds targeted regression coverage. No ticket, customer, support policy, workflow, message, provider credential, role, RLS policy, or tenant record was created or changed.

## Changes implemented

| Concern | Before | After |
| --- | --- | --- |
| Operational truthfulness | The workspace showed `Avg Handle Time: 8 min` as if it came from call data. | The value is calculated only from valid confirmed ticket creation and resolution/closure timestamps. It renders `—` with a neutral explanation when no usable lifecycle timestamps exist. |
| Lifecycle mapping | The ticket mapper retained only the date-oriented field needed by older presentation paths. | It now retains confirmed created, resolved, and closed timestamps required for derived metrics. |
| Search performance and boundary | The ticket table filtered loaded rows in the browser. | Two-or-more-character searches use the protected debounced server query, retaining tenant and role verification. Short input retains the existing local convenience filter. |
| Search feedback | The list read error state was tied only to the initial query. | The active query’s error is rendered with an appropriate retry operation; empty workspace and no-match states are distinguished. |
| KPI feedback | A KPI card treated every non-positive state as an adverse trend. | A neutral trend treatment now clearly communicates unavailable, loading, and missing-timing states without a false negative signal. |

## Validation evidence

| Check | Result |
| --- | --- |
| Focused support tests | 3 files and 14 tests passed, covering confirmed metrics, ticket persistence/roles, and UI contracts. |
| Complete test suite | 86 files and 290 tests passed; 5 explicitly gated files and 8 skips remain unchanged. |
| Static validation | `pnpm run check` passed. |
| Server parse | `server/routers.ts` parsed successfully through esbuild after the managed server restart, confirming the prior browser-console transform entry was historical/stale. |
| Tenant and permission boundary | The live policy inspection found tenant predicates based on `current_company_id()`; service reads and writes continue to derive identity and company from `resolveVerifiedProfile`. |
| Browser/runtime inspection | The authenticated workspace loaded normally after restart with confirmed-data dashboard states and no client-console output. Direct first-area visual validation will be repeated against the newly published version. |
| Full production bundle | The Vite production build transformed 2,653 modules but was terminated by the constrained sandbox during chunk rendering on three attempts. This is recorded as an environment-resource constraint, not a claimed successful build. |

## Security and data integrity position

The upgrade does not trust browser-supplied tenant identifiers. It does not add local-success behavior, simulated support transactions, artificial statistics, or outbound communications. Sensitive configuration and ticket operations remain protected by verified role checks and session-bound tenant access. The user-directed Resend boundary remains untouched.

## Remaining area-specific work

The support configuration policies should be normalized from the broad `public` role target to `authenticated` while retaining their current `current_company_id()` predicate, following a dedicated migration review and tenant-isolation acceptance. Physical mobile and printer acceptance, provider-backed inbound messaging, and Resend work remain independent, deferred checklist items.
