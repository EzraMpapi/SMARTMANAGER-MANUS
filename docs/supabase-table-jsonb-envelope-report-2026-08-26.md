# Supabase Table and JSONB Envelope Report

> **Snapshot date:** 26 August 2026. This report is a schema/data inventory snapshot, not a claim that every module is production-complete.

## Executive summary

The latest bounded `list_tables` inventory contains **553 public tables**, all with RLS enabled in the returned snapshot. The inventory reports **106 rows across 82 non-empty tables**, **2259 foreign-key constraint entries across 527 tables**, and **386 tables containing at least one JSONB column**. Of those, **279 tables expose a `data` JSONB column**.

The important architectural distinction is that `data jsonb` is not one universal business contract. The inventory shows a common generic envelope in some tables, typed relational columns plus `data` in others, and domain-specific JSONB columns such as `provider_response`, `summary`, `kyc_data`, or `profile_data`. Consumers must therefore use the table-specific contract and must not copy the Integration Hub envelope into typed domain tables.

## Inventory metrics

| Metric | Result | Interpretation |
|---|---:|---|
| Public tables in snapshot | 553 | Tables returned by the live Supabase inventory |
| Tables with RLS enabled | 553 | RLS was enabled for every table in this snapshot |
| Total reported rows | 106 | Approximate current row count exposed by the inventory tool |
| Non-empty tables | 82 | Tables with at least one row at snapshot time |
| Tables with any JSONB | 386 | Includes `data` and domain-specific JSONB columns |
| Tables with `data` JSONB | 279 | May be generic or an extension envelope; see classification |
| Common generic envelope tables | 179 | Exactly the compact 9-column `id/company_id/name/status/amount/notes/data/timestamps` pattern |
| Typed columns + `data` JSONB | 100 | Domain tables with explicit business columns and an auxiliary envelope |
| Typed columns + other JSONB | 107 | Domain-specific JSONB such as `summary` or `provider_response` |
| Typed/no JSONB tables | 167 | Relational-only or typed tables in this snapshot |
| Foreign-key entries | 2259 | Constraint entries returned by the inventory |

## JSONB envelope taxonomy

| Classification | Count | Contract guidance |
|---|---:|---|
| Common generic envelope | 179 | Read/write through `name`, `status`, `amount`, `notes`, and `data` only when the module contract explicitly defines those keys. |
| Typed columns + `data` | 100 | Put business-critical searchable fields in typed columns; reserve `data` for compatible extension metadata. |
| Typed columns + other JSONB | 107 | Use the named JSONB column’s domain contract; do not rename it to `data`. |
| Typed/no JSONB | 167 | Use the typed columns and foreign keys; adding an envelope requires explicit design evidence. |

## Module-focused findings

| Area | Live tables/contract | Review result |
|---|---|---|
| TRA Fiscalization | `restaurant_tax_profiles`, `restaurant_fiscal_profiles`, `restaurant_fiscal_receipts`, `tra_*`, plus restaurant RPCs | The Supabase-native fiscal migration uses the restaurant-prefixed typed schema. The legacy `server/traFiscal.ts` / `server/traFiscalRouter.ts` still declare Drizzle tables named `fiscal_profiles`, `fiscal_receipts`, `fiscal_retry_queue`, `z_reports`, and `tax_configurations`; those names were not present in the live public inventory. This is a confirmed schema-drift risk requiring a separate, carefully tested router migration. |
| VICOBA / Community Groups | `community_group_*` | Primarily typed relational tables. `community_group_members` has `kyc_data` and `data` JSONB extensions. No confirmed generic-column mismatch was found in the reviewed frontend mappings. |
| Microfinance | `mfi_*` | The reviewed `server/microfinanceOperations.ts` path uses the common generic envelope and company-scoped filters. No confirmed table/column mismatch was found in the reviewed path. |
| Restaurant/Tanzania | `restaurant_*` | Typed business fields plus selective JSONB envelopes. Fiscal receipt provider responses are kept in `provider_response`; official TRA status is not synthesized locally. |

## Key safety interpretation

The presence of a JSONB column does not authorize arbitrary writes. Every write must retain the authenticated tenant boundary, respect the table’s foreign keys and checks, and preserve domain-specific audit and approval workflows. Sensitive values such as provider credentials, API keys, access tokens, and private certificates must remain server-side and must not be placed in browser payloads or generic JSONB metadata.

For TRA specifically, the correct next engineering step is not to create duplicate legacy tables blindly. The live Supabase-native migration already provides a protected typed model and RPC boundary; the legacy router should be migrated or retired in a dedicated change after a compatibility design, rollback plan, and authenticated E2E coverage are prepared.

## Full public-table inventory

The following table is generated from the live inventory snapshot. `typed` excludes the common envelope columns (`id`, `company_id`, `name`, `status`, `amount`, `notes`, `data`, and timestamps) so the remaining names highlight domain-specific fields. `fks` is the number of foreign-key constraint entries returned for the table.

