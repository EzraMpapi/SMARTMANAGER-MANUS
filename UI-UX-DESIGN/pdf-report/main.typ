// SMART MANAGER UI/UX master report
#import "report-theme.typ": report-accent, report-theme
#show: report-theme.with(title: "SMART MANAGER ERP — Complete UI/UX Design Package", author: "Manus AI", rhythm: "report", running-header: true)
#set page(paper: "a4", flipped: true, margin: (top: 1.45cm, bottom: 1.35cm, left: 1.45cm, right: 1.45cm))
#page(margin: (top: 30%, x: 2.2cm), numbering: none, header: none)[
  #align(center)[
    #text(size: 27pt, weight: "bold", fill: report-accent)[SMART MANAGER ERP — Complete UI/UX Design Package]
    #v(0.6em)
    #text(size: 14pt, fill: luma(80))[Source-aligned visual system, module references, workflows, and responsive design guidance]
    #v(1.4em)
    #line(length: 40%, stroke: 0.7pt + report-accent)
    #v(1.4em)
    #text(size: 11pt)[Author: Manus AI \ Date: #datetime.today().display("[year]-[month]-[day]")]
  ]
]
#page(numbering: none, header: none)[#outline(title: [Contents], indent: 1.5em)]
#counter(page).update(1)
= Executive overview

This master package is a *source-aligned UI/UX design reference* for SMART MANAGER ERP. It was prepared from the existing React/Vite client, the authoritative BusinessSphereDashboard.jsx module registry, the current role model, the Settings workspace, the shared design tokens, and the existing server/persistence boundaries. It preserves the application direction rather than replacing the production system.

The package contains *40 dedicated module and cross-cutting surface references*, *18 critical workflow diagrams*, a complete navigation and role map, responsive and accessibility guidance, and a component-level design-system reference. The record values shown inside the mockups are deliberately labelled as illustrative design-reference data; they are not claims about production database values.

== What is verified

The module names, role vocabulary, route structure, Settings capabilities, and design-token direction are grounded in the current repository. The visual mockups are intentionally organized as high-fidelity implementation references: they communicate layout, information hierarchy, states, action placement, and responsive composition without pretending to be captured runtime screenshots. The workflow diagrams express the intended interaction sequence and the required control points for each domain.

== Architectural design principle

> A reliable enterprise screen should make *context, ownership, status, validation, next action, and evidence* visible at the same time.

This principle is especially important for financial, clinical, identity, cooperative, inventory, and compliance workflows. A successful mutation should not merely disappear into the interface; it should produce a visible result state and a traceable record.

= Design-system reference

#text(size: 9pt, fill: luma(95))[Emerald operations · noble gold authority · slate evidence · paper workspace]

#align(center)[#image("assets/design_system_reference.png", width: 98%)]


The visual system uses deep forest green for navigation and trusted workspace framing, emerald for primary actions and healthy states, noble gold for authority and highlighted controls, paper-white surfaces for working content, slate for secondary information, and red/amber for explicit exceptions. Headings use a Poppins-like display treatment and dense UI text uses an Inter-like sans-serif treatment. Spacing follows the existing 4/8px logic with moderate radii, compact cards, and restrained shadows.

= Navigation architecture

#text(size: 9pt, fill: luma(95))[Global context, role-aware navigation, local workspace, and record-level evidence]

The application information architecture follows a stable hierarchy: *public entry → authentication/onboarding → tenant and branch context → module navigation → local workspace tabs → record detail → confirmation/result*. The current company and active branch must remain visible. The global shell should not change its meaning when the user moves between Finance, HR, Healthcare, Banking & MFI, VICOBA/SACCOS, or industry workspaces.

On desktop, the shell supports a persistent sidebar, command palette, global search, notifications, profile, and contextual breadcrumbs. On tablet, secondary actions move into drawers and the module navigation can collapse. On mobile, the sidebar becomes a bottom navigation plus a slide-over module drawer. Dense tables become intentional scroll regions or cards; typography is not compressed below readability.


| Navigation level | Responsibility | Design rule |
|---|---|---|
| Global shell | Tenant, branch, role, search, notifications, profile | Never hide company, branch, currency, or current role context. |
| Module | Domain command center | One clear primary action and one visible health/status summary. |
| Local view | List, board, timeline, or report | Preserve filters and return paths. |
| Record | Detail, form, approval, evidence | Show identity, status, owner, audit, and related records together. |
| Result | Success, error, pending, restricted | Explain what happened, what did not change, and the next safe action. |

= Role and permission experience

#text(size: 9pt, fill: luma(95))[The module catalog is not an access grant; the role state must be visible]

The source role model includes executive, department-head, financial-services, property, healthcare, education, front-line, auditor, employee, customer, supplier, and other external or self-service roles. The design should expose the role context and show permission states honestly. A module visible in the catalog does not imply that a user may view or mutate every record inside it.

| Role pattern | Experience contract |
|---|---|
| Owner / administrator | Configuration and evidence controls are visible; destructive and financial actions still require confirmation and audit. |
| Auditor | Broad read access and evidence export; no create, edit, or delete affordances. |
| Department head | Broad oversight with focused primary workspaces and governed actions. |
| Front-line operator | Fast task execution, minimal navigation, clear confirmation, and exception recovery. |
| Employee / self-service | Own-record workflows only; no organization-wide operational tables. |
| Restricted / unavailable | Show the missing permission or escalation path; do not present authorization failure as an empty dataset. |

= State, form, and component contract

#text(size: 9pt, fill: luma(95))[Every async surface must communicate what the system knows]

