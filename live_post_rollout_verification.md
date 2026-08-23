# Live Supabase rollout verification

Project: `rlhngsrihahhyxnjxrxm`

The following migration names are recorded live after sequential application: `fin_foundation`, `fin_journal_core`, `fin_reconciliation_core`, `pos_register_control`, `pos_register_control_hardening`, `pos_sales_returns`, `pos_pricing_loyalty`, `workforce_authorization`, and `workforce_role_assignment_approval`.

The live verbose table catalog confirmed the target finance, POS, pricing/loyalty, and workforce tables are present with `rls_enabled=true` and zero rows.

The live function catalog confirmed the new protected routines exist. A bounded privilege query revealed that several finance and POS SECURITY DEFINER helper/RPC functions report `anon_execute=true` despite the original migration revoke statements. The two workforce role-assignment functions report `anon_execute=false` and `authenticated_execute=true`. This requires a narrow follow-up privilege-hardening migration before treating the rollout as security-complete. No data rows were created by the rollout.

The Supabase security advisor also reported existing project-wide warnings for mutable search paths and anonymous execution on legacy/public functions. These are separate from the new table DDL, but the new migration functions should be remediated narrowly without altering unrelated legacy RPC contracts.
