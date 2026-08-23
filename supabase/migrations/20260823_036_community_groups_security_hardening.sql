-- Community Groups security hardening: tenant relationship integrity, database-side roles, and immutable audit history.
BEGIN;

CREATE OR REPLACE FUNCTION public.community_groups_is_privileged()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.company_id = public.current_company_id()
      AND coalesce(p.is_active, true)
      AND lower(coalesce(p.role, '')) IN (
        'super administrator','platform administrator','organization owner','owner','ceo','cfo',
        'finance manager','operations manager','microfinance manager','branch manager','community groups manager',
        'cooperative manager','group manager','admin','manager'
      )
  ) OR EXISTS (
    SELECT 1
    FROM public.company_memberships m
    WHERE m.user_id = auth.uid()
      AND m.company_id = public.current_company_id()
      AND lower(coalesce(m.role, '')) IN (
        'super administrator','platform administrator','organization owner','owner','ceo','cfo',
        'finance manager','operations manager','microfinance manager','branch manager','community groups manager',
        'cooperative manager','group manager','admin','manager'
      )
  );
$$;

CREATE OR REPLACE FUNCTION public.community_groups_can_operate()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.community_groups_is_privileged()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.company_id = public.current_company_id()
        AND coalesce(p.is_active, true)
        AND lower(coalesce(p.role, '')) IN (
          'treasurer','secretary','loan officer','welfare officer','finance officer','credit officer',
          'community group officer','cooperative officer','auditor'
        )
    ) OR EXISTS (
      SELECT 1 FROM public.company_memberships m
      WHERE m.user_id = auth.uid()
        AND m.company_id = public.current_company_id()
        AND lower(coalesce(m.role, '')) IN (
          'treasurer','secretary','loan officer','welfare officer','finance officer','credit officer',
          'community group officer','cooperative officer','auditor'
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.community_groups_can_approve()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.community_groups_is_privileged()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.company_id = public.current_company_id()
        AND coalesce(p.is_active, true)
        AND lower(coalesce(p.role, '')) IN (
          'credit manager','loan manager','compliance officer','cooperative manager','community groups manager',
          'finance officer','credit officer','branch manager','treasurer'
        )
    ) OR EXISTS (
      SELECT 1 FROM public.company_memberships m
      WHERE m.user_id = auth.uid()
        AND m.company_id = public.current_company_id()
        AND lower(coalesce(m.role, '')) IN (
          'credit manager','loan manager','compliance officer','cooperative manager','community groups manager',
          'finance officer','credit officer','branch manager','treasurer'
        )
    );
$$;

CREATE OR REPLACE FUNCTION public.community_groups_can_disburse()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, auth AS $$
  SELECT public.community_groups_is_privileged()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.company_id = public.current_company_id()
        AND coalesce(p.is_active, true)
        AND lower(coalesce(p.role, '')) IN (
          'cfo','finance manager','microfinance manager','credit manager','loan manager',
          'branch manager','treasurer','community groups manager','cooperative manager'
        )
    ) OR EXISTS (
      SELECT 1 FROM public.company_memberships m
      WHERE m.user_id = auth.uid()
        AND m.company_id = public.current_company_id()
        AND lower(coalesce(m.role, '')) IN (
          'cfo','finance manager','microfinance manager','credit manager','loan manager',
          'branch manager','treasurer','community groups manager','cooperative manager'
        )
    );
$$;

REVOKE EXECUTE ON FUNCTION public.community_groups_is_privileged() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.community_groups_can_operate() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.community_groups_can_approve() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.community_groups_can_disburse() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.community_groups_is_privileged() TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_groups_can_operate() TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_groups_can_approve() TO authenticated;
GRANT EXECUTE ON FUNCTION public.community_groups_can_disburse() TO authenticated;

