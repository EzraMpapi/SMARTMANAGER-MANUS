# Authentication Investigation Notes

## Live observations

The deployed Supabase project accepts the public project configuration and has email/password authentication enabled. A deliberately invalid password request reached the real `/auth/v1/token?grant_type=password` endpoint and returned HTTP 400 with the `invalid_credentials` error code. Recent Supabase authentication logs show the same real credential-rejection response for password-grant attempts, while successful authenticated-session `/user` requests reach HTTP 200.

The deployed ERP route also completed an existing-session bootstrap into the dashboard. This separates a password-authentication failure from a later profile/company bootstrap failure.

The restarted development preview reached the real email/password login form after session initialization, confirming that the repaired login UI is available on the managed preview and that its configuration remains present.

After the repair, a synthetic invalid email/password submission in the managed preview reached the real Supabase password endpoint and displayed `Invalid email or password.` in the login form. It no longer displayed the misleading connection message.

## Managed credential verification

A non-interactive password-grant verification was run against the configured managed test-account environment values without printing the email, password, access token, or refresh token. The Supabase token endpoint returned HTTP 400 and no authenticated identity lookup could be performed. Combined with the endpoint and authentication-log evidence, this is an `invalid_credentials` outcome rather than a browser, CORS, configuration, RLS, profile, company, or session-creation failure.

The configured test identity exists, has a confirmed email, and is not currently banned. The managed password value is therefore stale or incorrect; no password was changed as part of this application repair.

An aggregate identity check shows that the managed accounts used for the password test have Google identities only. This explains their password-grant rejection while preserving the intended account security model: those users should select **Google** on the login page, not enter an unavailable password credential. The login form now offers that provider-neutral guidance to every user without revealing whether a particular email address exists or how it was registered.

The application repair therefore addresses the confirmed product defect—misclassifying this real authentication rejection as a connection problem—while preserving the correct security behavior of rejecting invalid password credentials.

## Confirmed application defect

`LoginPage.handleSubmit` catches every rejected login request and replaces its safe, structured error with the misleading generic message: `Something went wrong — check your connection.` This masks valid credential errors, email-confirmation errors, configuration faults, rate limits, and genuine network failures.

The repair will preserve real Supabase authentication and tenant resolution, add safe error classification, and avoid exposing credentials, access tokens, refresh tokens, or service-role secrets.