Each query or mutation surface should define loading, empty, success, error, restricted, pending, and stale-data states. Forms should validate required values inline, preserve unsaved changes, prevent double submission, and show a confirmation step before high-impact writes. Financial and clinical actions need a visible reference, owner, resulting status, and audit affordance.

The shared component vocabulary is intentionally compact: command header, KPI card, status badge, filter strip, data table, board/timeline, detail drawer, confirmation dialog, toast, empty-state panel, skeleton, result banner, and evidence timeline. These components should be composed consistently instead of creating a separate visual language for every module.

= Module visual reference gallery

#text(size: 9pt, fill: luma(95))[Each major surface has its own standalone implementation reference]

The following gallery is the completion-oriented visual index. Each module has a dedicated page so that a grouped overview cannot conceal missing product surfaces. The design reference for every page specifies the intended user, purpose, primary actions, displayed data, fields, connected surfaces, validation behavior, and responsive composition.

#pagebreak()
= 01 · Public Brand \& Marketing Entry

#text(size: 9pt, fill: luma(95))[brand · primary role: Visitor / prospect]
#align(center)[#image("assets/modules/01_public_brand_marketing_entry.png", width: 98%)]

*Design intent.* Explain the Tanzania-first ERP value proposition and route the user into the secure workspace.

*Workspace composition.* Brand mark, capability cards, trust strip, CTA, language selector The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Launch App; view capabilities; contact/support*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Brand promise, module families, compliance positioning Forms center on *Language; workspace entry intent*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Authentication; Dashboard. Workflow: Discovery → Launch App → Auth Gateway.

#pagebreak()
= 02 · Authentication \& Secure Onboarding

#text(size: 9pt, fill: luma(95))[brand · primary role: Visitor / owner / invited user]
#align(center)[#image("assets/modules/02_authentication_secure_onboarding.png", width: 98%)]

*Design intent.* Authenticate safely and guide new organizations through setup or joining.

*Workspace composition.* Login form, sign-up wizard, recovery, OAuth/passkey options, progress indicator The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Sign in; create company; join company; recover access*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Identity, company, role, verification state Forms center on *Email; password; company name; country; industry; invite code*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Brand Entry; Settings; Employee Portal. Workflow: Entry → Credentials → Validation → Verification → Workspace.

#pagebreak()
= 03 · Master Application Shell \& Navigation

#text(size: 9pt, fill: luma(95))[dashboard · primary role: All authenticated roles]
#align(center)[#image("assets/modules/03_master_application_shell_navigation.png", width: 98%)]

*Design intent.* Provide persistent navigation, context, global search, notifications, and safe mobile access.

*Workspace composition.* Sidebar, command palette, company/branch selector, top bar, bottom nav, breadcrumbs The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Switch module; search; open notifications; profile; collapse nav*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Active tenant, branch, role, entitlements, unread counts Forms center on *Company; branch; active module; density; theme*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Every module; Settings. Workflow: Auth → Shell → Module route → Contextual workspace.

#pagebreak()
= 04 · Executive Dashboard

#text(size: 9pt, fill: luma(95))[dashboard · primary role: Owner / CEO / CFO / auditor]
#align(center)[#image("assets/modules/04_executive_dashboard.png", width: 98%)]

*Design intent.* Give a trusted cross-module operating view with KPI context and next actions.

*Workspace composition.* KPI cards, trend chart, alerts, quick actions, module health, date context The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Open detail; filter period; export brief; act on alert*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Revenue, receivables, stock, people, approvals, risk Forms center on *Period; currency; department; branch*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Finance; Sales; HR; Inventory; Analytics. Workflow: Load context → KPIs → Drill-down → Action.

#pagebreak()
= 05 · Daily Business Briefing

#text(size: 9pt, fill: luma(95))[dashboard · primary role: Executive / manager]
#align(center)[#image("assets/modules/05_daily_business_briefing.png", width: 98%)]

*Design intent.* Turn daily operational signals into an actionable briefing.

*Workspace composition.* Briefing timeline, health score, exceptions, recommendation cards, export The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Acknowledge; open evidence; export PDF; assign follow-up*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Sales, cash, inventory, HR, CRM, projects, controls Forms center on *Date; severity; owner; status*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Dashboard; Reports; AI Assistant. Workflow: Signals → Prioritization → Evidence → Decision → Follow-up.

#pagebreak()
= 06 · CRM \& Customer Pipeline

#text(size: 9pt, fill: luma(95))[other · primary role: Sales Manager / support agent]
#align(center)[#image("assets/modules/06_crm_customer_pipeline.png", width: 98%)]

*Design intent.* Manage leads and opportunities through a visible revenue pipeline.

*Workspace composition.* Kanban, customer 360, lead score, activity composer, filters The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create lead; qualify; move stage; schedule activity*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Leads, contacts, opportunities, activities, probability Forms center on *Name; phone; email; stage; value; owner; next action*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Sales; Marketing; Support. Workflow: Lead → Qualify → Proposal → Negotiation → Won/Lost.

#pagebreak()
= 07 · Sales \& Billing

#text(size: 9pt, fill: luma(95))[sales · primary role: Sales Manager / finance officer]
#align(center)[#image("assets/modules/07_sales_billing.png", width: 98%)]

*Design intent.* Convert quotations and orders into invoices, receipts, and payment evidence.

*Workspace composition.* Document tabs, line-item editor, tax summary, invoice preview, dispatch drawer The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create quote; accept order; issue invoice; record payment; send*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Customers, products, tax, totals, payment status, receipts Forms center on *Customer; lines; tax; due date; channel; currency*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* CRM; Inventory; POS; Finance; TRA. Workflow: Quote → Order → Invoice → Payment → Receipt → Ledger.

