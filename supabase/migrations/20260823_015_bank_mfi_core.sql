-- Smart Manager Bank & MFI core
-- Additive only. No existing tables or records are dropped or rewritten.
-- Source of truth for Bank & MFI financial workflows.

BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ---------------------------------------------------------------------------
-- Tenant, institution, branch, product, and customer master data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  legal_name text NOT NULL,
  trading_name text,
  institution_type text NOT NULL DEFAULT 'MFI',
  licence_number text,
  licence_status text NOT NULL DEFAULT 'CONFIGURATION_REQUIRED',
  country_code text NOT NULL DEFAULT 'TZ',
  currency text NOT NULL DEFAULT 'TZS',
  currency_exponent integer NOT NULL DEFAULT 2 CHECK (currency_exponent BETWEEN 0 AND 4),
  timezone text NOT NULL DEFAULT 'Africa/Dar_es_Salaam',
  fiscal_year_start_month integer NOT NULL DEFAULT 1 CHECK (fiscal_year_start_month BETWEEN 1 AND 12),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id)
);

CREATE TABLE IF NOT EXISTS public.bank_branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  institution_id uuid NOT NULL REFERENCES public.bank_institutions(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  region text,
  district text,
  address text,
  phone text,
  status text NOT NULL DEFAULT 'ACTIVE',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, code),
  UNIQUE(company_id, name)
);

CREATE TABLE IF NOT EXISTS public.bank_account_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  product_kind text NOT NULL DEFAULT 'SAVINGS',
  currency text NOT NULL DEFAULT 'TZS',
  minimum_opening_balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (minimum_opening_balance >= 0),
  minimum_operating_balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (minimum_operating_balance >= 0),
  annual_interest_rate numeric(12,6) NOT NULL DEFAULT 0 CHECK (annual_interest_rate >= 0),
  withdrawal_fee numeric(20,2) NOT NULL DEFAULT 0 CHECK (withdrawal_fee >= 0),
  status text NOT NULL DEFAULT 'ACTIVE',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS public.bank_loan_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  code text NOT NULL,
  name text NOT NULL,
  product_kind text NOT NULL DEFAULT 'TERM_LOAN',
  currency text NOT NULL DEFAULT 'TZS',
  minimum_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (minimum_amount >= 0),
  maximum_amount numeric(20,2) NOT NULL CHECK (maximum_amount > 0),
  minimum_term_months integer NOT NULL DEFAULT 1 CHECK (minimum_term_months > 0),
  maximum_term_months integer NOT NULL CHECK (maximum_term_months >= minimum_term_months),
  annual_interest_rate numeric(12,6) NOT NULL CHECK (annual_interest_rate >= 0),
  interest_method text NOT NULL DEFAULT 'REDUCING_BALANCE',
  processing_fee_rate numeric(12,6) NOT NULL DEFAULT 0 CHECK (processing_fee_rate >= 0),
  late_penalty_rate numeric(12,6) NOT NULL DEFAULT 0 CHECK (late_penalty_rate >= 0),
  collateral_required boolean NOT NULL DEFAULT false,
  guarantors_required integer NOT NULL DEFAULT 0 CHECK (guarantors_required >= 0),
  approval_threshold numeric(20,2) NOT NULL DEFAULT 0 CHECK (approval_threshold >= 0),
  status text NOT NULL DEFAULT 'ACTIVE',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, code)
);

CREATE TABLE IF NOT EXISTS public.bank_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_number text NOT NULL,
  customer_kind text NOT NULL DEFAULT 'INDIVIDUAL',
  full_name text NOT NULL,
  phone text,
  email text,
  date_of_birth date,
  gender text,
  occupation text,
  address text,
  national_id text,
  tin text,
  risk_rating text NOT NULL DEFAULT 'STANDARD',
  pep_status text NOT NULL DEFAULT 'NOT_REPORTED',
  source_of_funds text,
  relationship_purpose text,
  kyc_status text NOT NULL DEFAULT 'UNVERIFIED',
  kyc_verified_at timestamptz,
  kyc_verified_by uuid,
  kyc_expires_at date,
  status text NOT NULL DEFAULT 'ACTIVE',
  branch_id uuid REFERENCES public.bank_branches(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, customer_number),
  UNIQUE(company_id, national_id)
);

CREATE TABLE IF NOT EXISTS public.bank_customer_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE CASCADE,
  document_type text NOT NULL,
  document_number text,
  file_url text,
  issued_at date,
  expires_at date,
  verification_status text NOT NULL DEFAULT 'PENDING',
  verified_by uuid,
  verified_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_beneficial_owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  national_id text,
  ownership_percent numeric(7,4) NOT NULL DEFAULT 0 CHECK (ownership_percent >= 0 AND ownership_percent <= 100),
  verification_status text NOT NULL DEFAULT 'PENDING',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Accounts, beneficiaries, idempotency, transactions, and double-entry ledger
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  account_number text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE RESTRICT,
  account_type_id uuid NOT NULL REFERENCES public.bank_account_types(id) ON DELETE RESTRICT,
  branch_id uuid REFERENCES public.bank_branches(id) ON DELETE SET NULL,
  currency text NOT NULL DEFAULT 'TZS',
  ledger_balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (ledger_balance >= 0),
  available_balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (available_balance >= 0),
  hold_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (hold_amount >= 0),
  status text NOT NULL DEFAULT 'PENDING',
  opened_at timestamptz,
  closed_at timestamptz,
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, account_number)
);

CREATE TABLE IF NOT EXISTS public.bank_account_beneficiaries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE CASCADE,
  account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE CASCADE,
  beneficiary_name text NOT NULL,
  beneficiary_account_number text NOT NULL,
  bank_name text,
  phone text,
  status text NOT NULL DEFAULT 'PENDING',
  verified_at timestamptz,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, account_id, beneficiary_account_number)
);

CREATE TABLE IF NOT EXISTS public.bank_idempotency_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  idempotency_key text NOT NULL,
  operation text NOT NULL,
  request_hash text NOT NULL,
  status text NOT NULL DEFAULT 'PROCESSING',
  result jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(company_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.bank_journal_batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  batch_number text NOT NULL,
  currency text NOT NULL DEFAULT 'TZS',
  total_debit numeric(20,2) NOT NULL DEFAULT 0 CHECK (total_debit >= 0),
  total_credit numeric(20,2) NOT NULL DEFAULT 0 CHECK (total_credit >= 0),
  status text NOT NULL DEFAULT 'POSTED',
  source_type text NOT NULL,
  source_id uuid,
  idempotency_key text,
  posted_by uuid DEFAULT auth.uid(),
  posted_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, batch_number),
  UNIQUE(company_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.bank_journal_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.bank_journal_batches(id) ON DELETE RESTRICT,
  account_id uuid REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  gl_code text NOT NULL,
  line_description text,
  debit numeric(20,2) NOT NULL DEFAULT 0 CHECK (debit >= 0),
  credit numeric(20,2) NOT NULL DEFAULT 0 CHECK (credit >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK ((debit = 0 AND credit > 0) OR (credit = 0 AND debit > 0))
);

CREATE TABLE IF NOT EXISTS public.bank_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  transaction_number text NOT NULL,
  transaction_type text NOT NULL,
  channel text NOT NULL DEFAULT 'CASH',
  source_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  destination_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  customer_id uuid REFERENCES public.bank_customers(id) ON DELETE SET NULL,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  fee_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  currency text NOT NULL DEFAULT 'TZS',
  status text NOT NULL DEFAULT 'POSTED',
  idempotency_key text NOT NULL,
  provider text,
  provider_reference text,
  narration text,
  journal_batch_id uuid REFERENCES public.bank_journal_batches(id) ON DELETE RESTRICT,
  teller_id uuid,
  initiated_by uuid DEFAULT auth.uid(),
  posted_at timestamptz,
  reversed_transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, transaction_number),
  UNIQUE(company_id, idempotency_key)
);

-- ---------------------------------------------------------------------------
-- Cash, channels, agents, and wallets
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_tellers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid,
  branch_id uuid REFERENCES public.bank_branches(id) ON DELETE SET NULL,
  teller_code text NOT NULL,
  name text NOT NULL,
  status text NOT NULL DEFAULT 'ACTIVE',
  opening_balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (opening_balance >= 0),
  closing_balance numeric(20,2),
  opened_at timestamptz,
  closed_at timestamptz,
  version bigint NOT NULL DEFAULT 0,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, teller_code)
);

CREATE TABLE IF NOT EXISTS public.bank_cash_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  teller_id uuid REFERENCES public.bank_tellers(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES public.bank_branches(id) ON DELETE SET NULL,
  movement_type text NOT NULL,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'TZS',
  status text NOT NULL DEFAULT 'PENDING',
  transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  approved_by uuid,
  approved_at timestamptz,
  idempotency_key text NOT NULL,
  narration text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.bank_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  agent_code text NOT NULL,
  name text NOT NULL,
  phone text,
  national_id text,
  branch_id uuid REFERENCES public.bank_branches(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'PENDING',
  float_balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (float_balance >= 0),
  commission_rate numeric(12,6) NOT NULL DEFAULT 0 CHECK (commission_rate >= 0),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, agent_code)
);

