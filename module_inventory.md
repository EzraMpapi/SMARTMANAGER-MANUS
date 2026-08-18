# Smart Manager ERP — Complete Internal Module Inventory

## Purpose and Completion Rule

This document is the internal source-of-truth checklist for the Smart Manager ERP visual presentation. It was produced only after inspecting the attached design directives, the complete client/server/shared source tree, the primary `BusinessSphereDashboard.jsx` module catalog, authentication components, the dedicated `TraPortalModule.jsx`, enterprise support components, and the supporting server/database modules.

The presentation **must not be marked complete** until every module marked **Major** below has a dedicated, high-fidelity presentation image. A grouped slide may contain more than one image, but each major module must still have its own standalone visual asset and its own checklist entry. No module may be renamed, removed, or replaced with an invented feature.

The source catalog defines 36 visible or role-addressable product modules. The application also contains major cross-cutting surfaces for authentication, the application shell, daily briefing, settings/security, and public marketing entry. Those cross-cutting surfaces are included because they are essential product experiences even when they are not all entries in the `MODULES` constant.

## Source Evidence Reviewed

| Evidence area | Verified source | What it establishes |
|---|---|---|
| Primary module catalog | `client/src/BusinessSphereDashboard.jsx`, `MODULES` around lines 3136–3172 | 36 role-addressable module labels and IDs, including core ERP, collaboration, compliance, industry, and employee surfaces |
| Role and access model | `client/src/BusinessSphereDashboard.jsx`, `ALL_MODULE_IDS` and `ROLES` around lines 3023–3105 | Tenant-visible module scope, owner/executive access, restricted employee access, auditor access, and portal roles |
| Application shell | `client/src/components/DashboardLayout.tsx`, `client/src/components/EnterpriseLayout.tsx`, `BusinessSphereDashboard.jsx` | Sidebar, top bar, responsive navigation, company/branch context, notifications, and role-based visibility |
| Authentication | `client/src/components/LoginModuleEcosystem.jsx`, `EnterpriseAuthViews.jsx`, `PublicAuthGateway.jsx`, passkey libraries | Login, registration, company setup, join-company, recovery, email confirmation, OAuth, and passkey flows |
| TRA compliance | `client/src/components/TraPortalModule.jsx`, `server/traFiscal.ts`, `server/traFiscalRouter.ts` | VFD/EFD fiscalization, VAT returns, receipt lifecycle, cryptographic audit trail, and Tanzania-first compliance terminology |
| Enterprise support surfaces | `AdminUserDirectoryView.tsx`, `ComplianceAuditLogView.tsx`, `DashboardPreferencesDrawer.tsx`, `PredictiveAnalyticsWorkspace.jsx` | User administration, security/audit evidence, preferences, predictive analytics, and executive control functions |
| Server and persistence layer | `server/routers.ts`, feature services/tests, `drizzle/schema.ts`, migrations | Backend contracts, tenant-scoped persistence, scheduled reports, webhooks, notifications, audit events, and integrations |

## Mandatory Major-Module Checklist

