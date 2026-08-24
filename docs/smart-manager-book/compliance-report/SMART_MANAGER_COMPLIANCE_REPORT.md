# SMART MANAGER ERP — SECURITY AND DATABASE COMPLIANCE REPORT
## Focused extraction from the repository-audited master system book

> **Audit date:** 24 August 2026; **Supabase project:** `rlhngsrihahhyxnjxrxm`; **Evidence mode:** Read-only; **Source commit:** `d20a9b922e8596d54f3c7538b6389f71f4aef869`; **Prepared by:** Manus AI

## Executive scope

This focused report extracts the **security risk register** and **live Supabase database schema dictionary** from the Smart Manager ERP master book. It is a compliance evidence report, not a statement that every module, provider, policy, or external integration is production-complete. The live database evidence was collected read-only and is time-bound to the audit date. [1] [2]

The report separates observed evidence from remediation recommendations. It does not authorize destructive policy changes, broad RLS rewrites, credential rotation, provider payments, or production migration application. Any remediation must remain source-versioned, reviewed, tenant-scoped, and validated against the live environment before release.

## Evidence snapshot

| Metric | Observed value | Interpretation |
| --- | --- | --- |
| Total tables | 542 | Combined public and auth tables returned by the read-only inventory |
| Public tables | 519 | Application-facing public-schema inventory |
| Auth tables | 23 | Supabase Auth schema inventory |
| Public RLS enabled | 519 | Public application tables reported with RLS enabled |
| Public RLS disabled | 0 | No public application table should remain unprotected |
| Auth-schema entries without RLS | 7 | Supabase-managed internal tables; do not blanket-enable |
| Total RLS enabled | 535 | Combined metadata count across returned schemas |
| Migration records | 133 | Records returned by the live migration ledger |
| Security advisor | 119 | 118 WARN and 1 INFO |
| Performance advisor | 851 | 162 WARN and 689 INFO in the saved advisor-count file |

> **Interpretation note.** Advisor counts are findings, not proof that every finding has the same severity or exploitability. The database dictionary reports metadata and row estimates; it does not expose row contents. [3] [4]

# 1. Security risk register

The risk register below preserves the six risks extracted from the master book. The owner and priority columns are compliance-management additions for triage; they do not change the underlying evidence or severity wording.

| ID | Risk | Severity | Priority | Primary owner |
| --- | --- | --- | --- | --- |
| R-01 | Authenticated SECURITY DEFINER routines | WARN | P1 | Database/security engineering |
| R-02 | Multiple permissive RLS policies | WARN | P1 | Database/security engineering |
| R-03 | Legacy non-atomic invoice payment path | P0 historical finding | P0 | Finance platform engineering |
| R-04 | Large dashboard boundary | P2 | P2 | Frontend platform engineering |
| R-05 | External provider readiness | Configuration boundary | P1 | Platform operations |
| R-06 | Demo fallback risk | Medium | P1 | Application/platform engineering |

## R-01 — Authenticated SECURITY DEFINER routines

**Severity:** WARN; **Priority:** P1; **Primary owner:** Database/security engineering

**Evidence.** The live security advisor reported 118 WARN and 1 INFO lint at the audit timestamp; many WARNs identify signed-in execution of SECURITY DEFINER routines.

**Recommended remediation.** Review each signature, keep only intentionally callable endpoints, pin search paths, apply narrow grants, and move internal helpers out of the exposed API surface where possible.

**Control principle.** The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

## R-02 — Multiple permissive RLS policies

**Severity:** WARN; **Priority:** P1; **Primary owner:** Database/security engineering

**Evidence.** The live performance advisor reported 851 lints, including multiple permissive policies on the same table/action.

**Recommended remediation.** Consolidate overlapping policies by command and role after verifying semantics; do not blindly drop production policies.

**Control principle.** The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

## R-03 — Legacy non-atomic invoice payment path

**Severity:** P0 historical finding; **Priority:** P0; **Primary owner:** Finance platform engineering

**Evidence.** The audit report records separate sales_payments insertion and invoice balance update without a proven atomic idempotency RPC.

**Recommended remediation.** Add a reviewed tenant-scoped atomic RPC and durable idempotency key before claiming concurrent-safe posting.

**Control principle.** The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

## R-04 — Large dashboard boundary

**Severity:** P2; **Priority:** P2; **Primary owner:** Frontend platform engineering

**Evidence.** BusinessSphereDashboard.jsx remains a very large monolithic component and the build reports a non-fatal large-chunk warning.

**Recommended remediation.** Decompose incrementally after persistence and live-environment blockers are addressed; avoid cosmetic rewrites that increase risk.

**Control principle.** The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

## R-05 — External provider readiness

**Severity:** Configuration boundary; **Priority:** P1; **Primary owner:** Platform operations

**Evidence.** HarakaPay, TRA/VFD, WhatsApp, email/SMS, storage, and AI services depend on deployment configuration and approved credentials.

**Recommended remediation.** Keep provider secrets server-side, expose readiness states, and test only controlled sandbox or authorized production paths.

**Control principle.** The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

## R-06 — Demo fallback risk

**Severity:** Medium; **Priority:** P1; **Primary owner:** Application/platform engineering

**Evidence.** The client has an explicit seed-data fallback when Supabase is not configured.

**Recommended remediation.** Production deployments must fail closed with a clear configuration message; demo mode must remain explicit and non-operational.

**Control principle.** The platform should prefer explicit identity, narrow role authority, company scope, server confirmation, database enforcement, and auditable results. A local UI state, a draft message, or a client-supplied amount cannot replace those controls.

## 1.1 Remediation sequencing

The historical P0 invoice-payment finding should be handled as a finance-safety gate before concurrent-safe posting is claimed. The SECURITY DEFINER and RLS-policy findings should be addressed through signature-specific and command-specific review rather than bulk revocation or blanket policy replacement. Provider readiness and demo fallback are release-boundary controls, while dashboard decomposition is a P2 engineering improvement that should not precede data-integrity and access-control work.

| Sequence | Gate | Required evidence before closure |
| --- | --- | --- |
| 1 | Invoice payment atomicity | Tenant-scoped atomic RPC, durable idempotency, concurrent test evidence, reconciliation evidence |
| 2 | Security-definer exposure | Per-signature inventory, pinned search paths, least-privilege grants, intentional endpoint record |
| 3 | RLS policy consolidation | Command/role semantics reviewed, tenant isolation tests, no broad policy regression |
| 4 | Provider readiness | Server-side secret boundary, sandbox/approved production acceptance, visible readiness state |
| 5 | Demo fallback | Fail-closed production configuration and explicit non-operational demo mode |
| 6 | Dashboard decomposition | Incremental module boundaries, bundle evidence, regression coverage |

# 2. Database schema dictionary

The live read-only Supabase inventory returned **542 tables**: 519 public and 23 auth. All 519 public application tables reported RLS enabled; the 7 non-RLS entries are Supabase-managed auth-schema tables. This dictionary lists the **519 public tables** observed in the snapshot, their observed columns, reported primary keys, RLS state, and reported row estimates. It is metadata evidence, not a data export. [3]

## 2.1 Canonical identity and tenancy contract

The Smart Manager architecture uses Supabase Auth plus the existing profile, company, membership, workspace, and preference surfaces. A separate application `users` table must not be introduced merely to restate `auth.users` or `profiles`.

| Table | Purpose | Security boundary | Used by |
| --- | --- | --- | --- |
| auth.users | Supabase Auth identity | Auth session and token boundary | PublicAuthGateway and profile resolution |
| profiles | User/company profile and role context | Authenticated self-service and company scope | Most protected workflows |
| companies | Organization/company identity | Tenant boundary | All company-scoped modules |
| company_memberships | Membership and role relationship | Company plus user plus role/status | Invitations, onboarding, authorization |
| workspaces | Workspace context where present | Workspace-aware navigation | Shell and module context |
| user_table_preferences | User preference persistence | Self-only or company-scoped policy | Dashboard/profile settings |

## 2.2 Canonical subscription contract

Subscription authority remains in the existing billing and subscription tables plus the server/database access snapshot. Entitlements are represented through the catalog and access snapshot contract rather than a parallel subscription-items or duplicate-entitlements architecture.

| Table or contract | Purpose | Contract | Evidence |
| --- | --- | --- | --- |
| billing_plans | Package catalog | Free and paid plan metadata, entitlements | Subscription migrations and live inventory |
| billing_profiles | Billing contact/configuration | Company-scoped billing profile | Billing foundation migration |
| tenant_subscriptions | Company subscription state | Pending/Active/Grace/Expired/RequiresPlan/Cancelled/Superseded | Subscription model migrations |
| subscription_payments | Provider payment state | Monthly cycle, idempotency, provider order | HarakaPay handlers and migrations |
| subscription_invoices | Billing invoice evidence | Payment/subscription linkage | Billing foundation migration |
| subscription_usage | Usage/limits evidence | Company and plan context | Billing foundation migration |
| subscription_events | Billing lifecycle events | Audit and reconciliation history | Billing migrations |
| subscription_notifications | Billing notifications | Company-scoped notification state | Billing migrations |
| billing_access_snapshot | Authoritative access result | Server/database snapshot; not a table | Access adapter and protected API |

## 2.3 Public table dictionary

