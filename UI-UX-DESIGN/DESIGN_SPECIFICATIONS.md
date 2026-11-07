# SMART MANAGER — Screen Design Specifications
This specification is generated from the verified source inventory. Each entry is a design reference, not a claim that every surface is a complete production workflow. The `status` field distinguishes source-visible surfaces from future implementation work. Visual mockups use clearly marked illustrative data and preserve the existing SMART MANAGER emerald, forest, gold, navy, slate, and paper system.
## Coverage Summary
The package contains **40 dedicated module/surface references**, **18 critical workflow diagrams**, one design-system reference, and responsive guidance for desktop, tablet, and mobile.
| ID | Module / surface | Role | Primary design objective | Visual asset | Workflow reference |
|---:|---|---|---|---|---|
| 01 | Public Brand & Marketing Entry | Visitor / prospect | Explain the Tanzania-first ERP value proposition and route the user into the secure workspace. | `01-Authentication/01_public_brand_marketing_entry.png` | `—` |
| 02 | Authentication & Secure Onboarding | Visitor / owner / invited user | Authenticate safely and guide new organizations through setup or joining. | `01-Authentication/02_authentication_secure_onboarding.png` | `—` |
| 03 | Master Application Shell & Navigation | All authenticated roles | Provide persistent navigation, context, global search, notifications, and safe mobile access. | `02-Dashboard/03_master_application_shell_navigation.png` | `—` |
| 04 | Executive Dashboard | Owner / CEO / CFO / auditor | Give a trusted cross-module operating view with KPI context and next actions. | `02-Dashboard/04_executive_dashboard.png` | `—` |
| 05 | Daily Business Briefing | Executive / manager | Turn daily operational signals into an actionable briefing. | `02-Dashboard/05_daily_business_briefing.png` | `—` |
| 06 | CRM & Customer Pipeline | Sales Manager / support agent | Manage leads and opportunities through a visible revenue pipeline. | `20-Other-Modules/06_crm_customer_pipeline.png` | `—` |
| 07 | Sales & Billing | Sales Manager / finance officer | Convert quotations and orders into invoices, receipts, and payment evidence. | `03-Sales/07_sales_billing.png` | `01_login_signup_onboarding` |
| 08 | Point of Sale | Cashier / store manager | Process fast, auditable sales online or through the controlled offline queue. | `03-Sales/08_point_of_sale.png` | `01_login_signup_onboarding` |
| 09 | Inventory & Warehouse Management | Warehouse Manager / procurement officer | Control stock availability, movements, valuation, and reorder decisions. | `04-Inventory/09_inventory_warehouse_management.png` | `01_login_signup_onboarding` |
| 10 | Procurement & Vendor Management | Procurement Officer | Control supplier sourcing, approvals, orders, and vendor settlement evidence. | `04-Inventory/10_procurement_vendor_management.png` | `01_login_signup_onboarding` |
| 11 | Finance & Accounting | CFO / Finance Manager / auditor | Provide controlled financial operations, ledgers, reconciliations, tax, and budgets. | `05-Finance/11_finance_accounting.png` | `—` |
| 12 | Reports & Scheduled Reporting | Executive / auditor / manager | Deliver governed financial, operational, compliance, and scheduled reports. | `19-Reports/12_reports_scheduled_reporting.png` | `01_login_signup_onboarding` |
| 13 | Human Resources & Payroll | HR Manager / employee | Manage the employee lifecycle and payroll-adjacent operations with role separation. | `06-HR/13_human_resources_payroll.png` | `—` |
| 14 | Manufacturing & Work Orders | Operations / warehouse manager | Coordinate BOMs, work orders, quality, maintenance, and material consumption. | `20-Other-Modules/14_manufacturing_work_orders.png` | `—` |
| 15 | Supply Chain & Logistics | Warehouse Manager / logistics lead | Track movement of goods, fleet context, route status, and regional distribution. | `20-Other-Modules/15_supply_chain_logistics.png` | `—` |
| 16 | Marketing | Sales Manager / marketing lead | Plan campaigns, segments, messages, and measurable engagement. | `20-Other-Modules/16_marketing.png` | `—` |
| 17 | E-Commerce | Sales Manager / store manager | Manage online catalog and orders while respecting stock and payment controls. | `20-Other-Modules/17_e_commerce.png` | `—` |
| 18 | Documents & Secure Files | All roles with entitlement | Store, search, preview, and export governed documents and evidence. | `20-Other-Modules/18_documents_secure_files.png` | `—` |
| 19 | Projects & Task Management | Project Manager / team member | Plan delivery work with milestones, budgets, files, and accountability. | `20-Other-Modules/19_projects_task_management.png` | `—` |
| 20 | Customer Support & Helpdesk | Support agent / manager | Resolve customer issues with policy, context, and auditable communications. | `20-Other-Modules/20_customer_support_helpdesk.png` | `—` |
| 21 | Enterprise Analytics & Business Intelligence | Executive / analyst / auditor | Explore governed cross-domain metrics and predictive signals. | `19-Reports/21_enterprise_analytics_business_intelligence.png` | `—` |
| 22 | Notifications & Alerting | Admin / manager / user | Configure and inspect delivery channels, digests, and threshold alerts. | `20-Other-Modules/22_notifications_alerting.png` | `—` |
| 23 | Activity Stream & Audit Evidence | Auditor / owner / compliance | Provide tenant-scoped operational history and exportable evidence. | `20-Other-Modules/23_activity_stream_audit_evidence.png` | `—` |
| 24 | Integration Hub | Admin / integration owner | Connect external services and monitor verified integration health. | `20-Other-Modules/24_integration_hub.png` | `—` |
| 25 | Workflow Studio & Marketplace | Admin / process owner | Compose governed triggers, conditions, and actions without bypassing core controls. | `20-Other-Modules/25_workflow_studio_marketplace.png` | `—` |
| 26 | Collaboration Hub | Team member / manager | Coordinate chat, email, calendar, workspaces, files, and team presence. | `20-Other-Modules/26_collaboration_hub.png` | `—` |
| 27 | TRA VFD Fiscalization Portal | Finance / compliance officer | Manage Tanzania fiscal receipt, VAT, Z-report, and gateway evidence workflows. | `20-Other-Modules/27_tra_vfd_fiscalization_portal.png` | `—` |
| 28 | AI Assistant & Smart Intelligence | Authorized executive / manager | Surface explainable operational insights and governed recommendations. | `20-Other-Modules/28_ai_assistant_smart_intelligence.png` | `—` |
| 29 | Microfinance | MFI officer / manager | Manage client portfolio, lending lifecycle, collections, and MFI reports. | `09-Microfinance/29_microfinance.png` | `—` |
| 30 | VICOBA / SACCOS | Cooperative officer / group leader | Coordinate group savings, contributions, meetings, member accounts, and cooperative lending. | `11-VICOBA-SACCOS/30_vicoba_saccos.png` | `01_login_signup_onboarding` |
| 31 | Community Groups | Community officer / group manager | Organize community groups, members, activities, contributions, and governed actions. | `11-VICOBA-SACCOS/31_community_groups.png` | `—` |
| 32 | Healthcare / Clinic | Clinic administrator / clinician | Coordinate clinic operations while protecting clinical and financial boundaries. | `07-Healthcare/32_healthcare_clinic.png` | `01_login_signup_onboarding` |
| 33 | School Management | School administrator / teacher | Run learner, admission, fee, academic, and school governance workflows. | `12-School/33_school_management.png` | `01_login_signup_onboarding` |
| 34 | Pharmacy Management | Pharmacist / pharmacy manager | Control medicine inventory, prescriptions, dispensing, and audit evidence. | `08-Pharmacy/34_pharmacy_management.png` | `—` |
| 35 | Hotel & Hospitality | Hotel manager / front desk | Manage reservations, guests, rooms, folios, services, and settlement. | `13-Hotel/35_hotel_hospitality.png` | `01_login_signup_onboarding` |
| 36 | Fleet Management | Fleet manager / driver | Control vehicles, trips, maintenance, fuel, and delivery evidence. | `15-Fleet/36_fleet_management.png` | `01_login_signup_onboarding` |
| 37 | Banking & MFI | Institution administrator / branch manager | Operate accounts, deposits, withdrawals, credit, cash, reconciliation, and financial controls. | `10-Bank-MFI/37_banking_mfi.png` | `—` |
| 38 | Restaurant & F&B | Restaurant manager / cashier | Manage menu, table service, kitchen flow, bills, and settlement. | `14-Restaurant/38_restaurant_f_b.png` | `01_login_signup_onboarding` |
| 39 | Employee Portal | Employee | Give staff a restricted self-service workspace for personal HR tasks. | `06-HR/39_employee_portal.png` | `01_login_signup_onboarding` |
| 40 | Enterprise Settings & Security Control Center | Owner / Super Administrator / auditor | Configure company profile, branding, module entitlements, roles, integrations, and security evidence. | `18-Settings/40_enterprise_settings_security_control_center.png` | `01_login_signup_onboarding` |