| Table | RLS | Rows | Columns | JSONB columns | Classification | Domain-specific typed columns | FK entries |
|---|---:|---:|---:|---|---|---|---:|
| approval_signatures | True | 0 | 9 | data | Common generic envelope | - | 1 |
| audit_log | True | 3 | 10 | detail | Typed columns + other JSONB | action,module,actor,details,subject,detail | 1 |
| audit_logs | True | 0 | 8 | - | Typed/no JSONB | actor_open_id,actor_name,action,module,details | 0 |
| bank_account_beneficiaries | True | 0 | 13 | - | Typed/no JSONB | customer_id,account_id,beneficiary_name,beneficiary_account_number,bank_name,phone,verified_at,created_by | 3 |
| bank_account_types | True | 0 | 14 | data | Typed columns + data JSONB | code,product_kind,currency,minimum_opening_balance,minimum_operating_balance,annual_interest_rate,withdrawal_fee | 1 |
| bank_accounts | True | 0 | 21 | data | Typed columns + data JSONB | account_number,customer_id,account_type_id,branch_id,currency,ledger_balance,available_balance,hold_amount,opened_at,closed_at,version,created_by | 9 |
| bank_agents | True | 0 | 13 | data | Typed columns + data JSONB | agent_code,phone,national_id,branch_id,float_balance,commission_rate | 2 |
| bank_aml_alerts | True | 0 | 15 | data | Typed columns + data JSONB | alert_number,customer_id,transaction_id,rule_code,risk_level,rationale,assigned_to,mlro_decision,closed_at | 3 |
| bank_audit_events | True | 3 | 10 | redacted_payload | Typed columns + other JSONB | actor_id,operation,entity_type,entity_id,outcome,request_id,redacted_payload | 1 |
| bank_beneficial_owners | True | 0 | 10 | data | Typed columns + data JSONB | customer_id,full_name,national_id,ownership_percent,verification_status | 2 |
| bank_branches | True | 1 | 12 | - | Typed/no JSONB | institution_id,code,region,district,address,phone | 8 |
| bank_cash_movements | True | 0 | 15 | - | Typed/no JSONB | teller_id,branch_id,movement_type,currency,transaction_id,approved_by,approved_at,idempotency_key,narration,created_by | 4 |
| bank_collateral | True | 0 | 11 | data | Typed columns + data JSONB | application_id,collateral_type,description,ownership_document,estimated_value,valuation_date,verification_status | 2 |
| bank_customer_documents | True | 0 | 14 | data | Typed columns + data JSONB | customer_id,document_type,document_number,file_url,issued_at,expires_at,verification_status,verified_by,verified_at | 2 |
| bank_customers | True | 2 | 27 | data | Typed columns + data JSONB | customer_number,customer_kind,full_name,phone,email,date_of_birth,gender,occupation,address,national_id,tin,risk_rating,pep_status,source_of_funds,relationship_purpose,kyc_status,kyc_verified_at,kyc_verified_by,kyc_expires_at,branch_id,created_by | 14 |
| bank_fixed_deposit_events | True | 0 | 17 | data | Typed columns + data JSONB | fixed_deposit_id,event_type,event_at,principal_delta,interest_delta,tax_delta,penalty_delta,currency,journal_batch_id,transaction_id,actor_id,idempotency_key | 4 |
| bank_fixed_deposit_products | True | 0 | 25 | data | Typed columns + data JSONB | code,currency,minimum_principal,maximum_principal,minimum_term_days,maximum_term_days,annual_interest_rate,interest_method,compounding_frequency,withholding_tax_rate,early_withdrawal_allowed,early_withdrawal_penalty_rate,default_maturity_instruction,principal_liability_gl_code,interest_expense_gl_code,withholding_tax_gl_code,cash_or_clearing_gl_code,created_by | 2 |
| bank_fixed_deposits | True | 0 | 41 | data | Typed columns + data JSONB | deposit_number,product_id,customer_id,source_account_id,payout_account_id,currency,principal,annual_interest_rate,term_days,day_count_basis,interest_method,compounding_frequency,start_date,maturity_date,maturity_instruction,auto_renew,renewal_count,accrued_interest,paid_interest,withheld_tax,early_withdrawal_penalty,maturity_amount,created_by,approved_by,approved_at,activated_at,matured_at,closed_at,cancelled_at,closure_reason,idempotency_key,version | 6 |
| bank_group_members | True | 0 | 8 | - | Typed/no JSONB | group_id,customer_id,role,shares_count,joined_at | 3 |
| bank_groups | True | 0 | 11 | data | Typed columns + data JSONB | group_number,group_type,meeting_frequency,branch_id | 4 |
| bank_guarantors | True | 0 | 9 | data | Typed columns + data JSONB | application_id,customer_id,guarantee_amount,consent_status,consented_at | 3 |
| bank_idempotency_keys | True | 0 | 10 | result | Typed columns + other JSONB | idempotency_key,operation,request_hash,result,created_by,completed_at | 1 |
| bank_institutions | True | 1 | 16 | data | Typed columns + data JSONB | legal_name,trading_name,institution_type,licence_number,licence_status,country_code,currency,currency_exponent,timezone,fiscal_year_start_month,created_by | 2 |
| bank_journal_batches | True | 0 | 13 | - | Typed/no JSONB | batch_number,currency,total_debit,total_credit,source_type,source_id,idempotency_key,posted_by,posted_at | 3 |
| bank_journal_lines | True | 0 | 9 | - | Typed/no JSONB | batch_id,account_id,gl_code,line_description,debit,credit | 3 |
| bank_loan_applications | True | 0 | 21 | score_inputs,data | Typed columns + other JSONB | application_number,customer_id,product_id,term_months,purpose,credit_score,score_inputs,submitted_by,submitted_at,decision_by,decision_at,decision_note,branch_id,disbursement_account_id | 7 |
| bank_loan_approvals | True | 0 | 8 | - | Typed/no JSONB | application_id,step_number,approver_id,decision,note,decided_at | 2 |
| bank_loan_products | True | 0 | 21 | data | Typed columns + data JSONB | code,product_kind,currency,minimum_amount,maximum_amount,minimum_term_months,maximum_term_months,annual_interest_rate,interest_method,processing_fee_rate,late_penalty_rate,collateral_required,guarantors_required,approval_threshold | 2 |
| bank_loan_repayments | True | 0 | 16 | - | Typed/no JSONB | repayment_number,loan_id,account_id,principal_amount,interest_amount,fee_amount,penalty_amount,channel,idempotency_key,transaction_id,posted_by,posted_at | 4 |
| bank_loan_schedules | True | 0 | 15 | - | Typed/no JSONB | loan_id,installment_number,due_date,principal_due,interest_due,fee_due,penalty_due,principal_paid,interest_paid,fee_paid,penalty_paid,paid_at | 2 |
| bank_loans | True | 0 | 28 | data | Typed columns + data JSONB | loan_number,application_id,customer_id,product_id,principal,outstanding_principal,outstanding_interest,outstanding_fees,outstanding_penalties,annual_interest_rate,term_months,interest_method,disbursed_at,maturity_date,days_past_due,par_bucket,write_off_at,restructure_count,created_by | 3 |
| bank_market_rates | True | 0 | 10 | - | Typed/no JSONB | bank_name,currency_pair,buy_rate,sell_rate,lending_rate_annual,source | 0 |
| bank_notifications | True | 0 | 12 | data | Typed columns + data JSONB | profile_id,customer_id,notification_type,title,body,channel,sent_at | 2 |
| bank_payment_instructions | True | 0 | 19 | data | Typed columns + data JSONB | instruction_number,payment_type,channel,source_account_id,destination_account_id,currency,provider,msisdn,provider_reference,requested_at,confirmed_at,failure_reason,idempotency_key,created_by | 6 |
| bank_provider_transactions | True | 0 | 20 | - | Typed/no JSONB | provider,provider_account_key,operation_type,standing_order_run_id,payment_instruction_id,client_reference,provider_event_id,provider_uuid,provider_reference,currency,request_payload_hash,last_callback_at,failure_code,failure_message | 3 |
| bank_provider_webhook_account_controls | True | 0 | 7 | - | Typed/no JSONB | provider,provider_account_key,settlement_paused,pause_reason,paused_at,paused_by_execution_id | 0 |
| bank_provider_webhook_drain_approvals | True | 0 | 20 | - | Typed/no JSONB | provider,provider_account_key,environment,mode,max_items,max_settlements,request_token_hash,approval_token_hash,approver_token_hash,requested_by,approved_by,requested_at,approved_at,expires_at,consumed_at,revoked_at,request_reason,approval_reason | 3 |
| bank_provider_webhook_drain_runs | True | 0 | 20 | - | Typed/no JSONB | provider,provider_account_key,environment,mode,approval_id,requested_by,max_items,max_settlements,lease_seconds,claimed_count,requeued_count,settled_count,quarantined_count,failed_count,execution_id,started_at,finished_at,stop_reason | 3 |
| bank_provider_webhook_events | True | 0 | 21 | payload_redacted | Typed columns + other JSONB | provider,provider_account_key,standing_order_run_id,payment_instruction_id,provider_event_id,provider_uuid,provider_reference,client_reference,provider_status,currency,raw_payload_hash,semantic_fingerprint,signature_verified,signature_key_version,ingest_outcome,payload_redacted,received_at,execution_id | 6 |
| bank_provider_webhook_processing | True | 0 | 11 | - | Typed/no JSONB | event_id,processing_status,attempt_count,next_attempt_at,lease_until,processing_started_at,processed_at,last_error_code,last_error_message | 2 |
| bank_provider_webhook_remediation | True | 0 | 14 | - | Typed/no JSONB | event_id,remediation_status,classification,reason_code,drain_run_id,lease_token,lease_until,remediation_attempt_count,expected_attempt,last_remediated_at,last_error_code,last_error_message | 3 |
| bank_reconciliations | True | 0 | 16 | - | Typed/no JSONB | reconciliation_number,account_id,period_start,period_end,statement_balance,ledger_balance,difference,reviewed_by,reviewed_at,created_by | 2 |
| bank_shares | True | 0 | 9 | - | Typed/no JSONB | group_id,customer_id,shares_count,price_per_share,transaction_id | 4 |
| bank_standing_order_events | True | 0 | 13 | before_data,after_data | Typed columns + other JSONB | standing_order_id,event_type,previous_status,next_status,actor_id,request_id,idempotency_key,reason,before_data,after_data | 2 |
| bank_standing_order_runs | True | 0 | 20 | data | Typed columns + data JSONB | standing_order_id,scheduled_for,started_at,completed_at,attempt_number,currency,transaction_id,payment_instruction_id,provider,provider_reference,error_code,error_message,idempotency_key,created_by | 6 |
| bank_standing_orders | True | 0 | 42 | data | Typed columns + data JSONB | order_number,source_account_id,destination_account_id,destination_msisdn,frequency,next_run_date,end_date,last_run_at,last_result,created_by,customer_id,currency,channel,narration,timezone,schedule_day,run_count,failure_count,consecutive_failure_count,max_retries,failure_policy,approval_required,approved_by,approved_at,rejected_by,rejected_at,rejection_reason,paused_at,cancelled_at,cancelled_by,version,idempotency_key,updated_by | 4 |
| bank_tellers | True | 0 | 15 | data | Typed columns + data JSONB | profile_id,branch_id,teller_code,opening_balance,closing_balance,opened_at,closed_at,version | 3 |
| bank_transactions | True | 1 | 26 | data | Typed columns + data JSONB | transaction_number,transaction_type,channel,source_account_id,destination_account_id,customer_id,fee_amount,currency,idempotency_key,provider,provider_reference,narration,journal_batch_id,teller_id,initiated_by,posted_at,reversed_transaction_id | 7 |
| bank_wallets | True | 0 | 12 | data | Typed columns + data JSONB | wallet_number,customer_id,provider,msisdn,balance,provider_customer_ref | 2 |
| billing_plan_audit_log | True | 0 | 9 | previous_values,new_values | Typed columns + other JSONB | plan_id,action,changed_by,source,previous_values,new_values | 2 |
| billing_plans | True | 0 | 28 | features,module_entitlements | Typed columns + other JSONB | code,description,currency,monthly_price,annual_price,annual_savings_label,included_users,included_branches,included_storage_mb,included_transactions,features,module_entitlements,sort_order,recommended,created_by,plan_category,badge,visual_theme,paid_months,bonus_months,total_months,duration_days | 4 |
| billing_profiles | True | 0 | 11 | address | Typed columns + other JSONB | legal_name,contact_name,email,phone,tax_identifier,address | 1 |
| bnk_accounts | True | 0 | 14 | data | Typed columns + data JSONB | member_id,type,balance,open_date,branch,acct_no,interest | 0 |
| bnk_applications | True | 0 | 16 | data | Typed columns + data JSONB | member_id,member,product,term,purpose,collateral,submitted_date,officer,score | 0 |
| bnk_loans | True | 0 | 19 | data | Typed columns + data JSONB | member_id,member,product,principal,rate,term,disbursed,maturity,balance,collateral,emi,paid,dpd | 0 |
| bnk_members | True | 0 | 15 | data | Typed columns + data JSONB | dob,national_id,phone,email,gender,occupation,kyc_status,join_date,branch | 0 |
| bnk_transactions | True | 0 | 14 | data | Typed columns + data JSONB | acct_no,member,type,balance,date,channel,narration,ref | 0 |
| branches | True | 1 | 9 | data | Common generic envelope | - | 5 |
| business_loans | True | 0 | 9 | data | Common generic envelope | - | 1 |
| calendar_events | True | 0 | 12 | - | Typed/no JSONB | attendees,description,end_time,event_date,event_type,meeting_link,start_time,title | 1 |
| collab_channels | True | 0 | 7 | - | Typed/no JSONB | description,scope | 1 |
| collab_messages | True | 0 | 9 | data | Common generic envelope | - | 1 |
| community_contributions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| community_group_announcements | True | 0 | 12 | - | Typed/no JSONB | group_id,title,body,audience,published_at,expires_at,created_by | 2 |
| community_group_approvals | True | 0 | 14 | - | Typed/no JSONB | group_id,entity_type,entity_id,action,requested_by,decided_by,decision_notes,requested_at,decided_at | 2 |
| community_group_assets | True | 0 | 14 | - | Typed/no JSONB | group_id,asset_code,category,acquisition_date,acquisition_cost,current_value,location,custodian | 2 |
| community_group_attendance | True | 0 | 8 | - | Typed/no JSONB | meeting_id,member_id | 3 |
| community_group_audit_log | True | 0 | 11 | details | Typed columns + other JSONB | group_id,actor_id,actor_name,action,entity_type,entity_id,details | 2 |
| community_group_budgets | True | 0 | 12 | - | Typed/no JSONB | group_id,project_id,category,budget_amount,fiscal_year,approved_by,approved_at | 3 |
| community_group_committee_members | True | 0 | 9 | - | Typed/no JSONB | committee_id,member_id,committee_role,start_date,end_date | 3 |
| community_group_committees | True | 0 | 8 | - | Typed/no JSONB | group_id,committee_type | 3 |
| community_group_contributions | True | 0 | 19 | - | Typed/no JSONB | group_id,member_id,contribution_number,contribution_type,currency,contribution_date,due_date,payment_method,mobile_money_provider,payment_reference,receipt_number,created_by | 3 |
| community_group_documents | True | 0 | 12 | - | Typed/no JSONB | group_id,document_type,title,file_url,document_date,expires_at,uploaded_by | 2 |
| community_group_events | True | 0 | 14 | - | Typed/no JSONB | group_id,title,event_type,event_date,start_time,venue,description,reminder_sent_at,created_by | 2 |
| community_group_expenses | True | 0 | 16 | - | Typed/no JSONB | group_id,project_id,category,description,expense_date,payment_method,payment_reference,approved_by,approved_at,created_by | 3 |
| community_group_fundraising | True | 0 | 13 | - | Typed/no JSONB | group_id,project_id,donor_name,donation_date,payment_method,payment_reference | 3 |
| community_group_income | True | 0 | 12 | - | Typed/no JSONB | group_id,income_type,description,income_date,payment_method,payment_reference | 2 |
| community_group_loan_guarantors | True | 0 | 9 | - | Typed/no JSONB | loan_id,guarantor_member_id,guaranteed_amount,consent_status,consented_at | 3 |
| community_group_loan_penalties | True | 0 | 10 | - | Typed/no JSONB | loan_id,penalty_date,reason,created_by | 2 |
| community_group_loan_repayments | True | 0 | 18 | - | Typed/no JSONB | loan_id,repayment_number,repayment_date,principal_amount,interest_amount,penalty_amount,payment_method,mobile_money_provider,payment_reference,receipt_number,created_by | 2 |
| community_group_loans | True | 0 | 28 | - | Typed/no JSONB | group_id,member_id,loan_number,purpose,principal,interest_rate,interest_method,term_months,application_date,approval_status,approved_by,approved_at,disbursed_at,first_due_date,total_interest,total_repayable,outstanding_principal,outstanding_interest,currency,payment_method,disbursement_reference,created_by | 6 |
| community_group_meetings | True | 0 | 15 | - | Typed/no JSONB | group_id,meeting_number,meeting_date,start_time,venue,agenda,minutes,chairperson_id,reminder_sent_at,created_by | 4 |
| community_group_members | True | 0 | 25 | kyc_data,data | Typed columns + other JSONB | group_id,member_number,full_name,phone,email,national_id,id_type,gender,date_of_birth,address,occupation,next_of_kin,next_of_kin_phone,join_date,exit_date,role,kyc_status,membership_status,kyc_data,created_by | 14 |
| community_group_messages | True | 0 | 10 | - | Typed/no JSONB | group_id,sender_member_id,subject,body,channel | 3 |
| community_group_notifications | True | 0 | 13 | - | Typed/no JSONB | group_id,member_id,notification_type,title,body,channel,scheduled_for,sent_at | 3 |
| community_group_projects | True | 0 | 13 | - | Typed/no JSONB | group_id,project_number,description,start_date,end_date,target_amount,created_by | 5 |
| community_group_savings | True | 0 | 14 | - | Typed/no JSONB | group_id,member_id,transaction_type,transaction_date,payment_method,reference,created_by | 3 |
| community_group_vote_ballots | True | 0 | 6 | - | Typed/no JSONB | vote_id,option_id,member_id,cast_at | 4 |
| community_group_vote_options | True | 0 | 8 | - | Typed/no JSONB | vote_id,label,candidate_member_id,vote_count | 4 |
| community_group_votes | True | 0 | 13 | - | Typed/no JSONB | group_id,title,description,vote_type,opens_at,closes_at,quorum_percent,created_by | 4 |
| community_group_welfare_claims | True | 0 | 17 | - | Typed/no JSONB | group_id,member_id,event_type,description,amount_requested,amount_approved,claim_date,payment_method,payment_reference,approved_by,approved_at,created_by | 3 |
| community_groups | True | 0 | 24 | data,rules | Typed columns + other JSONB | group_number,group_type,registration_number,description,country,region,district,ward,village,meeting_frequency,contribution_frequency,contribution_amount,currency,rules,created_by | 22 |
| companies | True | 0 | 25 | - | Typed/no JSONB | category,tin,vrn,phone,email,address,city,country,currency,tax_rate,logo,join_code,website,tax_id,business_scale,timezone,receipt_width,receipt_footer,receipt_show_logo,brand_primary_color,brand_accent_color | 517 |
| company_memberships | True | 0 | 10 | metadata | Typed columns + other JSONB | user_id,role,invited_by,joined_at,metadata | 2 |
| company_modules | True | 0 | 9 | data | Common generic envelope | - | 1 |
| company_profile_settings | True | 0 | 3 | profile_data | Typed columns + other JSONB | profile_data | 1 |
| competitors | True | 0 | 8 | - | Typed/no JSONB | category,threat_level | 1 |
| crm_contacts | True | 2 | 9 | data | Common generic envelope | - | 3 |
| crm_interactions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| crm_leads | True | 0 | 9 | data | Common generic envelope | - | 1 |
| custom_kpis | True | 0 | 7 | - | Typed/no JSONB | label,metric_id,target_value | 1 |
| customer_feedback | True | 0 | 9 | data | Common generic envelope | - | 1 |
| dashboard_report_schedules | True | 0 | 17 | modules,date_range | Typed columns + other JSONB | owner_user_id,owner_open_id,recipient_email,cc_emails,cron_expression,frequency,format,modules,date_range,schedule_cron_task_uid,is_active,last_sent_at | 0 |
| departments | True | 1 | 9 | data | Common generic envelope | - | 3 |
| digital_signatures | True | 0 | 9 | data | Common generic envelope | - | 1 |
| documents | True | 1 | 9 | data | Common generic envelope | - | 5 |
| dse_market_tickers | True | 0 | 10 | - | Typed/no JSONB | symbol,company_name,price_tzs,change_tzs,change_percent,volume | 0 |
| ecommerce_orders | True | 1 | 9 | data | Common generic envelope | - | 1 |
| ecommerce_products | True | 1 | 9 | data | Common generic envelope | - | 1 |
| emails | True | 0 | 9 | data | Common generic envelope | - | 1 |
| expense_budgets | True | 0 | 9 | data | Common generic envelope | - | 1 |
| fin_accounts | True | 3 | 17 | metadata | Typed columns + other JSONB | account_code,account_name,account_type,normal_side,parent_id,is_postable,is_cash,currency,created_by,updated_by,version,metadata | 8 |
| fin_approval_requests | True | 0 | 18 | metadata | Typed columns + other JSONB | entity_type,entity_id,action,requested_by,required_approvals,decided_by,decided_at,decision_note,maker_checker_key,created_by,updated_by,version,metadata | 19 |
| fin_idempotency_keys | True | 0 | 14 | response,metadata | Typed columns + other JSONB | scope,idempotency_key,request_hash,response,expires_at,created_by,updated_by,version,metadata | 3 |
| fin_journal_batches | True | 1 | 21 | metadata | Typed columns + other JSONB | batch_number,source_module,source_type,source_id,business_date,currency,debit_total,credit_total,posted_at,posted_by,reversal_of_batch_id,narration,created_by,updated_by,version,metadata | 13 |
| fin_journal_lines | True | 2 | 19 | metadata | Typed columns + other JSONB | journal_batch_id,line_no,business_date,account_id,debit,credit,currency,branch_id,member_id,customer_id,description,created_by,updated_by,version,metadata | 5 |
| fin_periods | True | 0 | 14 | metadata | Typed columns + other JSONB | period_start,period_end,timezone,closed_by,closed_at,created_by,updated_by,version,metadata | 4 |
| fin_posting_links | True | 0 | 11 | metadata | Typed columns + other JSONB | journal_batch_id,source_table,source_id,link_role,created_by,version,metadata | 3 |
| fin_reconciliation_batches | True | 0 | 18 | metadata | Typed columns + other JSONB | account_scope,external_source,statement_date,opening_balance,closing_balance,file_reference,import_hash,approved_by,approved_at,created_by,updated_by,version,metadata | 5 |
| fin_reconciliation_items | True | 0 | 21 | metadata | Typed columns + other JSONB | batch_id,external_reference,external_date,direction,provider,provider_status,matched_source_table,matched_source_id,match_status,exception_reason,resolved_by,resolved_at,created_by,updated_by,version,metadata | 5 |
| finance_assets | True | 0 | 9 | - | Typed/no JSONB | acquisition_date,category,cost,useful_life_years | 1 |
| finance_expenses | True | 1 | 11 | - | Typed/no JSONB | category,due_date,expense_date,method,vendor | 2 |
| financial_benchmarks | True | 0 | 7 | - | Typed/no JSONB | benchmark_value,label,metric_id | 1 |
| fleet_alerts | True | 0 | 14 | - | Typed/no JSONB | alert_key,severity,alert_type,entity_type,entity_id,title,body,due_on,acknowledged_by,acknowledged_at | 2 |
| fleet_audit_events | True | 1 | 10 | before_data,after_data,metadata | Typed columns + other JSONB | actor_profile_id,action,entity_type,entity_id,before_data,after_data,metadata | 2 |
| fleet_driver_assignments | True | 0 | 10 | - | Typed/no JSONB | vehicle_id,driver_id,starts_at,ends_at,assigned_by | 4 |
| fleet_drivers | True | 0 | 15 | - | Typed/no JSONB | employee_id,profile_id,full_name,mobile_number,licence_number,licence_class,licence_expires_on,safety_score,created_by | 7 |
| fleet_fuel_cards | True | 0 | 10 | - | Typed/no JSONB | card_number_masked,issuer,vehicle_id,daily_limit,monthly_limit,expires_on | 3 |
| fleet_fuel_transactions | True | 0 | 16 | - | Typed/no JSONB | vehicle_id,trip_id,fuel_card_id,transaction_at,station_name,litres,unit_price,total_cost,odometer_km,receipt_url,payment_reference,created_by | 5 |
| fleet_incidents | True | 0 | 14 | - | Typed/no JSONB | vehicle_id,driver_id,trip_id,incident_type,occurred_at,location,description,cost,evidence_url,created_by | 5 |
| fleet_maintenance_jobs | True | 0 | 19 | - | Typed/no JSONB | job_number,vehicle_id,plan_id,workshop_id,maintenance_type,priority,requested_on,due_on,odometer_km,estimated_cost,approved_by,completed_on,created_by | 7 |
| fleet_maintenance_plans | True | 0 | 16 | - | Typed/no JSONB | vehicle_id,maintenance_type,interval_km,interval_days,last_completed_odometer_km,last_completed_on,next_due_odometer_km,next_due_on,active,created_by | 4 |
| fleet_routes | True | 0 | 13 | - | Typed/no JSONB | origin,destination,planned_distance_km,expected_duration_minutes,toll_budget,active,created_by | 3 |
| fleet_service_records | True | 0 | 13 | - | Typed/no JSONB | maintenance_job_id,vehicle_id,service_date,odometer_km,labour_cost,parts_cost,total_cost,invoice_reference,created_by | 4 |
| fleet_spare_parts | True | 0 | 10 | - | Typed/no JSONB | inventory_item_id,part_number,quantity_on_hand,reorder_level,average_cost,location | 2 |
| fleet_telematics_events | True | 0 | 13 | payload | Typed columns + other JSONB | vehicle_id,provider,external_event_id,captured_at,latitude,longitude,speed_kph,odometer_km,ignition_on,payload | 2 |
| fleet_trips | True | 0 | 25 | - | Typed/no JSONB | trip_number,vehicle_id,driver_id,route_id,purpose,customer_reference,dispatch_status,planned_departure_at,dispatched_at,completed_at,origin,destination,start_odometer_km,end_odometer_km,distance_km,toll_cost,parking_cost,other_cost,approved_by,created_by | 8 |
| fleet_tyres | True | 0 | 13 | - | Typed/no JSONB | vehicle_id,position,brand,size,serial_number,installed_on,installed_odometer_km,expected_life_km | 2 |
| fleet_vehicle_categories | True | 0 | 5 | - | Typed/no JSONB | description | 2 |
| fleet_vehicle_documents | True | 0 | 14 | - | Typed/no JSONB | vehicle_id,document_type,document_number,issuer,issued_on,expires_on,document_url,created_by | 3 |
| fleet_vehicles | True | 1 | 25 | metadata | Typed columns + other JSONB | registration_number,ownership_type,category_id,make,model,model_year,vin,engine_number,fuel_type,odometer_km,seats,acquisition_type,acquisition_date,acquisition_cost,lease_end_date,home_branch,cost_center,metadata,created_by | 14 |
| fleet_workshops | True | 0 | 10 | - | Typed/no JSONB | contact_name,phone,email,address,supplier_id | 2 |
| flt_maintenance | True | 1 | 9 | data | Common generic envelope | - | 1 |
| flt_trips | True | 1 | 9 | data | Common generic envelope | - | 1 |
| flt_vehicles | True | 1 | 9 | data | Common generic envelope | - | 1 |
| hc_appointments | True | 1 | 9 | data | Common generic envelope | - | 1 |
| hc_doctors | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_insurance_claims | True | 0 | 9 | data | Common generic envelope | - | 0 |
| hc_invoices | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_lab_categories | True | 0 | 22 | specimen_requirements,data | Typed columns + other JSONB | code,description,specimen_requirements,default_turnaround_hours,requires_fasting,requires_referral,base_price,currency,sort_order,idempotency_key,version,created_by,updated_by,archived_by,archived_at | 2 |
| hc_lab_category_events | True | 0 | 14 | before_data,after_data,data | Typed columns + other JSONB | category_id,event_type,event_at,actor_id,idempotency_key,previous_status,next_status,before_data,after_data,reason | 1 |
| hc_lab_orders | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_notifications | True | 0 | 9 | data | Common generic envelope | - | 0 |
| hc_patients | True | 1 | 9 | data | Common generic envelope | - | 1 |
| hc_portal_reference_approvals | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_portal_reference_imports | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_portal_reference_summary_settings | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_prescriptions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_radiology | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_reminder_deliveries | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_reminder_settings | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_reports | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_visits | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hc_vitals | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hospitality_amenities | True | 0 | 6 | data | Typed columns + data JSONB | category | 1 |
| hospitality_audit_log | True | 0 | 7 | detail | Typed columns + other JSONB | actor_profile_id,action,subject,detail | 1 |
| hospitality_complaints | True | 0 | 11 | data | Typed columns + data JSONB | reservation_id,guest_id,category,description,resolution | 3 |
| hospitality_event_venues | True | 0 | 9 | data | Typed columns + data JSONB | property_id,capacity,base_rate,currency | 3 |
| hospitality_events | True | 0 | 12 | data | Typed columns + data JSONB | property_id,venue_id,guest_id,start_at,end_at,currency | 4 |
| hospitality_finance_reconciliations | True | 0 | 18 | data | Typed columns + data JSONB | property_id,business_date,currency,gross_revenue,tax_total,payment_total,refund_total,variance,pos_transaction_id,journal_entry_id,finance_reference,created_by | 4 |
| hospitality_folio_lines | True | 1 | 15 | data | Typed columns + data JSONB | folio_id,line_type,description,quantity,unit_amount,tax_amount,currency,source_table,source_record_id,posted_by,posted_at | 2 |
| hospitality_folios | True | 1 | 12 | data | Typed columns + data JSONB | property_id,reservation_id,guest_id,folio_number,currency,finance_reference | 8 |
| hospitality_guest_kyc | True | 0 | 11 | data | Typed columns + data JSONB | guest_id,document_id,id_type,id_number,issuing_country,expires_at,verification_status | 3 |
| hospitality_guest_requests | True | 0 | 12 | data | Typed columns + data JSONB | reservation_id,guest_id,request_type,description,priority,assigned_employee_id | 4 |
| hospitality_guests | True | 1 | 14 | data | Typed columns + data JSONB | profile_id,first_name,last_name,email,phone,nationality,date_of_birth,loyalty_number | 11 |
| hospitality_housekeeping_tasks | True | 1 | 13 | data | Typed columns + data JSONB | property_id,room_id,assigned_employee_id,task_type,due_at,completed_at | 4 |
| hospitality_laundry_orders | True | 0 | 10 | data | Typed columns + data JSONB | reservation_id,guest_id,currency | 3 |
| hospitality_loyalty_accounts | True | 0 | 7 | data | Typed columns + data JSONB | guest_id,tier,points | 2 |
| hospitality_maintenance_requests | True | 0 | 12 | data | Typed columns + data JSONB | property_id,room_id,category,priority,assigned_employee_id | 4 |
| hospitality_menu_items | True | 0 | 9 | data | Typed columns + data JSONB | menu_id,inventory_item_id,price,currency | 4 |
| hospitality_menus | True | 0 | 7 | data | Typed columns + data JSONB | property_id,meal_period | 3 |
| hospitality_minibar_postings | True | 0 | 9 | data | Typed columns + data JSONB | reservation_id,inventory_item_id,quantity | 3 |
| hospitality_notifications | True | 0 | 11 | - | Typed/no JSONB | profile_id,employee_id,title,body,type,module,record_id,read_at | 3 |
| hospitality_order_lines | True | 0 | 9 | data | Typed columns + data JSONB | order_id,menu_item_id,quantity,unit_price | 3 |
| hospitality_orders | True | 0 | 13 | data | Typed columns + data JSONB | property_id,table_id,reservation_id,folio_id,order_number,currency,created_by | 6 |
| hospitality_payments | True | 1 | 12 | data | Typed columns + data JSONB | folio_id,payment_method,currency,reference,finance_payment_id,received_by,received_at | 2 |
| hospitality_properties | True | 1 | 12 | data | Typed columns + data JSONB | branch_id,code,address,timezone,currency | 17 |
| hospitality_rate_plans | True | 0 | 11 | data | Typed columns + data JSONB | property_id,room_type_id,currency,nightly_rate,effective_from,effective_to | 3 |
| hospitality_reservations | True | 1 | 21 | data | Typed columns + data JSONB | property_id,guest_id,room_type_id,room_id,confirmation_code,arrival_date,departure_date,adults,children,nightly_rate,currency,source,special_requests,checked_in_at,checked_out_at | 11 |
| hospitality_restaurant_tables | True | 0 | 8 | data | Typed columns + data JSONB | property_id,table_number,capacity,zone | 3 |
| hospitality_room_types | True | 1 | 12 | amenities,data | Typed columns + other JSONB | property_id,code,capacity_adults,capacity_children,base_rate,currency,amenities | 5 |
| hospitality_rooms | True | 1 | 12 | data | Typed columns + data JSONB | property_id,room_type_id,room_number,floor,housekeeping_status,maintenance_status | 6 |
| hospitality_taxes | True | 0 | 11 | data | Typed columns + data JSONB | property_id,code,rate,applies_to,effective_from,effective_to | 2 |
| hr_announcement_reads | True | 0 | 3 | - | Typed/no JSONB | announcement_id,profile_id,read_at | 1 |
| hr_announcements | True | 0 | 12 | - | Typed/no JSONB | title,body,audience_type,department_id,published_at,expires_at,created_by | 3 |
| hr_approval_requests | True | 0 | 12 | data | Typed columns + data JSONB | request_type,source_table,source_record_id,requester_employee_id,subject_employee_id,current_step | 4 |
| hr_approval_steps | True | 0 | 10 | - | Typed/no JSONB | approval_request_id,step_number,approver_profile_id,approver_role,decision_note,decided_at | 3 |
| hr_attendance | True | 1 | 16 | data | Typed columns + data JSONB | employee_id,attendance_date,shift_id,clock_in_at,clock_out_at,worked_minutes,source | 1 |
| hr_benefit_enrollments | True | 0 | 10 | data | Typed columns + data JSONB | employee_id,benefit_plan_id,effective_from,effective_to | 3 |
| hr_benefit_plans | True | 0 | 12 | data | Typed columns + data JSONB | provider,benefit_type,employee_contribution,employer_contribution,currency | 2 |
| hr_benefits | True | 0 | 13 | data | Typed columns + data JSONB | employee_id,benefit_plan_id,effective_from,effective_to | 1 |
| hr_candidates | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hr_duties | True | 0 | 16 | data | Typed columns + data JSONB | employee_id,assignee_profile_id,duty_date,started_at,completed_at,approved_by,approved_at | 1 |
| hr_employee_documents | True | 0 | 13 | data | Typed columns + data JSONB | employee_id,document_id,title,document_type,file_url,expires_at,created_by | 3 |
| hr_employees | True | 1 | 17 | data | Typed columns + data JSONB | profile_id,department_id,position_id,manager_employee_id,employee_number,employment_start_date,employment_end_date,timezone | 29 |
| hr_expense_claims | True | 0 | 18 | data | Typed columns + data JSONB | employee_id,expense_date,category,currency,merchant,description,finance_expense_id,document_id,decided_by,decided_at,decision_note | 4 |
| hr_goal_updates | True | 0 | 7 | - | Typed/no JSONB | goal_id,employee_id,current_value,note | 3 |
| hr_goals | True | 0 | 15 | data | Typed columns + data JSONB | employee_id,title,description,metric_name,target_value,current_value,unit,due_date,owner_employee_id | 4 |
| hr_holidays | True | 0 | 9 | - | Typed/no JSONB | holiday_date,holiday_type,paid,branch_id | 2 |
| hr_invite_codes | True | 0 | 9 | data | Common generic envelope | - | 1 |
| hr_leave_balances | True | 0 | 10 | - | Typed/no JSONB | employee_id,leave_policy_id,period_year,opening_balance,accrued_days,used_days,adjustment_days | 3 |
| hr_leave_policies | True | 0 | 11 | data | Typed columns + data JSONB | leave_type,annual_entitlement,carry_forward_limit,requires_approval | 2 |
| hr_leave_requests | True | 1 | 17 | data | Typed columns + data JSONB | employee_id,leave_policy_id,start_date,end_date,requested_days,decision_by,decided_at,decision_note | 1 |
| hr_notifications | True | 0 | 11 | - | Typed/no JSONB | profile_id,employee_id,title,body,notification_type,link_module,link_record_id,read_at | 3 |
| hr_offboarding_cases | True | 0 | 10 | data | Typed columns + data JSONB | employee_id,last_working_date,reason,owner_profile_id | 2 |
| hr_onboarding_cases | True | 0 | 10 | data | Typed columns + data JSONB | employee_id,start_date,due_date,owner_profile_id | 3 |
| hr_onboarding_tasks | True | 0 | 12 | data | Typed columns + data JSONB | onboarding_case_id,employee_id,title,owner_profile_id,due_date,completed_at | 3 |
| hr_payroll_items | True | 1 | 15 | data | Typed columns + data JSONB | payroll_run_id,employee_id,gross_pay,taxable_pay,deductions,net_pay,currency,employer_contributions,employer_cost | 4 |
| hr_payroll_runs | True | 1 | 17 | data | Typed columns + data JSONB | period_start,period_end,currency,timezone,approved_by,approved_at,posted_at,finance_reference | 2 |
| hr_payslips | True | 1 | 11 | data | Typed columns + data JSONB | payroll_item_id,employee_id,pay_period,issued_at,document_id | 4 |
| hr_performance_reviews | True | 0 | 16 | data | Typed columns + data JSONB | employee_id,reviewer_employee_id,review_period_start,review_period_end,due_date,submitted_at,completed_at | 1 |
| hr_positions | True | 1 | 10 | - | Typed/no JSONB | department_id,title,code,grade,description | 2 |
| hr_service_requests | True | 0 | 14 | data | Typed columns + data JSONB | employee_id,request_type,subject,description,assigned_to,decided_by,decided_at,decision_note | 2 |
| hr_shift_assignments | True | 0 | 10 | - | Typed/no JSONB | employee_id,shift_id,assignment_date,created_by | 3 |
| hr_shifts | True | 1 | 11 | data | Typed columns + data JSONB | start_time,end_time,unpaid_break_minutes,timezone | 2 |
| hr_statutory_rules | True | 0 | 16 | data | Typed columns + data JSONB | rule_code,effective_from,effective_to,applies_to,calculation_type,rate,fixed_amount,threshold_amount,currency | 1 |
| hr_timesheet_entries | True | 0 | 9 | - | Typed/no JSONB | timesheet_id,work_date,minutes,project_reference,work_note | 2 |
| hr_timesheets | True | 0 | 14 | data | Typed columns + data JSONB | employee_id,period_start,period_end,total_minutes,submitted_at,decided_by,decided_at,decision_note | 3 |
| hr_training | True | 0 | 13 | - | Typed/no JSONB | completion_date,course,due_date,employee_name,hr_employees,is_compliance,is_mandatory,video_url | 1 |
| hr_training_assignments | True | 0 | 11 | data | Typed columns + data JSONB | employee_id,course_id,assigned_by,due_date,completed_at | 3 |
| hr_training_courses | True | 0 | 11 | data | Typed columns + data JSONB | title,provider,duration_minutes,mandatory,content_url | 2 |
| htl_bookings | True | 0 | 9 | data | Common generic envelope | - | 1 |
| htl_rooms | True | 0 | 9 | data | Common generic envelope | - | 1 |
| integration_connections | True | 0 | 9 | data | Common generic envelope | - | 1 |
| inventory_batches | True | 0 | 9 | data | Common generic envelope | - | 1 |
| inventory_items | True | 2 | 9 | data | Common generic envelope | - | 14 |
| inventory_stock_movements | True | 1 | 9 | data | Common generic envelope | - | 1 |
| inventory_suppliers | True | 1 | 9 | data | Common generic envelope | - | 1 |
| inventory_transfers | True | 0 | 9 | data | Common generic envelope | - | 1 |
| inventory_warehouses | True | 1 | 9 | data | Common generic envelope | - | 2 |
| journal_entries | True | 0 | 9 | data | Common generic envelope | - | 2 |
| kb_articles | True | 0 | 9 | data | Common generic envelope | - | 1 |
| loan_repayments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| manufacturing_bom_components | True | 0 | 9 | data | Common generic envelope | - | 1 |
| manufacturing_boms | True | 0 | 9 | data | Common generic envelope | - | 1 |
| manufacturing_machines | True | 0 | 9 | - | Typed/no JSONB | machine_type,purchase_date,warehouse_id | 1 |
| manufacturing_maintenance | True | 0 | 11 | - | Typed/no JSONB | cost,machine_name,maintenance_date,maintenance_type,next_due_date,technician | 1 |
| manufacturing_qc_inspections | True | 0 | 9 | data | Common generic envelope | - | 1 |
| manufacturing_work_orders | True | 0 | 9 | data | Common generic envelope | - | 1 |
| market_provider_incidents | True | 0 | 9 | - | Typed/no JSONB | provider_type,issue_summary,severity,resolution_notes,opened_at,resolved_at | 0 |
| market_provider_settings | True | 0 | 23 | - | Typed/no JSONB | bank_provider_url,bank_provider_api_key,dse_provider_url,dse_provider_api_key,cbk_provider_url,cbk_provider_api_key,bou_provider_url,bou_provider_api_key,bnr_provider_url,bnr_provider_api_key,slack_webhook_url,outage_email_recipients,alert_on_outage,refresh_interval_seconds,schedule_weekly_email,latency_threshold_ms,alert_cooldown_minutes,schedule_cron_task_uid,last_alert_dispatched_at | 0 |
| market_provider_uptime_logs | True | 0 | 8 | - | Typed/no JSONB | provider_type,latency_ms,status_code,error_message,checked_at | 0 |
| marketing_campaigns | True | 1 | 9 | data | Common generic envelope | - | 1 |
| mfi_audit_logs | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_cash_sessions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_cash_transactions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_clients | True | 1 | 9 | data | Common generic envelope | - | 1 |
| mfi_collateral | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_collections | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_credit_scorecards | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_credit_scoring_settings | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_groups | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_guarantors | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_loan_applications | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_loan_products | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_loans | True | 1 | 9 | data | Common generic envelope | - | 1 |
| mfi_notifications | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_par_escalation_settings | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_repayment_schedules | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_repayments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_savings | True | 0 | 9 | data | Common generic envelope | - | 1 |
| mfi_staff_commissions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| money_agent_agents | True | 0 | 19 | metadata | Typed columns + other JSONB | profile_id,branch_id,supervisor_id,agent_code,full_name,phone,national_id,kyc_status,kyb_status,daily_limit,monthly_limit,metadata,created_by | 13 |
| money_agent_alerts | True | 0 | 11 | - | Typed/no JSONB | agent_id,alert_type,severity,title,body,acknowledged_by,acknowledged_at | 3 |
| money_agent_approvals | True | 0 | 9 | - | Typed/no JSONB | transaction_id,requested_by,decided_by,note,requested_at,decided_at | 4 |
| money_agent_audit_events | True | 0 | 10 | before_data,after_data,metadata | Typed columns + other JSONB | actor_profile_id,action,entity_type,entity_id,before_data,after_data,metadata | 2 |
| money_agent_branches | True | 0 | 13 | - | Typed/no JSONB | branch_code,region,district,ward,address,phone,created_by | 6 |
| money_agent_commission_rules | True | 0 | 9 | - | Typed/no JSONB | service_code,commission_type,commission_value,active,created_by | 2 |
| money_agent_customers | True | 0 | 13 | metadata | Typed columns + other JSONB | profile_id,full_name,phone,national_id,kyc_status,address,metadata,created_by | 4 |
| money_agent_daily_summaries | True | 0 | 13 | - | Typed/no JSONB | agent_id,branch_id,business_date,transaction_count,successful_count,failed_count,cash_in_amount,cash_out_amount,fee_amount,commission_amount | 3 |
| money_agent_fee_rules | True | 0 | 11 | - | Typed/no JSONB | service_code,min_amount,max_amount,fee_type,fee_value,active,created_by | 2 |
| money_agent_ledger_entries | True | 0 | 9 | metadata | Typed columns + other JSONB | transaction_id,account_code,entry_type,currency,posted_at,metadata | 2 |
| money_agent_limits | True | 0 | 13 | - | Typed/no JSONB | agent_id,transaction_type,max_single_amount,daily_amount,monthly_amount,velocity_window_minutes,velocity_count,active,created_by | 3 |
| money_agent_notifications | True | 0 | 12 | - | Typed/no JSONB | transaction_id,agent_id,channel,title,body,provider_reference,sent_at,read_at | 3 |
| money_agent_pin_credentials | True | 0 | 10 | - | Typed/no JSONB | agent_id,pin_hash,failed_attempts,locked_until,last_used_at | 2 |
| money_agent_receipts | True | 0 | 8 | metadata | Typed columns + other JSONB | transaction_id,receipt_number,channel,recipient_phone,issued_at,metadata | 2 |
| money_agent_reconciliations | True | 0 | 12 | - | Typed/no JSONB | settlement_id,expected_amount,actual_amount,variance,reviewed_by,reviewed_at | 3 |
| money_agent_risk_events | True | 0 | 13 | metadata | Typed columns + other JSONB | agent_id,transaction_id,risk_type,severity,score,reason,metadata,resolved_by,resolved_at | 4 |
| money_agent_services | True | 0 | 12 | metadata | Typed columns + other JSONB | service_code,service_type,provider_code,requires_provider,active,metadata,created_by | 3 |
| money_agent_settlements | True | 0 | 15 | - | Typed/no JSONB | agent_id,branch_id,business_date,opening_float,closing_float,expected_float,variance,submitted_by,settled_by | 6 |
| money_agent_transactions | True | 0 | 29 | metadata | Typed columns + other JSONB | transaction_ref,idempotency_key,agent_id,branch_id,customer_id,service_id,transaction_type,fee,commission,currency,authorization_method,authorization_reference_hash,provider_code,provider_reference,failure_code,failure_reason,requested_at,authorized_at,processed_at,completed_at,reversed_at,created_by,metadata | 11 |
| money_agent_wallets | True | 0 | 10 | - | Typed/no JSONB | owner_type,owner_id,wallet_type,currency,available_balance | 1 |
| network_profiles | True | 1 | 9 | data | Common generic envelope | - | 1 |
| network_rfqs | True | 1 | 9 | data | Common generic envelope | - | 1 |
| notebook_notes | True | 0 | 9 | data | Common generic envelope | - | 1 |
| notification_channels | True | 0 | 11 | - | Typed/no JSONB | business_number,channel_id,enabled,from_address,from_number,server_key,webhook_url | 1 |
| notification_log | True | 1 | 9 | data | Common generic envelope | - | 1 |
| notification_rules | True | 1 | 6 | - | Typed/no JSONB | alert_type,channels | 1 |
| other_debtors | True | 0 | 9 | data | Common generic envelope | - | 1 |
| other_income | True | 0 | 9 | data | Common generic envelope | - | 1 |
| period_closes | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_audit_logs | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_batches | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_brands | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_categories | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_controlled_medicine_register | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_dispense | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_dispense_items | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_drugs | True | 1 | 9 | data | Common generic envelope | - | 1 |
| phm_insurance_claims | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_notifications | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_payments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_purchase_order_items | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_purchase_orders | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_return_items | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_returns | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_sale_items | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_sales | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_stock | True | 1 | 9 | data | Common generic envelope | - | 1 |
| phm_stock_adjustments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_stock_movements | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_stock_receipts | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_stock_transfers | True | 0 | 9 | data | Common generic envelope | - | 1 |
| phm_suppliers | True | 0 | 9 | data | Common generic envelope | - | 1 |
| platform_admin_actions | True | 0 | 10 | details | Typed columns + other JSONB | actor_user_id,actor_role,action,target_type,target_id,reason,confirmation_text,details | 0 |
| platform_admin_dashboard_settings | True | 1 | 5 | attention_thresholds | Typed columns + other JSONB | settings_key,refresh_seconds,display_timezone,attention_thresholds | 0 |
| pos_cash_movements | True | 0 | 9 | data | Common generic envelope | - | 2 |
| pos_discount_rules | True | 0 | 23 | metadata | Typed columns + other JSONB | discount_code,scope_type,inventory_item_id,discount_type,value,max_discount_amount,minimum_subtotal,stackable,requires_approval,contra_revenue_account_id,effective_from,effective_to,approval_request_id,created_by,updated_by,version,metadata | 7 |
| pos_loyalty_ledger | True | 0 | 18 | metadata | Typed columns + other JSONB | member_id,entry_type,points_delta,points_balance_after,sale_id,redemption_id,idempotency_key,reference,occurred_at,created_by,updated_by,version,metadata | 5 |
| pos_loyalty_members | True | 0 | 16 | metadata | Typed columns + other JSONB | program_id,customer_id,member_number,points_balance,lifetime_earned,lifetime_redeemed,joined_at,created_by,updated_by,version,metadata | 7 |
| pos_loyalty_programs | True | 0 | 19 | metadata | Typed columns + other JSONB | program_code,earn_points_per_100_tzs,redemption_tzs_per_point,minimum_redeem_points,expiry_days,points_liability_account_id,approval_request_id,effective_from,effective_to,created_by,updated_by,version,metadata | 7 |
| pos_loyalty_redemptions | True | 0 | 20 | metadata | Typed columns + other JSONB | member_id,reward_id,sale_id,points_spent,cash_value,approval_request_id,journal_batch_id,idempotency_key,request_hash,applied_at,applied_by,created_by,updated_by,version,metadata | 9 |
| pos_loyalty_rewards | True | 0 | 16 | metadata | Typed columns + other JSONB | program_id,reward_code,points_cost,cash_value,inventory_item_id,approval_request_id,created_by,updated_by,version,metadata | 7 |
| pos_promotion_items | True | 0 | 13 | metadata | Typed columns + other JSONB | promotion_id,inventory_item_id,item_role,required_quantity,reward_price,created_by,updated_by,version,metadata | 5 |
| pos_promotions | True | 0 | 26 | metadata | Typed columns + other JSONB | promotion_code,trigger_type,benefit_type,minimum_spend,minimum_quantity,benefit_value,reward_quantity,points_multiplier_bps,stackable,priority,customer_limit,daily_limit,effective_from,effective_to,approval_request_id,requires_approval,created_by,updated_by,version,metadata | 6 |
| pos_registers | True | 0 | 14 | metadata | Typed columns + other JSONB | register_code,branch_id,warehouse_id,default_currency,created_by,updated_by,version,metadata | 9 |
| pos_return_commits | True | 0 | 7 | - | Typed/no JSONB | return_id,idempotency_key,created_by | 3 |
| pos_return_headers | True | 0 | 26 | metadata | Typed columns + other JSONB | return_number,sale_id,register_id,terminal_id,shift_id,cashier_id,reason,refund_method,currency,refund_total,approval_request_id,journal_batch_id,idempotency_key,request_hash,legacy_pos_return_id,posted_at,posted_by,created_by,updated_by,version,metadata | 13 |
| pos_return_items | True | 0 | 9 | data | Common generic envelope | - | 1 |
| pos_return_lines | True | 0 | 18 | metadata | Typed columns + other JSONB | return_id,sale_line_id,line_no,quantity,unit_price,tax_amount,refund_amount,restock_quantity,condition,created_by,updated_by,version,metadata | 5 |
| pos_returns | True | 0 | 9 | data | Common generic envelope | - | 3 |
| pos_sale_adjustments | True | 0 | 25 | metadata | Typed columns + other JSONB | sale_id,sale_line_id,adjustment_no,adjustment_type,tax_rule_id,discount_rule_id,promotion_id,base_amount,rate_bps,approval_request_id,journal_batch_id,idempotency_key,request_hash,applied_at,applied_by,created_by,updated_by,version,metadata | 11 |
| pos_sale_headers | True | 0 | 34 | metadata | Typed columns + other JSONB | sale_number,register_id,terminal_id,shift_id,cashier_id,customer_id,customer_name,business_date,source_channel,payment_status,currency,subtotal,discount_total,tax_total,total,paid_total,change_total,refunded_total,journal_batch_id,idempotency_key,request_hash,receipt_issued_at,completed_at,voided_at,legacy_pos_transaction_id,created_by,updated_by,version,metadata | 17 |
| pos_sale_lines | True | 0 | 23 | metadata | Typed columns + other JSONB | sale_id,line_no,inventory_item_id,item_sku,item_name,quantity,unit_price,discount_amount,tax_amount,line_subtotal,line_total,cost_total,returned_quantity,legacy_pos_transaction_item_id,created_by,updated_by,version,metadata | 9 |
| pos_sale_tax_lines | True | 0 | 16 | metadata | Typed columns + other JSONB | sale_id,sale_line_id,tax_rule_id,taxable_amount,rate_bps,tax_amount,included_in_price,created_by,updated_by,version,metadata | 6 |
| pos_sale_tenders | True | 0 | 21 | metadata | Typed columns + other JSONB | sale_id,tender_no,method,currency,tendered_amount,applied_amount,change_amount,reference,provider_code,provider_reference,provider_status,journal_batch_id,created_by,updated_by,version,metadata | 5 |
| pos_shift_cash_movements | True | 0 | 23 | metadata | Typed columns + other JSONB | shift_id,movement_type,reason,reference,approval_request_id,journal_batch_id,occurred_at,legacy_pos_cash_movement_id,created_by,updated_by,version,metadata,idempotency_key,request_hash,posted_at,posted_by,reversal_of_movement_id | 9 |
| pos_shift_sessions | True | 0 | 27 | metadata | Typed columns + other JSONB | shift_number,register_id,terminal_id,cashier_id,business_date,opened_at,opening_float,expected_cash,counted_cash,variance,closed_at,closed_by,close_reason,open_idempotency_key,close_idempotency_key,legacy_pos_shift_id,created_by,updated_by,version,metadata,open_request_hash,close_request_hash | 11 |
| pos_shifts | True | 1 | 9 | data | Common generic envelope | - | 2 |
| pos_sync_devices | True | 0 | 14 | metadata | Typed columns + other JSONB | device_key,terminal_id,last_sequence,last_seen_at,created_by,updated_by,version,metadata,last_accepted_hash | 4 |
| pos_sync_events | True | 0 | 9 | - | Typed/no JSONB | idempotency_key,transaction_id,message,created_by | 3 |
| pos_tax_rules | True | 0 | 21 | metadata | Typed columns + other JSONB | tax_code,tax_type,scope_type,inventory_item_id,rate_bps,calculation_method,tax_account_id,effective_from,effective_to,approval_request_id,requires_approval,created_by,updated_by,version,metadata | 8 |
| pos_terminals | True | 0 | 14 | metadata | Typed columns + other JSONB | register_id,device_key,device_label,app_version,last_seen_at,created_by,updated_by,version,metadata | 8 |
| pos_transaction_commits | True | 0 | 7 | - | Typed/no JSONB | transaction_id,idempotency_key,created_by | 3 |
| pos_transaction_items | True | 1 | 9 | data | Common generic envelope | - | 2 |
| pos_transactions | True | 1 | 9 | data | Common generic envelope | - | 5 |
| procurement_contracts | True | 0 | 11 | - | Typed/no JSONB | contract_type,doc_number,end_date,start_date,supplier,value | 1 |
| procurement_purchase_orders | True | 2 | 9 | data | Common generic envelope | - | 1 |
| profiles | True | 0 | 29 | notification_preferences | Typed columns + other JSONB | full_name,email,role,phone,avatar_url,is_active,customer_ref,onboarding_tour_completed_at,onboarding_tour_role_track,preferred_name,first_name,middle_name,last_name,date_of_birth,gender,address,country,preferred_language,currency_display,profile_timezone,date_format,theme_preference,notification_preferences,avatar_storage_key,profile_completed_at | 153 |
| project_expenses | True | 0 | 8 | - | Typed/no JSONB | description,expense_date,project_ref | 1 |
| project_milestones | True | 0 | 9 | data | Common generic envelope | - | 1 |
| project_tasks | True | 0 | 9 | data | Common generic envelope | - | 1 |
| projects | True | 0 | 11 | - | Typed/no JSONB | budget,client,end_date,manager,start_date | 1 |
| property_agents | True | 0 | 15 | metadata | Typed columns + other JSONB | profile_id,agent_code,full_name,phone,email,licence_number,commission_rate,branch_label,metadata,created_by | 4 |
| property_applications | True | 0 | 17 | metadata | Typed columns + other JSONB | application_number,unit_id,tenant_id,agent_id,requested_start_date,proposed_rent,decision_note,decided_by,decided_at,idempotency_key,metadata,created_by | 5 |
| property_approvals | True | 0 | 11 | - | Typed/no JSONB | entity_type,entity_id,action,requested_by,decided_by,note,requested_at,decided_at | 1 |
| property_audit_log | True | 0 | 8 | details | Typed columns + other JSONB | actor_id,action,entity_type,entity_id,details | 1 |
| property_budgets | True | 0 | 11 | - | Typed/no JSONB | portfolio_id,fiscal_year,category,budget_amount,approved_by,approved_at,created_by | 2 |
| property_buildings | True | 0 | 21 | metadata | Typed columns + other JSONB | portfolio_id,property_code,property_type,address,country,region,district,ward,village,latitude,longitude,year_built,floors,metadata,created_by | 5 |
| property_contractors | True | 0 | 12 | - | Typed/no JSONB | contractor_code,phone,email,trade,tax_number,created_by | 2 |
| property_documents | True | 0 | 14 | metadata | Typed columns + other JSONB | entity_type,entity_id,document_type,title,storage_key,file_url,document_date,expires_at,verification_status,uploaded_by,metadata | 1 |
| property_expenses | True | 0 | 18 | - | Typed/no JSONB | expense_number,property_id,unit_id,work_order_id,category,description,expense_date,payment_method,payment_reference,approved_by,approved_at,created_by | 4 |
| property_handover_records | True | 0 | 12 | meter_snapshot | Typed columns + other JSONB | lease_id,handover_type,handover_date,keys_count,meter_snapshot,signed_by_tenant,signed_by_manager,created_by | 2 |
| property_inspection_items | True | 0 | 8 | - | Typed/no JSONB | inspection_id,area_name,condition,estimated_cost | 2 |
| property_inspections | True | 0 | 10 | metadata | Typed columns + other JSONB | lease_id,inspection_type,inspection_date,condition_summary,inspector_id,metadata | 3 |
| property_insurances | True | 0 | 14 | - | Typed/no JSONB | property_id,unit_id,insurer,policy_number,cover_type,premium,start_date,end_date,created_by | 3 |
| property_integration_events | True | 0 | 11 | payload | Typed columns + other JSONB | target_module,entity_type,entity_id,event_type,payload,created_by,processed_at | 1 |
| property_invoice_lines | True | 0 | 10 | - | Typed/no JSONB | invoice_id,line_type,description,quantity,unit_amount,line_total,account_code | 2 |
| property_invoices | True | 0 | 23 | - | Typed/no JSONB | invoice_number,lease_id,tenant_id,unit_id,invoice_type,period_start,period_end,issue_date,due_date,subtotal,tax_amount,late_fee_amount,total_amount,amount_paid,currency,idempotency_key,created_by | 7 |
| property_leases | True | 0 | 22 | terms | Typed columns + other JSONB | lease_number,unit_id,tenant_id,owner_id,application_id,start_date,end_date,rent_amount,service_charge_amount,deposit_amount,rent_frequency,notice_days,terms,created_by,approved_by,approved_at,terminated_at | 11 |
| property_ledger_entries | True | 0 | 10 | metadata | Typed columns + other JSONB | source_type,source_id,account_code,entry_type,currency,metadata | 1 |
| property_listings | True | 0 | 16 | metadata | Typed columns + other JSONB | unit_id,agent_id,listing_type,asking_amount,commission_rate,available_from,published_at,expires_at,description,metadata,created_by | 3 |
| property_maintenance_requests | True | 0 | 16 | - | Typed/no JSONB | request_number,unit_id,lease_id,tenant_id,category,priority,title,description,requested_at,completed_at,created_by | 5 |
| property_meter_readings | True | 0 | 11 | - | Typed/no JSONB | meter_id,reading_date,reading_value,previous_value,consumption,captured_by,source | 2 |
| property_notices | True | 0 | 12 | - | Typed/no JSONB | lease_id,tenant_id,notice_type,title,body,notice_date,effective_date,created_by | 4 |
| property_notifications | True | 0 | 14 | - | Typed/no JSONB | recipient_profile_id,tenant_id,notice_id,notification_type,title,body,channel,scheduled_for,sent_at,dedupe_key | 4 |
| property_owners | True | 0 | 16 | metadata | Typed columns + other JSONB | profile_id,owner_type,legal_name,phone,email,national_id,tin,kyc_status,metadata,created_by | 5 |
| property_payments | True | 0 | 15 | metadata | Typed columns + other JSONB | payment_number,invoice_id,tenant_id,payment_method,provider_code,provider_reference,idempotency_key,paid_at,posted_by,metadata | 5 |
| property_plots | True | 0 | 19 | metadata | Typed columns + other JSONB | portfolio_id,plot_code,title_number,land_use,area_sqm,address,region,district,ward,latitude,longitude,owner_id,metadata,created_by | 4 |
| property_portfolios | True | 0 | 11 | - | Typed/no JSONB | portfolio_code,description,currency,timezone,created_by | 4 |
| property_receipts | True | 0 | 8 | metadata | Typed columns + other JSONB | payment_id,receipt_number,channel,recipient_phone,issued_at,metadata | 2 |
| property_reconciliations | True | 0 | 13 | - | Typed/no JSONB | payment_id,invoice_id,expected_amount,actual_amount,variance,reviewed_by,reviewed_at,created_by | 3 |
| property_rent_schedules | True | 0 | 9 | - | Typed/no JSONB | lease_id,next_invoice_date,frequency,active,last_invoice_id | 2 |
| property_service_charges | True | 0 | 10 | - | Typed/no JSONB | unit_id,frequency,created_by | 2 |
| property_tax_fee_rules | True | 0 | 11 | - | Typed/no JSONB | code,applies_to,rate,flat_amount,created_by | 1 |
| property_tenant_documents | True | 0 | 12 | metadata | Typed columns + other JSONB | tenant_id,document_type,document_number,storage_key,file_url,verification_status,expires_at,metadata,uploaded_by | 2 |
| property_tenants | True | 0 | 17 | metadata | Typed columns + other JSONB | profile_id,tenant_code,full_name,phone,email,national_id,tin,kyc_status,address,emergency_contact,metadata,created_by | 10 |
| property_units | True | 0 | 22 | metadata | Typed columns + other JSONB | building_id,plot_id,owner_id,unit_code,unit_type,floor_label,bedrooms,bathrooms,area_sqm,rent_amount,service_charge_amount,deposit_amount,currency,furnishing,metadata,created_by | 13 |
| property_utility_meters | True | 0 | 8 | - | Typed/no JSONB | unit_id,utility_type,meter_number,unit_of_measure,rate | 3 |
| property_work_orders | True | 0 | 14 | - | Typed/no JSONB | work_order_number,request_id,contractor_id,assigned_profile_id,estimated_cost,actual_cost,due_date,completion_note,created_by | 5 |
| purchase_order_items | True | 2 | 9 | data | Common generic envelope | - | 1 |
| resource_bookings | True | 0 | 9 | data | Common generic envelope | - | 1 |
| restaurant_alerts | True | 0 | 11 | - | Typed/no JSONB | outlet_id,alert_key,alert_type,severity,title,body,due_at | 2 |
| restaurant_audit_events | True | 0 | 9 | detail | Typed columns + other JSONB | outlet_id,actor_id,action,subject_type,subject_id,detail | 2 |
| restaurant_bill_splits | True | 0 | 7 | - | Typed/no JSONB | parent_order_id,split_order_id,split_number | 3 |
| restaurant_combo_items | True | 0 | 5 | - | Typed/no JSONB | parent_menu_item_id,child_menu_item_id,quantity | 3 |
| restaurant_customers | True | 0 | 9 | data | Typed columns + data JSONB | guest_id,phone,email,loyalty_points | 4 |
| restaurant_dining_areas | True | 0 | 7 | layout | Typed columns + other JSONB | outlet_id,area_type,layout | 3 |
| restaurant_fiscal_profiles | True | 0 | 21 | data | Typed columns + data JSONB | outlet_id,tax_profile_id,tin,vrn,business_name,trading_name,physical_address,region,district,device_serial,provider_code,environment,receipt_prefix,fiscalized_at,created_by | 4 |
| restaurant_fiscal_receipts | True | 0 | 23 | provider_response | Typed columns + other JSONB | outlet_id,fiscal_profile_id,order_id,internal_reference,official_receipt_number,fiscal_serial,verification_code,qr_payload,gross_amount,vat_amount,net_amount,currency,idempotency_key,provider_response,failure_reason,queued_at,submitted_at,verified_at | 4 |
| restaurant_kitchen_tickets | True | 0 | 9 | - | Typed/no JSONB | outlet_id,order_id,ticket_number,station,opened_at,completed_at | 3 |
| restaurant_menu_categories | True | 0 | 6 | - | Typed/no JSONB | outlet_id,sort_order | 3 |
| restaurant_menu_items | True | 1 | 15 | data | Typed columns + data JSONB | outlet_id,category_id,inventory_item_id,sku,description,price,cost_price,preparation_minutes,station,tax_rate | 8 |
| restaurant_mobile_money_intents | True | 0 | 17 | provider_payload | Typed columns + other JSONB | outlet_id,order_id,profile_id,provider_reference,phone_last_four,currency,provider_payload,failure_reason,expires_at,paid_at,created_by | 4 |
| restaurant_mobile_money_profiles | True | 0 | 13 | data | Typed columns + data JSONB | outlet_id,provider,merchant_label,merchant_account_reference,collection_mode,webhook_configured,created_by | 3 |
| restaurant_modifier_groups | True | 0 | 7 | - | Typed/no JSONB | outlet_id,min_select,max_select | 3 |
| restaurant_modifier_options | True | 0 | 7 | - | Typed/no JSONB | group_id,inventory_item_id,price_delta | 3 |
| restaurant_order_lines | True | 0 | 13 | modifiers | Typed columns + other JSONB | order_id,menu_item_id,quantity,unit_price,discount_amount,modifiers,stock_consumed | 3 |
| restaurant_orders | True | 1 | 21 | data | Typed columns + data JSONB | outlet_id,table_id,reservation_id,customer_id,hotel_folio_id,waiter_employee_id,order_number,order_type,subtotal,discount_amount,tax_amount,service_charge_amount,tip_amount,total_amount,currency,opened_at,closed_at | 16 |
| restaurant_outlets | True | 1 | 14 | data | Typed columns + data JSONB | property_id,branch_id,code,timezone,currency,tax_rate,service_charge_rate | 23 |
| restaurant_payments | True | 0 | 10 | data | Typed columns + data JSONB | order_id,method,reference,received_by,received_at | 3 |
| restaurant_promotions | True | 0 | 10 | - | Typed/no JSONB | outlet_id,code,discount_type,discount_value,starts_at,ends_at | 2 |
| restaurant_purchase_lines | True | 0 | 7 | - | Typed/no JSONB | request_id,inventory_item_id,quantity,unit_cost,received_quantity | 3 |
| restaurant_purchase_requests | True | 0 | 10 | data | Typed columns + data JSONB | outlet_id,supplier_id,request_number,total_amount,currency | 4 |
| restaurant_recipe_ingredients | True | 0 | 7 | - | Typed/no JSONB | menu_item_id,inventory_item_id,quantity,unit,waste_pct | 3 |
| restaurant_refunds | True | 0 | 10 | - | Typed/no JSONB | order_id,payment_id,reason,idempotency_key,created_by | 3 |
| restaurant_reservations | True | 0 | 12 | - | Typed/no JSONB | outlet_id,table_id,customer_id,reference,reservation_at,duration_minutes,covers | 5 |
| restaurant_shifts | True | 0 | 12 | data | Typed columns + data JSONB | outlet_id,employee_id,role,starts_at,ends_at,opening_cash,closing_cash | 3 |
| restaurant_staff_roles | True | 0 | 6 | - | Typed/no JSONB | outlet_id,employee_id,role | 3 |
| restaurant_suppliers | True | 0 | 8 | data | Typed columns + data JSONB | phone,email,address | 2 |
| restaurant_tables | True | 1 | 11 | position,data | Typed columns + other JSONB | outlet_id,area_id,code,capacity,position,current_order_id | 6 |
| restaurant_tax_profiles | True | 0 | 13 | - | Typed/no JSONB | outlet_id,code,tax_type,rate_percent,is_inclusive,is_default,is_active,legal_basis | 3 |
| restaurant_wastage | True | 0 | 9 | - | Typed/no JSONB | outlet_id,inventory_item_id,quantity,reason,cost,created_by | 3 |
| rst_menu | True | 0 | 9 | data | Common generic envelope | - | 1 |
| rst_orders | True | 0 | 9 | data | Common generic envelope | - | 1 |
| rst_reservations | True | 0 | 9 | data | Common generic envelope | - | 1 |
| rst_tables | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sales_invoice_items | True | 1 | 15 | data | Typed columns + data JSONB | invoice_id,item_name,item_sku,qty,rate,sort_order | 2 |
| sales_invoices | True | 1 | 15 | data | Typed columns + data JSONB | doc_number,customer,issue_date,due_date,order_id,amount_paid | 4 |
| sales_order_items | True | 1 | 15 | data | Typed columns + data JSONB | order_id,item_name,item_sku,qty,rate,sort_order | 2 |
| sales_order_return_items | True | 0 | 14 | data | Typed columns + data JSONB | return_id,item_name,item_sku,qty,rate | 2 |
| sales_order_returns | True | 0 | 11 | data | Typed columns + data JSONB | order_id,reason | 3 |
| sales_orders | True | 1 | 14 | - | Typed/no JSONB | customer,doc_number,order_date,owner_id,quotation_id,sales_order_items,sales_order_returns,quotation_reference,owner_name | 4 |
| sales_payments | True | 1 | 13 | data | Typed columns + data JSONB | invoice_id,method,payment_date,reference | 2 |
| sales_quotation_items | True | 1 | 15 | data | Typed columns + data JSONB | quotation_id,item_name,item_sku,qty,rate,sort_order | 2 |
| sales_quotations | True | 1 | 14 | data | Typed columns + data JSONB | doc_number,customer,issue_date,valid_until,owner_id | 2 |
| sales_subscriptions | True | 1 | 15 | data | Typed columns + data JSONB | doc_number,customer,plan,cycle,start_date,next_billing_date | 1 |
| sch_academic_years | True | 1 | 9 | data | Common generic envelope | - | 1 |
| sch_admissions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_announcements | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_approval_requests | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_assessment_scores | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_assessments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_assignment_submissions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_assignments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_attendance_records | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_attendance_sessions | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_audit_logs | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_books | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_classes | True | 1 | 9 | data | Common generic envelope | - | 1 |
| sch_departments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_disciplinary_records | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_documents | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_enrollments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_exams | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_fee_invoice_lines | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_fee_invoices | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_fee_structures | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_fees | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_grading_scales | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_guardians | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_hostel_allocations | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_hostels | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_inventory_items | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_inventory_movements | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_library_loans | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_messages | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_notifications | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_payments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_portal_links | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_report_cards | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_scholarships | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_streams | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_student_guardians | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_students | True | 1 | 9 | data | Common generic envelope | - | 1 |
| sch_subjects | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_teacher_assignments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_teachers | True | 1 | 9 | data | Common generic envelope | - | 1 |
| sch_terms | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_timetables | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_transport | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sch_transport_assignments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| scheduled_reports | True | 0 | 10 | - | Typed/no JSONB | format,frequency,last_run,recipient_email,report_type | 1 |
| schema_drift_monitors | True | 0 | 10 | - | Typed/no JSONB | monitor_key,cron_expression,schedule_cron_task_uid,is_active,last_checked_at,last_status,last_summary | 1 |
| schema_drift_runs | True | 0 | 10 | missing_tables,tenant_table_issues | Typed columns + other JSONB | monitor_id,referenced_table_count,deployed_table_count,missing_tables,tenant_table_issues,notification_delivered,error,checked_at | 1 |
| scm_shipments | True | 0 | 9 | data | Common generic envelope | - | 1 |
| scm_vehicles | True | 0 | 9 | data | Common generic envelope | - | 1 |
| signatures | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sms_group_members | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sms_groups | True | 0 | 9 | data | Common generic envelope | - | 1 |
| sms_templates | True | 0 | 9 | data | Common generic envelope | - | 1 |
| stock_audit_items | True | 0 | 9 | data | Common generic envelope | - | 1 |
| stock_audits | True | 0 | 9 | data | Common generic envelope | - | 1 |
| subscription_events | True | 3 | 11 | details | Typed columns + other JSONB | subscription_id,payment_id,event_type,previous_status,new_status,actor_profile_id,actor_type,details | 3 |
| subscription_invoices | True | 0 | 17 | document_data | Typed columns + other JSONB | subscription_id,payment_id,invoice_number,currency,subtotal,tax_amount,total_amount,paid_amount,issued_at,due_at,paid_at,document_data | 3 |
| subscription_notifications | True | 3 | 13 | metadata | Typed columns + other JSONB | subscription_id,notification_key,notification_type,title,message,scheduled_for,delivered_at,read_at,metadata | 2 |
| subscription_payments | True | 0 | 23 | provider_response | Typed columns + other JSONB | subscription_id,plan_id,provider,internal_reference,idempotency_key,provider_order_id,fee,net_amount,currency,phone,description,billing_cycle,initiated_by,provider_response,verified_at,paid_at,failure_reason | 6 |
| subscription_trial_expiry_notices | True | 0 | 13 | - | Typed/no JSONB | subscription_id,user_id,notice_shown,shown_at,acknowledged_at,claim_token,claim_expires_at,claim_count,reset_count | 3 |
| subscription_usage | True | 0 | 10 | metadata | Typed columns + other JSONB | usage_key,period_start,period_end,usage_value,limit_value,source,metadata,recorded_at | 1 |
| support_agents | True | 0 | 9 | - | Typed/no JSONB | profile_id,team_id,availability,workload_limit,is_active | 3 |
| support_call_log | True | 0 | 9 | data | Common generic envelope | - | 1 |
| support_chat_conversations | True | 0 | 9 | data | Common generic envelope | - | 1 |
| support_chat_messages | True | 0 | 9 | data | Common generic envelope | - | 1 |
| support_message_templates | True | 0 | 14 | variables | Typed columns + other JSONB | provider,channel,language,category,body,variables,approval_status,is_active,created_by | 2 |
| support_sla_policies | True | 0 | 10 | - | Typed/no JSONB | priority,first_response_minutes,resolution_minutes,warning_minutes,is_active | 1 |
| support_team_members | True | 0 | 6 | - | Typed/no JSONB | team_id,profile_id,role | 3 |
| support_teams | True | 0 | 8 | - | Typed/no JSONB | department_name,is_active,created_by | 5 |
| support_ticket_activity | True | 0 | 7 | details | Typed columns + other JSONB | ticket_id,actor_profile_id,event_type,details | 3 |
| support_ticket_messages | True | 1 | 18 | data | Typed columns + data JSONB | ticket_id,body,sender_kind,sender_profile_id,channel,is_internal,delivery_status,provider_message_id,sent_at | 3 |
| support_ticket_notes | True | 0 | 7 | - | Typed/no JSONB | ticket_id,author_profile_id,body,kind | 3 |
| support_tickets | True | 1 | 20 | - | Typed/no JSONB | assignee,category,created_date,customer,doc_number,priority,subject,support_ticket_messages,assigned_profile_id,team_id,source_channel,customer_reference,due_at,resolved_at,closed_at | 6 |
| team_invitations | True | 0 | 18 | - | Typed/no JSONB | invitation_id,email,full_name,role,token_hash,invited_by_profile_id,invited_by_role,expires_at,accepted_by_profile_id,delivery_message_id,delivery_error,email_sent_at,revoked_at | 3 |
| tenant_subscriptions | True | 3 | 24 | metadata | Typed columns + other JSONB | plan_id,billing_cycle,currency,started_at,renewed_at,expires_at,grace_expires_at,cancelled_at,cancellation_reason,source_payment_id,metadata,offer_code,paid_months,bonus_months,total_months,duration_days,trial_started_at,trial_ends_at | 8 |
| tra_gateway_alert_events | True | 0 | 9 | - | Typed/no JSONB | branch_id,provider_status,latency_ms,threshold_ms,delivery_status,message | 0 |
| tra_gateway_alert_settings | True | 0 | 10 | - | Typed/no JSONB | enabled,timeout_threshold_ms,cooldown_minutes,last_alert_at,last_delivery_status,last_message | 0 |
| tra_vat_anomaly_events | True | 0 | 12 | - | Typed/no JSONB | branch_id,period,current_vat,historical_average_vat,variance_percent,threshold_percent,delivery_status,message | 0 |
| tra_vat_anomaly_settings | True | 0 | 13 | - | Typed/no JSONB | enabled,threshold_percent,cooldown_minutes,cron_expression,schedule_cron_task_uid,last_evaluated_at,last_alert_at,last_delivery_status,last_message | 0 |
| tra_z_report_archive_schedules | True | 0 | 13 | - | Typed/no JSONB | owner_user_id,owner_open_id,branch_id,cron_expression,schedule_cron_task_uid,is_active,last_run_at,last_run_status,last_archive_id | 0 |
| tra_z_report_archives | True | 0 | 14 | summary | Typed columns + other JSONB | branch_id,business_date,z_report_id,z_number,storage_key,storage_url,content_type,archive_bytes,summary,error | 0 |
| user_table_preferences | True | 0 | 5 | value | Typed columns + other JSONB | user_id,preference_key,value | 2 |
| users | True | 0 | 9 | - | Typed/no JSONB | open_id,email,login_method,role,last_signed_in | 0 |
| vicoba_loans | True | 0 | 9 | data | Common generic envelope | - | 1 |
| vicoba_meetings | True | 0 | 9 | data | Common generic envelope | - | 1 |
| vicoba_members | True | 0 | 9 | data | Common generic envelope | - | 1 |
| webhook_deliveries | True | 0 | 13 | - | Typed/no JSONB | delivery_id,action,module,severity,attempts,response_code,error,event_summary | 0 |
| website_feedback_submissions | True | 0 | 18 | - | Typed/no JSONB | category,message,email,page_path,source,admin_notes,reviewed_at,reviewed_by,admin_reply,replied_at,replied_by,email_notification_status,email_notification_id,email_notification_sent_at | 0 |
| whatsapp_account_links | True | 0 | 9 | - | Typed/no JSONB | profile_id,phone_e164,code_hash,expires_at,used_at,created_by | 3 |
| whatsapp_accounts | True | 0 | 10 | allowed_capabilities | Typed columns + other JSONB | provider,phone_number_id,display_phone_number,enabled,allowed_capabilities,created_by | 2 |
| whatsapp_contacts | True | 0 | 10 | - | Typed/no JSONB | profile_id,phone_e164,display_name,preferred_language,linked_at,last_seen_at | 3 |
| whatsapp_conversations | True | 0 | 8 | - | Typed/no JSONB | contact_id,last_message_at,context_expires_at | 2 |
| whatsapp_message_events | True | 0 | 10 | - | Typed/no JSONB | provider_message_id,phone_e164,event_type,payload_hash,error_category,received_at,processed_at | 1 |
| whatsapp_messages | True | 0 | 21 | data | Typed columns + data JSONB | provider_message_id,direction,phone_e164,body,message_type,provider_timestamp,conversation_id,contact_id,request_id,error_category,tool_name,ai_model | 1 |
| workflow_marketplace_templates | True | 0 | 12 | - | Typed/no JSONB | category,description,install_count,is_official,published_by_company_name,steps,trigger_type | 1 |
| workflows | True | 1 | 10 | - | Typed/no JSONB | condition,enabled,last_run,steps,trigger_type | 1 |
| workforce_approval_limits | True | 0 | 19 | metadata | Typed columns + other JSONB | target_profile_id,target_role_id,permission_id,currency,single_transaction_limit,daily_limit,requires_checker,effective_from,effective_to,approval_request_id,assigned_by,assigned_at,revoked_by,revoked_at,version,metadata | 7 |
| workforce_data_scopes | True | 0 | 17 | metadata | Typed columns + other JSONB | target_profile_id,target_role_id,scope_type,scope_id,effect,effective_from,effective_to,approval_request_id,assigned_by,assigned_at,revoked_by,revoked_at,version,metadata | 6 |
| workforce_member_roles | True | 0 | 15 | metadata | Typed columns + other JSONB | profile_id,employee_id,role_id,effective_from,effective_to,approval_request_id,assigned_by,assigned_at,revoked_by,revoked_at,version,metadata | 7 |
| workforce_module_access | True | 0 | 17 | metadata | Typed columns + other JSONB | target_profile_id,target_role_id,module_id,permission_action,effect,effective_from,effective_to,approval_request_id,assigned_by,assigned_at,revoked_by,revoked_at,version,metadata | 6 |
| workforce_permission_conflicts | True | 0 | 15 | metadata | Typed columns + other JSONB | conflict_code,permission_a_id,permission_b_id,severity,resolution_policy,description,created_by,updated_by,version,metadata | 5 |
| workforce_permissions | True | 0 | 15 | metadata | Typed columns + other JSONB | code,module_id,resource,permission_action,description,is_sensitive,created_by,updated_by,version,metadata | 7 |
| workforce_role_permissions | True | 0 | 15 | metadata | Typed columns + other JSONB | role_id,permission_id,effect,effective_from,effective_to,approval_request_id,granted_by,granted_at,revoked_by,revoked_at,version,metadata | 6 |
| workforce_roles | True | 0 | 15 | metadata | Typed columns + other JSONB | code,role_kind,description,hierarchy_level,is_assignable,created_by,updated_by,version,metadata | 8 |
| workspaces | True | 7 | 9 | - | Typed/no JSONB | channel_ref,department,description,members | 1 |

