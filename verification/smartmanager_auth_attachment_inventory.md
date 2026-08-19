# SmartManagerAuth.jsx migration inventory

Source: `/home/ubuntu/upload/SmartManagerAuth.jsx` (1,649 lines).

The attachment exports one root `SmartManagerAuth` component with three views: `LoginPage`, `SignupPage`, and `JoinCompanyPage`. It also defines shared non-login visual primitives (`BrandMark`, `AuthTextField`, `PasswordField`, `ErrorBox`, `SuccessBox`, `AuthShell`, `SelectField`, and `PasswordStrength`) plus onboarding constants for company categories, countries, currencies, calling codes, modules, scale presets, and join roles.

The user explicitly requires the login page to remain unchanged. Therefore, the active `LoginPage` and the existing `EnterpriseLoginView` / login handler flow are frozen. The implementable scope is the attachment's non-login experience: the two-step workspace signup / company registration flow, its email-confirmation state, the attached join-company flow, and the shared non-login visual system. Existing authenticated persistence contracts, role gates, tenant-scoped company writes, and live onboarding procedures must be retained rather than replaced by unverified copy-paste network calls.

Current project routing sends `/app?auth=signup` into the existing `BusinessSphereDashboard` auth branch, where `SignupPage` is currently implemented and already owns real company creation / join RPC behavior. `PublicAuthGateway` owns the separate public login, forgot-password, reset, and verification screens; its `EnterpriseLoginView` is the login surface to leave untouched.