#pagebreak()
= 08 · Point of Sale

#text(size: 9pt, fill: luma(95))[sales · primary role: Cashier / store manager]
#align(center)[#image("assets/modules/08_point_of_sale.png", width: 98%)]

*Design intent.* Process fast, auditable sales online or through the controlled offline queue.

*Workspace composition.* Product search, cart, tender selector, receipt panel, shift controls, sync banner The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Scan; hold; tender; refund; print; reconcile; retry sync*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* SKU, quantity, tax, tender, cashier, device, queue status Forms center on *Barcode; quantity; discount; payment method; customer*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Inventory; Finance; Sales; TRA. Workflow: Open shift → Cart → Tender → Confirm → Receipt → Reconcile.

#pagebreak()
= 09 · Inventory \& Warehouse Management

#text(size: 9pt, fill: luma(95))[inventory · primary role: Warehouse Manager / procurement officer]
#align(center)[#image("assets/modules/09_inventory_warehouse_management.png", width: 98%)]

*Design intent.* Control stock availability, movements, valuation, and reorder decisions.

*Workspace composition.* Stock table, warehouse selector, movement drawer, reorder cards, batch detail The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Receive; transfer; adjust; reserve; export; audit*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* SKU, batches, warehouses, balances, valuation, reorder points Forms center on *SKU; warehouse; quantity; batch; reason; supplier*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Procurement; POS; Manufacturing; SCM. Workflow: Request → Approve → Receive/Move → Reconcile → Report.

#pagebreak()
= 10 · Procurement \& Vendor Management

#text(size: 9pt, fill: luma(95))[inventory · primary role: Procurement Officer]
#align(center)[#image("assets/modules/10_procurement_vendor_management.png", width: 98%)]

*Design intent.* Control supplier sourcing, approvals, orders, and vendor settlement evidence.

*Workspace composition.* Vendor directory, requisition queue, PO builder, approval trail, payment status The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create requisition; approve PO; receive; match invoice*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Vendors, POs, contracts, receipts, approvals, payments Forms center on *Vendor; items; budget; delivery; approver; terms*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Inventory; Finance; Projects. Workflow: Need → Requisition → Approval → PO → Receipt → Settlement.

#pagebreak()
= 11 · Finance \& Accounting

#text(size: 9pt, fill: luma(95))[finance · primary role: CFO / Finance Manager / auditor]
#align(center)[#image("assets/modules/11_finance_accounting.png", width: 98%)]

*Design intent.* Provide controlled financial operations, ledgers, reconciliations, tax, and budgets.

*Workspace composition.* Ledger navigator, account cards, reconciliation workspace, budget panels, journal review The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Post journal; reconcile; approve; close period; export statement*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Accounts, journals, invoices, expenses, budgets, bank balances Forms center on *Account; date; debit; credit; cost centre; tax; period*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Sales; Procurement; POS; Bank \& MFI; Reports. Workflow: Source event → Journal → Approval → Posting → Reconciliation → Close.

#pagebreak()
= 12 · Reports \& Scheduled Reporting

#text(size: 9pt, fill: luma(95))[reports · primary role: Executive / auditor / manager]
#align(center)[#image("assets/modules/12_reports_scheduled_reporting.png", width: 98%)]

*Design intent.* Deliver governed financial, operational, compliance, and scheduled reports.

*Workspace composition.* Report catalog, parameter drawer, preview, schedule editor, delivery history The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Run; filter; export PDF/CSV; schedule; resend*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Report metadata, parameters, snapshots, delivery status Forms center on *Period; branch; currency; recipients; schedule*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Dashboard; Finance; Analytics; Notifications. Workflow: Select → Parameterize → Generate → Review → Deliver → Archive.

#pagebreak()
= 13 · Human Resources \& Payroll

#text(size: 9pt, fill: luma(95))[hr · primary role: HR Manager / employee]
#align(center)[#image("assets/modules/13_human_resources_payroll.png", width: 98%)]

*Design intent.* Manage the employee lifecycle and payroll-adjacent operations with role separation.

*Workspace composition.* Employee directory, profile, attendance, leave queue, payroll summary, LMS cards The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Onboard; approve leave; review attendance; export payroll*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Employees, departments, leave, attendance, benefits, payroll Forms center on *Identity; department; contract; leave dates; approval; pay period*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Employee Portal; Finance; Documents. Workflow: Candidate → Onboard → Attend → Leave/Payroll → Review.

#pagebreak()
= 14 · Manufacturing \& Work Orders

#text(size: 9pt, fill: luma(95))[other · primary role: Operations / warehouse manager]
#align(center)[#image("assets/modules/14_manufacturing_work_orders.png", width: 98%)]

*Design intent.* Coordinate BOMs, work orders, quality, maintenance, and material consumption.

*Workspace composition.* BOM table, work-order board, machine status, QC checklist, maintenance log The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Release WO; issue materials; record output; inspect; close*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* BOMs, work orders, machines, QC, maintenance, outputs Forms center on *BOM; quantity; machine; operator; inspection; variance*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Inventory; Procurement; SCM; Finance. Workflow: Plan → Release → Consume → Produce → Inspect → Close.

#pagebreak()
= 15 · Supply Chain \& Logistics

#text(size: 9pt, fill: luma(95))[other · primary role: Warehouse Manager / logistics lead]
#align(center)[#image("assets/modules/15_supply_chain_logistics.png", width: 98%)]