CREATE OR REPLACE FUNCTION public.community_groups_assert_group_company(p_group_id uuid, p_company_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_company uuid;
BEGIN
  IF p_group_id IS NULL THEN RAISE EXCEPTION 'Community group reference is required.' USING ERRCODE = '23514'; END IF;
  SELECT g.company_id INTO v_company FROM public.community_groups g WHERE g.id = p_group_id;
  IF v_company IS NULL OR v_company IS DISTINCT FROM p_company_id THEN
    RAISE EXCEPTION 'Community Groups records must reference a group in the same tenant.' USING ERRCODE = '42501';
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_groups_parent_group(p_table text, p_id uuid, p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_group uuid;
BEGIN
  EXECUTE format('SELECT group_id FROM public.%I WHERE id = $1 AND company_id = $2', p_table)
    INTO v_group USING p_id, p_company_id;
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'Community Groups parent record is missing or belongs to another tenant.' USING ERRCODE = '42501';
  END IF;
  RETURN v_group;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_groups_member_group(p_member_id uuid, p_company_id uuid)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE v_group uuid;
BEGIN
  SELECT m.group_id INTO v_group
  FROM public.community_group_members m
  WHERE m.id = p_member_id AND m.company_id = p_company_id;
  IF v_group IS NULL THEN
    RAISE EXCEPTION 'Community Groups member is missing or belongs to another tenant.' USING ERRCODE = '42501';
  END IF;
  RETURN v_group;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_groups_assert_relationships()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
DECLARE
  c uuid := public.current_company_id();
  group_a uuid;
  group_b uuid;
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF auth.uid() IS NULL OR NEW.company_id IS DISTINCT FROM c THEN
    RAISE EXCEPTION 'Community Groups tenant context is invalid.' USING ERRCODE = '42501';
  END IF;

  IF TG_TABLE_NAME = 'community_group_members' THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
  ELSIF TG_TABLE_NAME = 'community_group_meetings' THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    IF NEW.chairperson_id IS NOT NULL THEN
      group_b := public.community_groups_member_group(NEW.chairperson_id, c);
      IF NEW.group_id IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Meeting chairperson must belong to the same group.' USING ERRCODE = '42501'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_messages' THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    IF NEW.sender_member_id IS NOT NULL THEN
      group_b := public.community_groups_member_group(NEW.sender_member_id, c);
      IF NEW.group_id IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Message sender must belong to the same group.' USING ERRCODE = '42501'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_loans' THEN
    group_a := NEW.group_id;
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    group_b := public.community_groups_member_group(NEW.member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Loan borrower must belong to the same group as the loan.' USING ERRCODE = '42501'; END IF;
  ELSIF TG_TABLE_NAME IN ('community_group_committees','community_group_contributions','community_group_savings','community_group_welfare_claims','community_group_announcements','community_group_projects','community_group_expenses','community_group_assets','community_group_income','community_group_votes','community_group_approvals','community_group_documents','community_group_events') THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    IF TG_TABLE_NAME IN ('community_group_contributions','community_group_savings','community_group_welfare_claims') AND NEW.member_id IS NOT NULL THEN
      group_a := public.community_groups_parent_group(TG_TABLE_NAME, NEW.id, c);
      group_b := public.community_groups_member_group(NEW.member_id, c);
      IF group_a IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Transaction and member must belong to the same group.' USING ERRCODE = '42501'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_committee_members' THEN
    group_a := public.community_groups_parent_group('community_group_committees', NEW.committee_id, c);
    group_b := public.community_groups_member_group(NEW.member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Committee and member must belong to the same group.' USING ERRCODE = '42501'; END IF;
  ELSIF TG_TABLE_NAME = 'community_group_attendance' THEN
    group_a := public.community_groups_parent_group('community_group_meetings', NEW.meeting_id, c);
    group_b := public.community_groups_member_group(NEW.member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Meeting and member must belong to the same group.' USING ERRCODE = '42501'; END IF;
  ELSIF TG_TABLE_NAME = 'community_group_loan_guarantors' THEN
    group_a := public.community_groups_parent_group('community_group_loans', NEW.loan_id, c);
    group_b := public.community_groups_member_group(NEW.guarantor_member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Guarantor must belong to the same group as the loan.' USING ERRCODE = '42501'; END IF;
  ELSIF TG_TABLE_NAME IN ('community_group_loan_repayments','community_group_loan_penalties') THEN
    PERFORM public.community_groups_parent_group('community_group_loans', NEW.loan_id, c);
  ELSIF TG_TABLE_NAME = 'community_group_fundraising' THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    IF NEW.project_id IS NOT NULL THEN
      group_a := public.community_groups_parent_group('community_group_projects', NEW.project_id, c);
      IF group_a IS DISTINCT FROM NEW.group_id THEN RAISE EXCEPTION 'Fundraising project must belong to the same group.' USING ERRCODE = '42501'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_budgets' THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    IF NEW.project_id IS NOT NULL THEN
      group_a := public.community_groups_parent_group('community_group_projects', NEW.project_id, c);
      IF group_a IS DISTINCT FROM NEW.group_id THEN RAISE EXCEPTION 'Budget project must belong to the same group.' USING ERRCODE = '42501'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_vote_options' THEN
    group_a := public.community_groups_parent_group('community_group_votes', NEW.vote_id, c);
    IF NEW.candidate_member_id IS NOT NULL THEN
      group_b := public.community_groups_member_group(NEW.candidate_member_id, c);
      IF group_a IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Election candidate must belong to the same group.' USING ERRCODE = '42501'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_vote_ballots' THEN
    group_a := public.community_groups_parent_group('community_group_votes', NEW.vote_id, c);
    group_b := public.community_groups_parent_group('community_group_vote_options', NEW.option_id, c);
    IF group_a IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Vote option must belong to the same group as the vote.' USING ERRCODE = '42501'; END IF;
    group_b := public.community_groups_member_group(NEW.member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN RAISE EXCEPTION 'Ballot member must belong to the same group as the vote.' USING ERRCODE = '42501'; END IF;
  ELSIF TG_TABLE_NAME = 'community_group_notifications' THEN
    IF NEW.group_id IS NOT NULL THEN PERFORM public.community_groups_assert_group_company(NEW.group_id, c); END IF;
    IF NEW.member_id IS NOT NULL THEN
      group_a := public.community_groups_member_group(NEW.member_id, c);
      IF NEW.group_id IS NOT NULL AND group_a IS DISTINCT FROM NEW.group_id THEN RAISE EXCEPTION 'Notification member must belong to its notification group.' USING ERRCODE = '42501'; END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_audit_log' AND NEW.group_id IS NOT NULL THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
  END IF;

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_groups_stamp_creator()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF TG_TABLE_NAME IN ('community_groups','community_group_members','community_group_meetings','community_group_contributions','community_group_savings','community_group_welfare_claims','community_group_loans','community_group_announcements','community_group_projects','community_group_expenses','community_group_votes','community_group_documents','community_group_events') THEN
      NEW.created_by := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_groups_guard_sensitive_update()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF auth.role() = 'service_role' THEN RETURN NEW; END IF;
  IF TG_TABLE_NAME = 'community_group_loans' THEN
    IF NEW.approval_status IS DISTINCT FROM OLD.approval_status AND NOT public.community_groups_can_approve() THEN
      RAISE EXCEPTION 'Community Groups approval permission required.' USING ERRCODE = '42501';
    END IF;
    IF NEW.status IN ('Disbursed','Active') AND OLD.status NOT IN ('Disbursed','Active') AND NOT public.community_groups_can_disburse() THEN
      RAISE EXCEPTION 'Community Groups disbursement permission required.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_welfare_claims' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Approved','Paid','Rejected') AND NOT public.community_groups_can_approve() THEN
      RAISE EXCEPTION 'Community Groups welfare approval permission required.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_expenses' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Approved','Paid','Rejected') AND NOT public.community_groups_can_approve() THEN
      RAISE EXCEPTION 'Community Groups expense approval permission required.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_approvals' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.community_groups_can_approve() THEN
      RAISE EXCEPTION 'Community Groups approval permission required.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_members' THEN
    IF NEW.kyc_status IS DISTINCT FROM OLD.kyc_status AND NOT public.community_groups_can_approve() THEN
      RAISE EXCEPTION 'Community Groups KYC verification permission required.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_votes' THEN
    IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status IN ('Closed','Approved','Rejected') AND NOT public.community_groups_can_approve() THEN
      RAISE EXCEPTION 'Community Groups governance approval permission required.' USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.community_groups_audit_guard()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF TG_OP <> 'INSERT' THEN
      RAISE EXCEPTION 'Community Groups audit history is immutable.' USING ERRCODE = '42501';
    END IF;
    NEW.company_id := public.current_company_id();
    NEW.actor_id := auth.uid();
    NEW.created_at := now();
    SELECT coalesce(nullif(trim(p.full_name), ''), auth.uid()::text)
      INTO NEW.actor_name
    FROM public.profiles p
    WHERE p.id = auth.uid() AND p.company_id = NEW.company_id;
    NEW.actor_name := coalesce(NEW.actor_name, auth.uid()::text);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'community_group_members','community_group_committees','community_group_committee_members','community_group_meetings','community_group_attendance',
    'community_group_contributions','community_group_savings','community_group_welfare_claims','community_group_loans','community_group_loan_guarantors',
    'community_group_loan_repayments','community_group_loan_penalties','community_group_announcements','community_group_messages','community_group_projects',
    'community_group_fundraising','community_group_budgets','community_group_expenses','community_group_assets','community_group_income','community_group_votes',
    'community_group_vote_options','community_group_vote_ballots','community_group_approvals','community_group_documents','community_group_events',
    'community_group_notifications','community_group_audit_log'
  ] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS community_groups_relationship_guard ON public.%I', t);
    EXECUTE format('CREATE TRIGGER community_groups_relationship_guard BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.community_groups_assert_relationships()', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['community_groups','community_group_members','community_group_meetings','community_group_contributions','community_group_savings','community_group_welfare_claims','community_group_loans','community_group_announcements','community_group_projects','community_group_expenses','community_group_votes','community_group_documents','community_group_events'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS community_groups_creator_stamp ON public.%I', t);
    EXECUTE format('CREATE TRIGGER community_groups_creator_stamp BEFORE INSERT ON public.%I FOR EACH ROW EXECUTE FUNCTION public.community_groups_stamp_creator()', t);
  END LOOP;

  FOREACH t IN ARRAY ARRAY['community_group_loans','community_group_welfare_claims','community_group_expenses','community_group_approvals','community_group_members','community_group_votes'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS community_groups_sensitive_update_guard ON public.%I', t);
    EXECUTE format('CREATE TRIGGER community_groups_sensitive_update_guard BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.community_groups_guard_sensitive_update()', t);
  END LOOP;

  EXECUTE 'DROP TRIGGER IF EXISTS community_groups_audit_immutable_guard ON public.community_group_audit_log';
  EXECUTE 'CREATE TRIGGER community_groups_audit_immutable_guard BEFORE INSERT OR UPDATE OR DELETE ON public.community_group_audit_log FOR EACH ROW EXECUTE FUNCTION public.community_groups_audit_guard()';
END $$;

DO $$
DECLARE t text; p record;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'community_groups','community_group_members','community_group_committees','community_group_committee_members','community_group_meetings','community_group_attendance',
    'community_group_contributions','community_group_savings','community_group_welfare_claims','community_group_loans','community_group_loan_guarantors',
    'community_group_loan_repayments','community_group_loan_penalties','community_group_announcements','community_group_messages','community_group_projects',
    'community_group_fundraising','community_group_budgets','community_group_expenses','community_group_assets','community_group_income','community_group_votes',
    'community_group_vote_options','community_group_vote_ballots','community_group_approvals','community_group_documents','community_group_events',
    'community_group_notifications','community_group_audit_log'
  ] LOOP
    FOR p IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = t LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', p.policyname, t);
    END LOOP;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id())', t || '_tenant_read', t);
    IF t = 'community_group_audit_log' THEN
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() AND actor_id = auth.uid() AND public.community_groups_can_operate())', t || '_append', t);
    ELSE
      EXECUTE format('CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (company_id = public.current_company_id() AND public.community_groups_can_operate())', t || '_operate_insert', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR UPDATE TO authenticated USING (company_id = public.current_company_id() AND public.community_groups_can_operate()) WITH CHECK (company_id = public.current_company_id() AND public.community_groups_can_operate())', t || '_operate_update', t);
      EXECUTE format('CREATE POLICY %I ON public.%I FOR DELETE TO authenticated USING (company_id = public.current_company_id() AND public.community_groups_is_privileged())', t || '_privileged_delete', t);
    END IF;
  END LOOP;

  EXECUTE 'CREATE POLICY community_group_approvals_approve_update ON public.community_group_approvals FOR UPDATE TO authenticated USING (company_id = public.current_company_id() AND public.community_groups_can_approve()) WITH CHECK (company_id = public.current_company_id() AND public.community_groups_can_approve())';
END $$;

REVOKE ALL ON FUNCTION public.community_groups_assert_group_company(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_groups_parent_group(text, uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_groups_member_group(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_groups_assert_relationships() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_groups_stamp_creator() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_groups_guard_sensitive_update() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.community_groups_audit_guard() FROM PUBLIC, anon, authenticated;

COMMIT;
