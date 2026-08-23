/* Extracted from BusinessSphereDashboard.jsx to keep Vercel source files below the direct-upload limit. */
export function createDashboardStaticData(deps) {
  const {
    Brain,
    Building2,
    ClipboardList,
    Factory,
    FileText,
    LayoutDashboard,
    MessageSquare,
    Package,
    ReceiptText,
    ShoppingBag,
    ShoppingCart,
    TrendingUp,
    Users,
    Wallet,
  } = deps;

const ACTIVITY_MODULE_COLORS = {
  "Finance": "#16A34A", "Sales": "#3B82F6", "Procurement": "#8B5CF6",
  "HR": "#F59E0B", "Inventory": "#06B6D4", "Workflow Studio": "#EC4899",
  "Point of Sale": "#10B981", "Security": "#EF4444", "CRM": "#F97316",
};

const BRIEFING_EXEC_ROLES = new Set([
  "Super Administrator","Organization Owner","CEO","COO","CFO","CMO","CTO",
  "Finance Manager","HR Manager","Sales Manager","Project Manager","Warehouse Manager",
]);

const ASSET_CATEGORIES = ["Vehicles", "Equipment", "Furniture & Fixtures", "Buildings", "Computers & IT"];

const EXPENSE_CATEGORIES_LIST = ["Rent & Utilities", "Salaries", "Logistics", "Marketing", "Supplies", "Professional Fees"];

const RECRUITMENT_STAGES = ["Applied", "Screening", "Interview", "Offer", "Hired", "Rejected"];

const TICKET_CATEGORIES = ["Billing", "Technical", "Product", "General"];

const KB_CATEGORIES = ["Getting Started", "Billing", "Shipping", "Returns", "Technical"];

const OFFICIAL_MARKETPLACE_TEMPLATES = [
  {
    id: "TPL-invoice-approval", name: "Invoice Approval Alert", category: "Finance", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "Notify a finance manager and log an audit entry whenever a significant invoice needs a second look before it goes out.",
    trigger: "manual",
    steps: [
      { id: "s1", type: "notify_slack", config: { message: "A new invoice needs review before sending — please check Sales > Invoices." } },
      { id: "s2", type: "log_audit", config: { note: "Invoice flagged for approval review" } },
    ],
  },
  {
    id: "TPL-onboarding", name: "Employee Onboarding Kit", category: "HR", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "Welcome a new hire, notify the team, and log the onboarding start — all in one run on their first day.",
    trigger: "manual",
    steps: [
      { id: "s1", type: "log_audit", config: { note: "Employee onboarding started" } },
      { id: "s2", type: "draft_email", config: { recipient: "", context: "Warmly welcome the new team member, outline their first-week schedule, and share who to contact with questions." } },
      { id: "s3", type: "notify_slack", config: { message: "Please welcome our newest team member — details in HR." } },
    ],
  },
  {
    id: "TPL-payroll", name: "Monthly Payroll Reminder", category: "Finance", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "A monthly checklist to run before payday: a Slack reminder plus a real P&L snapshot for reference. Doesn't process payroll itself — HR's own Process Payroll action does that (section 4).",
    trigger: "manual",
    steps: [
      { id: "s1", type: "notify_slack", config: { message: "Reminder: payroll is due — review HR > Payroll before processing." } },
      { id: "s2", type: "generate_report", config: { reportType: "Profit & Loss" } },
    ],
  },
  {
    id: "TPL-vat", name: "VAT Filing Preparation", category: "Finance", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "A monthly reminder plus a real financial snapshot to reference before filing — preparation only. See Finance's own VAT Summary for the actual computed figure and section 25's note on why real TRA filing needs credentials this app does not hold.",
    trigger: "manual",
    steps: [
      { id: "s1", type: "notify_slack", config: { message: "VAT return is due soon — check Finance > Tax for this period's summary." } },
      { id: "s2", type: "generate_report", config: { reportType: "Profit & Loss" } },
      { id: "s3", type: "log_audit", config: { note: "VAT filing preparation reminder sent" } },
    ],
  },
  {
    id: "TPL-followup", name: "Customer Follow-up", category: "Sales", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "The moment an overdue invoice is detected, draft a polite reminder and alert the sales team — using the exact same real overdue-invoice detection already powering your Notifications.",
    trigger: "overdue-invoices",
    steps: [
      { id: "s1", type: "draft_email", config: { recipient: "", context: "Politely remind the customer their invoice is now overdue and ask when payment can be expected." } },
      { id: "s2", type: "notify_slack", config: { message: "An overdue invoice needs a follow-up call — see Finance > Receivables." } },
    ],
  },
  {
    id: "TPL-replenishment", name: "Inventory Replenishment Alert", category: "Inventory", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "The moment stock runs low, alert procurement and log it — using the same real low-stock detection already powering your Notifications.",
    trigger: "low-stock",
    steps: [
      { id: "s1", type: "notify_slack", config: { message: "Stock has run low on one or more items — check Inventory for reorder recommendations." } },
      { id: "s2", type: "log_audit", config: { note: "Low-stock replenishment alert sent" } },
    ],
  },
  {
    id: "TPL-subscription", name: "Subscription Billing Reminder", category: "Sales", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "The moment a subscription is due for billing, draft the renewal email and notify the team — using the same real due-date detection already powering your Notifications.",
    trigger: "subscriptions-due",
    steps: [
      { id: "s1", type: "draft_email", config: { recipient: "", context: "Let the customer know their subscription is due for renewal and confirm the billing details." } },
      { id: "s2", type: "notify_slack", config: { message: "A subscription is due for billing — see Sales > Subscriptions." } },
    ],
  },
  {
    id: "TPL-leave-approval", name: "Leave Approval Alert", category: "HR", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "The moment a leave request needs approval, notify the approver and keep an audit record — using the same real pending-leave detection powering your Notifications.",
    trigger: "pending-leave",
    steps: [
      { id: "s1", type: "notify_teams", config: { message: "A leave request is waiting for approval — decide in HR > Leave." } },
      { id: "s2", type: "log_audit", config: { note: "Leave approval reminder dispatched" } },
    ],
  },
  {
    id: "TPL-asset-request", name: "Asset Request Log", category: "Operations", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "Run when someone requests equipment: notify operations and leave a real audit-trail record for the asset register.",
    trigger: "manual",
    steps: [
      { id: "s1", type: "notify_slack", config: { message: "New asset request — review against the Fixed Assets register." } },
      { id: "s2", type: "log_audit", config: { note: "Asset request submitted and recorded" } },
    ],
  },
  {
    id: "TPL-vehicle-booking", name: "Vehicle Booking Notice", category: "Operations", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "Run when a vehicle is requested: notify the fleet contact and record the booking request in the audit trail.",
    trigger: "manual",
    steps: [
      { id: "s1", type: "notify_teams", config: { message: "Vehicle booking requested — confirm availability and assign a driver." } },
      { id: "s2", type: "log_audit", config: { note: "Vehicle booking request recorded" } },
    ],
  },
  {
    id: "TPL-reimbursement", name: "Expense Reimbursement Watch", category: "Finance", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "When an unusual expense is detected, flag it for review before reimbursement — same real detection that powers your expense alerts.",
    trigger: "unusual-expenses",
    steps: [
      { id: "s1", type: "notify_slack", config: { message: "Unusual expense flagged — review in Finance > Payables before reimbursing." } },
      { id: "s2", type: "log_audit", config: { note: "Reimbursement review triggered by unusual-expense detection" } },
    ],
  },
  {
    id: "TPL-customer-onboarding", name: "Customer Onboarding", category: "Sales", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "Run for each new customer: draft the welcome email and record onboarding start — distinct from post-sale follow-up.",
    trigger: "manual",
    steps: [
      { id: "s1", type: "draft_email", config: { recipient: "", context: "Welcome the new customer, introduce their account contact, and explain how invoicing and support work" } },
      { id: "s2", type: "log_audit", config: { note: "Customer onboarding sequence started" } },
    ],
  },
  {
    id: "TPL-contract-approval", name: "Contract Approval Record", category: "Finance", isOfficial: true, installCount: 0, publisherName: "Official",
    description: "Route a contract for decision: notify the approver and record that the decision will carry a biometric signature in Approvals.",
    trigger: "manual",
    steps: [
      { id: "s1", type: "notify_teams", config: { message: "A contract is ready for approval — review and sign in Approvals." } },
      { id: "s2", type: "log_audit", config: { note: "Contract routed for approval — decision to be biometrically signed" } },
    ],
  },
];

const APPROVER_ROLES = new Set([
  "Super Administrator","Organization Owner","CEO","COO","CFO","CMO","CTO",
  "Finance Manager","HR Manager","Sales Manager","Procurement Officer","Warehouse Manager","Project Manager",
]);

const CMD_ITEMS = [
  // Navigation
  { type: "nav",    id: "dashboard",    label: "Go to Dashboard",          icon: "LayoutDashboard", mod: "dashboard" },
  { type: "nav",    id: "sales",        label: "Go to Sales",              icon: "ShoppingCart",    mod: "sales" },
  { type: "nav",    id: "pos",          label: "Go to Point of Sale",      icon: "Store",           mod: "pos" },
  { type: "nav",    id: "crm",          label: "Go to CRM",                icon: "Users",           mod: "crm" },
  { type: "nav",    id: "inventory",    label: "Go to Inventory",          icon: "Package",         mod: "inventory" },
  { type: "nav",    id: "procurement",  label: "Go to Procurement",        icon: "Truck",           mod: "procurement" },
  { type: "nav",    id: "finance",      label: "Go to Finance",            icon: "Wallet",          mod: "finance" },
  { type: "nav",    id: "hr",           label: "Go to HR",                 icon: "Users",           mod: "hr" },
  { type: "nav",    id: "manufacturing",label: "Go to Manufacturing",      icon: "Factory",         mod: "manufacturing" },
  { type: "nav",    id: "projects",     label: "Go to Projects",           icon: "Kanban",          mod: "projects" },
  { type: "nav",    id: "analytics",    label: "Go to Analytics",          icon: "BarChart3",       mod: "analytics" },
  { type: "nav",    id: "ai",           label: "Go to AI Assistant",       icon: "Brain",           mod: "ai" },
  { type: "nav",    id: "settings",     label: "Go to Settings",           icon: "Settings",        mod: "settings" },
  // Actions
  { type: "action", id: "new-invoice",  label: "New Invoice",              icon: "Plus",    tab: "invoices",  mod: "sales" },
  { type: "action", id: "new-quote",    label: "New Quotation",            icon: "Plus",    tab: "quotations",mod: "sales" },
  { type: "action", id: "new-expense",  label: "New Expense",              icon: "Plus",    tab: "expenses",  mod: "finance" },
  { type: "action", id: "new-customer", label: "Add Customer",             icon: "UserPlus",tab: "customers", mod: "crm" },
  { type: "action", id: "new-employee", label: "Add Employee",             icon: "UserPlus",tab: null,        mod: "hr" },
  { type: "action", id: "new-po",       label: "New Purchase Order",       icon: "Plus",    tab: "pos-orders",mod: "procurement" },
  { type: "action", id: "new-product",  label: "Add Product to Inventory", icon: "Plus",    tab: "stock",     mod: "inventory" },
  { type: "action", id: "journal-entry",label: "Post Journal Entry",       icon: "BookOpen",tab: "journal",   mod: "finance" },
  { type: "action", id: "run-payroll",  label: "Run Payroll",              icon: "Wallet",  tab: "payroll",   mod: "hr" },
  // Finance tabs
  { type: "nav",    id: "receivables",  label: "Finance &#8250; Receivables",icon: "Landmark",mod: "finance", tab: "receivables" },
  { type: "nav",    id: "ledger",       label: "Finance &#8250; General Ledger",icon: "FileText",mod: "finance", tab: "ledger" },
  { type: "nav",    id: "tax",          label: "Finance &#8250; Tax Center",icon: "Percent",mod: "finance",   tab: "tax" },
  { type: "nav",    id: "banking",      label: "Finance &#8250; Banking",   icon: "Banknote",mod: "finance",  tab: "banking" },
  { type: "nav",    id: "budgets",      label: "Finance &#8250; Budgets",   icon: "Target",  mod: "finance",  tab: "budgets" },
  { type: "nav",    id: "period-closes",label: "Finance &#8250; Period Closes",icon: "Lock",mod: "finance",  tab: "periods" },
  { type: "nav",    id: "recon",        label: "Finance &#8250; Bank Recon",icon: "GitBranch",mod: "finance", tab: "reconcile" },
];

const MFI_LOAN_PRODUCTS = [
  { id: "p1", name: "Business Loan", minAmount: 100, maxAmount: 10000, interestRate: 3, termMonths: 12, interestMethod: "flat" },
  { id: "p2", name: "Emergency Loan", minAmount: 50, maxAmount: 2000, interestRate: 5, termMonths: 3, interestMethod: "flat" },
  { id: "p3", name: "Group Loan", minAmount: 200, maxAmount: 5000, interestRate: 2.5, termMonths: 6, interestMethod: "reducing" },
  { id: "p4", name: "Agricultural Loan", minAmount: 500, maxAmount: 20000, interestRate: 2, termMonths: 8, interestMethod: "flat" },
  { id: "p5", name: "School Fees Loan", minAmount: 100, maxAmount: 3000, interestRate: 4, termMonths: 4, interestMethod: "flat" },
];

const MFI_CLIENT_SEED = [
  { id: "CLT-001", name: "Amina Rashidi", phone: "0712 345 678", national_id: "199001234567", gender: "Female", village: "Mwanza", joinedDate: "2025-01-10", status: "Active" },
  { id: "CLT-002", name: "John Makundi", phone: "0754 987 654", national_id: "198805678901", gender: "Male", village: "Dar es Salaam", joinedDate: "2025-02-15", status: "Active" },
  { id: "CLT-003", name: "Fatuma Saidi", phone: "0768 111 222", national_id: "199203456789", gender: "Female", village: "Arusha", joinedDate: "2025-03-01", status: "Active" },
  { id: "CLT-004", name: "Peter Mwangi", phone: "0745 333 444", national_id: "197804321098", gender: "Male", village: "Moshi", joinedDate: "2025-01-20", status: "Inactive" },
];

const MFI_LOAN_SEED = [
  { id: "LN-2025-001", clientId: "CLT-001", clientName: "Amina Rashidi", productId: "p1", productName: "Business Loan", principal: 2000, interestRate: 3, termMonths: 12, interestMethod: "flat", disbursedDate: "2025-01-15", status: "Active", amountPaid: 1050, missedPayments: 0 },
  { id: "LN-2025-002", clientId: "CLT-002", clientName: "John Makundi", productId: "p3", productName: "Group Loan", principal: 1500, interestRate: 2.5, termMonths: 6, interestMethod: "reducing", disbursedDate: "2025-02-20", status: "Active", amountPaid: 400, missedPayments: 1 },
  { id: "LN-2025-003", clientId: "CLT-003", clientName: "Fatuma Saidi", productId: "p5", productName: "School Fees Loan", principal: 800, interestRate: 4, termMonths: 4, interestMethod: "flat", disbursedDate: "2025-03-05", status: "Arrears", amountPaid: 100, missedPayments: 2 },
  { id: "LN-2025-004", clientId: "CLT-004", clientName: "Peter Mwangi", productId: "p2", productName: "Emergency Loan", principal: 500, interestRate: 5, termMonths: 3, interestMethod: "flat", disbursedDate: "2024-11-10", status: "Closed", amountPaid: 575, missedPayments: 0 },
];

const MARKETPLACE_CATEGORIES = ["All", "Finance", "HR", "Sales", "Inventory"];

const WA_TEMPLATES = [
  {
    id:"invoice",   label:"📄 Invoice Ready",
    subject:"Invoice from {company}",
    body:"Hello {name},\n\nYour invoice *{docId}* for *TZS {amount}* is ready.\nDue date: *{dueDate}*.\n\nPlease quote this reference when paying: *{ref}*\n\nThank you for your business!\n_{company}_",
  },
  {
    id:"reminder",  label:"⏰ Payment Reminder",
    subject:"Payment Reminder — {company}",
    body:"Hello {name},\n\nThis is a friendly reminder that invoice *{docId}* for *TZS {amount}* is now due.\n\nKindly arrange payment at your earliest convenience.\nPayment Reference: *{ref}*\n\nThank you!\n_{company}_",
  },
  {
    id:"receipt",   label:"✅ Payment Received",
    subject:"Payment Receipt — {company}",
    body:"Hello {name},\n\nWe have received your payment of *TZS {amount}*.\nReceipt No: *{ref}*\n\nThank you for your prompt payment!\n_{company}_",
  },
  {
    id:"order",     label:"📦 Order Confirmed",
    subject:"Order Confirmed — {company}",
    body:"Hello {name},\n\nYour order *{docId}* has been confirmed and is being processed.\nEstimated delivery: *{dueDate}*\n\nWe will keep you updated on the progress.\n_{company}_",
  },
  {
    id:"loyalty",   label:"🏆 Loyalty Reward",
    subject:"Your Loyalty Reward — {company}",
    body:"Hello {name},\n\n🎉 *Congratulations!*\n\nYou have been awarded *{tier}* loyalty status and enjoy *{discount}% OFF* all future orders!\n\nThank you for being a valued customer.\n_{company}_",
  },
  {
    id:"support",   label:"🛠 Support Update",
    subject:"Support Update — {company}",
    body:"Hello {name},\n\nYour support request has been received and is being handled by our team.\nTicket Ref: *{ref}*\n\nWe will get back to you shortly.\n_{company}_",
  },
  {
    id:"custom",    label:"✏ Custom Message",
    subject:"",
    body:"",
  },
];

const WHATSAPP_MESSAGE_SEED = [
  { id: 1, sender: "Juma Kassam", phone: "+255 715 234 567", text: "Hello, checking on our wholesale invoice payment status for Dar es Salaam branch.", time: "10:42 AM", unread: true, readReceipt: true, ageHours: 2 },
  { id: 2, sender: "Aisha Mohamed", phone: "+255 784 987 654", text: "Can we schedule a product delivery for Arusha warehouse tomorrow?", time: "09:15 AM", unread: false, readReceipt: true, ageHours: 4 },
  { id: 3, sender: "Baraka Enterprise", phone: "+255 754 112 233", text: "Sent bank deposit slip for the recent bulk order. Please confirm receipt.", time: "Yesterday", unread: true, readReceipt: false, ageHours: 26 },
];

const EMAIL_TEMPLATES = [
  {
    id:"invoice",    label:"📄 Invoice",
    subject:"Invoice {docId} from {company}",
    body:"Dear {name},\n\nPlease find attached your invoice {docId} for TZS {amount}.\n\nDue Date: {dueDate}\nPayment Reference: {ref}\n\nPayment Methods:\n• Bank Transfer: {bankName} — {bankAccount}\n• Mobile Money: {mpesa}\n\nPlease do not hesitate to contact us with any questions.\n\nKind regards,\n{senderName}\n{company}\n{phone}\n{email}",
  },
  {
    id:"reminder",   label:"⏰ Payment Reminder",
    subject:"Payment Reminder — Invoice {docId}",
    body:"Dear {name},\n\nThis is a friendly reminder that invoice {docId} for TZS {amount} was due on {dueDate} and remains outstanding.\n\nWe would appreciate your prompt attention to this matter. If you have already arranged payment, please disregard this notice and send us proof of payment.\n\nPayment Reference: {ref}\n\nIf you have any questions regarding this invoice, please do not hesitate to contact us.\n\nKind regards,\n{senderName}\n{company}",
  },
  {
    id:"statement",  label:"📊 Account Statement",
    subject:"Account Statement — {company} · {year}",
    body:"Dear {name},\n\nPlease find your account statement for {year} from {company}.\n\nSummary:\n• Total Invoiced: TZS {amount}\n• Loyalty Tier: {tier}\n• Loyalty Discount: {discount}% on future orders\n\nWe value your continued business and look forward to serving you.\n\nKind regards,\n{senderName}\n{company}",
  },
  {
    id:"welcome",    label:"👋 Welcome",
    subject:"Welcome to {company}!",
    body:"Dear {name},\n\nWelcome to {company}! We are thrilled to have you as our customer.\n\nAs a new customer, you have been registered in our system and will receive your first invoice shortly.\n\nShould you have any questions, please reach out to us at any time.\n\nWarm regards,\n{senderName}\n{company}\n{phone}",
  },
  {
    id:"loyalty",    label:"🏆 Loyalty Award",
    subject:"Congratulations — Your {tier} Loyalty Status!",
    body:"Dear {name},\n\nCongratulations!\n\nWe are delighted to inform you that you have been awarded {tier} loyalty status with {company}.\n\nAs a {tier} member, you are entitled to a {discount}% discount on all future orders.\n\nThank you sincerely for your outstanding loyalty and business.\n\nWith appreciation,\n{senderName}\n{company}",
  },
  {
    id:"custom",     label:"✏ Compose",
    subject:"",
    body:"",
  },
];

const CALENDAR_CATEGORIES = [
  { id: "meetings", label: "Meetings & Events", color: "#16A34A" },
  { id: "leave", label: "Leave Schedules", color: "#F59E0B" },
  { id: "production", label: "Production Plans", color: "#5B6472" },
  { id: "sales", label: "Sales Activities", color: "#22C55E" },
  { id: "payments", label: "Payment Due Dates", color: "#EF4444" },
  { id: "tax", label: "Tax Deadlines", color: "#0EA5E9" },
];

const CONGRATS_TEMPLATES = [
  {
    id: "loyalty",
    label: "Top Buyer Award",
    icon: "🏆",
    subject: "Certificate of Customer Excellence",
    body: "On behalf of {company}, we are delighted to recognise {recipient} as one of our most valued customers.\n\nYour exceptional loyalty and consistent business partnership have been instrumental in our growth journey. This year, you have demonstrated outstanding commitment that sets you apart as a truly distinguished partner.\n\nWe are proud to award you our {tier} status, which comes with exclusive benefits including a {discount}% loyalty discount on all future orders.\n\nThank you for choosing us as your trusted business partner. We look forward to continuing this remarkable relationship and creating even greater success together.",
    accent: "#D97706",
    footer: "This letter is a token of our sincere appreciation.",
  },
  {
    id: "partnership",
    label: "Business Partnership",
    icon: "🤝",
    subject: "Letter of Partnership Recognition",
    body: "Dear {recipient},\n\nIt is with great pleasure that {company} formally recognises and celebrates the outstanding partnership we share with you.\n\nSince the beginning of our collaboration, you have consistently demonstrated the qualities that define a truly exceptional business partner — reliability, integrity, and a shared commitment to excellence.\n\nThis recognition is a reflection of our deep appreciation for your trust in our products and services. We are committed to continuing to deliver the highest standards of quality and service that you deserve.\n\nWe look forward to many more years of successful partnership and shared growth.",
    accent: "#2563EB",
    footer: "Wishing you continued success in all your endeavours.",
  },
  {
    id: "achievement",
    label: "Staff Achievement",
    icon: "⭐",
    subject: "Certificate of Achievement",
    body: "Dear {recipient},\n\nOn behalf of the entire team at {company}, I am delighted to congratulate you on your outstanding achievement and exceptional contribution.\n\nYour dedication, hard work, and commitment to excellence have not gone unnoticed. You have consistently gone above and beyond what is expected, and your positive impact on our organisation is truly remarkable.\n\nThis recognition is a testament to your talent, perseverance, and professional excellence. You are an inspiration to your colleagues and a cornerstone of our success.\n\nThank you for your invaluable contribution. We are proud to have you as part of our team.",
    accent: "#16A34A",
    footer: "Keep up the excellent work — the best is yet to come.",
  },
  {
    id: "seasonal",
    label: "Season's Greetings",
    icon: "🎄",
    subject: "Season's Greetings & Best Wishes",
    body: "Dear {recipient},\n\nAs the year draws to a close, we at {company} take this moment to express our heartfelt gratitude for your partnership and support throughout the year.\n\nThis year has been a journey of growth, challenges, and achievements — all made more rewarding by partners like you. Your trust in us has been our greatest motivation.\n\nWe wish you and your team a wonderful festive season filled with joy, good health, and well-deserved rest. May the coming year bring you continued success, prosperity, and happiness in all your endeavours.\n\nWith warm regards and sincere appreciation for your partnership.",
    accent: "#7C3AED",
    footer: "Thank you for an outstanding year together.",
  },
  {
    id: "anniversary",
    label: "Business Anniversary",
    icon: "🎂",
    subject: "Celebrating Our Partnership Anniversary",
    body: "Dear {recipient},\n\nToday, we celebrate a very special milestone — the anniversary of our partnership with {recipient}.\n\nLooking back over the years, we are filled with pride and gratitude for the journey we have shared together. Your loyalty, trust, and continued support have been the foundation upon which we have built our success.\n\nThis partnership is more than a business relationship — it is a bond built on mutual respect, shared values, and a commitment to excellence that we both hold dear.\n\nHere is to many more years of collaboration, growth, and shared achievement. Thank you for being an extraordinary partner.",
    accent: "#EF4444",
    footer: "Celebrating the milestones we have achieved together.",
  },
];

const PASSKEY_READINESS_ROLES = new Set(["owner", "Owner", "Organization Owner", "CEO", "Super Administrator", "System Administrator"]);

const SMS_CATEGORIES = ["General", "Debt Reminder", "Promotion", "Notification", "Greeting"];

const COMPANY_CATEGORIES = [
  "Agriculture", "Auto / Parts", "Bakery", "Beauty Parlour", "Cable Operator", "Catering", "Clothing",
  "Computer Services", "Construction", "Consulting", "Cosmetics", "Dairy Products", "Education",
  "Electronics", "Entertainment", "Fashion Accessories", "Financial Services", "Fishing",
  "Food & Beverages", "Footwear", "Fresh House", "Fruits & Vegetables", "Furniture", "Garage",
  "Gift & Toys", "Grocery", "Handicrafts", "Hardware", "Healthcare & Pharmacy", "Hospitality & Tourism",
  "Hostel", "Hotel", "Information Technology", "Jewellery", "Kitchen Utensils", "Laundry",
  "Legal Services", "Logistics & Transport", "Maintenance Services", "Manufacturing",
  "Medical & Healthcare", "Mill", "Mobile & Accessories", "Music", "Non Profit", "Nursery", "Online",
  "Personal", "Petroleum", "Pet Stores", "Photo Studio", "Poultry", "Printing",
  "Professional Services", "Religious Store", "Restaurant & Cafe", "Retail & Wholesale", "Salon",
  "Security Services", "Sports & Fitness", "Stationery", "Street Foods", "Sweet Shop", "Tailoring",
  "Technology", "Textiles", "Tours & Travel", "Transportation", "Veterinary", "Waste Collection",
  "Water Jars", "Other",
];

const ONBOARDING_MODULES = [
  { id: "finance", label: "Finance", icon: Wallet },
  { id: "hr", label: "HR & Payroll", icon: Users },
  { id: "crm", label: "CRM", icon: Building2 },
  { id: "inventory", label: "Inventory", icon: Package },
  { id: "procurement", label: "Procurement", icon: ClipboardList },
  { id: "sales", label: "Sales & POS", icon: ReceiptText },
  { id: "projects", label: "Projects", icon: FileText },
  { id: "manufacturing", label: "Manufacturing", icon: Factory },
  { id: "analytics", label: "Analytics", icon: TrendingUp },
];

const VICOBA_MEMBER_SEED = [
  { id: "MBR-001", name: "Amina Hassan",   phone: "0712-345-678", shares: 24, contributions: 480, joinedDate: "2024-01-15", status: "Active",  gender: "F" },
  { id: "MBR-002", name: "John Mwangi",    phone: "0756-789-012", shares: 18, contributions: 360, joinedDate: "2024-01-15", status: "Active",  gender: "M" },
  { id: "MBR-003", name: "Fatuma Juma",    phone: "0783-456-123", shares: 30, contributions: 600, joinedDate: "2024-02-01", status: "Active",  gender: "F" },
  { id: "MBR-004", name: "Peter Kamau",    phone: "0622-111-222", shares: 12, contributions: 240, joinedDate: "2024-03-10", status: "Active",  gender: "M" },
  { id: "MBR-005", name: "Grace Mwenda",   phone: "0769-333-444", shares: 20, contributions: 400, joinedDate: "2024-01-15", status: "Active",  gender: "F" },
  { id: "MBR-006", name: "David Odhiambo", phone: "0744-555-666", shares: 8,  contributions: 160, joinedDate: "2024-04-05", status: "Defaulter",gender: "M" },
];

const VICOBA_LOAN_SEED = [
  { id: "VL-001", memberId: "MBR-001", memberName: "Amina Hassan",   amount: 500,  rate: 10, weeks: 12, disbursed: "2026-01-15", status: "Active",    balance: 280 },
  { id: "VL-002", memberId: "MBR-003", memberName: "Fatuma Juma",    amount: 1000, rate: 10, weeks: 24, disbursed: "2026-02-01", status: "Active",    balance: 650 },
  { id: "VL-003", memberId: "MBR-002", memberName: "John Mwangi",    amount: 300,  rate: 10, weeks: 8,  disbursed: "2025-11-10", status: "Repaid",    balance: 0   },
  { id: "VL-004", memberId: "MBR-006", memberName: "David Odhiambo", amount: 200,  rate: 10, weeks: 8,  disbursed: "2025-12-01", status: "Defaulted", balance: 180 },
];

const VICOBA_MEETING_SEED = [
  { id: "MTG-001", date: "2026-07-07", venue: "Community Hall", attendees: 5, totalBuyIn: 240, loansGiven: 1, minutes: "Reviewed Q2 performance. Elected new treasurer. Approved 1 loan application." },
  { id: "MTG-002", date: "2026-06-30", venue: "Chairperson's House", attendees: 6, totalBuyIn: 288, loansGiven: 0, minutes: "Annual dividend discussion. All members present. Fine collected from 1 member." },
];

const HC_PATIENTS_SEED = [
  { id:"PT-001", mrn:"MRN-001-000001", firstName:"Mohammed", lastName:"Al Qahtani", gender:"Male", dob:"1990-03-14", age:36, bloodType:"O+", marital:"Married", status:"Stable", phone:"0501234567", email:"m.qahtani@email.com", nationalId:"1234567890", nationality:"Saudi", occupation:"Engineer", allergies:"Penicillin", chronicDiseases:"Hypertension", notes:"" },
  { id:"PT-002", mrn:"MRN-001-000002", firstName:"Noura", lastName:"Al Dossari", gender:"Female", dob:"1993-07-22", age:33, bloodType:"A+", marital:"Single", status:"Stable", phone:"0507654321", email:"n.dossari@email.com", nationalId:"2345678901", nationality:"Saudi", occupation:"Teacher", allergies:"None", chronicDiseases:"None", notes:"" },
  { id:"PT-003", mrn:"MRN-001-000003", firstName:"Yousef", lastName:"Al Mutairi", gender:"Male", dob:"1985-11-05", age:40, bloodType:"B-", marital:"Married", status:"Urgent", phone:"0551112233", email:"y.mutairi@email.com", nationalId:"3456789012", nationality:"Saudi", occupation:"Business Owner", allergies:"Sulfa drugs", chronicDiseases:"Diabetes Type 2", notes:"Monitor blood sugar weekly" },
  { id:"PT-004", mrn:"MRN-001-000004", firstName:"Leonardo", lastName:"Bacha", gender:"Male", dob:"1988-09-30", age:37, bloodType:"A+", marital:"Single", status:"Stable", phone:"5522336699", email:"admin@studies.com", nationalId:"121545", nationality:"Philipian", occupation:"", allergies:"None", chronicDiseases:"None", notes:"" },
];

const HC_DOCTORS_SEED = [
  { id:"DR-001", firstName:"Ahmed", lastName:"Al Ghamdi", gender:"Male", specialty:"Cardiology", dept:"Cardiology", license:"LIC-1001", qualifications:"MD, FACC", fee:300, experience:12, phone:"0509876543", email:"a.ghamdi@clinic.com", status:"Active", bio:"Senior cardiologist with 12 years experience." },
  { id:"DR-002", firstName:"Layla", lastName:"Al Zahrani", gender:"Female", specialty:"General Medicine", dept:"General Medicine", license:"LIC-1002", qualifications:"MBBS, DFM", fee:250, experience:8, phone:"0558887766", email:"l.zahrani@clinic.com", status:"Active", bio:"Family medicine specialist." },
];

const HC_APPTS_SEED = [
  { id:"APT-001", patientId:"PT-001", patient:"Mohammed Al Qahtani", doctorId:"DR-001", doctor:"Dr. Ahmed Al Ghamdi", type:"Consultation", start:"2026-07-16T09:00", end:"2026-07-16T09:30", fee:300, reason:"Chest pain follow-up", status:"Confirmed", notes:"" },
  { id:"APT-002", patientId:"PT-002", patient:"Noura Al Dossari", doctorId:"DR-002", doctor:"Dr. Layla Al Zahrani", type:"Check-up", start:"2026-07-17T10:00", end:"2026-07-17T10:30", fee:250, reason:"Annual check-up", status:"Scheduled", notes:"" },
];

const HC_VISITS_SEED = [
  { id:"V-0001", patientId:"PT-001", patient:"Mohammed Al Qahtani", doctorId:"DR-001", doctor:"Dr. Ahmed Al Ghamdi", date:"2026-07-03T14:32", status:"Closed", diagnosis:"Hypertension management", notes:"BP controlled. Continue medication." },
];

const HC_PRESCRIPTIONS_SEED = [
  { id:"RX-001", patientId:"PT-002", patient:"Noura Al Dossari", doctorId:"DR-002", doctor:"Dr. Layla Al Zahrani", date:"2026-07-03", drugs:[{ name:"Amlodipine 5mg", dosage:"5mg", frequency:"2x/day", days:6, qty:1, instructions:"After meals" }], notes:"", status:"Active" },
];

const HC_REPORTS_SEED = [
  { id:"RPT-001", visitId:"V-0001", patientId:"PT-001", patient:"Mohammed Al Qahtani", doctorId:"DR-001", doctor:"Dr. Ahmed Al Ghamdi", title:"Consultation Summary", description:"Patient presents with controlled hypertension. BP reading 130/85. Continue current medications and dietary modifications. Follow-up in 3 months.", date:"2026-07-03", status:"Signed" },
];

const HC_LAB_CATEGORIES = [
  { id:"LC-01", name:"Biochemistry", nameAr:"الكيمياء الحيوية" },
  { id:"LC-02", name:"Diabetes", nameAr:"السكري" },
  { id:"LC-03", name:"Hematology (Blood)", nameAr:"أمراض الدم" },
  { id:"LC-04", name:"Lipid Profile", nameAr:"الدهون" },
  { id:"LC-05", name:"Liver Function", nameAr:"وظائف الكبد" },
  { id:"LC-06", name:"Kidney Function", nameAr:"وظائف الكلى" },
  { id:"LC-07", name:"Thyroid", nameAr:"الغدة الدرقية" },
  { id:"LC-08", name:"Electrolytes", nameAr:"الأملاح" },
  { id:"LC-09", name:"Vitamins", nameAr:"الفيتامينات" },
  { id:"LC-10", name:"Inflammation", nameAr:"الالتهابات" },
  { id:"LC-11", name:"Cardiac", nameAr:"القلب" },
  { id:"LC-12", name:"Urine", nameAr:"البول" },
];

const VITAL_SEED = [
  { id:"V001", patientId:"PT-001", patient:"Mohammed Al Qahtani", date:"2026-07-16", bp:"130/85", pulse:72, temp:36.8, weight:82, height:175, spo2:98, respiratoryRate:16, pain:2, nurse:"Nurse Hana", notes:"Stable vitals" },
  { id:"V002", patientId:"PT-003", patient:"Yousef Al Mutairi",   date:"2026-07-16", bp:"145/95", pulse:88, temp:37.2, weight:95, height:178, spo2:96, respiratoryRate:18, pain:5, nurse:"Nurse Hana", notes:"Elevated BP, referred to doctor" },
];

const RADIOLOGY_SEED = [
  { id:"RAD-001", patientId:"PT-001", patient:"Mohammed Al Qahtani", type:"X-Ray", region:"Chest", doctor:"Dr. Ahmed Al Ghamdi", date:"2026-07-10", status:"Reported", findings:"No acute cardiopulmonary disease. Clear lung fields.", priority:"Routine" },
  { id:"RAD-002", patientId:"PT-003", patient:"Yousef Al Mutairi",   type:"CT Scan", region:"Abdomen", doctor:"Dr. Layla Al Zahrani", date:"2026-07-14", status:"Pending", findings:"", priority:"Urgent" },
];

const SCH_STUDENTS_SEED = [
  { id:"STU-001", admNo:"ADM-2024-001", name:"Amani Juma",       gender:"M", class:"Form 3A", dob:"2009-05-12", parent:"Juma Hassan",   phone:"0712-001-001", balance:150,  status:"Active",   photo:"" },
  { id:"STU-002", admNo:"ADM-2024-002", name:"Neema Mwangi",     gender:"F", class:"Form 1B", dob:"2011-02-20", parent:"Mwangi Peter",  phone:"0756-002-002", balance:0,    status:"Active",   photo:"" },
  { id:"STU-003", admNo:"ADM-2024-003", name:"Baraka Kimani",    gender:"M", class:"Form 4A", dob:"2007-09-15", parent:"Kimani Alice",  phone:"0722-003-003", balance:300,  status:"Active",   photo:"" },
  { id:"STU-004", admNo:"ADM-2024-004", name:"Zawadi Ochieng",   gender:"F", class:"Form 2A", dob:"2010-07-30", parent:"Ochieng Grace", phone:"0733-004-004", balance:0,    status:"Active",   photo:"" },
  { id:"STU-005", admNo:"ADM-2024-005", name:"Tumaini Luvuno",   gender:"M", class:"Form 3B", dob:"2008-12-01", parent:"Luvuno Mary",   phone:"0744-005-005", balance:450,  status:"Inactive", photo:"" },
];

const SCH_TEACHERS_SEED = [
  { id:"TCH-001", name:"Mr. Kamau Njoroge",  subject:"Mathematics",     qualification:"B.Ed Maths",    experience:8,  phone:"0712-100-001", status:"Active",  salary:850  },
  { id:"TCH-002", name:"Ms. Fatuma Ally",    subject:"English Language", qualification:"B.A English",   experience:5,  phone:"0756-100-002", status:"Active",  salary:750  },
  { id:"TCH-003", name:"Mr. John Owino",     subject:"Biology",          qualification:"B.Sc Biology",  experience:12, phone:"0722-100-003", status:"Active",  salary:950  },
  { id:"TCH-004", name:"Ms. Grace Mutua",    subject:"Chemistry",        qualification:"B.Sc Chemistry",experience:7,  phone:"0733-100-004", status:"Active",  salary:900  },
  { id:"TCH-005", name:"Mr. Hassan Salim",   subject:"Kiswahili",        qualification:"B.Ed Kiswahili",experience:10, phone:"0744-100-005", status:"Active",  salary:800  },
];

const SCH_CLASSES_SEED = [
  { id:"CLS-001", name:"Form 1A", stream:"A", level:"Form 1", students:38, teacher:"Ms. Fatuma Ally",    room:"Room 101", capacity:40 },
  { id:"CLS-002", name:"Form 1B", stream:"B", level:"Form 1", students:36, teacher:"Mr. Hassan Salim",   room:"Room 102", capacity:40 },
  { id:"CLS-003", name:"Form 2A", stream:"A", level:"Form 2", students:42, teacher:"Ms. Grace Mutua",    room:"Room 201", capacity:45 },
  { id:"CLS-004", name:"Form 3A", stream:"A", level:"Form 3", students:39, teacher:"Mr. Kamau Njoroge",  room:"Room 301", capacity:40 },
  { id:"CLS-005", name:"Form 3B", stream:"B", level:"Form 3", students:35, teacher:"Mr. John Owino",     room:"Room 302", capacity:40 },
  { id:"CLS-006", name:"Form 4A", stream:"A", level:"Form 4", students:30, teacher:"Mr. Kamau Njoroge",  room:"Room 401", capacity:40 },
];

const SCH_EXAMS_SEED = [
  { id:"EXM-001", name:"Mid-Term Exam 1",   term:"Term 1 2026", class:"Form 3A", subject:"Mathematics", date:"2026-03-15", maxMarks:100, avgScore:68, passRate:82, status:"Completed" },
  { id:"EXM-002", name:"End-Term Exam 1",   term:"Term 1 2026", class:"Form 3A", subject:"Biology",     date:"2026-04-20", maxMarks:100, avgScore:74, passRate:88, status:"Completed" },
  { id:"EXM-003", name:"Mid-Term Exam 2",   term:"Term 2 2026", class:"Form 4A", subject:"Chemistry",   date:"2026-07-10", maxMarks:100, avgScore:0,  passRate:0,  status:"Scheduled" },
];

const SCH_FEES_SEED = [
  { id:"FEE-001", studentId:"STU-001", student:"Amani Juma",    class:"Form 3A", term:"Term 2 2026", amount:450, paid:300, balance:150, dueDate:"2026-07-01", status:"Partial" },
  { id:"FEE-002", studentId:"STU-002", student:"Neema Mwangi",  class:"Form 1B", term:"Term 2 2026", amount:450, paid:450, balance:0,   dueDate:"2026-07-01", status:"Paid"    },
  { id:"FEE-003", studentId:"STU-003", student:"Baraka Kimani", class:"Form 4A", term:"Term 2 2026", amount:500, paid:200, balance:300, dueDate:"2026-07-01", status:"Partial" },
  { id:"FEE-004", studentId:"STU-004", student:"Zawadi Ochieng",class:"Form 2A", term:"Term 2 2026", amount:450, paid:450, balance:0,   dueDate:"2026-07-01", status:"Paid"    },
  { id:"FEE-005", studentId:"STU-005", student:"Tumaini Luvuno",class:"Form 3B", term:"Term 2 2026", amount:450, paid:0,   balance:450, dueDate:"2026-07-01", status:"Unpaid"  },
];

const SCH_BOOKS_SEED = [
  { id:"LIB-001", title:"Advanced Mathematics F4",   author:"K. Njoroge",     isbn:"978-9966-25-001-1", copies:12, available:8,  category:"Textbook",  shelf:"S-A1" },
  { id:"LIB-002", title:"Biology for Secondary",     author:"WHO Tanzania",   isbn:"978-9966-25-002-2", copies:20, available:15, category:"Textbook",  shelf:"S-B2" },
  { id:"LIB-003", title:"History of East Africa",    author:"A. Atieno",      isbn:"978-9966-25-003-3", copies:8,  available:8,  category:"Reference", shelf:"S-C1" },
  { id:"LIB-004", title:"Kiswahili Fasili Form 3",   author:"TAMISEMI",       isbn:"978-9966-25-004-4", copies:30, available:22, category:"Textbook",  shelf:"S-D3" },
  { id:"LIB-005", title:"Chemistry Practical Guide", author:"M. Wanjiku",     isbn:"978-9966-25-005-5", copies:10, available:3,  category:"Textbook",  shelf:"S-B1" },
];

const SCH_TRANSPORT_SEED = [
  { id:"BUS-001", route:"Route 1 — Kariakoo",   bus:"TZA 234 B", driver:"Ali Hassan",   students:28, departure:"6:30 AM", return:"5:00 PM", status:"Active" },
  { id:"BUS-002", route:"Route 2 — Kinondoni",  bus:"TZA 567 C", driver:"John Mwenda",  students:32, departure:"6:45 AM", return:"5:15 PM", status:"Active" },
  { id:"BUS-003", route:"Route 3 — Tabata",     bus:"TZA 890 D", driver:"Peter Salim",  students:25, departure:"6:15 AM", return:"4:45 PM", status:"Active" },
];

const PHM_DRUGS_SEED = [
  { id:"DRG-001", name:"Amoxicillin 500mg",    genericName:"Amoxicillin",    category:"Antibiotic",    form:"Capsule", strength:"500mg", manufacturer:"Shelys Pharma",   price:0.8,  unitCost:0.4,  controlled:false, requiresRx:true  },
  { id:"DRG-002", name:"Paracetamol 500mg",    genericName:"Paracetamol",    category:"Analgesic",     form:"Tablet",  strength:"500mg", manufacturer:"Beta Healthcare",  price:0.3,  unitCost:0.15, controlled:false, requiresRx:false },
  { id:"DRG-003", name:"Metformin 500mg",      genericName:"Metformin",      category:"Antidiabetic",  form:"Tablet",  strength:"500mg", manufacturer:"Zenufa Labs",     price:0.5,  unitCost:0.2,  controlled:false, requiresRx:true  },
  { id:"DRG-004", name:"Atorvastatin 10mg",    genericName:"Atorvastatin",   category:"Statin",        form:"Tablet",  strength:"10mg",  manufacturer:"Shelys Pharma",   price:1.2,  unitCost:0.6,  controlled:false, requiresRx:true  },
  { id:"DRG-005", name:"Amlodipine 5mg",       genericName:"Amlodipine",     category:"Antihypertensive",form:"Tablet",strength:"5mg",  manufacturer:"CiplaQCIL",       price:0.9,  unitCost:0.45, controlled:false, requiresRx:true  },
  { id:"DRG-006", name:"Insulin Glargine 3ml", genericName:"Insulin Glargine",category:"Insulin",     form:"Injection",strength:"100IU/ml",manufacturer:"Novo Nordisk", price:45.0, unitCost:32.0, controlled:false, requiresRx:true  },
  { id:"DRG-007", name:"Azithromycin 500mg",   genericName:"Azithromycin",   category:"Antibiotic",    form:"Tablet",  strength:"500mg", manufacturer:"Zenufa Labs",     price:2.5,  unitCost:1.2,  controlled:false, requiresRx:true  },
  { id:"DRG-008", name:"Omeprazole 20mg",      genericName:"Omeprazole",     category:"PPI",           form:"Capsule", strength:"20mg",  manufacturer:"Beta Healthcare",  price:0.6,  unitCost:0.25, controlled:false, requiresRx:false },
  { id:"DRG-009", name:"Diazepam 5mg",         genericName:"Diazepam",       category:"Sedative",      form:"Tablet",  strength:"5mg",   manufacturer:"CiplaQCIL",       price:0.4,  unitCost:0.2,  controlled:true,  requiresRx:true  },
  { id:"DRG-010", name:"Salbutamol Inhaler",   genericName:"Salbutamol",     category:"Bronchodilator",form:"Inhaler", strength:"100mcg",manufacturer:"GlaxoSmithKline", price:12.0, unitCost:8.0,  controlled:false, requiresRx:true  },
];

const PHM_STOCK_SEED = [
  { id:"STK-001", drugId:"DRG-001", drug:"Amoxicillin 500mg",    batchNo:"B2024-001", qty:500,  minQty:50,  expiry:"2026-12-31", received:"2024-06-01", supplier:"Shelys Pharma",   unitCost:0.4  },
  { id:"STK-002", drugId:"DRG-002", drug:"Paracetamol 500mg",    batchNo:"B2024-002", qty:1200, minQty:100, expiry:"2027-03-15", received:"2024-07-01", supplier:"Beta Healthcare", unitCost:0.15 },
  { id:"STK-003", drugId:"DRG-003", drug:"Metformin 500mg",      batchNo:"B2024-003", qty:300,  minQty:50,  expiry:"2026-09-30", received:"2024-05-01", supplier:"Zenufa Labs",     unitCost:0.2  },
  { id:"STK-004", drugId:"DRG-004", drug:"Atorvastatin 10mg",    batchNo:"B2024-004", qty:200,  minQty:30,  expiry:"2026-08-31", received:"2024-04-15", supplier:"Shelys Pharma",   unitCost:0.6  },
  { id:"STK-005", drugId:"DRG-005", drug:"Amlodipine 5mg",       batchNo:"B2024-005", qty:450,  minQty:50,  expiry:"2026-11-30", received:"2024-06-15", supplier:"CiplaQCIL",       unitCost:0.45 },
  { id:"STK-006", drugId:"DRG-006", drug:"Insulin Glargine 3ml", batchNo:"B2024-006", qty:40,   minQty:10,  expiry:"2026-07-31", received:"2024-07-01", supplier:"Novo Nordisk",    unitCost:32.0 },
  { id:"STK-007", drugId:"DRG-007", drug:"Azithromycin 500mg",   batchNo:"B2024-007", qty:180,  minQty:20,  expiry:"2025-10-31", received:"2023-10-01", supplier:"Zenufa Labs",     unitCost:1.2  },
  { id:"STK-008", drugId:"DRG-008", drug:"Omeprazole 20mg",      batchNo:"B2024-008", qty:600,  minQty:60,  expiry:"2027-06-30", received:"2024-06-01", supplier:"Beta Healthcare", unitCost:0.25 },
  { id:"STK-009", drugId:"DRG-009", drug:"Diazepam 5mg",         batchNo:"B2024-009", qty:100,  minQty:20,  expiry:"2026-04-30", received:"2024-01-15", supplier:"CiplaQCIL",       unitCost:0.2  },
  { id:"STK-010", drugId:"DRG-010", drug:"Salbutamol Inhaler",   batchNo:"B2024-010", qty:35,   minQty:10,  expiry:"2027-01-31", received:"2024-07-01", supplier:"GlaxoSmithKline", unitCost:8.0  },
];

const PHM_DISPENSE_SEED = [
  { id:"DIS-001", patient:"Mohammed Al Qahtani", drug:"Amoxicillin 500mg", qty:21,  dosage:"1 TID × 7 days",  price:16.8, prescriber:"Dr. Ahmed Al Ghamdi", date:"2026-07-16", status:"Dispensed", rxNo:"RX-001" },
  { id:"DIS-002", patient:"Noura Al Dossari",    drug:"Amlodipine 5mg",    qty:30,  dosage:"1 OD × 30 days",  price:27.0, prescriber:"Dr. Layla Al Zahrani", date:"2026-07-17", status:"Dispensed", rxNo:"RX-002" },
  { id:"DIS-003", patient:"Yousef Al Mutairi",   drug:"Metformin 500mg",   qty:60,  dosage:"1 BD × 30 days",  price:30.0, prescriber:"Dr. Layla Al Zahrani", date:"2026-07-18", status:"Pending",   rxNo:"RX-003" },
];

const PHM_SUPPLIERS_SEED = [
  { id:"SUP-001", name:"Shelys Pharma Ltd",      contact:"Charles Mwenda",  phone:"022-123-4567", email:"orders@shelys.co.tz",      terms:"Net 30", status:"Active", lastOrder:"2024-07-01" },
  { id:"SUP-002", name:"Beta Healthcare",        contact:"Miriam Wanjiku",  phone:"022-234-5678", email:"supply@betahealthcare.co.tz",terms:"Net 21", status:"Active", lastOrder:"2024-07-01" },
  { id:"SUP-003", name:"Zenufa Laboratories",    contact:"Hassan Salim",    phone:"022-345-6789", email:"info@zenufa.co.tz",          terms:"Net 45", status:"Active", lastOrder:"2024-06-15" },
  { id:"SUP-004", name:"CiplaQCIL Tanzania",     contact:"Grace Otieno",    phone:"022-456-7890", email:"tz@ciplaQCIL.com",            terms:"Net 30", status:"Active", lastOrder:"2024-06-01" },
  { id:"SUP-005", name:"Novo Nordisk EA",        contact:"Peter Kamau",     phone:"022-567-8901", email:"orders@novonordisk.co.tz",   terms:"Net 60", status:"Active", lastOrder:"2024-07-01" },
];

const DRUG_CATEGORIES = ["Antibiotic","Analgesic","Antidiabetic","Antihypertensive","Statin","PPI","Insulin","Sedative","Bronchodilator","Antihistamine","Antifungal","Antimalarial","Vitamin","Supplement","IV Fluid"];

const HTL_ROOMS_SEED = [
  { id:"RM-101", number:"101", type:"Standard",   floor:1, beds:1, price:85,  status:"Available", amenities:["AC","WiFi","TV"] },
  { id:"RM-102", number:"102", type:"Standard",   floor:1, beds:2, price:95,  status:"Occupied",  amenities:["AC","WiFi","TV"] },
  { id:"RM-201", number:"201", type:"Deluxe",     floor:2, beds:1, price:130, status:"Available", amenities:["AC","WiFi","TV","Minibar"] },
  { id:"RM-202", number:"202", type:"Deluxe",     floor:2, beds:2, price:150, status:"Cleaning",  amenities:["AC","WiFi","TV","Minibar"] },
  { id:"RM-301", number:"301", type:"Suite",      floor:3, beds:1, price:220, status:"Occupied",  amenities:["AC","WiFi","TV","Minibar","Balcony","Jacuzzi"] },
  { id:"RM-302", number:"302", type:"Suite",      floor:3, beds:2, price:280, status:"Available", amenities:["AC","WiFi","TV","Minibar","Balcony","Jacuzzi"] },
  { id:"RM-401", number:"401", type:"Presidential",floor:4,beds:2, price:500, status:"Available", amenities:["AC","WiFi","TV","Minibar","Balcony","Jacuzzi","Butler"] },
];

const HTL_BOOKINGS_SEED = [
  { id:"BKG-001", guest:"Mohammed Al Qahtani", room:"102", type:"Standard",   checkIn:"2026-07-16", checkOut:"2026-07-19", nights:3, total:285, paid:285, status:"Active",    source:"Direct" },
  { id:"BKG-002", guest:"Sarah Johnson",       room:"301", type:"Suite",      checkIn:"2026-07-17", checkOut:"2026-07-22", nights:5, total:1100,paid:550, status:"Active",    source:"Booking.com" },
  { id:"BKG-003", guest:"Amina Hassan",        room:"201", type:"Deluxe",     checkIn:"2026-07-20", checkOut:"2026-07-23", nights:3, total:390, paid:0,   status:"Upcoming",  source:"Direct" },
  { id:"BKG-004", guest:"John Smith",          room:"102", type:"Standard",   checkIn:"2026-07-10", checkOut:"2026-07-14", nights:4, total:380, paid:380, status:"Checked Out",source:"Expedia" },
];

const BANK_ACCOUNTS_SEED = [
  { id:"ACC-0001", accountNo:"1000000001", name:"Amina Hassan",        type:"Savings",        balance:2450.00,  currency:"TZS", openDate:"2024-01-15", status:"Active",  branch:"Main",    interest:3.5, phone:"0712-345-678" },
  { id:"ACC-0002", accountNo:"1000000002", name:"John Mwangi",         type:"Current",        balance:15800.00, currency:"TZS", openDate:"2024-01-20", status:"Active",  branch:"Main",    interest:0,   phone:"0756-789-012" },
  { id:"ACC-0003", accountNo:"2000000001", name:"Baraka Enterprise Ltd",type:"Business",       balance:87500.00, currency:"TZS", openDate:"2023-11-05", status:"Active",  branch:"CBD",     interest:1.5, phone:"0722-001-002" },
  { id:"ACC-0004", accountNo:"3000000001", name:"Grace Mwenda",        type:"Fixed Deposit",  balance:50000.00, currency:"TZS", openDate:"2024-03-01", status:"Active",  branch:"Main",    interest:9.5, phone:"0769-333-444" },
  { id:"ACC-0005", accountNo:"1000000003", name:"Peter Kamau",         type:"Savings",        balance:320.00,   currency:"TZS", openDate:"2024-05-10", status:"Dormant", branch:"CBD",     interest:3.5, phone:"0622-111-222" },
  { id:"ACC-0006", accountNo:"4000000001", name:"Uzuri Beauty Chain",  type:"Corporate",      balance:234000.00,currency:"TZS", openDate:"2023-08-15", status:"Active",  branch:"Main",    interest:1.0, phone:"0767-331-220" },
];

const BANK_TRANSACTIONS_SEED = [
  { id:"TXN-0001", accountNo:"1000000001", account:"Amina Hassan",        type:"Deposit",       amount:500.00,  balance:2450.00, date:"2026-07-16 09:14", channel:"Teller",   reference:"DEP-20260716-001", narration:"Cash deposit",           teller:"Alice Njoroge",  status:"Completed" },
  { id:"TXN-0002", accountNo:"1000000002", account:"John Mwangi",         type:"Withdrawal",    amount:2000.00, balance:15800.00,date:"2026-07-16 10:02", channel:"Teller",   reference:"WDR-20260716-001", narration:"Cash withdrawal",         teller:"Bob Ochieng",    status:"Completed" },
  { id:"TXN-0003", accountNo:"2000000001", account:"Baraka Enterprise Ltd",type:"Transfer Out",  amount:5000.00, balance:87500.00,date:"2026-07-16 11:30", channel:"Online",   reference:"TRF-20260716-001", narration:"Payment to supplier",     teller:"System",         status:"Completed" },
  { id:"TXN-0004", accountNo:"3000000001", account:"Grace Mwenda",        type:"Interest",      amount:395.83,  balance:50000.00,date:"2026-07-01 00:00", channel:"System",   reference:"INT-202607-001",   narration:"Monthly interest credit",  teller:"System",         status:"Completed" },
  { id:"TXN-0005", accountNo:"1000000001", account:"Amina Hassan",        type:"Transfer In",   amount:1200.00, balance:1950.00, date:"2026-07-14 15:45", channel:"Mobile",   reference:"TRF-20260714-002", narration:"Received from sister",    teller:"System",         status:"Completed" },
];

const BANK_LOANS_SEED = [
  { id:"LN-0001", loanNo:"LN20240001", clientId:"ACC-0001", client:"Amina Hassan",         type:"Personal",    principal:5000,  rate:18, months:24, disbursed:"2024-06-01", installment:258.14, balance:3850.00, arrears:0,    nextDue:"2026-08-01", status:"Active",    collateral:"None",         purpose:"Home improvement" },
  { id:"LN-0002", loanNo:"LN20240002", clientId:"ACC-0003", client:"Baraka Enterprise Ltd",type:"Business",    principal:50000, rate:15, months:36, disbursed:"2024-03-15", installment:1733.51,balance:38200.00,arrears:0,    nextDue:"2026-08-15", status:"Active",    collateral:"Land Title",   purpose:"Expand business" },
  { id:"LN-0003", loanNo:"LN20240003", clientId:"ACC-0002", client:"John Mwangi",          type:"Personal",    principal:3000,  rate:20, months:12, disbursed:"2025-01-10", installment:277.68, balance:1200.00, arrears:555.36,nextDue:"2026-06-10", status:"Overdue",   collateral:"Guarantor",    purpose:"Medical expenses" },
  { id:"LN-0004", loanNo:"LN20230001", clientId:"ACC-0006", client:"Uzuri Beauty Chain",   type:"Business",    principal:100000,rate:14, months:60, disbursed:"2023-09-01", installment:2327.43,balance:0,       arrears:0,    nextDue:"N/A",        status:"Closed",    collateral:"Property",     purpose:"Shop renovation" },
  { id:"LN-0005", loanNo:"LN20250001", clientId:"ACC-0005", client:"Peter Kamau",          type:"Emergency",   principal:800,   rate:24, months:6,  disbursed:"2025-10-01", installment:144.87, balance:720.00,  arrears:289.74,nextDue:"2026-05-01", status:"Defaulted", collateral:"None",         purpose:"Emergency" },
];

const BANK_FIXED_DEPOSITS_SEED = [
  { id:"FD-001", accountNo:"3000000001", client:"Grace Mwenda",        amount:50000, rate:9.5,  months:12, maturity:"2025-03-01", interestEarned:4750, status:"Matured",  autoRenew:true  },
  { id:"FD-002", accountNo:"4000000002", client:"Mohammed Al Qahtani", amount:30000, rate:10.5, months:24, maturity:"2027-01-15", interestEarned:3150, status:"Active",   autoRenew:false },
  { id:"FD-003", accountNo:"4000000003", client:"Fatuma Juma",         amount:15000, rate:8.5,  months:6,  maturity:"2026-09-01", interestEarned:638,  status:"Active",   autoRenew:true  },
];

const BANK_STANDING_ORDERS_SEED = [
  { id:"SO-001", accountNo:"1000000002", debtor:"John Mwangi",    amount:500,   frequency:"Monthly", nextRun:"2026-08-01", beneficiary:"LUKU Prepaid",  status:"Active" },
  { id:"SO-002", accountNo:"2000000001", debtor:"Baraka Enterprise",amount:2000, frequency:"Monthly", nextRun:"2026-08-05", beneficiary:"NHIF Premium",  status:"Active" },
];

const RST_TABLES_SEED = [
  { id:"T01", number:"T01", seats:2,  zone:"Indoor",  status:"Available", waiter:"",           currentOrder:null },
  { id:"T02", number:"T02", seats:4,  zone:"Indoor",  status:"Occupied",  waiter:"Ali Hassan",  currentOrder:"ORD-001" },
  { id:"T03", number:"T03", seats:4,  zone:"Indoor",  status:"Reserved",  waiter:"",            currentOrder:null },
  { id:"T04", number:"T04", seats:6,  zone:"Indoor",  status:"Available", waiter:"",            currentOrder:null },
  { id:"T05", number:"T05", seats:2,  zone:"Terrace", status:"Occupied",  waiter:"Sara Mwenda", currentOrder:"ORD-002" },
  { id:"T06", number:"T06", seats:4,  zone:"Terrace", status:"Available", waiter:"",            currentOrder:null },
  { id:"T07", number:"T07", seats:8,  zone:"VIP",     status:"Reserved",  waiter:"",            currentOrder:null },
  { id:"T08", number:"T08", seats:2,  zone:"Bar",     status:"Available", waiter:"",            currentOrder:null },
  { id:"T09", number:"T09", seats:4,  zone:"Outdoor", status:"Occupied",  waiter:"John Kamau",  currentOrder:"ORD-003" },
  { id:"T10", number:"T10", seats:6,  zone:"Outdoor", status:"Available", waiter:"",            currentOrder:null },
];

const RST_MENU_SEED = [
  // Starters
  { id:"M001", name:"Samosa (4 pcs)",          category:"Starters",    price:4500,  cost:1800, prepTime:8,  available:true, description:"Crispy pastry with spiced beef filling",       image:"🥟", popular:true  },
  { id:"M002", name:"Soup of the Day",          category:"Starters",    price:6000,  cost:2000, prepTime:5,  available:true, description:"Chef's daily soup with bread",                  image:"🍲", popular:false },
  { id:"M003", name:"Prawn Cocktail",           category:"Starters",    price:12000, cost:5000, prepTime:10, available:true, description:"Tiger prawns with Marie Rose sauce",          image:"🍤", popular:true  },
  // Mains
  { id:"M004", name:"Nyama Choma (500g)",       category:"Main Course", price:18000, cost:8000, prepTime:25, available:true, description:"Grilled beef with ugali and kachumbari",      image:"🥩", popular:true  },
  { id:"M005", name:"Grilled Tilapia",          category:"Main Course", price:16000, cost:6500, prepTime:20, available:true, description:"Whole tilapia with coconut rice and salad",   image:"🐟", popular:true  },
  { id:"M006", name:"Zanzibar Biryani",         category:"Main Course", price:14000, cost:5500, prepTime:30, available:true, description:"Fragrant spiced rice with chicken",           image:"🍛", popular:true  },
  { id:"M007", name:"Steak (200g)",             category:"Main Course", price:32000, cost:14000,prepTime:20, available:true, description:"Beef sirloin with fries and pepper sauce",    image:"🥩", popular:false },
  { id:"M008", name:"Pasta Arrabiata",          category:"Main Course", price:12000, cost:4000, prepTime:15, available:true, description:"Penne pasta with spicy tomato sauce",         image:"🍝", popular:false },
  // Grills
  { id:"M009", name:"Mixed Grill Platter",      category:"Grills",      price:38000, cost:16000,prepTime:30, available:true, description:"Chicken, beef & sausage with chips and salad",image:"🍖", popular:true  },
  // Desserts
  { id:"M010", name:"Kaimati (10 pcs)",         category:"Desserts",    price:5000,  cost:1500, prepTime:10, available:true, description:"Sweet fried dumplings with honey",            image:"🍡", popular:true  },
  { id:"M011", name:"Ice Cream (3 scoops)",     category:"Desserts",    price:6000,  cost:2000, prepTime:3,  available:true, description:"Choice of chocolate, vanilla or strawberry", image:"🍨", popular:false },
  // Drinks
  { id:"M012", name:"Fresh Juice",              category:"Drinks",      price:4500,  cost:1200, prepTime:5,  available:true, description:"Mango, passion, orange or watermelon",       image:"🧃", popular:true  },
  { id:"M013", name:"Softdrinks",               category:"Drinks",      price:2500,  cost:800,  prepTime:1,  available:true, description:"Coca-Cola, Sprite, Fanta, Water",             image:"🥤", popular:false },
  { id:"M014", name:"Tusker Lager (500ml)",     category:"Drinks",      price:5500,  cost:2500, prepTime:1,  available:true, description:"Cold Kenyan beer",                            image:"🍺", popular:true  },
  { id:"M015", name:"House Wine (Glass)",       category:"Drinks",      price:9000,  cost:3500, prepTime:2,  available:true, description:"Red or white, Cape Town",                    image:"🍷", popular:false },
];

const RST_ORDERS_SEED = [
  { id:"ORD-001", table:"T02", waiter:"Ali Hassan",  items:[{id:"M004",name:"Nyama Choma (500g)",qty:2,price:18000},{id:"M012",name:"Fresh Juice",qty:2,price:4500}], subtotal:45000, tax:4500, total:49500, paid:0, status:"Preparing", timeIn:"14:32", note:"", kitchen:"In Progress" },
  { id:"ORD-002", table:"T05", waiter:"Sara Mwenda", items:[{id:"M006",name:"Zanzibar Biryani",qty:1,price:14000},{id:"M003",name:"Prawn Cocktail",qty:1,price:12000},{id:"M013",name:"Softdrinks",qty:2,price:2500}], subtotal:31000, tax:3100, total:34100, paid:0, status:"Ready",    timeIn:"14:15", note:"No onions on biryani", kitchen:"Ready" },
  { id:"ORD-003", table:"T09", waiter:"John Kamau",  items:[{id:"M005",name:"Grilled Tilapia",qty:2,price:16000},{id:"M014",name:"Tusker Lager (500ml)",qty:3,price:5500}], subtotal:48500, tax:4850, total:53350, paid:53350, status:"Paid",     timeIn:"13:55", note:"", kitchen:"Served" },
];

const RST_RESERVATIONS_SEED = [
  { id:"RES-001", name:"Mr. Ahmed Hassan",     phone:"0712-001-001", date:"2026-07-21", time:"19:00", covers:4, table:"T07", status:"Confirmed", note:"Anniversary — arrange flowers" },
  { id:"RES-002", name:"Baraka Enterprises",   phone:"0756-002-002", date:"2026-07-21", time:"13:00", covers:8, table:"T07", status:"Confirmed", note:"Business lunch" },
  { id:"RES-003", name:"Ms. Grace Waweru",     phone:"0722-003-003", date:"2026-07-22", time:"20:00", covers:2, table:"T03", status:"Pending",   note:"Birthday cake needed" },
];

const RST_WAITERS = ["Ali Hassan","Sara Mwenda","John Kamau","Amina Juma","Peter Otieno"];

const MENU_CATEGORIES = ["Starters","Main Course","Grills","Desserts","Drinks","Specials"];

const TABLE_ZONES = ["Indoor","Terrace","VIP","Bar","Outdoor"];

const TZS_FMT = (n) => "TZS " + Number(n).toLocaleString();

const ANN_CAT_COLORS = {
  HR:      ["#EFF6FF","#2563EB","#BFDBFE"],
  General: ["#F8FAFB","#374151","#E5E7EB"],
  Benefits:["#F0FDF4","#16A34A","#BBF7D0"],
  Events:  ["#F5F3FF","#7C3AED","#DDD6FE"],
  Safety:  ["#FFFBEB","#D97706","#FDE68A"],
};

const EXPENSE_CATEGORIES_PERSONAL = ["Travel","Meals & Entertainment","Office Supplies","Communication","Training","Medical","Transport","Other"];

const ONBOARDING_TOUR_STEPS = [
  {
    id: "dashboard",
    moduleId: "dashboard",
    roles: ["owner", "admin", "manager", "staff", "viewer"],
    title: { en: "Start at your command center", sw: "Anzia kwenye kituo chako cha uendeshaji" },
    description: {
      en: "See confirmed KPIs, operational guidance, and live workspace status without relying on fabricated trends.",
      sw: "Tazama viashiria vilivyothibitishwa, mwongozo wa kiutendaji, na hali ya mfumo bila kutegemea takwimu za kubuni."
    },
    icon: LayoutDashboard,
    accent: "#16A34A",
    animation: "pulse-slow",
    illustration: "📊"
  },
  {
    id: "sales",
    moduleId: "sales",
    roles: ["owner", "admin", "manager", "staff"],
    title: { en: "Turn opportunities into sales", sw: "Badili fursa kuwa mauzo" },
    description: {
      en: "Create and follow sales workflows that only become visible after the server confirms the record.",
      sw: "Tengeneza na fuatilia michakato ya mauzo inayoonekana tu baada ya seva kuthibitisha kumbukumbu."
    },
    icon: ShoppingCart,
    accent: "#2563EB",
    animation: "bounce-subtle",
    illustration: "💼"
  },
  {
    id: "pos",
    moduleId: "pos",
    roles: ["owner", "admin", "manager", "staff"],
    title: { en: "Move quickly at the point of sale", sw: "Nenda kwa kasi katika sehemu ya mauzo (POS)" },
    description: {
      en: "Complete checkout, handle offline queues transparently, and use Sync Now when connectivity returns.",
      sw: "Kamilisha malipo, simamia foleni za nje ya mtandao kwa uwazi, na utumie kitufe cha kusawazisha pale mtandao unaporejea."
    },
    icon: ShoppingBag,
    accent: "#7C3AED",
    animation: "spin-slow",
    illustration: "🛒"
  },
  {
    id: "inventory",
    moduleId: "inventory",
    roles: ["owner", "admin", "manager", "staff"],
    title: { en: "Keep stock truthful", sw: "Weka hesabu za bidhaa kuwa za kweli" },
    description: {
      en: "Track confirmed stock movements, low-stock attention, and retry-safe adjustments across locations.",
      sw: "Fuatilia mienendo ya bidhaa iliyothibitishwa, bidhaa zinazokaribia kuisha, na marekebisho salama katika matawi yako."
    },
    icon: Package,
    accent: "#0891B2",
    animation: "float",
    illustration: "📦"
  },
  {
    id: "finance",
    moduleId: "finance",
    roles: ["owner", "admin", "manager"],
    title: { en: "Protect cash flow", sw: "Linda mtiririko wa pesa taslimu" },
    description: {
      en: "Review confirmed invoices, expenses, budgets, and collections with clear empty and unavailable states.",
      sw: "Kagua ankara zilizothibitishwa, matumizi, bajeti, na makusanyo kwa mifumo iliyo wazi na ya kweli."
    },
    icon: Wallet,
    accent: "#D97706",
    animation: "pulse-slow",
    illustration: "🪙"
  },
  {
    id: "collaboration",
    moduleId: "collaboration",
    roles: ["owner", "admin", "manager", "staff", "viewer"],
    title: { en: "Coordinate the whole team", sw: "Ratibu timu nzima kwa pamoja" },
    description: {
      en: "Use Projects and Collaboration Hub to manage confirmed tasks, milestones, channels, and calendar work.",
      sw: "Tumia Miradi na Kituo cha Ushirikiano kusimamia kazi zilizothibitishwa, hatua kuu, na kalenda ya kazi."
    },
    icon: MessageSquare,
    accent: "#DB2777",
    animation: "bounce-subtle",
    illustration: "👥"
  },
  {
    id: "ai",
    moduleId: "ai",
    roles: ["owner", "admin", "manager"],
    title: { en: "Let AI assist—never act alone", sw: "Ruhusu AI ikusaidie—kamwe usifanye maamuzi peke yako" },
    description: {
      en: "Ask the assistant for grounded analysis and review recommendations before any role-sensitive action is executed.",
      sw: "Omba msaada wa uchambuzi na uhakiki mapendekezo kabla ya kutekeleza hatua yoyote nyeti."
    },
    icon: Brain,
    accent: "#0F766E",
    animation: "spin-slow",
    illustration: "🤖"
  },
];

  return {
    ACTIVITY_MODULE_COLORS,
    BRIEFING_EXEC_ROLES,
    ASSET_CATEGORIES,
    EXPENSE_CATEGORIES_LIST,
    RECRUITMENT_STAGES,
    TICKET_CATEGORIES,
    KB_CATEGORIES,
    OFFICIAL_MARKETPLACE_TEMPLATES,
    APPROVER_ROLES,
    CMD_ITEMS,
    MFI_LOAN_PRODUCTS,
    MFI_CLIENT_SEED,
    MFI_LOAN_SEED,
    MARKETPLACE_CATEGORIES,
    WA_TEMPLATES,
    WHATSAPP_MESSAGE_SEED,
    EMAIL_TEMPLATES,
    CALENDAR_CATEGORIES,
    CONGRATS_TEMPLATES,
    PASSKEY_READINESS_ROLES,
    SMS_CATEGORIES,
    COMPANY_CATEGORIES,
    ONBOARDING_MODULES,
    VICOBA_MEMBER_SEED,
    VICOBA_LOAN_SEED,
    VICOBA_MEETING_SEED,
    HC_PATIENTS_SEED,
    HC_DOCTORS_SEED,
    HC_APPTS_SEED,
    HC_VISITS_SEED,
    HC_PRESCRIPTIONS_SEED,
    HC_REPORTS_SEED,
    HC_LAB_CATEGORIES,
    VITAL_SEED,
    RADIOLOGY_SEED,
    SCH_STUDENTS_SEED,
    SCH_TEACHERS_SEED,
    SCH_CLASSES_SEED,
    SCH_EXAMS_SEED,
    SCH_FEES_SEED,
    SCH_BOOKS_SEED,
    SCH_TRANSPORT_SEED,
    PHM_DRUGS_SEED,
    PHM_STOCK_SEED,
    PHM_DISPENSE_SEED,
    PHM_SUPPLIERS_SEED,
    DRUG_CATEGORIES,
    HTL_ROOMS_SEED,
    HTL_BOOKINGS_SEED,
    BANK_ACCOUNTS_SEED,
    BANK_TRANSACTIONS_SEED,
    BANK_LOANS_SEED,
    BANK_FIXED_DEPOSITS_SEED,
    BANK_STANDING_ORDERS_SEED,
    RST_TABLES_SEED,
    RST_MENU_SEED,
    RST_ORDERS_SEED,
    RST_RESERVATIONS_SEED,
    RST_WAITERS,
    MENU_CATEGORIES,
    TABLE_ZONES,
    TZS_FMT,
    ANN_CAT_COLORS,
    EXPENSE_CATEGORIES_PERSONAL,
    ONBOARDING_TOUR_STEPS,
  };
}
