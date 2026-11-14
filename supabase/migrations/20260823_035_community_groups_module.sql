-- Community Groups Module: Tanzania-ready cooperative, chama, VICOBA and MFI group operations.
-- All business amounts are stored in TZS by default and all rows are tenant-scoped.
BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.community_groups_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE IF NOT EXISTS public.community_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_number text NOT NULL DEFAULT ('CG-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  name text NOT NULL,
  group_type text NOT NULL DEFAULT 'Chama',
  registration_number text,
  description text,
  country text NOT NULL DEFAULT 'Tanzania',
  region text,
  district text,
  ward text,
  village text,
  meeting_frequency text NOT NULL DEFAULT 'Monthly',
  contribution_frequency text NOT NULL DEFAULT 'Monthly',
  contribution_amount numeric(18,2) NOT NULL DEFAULT 0 CHECK (contribution_amount >= 0),
  currency text NOT NULL DEFAULT 'TZS',
  rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'Active' CHECK (status IN ('Draft','Active','Suspended','Closed')),
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, group_number)
);

-- The baseline application already contains a generic community_groups envelope.
-- Keep that table and add the typed fields required by this module.
ALTER TABLE public.community_groups
  ADD COLUMN IF NOT EXISTS group_number text,
  ADD COLUMN IF NOT EXISTS group_type text DEFAULT 'Chama',
  ADD COLUMN IF NOT EXISTS registration_number text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'Tanzania',
  ADD COLUMN IF NOT EXISTS region text,
  ADD COLUMN IF NOT EXISTS district text,
  ADD COLUMN IF NOT EXISTS ward text,
  ADD COLUMN IF NOT EXISTS village text,
  ADD COLUMN IF NOT EXISTS meeting_frequency text DEFAULT 'Monthly',
  ADD COLUMN IF NOT EXISTS contribution_frequency text DEFAULT 'Monthly',
  ADD COLUMN IF NOT EXISTS contribution_amount numeric(18,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text DEFAULT 'TZS',
  ADD COLUMN IF NOT EXISTS rules jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS created_by uuid DEFAULT auth.uid();
UPDATE public.community_groups SET group_type = COALESCE(group_type, data->>'type', 'Chama'), country = COALESCE(country, 'Tanzania'), currency = COALESCE(currency, 'TZS'), meeting_frequency = COALESCE(meeting_frequency, 'Monthly'), contribution_frequency = COALESCE(contribution_frequency, 'Monthly'), contribution_amount = COALESCE(contribution_amount, 0) WHERE group_type IS NULL OR country IS NULL OR currency IS NULL OR meeting_frequency IS NULL OR contribution_frequency IS NULL OR contribution_amount IS NULL;

CREATE TABLE IF NOT EXISTS public.community_group_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE,
  member_number text NOT NULL DEFAULT ('MB-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  full_name text NOT NULL,
  phone text,
  email text,
  national_id text,
  id_type text DEFAULT 'NIDA',
  gender text,
  date_of_birth date,
  address text,
  occupation text,
  next_of_kin text,
  next_of_kin_phone text,
  join_date date NOT NULL DEFAULT current_date,
  exit_date date,
  role text NOT NULL DEFAULT 'Member',
  kyc_status text NOT NULL DEFAULT 'Pending' CHECK (kyc_status IN ('Pending','Verified','Rejected','Expired')),
  membership_status text NOT NULL DEFAULT 'Active' CHECK (membership_status IN ('Pending','Active','Suspended','Exited')),
  kyc_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_by uuid DEFAULT auth.uid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, member_number)
);

CREATE TABLE IF NOT EXISTS public.community_group_committees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, name text NOT NULL, committee_type text NOT NULL DEFAULT 'Management', status text NOT NULL DEFAULT 'Active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_committee_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  committee_id uuid NOT NULL REFERENCES public.community_group_committees(id) ON DELETE CASCADE, member_id uuid NOT NULL REFERENCES public.community_group_members(id) ON DELETE CASCADE, committee_role text NOT NULL DEFAULT 'Member', start_date date NOT NULL DEFAULT current_date, end_date date, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(committee_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.community_group_meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, meeting_number text NOT NULL DEFAULT ('MT-' || upper(substr(gen_random_uuid()::text, 1, 8))), meeting_date date NOT NULL, start_time time, venue text, agenda text, minutes text, chairperson_id uuid REFERENCES public.community_group_members(id) ON DELETE SET NULL, status text NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Held','Cancelled')), reminder_sent_at timestamptz, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  meeting_id uuid NOT NULL REFERENCES public.community_group_meetings(id) ON DELETE CASCADE, member_id uuid NOT NULL REFERENCES public.community_group_members(id) ON DELETE CASCADE, status text NOT NULL DEFAULT 'Present' CHECK (status IN ('Present','Absent','Excused')), notes text, created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(meeting_id, member_id)
);