## Module-by-Module References
### 01 · Public Brand & Marketing Entry

**Module:** brand
**Primary role:** Visitor / prospect
**Purpose:** Explain the Tanzania-first ERP value proposition and route the user into the secure workspace.
**Main components:** Brand mark, capability cards, trust strip, CTA, language selector
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Launch App; view capabilities; contact/support
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Brand promise, module families, compliance positioning
**Form fields:** Language; workspace entry intent
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Authentication; Dashboard
**User workflow:** Discovery → Launch App → Auth Gateway
**Design status:** Verified surface.

### 02 · Authentication & Secure Onboarding

**Module:** brand
**Primary role:** Visitor / owner / invited user
**Purpose:** Authenticate safely and guide new organizations through setup or joining.
**Main components:** Login form, sign-up wizard, recovery, OAuth/passkey options, progress indicator
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Sign in; create company; join company; recover access
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Identity, company, role, verification state
**Form fields:** Email; password; company name; country; industry; invite code
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Brand Entry; Settings; Employee Portal
**User workflow:** Entry → Credentials → Validation → Verification → Workspace
**Design status:** Verified surface.

### 03 · Master Application Shell & Navigation

**Module:** dashboard
**Primary role:** All authenticated roles
**Purpose:** Provide persistent navigation, context, global search, notifications, and safe mobile access.
**Main components:** Sidebar, command palette, company/branch selector, top bar, bottom nav, breadcrumbs
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Switch module; search; open notifications; profile; collapse nav
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Active tenant, branch, role, entitlements, unread counts
**Form fields:** Company; branch; active module; density; theme
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Every module; Settings
**User workflow:** Auth → Shell → Module route → Contextual workspace
**Design status:** Verified surface.

