-- Fixed Deposit trigger-function execute hardening.
-- Trigger invocation remains available to PostgreSQL, while direct API/RPC
-- execution by client roles is removed.
BEGIN;

REVOKE ALL ON FUNCTION public.bank_fixed_deposit_events_immutable() FROM PUBLIC, anon, authenticated;

COMMIT;
