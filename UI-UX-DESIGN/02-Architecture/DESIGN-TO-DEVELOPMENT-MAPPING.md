# Design-to-Development Mapping

| Design concern | Existing source anchor | Implementation recommendation |
|---|---|---|
| Global shell | `BusinessSphereDashboard.jsx`, `EnterpriseLayout`, `DashboardLayout` | Consolidate shell tokens and keep role-filtered navigation, company context, search, notifications, and account controls consistent. |
| Auth and onboarding | `PublicAuthGateway.jsx`, `EnterpriseAuthViews.jsx`, passkey/auth libraries | Use the same auth card, language, focus, recovery, passkey, and verification states across entry flows. |
| Shared state grammar | `client/src/index.css`, toast and confirmation components | Extract status, form, table, modal, drawer, and responsive primitives into documented design-system components. |
| Domain workspaces | `BusinessSphereDashboard.jsx`, `TraPortalModule.jsx`, `HealthcareClinicWorkspace.jsx`, Community Groups module | Keep module-specific tabs and terminology while reusing shell, table, form, workflow, evidence, and audit primitives. |
| Persistence and trust | Supabase client, tRPC routers, server feature services, RLS migrations | Make confirmed server data the source of truth; surface pending/error/retry and audit evidence. |
| Role model | `ROLES`, `ALL_MODULE_IDS`, `ROLE_HOME_VIEW` | Map visibility and write access to visible states, not only hidden controls; explain restrictions. |
| Testing | Vitest suites and Playwright browser tests | Add screenshot/interaction coverage for every major workspace and every critical workflow state. |
| Tanzania readiness | TZS formatting, Kiswahili auth copy, TRA module, mobile-money references | Make currency, dates, payment references, receipts, tax, and local contact patterns first-class. |