| ID | Source module / product surface | Source ID or evidence | Major capabilities that must be visible in the dedicated image | Dedicated image status |
|---:|---|---|---|---|
| 01 | **Public Brand & Marketing Entry** | `Home.tsx`, `PublicAuthGateway.jsx` | Smart Manager brand, Tanzania-first positioning, product overview, Launch App, capabilities and trust messaging | **Pending — image generation quota blocked first visual** |
| 02 | **Authentication & Secure Onboarding** | `LoginModuleEcosystem.jsx`, `EnterpriseAuthViews.jsx`, auth/passkey libraries | Login, sign-up, company registration, join company, email confirmation, password recovery/reset, OAuth, passkeys | **Pending — image generation quota blocked first visual** |
| 03 | **Master Application Shell & Navigation** | `DashboardLayout.tsx`, `EnterpriseLayout.tsx`, dashboard module switcher | Sidebar, company selector, branch context, breadcrumbs, global search, command palette, notifications, profile, responsive collapse | **Pending — image generation quota blocked first visual** |
| 04 | **Executive Dashboard** | `MODULES` ID `dashboard`; dashboard workspace | Current-date greeting, KPI cards, TZS/USD context, trends, alerts, quick actions, module health | **Pending — image generation quota blocked first visual** |
| 05 | **Daily Business Briefing** | Dashboard Daily Brief surface | Financial health, sales, receivables, inventory, HR, CRM, projects, operations, alerts, AI recommendations, executive download | **Pending — image generation quota blocked first visual** |
| 06 | **CRM & Customer Pipeline** | `MODULES` ID `crm` | Leads, opportunities, contacts, customers, Kanban pipeline, lead scoring, activities, customer 360 detail | **Pending — image generation quota blocked first visual** |
| 07 | **Sales & Billing** | `MODULES` ID `sales`; `SalesDetailWorkspace.jsx` | Quotations, sales orders, invoices, payment status, invoice preview/print, payment links, WhatsApp/email dispatch, multi-currency | **Pending — image generation quota blocked first visual** |
| 08 | **Point of Sale** | `MODULES` ID `pos`; POS helpers in `client/src/lib` | Cashier register, product search/barcode, split payments, offline queue, retry/sync, receipt printing, reconciliation | **Pending — image generation quota blocked first visual** |
| 09 | **Inventory & Warehouse Management** | `MODULES` ID `inventory` | Stock dashboard, SKU records, warehouses, transfers, batches, stock audit, reorder alerts, valuation, suppliers | **Pending — image generation quota blocked first visual** |
| 10 | **Procurement & Vendor Management** | `MODULES` ID `procurement` | Purchase orders, approvals, contracts, vendor payments, supplier portal, procurement workflow | **Pending — image generation quota blocked first visual** |
| 11 | **Finance & Accounting** | `MODULES` ID `finance` | Overview, receivables, expenses, general ledger, chart of accounts, budgets, banking, assets, loans, debtors, income, tax | **Pending — image generation quota blocked first visual** |
| 12 | **Reports & Scheduled Reporting** | `MODULES` ID `reports`, `dashboardReports.ts`, `reportSchedules.ts` | Sales, valuation, P&L, balance sheet, cash flow, credit profile, tax/VAT reports, scheduled dispatches, PDF/CSV exports | **Pending — image generation quota blocked first visual** |
| 13 | **Human Resources & Payroll** | `MODULES` ID `hr` | Employees, timetable, recruitment, attendance, performance, training/LMS, leave, benefits, payroll | **Pending — image generation quota blocked first visual** |
| 14 | **Manufacturing & Work Orders** | `MODULES` ID `manufacturing` | BOMs, work orders, machines, quality control, maintenance, inventory and procurement linkage | **Pending — image generation quota blocked first visual** |
| 15 | **Supply Chain & Logistics** | `MODULES` ID `scm` | Shipments, fleet, vehicles, driver/route context, logistics status, regional distribution | **Pending — image generation quota blocked first visual** |
| 16 | **Marketing** | `MODULES` ID `marketing` | Campaigns, SMS/email templates, customer segments, engagement operations, marketing performance | **Pending — image generation quota blocked first visual** |
| 17 | **E-Commerce** | `MODULES` ID `ecommerce` | Storefront, product catalog, online orders, inventory connection, checkout/order operations | **Pending — image generation quota blocked first visual** |
| 18 | **Documents & Secure Files** | `MODULES` ID `documents`, document helpers and notebook persistence | Document library, secure files, document download boundaries, previews, exportable evidence | **Pending — image generation quota blocked first visual** |
| 19 | **Projects & Task Management** | `MODULES` ID `projects` | Project list, task board, timeline, milestones, files, budgets, time logs | **Pending — image generation quota blocked first visual** |
| 20 | **Customer Support & Helpdesk** | `MODULES` ID `support` | Tickets, policies, live chat, knowledge base, call center, support AI, customer context | **Pending — image generation quota blocked first visual** |
| 21 | **Enterprise Analytics & Business Intelligence** | `MODULES` ID `analytics`, `PredictiveAnalyticsWorkspace.jsx` | Executive, financial, HR, sales, operations, KPIs, heatmaps, market trends, benchmarking, risk, data quality, predictive intelligence | **Pending — image generation quota blocked first visual** |
| 22 | **Notifications & Alerting** | `MODULES` ID `notifications`, notification services, channels | Email/SMS/WhatsApp/Slack/Teams configuration, delivery states, test alerts, digests, threshold notifications | **Pending — image generation quota blocked first visual** |
| 23 | **Activity Stream & Audit Evidence** | `MODULES` ID `activity`, `ComplianceAuditLogView.tsx`, audit services | Tenant activity timeline, compliance audit log, filters, evidence export, security events, retention/archive state | **Pending — image generation quota blocked first visual** |
| 24 | **Integration Hub** | `MODULES` ID `integrations`, integration connections | Slack, WhatsApp Business, payment and gateway connections, webhook URLs, signature verification, delivery testing | **Pending — image generation quota blocked first visual** |
| 25 | **Workflow Studio & Marketplace** | `MODULES` ID `workflows` | Visual workflow builder, triggers, actions, conditions, Slack/Teams notifications, templates, marketplace installation | **Pending — image generation quota blocked first visual** |
| 26 | **Collaboration Hub** | `MODULES` ID `collaboration` | Team chat, WhatsApp center, email center, calendar, team workspaces, secure notebook, file sharing | **Pending — image generation quota blocked first visual** |
| 27 | **TRA VFD Fiscalization Portal** | `MODULES` ID `tra_portal`; `TraPortalModule.jsx`; TRA server services | TRA VFD/EFD gateway, fiscal receipts, VAT returns, audit trail, Z reports, gateway status, statutory export and previews | **Pending — image generation quota blocked first visual** |
| 28 | **AI Assistant & Smart Intelligence** | `MODULES` ID `ai`, `AIChatBox.tsx`, server AI procedures | Prompt suggestions, cash-flow and stock anomaly analysis, approvals, chat/analysis, structured recommendations | **Pending — image generation quota blocked first visual** |
| 29 | **Microfinance** | `MODULES` ID `microfinance`; source-defined MFI views | Portfolio overview, client registry, loan book, applications, collections, MFI reports | **Pending — image generation quota blocked first visual** |
| 30 | **VICOBA / SACCOS** | `MODULES` ID `vicoba` | Group savings, member contributions, meeting-led financial operations, cooperative visibility | **Pending — image generation quota blocked first visual** |
| 31 | **Community Groups** | `MODULES` ID `community` | Group administration, member organization, community-led activity and contribution context | **Pending — image generation quota blocked first visual** |
| 32 | **Healthcare / Clinic** | `MODULES` ID `healthcare` | Industry workspace preset and healthcare/clinic operations surface | **Pending — image generation quota blocked first visual** |
| 33 | **School Management** | `MODULES` ID `school` | Industry workspace preset and school administration surface | **Pending — image generation quota blocked first visual** |
| 34 | **Pharmacy Management** | `MODULES` ID `pharmacy` | Industry workspace preset and pharmacy operations surface | **Pending — image generation quota blocked first visual** |
| 35 | **Hotel & Hospitality** | `MODULES` ID `hotel` | Industry workspace preset and hospitality operations surface | **Pending — image generation quota blocked first visual** |
| 36 | **Fleet Management** | `MODULES` ID `fleet` | Vehicle-focused fleet operations, maintenance, status, and logistics context | **Pending — image generation quota blocked first visual** |
| 37 | **Banking & MFI** | `MODULES` ID `banking` | Banking-focused workspace, reconciliation, lending, and financial-services operations | **Pending — image generation quota blocked first visual** |
| 38 | **Restaurant & F&B** | `MODULES` ID `restaurant` | Industry workspace preset and restaurant/food-service operations surface | **Pending — image generation quota blocked first visual** |
| 39 | **Employee Portal** | `MODULES` ID `employee-portal`; role model restricts Employee to Dashboard + Employee Portal | Employee self-service, personal HR tasks, leave/attendance context, role-restricted workspace | **Pending — image generation quota blocked first visual** |
| 40 | **Enterprise Settings & Security Control Center** | Settings surfaces, `AdminUserDirectoryView.tsx`, preferences, security/audit services | Organization settings, branding, roles/permissions, user directory, security reminders, passkey readiness, webhooks, secrets, archives | **Pending — image generation quota blocked first visual** |