*Design intent.* Track movement of goods, fleet context, route status, and regional distribution.

*Workspace composition.* Shipment board, route map, vehicle status, ETA cards, exception queue The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create shipment; assign route; update status; confirm delivery*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Shipments, routes, drivers, vehicles, ETAs, proof of delivery Forms center on *Origin; destination; carrier; vehicle; ETA; POD*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Fleet; Inventory; Sales; Procurement. Workflow: Order → Plan → Dispatch → Track → Deliver → Reconcile.

#pagebreak()
= 16 · Marketing

#text(size: 9pt, fill: luma(95))[other · primary role: Sales Manager / marketing lead]
#align(center)[#image("assets/modules/16_marketing.png", width: 98%)]

*Design intent.* Plan campaigns, segments, messages, and measurable engagement.

*Workspace composition.* Campaign board, audience segments, template preview, performance cards The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create campaign; segment; schedule; pause; review*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Campaigns, audiences, templates, sends, engagement metrics Forms center on *Name; channel; segment; content; schedule; consent*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* CRM; Notifications; E-Commerce. Workflow: Segment → Compose → Approve → Send → Measure.

#pagebreak()
= 17 · E-Commerce

#text(size: 9pt, fill: luma(95))[other · primary role: Sales Manager / store manager]
#align(center)[#image("assets/modules/17_e_commerce.png", width: 98%)]

*Design intent.* Manage online catalog and orders while respecting stock and payment controls.

*Workspace composition.* Storefront preview, catalog editor, order queue, checkout status, fulfillment The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Publish product; manage order; refund; fulfill*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Products, variants, orders, payments, fulfillment, inventory Forms center on *SKU; price; image; stock; shipping; payment status*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Inventory; Sales; POS; Marketing. Workflow: Catalog → Cart → Checkout → Payment → Fulfill → Reconcile.

#pagebreak()
= 18 · Documents \& Secure Files

#text(size: 9pt, fill: luma(95))[other · primary role: All roles with entitlement]
#align(center)[#image("assets/modules/18_documents_secure_files.png", width: 98%)]

*Design intent.* Store, search, preview, and export governed documents and evidence.

*Workspace composition.* Folder tree, search, preview panel, permission badge, evidence timeline The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Upload; preview; share; archive; export evidence*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Files, metadata, owners, access, versions, retention Forms center on *File; category; owner; sensitivity; retention; sharing*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Projects; HR; Compliance; Collaboration. Workflow: Upload → Classify → Review → Share → Archive.

#pagebreak()
= 19 · Projects \& Task Management

#text(size: 9pt, fill: luma(95))[other · primary role: Project Manager / team member]
#align(center)[#image("assets/modules/19_projects_task_management.png", width: 98%)]

*Design intent.* Plan delivery work with milestones, budgets, files, and accountability.

*Workspace composition.* Portfolio cards, kanban, timeline, milestone panel, task drawer The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create project; assign task; update status; log time; close*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Projects, tasks, milestones, budgets, time logs, dependencies Forms center on *Title; owner; due date; priority; budget; status*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Documents; Procurement; Finance; Collaboration. Workflow: Initiate → Plan → Execute → Review → Close.

#pagebreak()
= 20 · Customer Support \& Helpdesk

#text(size: 9pt, fill: luma(95))[other · primary role: Support agent / manager]
#align(center)[#image("assets/modules/20_customer_support_helpdesk.png", width: 98%)]

*Design intent.* Resolve customer issues with policy, context, and auditable communications.

*Workspace composition.* Ticket queue, SLA badges, conversation panel, knowledge base, customer context The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create ticket; assign; respond; escalate; resolve*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Tickets, messages, SLA, customer history, policy decisions Forms center on *Subject; category; priority; requester; assignee; SLA*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* CRM; Collaboration; Documents; Notifications. Workflow: Intake → Triage → Respond → Escalate → Resolve.

#pagebreak()
= 21 · Enterprise Analytics \& Business Intelligence

#text(size: 9pt, fill: luma(95))[reports · primary role: Executive / analyst / auditor]
#align(center)[#image("assets/modules/21_enterprise_analytics_business_intelligence.png", width: 98%)]

*Design intent.* Explore governed cross-domain metrics and predictive signals.

*Workspace composition.* Metric catalog, chart grid, filters, cohort table, insight panel The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Filter; compare; drill-down; export; annotate*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* KPI definitions, dimensions, trends, forecasts, quality flags Forms center on *Metric; date range; branch; dimension; benchmark*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Dashboard; Finance; Operations; AI. Workflow: Define → Filter → Analyze → Validate → Share.

#pagebreak()
= 22 · Notifications \& Alerting

#text(size: 9pt, fill: luma(95))[other · primary role: Admin / manager / user]
#align(center)[#image("assets/modules/22_notifications_alerting.png", width: 98%)]

*Design intent.* Configure and inspect delivery channels, digests, and threshold alerts.

*Workspace composition.* Channel cards, event rules, delivery history, test drawer, digest schedule The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Configure; test; enable; suppress; retry*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Channels, templates, events, delivery attempts, status Forms center on *Channel; endpoint; event; recipient; cooldown; enabled*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Integrations; Reports; Settings. Workflow: Configure → Test → Trigger → Deliver → Audit.

#pagebreak()
= 23 · Activity Stream \& Audit Evidence

#text(size: 9pt, fill: luma(95))[other · primary role: Auditor / owner / compliance]
#align(center)[#image("assets/modules/23_activity_stream_audit_evidence.png", width: 98%)]

*Design intent.* Provide tenant-scoped operational history and exportable evidence.

