# Smart Manager ERP — Master Bug Inventory & Root-Cause Audit

## Defect Inventory & Resolution Summary

| Defect Category | Symptom / Error | Root Cause | Resolution Strategy | Verification Status |
| :--- | :--- | :--- | :--- | :--- |
| **Runtime Scope** | `showConfigModal is not defined` | Modal state and event handlers were declared outside their owning component scope in the Collaboration Hub. | Relocated modal markup and state into the owning `WhatsAppCenter` component. | Resolved & Covered (`server/collaborationHub.test.ts`) |
| **Data Contract** | `(intermediate value).filter is not a function` | Raw unmapped API/Supabase responses were passed to array filtering without shape validation. | Added defensive array coercion and schema normalization helpers. | Resolved & Covered (`server/dashboard.integration.test.ts`) |
| **Build Memory** | Vite build SIGTERM under default memory limits | Large single-file bundle compression exceeded default Node heap allocation. | Configured `NODE_OPTIONS=--max-old-space-size=1536` for low-memory production builds. | Resolved & Verified (2,656 modules transformed) |
| **Authentication** | Login page modification risk | Protocol rule: Login page must be frozen byte-for-byte. | Isolated all onboarding/signup/recovery flows into `SignupPage`, `EmailConfirmationView`, and `PasswordRecoveryView`, leaving `LoginPage` untouched. | Verified via git diff & automated tests |
| **Security & Passkeys** | Missing confirmation notifications | Passkey enrollment lacked automated administrator email notification dispatch. | Integrated server-side Resend transactional email notification upon administrator passkey registration. | Resolved & Covered (`server/passkeyReadinessUi.test.ts`) |
