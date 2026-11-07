# Money Agent module implementation report

## Delivery status

The repository now contains an original, tenant-scoped **Money Agent** module for Tanzania-ready agent-banking operations. The implementation is designed for the existing React/Vite/Express/tRPC/Supabase/Vercel stack and is intentionally conservative around money movement: it persists transaction intents and cash-ledger workflows, but it does not claim or perform real external mobile-money, bank, bill, airtime, data, SMS, WhatsApp, or provider settlement activity.

The code and migration are **repository-ready and validated locally**. The Supabase migration remains pending controlled application to the intended environment. Until that migration is applied successfully and approved provider adapters are configured, the production workspace must continue to show unavailable, pending-provider, or configuration-required states rather than synthetic balances or fabricated completion.

## Implemented architecture

| Layer | Delivered implementation |
| --- | --- |
| Database | `supabase/migrations/20260823_001_money_agent_core.sql` creates branches, agents, customers, wallets, services, fee and commission rules, limits, transactions, approvals, settlements, reconciliations, alerts, audit events, PIN credentials, receipts, notifications, risk events, and daily summaries. |
| Server | `server/moneyAgentOperations.ts` validates Money Agent inputs, requires an authenticated verified workspace profile, forwards only the user bearer token to Supabase RPCs, and maps safe transport failures to tRPC errors. |
| Router | `moneyAgent.snapshot`, `moneyAgent.customerSnapshot`, and `moneyAgent.action` are protected tRPC procedures. |
| Internal workspace | `client/src/components/MoneyAgentWorkspace.jsx` provides mobile-first operational views for overview, transactions, agents/KYC, customers, approvals, settlement, and audit/reporting. |
| Customer portal | A canonical `Customer` role receives a separate customer-only portal backed by `money_agent_customer_snapshot`; it cannot see agent registers, approvals, company-wide balances, or other customers. |
| Dashboard | Money Agent module and role catalog entries are integrated into `BusinessSphereDashboard.jsx`; Money Agent roles route to the Money Agent workspace, and the Customer role routes to its isolated portal. |
| Browser validation | `browser-tests/moneyAgentWorkspace.spec.ts` exercises authenticated Customer routing and mocked customer snapshot rendering without a real provider or database. |
| Contract validation | `server/moneyAgentContracts.test.ts` covers schema family, tenant/RLS markers, state machine, idempotency, limits, ledger immutability, protected procedures, provider boundary, customer isolation, KYC actions, and operational evidence markers. |
| Offline SQL validation | `scripts/validate_money_agent_sql.py` parses the migration with PostgreSQL-aware `pglast` and checks required objects, grants, protected PIN handling, and financial-control markers. |

## Functional scope delivered

The database workflow supports a hierarchy of companies, branches, supervisors, agents, and customers. Agent and customer records carry KYC/KYB status, active or blocked states, Tanzania phone validation at the server boundary, optional profile links, branch assignment, and tenant ownership. Profile links are checked against the current company before they are persisted.

Agent wallets are explicitly typed as **Float**, **Cash**, or **Commission** and are restricted to TZS. Cash-in and cash-out approval paths lock the relevant wallets, check available balance, post balanced double-entry ledger rows, update the wallet balances atomically, and record a daily summary, receipt, in-app notification, and audit event for a successful cash transaction. Commission and fee calculations are server-derived from configured rules rather than trusted from the browser.

The supported transaction taxonomy includes cash-in, cash-out, transfer, bill payment, airtime, data, mobile money, bank-to-wallet, and wallet-to-bank intents. Provider-dependent services are stored with a non-secret provider label and remain **Pending Provider** after approval because no approved external adapter is configured in this change. The server never accepts a provider secret from the client and never fabricates a provider reference or successful external response.

Transactions use a UUID idempotency key and a unique tenant constraint. The server applies agent status, KYC/KYB, single-transaction, daily, monthly, velocity, duplicate, service, and available-wallet controls before creating an awaiting-authorization transaction intent. The approval model records the maker and checker separately. The maker cannot approve, reject, reverse, or refund the maker’s own transaction. Reversal and refund are deliberately limited to successful cash transactions and post compensating ledger entries rather than rewriting financial history.

Settlements capture business date, opening float, closing float, expected float, variance, settlement status, and notes. A reconciliation row is created for controlled review, with audit evidence on review. Snapshot reporting includes live cash-in and cash-out amounts, fee revenue, commission accrued, open risk events, open alerts, agent performance, branch performance, customer activity, daily summaries, receipts, notifications, risk events, and audit events subject to role permissions.

## Security posture

