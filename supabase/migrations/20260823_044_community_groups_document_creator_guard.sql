BEGIN;

CREATE OR REPLACE FUNCTION public.community_groups_stamp_creator()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, auth AS $$
BEGIN
  IF auth.role() <> 'service_role' THEN
    IF TG_TABLE_NAME = 'community_group_documents' THEN
      NEW.uploaded_by := auth.uid();
    ELSIF TG_TABLE_NAME IN (
      'community_groups','community_group_members','community_group_meetings',
      'community_group_contributions','community_group_savings','community_group_welfare_claims',
      'community_group_loans','community_group_announcements','community_group_projects',
      'community_group_expenses','community_group_votes','community_group_events'
    ) THEN
      NEW.created_by := auth.uid();
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMIT;