*Workspace composition.* Event timeline, filters, actor panel, evidence export, retention state The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Filter; inspect; export; archive; acknowledge*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Events, actors, entities, timestamps, request IDs, evidence Forms center on *Date; actor; event; entity; severity; export range*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Every module; Settings. Workflow: Event → Capture → Filter → Inspect → Export.

#pagebreak()
= 24 · Integration Hub

#text(size: 9pt, fill: luma(95))[other · primary role: Admin / integration owner]
#align(center)[#image("assets/modules/24_integration_hub.png", width: 98%)]

*Design intent.* Connect external services and monitor verified integration health.

*Workspace composition.* Connection cards, credential form, webhook endpoint, test result, scopes The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Add; rotate; test; disable; replay; inspect logs*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Providers, scopes, endpoints, signatures, delivery state Forms center on *Provider; base URL; secret; scope; event; retry policy*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* API integrations; Notifications; Workflow Studio. Workflow: Register → Authorize → Test → Activate → Monitor.

#pagebreak()
= 25 · Workflow Studio \& Marketplace

#text(size: 9pt, fill: luma(95))[other · primary role: Admin / process owner]
#align(center)[#image("assets/modules/25_workflow_studio_marketplace.png", width: 98%)]

*Design intent.* Compose governed triggers, conditions, and actions without bypassing core controls.

*Workspace composition.* Workflow canvas, trigger palette, condition builder, run history, templates The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create; validate; publish; pause; replay run*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Triggers, actions, versions, runs, failures, approvals Forms center on *Name; trigger; conditions; action; owner; status*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Integration Hub; Notifications; Collaboration. Workflow: Draft → Validate → Approve → Publish → Execute → Review.

#pagebreak()
= 26 · Collaboration Hub

#text(size: 9pt, fill: luma(95))[other · primary role: Team member / manager]
#align(center)[#image("assets/modules/26_collaboration_hub.png", width: 98%)]

*Design intent.* Coordinate chat, email, calendar, workspaces, files, and team presence.

*Workspace composition.* Conversation list, channel composer, calendar, shared workspace, presence badges The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Message; schedule; share; mention; search*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Messages, channels, events, files, participants, presence Forms center on *Channel; recipient; message; attachment; meeting time*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Support; Projects; Documents; Notifications. Workflow: Compose → Send → Deliver → Collaborate → Archive.

#pagebreak()
= 27 · TRA VFD Fiscalization Portal

#text(size: 9pt, fill: luma(95))[other · primary role: Finance / compliance officer]
#align(center)[#image("assets/modules/27_tra_vfd_fiscalization_portal.png", width: 98%)]

*Design intent.* Manage Tanzania fiscal receipt, VAT, Z-report, and gateway evidence workflows.

*Workspace composition.* Fiscal dashboard, receipt queue, VAT return panel, Z-report card, gateway status The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Fiscalize; retry; preview; export; submit; reconcile*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Receipts, tax lines, VAT returns, gateway responses, audit trail Forms center on *TIN; buyer; tax code; amount; device; period; status*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Sales; POS; Finance; Reports. Workflow: Sale → Fiscalize → Confirm → Reconcile → Report.

#pagebreak()
= 28 · AI Assistant \& Smart Intelligence

#text(size: 9pt, fill: luma(95))[other · primary role: Authorized executive / manager]
#align(center)[#image("assets/modules/28_ai_assistant_smart_intelligence.png", width: 98%)]

*Design intent.* Surface explainable operational insights and governed recommendations.

*Workspace composition.* Chat panel, prompt library, evidence citations, recommendation cards, approvals The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Ask; inspect evidence; approve; dismiss; export*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Prompt context, result, citations, approval status, telemetry Forms center on *Question; scope; timeframe; action; approval*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Dashboard; Analytics; Workflow Studio. Workflow: Ask → Retrieve → Explain → Approve/Reject → Record.

#pagebreak()
= 29 · Microfinance

#text(size: 9pt, fill: luma(95))[micro · primary role: MFI officer / manager]
#align(center)[#image("assets/modules/29_microfinance.png", width: 98%)]

*Design intent.* Manage client portfolio, lending lifecycle, collections, and MFI reports.

*Workspace composition.* Client registry, loan book, collections queue, PAR cards, product setup The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Register client; apply loan; approve; collect; restructure*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Clients, loan products, schedules, repayments, arrears, PAR Forms center on *Client ID; product; principal; rate; term; guarantor; due date*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Bank \& MFI; Finance; VICOBA. Workflow: Client → Application → Assessment → Approval → Disbursement → Collection.

#pagebreak()
= 30 · VICOBA / SACCOS

#text(size: 9pt, fill: luma(95))[vicoba · primary role: Cooperative officer / group leader]
#align(center)[#image("assets/modules/30_vicoba_saccos.png", width: 98%)]

*Design intent.* Coordinate group savings, contributions, meetings, member accounts, and cooperative lending.

*Workspace composition.* Group dashboard, member register, savings ledger, meeting board, loan queue The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Register member; contribute; withdraw; apply; approve; record meeting*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Members, shares, savings, contributions, loans, meetings, dividends Forms center on *Member ID; share class; amount; meeting; guarantor; dividend period*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Bank \& MFI; Community; Finance. Workflow: Register → Contribute → Meet → Apply → Approve → Repay → Dividend.

#pagebreak()
= 31 · Community Groups

#text(size: 9pt, fill: luma(95))[vicoba · primary role: Community officer / group manager]
#align(center)[#image("assets/modules/31_community_groups.png", width: 98%)]