CREATE TABLE IF NOT EXISTS public.community_group_contributions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, member_id uuid REFERENCES public.community_group_members(id) ON DELETE SET NULL, contribution_number text NOT NULL DEFAULT ('CT-' || upper(substr(gen_random_uuid()::text, 1, 8))), contribution_type text NOT NULL DEFAULT 'Contribution', amount numeric(18,2) NOT NULL CHECK (amount > 0), currency text NOT NULL DEFAULT 'TZS', contribution_date date NOT NULL DEFAULT current_date, due_date date, payment_method text NOT NULL DEFAULT 'Cash', mobile_money_provider text, payment_reference text, status text NOT NULL DEFAULT 'Paid' CHECK (status IN ('Pending','Paid','Waived','Reversed')), receipt_number text, notes text, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, contribution_number)
);
CREATE TABLE IF NOT EXISTS public.community_group_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, member_id uuid REFERENCES public.community_group_members(id) ON DELETE SET NULL, transaction_type text NOT NULL CHECK (transaction_type IN ('Deposit','Withdrawal','Dividend','Adjustment')), amount numeric(18,2) NOT NULL CHECK (amount > 0), transaction_date date NOT NULL DEFAULT current_date, payment_method text DEFAULT 'Cash', reference text, status text NOT NULL DEFAULT 'Posted', notes text, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_welfare_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, member_id uuid REFERENCES public.community_group_members(id) ON DELETE SET NULL, event_type text NOT NULL, description text, amount_requested numeric(18,2) NOT NULL CHECK (amount_requested > 0), amount_approved numeric(18,2), claim_date date NOT NULL DEFAULT current_date, status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Paid')), payment_method text, payment_reference text, approved_by uuid, approved_at timestamptz, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_group_loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, member_id uuid NOT NULL REFERENCES public.community_group_members(id) ON DELETE RESTRICT, loan_number text NOT NULL DEFAULT ('GL-' || upper(substr(gen_random_uuid()::text, 1, 8))), purpose text, principal numeric(18,2) NOT NULL CHECK (principal > 0), interest_rate numeric(8,4) NOT NULL DEFAULT 0 CHECK (interest_rate >= 0), interest_method text NOT NULL DEFAULT 'Flat' CHECK (interest_method IN ('Flat','Reducing Balance')), term_months integer NOT NULL DEFAULT 1 CHECK (term_months > 0), application_date date NOT NULL DEFAULT current_date, approval_status text NOT NULL DEFAULT 'Pending' CHECK (approval_status IN ('Pending','Approved','Rejected')), status text NOT NULL DEFAULT 'Applied' CHECK (status IN ('Applied','Approved','Disbursed','Active','Closed','Defaulted','Rejected')), approved_by uuid, approved_at timestamptz, disbursed_at date, first_due_date date, total_interest numeric(18,2) NOT NULL DEFAULT 0, total_repayable numeric(18,2) NOT NULL DEFAULT 0, outstanding_principal numeric(18,2) NOT NULL DEFAULT 0, outstanding_interest numeric(18,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS', payment_method text, disbursement_reference text, notes text, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, loan_number)
);
CREATE TABLE IF NOT EXISTS public.community_group_loan_guarantors (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES public.community_group_loans(id) ON DELETE CASCADE, guarantor_member_id uuid NOT NULL REFERENCES public.community_group_members(id) ON DELETE RESTRICT, guaranteed_amount numeric(18,2) NOT NULL CHECK (guaranteed_amount > 0), consent_status text NOT NULL DEFAULT 'Pending' CHECK (consent_status IN ('Pending','Accepted','Declined')), consented_at timestamptz, UNIQUE(loan_id, guarantor_member_id)
);
CREATE TABLE IF NOT EXISTS public.community_group_loan_repayments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES public.community_group_loans(id) ON DELETE CASCADE, repayment_number text NOT NULL DEFAULT ('LR-' || upper(substr(gen_random_uuid()::text, 1, 8))), repayment_date date NOT NULL DEFAULT current_date, amount numeric(18,2) NOT NULL CHECK (amount > 0), principal_amount numeric(18,2) NOT NULL DEFAULT 0, interest_amount numeric(18,2) NOT NULL DEFAULT 0, penalty_amount numeric(18,2) NOT NULL DEFAULT 0, payment_method text NOT NULL DEFAULT 'Cash', mobile_money_provider text, payment_reference text, status text NOT NULL DEFAULT 'Posted', receipt_number text, notes text, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, repayment_number)
);
CREATE TABLE IF NOT EXISTS public.community_group_loan_penalties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  loan_id uuid NOT NULL REFERENCES public.community_group_loans(id) ON DELETE CASCADE, penalty_date date NOT NULL DEFAULT current_date, reason text NOT NULL, amount numeric(18,2) NOT NULL CHECK (amount > 0), status text NOT NULL DEFAULT 'Outstanding', created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_group_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, title text NOT NULL, body text NOT NULL, audience text NOT NULL DEFAULT 'All Members', status text NOT NULL DEFAULT 'Published', published_at timestamptz NOT NULL DEFAULT now(), expires_at date, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, sender_member_id uuid REFERENCES public.community_group_members(id) ON DELETE SET NULL, subject text, body text NOT NULL, channel text NOT NULL DEFAULT 'In-app', status text NOT NULL DEFAULT 'Sent', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_group_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, project_number text NOT NULL DEFAULT ('PR-' || upper(substr(gen_random_uuid()::text, 1, 8))), name text NOT NULL, description text, start_date date, end_date date, target_amount numeric(18,2) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Planning' CHECK (status IN ('Planning','Active','Completed','On Hold','Cancelled')), created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, project_number)
);
CREATE TABLE IF NOT EXISTS public.community_group_fundraising (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, project_id uuid REFERENCES public.community_group_projects(id) ON DELETE SET NULL, donor_name text NOT NULL, amount numeric(18,2) NOT NULL CHECK (amount > 0), donation_date date NOT NULL DEFAULT current_date, payment_method text DEFAULT 'Cash', payment_reference text, status text NOT NULL DEFAULT 'Received', notes text, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_budgets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, project_id uuid REFERENCES public.community_group_projects(id) ON DELETE SET NULL, category text NOT NULL, budget_amount numeric(18,2) NOT NULL CHECK (budget_amount >= 0), fiscal_year integer NOT NULL DEFAULT extract(year from current_date), status text NOT NULL DEFAULT 'Draft', approved_by uuid, approved_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, project_id uuid REFERENCES public.community_group_projects(id) ON DELETE SET NULL, category text NOT NULL, description text NOT NULL, amount numeric(18,2) NOT NULL CHECK (amount > 0), expense_date date NOT NULL DEFAULT current_date, payment_method text DEFAULT 'Cash', payment_reference text, status text NOT NULL DEFAULT 'Pending Approval' CHECK (status IN ('Draft','Pending Approval','Approved','Paid','Rejected')), approved_by uuid, approved_at timestamptz, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, asset_code text NOT NULL DEFAULT ('AS-' || upper(substr(gen_random_uuid()::text, 1, 8))), name text NOT NULL, category text, acquisition_date date, acquisition_cost numeric(18,2) NOT NULL DEFAULT 0, current_value numeric(18,2) NOT NULL DEFAULT 0, location text, custodian text, status text NOT NULL DEFAULT 'Active', created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id, asset_code)
);
CREATE TABLE IF NOT EXISTS public.community_group_income (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, income_type text NOT NULL, description text, amount numeric(18,2) NOT NULL CHECK (amount > 0), income_date date NOT NULL DEFAULT current_date, payment_method text DEFAULT 'Cash', payment_reference text, status text NOT NULL DEFAULT 'Posted', created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.community_group_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, title text NOT NULL, description text, vote_type text NOT NULL DEFAULT 'Resolution' CHECK (vote_type IN ('Resolution','Election','Approval')), opens_at timestamptz NOT NULL DEFAULT now(), closes_at timestamptz, status text NOT NULL DEFAULT 'Open' CHECK (status IN ('Draft','Open','Closed','Approved','Rejected')), quorum_percent numeric(5,2) NOT NULL DEFAULT 50 CHECK (quorum_percent >= 0 AND quorum_percent <= 100), created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_vote_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  vote_id uuid NOT NULL REFERENCES public.community_group_votes(id) ON DELETE CASCADE, label text NOT NULL, candidate_member_id uuid REFERENCES public.community_group_members(id) ON DELETE SET NULL, vote_count integer NOT NULL DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_vote_ballots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  vote_id uuid NOT NULL REFERENCES public.community_group_votes(id) ON DELETE CASCADE, option_id uuid NOT NULL REFERENCES public.community_group_vote_options(id) ON DELETE CASCADE, member_id uuid NOT NULL REFERENCES public.community_group_members(id) ON DELETE CASCADE, cast_at timestamptz NOT NULL DEFAULT now(), UNIQUE(vote_id, member_id)
);
CREATE TABLE IF NOT EXISTS public.community_group_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, entity_type text NOT NULL, entity_id uuid NOT NULL, action text NOT NULL DEFAULT 'Approval', status text NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending','Approved','Rejected','Returned')), requested_by uuid DEFAULT auth.uid(), decided_by uuid, decision_notes text, requested_at timestamptz NOT NULL DEFAULT now(), decided_at timestamptz
);