CREATE TABLE IF NOT EXISTS public.bank_wallets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  wallet_number text NOT NULL,
  customer_id uuid REFERENCES public.bank_customers(id) ON DELETE SET NULL,
  provider text NOT NULL,
  msisdn text NOT NULL,
  balance numeric(20,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  status text NOT NULL DEFAULT 'PENDING',
  provider_customer_ref text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, wallet_number),
  UNIQUE(company_id, provider, msisdn)
);

CREATE TABLE IF NOT EXISTS public.bank_payment_instructions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  instruction_number text NOT NULL,
  payment_type text NOT NULL,
  channel text NOT NULL,
  source_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  destination_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'TZS',
  provider text,
  msisdn text,
  provider_reference text,
  status text NOT NULL DEFAULT 'INITIATED',
  requested_at timestamptz NOT NULL DEFAULT now(),
  confirmed_at timestamptz,
  failure_reason text,
  idempotency_key text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  UNIQUE(company_id, instruction_number),
  UNIQUE(company_id, idempotency_key)
);

-- ---------------------------------------------------------------------------
-- Credit lifecycle, groups, shares, standing orders, reconciliation
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_loan_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  application_number text NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.bank_loan_products(id) ON DELETE RESTRICT,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  term_months integer NOT NULL CHECK (term_months > 0),
  purpose text NOT NULL,
  status text NOT NULL DEFAULT 'DRAFT',
  credit_score integer CHECK (credit_score BETWEEN 0 AND 100),
  score_inputs jsonb NOT NULL DEFAULT '{}'::jsonb,
  submitted_by uuid DEFAULT auth.uid(),
  submitted_at timestamptz,
  decision_by uuid,
  decision_at timestamptz,
  decision_note text,
  branch_id uuid REFERENCES public.bank_branches(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, application_number)
);

CREATE TABLE IF NOT EXISTS public.bank_loan_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.bank_loan_applications(id) ON DELETE CASCADE,
  step_number integer NOT NULL DEFAULT 1,
  approver_id uuid DEFAULT auth.uid(),
  decision text NOT NULL,
  note text,
  decided_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(application_id, step_number)
);

CREATE TABLE IF NOT EXISTS public.bank_guarantors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.bank_loan_applications(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE RESTRICT,
  guarantee_amount numeric(20,2) NOT NULL CHECK (guarantee_amount > 0),
  consent_status text NOT NULL DEFAULT 'PENDING',
  consented_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_collateral (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  application_id uuid NOT NULL REFERENCES public.bank_loan_applications(id) ON DELETE CASCADE,
  collateral_type text NOT NULL,
  description text NOT NULL,
  ownership_document text,
  estimated_value numeric(20,2) NOT NULL DEFAULT 0 CHECK (estimated_value >= 0),
  valuation_date date,
  verification_status text NOT NULL DEFAULT 'PENDING',
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  loan_number text NOT NULL,
  application_id uuid NOT NULL REFERENCES public.bank_loan_applications(id) ON DELETE RESTRICT,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE RESTRICT,
  product_id uuid NOT NULL REFERENCES public.bank_loan_products(id) ON DELETE RESTRICT,
  principal numeric(20,2) NOT NULL CHECK (principal > 0),
  outstanding_principal numeric(20,2) NOT NULL CHECK (outstanding_principal >= 0),
  outstanding_interest numeric(20,2) NOT NULL DEFAULT 0 CHECK (outstanding_interest >= 0),
  outstanding_fees numeric(20,2) NOT NULL DEFAULT 0 CHECK (outstanding_fees >= 0),
  outstanding_penalties numeric(20,2) NOT NULL DEFAULT 0 CHECK (outstanding_penalties >= 0),
  annual_interest_rate numeric(12,6) NOT NULL CHECK (annual_interest_rate >= 0),
  term_months integer NOT NULL CHECK (term_months > 0),
  interest_method text NOT NULL,
  status text NOT NULL DEFAULT 'APPROVED',
  disbursed_at timestamptz,
  maturity_date date,
  days_past_due integer NOT NULL DEFAULT 0 CHECK (days_past_due >= 0),
  par_bucket text NOT NULL DEFAULT 'CURRENT',
  write_off_at timestamptz,
  restructure_count integer NOT NULL DEFAULT 0,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, loan_number),
  UNIQUE(application_id)
);

CREATE TABLE IF NOT EXISTS public.bank_loan_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES public.bank_loans(id) ON DELETE CASCADE,
  installment_number integer NOT NULL CHECK (installment_number > 0),
  due_date date NOT NULL,
  principal_due numeric(20,2) NOT NULL DEFAULT 0 CHECK (principal_due >= 0),
  interest_due numeric(20,2) NOT NULL DEFAULT 0 CHECK (interest_due >= 0),
  fee_due numeric(20,2) NOT NULL DEFAULT 0 CHECK (fee_due >= 0),
  penalty_due numeric(20,2) NOT NULL DEFAULT 0 CHECK (penalty_due >= 0),
  principal_paid numeric(20,2) NOT NULL DEFAULT 0 CHECK (principal_paid >= 0),
  interest_paid numeric(20,2) NOT NULL DEFAULT 0 CHECK (interest_paid >= 0),
  fee_paid numeric(20,2) NOT NULL DEFAULT 0 CHECK (fee_paid >= 0),
  penalty_paid numeric(20,2) NOT NULL DEFAULT 0 CHECK (penalty_paid >= 0),
  status text NOT NULL DEFAULT 'DUE',
  paid_at timestamptz,
  UNIQUE(loan_id, installment_number)
);

CREATE TABLE IF NOT EXISTS public.bank_loan_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  repayment_number text NOT NULL,
  loan_id uuid NOT NULL REFERENCES public.bank_loans(id) ON DELETE RESTRICT,
  account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  principal_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (principal_amount >= 0),
  interest_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (interest_amount >= 0),
  fee_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (fee_amount >= 0),
  penalty_amount numeric(20,2) NOT NULL DEFAULT 0 CHECK (penalty_amount >= 0),
  channel text NOT NULL DEFAULT 'CASH',
  status text NOT NULL DEFAULT 'POSTED',
  idempotency_key text NOT NULL,
  transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  posted_by uuid DEFAULT auth.uid(),
  posted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, repayment_number),
  UNIQUE(company_id, idempotency_key)
);

CREATE TABLE IF NOT EXISTS public.bank_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_number text NOT NULL,
  name text NOT NULL,
  group_type text NOT NULL DEFAULT 'VICOBA',
  meeting_frequency text,
  status text NOT NULL DEFAULT 'ACTIVE',
  branch_id uuid REFERENCES public.bank_branches(id) ON DELETE SET NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, group_number)
);

CREATE TABLE IF NOT EXISTS public.bank_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.bank_groups(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'MEMBER',
  shares_count integer NOT NULL DEFAULT 0 CHECK (shares_count >= 0),
  joined_at date NOT NULL DEFAULT current_date,
  status text NOT NULL DEFAULT 'ACTIVE',
  UNIQUE(group_id, customer_id)
);

CREATE TABLE IF NOT EXISTS public.bank_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.bank_groups(id) ON DELETE SET NULL,
  customer_id uuid NOT NULL REFERENCES public.bank_customers(id) ON DELETE RESTRICT,
  shares_count integer NOT NULL CHECK (shares_count > 0),
  price_per_share numeric(20,2) NOT NULL CHECK (price_per_share >= 0),
  transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'POSTED',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_standing_orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  order_number text NOT NULL,
  source_account_id uuid NOT NULL REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  destination_account_id uuid REFERENCES public.bank_accounts(id) ON DELETE RESTRICT,
  destination_msisdn text,
  amount numeric(20,2) NOT NULL CHECK (amount > 0),
  frequency text NOT NULL,
  next_run_date date NOT NULL,
  end_date date,
  status text NOT NULL DEFAULT 'ACTIVE',
  last_run_at timestamptz,
  last_result text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, order_number),
  CHECK (end_date IS NULL OR end_date >= next_run_date),
  CHECK (destination_account_id IS NOT NULL OR destination_msisdn IS NOT NULL)
);

CREATE TABLE IF NOT EXISTS public.bank_reconciliations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  reconciliation_number text NOT NULL,
  account_id uuid REFERENCES public.bank_accounts(id) ON DELETE SET NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  statement_balance numeric(20,2) NOT NULL DEFAULT 0,
  ledger_balance numeric(20,2) NOT NULL DEFAULT 0,
  difference numeric(20,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'OPEN',
  reviewed_by uuid,
  reviewed_at timestamptz,
  notes text,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, reconciliation_number),
  CHECK (period_end >= period_start)
);