*Design intent.* Organize community groups, members, activities, contributions, and governed actions.

*Workspace composition.* Group directory, membership, activity calendar, contribution summary, notices The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Create group; add member; schedule; record contribution; report*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Groups, members, activities, contributions, welfare, notices Forms center on *Group; member; role; activity; amount; purpose*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* VICOBA; Collaboration; Reports. Workflow: Form → Approve → Organize → Record → Report.

#pagebreak()
= 32 · Healthcare / Clinic

#text(size: 9pt, fill: luma(95))[health · primary role: Clinic administrator / clinician]
#align(center)[#image("assets/modules/32_healthcare_clinic.png", width: 98%)]

*Design intent.* Coordinate clinic operations while protecting clinical and financial boundaries.

*Workspace composition.* Patient directory, appointment board, encounter workspace, clinical tabs, billing gate The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Register patient; book visit; record vitals; sign note; bill*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Patients, appointments, encounters, observations, orders, billing Forms center on *Patient ID; consent; visit; vitals; diagnosis; order; payer*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Pharmacy; Finance; Documents. Workflow: Register → Triage → Encounter → Orders → Sign → Billing.

#pagebreak()
= 33 · School Management

#text(size: 9pt, fill: luma(95))[school · primary role: School administrator / teacher]
#align(center)[#image("assets/modules/33_school_management.png", width: 98%)]

*Design intent.* Run learner, admission, fee, academic, and school governance workflows.

*Workspace composition.* Admissions board, learner directory, class view, fee status, communication panel The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Admit; assign class; record fee; grade; notify*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Learners, guardians, classes, fees, grades, attendance Forms center on *Learner; guardian; class; term; fee plan; grade*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Finance; Documents; Notifications. Workflow: Enquiry → Application → Admission → Class → Fee/Academic cycle.

#pagebreak()
= 34 · Pharmacy Management

#text(size: 9pt, fill: luma(95))[pharmacy · primary role: Pharmacist / pharmacy manager]
#align(center)[#image("assets/modules/34_pharmacy_management.png", width: 98%)]

*Design intent.* Control medicine inventory, prescriptions, dispensing, and audit evidence.

*Workspace composition.* Prescription queue, stock table, dispense drawer, batch/expiry cards, alerts The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Verify; dispense; partially fill; adjust; reorder; audit*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Prescriptions, medicines, batches, quantities, expiry, dispensing logs Forms center on *Prescription; medicine; dose; batch; quantity; prescriber*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Healthcare; Inventory; Finance. Workflow: Prescription → Verify → Dispense → Counsel → Record.

#pagebreak()
= 35 · Hotel \& Hospitality

#text(size: 9pt, fill: luma(95))[hotel · primary role: Hotel manager / front desk]
#align(center)[#image("assets/modules/35_hotel_hospitality.png", width: 98%)]

*Design intent.* Manage reservations, guests, rooms, folios, services, and settlement.

*Workspace composition.* Reservation board, room grid, guest profile, folio, housekeeping status The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Reserve; check in; add service; check out; settle*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Guests, reservations, rooms, services, folios, payments Forms center on *Guest; dates; room; rate; deposit; service; status*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Finance; Restaurant; Documents. Workflow: Search → Reserve → Confirm → Check-in → Consume → Check-out.

#pagebreak()
= 36 · Fleet Management

#text(size: 9pt, fill: luma(95))[fleet · primary role: Fleet manager / driver]
#align(center)[#image("assets/modules/36_fleet_management.png", width: 98%)]

*Design intent.* Control vehicles, trips, maintenance, fuel, and delivery evidence.

*Workspace composition.* Vehicle board, trip planner, maintenance timeline, fuel cards, driver view The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Assign trip; start; log fuel; record maintenance; complete*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Vehicles, drivers, trips, routes, fuel, maintenance, incidents Forms center on *Vehicle; driver; route; odometer; fuel; date; incident*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* SCM; Inventory; Finance. Workflow: Request → Assign → Dispatch → Track → Complete → Reconcile.

#pagebreak()
= 37 · Banking \& MFI

#text(size: 9pt, fill: luma(95))[bank · primary role: Institution administrator / branch manager]
#align(center)[#image("assets/modules/37_banking_mfi.png", width: 98%)]

*Design intent.* Operate accounts, deposits, withdrawals, credit, cash, reconciliation, and financial controls.

*Workspace composition.* Account/customer registry, teller board, loan book, AML alerts, reconciliation The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Open account; transact; approve; disburse; collect; reconcile*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Customers, KYC, accounts, journals, loans, cash, AML, audit Forms center on *Customer ID; KYC; account; amount; product; approval; reference*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Microfinance; VICOBA; Finance; Accounting. Workflow: KYC → Account → Transaction → Approval → Settlement → Reconcile.

#pagebreak()
= 38 · Restaurant \& F\&B

#text(size: 9pt, fill: luma(95))[restaurant · primary role: Restaurant manager / cashier]
#align(center)[#image("assets/modules/38_restaurant_f_b.png", width: 98%)]

*Design intent.* Manage menu, table service, kitchen flow, bills, and settlement.

*Workspace composition.* Table map, order ticket, kitchen queue, bill panel, stock signal The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Open table; order; fire; serve; split bill; close*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Tables, orders, modifiers, kitchen states, bills, payments Forms center on *Table; items; modifiers; course; tender; status*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* POS; Inventory; Hotel; Finance. Workflow: Seat → Order → Kitchen → Serve → Bill → Close.

#pagebreak()
= 39 · Employee Portal