| Table | Observed columns | Primary key | RLS | Rows reported |
| --- | --- | --- | --- | --- |
| approval_signatures | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| audit_log | id, company_id, action, module, actor, details, subject, detail, created_at, updated_at | id | Enabled | 53 |
| bank_account_beneficiaries | id, company_id, customer_id, account_id, beneficiary_name, beneficiary_account_number, bank_name, phone, status, verified_at, created_by, created_at, updated_at | id | Enabled | 0 |
| bank_account_types | id, company_id, code, name, product_kind, currency, minimum_opening_balance, minimum_operating_balance, annual_interest_rate, withdrawal_fee, status, data, created_at, updated_at | id | Enabled | 0 |
| bank_accounts | id, company_id, name, status, amount, notes, data, created_at, updated_at, account_number, customer_id, account_type_id, branch_id, currency, ledger_balance, available_balance, hold_amount, opened_at, closed_at, version, created_by | id | Enabled | 0 |
| bank_agents | id, company_id, agent_code, name, phone, national_id, branch_id, status, float_balance, commission_rate, data, created_at, updated_at | id | Enabled | 0 |
| bank_aml_alerts | id, company_id, alert_number, customer_id, transaction_id, rule_code, risk_level, status, rationale, assigned_to, mlro_decision, closed_at, data, created_at, updated_at | id | Enabled | 0 |
| bank_audit_events | id, company_id, actor_id, operation, entity_type, entity_id, outcome, request_id, redacted_payload, created_at | id | Enabled | 0 |
| bank_beneficial_owners | id, company_id, customer_id, full_name, national_id, ownership_percent, verification_status, data, created_at, updated_at | id | Enabled | 0 |
| bank_branches | id, company_id, institution_id, code, name, region, district, address, phone, status, created_at, updated_at | id | Enabled | 0 |
| bank_cash_movements | id, company_id, teller_id, branch_id, movement_type, amount, currency, status, transaction_id, approved_by, approved_at, idempotency_key, narration, created_by, created_at | id | Enabled | 0 |
| bank_collateral | id, company_id, application_id, collateral_type, description, ownership_document, estimated_value, valuation_date, verification_status, data, created_at | id | Enabled | 0 |
| bank_customer_documents | id, company_id, customer_id, document_type, document_number, file_url, issued_at, expires_at, verification_status, verified_by, verified_at, data, created_at, updated_at | id | Enabled | 0 |
| bank_customers | id, company_id, customer_number, customer_kind, full_name, phone, email, date_of_birth, gender, occupation, address, national_id, tin, risk_rating, pep_status, source_of_funds, relationship_purpose, kyc_status, kyc_verified_at, kyc_verified_by, kyc_expires_at, status, branch_id, data, created_by, created_at, updated_at | id | Enabled | 0 |
| bank_fixed_deposits | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| bank_group_members | id, company_id, group_id, customer_id, role, shares_count, joined_at, status | id | Enabled | 0 |
| bank_groups | id, company_id, group_number, name, group_type, meeting_frequency, status, branch_id, data, created_at, updated_at | id | Enabled | 0 |
| bank_guarantors | id, company_id, application_id, customer_id, guarantee_amount, consent_status, consented_at, data, created_at | id | Enabled | 0 |
| bank_idempotency_keys | id, company_id, idempotency_key, operation, request_hash, status, result, created_by, created_at, completed_at | id | Enabled | 0 |
| bank_institutions | id, company_id, legal_name, trading_name, institution_type, licence_number, licence_status, country_code, currency, currency_exponent, timezone, fiscal_year_start_month, data, created_by, created_at, updated_at | id | Enabled | 0 |
| bank_journal_batches | id, company_id, batch_number, currency, total_debit, total_credit, status, source_type, source_id, idempotency_key, posted_by, posted_at, created_at | id | Enabled | 0 |
| bank_journal_lines | id, company_id, batch_id, account_id, gl_code, line_description, debit, credit, created_at | id | Enabled | 0 |
| bank_loan_applications | id, company_id, application_number, customer_id, product_id, amount, term_months, purpose, status, credit_score, score_inputs, submitted_by, submitted_at, decision_by, decision_at, decision_note, branch_id, data, created_at, updated_at, disbursement_account_id | id | Enabled | 0 |
| bank_loan_approvals | id, company_id, application_id, step_number, approver_id, decision, note, decided_at | id | Enabled | 0 |
| bank_loan_products | id, company_id, code, name, product_kind, currency, minimum_amount, maximum_amount, minimum_term_months, maximum_term_months, annual_interest_rate, interest_method, processing_fee_rate, late_penalty_rate, collateral_required, guarantors_required, approval_threshold, status, data, created_at, updated_at | id | Enabled | 0 |
| bank_loan_repayments | id, company_id, repayment_number, loan_id, account_id, amount, principal_amount, interest_amount, fee_amount, penalty_amount, channel, status, idempotency_key, transaction_id, posted_by, posted_at | id | Enabled | 0 |
| bank_loan_schedules | id, company_id, loan_id, installment_number, due_date, principal_due, interest_due, fee_due, penalty_due, principal_paid, interest_paid, fee_paid, penalty_paid, status, paid_at | id | Enabled | 0 |
| bank_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at, loan_number, application_id, customer_id, product_id, principal, outstanding_principal, outstanding_interest, outstanding_fees, outstanding_penalties, annual_interest_rate, term_months, interest_method, disbursed_at, maturity_date, days_past_due, par_bucket, write_off_at, restructure_count, created_by | id | Enabled | 0 |
| bank_notifications | id, company_id, profile_id, customer_id, notification_type, title, body, channel, status, sent_at, data, created_at | id | Enabled | 0 |
| bank_payment_instructions | id, company_id, instruction_number, payment_type, channel, source_account_id, destination_account_id, amount, currency, provider, msisdn, provider_reference, status, requested_at, confirmed_at, failure_reason, idempotency_key, data, created_by | id | Enabled | 0 |
| bank_reconciliations | id, company_id, reconciliation_number, account_id, period_start, period_end, statement_balance, ledger_balance, difference, status, reviewed_by, reviewed_at, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| bank_shares | id, company_id, group_id, customer_id, shares_count, price_per_share, transaction_id, status, created_at | id | Enabled | 0 |
| bank_standing_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at, order_number, source_account_id, destination_account_id, destination_msisdn, frequency, next_run_date, end_date, last_run_at, last_result, created_by | id | Enabled | 0 |
| bank_tellers | id, company_id, profile_id, branch_id, teller_code, name, status, opening_balance, closing_balance, opened_at, closed_at, version, data, created_at, updated_at | id | Enabled | 0 |
| bank_transactions | id, company_id, name, status, amount, notes, data, created_at, updated_at, transaction_number, transaction_type, channel, source_account_id, destination_account_id, customer_id, fee_amount, currency, idempotency_key, provider, provider_reference, narration, journal_batch_id, teller_id, initiated_by, posted_at, reversed_transaction_id | id | Enabled | 0 |
| bank_wallets | id, company_id, wallet_number, customer_id, provider, msisdn, balance, status, provider_customer_ref, data, created_at, updated_at | id | Enabled | 0 |
| billing_plan_audit_log | id, plan_id, company_id, action, changed_by, source, previous_values, new_values, created_at | id | Enabled | 13 |
| billing_plans | id, company_id, code, name, description, status, currency, monthly_price, annual_price, annual_savings_label, included_users, included_branches, included_storage_mb, included_transactions, features, module_entitlements, sort_order, recommended, created_by, created_at, updated_at, plan_category, badge, visual_theme, paid_months, bonus_months, total_months, duration_days | id | Enabled | 7 |
| billing_profiles | id, company_id, legal_name, contact_name, email, phone, tax_identifier, address, notes, created_at, updated_at | id | Enabled | 0 |
| bnk_accounts | id, company_id, member_id, name, type, balance, status, open_date, branch, acct_no, interest, data, created_at, updated_at | id | Enabled | 0 |
| bnk_applications | id, company_id, member_id, member, product, amount, term, purpose, collateral, submitted_date, status, officer, score, data, created_at, updated_at | id | Enabled | 0 |
| bnk_loans | id, company_id, member_id, member, product, principal, rate, term, disbursed, maturity, balance, status, collateral, emi, paid, dpd, data, created_at, updated_at | id | Enabled | 0 |
| bnk_members | id, company_id, name, dob, national_id, phone, email, gender, occupation, kyc_status, join_date, branch, data, created_at, updated_at | id | Enabled | 0 |
| bnk_transactions | id, company_id, acct_no, member, type, amount, balance, date, channel, narration, ref, data, created_at, updated_at | id | Enabled | 0 |
| branches | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 6 |
| business_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 3 |
| calendar_events | id, company_id, attendees, description, end_time, event_date, event_type, meeting_link, start_time, title, created_at, updated_at | id | Enabled | 0 |
| collab_channels | id, company_id, description, name, scope, created_at, updated_at | id | Enabled | 0 |
| collab_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| community_contributions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| community_group_announcements | id, company_id, group_id, title, body, audience, status, published_at, expires_at, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_approvals | id, company_id, group_id, entity_type, entity_id, action, status, requested_by, decided_by, decision_notes, requested_at, decided_at, created_at, updated_at | id | Enabled | 0 |
| community_group_assets | id, company_id, group_id, asset_code, name, category, acquisition_date, acquisition_cost, current_value, location, custodian, status, created_at, updated_at | id | Enabled | 0 |
| community_group_attendance | id, company_id, meeting_id, member_id, status, notes, created_at, updated_at | id | Enabled | 0 |
| community_group_audit_log | id, company_id, group_id, actor_id, actor_name, action, entity_type, entity_id, details, created_at, updated_at | id | Enabled | 3 |
| community_group_budgets | id, company_id, group_id, project_id, category, budget_amount, fiscal_year, status, approved_by, approved_at, created_at, updated_at | id | Enabled | 0 |
| community_group_committee_members | id, company_id, committee_id, member_id, committee_role, start_date, end_date, created_at, updated_at | id | Enabled | 0 |
| community_group_committees | id, company_id, group_id, name, committee_type, status, created_at, updated_at | id | Enabled | 0 |
| community_group_contributions | id, company_id, group_id, member_id, contribution_number, contribution_type, amount, currency, contribution_date, due_date, payment_method, mobile_money_provider, payment_reference, status, receipt_number, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_documents | id, company_id, group_id, document_type, title, file_url, document_date, expires_at, status, uploaded_by, created_at, updated_at | id | Enabled | 0 |
| community_group_events | id, company_id, group_id, title, event_type, event_date, start_time, venue, description, reminder_sent_at, status, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_expenses | id, company_id, group_id, project_id, category, description, amount, expense_date, payment_method, payment_reference, status, approved_by, approved_at, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_fundraising | id, company_id, group_id, project_id, donor_name, amount, donation_date, payment_method, payment_reference, status, notes, created_at, updated_at | id | Enabled | 0 |
| community_group_income | id, company_id, group_id, income_type, description, amount, income_date, payment_method, payment_reference, status, created_at, updated_at | id | Enabled | 0 |
| community_group_loan_guarantors | id, company_id, loan_id, guarantor_member_id, guaranteed_amount, consent_status, consented_at, created_at, updated_at | id | Enabled | 0 |
| community_group_loan_penalties | id, company_id, loan_id, penalty_date, reason, amount, status, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_loan_repayments | id, company_id, loan_id, repayment_number, repayment_date, amount, principal_amount, interest_amount, penalty_amount, payment_method, mobile_money_provider, payment_reference, status, receipt_number, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_loans | id, company_id, group_id, member_id, loan_number, purpose, principal, interest_rate, interest_method, term_months, application_date, approval_status, status, approved_by, approved_at, disbursed_at, first_due_date, total_interest, total_repayable, outstanding_principal, outstanding_interest, currency, payment_method, disbursement_reference, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_meetings | id, company_id, group_id, meeting_number, meeting_date, start_time, venue, agenda, minutes, chairperson_id, status, reminder_sent_at, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_members | id, company_id, group_id, member_number, full_name, phone, email, national_id, id_type, gender, date_of_birth, address, occupation, next_of_kin, next_of_kin_phone, join_date, exit_date, role, kyc_status, membership_status, kyc_data, data, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_messages | id, company_id, group_id, sender_member_id, subject, body, channel, status, created_at, updated_at | id | Enabled | 0 |
| community_group_notifications | id, company_id, group_id, member_id, notification_type, title, body, channel, status, scheduled_for, sent_at, created_at, updated_at | id | Enabled | 0 |
| community_group_projects | id, company_id, group_id, project_number, name, description, start_date, end_date, target_amount, status, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_savings | id, company_id, group_id, member_id, transaction_type, amount, transaction_date, payment_method, reference, status, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_vote_ballots | id, company_id, vote_id, option_id, member_id, cast_at | id | Enabled | 0 |
| community_group_vote_options | id, company_id, vote_id, label, candidate_member_id, vote_count, created_at, updated_at | id | Enabled | 0 |
| community_group_votes | id, company_id, group_id, title, description, vote_type, opens_at, closes_at, status, quorum_percent, created_by, created_at, updated_at | id | Enabled | 0 |
| community_group_welfare_claims | id, company_id, group_id, member_id, event_type, description, amount_requested, amount_approved, claim_date, status, payment_method, payment_reference, approved_by, approved_at, created_by, created_at, updated_at | id | Enabled | 0 |
| community_groups | id, company_id, name, status, amount, notes, data, created_at, updated_at, group_number, group_type, registration_number, description, country, region, district, ward, village, meeting_frequency, contribution_frequency, contribution_amount, currency, rules, created_by | id | Enabled | 1 |
| companies | id, name, category, tin, vrn, phone, email, address, city, country, currency, tax_rate, logo, join_code, created_at, updated_at, website, tax_id, business_scale, timezone, receipt_width, receipt_footer, receipt_show_logo, brand_primary_color, brand_accent_color | id | Enabled | 7 |
| company_memberships | user_id, company_id, role, created_at | user_id, company_id | Enabled | 7 |
| company_modules | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 62 |
| company_profile_settings | company_id, profile_data, updated_at | company_id | Enabled | 1 |
| competitors | id, company_id, category, name, notes, threat_level, created_at, updated_at | id | Enabled | 0 |
| crm_contacts | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| crm_interactions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| crm_leads | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 4 |
| custom_kpis | id, company_id, label, metric_id, target_value, created_at, updated_at | id | Enabled | 0 |
| customer_feedback | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| departments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 11 |
| digital_signatures | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| documents | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| ecommerce_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| ecommerce_products | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| emails | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| expense_budgets | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| fin_accounts | id, company_id, account_code, account_name, account_type, normal_side, parent_id, is_postable, is_cash, currency, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_approval_requests | id, company_id, entity_type, entity_id, action, requested_by, status, required_approvals, decided_by, decided_at, decision_note, maker_checker_key, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_idempotency_keys | id, company_id, scope, idempotency_key, request_hash, response, status, expires_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_journal_batches | id, company_id, batch_number, source_module, source_type, source_id, business_date, currency, status, debit_total, credit_total, posted_at, posted_by, reversal_of_batch_id, narration, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_journal_lines | id, company_id, journal_batch_id, line_no, business_date, account_id, debit, credit, currency, branch_id, member_id, customer_id, description, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_periods | id, company_id, period_start, period_end, status, timezone, closed_by, closed_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_posting_links | id, company_id, journal_batch_id, source_table, source_id, link_role, created_by, created_at, updated_at, version, metadata | id | Enabled | 0 |
| fin_reconciliation_batches | id, company_id, account_scope, external_source, statement_date, opening_balance, closing_balance, status, file_reference, import_hash, approved_by, approved_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| fin_reconciliation_items | id, company_id, batch_id, external_reference, external_date, amount, direction, provider, provider_status, matched_source_table, matched_source_id, match_status, exception_reason, resolved_by, resolved_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| finance_assets | id, company_id, acquisition_date, category, cost, name, useful_life_years, created_at, updated_at | id | Enabled | 0 |
| finance_expenses | id, company_id, amount, category, due_date, expense_date, method, status, vendor, created_at, updated_at | id | Enabled | 2 |
| financial_benchmarks | id, company_id, benchmark_value, label, metric_id, created_at, updated_at | id | Enabled | 0 |
| fleet_alerts | id, company_id, alert_key, severity, alert_type, entity_type, entity_id, title, body, due_on, status, acknowledged_by, acknowledged_at, created_at | id | Enabled | 0 |
| fleet_audit_events | id, company_id, actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, created_at | id | Enabled | 0 |
| fleet_driver_assignments | id, company_id, vehicle_id, driver_id, starts_at, ends_at, status, notes, assigned_by, created_at | id | Enabled | 0 |
| fleet_drivers | id, company_id, employee_id, profile_id, full_name, mobile_number, licence_number, licence_class, licence_expires_on, status, safety_score, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_fuel_cards | id, company_id, card_number_masked, issuer, vehicle_id, status, daily_limit, monthly_limit, expires_on, created_at | id | Enabled | 0 |
| fleet_fuel_transactions | id, company_id, vehicle_id, trip_id, fuel_card_id, transaction_at, station_name, litres, unit_price, total_cost, odometer_km, receipt_url, payment_reference, notes, created_by, created_at | id | Enabled | 0 |
| fleet_incidents | id, company_id, vehicle_id, driver_id, trip_id, incident_type, occurred_at, location, description, cost, status, evidence_url, created_by, created_at | id | Enabled | 0 |
| fleet_maintenance_jobs | id, company_id, job_number, vehicle_id, plan_id, workshop_id, maintenance_type, status, priority, requested_on, due_on, odometer_km, estimated_cost, approved_by, completed_on, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_maintenance_plans | id, company_id, vehicle_id, name, maintenance_type, interval_km, interval_days, last_completed_odometer_km, last_completed_on, next_due_odometer_km, next_due_on, active, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_routes | id, company_id, name, origin, destination, planned_distance_km, expected_duration_minutes, toll_budget, active, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_service_records | id, company_id, maintenance_job_id, vehicle_id, service_date, odometer_km, labour_cost, parts_cost, total_cost, invoice_reference, notes, created_by, created_at | id | Enabled | 0 |
| fleet_spare_parts | id, company_id, inventory_item_id, part_number, name, quantity_on_hand, reorder_level, average_cost, location, created_at | id | Enabled | 0 |
| fleet_telematics_events | id, company_id, vehicle_id, provider, external_event_id, captured_at, latitude, longitude, speed_kph, odometer_km, ignition_on, payload, created_at | id | Enabled | 0 |
| fleet_trips | id, company_id, trip_number, vehicle_id, driver_id, route_id, purpose, customer_reference, dispatch_status, planned_departure_at, dispatched_at, completed_at, origin, destination, start_odometer_km, end_odometer_km, distance_km, toll_cost, parking_cost, other_cost, approved_by, created_by, notes, created_at, updated_at | id | Enabled | 0 |
| fleet_tyres | id, company_id, vehicle_id, position, brand, size, serial_number, installed_on, installed_odometer_km, expected_life_km, status, notes, created_at | id | Enabled | 0 |
| fleet_vehicle_categories | id, company_id, name, description, created_at | id | Enabled | 0 |
| fleet_vehicle_documents | id, company_id, vehicle_id, document_type, document_number, issuer, issued_on, expires_on, document_url, status, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_vehicles | id, company_id, registration_number, ownership_type, status, category_id, make, model, model_year, vin, engine_number, fuel_type, odometer_km, seats, acquisition_type, acquisition_date, acquisition_cost, lease_end_date, home_branch, cost_center, notes, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| fleet_workshops | id, company_id, name, contact_name, phone, email, address, supplier_id, status, created_at | id | Enabled | 0 |
| flt_maintenance | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| flt_trips | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| flt_vehicles | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_appointments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_doctors | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_insurance_claims | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_invoices | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_lab_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_notifications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_patients | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_portal_reference_approvals | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_portal_reference_imports | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_portal_reference_summary_settings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| hc_prescriptions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_radiology | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_reminder_deliveries | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_reminder_settings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_reports | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_visits | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hc_vitals | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_amenities | id, company_id, name, category, status, data | id | Enabled | 0 |
| hospitality_audit_log | id, company_id, actor_profile_id, action, subject, detail, created_at | id | Enabled | 3 |
| hospitality_complaints | id, company_id, reservation_id, guest_id, category, description, status, resolution, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_event_venues | id, company_id, property_id, name, capacity, base_rate, currency, status, data | id | Enabled | 0 |
| hospitality_events | id, company_id, property_id, venue_id, guest_id, name, start_at, end_at, status, amount, currency, data | id | Enabled | 0 |
| hospitality_finance_reconciliations | id, company_id, property_id, business_date, status, currency, gross_revenue, tax_total, payment_total, refund_total, variance, pos_transaction_id, journal_entry_id, finance_reference, data, created_by, created_at, updated_at | id | Enabled | 0 |
| hospitality_folio_lines | id, company_id, folio_id, line_type, description, quantity, unit_amount, amount, tax_amount, currency, source_table, source_record_id, posted_by, posted_at, data | id | Enabled | 0 |
| hospitality_folios | id, company_id, property_id, reservation_id, guest_id, folio_number, status, currency, finance_reference, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_guest_kyc | id, company_id, guest_id, document_id, id_type, id_number, issuing_country, expires_at, verification_status, data, created_at | id | Enabled | 0 |
| hospitality_guest_requests | id, company_id, reservation_id, guest_id, request_type, description, priority, status, assigned_employee_id, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_guests | id, company_id, profile_id, first_name, last_name, email, phone, nationality, date_of_birth, loyalty_number, status, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_housekeeping_tasks | id, company_id, property_id, room_id, assigned_employee_id, task_type, status, due_at, completed_at, notes, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_laundry_orders | id, company_id, reservation_id, guest_id, status, amount, currency, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_loyalty_accounts | id, company_id, guest_id, tier, points, status, data | id | Enabled | 0 |
| hospitality_maintenance_requests | id, company_id, property_id, room_id, category, priority, status, assigned_employee_id, notes, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_menu_items | id, company_id, menu_id, inventory_item_id, name, price, currency, status, data | id | Enabled | 0 |
| hospitality_menus | id, company_id, property_id, name, meal_period, status, data | id | Enabled | 0 |
| hospitality_minibar_postings | id, company_id, reservation_id, inventory_item_id, quantity, amount, status, data, created_at | id | Enabled | 0 |
| hospitality_notifications | id, company_id, profile_id, employee_id, title, body, type, module, record_id, read_at, created_at | id | Enabled | 0 |
| hospitality_order_lines | id, company_id, order_id, menu_item_id, name, quantity, unit_price, status, data | id | Enabled | 0 |
| hospitality_orders | id, company_id, property_id, table_id, reservation_id, folio_id, order_number, status, currency, data, created_by, created_at, updated_at | id | Enabled | 0 |
| hospitality_payments | id, company_id, folio_id, payment_method, amount, currency, status, reference, finance_payment_id, received_by, received_at, data | id | Enabled | 0 |
| hospitality_properties | id, company_id, branch_id, name, code, address, timezone, currency, status, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_rate_plans | id, company_id, property_id, room_type_id, name, currency, nightly_rate, effective_from, effective_to, status, data | id | Enabled | 0 |
| hospitality_reservations | id, company_id, property_id, guest_id, room_type_id, room_id, confirmation_code, arrival_date, departure_date, adults, children, status, nightly_rate, currency, source, special_requests, checked_in_at, checked_out_at, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_restaurant_tables | id, company_id, property_id, table_number, capacity, zone, status, data | id | Enabled | 0 |
| hospitality_room_types | id, company_id, property_id, name, code, capacity_adults, capacity_children, base_rate, currency, amenities, status, data | id | Enabled | 0 |
| hospitality_rooms | id, company_id, property_id, room_type_id, room_number, floor, status, housekeeping_status, maintenance_status, data, created_at, updated_at | id | Enabled | 0 |
| hospitality_taxes | id, company_id, property_id, name, code, rate, applies_to, effective_from, effective_to, status, data | id | Enabled | 0 |
| hr_announcement_reads | announcement_id, profile_id, read_at | announcement_id, profile_id | Enabled | 0 |
| hr_announcements | id, company_id, title, body, audience_type, department_id, status, published_at, expires_at, created_by, created_at, updated_at | id | Enabled | 0 |
| hr_approval_requests | id, company_id, request_type, source_table, source_record_id, requester_employee_id, subject_employee_id, status, current_step, data, created_at, updated_at | id | Enabled | 0 |
| hr_approval_steps | id, company_id, approval_request_id, step_number, approver_profile_id, approver_role, status, decision_note, decided_at, created_at | id | Enabled | 0 |
| hr_attendance | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, attendance_date, shift_id, clock_in_at, clock_out_at, worked_minutes, source | id | Enabled | 0 |
| hr_benefit_enrollments | id, company_id, employee_id, benefit_plan_id, status, effective_from, effective_to, data, created_at, updated_at | id | Enabled | 0 |
| hr_benefit_plans | id, company_id, name, provider, benefit_type, employee_contribution, employer_contribution, currency, status, data, created_at, updated_at | id | Enabled | 0 |
| hr_benefits | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, benefit_plan_id, effective_from, effective_to | id | Enabled | 0 |
| hr_candidates | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hr_duties | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, assignee_profile_id, duty_date, started_at, completed_at, approved_by, approved_at | id | Enabled | 1 |
| hr_employee_documents | id, company_id, employee_id, document_id, title, document_type, file_url, status, expires_at, data, created_by, created_at, updated_at | id | Enabled | 0 |
| hr_employees | id, company_id, name, status, amount, notes, data, created_at, updated_at, profile_id, department_id, position_id, manager_employee_id, employee_number, employment_start_date, employment_end_date, timezone | id | Enabled | 1 |
| hr_expense_claims | id, company_id, employee_id, expense_date, category, amount, currency, merchant, description, status, finance_expense_id, document_id, decided_by, decided_at, decision_note, data, created_at, updated_at | id | Enabled | 0 |
| hr_goal_updates | id, company_id, goal_id, employee_id, current_value, note, created_at | id | Enabled | 0 |
| hr_goals | id, company_id, employee_id, title, description, metric_name, target_value, current_value, unit, status, due_date, owner_employee_id, data, created_at, updated_at | id | Enabled | 0 |
| hr_holidays | id, company_id, holiday_date, name, holiday_type, paid, branch_id, created_at, updated_at | id | Enabled | 0 |
| hr_invite_codes | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| hr_leave_balances | id, company_id, employee_id, leave_policy_id, period_year, opening_balance, accrued_days, used_days, adjustment_days, updated_at | id | Enabled | 0 |
| hr_leave_policies | id, company_id, name, leave_type, annual_entitlement, carry_forward_limit, requires_approval, status, data, created_at, updated_at | id | Enabled | 0 |
| hr_leave_requests | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, leave_policy_id, start_date, end_date, requested_days, decision_by, decided_at, decision_note | id | Enabled | 0 |
| hr_notifications | id, company_id, profile_id, employee_id, title, body, notification_type, link_module, link_record_id, read_at, created_at | id | Enabled | 0 |
| hr_offboarding_cases | id, company_id, employee_id, status, last_working_date, reason, owner_profile_id, data, created_at, updated_at | id | Enabled | 0 |
| hr_onboarding_cases | id, company_id, employee_id, status, start_date, due_date, owner_profile_id, data, created_at, updated_at | id | Enabled | 0 |
| hr_onboarding_tasks | id, company_id, onboarding_case_id, employee_id, title, owner_profile_id, due_date, status, completed_at, data, created_at, updated_at | id | Enabled | 0 |
| hr_payroll_items | id, company_id, payroll_run_id, employee_id, gross_pay, taxable_pay, deductions, net_pay, currency, status, data, created_at, updated_at, employer_contributions, employer_cost | id | Enabled | 0 |
| hr_payroll_runs | id, company_id, name, status, amount, notes, data, created_at, updated_at, period_start, period_end, currency, timezone, approved_by, approved_at, posted_at, finance_reference | id | Enabled | 0 |
| hr_payslips | id, company_id, payroll_item_id, employee_id, pay_period, status, issued_at, document_id, data, created_at, updated_at | id | Enabled | 0 |
| hr_performance_reviews | id, company_id, name, status, amount, notes, data, created_at, updated_at, employee_id, reviewer_employee_id, review_period_start, review_period_end, due_date, submitted_at, completed_at | id | Enabled | 0 |
| hr_positions | id, company_id, department_id, title, code, grade, status, description, created_at, updated_at | id | Enabled | 0 |
| hr_service_requests | id, company_id, employee_id, request_type, subject, description, status, assigned_to, decided_by, decided_at, decision_note, data, created_at, updated_at | id | Enabled | 0 |
| hr_shift_assignments | id, company_id, employee_id, shift_id, assignment_date, status, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| hr_shifts | id, company_id, name, start_time, end_time, unpaid_break_minutes, timezone, status, data, created_at, updated_at | id | Enabled | 0 |
| hr_statutory_rules | id, company_id, name, rule_code, effective_from, effective_to, applies_to, calculation_type, rate, fixed_amount, threshold_amount, currency, status, data, created_at, updated_at | id | Enabled | 5 |
| hr_timesheet_entries | id, company_id, timesheet_id, work_date, minutes, project_reference, work_note, created_at, updated_at | id | Enabled | 0 |
| hr_timesheets | id, company_id, employee_id, period_start, period_end, total_minutes, status, submitted_at, decided_by, decided_at, decision_note, data, created_at, updated_at | id | Enabled | 0 |
| hr_training | id, company_id, completion_date, course, due_date, employee_name, hr_employees, is_compliance, is_mandatory, status, video_url, created_at, updated_at | id | Enabled | 0 |
| hr_training_assignments | id, company_id, employee_id, course_id, assigned_by, due_date, status, completed_at, data, created_at, updated_at | id | Enabled | 0 |
| hr_training_courses | id, company_id, title, provider, duration_minutes, mandatory, status, content_url, data, created_at, updated_at | id | Enabled | 0 |
| htl_bookings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| htl_rooms | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| integration_connections | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| inventory_batches | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| inventory_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 81 |
| inventory_stock_movements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 11 |
| inventory_suppliers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| inventory_transfers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| inventory_warehouses | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| journal_entries | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| kb_articles | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| loan_repayments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| manufacturing_bom_components | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| manufacturing_boms | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| manufacturing_machines | id, company_id, machine_type, name, purchase_date, status, warehouse_id, created_at, updated_at | id | Enabled | 0 |
| manufacturing_maintenance | id, company_id, cost, machine_name, maintenance_date, maintenance_type, next_due_date, notes, technician, created_at, updated_at | id | Enabled | 0 |
| manufacturing_qc_inspections | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| manufacturing_work_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| marketing_campaigns | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_audit_logs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| mfi_cash_sessions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_cash_transactions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_clients | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| mfi_collateral | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_collections | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_credit_scorecards | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_credit_scoring_settings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_groups | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_guarantors | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_loan_applications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_loan_products | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| mfi_notifications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_par_escalation_settings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| mfi_repayment_schedules | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_repayments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_savings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| mfi_staff_commissions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| money_agent_agents | id, company_id, profile_id, branch_id, supervisor_id, agent_code, full_name, phone, national_id, kyc_status, kyb_status, status, daily_limit, monthly_limit, notes, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_alerts | id, company_id, agent_id, alert_type, severity, title, body, status, created_at, acknowledged_by, acknowledged_at | id | Enabled | 0 |
| money_agent_approvals | id, company_id, transaction_id, status, requested_by, decided_by, note, requested_at, decided_at | id | Enabled | 0 |
| money_agent_audit_events | id, company_id, actor_profile_id, action, entity_type, entity_id, before_data, after_data, metadata, created_at | id | Enabled | 0 |
| money_agent_branches | id, company_id, branch_code, name, region, district, ward, address, phone, status, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_commission_rules | id, company_id, service_code, commission_type, commission_value, active, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_customers | id, company_id, profile_id, full_name, phone, national_id, kyc_status, status, address, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_daily_summaries | id, company_id, agent_id, branch_id, business_date, transaction_count, successful_count, failed_count, cash_in_amount, cash_out_amount, fee_amount, commission_amount, updated_at | id | Enabled | 0 |
| money_agent_fee_rules | id, company_id, service_code, min_amount, max_amount, fee_type, fee_value, active, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_ledger_entries | id, company_id, transaction_id, account_code, entry_type, amount, currency, posted_at, metadata | id | Enabled | 0 |
| money_agent_limits | id, company_id, agent_id, transaction_type, max_single_amount, daily_amount, monthly_amount, velocity_window_minutes, velocity_count, active, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_notifications | id, company_id, transaction_id, agent_id, channel, status, title, body, provider_reference, created_at, sent_at, read_at | id | Enabled | 0 |
| money_agent_pin_credentials | id, company_id, agent_id, pin_hash, failed_attempts, locked_until, last_used_at, status, created_at, updated_at | id | Enabled | 0 |
| money_agent_receipts | id, company_id, transaction_id, receipt_number, channel, recipient_phone, issued_at, metadata | id | Enabled | 0 |
| money_agent_reconciliations | id, company_id, settlement_id, status, expected_amount, actual_amount, variance, reviewed_by, reviewed_at, notes, created_at, updated_at | id | Enabled | 0 |
| money_agent_risk_events | id, company_id, agent_id, transaction_id, risk_type, severity, status, score, reason, metadata, created_at, resolved_by, resolved_at | id | Enabled | 0 |
| money_agent_services | id, company_id, service_code, name, service_type, provider_code, requires_provider, active, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| money_agent_settlements | id, company_id, agent_id, branch_id, business_date, opening_float, closing_float, expected_float, variance, status, submitted_by, settled_by, notes, created_at, updated_at | id | Enabled | 0 |
| money_agent_transactions | id, company_id, transaction_ref, idempotency_key, agent_id, branch_id, customer_id, service_id, transaction_type, amount, fee, commission, currency, status, authorization_method, authorization_reference_hash, provider_code, provider_reference, failure_code, failure_reason, requested_at, authorized_at, processed_at, completed_at, reversed_at, created_by, metadata, created_at, updated_at | id | Enabled | 0 |
| money_agent_wallets | id, company_id, owner_type, owner_id, wallet_type, currency, available_balance, status, created_at, updated_at | id | Enabled | 0 |
| network_profiles | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| network_rfqs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| notebook_notes | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| notification_channels | id, company_id, business_number, channel_id, enabled, from_address, from_number, server_key, webhook_url, created_at, updated_at | id | Enabled | 0 |
| notification_log | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| notification_rules | id, company_id, alert_type, channels, created_at, updated_at | id | Enabled | 0 |
| other_debtors | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| other_income | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| period_closes | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_audit_logs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| phm_batches | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_brands | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_categories | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_controlled_medicine_register | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_dispense | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_dispense_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_drugs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| phm_insurance_claims | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_notifications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_payments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_purchase_order_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_purchase_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_return_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_returns | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_sale_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_sales | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock_adjustments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock_movements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock_receipts | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_stock_transfers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| phm_suppliers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| platform_admin_actions | id, actor_user_id, actor_role, action, target_type, target_id, reason, confirmation_text, details, created_at | id | Enabled | 1 |
| pos_cash_movements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 3 |
| pos_discount_rules | id, company_id, discount_code, name, scope_type, inventory_item_id, discount_type, value, max_discount_amount, minimum_subtotal, stackable, requires_approval, contra_revenue_account_id, effective_from, effective_to, status, approval_request_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_ledger | id, company_id, member_id, entry_type, points_delta, points_balance_after, sale_id, redemption_id, idempotency_key, reference, status, occurred_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_members | id, company_id, program_id, customer_id, member_number, status, points_balance, lifetime_earned, lifetime_redeemed, joined_at, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_programs | id, company_id, program_code, name, earn_points_per_100_tzs, redemption_tzs_per_point, minimum_redeem_points, expiry_days, points_liability_account_id, status, approval_request_id, effective_from, effective_to, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_redemptions | id, company_id, member_id, reward_id, sale_id, points_spent, cash_value, status, approval_request_id, journal_batch_id, idempotency_key, request_hash, applied_at, applied_by, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_loyalty_rewards | id, company_id, program_id, reward_code, name, points_cost, cash_value, inventory_item_id, status, approval_request_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_promotion_items | id, company_id, promotion_id, inventory_item_id, item_role, required_quantity, reward_price, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_promotions | id, company_id, promotion_code, name, trigger_type, benefit_type, minimum_spend, minimum_quantity, benefit_value, reward_quantity, points_multiplier_bps, stackable, priority, customer_limit, daily_limit, effective_from, effective_to, status, approval_request_id, requires_approval, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_registers | id, company_id, register_code, name, branch_id, warehouse_id, default_currency, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_return_commits | id, company_id, return_id, idempotency_key, created_by, created_at, updated_at | id | Enabled | 2 |
| pos_return_headers | id, company_id, return_number, sale_id, register_id, terminal_id, shift_id, cashier_id, reason, refund_method, currency, refund_total, status, approval_request_id, journal_batch_id, idempotency_key, request_hash, legacy_pos_return_id, posted_at, posted_by, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_return_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| pos_return_lines | id, company_id, return_id, sale_line_id, line_no, quantity, unit_price, tax_amount, refund_amount, restock_quantity, condition, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_returns | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 2 |
| pos_sale_adjustments | id, company_id, sale_id, sale_line_id, adjustment_no, adjustment_type, tax_rule_id, discount_rule_id, promotion_id, base_amount, rate_bps, amount, status, approval_request_id, journal_batch_id, idempotency_key, request_hash, applied_at, applied_by, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_sale_headers | id, company_id, sale_number, register_id, terminal_id, shift_id, cashier_id, customer_id, customer_name, business_date, source_channel, status, payment_status, currency, subtotal, discount_total, tax_total, total, paid_total, change_total, refunded_total, journal_batch_id, idempotency_key, request_hash, receipt_issued_at, completed_at, voided_at, legacy_pos_transaction_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_sale_lines | id, company_id, sale_id, line_no, inventory_item_id, item_sku, item_name, quantity, unit_price, discount_amount, tax_amount, line_subtotal, line_total, cost_total, returned_quantity, status, legacy_pos_transaction_item_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_sale_tax_lines | id, company_id, sale_id, sale_line_id, tax_rule_id, taxable_amount, rate_bps, tax_amount, included_in_price, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_sale_tenders | id, company_id, sale_id, tender_no, method, currency, tendered_amount, applied_amount, change_amount, reference, provider_code, provider_reference, provider_status, status, journal_batch_id, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_shift_cash_movements | id, company_id, shift_id, movement_type, amount, reason, reference, approval_request_id, journal_batch_id, status, occurred_at, legacy_pos_cash_movement_id, created_by, created_at, updated_by, updated_at, version, metadata, idempotency_key, request_hash, posted_at, posted_by, reversal_of_movement_id | id | Enabled | 0 |
| pos_shift_sessions | id, company_id, shift_number, register_id, terminal_id, cashier_id, business_date, opened_at, opening_float, expected_cash, counted_cash, variance, status, closed_at, closed_by, close_reason, open_idempotency_key, close_idempotency_key, legacy_pos_shift_id, created_by, created_at, updated_by, updated_at, version, metadata, open_request_hash, close_request_hash | id | Enabled | 0 |
| pos_shifts | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 4 |
| pos_sync_devices | id, company_id, device_key, terminal_id, last_sequence, last_seen_at, status, created_by, created_at, updated_by, updated_at, version, metadata, last_accepted_hash | id | Enabled | 0 |
| pos_sync_events | id, company_id, idempotency_key, transaction_id, status, message, created_by, created_at, updated_at | id | Enabled | 4 |
| pos_tax_rules | id, company_id, tax_code, name, tax_type, scope_type, inventory_item_id, rate_bps, calculation_method, tax_account_id, effective_from, effective_to, status, approval_request_id, requires_approval, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_terminals | id, company_id, register_id, device_key, device_label, app_version, last_seen_at, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 0 |
| pos_transaction_commits | id, company_id, transaction_id, idempotency_key, created_by, created_at, updated_at | id | Enabled | 5 |
| pos_transaction_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 5 |
| pos_transactions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 5 |
| procurement_contracts | id, company_id, contract_type, doc_number, end_date, notes, start_date, supplier, value, created_at, updated_at | id | Enabled | 0 |
| procurement_purchase_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| profiles | id, company_id, full_name, email, role, phone, avatar_url, is_active, created_at, updated_at, customer_ref, onboarding_tour_completed_at, onboarding_tour_role_track, preferred_name, first_name, middle_name, last_name, date_of_birth, gender, address, country, preferred_language, currency_display, profile_timezone, date_format, theme_preference, notification_preferences, avatar_storage_key, profile_completed_at | id | Enabled | 9 |
| project_expenses | id, company_id, amount, description, expense_date, project_ref, created_at, updated_at | id | Enabled | 0 |
| project_milestones | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| project_tasks | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| projects | id, company_id, budget, client, end_date, manager, name, start_date, status, created_at, updated_at | id | Enabled | 0 |
| property_agents | id, company_id, profile_id, agent_code, full_name, phone, email, licence_number, commission_rate, status, branch_label, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_applications | id, company_id, application_number, unit_id, tenant_id, agent_id, requested_start_date, proposed_rent, status, decision_note, decided_by, decided_at, idempotency_key, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_approvals | id, company_id, entity_type, entity_id, action, status, requested_by, decided_by, note, requested_at, decided_at | id | Enabled | 0 |
| property_audit_log | id, company_id, actor_id, action, entity_type, entity_id, details, created_at | id | Enabled | 0 |
| property_budgets | id, company_id, portfolio_id, fiscal_year, category, budget_amount, status, approved_by, approved_at, created_by, created_at | id | Enabled | 0 |
| property_buildings | id, company_id, portfolio_id, property_code, name, property_type, address, country, region, district, ward, village, latitude, longitude, year_built, floors, status, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_contractors | id, company_id, contractor_code, name, phone, email, trade, tax_number, status, created_by, created_at, updated_at | id | Enabled | 0 |
| property_documents | id, company_id, entity_type, entity_id, document_type, title, storage_key, file_url, document_date, expires_at, verification_status, uploaded_by, metadata, created_at | id | Enabled | 0 |
| property_expenses | id, company_id, expense_number, property_id, unit_id, work_order_id, category, description, amount, expense_date, status, payment_method, payment_reference, approved_by, approved_at, created_by, created_at, updated_at | id | Enabled | 0 |
| property_handover_records | id, company_id, lease_id, handover_type, handover_date, keys_count, meter_snapshot, signed_by_tenant, signed_by_manager, notes, created_by, created_at | id | Enabled | 0 |
| property_inspection_items | id, company_id, inspection_id, area_name, condition, notes, estimated_cost, created_at | id | Enabled | 0 |
| property_inspections | id, company_id, lease_id, inspection_type, inspection_date, condition_summary, status, inspector_id, metadata, created_at | id | Enabled | 0 |
| property_insurances | id, company_id, property_id, unit_id, insurer, policy_number, cover_type, premium, start_date, end_date, status, notes, created_by, created_at | id | Enabled | 0 |
| property_integration_events | id, company_id, target_module, entity_type, entity_id, event_type, status, payload, created_by, created_at, processed_at | id | Enabled | 0 |
| property_invoice_lines | id, company_id, invoice_id, line_type, description, quantity, unit_amount, line_total, account_code, created_at | id | Enabled | 0 |
| property_invoices | id, company_id, invoice_number, lease_id, tenant_id, unit_id, invoice_type, period_start, period_end, issue_date, due_date, subtotal, tax_amount, late_fee_amount, total_amount, amount_paid, status, currency, idempotency_key, notes, created_by, created_at, updated_at | id | Enabled | 0 |
| property_leases | id, company_id, lease_number, unit_id, tenant_id, owner_id, application_id, start_date, end_date, rent_amount, service_charge_amount, deposit_amount, rent_frequency, notice_days, status, terms, created_by, approved_by, approved_at, terminated_at, created_at, updated_at | id | Enabled | 0 |
| property_ledger_entries | id, company_id, source_type, source_id, account_code, entry_type, amount, currency, metadata, created_at | id | Enabled | 0 |
| property_listings | id, company_id, unit_id, agent_id, listing_type, asking_amount, commission_rate, status, available_from, published_at, expires_at, description, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_maintenance_requests | id, company_id, request_number, unit_id, lease_id, tenant_id, category, priority, title, description, status, requested_at, completed_at, created_by, created_at, updated_at | id | Enabled | 0 |
| property_meter_readings | id, company_id, meter_id, reading_date, reading_value, previous_value, consumption, captured_by, source, notes, created_at | id | Enabled | 0 |
| property_notices | id, company_id, lease_id, tenant_id, notice_type, title, body, notice_date, effective_date, status, created_by, created_at | id | Enabled | 0 |
| property_notifications | id, company_id, recipient_profile_id, tenant_id, notice_id, notification_type, title, body, channel, status, scheduled_for, sent_at, dedupe_key, created_at | id | Enabled | 0 |
| property_owners | id, company_id, profile_id, owner_type, legal_name, phone, email, national_id, tin, kyc_status, status, notes, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_payments | id, company_id, payment_number, invoice_id, tenant_id, amount, payment_method, provider_code, provider_reference, status, idempotency_key, paid_at, posted_by, metadata, created_at | id | Enabled | 0 |
| property_plots | id, company_id, portfolio_id, plot_code, title_number, land_use, area_sqm, address, region, district, ward, latitude, longitude, owner_id, status, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_portfolios | id, company_id, portfolio_code, name, description, currency, timezone, status, created_by, created_at, updated_at | id | Enabled | 0 |
| property_receipts | id, company_id, payment_id, receipt_number, channel, recipient_phone, issued_at, metadata | id | Enabled | 0 |
| property_reconciliations | id, company_id, payment_id, invoice_id, expected_amount, actual_amount, variance, status, reviewed_by, reviewed_at, notes, created_by, created_at | id | Enabled | 0 |
| property_rent_schedules | id, company_id, lease_id, next_invoice_date, frequency, active, last_invoice_id, created_at, updated_at | id | Enabled | 0 |
| property_service_charges | id, company_id, unit_id, name, amount, frequency, status, created_by, created_at, updated_at | id | Enabled | 0 |
| property_tax_fee_rules | id, company_id, code, name, applies_to, rate, flat_amount, status, created_by, created_at, updated_at | id | Enabled | 0 |
| property_tenant_documents | id, company_id, tenant_id, document_type, document_number, storage_key, file_url, verification_status, expires_at, metadata, uploaded_by, created_at | id | Enabled | 0 |
| property_tenants | id, company_id, profile_id, tenant_code, full_name, phone, email, national_id, tin, kyc_status, status, address, emergency_contact, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_units | id, company_id, building_id, plot_id, owner_id, unit_code, unit_type, floor_label, bedrooms, bathrooms, area_sqm, rent_amount, service_charge_amount, deposit_amount, currency, status, furnishing, notes, metadata, created_by, created_at, updated_at | id | Enabled | 0 |
| property_utility_meters | id, company_id, unit_id, utility_type, meter_number, unit_of_measure, rate, status | id | Enabled | 0 |
| property_work_orders | id, company_id, work_order_number, request_id, contractor_id, assigned_profile_id, estimated_cost, actual_cost, status, due_date, completion_note, created_by, created_at, updated_at | id | Enabled | 0 |
| purchase_order_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| resource_bookings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| restaurant_alerts | id, company_id, outlet_id, alert_key, alert_type, severity, title, body, status, due_at, created_at | id | Enabled | 0 |
| restaurant_audit_events | id, company_id, outlet_id, actor_id, action, subject_type, subject_id, detail, created_at | id | Enabled | 0 |
| restaurant_bill_splits | id, company_id, parent_order_id, split_order_id, split_number, amount, status | id | Enabled | 0 |
| restaurant_combo_items | id, company_id, parent_menu_item_id, child_menu_item_id, quantity | id | Enabled | 0 |
| restaurant_customers | id, company_id, guest_id, name, phone, email, loyalty_points, status, data | id | Enabled | 0 |
| restaurant_dining_areas | id, company_id, outlet_id, name, area_type, layout, status | id | Enabled | 0 |
| restaurant_fiscal_profiles | id, company_id, outlet_id, tax_profile_id, tin, vrn, business_name, trading_name, physical_address, region, district, device_serial, provider_code, environment, status, receipt_prefix, fiscalized_at, data, created_by, created_at, updated_at | id | Enabled | 0 |
| restaurant_fiscal_receipts | id, company_id, outlet_id, fiscal_profile_id, order_id, internal_reference, official_receipt_number, fiscal_serial, verification_code, qr_payload, status, gross_amount, vat_amount, net_amount, currency, idempotency_key, provider_response, failure_reason, queued_at, submitted_at, verified_at, created_at, updated_at | id | Enabled | 0 |
| restaurant_kitchen_tickets | id, company_id, outlet_id, order_id, ticket_number, station, status, opened_at, completed_at | id | Enabled | 0 |
| restaurant_menu_categories | id, company_id, outlet_id, name, sort_order, status | id | Enabled | 0 |
| restaurant_menu_items | id, company_id, outlet_id, category_id, inventory_item_id, sku, name, description, price, cost_price, preparation_minutes, station, tax_rate, status, data | id | Enabled | 0 |
| restaurant_mobile_money_intents | id, company_id, outlet_id, order_id, profile_id, provider_reference, phone_last_four, amount, currency, status, provider_payload, failure_reason, expires_at, paid_at, created_by, created_at, updated_at | id | Enabled | 0 |
| restaurant_mobile_money_profiles | id, company_id, outlet_id, provider, merchant_label, merchant_account_reference, collection_mode, status, webhook_configured, data, created_by, created_at, updated_at | id | Enabled | 0 |
| restaurant_modifier_groups | id, company_id, outlet_id, name, min_select, max_select, status | id | Enabled | 0 |
| restaurant_modifier_options | id, company_id, group_id, inventory_item_id, name, price_delta, status | id | Enabled | 0 |
| restaurant_order_lines | id, company_id, order_id, menu_item_id, name, quantity, unit_price, discount_amount, status, modifiers, notes, stock_consumed, created_at | id | Enabled | 0 |
| restaurant_orders | id, company_id, outlet_id, table_id, reservation_id, customer_id, hotel_folio_id, waiter_employee_id, order_number, order_type, status, subtotal, discount_amount, tax_amount, service_charge_amount, tip_amount, total_amount, currency, opened_at, closed_at, data | id | Enabled | 0 |
| restaurant_outlets | id, company_id, property_id, branch_id, name, code, timezone, currency, tax_rate, service_charge_rate, status, data, created_at, updated_at | id | Enabled | 0 |
| restaurant_payments | id, company_id, order_id, method, amount, reference, status, received_by, received_at, data | id | Enabled | 0 |
| restaurant_promotions | id, company_id, outlet_id, code, name, discount_type, discount_value, starts_at, ends_at, status | id | Enabled | 0 |
| restaurant_purchase_lines | id, company_id, request_id, inventory_item_id, quantity, unit_cost, received_quantity | id | Enabled | 0 |
| restaurant_purchase_requests | id, company_id, outlet_id, supplier_id, request_number, status, total_amount, currency, data, created_at | id | Enabled | 0 |
| restaurant_recipe_ingredients | id, company_id, menu_item_id, inventory_item_id, quantity, unit, waste_pct | id | Enabled | 0 |
| restaurant_refunds | id, company_id, order_id, payment_id, reason, amount, status, idempotency_key, created_by, created_at | id | Enabled | 0 |
| restaurant_reservations | id, company_id, outlet_id, table_id, customer_id, reference, reservation_at, duration_minutes, covers, status, notes, created_at | id | Enabled | 0 |
| restaurant_shifts | id, company_id, outlet_id, employee_id, role, starts_at, ends_at, status, opening_cash, closing_cash, data, created_at | id | Enabled | 0 |
| restaurant_staff_roles | id, company_id, outlet_id, employee_id, role, status | id | Enabled | 0 |
| restaurant_suppliers | id, company_id, name, phone, email, address, status, data | id | Enabled | 0 |
| restaurant_tables | id, company_id, outlet_id, area_id, code, capacity, status, position, current_order_id, data, updated_at | id | Enabled | 0 |
| restaurant_tax_profiles | id, company_id, outlet_id, code, name, tax_type, rate_percent, is_inclusive, is_default, is_active, legal_basis, created_at, updated_at | id | Enabled | 0 |
| restaurant_wastage | id, company_id, outlet_id, inventory_item_id, quantity, reason, cost, created_by, created_at | id | Enabled | 0 |
| rst_menu | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| rst_orders | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| rst_reservations | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| rst_tables | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sales_invoice_items | id, company_id, name, status, amount, notes, data, created_at, updated_at, invoice_id, item_name, item_sku, qty, rate, sort_order | id | Enabled | 2 |
| sales_invoices | id, company_id, name, status, amount, notes, data, created_at, updated_at, doc_number, customer, issue_date, due_date, order_id, amount_paid | id | Enabled | 1 |
| sales_order_items | id, company_id, name, status, amount, notes, data, created_at, updated_at, order_id, item_name, item_sku, qty, rate, sort_order | id | Enabled | 0 |
| sales_order_return_items | id, company_id, name, status, amount, notes, data, created_at, updated_at, return_id, item_name, item_sku, qty, rate | id | Enabled | 0 |
| sales_order_returns | id, company_id, name, status, amount, notes, data, created_at, updated_at, order_id, reason | id | Enabled | 0 |
| sales_orders | id, company_id, customer, doc_number, order_date, owner_id, quotation_id, sales_order_items, sales_order_returns, status, created_at, updated_at, quotation_reference, owner_name | id | Enabled | 0 |
| sales_payments | id, company_id, name, status, amount, notes, data, created_at, updated_at, invoice_id, method, payment_date, reference | id | Enabled | 12 |
| sales_quotation_items | id, company_id, name, status, amount, notes, data, created_at, updated_at, quotation_id, item_name, item_sku, qty, rate, sort_order | id | Enabled | 1 |
| sales_quotations | id, company_id, name, status, amount, notes, data, created_at, updated_at, doc_number, customer, issue_date, valid_until, owner_id | id | Enabled | 4 |
| sales_subscriptions | id, company_id, name, status, amount, notes, data, created_at, updated_at, doc_number, customer, plan, cycle, start_date, next_billing_date | id | Enabled | 1 |
| sch_academic_years | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_admissions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_announcements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_approval_requests | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_assessment_scores | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_assessments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_assignment_submissions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_assignments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_attendance_records | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_attendance_sessions | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_audit_logs | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_books | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_classes | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_departments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_disciplinary_records | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_documents | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_enrollments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_exams | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_fee_invoice_lines | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_fee_invoices | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_fee_structures | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_fees | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_grading_scales | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_guardians | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_hostel_allocations | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_hostels | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_inventory_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_inventory_movements | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_library_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_notifications | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_payments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_portal_links | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_report_cards | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_scholarships | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_streams | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_student_guardians | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_students | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_subjects | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_teacher_assignments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_teachers | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_terms | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_timetables | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_transport | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sch_transport_assignments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| scheduled_reports | id, company_id, format, frequency, last_run, recipient_email, report_type, status, created_at, updated_at | id | Enabled | 0 |
| scm_shipments | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| scm_vehicles | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| signatures | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sms_group_members | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sms_groups | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| sms_templates | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| stock_audit_items | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| stock_audits | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 1 |
| subscription_events | id, company_id, subscription_id, payment_id, event_type, previous_status, new_status, actor_profile_id, actor_type, details, created_at | id | Enabled | 6 |
| subscription_invoices | id, company_id, subscription_id, payment_id, invoice_number, status, currency, subtotal, tax_amount, total_amount, paid_amount, issued_at, due_at, paid_at, document_data, created_at, updated_at | id | Enabled | 0 |
| subscription_notifications | id, company_id, subscription_id, notification_key, notification_type, title, message, status, scheduled_for, delivered_at, read_at, metadata, created_at | id | Enabled | 2 |
| subscription_payments | id, company_id, subscription_id, plan_id, provider, internal_reference, idempotency_key, provider_order_id, amount, fee, net_amount, currency, phone, description, billing_cycle, status, initiated_by, provider_response, verified_at, paid_at, failure_reason, created_at, updated_at | id | Enabled | 2 |
| subscription_usage | id, company_id, usage_key, period_start, period_end, usage_value, limit_value, source, metadata, recorded_at | id | Enabled | 0 |
| support_agents | id, company_id, profile_id, team_id, availability, workload_limit, is_active, created_at, updated_at | id | Enabled | 0 |
| support_call_log | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| support_chat_conversations | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 3 |
| support_chat_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 6 |
| support_message_templates | id, company_id, name, provider, channel, language, category, body, variables, approval_status, is_active, created_by, created_at, updated_at | id | Enabled | 0 |
| support_sla_policies | id, company_id, name, priority, first_response_minutes, resolution_minutes, warning_minutes, is_active, created_at, updated_at | id | Enabled | 0 |
| support_team_members | id, company_id, team_id, profile_id, role, created_at | id | Enabled | 0 |
| support_teams | id, company_id, name, department_name, is_active, created_by, created_at, updated_at | id | Enabled | 0 |
| support_ticket_activity | id, company_id, ticket_id, actor_profile_id, event_type, details, created_at | id | Enabled | 0 |
| support_ticket_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at, ticket_id, body, sender_kind, sender_profile_id, channel, is_internal, delivery_status, provider_message_id, sent_at | id | Enabled | 0 |
| support_ticket_notes | id, company_id, ticket_id, author_profile_id, body, kind, created_at | id | Enabled | 0 |
| support_tickets | id, company_id, assignee, category, created_date, customer, doc_number, priority, status, subject, support_ticket_messages, created_at, updated_at, assigned_profile_id, team_id, source_channel, customer_reference, due_at, resolved_at, closed_at | id | Enabled | 0 |
| tenant_subscriptions | id, company_id, plan_id, status, billing_cycle, amount, currency, started_at, renewed_at, expires_at, grace_expires_at, cancelled_at, cancellation_reason, source_payment_id, metadata, created_at, updated_at, offer_code, paid_months, bonus_months, total_months, duration_days | id | Enabled | 2 |
| user_table_preferences | company_id, user_id, preference_key, value, updated_at | company_id, user_id, preference_key | Enabled | 0 |
| vicoba_loans | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| vicoba_meetings | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| vicoba_members | id, company_id, name, status, amount, notes, data, created_at, updated_at | id | Enabled | 0 |
| whatsapp_account_links | id, company_id, profile_id, phone_e164, code_hash, expires_at, used_at, created_by, created_at | id | Enabled | 0 |
| whatsapp_accounts | id, company_id, provider, phone_number_id, display_phone_number, enabled, allowed_capabilities, created_by, created_at, updated_at | id | Enabled | 0 |
| whatsapp_contacts | id, company_id, profile_id, phone_e164, display_name, preferred_language, linked_at, last_seen_at, created_at, updated_at | id | Enabled | 0 |
| whatsapp_conversations | id, company_id, contact_id, status, last_message_at, context_expires_at, created_at, updated_at | id | Enabled | 0 |
| whatsapp_message_events | id, provider_message_id, company_id, phone_e164, event_type, status, payload_hash, error_category, received_at, processed_at | id | Enabled | 0 |
| whatsapp_messages | id, company_id, name, status, amount, notes, data, created_at, updated_at, provider_message_id, direction, phone_e164, body, message_type, provider_timestamp, conversation_id, contact_id, request_id, error_category, tool_name, ai_model | id | Enabled | 0 |
| workflow_marketplace_templates | id, company_id, category, description, install_count, is_official, name, published_by_company_name, steps, trigger_type, created_at, updated_at | id | Enabled | 0 |
| workflows | id, company_id, condition, enabled, last_run, name, steps, trigger_type, created_at, updated_at | id | Enabled | 0 |
| workforce_approval_limits | id, company_id, target_profile_id, target_role_id, permission_id, currency, single_transaction_limit, daily_limit, requires_checker, status, effective_from, effective_to, approval_request_id, assigned_by, assigned_at, revoked_by, revoked_at, version, metadata | id | Enabled | 0 |
| workforce_data_scopes | id, company_id, target_profile_id, target_role_id, scope_type, scope_id, effect, status, effective_from, effective_to, approval_request_id, assigned_by, assigned_at, revoked_by, revoked_at, version, metadata | id | Enabled | 0 |
| workforce_member_roles | id, company_id, profile_id, employee_id, role_id, status, effective_from, effective_to, approval_request_id, assigned_by, assigned_at, revoked_by, revoked_at, version, metadata | id | Enabled | 0 |
| workforce_module_access | id, company_id, target_profile_id, target_role_id, module_id, permission_action, effect, status, effective_from, effective_to, approval_request_id, assigned_by, assigned_at, revoked_by, revoked_at, version, metadata | id | Enabled | 0 |
| workforce_permission_conflicts | id, company_id, conflict_code, permission_a_id, permission_b_id, severity, resolution_policy, status, description, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 21 |
| workforce_permissions | id, company_id, code, module_id, resource, permission_action, description, is_sensitive, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 140 |
| workforce_role_permissions | id, company_id, role_id, permission_id, effect, status, effective_from, effective_to, approval_request_id, granted_by, granted_at, revoked_by, revoked_at, version, metadata | id | Enabled | 469 |
| workforce_roles | id, company_id, code, name, role_kind, description, hierarchy_level, is_assignable, status, created_by, created_at, updated_by, updated_at, version, metadata | id | Enabled | 42 |
| workspaces | id, company_id, channel_ref, department, description, members, name, created_at, updated_at | id | Enabled | 0 |

