# SMART MANAGER ERP Forensic Audit Report

**Repository:** `EzraMpapi/SMARTMANAGER-MANUS`
**Live Supabase project:** `rlhngsrihahhyxnjxrxm`
**Audit date:** 25 August 2026
**Scope:** Attachment requirements covering codebase, modules, controls, persistence, Supabase schema, RLS, integrations, workflows, tests, and build verification.

## Executive summary

The repository and live Supabase project were audited using static code analysis, migration/catalog reconciliation, Supabase table metadata, Supabase security/performance advisors, the complete Vitest suite, production-equivalent frontend/backend build commands, and the available browser integration suite.

The audit verified that the live project contains **533 public tables**, all 533 with RLS enabled, **732 public policies**, **246 public functions**, **203 public `SECURITY DEFINER` functions**, **451 non-internal triggers**, and no public views in the queried metadata baseline. Local migration-defined tables had no missing live counterparts in the repository-to-live comparison. No new table was created because the evidence did not justify adding duplicate or unapproved schema.

One reproducible product defect was found and repaired: the Android Trusted Web Activity manifest still pointed to the retired Manus preview origin instead of the verified Vercel production origin. The template now uses `menejajanja.vercel.app` for the host, manifest, and icons. The focused regression test passed after the fix, followed by a complete Vitest pass.

The audit also identified unresolved Supabase advisor backlog and environment-dependent browser-test failures. These are documented rather than hidden. Broad security or index changes were not applied automatically because they require object-by-object access and workload review; mass changes could break legitimate tenant workflows or expose protected data.

## Audit coverage and method

| Area | Evidence collected | Result |
|---|---|---|
| Repository source | 485 TypeScript/JavaScript source files scanned | Static inventory completed |
| Interactive controls | 1,506 button-like/control tags counted heuristically | Candidate inventory generated; full semantic verification requires module-specific browser sessions |
| TODO/FIXME | 1 match | Reviewed as a follow-up item, not automatically removed |
| Mock/demo/sample/placeholder terms | 1,110 matches | Many are test fixtures, UI copy, or design contracts; keyword count is not proof of fake production data |
| Browser/session storage | 166 matches | Requires control-by-control classification; auth/session and UI preferences are mixed with persistence contracts |
| Direct Supabase references | 4 direct client/server pattern matches in the narrow scan | Most access is routed through shared adapters/RPC contracts |
| Catch blocks | 457 | Requires semantic review; the count alone does not prove swallowed failures |
| Supabase migrations | 112 local SQL files | Compared with live migration catalog |
| Live migrations | Applied through the current team-invitation and webhook changes | No unapplied committed table migration identified |
| Vitest | 239 files: 233 passed, 6 skipped; 983 tests: 969 passed, 14 skipped | Passed after Android-origin repair |
| TypeScript | `pnpm check` | Passed |
| Frontend production build | Vite build | Passed with a large-chunk warning |
| Backend bundles | Core and API esbuild bundles | Passed |
| Live schema verifier | `pnpm run verify:supabase-schema` | Blocked because `SUPABASE_SECRET_KEY` was not available in the sandbox |
| Browser integration | Playwright suite | Partial execution; several workflows passed, environment-dependent tests timed out or failed and the long run was stopped after evidence capture |

The static counts are triage indicators, not assertions that every matching string represents a defect. The required complete UI persistence proof needs authenticated tenant fixtures and a controlled browser session for each workflow.

## Module and integration map