## Inventory Totals

The checklist currently contains **40 mandatory major visual assets**: 2 public/auth surfaces, 3 foundational workspace surfaces, 24 core enterprise modules and cross-cutting operational hubs, 11 Tanzania/Africa-ready vertical and role-specific surfaces. This count is intentionally broader than the original 21-slide draft because the source catalog includes additional live or role-addressable modules that cannot be omitted from a complete presentation.

## Visual Production Rules

All images must inherit one Smart Manager visual system: emerald and deep forest green, charcoal/near-black, white workspace surfaces, soft slate neutrals, restrained brushed-gold accents, Poppins-like display headings, Inter-like dense UI typography, 4/8px spacing logic, compact enterprise tables, clear permission states, and realistic desktop/tablet/mobile responsiveness.

The image sequence should preserve source terminology, show truthful data states, avoid fabricated testimonials or customer claims, and visually distinguish live/available, empty, restricted, loading, error, and permission states. When an industry module is a preset or smaller surface, the image must communicate that honestly as a workspace specialization rather than inventing unsupported workflows.

## Completion Gate

- [ ] All 40 inventory entries have a dedicated standalone presentation image.
- [ ] Every generated image has been visually checked for legibility, module terminology, responsive behavior, and shared design-system consistency.
- [ ] The final deck or image sequence references each inventory ID exactly once or clearly maps grouped slides to individual assets.
- [ ] No module is marked complete merely because a neighboring module appears in the same composite image.
- [ ] The final delivery includes this inventory and the complete visual asset set.