### 04 · Executive Dashboard

**Module:** dashboard
**Primary role:** Owner / CEO / CFO / auditor
**Purpose:** Give a trusted cross-module operating view with KPI context and next actions.
**Main components:** KPI cards, trend chart, alerts, quick actions, module health, date context
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Open detail; filter period; export brief; act on alert
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Revenue, receivables, stock, people, approvals, risk
**Form fields:** Period; currency; department; branch
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Finance; Sales; HR; Inventory; Analytics
**User workflow:** Load context → KPIs → Drill-down → Action
**Design status:** Verified surface.

### 05 · Daily Business Briefing

**Module:** dashboard
**Primary role:** Executive / manager
**Purpose:** Turn daily operational signals into an actionable briefing.
**Main components:** Briefing timeline, health score, exceptions, recommendation cards, export
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Acknowledge; open evidence; export PDF; assign follow-up
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Sales, cash, inventory, HR, CRM, projects, controls
**Form fields:** Date; severity; owner; status
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Dashboard; Reports; AI Assistant
**User workflow:** Signals → Prioritization → Evidence → Decision → Follow-up
**Design status:** Verified surface.

### 06 · CRM & Customer Pipeline

**Module:** other
**Primary role:** Sales Manager / support agent
**Purpose:** Manage leads and opportunities through a visible revenue pipeline.
**Main components:** Kanban, customer 360, lead score, activity composer, filters
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create lead; qualify; move stage; schedule activity
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Leads, contacts, opportunities, activities, probability
**Form fields:** Name; phone; email; stage; value; owner; next action
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Sales; Marketing; Support
**User workflow:** Lead → Qualify → Proposal → Negotiation → Won/Lost
**Design status:** Verified surface.

### 07 · Sales & Billing