#text(size: 9pt, fill: luma(95))[hr · primary role: Employee]
#align(center)[#image("assets/modules/39_employee_portal.png", width: 98%)]

*Design intent.* Give staff a restricted self-service workspace for personal HR tasks.

*Workspace composition.* Profile card, leave request, attendance, payslip/document panel, notices The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Request leave; view attendance; update profile; read notice*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Own profile, leave, attendance, documents, approvals Forms center on *Dates; reason; contact; attachment; acknowledgement*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* HR; Documents; Notifications. Workflow: Open → View → Request → Approve → Notify.

#pagebreak()
= 40 · Enterprise Settings \& Security Control Center

#text(size: 9pt, fill: luma(95))[settings · primary role: Owner / Super Administrator / auditor]
#align(center)[#image("assets/modules/40_enterprise_settings_security_control_center.png", width: 98%)]

*Design intent.* Configure company profile, branding, module entitlements, roles, integrations, and security evidence.

*Workspace composition.* Settings tabs, branding editor, role matrix, webhook controls, audit panels, preferences The composition uses a clear title/context band, compact status cards, a dominant evidence or activity panel, explicit next actions, and a responsive preview.

*Interaction contract.* Primary actions are *Save; upload; assign role; enable module; rotate key; export evidence*. The screen should preserve ownership, status, validation, audit, and related-record context before committing a change.

*Data and fields.* Company, profile, branding, entitlements, roles, webhooks, preferences Forms center on *Name; TIN; currency; timezone; logo; role; module; timeout*. Empty, loading, error, restricted, pending, and success states must be explicit.

*Connected surfaces.* Every module; Integration Hub; Audit. Workflow: Edit → Validate → Confirm → Persist → Audit → Propagate.

= Critical workflow diagrams

#text(size: 9pt, fill: luma(95))[The workflow pages identify validation, approval, persistence, evidence, and result boundaries]

A workflow is complete only when its user intent, validation, authorization, persistence, resulting status, and recovery path are visible. The following diagrams are deliberately concise and are intended to be read alongside the module specifications and the existing backend contracts.

#pagebreak()
= Authentication and onboarding

#text(size: 9pt, fill: luma(95))[Safe entry, verification, company setup, and role-aware landing.]
#align(center)[#image("assets/workflows/01_login_signup_onboarding.png", width: 98%)]

*Senior review.* Safe entry, verification, company setup, and role-aware landing. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Customer creation

#text(size: 9pt, fill: luma(95))[Identity validation and duplicate-risk controls before a customer record is persisted.]
#align(center)[#image("assets/workflows/02_customer_creation.png", width: 98%)]

*Senior review.* Identity validation and duplicate-risk controls before a customer record is persisted. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Sales to receipt

#text(size: 9pt, fill: luma(95))[Order, invoice, payment, receipt, ledger, and fiscal evidence stay connected.]
#align(center)[#image("assets/workflows/03_sales_to_receipt.png", width: 98%)]

*Senior review.* Order, invoice, payment, receipt, ledger, and fiscal evidence stay connected. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Procurement cycle

#text(size: 9pt, fill: luma(95))[Budget validation, approval, receiving, and payable evidence are visible as one chain.]
#align(center)[#image("assets/workflows/04_procurement_cycle.png", width: 98%)]

*Senior review.* Budget validation, approval, receiving, and payable evidence are visible as one chain. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Inventory movement

#text(size: 9pt, fill: luma(95))[Available quantity and source/destination context are validated before movement.]
#align(center)[#image("assets/workflows/05_inventory_movement.png", width: 98%)]

*Senior review.* Available quantity and source/destination context are validated before movement. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= POS transaction

#text(size: 9pt, fill: luma(95))[Fast cashier flow with tender validation, receipt evidence, and shift reconciliation.]
#align(center)[#image("assets/workflows/06_pos_transaction.png", width: 98%)]

*Senior review.* Fast cashier flow with tender validation, receipt evidence, and shift reconciliation. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Loan lifecycle

#text(size: 9pt, fill: luma(95))[Credit, guarantor/collateral, maker-checker, disbursement, schedules, and arrears.]
#align(center)[#image("assets/workflows/07_loan_lifecycle.png", width: 98%)]

*Senior review.* Credit, guarantor/collateral, maker-checker, disbursement, schedules, and arrears. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Payment reconciliation

#text(size: 9pt, fill: luma(95))[Reference/idempotency, matching, exceptions, and reconciled balances.]
#align(center)[#image("assets/workflows/08_payment_reconciliation.png", width: 98%)]

*Senior review.* Reference/idempotency, matching, exceptions, and reconciled balances. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Employee onboarding

#text(size: 9pt, fill: luma(95))[Identity, role, department, notification, and self-service handoff.]
#align(center)[#image("assets/workflows/09_employee_onboarding.png", width: 98%)]

*Senior review.* Identity, role, department, notification, and self-service handoff. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Healthcare patient journey

#text(size: 9pt, fill: luma(95))[Consent, triage, encounter, orders, sign-off, dispensing, and billing boundaries.]
#align(center)[#image("assets/workflows/10_healthcare_patient_journey.png", width: 98%)]

*Senior review.* Consent, triage, encounter, orders, sign-off, dispensing, and billing boundaries. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= School admission

#text(size: 9pt, fill: luma(95))[Application, guardian/learner validation, admission, class assignment, and fees.]
#align(center)[#image("assets/workflows/11_school_admission.png", width: 98%)]

*Senior review.* Application, guardian/learner validation, admission, class assignment, and fees. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Hotel reservation

