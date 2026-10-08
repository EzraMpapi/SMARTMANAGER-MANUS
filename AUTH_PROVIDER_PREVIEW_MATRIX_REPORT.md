# AuthProvider Authenticated Preview Matrix Report

**Date:** 23 August 2026
**Environment:** Local compiled preview served at `127.0.0.1:4173`
**Fixture policy:** All identities, tenants, tokens, and records were synthetic and intercepted in the browser. No Supabase production writes, user creation, tenant creation, role assignment, or business-data mutation was performed.

## Result

The disposable authenticated preview matrix passed **3 of 3 scenarios**. The browser exercised the compiled application, the real Supabase JavaScript client session APIs, the central provider, the root protected-surface decision, and the preserved tenant bootstrap boundary.

| Scenario | Result | Evidence |
|---|---:|---|
| Password sign-in through the managed Supabase client with a controlled tenant | **PASS** | Synthetic credential exchange returned a session; provider loaded profile/company rows; dashboard reached `Workspace overview`; managed session was stored under `smart-manager-auth`; legacy `bs_access_token` and `bs_session_access_token` remained absent |
| Invalid credentials remain unauthenticated | **PASS** | Synthetic token endpoint returned `400`; the UI showed `Invalid email or password.`; login remained available; no managed session was stored |
| Valid session without a verified profile/workspace identity | **PASS** | Synthetic session was retained, but the provider entered the incomplete-identity path and the root route rendered `Secure workspace setup required` instead of allowing the dashboard to dereference a null identity |

## Controlled fixture behavior

The browser intercepted only the preview Supabase endpoints. The password token endpoint accepted `owner@preview.invalid` with the disposable test password `PreviewPass!123`; any other credentials returned an invalid-credentials response. The user endpoint returned a synthetic Supabase user. REST reads returned synthetic profile/company rows for the authorized case and empty profile/company results for the incomplete-identity case. Membership, workspace, workforce-role, and role-permission reads returned empty arrays, ensuring that no live tenant or permission records were required.

The test intentionally verified that the managed auth storage contains the Supabase session envelope and user identity, not a client-forged company or permission assignment. Tenant identity was resolved through the provider’s profile/company reads and was not written into browser storage as an authority.

## Coverage boundary

This local preview matrix validates the provider and route behavior against deterministic browser-controlled responses. It does not prove connectivity to the real Supabase project, real email delivery, real OAuth-provider callbacks, real MFA/passkey ceremonies, or real RLS evaluation. Those require a deployed preview with disposable Supabase Auth users and controlled tenant fixtures.

The next authenticated staging matrix should add password recovery and update-password, OAuth callback success and failure, token refresh, sign-out, direct protected URLs, two disposable tenants, permission allow/deny cases, and POS/workforce adapter calls under real verified JWTs. Any disposable staging rows and identities must be removed after the run or isolated in an expiring test project.

## Local artifacts

The browser test is stored at `browser-tests/authProviderPreview.spec.ts`. Temporary Playwright screenshots and traces were removed after the final passing run. The preview test file and provider implementation remain local and uncommitted; no deployment or GitHub push was performed as part of this validation request.