**Module:** sales
**Primary role:** Sales Manager / finance officer
**Purpose:** Convert quotations and orders into invoices, receipts, and payment evidence.
**Main components:** Document tabs, line-item editor, tax summary, invoice preview, dispatch drawer
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create quote; accept order; issue invoice; record payment; send
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Customers, products, tax, totals, payment status, receipts
**Form fields:** Customer; lines; tax; due date; channel; currency
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** CRM; Inventory; POS; Finance; TRA
**User workflow:** Quote → Order → Invoice → Payment → Receipt → Ledger
**Design status:** Verified surface.

### 08 · Point of Sale

**Module:** sales
**Primary role:** Cashier / store manager
**Purpose:** Process fast, auditable sales online or through the controlled offline queue.
**Main components:** Product search, cart, tender selector, receipt panel, shift controls, sync banner
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Scan; hold; tender; refund; print; reconcile; retry sync
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** SKU, quantity, tax, tender, cashier, device, queue status
**Form fields:** Barcode; quantity; discount; payment method; customer
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Inventory; Finance; Sales; TRA
**User workflow:** Open shift → Cart → Tender → Confirm → Receipt → Reconcile
**Design status:** Verified surface.

### 09 · Inventory & Warehouse Management

**Module:** inventory
**Primary role:** Warehouse Manager / procurement officer
**Purpose:** Control stock availability, movements, valuation, and reorder decisions.
**Main components:** Stock table, warehouse selector, movement drawer, reorder cards, batch detail
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Receive; transfer; adjust; reserve; export; audit
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** SKU, batches, warehouses, balances, valuation, reorder points
**Form fields:** SKU; warehouse; quantity; batch; reason; supplier
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Procurement; POS; Manufacturing; SCM
**User workflow:** Request → Approve → Receive/Move → Reconcile → Report
**Design status:** Verified surface.

### 10 · Procurement & Vendor Management

**Module:** inventory
**Primary role:** Procurement Officer
**Purpose:** Control supplier sourcing, approvals, orders, and vendor settlement evidence.
**Main components:** Vendor directory, requisition queue, PO builder, approval trail, payment status
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create requisition; approve PO; receive; match invoice
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Vendors, POs, contracts, receipts, approvals, payments
**Form fields:** Vendor; items; budget; delivery; approver; terms
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Inventory; Finance; Projects
**User workflow:** Need → Requisition → Approval → PO → Receipt → Settlement
**Design status:** Verified surface.

### 11 · Finance & Accounting

**Module:** finance
**Primary role:** CFO / Finance Manager / auditor
**Purpose:** Provide controlled financial operations, ledgers, reconciliations, tax, and budgets.
**Main components:** Ledger navigator, account cards, reconciliation workspace, budget panels, journal review
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Post journal; reconcile; approve; close period; export statement
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Accounts, journals, invoices, expenses, budgets, bank balances
**Form fields:** Account; date; debit; credit; cost centre; tax; period
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Sales; Procurement; POS; Bank & MFI; Reports
**User workflow:** Source event → Journal → Approval → Posting → Reconciliation → Close
**Design status:** Verified surface.

### 12 · Reports & Scheduled Reporting

**Module:** reports
**Primary role:** Executive / auditor / manager
**Purpose:** Deliver governed financial, operational, compliance, and scheduled reports.
**Main components:** Report catalog, parameter drawer, preview, schedule editor, delivery history
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Run; filter; export PDF/CSV; schedule; resend
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Report metadata, parameters, snapshots, delivery status
**Form fields:** Period; branch; currency; recipients; schedule
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Dashboard; Finance; Analytics; Notifications
**User workflow:** Select → Parameterize → Generate → Review → Deliver → Archive
**Design status:** Verified surface.

### 13 · Human Resources & Payroll

**Module:** hr
**Primary role:** HR Manager / employee
**Purpose:** Manage the employee lifecycle and payroll-adjacent operations with role separation.
**Main components:** Employee directory, profile, attendance, leave queue, payroll summary, LMS cards
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Onboard; approve leave; review attendance; export payroll
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Employees, departments, leave, attendance, benefits, payroll
**Form fields:** Identity; department; contract; leave dates; approval; pay period
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Employee Portal; Finance; Documents
**User workflow:** Candidate → Onboard → Attend → Leave/Payroll → Review
**Design status:** Verified surface.