All Money Agent tables are tenant-owned and have RLS enabled. Internal reads are exposed through a protected snapshot RPC and table policies. The PIN credential table is deliberately excluded from ordinary SELECT grants and snapshot projections. PINs are accepted only by the protected server action and stored as salted server-side hashes through `crypt(..., gen_salt('bf'))`; the raw PIN is not written to the audit payload or returned to the browser.

Financial transactions, ledger entries, and audit events have immutable database guards. Direct UPDATE or DELETE attempts are rejected unless an internal workflow setting is active. The ledger posting function rejects unbalanced debit and credit totals. Internal writes use a tightly scoped security-definer RPC path; the Express layer requires a bearer token and verified profile/company assignment before forwarding the request to Supabase with the end-user token.

The Customer portal is not a filtered copy of the internal workspace. It calls a separate RPC that requires the `Customer` role and selects the customer row linked to `auth.uid()` in the current company. It returns only that customer’s own wallet, transaction, receipt, and notification data. A customer without a linked active profile receives a safe unavailable state.

## Current operational boundary

| Capability | State in this change |
| --- | --- |
| Internal branch, agent, and customer registration | Persisted through protected RPC actions; customer and agent records default to pending KYC/KYB where appropriate. |
| Manual KYC/KYB status review | Persisted through protected actions and audit events. This is not an automated identity-document or regulator verification integration. |
| Secure PIN credential storage | Salted server-side hash storage and status metadata are implemented. PIN verification is not yet wired to an external OTP/PIN provider or to a production authorization challenge. |
| Cash-in/cash-out ledger workflow | Persisted with approval, wallet locks, balance checks, balanced postings, receipts, notifications, daily summaries, and audit events. It is an internal ledger simulation, not a real cash movement confirmation. |
| Provider-dependent transfers, bills, airtime, data, mobile money, and bank-wallet services | Intent and approval state are persisted. They stop at `Pending Provider` until an approved adapter is implemented and configured. |
| SMS, WhatsApp, and email notifications | In-app notification records are created for successful cash transactions. External delivery is not enabled or claimed. |
| Reconciliation and settlement | Persisted daily settlement and reconciliation workflow with variance review. It is not provider settlement reconciliation. |
| Finance, Accounting, Banking & MFI, VICOBA/SACCOS, Community Groups, and POS integration | The Money Agent module establishes safe internal boundaries and avoids fabricated cross-module writes. Live cross-module posting requires an approved integration contract and migration-specific mapping. |
| Production data | No migration was applied by this task. No real wallet was funded, no customer was charged, and no provider endpoint was called. |

## Required production activation steps

A deployment owner must first review and apply the migration through the project’s controlled Supabase migration process, then verify RLS, grants, function ownership, and the ledger invariants in a non-production environment before production rollout. The migration has not been applied by this task and must not be treated as live financial persistence until that verification is complete.

External connectivity requires separately approved provider adapters, credentials stored only in server-side configuration or an approved secret manager, provider-specific idempotency and webhook verification, delivery retry/dead-letter policy, and reconciliation contracts. SMS, WhatsApp, OTP, and email delivery require explicit provider configuration and consent handling. None of those credentials were supplied or used here.

A production rollout should also add environment-specific integration tests for the approved provider adapters, a controlled PIN/OTP challenge flow, regulator-approved KYC/KYB document handling, operational alert routing, scheduled daily close, and a formal chart-of-accounts mapping for any cross-module Finance or Accounting posting. The existing separate HarakaPay credential acceptance issue remains unresolved and is not used as evidence for this Money Agent module.

## Validation evidence

The latest local validation completed successfully after the final code changes:

| Check | Result |
| --- | --- |
| `pnpm check` | Passed. |
| `pnpm exec vitest run server/moneyAgentContracts.test.ts` | Passed: 10 tests. |
| `pnpm test` | Passed: 173 files; 691 tests passed; 5 files and 8 tests skipped by existing suite policy. |
| `VERCEL=1 pnpm build` | Passed. Money Agent workspace emitted as a lazy chunk. |
| E2E Vite build with placeholder Supabase values | Passed. No live database access occurred. |
| `pnpm test:browser` | Passed: 17 browser tests, including the new Customer Money Agent portal spec. |
| `python3 scripts/validate_money_agent_sql.py` | Passed: 90 PostgreSQL statements parsed and required controls present. |
| `git diff --check` | Passed during final review before commit. |

The tests use mocked responses or source contracts where a live database/provider is required. They therefore demonstrate code-path, authorization-boundary, persistence-contract, and UI behavior readiness; they do not prove external funds movement, provider settlement, OTP delivery, or live Supabase migration success.