-- ---------------------------------------------------------------------------
-- Compliance, audit, notification, and reporting read model
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bank_aml_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  alert_number text NOT NULL,
  customer_id uuid REFERENCES public.bank_customers(id) ON DELETE SET NULL,
  transaction_id uuid REFERENCES public.bank_transactions(id) ON DELETE SET NULL,
  rule_code text NOT NULL,
  risk_level text NOT NULL DEFAULT 'MEDIUM',
  status text NOT NULL DEFAULT 'OPEN',
  rationale text NOT NULL,
  assigned_to uuid,
  mlro_decision text,
  closed_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, alert_number)
);

CREATE TABLE IF NOT EXISTS public.bank_audit_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  actor_id uuid DEFAULT auth.uid(),
  operation text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  outcome text NOT NULL,
  request_id text,
  redacted_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.bank_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid,
  customer_id uuid REFERENCES public.bank_customers(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  channel text NOT NULL DEFAULT 'IN_APP',
  status text NOT NULL DEFAULT 'PENDING',
  sent_at timestamptz,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ---------------------------------------------------------------------------
-- Compatibility extension for legacy generic banking tables already present
-- in SMART MANAGER. Existing rows are preserved; typed columns are additive.
-- ---------------------------------------------------------------------------
ALTER TABLE public.bank_accounts
  ADD COLUMN IF NOT EXISTS account_number text,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS account_type_id uuid,
  ADD COLUMN IF NOT EXISTS branch_id uuid,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS ledger_balance numeric(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS available_balance numeric(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS hold_amount numeric(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS opened_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz,
  ADD COLUMN IF NOT EXISTS version bigint DEFAULT 0;

ALTER TABLE public.bank_transactions
  ADD COLUMN IF NOT EXISTS transaction_number text,
  ADD COLUMN IF NOT EXISTS transaction_type text,
  ADD COLUMN IF NOT EXISTS channel text DEFAULT 'CASH',
  ADD COLUMN IF NOT EXISTS source_account_id uuid,
  ADD COLUMN IF NOT EXISTS destination_account_id uuid,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS fee_amount numeric(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS idempotency_key text,
  ADD COLUMN IF NOT EXISTS provider text,
  ADD COLUMN IF NOT EXISTS provider_reference text,
  ADD COLUMN IF NOT EXISTS narration text,
  ADD COLUMN IF NOT EXISTS journal_batch_id uuid,
  ADD COLUMN IF NOT EXISTS teller_id uuid,
  ADD COLUMN IF NOT EXISTS initiated_by uuid,
  ADD COLUMN IF NOT EXISTS posted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reversed_transaction_id uuid;

ALTER TABLE public.bank_loans
  ADD COLUMN IF NOT EXISTS loan_number text,
  ADD COLUMN IF NOT EXISTS application_id uuid,
  ADD COLUMN IF NOT EXISTS customer_id uuid,
  ADD COLUMN IF NOT EXISTS product_id uuid,
  ADD COLUMN IF NOT EXISTS principal numeric(20,2),
  ADD COLUMN IF NOT EXISTS outstanding_principal numeric(20,2),
  ADD COLUMN IF NOT EXISTS outstanding_interest numeric(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_fees numeric(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS outstanding_penalties numeric(20,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS annual_interest_rate numeric(12,6),
  ADD COLUMN IF NOT EXISTS term_months integer,
  ADD COLUMN IF NOT EXISTS interest_method text,
  ADD COLUMN IF NOT EXISTS disbursed_at timestamptz,
  ADD COLUMN IF NOT EXISTS maturity_date date,
  ADD COLUMN IF NOT EXISTS days_past_due integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS par_bucket text DEFAULT 'CURRENT',
  ADD COLUMN IF NOT EXISTS write_off_at timestamptz,
  ADD COLUMN IF NOT EXISTS restructure_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid;

ALTER TABLE public.bank_standing_orders
  ADD COLUMN IF NOT EXISTS order_number text,
  ADD COLUMN IF NOT EXISTS source_account_id uuid,
  ADD COLUMN IF NOT EXISTS destination_account_id uuid,
  ADD COLUMN IF NOT EXISTS destination_msisdn text,
  ADD COLUMN IF NOT EXISTS frequency text,
  ADD COLUMN IF NOT EXISTS next_run_date date,
  ADD COLUMN IF NOT EXISTS end_date date,
  ADD COLUMN IF NOT EXISTS last_run_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_result text,
  ADD COLUMN IF NOT EXISTS created_by uuid;

CREATE UNIQUE INDEX IF NOT EXISTS bank_accounts_company_account_number_unique ON public.bank_accounts(company_id, account_number) WHERE account_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bank_transactions_company_transaction_number_unique ON public.bank_transactions(company_id, transaction_number) WHERE transaction_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bank_transactions_company_idempotency_unique ON public.bank_transactions(company_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bank_loans_company_loan_number_unique ON public.bank_loans(company_id, loan_number) WHERE loan_number IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bank_loans_application_unique ON public.bank_loans(application_id) WHERE application_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS bank_standing_orders_company_order_number_unique ON public.bank_standing_orders(company_id, order_number) WHERE order_number IS NOT NULL;

-- ---------------------------------------------------------------------------
-- Indexes for tenant and operational access
-- ---------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS bank_branches_company_status_idx ON public.bank_branches(company_id, status);
CREATE INDEX IF NOT EXISTS bank_customers_company_status_idx ON public.bank_customers(company_id, status, kyc_status);
CREATE INDEX IF NOT EXISTS bank_customer_documents_company_customer_idx ON public.bank_customer_documents(company_id, customer_id, verification_status);
CREATE INDEX IF NOT EXISTS bank_accounts_company_customer_idx ON public.bank_accounts(company_id, customer_id, status);
CREATE INDEX IF NOT EXISTS bank_accounts_company_branch_idx ON public.bank_accounts(company_id, branch_id, status);
CREATE INDEX IF NOT EXISTS bank_transactions_company_posted_idx ON public.bank_transactions(company_id, posted_at DESC, status);
CREATE INDEX IF NOT EXISTS bank_transactions_company_account_idx ON public.bank_transactions(company_id, source_account_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS bank_journal_lines_company_batch_idx ON public.bank_journal_lines(company_id, batch_id);
CREATE INDEX IF NOT EXISTS bank_loan_applications_company_status_idx ON public.bank_loan_applications(company_id, status, created_at DESC);
CREATE INDEX IF NOT EXISTS bank_loans_company_status_par_idx ON public.bank_loans(company_id, status, par_bucket, days_past_due DESC);
CREATE INDEX IF NOT EXISTS bank_loan_schedules_company_due_idx ON public.bank_loan_schedules(company_id, due_date, status);
CREATE INDEX IF NOT EXISTS bank_loan_repayments_company_loan_idx ON public.bank_loan_repayments(company_id, loan_id, posted_at DESC);
CREATE INDEX IF NOT EXISTS bank_aml_alerts_company_status_idx ON public.bank_aml_alerts(company_id, status, risk_level, created_at DESC);
CREATE INDEX IF NOT EXISTS bank_audit_events_company_created_idx ON public.bank_audit_events(company_id, created_at DESC);
CREATE INDEX IF NOT EXISTS bank_notifications_company_profile_idx ON public.bank_notifications(company_id, profile_id, status, created_at DESC);

-- ---------------------------------------------------------------------------
-- Tenant and permission helpers
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bank_is_privileged()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = public.current_company_id()
      AND lower(coalesce(p.role, '')) IN (
        'super administrator','organization owner','ceo','cfo','finance manager','bank manager','branch manager','credit manager','compliance officer','mlro','admin','owner','manager'
      )
  ) OR EXISTS (
    SELECT 1 FROM public.company_memberships m
    WHERE m.user_id = auth.uid()
      AND m.company_id = public.current_company_id()
      AND lower(coalesce(m.role, '')) IN (
        'super administrator','organization owner','ceo','cfo','finance manager','bank manager','branch manager','credit manager','compliance officer','mlro','admin','owner','manager'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.bank_has_role(p_roles text[])
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid() AND p.company_id = public.current_company_id()
      AND lower(coalesce(p.role, '')) = ANY(SELECT lower(x) FROM unnest(p_roles) x)
  ) OR public.bank_is_privileged();
$$;

CREATE OR REPLACE FUNCTION public.bank_audit(p_operation text, p_entity_type text, p_entity_id uuid, p_outcome text, p_payload jsonb DEFAULT '{}'::jsonb, p_request_id text DEFAULT NULL)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  INSERT INTO public.bank_audit_events(company_id, actor_id, operation, entity_type, entity_id, outcome, request_id, redacted_payload)
  VALUES (public.current_company_id(), auth.uid(), p_operation, p_entity_type, p_entity_id, p_outcome, p_request_id, coalesce(p_payload, '{}'::jsonb));
END;
$$;

-- ---------------------------------------------------------------------------
-- Double-entry invariant. Lines may be inserted in one transaction; the
-- deferred constraint validates the completed batch at transaction commit.
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bank_assert_balanced_journal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_debit numeric(20,2); v_credit numeric(20,2); v_batch public.bank_journal_batches%ROWTYPE;
BEGIN
  SELECT * INTO v_batch FROM public.bank_journal_batches WHERE id=NEW.batch_id;
  SELECT coalesce(sum(debit),0), coalesce(sum(credit),0) INTO v_debit, v_credit FROM public.bank_journal_lines WHERE batch_id=NEW.batch_id;
  IF v_batch.status = 'POSTED' AND v_debit <> v_credit THEN
    RAISE EXCEPTION 'Journal batch % is unbalanced: debit % credit %.', NEW.batch_id, v_debit, v_credit USING ERRCODE = '23514';
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS bank_journal_lines_balanced ON public.bank_journal_lines;
CREATE CONSTRAINT TRIGGER bank_journal_lines_balanced
AFTER INSERT OR UPDATE ON public.bank_journal_lines
DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION public.bank_assert_balanced_journal();

-- ---------------------------------------------------------------------------
-- Secure product configuration and institution/customer/account procedures
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bank_create_account_type(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to configure account types.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_account_types(company_id,code,name,product_kind,currency,minimum_opening_balance,minimum_operating_balance,annual_interest_rate,withdrawal_fee,status,data)
  VALUES (public.current_company_id(),p_payload->>'code',p_payload->>'name',coalesce(p_payload->>'productKind','SAVINGS'),coalesce(p_payload->>'currency','TZS'),coalesce((p_payload->>'minimumOpeningBalance')::numeric,0),coalesce((p_payload->>'minimumOperatingBalance')::numeric,0),coalesce((p_payload->>'annualInterestRate')::numeric,0),coalesce((p_payload->>'withdrawalFee')::numeric,0),coalesce(p_payload->>'status','ACTIVE'),coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('ACCOUNT_TYPE_CREATED','account_type',v_id,'SUCCESS',jsonb_build_object('code',p_payload->>'code','name',p_payload->>'name'));
  RETURN jsonb_build_object('accountTypeId',v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_create_loan_product(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.bank_has_role(ARRAY['Credit Manager','Bank Manager','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to configure loan products.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_loan_products(company_id,code,name,product_kind,currency,minimum_amount,maximum_amount,minimum_term_months,maximum_term_months,annual_interest_rate,interest_method,processing_fee_rate,late_penalty_rate,collateral_required,guarantors_required,approval_threshold,status,data)
  VALUES (public.current_company_id(),p_payload->>'code',p_payload->>'name',coalesce(p_payload->>'productKind','TERM_LOAN'),coalesce(p_payload->>'currency','TZS'),coalesce((p_payload->>'minimumAmount')::numeric,0),(p_payload->>'maximumAmount')::numeric,coalesce((p_payload->>'minimumTermMonths')::integer,1),(p_payload->>'maximumTermMonths')::integer,(p_payload->>'annualInterestRate')::numeric,coalesce(p_payload->>'interestMethod','REDUCING_BALANCE'),coalesce((p_payload->>'processingFeeRate')::numeric,0),coalesce((p_payload->>'latePenaltyRate')::numeric,0),coalesce((p_payload->>'collateralRequired')::boolean,false),coalesce((p_payload->>'guarantorsRequired')::integer,0),coalesce((p_payload->>'approvalThreshold')::numeric,0),coalesce(p_payload->>'status','ACTIVE'),coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('LOAN_PRODUCT_CREATED','loan_product',v_id,'SUCCESS',jsonb_build_object('code',p_payload->>'code','name',p_payload->>'name'));
  RETURN jsonb_build_object('loanProductId',v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_setup_institution(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_company uuid := public.current_company_id(); v_id uuid; v_branch uuid;
BEGIN
  IF auth.uid() IS NULL OR NOT public.bank_has_role(ARRAY['Organization Owner','CEO','CFO','Bank Manager','Admin']) THEN
    RAISE EXCEPTION 'You are not authorized to configure the banking institution.' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.bank_institutions(company_id, legal_name, trading_name, institution_type, licence_number, currency, timezone, data)
  VALUES (v_company, coalesce(p_payload->>'legalName',''), p_payload->>'tradingName', coalesce(p_payload->>'institutionType','MFI'), p_payload->>'licenceNumber', coalesce(p_payload->>'currency','TZS'), coalesce(p_payload->>'timezone','Africa/Dar_es_Salaam'), coalesce(p_payload->'data','{}'::jsonb))
  ON CONFLICT (company_id) DO UPDATE SET legal_name=EXCLUDED.legal_name, trading_name=EXCLUDED.trading_name, institution_type=EXCLUDED.institution_type, licence_number=EXCLUDED.licence_number, currency=EXCLUDED.currency, timezone=EXCLUDED.timezone, data=EXCLUDED.data, updated_at=now()
  RETURNING id INTO v_id;
  IF p_payload->>'branchCode' IS NOT NULL AND p_payload->>'branchName' IS NOT NULL THEN
    INSERT INTO public.bank_branches(company_id, institution_id, code, name, region, district, address, phone)
    VALUES (v_company, v_id, p_payload->>'branchCode', p_payload->>'branchName', p_payload->>'region', p_payload->>'district', p_payload->>'address', p_payload->>'phone')
    ON CONFLICT (company_id, code) DO UPDATE SET name=EXCLUDED.name, region=EXCLUDED.region, district=EXCLUDED.district, address=EXCLUDED.address, phone=EXCLUDED.phone, updated_at=now()
    RETURNING id INTO v_branch;
  END IF;
  PERFORM public.bank_audit('INSTITUTION_CONFIGURED','institution',v_id,'SUCCESS',jsonb_build_object('branchId',v_branch));
  RETURN jsonb_build_object('institutionId',v_id,'branchId',v_branch);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_register_customer(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_company uuid := public.current_company_id(); v_id uuid; v_number text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Teller','Credit Officer','Customer Service','Admin']) THEN
    RAISE EXCEPTION 'You are not authorized to register banking customers.' USING ERRCODE = '42501';
  END IF;
  v_number := coalesce(nullif(p_payload->>'customerNumber',''), 'CUS-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'));
  INSERT INTO public.bank_customers(company_id, customer_number, customer_kind, full_name, phone, email, date_of_birth, gender, occupation, address, national_id, tin, risk_rating, pep_status, source_of_funds, relationship_purpose, branch_id, data)
  VALUES (v_company, v_number, coalesce(p_payload->>'customerKind','INDIVIDUAL'), coalesce(nullif(p_payload->>'fullName',''),''), p_payload->>'phone', p_payload->>'email', nullif(p_payload->>'dateOfBirth','')::date, p_payload->>'gender', p_payload->>'occupation', p_payload->>'address', p_payload->>'nationalId', p_payload->>'tin', coalesce(p_payload->>'riskRating','STANDARD'), coalesce(p_payload->>'pepStatus','NOT_REPORTED'), p_payload->>'sourceOfFunds', p_payload->>'relationshipPurpose', nullif(p_payload->>'branchId','')::uuid, coalesce(p_payload->'data','{}'::jsonb))
  RETURNING id INTO v_id;
  PERFORM public.bank_audit('CUSTOMER_REGISTERED','customer',v_id,'SUCCESS',jsonb_build_object('customerNumber',v_number,'customerKind',coalesce(p_payload->>'customerKind','INDIVIDUAL')));
  RETURN jsonb_build_object('customerId',v_id,'customerNumber',v_number);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_update_kyc(p_customer_id uuid, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_customer public.bank_customers%ROWTYPE; v_status text := coalesce(p_payload->>'kycStatus','PENDING_REVIEW');
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Compliance Officer','MLRO','Customer Service','Admin']) THEN RAISE EXCEPTION 'You are not authorized to update KYC.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_customer FROM public.bank_customers WHERE id=p_customer_id AND company_id=public.current_company_id() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  UPDATE public.bank_customers SET kyc_status=v_status, kyc_verified_at=CASE WHEN v_status='VERIFIED' THEN now() ELSE NULL END, kyc_verified_by=CASE WHEN v_status='VERIFIED' THEN auth.uid() ELSE NULL END, kyc_expires_at=nullif(p_payload->>'kycExpiresAt','')::date, risk_rating=coalesce(p_payload->>'riskRating',risk_rating), pep_status=coalesce(p_payload->>'pepStatus',pep_status), source_of_funds=coalesce(p_payload->>'sourceOfFunds',source_of_funds), relationship_purpose=coalesce(p_payload->>'relationshipPurpose',relationship_purpose), updated_at=now() WHERE id=p_customer_id;
  PERFORM public.bank_audit('KYC_UPDATED','customer',p_customer_id,'SUCCESS',jsonb_build_object('kycStatus',v_status,'riskRating',coalesce(p_payload->>'riskRating',v_customer.risk_rating)));
  RETURN jsonb_build_object('customerId',p_customer_id,'kycStatus',v_status);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_open_account(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_company uuid := public.current_company_id(); v_customer public.bank_customers%ROWTYPE; v_type public.bank_account_types%ROWTYPE; v_id uuid; v_number text; v_opening numeric(20,2) := greatest(coalesce((p_payload->>'openingBalance')::numeric,0),0);
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Teller','Customer Service','Admin']) THEN RAISE EXCEPTION 'You are not authorized to open accounts.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_customer FROM public.bank_customers WHERE id=(p_payload->>'customerId')::uuid AND company_id=v_company FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Customer is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  IF v_customer.kyc_status NOT IN ('VERIFIED','ENHANCED_REVIEW') THEN RAISE EXCEPTION 'Customer KYC must be verified before account opening.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_type FROM public.bank_account_types WHERE id=(p_payload->>'accountTypeId')::uuid AND company_id=v_company AND status='ACTIVE';
  IF NOT FOUND THEN RAISE EXCEPTION 'Account type is not available in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  IF v_opening < v_type.minimum_opening_balance THEN RAISE EXCEPTION 'Opening balance is below the configured account minimum.' USING ERRCODE = '22003'; END IF;
  v_number := coalesce(nullif(p_payload->>'accountNumber',''), 'TZ-' || upper(substr(md5(gen_random_uuid()::text),1,12)));
  INSERT INTO public.bank_accounts(company_id, account_number, customer_id, account_type_id, branch_id, currency, ledger_balance, available_balance, status, opened_at, data)
  VALUES (v_company, v_number, v_customer.id, v_type.id, nullif(p_payload->>'branchId','')::uuid, v_type.currency, v_opening, v_opening, 'ACTIVE', now(), coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('ACCOUNT_OPENED','account',v_id,'SUCCESS',jsonb_build_object('accountNumber',v_number,'customerId',v_customer.id,'openingBalance',v_opening));
  RETURN jsonb_build_object('accountId',v_id,'accountNumber',v_number,'balance',v_opening);
END;
$$;

-- ---------------------------------------------------------------------------
-- Secure cash transaction procedure with row locks, idempotency, and balanced journal
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bank_post_transaction(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  v_company uuid := public.current_company_id(); v_existing public.bank_transactions%ROWTYPE; v_source public.bank_accounts%ROWTYPE; v_destination public.bank_accounts%ROWTYPE;
  v_amount numeric(20,2) := (p_payload->>'amount')::numeric; v_fee numeric(20,2) := greatest(coalesce((p_payload->>'feeAmount')::numeric,0),0);
  v_type text := upper(coalesce(p_payload->>'transactionType','DEPOSIT')); v_key text := p_payload->>'idempotencyKey'; v_tx uuid; v_batch uuid; v_tx_no text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Teller','Cashier','Finance Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to post banking transactions.' USING ERRCODE = '42501'; END IF;
  IF v_amount IS NULL OR v_amount <= 0 OR v_key IS NULL OR length(v_key) < 12 THEN RAISE EXCEPTION 'A positive amount and idempotency key are required.' USING ERRCODE = '22023'; END IF;
  SELECT * INTO v_existing FROM public.bank_transactions WHERE company_id=v_company AND idempotency_key=v_key LIMIT 1;
  IF FOUND THEN RETURN jsonb_build_object('transactionId',v_existing.id,'transactionNumber',v_existing.transaction_number,'status',v_existing.status,'replayed',true); END IF;
  IF v_type IN ('WITHDRAWAL','TRANSFER','TRANSFER_OUT','LOAN_REPAYMENT') THEN
    SELECT * INTO v_source FROM public.bank_accounts WHERE id=(p_payload->>'sourceAccountId')::uuid AND company_id=v_company FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Source account is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
    IF v_source.status <> 'ACTIVE' THEN RAISE EXCEPTION 'Source account is not active.' USING ERRCODE = 'P0001'; END IF;
    IF v_source.available_balance < v_amount + v_fee THEN RAISE EXCEPTION 'Insufficient available balance.' USING ERRCODE = '22003'; END IF;
  ELSE
    IF p_payload->>'sourceAccountId' IS NOT NULL AND p_payload->>'sourceAccountId' <> '' THEN
      SELECT * INTO v_source FROM public.bank_accounts WHERE id=(p_payload->>'sourceAccountId')::uuid AND company_id=v_company FOR UPDATE;
    END IF;
  END IF;
  IF v_type IN ('DEPOSIT','TRANSFER','TRANSFER_IN') THEN
    SELECT * INTO v_destination FROM public.bank_accounts WHERE id=(p_payload->>'destinationAccountId')::uuid AND company_id=v_company FOR UPDATE;
    IF NOT FOUND OR v_destination.status <> 'ACTIVE' THEN RAISE EXCEPTION 'Destination account is not active in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  END IF;
  v_tx_no := 'TX-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.bank_transactions(company_id, transaction_number, transaction_type, channel, source_account_id, destination_account_id, customer_id, amount, fee_amount, currency, status, idempotency_key, provider, provider_reference, narration, initiated_by, posted_at, data)
  VALUES (v_company, v_tx_no, v_type, upper(coalesce(p_payload->>'channel','CASH')), nullif(p_payload->>'sourceAccountId','')::uuid, nullif(p_payload->>'destinationAccountId','')::uuid, nullif(p_payload->>'customerId','')::uuid, v_amount, v_fee, coalesce(p_payload->>'currency','TZS'), 'POSTED', v_key, p_payload->>'provider', p_payload->>'providerReference', p_payload->>'narration', auth.uid(), now(), coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_tx;
  IF v_source.id IS NOT NULL AND v_type IN ('WITHDRAWAL','TRANSFER','TRANSFER_OUT','LOAN_REPAYMENT') THEN
    UPDATE public.bank_accounts SET ledger_balance=ledger_balance-v_amount-v_fee, available_balance=available_balance-v_amount-v_fee, version=version+1, updated_at=now() WHERE id=v_source.id;
  END IF;
  IF v_destination.id IS NOT NULL AND v_type IN ('DEPOSIT','TRANSFER','TRANSFER_IN') THEN
    UPDATE public.bank_accounts SET ledger_balance=ledger_balance+v_amount, available_balance=available_balance+v_amount, version=version+1, updated_at=now() WHERE id=v_destination.id;
  END IF;
  INSERT INTO public.bank_journal_batches(company_id,batch_number,currency,total_debit,total_credit,source_type,source_id,idempotency_key)
  VALUES (v_company,'JB-'||v_tx,coalesce(p_payload->>'currency','TZS'),v_amount+v_fee,v_amount+v_fee,'BANK_TRANSACTION',v_tx,v_key) RETURNING id INTO v_batch;
  IF v_type IN ('DEPOSIT','TRANSFER_IN') THEN
    INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit)
    VALUES (v_company,v_batch,NULL,'CASH_OR_CLEARING',coalesce(p_payload->>'narration',v_type),v_amount+v_fee,0),
           (v_company,v_batch,v_destination.id,'CUSTOMER-DEPOSIT',coalesce(p_payload->>'narration',v_type),0,v_amount);
    IF v_fee > 0 THEN
      INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit)
      VALUES (v_company,v_batch,NULL,'FEE_INCOME',coalesce(p_payload->>'narration',v_type),0,v_fee);
    END IF;
  ELSIF v_type IN ('WITHDRAWAL','TRANSFER_OUT','LOAN_REPAYMENT') THEN
    INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit)
    VALUES (v_company,v_batch,v_source.id,'CUSTOMER-DEPOSIT',coalesce(p_payload->>'narration',v_type),v_amount+v_fee,0),
           (v_company,v_batch,NULL,'CASH_OR_CLEARING',coalesce(p_payload->>'narration',v_type),0,v_amount);
    IF v_fee > 0 THEN
      INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit)
      VALUES (v_company,v_batch,NULL,'FEE_INCOME',coalesce(p_payload->>'narration',v_type),0,v_fee);
    END IF;
  ELSIF v_type = 'TRANSFER' THEN
    INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit)
    VALUES (v_company,v_batch,v_source.id,'CUSTOMER-DEPOSIT',coalesce(p_payload->>'narration',v_type),v_amount+v_fee,0),
           (v_company,v_batch,v_destination.id,'CUSTOMER-DEPOSIT',coalesce(p_payload->>'narration',v_type),0,v_amount);
    IF v_fee > 0 THEN
      INSERT INTO public.bank_journal_lines(company_id,batch_id,account_id,gl_code,line_description,debit,credit)
      VALUES (v_company,v_batch,NULL,'FEE_INCOME',coalesce(p_payload->>'narration',v_type),0,v_fee);
    END IF;
  END IF;
  UPDATE public.bank_transactions SET journal_batch_id=v_batch WHERE id=v_tx;
  PERFORM public.bank_audit('TRANSACTION_POSTED','transaction',v_tx,'SUCCESS',jsonb_build_object('transactionType',v_type,'amount',v_amount,'channel',upper(coalesce(p_payload->>'channel','CASH')),'idempotencyKey',v_key));
  RETURN jsonb_build_object('transactionId',v_tx,'transactionNumber',v_tx_no,'status','POSTED','replayed',false);
EXCEPTION WHEN unique_violation THEN
  SELECT * INTO v_existing FROM public.bank_transactions WHERE company_id=v_company AND idempotency_key=v_key LIMIT 1;
  IF FOUND THEN RETURN jsonb_build_object('transactionId',v_existing.id,'transactionNumber',v_existing.transaction_number,'status',v_existing.status,'replayed',true); END IF;
  RAISE;
END;
$$;

-- ---------------------------------------------------------------------------
-- Loan application, approval, disbursement, and repayment procedures
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bank_submit_loan_application(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_number text; v_customer uuid := (p_payload->>'customerId')::uuid; v_product public.bank_loan_products%ROWTYPE; v_amount numeric(20,2) := (p_payload->>'amount')::numeric; v_term integer := (p_payload->>'termMonths')::integer;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Officer','Branch Manager','Bank Manager','Customer Service','Admin']) THEN RAISE EXCEPTION 'You are not authorized to submit loan applications.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_customers WHERE id=v_customer AND company_id=public.current_company_id() AND kyc_status IN ('VERIFIED','ENHANCED_REVIEW')) THEN RAISE EXCEPTION 'Verified customer KYC is required for loan application.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_product FROM public.bank_loan_products WHERE id=(p_payload->>'productId')::uuid AND company_id=public.current_company_id() AND status='ACTIVE';
  IF NOT FOUND OR v_amount < v_product.minimum_amount OR v_amount > v_product.maximum_amount OR v_term < v_product.minimum_term_months OR v_term > v_product.maximum_term_months THEN RAISE EXCEPTION 'Loan amount or term violates the selected product rules.' USING ERRCODE = '22023'; END IF;
  v_number := 'APP-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.bank_loan_applications(company_id,application_number,customer_id,product_id,amount,term_months,purpose,status,score_inputs,branch_id,data)
  VALUES (public.current_company_id(),v_number,v_customer,v_product.id,v_amount,v_term,coalesce(p_payload->>'purpose',''),'SUBMITTED',coalesce(p_payload->'scoreInputs','{}'::jsonb),nullif(p_payload->>'branchId','')::uuid,coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('LOAN_APPLICATION_SUBMITTED','loan_application',v_id,'SUCCESS',jsonb_build_object('amount',v_amount,'termMonths',v_term));
  RETURN jsonb_build_object('applicationId',v_id,'applicationNumber',v_number,'status','SUBMITTED');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_decide_loan_application(p_application_id uuid, p_decision text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_app public.bank_loan_applications%ROWTYPE; v_decision text := upper(p_decision);
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Manager','Branch Manager','Bank Manager','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to decide loan applications.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_app FROM public.bank_loan_applications WHERE id=p_application_id AND company_id=public.current_company_id() FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Loan application is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  IF v_app.submitted_by = auth.uid() THEN RAISE EXCEPTION 'Maker-checker separation requires a different approver.' USING ERRCODE = '42501'; END IF;
  IF v_app.status NOT IN ('SUBMITTED','UNDER_REVIEW') THEN RAISE EXCEPTION 'Loan application is not awaiting decision.' USING ERRCODE = '40901'; END IF;
  IF v_decision NOT IN ('APPROVED','REJECTED') THEN RAISE EXCEPTION 'Decision must be APPROVED or REJECTED.' USING ERRCODE = '22023'; END IF;
  UPDATE public.bank_loan_applications SET status=v_decision, decision_by=auth.uid(), decision_at=now(), decision_note=p_note, updated_at=now() WHERE id=p_application_id;
  INSERT INTO public.bank_loan_approvals(company_id,application_id,step_number,approver_id,decision,note) VALUES (public.current_company_id(),p_application_id,1,auth.uid(),v_decision,p_note);
  PERFORM public.bank_audit('LOAN_APPLICATION_DECIDED','loan_application',p_application_id,'SUCCESS',jsonb_build_object('decision',v_decision));
  RETURN jsonb_build_object('applicationId',p_application_id,'status',v_decision);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_disburse_loan(p_application_id uuid, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_app public.bank_loan_applications%ROWTYPE; v_loan uuid; v_number text; v_rate numeric(12,6); v_schedule integer; v_principal numeric(20,2); v_interest numeric(20,2); v_installment numeric(20,2); v_due date;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Manager','Bank Manager','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to disburse loans.' USING ERRCODE = '42501'; END IF;
  SELECT * INTO v_app FROM public.bank_loan_applications WHERE id=p_application_id AND company_id=public.current_company_id() FOR UPDATE;
  IF NOT FOUND OR v_app.status <> 'APPROVED' THEN RAISE EXCEPTION 'Only approved loan applications may be disbursed.' USING ERRCODE = '40901'; END IF;
  IF v_app.submitted_by = auth.uid() THEN RAISE EXCEPTION 'Maker-checker separation requires a different disbursing officer.' USING ERRCODE = '42501'; END IF;
  SELECT annual_interest_rate INTO v_rate FROM public.bank_loan_products WHERE id=v_app.product_id;
  v_principal := v_app.amount; v_number := 'LN-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.bank_loans(company_id,loan_number,application_id,customer_id,product_id,principal,outstanding_principal,annual_interest_rate,term_months,interest_method,status,disbursed_at,maturity_date)
  VALUES (public.current_company_id(),v_number,p_application_id,v_app.customer_id,v_app.product_id,v_principal,v_principal,v_rate,v_app.term_months,'REDUCING_BALANCE','ACTIVE',now(),(current_date + (v_app.term_months || ' months')::interval)::date) RETURNING id INTO v_loan;
  v_installment := round((v_principal * (1 + (v_rate/100/12) * v_app.term_months) / v_app.term_months),2);
  FOR v_schedule IN 1..v_app.term_months LOOP
    v_interest := round(v_principal * (v_rate/100/12),2);
    v_principal := greatest(0, v_principal - greatest(v_installment-v_interest,0));
    v_due := (current_date + (v_schedule || ' months')::interval)::date;
    INSERT INTO public.bank_loan_schedules(company_id,loan_id,installment_number,due_date,principal_due,interest_due) VALUES (public.current_company_id(),v_loan,v_schedule,v_due,greatest(v_installment-v_interest,0),v_interest);
  END LOOP;
  UPDATE public.bank_loan_applications SET status='DISBURSED',updated_at=now() WHERE id=p_application_id;
  PERFORM public.bank_audit('LOAN_DISBURSED','loan',v_loan,'SUCCESS',jsonb_build_object('loanNumber',v_number,'applicationId',p_application_id));
  RETURN jsonb_build_object('loanId',v_loan,'loanNumber',v_number,'status','ACTIVE');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_record_repayment(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_loan public.bank_loans%ROWTYPE; v_repay uuid; v_number text; v_amount numeric(20,2) := (p_payload->>'amount')::numeric; v_key text := p_payload->>'idempotencyKey'; v_principal numeric(20,2); v_interest numeric(20,2); v_fee numeric(20,2); v_penalty numeric(20,2);
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Officer','Teller','Branch Manager','Bank Manager','Finance Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to record loan repayments.' USING ERRCODE = '42501'; END IF;
  IF v_amount IS NULL OR v_amount <= 0 OR v_key IS NULL THEN RAISE EXCEPTION 'A positive repayment amount and idempotency key are required.' USING ERRCODE = '22023'; END IF;
  IF EXISTS (SELECT 1 FROM public.bank_loan_repayments WHERE company_id=public.current_company_id() AND idempotency_key=v_key) THEN RETURN (SELECT jsonb_build_object('repaymentId',id,'repaymentNumber',repayment_number,'status',status,'replayed',true) FROM public.bank_loan_repayments WHERE company_id=public.current_company_id() AND idempotency_key=v_key LIMIT 1); END IF;
  SELECT * INTO v_loan FROM public.bank_loans WHERE id=(p_payload->>'loanId')::uuid AND company_id=public.current_company_id() FOR UPDATE;
  IF NOT FOUND OR v_loan.status NOT IN ('ACTIVE','ARREARS','RESTRUCTURED') THEN RAISE EXCEPTION 'Loan is not open for repayment.' USING ERRCODE = '40901'; END IF;
  v_penalty := least(v_amount,v_loan.outstanding_penalties); v_amount := v_amount-v_penalty;
  v_fee := least(v_amount,v_loan.outstanding_fees); v_amount := v_amount-v_fee;
  v_interest := least(v_amount,v_loan.outstanding_interest); v_amount := v_amount-v_interest;
  v_principal := least(v_amount,v_loan.outstanding_principal);
  v_number := 'RP-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
  INSERT INTO public.bank_loan_repayments(company_id,repayment_number,loan_id,account_id,amount,principal_amount,interest_amount,fee_amount,penalty_amount,channel,status,idempotency_key,posted_by) VALUES (public.current_company_id(),v_number,v_loan.id,nullif(p_payload->>'accountId','')::uuid,(p_payload->>'amount')::numeric,v_principal,v_interest,v_fee,v_penalty,upper(coalesce(p_payload->>'channel','CASH')),'POSTED',v_key,auth.uid()) RETURNING id INTO v_repay;
  UPDATE public.bank_loans SET outstanding_principal=greatest(0,outstanding_principal-v_principal), outstanding_interest=greatest(0,outstanding_interest-v_interest), outstanding_fees=greatest(0,outstanding_fees-v_fee), outstanding_penalties=greatest(0,outstanding_penalties-v_penalty), status=CASE WHEN outstanding_principal-v_principal <= 0.01 THEN 'CLOSED' ELSE status END, updated_at=now() WHERE id=v_loan.id;
  PERFORM public.bank_audit('LOAN_REPAYMENT_POSTED','loan_repayment',v_repay,'SUCCESS',jsonb_build_object('loanId',v_loan.id,'amount',(p_payload->>'amount')::numeric));
  RETURN jsonb_build_object('repaymentId',v_repay,'repaymentNumber',v_number,'status','POSTED','replayed',false);
END;
$$;

-- ---------------------------------------------------------------------------
-- Operational workflows beyond the core account/loan lifecycle
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.bank_add_beneficiary(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Customer Service','Teller','Admin']) THEN RAISE EXCEPTION 'You are not authorized to add beneficiaries.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE id=(p_payload->>'accountId')::uuid AND company_id=public.current_company_id()) THEN RAISE EXCEPTION 'Source account is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_account_beneficiaries(company_id,customer_id,account_id,beneficiary_name,beneficiary_account_number,bank_name,phone,status)
  VALUES (public.current_company_id(),(p_payload->>'customerId')::uuid,(p_payload->>'accountId')::uuid,p_payload->>'beneficiaryName',p_payload->>'beneficiaryAccountNumber',p_payload->>'bankName',p_payload->>'phone','PENDING') RETURNING id INTO v_id;
  PERFORM public.bank_audit('BENEFICIARY_CREATED','beneficiary',v_id,'SUCCESS',p_payload - 'phone');
  RETURN jsonb_build_object('beneficiaryId',v_id,'status','PENDING');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_create_payment_instruction(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_number text := 'PI-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'); v_key text := p_payload->>'idempotencyKey';
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Teller','Cashier','Finance Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to create payment instructions.' USING ERRCODE = '42501'; END IF;
  IF v_key IS NULL OR length(v_key) < 12 THEN RAISE EXCEPTION 'Payment instructions require an idempotency key.' USING ERRCODE = '22023'; END IF;
  INSERT INTO public.bank_payment_instructions(company_id,instruction_number,payment_type,channel,source_account_id,destination_account_id,amount,currency,provider,msisdn,status,idempotency_key,data)
  VALUES (public.current_company_id(),v_number,coalesce(p_payload->>'paymentType','TRANSFER'),upper(coalesce(p_payload->>'channel','MOBILE_MONEY')),nullif(p_payload->>'sourceAccountId','')::uuid,nullif(p_payload->>'destinationAccountId','')::uuid,(p_payload->>'amount')::numeric,coalesce(p_payload->>'currency','TZS'),p_payload->>'provider',p_payload->>'msisdn','INITIATED',v_key,coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('PAYMENT_INSTRUCTION_CREATED','payment_instruction',v_id,'SUCCESS',jsonb_build_object('channel',upper(coalesce(p_payload->>'channel','MOBILE_MONEY')),'status','INITIATED'));
  RETURN jsonb_build_object('instructionId',v_id,'instructionNumber',v_number,'status','INITIATED');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_create_standing_order(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_number text := 'SO-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Customer Service','Teller','Admin']) THEN RAISE EXCEPTION 'You are not authorized to create standing orders.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_accounts WHERE id=(p_payload->>'sourceAccountId')::uuid AND company_id=public.current_company_id()) THEN RAISE EXCEPTION 'Source account is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_standing_orders(company_id,order_number,source_account_id,destination_account_id,destination_msisdn,amount,frequency,next_run_date,end_date,data)
  VALUES (public.current_company_id(),v_number,(p_payload->>'sourceAccountId')::uuid,nullif(p_payload->>'destinationAccountId','')::uuid,nullif(p_payload->>'destinationMsisdn',''),(p_payload->>'amount')::numeric,upper(coalesce(p_payload->>'frequency','MONTHLY')),(p_payload->>'nextRunDate')::date,nullif(p_payload->>'endDate','')::date,coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('STANDING_ORDER_CREATED','standing_order',v_id,'SUCCESS',jsonb_build_object('frequency',upper(coalesce(p_payload->>'frequency','MONTHLY'))));
  RETURN jsonb_build_object('standingOrderId',v_id,'orderNumber',v_number,'status','ACTIVE');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_create_group(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_number text := 'GRP-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Credit Officer','Customer Service','Admin']) THEN RAISE EXCEPTION 'You are not authorized to create groups.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_groups(company_id,group_number,name,group_type,meeting_frequency,branch_id,data)
  VALUES (public.current_company_id(),v_number,p_payload->>'name',coalesce(p_payload->>'groupType','VICOBA'),p_payload->>'meetingFrequency',nullif(p_payload->>'branchId','')::uuid,coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('GROUP_CREATED','group',v_id,'SUCCESS',jsonb_build_object('groupNumber',v_number));
  RETURN jsonb_build_object('groupId',v_id,'groupNumber',v_number);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_add_group_member(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Credit Officer','Customer Service','Admin']) THEN RAISE EXCEPTION 'You are not authorized to add group members.' USING ERRCODE = '42501'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.bank_groups WHERE id=(p_payload->>'groupId')::uuid AND company_id=public.current_company_id()) OR NOT EXISTS (SELECT 1 FROM public.bank_customers WHERE id=(p_payload->>'customerId')::uuid AND company_id=public.current_company_id()) THEN RAISE EXCEPTION 'Group and customer must belong to the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_group_members(company_id,group_id,customer_id,role,shares_count,status) VALUES (public.current_company_id(),(p_payload->>'groupId')::uuid,(p_payload->>'customerId')::uuid,coalesce(p_payload->>'role','MEMBER'),coalesce((p_payload->>'sharesCount')::integer,0),'ACTIVE') RETURNING id INTO v_id;
  PERFORM public.bank_audit('GROUP_MEMBER_ADDED','group_member',v_id,'SUCCESS',p_payload - 'customerId');
  RETURN jsonb_build_object('groupMemberId',v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_create_reconciliation(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_number text := 'REC-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS'); v_statement numeric(20,2) := coalesce((p_payload->>'statementBalance')::numeric,0); v_ledger numeric(20,2);
BEGIN
  IF NOT public.bank_has_role(ARRAY['Finance Manager','CFO','Bank Manager','Branch Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to create reconciliations.' USING ERRCODE = '42501'; END IF;
  SELECT ledger_balance INTO v_ledger FROM public.bank_accounts WHERE id=nullif(p_payload->>'accountId','')::uuid AND company_id=public.current_company_id();
  INSERT INTO public.bank_reconciliations(company_id,reconciliation_number,account_id,period_start,period_end,statement_balance,ledger_balance,difference,notes)
  VALUES (public.current_company_id(),v_number,nullif(p_payload->>'accountId','')::uuid,(p_payload->>'periodStart')::date,(p_payload->>'periodEnd')::date,v_statement,coalesce(v_ledger,0),v_statement-coalesce(v_ledger,0),p_payload->>'notes') RETURNING id INTO v_id;
  PERFORM public.bank_audit('RECONCILIATION_CREATED','reconciliation',v_id,'SUCCESS',jsonb_build_object('difference',v_statement-coalesce(v_ledger,0)));
  RETURN jsonb_build_object('reconciliationId',v_id,'reconciliationNumber',v_number,'difference',v_statement-coalesce(v_ledger,0));
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_create_aml_alert(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_number text := 'AML-' || to_char(clock_timestamp(),'YYYYMMDDHH24MISSMS');
BEGIN
  IF NOT public.bank_has_role(ARRAY['Compliance Officer','MLRO','Bank Manager','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to create AML alerts.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_aml_alerts(company_id,alert_number,customer_id,transaction_id,rule_code,risk_level,status,rationale,data)
  VALUES (public.current_company_id(),v_number,nullif(p_payload->>'customerId','')::uuid,nullif(p_payload->>'transactionId','')::uuid,coalesce(p_payload->>'ruleCode','MANUAL_REVIEW'),coalesce(p_payload->>'riskLevel','MEDIUM'),'OPEN',coalesce(p_payload->>'rationale','Manual compliance review'),coalesce(p_payload->'data','{}'::jsonb)) RETURNING id INTO v_id;
  PERFORM public.bank_audit('AML_ALERT_CREATED','aml_alert',v_id,'SUCCESS',jsonb_build_object('riskLevel',coalesce(p_payload->>'riskLevel','MEDIUM'),'ruleCode',coalesce(p_payload->>'ruleCode','MANUAL_REVIEW')));
  RETURN jsonb_build_object('alertId',v_id,'alertNumber',v_number,'status','OPEN');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_resolve_aml_alert(p_alert_id uuid, p_decision text, p_note text DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT public.bank_has_role(ARRAY['Compliance Officer','MLRO','Bank Manager','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to resolve AML alerts.' USING ERRCODE = '42501'; END IF;
  UPDATE public.bank_aml_alerts SET status='CLOSED', mlro_decision=p_decision, closed_at=now(), data=coalesce(data,'{}'::jsonb)||jsonb_build_object('resolutionNote',p_note), updated_at=now() WHERE id=p_alert_id AND company_id=public.current_company_id();
  IF NOT FOUND THEN RAISE EXCEPTION 'AML alert is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  PERFORM public.bank_audit('AML_ALERT_RESOLVED','aml_alert',p_alert_id,'SUCCESS',jsonb_build_object('decision',p_decision));
  RETURN jsonb_build_object('alertId',p_alert_id,'status','CLOSED');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_write_off_loan(p_loan_id uuid, p_note text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF NOT public.bank_has_role(ARRAY['CFO','Bank Manager','Credit Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to write off loans.' USING ERRCODE = '42501'; END IF;
  UPDATE public.bank_loans SET status='WRITTEN_OFF', write_off_at=now(), data=coalesce(data,'{}'::jsonb)||jsonb_build_object('writeOffNote',p_note,'writeOffBy',auth.uid()), updated_at=now() WHERE id=p_loan_id AND company_id=public.current_company_id() AND status NOT IN ('CLOSED','WRITTEN_OFF');
  IF NOT FOUND THEN RAISE EXCEPTION 'Open loan is not in the authenticated workspace.' USING ERRCODE = '42501'; END IF;
  PERFORM public.bank_audit('LOAN_WRITTEN_OFF','loan',p_loan_id,'SUCCESS',jsonb_build_object('note',p_note));
  RETURN jsonb_build_object('loanId',p_loan_id,'status','WRITTEN_OFF');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_restructure_loan(p_loan_id uuid, p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_count integer;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Credit Manager','Bank Manager','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to restructure loans.' USING ERRCODE = '42501'; END IF;
  UPDATE public.bank_loans SET status='RESTRUCTURED', term_months=coalesce((p_payload->>'termMonths')::integer,term_months), annual_interest_rate=coalesce((p_payload->>'annualInterestRate')::numeric,annual_interest_rate), restructure_count=restructure_count+1, data=coalesce(data,'{}'::jsonb)||jsonb_build_object('restructureNote',p_payload->>'note','restructuredBy',auth.uid()), updated_at=now() WHERE id=p_loan_id AND company_id=public.current_company_id() AND status IN ('ACTIVE','ARREARS');
  GET DIAGNOSTICS v_count = ROW_COUNT;
  IF v_count = 0 THEN RAISE EXCEPTION 'Loan is not eligible for restructuring.' USING ERRCODE = '40901'; END IF;
  PERFORM public.bank_audit('LOAN_RESTRUCTURED','loan',p_loan_id,'SUCCESS',p_payload - 'customerId');
  RETURN jsonb_build_object('loanId',p_loan_id,'status','RESTRUCTURED');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_move_cash(p_payload jsonb)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_id uuid; v_key text := p_payload->>'idempotencyKey';
BEGIN
  IF NOT public.bank_has_role(ARRAY['Teller','Branch Manager','Bank Manager','Finance Manager','Admin']) THEN RAISE EXCEPTION 'You are not authorized to move branch cash.' USING ERRCODE = '42501'; END IF;
  INSERT INTO public.bank_cash_movements(company_id,teller_id,branch_id,movement_type,amount,currency,status,idempotency_key,narration)
  VALUES (public.current_company_id(),nullif(p_payload->>'tellerId','')::uuid,nullif(p_payload->>'branchId','')::uuid,upper(p_payload->>'movementType'),(p_payload->>'amount')::numeric,coalesce(p_payload->>'currency','TZS'),'PENDING',v_key,p_payload->>'narration') RETURNING id INTO v_id;
  PERFORM public.bank_audit('CASH_MOVEMENT_REQUESTED','cash_movement',v_id,'SUCCESS',jsonb_build_object('movementType',upper(p_payload->>'movementType'),'amount',(p_payload->>'amount')::numeric));
  RETURN jsonb_build_object('cashMovementId',v_id,'status','PENDING');
END;
$$;

CREATE OR REPLACE FUNCTION public.bank_run_daily_controls()
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_due integer; v_arrears integer; v_alerts integer;
BEGIN
  IF NOT public.bank_has_role(ARRAY['Bank Manager','Branch Manager','Credit Manager','Compliance Officer','MLRO','CFO','Admin']) THEN RAISE EXCEPTION 'You are not authorized to run daily banking controls.' USING ERRCODE = '42501'; END IF;
  UPDATE public.bank_loan_schedules s SET status='OVERDUE' WHERE s.company_id=public.current_company_id() AND s.due_date < current_date AND s.status IN ('DUE','PARTIAL');
  GET DIAGNOSTICS v_due = ROW_COUNT;
  UPDATE public.bank_loans l
  SET days_past_due = greatest(0, current_date - coalesce((SELECT min(s.due_date) FROM public.bank_loan_schedules s WHERE s.loan_id=l.id AND s.company_id=l.company_id AND s.status='OVERDUE'), current_date)),
      status='ARREARS',
      par_bucket=CASE
        WHEN greatest(0, current_date - coalesce((SELECT min(s.due_date) FROM public.bank_loan_schedules s WHERE s.loan_id=l.id AND s.company_id=l.company_id AND s.status='OVERDUE'), current_date)) >= 90 THEN 'NPL'
        WHEN greatest(0, current_date - coalesce((SELECT min(s.due_date) FROM public.bank_loan_schedules s WHERE s.loan_id=l.id AND s.company_id=l.company_id AND s.status='OVERDUE'), current_date)) > 0 THEN 'PAR'
        ELSE 'CURRENT'
      END,
      updated_at=now()
  WHERE l.company_id=public.current_company_id() AND l.status='ACTIVE' AND (l.days_past_due > 0 OR EXISTS (SELECT 1 FROM public.bank_loan_schedules s WHERE s.loan_id=l.id AND s.company_id=l.company_id AND s.status='OVERDUE'));
  GET DIAGNOSTICS v_arrears = ROW_COUNT;
  SELECT count(*) INTO v_alerts FROM public.bank_aml_alerts WHERE company_id=public.current_company_id() AND status='OPEN';
  PERFORM public.bank_audit('DAILY_CONTROLS_RUN','daily_controls',NULL,'SUCCESS',jsonb_build_object('overdueSchedules',v_due,'loansMovedToArrears',v_arrears,'openAmlAlerts',v_alerts));
  RETURN jsonb_build_object('overdueSchedules',v_due,'loansMovedToArrears',v_arrears,'openAmlAlerts',v_alerts,'runAt',now());
END;
$$;

-- ---------------------------------------------------------------------------
-- RLS for every Bank & MFI table. Reads are tenant-scoped; writes require
-- authenticated tenant membership and privileged role except customer-facing
-- rows that are written through SECURITY DEFINER RPCs.
-- ---------------------------------------------------------------------------
DO $$
DECLARE v_table text;
BEGIN
  FOREACH v_table IN ARRAY ARRAY[
    'bank_institutions','bank_branches','bank_account_types','bank_loan_products','bank_customers','bank_customer_documents','bank_beneficial_owners','bank_accounts','bank_account_beneficiaries','bank_idempotency_keys','bank_journal_batches','bank_journal_lines','bank_transactions','bank_tellers','bank_cash_movements','bank_agents','bank_wallets','bank_payment_instructions','bank_loan_applications','bank_loan_approvals','bank_guarantors','bank_collateral','bank_loans','bank_loan_schedules','bank_loan_repayments','bank_groups','bank_group_members','bank_shares','bank_standing_orders','bank_reconciliations','bank_aml_alerts','bank_audit_events','bank_notifications'
  ] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_tenant_select', v_table);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', v_table || '_tenant_write', v_table);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id())', v_table || '_tenant_select', v_table);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (company_id = public.current_company_id() AND public.bank_is_privileged()) WITH CHECK (company_id = public.current_company_id() AND public.bank_is_privileged())', v_table || '_tenant_write', v_table);
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.bank_create_account_type(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_loan_product(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_setup_institution(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_register_customer(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_update_kyc(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_open_account(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_post_transaction(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_submit_loan_application(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_decide_loan_application(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_disburse_loan(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_record_repayment(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_add_beneficiary(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_payment_instruction(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_standing_order(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_group(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_add_group_member(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_reconciliation(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_create_aml_alert(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_resolve_aml_alert(uuid,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_write_off_loan(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_restructure_loan(uuid,jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_move_cash(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.bank_run_daily_controls() TO authenticated;

COMMIT;
