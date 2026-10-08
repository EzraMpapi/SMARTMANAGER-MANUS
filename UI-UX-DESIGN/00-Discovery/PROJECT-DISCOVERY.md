# SMART MANAGER — Project Discovery

**Evidence basis:** source inspection of the existing repository, including the primary dashboard, authentication components, representative vertical workspaces, server routers/services, Drizzle schema, Supabase migrations, browser tests, and current design tokens. This package distinguishes **implemented/live surfaces** from **preset or incomplete surfaces** and does not invent product screens where the code exposes only a placeholder or coming-soon boundary.

## 1. Product architecture

| Layer | Verified implementation | UX implication |
|---|---|---|
| Public entry and auth | `client/src/pages/Home.tsx`, `PublicAuthGateway.jsx`, `EnterpriseAuthViews.jsx`, passkey libraries | Treat discovery, sign-in, recovery, verification, and company onboarding as one continuous entry journey. |
| Application shell | `client/src/BusinessSphereDashboard.jsx`, `EnterpriseLayout`, `DashboardLayout` | Persistent sidebar, company context, global search, notifications, account controls, responsive collapse, and role-driven module visibility are foundational patterns. |
| Primary workspaces | `BusinessSphereDashboard.jsx` plus dedicated modules such as `TraPortalModule.jsx`, `HealthcareClinicWorkspace.jsx`, `CommunityGroupsModule` | Use a shared shell and component grammar, with domain-specific tabs, metrics, forms, tables, approvals, and evidence panels. |
| Server boundary | Express, tRPC 11 routers and feature services in `server/` | Every important mutation needs an explicit pending, confirmed, error, retry, and audit state. |
| Persistence | Supabase PostgreSQL, Drizzle schemas, migrations, RLS and tenant checks | Design must expose tenant context, permission scope, data freshness, and audit evidence rather than implying local-only state. |
| Responsive layer | Tailwind responsive classes plus mobile composition rules in `client/src/index.css` | Mobile is a re-composed operational experience: full-width action groups, horizontally scrollable tabs/tables, and readable input controls. |

## 2. Source-defined navigation

The actual `MODULES` catalog contains **39 role-addressable navigation modules**. The source-defined order is preserved below.

| ID | Label | UX family |
|---|---|---|
| `dashboard` | Dashboard | Executive command |
| `crm` | CRM | Customer and pipeline |
| `sales` | Sales | Commercial operations |
| `billing` | Subscription Billing | Platform administration |
| `inventory` | Inventory | Stock and warehouse |
| `procurement` | Procurement | Purchasing and vendors |
| `finance` | Finance | Accounting and cash |
| `reports` | Reports | Insight and exports |
| `hr` | HR | Workforce |
| `manufacturing` | Manufacturing | Production |
| `scm` | Supply Chain | Logistics |
| `marketing` | Marketing | Campaigns |
| `ecommerce` | E-Commerce | Digital commerce |
| `pos` | Point of Sale | Frontline checkout |
| `documents` | Documents | Secure files |
| `projects` | Projects | Delivery and tasks |
| `support` | Customer Support | Service operations |
| `analytics` | Analytics | Business intelligence |
| `notifications` | Notifications | Alert routing |
| `activity` | Activity Stream | Audit and evidence |
| `integrations` | Integration Hub | External connections |
| `workflows` | Workflow Studio | Automation |
| `collaboration` | Collaboration Hub | Team communication |
| `tra_portal` | TRA Portal | Tanzania tax compliance |
| `ai` | AI Assistant | Contextual intelligence |
| `microfinance` | Microfinance | MFI operations |
| `money-agent` | Money Agent | Wallet and agent operations |
| `property-management` | Property Management | Property operations |
| `vicoba` | VICOBA / SACCOS | Cooperative finance |
| `community` | Community Groups | Community finance and governance |
| `healthcare` | Healthcare / Clinic | Clinical operations |
| `school` | School Management | Education operations |
| `pharmacy` | Pharmacy Management | Pharmacy operations |
| `hotel` | Hotel & Hospitality | Hospitality operations |
| `fleet` | Fleet Management | Fleet operations |
| `banking` | Banking & MFI | Financial services |
| `restaurant` | Restaurant & F&B | Food service |
| `employee-portal` | Employee Portal | Staff self-service |
| `presentation` | Presentation Progress | Internal showcase and progress |

## 3. Role and access model

The source defines **36 roles** across system, executive, department, financial-services, property, operations, healthcare, education, general-staff, oversight, and external-portal categories. The design package therefore includes an explicit role lens instead of presenting a single universal dashboard.

| Role family | Representative source roles | Experience rule |
|---|---|---|
| System and executive | Super Administrator, Organization Owner, CEO, CFO | Full or broad access; prioritize cross-module KPIs, governance, permissions, and exception queues. |
| Department heads | Finance Manager, HR Manager, Sales Manager | Broad visibility with domain-first landing views and action-focused shortcuts. |
| Financial services | Institution Administrator, Branch Manager, Money Agent Manager, Money Agent, Supervisor | Prioritize maker-checker, limits, settlement, liquidity, KYC/KYB, and reconciliation states. |
| Property operations | Property Administrator, Property Manager, Landlord / Owner, Property Agent, Tenant, Maintenance Staff, Property Finance Officer | Split portfolio, assigned work, owner statements, maintenance, and tenant self-service by role. |
| Operations | Procurement Officer, Warehouse Manager, Project Manager | Put operational queues, approvals, stock/task state, and exception handling ahead of executive decoration. |
| Customer service | Customer Support Agent | Ticket triage, customer context, communication history, and escalation state. |
| Healthcare | Clinic Administrator, Doctor, Nurse, Laboratory Technician, Pharmacist, Receptionist, Billing Officer | Enforce minimum-necessary clinical visibility and role-specific workflow panels. |
| Education and staff | School Administrator, Employee | School administration or restricted self-service; Employee is source-defined as Dashboard + Employee Portal with no write access. |
| Oversight and portals | Auditor, Customer, External Client, Supplier | Read-only or scoped experience; clearly communicate access limits and authentication boundaries. |

## 4. Actual UI patterns

The visual language is a hybrid of **Noble dark-shell branding** and **light operational workspaces**. The source defines Poppins for headings, Inter for dense UI copy, deep near-black/navy surfaces, emerald action accents, brushed gold as a premium primary token, slate neutrals, 12px base radius logic, glass panels, and motion that is disabled under `prefers-reduced-motion`.

The most reusable UI primitives are compact KPI cards, segmented module tabs, responsive tables, search/filter bars, rounded forms, success/error/info toasts, confirmation dialogs, permission gates, audit timelines, empty states, loading states, and tabbed domain workspaces. The package uses these primitives consistently across all modules.

## 5. Source truth and design boundaries

The application contains 25 directly detected module render routes in the monolithic dashboard plus dedicated component workspaces. Some navigation IDs are represented by specialized or suspense/coming-soon surfaces rather than a fully independent workspace. The design specification explicitly labels those as **specialized preset**, **shared workspace**, or **implementation follow-up** rather than presenting invented live functionality.

The complete design inventory expands each source module into a screen family: overview/dashboard, list/table, record detail, create/edit form, workflow or approval state, reporting/evidence, settings/integration, and responsive behavior where the module actually exposes those patterns. It also provides dedicated foundational designs for authentication, the shell, role management, notifications, activity/audit, and settings.

## 6. Discovery deliverables

The machine-readable evidence is stored in `discovery_source_summary.json`. The attached design package uses this report, the source module catalog, role definitions, auth components, vertical workspaces, persistence contracts, and existing tests as its evidence base.
