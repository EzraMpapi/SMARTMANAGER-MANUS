#import "report-theme.typ": report-accent, report-theme

#show: report-theme.with(
  title: "SMART MANAGER — Complete UI/UX Design System & Application Blueprint",
  author: "Manus AI",
  rhythm: "report",
  running-header: true,
)

#page(margin: (top: 25%, x: 2.2cm), numbering: none, header: none)[
  #set par(first-line-indent: 0em)
  #align(center)[
    #text(size: 30pt, weight: "bold", fill: report-accent)[SMART MANAGER]
    #v(0.3em)
    #text(size: 21pt, weight: "bold")[Complete UI/UX Design System & Application Blueprint]
    #v(0.8em)
    #text(size: 13pt, fill: luma(90))[Source-grounded enterprise product design package]
    #v(2em)
    #line(length: 44%, stroke: 1pt + report-accent)
    #v(2em)
    #text(size: 12pt)[Tanzania-first. Africa-ready. Enterprise-grade.]
    #v(1em)
    #text(size: 10pt, fill: luma(90))[Prepared from the existing SMART MANAGER source tree, navigation catalog, role model, workspaces, persistence contracts, and responsive design tokens.]
    #v(3em)
    #text(size: 11pt)[Author: Manus AI]
    #text(size: 10pt, fill: luma(100))[23 August 2026]
  ]
]

#page(numbering: none, header: none)[
  #outline(title: [Contents], indent: 1.5em)
]
#counter(page).update(1)

= Executive design overview

Smart Manager is an enterprise operating system for businesses and specialized institutions that need a trustworthy, role-aware view of money, people, operations, compliance, and evidence. The visual package preserves the application’s existing product identity: a Noble dark shell, emerald action states, restrained brushed-gold accents, light operational workspaces, Poppins-like headings, Inter-like dense UI, compact tables, and clear permission and audit states.

The package is grounded in the source-defined navigation catalog of 39 modules, 36 roles, the primary dashboard routing, dedicated authentication and vertical workspaces, server-side persistence boundaries, Supabase tenant controls, and responsive CSS behavior. It expands those foundations into a coherent visual grammar rather than inventing disconnected screens.

#table(
  columns: (1.2fr, 1fr, 2.6fr),
  stroke: .5pt + luma(210),
  inset: 6pt,
  [*Coverage*], [*Evidence*], [*Design outcome*],
  [Source discovery], [39 modules / 36 roles / 924 detected components], [A complete navigation, role, and screen inventory with truthfulness boundaries.],
  [Workflow design], [21 end-to-end sequences], [Entry, form, validation, confirmation, processing, success, result, and recovery states.],
  [Visual language], [Existing CSS and representative workspaces], [One reusable system for shell, cards, tables, forms, modals, evidence, and responsive behavior.],
  [Visual assets], [20 generated mockups + 3 deterministic diagrams], [Reference visuals for core, vertical, compliance, cooperative, and mobile experiences.],
)

= Design principles

*Operational calm.* Every screen should answer what is happening, what needs attention, and what the user can safely do next. Density is useful only when hierarchy remains obvious.

*Trust before delight.* Financial, clinical, education, property, and compliance experiences show source freshness, permission scope, status, actor, timestamps, and audit evidence. A toast never substitutes for a confirmed result.

*One shell, many domains.* Modules may have distinct terminology and tabs, but they share navigation, search, tables, forms, status language, evidence, and responsive behavior.

*Tanzania-first by default.* TZS, East Africa Time, mobile-money references, TRA evidence, Kiswahili-friendly entry points, local contact formats, and regional context are treated as first-class product requirements.

*Minimum necessary visibility.* A role sees what it needs for its work. Clinical, financial, property, education, and external portal experiences explain restricted scope rather than silently failing.

*Recovery is a designed state.* Draft preservation, retry, actionable errors, offline queues, and support paths are designed with the same care as happy paths.

*Responsive re-composition.* Mobile is not a compressed desktop. Tables scroll in their own container, actions wrap or become sticky, tabs preserve readable labels, and drawers become full-screen sheets.

= Color system