### 14 · Manufacturing & Work Orders

**Module:** other
**Primary role:** Operations / warehouse manager
**Purpose:** Coordinate BOMs, work orders, quality, maintenance, and material consumption.
**Main components:** BOM table, work-order board, machine status, QC checklist, maintenance log
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Release WO; issue materials; record output; inspect; close
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** BOMs, work orders, machines, QC, maintenance, outputs
**Form fields:** BOM; quantity; machine; operator; inspection; variance
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Inventory; Procurement; SCM; Finance
**User workflow:** Plan → Release → Consume → Produce → Inspect → Close
**Design status:** Verified surface.

### 15 · Supply Chain & Logistics

**Module:** other
**Primary role:** Warehouse Manager / logistics lead
**Purpose:** Track movement of goods, fleet context, route status, and regional distribution.
**Main components:** Shipment board, route map, vehicle status, ETA cards, exception queue
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create shipment; assign route; update status; confirm delivery
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Shipments, routes, drivers, vehicles, ETAs, proof of delivery
**Form fields:** Origin; destination; carrier; vehicle; ETA; POD
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Fleet; Inventory; Sales; Procurement
**User workflow:** Order → Plan → Dispatch → Track → Deliver → Reconcile
**Design status:** Verified surface.

### 16 · Marketing

**Module:** other
**Primary role:** Sales Manager / marketing lead
**Purpose:** Plan campaigns, segments, messages, and measurable engagement.
**Main components:** Campaign board, audience segments, template preview, performance cards
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create campaign; segment; schedule; pause; review
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Campaigns, audiences, templates, sends, engagement metrics
**Form fields:** Name; channel; segment; content; schedule; consent
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** CRM; Notifications; E-Commerce
**User workflow:** Segment → Compose → Approve → Send → Measure
**Design status:** Verified surface.

### 17 · E-Commerce

**Module:** other
**Primary role:** Sales Manager / store manager
**Purpose:** Manage online catalog and orders while respecting stock and payment controls.
**Main components:** Storefront preview, catalog editor, order queue, checkout status, fulfillment
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Publish product; manage order; refund; fulfill
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Products, variants, orders, payments, fulfillment, inventory
**Form fields:** SKU; price; image; stock; shipping; payment status
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Inventory; Sales; POS; Marketing
**User workflow:** Catalog → Cart → Checkout → Payment → Fulfill → Reconcile
**Design status:** Verified surface.

### 18 · Documents & Secure Files

**Module:** other
**Primary role:** All roles with entitlement
**Purpose:** Store, search, preview, and export governed documents and evidence.
**Main components:** Folder tree, search, preview panel, permission badge, evidence timeline
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Upload; preview; share; archive; export evidence
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Files, metadata, owners, access, versions, retention
**Form fields:** File; category; owner; sensitivity; retention; sharing
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Projects; HR; Compliance; Collaboration
**User workflow:** Upload → Classify → Review → Share → Archive
**Design status:** Verified surface.

### 19 · Projects & Task Management

**Module:** other
**Primary role:** Project Manager / team member
**Purpose:** Plan delivery work with milestones, budgets, files, and accountability.
**Main components:** Portfolio cards, kanban, timeline, milestone panel, task drawer
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create project; assign task; update status; log time; close
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Projects, tasks, milestones, budgets, time logs, dependencies
**Form fields:** Title; owner; due date; priority; budget; status
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Documents; Procurement; Finance; Collaboration
**User workflow:** Initiate → Plan → Execute → Review → Close
**Design status:** Verified surface.

### 20 · Customer Support & Helpdesk

**Module:** other
**Primary role:** Support agent / manager
**Purpose:** Resolve customer issues with policy, context, and auditable communications.
**Main components:** Ticket queue, SLA badges, conversation panel, knowledge base, customer context
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create ticket; assign; respond; escalate; resolve
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Tickets, messages, SLA, customer history, policy decisions
**Form fields:** Subject; category; priority; requester; assignee; SLA
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** CRM; Collaboration; Documents; Notifications
**User workflow:** Intake → Triage → Respond → Escalate → Resolve
**Design status:** Verified surface.

### 21 · Enterprise Analytics & Business Intelligence

