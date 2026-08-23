-- SMART MANAGER additive POS pricing, tax, promotion, and loyalty slice.
-- Requires 20260824_050_fin_foundation.sql,
-- 20260824_051_fin_journal_core.sql,
-- 20260824_053_pos_register_control.sql,
-- 20260824_054_pos_register_control_hardening.sql, and
-- 20260824_055_pos_sales_returns.sql.
-- This migration creates pricing configuration and sale evidence tables only.
-- It does not change existing sale totals or activate client-side pricing writes.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.pos_tax_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  tax_code text NOT NULL,
  name text NOT NULL,
  tax_type text NOT NULL CHECK (tax_type IN ('VAT', 'Withholding', 'Exempt', 'Zero Rated', 'Other')),
  scope_type text NOT NULL DEFAULT 'All' CHECK (scope_type IN ('All', 'Item')),
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  rate_bps integer NOT NULL CHECK (rate_bps BETWEEN 0 AND 10000),
  calculation_method text NOT NULL DEFAULT 'Exclusive'
    CHECK (calculation_method IN ('Exclusive', 'Inclusive')),
  tax_account_id uuid,
  effective_from date NOT NULL,
  effective_to date,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Active', 'Inactive', 'Expired')),
  approval_request_id uuid,
  requires_approval boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_tax_rules_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_tax_rules_code_unique UNIQUE (company_id, tax_code),
  CONSTRAINT pos_tax_rules_code_not_blank CHECK (length(btrim(tax_code)) > 0),
  CONSTRAINT pos_tax_rules_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT pos_tax_rules_scope_item_check CHECK (
    (scope_type = 'All' AND inventory_item_id IS NULL)
    OR (scope_type = 'Item' AND inventory_item_id IS NOT NULL)
  ),
  CONSTRAINT pos_tax_rules_date_window_check CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT pos_tax_rules_active_approval_check CHECK (status <> 'Active' OR approval_request_id IS NOT NULL)
);

ALTER TABLE public.pos_tax_rules
  DROP CONSTRAINT IF EXISTS pos_tax_rules_approval_company_fkey;
ALTER TABLE public.pos_tax_rules
  ADD CONSTRAINT pos_tax_rules_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_tax_rules
  DROP CONSTRAINT IF EXISTS pos_tax_rules_account_company_fkey;
ALTER TABLE public.pos_tax_rules
  ADD CONSTRAINT pos_tax_rules_account_company_fkey
  FOREIGN KEY (company_id, tax_account_id)
  REFERENCES public.fin_accounts (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_discount_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  discount_code text NOT NULL,
  name text NOT NULL,
  scope_type text NOT NULL DEFAULT 'All' CHECK (scope_type IN ('All', 'Item')),
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  discount_type text NOT NULL CHECK (discount_type IN ('Percentage', 'Flat')),
  value numeric(20,4) NOT NULL CHECK (value >= 0),
  max_discount_amount numeric(20,2) CHECK (max_discount_amount IS NULL OR max_discount_amount >= 0),
  minimum_subtotal numeric(20,2) NOT NULL DEFAULT 0 CHECK (minimum_subtotal >= 0),
  stackable boolean NOT NULL DEFAULT false,
  requires_approval boolean NOT NULL DEFAULT false,
  contra_revenue_account_id uuid,
  effective_from date NOT NULL,
  effective_to date,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Active', 'Inactive', 'Expired')),
  approval_request_id uuid,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_discount_rules_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_discount_rules_code_unique UNIQUE (company_id, discount_code),
  CONSTRAINT pos_discount_rules_code_not_blank CHECK (length(btrim(discount_code)) > 0),
  CONSTRAINT pos_discount_rules_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT pos_discount_rules_scope_item_check CHECK (
    (scope_type = 'All' AND inventory_item_id IS NULL)
    OR (scope_type = 'Item' AND inventory_item_id IS NOT NULL)
  ),
  CONSTRAINT pos_discount_rules_percentage_value_check CHECK (
    (discount_type = 'Percentage' AND value <= 100)
    OR discount_type = 'Flat'
  ),
  CONSTRAINT pos_discount_rules_date_window_check CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT pos_discount_rules_active_approval_check CHECK (status <> 'Active' OR approval_request_id IS NOT NULL)
);

