# Live Guard Verification Findings

The published checkpoint `f1857309` loads the authenticated Smart Manager workspace without a startup or missing-manifest error. The live Finance verification succeeded earlier: the labeled `SCHEMA GUARD LIVE CHECK 48d913ea` expense was saved and the Finance table showed two confirmed expenses.

The first published CRM two-row import reproduced a server contract error because relational-shaped keys (`contact_name`, `company_name`, `stage`, `value_amount`, `email`, `phone`, `industry`) reached the guarded server mutation without generic normalization. The client fix now normalizes generic critical rows before the guarded path, and local tests/build pass. A post-checkpoint browser run still displayed the same contract error after the CRM import attempt, so deployment asset propagation or the authenticated browser bundle must be inspected before declaring the live CRM check complete.


The authenticated browser loads `BusinessSphereDashboard-X9gZApXP.js`, which is 369,953 bytes and does not contain the expected `crm_leads`, `Importing leads failed`, or `sourceRows` markers. No service workers are registered. The browser resource map shows the same `X9gZApXP` dashboard asset loaded for the current session. The local post-fix build emits a different dashboard asset (`BusinessSphereDashboard-XLZxZvtj.js`), so the production publication currently appears to serve a stale or alternate dashboard asset despite the new checkpoint.


A hard reload did not change the authenticated asset or behavior: the browser still reports the stale CRM contract error after the two-row import. This is not a service-worker issue; the published authenticated route is serving the older `X9gZApXP` dashboard bundle. The correction must be republished in a way that updates the authenticated app asset, or the production route must be diagnosed for an alternate build source.


After restarting services and republishing as checkpoint `98268ea9`, the authenticated route now serves `BusinessSphereDashboard-DXoikEff.js` at approximately 4.73 MB and includes the expected `crm_leads` code marker. This confirms the prior stale/alternate asset was replaced; the final two-row CRM import can now be re-run against the corrected client bundle.


The refreshed publication serves the corrected bundle and the CRM Leads workspace opens normally with the existing single lead. No startup, route, or missing-manifest error is present. The final import dialog is ready for the confirmed two-row test.


The final corrected production import preview accepts `guarded-crm-leads-live.csv` with 2 rows and 4/4 headers auto-matched. Both rows are visible with their contact, company, email, and phone values, and no schema error appears before commit.


With the corrected client bundle, the CRM preview succeeds, but the commit now fails with `Unexpected token '<', "<html><hea..." is not valid JSON`. This indicates the browser reached an HTML response instead of the expected tRPC JSON mutation response, so the remaining issue is the production API route/base URL or server deployment path rather than CRM payload normalization.


A non-mutating probe confirms `/api/trpc/persistSupabaseCriticalRow?batch=1` exists and returns structured JSON (405 for unsupported GET), so the route is present. The HTML parse error is therefore captured on the next POST to distinguish a tRPC transport response from an upstream Supabase response.


The first captured tRPC response after retry was an unrelated background query: `/api/trpc/listRoleChangeApprovals?batch=1` returned structured JSON 404 (`No procedure found on path`). The capture currently stored only the last request, so the next diagnostic will retain every tRPC request to isolate the CRM mutation call and determine whether background route noise is masking the result.