## 2.4 Dictionary interpretation rules

The reported row estimates are a point-in-time audit snapshot and should not be treated as a completeness assertion. A table with zero reported rows can still be a valid persistence contract, while a non-zero estimate does not prove that every workflow is fully tested. RLS state must be evaluated together with policies, helper functions, grants, foreign keys, triggers, and server authorization. Changes should use source-versioned migrations and should fail safely when existing objects are incompatible.

## 3. Compliance conclusion

The evidence supports a substantial existing Supabase architecture with canonical identity, tenancy, billing, subscription, and module persistence surfaces already present. The most important open compliance work is targeted: protect the payment posting boundary with atomic idempotency, review exposed SECURITY DEFINER signatures, consolidate overlapping RLS policies only after semantic proof, maintain provider secret boundaries, and keep demo behavior explicit and non-operational. The report does not support recreating the schema, adding duplicate identity tables, or applying blanket production DDL.

## References

[1]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/d20a9b922e8596d54f3c7538b6389f71f4aef869/docs/smart-manager-book/master-book/SMART_MANAGER_MASTER_BOOK_EN_SW.md "Repository-audited master book source"
[2]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/d20a9b922e8596d54f3c7538b6389f71f4aef869/FULL_SYSTEM_AUDIT_REPORT.md "Full-system audit and historical findings"
[3]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/d20a9b922e8596d54f3c7538b6389f71f4aef869/docs/smart-manager-book/master-book/evidence/live_supabase_tables_2026-08-24.json "Read-only Supabase table inventory snapshot"
[4]: https://github.com/EzraMpapi/SMARTMANAGER-MANUS/blob/d20a9b922e8596d54f3c7538b6389f71f4aef869/docs/smart-manager-book/master-book/evidence/advisor_counts_2026-08-24.txt "Saved Supabase advisor count summary"
[5]: https://supabase.com/docs/guides/database/postgres/row-level-security "Supabase Row Level Security documentation"

## Documentation and security notice

This report contains schema metadata, security findings, and remediation guidance. It intentionally excludes credentials, service-role keys, provider tokens, passwords, private customer records, and raw business payloads. It should be distributed together with its evidence date and source commit.