**Module:** reports
**Primary role:** Executive / analyst / auditor
**Purpose:** Explore governed cross-domain metrics and predictive signals.
**Main components:** Metric catalog, chart grid, filters, cohort table, insight panel
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Filter; compare; drill-down; export; annotate
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** KPI definitions, dimensions, trends, forecasts, quality flags
**Form fields:** Metric; date range; branch; dimension; benchmark
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Dashboard; Finance; Operations; AI
**User workflow:** Define → Filter → Analyze → Validate → Share
**Design status:** Verified surface.

### 22 · Notifications & Alerting

**Module:** other
**Primary role:** Admin / manager / user
**Purpose:** Configure and inspect delivery channels, digests, and threshold alerts.
**Main components:** Channel cards, event rules, delivery history, test drawer, digest schedule
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Configure; test; enable; suppress; retry
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Channels, templates, events, delivery attempts, status
**Form fields:** Channel; endpoint; event; recipient; cooldown; enabled
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Integrations; Reports; Settings
**User workflow:** Configure → Test → Trigger → Deliver → Audit
**Design status:** Verified surface.

### 23 · Activity Stream & Audit Evidence

**Module:** other
**Primary role:** Auditor / owner / compliance
**Purpose:** Provide tenant-scoped operational history and exportable evidence.
**Main components:** Event timeline, filters, actor panel, evidence export, retention state
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Filter; inspect; export; archive; acknowledge
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Events, actors, entities, timestamps, request IDs, evidence
**Form fields:** Date; actor; event; entity; severity; export range
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Every module; Settings
**User workflow:** Event → Capture → Filter → Inspect → Export
**Design status:** Verified surface.

### 24 · Integration Hub

**Module:** other
**Primary role:** Admin / integration owner
**Purpose:** Connect external services and monitor verified integration health.
**Main components:** Connection cards, credential form, webhook endpoint, test result, scopes
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Add; rotate; test; disable; replay; inspect logs
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Providers, scopes, endpoints, signatures, delivery state
**Form fields:** Provider; base URL; secret; scope; event; retry policy
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** API integrations; Notifications; Workflow Studio
**User workflow:** Register → Authorize → Test → Activate → Monitor
**Design status:** Verified surface.

### 25 · Workflow Studio & Marketplace

**Module:** other
**Primary role:** Admin / process owner
**Purpose:** Compose governed triggers, conditions, and actions without bypassing core controls.
**Main components:** Workflow canvas, trigger palette, condition builder, run history, templates
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create; validate; publish; pause; replay run
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Triggers, actions, versions, runs, failures, approvals
**Form fields:** Name; trigger; conditions; action; owner; status
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Integration Hub; Notifications; Collaboration
**User workflow:** Draft → Validate → Approve → Publish → Execute → Review
**Design status:** Verified surface.

### 26 · Collaboration Hub

**Module:** other
**Primary role:** Team member / manager
**Purpose:** Coordinate chat, email, calendar, workspaces, files, and team presence.
**Main components:** Conversation list, channel composer, calendar, shared workspace, presence badges
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Message; schedule; share; mention; search
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Messages, channels, events, files, participants, presence
**Form fields:** Channel; recipient; message; attachment; meeting time
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Support; Projects; Documents; Notifications
**User workflow:** Compose → Send → Deliver → Collaborate → Archive
**Design status:** Verified surface.

### 27 · TRA VFD Fiscalization Portal

**Module:** other
**Primary role:** Finance / compliance officer
**Purpose:** Manage Tanzania fiscal receipt, VAT, Z-report, and gateway evidence workflows.
**Main components:** Fiscal dashboard, receipt queue, VAT return panel, Z-report card, gateway status
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Fiscalize; retry; preview; export; submit; reconcile
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Receipts, tax lines, VAT returns, gateway responses, audit trail
**Form fields:** TIN; buyer; tax code; amount; device; period; status
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Sales; POS; Finance; Reports
**User workflow:** Sale → Fiscalize → Confirm → Reconcile → Report
**Design status:** Verified surface.

### 28 · AI Assistant & Smart Intelligence