| Module family | Representative UI/service paths | Live schema status | Verification status |
|---|---|---|---|
| Core workspace/auth | `BusinessSphereDashboard`, `AuthContext`, Supabase auth client, profile identity | Core profile, company, membership, and identity objects present | Unit/contract tests passed; browser auth preview tests partly passed |
| Community Groups | `dashboardExtractedModules`, community group server contracts, persisted team invitations | Community group tables, guards, and invitation storage present | Contract tests passed; browser journey was environment-dependent |
| Healthcare | Healthcare workspace/router, patient/appointment/claims flows | Healthcare tables and notification/reminder objects present | Healthcare contract tests passed; browser live workflow timed out in the available environment |
| Pharmacy | `PharmacyWorkspace`, pharmacy operations | Pharmacy catalog and operations tables present | Browser workspace and read-only-role tests passed |
| Microfinance/Bank & MFI | Microfinance and bank operation adapters/RPC contracts | Bank, loan, repayment, guarantor, ledger, and control tables present | Contract tests passed; live browser registration test was environment-dependent |
| Finance/accounting | Financial foundation, journals, reconciliation and reporting contracts | Finance tables and audit objects present | Contract tests passed; live transaction verification requires controlled tenant fixtures |
| Sales/POS | POS transaction, returns, customer credit, pricing and loyalty contracts | POS tables and workflow functions present | Contract tests passed; operations browser checks passed where available |
| HR/workforce/payroll | Employee portal, workforce permissions, payroll and leave contracts | Workforce, HR, payroll and leave tables present | Contract/security tests passed |
| School | School workspace, admissions, portal and learner metrics | School module tables present | Browser checks were environment-dependent and timed out in the available run |
| Hospitality/restaurant | Hospitality workspace, POS/services, guest engagement, finance | Hospitality tables and fiscal configuration present | Contract coverage present; full live CRUD requires authenticated fixtures |
| Fleet/property | Fleet and property workspaces and service contracts | Fleet/property tables present | Operations/property browser coverage was partially environment-dependent |
| Subscription/billing | Billing workspace and subscription RPC contracts | Plan, trial, access snapshot, activation, and audit objects present | Billing contract tests passed; live provider/account verification requires credentials |
| Messaging/integrations | WhatsApp, email, storage, AI and notification adapters | Supporting links, notification and audit structures present | Adapter/contract coverage exists; external provider credentials were not exercised |
| Android/PWA | Manifest, TWA template, Vercel origin and logo assets | Build assets are repository-managed | Fixed stale origin; focused Android packaging tests passed |

## Database reconciliation

The local repository-to-live comparison found **300 migration-defined tables** and no migration-defined table missing from the saved live Supabase inventory. The conservative source-reference comparison found 68 public tables referenced by application/test source and no probable referenced table absent from the live inventory. These results mean there was no evidence for automatically creating “all missing tables.”

The Healthcare Laboratory `hc_lab_categories` schema remains intentionally unapplied because its draft is a product decision artifact, not an approved migration. The proposed DDL and authorization contract are stored separately for review and do not alter the live project.

## Supabase security and performance findings

The current security advisor returned **139 lints**: 133 warnings and 6 informational notices. The major groups were 126 authenticated users able to execute `SECURITY DEFINER` functions, 6 anonymous users able to execute `SECURITY DEFINER` functions, 6 RLS-enabled tables with no policies, and 1 leaked-password-protection notice. These findings are not all equivalent: some functions may be intentionally exposed, while others require revocation or movement to service-only schemas.

The performance advisor returned **1,045 lints**: 885 informational and 160 warnings. The major groups were 514 unindexed foreign-key findings, 371 unused-index findings, 150 multiple-permissive-policy findings, and 10 RLS init-plan findings. Unused indexes must not be dropped blindly because the advisor observes current usage, not future workload requirements. Multiple permissive policies require policy-semantic review before consolidation.

| Backlog | Safe next action |
|---|---|
| Anonymous `SECURITY DEFINER` functions | Confirm public-use contract; revoke `anon` execution for non-public booking/seat functions |
| Authenticated `SECURITY DEFINER` functions | Group by business domain; verify caller, tenant, input bounds, search path, and execute grants; migrate in waves |
| RLS-enabled tables with no policies | Decide service-only versus authenticated read/write purpose; add least-privilege policies or move out of exposed schemas |
| Unindexed foreign keys | Prioritize active query paths and high-write tables; apply reviewed indexes in batches with EXPLAIN validation |
| Multiple permissive policies | Compare combined boolean semantics and preserve deny boundaries before replacing policies |
| RLS init-plan warnings | Wrap stable auth expressions as recommended and benchmark policy plans |
| Leaked password protection | Enable in Supabase Auth settings after owner approval and verify signup/reset behavior |

