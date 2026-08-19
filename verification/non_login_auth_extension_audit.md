# Non-login auth extension audit

The active public auth flow is split between `PublicAuthGateway.jsx` and the authenticated bootstrap in `BusinessSphereDashboard.jsx`. `PublicAuthGateway` routes `auth=forgot`, `auth=reset`, and `auth=verify` to the shared `EnterpriseAuthViews.jsx` components, while `auth=signup` enters the existing onboarding flow. The real Supabase boundaries are already present: recovery uses the configured `recover` endpoint, reset uses a bearer recovery token with `user` update, and verification resend uses the `resend` endpoint.

The requested implementation should therefore restyle and strengthen the existing `ForgotPasswordView` and `VerificationView` rather than introduce duplicate auth calls. The existing `ResetPasswordView` shares the same shell and should inherit the same visual primitives. The login component remains out of scope and must not be edited.

The non-login onboarding page lives in `BusinessSphereDashboard.jsx` as `SignupPage`; it already has `mode`, `step`, `stepLabels`, `handleFinalSubmit`, `setStep`, and real account/company persistence. Smooth transitions can be added around the step content without changing those persistence handlers.