ALTER TABLE public.pos_discount_rules
  DROP CONSTRAINT IF EXISTS pos_discount_rules_approval_company_fkey;
ALTER TABLE public.pos_discount_rules
  ADD CONSTRAINT pos_discount_rules_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_discount_rules
  DROP CONSTRAINT IF EXISTS pos_discount_rules_account_company_fkey;
ALTER TABLE public.pos_discount_rules
  ADD CONSTRAINT pos_discount_rules_account_company_fkey
  FOREIGN KEY (company_id, contra_revenue_account_id)
  REFERENCES public.fin_accounts (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_promotions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  promotion_code text NOT NULL,
  name text NOT NULL,
  trigger_type text NOT NULL
    CHECK (trigger_type IN ('Spend Threshold', 'Quantity Threshold', 'Buy X Get Y', 'Bundle', 'Always')),
  benefit_type text NOT NULL
    CHECK (benefit_type IN ('Percentage Off', 'Flat Off', 'Fixed Reward Price', 'Free Item', 'Points Multiplier')),
  minimum_spend numeric(20,2) NOT NULL DEFAULT 0 CHECK (minimum_spend >= 0),
  minimum_quantity numeric(20,3) NOT NULL DEFAULT 0 CHECK (minimum_quantity >= 0),
  benefit_value numeric(20,4) NOT NULL DEFAULT 0 CHECK (benefit_value >= 0),
  reward_quantity numeric(20,3) NOT NULL DEFAULT 0 CHECK (reward_quantity >= 0),
  points_multiplier_bps integer CHECK (points_multiplier_bps IS NULL OR points_multiplier_bps BETWEEN 0 AND 100000),
  stackable boolean NOT NULL DEFAULT false,
  priority integer NOT NULL DEFAULT 100 CHECK (priority >= 0),
  customer_limit integer CHECK (customer_limit IS NULL OR customer_limit > 0),
  daily_limit integer CHECK (daily_limit IS NULL OR daily_limit > 0),
  effective_from date NOT NULL,
  effective_to date,
  status text NOT NULL DEFAULT 'Draft'
    CHECK (status IN ('Draft', 'Active', 'Inactive', 'Expired')),
  approval_request_id uuid,
  requires_approval boolean NOT NULL DEFAULT true,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_promotions_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_promotions_code_unique UNIQUE (company_id, promotion_code),
  CONSTRAINT pos_promotions_code_not_blank CHECK (length(btrim(promotion_code)) > 0),
  CONSTRAINT pos_promotions_name_not_blank CHECK (length(btrim(name)) > 0),
  CONSTRAINT pos_promotions_date_window_check CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT pos_promotions_active_approval_check CHECK (status <> 'Active' OR approval_request_id IS NOT NULL),
  CONSTRAINT pos_promotions_benefit_check CHECK (
    (benefit_type = 'Points Multiplier' AND points_multiplier_bps IS NOT NULL)
    OR (benefit_type <> 'Points Multiplier' AND benefit_value >= 0)
  )
);

CREATE TABLE IF NOT EXISTS public.pos_promotion_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  promotion_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  item_role text NOT NULL CHECK (item_role IN ('Qualifying', 'Reward', 'Bundle')),
  required_quantity numeric(20,3) NOT NULL DEFAULT 1 CHECK (required_quantity > 0),
  reward_price numeric(20,2) CHECK (reward_price IS NULL OR reward_price >= 0),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_promotion_items_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_promotion_items_unique UNIQUE (company_id, promotion_id, inventory_item_id, item_role)
);

ALTER TABLE public.pos_promotions
  DROP CONSTRAINT IF EXISTS pos_promotions_approval_company_fkey;
ALTER TABLE public.pos_promotions
  ADD CONSTRAINT pos_promotions_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_promotions
  DROP CONSTRAINT IF EXISTS pos_promotion_items_promotion_company_fkey;
