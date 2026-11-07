# Attachment 5 Forensic Audit — Phase 2 Feature-to-Schema Map

## Frontend entrypoints and navigation
client/src/App.tsx:43:const BusinessSphereDashboard = lazyWithRecovery(
client/src/App.tsx:45:  () => import("./BusinessSphereDashboard"),
client/src/App.tsx:48:const PatientSmsConsentSettings = lazyWithRecovery(
client/src/App.tsx:50:  () => import("./components/PatientSmsConsentSettings"),
client/src/App.tsx:116:    if (requestedSignup && import.meta.env.MODE === "e2e") return <Suspense fallback={<DashboardRouteFallback />}><BusinessSphereDashboard /></Suspense>;
client/src/App.tsx:120:    if (requestedSignup) return <Suspense fallback={<DashboardRouteFallback />}><BusinessSphereDashboard /></Suspense>;
client/src/App.tsx:129:    <Route path="/app">{() => <ProtectedSurface><Suspense fallback={<DashboardRouteFallback />}><BusinessSphereDashboard /></Suspense></ProtectedSurface>}</Route>
client/src/App.tsx:130:    <Route path="/patient/sms-preferences">{() => <ProtectedSurface><Suspense fallback={<DashboardRouteFallback />}><PatientSmsConsentSettings /></Suspense></ProtectedSurface>}</Route>
client/src/BusinessSphereDashboard.jsx:4:  Factory, Truck, Megaphone, Store, FileText, Brain, Settings,
client/src/BusinessSphereDashboard.jsx:19:  School, Bus, Tablets, TestTube, Building, Hotel, Bed, Car, BookMarked, CalendarDays, UserCheck, Library, NotebookPen, Clipboard, DollarSign, BadgeCheck, Microscope, Syringe, UtensilsCrossed, ChefHat, Utensils, CookingPot, ConciergeBell, BedDouble, Key, DoorOpen, Split, MinusCircle, PlusCircle, RefreshCw, Shuffle, ArrowLeftRight, Wallet2, Coffee, Wine, ShoppingBasket, Pizza, Timer, Salad, CheckCircle, XCircle, RotateCcw, Archive, Moon, Sun, Sliders, SortAsc, SortDesc, CheckSquare, Undo2, BellRing, BarChart2, BadgePercent, Calculator, FolderSync, Database, Cpu, Globe2, Languages, GanttChart, KanbanSquare, Wifi, WifiOff, RefreshCcw, PanelLeftClose, PanelLeftOpen, ArrowUpCircle, ChevronFirst, ChevronLast, ImageIcon, Palette, Save, Info, Upload} from "lucide-react";
client/src/BusinessSphereDashboard.jsx:58:import { HospitalityWorkspace } from "./components/HospitalityWorkspace";
client/src/BusinessSphereDashboard.jsx:62:import { FleetWorkspace } from "./components/FleetWorkspace";
client/src/BusinessSphereDashboard.jsx:63:import { RestaurantWorkspace } from "./components/RestaurantWorkspace";
client/src/BusinessSphereDashboard.jsx:66:import { InventoryCommandCenter, PosCommandCenter, ProcurementCommandCenter, SupplyChainCommandCenter, WarehouseCommandCenter } from "./components/OperationsCommandCenters";
client/src/BusinessSphereDashboard.jsx:67:import { FinanceCommandCenter, IntegrationsCommandCenter, ReportsCommandCenter } from "./components/FinanceCommandCenters";
client/src/BusinessSphereDashboard.jsx:70:import { FleetCommandCenter, HealthcareCommandCenter, HotelCommandCenter, PharmacyCommandCenter, RestaurantCommandCenter, SchoolCommandCenter } from "./components/VerticalCommandCenters";
client/src/BusinessSphereDashboard.jsx:121:const LazyHealthcareClinicWorkspace = lazy(() => import("./components/HealthcareClinicWorkspace").then((module) => ({ default: module.HealthcareClinicWorkspace })));
client/src/BusinessSphereDashboard.jsx:124:const LazySchoolWorkspace = lazy(() => import("./components/SchoolWorkspace").then((module) => ({ default: module.SchoolWorkspace })));
client/src/BusinessSphereDashboard.jsx:126:const LazyPropertyManagementWorkspace = lazyWorkspaceWithRecovery(() => import("./components/PropertyManagementWorkspace").then((module) => ({ default: module.PropertyManagementWorkspace })), "property-management");
client/src/BusinessSphereDashboard.jsx:141:// Get these from: supabase.com → your project → Settings → API
client/src/BusinessSphereDashboard.jsx:146:// Slice 1 is deliberately opt-in: the established Settings/HR/invitation
client/src/BusinessSphereDashboard.jsx:1235:export function mapInventoryRow(r) {
client/src/BusinessSphereDashboard.jsx:1798:// category are looked up live from Inventory via the embedded select
client/src/BusinessSphereDashboard.jsx:1799:// "*,inventory_items(name,category)", so a rename in Inventory is
client/src/BusinessSphereDashboard.jsx:2146:    // CRM
client/src/BusinessSphereDashboard.jsx:2352:          <div class="kpi"><div class="kpi-label">Inventory Value</div><div class="kpi-value">TZS ${fmt(stockValue)}k</div><div class="kpi-sub">${(inventory?.rows||[]).length} SKUs</div></div>
client/src/BusinessSphereDashboard.jsx:2406:        <!-- CRM + SUBSCRIPTIONS -->
client/src/BusinessSphereDashboard.jsx:2408:          <div class="sec-hdr"><span class="sec-icon">📊</span><span class="sec-title">CRM & Revenue</span></div>
client/src/BusinessSphereDashboard.jsx:2498:              {l:"Inventory Value",   v:fmtCur(data.stockValue),    col:"#111827", sub:(inventory?.rows||[]).length+" SKUs"},
client/src/BusinessSphereDashboard.jsx:2609:          {/* 👥 HR + 📊 CRM snapshot */}
client/src/BusinessSphereDashboard.jsx:2628:              <h2 className="text-[14px] font-black text-[#111827] mb-3">📊 CRM & Revenue</h2>
client/src/BusinessSphereDashboard.jsx:2717:  // Find customer contact info from CRM
client/src/BusinessSphereDashboard.jsx:3289:// sidebar at all (allowedModules), and whether the role can create/edit/
client/src/BusinessSphereDashboard.jsx:3296:// fully real: change your role in Settings and the sidebar genuinely
client/src/BusinessSphereDashboard.jsx:3298:// Approvals, Notification Channels, Integration Connections, Settings
client/src/BusinessSphereDashboard.jsx:3330:    description: "Full financial authority — Finance, Procurement spend, and Reports — plus company-wide visibility for oversight.",
client/src/BusinessSphereDashboard.jsx:3334:    id: "Finance Manager", category: "Department Head",
client/src/BusinessSphereDashboard.jsx:3335:    description: "Sees every module for company-wide financial oversight; day-to-day work — invoicing, payables, ledger, tax — happens in Finance, Reports, and Procurement spend.",
client/src/BusinessSphereDashboard.jsx:3345:    description: "Sees every module for company-wide oversight; day-to-day work — pipeline, quotations, orders, invoicing, campaigns — happens in CRM, Sales, and Marketing.",
client/src/BusinessSphereDashboard.jsx:3374:    id: "Property Administrator", category: "Property Management",
client/src/BusinessSphereDashboard.jsx:3379:    id: "Property Manager", category: "Property Management",
client/src/BusinessSphereDashboard.jsx:3384:    id: "Landlord / Owner", category: "Property Management",
client/src/BusinessSphereDashboard.jsx:3389:    id: "Property Agent", category: "Property Management",
client/src/BusinessSphereDashboard.jsx:3394:    id: "Tenant", category: "Property Management Portal",
client/src/BusinessSphereDashboard.jsx:3399:    id: "Maintenance Staff", category: "Property Management",
client/src/BusinessSphereDashboard.jsx:3404:    id: "Property Finance Officer", category: "Property Management",
client/src/BusinessSphereDashboard.jsx:3410:    description: "Sees every module for company-wide visibility; day-to-day work — purchase orders, supplier relationships, vendor payments — happens in Procurement and Inventory.",
client/src/BusinessSphereDashboard.jsx:3415:    description: "Sees every module for company-wide visibility; day-to-day work — stock, work orders, shipments, fleet — happens in Inventory, Manufacturing, and Supply Chain.",
client/src/BusinessSphereDashboard.jsx:3425:    description: "Handles tickets, live chat, the knowledge base, and the call log; views CRM for customer context.",
client/src/BusinessSphereDashboard.jsx:3429:    id: "Clinic Administrator", category: "Healthcare",
client/src/BusinessSphereDashboard.jsx:3434:    id: "Doctor", category: "Healthcare",
client/src/BusinessSphereDashboard.jsx:3439:    id: "Nurse", category: "Healthcare",
client/src/BusinessSphereDashboard.jsx:3444:    id: "Laboratory Technician", category: "Healthcare",
client/src/BusinessSphereDashboard.jsx:3449:    id: "Pharmacist", category: "Healthcare",
client/src/BusinessSphereDashboard.jsx:3454:    id: "Receptionist", category: "Healthcare",
client/src/BusinessSphereDashboard.jsx:3459:    id: "Billing Officer", category: "Healthcare",
client/src/BusinessSphereDashboard.jsx:3464:    id: "School Administrator", category: "Education",
client/src/BusinessSphereDashboard.jsx:3533:  "Finance Manager": "financial",
client/src/BusinessSphereDashboard.jsx:3544:  "School Administrator": "focused",
client/src/BusinessSphereDashboard.jsx:3547:  "Property Administrator": "focused",
client/src/BusinessSphereDashboard.jsx:3548:  "Property Manager": "focused",
client/src/BusinessSphereDashboard.jsx:3550:  "Property Agent": "focused",
client/src/BusinessSphereDashboard.jsx:3553:  "Property Finance Officer": "focused",
client/src/BusinessSphereDashboard.jsx:3562:  { id: "crm", label: "CRM", icon: Users, live: true },
client/src/BusinessSphereDashboard.jsx:3564:  { id: "inventory", label: "Inventory", icon: Package, live: true },
client/src/BusinessSphereDashboard.jsx:3566:  { id: "finance", label: "Finance", icon: Wallet, live: true },
client/src/BusinessSphereDashboard.jsx:3567:  { id: "reports", label: "Reports", icon: BarChart3, live: true },
client/src/BusinessSphereDashboard.jsx:3573:  { id: "pos", label: "Point of Sale", icon: ShoppingBag, live: true },
client/src/BusinessSphereDashboard.jsx:3584:  { id: "ai", label: "AI Assistant", icon: Brain, live: true },
client/src/BusinessSphereDashboard.jsx:3587:  { id: "property-management", label: "Property Management", icon: Building2, live: true },
client/src/BusinessSphereDashboard.jsx:3590:  { id: "healthcare", label: "Healthcare / Clinic", icon: HeartPulse, live: true },
client/src/BusinessSphereDashboard.jsx:3591:  { id: "school",     label: "School Management",  icon: School,     live: true },
client/src/BusinessSphereDashboard.jsx:3593:  { id: "hotel",      label: "Hotel & Hospitality",icon: Hotel,      live: true },
client/src/BusinessSphereDashboard.jsx:3594:  { id: "fleet",      label: "Fleet Management",   icon: Bus,        live: true },
client/src/BusinessSphereDashboard.jsx:3596:  { id: "restaurant",     label: "Restaurant & F&B",   icon: UtensilsCrossed, live: true },
client/src/BusinessSphereDashboard.jsx:3619:  { id: "CON-02", name: "Joseph Mwakisisile", title: "Finance Director", company: "Kilimo Fresh Distributors", email: "j.mwakisisile@kilimofresh.co.tz", phone: "+255 754 221 910", isPrimary: false },
client/src/BusinessSphereDashboard.jsx:3632:  { id: "L-0225", name: "Halima Juma", company: "Baraka Hotels & Resorts", stage: "Negotiation", value: 96500, currency: "TZS000", owner: "J. Batenga", email: "halima@barakahotels.co.tz", phone: "+255 754 662 187", industry: "Hospitality", lastActivity: "4d ago", score: 88, expectedCloseDate: "2026-07-10" },
client/src/BusinessSphereDashboard.jsx:3652:    // ── Finance: Overdue invoices ─────────────────────────────────────────
client/src/BusinessSphereDashboard.jsx:3662:          category: "Finance",
client/src/BusinessSphereDashboard.jsx:3672:    // ── Inventory: Low / out of stock ─────────────────────────────────────
client/src/BusinessSphereDashboard.jsx:3678:          category: "Inventory",
client/src/BusinessSphereDashboard.jsx:3682:          action: "View Inventory → Reorder Alerts",
client/src/BusinessSphereDashboard.jsx:3760:    // ── Fleet: Insurance expiring ──────────────────────────────────────────
client/src/BusinessSphereDashboard.jsx:3766:          category: "Fleet",
client/src/BusinessSphereDashboard.jsx:3770:          action: "View Fleet → Vehicles",
client/src/BusinessSphereDashboard.jsx:3777:          category: "Fleet",
client/src/BusinessSphereDashboard.jsx:3781:          action: "View Fleet → Vehicles",
client/src/BusinessSphereDashboard.jsx:3786:    // ── School: Unpaid fees ───────────────────────────────────────────────
client/src/BusinessSphereDashboard.jsx:3793:          category: "School",
client/src/BusinessSphereDashboard.jsx:3797:          action: "View School → Fee Collection",
client/src/BusinessSphereDashboard.jsx:3802:    // ── Restaurant: Active orders in kitchen ──────────────────────────────
client/src/BusinessSphereDashboard.jsx:3808:          category: "Restaurant",
client/src/BusinessSphereDashboard.jsx:3812:          action: "View Restaurant → Kitchen Display",
client/src/BusinessSphereDashboard.jsx:4041:// (see Settings) — that role can see every module, but without an actual
client/src/BusinessSphereDashboard.jsx:4047:// reflects whichever demo role is selected in Settings, not a verified
client/src/BusinessSphereDashboard.jsx:4087:  return recordConfirmedTenantAudit("Organization industry focus changed", "Settings", actor, `${previousFocus || "general"} → ${nextFocus}`);
client/src/BusinessSphereDashboard.jsx:4092:// is shared by Sales and Finance since both operate on the same invoices
client/src/BusinessSphereDashboard.jsx:4162:  logAudit(newStatus === "Paid" ? "Invoice paid in full" : "Partial payment recorded", "Finance", actor, `${invoiceDocumentId} — TZS ${money(payment.amount)}k via ${payment.method}${payment.reference ? " (" + payment.reference + ")" : ""}`);
client/src/BusinessSphereDashboard.jsx:4170:// companies.tax_rate (Settings, section 46) rather than baked in. A
client/src/BusinessSphereDashboard.jsx:4304:      { name: "Fleet GPS tracking units", qty: 24, rate: 145 },
client/src/BusinessSphereDashboard.jsx:4320:      { name: "Fleet GPS tracking units", qty: 24, rate: 145 },
client/src/BusinessSphereDashboard.jsx:4386:    id: "SUB-201", customer: "Meridian Logistics", plan: "Fleet GPS Monitoring", amount: 1440, cycle: "Monthly",
client/src/BusinessSphereDashboard.jsx:4456:  { sku: "HDW-2204", name: "Fleet GPS tracking unit", category: "Electronics", warehouse: "WH-DSM", qty: 0, reorder: 20, unitCost: 118, unit: "unit", expiryDate: null },
client/src/BusinessSphereDashboard.jsx:4523:// Settings already is.
client/src/BusinessSphereDashboard.jsx:4549:    items: [{ sku: "HDW-2204", name: "Fleet GPS tracking unit", qty: 30, cost: 105 }],
client/src/BusinessSphereDashboard.jsx:4624:  { id: "EX-4501", vendor: "Kilimanjaro Property Holdings", category: "Rent & Utilities", date: "2026-06-28", dueDate: "2026-07-28", amount: 8200, status: "Paid", method: "Bank Transfer", department: "Operations", costCenter: "CC-OPS-01" },
client/src/BusinessSphereDashboard.jsx:4629:  { id: "EX-4496", vendor: "Bahati & Partners Audit", category: "Professional Fees", date: "2026-06-18", dueDate: "2026-06-25", amount: 4500, status: "Scheduled", method: "Bank Transfer", department: "Finance", costCenter: "CC-FIN-01" },
client/src/BusinessSphereDashboard.jsx:4636:const DEPARTMENTS = ["Sales", "Operations", "Finance", "Warehouse", "Admin"];
client/src/BusinessSphereDashboard.jsx:4656:  { id: "EMP-106", name: "Fatuma Salim", role: "Accountant", department: "Finance", email: "f.salim@beirahisi.co.tz", phone: "+255 715 990 341", status: "Active", salary: 1900, hireDate: "2022-06-01", contractType: "Permanent", contractEndDate: null },
client/src/BusinessSphereDashboard.jsx:4696:  { id: "CAND-02", name: "Baraka Mwita", role: "Junior Accountant", department: "Finance", stage: "Screening", email: "b.mwita@gmail.com", appliedDate: "2026-06-25" },
client/src/BusinessSphereDashboard.jsx:4748:  { id: "TRN-02", employee: "Elias Rugambwa", course: "Fleet Safety Certification", status: "In Progress", completionDate: null },
client/src/BusinessSphereDashboard.jsx:4775:// keeping "material cost per unit" honest to what Inventory shows.
client/src/BusinessSphereDashboard.jsx:4777:// must move when a component's unit cost changes in Inventory, not stay
client/src/BusinessSphereDashboard.jsx:4801:    id: "BOM-03", product: "Fleet Tracking Install Kit", outputUnit: "kit",
client/src/BusinessSphereDashboard.jsx:4821:  { id: "WO-299", bomId: "BOM-03", product: "Fleet Tracking Install Kit", qty: 24, status: "Completed", startDate: "2026-06-14", dueDate: "2026-06-20", assignedTo: "David Chen" },
client/src/BusinessSphereDashboard.jsx:4861:// seen across CRM, Sales, and Finance.
client/src/BusinessSphereDashboard.jsx:4864:  { id: "PRJ-02", name: "Fleet GPS Deployment", client: "Meridian Logistics", status: "Active", startDate: "2026-06-15", endDate: "2026-07-20", budget: 15000, manager: "S. Kileo" },
client/src/BusinessSphereDashboard.jsx:4896:  { id: "MS-03", projectId: "PRJ-02", title: "Fleet-wide GPS live", dueDate: "2026-07-20", completed: false },
client/src/BusinessSphereDashboard.jsx:4900:// Logging a project expense creates a real Finance expense (category
client/src/BusinessSphereDashboard.jsx:4998:// principle already documented for the AI Assistant's API key. Building a
client/src/BusinessSphereDashboard.jsx:5111:    requirement: "Connecting external POS hardware (Square, Clover, and similar) needs that vendor's own device SDK and a paired terminal — not something a web page can do without their hardware present. This app's own built-in Point of Sale module is real, working checkout software already, not a connector to someone else's till.",
client/src/BusinessSphereDashboard.jsx:5117:const TAX_AUTHORITY_NOTE = "No tax authority in East Africa exposes a generic public API a third-party app can integrate with — filing systems like TRA's require certified, business-specific credentials issued directly to the taxpayer. The real, honest capability here is preparation: the VAT Summary already built in Finance computes exactly the number a filing needs.";
client/src/BusinessSphereDashboard.jsx:5145:// of which this build has. This is exactly how real CRMs (Salesforce's own
client/src/BusinessSphereDashboard.jsx:5208:  { id: "generate_report", label: "Generate a Report", icon: FileText, color: "#0EA5E9", fields: [{ key: "reportType", label: "Report type", options: ["Sales & Revenue", "Inventory Valuation", "Profit & Loss"] }] },
client/src/BusinessSphereDashboard.jsx:5229:// the identical limitation already stated for Scheduled Reports.
client/src/BusinessSphereDashboard.jsx:5307:// Storefront products are built from real Inventory items with a retail
client/src/BusinessSphereDashboard.jsx:5342:  { id: "WEB-5518", customer: "Omary Kassim", email: "o.kassim@gmail.com", items: [{ name: "Fleet GPS tracking unit", qty: 3, price: 159 }], total: 477, status: "Payment Pending", method: "Mobile Money", date: "2026-06-28" },
client/src/BusinessSphereDashboard.jsx:5422:// Campaigns target a live CRM segment by industry — "sent to" counts are
client/src/BusinessSphereDashboard.jsx:5427:  { id: "CMP-116", name: "New Hospitality Fixtures Launch", type: "Email", status: "Sent", segment: "Hospitality", sentDate: "2026-06-08", openRate: 51, clickRate: 15 },
client/src/BusinessSphereDashboard.jsx:5595:    { title: "CRM Pipeline by Stage", module: "crm", rows: pipelineByStage },
client/src/BusinessSphereDashboard.jsx:5596:    { title: "Inventory Value by Category", module: "inventory", rows: stockByCategory },
client/src/BusinessSphereDashboard.jsx:5607:  const moduleLabels = { finance: "Finance", sales: "Sales", crm: "CRM", inventory: "Inventory", operations: "Operations" };
client/src/BusinessSphereDashboard.jsx:5608:  const activeModules = Object.entries(moduleLabels).filter(([key]) => enabledModules[key] !== false).map(([, label]) => label);
client/src/BusinessSphereDashboard.jsx:5610:  return `${activeModules.length === 5 ? "All modules" : activeModules.join(", ") || "Executive KPIs only"} · ${dates}`;
client/src/BusinessSphereDashboard.jsx:6008:  const canViewMarketIntelligence = ["Super Administrator", "Organization Owner", "CEO", "CFO", "Finance Manager"].includes(canonicalRoleId(currentUser.role));
client/src/BusinessSphereDashboard.jsx:6009:  const vatAnomalySettingsQuery = trpc.traFiscal.getVatAnomalySettings.useQuery(
client/src/BusinessSphereDashboard.jsx:6047:  const [digestSettingsOpen, setDigestSettingsOpen] = useState(false);
client/src/BusinessSphereDashboard.jsx:6079:  // "Sales" — pipeline by stage, live from CRM.
client/src/BusinessSphereDashboard.jsx:6085:  // Reports' Sales & Revenue report at a glance rather than duplicating a
client/src/BusinessSphereDashboard.jsx:6096:  // "Inventory" — stock value by category, live.
client/src/BusinessSphereDashboard.jsx:6253:        actionLabel: "Open CRM",
client/src/BusinessSphereDashboard.jsx:6261:        eyebrow: "Inventory readiness",
client/src/BusinessSphereDashboard.jsx:6282:  // (invoices, expenses, leave requests); CRM's lastActivity is already a
client/src/BusinessSphereDashboard.jsx:6321:    { label: "AI Assistant", icon: Brain, action: () => onNavigate("ai") },
client/src/BusinessSphereDashboard.jsx:6437:        {roleHeader("cash flow, receivables, and payables, live from Finance")}
client/src/BusinessSphereDashboard.jsx:6438:        <FinanceCommandCenter invoices={invoices} expenses={expenses} posTransactions={posTransactions} onNavigate={onNavigate} />
client/src/BusinessSphereDashboard.jsx:6457:        {roleHeader("pipeline, forecast, and revenue by customer, live from CRM and Sales")}
client/src/BusinessSphereDashboard.jsx:6469:          ? "supplier coverage, replenishment, and purchasing readiness, live from Procurement and Inventory"
client/src/BusinessSphereDashboard.jsx:6470:          : "stock, work orders, and operational throughput, live from Inventory and Manufacturing")}
client/src/BusinessSphereDashboard.jsx:6489:    const rolePreferredTarget = ["Property Administrator", "Property Manager", "Landlord / Owner", "Property Agent", "Tenant", "Maintenance Staff", "Property Finance Officer"].includes(currentRole.id) ? "property-management" : currentRole.id === "School Administrator" ? "school" : currentRole.id === "Customer Support Agent" ? "support" : preferredTarget;
client/src/BusinessSphereDashboard.jsx:6602:                  {lastScheduleSentAt ? `Last email digest delivered successfully on ${new Date(lastScheduleSentAt).toLocaleString()}` : hasActiveSchedules ? 'Scheduled weekly email dispatches are active and monitoring tenant tax records.' : 'Configure automated report schedules in the Reports module to enable weekly compliance email dispatches.'}
client/src/BusinessSphereDashboard.jsx:6609:                onClick={() => setDigestSettingsOpen(true)}
client/src/BusinessSphereDashboard.jsx:6622:            {digestSettingsOpen && (
client/src/BusinessSphereDashboard.jsx:6623:              <ComplianceDigestSettingsModal
client/src/BusinessSphereDashboard.jsx:6626:                onClose={() => setDigestSettingsOpen(false)}
client/src/BusinessSphereDashboard.jsx:6628:                  setDigestSettingsOpen(false);
client/src/BusinessSphereDashboard.jsx:6781:            const hasFinanceData = invRows.length > 0 || expRows.length > 0;
client/src/BusinessSphereDashboard.jsx:6787:              { label: "Gross P&L", value: `${grossProfit >= 0 ? "+" : "−"}${formatMoney(Math.abs(grossProfit))}`, color: grossProfit >= 0 ? "#4ADE80" : "#F87171", context: hasFinanceData ? "Collected less expenses" : `No invoice or expense entries in ${periodText}`, action: "Open finance", onClick: () => onNavigate("finance") },
client/src/BusinessSphereDashboard.jsx:6788:              { label: "Inventory", value: formatMoney(inventoryValue), color: "#C4B5FD", context: inventory.rows.length ? `${inventory.rows.length} stocked SKU${inventory.rows.length === 1 ? "" : "s"}` : "No stock items recorded", action: "Open inventory", onClick: () => onNavigate("inventory") },
client/src/BusinessSphereDashboard.jsx:6790:              { label: "Pipeline", value: formatMoney(pipelineValue), color: "#F9A8D4", context: openLeads.length ? `${openLeads.length} open deal${openLeads.length === 1 ? "" : "s"}` : "No open deals recorded", action: "Open CRM", onClick: () => onNavigate("crm") },
client/src/BusinessSphereDashboard.jsx:6971:              { category: "Finance", actions: [
client/src/BusinessSphereDashboard.jsx:6979:                { label: "View Reports", icon: BarChart3, color: "#1E3A8A", action: () => onNavigate("reports") },
client/src/BusinessSphereDashboard.jsx:6989:                { label: "AI Assistant", icon: Sparkles, color: "#9333EA", action: () => onNavigate("ai") },
client/src/BusinessSphereDashboard.jsx:7255:                      const thresholdPercent = vatAnomalySettingsQuery.data?.thresholdPercent ?? 50;
client/src/BusinessSphereDashboard.jsx:7256:                      const alertsEnabled = vatAnomalySettingsQuery.data?.enabled !== false;
client/src/BusinessSphereDashboard.jsx:7519:              { id: "crm", label: "CRM", icon: Users, status: crm.rows.length ? "tracking" : "noData", metric: crm.rows.length ? `${crm.rows.length} confirmed lead${crm.rows.length === 1 ? "" : "s"}` : "No confirmed leads", detail: crm.rows.length ? "Review pipeline records" : "Open CRM to add or review leads" },
client/src/BusinessSphereDashboard.jsx:7521:              { id: "inventory", label: "Inventory", icon: Package, status: lowStockItems.length ? "attention" : (inventory.rows.length ? "tracking" : "noData"), metric: lowStockItems.length ? `${lowStockItems.length} item${lowStockItems.length === 1 ? "" : "s"} need review` : (inventory.rows.length ? `${inventory.rows.length} stocked SKU${inventory.rows.length === 1 ? "" : "s"}` : "No confirmed stock items"), detail: lowStockItems.length ? "Review stock levels" : "Open inventory records" },
client/src/BusinessSphereDashboard.jsx:7523:              { id: "finance", label: "Finance", icon: CircleDollarSign, status: (invoices.rows.length || expenses.rows.length) ? "tracking" : "noData", metric: (invoices.rows.length || expenses.rows.length) ? `${invoices.rows.length} invoice${invoices.rows.length === 1 ? "" : "s"} · ${expenses.rows.length} expense${expenses.rows.length === 1 ? "" : "s"}` : "No confirmed finance entries", detail: "Open finance records" },
client/src/BusinessSphereDashboard.jsx:7524:              { id: "hr", label: "Human Resources", icon: UserCheck, status: pendingLeaves.length ? "attention" : (activeEmployees.length ? "tracking" : "noData"), metric: pendingLeaves.length ? `${pendingLeaves.length} leave request${pendingLeaves.length === 1 ? "" : "s"} pending` : (activeEmployees.length ? `${activeEmployees.length} active employee${activeEmployees.length === 1 ? "" : "s"}` : "No confirmed HR records"), detail: pendingLeaves.length ? "Review leave requests" : "Open HR records" },
client/src/BusinessSphereDashboard.jsx:7529:              { id: "reports", label: "Reports", icon: FileText, status: "available", metric: "Exports confirmed dashboard data", detail: "Open reporting workspace" },
client/src/BusinessSphereDashboard.jsx:7530:              { id: "pos", label: "Point of Sale", icon: ScanLine, status: posTransactions.rows.length ? "tracking" : "noData", metric: posTransactions.rows.length ? `${posTransactions.rows.length} confirmed transaction${posTransactions.rows.length === 1 ? "" : "s"}` : "No confirmed POS transactions", detail: "Open point of sale" },
client/src/BusinessSphereDashboard.jsx:7534:              { id: "ai", label: "AI Assistant", icon: Brain, status: "available", metric: "Available on demand", detail: "Open AI assistant" },
client/src/BusinessSphereDashboard.jsx:7592:            if (!custData.length) return <EmptyState icon={Users} title="No billed customers yet" hint="Customer revenue appears here after a confirmed invoice is linked to a customer. Open CRM to add or review customer records first." actionLabel="Open CRM" onAction={()=>onQuickAction("crm",{tab:"leads"})} tips={["Add or review a customer or lead in CRM before recording the first invoice."]} sourceNote="Source: confirmed invoice records only."/>;
client/src/BusinessSphereDashboard.jsx:7607:        {/* Inventory Category PieChart */}
client/src/BusinessSphereDashboard.jsx:7609:          <h3 className="text-[13.5px] font-bold text-[#111827] mb-1">Inventory by Category</h3>
client/src/BusinessSphereDashboard.jsx:7645:        {/* CRM Pipeline Funnel */}
client/src/BusinessSphereDashboard.jsx:7657:            if (!stageData.length) return <EmptyState icon={Users} title="No active pipeline yet" hint="Create a confirmed lead to begin visualizing deal stages. Potential value appears once it is recorded on a lead." actionLabel="Open Leads" onAction={()=>onQuickAction("crm",{tab:"leads"})} tips={["Capture the next customer opportunity in CRM, then update its stage as the conversation progresses."]} sourceNote="Source: confirmed CRM lead records only."/>;
client/src/BusinessSphereDashboard.jsx:7752:            {attentionItems.length === 0 && <div className="px-5 py-9 text-center"><CheckCircle2 size={20} className="text-[#16A34A] mx-auto mb-2"/><p className="text-[12.5px] font-medium text-slate-600">No current follow-ups from connected sources.</p><p className="mt-1 text-[11px] leading-relaxed text-slate-400">Inventory and manufacturing signals have no outstanding items to review.</p></div>}
client/src/BusinessSphereDashboard.jsx:7819:    { id: "finance", label: "Finance records", detail: `${invoices.rows.length} confirmed invoice${invoices.rows.length === 1 ? "" : "s"} and ${expenses.rows.length} expense${expenses.rows.length === 1 ? "" : "s"}`, ready: invoices.rows.length + expenses.rows.length > 0, module: "finance" },
client/src/BusinessSphereDashboard.jsx:7821:    { id: "inventory", label: "Inventory records", detail: `${inventory.rows.length} confirmed item${inventory.rows.length === 1 ? "" : "s"}`, ready: inventory.rows.length > 0, module: "inventory" },
client/src/BusinessSphereDashboard.jsx:7992:/* ---------------------------------- CRM ------------------------------------ */
client/src/BusinessSphereDashboard.jsx:8174:const CRM_TABS = [
client/src/BusinessSphereDashboard.jsx:8189:function CRM({ crm, invoices, expenses, suppliers }) {
client/src/BusinessSphereDashboard.jsx:8339:      <ScrollableModuleTabs tabs={CRM_TABS} activeTab={tab} onChangeTab={setTab} />
client/src/BusinessSphereDashboard.jsx:8767:              <p className="text-[12.5px] text-slate-500">They are already real records — check {type === "customers" ? "CRM" : "Inventory"} now.</p>
client/src/BusinessSphereDashboard.jsx:8960:            <p className="text-[11px] text-slate-400 uppercase tracking-wide">CRM</p>
client/src/BusinessSphereDashboard.jsx:9777:                              title="Open Congratulations Studio in Settings">
client/src/BusinessSphereDashboard.jsx:10055:                <tr><td colSpan={8}><div className="py-12 text-center text-slate-400">No customers yet — win a lead in CRM Pipeline to see them here.</div></td></tr>
client/src/BusinessSphereDashboard.jsx:10356:          <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">CRM</p><h2 className="text-[18px] font-semibold text-[#111827] mt-0.5">New Contact</h2></div>
client/src/BusinessSphereDashboard.jsx:10365:            <input className={inputClass} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Finance Director" />
client/src/BusinessSphereDashboard.jsx:10419:  // (see SmartManager) — quotations because the AI Assistant's
client/src/BusinessSphereDashboard.jsx:10894:    // the shared Inventory. Line items are matched by name — unmatched lines
client/src/BusinessSphereDashboard.jsx:11167:  // is the highest-traffic slide-over in the system (Sales, Finance, Procurement).
client/src/BusinessSphereDashboard.jsx:11604:          <p className="text-[11.5px] text-slate-400">Returned quantities are restocked to Inventory immediately.</p>
client/src/BusinessSphereDashboard.jsx:11884:  // Finance visibility as one created by hand — and advances the
client/src/BusinessSphereDashboard.jsx:12174:            <input className={inputClass} value={form.plan} onChange={(e) => set("plan", e.target.value)} placeholder="e.g. Fleet GPS Monitoring" />
client/src/BusinessSphereDashboard.jsx:12221:function InventoryDashboard({ inventory, suppliersHook }) {
client/src/BusinessSphereDashboard.jsx:12379:function Inventory({ inventory, suppliersHook }) {
client/src/BusinessSphereDashboard.jsx:12418:        const confirmed = savedRows.map(mapInventoryRow);
client/src/BusinessSphereDashboard.jsx:12485:        const confirmed = mapInventoryRow(saved);
client/src/BusinessSphereDashboard.jsx:12505:        const confirmed = mapInventoryRow(saved);
client/src/BusinessSphereDashboard.jsx:12555:      expectedDate: null, requestedBy: "Inventory reorder", subtotal: total, total,
client/src/BusinessSphereDashboard.jsx:12598:          <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#111827] tracking-tight">Inventory</h1>
client/src/BusinessSphereDashboard.jsx:12610:            printReport("Inventory Stock Report",`<div class="kpi-grid"><div class="kpi"><div class="kpi-label">Total SKUs</div><div class="kpi-value">${inventory.rows.length}</div></div><div class="kpi"><div class="kpi-label">Low Stock</div><div class="kpi-value" style="color:#EF4444">${lowItems.length}</div></div><div class="kpi"><div class="kpi-label">Stock Value</div><div class="kpi-value" style="color:#16A34A">TZS ${money(Math.round(inventory.rows.reduce((s,it)=>s+(it.qty||0)*(it.unitCost||0),0)/1000))}k</div></div></div><table><thead><tr><th>Item</th><th>SKU</th><th>Category</th><th class="r">Stock</th><th class="r">Unit Cost</th><th class="r">Value</th><th>Status</th></tr></thead><tbody>${tableRows}</tbody></table>`,co2);
client/src/BusinessSphereDashboard.jsx:12638:            <span><strong>Guided Inventory Tip:</strong> Use Warehouses to track multi-location stock, Batches for expiration control, and Reorder Alerts to safely restock without stockouts.</span>
client/src/BusinessSphereDashboard.jsx:12647:      {tab === "analysis" && <InventoryAnalysisView inventory={inventory} />}
client/src/BusinessSphereDashboard.jsx:12654:            {tab === "dashboard" && <InventoryDashboard inventory={inventory} suppliersHook={suppliersHook}/>}
client/src/BusinessSphereDashboard.jsx:13042:            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Inventory</p>
client/src/BusinessSphereDashboard.jsx:13213:          <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Inventory</p><h2 className="text-[18px] font-semibold text-[#111827] mt-0.5">New Warehouse</h2></div>
client/src/BusinessSphereDashboard.jsx:13352:          <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Inventory</p><h2 className="text-[18px] font-semibold text-[#111827] mt-0.5">New Transfer</h2></div>
client/src/BusinessSphereDashboard.jsx:13476:          <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Inventory</p><h2 className="text-[18px] font-semibold text-[#111827] mt-0.5">Log Batch</h2></div>
client/src/BusinessSphereDashboard.jsx:13625:function InventoryAnalysisView({ inventory }) {
client/src/BusinessSphereDashboard.jsx:13734:      {/* Expiry intelligence — the one Smart Inventory item that had real
client/src/BusinessSphereDashboard.jsx:13851:    logAudit("Reorder initiated: " + item.name, "Inventory", "System", "Suggested qty: " + item.suggestedQty);
client/src/BusinessSphereDashboard.jsx:13884:            <h3 className="text-[13.5px] font-semibold text-[#111827] mb-2">Inventory Health</h3>
client/src/BusinessSphereDashboard.jsx:14115:          <div><p className="text-[11px] text-slate-400 uppercase tracking-wide">Inventory</p><h2 className="text-[18px] font-semibold text-[#111827] mt-0.5">New Supplier</h2></div>
client/src/BusinessSphereDashboard.jsx:14274:          if (!item) throw new Error(`Inventory item ${it.sku} is unavailable for receipt.`);
client/src/BusinessSphereDashboard.jsx:14277:          inventoryUpdates.push(mapInventoryRow(savedItem));
client/src/BusinessSphereDashboard.jsx:14656:            You are viewing as {currentUser.role}. Approving or rejecting purchase orders requires a full-write role — switch roles in Settings to test this.
client/src/BusinessSphereDashboard.jsx:14808:      id: docId("EX"), vendor: order.supplier, category: "Inventory Purchases",
client/src/BusinessSphereDashboard.jsx:14813:    // the shared Finance table — the same one Payroll and Subscriptions
client/src/BusinessSphereDashboard.jsx:14817:    notify(`${order.id} paid — TZS ${money(Math.round(total))}k recorded in Finance`);
client/src/BusinessSphereDashboard.jsx:14822:          vendor: expenseDraft.vendor, category: "Inventory Purchases", expense_date: expenseDraft.date,
client/src/BusinessSphereDashboard.jsx:14995:            <EmptyState icon={Building2} title="No suppliers yet" hint="Add suppliers from Inventory to see their activity here." />
client/src/BusinessSphereDashboard.jsx:15022:function Finance({ invoices, expensesHook, posTransactionsHook, currentUser, intent, clearIntent, company, employeesHook, inventoryHook }) {
client/src/BusinessSphereDashboard.jsx:15032:  // expenses with Reports — one source of truth for each.
client/src/BusinessSphereDashboard.jsx:15193:        <h1 className="text-[20px] sm:text-[22px] font-semibold text-[#111827] tracking-tight">Finance</h1>
client/src/BusinessSphereDashboard.jsx:15219:      {tab === "overview" && <FinanceOverview invoices={allInvoices} expenses={expenses} posTransactions={posTransactionsHook.rows} />}
client/src/BusinessSphereDashboard.jsx:15248:function FinanceOverview({ invoices, expenses, posTransactions }) {
client/src/BusinessSphereDashboard.jsx:15868:            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Finance</p>
client/src/BusinessSphereDashboard.jsx:16086:  { code: "1200", name: "Inventory", type: "Asset" },
client/src/BusinessSphereDashboard.jsx:16125:    // Inventory reuses the exact same computation the Balance Sheet uses —
client/src/BusinessSphereDashboard.jsx:16219:          <p className="text-[10.5px] text-slate-400 mt-1.5">Owners Equity (3000) is computed as the exact residual needed to balance — the same honest reasoning as the Balance Sheet equity line (Reports). This system has no separate paid-in-capital or retained-earnings ledger to draw an independent figure from.</p>
client/src/BusinessSphereDashboard.jsx:16255:  const departmentLines = ["Operations", "Sales", "Finance", "Warehouse", "Admin"].map((dept) => {
client/src/BusinessSphereDashboard.jsx:16711:      <p className="text-[10.5px] text-slate-400">Inventory turnover and gross margin absent intentionally — both require cost-of-goods-sold matched to units sold, which this schema does not track per-unit.</p>
client/src/BusinessSphereDashboard.jsx:16873:    logAudit(`Loan repayment: ${loan.lender}`, "Finance", "User", `TZS ${money(amt)}k via ${repayMethod}. Balance: TZS ${money(Math.round(Math.max(0, balance - amt)))}k`);
client/src/BusinessSphereDashboard.jsx:17085:// an honest home in this system's existing Sales or CRM tables, both of
client/src/BusinessSphereDashboard.jsx:17142:        {!debtors.loading && filtered.length === 0 && <EmptyState icon={UserPlus} title="No debtors" hint="Money owed to the business outside a formal sale, tracked separately from Sales and CRM." actionLabel="Add Debtor" onAction={() => setShowForm(true)} />}
client/src/BusinessSphereDashboard.jsx:17772:            <p className="text-[11px] text-slate-400 uppercase tracking-wide">Finance</p>
client/src/BusinessSphereDashboard.jsx:17846:  { id:"DTY-003", title:"Inventory audit — Aisle C",assignee:"Grace Mmbaga",dept:"Warehouse",  date:"2026-07-21", startTime:"08:00", endTime:"12:00", type:"Audit",      priority:"Medium", status:"In Progress",completedAt:null,               approvedBy:null,           approvedAt:null,               notes:"" },

## Frontend Supabase table/query references

## Server procedures and persistence helpers
server/standingOrderWebhookRemediationContract.test.ts:5:  new URL("../supabase/migrations/20260825_014_standing_order_webhook_remediation.sql", import.meta.url),
server/supabaseBuildCredentials.test.ts:3:const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
server/supabaseBuildCredentials.test.ts:8:    if (!supabaseUrl || !serviceKey) {
server/supabaseBuildCredentials.test.ts:12:    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
server/supabaseAuthClient.test.ts:7:} from "../client/src/lib/supabaseAuthClient";
server/standingOrderSchedulerHandler.test.ts:2:import { handleSchedulerRequest } from "../supabase/functions/standing-order-scheduler/lib";
server/standingOrderSchedulerHandler.test.ts:8:      SUPABASE_URL: "https://example.supabase.co/",
server/workspacePresenceRecoveryMigration.test.ts:4:const migration = readFileSync(new URL("../supabase/migrations/20260825_005_workspace_presence_recovery.sql", import.meta.url), "utf8");
server/standingOrderServerContract.test.ts:6:const migration = readFileSync(new URL("../supabase/migrations/20250825_007_standing_order_server_implementation.sql", import.meta.url), "utf8");
server/standingOrderServerContract.test.ts:7:const searchPathHardening = readFileSync(new URL("../supabase/migrations/20260825_008_standing_order_security_hardening.sql", import.meta.url), "utf8");
server/standingOrderServerContract.test.ts:8:const invokerHardening = readFileSync(new URL("../supabase/migrations/20260825_009_standing_order_invoker_helpers.sql", import.meta.url), "utf8");
server/standingOrderServerContract.test.ts:38:      expect(operations).toContain(`export async function ${method}`);
server/standingOrderServerContract.test.ts:39:      expect(router).toContain(`${method}: protectedProcedure`);
server/trialExpiryNoticeAdmin.integration.test.ts:7:vi.mock("./_core/env", () => ({ ENV: { supabaseUrl: "https://trial-notice.local", supabaseAnonKey: "anon-test-key" } }));
server/trialExpiryNoticeAdmin.integration.test.ts:70:      headers: { "content-type": "application/json", "x-supabase-authorization": "Bearer session-admin-a" },
server/trialExpiryNoticeAdmin.integration.test.ts:77:      headers: { "x-supabase-authorization": "Bearer session-admin-a" },
server/trialExpiryNoticeAdmin.integration.test.ts:93:      headers: { "content-type": "application/json", "x-supabase-authorization": "Bearer session-employee-a" },
server/trialExpiryNotice.test.ts:11:const migration = read("supabase/migrations/20260824_064_trial_expiry_notice_once.sql");
server/trialExpiryNotice.test.ts:102:    expect(billingWorkspace).toContain("export function TrialNoticeAdmin");
server/authIdentitySnapshotMigration.test.ts:5:const migrationPath = resolve(process.cwd(), "supabase/migrations/20260824_061_auth_identity_snapshot.sql");
server/authContextSnapshotContract.test.ts:10:    expect(authContext).toContain('client.rpc("auth_identity_snapshot")');
server/workspaceSettings.ts:67:  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
server/workspaceSettings.ts:70:  return { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}`, "content-type": "application/json" };
server/workspaceSettings.ts:74:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace Settings is not configured." });
server/workspaceSettings.ts:75:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}&select=*`, {
server/workspaceSettings.ts:76:    headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}` },
server/workspaceSettings.ts:84:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace Settings is not configured." });
server/workspaceSettings.ts:85:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/company_profile_settings?company_id=eq.${encodeURIComponent(companyId)}&select=profile_data`, {
server/workspaceSettings.ts:86:    headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}` },
server/workspaceSettings.ts:94:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace Settings is not configured." });
server/workspaceSettings.ts:95:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`, {
server/workspaceSettings.ts:97:    headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", Prefer: "return=representation" },
server/workspaceSettings.ts:106:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/company_profile_settings?on_conflict=company_id`, {
server/workspaceSettings.ts:116:export function validateSignatureLogoPayload(input: SettingsInput["signatureLogo"]) {
server/workspaceSettings.ts:123:export function signatureLogoStorageKey(companyId: string, extension: string) {
server/workspaceSettings.ts:127:export function cleanProfileData(data: ProfileData): ProfileData {
server/workspaceSettings.ts:144:export function profileDataForClient(profileData: ProfileData): ProfileData {
server/workspaceSettings.ts:149:export async function getWorkspaceSettings(req: CreateExpressContextOptions["req"]) {
server/workspaceSettings.ts:155:export async function getTenantCollaborationWorkflowWebhook(req: CreateExpressContextOptions["req"]) {
server/workspaceSettings.ts:166:export async function saveWorkspaceSettings(req: CreateExpressContextOptions["req"], input: SettingsInput) {
server/workspaceBranding.ts:20:export function normalizeOrganizationIndustryFocus(value: string | undefined) {
server/workspaceBranding.ts:28:export function normalizeBrandColor(value: string) {
server/workspaceBranding.ts:36:export function decodeLogoBase64(logo: LogoPayload) {
server/workspaceBranding.ts:48:export function isRecognizedLogo(bytes: Buffer, mimeType: string) {
server/workspaceBranding.ts:57:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Workspace branding is not configured." });
server/workspaceBranding.ts:58:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/companies?id=eq.${encodeURIComponent(companyId)}`, {
server/workspaceBranding.ts:61:      apikey: ENV.supabaseAnonKey,
server/workspaceBranding.ts:73:export async function saveWorkspaceBranding(req: CreateExpressContextOptions["req"], input: BrandingInput) {
server/workforceRoleAssignmentApprovalMigration.test.ts:5:const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260824_058_workforce_role_assignment_approval.sql"), "utf8");
server/workforceRoleAssignmentApprovalMigration.test.ts:6:const authorizationMigration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260824_057_workforce_authorization.sql"), "utf8");
server/workforceAuthorizationMigration.test.ts:5:const migration = readFileSync(resolve(process.cwd(), "supabase/migrations/20260824_057_workforce_authorization.sql"), "utf8");
server/workforceAuthorizationMigration.test.ts:71:    expect(router).toContain("snapshot: protectedProcedure.query");
server/whatsappProvider.ts:52:export function getBirdWhatsAppProviderReadiness(environment: BirdEnvironment = process.env as BirdEnvironment): {
server/whatsappProvider.ts:92:export function requireBirdWhatsAppOutboundProvider(environment: BirdEnvironment = process.env as BirdEnvironment) {
server/whatsappProvider.ts:108:export function assertBirdWhatsAppStatusTransition(from: BirdWhatsAppOutboundStatus, to: BirdWhatsAppOutboundStatus) {
server/webhooks.ts:27:export function getWebhookConfig() {
server/webhooks.ts:31:export function updateWebhookConfig(config: { url: string; enabled: boolean; secret?: string }) {
server/webhooks.ts:40:export function getDeadLetterQueue() {
server/webhooks.ts:44:export function getWebhookDeliveryHistory() {
server/webhooks.ts:81:export async function listWebhookDeliveryHistory() {
server/webhooks.ts:133:export async function dispatchTenantWebhookEvent(config: { url: string; enabled: boolean; secret?: string }, event: WebhookEvent) {
server/webhooks.ts:150:export async function dispatchWebhookEvent(event: WebhookEvent) {
server/webhooks.ts:176:export async function testWebhookPing() {
server/webhooks.ts:194:export async function retryWebhookDelivery(deliveryId: string) {
server/verifySupabaseSchema.mjs:32:const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
server/verifySupabaseSchema.mjs:43:if (!supabaseUrl || !serviceKey) {
server/verifySupabaseSchema.mjs:56:      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
server/transactionalEmail.ts:23:export function isTransactionalEmailDeliveryEnabled() {
server/transactionalEmail.ts:27:export function assertTransactionalEmailDeliveryEnabled() {
server/transactionalEmail.ts:37:export function parseEmailRecipients(value: string | undefined, label: string, max = 20) {
server/transactionalEmail.ts:49:export function workspaceEmailHtml({ title, preheader, body }: { title: string; preheader: string; body: string }) {
server/transactionalEmail.ts:56:export async function sendTransactionalEmail(input: SendInput): Promise<{ deliveryId: string; acceptedAt: string }> {
server/transactionalEmail.ts:100:export async function sendWorkspaceEmail(req: CreateExpressContextOptions["req"], input: { to: string; cc?: string; bcc?: string; subject: string; body: string }) {
server/traZReportArchive.ts:35:export function getSessionToken(req: { headers: { cookie?: string; authorization?: string } }): string {
server/traZReportArchive.ts:42:export function previousUtcBusinessDate(now = new Date()): string {
server/traZReportArchive.ts:47:export function assertBusinessDate(value: string): void {
server/traZReportArchive.ts:74:export async function buildTraArchiveSummary(companyId: string, branchId: string, businessDate: string): Promise<TraArchiveSummary> {
server/traZReportArchive.ts:130:export async function archiveTraZReport(companyId: string, branchId: string, businessDate: string): Promise<TraZReportArchive> {
server/traZReportArchive.ts:229:export async function getTraArchiveSchedule(companyId: string, branchId: string) {
server/traZReportArchive.ts:238:export async function listTraArchives(companyId: string, limit = 30) {
server/traZReportArchive.ts:246:export async function createOrActivateTraArchiveSchedule(owner: { id: number; openId: string }, sessionToken: string, input: TraArchiveScheduleInput) {
server/traZReportArchive.ts:292:export async function updateTraArchiveSchedule(ownerOpenId: string, sessionToken: string, scheduleId: number, isActive: boolean) {
server/traZReportArchive.ts:306:export async function deleteTraArchiveSchedule(ownerOpenId: string, sessionToken: string, scheduleId: number) {
server/traZReportArchive.ts:319:export async function runScheduledTraZReportArchive(taskUid: string) {
server/traZReportArchive.ts:337:export async function getTraArchiveScheduleByTaskUid(taskUid: string): Promise<TraZReportArchiveSchedule | undefined> {
server/traVatAnomaly.ts:35:export function validateVatAnomalySettings(input: Pick<VatAnomalySettingsInput, "thresholdPercent" | "cooldownMinutes">) {
server/traVatAnomaly.ts:44:export function calculateVatVariance(currentVat: number, historicalAverageVat: number) {
server/traVatAnomaly.ts:64:export function previousCompleteMonth(reference = new Date()) {
server/traVatAnomaly.ts:93:export async function getVatAnomalySettings(companyId: string): Promise<TraVatAnomalySettings> {
server/traVatAnomaly.ts:103:export async function evaluateVatAnomaly(companyId: string, settings: TraVatAnomalySettings, period = previousCompleteMonth(), branchId?: string): Promise<VatAnomalyEvaluation> {
server/traVatAnomaly.ts:131:export async function saveVatAnomalySettings(owner: { openId: string }, sessionToken: string, input: VatAnomalySettingsInput) {
server/traVatAnomaly.ts:151:export async function listVatAnomalyEvents(companyId: string, limit = 30) {
server/traVatAnomaly.ts:171:export function buildVatTrendPoints(endPeriod: string, requestedPeriods = 12, receiptRows: VatTrendReceiptRow[] = [], anomalyRows: VatTrendAnomalyRow[] = []): VatTrendPoint[] {
server/traVatAnomaly.ts:196:export async function getVatTrendSummary(companyId: string, requestedPeriods = 12): Promise<VatTrendPoint[]> {
server/traVatAnomaly.ts:229:export async function runScheduledVatAnomalyCheck(taskUid: string) {
server/traGatewayAlerts.ts:30:export async function getGatewayAlertSettings(companyId: string): Promise<TraGatewayAlertSettings> {
server/traGatewayAlerts.ts:40:export async function saveGatewayAlertSettings(input: GatewayAlertSettingsInput) {
server/traGatewayAlerts.ts:54:export async function listGatewayAlertEvents(companyId: string, limit = 30) {
server/traGatewayAlerts.ts:66:export async function evaluateAndDispatchGatewayTimeoutAlert(companyId: string, branchId: string, snapshot: GatewayConnectionSnapshot) {
server/traFiscalRouter.ts:5:import { router, protectedProcedure } from "./_core/trpc";
server/traFiscalRouter.ts:22:  getProfile: protectedProcedure
server/traFiscalRouter.ts:35:  saveProfile: protectedProcedure
server/traFiscalRouter.ts:120:  listReceipts: protectedProcedure
server/traFiscalRouter.ts:141:  submitTransaction: protectedProcedure
server/traFiscalRouter.ts:239:  getConnectionStatus: protectedProcedure
server/traFiscalRouter.ts:269:  listDocumentEvidence: protectedProcedure
server/traFiscalRouter.ts:280:  getOperationsSummary: protectedProcedure
server/traFiscalRouter.ts:321:  getVatTrendSummary: protectedProcedure
server/traFiscalRouter.ts:329:  getVatAnomalySettings: protectedProcedure
server/traFiscalRouter.ts:337:  saveVatAnomalySettings: protectedProcedure
server/traFiscalRouter.ts:349:  listVatAnomalyEvents: protectedProcedure
server/traFiscalRouter.ts:357:  evaluateVatAnomaly: protectedProcedure
server/traFiscal.ts:211:export function getFiscalProvider(environment: "sandbox" | "production"): FiscalProviderAdapter {
server/traFiscal.ts:215:export function getFiscalProviderReadiness(environment: "sandbox" | "production"): FiscalProviderReadiness {
server/traBranchSummary.ts:31:export async function getBranchTaxLiabilitySummary(companyId: string, startDate: string, endDate: string): Promise<{ companyId: string; startDate: string; endDate: string; branches: TraBranchTaxSummary[]; totals: Omit<TraBranchTaxSummary, "branchId" | "businessName" | "region"> }> {
server/teamWorkforceSlice.test.ts:19:    expect(router).toContain("snapshot: protectedProcedure.query(({ ctx }) => getTeamWorkforceSnapshot(ctx.req))");
server/teamWorkforce.ts:46:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
server/teamWorkforce.ts:49:  return { url: ENV.supabaseUrl.replace(/\/$/, ""), anonKey: ENV.supabaseAnonKey };
server/teamWorkforce.ts:52:async function supabaseGet<T>(path: string, token: string): Promise<T[]> {
server/teamWorkforce.ts:88:export async function getTeamWorkforceSnapshot(req: CreateExpressContextOptions["req"]) {
server/teamWorkforce.ts:98:    supabaseGet<WorkforceEmployee>(`hr_employees?select=id,profile_id,name,status,amount,notes,data,created_at,updated_at,department_id,position_id,manager_employee_id,employee_number,employment_start_date,employment_end_date,timezone&${companyFilter}&order=created_at.desc&limit=500`, token),
server/teamWorkforce.ts:99:    supabaseGet<WorkforceDepartment>(`departments?select=id,name,status&${companyFilter}&order=name.asc&limit=200`, token),
server/teamWorkforce.ts:100:    supabaseGet<WorkforcePosition>(`hr_positions?select=id,title,department_id,status&${companyFilter}&order=title.asc&limit=200`, token),
server/teamWorkforce.ts:101:    supabaseGet<JsonRecord>(`hr_onboarding_cases?select=id,employee_id,status,start_date,due_date&${companyFilter}&order=created_at.desc&limit=500`, token),
server/teamInvitations.ts:40:export function hashInvitationToken(token: string) {
server/teamInvitations.ts:44:export function newInvitationToken() {
server/teamInvitations.ts:48:export function isInvitationExpired(expiresAt: Date | string, now = Date.now()) {
server/teamInvitations.ts:52:export function invitationOrigin(req: CreateExpressContextOptions["req"]) {
server/teamInvitations.ts:75:  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
server/teamInvitations.ts:78:  return { url: ENV.supabaseUrl.replace(/\/$/, ""), key: ENV.supabaseSecretKey };
server/teamInvitations.ts:81:async function supabaseServiceRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
server/teamInvitations.ts:123:  const rows = await supabaseServiceRequest<TeamInvitation[]>(`${INVITATION_TABLE}?id=eq.${encodeURIComponent(id)}`, {
server/teamInvitations.ts:169:export async function createTeamInvitation(req: CreateExpressContextOptions["req"], input: InviteInput) {
server/teamInvitations.ts:175:  const rows = await supabaseServiceRequest<TeamInvitation[]>(INVITATION_TABLE, {
server/teamInvitations.ts:198:export async function listTeamInvitations(req: CreateExpressContextOptions["req"]) {
server/teamInvitations.ts:201:  const rows = (await supabaseServiceRequest<TeamInvitation[]>(`${INVITATION_TABLE}?select=${invitationSelect()}&company_id=eq.${encodeURIComponent(profile.company_id)}&order=created_at.desc&limit=500`)).map(asInvitation);
server/teamInvitations.ts:208:  const rows = await supabaseServiceRequest<TeamInvitation[]>(`${INVITATION_TABLE}?select=${invitationSelect()}&invitation_id=eq.${encodeURIComponent(invitationId)}&company_id=eq.${encodeURIComponent(companyId)}&limit=1`);
server/teamInvitations.ts:214:export async function resendTeamInvitation(req: CreateExpressContextOptions["req"], invitationId: string) {
server/teamInvitations.ts:227:export async function revokeTeamInvitation(req: CreateExpressContextOptions["req"], invitationId: string) {
server/teamInvitations.ts:237:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Supabase verification is not configured." });
server/teamInvitations.ts:238:  const response = await fetch(`${ENV.supabaseUrl}/auth/v1/user`, { headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}` } });
server/teamInvitations.ts:257:export async function acceptTeamInvitation(req: CreateExpressContextOptions["req"], tokenValue: string) {
server/teamInvitations.ts:260:  const rows = await supabaseServiceRequest<TeamInvitation[]>(`${INVITATION_TABLE}?select=${invitationSelect()}&token_hash=eq.${encodeURIComponent(hashInvitationToken(tokenValue))}&limit=1`);
server/tanzaniaPayrollContracts.test.ts:5:const engine = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260822_015_tanzania_payroll_calculation_engine.sql"), "utf8");
server/tanzaniaPayrollContracts.test.ts:6:const readinessFix = fs.readFileSync(path.resolve(process.cwd(), "supabase/migrations/20260822_016_payroll_configuration_status_fix.sql"), "utf8");
server/supportPolicyAuthenticatedRoles.test.ts:6:  path.resolve(process.cwd(), "supabase/migrations/20260817_012_support_policy_authenticated_roles.sql"),
server/supportOperations.ts:61:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) {
server/supportOperations.ts:64:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/${path}`, {
server/supportOperations.ts:67:      apikey: ENV.supabaseAnonKey,
server/supportOperations.ts:203:export async function listSupportTickets(req: CreateExpressContextOptions["req"]) {
server/supportOperations.ts:210:export async function searchSupportTickets(req: CreateExpressContextOptions["req"], query: string) {
server/supportOperations.ts:234:export async function draftSupportTicketReply(req: CreateExpressContextOptions["req"], input: { ticketId: string; tone: "professional" | "empathetic" | "concise" }) {
server/supportOperations.ts:272:export async function listSupportWorkflowPolicies(req: CreateExpressContextOptions["req"]) {
server/supportOperations.ts:279:export async function saveSupportWorkflowPolicy(req: CreateExpressContextOptions["req"], input: { workflowId?: string; name: string; trigger: string; condition?: Record<string, unknown> | null; actions: SupportWorkflowActionInput[]; enabled: boolean }) {
server/supportOperations.ts:298:export async function listSupportSlaPolicies(req: CreateExpressContextOptions["req"]) {
server/supportOperations.ts:305:export async function saveSupportSlaPolicy(req: CreateExpressContextOptions["req"], input: { policyId?: string; name: string; priority: string; firstResponseMinutes: number; resolutionMinutes: number; warningMinutes?: number | null; isActive: boolean }) {
server/supportOperations.ts:324:export async function getSupportWhatsAppProviderReadiness(req: CreateExpressContextOptions["req"]) {
server/supportOperations.ts:330:export async function testSupportWhatsAppProviderConfig(req: CreateExpressContextOptions["req"], input: { apiKey?: string; signingSecret?: string; workspaceId?: string; channelId?: string; deliveryEnabled?: boolean }) {
server/supportOperations.ts:343:export async function createSupportTicket(req: CreateExpressContextOptions["req"], input: { subject: string; customer: string; category?: string; priority?: string; sourceChannel?: string; customerReference?: string; initialMessage?: string; teamId?: string; dueAt?: string }) {
server/supportOperations.ts:374:export async function updateSupportTicket(req: CreateExpressContextOptions["req"], input: { ticketId: string; status?: string; priority?: string; assignedProfileId?: string | null; teamId?: string | null; dueAt?: string | null }) {
server/supportOperations.ts:406:export async function addSupportInternalNote(req: CreateExpressContextOptions["req"], input: { ticketId: string; body: string }) {
server/supportOperations.ts:421:export async function listSupportTicketTimeline(req: CreateExpressContextOptions["req"], ticketId: string) {
server/supabaseSecurityHardening.test.ts:5:  new URL("../supabase/migrations/20260823_046_security_hardening_search_paths_and_pin_rls.sql", import.meta.url),
server/supabasePolicyHelperGrants.test.ts:5:  new URL("../supabase/migrations/20260823_047_rls_policy_helper_execute_grants.sql", import.meta.url),
server/supabasePersistence.ts:2:import { assertPayloadContract } from "./schemaDriftChecker";
server/supabasePersistence.ts:19:export async function persistSupabaseRow(
server/supabasePersistence.ts:26:  assertPayloadContract(tableName, payload);
server/supabasePersistence.ts:28:  const url = (options.url ?? ENV.supabaseUrl).replace(/\/$/, "");
server/supabasePersistence.ts:29:  const secretKey = options.secretKey ?? ENV.supabaseSecretKey;
server/supabase.schemaContract.test.ts:7:const baselineMigration = readFileSync(new URL("../supabase/migrations/20260812_001_complete_erp_schema_baseline.sql", import.meta.url), "utf8");
server/supabase.schemaContract.test.ts:8:const tenantBootstrapMigration = readFileSync(new URL("../supabase/migrations/20260814_002_guarded_first_tenant_bootstrap.sql", import.meta.url), "utf8");
server/supabase.config.test.ts:10:    expect(url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/);
server/supabase.authRls.test.ts:3:const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
server/supabase.authRls.test.ts:7:const runLiveJwtChecks = Boolean(supabaseUrl && publishableKey && tenantAToken && tenantBToken);
server/supabase.authRls.test.ts:16:  const response = await fetch(`${supabaseUrl}/rest/v1/${path}`, {
server/supabase.authRls.test.ts:51:    expect(runLiveJwtChecks).toBe(Boolean(supabaseUrl && publishableKey && tenantAToken && tenantBToken));
server/subscriptionUserManagementMigrationContracts.test.ts:7:  path.join(root, "supabase/migrations/20260824_067_subscription_user_management_compatibility.sql"),
server/subscriptionUserManagementCompatibility.test.ts:7:  "supabase/migrations/20260824_067_subscription_user_management_compatibility.sql",
server/subscriptionBillingContracts.test.ts:8:const migration = read("supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql");
server/subscriptionBillingContracts.test.ts:13:const hardening = read("supabase/migrations/20260822_025_subscription_billing_function_execute_hardening.sql");
server/subscriptionBillingContracts.test.ts:14:const helperHardening = read("supabase/migrations/20260822_026_subscription_billing_helper_execute_hardening.sql");
server/subscriptionBillingContracts.test.ts:15:const trialCatalog = read("supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql");
server/subscriptionBillingContracts.test.ts:16:const trialHardening = read("supabase/migrations/20260822_029_subscription_trial_function_execute_hardening.sql");
server/subscriptionBillingContracts.test.ts:17:const planAdminControls = read("supabase/migrations/20260822_030_subscription_plan_admin_controls.sql");
server/subscriptionBillingContracts.test.ts:18:const billingSnapshotAliasFix = read("supabase/migrations/20260823_062_fix_billing_snapshot_event_alias.sql");
server/subscriptionBillingApi.test.ts:5:    supabaseUrl: "https://supabase.test",
server/subscriptionBillingApi.test.ts:6:    supabaseAnonKey: "anon-test",
server/subscriptionBillingApi.test.ts:7:    supabaseSecretKey: "service-test",
server/subscriptionBilling.ts:82:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new Error("Billing workspace verification is not configured.");
server/subscriptionBilling.ts:83:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
server/subscriptionBilling.ts:86:      apikey: ENV.supabaseAnonKey,
server/subscriptionBilling.ts:102:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new Error("Billing catalog is not configured.");
server/subscriptionBilling.ts:103:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
server/subscriptionBilling.ts:105:    headers: { apikey: ENV.supabaseAnonKey, "content-type": "application/json" },
server/subscriptionBilling.ts:114:  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Billing server verification is not configured.");
server/subscriptionBilling.ts:115:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/${functionName}`, {
server/subscriptionBilling.ts:118:      apikey: ENV.supabaseSecretKey,
server/subscriptionBilling.ts:119:      authorization: `Bearer ${ENV.supabaseSecretKey}`,
server/subscriptionBilling.ts:130:  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) throw new Error("Billing server verification is not configured.");
server/subscriptionBilling.ts:131:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/subscription_payments?select=id,provider_order_id,status&provider=eq.HarakaPay&provider_order_id=eq.${encodeURIComponent(orderId)}&limit=1`, {
server/subscriptionBilling.ts:132:    headers: { apikey: ENV.supabaseSecretKey, authorization: `Bearer ${ENV.supabaseSecretKey}` },
server/subscriptionBilling.ts:190:export async function subscriptionBillingCatalogHandler(_req: Request, res: Response) {
server/subscriptionBilling.ts:198:export async function subscriptionBillingAccessHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:207:export async function subscriptionBillingSnapshotHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:220:export async function trialExpiryNoticeClaimHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:229:export async function trialExpiryNoticeAcknowledgeHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:241:export async function trialExpiryNoticeAdminSnapshotHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:258:export async function trialExpiryNoticeAdminResetHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:279:export async function subscriptionBillingStartTrialHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:283:export async function subscriptionBillingStartFreePlanHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:294:export async function subscriptionBillingProfileHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:305:export async function subscriptionBillingPlanHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:316:export async function harakaPayCollectHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:394:export async function harakaPayStatusHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:415:export async function harakaPayWebhookHandler(req: Request, res: Response) {
server/subscriptionBilling.ts:435:export async function harakaPayBalanceHandler(req: Request, res: Response) {
server/subscriptionActivationContracts.test.ts:8:const migration = read("supabase/migrations/20260824_061_subscription_activation_flow_repair.sql");
server/subscriptionActivationContracts.test.ts:9:const billingAliasRepair = read("supabase/migrations/20260825_016_fix_billing_snapshot_event_alias.sql");
server/subscriptionActivationContracts.test.ts:10:const trialExpiryMigration = read("supabase/migrations/20260824_064_trial_expiry_notice_once.sql");
server/subscriptionAccessContracts.test.ts:8:const migration = read("supabase/migrations/20260823_062_subscription_free_plan_model.sql");
server/subscriptionAccessContracts.test.ts:32:    expect(service).toContain("export async function subscriptionBillingAccessHandler");
server/storage.ts:31:export async function storagePut(
server/storage.ts:74:export async function storageGet(relKey: string): Promise<{ key: string; url: string }> {
server/storage.ts:79:export async function storageGetSignedUrl(relKey: string): Promise<string> {
server/smartAssistant.ts:172:export async function runSmartAssistant(input: SmartAssistantInput): Promise<SmartAssistantResponse> {
server/settingsBackendContracts.test.ts:32:    expect(settingsServiceSource).toContain("ENV.supabaseSecretKey");
server/sensitiveRpcExecuteHardening.test.ts:5:  new URL("../supabase/migrations/20260823_049_sensitive_rpc_execute_hardening.sql", import.meta.url),
server/schoolOperations.ts:49:export function schoolAccessForRole(role: string) {
server/schoolOperations.ts:69:function endpoint(table: SchoolTable, query = new URLSearchParams()) { return `${ENV.supabaseUrl.replace(/\/$/, "")}/rest/v1/${table}?${query.toString()}`; }
server/schoolOperations.ts:71:  if (!ENV.supabaseUrl || !ENV.supabaseAnonKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "School data services are not configured." });
server/schoolOperations.ts:72:  const response = await fetch(endpoint(table, query), { ...init, headers: { apikey: ENV.supabaseAnonKey, authorization: `Bearer ${token}`, "content-type": "application/json", ...(init.headers || {}) } });
server/schoolOperations.ts:163:export async function getSchoolAccess(req: CreateExpressContextOptions["req"]) { const { profile } = await resolveVerifiedProfile(req); return schoolAccessForRole(profile.role); }
server/schoolOperations.ts:164:export async function listSchoolRecords(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolListInput>) { const { profile, token } = await context(req, recordAction(input.table)); return { access: schoolAccessForRole(profile.role), records: searchable(await rows(input.table, token, profile.company_id, input.limit), input.search) }; }
server/schoolOperations.ts:165:export async function archiveSchoolRecord(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolArchiveInput>) { const { profile, token } = await context(req, recordAction(input.table)); const record = await row(input.table, token, profile.company_id, input.id); if (["sch_students", "sch_teachers"].includes(input.table) && record.status === "Active") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Deactivate this active school profile through its authorised workflow before archiving it." }); const archived = await update(input.table, token, profile.company_id, input.id, { status: "Archived", data: { archivedAt: now(), archiveReason: input.reason || "Archived by authorised school user" } }); await audit(token, profile.company_id, profile, "School record archived", input.table, archived.id, input.reason); return archived; }
server/schoolOperations.ts:168:export async function createSchoolAcademicYear(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAcademicYearInput>) { if (input.endDate <= input.startDate) throw new TRPCError({ code: "BAD_REQUEST", message: "Academic year end date must be after its start date." }); const created = await createConfiguredRecord(req, "config", "sch_academic_years", input.name, input, input.notes, null, input.active ? "Active" : "Draft"); if (input.active) { const { profile, token } = await context(req, "config"); for (const record of (await rows("sch_academic_years", token, profile.company_id)).filter((record) => record.id !== created.id && record.status === "Active")) await update("sch_academic_years", token, profile.company_id, record.id, { status: "Closed", data: { closedAt: now(), closedByActivation: created.id } }); } return created; }
server/schoolOperations.ts:169:export async function createSchoolTerm(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolTermInput>) { if (input.endDate <= input.startDate) throw new TRPCError({ code: "BAD_REQUEST", message: "Term end date must be after its start date." }); const { profile, token } = await context(req, "config"); const year = await row("sch_academic_years", token, profile.company_id, input.academicYearId); if (year.status === "Archived") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "An archived academic year cannot receive a term." }); return createConfiguredRecord(req, "config", "sch_terms", input.name, input, input.notes, null, input.active ? "Active" : "Draft"); }
server/schoolOperations.ts:170:export async function createSchoolDepartment(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolDepartmentInput>) { return createConfiguredRecord(req, "config", "sch_departments", input.name, input, input.notes); }
server/schoolOperations.ts:171:export async function createSchoolSubject(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolSubjectInput>) { const { profile, token } = await context(req, "config"); if (input.departmentId) await row("sch_departments", token, profile.company_id, input.departmentId); return createConfiguredRecord(req, "config", "sch_subjects", input.name, input, input.notes); }
server/schoolOperations.ts:172:export async function createSchoolClass(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolClassInput>) { const { profile, token } = await context(req, "config"); await row("sch_academic_years", token, profile.company_id, input.academicYearId); if (input.classTeacherId) await row("sch_teachers", token, profile.company_id, input.classTeacherId); return createConfiguredRecord(req, "config", "sch_classes", input.name, input, input.notes); }
server/schoolOperations.ts:173:export async function createSchoolStream(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolStreamInput>) { const { profile, token } = await context(req, "config"); await row("sch_classes", token, profile.company_id, input.classId); if (input.classTeacherId) await row("sch_teachers", token, profile.company_id, input.classTeacherId); return createConfiguredRecord(req, "config", "sch_streams", input.name, input, input.notes); }
server/schoolOperations.ts:174:export async function createSchoolGradingScale(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolGradingScaleInput>) { const sorted = [...input.bands].sort((a, b) => a.min - b.min); if (sorted.some((band) => band.min > band.max) || sorted.some((band, index) => index && band.min <= sorted[index - 1].max)) throw new TRPCError({ code: "BAD_REQUEST", message: "Grade bands must be non-overlapping ranges with valid minimum and maximum scores." }); return createConfiguredRecord(req, "config", "sch_grading_scales", input.name, { ...input, bands: sorted }, input.notes, null, input.active ? "Active" : "Draft"); }
server/schoolOperations.ts:176:export async function createSchoolTeacher(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolTeacherInput>) { const { profile, token } = await context(req, "academic"); if (input.departmentId) await row("sch_departments", token, profile.company_id, input.departmentId); return createConfiguredRecord(req, "academic", "sch_teachers", input.name, input, input.notes); }
server/schoolOperations.ts:177:export async function createSchoolAdmission(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAdmissionInput>) { const { profile, token } = await context(req, "admissions"); await Promise.all([row("sch_academic_years", token, profile.company_id, input.academicYearId), row("sch_classes", token, profile.company_id, input.classId), ...(input.streamId ? [row("sch_streams", token, profile.company_id, input.streamId)] : [])]); const admissionNo = `APP-${new Date().getUTCFullYear()}-${Date.now().toString().slice(-8)}`; const admission = await insert("sch_admissions", token, profile.company_id, { name: input.studentName, status: "Submitted", notes: input.notes || null, data: { ...input, admissionNo, submittedAt: now() } }); await audit(token, profile.company_id, profile, "Student admission submitted", "sch_admissions", admission.id); return admission; }
server/schoolOperations.ts:178:export async function decideSchoolAdmission(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAdmissionDecisionInput>) { const { profile, token } = await context(req, "admissions"); const admission = await row("sch_admissions", token, profile.company_id, input.admissionId); if (admission.status !== "Submitted" && admission.status !== "Waitlisted") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only submitted or waitlisted admissions may be decided." }); if (input.decision !== "Approved") { const decided = await update("sch_admissions", token, profile.company_id, admission.id, { status: input.decision, data: { decidedAt: now(), decidedBy: profile.id, decisionNotes: input.decisionNotes } }); await audit(token, profile.company_id, profile, `Admission ${input.decision.toLowerCase()}`, "sch_admissions", decided.id, input.decisionNotes); return { admission: decided, student: null, enrollment: null }; }
server/schoolOperations.ts:189:export async function createSchoolTeacherAssignment(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolTeacherAssignmentInput>) { const { profile, token } = await context(req, "academic"); const [teacher, schoolClass, subject, term] = await Promise.all([row("sch_teachers", token, profile.company_id, input.teacherId), row("sch_classes", token, profile.company_id, input.classId), row("sch_subjects", token, profile.company_id, input.subjectId), row("sch_terms", token, profile.company_id, input.termId)]); const assignment = await insert("sch_teacher_assignments", token, profile.company_id, { name: `${teacher.name} · ${subject.name} · ${schoolClass.name}`, status: "Active", notes: input.notes || null, data: { ...input, teacherName: teacher.name, className: schoolClass.name, subjectName: subject.name, termName: term.name, assignedAt: now() } }); await audit(token, profile.company_id, profile, "Teacher assignment created", "sch_teacher_assignments", assignment.id); return assignment; }
server/schoolOperations.ts:190:export async function createSchoolTimetable(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolTimetableInput>) { const { profile, token } = await context(req, "academic"); if (input.endsAt <= input.startsAt) throw new TRPCError({ code: "BAD_REQUEST", message: "A timetable period must end after it starts." }); const assignment = await row("sch_teacher_assignments", token, profile.company_id, input.teacherAssignmentId); if (assignment.classId !== input.classId || assignment.subjectId !== input.subjectId || assignment.termId !== input.termId) throw new TRPCError({ code: "FORBIDDEN", message: "The selected teacher assignment does not match this class, subject, and term." }); const conflicts = (await rows("sch_timetables", token, profile.company_id, 1_000)).filter((record) => record.status === "Scheduled" && record.termId === input.termId && record.weekday === input.weekday && record.classId === input.classId && input.startsAt < String(record.endsAt) && input.endsAt > String(record.startsAt)); if (conflicts.length) throw new TRPCError({ code: "CONFLICT", message: "This class already has a timetable period that overlaps the requested time." }); const timetable = await insert("sch_timetables", token, profile.company_id, { name: `${input.weekday} · ${assignment.className} · ${assignment.subjectName}`, status: "Scheduled", data: { ...input, teacherId: assignment.teacherId, createdAt: now() } }); await audit(token, profile.company_id, profile, "Timetable period scheduled", "sch_timetables", timetable.id); return timetable; }
server/schoolOperations.ts:191:export async function openSchoolAttendanceSession(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAttendanceSessionInput>) { const { profile, token, access } = await context(req, "teaching"); const schoolClass = await row("sch_classes", token, profile.company_id, input.classId); await row("sch_terms", token, profile.company_id, input.termId); if (!access.canManageAcademic && !isSchoolAdministrator(profile.role)) { const assignments = (await rows("sch_teacher_assignments", token, profile.company_id, 1_000)).filter((record) => record.classId === input.classId && record.termId === input.termId && record.status === "Active"); const allowed = await Promise.all(assignments.map((assignment) => mayOperateTeacherAssignment(profile, token, profile.company_id, assignment))); if (!allowed.some(Boolean)) throw new TRPCError({ code: "FORBIDDEN", message: "Teachers may only open attendance for a class to which they are assigned." }); }
server/schoolOperations.ts:193:export async function recordSchoolAttendance(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAttendanceInput>) { const { profile, token, access } = await context(req, "teaching"); const session = await row("sch_attendance_sessions", token, profile.company_id, input.sessionId); if (session.status === "Finalized") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A finalized attendance session cannot be overwritten." }); if (!access.canManageAcademic && !isSchoolAdministrator(profile.role)) { const assignments = (await rows("sch_teacher_assignments", token, profile.company_id, 1_000)).filter((record) => record.classId === session.classId && record.termId === session.termId && record.status === "Active"); const allowed = await Promise.all(assignments.map((assignment) => mayOperateTeacherAssignment(profile, token, profile.company_id, assignment))); if (!allowed.some(Boolean)) throw new TRPCError({ code: "FORBIDDEN", message: "Teachers may only record attendance for a class to which they are assigned." }); } const enrolled = new Set((await rows("sch_enrollments", token, profile.company_id, 2_000)).filter((record) => record.classId === session.classId && record.status === "Active").map((record) => record.studentId)); if (input.records.some((record) => !enrolled.has(record.studentId))) throw new TRPCError({ code: "FORBIDDEN", message: "Attendance records must belong to active learners in the selected class." }); const existing = await rows("sch_attendance_records", token, profile.company_id, 2_000); for (const record of input.records) { const prior = existing.find((item) => item.sessionId === session.id && item.studentId === record.studentId); if (prior) await update("sch_attendance_records", token, profile.company_id, prior.id, { status: record.status, notes: record.reason || null, data: { recordedBy: profile.id, correctedAt: now(), correctionReason: record.reason || "" } }); else await insert("sch_attendance_records", token, profile.company_id, { name: `${session.name} · ${record.studentId}`, status: record.status, notes: record.reason || null, data: { sessionId: session.id, studentId: record.studentId, recordedBy: profile.id, recordedAt: now() } }); }
server/schoolOperations.ts:197:export async function createSchoolAssessment(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAssessmentInput>) { const { profile, token } = await context(req, "teaching"); const assignment = await row("sch_teacher_assignments", token, profile.company_id, input.teacherAssignmentId); if (assignment.classId !== input.classId || assignment.subjectId !== input.subjectId || assignment.termId !== input.termId || !(await mayOperateTeacherAssignment(profile, token, profile.company_id, assignment))) throw new TRPCError({ code: "FORBIDDEN", message: "The selected teacher assignment does not match your authorised assessment scope." }); const assessment = await insert("sch_assessments", token, profile.company_id, { name: input.name, status: "Draft", amount: input.maxScore, notes: input.notes || null, data: { ...input, createdBy: profile.id, createdAt: now() } }); await audit(token, profile.company_id, profile, "Assessment created", "sch_assessments", assessment.id); return assessment; }
server/schoolOperations.ts:198:export async function recordSchoolAssessmentScores(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolScoreInput>) { const { profile, token } = await context(req, "teaching"); const assessment = await row("sch_assessments", token, profile.company_id, input.assessmentId); const assignment = await row("sch_teacher_assignments", token, profile.company_id, String(assessment.teacherAssignmentId)); if (!(await mayOperateTeacherAssignment(profile, token, profile.company_id, assignment))) throw new TRPCError({ code: "FORBIDDEN", message: "Only the assigned teacher or academic administrator may record these assessment scores." }); if (input.scores.some((line) => line.score > decimal(assessment.maxScore))) throw new TRPCError({ code: "BAD_REQUEST", message: "An assessment score cannot exceed the assessment maximum score." }); const enrolled = new Set((await rows("sch_enrollments", token, profile.company_id, 2_000)).filter((record) => record.classId === assessment.classId && record.status === "Active").map((record) => record.studentId)); if (input.scores.some((line) => !enrolled.has(line.studentId))) throw new TRPCError({ code: "FORBIDDEN", message: "Scores may only be entered for learners enrolled in the assessment class." }); const existing = await rows("sch_assessment_scores", token, profile.company_id, 2_000); for (const line of input.scores) { const prior = existing.find((record) => record.assessmentId === assessment.id && record.studentId === line.studentId); const data = { assessmentId: assessment.id, studentId: line.studentId, score: line.score, percentage: (line.score / decimal(assessment.maxScore)) * 100, remarks: line.remarks, enteredBy: profile.id, enteredAt: now() }; if (prior) await update("sch_assessment_scores", token, profile.company_id, prior.id, { amount: line.score, notes: line.remarks || null, data }); else await insert("sch_assessment_scores", token, profile.company_id, { name: `${assessment.name} · ${line.studentId}`, status: "Recorded", amount: line.score, notes: line.remarks || null, data }); }
server/schoolOperations.ts:200:export async function publishSchoolReportCard(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolReportCardInput>) { const { profile, token } = await context(req, "academic"); const [student, term, scale] = await Promise.all([row("sch_students", token, profile.company_id, input.studentId), row("sch_terms", token, profile.company_id, input.termId), row("sch_grading_scales", token, profile.company_id, input.gradingScaleId)]); if (scale.status !== "Active") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "A report card requires an active grading scale." }); const enrollment = (await rows("sch_enrollments", token, profile.company_id, 2_000)).find((record) => record.studentId === student.id && record.status === "Active"); if (!enrollment) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "An active enrollment is required before generating a report card." }); const assessments = (await rows("sch_assessments", token, profile.company_id, 2_000)).filter((record) => record.termId === term.id && record.classId === enrollment.classId && /scores recorded|published/i.test(record.status)); const allScores = await rows("sch_assessment_scores", token, profile.company_id, 5_000); const bands = Array.isArray(scale.bands) ? scale.bands : []; const results = assessments.map((assessment) => { const score = allScores.find((record) => record.assessmentId === assessment.id && record.studentId === student.id); return score ? { assessmentId: assessment.id, assessmentName: assessment.name, subjectId: assessment.subjectId, score: decimal(score.score), maxScore: decimal(assessment.maxScore), ...gradeFor(decimal(score.score), decimal(assessment.maxScore), bands) } : null; }).filter(Boolean); if (!results.length) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "At least one recorded assessment score is required before a report card can be generated." }); const average = results.reduce((sum, result) => sum + Number(result?.percentage || 0), 0) / results.length; const name = `${student.name} · ${term.name}`; const existing = (await rows("sch_report_cards", token, profile.company_id, 2_000)).find((record) => record.studentId === student.id && record.termId === term.id); const payload = { studentId: student.id, studentName: student.name, termId: term.id, termName: term.name, classId: enrollment.classId, gradingScaleId: scale.id, gradingScaleName: scale.name, results, average, ...gradeFor(average, 100, bands), generatedAt: now(), generatedBy: profile.id, publishedAt: input.publish ? now() : null };
server/schoolOperations.ts:203:export async function createSchoolAssignment(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAssignmentInput>) { const { profile, token } = await context(req, "teaching"); const assignment = await row("sch_teacher_assignments", token, profile.company_id, input.teacherAssignmentId); if (assignment.classId !== input.classId || assignment.subjectId !== input.subjectId || !(await mayOperateTeacherAssignment(profile, token, profile.company_id, assignment))) throw new TRPCError({ code: "FORBIDDEN", message: "The selected teacher assignment does not match your authorised assignment scope." }); const created = await insert("sch_assignments", token, profile.company_id, { name: input.name, status: "Published", amount: input.maximumScore, notes: input.instructions || null, data: { ...input, publishedBy: profile.id, publishedAt: now() } }); await audit(token, profile.company_id, profile, "Assignment published", "sch_assignments", created.id); return created; }
server/schoolOperations.ts:204:export async function submitSchoolAssignment(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAssignmentSubmissionInput>) { const { profile, token } = await context(req, "teaching"); const assignment = await row("sch_assignments", token, profile.company_id, input.assignmentId); const enrolled = (await rows("sch_enrollments", token, profile.company_id, 2_000)).some((record) => record.studentId === input.studentId && record.classId === assignment.classId && record.status === "Active"); if (!enrolled) throw new TRPCError({ code: "FORBIDDEN", message: "The selected learner is not enrolled in the assignment class." }); if (input.documentId) await row("sch_documents", token, profile.company_id, input.documentId); const existing = (await rows("sch_assignment_submissions", token, profile.company_id, 2_000)).find((record) => record.assignmentId === assignment.id && record.studentId === input.studentId); const payload = { assignmentId: assignment.id, studentId: input.studentId, documentId: input.documentId || null, submittedAt: now(), submittedBy: profile.id }; const submitted = existing ? await update("sch_assignment_submissions", token, profile.company_id, existing.id, { status: "Submitted", notes: input.notes || null, data: payload }) : await insert("sch_assignment_submissions", token, profile.company_id, { name: `${assignment.name} · ${input.studentId}`, status: "Submitted", notes: input.notes || null, data: payload }); await audit(token, profile.company_id, profile, "Assignment submission recorded", "sch_assignment_submissions", submitted.id); return submitted; }
server/schoolOperations.ts:206:export async function createSchoolFeeStructure(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolFeeStructureInput>) { const { profile, token } = await context(req, "finance"); await row("sch_terms", token, profile.company_id, input.termId); if (input.classId) await row("sch_classes", token, profile.company_id, input.classId); const fee = await insert("sch_fee_structures", token, profile.company_id, { name: input.name, status: "Active", amount: input.amount, notes: input.notes || null, data: { ...input, currency: "TZS", createdAt: now() } }); await audit(token, profile.company_id, profile, "Fee structure created", "sch_fee_structures", fee.id); return fee; }
server/schoolOperations.ts:207:export async function issueSchoolFeeInvoice(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolInvoiceInput>) { const { profile, token } = await context(req, "finance"); const [student, term] = await Promise.all([row("sch_students", token, profile.company_id, input.studentId), row("sch_terms", token, profile.company_id, input.termId)]); const fees = await Promise.all(input.feeStructureIds.map((id) => row("sch_fee_structures", token, profile.company_id, id))); if (fees.some((fee) => fee.termId !== term.id || fee.status !== "Active")) throw new TRPCError({ code: "BAD_REQUEST", message: "Invoices may only use active fee structures from the selected term." }); const total = fees.reduce((sum, fee) => sum + decimal(fee.amount), 0); const invoiceNo = `SCH-INV-${new Date().getUTCFullYear()}-${Date.now().toString().slice(-7)}`; const invoice = await insert("sch_fee_invoices", token, profile.company_id, { name: invoiceNo, status: "Open", amount: total, notes: input.notes || null, data: { invoiceNo, studentId: student.id, studentName: student.name, termId: term.id, termName: term.name, dueDate: input.dueDate, currency: "TZS", total, paidAmount: 0, balance: total, issuedAt: now() } }); for (const fee of fees) await insert("sch_fee_invoice_lines", token, profile.company_id, { name: `${invoiceNo} · ${fee.name}`, status: "Posted", amount: decimal(fee.amount), data: { invoiceId: invoice.id, feeStructureId: fee.id, feeName: fee.name, amount: decimal(fee.amount) } }); await audit(token, profile.company_id, profile, "Student fee invoice issued", "sch_fee_invoices", invoice.id); return invoice; }
server/schoolOperations.ts:208:export async function recordSchoolPayment(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolPaymentInput>) { const { profile, token } = await context(req, "finance"); const invoice = await row("sch_fee_invoices", token, profile.company_id, input.invoiceId); const paid = decimal(invoice.paidAmount); const balance = Math.max(0, decimal(invoice.balance ?? invoice.amount) || decimal(invoice.amount) - paid); if (input.amount > balance + 0.0001) throw new TRPCError({ code: "BAD_REQUEST", message: "The payment amount exceeds the remaining invoice balance." }); const receiptNo = `SCH-RCT-${Date.now().toString().slice(-8)}`; const payment = await insert("sch_payments", token, profile.company_id, { name: receiptNo, status: "Recorded", amount: input.amount, notes: input.notes || null, data: { receiptNo, invoiceId: invoice.id, invoiceNo: invoice.invoiceNo || invoice.name, studentId: invoice.studentId, method: input.method, reference: input.reference || null, currency: "TZS", paidAt: now(), financeReference: null } }); const nextPaid = paid + input.amount; const nextBalance = Math.max(0, decimal(invoice.amount) - nextPaid); const settled = await update("sch_fee_invoices", token, profile.company_id, invoice.id, { status: nextBalance === 0 ? "Paid" : "Partially paid", data: { paidAmount: nextPaid, balance: nextBalance, lastPaymentId: payment.id, settledAt: nextBalance === 0 ? now() : null } }); await audit(token, profile.company_id, profile, "Student fee payment recorded", "sch_payments", payment.id); return { payment, invoice: settled, balance: nextBalance }; }
server/schoolOperations.ts:209:export async function requestSchoolScholarship(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolScholarshipInput>) { const { profile, token } = await context(req, "finance"); const [student, term] = await Promise.all([row("sch_students", token, profile.company_id, input.studentId), row("sch_terms", token, profile.company_id, input.termId)]); const scholarship = await insert("sch_scholarships", token, profile.company_id, { name: `${student.name} · ${term.name}`, status: "Requested", amount: input.amount, notes: input.reason, data: { ...input, studentName: student.name, termName: term.name, requestedBy: profile.id, requestedAt: now() } }); const approval = await insert("sch_approval_requests", token, profile.company_id, { name: `Scholarship · ${student.name}`, status: "Pending", notes: input.reason, data: { requestType: "Scholarship", recordId: scholarship.id, requestedBy: profile.id, requestedAt: now() } }); await update("sch_scholarships", token, profile.company_id, scholarship.id, { data: { approvalId: approval.id } }); await audit(token, profile.company_id, profile, "Scholarship approval requested", "sch_scholarships", scholarship.id); return scholarship; }
server/schoolOperations.ts:210:export async function decideSchoolScholarship(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolScholarshipDecisionInput>) { const { profile, token } = await context(req, "governance"); const scholarship = await row("sch_scholarships", token, profile.company_id, input.scholarshipId); if (scholarship.status !== "Requested") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only requested scholarships may be decided." }); const approval = (await rows("sch_approval_requests", token, profile.company_id, 2_000)).find((record) => record.recordId === scholarship.id && record.requestType === "Scholarship" && record.status === "Pending"); const decided = await update("sch_scholarships", token, profile.company_id, scholarship.id, { status: input.decision, data: { decidedBy: profile.id, decidedAt: now(), decisionNotes: input.notes } }); if (approval) await update("sch_approval_requests", token, profile.company_id, approval.id, { status: input.decision, notes: input.notes || null, data: { decidedBy: profile.id, decidedAt: now(), decisionNotes: input.notes } }); if (input.decision === "Approved") await notify(token, profile.company_id, "Scholarship approved", "Info", { scholarshipId: scholarship.id, studentId: scholarship.studentId, amount: scholarship.amount }); await audit(token, profile.company_id, profile, `Scholarship ${input.decision.toLowerCase()}`, "sch_scholarships", scholarship.id, input.notes); return decided; }
server/schoolOperations.ts:212:export async function createSchoolServiceRecord(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolServiceInput>) { const action = recordAction(input.table); const { profile, token } = await context(req, action); const record = await insert(input.table, token, profile.company_id, { name: input.name, status: "Active", amount: input.amount ?? null, notes: input.notes || null, data: { ...input.data, createdAt: now() } }); await audit(token, profile.company_id, profile, "School service record created", input.table, record.id); return record; }
server/schoolOperations.ts:213:export async function assignSchoolService(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolServiceAssignmentInput>) { const { profile, token } = await context(req, "services"); const serviceTable = input.table === "sch_transport_assignments" ? "sch_transport" : "sch_hostels"; const [student, service] = await Promise.all([row("sch_students", token, profile.company_id, input.studentId), row(serviceTable, token, profile.company_id, input.serviceId)]); if (input.termId) await row("sch_terms", token, profile.company_id, input.termId); const assignment = await insert(input.table, token, profile.company_id, { name: `${student.name} · ${service.name}`, status: "Active", notes: input.notes || null, data: { ...input, studentName: student.name, serviceName: service.name, assignedAt: now() } }); await audit(token, profile.company_id, profile, "School service assignment created", input.table, assignment.id); return assignment; }
server/schoolOperations.ts:214:export async function createSchoolLibraryLoan(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolLibraryLoanInput>) { const { profile, token } = await context(req, "services"); const [book, student] = await Promise.all([row("sch_books", token, profile.company_id, input.bookId), row("sch_students", token, profile.company_id, input.studentId)]); const available = decimal(book.availableCopies ?? book.available ?? book.copies); if (available < 1) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "This library item has no available copies to loan." }); const duplicate = (await rows("sch_library_loans", token, profile.company_id, 2_000)).find((record) => record.bookId === book.id && record.studentId === student.id && record.status === "On loan"); if (duplicate) throw new TRPCError({ code: "CONFLICT", message: "This learner already has an open loan for the selected book." }); const loan = await insert("sch_library_loans", token, profile.company_id, { name: `${book.name} · ${student.name}`, status: "On loan", notes: input.notes || null, data: { bookId: book.id, bookName: book.name, studentId: student.id, studentName: student.name, dueDate: input.dueDate, issuedAt: now(), issuedBy: profile.id } }); await update("sch_books", token, profile.company_id, book.id, { data: { availableCopies: available - 1, available: available - 1 } }); await audit(token, profile.company_id, profile, "Library loan issued", "sch_library_loans", loan.id); return loan; }
server/schoolOperations.ts:215:export async function recordSchoolInventoryMovement(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolInventoryMovementInput>) { const { profile, token } = await context(req, "services"); const item = await row("sch_inventory_items", token, profile.company_id, input.itemId); const onHand = decimal(item.onHand ?? item.quantity); const next = onHand + input.quantityDelta; if (next < 0) throw new TRPCError({ code: "BAD_REQUEST", message: "This movement would make school inventory negative." }); const movement = await insert("sch_inventory_movements", token, profile.company_id, { name: `${input.quantityDelta > 0 ? "Receipt" : "Issue"} · ${item.name}`, status: "Posted", amount: Math.abs(input.quantityDelta) * decimal(item.unitCost ?? item.amount), notes: input.reason, data: { itemId: item.id, itemName: item.name, quantityDelta: input.quantityDelta, quantityAfter: next, reason: input.reason, postedAt: now() } }); await update("sch_inventory_items", token, profile.company_id, item.id, { amount: next * decimal(item.unitCost ?? item.amount), data: { onHand: next, lastMovementAt: now() } }); await audit(token, profile.company_id, profile, "School inventory movement posted", "sch_inventory_movements", movement.id, input.reason); return movement; }
server/schoolOperations.ts:216:export async function createSchoolDisciplineRecord(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolDisciplineInput>) { const { profile, token } = await context(req, "welfare"); const student = await row("sch_students", token, profile.company_id, input.studentId); const record = await insert("sch_disciplinary_records", token, profile.company_id, { name: `${input.category} · ${student.name}`, status: "Recorded", notes: input.description, data: { ...input, studentName: student.name, recordedBy: profile.id, recordedAt: now() } }); await audit(token, profile.company_id, profile, "Disciplinary record created", "sch_disciplinary_records", record.id); return record; }
server/schoolOperations.ts:218:export async function createSchoolAnnouncement(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolAnnouncementInput>) { const { profile, token } = await context(req, "communications"); if (input.audience === "Class" && !input.classId) throw new TRPCError({ code: "BAD_REQUEST", message: "A class audience requires a selected class." }); if (input.classId) await row("sch_classes", token, profile.company_id, input.classId); const announcement = await insert("sch_announcements", token, profile.company_id, { name: input.title, status: "Published", notes: input.body, data: { ...input, publishedAt: input.publishedAt || now(), publishedBy: profile.id } }); await audit(token, profile.company_id, profile, "School announcement published", "sch_announcements", announcement.id); return announcement; }
server/schoolOperations.ts:219:export async function sendSchoolMessage(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolMessageInput>) { const { profile, token } = await context(req, "communications"); if (input.recipientType === "Class" && !input.classId) throw new TRPCError({ code: "BAD_REQUEST", message: "A class message requires a selected class." }); const message = await insert("sch_messages", token, profile.company_id, { name: input.subject, status: "Sent", notes: input.body, data: { ...input, senderProfileId: profile.id, sentAt: now() } }); await audit(token, profile.company_id, profile, "School message sent", "sch_messages", message.id); return message; }
server/schoolOperations.ts:220:export async function linkSchoolPortal(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolPortalLinkInput>) { const { profile, token } = await context(req, "governance"); const targetTable = input.scope === "Teacher" ? "sch_teachers" : "sch_students"; await row(targetTable, token, profile.company_id, input.recordId); const duplicate = (await rows("sch_portal_links", token, profile.company_id, 2_000)).find((record) => record.profileId === input.profileId && record.scope === input.scope && record.recordId === input.recordId && record.status === "Active"); if (duplicate) throw new TRPCError({ code: "CONFLICT", message: "This portal profile is already linked to the selected school record." }); const link = await insert("sch_portal_links", token, profile.company_id, { name: `${input.scope} portal link`, status: "Active", notes: input.notes || null, data: { ...input, linkedBy: profile.id, linkedAt: now() } }); await audit(token, profile.company_id, profile, "School portal link created", "sch_portal_links", link.id); return link; }
server/schoolOperations.ts:221:export async function createSchoolDocument(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolDocumentInput>) { const { profile, token } = await context(req, "admissions"); const ownerTable: Record<string, SchoolTable> = { Admission: "sch_admissions", Student: "sch_students", Guardian: "sch_guardians", Assignment: "sch_assignments", Discipline: "sch_disciplinary_records", "Report card": "sch_report_cards" }; await row(ownerTable[input.ownerType], token, profile.company_id, input.ownerId); const document = await insert("sch_documents", token, profile.company_id, { name: input.fileName, status: "Active", data: { ...input, uploadedBy: profile.id, uploadedAt: now() } }); await audit(token, profile.company_id, profile, "School document registered", "sch_documents", document.id); return document; }
server/schoolOperations.ts:222:export async function uploadSchoolDocument(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolDocumentUploadInput>) { const { profile, token } = await context(req, "admissions"); const ownerTable: Record<string, SchoolTable> = { Admission: "sch_admissions", Student: "sch_students", Guardian: "sch_guardians", Assignment: "sch_assignments", Discipline: "sch_disciplinary_records", "Report card": "sch_report_cards" }; await row(ownerTable[input.ownerType], token, profile.company_id, input.ownerId); const bytes = Buffer.from(input.base64, "base64"); if (!bytes.length || bytes.length > 6 * 1024 * 1024) throw new TRPCError({ code: "BAD_REQUEST", message: "School documents must be valid files no larger than 6 MB." }); const safeName = input.fileName.replace(/[^a-zA-Z0-9._-]/g, "_"); const stored = await storagePut(`school/${profile.company_id}/${input.ownerType.toLowerCase()}/${input.ownerId}/${safeName}`, bytes, input.mimeType); const document = await insert("sch_documents", token, profile.company_id, { name: input.fileName, status: "Active", data: { ownerType: input.ownerType, ownerId: input.ownerId, storageKey: stored.key, storageUrl: stored.url, fileName: input.fileName, mimeType: input.mimeType, access: input.access, uploadedBy: profile.id, uploadedAt: now() } }); await audit(token, profile.company_id, profile, "School document uploaded", "sch_documents", document.id); return document; }
server/schoolOperations.ts:223:export async function requestSchoolApproval(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolApprovalRequestInput>) { const { profile, token } = await context(req, "read"); const request = await insert("sch_approval_requests", token, profile.company_id, { name: input.subject, status: "Pending", notes: input.rationale, data: { ...input, requestedBy: profile.id, requestedAt: now() } }); await notify(token, profile.company_id, "School approval requires review", "Warning", { approvalId: request.id, requestType: input.requestType }); await audit(token, profile.company_id, profile, "School approval requested", "sch_approval_requests", request.id); return request; }
server/schoolOperations.ts:224:export async function decideSchoolApproval(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolApprovalDecisionInput>) { const { profile, token } = await context(req, "governance"); const request = await row("sch_approval_requests", token, profile.company_id, input.approvalId); if (request.status !== "Pending") throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Only pending approval requests may be decided." }); const decided = await update("sch_approval_requests", token, profile.company_id, request.id, { status: input.decision, notes: input.decisionNotes || null, data: { decidedBy: profile.id, decidedAt: now(), decisionNotes: input.decisionNotes } }); await audit(token, profile.company_id, profile, `School approval ${input.decision.toLowerCase()}`, "sch_approval_requests", decided.id, input.decisionNotes); return decided; }
server/schoolOperations.ts:225:export async function markSchoolNotificationRead(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolIdInput>) { const { profile, token } = await context(req, "read"); return update("sch_notifications", token, profile.company_id, input.id, { status: "Read", data: { readAt: now(), readBy: profile.id } }); }
server/schoolOperations.ts:226:export async function listSchoolAudit(req: CreateExpressContextOptions["req"], input: z.infer<typeof schoolListInput>) { const { profile, token } = await context(req, "governance"); return searchable(await rows("sch_audit_logs", token, profile.company_id, input.limit), input.search); }
server/schoolOperations.ts:228:export async function getSchoolPortal(req: CreateExpressContextOptions["req"]) { const { profile, token, access } = await context(req, "portal"); const links = (await rows("sch_portal_links", token, profile.company_id, 500)).filter((link) => link.profileId === profile.id && link.status === "Active"); const studentIds = links.filter((link) => ["Parent", "Student"].includes(String(link.scope))).map((link) => String(link.recordId)); const teacherIds = links.filter((link) => link.scope === "Teacher").map((link) => String(link.recordId)); const [students, enrollments, attendance, invoices, reports, assignments, submissions, announcements, messages, teachers, teacherAssignments] = await Promise.all([rows("sch_students", token, profile.company_id, 500), rows("sch_enrollments", token, profile.company_id, 1_000), rows("sch_attendance_records", token, profile.company_id, 2_000), rows("sch_fee_invoices", token, profile.company_id, 1_000), rows("sch_report_cards", token, profile.company_id, 1_000), rows("sch_assignments", token, profile.company_id, 1_000), rows("sch_assignment_submissions", token, profile.company_id, 1_000), rows("sch_announcements", token, profile.company_id, 1_000), rows("sch_messages", token, profile.company_id, 1_000), rows("sch_teachers", token, profile.company_id, 500), rows("sch_teacher_assignments", token, profile.company_id, 1_000)]);
server/schoolOperations.ts:233:export async function getSchoolReports(req: CreateExpressContextOptions["req"]) { const { profile, token } = await context(req, "read"); const [students, admissions, enrollments, attendance, assessments, scores, invoices, payments, scholarships, libraryLoans, inventory, discipline, reports] = await Promise.all([rows("sch_students", token, profile.company_id), rows("sch_admissions", token, profile.company_id), rows("sch_enrollments", token, profile.company_id), rows("sch_attendance_records", token, profile.company_id, 5_000), rows("sch_assessments", token, profile.company_id), rows("sch_assessment_scores", token, profile.company_id, 5_000), rows("sch_fee_invoices", token, profile.company_id), rows("sch_payments", token, profile.company_id), rows("sch_scholarships", token, profile.company_id), rows("sch_library_loans", token, profile.company_id), rows("sch_inventory_items", token, profile.company_id), rows("sch_disciplinary_records", token, profile.company_id), rows("sch_report_cards", token, profile.company_id)]);
server/schoolOperations.ts:235:export async function getSchoolDashboard(req: CreateExpressContextOptions["req"]) { const { profile, token, access } = await dashboardContext(req); if (!access.canRead) return { access, totals: { activeStudents: 0, pendingAdmissions: 0, todayAttendanceRate: null, outstandingFees: 0, todayCollections: 0, publishedReportCards: 0, pendingApprovals: 0 }, notifications: [], announcements: [], pendingAdmissions: [] }; const [students, admissions, attendanceSessions, attendance, invoices, payments, reportCards, notifications, announcements, approvals] = await Promise.all([rows("sch_students", token, profile.company_id), rows("sch_admissions", token, profile.company_id), rows("sch_attendance_sessions", token, profile.company_id), rows("sch_attendance_records", token, profile.company_id, 5_000), rows("sch_fee_invoices", token, profile.company_id), rows("sch_payments", token, profile.company_id), rows("sch_report_cards", token, profile.company_id), rows("sch_notifications", token, profile.company_id), rows("sch_announcements", token, profile.company_id), rows("sch_approval_requests", token, profile.company_id)]);
server/schemaDriftRouter.test.ts:7:  it("exposes schema assertion only through protectedProcedure", () => {
server/schemaDriftRouter.test.ts:10:    expect(boundary).toContain("schemaContractAssertion: protectedProcedure");
server/schemaDriftRouter.test.ts:11:    expect(boundary).toContain("assertPayloadContract(input.tableName, input.payload)");
server/schemaDriftRouter.test.ts:23:    const start = routerSource.indexOf("persistSupabaseCriticalRow:");
server/schemaDriftRouter.test.ts:25:    expect(boundary).toContain("persistSupabaseCriticalRow: protectedProcedure");
server/schemaDriftRouter.test.ts:29:    expect(boundary).toContain("persistSupabaseRow(input.tableName");
server/schemaDriftMonitor.ts:39:async function requestOpenApi(supabaseUrl: string, serviceKey: string): Promise<Record<string, unknown>> {
server/schemaDriftMonitor.ts:43:      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
server/schemaDriftMonitor.ts:56:export async function verifyLiveSchemaContract(): Promise<SchemaDriftReport> {
server/schemaDriftMonitor.ts:57:  const supabaseUrl = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
server/schemaDriftMonitor.ts:59:  if (!supabaseUrl || !serviceKey) throw new Error("Supabase schema verification requires server-side Supabase configuration.");
server/schemaDriftMonitor.ts:64:  const openApi = await requestOpenApi(supabaseUrl, serviceKey);
server/schemaDriftMonitor.ts:98:export async function ensureSchemaDriftMonitor() {
server/schemaDriftMonitor.ts:115:export async function activateSchemaDriftMonitor(sessionToken: string) {
server/schemaDriftMonitor.ts:166:export async function runSchemaDriftCheck(monitor?: SchemaDriftMonitor) {
server/schemaDriftMonitor.ts:189:export async function runScheduledSchemaDriftCheck(taskUid: string) {
server/schemaDriftMonitor.ts:199:export async function getSchemaDriftMonitor() {
server/schemaDriftMonitor.ts:203:export async function listSchemaDriftRuns(limit = 30) {
server/schemaDriftChecker.ts:62:export function validateSchemaContract(tableName: string, providedColumns: string[]): SchemaDriftValidationResult {
server/schemaDriftChecker.ts:101:export function validatePayloadContract(tableName: string, payload: Record<string, unknown>): SchemaDriftValidationResult {
server/schemaDriftChecker.ts:105:export function assertPayloadContract(tableName: string, payload: Record<string, unknown>) {
server/schemaDriftChecker.test.ts:2:import { ERP_SCHEMA_CONTRACTS, validatePayloadContract, validateSchemaContract, assertPayloadContract } from "./schemaDriftChecker";
server/schemaDriftChecker.test.ts:119:  it("throws a runtime error when assertPayloadContract is invoked with a drifted payload", () => {
server/schemaDriftChecker.test.ts:121:      assertPayloadContract("finance_expenses", {
server/scheduledTraZReportArchive.ts:5:export async function scheduledTraZReportArchiveHandler(req: Request, res: Response) {
server/scheduledTraVatAnomaly.ts:5:export async function scheduledTraVatAnomalyHandler(req: Request, res: Response) {
server/scheduledSubscriptionFreePlanLifecycle.ts:6:  if (!ENV.supabaseUrl || !ENV.supabaseSecretKey) {
server/scheduledSubscriptionFreePlanLifecycle.ts:9:  const response = await fetch(`${ENV.supabaseUrl}/rest/v1/rpc/billing_reconcile_free_plan_expiry`, {
server/scheduledSubscriptionFreePlanLifecycle.ts:12:      apikey: ENV.supabaseSecretKey,
server/scheduledSubscriptionFreePlanLifecycle.ts:13:      authorization: `Bearer ${ENV.supabaseSecretKey}`,
server/scheduledSubscriptionFreePlanLifecycle.ts:27:export async function scheduledSubscriptionFreePlanLifecycleHandler(req: Request, res: Response) {
server/scheduledSchemaDriftMonitor.ts:5:export async function scheduledSchemaDriftMonitorHandler(req: Request, res: Response) {
server/scheduledPortalReferenceReconciliationDigest.ts:35:export async function scheduledPortalReferenceReconciliationDigestHandler(req: Request, res: Response) {
server/scheduledMicrofinanceParCollectionsEscalation.ts:37:export async function scheduledMicrofinanceParCollectionsEscalationHandler(req: Request, res: Response) {
server/scheduledMarketHealthDigest.ts:49:export async function scheduledMarketHealthDigestHandler(req: Request, res: Response) {
server/scheduledDashboardReport.ts:5:export async function scheduledDashboardReportHandler(req: Request, res: Response) {
server/scheduledAppointmentReminders.ts:5:export async function scheduledAppointmentRemindersHandler(req: Request, res: Response) {
server/routers.ts:6:import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
server/routers.ts:35:import { assertPayloadContract } from "./schemaDriftChecker";
server/routers.ts:36:import { CRITICAL_SUPABASE_TABLES, persistSupabaseRow } from "./supabasePersistence";
server/routers.ts:91:    snapshot: protectedProcedure
server/routers.ts:93:    executiveSnapshot: protectedProcedure
server/routers.ts:95:    recordAction: protectedProcedure
server/routers.ts:99:  schemaContractAssertion: protectedProcedure
server/routers.ts:102:      return assertPayloadContract(input.tableName, input.payload);
server/routers.ts:104:  persistSupabaseCriticalRow: protectedProcedure
server/routers.ts:118:      return persistSupabaseRow(input.tableName, { ...input.payload, company_id: input.companyId });
server/routers.ts:121:    dashboard: protectedProcedure
server/routers.ts:124:    auditHistory: protectedProcedure
server/routers.ts:127:    creditScoringSettings: protectedProcedure
server/routers.ts:129:    saveCreditScoringSettings: protectedProcedure
server/routers.ts:132:    escalationSettings: protectedProcedure
server/routers.ts:134:    escalationHistory: protectedProcedure
server/routers.ts:137:    saveEscalationSettings: protectedProcedure
server/routers.ts:140:    createBorrower: protectedProcedure
server/routers.ts:143:    createGroup: protectedProcedure
server/routers.ts:146:    createLoanProduct: protectedProcedure
server/routers.ts:149:    createGuarantor: protectedProcedure
server/routers.ts:152:    createCollateral: protectedProcedure
server/routers.ts:155:    submitApplication: protectedProcedure
server/routers.ts:158:    decideApplication: protectedProcedure
server/routers.ts:161:    disburseLoan: protectedProcedure
server/routers.ts:164:    recordRepayment: protectedProcedure
server/routers.ts:167:    recordSavings: protectedProcedure
server/routers.ts:170:    openCashSession: protectedProcedure
server/routers.ts:173:    closeCashSession: protectedProcedure
server/routers.ts:176:    createCollectionAction: protectedProcedure
server/routers.ts:181:    snapshot: protectedProcedure.input(propertyListInput).query(({ ctx, input }) => getPropertySnapshot(ctx.req, input)),
server/routers.ts:182:    action: protectedProcedure.input(propertyActionInput).mutation(({ ctx, input }) => runPropertyAction(ctx.req, input)),
server/routers.ts:183:    uploadDocument: protectedProcedure.input(propertyDocumentUploadInput).mutation(({ ctx, input }) => uploadPropertyDocument(ctx.req, input)),
server/routers.ts:186:    snapshot: protectedProcedure
server/routers.ts:189:    customerSnapshot: protectedProcedure
server/routers.ts:192:    action: protectedProcedure
server/routers.ts:197:    access: protectedProcedure.query(({ ctx }) => getPharmacyAccess(ctx.req)),
server/routers.ts:198:    dashboard: protectedProcedure.query(({ ctx }) => getPharmacyDashboard(ctx.req)),
server/routers.ts:199:    list: protectedProcedure.input(pharmacyListInput).query(({ ctx, input }) => listPharmacyRecords(ctx.req, input)),
server/routers.ts:200:    reports: protectedProcedure.query(({ ctx }) => getPharmacyReports(ctx.req)),
server/routers.ts:201:    clinicalQueue: protectedProcedure.input(pharmacyClinicalQueueInput).query(({ ctx, input }) => getPharmacyClinicalQueue(ctx.req, input)),
server/routers.ts:202:    audit: protectedProcedure.input(pharmacyListInput).query(({ ctx, input }) => listPharmacyAudit(ctx.req, input)),
server/routers.ts:203:    createCategory: protectedProcedure.input(pharmacyCategoryInput).mutation(({ ctx, input }) => createPharmacyCategory(ctx.req, input)),
server/routers.ts:204:    createBrand: protectedProcedure.input(pharmacyBrandInput).mutation(({ ctx, input }) => createPharmacyBrand(ctx.req, input)),
server/routers.ts:205:    createSupplier: protectedProcedure.input(pharmacySupplierInput).mutation(({ ctx, input }) => createPharmacySupplier(ctx.req, input)),
server/routers.ts:206:    createMedicine: protectedProcedure.input(pharmacyMedicineInput).mutation(({ ctx, input }) => createPharmacyMedicine(ctx.req, input)),
server/routers.ts:207:    updateCategory: protectedProcedure.input(pharmacyCategoryUpdateInput).mutation(({ ctx, input }) => updatePharmacyCategory(ctx.req, input)),
server/routers.ts:208:    updateBrand: protectedProcedure.input(pharmacyBrandUpdateInput).mutation(({ ctx, input }) => updatePharmacyBrand(ctx.req, input)),

## Declared schema and migrations
drizzle/schema.ts:8:export const users = mysqlTable("users", {
drizzle/schema.ts:28:export const dashboardReportSchedules = mysqlTable("dashboard_report_schedules", {
drizzle/schema.ts:54:export const teamInvitations = mysqlTable("team_invitations", {
drizzle/schema.ts:81:export const auditLogs = mysqlTable("audit_logs", {
drizzle/schema.ts:98:export const webhookDeliveries = mysqlTable("webhook_deliveries", {
drizzle/schema.ts:119:export const schemaDriftMonitors = mysqlTable("schema_drift_monitors", {
drizzle/schema.ts:137:export const schemaDriftRuns = mysqlTable("schema_drift_runs", {
drizzle/schema.ts:155:export const traZReportArchiveSchedules = mysqlTable("tra_z_report_archive_schedules", {
drizzle/schema.ts:177:export const traZReportArchives = mysqlTable("tra_z_report_archives", {
drizzle/schema.ts:199:export const traGatewayAlertSettings = mysqlTable("tra_gateway_alert_settings", {
drizzle/schema.ts:216:export const traGatewayAlertEvents = mysqlTable("tra_gateway_alert_events", {
drizzle/schema.ts:232:export const traVatAnomalySettings = mysqlTable("tra_vat_anomaly_settings", {
drizzle/schema.ts:253:export const traVatAnomalyEvents = mysqlTable("tra_vat_anomaly_events", {
drizzle/schema.ts:272:export const bankMarketRates = mysqlTable("bank_market_rates", {
drizzle/schema.ts:290:export const dseMarketTickers = mysqlTable("dse_market_tickers", {
drizzle/schema.ts:308:export const marketProviderSettings = mysqlTable("market_provider_settings", {
drizzle/schema.ts:338:export const marketProviderUptimeLogs = mysqlTable("market_provider_uptime_logs", {
drizzle/schema.ts:353:export const marketProviderIncidents = mysqlTable("market_provider_incidents", {
supabase/migrations/20260822_030_subscription_plan_admin_controls.sql:5:CREATE OR REPLACE FUNCTION public.billing_is_platform_admin()
supabase/migrations/20260822_030_subscription_plan_admin_controls.sql:19:CREATE OR REPLACE FUNCTION public.billing_upsert_plan(p_payload jsonb DEFAULT '{}'::jsonb)
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:24:CREATE TABLE IF NOT EXISTS public.billing_plan_audit_log (
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:36:CREATE TABLE IF NOT EXISTS public.subscription_notifications (
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:53:CREATE INDEX IF NOT EXISTS billing_plans_catalog_idx
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:55:CREATE INDEX IF NOT EXISTS tenant_subscriptions_trial_ends_idx
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:61:CREATE INDEX IF NOT EXISTS subscription_notifications_company_created_idx
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:63:CREATE INDEX IF NOT EXISTS billing_plan_audit_log_plan_created_idx
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:66:CREATE OR REPLACE FUNCTION public.billing_audit_plan_change()
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:102:CREATE TRIGGER billing_plan_audit_change
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:146:CREATE OR REPLACE FUNCTION public.billing_public_plan_catalog()
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:170:CREATE OR REPLACE FUNCTION public.billing_start_trial(p_plan_code text DEFAULT 'TWIGA')
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:220:CREATE OR REPLACE FUNCTION public.billing_select_trial_plan(p_plan_code text)
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:250:CREATE OR REPLACE FUNCTION public.billing_reconcile_trial_expiry(p_company_id uuid DEFAULT NULL)
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:306:CREATE OR REPLACE FUNCTION public.billing_snapshot()
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:331:ALTER TABLE public.billing_plan_audit_log ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:332:ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:335:CREATE POLICY subscription_notifications_read ON public.subscription_notifications FOR SELECT TO authenticated
supabase/migrations/20260822_028_subscription_trials_and_official_catalog.sql:339:CREATE POLICY billing_plan_audit_log_read ON public.billing_plan_audit_log FOR SELECT TO authenticated
supabase/migrations/20260823_062_fix_billing_snapshot_event_alias.sql:6:CREATE OR REPLACE FUNCTION public.billing_snapshot()
supabase/migrations/20260822_027_subscription_billing_fk_indexes.sql:5:CREATE INDEX IF NOT EXISTS tenant_subscriptions_plan_idx ON public.tenant_subscriptions(plan_id);
supabase/migrations/20260822_027_subscription_billing_fk_indexes.sql:6:CREATE INDEX IF NOT EXISTS tenant_subscriptions_source_payment_idx ON public.tenant_subscriptions(source_payment_id);
supabase/migrations/20260822_027_subscription_billing_fk_indexes.sql:7:CREATE INDEX IF NOT EXISTS subscription_payments_subscription_idx ON public.subscription_payments(subscription_id);
supabase/migrations/20260822_027_subscription_billing_fk_indexes.sql:8:CREATE INDEX IF NOT EXISTS subscription_payments_plan_idx ON public.subscription_payments(plan_id);
supabase/migrations/20260822_027_subscription_billing_fk_indexes.sql:9:CREATE INDEX IF NOT EXISTS subscription_invoices_subscription_idx ON public.subscription_invoices(subscription_id);
supabase/migrations/20260822_027_subscription_billing_fk_indexes.sql:10:CREATE INDEX IF NOT EXISTS subscription_events_subscription_idx ON public.subscription_events(subscription_id);
supabase/migrations/20260822_027_subscription_billing_fk_indexes.sql:11:CREATE INDEX IF NOT EXISTS subscription_events_payment_idx ON public.subscription_events(payment_id);
supabase/migrations/20260824_070_employee_profile_link_admin.sql:5:CREATE OR REPLACE FUNCTION public.hr_link_employee_profile(
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:7:CREATE TABLE IF NOT EXISTS public.subscription_trial_expiry_notices (
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:35:CREATE INDEX IF NOT EXISTS subscription_trial_expiry_notices_user_idx
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:37:CREATE INDEX IF NOT EXISTS subscription_trial_expiry_notices_company_idx
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:40:CREATE OR REPLACE FUNCTION public.subscription_trial_expiry_notice_touch_updated_at()
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:52:CREATE TRIGGER subscription_trial_expiry_notices_touch_updated_at
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:56:ALTER TABLE public.subscription_trial_expiry_notices ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:58:CREATE OR REPLACE FUNCTION public.billing_trial_expiry_notice_claim()
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:180:CREATE OR REPLACE FUNCTION public.billing_trial_expiry_notice_acknowledge(p_claim_token uuid)
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:237:CREATE OR REPLACE FUNCTION public.billing_admin_trial_expiry_notice_snapshot(
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:268:CREATE OR REPLACE FUNCTION public.billing_admin_trial_expiry_notice_reset(
supabase/migrations/20260824_064_trial_expiry_notice_once.sql:327:CREATE OR REPLACE FUNCTION public.billing_snapshot()
supabase/migrations/20260824_061_auth_identity_snapshot.sql:15:CREATE OR REPLACE FUNCTION public.auth_identity_snapshot()
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:81:CREATE INDEX IF NOT EXISTS profiles_company_active_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:88:CREATE TABLE IF NOT EXISTS public.company_memberships (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:132:CREATE INDEX IF NOT EXISTS company_memberships_company_status_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:134:CREATE INDEX IF NOT EXISTS company_memberships_user_status_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:141:CREATE TABLE IF NOT EXISTS public.billing_plans (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:187:CREATE TABLE IF NOT EXISTS public.billing_profiles (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:202:CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:236:CREATE TABLE IF NOT EXISTS public.subscription_payments (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:267:CREATE TABLE IF NOT EXISTS public.subscription_invoices (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:290:CREATE TABLE IF NOT EXISTS public.subscription_usage (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:305:CREATE TABLE IF NOT EXISTS public.subscription_events (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:319:CREATE TABLE IF NOT EXISTS public.billing_plan_audit_log (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:331:CREATE TABLE IF NOT EXISTS public.subscription_notifications (
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:474:CREATE INDEX IF NOT EXISTS billing_plans_catalog_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:476:CREATE INDEX IF NOT EXISTS billing_plans_active_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:478:CREATE INDEX IF NOT EXISTS billing_profiles_company_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:480:CREATE INDEX IF NOT EXISTS tenant_subscriptions_company_status_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:482:CREATE INDEX IF NOT EXISTS tenant_subscriptions_company_offer_status_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:484:CREATE INDEX IF NOT EXISTS tenant_subscriptions_plan_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:486:CREATE INDEX IF NOT EXISTS tenant_subscriptions_source_payment_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:488:CREATE INDEX IF NOT EXISTS subscription_payments_company_status_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:490:CREATE INDEX IF NOT EXISTS subscription_payments_subscription_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:492:CREATE INDEX IF NOT EXISTS subscription_payments_plan_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:494:CREATE INDEX IF NOT EXISTS subscription_payments_provider_order_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:496:CREATE INDEX IF NOT EXISTS subscription_invoices_company_issued_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:498:CREATE INDEX IF NOT EXISTS subscription_invoices_subscription_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:500:CREATE INDEX IF NOT EXISTS subscription_events_company_created_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:502:CREATE INDEX IF NOT EXISTS subscription_events_subscription_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:504:CREATE INDEX IF NOT EXISTS subscription_events_payment_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:506:CREATE INDEX IF NOT EXISTS subscription_usage_company_key_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:508:CREATE INDEX IF NOT EXISTS subscription_notifications_company_created_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:510:CREATE INDEX IF NOT EXISTS billing_plan_audit_log_plan_created_idx
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:524:CREATE TRIGGER subscription_user_memberships_updated_at
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:529:CREATE TRIGGER subscription_user_billing_profiles_updated_at
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:534:CREATE TRIGGER subscription_user_tenant_subscriptions_updated_at
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:539:CREATE TRIGGER subscription_user_payments_updated_at
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:544:CREATE TRIGGER subscription_user_invoices_updated_at
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:552:ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:553:ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:554:ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:555:ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:556:ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:557:ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:558:ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:559:ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:560:ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:561:ALTER TABLE public.billing_plan_audit_log ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:562:ALTER TABLE public.subscription_notifications ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:571:      CREATE POLICY profiles_read ON public.profiles
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:578:      CREATE POLICY company_memberships_read ON public.company_memberships
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:588:      CREATE POLICY company_memberships_admin_write ON public.company_memberships
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:596:      CREATE POLICY billing_plans_read ON public.billing_plans
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:603:      CREATE POLICY billing_profiles_read ON public.billing_profiles
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:610:      CREATE POLICY tenant_subscriptions_read ON public.tenant_subscriptions
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:617:      CREATE POLICY subscription_payments_read ON public.subscription_payments
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:624:      CREATE POLICY subscription_invoices_read ON public.subscription_invoices
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:631:      CREATE POLICY subscription_usage_read ON public.subscription_usage
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:638:      CREATE POLICY subscription_events_read ON public.subscription_events
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:645:      CREATE POLICY subscription_notifications_read ON public.subscription_notifications
supabase/migrations/20260824_067_subscription_user_management_compatibility.sql:652:      CREATE POLICY billing_plan_audit_log_read ON public.billing_plan_audit_log
supabase/migrations/20260824_064_platform_admin_initial_provisioning.sql:24:CREATE OR REPLACE FUNCTION public.provision_initial_platform_administrator(
supabase/migrations/20260824_054_pos_register_control_hardening.sql:84:CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_journal_idx
supabase/migrations/20260824_054_pos_register_control_hardening.sql:86:CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_approval_idx
supabase/migrations/20260824_054_pos_register_control_hardening.sql:89:CREATE OR REPLACE FUNCTION public.pos_require_operate()
supabase/migrations/20260824_054_pos_register_control_hardening.sql:110:CREATE OR REPLACE FUNCTION public.pos_open_shift(
supabase/migrations/20260824_054_pos_register_control_hardening.sql:231:CREATE OR REPLACE FUNCTION public.pos_record_cash_movement(
supabase/migrations/20260824_054_pos_register_control_hardening.sql:339:CREATE OR REPLACE FUNCTION public.pos_block_sensitive_shift_update()
supabase/migrations/20260824_054_pos_register_control_hardening.sql:372:CREATE TRIGGER pos_shift_sessions_immutable_guard
supabase/migrations/20260824_054_pos_register_control_hardening.sql:376:CREATE OR REPLACE FUNCTION public.pos_sync_device_sequence_guard()
supabase/migrations/20260824_054_pos_register_control_hardening.sql:393:CREATE TRIGGER pos_sync_devices_sequence_guard
supabase/migrations/20260824_054_pos_register_control_hardening.sql:397:CREATE OR REPLACE FUNCTION public.pos_accept_sync_device_sequence(
supabase/migrations/20260824_053_pos_register_control.sql:8:CREATE TABLE IF NOT EXISTS public.pos_registers (
supabase/migrations/20260824_053_pos_register_control.sql:31:CREATE TABLE IF NOT EXISTS public.pos_terminals (
supabase/migrations/20260824_053_pos_register_control.sql:63:CREATE TABLE IF NOT EXISTS public.pos_shift_sessions (
supabase/migrations/20260824_053_pos_register_control.sql:127:CREATE INDEX IF NOT EXISTS pos_shift_sessions_company_date_status_idx
supabase/migrations/20260824_053_pos_register_control.sql:129:CREATE INDEX IF NOT EXISTS pos_shift_sessions_cashier_opened_idx
supabase/migrations/20260824_053_pos_register_control.sql:131:CREATE INDEX IF NOT EXISTS pos_shift_sessions_terminal_idx
supabase/migrations/20260824_053_pos_register_control.sql:134:CREATE TABLE IF NOT EXISTS public.pos_shift_cash_movements (
supabase/migrations/20260824_053_pos_register_control.sql:186:CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_company_shift_time_idx
supabase/migrations/20260824_053_pos_register_control.sql:188:CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_company_status_idx
supabase/migrations/20260824_053_pos_register_control.sql:190:CREATE INDEX IF NOT EXISTS pos_shift_cash_movements_legacy_idx
supabase/migrations/20260824_053_pos_register_control.sql:193:CREATE TABLE IF NOT EXISTS public.pos_sync_devices (
supabase/migrations/20260824_053_pos_register_control.sql:223:CREATE INDEX IF NOT EXISTS pos_registers_company_status_idx
supabase/migrations/20260824_053_pos_register_control.sql:225:CREATE INDEX IF NOT EXISTS pos_registers_branch_idx
supabase/migrations/20260824_053_pos_register_control.sql:227:CREATE INDEX IF NOT EXISTS pos_terminals_register_status_idx
supabase/migrations/20260824_053_pos_register_control.sql:229:CREATE INDEX IF NOT EXISTS pos_sync_devices_company_status_seen_idx
supabase/migrations/20260824_053_pos_register_control.sql:232:CREATE OR REPLACE FUNCTION public.pos_register_assert_scope()
supabase/migrations/20260824_053_pos_register_control.sql:256:CREATE TRIGGER pos_registers_assert_scope
supabase/migrations/20260824_053_pos_register_control.sql:260:CREATE OR REPLACE FUNCTION public.pos_shift_assert_scope()
supabase/migrations/20260824_053_pos_register_control.sql:292:CREATE TRIGGER pos_shift_sessions_assert_scope
supabase/migrations/20260824_053_pos_register_control.sql:296:CREATE OR REPLACE FUNCTION public.pos_block_closed_shift_mutation()
supabase/migrations/20260824_053_pos_register_control.sql:310:CREATE TRIGGER pos_shift_sessions_immutable_guard
supabase/migrations/20260824_053_pos_register_control.sql:314:CREATE OR REPLACE FUNCTION public.pos_block_cash_movement_mutation()
supabase/migrations/20260824_053_pos_register_control.sql:327:CREATE TRIGGER pos_shift_cash_movements_immutable_guard
supabase/migrations/20260824_053_pos_register_control.sql:336:    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
supabase/migrations/20260824_053_pos_register_control.sql:339:      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
supabase/migrations/20260824_052_fin_reconciliation_core.sql:5:CREATE TABLE IF NOT EXISTS public.fin_reconciliation_batches (
supabase/migrations/20260824_052_fin_reconciliation_core.sql:33:CREATE TABLE IF NOT EXISTS public.fin_reconciliation_items (
supabase/migrations/20260824_052_fin_reconciliation_core.sql:82:CREATE INDEX IF NOT EXISTS fin_reconciliation_batches_company_date_status_idx
supabase/migrations/20260824_052_fin_reconciliation_core.sql:84:CREATE INDEX IF NOT EXISTS fin_reconciliation_items_company_status_date_idx
supabase/migrations/20260824_052_fin_reconciliation_core.sql:86:CREATE INDEX IF NOT EXISTS fin_reconciliation_items_provider_reference_idx
supabase/migrations/20260824_052_fin_reconciliation_core.sql:88:CREATE INDEX IF NOT EXISTS fin_reconciliation_items_source_idx
supabase/migrations/20260824_052_fin_reconciliation_core.sql:92:CREATE TRIGGER fin_reconciliation_batches_touch_updated_at
supabase/migrations/20260824_052_fin_reconciliation_core.sql:97:CREATE TRIGGER fin_reconciliation_items_touch_updated_at
supabase/migrations/20260824_052_fin_reconciliation_core.sql:106:    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
supabase/migrations/20260824_052_fin_reconciliation_core.sql:109:      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
supabase/migrations/20260824_051_fin_journal_core.sql:5:CREATE TABLE IF NOT EXISTS public.fin_journal_batches (
supabase/migrations/20260824_051_fin_journal_core.sql:52:CREATE TABLE IF NOT EXISTS public.fin_journal_lines (
supabase/migrations/20260824_051_fin_journal_core.sql:97:CREATE TABLE IF NOT EXISTS public.fin_posting_links (
supabase/migrations/20260824_051_fin_journal_core.sql:124:CREATE INDEX IF NOT EXISTS fin_journal_batches_company_date_status_idx
supabase/migrations/20260824_051_fin_journal_core.sql:126:CREATE INDEX IF NOT EXISTS fin_journal_batches_source_idx
supabase/migrations/20260824_051_fin_journal_core.sql:128:CREATE INDEX IF NOT EXISTS fin_journal_lines_account_date_idx
supabase/migrations/20260824_051_fin_journal_core.sql:130:CREATE INDEX IF NOT EXISTS fin_journal_lines_member_date_idx
supabase/migrations/20260824_051_fin_journal_core.sql:132:CREATE INDEX IF NOT EXISTS fin_journal_lines_branch_date_idx
supabase/migrations/20260824_051_fin_journal_core.sql:134:CREATE INDEX IF NOT EXISTS fin_posting_links_batch_idx
supabase/migrations/20260824_051_fin_journal_core.sql:136:CREATE INDEX IF NOT EXISTS fin_posting_links_source_idx
supabase/migrations/20260824_051_fin_journal_core.sql:139:CREATE OR REPLACE FUNCTION public.fin_journal_copy_date()
supabase/migrations/20260824_051_fin_journal_core.sql:164:CREATE TRIGGER fin_journal_lines_copy_date
supabase/migrations/20260824_051_fin_journal_core.sql:168:CREATE OR REPLACE FUNCTION public.fin_block_direct_mutation()
supabase/migrations/20260824_051_fin_journal_core.sql:181:CREATE TRIGGER fin_journal_batches_immutable_guard
supabase/migrations/20260824_051_fin_journal_core.sql:187:CREATE TRIGGER fin_journal_lines_immutable_guard
supabase/migrations/20260824_051_fin_journal_core.sql:192:CREATE TRIGGER fin_posting_links_immutable_guard
supabase/migrations/20260824_051_fin_journal_core.sql:201:    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
supabase/migrations/20260824_051_fin_journal_core.sql:204:      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
supabase/migrations/20260824_050_fin_foundation.sql:8:CREATE TABLE IF NOT EXISTS public.fin_periods (
supabase/migrations/20260824_050_fin_foundation.sql:31:CREATE TABLE IF NOT EXISTS public.fin_accounts (
supabase/migrations/20260824_050_fin_foundation.sql:66:CREATE TABLE IF NOT EXISTS public.fin_idempotency_keys (
supabase/migrations/20260824_050_fin_foundation.sql:88:CREATE TABLE IF NOT EXISTS public.fin_approval_requests (
supabase/migrations/20260824_050_fin_foundation.sql:121:CREATE INDEX IF NOT EXISTS fin_periods_company_status_idx
supabase/migrations/20260824_050_fin_foundation.sql:123:CREATE INDEX IF NOT EXISTS fin_accounts_company_type_status_idx
supabase/migrations/20260824_050_fin_foundation.sql:125:CREATE INDEX IF NOT EXISTS fin_accounts_company_parent_idx
supabase/migrations/20260824_050_fin_foundation.sql:127:CREATE INDEX IF NOT EXISTS fin_idempotency_company_scope_created_idx
supabase/migrations/20260824_050_fin_foundation.sql:129:CREATE INDEX IF NOT EXISTS fin_approval_company_status_created_idx
supabase/migrations/20260824_050_fin_foundation.sql:131:CREATE INDEX IF NOT EXISTS fin_approval_entity_idx
supabase/migrations/20260824_050_fin_foundation.sql:134:CREATE OR REPLACE FUNCTION public.fin_touch_updated_at()
supabase/migrations/20260824_050_fin_foundation.sql:146:CREATE TRIGGER fin_periods_touch_updated_at
supabase/migrations/20260824_050_fin_foundation.sql:151:CREATE TRIGGER fin_accounts_touch_updated_at
supabase/migrations/20260824_050_fin_foundation.sql:156:CREATE TRIGGER fin_idempotency_touch_updated_at
supabase/migrations/20260824_050_fin_foundation.sql:161:CREATE TRIGGER fin_approval_touch_updated_at
supabase/migrations/20260824_050_fin_foundation.sql:165:CREATE OR REPLACE FUNCTION public.fin_has_role(p_roles text[])
supabase/migrations/20260824_050_fin_foundation.sql:188:CREATE OR REPLACE FUNCTION public.fin_can_view()
supabase/migrations/20260824_050_fin_foundation.sql:203:CREATE OR REPLACE FUNCTION public.fin_can_manage()
supabase/migrations/20260824_050_fin_foundation.sql:217:CREATE OR REPLACE FUNCTION public.fin_can_approve()
supabase/migrations/20260824_050_fin_foundation.sql:231:CREATE OR REPLACE FUNCTION public.fin_require(p_capability text)
supabase/migrations/20260824_050_fin_foundation.sql:261:    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
supabase/migrations/20260824_050_fin_foundation.sql:264:      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
supabase/migrations/20260822_024_subscription_billing_plan_admin_visibility.sql:5:CREATE OR REPLACE FUNCTION public.billing_snapshot()
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:6:CREATE TABLE IF NOT EXISTS public.billing_plans (
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:35:CREATE TABLE IF NOT EXISTS public.billing_profiles (
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:50:CREATE TABLE IF NOT EXISTS public.tenant_subscriptions (
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:70:CREATE TABLE IF NOT EXISTS public.subscription_payments (
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:103:CREATE TABLE IF NOT EXISTS public.subscription_invoices (
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:125:CREATE TABLE IF NOT EXISTS public.subscription_usage (
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:140:CREATE TABLE IF NOT EXISTS public.subscription_events (
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:154:CREATE INDEX IF NOT EXISTS billing_plans_active_idx ON public.billing_plans(status, company_id, sort_order);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:155:CREATE INDEX IF NOT EXISTS billing_profiles_company_idx ON public.billing_profiles(company_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:156:CREATE INDEX IF NOT EXISTS tenant_subscriptions_company_status_idx ON public.tenant_subscriptions(company_id, status, expires_at DESC);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:157:CREATE INDEX IF NOT EXISTS tenant_subscriptions_plan_idx ON public.tenant_subscriptions(plan_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:158:CREATE INDEX IF NOT EXISTS tenant_subscriptions_source_payment_idx ON public.tenant_subscriptions(source_payment_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:159:CREATE INDEX IF NOT EXISTS subscription_payments_company_status_idx ON public.subscription_payments(company_id, status, created_at DESC);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:160:CREATE INDEX IF NOT EXISTS subscription_payments_subscription_idx ON public.subscription_payments(subscription_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:161:CREATE INDEX IF NOT EXISTS subscription_payments_plan_idx ON public.subscription_payments(plan_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:162:CREATE INDEX IF NOT EXISTS subscription_payments_provider_order_idx ON public.subscription_payments(provider, provider_order_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:163:CREATE INDEX IF NOT EXISTS subscription_invoices_company_issued_idx ON public.subscription_invoices(company_id, issued_at DESC);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:164:CREATE INDEX IF NOT EXISTS subscription_invoices_subscription_idx ON public.subscription_invoices(subscription_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:165:CREATE INDEX IF NOT EXISTS subscription_events_company_created_idx ON public.subscription_events(company_id, created_at DESC);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:166:CREATE INDEX IF NOT EXISTS subscription_events_subscription_idx ON public.subscription_events(subscription_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:167:CREATE INDEX IF NOT EXISTS subscription_events_payment_idx ON public.subscription_events(payment_id);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:168:CREATE INDEX IF NOT EXISTS subscription_usage_company_key_idx ON public.subscription_usage(company_id, usage_key, period_start DESC);
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:173:CREATE OR REPLACE FUNCTION public.billing_touch_updated_at()
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:185:CREATE TRIGGER billing_plans_touch_updated_at BEFORE UPDATE ON public.billing_plans FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:187:CREATE TRIGGER billing_profiles_touch_updated_at BEFORE UPDATE ON public.billing_profiles FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:189:CREATE TRIGGER tenant_subscriptions_touch_updated_at BEFORE UPDATE ON public.tenant_subscriptions FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:191:CREATE TRIGGER subscription_payments_touch_updated_at BEFORE UPDATE ON public.subscription_payments FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:193:CREATE TRIGGER subscription_invoices_touch_updated_at BEFORE UPDATE ON public.subscription_invoices FOR EACH ROW EXECUTE FUNCTION public.billing_touch_updated_at();
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:195:CREATE OR REPLACE FUNCTION public.billing_is_manager()
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:215:CREATE OR REPLACE FUNCTION public.billing_require_manager()
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:232:CREATE OR REPLACE FUNCTION public.billing_audit(
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:265:CREATE OR REPLACE FUNCTION public.billing_snapshot()
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:289:CREATE OR REPLACE FUNCTION public.billing_upsert_profile(p_payload jsonb DEFAULT '{}'::jsonb)
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:319:CREATE OR REPLACE FUNCTION public.billing_upsert_plan(p_payload jsonb DEFAULT '{}'::jsonb)
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:360:CREATE OR REPLACE FUNCTION public.billing_create_payment_intent(
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:415:CREATE OR REPLACE FUNCTION public.billing_record_provider_dispatch(
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:438:CREATE OR REPLACE FUNCTION public.billing_mark_payment_dispatch_failure(
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:462:CREATE OR REPLACE FUNCTION public.billing_apply_provider_status(
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:525:ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:526:ALTER TABLE public.billing_profiles ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:527:ALTER TABLE public.tenant_subscriptions ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:528:ALTER TABLE public.subscription_payments ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:529:ALTER TABLE public.subscription_invoices ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:530:ALTER TABLE public.subscription_usage ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:531:ALTER TABLE public.subscription_events ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:534:CREATE POLICY billing_plans_read ON public.billing_plans FOR SELECT TO authenticated
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:538:CREATE POLICY billing_profiles_read ON public.billing_profiles FOR SELECT TO authenticated
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:541:CREATE POLICY tenant_subscriptions_read ON public.tenant_subscriptions FOR SELECT TO authenticated
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:544:CREATE POLICY subscription_payments_read ON public.subscription_payments FOR SELECT TO authenticated
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:547:CREATE POLICY subscription_invoices_read ON public.subscription_invoices FOR SELECT TO authenticated
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:550:CREATE POLICY subscription_usage_read ON public.subscription_usage FOR SELECT TO authenticated
supabase/migrations/20260822_023_subscription_billing_harakapay_core.sql:553:CREATE POLICY subscription_events_read ON public.subscription_events FOR SELECT TO authenticated
supabase/migrations/20260822_022_hospitality_finance_reconciliation.sql:4:CREATE TABLE IF NOT EXISTS public.hospitality_finance_reconciliations (
supabase/migrations/20260822_022_hospitality_finance_reconciliation.sql:25:CREATE INDEX IF NOT EXISTS hospitality_finance_reconciliations_company_date_idx ON public.hospitality_finance_reconciliations(company_id,business_date DESC);
supabase/migrations/20260822_022_hospitality_finance_reconciliation.sql:26:ALTER TABLE public.hospitality_finance_reconciliations ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260822_022_hospitality_finance_reconciliation.sql:29:CREATE POLICY hospitality_finance_reconciliations_tenant_select ON public.hospitality_finance_reconciliations FOR SELECT TO authenticated USING (company_id=public.current_company_id());
supabase/migrations/20260822_022_hospitality_finance_reconciliation.sql:30:CREATE POLICY hospitality_finance_reconciliations_tenant_write ON public.hospitality_finance_reconciliations FOR ALL TO authenticated USING (company_id=public.current_company_id() AND public.hospitality_is_privileged()) WITH CHECK (company_id=public.current_company_id() AND public.hospitality_is_privileged());
supabase/migrations/20260822_022_hospitality_finance_reconciliation.sql:32:CREATE OR REPLACE FUNCTION public.hospitality_reconcile_end_of_day(p_property_id uuid, p_business_date date DEFAULT current_date)
supabase/migrations/20260825_018_team_invitations_supabase_storage.sql:17:CREATE TABLE IF NOT EXISTS public.team_invitations (
supabase/migrations/20260825_018_team_invitations_supabase_storage.sql:63:CREATE INDEX IF NOT EXISTS team_invitations_company_status_idx
supabase/migrations/20260825_018_team_invitations_supabase_storage.sql:65:CREATE INDEX IF NOT EXISTS team_invitations_company_email_idx
supabase/migrations/20260825_018_team_invitations_supabase_storage.sql:67:CREATE INDEX IF NOT EXISTS team_invitations_expires_at_idx
supabase/migrations/20260825_018_team_invitations_supabase_storage.sql:71:ALTER TABLE public.team_invitations ENABLE ROW LEVEL SECURITY;
supabase/migrations/20260825_018_team_invitations_supabase_storage.sql:76:CREATE POLICY team_invitations_service_role_access
supabase/migrations/20260823_062_subscription_free_plan_model.sql:39:CREATE OR REPLACE FUNCTION public.billing_audit_plan_change()
supabase/migrations/20260823_062_subscription_free_plan_model.sql:80:CREATE OR REPLACE FUNCTION public.billing_public_plan_catalog()
supabase/migrations/20260823_062_subscription_free_plan_model.sql:115:CREATE OR REPLACE FUNCTION public.billing_upsert_plan(p_payload jsonb DEFAULT '{}'::jsonb)
supabase/migrations/20260823_062_subscription_free_plan_model.sql:207:CREATE OR REPLACE FUNCTION public.billing_start_free_plan(p_plan_code text DEFAULT 'FREE_15')
supabase/migrations/20260823_062_subscription_free_plan_model.sql:271:CREATE OR REPLACE FUNCTION public.billing_reconcile_free_plan_expiry(p_company_id uuid DEFAULT NULL)
supabase/migrations/20260823_062_subscription_free_plan_model.sql:313:CREATE OR REPLACE FUNCTION public.billing_snapshot()
supabase/migrations/20260823_062_subscription_free_plan_model.sql:338:CREATE OR REPLACE FUNCTION public.billing_access_snapshot()
supabase/migrations/20260823_062_subscription_free_plan_model.sql:422:CREATE OR REPLACE FUNCTION public.billing_create_payment_intent(
supabase/migrations/20260823_062_subscription_free_plan_model.sql:476:CREATE OR REPLACE FUNCTION public.billing_apply_provider_status(
supabase/migrations/20260823_062_subscription_free_plan_model.sql:596:CREATE INDEX IF NOT EXISTS tenant_subscriptions_company_offer_status_idx
supabase/migrations/20260823_062_subscription_free_plan_model.sql:600:CREATE POLICY billing_plans_read ON public.billing_plans FOR SELECT TO authenticated
supabase/migrations/20260825_016_fix_billing_snapshot_event_alias.sql:8:CREATE OR REPLACE FUNCTION public.billing_snapshot()
supabase/migrations/20260824_062_subscription_unlimited_free_trial.sql:20:CREATE INDEX IF NOT EXISTS tenant_subscriptions_free_trial_lookup_idx
supabase/migrations/20260824_062_subscription_unlimited_free_trial.sql:23:CREATE OR REPLACE FUNCTION public.billing_start_free_plan(p_plan_code text DEFAULT 'FREE_15')
supabase/migrations/20260824_062_subscription_unlimited_free_trial.sql:104:CREATE OR REPLACE FUNCTION public.billing_reconcile_free_plan_expiry(p_company_id uuid DEFAULT NULL)
supabase/migrations/20260824_062_subscription_unlimited_free_trial.sql:146:CREATE OR REPLACE FUNCTION public.billing_access_snapshot()
supabase/migrations/20260822_020_hospitality_guest_engagement.sql:4:CREATE OR REPLACE FUNCTION public.hospitality_service_action(p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
supabase/migrations/20260822_019_hospitality_pos_and_services.sql:4:CREATE OR REPLACE FUNCTION public.hospitality_pos_snapshot()
supabase/migrations/20260822_019_hospitality_pos_and_services.sql:17:CREATE OR REPLACE FUNCTION public.hospitality_pos_action(p_action text,p_payload jsonb DEFAULT '{}'::jsonb)
supabase/migrations/20260824_061_subscription_activation_flow_repair.sql:7:CREATE OR REPLACE FUNCTION public.billing_start_free_plan(p_plan_code text DEFAULT 'FREE_15')
supabase/migrations/20260824_061_subscription_activation_flow_repair.sql:88:CREATE OR REPLACE FUNCTION public.billing_snapshot()
supabase/migrations/20260823_062_fk_index_optimization_p0_apply.sql:7:CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_company_id_approval_request_id_fk"
supabase/migrations/20260823_062_fk_index_optimization_p0_apply.sql:10:CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_granted_by_fk"
supabase/migrations/20260823_062_fk_index_optimization_p0_apply.sql:13:CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_revoked_by_fk"
supabase/migrations/20260823_062_fk_index_optimization_p0_apply.sql:16:CREATE INDEX IF NOT EXISTS "ix_workforce_permissions_created_by_fk"
supabase/migrations/20260823_062_fk_index_optimization_p0_apply.sql:19:CREATE INDEX IF NOT EXISTS "ix_workforce_permissions_updated_by_fk"
supabase/migrations/20260822_018_hospitality_core.sql:4:CREATE TABLE IF NOT EXISTS public.hospitality_properties (
supabase/migrations/20260822_018_hospitality_core.sql:8:CREATE TABLE IF NOT EXISTS public.hospitality_amenities (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, name text NOT NULL, category text, status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(company_id,name));
supabase/migrations/20260822_018_hospitality_core.sql:9:CREATE TABLE IF NOT EXISTS public.hospitality_room_types (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, name text NOT NULL, code text, capacity_adults integer NOT NULL DEFAULT 2, capacity_children integer NOT NULL DEFAULT 0, base_rate numeric(18,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS', amenities jsonb NOT NULL DEFAULT '[]'::jsonb, status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(property_id,name));
supabase/migrations/20260822_018_hospitality_core.sql:10:CREATE TABLE IF NOT EXISTS public.hospitality_rooms (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, room_type_id uuid NOT NULL REFERENCES public.hospitality_room_types(id) ON DELETE RESTRICT, room_number text NOT NULL, floor text, status text NOT NULL DEFAULT 'Available' CHECK(status IN ('Available','Reserved','Occupied','Dirty','Cleaning','Inspected','Out of Service','Maintenance')), housekeeping_status text NOT NULL DEFAULT 'Clean', maintenance_status text NOT NULL DEFAULT 'Operational', data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(property_id,room_number));
supabase/migrations/20260822_018_hospitality_core.sql:11:CREATE TABLE IF NOT EXISTS public.hospitality_guests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL, first_name text NOT NULL, last_name text NOT NULL, email text, phone text, nationality text, date_of_birth date, loyalty_number text, status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,email));
supabase/migrations/20260822_018_hospitality_core.sql:12:CREATE TABLE IF NOT EXISTS public.hospitality_guest_kyc (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, guest_id uuid NOT NULL REFERENCES public.hospitality_guests(id) ON DELETE CASCADE, document_id uuid REFERENCES public.documents(id) ON DELETE SET NULL, id_type text NOT NULL, id_number text, issuing_country text, expires_at date, verification_status text NOT NULL DEFAULT 'Pending', data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:13:CREATE TABLE IF NOT EXISTS public.hospitality_rate_plans (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, room_type_id uuid REFERENCES public.hospitality_room_types(id) ON DELETE CASCADE, name text NOT NULL, currency text NOT NULL DEFAULT 'TZS', nightly_rate numeric(18,2) NOT NULL DEFAULT 0, effective_from date NOT NULL DEFAULT current_date, effective_to date, status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb, CHECK(effective_to IS NULL OR effective_to >= effective_from));
supabase/migrations/20260822_018_hospitality_core.sql:14:CREATE TABLE IF NOT EXISTS public.hospitality_taxes (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, name text NOT NULL, code text NOT NULL, rate numeric(18,6) NOT NULL DEFAULT 0, applies_to text NOT NULL DEFAULT 'Folio', effective_from date NOT NULL DEFAULT current_date, effective_to date, status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(company_id,code,effective_from));
supabase/migrations/20260822_018_hospitality_core.sql:15:CREATE TABLE IF NOT EXISTS public.hospitality_reservations (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, guest_id uuid NOT NULL REFERENCES public.hospitality_guests(id) ON DELETE RESTRICT, room_type_id uuid REFERENCES public.hospitality_room_types(id) ON DELETE RESTRICT, room_id uuid REFERENCES public.hospitality_rooms(id) ON DELETE RESTRICT, confirmation_code text NOT NULL, arrival_date date NOT NULL, departure_date date NOT NULL, adults integer NOT NULL DEFAULT 1, children integer NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Draft' CHECK(status IN ('Draft','Confirmed','Checked In','Checked Out','Cancelled','No Show')), nightly_rate numeric(18,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS', source text NOT NULL DEFAULT 'Front Desk', special_requests text, checked_in_at timestamptz, checked_out_at timestamptz, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), CHECK(departure_date > arrival_date), UNIQUE(company_id,confirmation_code));
supabase/migrations/20260822_018_hospitality_core.sql:16:CREATE INDEX IF NOT EXISTS hospitality_reservations_room_window_idx ON public.hospitality_reservations(company_id,room_id,arrival_date,departure_date);
supabase/migrations/20260822_018_hospitality_core.sql:17:CREATE TABLE IF NOT EXISTS public.hospitality_folios (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, reservation_id uuid UNIQUE REFERENCES public.hospitality_reservations(id) ON DELETE CASCADE, guest_id uuid NOT NULL REFERENCES public.hospitality_guests(id) ON DELETE RESTRICT, folio_number text NOT NULL, status text NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Closed','Voided')), currency text NOT NULL DEFAULT 'TZS', finance_reference text, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,folio_number));
supabase/migrations/20260822_018_hospitality_core.sql:18:CREATE TABLE IF NOT EXISTS public.hospitality_folio_lines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, folio_id uuid NOT NULL REFERENCES public.hospitality_folios(id) ON DELETE CASCADE, line_type text NOT NULL CHECK(line_type IN ('Room','Dining','Minibar','Laundry','Event','Tax','Discount','Deposit','Payment','Refund','Adjustment')), description text NOT NULL, quantity numeric(18,3) NOT NULL DEFAULT 1, unit_amount numeric(18,2) NOT NULL DEFAULT 0, amount numeric(18,2) NOT NULL DEFAULT 0, tax_amount numeric(18,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS', source_table text, source_record_id uuid, posted_by uuid DEFAULT auth.uid(), posted_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL DEFAULT '{}'::jsonb);
supabase/migrations/20260822_018_hospitality_core.sql:19:CREATE TABLE IF NOT EXISTS public.hospitality_payments (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, folio_id uuid NOT NULL REFERENCES public.hospitality_folios(id) ON DELETE RESTRICT, payment_method text NOT NULL, amount numeric(18,2) NOT NULL CHECK(amount > 0), currency text NOT NULL DEFAULT 'TZS', status text NOT NULL DEFAULT 'Captured', reference text, finance_payment_id uuid, received_by uuid DEFAULT auth.uid(), received_at timestamptz NOT NULL DEFAULT now(), data jsonb NOT NULL DEFAULT '{}'::jsonb);
supabase/migrations/20260822_018_hospitality_core.sql:20:CREATE TABLE IF NOT EXISTS public.hospitality_housekeeping_tasks (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, room_id uuid NOT NULL REFERENCES public.hospitality_rooms(id) ON DELETE CASCADE, assigned_employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL, task_type text NOT NULL DEFAULT 'Checkout Clean', status text NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Assigned','In Progress','Completed','Inspected')), due_at timestamptz, completed_at timestamptz, notes text, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:21:CREATE TABLE IF NOT EXISTS public.hospitality_maintenance_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, room_id uuid REFERENCES public.hospitality_rooms(id) ON DELETE SET NULL, category text NOT NULL, priority text NOT NULL DEFAULT 'Normal', status text NOT NULL DEFAULT 'Open', assigned_employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL, notes text, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:22:CREATE TABLE IF NOT EXISTS public.hospitality_restaurant_tables (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, table_number text NOT NULL, capacity integer NOT NULL DEFAULT 2, zone text, status text NOT NULL DEFAULT 'Available', data jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(property_id,table_number));
supabase/migrations/20260822_018_hospitality_core.sql:23:CREATE TABLE IF NOT EXISTS public.hospitality_menus (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, name text NOT NULL, meal_period text, status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb);
supabase/migrations/20260822_018_hospitality_core.sql:24:CREATE TABLE IF NOT EXISTS public.hospitality_menu_items (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, menu_id uuid NOT NULL REFERENCES public.hospitality_menus(id) ON DELETE CASCADE, inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL, name text NOT NULL, price numeric(18,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS', status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb);
supabase/migrations/20260822_018_hospitality_core.sql:25:CREATE TABLE IF NOT EXISTS public.hospitality_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, table_id uuid REFERENCES public.hospitality_restaurant_tables(id) ON DELETE SET NULL, reservation_id uuid REFERENCES public.hospitality_reservations(id) ON DELETE SET NULL, folio_id uuid REFERENCES public.hospitality_folios(id) ON DELETE SET NULL, order_number text NOT NULL, status text NOT NULL DEFAULT 'Open' CHECK(status IN ('Open','Sent','Preparing','Ready','Served','Paid','Cancelled')), currency text NOT NULL DEFAULT 'TZS', data jsonb NOT NULL DEFAULT '{}'::jsonb, created_by uuid DEFAULT auth.uid(), created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now(), UNIQUE(company_id,order_number));
supabase/migrations/20260822_018_hospitality_core.sql:26:CREATE TABLE IF NOT EXISTS public.hospitality_order_lines (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, order_id uuid NOT NULL REFERENCES public.hospitality_orders(id) ON DELETE CASCADE, menu_item_id uuid REFERENCES public.hospitality_menu_items(id) ON DELETE SET NULL, name text NOT NULL, quantity numeric(18,3) NOT NULL DEFAULT 1, unit_price numeric(18,2) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'New', data jsonb NOT NULL DEFAULT '{}'::jsonb);
supabase/migrations/20260822_018_hospitality_core.sql:27:CREATE TABLE IF NOT EXISTS public.hospitality_minibar_postings (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, reservation_id uuid NOT NULL REFERENCES public.hospitality_reservations(id) ON DELETE CASCADE, inventory_item_id uuid REFERENCES public.inventory_items(id) ON DELETE SET NULL, quantity numeric(18,3) NOT NULL DEFAULT 1, amount numeric(18,2) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Posted', data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:28:CREATE TABLE IF NOT EXISTS public.hospitality_laundry_orders (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, reservation_id uuid REFERENCES public.hospitality_reservations(id) ON DELETE SET NULL, guest_id uuid REFERENCES public.hospitality_guests(id) ON DELETE SET NULL, status text NOT NULL DEFAULT 'Received', amount numeric(18,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS', data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:29:CREATE TABLE IF NOT EXISTS public.hospitality_event_venues (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, name text NOT NULL, capacity integer NOT NULL DEFAULT 0, base_rate numeric(18,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS', status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(property_id,name));
supabase/migrations/20260822_018_hospitality_core.sql:30:CREATE TABLE IF NOT EXISTS public.hospitality_events (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, property_id uuid NOT NULL REFERENCES public.hospitality_properties(id) ON DELETE CASCADE, venue_id uuid REFERENCES public.hospitality_event_venues(id) ON DELETE SET NULL, guest_id uuid REFERENCES public.hospitality_guests(id) ON DELETE SET NULL, name text NOT NULL, start_at timestamptz NOT NULL, end_at timestamptz NOT NULL, status text NOT NULL DEFAULT 'Enquiry', amount numeric(18,2) NOT NULL DEFAULT 0, currency text NOT NULL DEFAULT 'TZS', data jsonb NOT NULL DEFAULT '{}'::jsonb, CHECK(end_at > start_at));
supabase/migrations/20260822_018_hospitality_core.sql:31:CREATE TABLE IF NOT EXISTS public.hospitality_guest_requests (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, reservation_id uuid REFERENCES public.hospitality_reservations(id) ON DELETE SET NULL, guest_id uuid REFERENCES public.hospitality_guests(id) ON DELETE SET NULL, request_type text NOT NULL, description text NOT NULL, priority text NOT NULL DEFAULT 'Normal', status text NOT NULL DEFAULT 'Open', assigned_employee_id uuid REFERENCES public.hr_employees(id) ON DELETE SET NULL, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:32:CREATE TABLE IF NOT EXISTS public.hospitality_complaints (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, reservation_id uuid REFERENCES public.hospitality_reservations(id) ON DELETE SET NULL, guest_id uuid REFERENCES public.hospitality_guests(id) ON DELETE SET NULL, category text, description text NOT NULL, status text NOT NULL DEFAULT 'Open', resolution text, data jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:33:CREATE TABLE IF NOT EXISTS public.hospitality_loyalty_accounts (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, guest_id uuid NOT NULL REFERENCES public.hospitality_guests(id) ON DELETE CASCADE, tier text NOT NULL DEFAULT 'Member', points numeric(18,2) NOT NULL DEFAULT 0, status text NOT NULL DEFAULT 'Active', data jsonb NOT NULL DEFAULT '{}'::jsonb, UNIQUE(company_id,guest_id));
supabase/migrations/20260822_018_hospitality_core.sql:34:CREATE TABLE IF NOT EXISTS public.hospitality_notifications (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE, employee_id uuid REFERENCES public.hr_employees(id) ON DELETE CASCADE, title text NOT NULL, body text NOT NULL, type text NOT NULL DEFAULT 'Hospitality', module text NOT NULL DEFAULT 'hospitality', record_id uuid, read_at timestamptz, created_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:35:CREATE TABLE IF NOT EXISTS public.hospitality_audit_log (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), company_id uuid NOT NULL DEFAULT current_company_id() REFERENCES public.companies(id) ON DELETE CASCADE, actor_profile_id uuid DEFAULT auth.uid(), action text NOT NULL, subject text NOT NULL, detail jsonb NOT NULL DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now());
supabase/migrations/20260822_018_hospitality_core.sql:37:CREATE OR REPLACE FUNCTION public.hospitality_is_privileged() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT coalesce((SELECT lower(role) IN ('owner','admin','manager','hotel_manager','front_desk_manager','finance_manager') FROM public.profiles WHERE id=auth.uid()),false) $$;
supabase/migrations/20260822_018_hospitality_core.sql:38:CREATE OR REPLACE FUNCTION public.hospitality_audit(p_action text,p_subject text,p_detail jsonb DEFAULT '{}'::jsonb) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.hospitality_audit_log(company_id,action,subject,detail) VALUES(public.current_company_id(),p_action,p_subject,coalesce(p_detail,'{}'::jsonb)); END; $$;
supabase/migrations/20260822_018_hospitality_core.sql:39:CREATE OR REPLACE FUNCTION public.hospitality_notify(p_employee_id uuid,p_title text,p_body text,p_record_id uuid DEFAULT NULL) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ BEGIN INSERT INTO public.hospitality_notifications(company_id,employee_id,profile_id,title,body,record_id) SELECT public.current_company_id(),e.id,e.profile_id,p_title,p_body,p_record_id FROM public.hr_employees e WHERE e.id=p_employee_id; END; $$;
supabase/migrations/20260822_018_hospitality_core.sql:41:CREATE OR REPLACE FUNCTION public.hospitality_check_room_available(p_room_id uuid,p_arrival date,p_departure date,p_ignore_reservation uuid DEFAULT NULL) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT NOT EXISTS(SELECT 1 FROM public.hospitality_reservations r WHERE r.company_id=public.current_company_id() AND r.room_id=p_room_id AND r.status IN ('Confirmed','Checked In') AND r.arrival_date < p_departure AND r.departure_date > p_arrival AND (p_ignore_reservation IS NULL OR r.id<>p_ignore_reservation)) $$;
supabase/migrations/20260822_018_hospitality_core.sql:42:CREATE OR REPLACE FUNCTION public.hospitality_snapshot() RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$ DECLARE v_profile uuid:=auth.uid(); BEGIN IF v_profile IS NULL THEN RAISE EXCEPTION 'An authenticated hospitality session is required.' USING ERRCODE='28000'; END IF; RETURN jsonb_build_object('viewer',jsonb_build_object('profileId',v_profile,'isPrivileged',public.hospitality_is_privileged()),'properties',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name) FROM public.hospitality_properties x WHERE x.company_id=public.current_company_id()),'[]'::jsonb),'roomTypes',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.name) FROM public.hospitality_room_types x WHERE x.company_id=public.current_company_id()),'[]'::jsonb),'rooms',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.room_number) FROM public.hospitality_rooms x WHERE x.company_id=public.current_company_id()),'[]'::jsonb),'guests',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.hospitality_guests x WHERE x.company_id=public.current_company_id() LIMIT 100),'[]'::jsonb),'reservations',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.arrival_date) FROM public.hospitality_reservations x WHERE x.company_id=public.current_company_id() LIMIT 100),'[]'::jsonb),'folios',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.hospitality_folios x WHERE x.company_id=public.current_company_id() LIMIT 100),'[]'::jsonb),'housekeeping',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.hospitality_housekeeping_tasks x WHERE x.company_id=public.current_company_id() LIMIT 100),'[]'::jsonb),'orders',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.hospitality_orders x WHERE x.company_id=public.current_company_id() LIMIT 100),'[]'::jsonb),'events',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.start_at) FROM public.hospitality_events x WHERE x.company_id=public.current_company_id() LIMIT 100),'[]'::jsonb),'requests',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.hospitality_guest_requests x WHERE x.company_id=public.current_company_id() LIMIT 100),'[]'::jsonb),'complaints',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.hospitality_complaints x WHERE x.company_id=public.current_company_id() LIMIT 100),'[]'::jsonb),'notifications',coalesce((SELECT jsonb_agg(to_jsonb(x) ORDER BY x.created_at DESC) FROM public.hospitality_notifications x WHERE x.company_id=public.current_company_id() AND (public.hospitality_is_privileged() OR x.profile_id=v_profile) LIMIT 100),'[]'::jsonb)); END $$;
supabase/migrations/20260822_018_hospitality_core.sql:44:CREATE OR REPLACE FUNCTION public.hospitality_action(p_action text,p_payload jsonb DEFAULT '{}'::jsonb) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$ DECLARE v_id uuid; v_property uuid; v_guest uuid; v_room uuid; v_res uuid; v_folio uuid; v_status text; v_amount numeric; v_arrival date; v_departure date; BEGIN IF auth.uid() IS NULL THEN RAISE EXCEPTION 'An authenticated hospitality session is required.' USING ERRCODE='28000'; END IF; IF NOT public.hospitality_is_privileged() THEN RAISE EXCEPTION 'You are not authorised for this hospitality operation.' USING ERRCODE='42501'; END IF;
supabase/migrations/20260822_018_hospitality_core.sql:58:DO $$ DECLARE t text; BEGIN FOREACH t IN ARRAY ARRAY['hospitality_properties','hospitality_amenities','hospitality_room_types','hospitality_rooms','hospitality_guests','hospitality_guest_kyc','hospitality_rate_plans','hospitality_taxes','hospitality_reservations','hospitality_folios','hospitality_folio_lines','hospitality_payments','hospitality_housekeeping_tasks','hospitality_maintenance_requests','hospitality_restaurant_tables','hospitality_menus','hospitality_menu_items','hospitality_orders','hospitality_order_lines','hospitality_minibar_postings','hospitality_laundry_orders','hospitality_event_venues','hospitality_events','hospitality_guest_requests','hospitality_complaints','hospitality_loyalty_accounts','hospitality_notifications','hospitality_audit_log'] LOOP EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t); EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_tenant_select',t); EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I',t||'_tenant_write',t); EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id=public.current_company_id())',t||'_tenant_select',t); EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (company_id=public.current_company_id() AND public.hospitality_is_privileged()) WITH CHECK (company_id=public.current_company_id() AND public.hospitality_is_privileged())',t||'_tenant_write',t); END LOOP; END $$;
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:8:CREATE INDEX IF NOT EXISTS "ix_fleet_audit_events_actor_profile_id_fk" ON public."fleet_audit_events" ("actor_profile_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:11:CREATE INDEX IF NOT EXISTS "ix_fleet_audit_events_company_id_fk" ON public."fleet_audit_events" ("company_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:14:CREATE INDEX IF NOT EXISTS "ix_fleet_vehicles_category_id_fk" ON public."fleet_vehicles" ("category_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:17:CREATE INDEX IF NOT EXISTS "ix_fleet_vehicles_created_by_fk" ON public."fleet_vehicles" ("created_by");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:20:CREATE INDEX IF NOT EXISTS "ix_hospitality_folio_lines_company_id_fk" ON public."hospitality_folio_lines" ("company_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:23:CREATE INDEX IF NOT EXISTS "ix_hospitality_folio_lines_folio_id_fk" ON public."hospitality_folio_lines" ("folio_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:26:CREATE INDEX IF NOT EXISTS "ix_hospitality_folios_guest_id_fk" ON public."hospitality_folios" ("guest_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:29:CREATE INDEX IF NOT EXISTS "ix_hospitality_folios_property_id_fk" ON public."hospitality_folios" ("property_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:32:CREATE INDEX IF NOT EXISTS "ix_hospitality_guests_profile_id_fk" ON public."hospitality_guests" ("profile_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:35:CREATE INDEX IF NOT EXISTS "ix_hospitality_housekeeping_tasks_assigned_employee_id_fk" ON public."hospitality_housekeeping_tasks" ("assigned_employee_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:38:CREATE INDEX IF NOT EXISTS "ix_hospitality_housekeeping_tasks_company_id_fk" ON public."hospitality_housekeeping_tasks" ("company_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:41:CREATE INDEX IF NOT EXISTS "ix_hospitality_housekeeping_tasks_property_id_fk" ON public."hospitality_housekeeping_tasks" ("property_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:44:CREATE INDEX IF NOT EXISTS "ix_hospitality_housekeeping_tasks_room_id_fk" ON public."hospitality_housekeeping_tasks" ("room_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:47:CREATE INDEX IF NOT EXISTS "ix_hospitality_payments_company_id_fk" ON public."hospitality_payments" ("company_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:50:CREATE INDEX IF NOT EXISTS "ix_hospitality_payments_folio_id_fk" ON public."hospitality_payments" ("folio_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:53:CREATE INDEX IF NOT EXISTS "ix_hospitality_properties_branch_id_fk" ON public."hospitality_properties" ("branch_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:56:CREATE INDEX IF NOT EXISTS "ix_hospitality_reservations_guest_id_fk" ON public."hospitality_reservations" ("guest_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:59:CREATE INDEX IF NOT EXISTS "ix_hospitality_reservations_property_id_fk" ON public."hospitality_reservations" ("property_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:62:CREATE INDEX IF NOT EXISTS "ix_hospitality_reservations_room_id_fk" ON public."hospitality_reservations" ("room_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:65:CREATE INDEX IF NOT EXISTS "ix_hospitality_reservations_room_type_id_fk" ON public."hospitality_reservations" ("room_type_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:68:CREATE INDEX IF NOT EXISTS "ix_hospitality_room_types_company_id_fk" ON public."hospitality_room_types" ("company_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:71:CREATE INDEX IF NOT EXISTS "ix_hospitality_rooms_company_id_fk" ON public."hospitality_rooms" ("company_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:74:CREATE INDEX IF NOT EXISTS "ix_hospitality_rooms_room_type_id_fk" ON public."hospitality_rooms" ("room_type_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:77:CREATE INDEX IF NOT EXISTS "ix_hr_payroll_items_employee_id_fk" ON public."hr_payroll_items" ("employee_id");
supabase/migrations/20260825_017_fk_index_remediation_wave_005.sql:80:CREATE INDEX IF NOT EXISTS "ix_hr_payslips_document_id_fk" ON public."hr_payslips" ("document_id");
supabase/migrations/20260822_017_leave_decision_immutability.sql:4:CREATE OR REPLACE FUNCTION public.hr_prevent_terminal_leave_redecision()
supabase/migrations/20260822_017_leave_decision_immutability.sql:22:CREATE TRIGGER hr_prevent_terminal_leave_redecision
supabase/migrations/20260822_016_payroll_configuration_status_fix.sql:4:CREATE OR REPLACE FUNCTION public.hr_payroll_configuration_status(p_company_id uuid, p_on_date date DEFAULT current_date)
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:13:CREATE TABLE IF NOT EXISTS public.pos_tax_rules (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:66:CREATE TABLE IF NOT EXISTS public.pos_discount_rules (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:124:CREATE TABLE IF NOT EXISTS public.pos_promotions (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:168:CREATE TABLE IF NOT EXISTS public.pos_promotion_items (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:203:CREATE TABLE IF NOT EXISTS public.pos_sale_adjustments (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:301:CREATE TABLE IF NOT EXISTS public.pos_sale_tax_lines (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:346:CREATE TABLE IF NOT EXISTS public.pos_loyalty_programs (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:390:CREATE TABLE IF NOT EXISTS public.pos_loyalty_members (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:422:CREATE TABLE IF NOT EXISTS public.pos_loyalty_ledger (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:463:CREATE TABLE IF NOT EXISTS public.pos_loyalty_rewards (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:502:CREATE TABLE IF NOT EXISTS public.pos_loyalty_redemptions (
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:575:CREATE INDEX IF NOT EXISTS pos_tax_rules_effective_status_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:577:CREATE INDEX IF NOT EXISTS pos_tax_rules_item_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:579:CREATE INDEX IF NOT EXISTS pos_discount_rules_effective_status_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:581:CREATE INDEX IF NOT EXISTS pos_discount_rules_item_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:583:CREATE INDEX IF NOT EXISTS pos_promotions_effective_status_priority_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:585:CREATE INDEX IF NOT EXISTS pos_promotion_items_inventory_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:587:CREATE INDEX IF NOT EXISTS pos_sale_adjustments_sale_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:589:CREATE INDEX IF NOT EXISTS pos_sale_adjustments_rule_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:591:CREATE INDEX IF NOT EXISTS pos_sale_tax_lines_sale_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:593:CREATE INDEX IF NOT EXISTS pos_loyalty_members_customer_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:595:CREATE INDEX IF NOT EXISTS pos_loyalty_ledger_member_time_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:597:CREATE INDEX IF NOT EXISTS pos_loyalty_ledger_sale_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:599:CREATE INDEX IF NOT EXISTS pos_loyalty_redemptions_member_status_idx
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:602:CREATE OR REPLACE FUNCTION public.pos_pricing_scope_assert()
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:636:CREATE TRIGGER pos_tax_rules_scope_assert
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:640:CREATE TRIGGER pos_discount_rules_scope_assert
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:644:CREATE TRIGGER pos_promotion_items_scope_assert
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:648:CREATE TRIGGER pos_loyalty_members_scope_assert
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:652:CREATE OR REPLACE FUNCTION public.pos_pricing_touch_updated_at()
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:674:    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.pos_pricing_touch_updated_at()', t || '_touch_updated_at', t);
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:675:    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
supabase/migrations/20260824_056_pos_pricing_loyalty.sql:678:      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
supabase/migrations/20260822_015_tanzania_payroll_calculation_engine.sql:12:CREATE OR REPLACE FUNCTION public.tz_paye_monthly(p_taxable_pay numeric)
supabase/migrations/20260822_015_tanzania_payroll_calculation_engine.sql:29:CREATE OR REPLACE FUNCTION public.tanzania_payroll_preview(
supabase/migrations/20260822_015_tanzania_payroll_calculation_engine.sql:82:CREATE OR REPLACE FUNCTION public.hr_calculate_tanzania_payroll(
supabase/migrations/20260822_015_tanzania_payroll_calculation_engine.sql:129:CREATE OR REPLACE FUNCTION public.hr_payroll_configuration_status(p_company_id uuid, p_on_date date DEFAULT current_date)
supabase/migrations/20260822_015_tanzania_payroll_calculation_engine.sql:151:CREATE OR REPLACE FUNCTION public.hr_apply_tanzania_payroll_item_calculation()
supabase/migrations/20260822_015_tanzania_payroll_calculation_engine.sql:180:CREATE TRIGGER hr_apply_tanzania_payroll_item_calculation
supabase/migrations/20260824_055_pos_sales_returns.sql:12:CREATE TABLE IF NOT EXISTS public.pos_sale_headers (
supabase/migrations/20260824_055_pos_sales_returns.sql:98:CREATE TABLE IF NOT EXISTS public.pos_sale_lines (
supabase/migrations/20260824_055_pos_sales_returns.sql:139:CREATE TABLE IF NOT EXISTS public.pos_sale_tenders (
supabase/migrations/20260824_055_pos_sales_returns.sql:191:CREATE TABLE IF NOT EXISTS public.pos_return_headers (
supabase/migrations/20260824_055_pos_sales_returns.sql:285:CREATE TABLE IF NOT EXISTS public.pos_return_lines (
supabase/migrations/20260824_055_pos_sales_returns.sql:334:CREATE INDEX IF NOT EXISTS pos_sale_headers_company_status_date_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:336:CREATE INDEX IF NOT EXISTS pos_sale_headers_shift_created_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:338:CREATE INDEX IF NOT EXISTS pos_sale_headers_customer_date_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:340:CREATE INDEX IF NOT EXISTS pos_sale_headers_journal_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:342:CREATE INDEX IF NOT EXISTS pos_sale_lines_sale_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:344:CREATE INDEX IF NOT EXISTS pos_sale_lines_inventory_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:346:CREATE INDEX IF NOT EXISTS pos_sale_tenders_sale_status_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:348:CREATE INDEX IF NOT EXISTS pos_sale_tenders_provider_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:350:CREATE INDEX IF NOT EXISTS pos_return_headers_company_status_date_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:352:CREATE INDEX IF NOT EXISTS pos_return_headers_sale_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:354:CREATE INDEX IF NOT EXISTS pos_return_lines_sale_line_idx
supabase/migrations/20260824_055_pos_sales_returns.sql:357:CREATE OR REPLACE FUNCTION public.pos_sales_assert_scope()
supabase/migrations/20260824_055_pos_sales_returns.sql:389:CREATE TRIGGER pos_sale_headers_assert_scope
supabase/migrations/20260824_055_pos_sales_returns.sql:393:CREATE OR REPLACE FUNCTION public.pos_sale_lines_assert_scope()
supabase/migrations/20260824_055_pos_sales_returns.sql:411:CREATE TRIGGER pos_sale_lines_assert_scope
supabase/migrations/20260824_055_pos_sales_returns.sql:415:CREATE OR REPLACE FUNCTION public.pos_tenders_assert_state()
supabase/migrations/20260824_055_pos_sales_returns.sql:438:CREATE TRIGGER pos_sale_tenders_assert_state
supabase/migrations/20260824_055_pos_sales_returns.sql:442:CREATE OR REPLACE FUNCTION public.pos_returns_assert_scope()
supabase/migrations/20260824_055_pos_sales_returns.sql:468:CREATE TRIGGER pos_return_headers_assert_scope
supabase/migrations/20260824_055_pos_sales_returns.sql:477:    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
supabase/migrations/20260824_055_pos_sales_returns.sql:480:      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.fin_can_view())',
supabase/migrations/20260824_057_workforce_authorization.sql:7:CREATE TABLE IF NOT EXISTS public.workforce_roles (
supabase/migrations/20260824_057_workforce_authorization.sql:32:CREATE TABLE IF NOT EXISTS public.workforce_permissions (
supabase/migrations/20260824_057_workforce_authorization.sql:57:CREATE TABLE IF NOT EXISTS public.workforce_role_permissions (
supabase/migrations/20260824_057_workforce_authorization.sql:86:CREATE TABLE IF NOT EXISTS public.workforce_member_roles (
supabase/migrations/20260824_057_workforce_authorization.sql:113:CREATE TABLE IF NOT EXISTS public.workforce_module_access (
supabase/migrations/20260824_057_workforce_authorization.sql:146:CREATE TABLE IF NOT EXISTS public.workforce_data_scopes (
supabase/migrations/20260824_057_workforce_authorization.sql:179:CREATE TABLE IF NOT EXISTS public.workforce_approval_limits (
supabase/migrations/20260824_057_workforce_authorization.sql:212:CREATE TABLE IF NOT EXISTS public.workforce_permission_conflicts (
supabase/migrations/20260824_057_workforce_authorization.sql:241:CREATE INDEX IF NOT EXISTS workforce_roles_company_status_idx ON public.workforce_roles (company_id, status, hierarchy_level DESC);
supabase/migrations/20260824_057_workforce_authorization.sql:242:CREATE INDEX IF NOT EXISTS workforce_permissions_company_module_idx ON public.workforce_permissions (company_id, module_id, permission_action, status);
supabase/migrations/20260824_057_workforce_authorization.sql:243:CREATE INDEX IF NOT EXISTS workforce_role_permissions_company_role_status_idx ON public.workforce_role_permissions (company_id, role_id, status, effective_from DESC);
supabase/migrations/20260824_057_workforce_authorization.sql:244:CREATE INDEX IF NOT EXISTS workforce_role_permissions_company_permission_idx ON public.workforce_role_permissions (company_id, permission_id, status);
supabase/migrations/20260824_057_workforce_authorization.sql:245:CREATE INDEX IF NOT EXISTS workforce_member_roles_company_profile_status_idx ON public.workforce_member_roles (company_id, profile_id, status, effective_from DESC);
supabase/migrations/20260824_057_workforce_authorization.sql:246:CREATE INDEX IF NOT EXISTS workforce_member_roles_company_employee_status_idx ON public.workforce_member_roles (company_id, employee_id, status);
supabase/migrations/20260824_057_workforce_authorization.sql:247:CREATE INDEX IF NOT EXISTS workforce_module_access_company_profile_module_idx ON public.workforce_module_access (company_id, target_profile_id, module_id, permission_action, status);
supabase/migrations/20260824_057_workforce_authorization.sql:248:CREATE INDEX IF NOT EXISTS workforce_module_access_company_role_module_idx ON public.workforce_module_access (company_id, target_role_id, module_id, permission_action, status);
supabase/migrations/20260824_057_workforce_authorization.sql:249:CREATE INDEX IF NOT EXISTS workforce_data_scopes_company_profile_scope_idx ON public.workforce_data_scopes (company_id, target_profile_id, scope_type, status);
supabase/migrations/20260824_057_workforce_authorization.sql:250:CREATE INDEX IF NOT EXISTS workforce_data_scopes_company_role_scope_idx ON public.workforce_data_scopes (company_id, target_role_id, scope_type, status);
supabase/migrations/20260824_057_workforce_authorization.sql:251:CREATE INDEX IF NOT EXISTS workforce_approval_limits_company_permission_idx ON public.workforce_approval_limits (company_id, permission_id, status, effective_from DESC);
supabase/migrations/20260824_057_workforce_authorization.sql:252:CREATE INDEX IF NOT EXISTS workforce_permission_conflicts_company_status_idx ON public.workforce_permission_conflicts (company_id, status, severity);
supabase/migrations/20260824_057_workforce_authorization.sql:254:CREATE OR REPLACE FUNCTION public.workforce_touch_updated_at()
supabase/migrations/20260824_057_workforce_authorization.sql:275:    EXECUTE format('CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.workforce_touch_updated_at()', t || '_touch_updated_at', t);
supabase/migrations/20260824_057_workforce_authorization.sql:280:CREATE OR REPLACE FUNCTION public.workforce_is_privileged()
supabase/migrations/20260824_057_workforce_authorization.sql:307:CREATE OR REPLACE FUNCTION public.workforce_has_permission(p_permission_code text)
supabase/migrations/20260824_057_workforce_authorization.sql:392:CREATE OR REPLACE FUNCTION public.workforce_require(p_permission_code text)
supabase/migrations/20260824_057_workforce_authorization.sql:408:CREATE OR REPLACE FUNCTION public.workforce_validate_scope()
supabase/migrations/20260824_057_workforce_authorization.sql:452:    EXECUTE format('CREATE TRIGGER %I BEFORE INSERT OR UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.workforce_validate_scope()', t || '_validate_scope', t);
supabase/migrations/20260824_057_workforce_authorization.sql:466:    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
supabase/migrations/20260824_057_workforce_authorization.sql:469:      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id())', t || '_tenant_select', t);
supabase/migrations/20260824_057_workforce_authorization.sql:471:      EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (company_id = public.current_company_id() AND public.workforce_is_privileged())', t || '_tenant_select', t);
supabase/migrations/20260824_058_workforce_role_assignment_approval.sql:14:CREATE OR REPLACE FUNCTION public.workforce_audit(
supabase/migrations/20260824_058_workforce_role_assignment_approval.sql:46:CREATE OR REPLACE FUNCTION public.workforce_require_assignment_authority()
supabase/migrations/20260824_058_workforce_role_assignment_approval.sql:62:CREATE OR REPLACE FUNCTION public.workforce_require_assignment_approval_authority()
supabase/migrations/20260824_058_workforce_role_assignment_approval.sql:78:CREATE OR REPLACE FUNCTION public.workforce_request_role_assignment(
supabase/migrations/20260824_058_workforce_role_assignment_approval.sql:224:CREATE OR REPLACE FUNCTION public.workforce_decide_role_assignment(
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:6:CREATE INDEX IF NOT EXISTS "workforce_data_scopes_workforce_data_scopes_target_pro_f1fb3ee2" ON public."workforce_data_scopes" ("target_profile_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:7:CREATE INDEX IF NOT EXISTS "workforce_member_roles_workforce_member_roles_assigned_885d252b" ON public."workforce_member_roles" ("assigned_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:8:CREATE INDEX IF NOT EXISTS "workforce_member_roles_workforce_member_roles_company__e45a9aa5" ON public."workforce_member_roles" ("company_id", "approval_request_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:9:CREATE INDEX IF NOT EXISTS "workforce_member_roles_workforce_member_roles_company__1ee549ce" ON public."workforce_member_roles" ("company_id", "role_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:10:CREATE INDEX IF NOT EXISTS "workforce_member_roles_workforce_member_roles_employee_b2265ab6" ON public."workforce_member_roles" ("employee_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:11:CREATE INDEX IF NOT EXISTS "workforce_member_roles_workforce_member_roles_profile__c061eb7a" ON public."workforce_member_roles" ("profile_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:12:CREATE INDEX IF NOT EXISTS "workforce_member_roles_workforce_member_roles_revoked__7888d08b" ON public."workforce_member_roles" ("revoked_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:13:CREATE INDEX IF NOT EXISTS "workforce_module_access_workforce_module_access_assign_84260953" ON public."workforce_module_access" ("assigned_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:14:CREATE INDEX IF NOT EXISTS "workforce_module_access_workforce_module_access_compan_c808aa56" ON public."workforce_module_access" ("company_id", "approval_request_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:15:CREATE INDEX IF NOT EXISTS "workforce_module_access_workforce_module_access_revoke_ed8d2912" ON public."workforce_module_access" ("revoked_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:16:CREATE INDEX IF NOT EXISTS "workforce_module_access_workforce_module_access_target_863da3df" ON public."workforce_module_access" ("target_profile_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:17:CREATE INDEX IF NOT EXISTS "workforce_permission_conflicts_workforce_permission_co_ff4b3c5b" ON public."workforce_permission_conflicts" ("company_id", "permission_a_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:18:CREATE INDEX IF NOT EXISTS "workforce_permission_conflicts_workforce_permission_co_09dc75b9" ON public."workforce_permission_conflicts" ("company_id", "permission_b_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:19:CREATE INDEX IF NOT EXISTS "workforce_permission_conflicts_workforce_permission_co_288e93fe" ON public."workforce_permission_conflicts" ("created_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:20:CREATE INDEX IF NOT EXISTS "workforce_permission_conflicts_workforce_permission_co_864e453e" ON public."workforce_permission_conflicts" ("updated_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:21:CREATE INDEX IF NOT EXISTS "workforce_roles_workforce_roles_created_by_fkey_fk_idx_e8fd23a6" ON public."workforce_roles" ("created_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:22:CREATE INDEX IF NOT EXISTS "workforce_roles_workforce_roles_updated_by_fkey_fk_idx_2cf02e47" ON public."workforce_roles" ("updated_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:23:CREATE INDEX IF NOT EXISTS "pos_discount_rules_pos_discount_rules_account_company__603a2e01" ON public."pos_discount_rules" ("company_id", "contra_revenue_account_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:24:CREATE INDEX IF NOT EXISTS "pos_discount_rules_pos_discount_rules_approval_company_90a64395" ON public."pos_discount_rules" ("company_id", "approval_request_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:25:CREATE INDEX IF NOT EXISTS "pos_discount_rules_pos_discount_rules_created_by_fkey__98954a99" ON public."pos_discount_rules" ("created_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:26:CREATE INDEX IF NOT EXISTS "pos_discount_rules_pos_discount_rules_inventory_item_i_b0e971f8" ON public."pos_discount_rules" ("inventory_item_id");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:27:CREATE INDEX IF NOT EXISTS "pos_discount_rules_pos_discount_rules_updated_by_fkey__e4c29d94" ON public."pos_discount_rules" ("updated_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:28:CREATE INDEX IF NOT EXISTS "pos_loyalty_ledger_pos_loyalty_ledger_created_by_fkey__050711e2" ON public."pos_loyalty_ledger" ("created_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:29:CREATE INDEX IF NOT EXISTS "pos_loyalty_ledger_pos_loyalty_ledger_updated_by_fkey__a1c4d29e" ON public."pos_loyalty_ledger" ("updated_by");
supabase/migrations/20260825_016_fk_index_remediation_wave_004.sql:30:CREATE INDEX IF NOT EXISTS "pos_loyalty_members_pos_loyalty_members_created_by_fke_1d23d08e" ON public."pos_loyalty_members" ("created_by");
supabase/migrations/20260825_005_workspace_presence_recovery.sql:10:CREATE OR REPLACE FUNCTION public.create_company_and_owner(
supabase/migrations/20260825_005_workspace_presence_recovery.sql:71:CREATE OR REPLACE FUNCTION public.join_company_with_code(
supabase/migrations/20260825_005_workspace_presence_recovery.sql:134:CREATE OR REPLACE FUNCTION public.ensure_current_company()
supabase/migrations/20260823_061_fk_index_optimization_p0_review.sql:11:CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_company_id_approval_request_id_fk" ON "public"."workforce_role_permissions" ("company_id", "approval_request_id");
supabase/migrations/20260823_061_fk_index_optimization_p0_review.sql:14:CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_granted_by_fk" ON "public"."workforce_role_permissions" ("granted_by");
supabase/migrations/20260823_061_fk_index_optimization_p0_review.sql:17:CREATE INDEX IF NOT EXISTS "ix_workforce_role_permissions_revoked_by_fk" ON "public"."workforce_role_permissions" ("revoked_by");
supabase/migrations/20260823_061_fk_index_optimization_p0_review.sql:20:CREATE INDEX IF NOT EXISTS "ix_workforce_permissions_created_by_fk" ON "public"."workforce_permissions" ("created_by");
supabase/migrations/20260823_061_fk_index_optimization_p0_review.sql:23:CREATE INDEX IF NOT EXISTS "ix_workforce_permissions_updated_by_fk" ON "public"."workforce_permissions" ("updated_by");
supabase/migrations/20250825_007_standing_order_server_implementation.sql:35:CREATE OR REPLACE FUNCTION public.bank_standing_order_raise(
supabase/migrations/20250825_007_standing_order_server_implementation.sql:49:CREATE OR REPLACE FUNCTION public.bank_standing_order_request_fingerprint(
supabase/migrations/20250825_007_standing_order_server_implementation.sql:79:CREATE OR REPLACE FUNCTION public.bank_standing_order_normalize_msisdn(
supabase/migrations/20250825_007_standing_order_server_implementation.sql:101:CREATE OR REPLACE FUNCTION public.bank_standing_order_next_date(
supabase/migrations/20250825_007_standing_order_server_implementation.sql:133:CREATE OR REPLACE FUNCTION public.bank_standing_order_response(
supabase/migrations/20250825_007_standing_order_server_implementation.sql:175:CREATE OR REPLACE FUNCTION public.bank_list_standing_orders(
supabase/migrations/20250825_007_standing_order_server_implementation.sql:228:CREATE OR REPLACE FUNCTION public.bank_get_standing_order(
supabase/migrations/20250825_007_standing_order_server_implementation.sql:261:CREATE OR REPLACE FUNCTION public.bank_create_standing_order(

## Tests by domain
accountPasskeys
accountPasskeysUi
adminQualityAndFeedback
adminSecurityFollowup
ai.router
aiApprovals
aiConfirmedMutation
androidPackaging
animatedLogoUi
appBootstrap
appLogoStorage
auditEvidenceExport
auditLogs
auth.errors
auth.logout
authBrandLocalization
authContextSnapshotContract
authExperience
authHeaders
authIdentitySnapshotMigration
authJourneySimulation
authOnboarding
authStateMachine
authVisualRegression
backupVerification
bankMfiOperations
bankMfiSecurity
brandingAssets
buttonActionContracts
campaignIntegrity
ciWorkflowContracts
clientMutationContract
collaborationEmailLinkCheck
collaborationHub
collaborationPersistenceBoundaries
commandPaletteKeyboard
commercialCommandCenters
communityGroups
communityGroupsRlsPenetration
communityGroupsSchema
communityGroupsSecurity
communityMemberInvitationContracts
complianceApprovalExport
complianceApprovalRoute
crmLeadTruthfulness
crmPersistenceBoundaries
dashboard.callback
dashboard.commandCenter.integration
dashboard.httpHandler
dashboard.integration
dashboard.persistence
dashboard.reportFlow
dashboard.scheduled
dashboardCommandStrip.contract
dashboardContracts
dashboardExecutiveOverview.contract
dashboardQualityContracts
dashboardTruthfulness
dependencyAuditWorkflow
documentDownloadBoundaries
documentsNotebookPersistence
e2eUserJourney
emailCenter.runtime
emailLivePreview
emailSignatureAndAttachments
emailTemplateWorkflow
employeePortalContracts
employeeSelfServiceWorkflowContracts
enterpriseTableControls
executiveCommandCenter
express5RouteContracts
financeCommandCenters
financeFoundationMigration
financeJournalReconciliationMigration
financeLedgerContracts
financePersistenceBoundaries
fkIndexMigrationPlan
fkIndexOptimizationScript
fleetManagementContracts
freeTrialNoticeDismissal.contract
globalAdmin
guardedClientMutation
guardedServerBoundary
healthcareInteroperability
healthcareOperations
healthcarePortalReconciliation
healthcarePortalReconciliationWorkflow
healthcareReminderWebhook
healthcareReminders
healthcareRouter.integration
healthcareSelfService
hospitalityContracts
hrPersistenceBoundaries
httpError
industryFocusOnboardingAudit
intelligenceCommandCenters
inventoryPersistenceBoundaries
legacyUiPersistenceContracts
liveTenantWorkflow.integration
loginModuleEcosystem
maintenancePersistenceBoundaries
manufacturingPersistenceBoundaries
marketIntelligence
microfinanceOperations
microfinanceRouter.integration
mobileAuthEvidence
mobileAuthMatrix
mobileDefectFixes
mobileSignupVisualE2E
moneyAgentContracts
notificationChannelPersistence
offlineBoundaryUi
onboardingProgress
onboardingTour
operationsCommandCenters
organizationIndustryFocus
passkeyLogin
passkeyLoginUi
passkeyReadinessUi
passwordAccountProvisioning
peopleCommandCenters
persistenceBoundary
pharmacyOperations
platformAdminExecutiveDashboardContracts
platformAdminProvisioningContracts
posCashierAcceptance
posCheckoutIntegration
posCustomerCreditMigration
posDeviceProfiles
posHistoryFallback
posOperationalTools
posOperationalToolsUi
posPendingQueue
posPostConfirmationFallback
posPricingLoyaltyMigration
posReceiptRefresh
posReconciliationDashboard
posRegisterControlHardeningMigration
posRegisterControlMigration
posReturnAuditFormatMigration
posReturnMigration
posRpcPrivilegeHardeningMigration
posSaleAuditFormatMigration
posSalesReturnsMigration
posStagingAcceptanceScript
posSyncReconciliationMigration
posTransactionEngine
posTransactionMigration
posUxEnhancements
posWorkforceRpcAdapters
proactiveSessionRenewal
procurementPersistenceBoundaries
profileIdentity
profileIdentity.contract
projectsPersistenceBoundaries
propertyManagementContracts
protocolClosure
publicAuthGatewayLexical
publicInteractionContracts
publicPasskeyEntry
quarterlySecurityReminderScope
reportDeliveryAvailability
reportScheduleSessionToken
reportSchedules.sendNow
reportSchedules.service
resendSenderConfiguration
restaurantFnbContracts
rlsSchemaReconciliationContracts
roleChangeApprovals
salesInteractionContracts
scheduledMicrofinanceParCollectionsEscalation
scheduledPortalReferenceReconciliationDigest
schemaDriftChecker
schemaDriftMonitor
schemaDriftRouter
schoolOperations
sectorCommandCenters
sensitiveRpcExecuteHardening
sessionRefreshTableReload
settingsAndRoleRegression
settingsBackendContracts
signupWizard.headless
signupWizard.runtime
smartAssistant
smartAssistant.live
stabilityProtocol
standingOrderSchedulerHandler
standingOrderServerContract
standingOrderWebhookMigration
standingOrderWebhookRemediationContract
staticHtmlCacheControl
subscriptionAccessAdapter
subscriptionAccessContracts
subscriptionActivationContracts
subscriptionBillingApi
subscriptionBillingContracts
subscriptionUserManagementCompatibility
subscriptionUserManagementMigrationContracts
supabase.authRls
supabase.config
supabase.credentials
supabase.schemaContract
supabaseAuthClient
supabaseBuildCredentials
supabasePolicyHelperGrants
supabaseSecurityHardening
supplyChainPersistenceBoundaries
supportInboxClient
supportMetrics
supportOperations
supportPersistenceBoundaries
supportPolicyAuthenticatedRoles
supportTicketPersistence
supportWorkspaceContracts
tanzaniaPayrollContracts
teamInvitations
teamWorkforceSlice
tenantAuditViewer
traFiscal.provider
traGovernance
traPortalRoute
traVatAnomaly.trend
transactionalEmail
trialExpiryNotice
trialExpiryNoticeAdmin.integration
trpcAuthRecovery
vatReportTaxRate
vercelConfig
verifySupabaseSchemaBuildGuard
verticalCommandCenters
vite.hmr
webhooks
whatsAppSecurity
whatsappProvider
workforceAuthorizationMigration
workforceRoleAssignmentApprovalMigration
workspaceBranding
workspaceLexicalSafety
workspacePresenceRecoveryMigration
workspaceSessionRecovery