## Repaired defect

The Android TWA template used `bserp-dashbo-xgm6fauw.manus.space` while the packaging guide and regression test require the verified Vercel origin `menejajanja.vercel.app`. The template was corrected for `host`, `iconUrl`, `maskableIconUrl`, and `webManifestUrl`.

| Validation | Result |
|---|---:|
| `server/androidPackaging.test.ts` | 4 passed |
| Full Vitest suite after repair | 969 passed, 14 skipped |
| TypeScript check | Passed |
| Vite production build | Passed |
| Core server bundle | Passed |
| API server bundle | Passed |

## Browser and persistence limitations

The browser suite demonstrated that several workflows are reachable and functioning in the local test harness, including authentication preview behavior, Money Agent, operations command centers, patient SMS consent, Pharmacy, session recovery, and some role boundaries. The run also produced timeouts or failures for Community Groups, Healthcare, Microfinance, production smoke, profile identity, Property Management, and School flows. Because the suite did not complete cleanly and some tests depend on controlled authentication, these results cannot be represented as proof of complete end-to-end persistence.

The sandbox did not have production or staging authenticated tenant credentials, a local PostgreSQL/Supabase runtime, or a `SUPABASE_SECRET_KEY`. Accordingly, no synthetic create/update/delete transaction was executed against live production, and no claim is made that every module’s UI write path has been directly verified in the database. The live Supabase connector was used for read-only schema/migration/advisor inspection only during this audit.

## Error register

| Error | Root cause | Fix/status | Evidence |
|---|---|---|---|
| Android packaging test failed on host/icon origin | TWA template retained retired Manus preview URL | Fixed all four production-origin fields | Focused test and full Vitest pass |
| Supabase schema verifier could not run | Required `SUPABASE_SECRET_KEY` absent from sandbox | Not a product defect; requires injected staging/approved verification credentials | Command returned explicit missing-env message |
| Browser suite had pre-run/environment-dependent timeouts and failures | Controlled auth/tenant/external-service prerequisites were not uniformly available; long run stalled | Captured evidence; requires per-module staging fixtures and isolated reruns | Playwright logs and artifacts |
| Supabase advisor backlog remains | Historical security/index/policy debt spans many domains | Not mass-applied; wave-based remediation required | Current security/performance advisor snapshots |
| Large Vite chunk warning | `BusinessSphereDashboard` bundle remains approximately 4.47 MB after minification | Build succeeds; dynamic import/manual chunking should be a separate P1 performance task | Vite build output |

## Delivery and next gates

The current audit artifacts include the conservative inventory script, advisor summarizer, Healthcare Laboratory decision/auth documents, migration DDL draft, GitHub runner analysis, diagnostics script, and runner dashboard. Only the Android TWA template was modified as a product source repair during this audit sequence; generated browser artifacts are not product changes.

The next safe engineering gates are to obtain approved staging/authenticated tenant fixtures, run module-specific CRUD and RLS tests with direct database assertions, apply only reviewed security/index migrations in bounded waves, rerun the Supabase schema verifier with the required secret, and rerun browser tests one workflow at a time. Production migrations, payment/settlement actions, external messaging, and destructive deletes must remain explicitly gated.

## References

[1]: https://supabase.com/docs/guides/database/database-linter "Supabase database linter and advisor guidance"

[2]: https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions "GitHub Actions workflow syntax"

[3]: https://www.postgresql.org/docs/current/ddl-rowsecurity.html "PostgreSQL row security policies"
