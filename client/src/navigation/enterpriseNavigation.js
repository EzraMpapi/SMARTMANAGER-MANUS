import {
  Activity,
  BarChart3,
  Banknote,
  Bell,
  BriefcaseBusiness,
  Building2,
  ClipboardCheck,
  FileText,
  GitBranch,
  Globe2,
  HandCoins,
  Headphones,
  HeartPulse,
  Hotel,
  KanbanSquare,
  LayoutDashboard,
  Landmark,
  Megaphone,
  MessageSquare,
  Package,
  Pill,
  ReceiptText,
  School,
  Settings2,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Store,
  Tablets,
  Truck,
  UserCircle,
  Users,
  Users2,
  UtensilsCrossed,
  Wallet,
  Wrench,
} from "lucide-react";

/**
 * Single source of truth for the application shell navigation.
 * Runtime visibility is still decided by the existing role definition,
 * module entitlements, and server-confirmed subscription access.
 */
export const ENTERPRISE_NAVIGATION_GROUPS = [
  {
    id: "home",
    label: "Home",
    shortLabel: "Home",
    icon: LayoutDashboard,
    order: 10,
    items: [
      { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, order: 10, primaryFor: ["*"] },
      { id: "activity", label: "Activity Stream", icon: Activity, order: 20, primaryFor: ["Auditor"] },
    ],
  },
  {
    id: "sales-crm",
    label: "Sales & CRM",
    shortLabel: "Sales",
    icon: ShoppingCart,
    order: 20,
    items: [
      { id: "crm", label: "CRM", icon: Users, order: 10, primaryFor: ["Sales Manager", "Customer Support Agent"] },
      { id: "sales", label: "Sales", icon: ShoppingCart, order: 20, primaryFor: ["Sales Manager"] },
      { id: "marketing", label: "Marketing", icon: Megaphone, order: 30, primaryFor: ["Sales Manager"] },
      { id: "ecommerce", label: "E-Commerce", icon: Store, order: 40, primaryFor: ["Sales Manager"] },
      { id: "support", label: "Customer Support", icon: Headphones, order: 50, primaryFor: ["Customer Support Agent", "External Client"] },
    ],
  },
  {
    id: "operations",
    label: "Operations",
    shortLabel: "Ops",
    icon: Package,
    order: 30,
    items: [
      { id: "inventory", label: "Inventory", icon: Package, order: 10, primaryFor: ["Procurement Officer", "Warehouse Manager", "Pharmacist"] },
      { id: "procurement", label: "Procurement", icon: ClipboardCheck, order: 20, primaryFor: ["Procurement Officer"] },
      { id: "scm", label: "Supply Chain", icon: Truck, order: 30, primaryFor: ["Warehouse Manager"] },
      { id: "manufacturing", label: "Manufacturing", icon: Wrench, order: 40, primaryFor: ["Warehouse Manager"] },
      { id: "pos", label: "Point of Sale", icon: ShoppingBag, order: 50, primaryFor: ["Cashier", "Warehouse Manager"] },
      { id: "restaurant", label: "Restaurant & F&B", icon: UtensilsCrossed, order: 60, primaryFor: ["Organization Owner", "CEO"] },
      { id: "hotel", label: "Hotel & Hospitality", icon: Hotel, order: 70, primaryFor: ["Organization Owner", "CEO"] },
      { id: "fleet", label: "Fleet Management", icon: Truck, order: 80, primaryFor: ["Organization Owner", "CEO"] },
      { id: "property-management", label: "Property Management", icon: Building2, order: 90, primaryFor: ["Property Administrator", "Property Manager", "Tenant"] },
    ],
  },
  {
    id: "finance",
    label: "Finance",
    shortLabel: "Finance",
    icon: Wallet,
    order: 40,
    items: [
      { id: "finance", label: "Finance", icon: Wallet, order: 10, primaryFor: ["CFO", "Finance Manager", "Property Finance Officer"] },
      { id: "reports", label: "Reports", icon: BarChart3, order: 20, primaryFor: ["CFO", "Finance Manager", "Auditor"] },
      { id: "tra_portal", label: "TRA Portal", icon: ReceiptText, order: 30, primaryFor: ["CFO", "Finance Manager"] },
      { id: "banking", label: "Banking & MFI", icon: Landmark, order: 40, primaryFor: ["Institution Administrator", "Branch Manager"] },
      { id: "microfinance", label: "Microfinance", icon: HandCoins, order: 50, primaryFor: ["Institution Administrator", "Branch Manager"] },
      { id: "money-agent", label: "Money Agent", icon: Banknote, order: 60, primaryFor: ["Money Agent Manager", "Money Agent", "Customer"] },
      { id: "vicoba", label: "VICOBA / SACCOS", icon: Users2, order: 70, primaryFor: ["Organization Owner", "CEO"] },
      { id: "community", label: "Community Groups", icon: Users2, order: 80, primaryFor: ["Organization Owner", "CEO"] },
    ],
  },
  {
    id: "people",
    label: "People",
    shortLabel: "People",
    icon: Users,
    order: 50,
    items: [
      { id: "hr", label: "HR", icon: BriefcaseBusiness, order: 10, primaryFor: ["HR Manager"] },
      { id: "employee-portal", label: "Employee Portal", icon: UserCircle, order: 20, primaryFor: ["Employee", "HR Manager"] },
      { id: "documents", label: "Documents", icon: FileText, order: 30, primaryFor: ["HR Manager", "Project Manager"] },
      { id: "collaboration", label: "Collaboration Hub", icon: MessageSquare, order: 40, primaryFor: ["Customer Support Agent"] },
      { id: "projects", label: "Projects", icon: KanbanSquare, order: 50, primaryFor: ["Project Manager"] },
    ],
  },
  {
    id: "specialized",
    label: "Specialized",
    shortLabel: "Specialized",
    icon: HeartPulse,
    order: 60,
    items: [
      { id: "healthcare", label: "Healthcare / Clinic", icon: HeartPulse, order: 10, primaryFor: ["Clinic Administrator", "Doctor", "Nurse"] },
      { id: "pharmacy", label: "Pharmacy Management", icon: Tablets, order: 20, primaryFor: ["Pharmacist"] },
      { id: "school", label: "School Management", icon: School, order: 30, primaryFor: ["School Administrator"] },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    shortLabel: "Insights",
    icon: BarChart3,
    order: 70,
    items: [
      { id: "analytics", label: "Analytics", icon: BarChart3, order: 10, primaryFor: ["CFO", "Finance Manager", "CEO"] },
      { id: "ai", label: "AI Assistant", icon: Globe2, order: 20, primaryFor: ["*"] },
      { id: "notifications", label: "Notifications", icon: Bell, order: 30, primaryFor: ["*"] },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    shortLabel: "Admin",
    icon: Settings2,
    order: 80,
    items: [
      { id: "integrations", label: "Integration Hub", icon: Globe2, order: 10, primaryFor: ["Super Administrator", "Platform Administrator"] },
      { id: "workflows", label: "Workflow Studio", icon: GitBranch, order: 20, primaryFor: ["Super Administrator", "Platform Administrator"] },
      { id: "global-admin", label: "Global Admin Control Center", icon: ShieldCheck, order: 30, primaryFor: ["Super Administrator", "Platform Administrator"] },
      { id: "presentation", label: "Presentation Progress", icon: FileText, order: 35, primaryFor: ["Super Administrator", "Organization Owner", "CEO"] },
      { id: "profile", label: "Profile", icon: UserCircle, order: 40, primaryFor: ["*"] },
      { id: "settings", label: "Settings", icon: Settings2, order: 50, primaryFor: ["Super Administrator", "Organization Owner", "CEO", "HR Manager"] },
    ],
  },
];

export const NAVIGATION_ITEMS = ENTERPRISE_NAVIGATION_GROUPS.flatMap((group) =>
  group.items.map((item) => ({
    ...item,
    route: item.route || item.id,
    category: group.id,
    groupId: group.id,
    groupLabel: group.label,
    permissions: { view: item.id, create: item.id, manage: item.id },
    featureDependency: item.id,
  })),
);

export const QUICK_CREATE_ACTIONS = [
  { id: "new-invoice", label: "New Invoice", description: "Open Sales → Invoices", module: "sales", intent: { tab: "invoices", openForm: true }, icon: ReceiptText },
  { id: "new-expense", label: "Record Expense", description: "Open Finance → Expenses", module: "finance", intent: { tab: "expenses" }, icon: Wallet },
  { id: "new-lead", label: "New Lead", description: "Open CRM → Leads", module: "crm", intent: { tab: "leads" }, icon: Users },
  { id: "new-employee", label: "New Employee", description: "Open HR → Employees", module: "hr", intent: { tab: "employees" }, icon: UserCircle },
  { id: "new-sale", label: "New Sale", description: "Open Point of Sale", module: "pos", intent: {}, icon: ShoppingBag },
  { id: "new-purchase", label: "New Purchase", description: "Open Procurement", module: "procurement", intent: {}, icon: ClipboardCheck },
  { id: "new-product", label: "New Product", description: "Open Inventory", module: "inventory", intent: {}, icon: Package },
];

export function getNavigationGroups({ visibleModuleIds, currentRoleId, canSeeSettings = true }) {
  const visible = new Set(visibleModuleIds);
  return ENTERPRISE_NAVIGATION_GROUPS.map((group) => ({
    ...group,
    items: group.items
      .filter((item) => visible.has(item.id) || (item.id === "settings" && canSeeSettings) || item.id === "profile")
      .sort((a, b) => a.order - b.order)
      .map((item) => ({
        ...item,
        isPrimary: item.primaryFor?.includes("*") || item.primaryFor?.includes(currentRoleId),
      })),
  })).filter((group) => group.items.length > 0).sort((a, b) => a.order - b.order);
}

export function findNavigationItem(id) {
  return NAVIGATION_ITEMS.find((item) => item.id === id) || null;
}

export function getQuickCreateActions({ visibleModuleIds, canCreate }) {
  if (!canCreate) return [];
  const visible = new Set(visibleModuleIds);
  return QUICK_CREATE_ACTIONS.filter((action) => visible.has(action.module));
}

export function groupContainsActiveItem(group, activeId) {
  return group.items.some((item) => item.id === activeId);
}
