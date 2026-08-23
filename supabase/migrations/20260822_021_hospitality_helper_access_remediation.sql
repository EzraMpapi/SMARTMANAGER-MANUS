-- Internal hospitality helpers are called only from SECURITY DEFINER workflow procedures and must not be reachable directly by signed-in clients.
BEGIN;
REVOKE EXECUTE ON FUNCTION public.hospitality_is_privileged() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.hospitality_check_room_available(uuid,date,date,uuid) FROM PUBLIC, anon, authenticated;
COMMIT;
