# Live Guard Verification Findings

The published checkpoint `f1857309` loads the authenticated Smart Manager workspace without a startup or missing-manifest error. The live Finance verification succeeded earlier: the labeled `SCHEMA GUARD LIVE CHECK 48d913ea` expense was saved and the Finance table showed two confirmed expenses.

The first published CRM two-row import reproduced a server contract error because relational-shaped keys (`contact_name`, `company_name`, `stage`, `value_amount`, `email`, `phone`, `industry`) reached the guarded server mutation without generic normalization. The client fix now normalizes generic critical rows before the guarded path, and local tests/build pass. A post-checkpoint browser run still displayed the same contract error after the CRM import attempt, so deployment asset propagation or the authenticated browser bundle must be inspected before declaring the live CRM check complete.


The authenticated browser loads `BusinessSphereDashboard-X9gZApXP.js`, which is 369,953 bytes and does not contain the expected `crm_leads`, `Importing leads failed`, or `sourceRows` markers. No service workers are registered. The browser resource map shows the same `X9gZApXP` dashboard asset loaded for the current session. The local post-fix build emits a different dashboard asset (`BusinessSphereDashboard-XLZxZvtj.js`), so the production publication currently appears to serve a stale or alternate dashboard asset despite the new checkpoint.


A hard reload did not change the authenticated asset or behavior: the browser still reports the stale CRM contract error after the two-row import. This is not a service-worker issue; the published authenticated route is serving the older `X9gZApXP` dashboard bundle. The correction must be republished in a way that updates the authenticated app asset, or the production route must be diagnosed for an alternate build source.