ALTER TABLE public.pos_promotion_items
  ADD CONSTRAINT pos_promotion_items_promotion_company_fkey
  FOREIGN KEY (company_id, promotion_id)
  REFERENCES public.pos_promotions (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_sale_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  sale_id uuid NOT NULL,
  sale_line_id uuid,
  adjustment_no integer NOT NULL CHECK (adjustment_no > 0),
  adjustment_type text NOT NULL CHECK (adjustment_type IN ('Discount', 'Promotion', 'Tax')),
  tax_rule_id uuid,
  discount_rule_id uuid,
  promotion_id uuid,
  base_amount numeric(20,2) NOT NULL CHECK (base_amount >= 0),
  rate_bps integer CHECK (rate_bps IS NULL OR rate_bps BETWEEN 0 AND 100000),
  amount numeric(20,2) NOT NULL CHECK (amount >= 0),
  status text NOT NULL DEFAULT 'Pending Approval'
    CHECK (status IN ('Pending Approval', 'Applied', 'Reversed')),
  approval_request_id uuid,
  journal_batch_id uuid,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  applied_at timestamptz,
  applied_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_sale_adjustments_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_sale_adjustments_sale_no_unique UNIQUE (company_id, sale_id, adjustment_no),
  CONSTRAINT pos_sale_adjustments_idempotency_unique UNIQUE (company_id, idempotency_key),
  CONSTRAINT pos_sale_adjustments_one_rule_check CHECK (
    ((adjustment_type = 'Tax') AND tax_rule_id IS NOT NULL AND discount_rule_id IS NULL AND promotion_id IS NULL)
    OR ((adjustment_type = 'Discount') AND tax_rule_id IS NULL AND discount_rule_id IS NOT NULL AND promotion_id IS NULL)
    OR ((adjustment_type = 'Promotion') AND tax_rule_id IS NULL AND discount_rule_id IS NULL AND promotion_id IS NOT NULL)
  ),
  CONSTRAINT pos_sale_adjustments_posted_evidence_check CHECK (
    status <> 'Applied' OR (applied_at IS NOT NULL AND applied_by IS NOT NULL)
  ),
  CONSTRAINT pos_sale_adjustments_reversed_evidence_check CHECK (
    status <> 'Reversed' OR journal_batch_id IS NOT NULL
  ),
  CONSTRAINT pos_sale_adjustments_approval_check CHECK (
    status <> 'Pending Approval' OR approval_request_id IS NOT NULL
  )
);

ALTER TABLE public.pos_sale_adjustments
  DROP CONSTRAINT IF EXISTS pos_sale_adjustments_sale_company_fkey;
