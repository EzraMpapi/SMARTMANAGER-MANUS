# Bank & MFI Supabase Security Advisor Review

The live Supabase project is `rlhngsrihahhyxnjxrxm`. After applying the Bank & MFI migration, the security advisor initially reported anonymous execution for the new security-definer functions. A follow-up hardening migration revoked `EXECUTE` from `PUBLIC` and `anon` for all Bank & MFI functions and retained authenticated execution only for the RPCs used by the verified tRPC server.

The refreshed advisor output no longer listed the new Bank & MFI functions under the anonymous-execution findings. It still lists the existing application’s unrelated security-definer functions, and it also reports the authenticated execution of Bank & MFI RPC functions. The latter is intentional for this architecture: the tRPC layer requires authenticated RPC access, while every mutation validates `auth.uid()`, `current_company_id()`, role membership, tenant ownership, workflow state, and maker-checker separation. Internal helper functions should not be directly callable by authenticated clients, so the next hardening migration revokes authenticated execution from `bank_is_privileged`, `bank_has_role`, `bank_audit`, and `bank_assert_balanced_journal` while preserving their use by security-definer routines and the deferred database trigger.

The Supabase advisor remediation links shown for the execution findings are:

- https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable
- https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

## Final live advisor counts

The final live advisor response contains **0 anonymous Bank & MFI execution findings** and **29 authenticated Bank & MFI execution findings**. The 29 authenticated findings correspond to the intended protected RPC surface used by the authenticated tRPC service. Internal helpers are no longer in the authenticated list. The same response still contains unrelated legacy security-definer warnings outside the Bank & MFI module; those were not changed because they belong to existing travel, workspace, and other application functions.
