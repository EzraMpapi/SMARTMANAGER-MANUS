BEGIN;

-- During BEFORE INSERT, a new transaction row is not yet visible to a
-- table lookup by NEW.id. The row's group_id is already checked against the
-- authenticated tenant, so use it directly for same-group member validation.
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
  ELSIF TG_TABLE_NAME IN (
    'community_group_committees','community_group_contributions',
    'community_group_savings','community_group_welfare_claims','community_group_announcements',
    'community_group_projects','community_group_expenses','community_group_votes',
    'community_group_approvals','community_group_documents','community_group_events'
  ) THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    IF TG_TABLE_NAME IN ('community_group_contributions','community_group_savings','community_group_welfare_claims')
       AND NEW.member_id IS NOT NULL THEN
      group_a := NEW.group_id;
      group_b := public.community_groups_member_group(NEW.member_id, c);
      IF group_a IS DISTINCT FROM group_b THEN
        RAISE EXCEPTION 'Transaction and member must belong to the same group.' USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_committee_members' THEN
    group_a := public.community_groups_parent_group('community_group_committees', NEW.committee_id, c);
    group_b := public.community_groups_member_group(NEW.member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN
      RAISE EXCEPTION 'Committee and member must belong to the same group.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_attendance' THEN
    group_a := public.community_groups_parent_group('community_group_meetings', NEW.meeting_id, c);
    group_b := public.community_groups_member_group(NEW.member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN
      RAISE EXCEPTION 'Meeting and member must belong to the same group.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_loan_guarantors' THEN
    group_a := public.community_groups_parent_group('community_group_loans', NEW.loan_id, c);
    group_b := public.community_groups_member_group(NEW.guarantor_member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN
      RAISE EXCEPTION 'Guarantor must belong to the same group as the loan.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME IN ('community_group_loan_repayments','community_group_loan_penalties') THEN
    PERFORM public.community_groups_parent_group('community_group_loans', NEW.loan_id, c);
  ELSIF TG_TABLE_NAME = 'community_group_fundraising' THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    IF NEW.project_id IS NOT NULL THEN
      group_a := public.community_groups_parent_group('community_group_projects', NEW.project_id, c);
      IF group_a IS DISTINCT FROM NEW.group_id THEN
        RAISE EXCEPTION 'Fundraising project must belong to the same group.' USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_budgets' THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    IF NEW.project_id IS NOT NULL THEN
      group_a := public.community_groups_parent_group('community_group_projects', NEW.project_id, c);
      IF group_a IS DISTINCT FROM NEW.group_id THEN
        RAISE EXCEPTION 'Budget project must belong to the same group.' USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_vote_options' THEN
    group_a := public.community_groups_parent_group('community_group_votes', NEW.vote_id, c);
    IF NEW.candidate_member_id IS NOT NULL THEN
      group_b := public.community_groups_member_group(NEW.candidate_member_id, c);
      IF group_a IS DISTINCT FROM group_b THEN
        RAISE EXCEPTION 'Election candidate must belong to the same group.' USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_vote_ballots' THEN
    group_a := public.community_groups_parent_group('community_group_votes', NEW.vote_id, c);
    group_b := public.community_groups_parent_group('community_group_vote_options', NEW.option_id, c);
    IF group_a IS DISTINCT FROM group_b THEN
      RAISE EXCEPTION 'Vote option must belong to the same group as the vote.' USING ERRCODE = '42501';
    END IF;
    group_b := public.community_groups_member_group(NEW.member_id, c);
    IF group_a IS DISTINCT FROM group_b THEN
      RAISE EXCEPTION 'Ballot member must belong to the same group as the vote.' USING ERRCODE = '42501';
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_notifications' THEN
    IF NEW.group_id IS NOT NULL THEN
      PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
    END IF;
    IF NEW.member_id IS NOT NULL THEN
      group_a := public.community_groups_member_group(NEW.member_id, c);
      IF NEW.group_id IS NOT NULL AND group_a IS DISTINCT FROM NEW.group_id THEN
        RAISE EXCEPTION 'Notification member must belong to its notification group.' USING ERRCODE = '42501';
      END IF;
    END IF;
  ELSIF TG_TABLE_NAME = 'community_group_audit_log' AND NEW.group_id IS NOT NULL THEN
    PERFORM public.community_groups_assert_group_company(NEW.group_id, c);
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
