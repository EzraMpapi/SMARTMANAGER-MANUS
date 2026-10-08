# Platform Administrator Provisioning Record

## Authorized Scope

The project owner authorized a Platform Administrator role assignment for an existing active account. No password, authentication secret, token, credential record, tenant membership, subscription record, or unrelated user data was created, stored, copied, or changed.

## Guarded Provisioning Path

The existing Global Admin guard already recognized the `platform administrator` role, but the deployed `profiles` role constraint did not permit that value. A direct role update was correctly rejected by the tenant-protection trigger and role constraint. The corrective migration `20260824_064_platform_admin_initial_provisioning.sql` was applied through the connected Supabase management service.

The migration aligns the constraint with the existing guard and exposes a **service-role-only**, initial-provisioning function. The function accepts only an active owner or administrator profile, is one-time once a Platform Administrator exists, uses the existing tenant-assignment protection setting, writes the role update, and records an auditable `PLATFORM_ADMIN_PROVISIONED` action. It does not create or change a credential.

## Verification

The authorized function completed successfully for the verified active account. A subsequent read-only transaction supplied the same authenticated subject to the existing protected `platform_admin_snapshot()` function and returned only the bounded viewer role: `platform administrator`. The transaction was rolled back after verification, so the verification did not write any additional data.

The browser sign-in attempt with the credential supplied in chat was rejected by the authentication provider. The credential was not retried, stored, logged in project files, or sent to Supabase. The account must use the verified password-recovery, passkey, or linked identity-provider flow to establish a new browser session. No release tag has been created; it remains dependent on explicit stakeholder acceptance.