## Family roll-up

| Family | Prefix | Tables | Reported rows | Tables with JSONB |
|---|---|---:|---:|---:|
| TRA support tables | `tra_` | 6 | 0 | 1 |
| Microfinance tables | `mfi_` | 19 | 2 | 19 |
| Community/VICOBA tables | `community_group_` | 28 | 0 | 2 |
| Restaurant/Tanzania tables | `restaurant_` | 31 | 4 | 16 |
| Banking tables | `bank_` | 46 | 8 | 28 |
| Sales tables | `sales_` | 10 | 8 | 9 |
| Inventory tables | `inventory_` | 6 | 5 | 6 |
| Finance tables | `finance_` | 2 | 1 | 0 |
| HR tables | `hr_` | 38 | 8 | 27 |
| POS tables | `pos_` | 30 | 3 | 27 |
| CRM tables | `crm_` | 3 | 2 | 3 |

## Sources and reproducibility

The report was generated from the saved live Supabase `list_tables` response at `/home/ubuntu/.mcp/tool-results/2026-08-26_18-12-51.095992073_supabase_list_tables_75d016d0.json`, the focused TRA/VICOBA/Microfinance schema audit, and the repository source files `server/traFiscal.ts`, `server/traFiscalRouter.ts`, `server/traVatAnomaly.ts`, `server/microfinanceOperations.ts`, and `supabase/migrations/20260823_035_restaurant_tanzania_fiscal_configuration.sql`. The inventory values can change as production data and schema evolve; rerun the same bounded inventory process before making future migrations.

## References

1. Live Supabase public-table inventory snapshot: `/home/ubuntu/.mcp/tool-results/2026-08-26_18-12-51.095992073_supabase_list_tables_75d016d0.json`.
2. TRA/VICOBA/Microfinance bounded schema audit: `/home/ubuntu/.mcp/tool-results/2026-08-26_20-36-59.513651955_supabase_execute_sql_2d94fc5f.json`.
3. Supabase-native Tanzania fiscal schema: `supabase/migrations/20260823_035_restaurant_tanzania_fiscal_configuration.sql`.
4. TRA legacy router contract: `server/traFiscal.ts` and `server/traFiscalRouter.ts`.
5. Microfinance persistence contract: `server/microfinanceOperations.ts`.