**Module:** other
**Primary role:** Authorized executive / manager
**Purpose:** Surface explainable operational insights and governed recommendations.
**Main components:** Chat panel, prompt library, evidence citations, recommendation cards, approvals
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Ask; inspect evidence; approve; dismiss; export
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Prompt context, result, citations, approval status, telemetry
**Form fields:** Question; scope; timeframe; action; approval
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Dashboard; Analytics; Workflow Studio
**User workflow:** Ask → Retrieve → Explain → Approve/Reject → Record
**Design status:** Verified surface.

### 29 · Microfinance

**Module:** micro
**Primary role:** MFI officer / manager
**Purpose:** Manage client portfolio, lending lifecycle, collections, and MFI reports.
**Main components:** Client registry, loan book, collections queue, PAR cards, product setup
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Register client; apply loan; approve; collect; restructure
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Clients, loan products, schedules, repayments, arrears, PAR
**Form fields:** Client ID; product; principal; rate; term; guarantor; due date
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Bank & MFI; Finance; VICOBA
**User workflow:** Client → Application → Assessment → Approval → Disbursement → Collection
**Design status:** Verified surface.

### 30 · VICOBA / SACCOS

**Module:** vicoba
**Primary role:** Cooperative officer / group leader
**Purpose:** Coordinate group savings, contributions, meetings, member accounts, and cooperative lending.
**Main components:** Group dashboard, member register, savings ledger, meeting board, loan queue
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Register member; contribute; withdraw; apply; approve; record meeting
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Members, shares, savings, contributions, loans, meetings, dividends
**Form fields:** Member ID; share class; amount; meeting; guarantor; dividend period
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Bank & MFI; Community; Finance
**User workflow:** Register → Contribute → Meet → Apply → Approve → Repay → Dividend
**Design status:** Verified surface.

### 31 · Community Groups

**Module:** vicoba
**Primary role:** Community officer / group manager
**Purpose:** Organize community groups, members, activities, contributions, and governed actions.
**Main components:** Group directory, membership, activity calendar, contribution summary, notices
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Create group; add member; schedule; record contribution; report
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Groups, members, activities, contributions, welfare, notices
**Form fields:** Group; member; role; activity; amount; purpose
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** VICOBA; Collaboration; Reports
**User workflow:** Form → Approve → Organize → Record → Report
**Design status:** Verified surface.

### 32 · Healthcare / Clinic

**Module:** health
**Primary role:** Clinic administrator / clinician
**Purpose:** Coordinate clinic operations while protecting clinical and financial boundaries.
**Main components:** Patient directory, appointment board, encounter workspace, clinical tabs, billing gate
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Register patient; book visit; record vitals; sign note; bill
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Patients, appointments, encounters, observations, orders, billing
**Form fields:** Patient ID; consent; visit; vitals; diagnosis; order; payer
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Pharmacy; Finance; Documents
**User workflow:** Register → Triage → Encounter → Orders → Sign → Billing
**Design status:** Verified surface.

### 33 · School Management

**Module:** school
**Primary role:** School administrator / teacher
**Purpose:** Run learner, admission, fee, academic, and school governance workflows.
**Main components:** Admissions board, learner directory, class view, fee status, communication panel
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Admit; assign class; record fee; grade; notify
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Learners, guardians, classes, fees, grades, attendance
**Form fields:** Learner; guardian; class; term; fee plan; grade
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Finance; Documents; Notifications
**User workflow:** Enquiry → Application → Admission → Class → Fee/Academic cycle
**Design status:** Verified surface.

### 34 · Pharmacy Management

**Module:** pharmacy
**Primary role:** Pharmacist / pharmacy manager
**Purpose:** Control medicine inventory, prescriptions, dispensing, and audit evidence.
**Main components:** Prescription queue, stock table, dispense drawer, batch/expiry cards, alerts
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Verify; dispense; partially fill; adjust; reorder; audit
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Prescriptions, medicines, batches, quantities, expiry, dispensing logs
**Form fields:** Prescription; medicine; dose; batch; quantity; prescriber
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Healthcare; Inventory; Finance
**User workflow:** Prescription → Verify → Dispense → Counsel → Record
**Design status:** Verified surface.

### 35 · Hotel & Hospitality