CREATE TABLE IF NOT EXISTS public.community_group_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, document_type text NOT NULL DEFAULT 'Other', title text NOT NULL, file_url text, document_date date, expires_at date, status text NOT NULL DEFAULT 'Active', uploaded_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid NOT NULL REFERENCES public.community_groups(id) ON DELETE CASCADE, title text NOT NULL, event_type text NOT NULL DEFAULT 'Event', event_date date NOT NULL, start_time time, venue text, description text, reminder_sent_at timestamptz, status text NOT NULL DEFAULT 'Scheduled', created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.community_groups(id) ON DELETE CASCADE, member_id uuid REFERENCES public.community_group_members(id) ON DELETE CASCADE, notification_type text NOT NULL, title text NOT NULL, body text NOT NULL, channel text NOT NULL DEFAULT 'In-app', status text NOT NULL DEFAULT 'Unread', scheduled_for timestamptz, sent_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE IF NOT EXISTS public.community_group_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT public.current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.community_groups(id) ON DELETE SET NULL, actor_id uuid DEFAULT auth.uid(), actor_name text, action text NOT NULL, entity_type text NOT NULL, entity_id uuid, details jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['community_groups','community_group_members','community_group_committees','community_group_committee_members','community_group_meetings','community_group_attendance','community_group_contributions','community_group_savings','community_group_welfare_claims','community_group_loans','community_group_loan_guarantors','community_group_loan_repayments','community_group_loan_penalties','community_group_announcements','community_group_messages','community_group_projects','community_group_fundraising','community_group_budgets','community_group_expenses','community_group_assets','community_group_income','community_group_votes','community_group_vote_options','community_group_vote_ballots','community_group_approvals','community_group_documents','community_group_events','community_group_notifications','community_group_audit_log'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_select', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', t || '_tenant_write', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id())', t || '_tenant_select', t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (company_id = public.current_company_id()) WITH CHECK (company_id = public.current_company_id())', t || '_tenant_write', t);
  END LOOP;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['community_groups','community_group_members','community_group_committees','community_group_meetings','community_group_contributions','community_group_welfare_claims','community_group_loans','community_group_announcements','community_group_projects','community_group_expenses','community_group_assets','community_group_votes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_updated_at', t);
    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.community_groups_touch_updated_at()', t || '_updated_at', t);
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS community_groups_company_status_idx ON public.community_groups(company_id, status);
CREATE INDEX IF NOT EXISTS community_group_members_group_status_idx ON public.community_group_members(group_id, membership_status);
CREATE INDEX IF NOT EXISTS community_group_contributions_group_date_idx ON public.community_group_contributions(group_id, contribution_date DESC);
CREATE INDEX IF NOT EXISTS community_group_loans_group_status_idx ON public.community_group_loans(group_id, status);
CREATE INDEX IF NOT EXISTS community_group_meetings_group_date_idx ON public.community_group_meetings(group_id, meeting_date DESC);
CREATE INDEX IF NOT EXISTS community_group_audit_log_group_created_idx ON public.community_group_audit_log(group_id, created_at DESC);

COMMIT;
