-- Harden internal Restaurant authorization helpers; they are invoked only inside SECURITY DEFINER workflows.
BEGIN;
REVOKE ALL ON FUNCTION public.restaurant_is_manager() FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.restaurant_can_operate(text[]) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.restaurant_audit(text,text,uuid,jsonb) FROM PUBLIC,anon,authenticated;
COMMIT;