**Module:** hotel
**Primary role:** Hotel manager / front desk
**Purpose:** Manage reservations, guests, rooms, folios, services, and settlement.
**Main components:** Reservation board, room grid, guest profile, folio, housekeeping status
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Reserve; check in; add service; check out; settle
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Guests, reservations, rooms, services, folios, payments
**Form fields:** Guest; dates; room; rate; deposit; service; status
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Finance; Restaurant; Documents
**User workflow:** Search → Reserve → Confirm → Check-in → Consume → Check-out
**Design status:** Verified surface.

### 36 · Fleet Management

**Module:** fleet
**Primary role:** Fleet manager / driver
**Purpose:** Control vehicles, trips, maintenance, fuel, and delivery evidence.
**Main components:** Vehicle board, trip planner, maintenance timeline, fuel cards, driver view
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Assign trip; start; log fuel; record maintenance; complete
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Vehicles, drivers, trips, routes, fuel, maintenance, incidents
**Form fields:** Vehicle; driver; route; odometer; fuel; date; incident
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** SCM; Inventory; Finance
**User workflow:** Request → Assign → Dispatch → Track → Complete → Reconcile
**Design status:** Verified surface.

### 37 · Banking & MFI

**Module:** bank
**Primary role:** Institution administrator / branch manager
**Purpose:** Operate accounts, deposits, withdrawals, credit, cash, reconciliation, and financial controls.
**Main components:** Account/customer registry, teller board, loan book, AML alerts, reconciliation
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Open account; transact; approve; disburse; collect; reconcile
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Customers, KYC, accounts, journals, loans, cash, AML, audit
**Form fields:** Customer ID; KYC; account; amount; product; approval; reference
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Microfinance; VICOBA; Finance; Accounting
**User workflow:** KYC → Account → Transaction → Approval → Settlement → Reconcile
**Design status:** Verified surface.

### 38 · Restaurant & F&B

**Module:** restaurant
**Primary role:** Restaurant manager / cashier
**Purpose:** Manage menu, table service, kitchen flow, bills, and settlement.
**Main components:** Table map, order ticket, kitchen queue, bill panel, stock signal
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Open table; order; fire; serve; split bill; close
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Tables, orders, modifiers, kitchen states, bills, payments
**Form fields:** Table; items; modifiers; course; tender; status
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** POS; Inventory; Hotel; Finance
**User workflow:** Seat → Order → Kitchen → Serve → Bill → Close
**Design status:** Verified surface.

### 39 · Employee Portal

**Module:** hr
**Primary role:** Employee
**Purpose:** Give staff a restricted self-service workspace for personal HR tasks.
**Main components:** Profile card, leave request, attendance, payslip/document panel, notices
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Request leave; view attendance; update profile; read notice
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Own profile, leave, attendance, documents, approvals
**Form fields:** Dates; reason; contact; attachment; acknowledgement
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** HR; Documents; Notifications
**User workflow:** Open → View → Request → Approve → Notify
**Design status:** Verified surface.

### 40 · Enterprise Settings & Security Control Center

**Module:** settings
**Primary role:** Owner / Super Administrator / auditor
**Purpose:** Configure company profile, branding, module entitlements, roles, integrations, and security evidence.
**Main components:** Settings tabs, branding editor, role matrix, webhook controls, audit panels, preferences
**Navigation:** Use the persistent workspace shell, role-aware sidebar, breadcrumbs, and a local tab strip where the domain has multiple operating views.
**Primary actions:** Save; upload; assign role; enable module; rotate key; export evidence
**Secondary actions:** Review evidence, export, search/filter, and open related records without losing context.
**Data displayed:** Company, profile, branding, entitlements, roles, webhooks, preferences
**Form fields:** Name; TIN; currency; timezone; logo; role; module; timeout
**Validation behavior:** Validate required fields before submission, detect duplicate or conflicting records where the domain supports it, display inline field errors, and show a confirmation state before critical writes.
**Responsive behavior:** On desktop use a two-column command-center layout; on tablet collapse secondary panels into drawers; on mobile stack KPI cards, wrap actions below headings, keep primary actions above the fold, and place wide tables inside intentional scroll containers.
**Related screens:** Every module; Integration Hub; Audit
**User workflow:** Edit → Validate → Confirm → Persist → Audit → Propagate
**Design status:** Verified surface.