ALTER TABLE public.pos_sale_adjustments
  ADD CONSTRAINT pos_sale_adjustments_sale_company_fkey
  FOREIGN KEY (company_id, sale_id)
  REFERENCES public.pos_sale_headers (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_adjustments
  DROP CONSTRAINT IF EXISTS pos_sale_adjustments_line_company_fkey;
ALTER TABLE public.pos_sale_adjustments
  ADD CONSTRAINT pos_sale_adjustments_line_company_fkey
  FOREIGN KEY (company_id, sale_line_id)
  REFERENCES public.pos_sale_lines (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_adjustments
  DROP CONSTRAINT IF EXISTS pos_sale_adjustments_tax_company_fkey;
ALTER TABLE public.pos_sale_adjustments
  ADD CONSTRAINT pos_sale_adjustments_tax_company_fkey
  FOREIGN KEY (company_id, tax_rule_id)
  REFERENCES public.pos_tax_rules (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_adjustments
  DROP CONSTRAINT IF EXISTS pos_sale_adjustments_discount_company_fkey;
ALTER TABLE public.pos_sale_adjustments
  ADD CONSTRAINT pos_sale_adjustments_discount_company_fkey
  FOREIGN KEY (company_id, discount_rule_id)
  REFERENCES public.pos_discount_rules (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_adjustments
  DROP CONSTRAINT IF EXISTS pos_sale_adjustments_promotion_company_fkey;
ALTER TABLE public.pos_sale_adjustments
  ADD CONSTRAINT pos_sale_adjustments_promotion_company_fkey
  FOREIGN KEY (company_id, promotion_id)
  REFERENCES public.pos_promotions (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_adjustments
  DROP CONSTRAINT IF EXISTS pos_sale_adjustments_approval_company_fkey;
ALTER TABLE public.pos_sale_adjustments
  ADD CONSTRAINT pos_sale_adjustments_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_adjustments
  DROP CONSTRAINT IF EXISTS pos_sale_adjustments_journal_company_fkey;
ALTER TABLE public.pos_sale_adjustments
  ADD CONSTRAINT pos_sale_adjustments_journal_company_fkey
  FOREIGN KEY (company_id, journal_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_sale_tax_lines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  sale_id uuid NOT NULL,
  sale_line_id uuid,
  tax_rule_id uuid NOT NULL,
  taxable_amount numeric(20,2) NOT NULL CHECK (taxable_amount >= 0),
  rate_bps integer NOT NULL CHECK (rate_bps BETWEEN 0 AND 10000),
  tax_amount numeric(20,2) NOT NULL CHECK (tax_amount >= 0),
  included_in_price boolean NOT NULL DEFAULT false,
  status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Applied', 'Reversed')),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_sale_tax_lines_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_sale_tax_lines_unique UNIQUE (company_id, sale_id, sale_line_id, tax_rule_id)
);

ALTER TABLE public.pos_sale_tax_lines
  DROP CONSTRAINT IF EXISTS pos_sale_tax_lines_sale_company_fkey;
ALTER TABLE public.pos_sale_tax_lines
  ADD CONSTRAINT pos_sale_tax_lines_sale_company_fkey
  FOREIGN KEY (company_id, sale_id)
  REFERENCES public.pos_sale_headers (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_tax_lines
  DROP CONSTRAINT IF EXISTS pos_sale_tax_lines_line_company_fkey;
ALTER TABLE public.pos_sale_tax_lines
  ADD CONSTRAINT pos_sale_tax_lines_line_company_fkey
  FOREIGN KEY (company_id, sale_line_id)
  REFERENCES public.pos_sale_lines (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_sale_tax_lines
  DROP CONSTRAINT IF EXISTS pos_sale_tax_lines_rule_company_fkey;
ALTER TABLE public.pos_sale_tax_lines
  ADD CONSTRAINT pos_sale_tax_lines_rule_company_fkey
  FOREIGN KEY (company_id, tax_rule_id)
  REFERENCES public.pos_tax_rules (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_loyalty_programs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  program_code text NOT NULL,
  name text NOT NULL,
  earn_points_per_100_tzs numeric(12,4) NOT NULL DEFAULT 1 CHECK (earn_points_per_100_tzs >= 0),
  redemption_tzs_per_point numeric(12,4) NOT NULL DEFAULT 1 CHECK (redemption_tzs_per_point > 0),
  minimum_redeem_points numeric(20,4) NOT NULL DEFAULT 1 CHECK (minimum_redeem_points > 0),
  expiry_days integer CHECK (expiry_days IS NULL OR expiry_days > 0),
  points_liability_account_id uuid,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Inactive')),
  approval_request_id uuid,
  effective_from date NOT NULL,
  effective_to date,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_loyalty_programs_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_loyalty_programs_code_unique UNIQUE (company_id, program_code),
  CONSTRAINT pos_loyalty_programs_code_not_blank CHECK (length(btrim(program_code)) > 0),
  CONSTRAINT pos_loyalty_programs_date_window_check CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT pos_loyalty_programs_active_approval_check CHECK (status <> 'Active' OR approval_request_id IS NOT NULL)
);

ALTER TABLE public.pos_loyalty_programs
  DROP CONSTRAINT IF EXISTS pos_loyalty_programs_approval_company_fkey;
ALTER TABLE public.pos_loyalty_programs
  ADD CONSTRAINT pos_loyalty_programs_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_loyalty_programs
  DROP CONSTRAINT IF EXISTS pos_loyalty_programs_account_company_fkey;
ALTER TABLE public.pos_loyalty_programs
  ADD CONSTRAINT pos_loyalty_programs_account_company_fkey
  FOREIGN KEY (company_id, points_liability_account_id)
  REFERENCES public.fin_accounts (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_loyalty_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  program_id uuid NOT NULL,
  customer_id uuid NOT NULL REFERENCES public.crm_contacts(id) ON DELETE RESTRICT,
  member_number text NOT NULL,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Pending', 'Active', 'Suspended', 'Closed')),
  points_balance numeric(20,4) NOT NULL DEFAULT 0 CHECK (points_balance >= 0),
  lifetime_earned numeric(20,4) NOT NULL DEFAULT 0 CHECK (lifetime_earned >= 0),
  lifetime_redeemed numeric(20,4) NOT NULL DEFAULT 0 CHECK (lifetime_redeemed >= 0),
  joined_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_loyalty_members_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_loyalty_members_number_unique UNIQUE (company_id, member_number),
  CONSTRAINT pos_loyalty_members_program_customer_unique UNIQUE (company_id, program_id, customer_id)
);

ALTER TABLE public.pos_loyalty_members
  DROP CONSTRAINT IF EXISTS pos_loyalty_members_program_company_fkey;
ALTER TABLE public.pos_loyalty_members
  ADD CONSTRAINT pos_loyalty_members_program_company_fkey
  FOREIGN KEY (company_id, program_id)
  REFERENCES public.pos_loyalty_programs (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_loyalty_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  member_id uuid NOT NULL,
  entry_type text NOT NULL CHECK (entry_type IN ('Earn', 'Redeem', 'Expire', 'Adjust', 'Reverse')),
  points_delta numeric(20,4) NOT NULL CHECK (points_delta <> 0),
  points_balance_after numeric(20,4) NOT NULL CHECK (points_balance_after >= 0),
  sale_id uuid,
  redemption_id uuid,
  idempotency_key text NOT NULL,
  reference text,
  status text NOT NULL DEFAULT 'Posted' CHECK (status IN ('Pending', 'Posted', 'Reversed')),
  occurred_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_loyalty_ledger_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_loyalty_ledger_idempotency_unique UNIQUE (company_id, idempotency_key),
  CONSTRAINT pos_loyalty_ledger_posted_balance_check CHECK (status <> 'Posted' OR points_balance_after >= 0)
);

ALTER TABLE public.pos_loyalty_ledger
  DROP CONSTRAINT IF EXISTS pos_loyalty_ledger_member_company_fkey;
ALTER TABLE public.pos_loyalty_ledger
  ADD CONSTRAINT pos_loyalty_ledger_member_company_fkey
  FOREIGN KEY (company_id, member_id)
  REFERENCES public.pos_loyalty_members (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_loyalty_ledger
  DROP CONSTRAINT IF EXISTS pos_loyalty_ledger_sale_company_fkey;
ALTER TABLE public.pos_loyalty_ledger
  ADD CONSTRAINT pos_loyalty_ledger_sale_company_fkey
  FOREIGN KEY (company_id, sale_id)
  REFERENCES public.pos_sale_headers (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_loyalty_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  program_id uuid NOT NULL,
  reward_code text NOT NULL,
  name text NOT NULL,
  points_cost numeric(20,4) NOT NULL CHECK (points_cost > 0),
  cash_value numeric(20,2) NOT NULL DEFAULT 0 CHECK (cash_value >= 0),
  inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Active', 'Inactive')),
  approval_request_id uuid,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_loyalty_rewards_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_loyalty_rewards_code_unique UNIQUE (company_id, program_id, reward_code),
  CONSTRAINT pos_loyalty_rewards_active_approval_check CHECK (status <> 'Active' OR approval_request_id IS NOT NULL)
);

ALTER TABLE public.pos_loyalty_rewards
  DROP CONSTRAINT IF EXISTS pos_loyalty_rewards_approval_company_fkey;
ALTER TABLE public.pos_loyalty_rewards
  ADD CONSTRAINT pos_loyalty_rewards_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_loyalty_rewards
  DROP CONSTRAINT IF EXISTS pos_loyalty_rewards_program_company_fkey;
ALTER TABLE public.pos_loyalty_rewards
  ADD CONSTRAINT pos_loyalty_rewards_program_company_fkey
  FOREIGN KEY (company_id, program_id)
  REFERENCES public.pos_loyalty_programs (company_id, id)
  ON DELETE RESTRICT;

CREATE TABLE IF NOT EXISTS public.pos_loyalty_redemptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id()
    REFERENCES public.companies(id) ON DELETE RESTRICT,
  member_id uuid NOT NULL,
  reward_id uuid NOT NULL,
  sale_id uuid,
  points_spent numeric(20,4) NOT NULL CHECK (points_spent > 0),
  cash_value numeric(20,2) NOT NULL DEFAULT 0 CHECK (cash_value >= 0),
  status text NOT NULL DEFAULT 'Pending Approval'
    CHECK (status IN ('Pending Approval', 'Approved', 'Applied', 'Cancelled', 'Reversed')),
  approval_request_id uuid,
  journal_batch_id uuid,
  idempotency_key text NOT NULL,
  request_hash text NOT NULL,
  applied_at timestamptz,
  applied_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_by uuid NOT NULL DEFAULT auth.uid()
    REFERENCES public.profiles(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES public.profiles(id) ON DELETE RESTRICT,
  updated_at timestamptz NOT NULL DEFAULT now(),
  version bigint NOT NULL DEFAULT 0 CHECK (version >= 0),
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT pos_loyalty_redemptions_company_id_unique UNIQUE (company_id, id),
  CONSTRAINT pos_loyalty_redemptions_idempotency_unique UNIQUE (company_id, idempotency_key),
  CONSTRAINT pos_loyalty_redemptions_approval_check CHECK (
    status NOT IN ('Pending Approval', 'Approved', 'Applied') OR approval_request_id IS NOT NULL
  ),
  CONSTRAINT pos_loyalty_redemptions_applied_evidence_check CHECK (
    status <> 'Applied' OR (applied_at IS NOT NULL AND applied_by IS NOT NULL)
  ),
  CONSTRAINT pos_loyalty_redemptions_reversed_evidence_check CHECK (
    status <> 'Reversed' OR journal_batch_id IS NOT NULL
  )
);

ALTER TABLE public.pos_loyalty_redemptions
  DROP CONSTRAINT IF EXISTS pos_loyalty_redemptions_member_company_fkey;
ALTER TABLE public.pos_loyalty_redemptions
  ADD CONSTRAINT pos_loyalty_redemptions_member_company_fkey
  FOREIGN KEY (company_id, member_id)
  REFERENCES public.pos_loyalty_members (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_loyalty_redemptions
  DROP CONSTRAINT IF EXISTS pos_loyalty_redemptions_reward_company_fkey;
ALTER TABLE public.pos_loyalty_redemptions
  ADD CONSTRAINT pos_loyalty_redemptions_reward_company_fkey
  FOREIGN KEY (company_id, reward_id)
  REFERENCES public.pos_loyalty_rewards (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_loyalty_redemptions
  DROP CONSTRAINT IF EXISTS pos_loyalty_redemptions_sale_company_fkey;
ALTER TABLE public.pos_loyalty_redemptions
  ADD CONSTRAINT pos_loyalty_redemptions_sale_company_fkey
  FOREIGN KEY (company_id, sale_id)
  REFERENCES public.pos_sale_headers (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_loyalty_redemptions
  DROP CONSTRAINT IF EXISTS pos_loyalty_redemptions_approval_company_fkey;
ALTER TABLE public.pos_loyalty_redemptions
  ADD CONSTRAINT pos_loyalty_redemptions_approval_company_fkey
  FOREIGN KEY (company_id, approval_request_id)
  REFERENCES public.fin_approval_requests (company_id, id)
  ON DELETE RESTRICT;
ALTER TABLE public.pos_loyalty_redemptions
  DROP CONSTRAINT IF EXISTS pos_loyalty_redemptions_journal_company_fkey;
ALTER TABLE public.pos_loyalty_redemptions
  ADD CONSTRAINT pos_loyalty_redemptions_journal_company_fkey
  FOREIGN KEY (company_id, journal_batch_id)
  REFERENCES public.fin_journal_batches (company_id, id)
  ON DELETE RESTRICT;

CREATE INDEX IF NOT EXISTS pos_tax_rules_effective_status_idx
  ON public.pos_tax_rules (company_id, status, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS pos_tax_rules_item_idx
  ON public.pos_tax_rules (company_id, inventory_item_id, status);
CREATE INDEX IF NOT EXISTS pos_discount_rules_effective_status_idx
  ON public.pos_discount_rules (company_id, status, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS pos_discount_rules_item_idx
  ON public.pos_discount_rules (company_id, inventory_item_id, status);
CREATE INDEX IF NOT EXISTS pos_promotions_effective_status_priority_idx
  ON public.pos_promotions (company_id, status, effective_from, effective_to, priority);
CREATE INDEX IF NOT EXISTS pos_promotion_items_inventory_idx
  ON public.pos_promotion_items (company_id, inventory_item_id, item_role);
CREATE INDEX IF NOT EXISTS pos_sale_adjustments_sale_idx
  ON public.pos_sale_adjustments (company_id, sale_id, sale_line_id, adjustment_type);
CREATE INDEX IF NOT EXISTS pos_sale_adjustments_rule_idx
  ON public.pos_sale_adjustments (company_id, tax_rule_id, discount_rule_id, promotion_id);
CREATE INDEX IF NOT EXISTS pos_sale_tax_lines_sale_idx
  ON public.pos_sale_tax_lines (company_id, sale_id, sale_line_id);
CREATE INDEX IF NOT EXISTS pos_loyalty_members_customer_idx
  ON public.pos_loyalty_members (company_id, customer_id, status);
CREATE INDEX IF NOT EXISTS pos_loyalty_ledger_member_time_idx
  ON public.pos_loyalty_ledger (company_id, member_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS pos_loyalty_ledger_sale_idx
  ON public.pos_loyalty_ledger (company_id, sale_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS pos_loyalty_redemptions_member_status_idx
  ON public.pos_loyalty_redemptions (company_id, member_id, status, created_at DESC);

CREATE OR REPLACE FUNCTION public.pos_pricing_scope_assert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF TG_TABLE_NAME IN ('pos_tax_rules', 'pos_discount_rules')
     AND NEW.inventory_item_id IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM public.inventory_items i
       WHERE i.id = NEW.inventory_item_id AND i.company_id = NEW.company_id
     ) THEN
    RAISE EXCEPTION 'POS pricing item does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  IF TG_TABLE_NAME = 'pos_promotion_items'
     AND NOT EXISTS (
       SELECT 1 FROM public.inventory_items i
       WHERE i.id = NEW.inventory_item_id AND i.company_id = NEW.company_id
     ) THEN
    RAISE EXCEPTION 'POS promotion item does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  IF TG_TABLE_NAME = 'pos_loyalty_members'
     AND NOT EXISTS (
       SELECT 1 FROM public.crm_contacts c
       WHERE c.id = NEW.customer_id AND c.company_id = NEW.company_id
     ) THEN
    RAISE EXCEPTION 'POS loyalty customer does not belong to this workspace.' USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pos_tax_rules_scope_assert ON public.pos_tax_rules;
CREATE TRIGGER pos_tax_rules_scope_assert
BEFORE INSERT OR UPDATE ON public.pos_tax_rules
FOR EACH ROW EXECUTE FUNCTION public.pos_pricing_scope_assert();
DROP TRIGGER IF EXISTS pos_discount_rules_scope_assert ON public.pos_discount_rules;
CREATE TRIGGER pos_discount_rules_scope_assert
BEFORE INSERT OR UPDATE ON public.pos_discount_rules
FOR EACH ROW EXECUTE FUNCTION public.pos_pricing_scope_assert();
DROP TRIGGER IF EXISTS pos_promotion_items_scope_assert ON public.pos_promotion_items;
CREATE TRIGGER pos_promotion_items_scope_assert
BEFORE INSERT OR UPDATE ON public.pos_promotion_items
FOR EACH ROW EXECUTE FUNCTION public.pos_pricing_scope_assert();
DROP TRIGGER IF EXISTS pos_loyalty_members_scope_assert ON public.pos_loyalty_members;
CREATE TRIGGER pos_loyalty_members_scope_assert
BEFORE INSERT OR UPDATE ON public.pos_loyalty_members
FOR EACH ROW EXECUTE FUNCTION public.pos_pricing_scope_assert();

CREATE OR REPLACE FUNCTION public.pos_pricing_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'pos_tax_rules', 'pos_discount_rules', 'pos_promotions', 'pos_promotion_items',
    'pos_sale_adjustments', 'pos_sale_tax_lines', 'pos_loyalty_programs',
    'pos_loyalty_members', 'pos_loyalty_ledger', 'pos_loyalty_rewards',
    'pos_loyalty_redemptions'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.pos_pricing_touch_updated_at()', t || '_touch_updated_at', t);
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_select', t);
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
      t || '_tenant_select', t
    );
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.pos_pricing_scope_assert() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.pos_pricing_touch_updated_at() FROM PUBLIC;

COMMIT;