#text(size: 9pt, fill: luma(95))[Availability, guest, deposit, reservation, folio consumption, and settlement.]
#align(center)[#image("assets/workflows/12_hotel_reservation.png", width: 98%)]

*Senior review.* Availability, guest, deposit, reservation, folio consumption, and settlement. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Restaurant order

#text(size: 9pt, fill: luma(95))[Table, menu, stock, kitchen, service, and bill closure.]
#align(center)[#image("assets/workflows/13_restaurant_order.png", width: 98%)]

*Senior review.* Table, menu, stock, kitchen, service, and bill closure. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Fleet trip

#text(size: 9pt, fill: luma(95))[Vehicle/driver compliance, dispatch, evidence capture, and reconciliation.]
#align(center)[#image("assets/workflows/14_fleet_trip.png", width: 98%)]

*Senior review.* Vehicle/driver compliance, dispatch, evidence capture, and reconciliation. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Property rental

#text(size: 9pt, fill: luma(95))[Unit, applicant, lease approval, billing, rent, occupancy, and statement.]
#align(center)[#image("assets/workflows/15_property_rental.png", width: 98%)]

*Senior review.* Unit, applicant, lease approval, billing, rent, occupancy, and statement. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Money Agent transaction

#text(size: 9pt, fill: luma(95))[KYC, limits, idempotency, maker-checker, provider state, ledger, and settlement.]
#align(center)[#image("assets/workflows/16_money_agent_transaction.png", width: 98%)]

*Senior review.* KYC, limits, idempotency, maker-checker, provider state, ledger, and settlement. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= VICOBA / SACCOS transaction

#text(size: 9pt, fill: luma(95))[Meeting/member context, shares, savings, contributions, decisions, and cooperative balances.]
#align(center)[#image("assets/workflows/17_vicoba_saccos_transaction.png", width: 98%)]

*Senior review.* Meeting/member context, shares, savings, contributions, decisions, and cooperative balances. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

#pagebreak()
= Reports and Settings

#text(size: 9pt, fill: luma(95))[Parameter validation, permission checks, persistence, audit, and delivery.]
#align(center)[#image("assets/workflows/18_reports_settings.png", width: 98%)]

*Senior review.* Parameter validation, permission checks, persistence, audit, and delivery. The implementation should persist the successful result, surface controlled error and restricted states, and preserve a traceable reference for subsequent reporting or audit.

= Responsive implementation guidance

#text(size: 9pt, fill: luma(95))[Desktop, tablet, and mobile are compositions, not scaled-down copies]

| Device context | Recommended composition | High-risk considerations |
|---|---|---|
| Desktop ≥1024px | Persistent sidebar, two-column command center, wide tables, visible evidence panels. | Do not bury status or ownership in hover-only UI. |
| Tablet 640–1023px | Collapsed sidebar, two-column KPI grid, drawers for secondary actions, intentional table scrolling. | Keep the primary action and current context visible during drawer transitions. |
| Mobile ≤639px | Top bar, bottom navigation, stacked cards, wrapped actions, full-width forms, scrollable tables. | Preserve readable labels, 44px touch targets, confirmation dialogs, and the result state above the fold. |

Accessibility requires semantic headings, labelled inputs, visible focus rings, keyboard-reachable menus and dialogs, contrast that does not rely on color alone, aria-live for asynchronous results, reduced-motion support, and explicit recovery instructions. For clinical, financial, identity, and security workflows, confirmation and audit evidence must remain accessible in keyboard and touch flows.

= Settings and administration design

#text(size: 9pt, fill: luma(95))[Settings is an operating control center, not a decorative preferences page]

The current Settings surface combines company profile, branding, tax and timezone context, receipt configuration, industry focus, role changes, module entitlements, market-provider governance, webhook configuration, push-delivery history, dashboard preferences, security/authentication controls, and audit evidence. The visual design should group these by responsibility so that company identity is not mixed with secrets, and personal preferences are not confused with tenant policy.

| Settings area | Owner | Persistence expectation |
|---|---|---|
| Company profile and branding | Organization Owner / Super Administrator | Persist to the company/workspace record and audit meaningful changes. |
| Module entitlements and role changes | Organization Owner / Super Administrator | Validate against server-side permission rules and record an approval/audit event. |
| Market providers and webhooks | Authorized administrator | Store credentials server-side, redact secrets in responses, test before activation, record delivery outcomes. |
| Dashboard preferences | Authenticated user | Persist per user and tenant; keep preview-only local fallback isolated from production state. |
| Security and audit | Administrator / Auditor | Show effective state, recent events, and recovery or escalation paths. |

= Implementation handoff

#text(size: 9pt, fill: luma(95))[How to use this package without replacing the production application]

The package is intended to guide incremental implementation. First use the screen inventory to confirm that a planned feature has a dedicated surface and role contract. Then use the relevant workflow page to define the query, mutation, validation, and result boundaries. Finally, implement the screen using the existing shared components, tRPC composition, verified-profile boundary, Supabase/RLS persistence, and current module route rather than creating a disconnected demo.

For each production change, follow this sequence: *inspect source and live data boundary → design state and permission contract → add or extend persistence additively → expose a protected server procedure → connect the UI → test validation and error states → run type/build/regression checks → inspect the live deployment*. Financial, cooperative, clinical, and external-integration actions require special attention to idempotency, concurrency, maker-checker approval, auditability, and explicit pending provider states.

== Package contents

The companion archive contains the 40 module mockups, 18 workflow diagrams, editable Mermaid sources, inventory CSV/JSON, module-by-module design specifications, navigation and role documentation, responsive/accessibility guidance, visual QA notes, and this master PDF source project.
