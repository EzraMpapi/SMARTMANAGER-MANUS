# Enterprise Authentication and Onboarding Design Notes

## Existing architecture

The ERP uses a Vite/React client with a fetch-based Supabase Auth boundary. It persists access and refresh tokens only after successful authentication, restores a session through `/auth/v1/user`, refreshes expired access tokens, and resolves the tenant through `profiles.company_id` before opening company-scoped ERP modules. Existing `SignupPage` and `OAuthCompanySetup` both reuse `create_company_and_owner` or `join_company_with_code`; tenant ownership remains server and RLS controlled.

The redesign will retain these backend paths. It will not trust a company identifier supplied by the browser, disable RLS, expose the service key, or create a fake authenticated session.

## Official recovery-flow constraints

Supabase documents that email/password authentication is enabled by default, hosted projects can require confirmation, and signup or recovery redirects must be configured in the project's allowed redirect URLs. Password recovery intentionally does **not** reveal whether an email address exists. The reset flow must send the user to a public reset route and update the password only after the reset link provides an authenticated recovery session. [1]

The frontend will therefore always show a generic recovery-confirmation state, retain safe errors for transport/configuration failures, clean tokens from the URL after capture, and require a complete recovery session before updating a password.

## Approved interaction model

The public `/app` experience retains the existing protected ERP route while allowing `?auth=signup`, `?auth=forgot`, `?auth=reset`, and `?auth=verify` to restore an explicit auth screen after a redirect. Auth screens use the existing Smart Manager mark, neutral workspace surface, high-contrast controls, and restrained green/ink visual hierarchy.

New password credentials require eight characters plus uppercase, lowercase, numeric, and special-character coverage. Company setup remains a server-authorized workflow: account details are collected first, a minimal workspace profile follows, a module-selection step determines the real `company_modules` rows, and team invitations remain optional until a confirmed invitation service is available. OAuth users continue to their existing company-setup path after a provider-authenticated session is resolved.

## References

[1] [Supabase Password-based Auth documentation](https://supabase.com/docs/guides/auth/passwords)