#table(
  columns: (1.4fr, 1.2fr, 2.5fr),
  stroke: .5pt + luma(210),
  inset: 6pt,
  [*Token*], [*Value*], [*Application*],
  [Noble gold], [\#C9A96E], [Premium accent, selected executive state, focus ring, primary shell emphasis.],
  [Emerald action], [\#16A34A], [Confirmed actions, healthy status, success, active navigation.],
  [Deep slate], [\#0B1120], [Dark shell, authentication canvas, high-contrast framing.],
  [Noble navy], [\#131C31], [Elevated shell panels and navigation depth.],
  [Workspace white], [\#FFFFFF], [Operational canvas, forms, tables, detail surfaces.],
  [Tanzania green], [\#008A45], [Regional identity cue, used sparingly alongside product emerald.],
  [Tanzania blue], [\#1F75FE], [Information, service, and in-transit states.],
  [Tanzania yellow], [\#FCD116], [Sparse highlight; do not use where warning severity could be confused.],
  [Danger], [\#DC2626], [Destructive action, blocking error, compliance or risk exception.],
)

The primary visual contrast is between a confident deep shell and a quiet light work surface. Emerald carries action and health; gold carries premium emphasis without replacing semantic colors. Slate neutrals carry the majority of text and borders so the interface does not become an alarm board.

= Typography and spacing

Use Poppins for headings, page landmarks, and high-level navigation. Use Inter for tables, labels, metadata, helper text, and form controls. Use a 4/8px spacing rhythm, a 12px base radius, 16–24px workspace card padding, and compact 12–14px operational copy. Heading levels must remain visually distinct, with line length and whitespace controlled before adding decoration.

#table(
  columns: (1.3fr, 1fr, 2.3fr),
  stroke: .5pt + luma(210),
  inset: 6pt,
  [*Type role*], [*Treatment*], [*Use*],
  [Display], [Poppins 28–36pt, strong weight], [Cover, major page titles, executive statements.],
  [Section], [Poppins 18–24pt, semibold], [Module titles, workflow sections, major panels.],
  [Operational], [Inter 12–14pt, medium/semibold], [Tables, forms, labels, statuses, metadata.],
  [Helper], [Inter 11–12pt, muted slate], [Validation guidance, freshness, permission explanation.],
)

= Component system

#table(
  columns: (1.3fr, 2.3fr, 2fr),
  stroke: .5pt + luma(210),
  inset: 6pt,
  [*Component*], [*Default composition*], [*Required states*],
  [Primary button], [Emerald or gold fill, high contrast, 10–12px radius, clear verb], [Idle, hover, pressed, loading, disabled, permission blocked],
  [Secondary button], [White or transparent, slate border], [Idle, hover, disabled],
  [KPI card], [Metric, delta, period, optional sparkline or source], [Loading, populated, stale, unavailable],
  [Table], [Sticky header, identity column, status chip, compact rows], [Empty, loading, error, selected, bulk mode],
  [Form], [Sectioned fields, required markers, inline help, summary], [Pristine, dirty, invalid, submitting, confirmed, server error],
  [Modal/drawer], [Focus-trapped title, consequence, action pair], [Open, processing, success, error, cancel],
  [Toast], [Bottom-right desktop, full-width mobile, icon plus sentence], [Success, error, info, warning, dismiss],
  [Tabs], [Segmented strip with readable intrinsic labels], [Selected, keyboard focus, overflow scroll],
  [Evidence timeline], [Actor, time, action, resource, evidence link], [Filtered, empty, export-ready],
)

= Navigation architecture

The application shell is a persistent context layer: role-filtered module rail, company and branch selector, global search, notifications, account menu, and responsive collapse. A module then adds a local context bar, tabs or sub-navigation, operational workspace, and trust layer.

#figure(image("assets/diagrams/navigation-architecture.png", width: 100%), caption: [Source-grounded Smart Manager navigation architecture.])

A module should not force users to relearn the shell. Local modules may add domain tabs such as Patients, Appointments, Visits, Prescriptions, or Community Groups’ Members & KYC, Funds & Savings, Loans, Meetings, Governance, Communications, Documents & Events, and Reports. The global context remains visible so the user always knows the tenant, role, branch, and notification state.

= Role and user experience map

The source defines 36 roles across system, executive, department, financial-services, property, operations, healthcare, education, general-staff, oversight, and external-portal categories. The design maps visibility and write access to visible UI states: full access, domain-first access, operate-within-limits, read-only evidence, or scoped portal access.

#figure(image("assets/diagrams/role-access-map.png", width: 100%), caption: [Role and permission experience map.])

| Role lens | Landing priority | UI treatment |
|---|---|---|
| Executive / owner | Cross-module position and exceptions | Broad KPI dashboard, decision queue, reports, approvals, and audit links. |
| Department / operations | Domain queue and next action | Module-first landing, saved filters, actionable tables, and workflow status. |
| Specialist / frontline | Fast, safe task completion | Touch-friendly controls, minimum necessary data, confirmation and receipt states. |
| Portal / external | What belongs to me | Scoped records, simple language, visible boundaries, and no implied access beyond role. |
| Auditor / oversight | Is this correct and authorized? | Read-only evidence, immutable timeline, filters, export, and freshness markers. |

= Complete module map

The module map follows the actual source order. Each module receives an overview, list/queue, detail, create/edit form, workflow/approval, and report/evidence design reference in the companion screen inventory and per-module specification files.

#table(
  columns: (0.5fr, 1.8fr, 2.1fr),
  stroke: .5pt + luma(210),
  inset: 5pt,
  [*No.*], [*Module*], [*Experience family*],
  [01], [Dashboard], [Executive command],
  [02], [CRM], [Customer and pipeline],
  [03], [Sales], [Commercial operations],
  [04], [Subscription Billing], [Platform administration],
  [05], [Inventory], [Stock and warehouse],
  [06], [Procurement], [Purchasing and vendors],
  [07], [Finance], [Accounting and cash],
  [08], [Reports], [Insight and exports],
  [09], [HR], [Workforce],
  [10], [Manufacturing], [Production],
  [11], [Supply Chain], [Logistics],
  [12], [Marketing], [Campaigns],
  [13], [E-Commerce], [Digital commerce],
  [14], [Point of Sale], [Frontline checkout],
  [15], [Documents], [Secure files],
  [16], [Projects], [Delivery and tasks],
  [17], [Customer Support], [Service operations],
  [18], [Analytics], [Business intelligence],
  [19], [Notifications], [Alert routing],
  [20], [Activity Stream], [Audit and evidence],
  [21], [Integration Hub], [External connections],
  [22], [Workflow Studio], [Automation],
  [23], [Collaboration Hub], [Team communication],
  [24], [TRA Portal], [Tanzania tax compliance],
  [25], [AI Assistant], [Contextual intelligence],
  [26], [Microfinance], [MFI operations],
  [27], [Money Agent], [Wallet and agent operations],
  [28], [Property Management], [Property operations],
  [29], [VICOBA / SACCOS], [Cooperative finance],
  [30], [Community Groups], [Community finance and governance],
  [31], [Healthcare / Clinic], [Clinical operations],
  [32], [School Management], [Education operations],
  [33], [Pharmacy Management], [Pharmacy operations],
  [34], [Hotel & Hospitality], [Hospitality operations],
  [35], [Fleet Management], [Fleet operations],
  [36], [Banking & MFI], [Financial services],
  [37], [Restaurant & F&B], [Food service],
  [38], [Employee Portal], [Staff self-service],
  [39], [Presentation Progress], [Internal showcase and progress],
)

= Screen inventory and design specification

The companion `02-Architecture/SCREEN-INVENTORY.md` contains *234 module screen records*: six screen families for each of the 39 source-defined modules. Every record specifies the screen name, role, purpose, components, primary and secondary actions, data, responsive behavior, validation, and related screens. The companion `03-Module-Specifications/` folder contains a dedicated design reference for each module.

The six shared screen families are:

+ *Overview / command center:* KPI cards, trend or chart, alert rail, recent activity, and quick actions.
+ *List / queue:* search, filters, saved views, sortable table, pagination, and bulk actions.
+ *Record detail:* header, status, summary, related records, activity timeline, and permission scope.
+ *Create / edit form:* sectioned fields, required markers, inline help, validation summary, and save/cancel.
+ *Workflow / approval:* stepper, maker-checker state, approval drawer, confirmation, and audit event.
+ *Report / evidence:* filters, table/chart, freshness indicator, export menu, and scheduling.

= Workflow visualization

All important workflows use the sequence *Entry → Form → Validation → Confirmation → Processing → Success → Result*. A server or permission failure branches to *Error → Retry / Save draft / Support*. The companion workflow specification covers 21 journeys including login/signup, customer creation, sales, procurement, POS, loans, payments, employee onboarding, healthcare, pharmacy, school, hotel, restaurant, fleet, property, money agent, VICOBA/SACCOS, Community Groups governance, reporting, and settings.

#figure(image("assets/diagrams/canonical-transaction-sequence.png", width: 100%), caption: [Canonical transaction sequence for persistent, role-aware workflows.])

= Responsive and mobile strategy

#figure(image("assets/visuals/19-mobile-operations.png", width: 48%), caption: [Mobile and tablet composition for operations, Community Groups, and approval flows.])

== Desktop

Use a persistent sidebar, top context bar, 12-column grid, two-column detail workspaces, sticky table headers, and an evidence or action rail. Keep density high but preserve 16–24px card padding and visible section hierarchy.

== Tablet

Collapse the sidebar into a drawer, keep the top context bar, reduce the grid to six columns, stack detail/action panels when required, and preserve horizontal scrolling only inside tabs and tables.

== Mobile

Use a compact top bar, full-width page content, stacked KPIs, wrapping action groups, scrollable segmented tabs, and full-screen drawers or sheets. Keep primary actions visible and reserve sticky bottom actions for save/confirm workflows. A table may scroll horizontally but must retain a readable identity column and row height.

= Accessibility strategy

The design package requires strong contrast, visible focus rings, keyboard order matching visual order, labels associated with controls, error summaries that name fields, status conveyed by text plus color, reduced-motion behavior, minimum 44px mobile touch targets, and screen-reader text for icon-only controls. Permission explanations must remain accessible even when a control is disabled.

Motion is expressive but not required: the source CSS already disables key animation and transitions under `prefers-reduced-motion`. Charts require text summaries, tables require accessible headers, and toast messages must be announced without stealing focus.

= Module-by-module visual designs

The following visual library is a set of high-fidelity design references. The generated images are concept mockups, not claims that every depicted screen is currently implemented as an independent route. The source-grounded specifications and screen inventory remain the authoritative requirements.

#figure(image("assets/visuals/00-style-reference-executive-dashboard.png", width: 100%), caption: [00 — Shared visual language and executive dashboard reference.])
#pagebreak()
#figure(image("assets/visuals/01-authentication-onboarding.png", width: 100%), caption: [01 — Authentication and secure onboarding.])
#figure(image("assets/visuals/02-crm-customer-pipeline.png", width: 100%), caption: [02 — CRM and customer pipeline.])
#pagebreak()
#figure(image("assets/visuals/03-sales-billing.png", width: 100%), caption: [03 — Sales and billing.])
#figure(image("assets/visuals/04-inventory-warehouse.png", width: 100%), caption: [04 — Inventory and warehouse.])
#pagebreak()
#figure(image("assets/visuals/05-community-groups.png", width: 100%), caption: [05 — Community Groups finance and governance.])
#figure(image("assets/visuals/06-finance-accounting.png", width: 100%), caption: [06 — Finance and accounting.])
#pagebreak()
#figure(image("assets/visuals/07-pos-checkout.png", width: 100%), caption: [07 — Point of Sale and split payment.])
#figure(image("assets/visuals/08-reports-scheduled.png", width: 100%), caption: [08 — Reports and scheduled dispatch.])
#pagebreak()
#figure(image("assets/visuals/09-healthcare-clinic.png", width: 100%), caption: [09 — Healthcare and clinic operations.])
#figure(image("assets/visuals/10-settings-security.png", width: 100%), caption: [10 — Settings and security control center.])
#pagebreak()
#figure(image("assets/visuals/11-procurement-vendor.png", width: 100%), caption: [11 — Procurement and vendor approvals.])
#figure(image("assets/visuals/12-hr-payroll.png", width: 100%), caption: [12 — HR and payroll.])
#pagebreak()
#figure(image("assets/visuals/13-manufacturing-supply-chain.png", width: 100%), caption: [13 — Manufacturing and supply chain.])
#figure(image("assets/visuals/14-property-management.png", width: 100%), caption: [14 — Property management.])
#pagebreak()
#figure(image("assets/visuals/15-banking-mfi.png", width: 100%), caption: [15 — Banking and MFI.])
#figure(image("assets/visuals/16-vicoba-microfinance.png", width: 100%), caption: [16 — VICOBA/SACCOS and microfinance.])
#pagebreak()
#figure(image("assets/visuals/17-tra-fiscalization.png", width: 100%), caption: [17 — TRA fiscalization and evidence.])
#figure(image("assets/visuals/18-collaboration-integrations.png", width: 100%), caption: [18 — Collaboration and integrations.])

= Settings architecture

Settings is the control plane for organization identity, branding, user and role management, module entitlements, security, integrations, backups, and audit evidence. The page uses a left settings navigation and a right context-aware editor. High-risk changes show impact, affected roles, re-authentication requirements, save confirmation, and audit evidence.

| Settings area | Main design reference | Guardrail |
|---|---|---|
| Organization | Company profile, region, currency, timezone, branches | Confirm tenant context before save. |
| Branding | Logo, colors, auth background, public identity | Preserve official mark and provide preview/reset. |
| Users & Roles | User directory, role cards, access matrix | Explain module visibility and write scope. |
| Modules | Entitlements and enabled workspace list | Show dependencies and effective date. |
| Security | Passkeys, session timeout, sensitive-action re-authentication | Show readiness and recovery path. |
| Integrations | Provider, credentials, webhooks, delivery tests | Mask secrets; show connection and signature status. |
| Backups | Last/next backup, retention, restore evidence | Make freshness and recovery ownership visible. |
| Audit | Security events, configuration changes, export | Preserve append-only history and actor identity. |

= Design-to-development mapping

| Design requirement | Source anchor | Implementation direction |
|---|---|---|
| Shared shell | `BusinessSphereDashboard.jsx`, `EnterpriseLayout`, `DashboardLayout` | Consolidate shell tokens while keeping role-filtered navigation, context, search, notifications, and account controls. |
| Auth and onboarding | `PublicAuthGateway.jsx`, `EnterpriseAuthViews.jsx` | Reuse the auth card, language, focus, recovery, passkey, and verification states. |
| Shared state grammar | `client/src/index.css`, toast and confirmation components | Extract status, form, table, modal, drawer, and responsive primitives. |
| Domain workspaces | Community Groups, TRA Portal, Healthcare Clinic, and shared modules | Keep domain tabs and terminology while reusing evidence, workflow, and audit primitives. |
| Persistence trust | Supabase client, tRPC, server feature services, RLS migrations | Make confirmed server data the source of truth; surface pending/error/retry. |
| Role model | `ROLES`, `ALL_MODULE_IDS`, `ROLE_HOME_VIEW` | Map visibility and write access to visible explanations, not only hidden controls. |
| Testability | Vitest and Playwright suites | Add screenshot and interaction coverage for each major workspace and workflow state. |

= Final implementation recommendations

First, formalize the shared shell and state components so every module inherits the same context, status, form, table, and evidence behavior. Second, create a reusable workflow engine for validation, confirmation, processing, server confirmation, error recovery, and audit append. Third, add a screen-level design token layer so inline brand decisions become explicit and testable. Fourth, continue to treat Tanzania readiness as product behavior: TZS formatting, EAT dates, mobile-money reference patterns, TRA evidence, and Kiswahili-friendly entry points. Fifth, add visual regression coverage for desktop, tablet, and mobile at the module and workflow boundaries.

The most important product quality rule is simple: never display a successful business result until the server has confirmed the persistent record. When the system cannot confirm, preserve the user’s work, show the real cause, and provide a safe next action.

= Package contents

The companion ZIP contains the discovery report, design system, UX architecture, 234-screen inventory, 39 module specifications, 21 workflow specifications, responsive strategy, 20 visual mockups, three structured diagrams in Mermaid and PNG form, this master PDF, and quality-control evidence.

#align(center)[#text(fill: report-accent, weight: "bold")[SMART MANAGER — Simplify. Manage. Grow.]]
