-- Leave decisions are terminal. This protects approval, notification, audit, and balance workflows from duplicate or contradictory decisions.
BEGIN;

CREATE OR REPLACE FUNCTION public.hr_prevent_terminal_leave_redecision()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.status IN ('Approved', 'Rejected') AND NEW.status IS DISTINCT FROM OLD.status THEN
    RAISE EXCEPTION 'A terminal leave decision cannot be changed. Create a new leave workflow or use a controlled reversal process.' USING ERRCODE = '55000';
  END IF;
  IF OLD.status = 'Pending' AND NEW.status NOT IN ('Pending', 'Approved', 'Rejected') THEN
    RAISE EXCEPTION 'A pending leave request may only remain pending, be approved, or be rejected.' USING ERRCODE = '22023';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS hr_prevent_terminal_leave_redecision ON public.hr_leave_requests;
CREATE TRIGGER hr_prevent_terminal_leave_redecision
  BEFORE UPDATE OF status ON public.hr_leave_requests
  FOR EACH ROW EXECUTE FUNCTION public.hr_prevent_terminal_leave_redecision();

REVOKE EXECUTE ON FUNCTION public.hr_prevent_terminal_leave_redecision() FROM PUBLIC, anon, authenticated;

COMMIT;