## Current Blocker

The first image-generation attempt was correctly delayed until after this inventory was created. The image-generation service then returned: **"You've reached today's free plan limit for image generation (20/20) — please upgrade or wait for your quota to reset."** Therefore, no visual asset has been marked complete. The inventory and presentation outline are prepared; image generation must resume when the quota is available.

## Related Content Draft

See `presentation_outline.md` for the substantive presentation narrative. The outline is a draft and must be revised to map to all 40 inventory IDs before final slide generation begins.

## References

- `client/src/BusinessSphereDashboard.jsx` — primary dashboard, role model, module catalog, and module-specific view routing.
- `client/src/components/LoginModuleEcosystem.jsx` — authentication and onboarding visual flow.
- `client/src/components/EnterpriseAuthViews.jsx` — enterprise auth experience.
- `client/src/components/TraPortalModule.jsx` — TRA Portal UI and fiscalization terminology.
- `client/src/components/DashboardLayout.tsx` and `client/src/components/EnterpriseLayout.tsx` — application shell and responsive navigation.
- `client/src/components/ComplianceAuditLogView.tsx` — compliance audit and evidence surfaces.
- `client/src/components/PredictiveAnalyticsWorkspace.jsx` — predictive analytics workspace.
- `server/traFiscal.ts`, `server/traFiscalRouter.ts`, `server/auditLogs.ts`, `server/reportSchedules.ts`, `server/webhooks.ts` — compliance, audit, scheduled reporting, and webhook service boundaries.
- `drizzle/schema.ts` and `drizzle/` migrations — persistence and tenant-scoped data structures.
- `/home/ubuntu/upload/pasted_content_4.txt` — user-provided Smart Manager UI/UX design directives.

## Update Log

| Date | Update |
|---|---|
| 2026-08-18 | Created initial inventory after source inspection. |
| 2026-08-18 | Expanded inventory from the first 21-module draft to all 40 major visual surfaces in the source catalog and cross-cutting product shell. |
| 2026-08-18 | Marked all image statuses pending after the daily image-generation limit prevented the first asset. |
``` 

