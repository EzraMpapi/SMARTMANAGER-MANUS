# Bank & MFI Domain Specification

## Regulatory and market context

The Bank of Tanzania identifies itself as the integrated regulator and supervisor for banks, financial institutions, mortgage finance institutions, finance lease institutions, credit reference bureaus, and bureaux de change. Its published catalogue includes the Microfinance Act 2018, microfinance service-provider regulations, SACCO and community microfinance-group regulations, AML regulations, credit-reference regulations, agent-banking guidelines, and consumer-protection guidance.[1]

The Financial Intelligence Unit’s banking guidance requires customer identification and verification, beneficial-owner identification, purpose and intended nature of the relationship, ongoing due diligence, enhanced due diligence for higher-risk relationships, record keeping, internal suspicious-activity reporting, and a designated Money Laundering Reporting Officer. It states that transaction and customer-identification records must be retained for at least five years and that transactions should be reconstructable from the records.[2]

The Bank of Tanzania payment-systems overview lists cash, cheques, electronic funds transfers, card payments, internet banking, mobile banking, and mobile money as payment instruments or channels, and describes the National Payment Systems Act 2015 as part of the regulatory basis for payment systems.[3] The Bank of Tanzania consumer-protection guidance emphasizes transparency, fair treatment, protection of client information, effective complaint handling, and redress mechanisms.[4]

These sources establish **configuration requirements**, not a claim that this application itself is a licensed bank, MFI, payment provider, or regulator. The module will therefore expose institution type, licence metadata, policy thresholds, and provider configuration as tenant-managed settings and will never represent a regulatory filing or provider settlement as successful without a confirmed external response.

## Core tenant-scoped domain

Every Bank & MFI record carries `company_id`, and all server queries derive the effective company from the verified Supabase profile rather than trusting a browser-supplied tenant. Branch, user role, and optional agent/teller scope are evaluated in addition to the company boundary. Financial records are immutable after posting except through compensating reversals or controlled adjustment workflows.

The domain is organized into the following aggregates:

| Aggregate | Principal records | Required controls |
|---|---|---|
| Institution and branches | Institution profile, licence metadata, branches, business days, Tanzania configuration | Tenant ownership, configurable timezone/currency, branch permissions |
| Customer and KYC/KYB | Individual/business customer, beneficial owners, identity documents, risk profile, KYC reviews, consent and complaints | No anonymous account opening, verification state, enhanced due diligence, retention metadata |
| Products and accounts | Account types, savings products, loan products, customer accounts, beneficiaries, standing orders | Product versioning, status transitions, unique account numbers, maker-checker for sensitive changes |
| Ledger and transactions | Journal batches, journal lines, financial transactions, account balance snapshots, reversals | Double-entry balance, integer minor units, idempotency, row locking, immutable posted records |
| Cash and channels | Tellers, tills, vaults, cash movements, agents, wallets, payment instructions, provider events | Cash-count reconciliation, channel state machine, provider reference, replay safety |
| Credit lifecycle | Loan application, score inputs, approvals, guarantors, collateral, loan, schedule, repayment, arrears, collection, write-off, restructure | Separation of duties, schedule arithmetic, approval evidence, PAR/NPL classification |
| Membership and group finance | Groups, members, shares, contributions, group loans, group guarantees | Group-level authorization, member ledger linkage, distribution traceability |
| Compliance and operations | AML rules, alerts, cases, audit events, notifications, reconciliation sessions, reports | No tipping-off UI, case assignment, complete audit chain, report reproducibility |

## Money and accounting invariants

Amounts are accepted and stored as non-negative integer minor units, with a configurable currency exponent. The default Tanzania configuration is `TZS` with an exponent of 2 for sub-unit-safe arithmetic, while the user interface formats whole shillings where appropriate. Interest, fees, and penalties are calculated with decimal-safe integer or string arithmetic at the server boundary; JavaScript floating-point values are not used for ledger mutations.

Every posted journal batch must have at least two lines, total debits equal total credits, one company, one currency, and a unique idempotency key. Account balances are derived from posted journal lines or updated by a single database transaction that verifies the expected version. A retry with the same idempotency key returns the original result and creates no second financial effect.

Available-balance checks occur inside the database transaction. A withdrawal or outgoing transfer is rejected when available balance is insufficient, when the account is blocked/dormant without an authorized override, when KYC is not valid for the configured operation, or when the transaction exceeds an institution/channel limit. Cross-company account IDs are rejected before any ledger write.

## State machines

Customer KYC states are `UNVERIFIED`, `PENDING_REVIEW`, `VERIFIED`, `ENHANCED_REVIEW`, `REJECTED`, and `EXPIRED`. Account states are `PENDING`, `ACTIVE`, `DORMANT`, `BLOCKED`, `CLOSED`, and `WRITTEN_OFF`. Payment states are `INITIATED`, `PENDING_PROVIDER`, `CONFIRMED`, `FAILED`, `REVERSED`, and `EXPIRED`. Loan states are `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `DISBURSED`, `ACTIVE`, `ARREARS`, `RESTRUCTURED`, `WRITTEN_OFF`, and `CLOSED`.

No state transition is performed by direct client patching. The server validates the current state, role, maker-checker policy, required documents, and ownership before recording the transition and corresponding audit event.

## Tanzania-ready defaults

The initial configuration defaults to `Africa/Dar_es_Salaam`, `TZS`, English labels with an extension point for Swahili, NIDA and TIN identity types, local phone-number validation, and configurable business-day calendars. Payment channels include `CASH`, `BANK_TRANSFER`, `CARD`, `MOBILE_MONEY`, `AGENT`, and `INTERNAL_TRANSFER`. Mobile-money workflows store provider, MSISDN, instruction ID, callback/reference, request and confirmation timestamps, and explicit reconciliation status; provider integration remains disabled until credentials and endpoints are configured.

The compliance UI includes customer risk classification, beneficial-owner capture, source-of-funds and purpose fields, PEP/sanctions-review flags, transaction monitoring rules, suspicious-activity case management, MLRO assignment, five-year retention metadata, and complaint SLA fields. Reports label their source rows and calculation period so an operator can reproduce the figures.

## Security model

Critical procedures use the existing verified-profile pattern. A verified Supabase access token is required, the profile’s `company_id` is authoritative, and roles are checked against operation-specific permissions. Sensitive operations such as loan approval, disbursement, write-off, account blocking, large cash withdrawal, journal adjustment, and AML-case closure require a different approver from the maker unless an explicitly configured emergency policy is invoked and audited.

All mutation requests accept a caller-generated idempotency key but do not trust caller-provided actor, company, balance, approval, or audit fields. The server derives those values from the verified context and current database state. Audit entries include actor, company, module, operation, record identifiers, outcome, request ID, and a redacted summary that excludes secrets and full identity-document contents.

## References

[1]: https://www.bot.go.tz/BankSupervision/Regulations "Bank of Tanzania — Laws and Regulations"
[2]: https://www.fiu.go.tz/uploads/documents/en-1712237021-AMLguidelinesForBankingInstitutions.pdf "Financial Intelligence Unit — Anti-Money Laundering Guidelines to Banking Institutions"
[3]: https://www.bot.go.tz/PaymentSystem "Bank of Tanzania — Payment Systems Overview"
[4]: https://www.bot.go.tz/DFDI/ConsumerProtection "Bank of Tanzania — Financial Consumer Protection"
