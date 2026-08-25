/* Extracted from BusinessSphereDashboard.jsx to keep Vercel source files below the direct-upload limit. */
export function createDashboardExtractedModules(deps) {
  const {
    ACCOUNT_TYPES,
    APPT_TYPES,
    Activity,
    AlertCircle,
    Archive,
    ArrowDownRight,
    ArrowUpRight,
    BANKING_LOAN_TYPES,
    BANK_ACCOUNTS_SEED,
    BANK_FIXED_DEPOSITS_SEED,
    BANK_LOANS_SEED,
    BANK_STANDING_ORDERS_SEED,
    BANK_TRANSACTIONS_SEED,
    BLOOD_TYPES,
    BRANCHES,
    Banknote,
    Bar,
    BarChart,
    BarChart3,
    Bed,
    Bell,
    BookOpen,
    COMMUNITY_EMPTY,
    COMMUNITY_GROUP_TYPES,
    COMMUNITY_PAYMENT_METHODS,
    COMMUNITY_TABS,
    CalendarCheck,
    CalendarDays,
    CartesianGrid,
    Cell,
    CheckCircle,
    CheckCircle2,
    ChefHat,
    CircleDollarSign,
    ClipboardCheck,
    ClipboardList,
    Clock,
    Coins,
    CommunityEmpty,
    CommunityKpi,
    CommunitySection,
    CommunityStatus,
    DEMO_OVERRIDE,
    Download,
    Edit2,
    EmployeePortalWorkspace,
    Eye,
    FileText,
    Fingerprint,
    FlaskConical,
    FormField,
    GraduationCap,
    HCBillingView,
    HC_APPTS_SEED,
    HC_DOCTORS_SEED,
    HC_LAB_CATEGORIES,
    HC_LAB_TESTS,
    HC_MEDICATIONS,
    HC_PATIENTS_SEED,
    HC_PRESCRIPTIONS_SEED,
    HC_REPORTS_SEED,
    HC_VISITS_SEED,
    HTL_BOOKINGS_SEED,
    HTL_ROOMS_SEED,
    HandCoins,
    HeartHandshake,
    HeartPulse,
    Hotel,
    IS_CONFIGURED,
    Landmark,
    Layers,
    LayoutDashboard,
    LogIn,
    LogOut,
    MENU_CATEGORIES,
    Megaphone,
    Package,
    Pie,
    PiggyBank,
    Pill,
    Plus,
    PortalExpenses,
    PortalNoticeboard,
    PortalTeam,
    PortalTraining,
    Printer,
    RPieChart,
    RST_MENU_SEED,
    RST_ORDERS_SEED,
    RST_RESERVATIONS_SEED,
    RST_TABLES_SEED,
    RST_WAITERS,
    RadiologyView,
    Receipt,
    ReceiptText,
    Repeat,
    ResponsiveContainer,
    Scale,
    ScanLine,
    Search,
    Send,
    Sparkles,
    Stethoscope,
    TABLE_ZONES,
    TODAY,
    TZS_FMT,
    Tooltip,
    TrendingDown,
    TrendingUp,
    UserCheck,
    UserCircle,
    UserPlus,
    Users,
    Users2,
    UtensilsCrossed,
    VitalsTriageView,
    X,
    XAxis,
    YAxis,
    attendanceSeed,
    authDebug,
    b64ToBuf,
    bufToB64,
    calculateCommunityLoan,
    callRpc,
    canonicalRoleId,
    communityDate,
    communityTzs,
    docId,
    downloadCSV,
    dutiesSeed,
    getStoredAccessToken,
    inputClass,
    logAudit,
    mapAttendanceRow,
    mapDutyRow,
    money,
    notify,
    printReport,
    requiresConfirmedPersistence,
    runCompanyTableMutation,
    sb,
    splitCommunityRepayment,
    unwrapCommunityMutationResult,
    useCompanyTable,
    useEffect,
    useMemo,
    useState,
  } = deps;

function CommunityGroupsModule({ currentUser, canManage = false, onOpenMemberInvitation }) {
  const [tab, setTab] = useState("overview");
  const [search, setSearch] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [showForm, setShowForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const today = TODAY.toISOString().slice(0, 10);
  const groups = useCompanyTable("community_groups", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupType: r.group_type || r.type || "Chama", groupNumber: r.group_number || r.id, meetingFrequency: r.meeting_frequency || "Monthly", contributionFrequency: r.contribution_frequency || r.cycle || "Monthly", contributionAmount: Number(r.contribution_amount || 0), region: r.region || "", district: r.district || "", status: r.status || "Active" }) });
  const members = useCompanyTable("community_group_members", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, fullName: r.full_name || r.name || "", memberNumber: r.member_number || r.id, groupId: r.group_id, phone: r.phone || "", nationalId: r.national_id || "", idType: r.id_type || "NIDA", role: r.role || "Member", kycStatus: r.kyc_status || "Pending", membershipStatus: r.membership_status || "Active", joinDate: r.join_date || "" }) });
  const committees = useCompanyTable("community_group_committees", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, name: r.name, committeeType: r.committee_type || "Management", status: r.status || "Active" }) });
  const committeeMembers = useCompanyTable("community_group_committee_members", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, committeeId: r.committee_id, memberId: r.member_id, committeeRole: r.committee_role || "Member" }) });
  const contributions = useCompanyTable("community_group_contributions", COMMUNITY_EMPTY, { order: { col: "contribution_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, memberId: r.member_id, memberName: r.member_name || "", amount: Number(r.amount || 0), contributionType: r.contribution_type || "Contribution", contributionDate: r.contribution_date, dueDate: r.due_date, paymentMethod: r.payment_method || "Cash", provider: r.mobile_money_provider || "", reference: r.payment_reference || "", status: r.status || "Paid", receiptNumber: r.receipt_number || "" }) });
  const savings = useCompanyTable("community_group_savings", COMMUNITY_EMPTY, { order: { col: "transaction_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, memberId: r.member_id, transactionType: r.transaction_type, amount: Number(r.amount || 0), transactionDate: r.transaction_date, paymentMethod: r.payment_method || "Cash", reference: r.reference || "", status: r.status || "Posted" }) });
  const welfare = useCompanyTable("community_group_welfare_claims", COMMUNITY_EMPTY, { order: { col: "claim_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, memberId: r.member_id, eventType: r.event_type, description: r.description || "", requested: Number(r.amount_requested || 0), approved: Number(r.amount_approved || 0), claimDate: r.claim_date, status: r.status || "Pending", paymentReference: r.payment_reference || "" }) });
  const loans = useCompanyTable("community_group_loans", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, memberId: r.member_id, loanNumber: r.loan_number || r.id, principal: Number(r.principal || 0), interestRate: Number(r.interest_rate || 0), interestMethod: r.interest_method || "Flat", termMonths: Number(r.term_months || 1), totalInterest: Number(r.total_interest || 0), totalRepayable: Number(r.total_repayable || 0), outstandingPrincipal: Number(r.outstanding_principal ?? r.principal ?? 0), outstandingInterest: Number(r.outstanding_interest ?? r.total_interest ?? 0), purpose: r.purpose || "", approvalStatus: r.approval_status || "Pending", status: r.status || "Applied", disbursedAt: r.disbursed_at || "" }) });
  const repayments = useCompanyTable("community_group_loan_repayments", COMMUNITY_EMPTY, { order: { col: "repayment_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, loanId: r.loan_id, amount: Number(r.amount || 0), principalAmount: Number(r.principal_amount || 0), interestAmount: Number(r.interest_amount || 0), penaltyAmount: Number(r.penalty_amount || 0), repaymentDate: r.repayment_date, paymentMethod: r.payment_method || "Cash", reference: r.payment_reference || "", status: r.status || "Posted", receiptNumber: r.receipt_number || "" }) });
  const penalties = useCompanyTable("community_group_loan_penalties", COMMUNITY_EMPTY, { order: { col: "penalty_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, loanId: r.loan_id, amount: Number(r.amount || 0), penaltyDate: r.penalty_date, reason: r.reason || "", status: r.status || "Outstanding" }) });
  const meetings = useCompanyTable("community_group_meetings", COMMUNITY_EMPTY, { order: { col: "meeting_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, meetingNumber: r.meeting_number || r.id, meetingDate: r.meeting_date, startTime: r.start_time || "", venue: r.venue || "", agenda: r.agenda || "", minutes: r.minutes || "", status: r.status || "Scheduled" }) });
  const attendance = useCompanyTable("community_group_attendance", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, meetingId: r.meeting_id, memberId: r.member_id, status: r.status || "Present" }) });
  const projects = useCompanyTable("community_group_projects", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, projectNumber: r.project_number || r.id, name: r.name, description: r.description || "", targetAmount: Number(r.target_amount || 0), startDate: r.start_date || "", endDate: r.end_date || "", status: r.status || "Planning" }) });
  const fundraising = useCompanyTable("community_group_fundraising", COMMUNITY_EMPTY, { order: { col: "donation_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, projectId: r.project_id, donorName: r.donor_name, amount: Number(r.amount || 0), donationDate: r.donation_date, status: r.status || "Received" }) });
  const budgets = useCompanyTable("community_group_budgets", COMMUNITY_EMPTY, { order: { col: "fiscal_year", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, projectId: r.project_id, category: r.category, amount: Number(r.budget_amount || 0), fiscalYear: r.fiscal_year, status: r.status || "Draft" }) });
  const expenses = useCompanyTable("community_group_expenses", COMMUNITY_EMPTY, { order: { col: "expense_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, projectId: r.project_id, category: r.category, description: r.description, amount: Number(r.amount || 0), expenseDate: r.expense_date, paymentMethod: r.payment_method || "Cash", status: r.status || "Pending Approval" }) });
  const assets = useCompanyTable("community_group_assets", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, assetCode: r.asset_code || r.id, name: r.name, category: r.category || "", acquisitionCost: Number(r.acquisition_cost || 0), currentValue: Number(r.current_value || 0), location: r.location || "", status: r.status || "Active" }) });
  const income = useCompanyTable("community_group_income", COMMUNITY_EMPTY, { order: { col: "income_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, incomeType: r.income_type, description: r.description || "", amount: Number(r.amount || 0), incomeDate: r.income_date, status: r.status || "Posted" }) });
  const votes = useCompanyTable("community_group_votes", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, title: r.title, description: r.description || "", voteType: r.vote_type || "Resolution", status: r.status || "Open", quorumPercent: Number(r.quorum_percent || 50), opensAt: r.opens_at, closesAt: r.closes_at }) });
  const approvals = useCompanyTable("community_group_approvals", COMMUNITY_EMPTY, { order: { col: "requested_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, entityType: r.entity_type, entityId: r.entity_id, action: r.action, status: r.status, decisionNotes: r.decision_notes || "", requestedAt: r.requested_at }) });
  const announcements = useCompanyTable("community_group_announcements", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, title: r.title, body: r.body, audience: r.audience || "All Members", status: r.status || "Published", publishedAt: r.published_at }) });
  const messages = useCompanyTable("community_group_messages", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, subject: r.subject || "", body: r.body, channel: r.channel || "In-app", status: r.status || "Sent", createdAt: r.created_at }) });
  const documents = useCompanyTable("community_group_documents", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, documentType: r.document_type || "Other", title: r.title, fileUrl: r.file_url || "", documentDate: r.document_date || "", expiresAt: r.expires_at || "", status: r.status || "Active" }) });
  const events = useCompanyTable("community_group_events", COMMUNITY_EMPTY, { order: { col: "event_date", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, title: r.title, eventType: r.event_type || "Event", eventDate: r.event_date, startTime: r.start_time || "", venue: r.venue || "", status: r.status || "Scheduled" }) });
  const notifications = useCompanyTable("community_group_notifications", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, groupId: r.group_id, title: r.title, body: r.body, notificationType: r.notification_type, channel: r.channel || "In-app", status: r.status || "Unread", createdAt: r.created_at }) });
  const activity = useCompanyTable("community_group_audit_log", COMMUNITY_EMPTY, { order: { col: "created_at", ascending: false }, mapRow: (r) => ({ ...r, dbId: r.id, action: r.action, entityType: r.entity_type, actorName: r.actor_name || "System", details: r.details || {}, createdAt: r.created_at }) });

  const hooks = { groups, members, committees, committeeMembers, contributions, savings, welfare, loans, repayments, penalties, meetings, attendance, projects, fundraising, budgets, expenses, assets, income, votes, approvals, announcements, messages, documents, events, notifications, activity };
  const activeGroupId = selectedGroupId || groups.rows[0]?.id || groups.rows[0]?.dbId || "";
  const activeGroup = groups.rows.find((row) => String(row.id) === String(activeGroupId) || String(row.dbId) === String(activeGroupId));
  const canWrite = Boolean(canManage || ["Organization Owner", "Super Administrator", "CEO", "CFO", "Finance Manager", "Operations Manager", "Microfinance Manager", "Branch Manager"].includes(canonicalRoleId(currentUser?.role)));
  const canApprove = Boolean(canManage || ["Organization Owner", "Super Administrator", "CEO", "CFO", "Finance Manager"].includes(canonicalRoleId(currentUser?.role)));
  const q = search.trim().toLowerCase();
  const visible = (rows, fields = []) => (rows || []).filter((row) => !q || fields.some((field) => String(row[field] ?? "").toLowerCase().includes(q)));
  const activeFilter = (rows) => activeGroupId ? rows.filter((row) => String(row.groupId) === String(activeGroupId)) : rows;
  const activeMembers = activeFilter(members.rows);
  const activeContributions = activeFilter(contributions.rows);
  const activeSavings = activeFilter(savings.rows);
  const activeWelfare = activeFilter(welfare.rows);
  const activeLoans = activeFilter(loans.rows);
  const activeMeetings = activeFilter(meetings.rows);
  const activeProjects = activeFilter(projects.rows);
  const activeExpenses = activeFilter(expenses.rows);
  const activeIncome = activeFilter(income.rows);
  const paidContributions = activeContributions.filter((row) => row.status === "Paid").reduce((sum, row) => sum + row.amount, 0);
  const savingsDeposits = activeSavings.filter((row) => ["Deposit", "Dividend", "Adjustment"].includes(row.transactionType)).reduce((sum, row) => sum + row.amount, 0);
  const savingsWithdrawals = activeSavings.filter((row) => row.transactionType === "Withdrawal").reduce((sum, row) => sum + row.amount, 0);
  const welfarePaid = activeWelfare.filter((row) => row.status === "Paid").reduce((sum, row) => sum + (row.approved || row.requested), 0);
  const expenseTotal = activeExpenses.filter((row) => ["Approved", "Paid"].includes(row.status)).reduce((sum, row) => sum + row.amount, 0);
  const loanOutstanding = activeLoans.filter((row) => !["Closed", "Rejected"].includes(row.status)).reduce((sum, row) => sum + row.outstandingPrincipal + row.outstandingInterest, 0);
  const loanPortfolio = activeLoans.filter((row) => ["Disbursed", "Active", "Defaulted"].includes(row.status)).reduce((sum, row) => sum + row.principal, 0);
  const totalFund = paidContributions + savingsDeposits + activeIncome.reduce((sum, row) => sum + row.amount, 0) + fundraising.rows.filter((row) => String(row.groupId) === String(activeGroupId)).reduce((sum, row) => sum + row.amount, 0) - savingsWithdrawals - welfarePaid - expenseTotal - loanPortfolio;
  const fmtMember = (memberId) => members.rows.find((row) => String(row.id) === String(memberId) || String(row.dbId) === String(memberId))?.fullName || "Unassigned member";
  const fmtGroup = (groupId) => groups.rows.find((row) => String(row.id) === String(groupId) || String(row.dbId) === String(groupId))?.name || "Unassigned group";
  const actor = currentUser?.name || currentUser?.email || "Workspace user";

  const [groupForm, setGroupForm] = useState({ name: "", groupType: "Chama", registrationNumber: "", region: "", district: "", meetingFrequency: "Monthly", contributionFrequency: "Monthly", contributionAmount: "", description: "" });
  const [memberForm, setMemberForm] = useState({ groupId: activeGroupId, fullName: "", phone: "+255 ", email: "", nationalId: "", idType: "NIDA", gender: "", dateOfBirth: "", occupation: "", nextOfKin: "", nextOfKinPhone: "", role: "Member", joinDate: today });
  const [committeeForm, setCommitteeForm] = useState({ groupId: activeGroupId, name: "", committeeType: "Management" });
  const [financeForm, setFinanceForm] = useState({ kind: "contribution", groupId: activeGroupId, memberId: "", amount: "", type: "Contribution", date: today, dueDate: "", paymentMethod: "Mobile Money", provider: "M-Pesa", reference: "" });
  const [loanForm, setLoanForm] = useState({ groupId: activeGroupId, memberId: "", principal: "", rate: "10", method: "Flat", termMonths: "6", purpose: "", guarantorIds: "" });
  const [meetingForm, setMeetingForm] = useState({ groupId: activeGroupId, meetingDate: today, startTime: "18:00", venue: "", agenda: "" });
  const [projectForm, setProjectForm] = useState({ groupId: activeGroupId, name: "", description: "", targetAmount: "", startDate: today, endDate: "" });
  const [expenseForm, setExpenseForm] = useState({ groupId: activeGroupId, category: "Operations", description: "", amount: "", expenseDate: today, paymentMethod: "Mobile Money", reference: "" });
  const [commsForm, setCommsForm] = useState({ groupId: activeGroupId, kind: "announcement", title: "", subject: "", body: "", audience: "All Members", channel: "In-app" });
  const [documentForm, setDocumentForm] = useState({ groupId: activeGroupId, kind: "document", title: "", documentType: "Constitution", fileUrl: "", date: today, expiresAt: "", eventType: "Event", venue: "", startTime: "" });
  const [voteForm, setVoteForm] = useState({ groupId: activeGroupId, title: "", description: "", voteType: "Resolution", quorumPercent: "50", options: "Approve, Reject" });
  useEffect(() => {
    if (!selectedGroupId && groups.rows[0]) setSelectedGroupId(groups.rows[0].id || groups.rows[0].dbId);
  }, [groups.rows, selectedGroupId]);
  useEffect(() => {
    setMemberForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setFinanceForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setLoanForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setMeetingForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setProjectForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setExpenseForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setCommsForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setDocumentForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setVoteForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
    setCommitteeForm((current) => ({ ...current, groupId: current.groupId || activeGroupId }));
  }, [activeGroupId]);

  const resetForm = (name) => setShowForm(null);
  const updateHook = (hook, saved, mapper) => hook.setRows((previous) => [{ ...(mapper ? mapper(saved) : saved), dbId: saved?.id || saved?.dbId || saved?.id }, ...previous]);
  const localizePatch = (payload) => Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, value]).concat(Object.entries(payload).filter(([key]) => key.includes("_")).map(([key, value]) => [key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()), value])));
  const persist = async (table, operation, payload, hook, label, mapper, matchVal) => {
    if (!canWrite) { notify("You have read-only access to Community Groups.", "error"); return null; }
    setSaving(true);
    try {
      if (!requiresConfirmedPersistence()) {
        const local = { id: docId(table.slice(0, 2).toUpperCase()), ...payload, created_at: new Date().toISOString() };
        if (operation === "insert") updateHook(hook, local, mapper);
        else if (operation === "update") hook.setRows((previous) => previous.map((row) => String(row.id || row.dbId) === String(matchVal) ? { ...row, ...localizePatch(payload) } : row));
        notify(`${label} recorded in preview mode.`);
        logAudit(label, "Community Groups", actor, "Preview-mode local record");
        return local;
      }
      const result = await runCompanyTableMutation(table, operation, payload, { matchVal });
      const saved = unwrapCommunityMutationResult(result);
      if (!saved) throw new Error("The server did not return a confirmed record.");
      if (operation === "insert") updateHook(hook, saved, mapper);
      else await hook.reload?.();
      notify(`${label} saved and confirmed by the server.`);
      logAudit(label, "Community Groups", actor, `${table}${saved?.id ? ` · ${saved.id}` : ""}`);
      return saved;
    } catch (error) {
      notify(`${label} was not saved: ${error?.message || "server rejected the request"}`, "error");
      return null;
    } finally { setSaving(false); }
  };
  const auditEntity = async (action, entityType, entityId, groupId = activeGroupId, details = {}) => {
    if (!requiresConfirmedPersistence()) return;
    try { await runCompanyTableMutation("community_group_audit_log", "insert", { group_id: groupId || null, actor_name: actor, action, entity_type: entityType, entity_id: entityId || null, details }); } catch (error) { authDebug("Community audit event was not persisted", { message: error?.message }); }
  };
  const calculateLoan = (principal, annualRate, termMonths, method) => calculateCommunityLoan(principal, annualRate, termMonths, method);
  const splitRepayment = (loan, amount) => splitCommunityRepayment(loan.outstandingPrincipal, loan.outstandingInterest, amount);

  const createGroup = async (event) => { event.preventDefault(); if (!groupForm.name.trim()) return notify("Group name is required.", "error"); const saved = await persist("community_groups", "insert", { name: groupForm.name.trim(), group_type: groupForm.groupType, registration_number: groupForm.registrationNumber || null, region: groupForm.region || null, district: groupForm.district || null, meeting_frequency: groupForm.meetingFrequency, contribution_frequency: groupForm.contributionFrequency, contribution_amount: Number(groupForm.contributionAmount) || 0, description: groupForm.description || null, country: "Tanzania", currency: "TZS", status: "Active" }, groups, "Community group", (r) => ({ ...r, dbId: r.id, groupType: r.group_type || r.groupType, groupNumber: r.group_number || r.id, status: r.status || "Active", contributionAmount: Number(r.contribution_amount || r.contributionAmount || 0) })); if (saved) { setGroupForm({ name: "", groupType: "Chama", registrationNumber: "", region: "", district: "", meetingFrequency: "Monthly", contributionFrequency: "Monthly", contributionAmount: "", description: "" }); resetForm("group"); } };
  const createMember = async (event) => { event.preventDefault(); if (!memberForm.groupId || !memberForm.fullName.trim() || !memberForm.nationalId.trim()) return notify("Group, full name, and identification number are required.", "error"); const saved = await persist("community_group_members", "insert", { group_id: memberForm.groupId, full_name: memberForm.fullName.trim(), phone: memberForm.phone, email: memberForm.email || null, national_id: memberForm.nationalId.trim(), id_type: memberForm.idType, gender: memberForm.gender || null, date_of_birth: memberForm.dateOfBirth || null, occupation: memberForm.occupation || null, next_of_kin: memberForm.nextOfKin || null, next_of_kin_phone: memberForm.nextOfKinPhone || null, role: memberForm.role, join_date: memberForm.joinDate, membership_status: "Active", kyc_status: "Pending" }, members, "Member onboarding", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, fullName: r.full_name, memberNumber: r.member_number || r.id, nationalId: r.national_id, kycStatus: r.kyc_status || "Pending", membershipStatus: r.membership_status || "Active", role: r.role || "Member" })); if (saved) { setMemberForm({ ...memberForm, fullName: "", nationalId: "", email: "", occupation: "", nextOfKin: "", nextOfKinPhone: "" }); resetForm("member"); } };
  const createCommittee = async (event) => { event.preventDefault(); if (!committeeForm.groupId || !committeeForm.name.trim()) return notify("Group and committee name are required.", "error"); const saved = await persist("community_group_committees", "insert", { group_id: committeeForm.groupId, name: committeeForm.name.trim(), committee_type: committeeForm.committeeType, status: "Active" }, committees, "Committee", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, name: r.name, committeeType: r.committee_type || "Management", status: r.status || "Active" })); if (saved) { setCommitteeForm({ ...committeeForm, name: "" }); resetForm("committee"); } };
  const createFinance = async (event) => { event.preventDefault(); const amount = Number(financeForm.amount); if (!financeForm.groupId || !financeForm.memberId || !amount || amount <= 0) return notify("Select a group and member and enter a positive amount.", "error"); const base = { group_id: financeForm.groupId, member_id: financeForm.memberId, amount, contribution_date: financeForm.date, payment_method: financeForm.paymentMethod, payment_reference: financeForm.reference || null, mobile_money_provider: financeForm.provider || null }; let saved; if (financeForm.kind === "contribution") saved = await persist("community_group_contributions", "insert", { ...base, contribution_type: financeForm.type, due_date: financeForm.dueDate || null, status: "Paid", receipt_number: `RCT-${Date.now()}` }, contributions, "Contribution receipt", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, memberId: r.member_id, memberName: fmtMember(r.member_id), amount: Number(r.amount), contributionType: r.contribution_type, contributionDate: r.contribution_date, paymentMethod: r.payment_method, provider: r.mobile_money_provider, reference: r.payment_reference, status: r.status, receiptNumber: r.receipt_number })); else { saved = await persist("community_group_savings", "insert", { ...base, transaction_type: financeForm.type === "Withdrawal" ? "Withdrawal" : "Deposit", reference: financeForm.reference || null, status: "Posted" }, savings, "Savings transaction", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, memberId: r.member_id, transactionType: r.transaction_type, amount: Number(r.amount), transactionDate: r.transaction_date, paymentMethod: r.payment_method, reference: r.reference, status: r.status })); } if (saved) { setFinanceForm({ ...financeForm, amount: "", reference: "" }); resetForm("finance"); } };
  const createLoan = async (event) => { event.preventDefault(); const calc = calculateLoan(loanForm.principal, loanForm.rate, loanForm.termMonths, loanForm.method); if (!loanForm.groupId || !loanForm.memberId || !(Number(loanForm.principal) > 0)) return notify("Group, borrower, and loan principal are required.", "error"); const saved = await persist("community_group_loans", "insert", { group_id: loanForm.groupId, member_id: loanForm.memberId, principal: Number(loanForm.principal), interest_rate: Number(loanForm.rate) || 0, interest_method: loanForm.method, term_months: Number(loanForm.termMonths) || 1, purpose: loanForm.purpose || null, total_interest: calc.interest, total_repayable: calc.repayable, outstanding_principal: Number(loanForm.principal), outstanding_interest: calc.interest, approval_status: "Pending", status: "Applied", currency: "TZS" }, loans, "Loan application", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, memberId: r.member_id, loanNumber: r.loan_number || r.id, principal: Number(r.principal), interestRate: Number(r.interest_rate), interestMethod: r.interest_method, termMonths: Number(r.term_months), totalInterest: Number(r.total_interest), totalRepayable: Number(r.total_repayable), outstandingPrincipal: Number(r.outstanding_principal), outstandingInterest: Number(r.outstanding_interest), approvalStatus: r.approval_status, status: r.status, purpose: r.purpose || "" })); if (saved) { if (requiresConfirmedPersistence() && loanForm.guarantorIds.trim()) { for (const guarantor of loanForm.guarantorIds.split(",").map((item) => item.trim()).filter(Boolean)) { await runCompanyTableMutation("community_group_loan_guarantors", "insert", { loan_id: saved.id, guarantor_member_id: guarantor, guaranteed_amount: Number(loanForm.principal) || 0, consent_status: "Pending" }); } } setLoanForm({ ...loanForm, principal: "", purpose: "", guarantorIds: "" }); resetForm("loan"); } };
  const createMeeting = async (event) => { event.preventDefault(); if (!meetingForm.groupId || !meetingForm.meetingDate) return notify("Group and meeting date are required.", "error"); const saved = await persist("community_group_meetings", "insert", { group_id: meetingForm.groupId, meeting_date: meetingForm.meetingDate, start_time: meetingForm.startTime || null, venue: meetingForm.venue || null, agenda: meetingForm.agenda || null, status: "Scheduled" }, meetings, "Meeting", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, meetingNumber: r.meeting_number || r.id, meetingDate: r.meeting_date, startTime: r.start_time, venue: r.venue, agenda: r.agenda, minutes: r.minutes || "", status: r.status })); if (saved) { setMeetingForm({ ...meetingForm, venue: "", agenda: "" }); resetForm("meeting"); } };
  const createProject = async (event) => { event.preventDefault(); if (!projectForm.groupId || !projectForm.name.trim()) return notify("Group and project name are required.", "error"); const saved = await persist("community_group_projects", "insert", { group_id: projectForm.groupId, name: projectForm.name.trim(), description: projectForm.description || null, target_amount: Number(projectForm.targetAmount) || 0, start_date: projectForm.startDate || null, end_date: projectForm.endDate || null, status: "Planning" }, projects, "Community project", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, projectNumber: r.project_number || r.id, name: r.name, description: r.description || "", targetAmount: Number(r.target_amount || 0), startDate: r.start_date || "", endDate: r.end_date || "", status: r.status })); if (saved) { setProjectForm({ ...projectForm, name: "", description: "", targetAmount: "", endDate: "" }); resetForm("project"); } };
  const createExpense = async (event) => { event.preventDefault(); if (!expenseForm.groupId || !expenseForm.description.trim() || !(Number(expenseForm.amount) > 0)) return notify("Group, description, and a positive amount are required.", "error"); const saved = await persist("community_group_expenses", "insert", { group_id: expenseForm.groupId, category: expenseForm.category, description: expenseForm.description.trim(), amount: Number(expenseForm.amount), expense_date: expenseForm.expenseDate, payment_method: expenseForm.paymentMethod, payment_reference: expenseForm.reference || null, status: "Pending Approval" }, expenses, "Expense request", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, category: r.category, description: r.description, amount: Number(r.amount), expenseDate: r.expense_date, paymentMethod: r.payment_method, status: r.status })); if (saved) { await persist("community_group_approvals", "insert", { group_id: expenseForm.groupId, entity_type: "Expense", entity_id: saved.id, action: "Expense approval", status: "Pending" }, approvals, "Expense approval request", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, entityType: r.entity_type, entityId: r.entity_id, action: r.action, status: r.status, requestedAt: r.requested_at })); setExpenseForm({ ...expenseForm, description: "", amount: "", reference: "" }); resetForm("expense"); } };
  const createComms = async (event) => { event.preventDefault(); if (!commsForm.groupId || !commsForm.body.trim()) return notify("Group and message body are required.", "error"); if (commsForm.kind === "announcement") { const saved = await persist("community_group_announcements", "insert", { group_id: commsForm.groupId, title: commsForm.title.trim() || "Group announcement", body: commsForm.body.trim(), audience: commsForm.audience, status: "Published" }, announcements, "Announcement", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, title: r.title, body: r.body, audience: r.audience, status: r.status, publishedAt: r.published_at })); if (saved) await persist("community_group_notifications", "insert", { group_id: commsForm.groupId, notification_type: "Announcement", title: commsForm.title.trim() || "Group announcement", body: commsForm.body.trim(), channel: commsForm.channel, status: "Unread" }, notifications, "Member notification", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, title: r.title, body: r.body, notificationType: r.notification_type, channel: r.channel, status: r.status, createdAt: r.created_at })); } else await persist("community_group_messages", "insert", { group_id: commsForm.groupId, subject: commsForm.subject || null, body: commsForm.body.trim(), channel: commsForm.channel, status: "Sent" }, messages, "Group message", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, subject: r.subject || "", body: r.body, channel: r.channel, status: r.status, createdAt: r.created_at })); setCommsForm({ ...commsForm, title: "", subject: "", body: "" }); resetForm("comms"); };
  const createDocumentOrEvent = async (event) => { event.preventDefault(); if (!documentForm.groupId || !documentForm.title.trim()) return notify("Group and title are required.", "error"); if (documentForm.kind === "document") await persist("community_group_documents", "insert", { group_id: documentForm.groupId, document_type: documentForm.documentType, title: documentForm.title.trim(), file_url: documentForm.fileUrl || null, document_date: documentForm.date || null, expires_at: documentForm.expiresAt || null, status: "Active" }, documents, "Group document", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, documentType: r.document_type, title: r.title, fileUrl: r.file_url || "", documentDate: r.document_date || "", expiresAt: r.expires_at || "", status: r.status })); else await persist("community_group_events", "insert", { group_id: documentForm.groupId, title: documentForm.title.trim(), event_type: documentForm.eventType, event_date: documentForm.date, start_time: documentForm.startTime || null, venue: documentForm.venue || null, status: "Scheduled" }, events, "Group event", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, title: r.title, eventType: r.event_type, eventDate: r.event_date, startTime: r.start_time, venue: r.venue, status: r.status })); setDocumentForm({ ...documentForm, title: "", fileUrl: "", venue: "" }); resetForm("document"); };
  const createVote = async (event) => { event.preventDefault(); if (!voteForm.groupId || !voteForm.title.trim()) return notify("Group and vote title are required.", "error"); const saved = await persist("community_group_votes", "insert", { group_id: voteForm.groupId, title: voteForm.title.trim(), description: voteForm.description || null, vote_type: voteForm.voteType, quorum_percent: Number(voteForm.quorumPercent) || 50, status: "Open" }, votes, "Vote or election", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, title: r.title, description: r.description || "", voteType: r.vote_type, status: r.status, quorumPercent: Number(r.quorum_percent || 50) })); if (saved && requiresConfirmedPersistence()) { for (const label of voteForm.options.split(",").map((item) => item.trim()).filter(Boolean)) { await runCompanyTableMutation("community_group_vote_options", "insert", { vote_id: saved.id, label, vote_count: 0 }); } } if (saved) { setVoteForm({ ...voteForm, title: "", description: "" }); resetForm("vote"); } };
  const recordPenalty = async (loan) => { const amount = Number(window.prompt(`Penalty amount for ${loan.loanNumber} (TZS)`)); const reason = window.prompt("Penalty reason") || "Late repayment"; if (!amount || amount <= 0) return; await persist("community_group_loan_penalties", "insert", { loan_id: loan.dbId || loan.id, penalty_date: today, reason, amount, status: "Outstanding" }, penalties, "Loan penalty", (r) => ({ ...r, dbId: r.id, loanId: r.loan_id, penaltyDate: r.penalty_date, reason: r.reason, amount: Number(r.amount), status: r.status })); };
  const approveEntity = async (row, entityTable, statusPatch, label) => { if (!canApprove) return notify("Only authorized approvers can complete this action.", "error"); const entityHook = entityTable === "community_group_loans" ? loans : entityTable === "community_group_expenses" ? expenses : welfare; const saved = await persist(entityTable, "update", statusPatch, entityHook, label, null, row.dbId || row.id); if (saved) { await persist("community_group_approvals", "insert", { group_id: row.groupId, entity_type: entityTable.replace("community_group_", ""), entity_id: row.dbId || row.id, action: label, status: "Approved", decision_notes: "Approved by authorized workspace approver", decided_at: new Date().toISOString() }, approvals, "Approval decision", (r) => ({ ...r, dbId: r.id, groupId: r.group_id, entityType: r.entity_type, entityId: r.entity_id, action: r.action, status: r.status, decisionNotes: r.decision_notes || "", requestedAt: r.requested_at })); await auditEntity(label, entityTable, row.dbId || row.id, row.groupId, statusPatch); } };
  const approveLoan = (row) => approveEntity(row, "community_group_loans", { approval_status: "Approved", status: "Approved", approved_at: new Date().toISOString(), approved_by: null }, "Loan approved");
  const disburseLoan = (row) => approveEntity(row, "community_group_loans", { status: "Disbursed", disbursed_at: today, outstanding_principal: row.principal, outstanding_interest: row.totalInterest }, "Loan disbursed");
  const approveExpense = (row) => approveEntity(row, "community_group_expenses", { status: "Approved", approved_at: new Date().toISOString() }, "Expense approved");
  const approveWelfare = (row) => approveEntity(row, "community_group_welfare_claims", { status: "Approved", amount_approved: row.requested, approved_at: new Date().toISOString() }, "Welfare claim approved");
  const recordRepayment = async (loan) => { const amountText = window.prompt(`Repayment amount for ${loan.loanNumber} (TZS)`); const amount = Number(amountText); if (!amount || amount <= 0) return; const split = splitRepayment(loan, amount); const saved = await persist("community_group_loan_repayments", "insert", { loan_id: loan.dbId || loan.id, amount, principal_amount: split.principalAmount, interest_amount: split.interestAmount, penalty_amount: split.penaltyAmount, payment_method: "Mobile Money", payment_reference: `MM-${Date.now()}`, repayment_date: today, receipt_number: `LRCT-${Date.now()}`, status: "Posted" }, repayments, "Loan repayment", (r) => ({ ...r, dbId: r.id, loanId: r.loan_id, amount: Number(r.amount), principalAmount: Number(r.principal_amount), interestAmount: Number(r.interest_amount), penaltyAmount: Number(r.penalty_amount), repaymentDate: r.repayment_date, paymentMethod: r.payment_method, reference: r.payment_reference, receiptNumber: r.receipt_number, status: r.status })); if (saved) { const nextPrincipal = Math.max(0, loan.outstandingPrincipal - split.principalAmount); const nextInterest = Math.max(0, loan.outstandingInterest - split.interestAmount); await persist("community_group_loans", "update", { outstanding_principal: nextPrincipal, outstanding_interest: nextInterest, status: nextPrincipal + nextInterest <= 0 ? "Closed" : "Active" }, loans, "Loan balance update", null, loan.dbId || loan.id); } };
  const markMeetingHeld = async (meeting) => { const saved = await persist("community_group_meetings", "update", { status: "Held" }, meetings, "Meeting marked held", null, meeting.dbId || meeting.id); if (saved && activeMembers.length && requiresConfirmedPersistence()) for (const member of activeMembers) await runCompanyTableMutation("community_group_attendance", "insert", { meeting_id: meeting.dbId || meeting.id, member_id: member.dbId || member.id, status: "Present" }); if (saved && !requiresConfirmedPersistence()) attendance.setRows((previous) => [...activeMembers.map((member) => ({ id: docId("ATT"), meetingId: meeting.id, memberId: member.id, status: "Present" })), ...previous]); };
  const verifyMember = (member, status) => persist("community_group_members", "update", { kyc_status: status }, members, `KYC ${status.toLowerCase()}`, null, member.dbId || member.id);
  const exportStatement = () => { const rows = activeContributions.map((row) => ({ Date: row.contributionDate, Member: fmtMember(row.memberId), Type: row.contributionType, Amount_TZS: row.amount, Method: row.paymentMethod, Reference: row.reference, Status: row.status })); downloadCSV(`community-statement-${activeGroup?.name || "group"}`, rows, Object.keys(rows[0] || { Date: "Date", Member: "Member", Amount_TZS: "Amount (TZS)" }).map((key) => ({ key, label: key.replaceAll("_", " ") }))); };

  const FormActions = ({ onCancel }) => <div className="flex flex-wrap gap-2 pt-1"><button type="submit" disabled={saving || !canWrite} className="btn-primary rounded-xl px-4 py-2.5 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{saving ? "Saving…" : "Save and confirm"}</button><button type="button" onClick={onCancel} className="rounded-xl px-4 py-2.5 text-[12px] font-semibold text-slate-500 hover:bg-slate-50">Cancel</button></div>;
  const GroupSelect = ({ value, onChange }) => <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select group…</option>{groups.rows.map((row) => <option key={row.id || row.dbId} value={row.id || row.dbId}>{row.name}</option>)}</select>;
  const MemberSelect = ({ value, onChange, groupId = activeGroupId }) => <select className={inputClass} value={value} onChange={(event) => onChange(event.target.value)}><option value="">Select member…</option>{members.rows.filter((row) => !groupId || String(row.groupId) === String(groupId)).map((row) => <option key={row.id || row.dbId} value={row.id || row.dbId}>{row.fullName} · {row.memberNumber}</option>)}</select>;
  const selectGroup = (value) => { setSelectedGroupId(value); setMemberForm((f) => ({ ...f, groupId: value })); setFinanceForm((f) => ({ ...f, groupId: value, memberId: "" })); setLoanForm((f) => ({ ...f, groupId: value, memberId: "" })); };

  return <div className="space-y-4">
    <div className="overflow-hidden rounded-2xl px-5 py-5" style={{ background: "linear-gradient(135deg,#5B21B6 0%,#7C3AED 52%,#4C1D95 100%)" }}><div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><p className="text-[10px] font-black uppercase tracking-[.2em] text-violet-200">Community finance & governance</p><h1 className="mt-1 text-xl font-black text-white sm:text-2xl">Community Groups Manager</h1><p className="mt-1 max-w-2xl text-[12px] leading-5 text-violet-100">Chamas, VICOBA, table banking, cooperatives, welfare funds and savings groups with TZS-native receipts, member KYC and controlled approvals.</p></div><div className="grid grid-cols-2 gap-2 sm:flex"><div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-center"><p className="text-[10px] text-violet-200">Active group</p><p className="max-w-[150px] truncate text-[13px] font-bold text-white">{activeGroup?.name || "None selected"}</p></div><div className="rounded-xl border border-white/15 bg-white/10 px-4 py-2 text-center"><p className="text-[10px] text-violet-200">Live balance</p><p className="text-[13px] font-bold text-white">{communityTzs(totalFund)}</p></div></div></div></div>
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200/80 bg-white p-2 shadow-sm lg:flex-row lg:items-center"><div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">{COMMUNITY_TABS.map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={`flex shrink-0 items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold transition ${tab === id ? "bg-violet-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}><Icon size={14}/>{label}</button>)}</div><div className="flex gap-2"><select aria-label="Active community group" className={`${inputClass} min-w-[180px]`} value={activeGroupId} onChange={(event) => selectGroup(event.target.value)}><option value="">All groups</option>{groups.rows.map((row) => <option key={row.id || row.dbId} value={row.id || row.dbId}>{row.name}</option>)}</select><div className="relative"><Search size={14} className="absolute left-3 top-3 text-slate-400"/><input aria-label="Search community records" value={search} onChange={(event) => setSearch(event.target.value)} className={`${inputClass} pl-9`} placeholder="Search…"/></div></div></div>

    {tab === "overview" && <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-5"><CommunityKpi label="Groups" value={groups.rows.length} hint="Tenant-scoped records" icon={Users2}/><CommunityKpi label="Members" value={activeMembers.length} hint={`${activeMembers.filter((row) => row.kycStatus === "Verified").length} verified KYC`} icon={UserCheck} tone="emerald"/><CommunityKpi label="Funds" value={communityTzs(totalFund)} hint="Contributions, savings and income less outflows" icon={Coins} tone="violet"/><CommunityKpi label="Loan outstanding" value={communityTzs(loanOutstanding)} hint={`${activeLoans.filter((row) => row.approvalStatus === "Pending").length} awaiting approval`} icon={HandCoins} tone="amber"/><CommunityKpi label="Meetings" value={activeMeetings.filter((row) => row.status === "Scheduled").length} hint="Scheduled meetings" icon={CalendarCheck} tone="navy"/></div><div className="grid gap-4 lg:grid-cols-3"><CommunitySection title="Group health" subtitle="Confirmed records only"><div className="space-y-3">{visible(groups.rows, ["name", "groupType", "region"]).slice(0, 6).map((row) => <button key={row.id || row.dbId} type="button" onClick={() => { selectGroup(row.id || row.dbId); setTab("groups"); }} className="flex w-full items-center justify-between gap-3 rounded-xl border border-slate-100 p-3 text-left hover:border-violet-200 hover:bg-violet-50/30"><div className="min-w-0"><p className="truncate text-[12px] font-bold text-slate-800">{row.name}</p><p className="mt-0.5 text-[10.5px] text-slate-500">{row.groupType} · {row.region || "Tanzania"}</p></div><div className="text-right"><p className="text-[11px] font-bold text-violet-700">{members.rows.filter((m) => String(m.groupId) === String(row.id || row.dbId)).length} members</p><CommunityStatus value={row.status}/></div></button>)}{!groups.rows.length && <CommunityEmpty title="No community groups yet" detail="Create the first group to unlock member onboarding, contributions, meetings and loan workflows."/>}</div></CommunitySection><CommunitySection title="Approval queue" subtitle="Loans, welfare and expenses requiring decision"><div className="space-y-2">{approvals.rows.filter((row) => row.status === "Pending").slice(0, 7).map((row) => <div key={row.id || row.dbId} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 p-3"><div><p className="text-[12px] font-bold text-slate-800">{row.action}</p><p className="text-[10.5px] text-slate-500">{fmtGroup(row.groupId)} · {communityDate(row.requestedAt)}</p></div><CommunityStatus value={row.status}/></div>)}{!approvals.rows.filter((row) => row.status === "Pending").length && <CommunityEmpty title="Approval queue is clear" detail="New loan, welfare and expense requests will appear here."/>}</div></CommunitySection><CommunitySection title="Upcoming schedule" subtitle="Meeting and event reminders"><div className="space-y-2">{[...activeMeetings.map((row) => ({ ...row, kind: "Meeting", date: row.meetingDate })), ...events.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)).map((row) => ({ ...row, kind: row.eventType, date: row.eventDate }))].sort((a, b) => String(a.date).localeCompare(String(b.date))).slice(0, 6).map((row) => <div key={row.id || row.dbId} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3"><div className="rounded-lg bg-violet-50 px-2 py-1 text-center"><p className="text-[10px] font-black text-violet-700">{String(row.date || "").slice(5, 10)}</p></div><div className="min-w-0"><p className="truncate text-[12px] font-bold text-slate-800">{row.kind}</p><p className="text-[10.5px] text-slate-500">{row.venue || fmtGroup(row.groupId)} · {row.startTime || "Time not set"}</p></div></div>)}{!activeMeetings.length && !events.rows.length && <CommunityEmpty title="No scheduled items" detail="Schedule a meeting or community event to activate reminders."/>}</div></CommunitySection></div></div>}

    {tab === "groups" && <div className="space-y-4"><CommunitySection title="Group registry" subtitle="Registration, rules, meeting cadence and contribution configuration" action={<button type="button" onClick={() => setShowForm("group")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> Register group</button>}>{showForm === "group" && <form onSubmit={createGroup} className="mb-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/40 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Group name" required><input className={inputClass} value={groupForm.name} onChange={(e) => setGroupForm({ ...groupForm, name: e.target.value })}/></FormField><FormField label="Group type"><select className={inputClass} value={groupForm.groupType} onChange={(e) => setGroupForm({ ...groupForm, groupType: e.target.value })}>{COMMUNITY_GROUP_TYPES.map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Registration number"><input className={inputClass} value={groupForm.registrationNumber} onChange={(e) => setGroupForm({ ...groupForm, registrationNumber: e.target.value })} placeholder="Optional"/></FormField><FormField label="Region"><input className={inputClass} value={groupForm.region} onChange={(e) => setGroupForm({ ...groupForm, region: e.target.value })} placeholder="e.g. Dar es Salaam"/></FormField><FormField label="District"><input className={inputClass} value={groupForm.district} onChange={(e) => setGroupForm({ ...groupForm, district: e.target.value })}/></FormField><FormField label="Contribution frequency"><select className={inputClass} value={groupForm.contributionFrequency} onChange={(e) => setGroupForm({ ...groupForm, contributionFrequency: e.target.value })}>{["Weekly", "Bi-weekly", "Monthly", "Quarterly"].map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Contribution amount (TZS)"><input type="number" min="0" className={inputClass} value={groupForm.contributionAmount} onChange={(e) => setGroupForm({ ...groupForm, contributionAmount: e.target.value })}/></FormField><FormField label="Meeting frequency"><select className={inputClass} value={groupForm.meetingFrequency} onChange={(e) => setGroupForm({ ...groupForm, meetingFrequency: e.target.value })}>{["Weekly", "Bi-weekly", "Monthly", "Quarterly"].map((type) => <option key={type}>{type}</option>)}</select></FormField><div className="sm:col-span-2 lg:col-span-4"><FormField label="Description and group rules"><textarea className={`${inputClass} min-h-20`} value={groupForm.description} onChange={(e) => setGroupForm({ ...groupForm, description: e.target.value })} placeholder="Rules, quorum, welfare policy, loan limits and other operating rules"/></FormField></div><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("group")}/></div></form>}<div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{visible(groups.rows, ["name", "groupType", "groupNumber", "region"]).map((row) => { const count = members.rows.filter((member) => String(member.groupId) === String(row.id || row.dbId)).length; const balance = contributions.rows.filter((entry) => String(entry.groupId) === String(row.id || row.dbId) && entry.status === "Paid").reduce((sum, entry) => sum + entry.amount, 0); return <button type="button" key={row.id || row.dbId} onClick={() => selectGroup(row.id || row.dbId)} className={`rounded-2xl border p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-300 ${String(activeGroupId) === String(row.id || row.dbId) ? "border-violet-300 bg-violet-50/30" : "border-slate-200/80 bg-white"}`}><div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate text-[14px] font-black text-slate-900">{row.name}</p><p className="mt-1 text-[10.5px] text-slate-500">{row.groupNumber} · {row.groupType}</p></div><CommunityStatus value={row.status}/></div><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-2 text-center"><p className="text-[10px] text-slate-400">Members</p><p className="text-[15px] font-black text-slate-800">{count}</p></div><div className="rounded-xl bg-violet-50 p-2 text-center"><p className="text-[10px] text-violet-500">Collected</p><p className="text-[12px] font-black text-violet-700">{communityTzs(balance)}</p></div><div className="rounded-xl bg-emerald-50 p-2 text-center"><p className="text-[10px] text-emerald-500">Cycle</p><p className="text-[12px] font-black text-emerald-700">{row.contributionFrequency}</p></div></div><p className="mt-3 text-[10.5px] text-slate-500">{row.region || "Tanzania"}{row.district ? ` · ${row.district}` : ""} · {row.meetingFrequency} meetings</p></button>; })}{!groups.rows.length && <div className="md:col-span-2 xl:col-span-3"><CommunityEmpty title="Group registry is empty" detail="Register a real group; the server will generate its group number and tenant-scoped record."/></div>}</div></CommunitySection></div>}

    {tab === "members" && <div className="space-y-4"><CommunitySection title="Member onboarding and KYC" subtitle="Identification, next of kin, roles and verification status" action={<div className="flex flex-wrap gap-2"><button type="button" onClick={onOpenMemberInvitation} disabled={!canWrite || !onOpenMemberInvitation} className="inline-flex items-center gap-1.5 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-700 hover:bg-violet-100 disabled:cursor-not-allowed disabled:opacity-50"><Send size={14}/> Invite member</button><button type="button" onClick={() => setShowForm("member")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><UserPlus size={14}/> Add member</button></div>}>{showForm === "member" && <form onSubmit={createMember} className="mb-4 grid gap-3 rounded-xl border border-emerald-100 bg-emerald-50/30 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Group" required><GroupSelect value={memberForm.groupId} onChange={(value) => setMemberForm({ ...memberForm, groupId: value })}/></FormField><FormField label="Full name" required><input className={inputClass} value={memberForm.fullName} onChange={(e) => setMemberForm({ ...memberForm, fullName: e.target.value })}/></FormField><FormField label="Phone"><input className={inputClass} value={memberForm.phone} onChange={(e) => setMemberForm({ ...memberForm, phone: e.target.value })} placeholder="+255 7xx xxx xxx"/></FormField><FormField label="Email"><input type="email" className={inputClass} value={memberForm.email} onChange={(e) => setMemberForm({ ...memberForm, email: e.target.value })}/></FormField><FormField label="Identification type"><select className={inputClass} value={memberForm.idType} onChange={(e) => setMemberForm({ ...memberForm, idType: e.target.value })}>{["NIDA", "Passport", "Voter ID", "Driving Licence", "Other"].map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Identification number" required><input className={inputClass} value={memberForm.nationalId} onChange={(e) => setMemberForm({ ...memberForm, nationalId: e.target.value })}/></FormField><FormField label="Gender"><select className={inputClass} value={memberForm.gender} onChange={(e) => setMemberForm({ ...memberForm, gender: e.target.value })}><option value="">Not specified</option><option>Female</option><option>Male</option><option>Other</option></select></FormField><FormField label="Date of birth"><input type="date" className={inputClass} value={memberForm.dateOfBirth} onChange={(e) => setMemberForm({ ...memberForm, dateOfBirth: e.target.value })}/></FormField><FormField label="Role"><select className={inputClass} value={memberForm.role} onChange={(e) => setMemberForm({ ...memberForm, role: e.target.value })}>{["Member", "Chairperson", "Secretary", "Treasurer", "Loan Officer", "Welfare Officer", "Auditor"].map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Occupation"><input className={inputClass} value={memberForm.occupation} onChange={(e) => setMemberForm({ ...memberForm, occupation: e.target.value })}/></FormField><FormField label="Next of kin"><input className={inputClass} value={memberForm.nextOfKin} onChange={(e) => setMemberForm({ ...memberForm, nextOfKin: e.target.value })}/></FormField><FormField label="Next of kin phone"><input className={inputClass} value={memberForm.nextOfKinPhone} onChange={(e) => setMemberForm({ ...memberForm, nextOfKinPhone: e.target.value })}/></FormField><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("member")}/></div></form>}<div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[850px] text-left text-[11.5px]"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr>{["Member", "Group", "Identification", "Role", "Joined", "KYC", "Actions"].map((head) => <th key={head} className="px-3 py-3 font-bold">{head}</th>)}</tr></thead><tbody>{visible(activeMembers, ["fullName", "memberNumber", "nationalId", "role"]).map((row) => <tr key={row.id || row.dbId} className="border-t border-slate-100"><td className="px-3 py-3"><p className="font-bold text-slate-800">{row.fullName}</p><p className="text-[10px] text-slate-500">{row.memberNumber} · {row.phone}</p></td><td className="px-3 py-3 text-slate-600">{fmtGroup(row.groupId)}</td><td className="px-3 py-3 font-mono text-slate-600">{row.idType}: {row.nationalId}</td><td className="px-3 py-3 text-slate-600">{row.role}</td><td className="px-3 py-3 text-slate-500">{communityDate(row.joinDate)}</td><td className="px-3 py-3"><CommunityStatus value={row.kycStatus}/></td><td className="px-3 py-3"><div className="flex gap-1"><button type="button" onClick={() => verifyMember(row, "Verified")} disabled={!canWrite || row.kycStatus === "Verified"} className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700 disabled:opacity-40">Verify</button><button type="button" onClick={() => verifyMember(row, "Rejected")} disabled={!canWrite || row.kycStatus === "Rejected"} className="rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700 disabled:opacity-40">Reject</button></div></td></tr>)}</tbody></table>{!activeMembers.length && <CommunityEmpty title="No members for this group" detail="Onboard each member with a Tanzanian identification type and keep KYC pending until verified."/>}</div></CommunitySection></div>}

    {tab === "finance" && <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><CommunityKpi label="Contributions" value={communityTzs(paidContributions)} hint={`${activeContributions.filter((row) => row.status === "Paid").length} paid receipts`} icon={CircleDollarSign} tone="violet"/><CommunityKpi label="Savings balance" value={communityTzs(savingsDeposits - savingsWithdrawals)} hint="Deposits less withdrawals" icon={PiggyBank} tone="emerald"/><CommunityKpi label="Welfare paid" value={communityTzs(welfarePaid)} hint={`${activeWelfare.filter((row) => row.status === "Pending").length} claims pending`} icon={HeartHandshake} tone="rose"/><CommunityKpi label="Pending expenses" value={communityTzs(activeExpenses.filter((row) => row.status === "Pending Approval").reduce((sum, row) => sum + row.amount, 0))} hint="Approval-controlled outflows" icon={ReceiptText} tone="amber"/></div><CommunitySection title="Contributions, savings and welfare" subtitle="Mobile-money-ready receipts, member balances and welfare approvals" action={<button type="button" onClick={() => setShowForm("finance")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> Post transaction</button>}>{showForm === "finance" && <form onSubmit={createFinance} className="mb-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/30 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Transaction type"><select className={inputClass} value={financeForm.kind} onChange={(e) => setFinanceForm({ ...financeForm, kind: e.target.value, type: e.target.value === "contribution" ? "Contribution" : "Deposit" })}><option value="contribution">Contribution</option><option value="savings">Savings</option></select></FormField><FormField label="Group" required><GroupSelect value={financeForm.groupId} onChange={(value) => setFinanceForm({ ...financeForm, groupId: value, memberId: "" })}/></FormField><FormField label="Member" required><MemberSelect groupId={financeForm.groupId} value={financeForm.memberId} onChange={(value) => setFinanceForm({ ...financeForm, memberId: value })}/></FormField><FormField label="Amount (TZS)" required><input type="number" min="1" className={inputClass} value={financeForm.amount} onChange={(e) => setFinanceForm({ ...financeForm, amount: e.target.value })}/></FormField><FormField label="Contribution or savings type"><select className={inputClass} value={financeForm.type} onChange={(e) => setFinanceForm({ ...financeForm, type: e.target.value })}>{(financeForm.kind === "contribution" ? ["Contribution", "Share Purchase", "Fine", "Registration", "Special Levy"] : ["Deposit", "Withdrawal", "Dividend", "Adjustment"]).map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Payment method"><select className={inputClass} value={financeForm.paymentMethod} onChange={(e) => setFinanceForm({ ...financeForm, paymentMethod: e.target.value })}>{COMMUNITY_PAYMENT_METHODS.map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Mobile-money provider"><select className={inputClass} value={financeForm.provider} onChange={(e) => setFinanceForm({ ...financeForm, provider: e.target.value })}>{["M-Pesa", "Airtel Money", "Tigo Pesa", "Halopesa", "Azam Pesa", "N/A"].map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Reference"><input className={inputClass} value={financeForm.reference} onChange={(e) => setFinanceForm({ ...financeForm, reference: e.target.value })} placeholder="Mobile money receipt / bank ref"/></FormField><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("finance")}/></div></form>}<div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[800px] text-left text-[11.5px]"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr>{["Date", "Member", "Type", "Amount", "Method / reference", "Status", "Receipt"].map((head) => <th key={head} className="px-3 py-3 font-bold">{head}</th>)}</tr></thead><tbody>{visible(activeContributions, ["memberName", "contributionType", "reference"]).map((row) => <tr key={row.id || row.dbId} className="border-t border-slate-100"><td className="px-3 py-3 text-slate-500">{communityDate(row.contributionDate)}</td><td className="px-3 py-3 font-bold text-slate-800">{fmtMember(row.memberId)}</td><td className="px-3 py-3 text-slate-600">{row.contributionType}</td><td className="px-3 py-3 font-mono font-black text-violet-700">{communityTzs(row.amount)}</td><td className="px-3 py-3 text-slate-500">{row.paymentMethod}{row.provider ? ` · ${row.provider}` : ""}{row.reference ? ` · ${row.reference}` : ""}</td><td className="px-3 py-3"><CommunityStatus value={row.status}/></td><td className="px-3 py-3 font-mono text-slate-500">{row.receiptNumber || "—"}</td></tr>)}</tbody></table>{!activeContributions.length && <CommunityEmpty title="No contribution receipts" detail="Post a contribution with the mobile-money, bank or cash reference to create a member statement trail."/>}</div></CommunitySection><CommunitySection title="Welfare claims" subtitle="Claims are approval controlled before payment"><div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[700px] text-left text-[11.5px]"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr>{["Event", "Member", "Requested", "Date", "Status", "Action"].map((head) => <th key={head} className="px-3 py-3 font-bold">{head}</th>)}</tr></thead><tbody>{activeWelfare.map((row) => <tr key={row.id || row.dbId} className="border-t border-slate-100"><td className="px-3 py-3 font-bold text-slate-800">{row.eventType}<p className="text-[10px] font-normal text-slate-500">{row.description}</p></td><td className="px-3 py-3 text-slate-600">{fmtMember(row.memberId)}</td><td className="px-3 py-3 font-mono text-rose-700">{communityTzs(row.requested)}</td><td className="px-3 py-3 text-slate-500">{communityDate(row.claimDate)}</td><td className="px-3 py-3"><CommunityStatus value={row.status}/></td><td className="px-3 py-3">{row.status === "Pending" && <button type="button" onClick={() => approveWelfare(row)} className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700">Approve</button>}</td></tr>)}</tbody></table>{!activeWelfare.length && <CommunityEmpty title="No welfare claims" detail="Welfare claim intake can be added by posting a claim record through the connected group workflow."/>}</div></CommunitySection></div>}

    {tab === "loans" && <div className="space-y-4"><CommunitySection title="Loan portfolio and repayments" subtitle="Flat and reducing-balance calculations, guarantors, approvals and receipts" action={<button type="button" onClick={() => setShowForm("loan")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> Apply for loan</button>}>{showForm === "loan" && <form onSubmit={createLoan} className="mb-4 grid gap-3 rounded-xl border border-amber-100 bg-amber-50/30 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Group" required><GroupSelect value={loanForm.groupId} onChange={(value) => setLoanForm({ ...loanForm, groupId: value, memberId: "" })}/></FormField><FormField label="Borrower" required><MemberSelect groupId={loanForm.groupId} value={loanForm.memberId} onChange={(value) => setLoanForm({ ...loanForm, memberId: value })}/></FormField><FormField label="Principal (TZS)" required><input type="number" min="1" className={inputClass} value={loanForm.principal} onChange={(e) => setLoanForm({ ...loanForm, principal: e.target.value })}/></FormField><FormField label="Annual interest rate (%)"><input type="number" min="0" step="0.01" className={inputClass} value={loanForm.rate} onChange={(e) => setLoanForm({ ...loanForm, rate: e.target.value })}/></FormField><FormField label="Interest method"><select className={inputClass} value={loanForm.method} onChange={(e) => setLoanForm({ ...loanForm, method: e.target.value })}><option>Flat</option><option>Reducing Balance</option></select></FormField><FormField label="Term (months)"><input type="number" min="1" className={inputClass} value={loanForm.termMonths} onChange={(e) => setLoanForm({ ...loanForm, termMonths: e.target.value })}/></FormField><FormField label="Purpose"><input className={inputClass} value={loanForm.purpose} onChange={(e) => setLoanForm({ ...loanForm, purpose: e.target.value })} placeholder="Business, school fees, emergency…"/></FormField><FormField label="Guarantor member IDs"><input className={inputClass} value={loanForm.guarantorIds} onChange={(e) => setLoanForm({ ...loanForm, guarantorIds: e.target.value })} placeholder="Optional, comma separated"/></FormField><div className="rounded-xl bg-white p-3 text-[11px] text-slate-600 sm:col-span-2 lg:col-span-4">Calculated repayment: <strong className="text-slate-900">{communityTzs(calculateLoan(loanForm.principal, loanForm.rate, loanForm.termMonths, loanForm.method).repayable)}</strong> total, including <strong className="text-amber-700">{communityTzs(calculateLoan(loanForm.principal, loanForm.rate, loanForm.termMonths, loanForm.method).interest)}</strong> interest. The calculation is stored with the application for auditability.</div><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("loan")}/></div></form>}<div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[1000px] text-left text-[11.5px]"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr>{["Loan", "Borrower", "Principal", "Repayable", "Outstanding", "Approval", "Status", "Actions"].map((head) => <th key={head} className="px-3 py-3 font-bold">{head}</th>)}</tr></thead><tbody>{visible(activeLoans, ["loanNumber", "purpose", "status", "approvalStatus"]).map((row) => <tr key={row.id || row.dbId} className="border-t border-slate-100"><td className="px-3 py-3"><p className="font-mono font-bold text-slate-800">{row.loanNumber}</p><p className="text-[10px] text-slate-500">{row.interestMethod} · {row.termMonths} months</p></td><td className="px-3 py-3 text-slate-600">{fmtMember(row.memberId)}</td><td className="px-3 py-3 font-mono text-slate-800">{communityTzs(row.principal)}</td><td className="px-3 py-3 font-mono text-slate-800">{communityTzs(row.totalRepayable)}</td><td className="px-3 py-3 font-mono font-bold text-amber-700">{communityTzs(row.outstandingPrincipal + row.outstandingInterest)}</td><td className="px-3 py-3"><CommunityStatus value={row.approvalStatus}/></td><td className="px-3 py-3"><CommunityStatus value={row.status}/></td><td className="px-3 py-3"><div className="flex flex-wrap gap-1">{row.approvalStatus === "Pending" && <button type="button" onClick={() => approveLoan(row)} className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700">Approve</button>}{row.status === "Approved" && <button type="button" onClick={() => disburseLoan(row)} className="rounded-lg border border-violet-200 px-2 py-1 text-[10px] font-bold text-violet-700">Disburse</button>}{["Disbursed", "Active"].includes(row.status) && <><button type="button" onClick={() => recordRepayment(row)} className="rounded-lg border border-amber-200 px-2 py-1 text-[10px] font-bold text-amber-700">Repay</button><button type="button" onClick={() => recordPenalty(row)} className="rounded-lg border border-rose-200 px-2 py-1 text-[10px] font-bold text-rose-700">Penalty</button></>}</div></td></tr>)}</tbody></table>{!activeLoans.length && <CommunityEmpty title="No loans in this group" detail="Loan applications calculate interest and repayment at entry, then move through approval, disbursement and repayment."/>}</div></CommunitySection><CommunitySection title="Repayment ledger" subtitle="Principal, interest, penalties and payment references"><div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[760px] text-left text-[11.5px]"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr>{["Date", "Loan", "Amount", "Principal", "Interest", "Penalty", "Method / reference"].map((head) => <th key={head} className="px-3 py-3 font-bold">{head}</th>)}</tr></thead><tbody>{repayments.rows.filter((row) => !activeGroupId || activeLoans.some((loan) => String(loan.id || loan.dbId) === String(row.loanId))).map((row) => <tr key={row.id || row.dbId} className="border-t border-slate-100"><td className="px-3 py-3 text-slate-500">{communityDate(row.repaymentDate)}</td><td className="px-3 py-3 font-mono text-slate-700">{loans.rows.find((loan) => String(loan.id || loan.dbId) === String(row.loanId))?.loanNumber || row.loanId}</td><td className="px-3 py-3 font-mono font-bold text-emerald-700">{communityTzs(row.amount)}</td><td className="px-3 py-3 font-mono">{communityTzs(row.principalAmount)}</td><td className="px-3 py-3 font-mono">{communityTzs(row.interestAmount)}</td><td className="px-3 py-3 font-mono text-rose-700">{communityTzs(row.penaltyAmount)}</td><td className="px-3 py-3 text-slate-500">{row.paymentMethod} · {row.reference || "No reference"}</td></tr>)}</tbody></table>{!repayments.rows.length && <CommunityEmpty title="No repayments posted" detail="Repayment receipts will reduce outstanding principal and interest when the loan is active."/>}</div></CommunitySection></div>}

    {tab === "meetings" && <div className="space-y-4"><CommunitySection title="Meetings, agenda, minutes and attendance" subtitle="Schedule meetings, mark them held and create an attendance record for active members" action={<button type="button" onClick={() => setShowForm("meeting")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> Schedule meeting</button>}>{showForm === "meeting" && <form onSubmit={createMeeting} className="mb-4 grid gap-3 rounded-xl border border-sky-100 bg-sky-50/30 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Group" required><GroupSelect value={meetingForm.groupId} onChange={(value) => setMeetingForm({ ...meetingForm, groupId: value })}/></FormField><FormField label="Meeting date" required><input type="date" className={inputClass} value={meetingForm.meetingDate} onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}/></FormField><FormField label="Start time"><input type="time" className={inputClass} value={meetingForm.startTime} onChange={(e) => setMeetingForm({ ...meetingForm, startTime: e.target.value })}/></FormField><FormField label="Venue"><input className={inputClass} value={meetingForm.venue} onChange={(e) => setMeetingForm({ ...meetingForm, venue: e.target.value })}/></FormField><div className="sm:col-span-2 lg:col-span-4"><FormField label="Agenda"><textarea className={`${inputClass} min-h-20`} value={meetingForm.agenda} onChange={(e) => setMeetingForm({ ...meetingForm, agenda: e.target.value })} placeholder="Agenda items, quorum and decisions expected"/></FormField></div><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("meeting")}/></div></form>}<div className="space-y-3">{visible(activeMeetings, ["meetingNumber", "venue", "agenda"]).map((row) => { const present = attendance.rows.filter((entry) => String(entry.meetingId) === String(row.id || row.dbId) && entry.status === "Present").length; return <div key={row.id || row.dbId} className="rounded-xl border border-slate-100 p-4"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[13px] font-black text-slate-900">{communityDate(row.meetingDate)} · {row.venue || "Venue not set"}</p><p className="mt-1 text-[10.5px] text-slate-500">{row.meetingNumber} · {row.startTime || "Time not set"} · {fmtGroup(row.groupId)}</p></div><div className="flex items-center gap-2"><CommunityStatus value={row.status}/>{row.status === "Scheduled" && <button type="button" onClick={() => markMeetingHeld(row)} className="rounded-lg border border-violet-200 px-2 py-1 text-[10px] font-bold text-violet-700">Mark held</button>}</div></div><div className="mt-3 grid gap-3 text-[11px] text-slate-600 sm:grid-cols-2"><div><p className="font-bold text-slate-700">Agenda</p><p className="mt-1 whitespace-pre-wrap">{row.agenda || "No agenda recorded"}</p></div><div><p className="font-bold text-slate-700">Attendance</p><p className="mt-1">{present} present of {activeMembers.length} active members. {row.minutes ? "Minutes recorded." : "Minutes pending."}</p></div></div></div>})}{!activeMeetings.length && <CommunityEmpty title="No meetings scheduled" detail="Create an agenda with date, time and venue; reminders and attendance can then be tracked."/>}</div></CommunitySection></div>}

    {tab === "projects" && <div className="space-y-4"><CommunitySection title="Projects, fundraising, budgets and expenses" subtitle="Track community initiatives from planning through completion" action={<button type="button" onClick={() => setShowForm("project")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> New project</button>}>{showForm === "project" && <form onSubmit={createProject} className="mb-4 grid gap-3 rounded-xl border border-indigo-100 bg-indigo-50/30 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Group" required><GroupSelect value={projectForm.groupId} onChange={(value) => setProjectForm({ ...projectForm, groupId: value })}/></FormField><FormField label="Project name" required><input className={inputClass} value={projectForm.name} onChange={(e) => setProjectForm({ ...projectForm, name: e.target.value })}/></FormField><FormField label="Target amount (TZS)"><input type="number" min="0" className={inputClass} value={projectForm.targetAmount} onChange={(e) => setProjectForm({ ...projectForm, targetAmount: e.target.value })}/></FormField><FormField label="Start date"><input type="date" className={inputClass} value={projectForm.startDate} onChange={(e) => setProjectForm({ ...projectForm, startDate: e.target.value })}/></FormField><FormField label="End date"><input type="date" className={inputClass} value={projectForm.endDate} onChange={(e) => setProjectForm({ ...projectForm, endDate: e.target.value })}/></FormField><div className="sm:col-span-2 lg:col-span-3"><FormField label="Description"><textarea className={`${inputClass} min-h-20`} value={projectForm.description} onChange={(e) => setProjectForm({ ...projectForm, description: e.target.value })}/></FormField></div><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("project")}/></div></form>}<div className="grid gap-3 md:grid-cols-2">{visible(activeProjects, ["name", "projectNumber", "description", "status"]).map((row) => <div key={row.id || row.dbId} className="rounded-xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-black text-slate-900">{row.name}</p><p className="text-[10.5px] text-slate-500">{row.projectNumber} · target {communityTzs(row.targetAmount)}</p></div><CommunityStatus value={row.status}/></div><p className="mt-3 text-[11px] leading-5 text-slate-600">{row.description || "No project description"}</p><div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-indigo-500" style={{ width: `${Math.min(100, row.targetAmount ? fundraising.rows.filter((item) => String(item.projectId) === String(row.id || row.dbId)).reduce((sum, item) => sum + item.amount, 0) / row.targetAmount * 100 : 0)}%` }}/></div></div>)}{!activeProjects.length && <CommunityEmpty title="No projects registered" detail="Create a project to connect fundraising, budgets, expenses and asset outcomes."/>}</div></CommunitySection><CommunitySection title="Expense requests" subtitle="Approval workflow and payment tracking" action={<button type="button" onClick={() => setShowForm("expense")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> Request expense</button>}>{showForm === "expense" && <form onSubmit={createExpense} className="mb-4 grid gap-3 rounded-xl border border-rose-100 bg-rose-50/30 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Group" required><GroupSelect value={expenseForm.groupId} onChange={(value) => setExpenseForm({ ...expenseForm, groupId: value })}/></FormField><FormField label="Category"><input className={inputClass} value={expenseForm.category} onChange={(e) => setExpenseForm({ ...expenseForm, category: e.target.value })}/></FormField><FormField label="Description" required><input className={inputClass} value={expenseForm.description} onChange={(e) => setExpenseForm({ ...expenseForm, description: e.target.value })}/></FormField><FormField label="Amount (TZS)" required><input type="number" min="1" className={inputClass} value={expenseForm.amount} onChange={(e) => setExpenseForm({ ...expenseForm, amount: e.target.value })}/></FormField><FormField label="Payment method"><select className={inputClass} value={expenseForm.paymentMethod} onChange={(e) => setExpenseForm({ ...expenseForm, paymentMethod: e.target.value })}>{COMMUNITY_PAYMENT_METHODS.map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="Reference"><input className={inputClass} value={expenseForm.reference} onChange={(e) => setExpenseForm({ ...expenseForm, reference: e.target.value })}/></FormField><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("expense")}/></div></form>}<div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[700px] text-left text-[11.5px]"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr>{["Description", "Amount", "Date", "Status", "Action"].map((head) => <th key={head} className="px-3 py-3 font-bold">{head}</th>)}</tr></thead><tbody>{activeExpenses.map((row) => <tr key={row.id || row.dbId} className="border-t border-slate-100"><td className="px-3 py-3"><p className="font-bold text-slate-800">{row.description}</p><p className="text-[10px] text-slate-500">{row.category}</p></td><td className="px-3 py-3 font-mono text-rose-700">{communityTzs(row.amount)}</td><td className="px-3 py-3 text-slate-500">{communityDate(row.expenseDate)}</td><td className="px-3 py-3"><CommunityStatus value={row.status}/></td><td className="px-3 py-3">{row.status === "Pending Approval" && <button type="button" onClick={() => approveExpense(row)} className="rounded-lg border border-emerald-200 px-2 py-1 text-[10px] font-bold text-emerald-700">Approve</button>}</td></tr>)}</tbody></table>{!activeExpenses.length && <CommunityEmpty title="No expense requests" detail="Expense requests create an approval record before they can be approved or paid."/>}</div></CommunitySection><CommunitySection title="Assets register" subtitle="Community-owned assets and current value"><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{assets.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)).map((row) => <div key={row.id || row.dbId} className="rounded-xl border border-slate-100 p-3"><div className="flex items-start justify-between gap-2"><p className="text-[12px] font-bold text-slate-800">{row.name}</p><CommunityStatus value={row.status}/></div><p className="mt-1 text-[10px] text-slate-500">{row.assetCode} · {row.category || "Uncategorised"}</p><p className="mt-3 font-mono text-[12px] font-black text-indigo-700">{communityTzs(row.currentValue || row.acquisitionCost)}</p><p className="mt-1 text-[10px] text-slate-500">{row.location || "Location not set"}</p></div>)}{!assets.rows.length && <CommunityEmpty title="No assets registered" detail="Asset register records can be connected to the group’s finance and project outcomes."/>}</div></CommunitySection></div>}

    {tab === "governance" && <div className="space-y-4"><CommunitySection title="Voting, elections and approvals" subtitle="Record resolutions and review the decision trail" action={<button type="button" onClick={() => setShowForm("vote")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> New vote / election</button>}>{showForm === "vote" && <form onSubmit={createVote} className="mb-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/30 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Group" required><GroupSelect value={voteForm.groupId} onChange={(value) => setVoteForm({ ...voteForm, groupId: value })}/></FormField><FormField label="Title" required><input className={inputClass} value={voteForm.title} onChange={(e) => setVoteForm({ ...voteForm, title: e.target.value })}/></FormField><FormField label="Type"><select className={inputClass} value={voteForm.voteType} onChange={(e) => setVoteForm({ ...voteForm, voteType: e.target.value })}><option>Resolution</option><option>Election</option><option>Approval</option></select></FormField><FormField label="Quorum (%)"><input type="number" min="0" max="100" className={inputClass} value={voteForm.quorumPercent} onChange={(e) => setVoteForm({ ...voteForm, quorumPercent: e.target.value })}/></FormField><FormField label="Options (comma separated)"><input className={inputClass} value={voteForm.options} onChange={(e) => setVoteForm({ ...voteForm, options: e.target.value })}/></FormField><div className="sm:col-span-2 lg:col-span-3"><FormField label="Description"><textarea className={`${inputClass} min-h-20`} value={voteForm.description} onChange={(e) => setVoteForm({ ...voteForm, description: e.target.value })}/></FormField></div><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("vote")}/></div></form>}<div className="grid gap-3 md:grid-cols-2">{visible(votes.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)), ["title", "description", "voteType", "status"]).map((row) => <div key={row.id || row.dbId} className="rounded-xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-black text-slate-900">{row.title}</p><p className="text-[10.5px] text-slate-500">{row.voteType} · quorum {row.quorumPercent}%</p></div><CommunityStatus value={row.status}/></div><p className="mt-3 text-[11px] leading-5 text-slate-600">{row.description || "No description"}</p><p className="mt-3 text-[10px] text-slate-500">Opened {communityDate(row.opensAt)} · {fmtGroup(row.groupId)}</p></div>)}{!votes.rows.length && <CommunityEmpty title="No votes or elections" detail="Create a resolution or election to keep governance decisions traceable."/>}</div></CommunitySection><CommunitySection title="Leadership and committees" subtitle="Assign group roles and maintain committee structures" action={<button type="button" onClick={() => setShowForm("committee")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> Add committee</button>}>{showForm === "committee" && <form onSubmit={createCommittee} className="mb-4 grid gap-3 rounded-xl border border-violet-100 bg-violet-50/30 p-4 sm:grid-cols-3"><FormField label="Group" required><GroupSelect value={committeeForm.groupId} onChange={(value) => setCommitteeForm({ ...committeeForm, groupId: value })}/></FormField><FormField label="Committee name" required><input className={inputClass} value={committeeForm.name} onChange={(e) => setCommitteeForm({ ...committeeForm, name: e.target.value })} placeholder="Loan committee"/></FormField><FormField label="Committee type"><select className={inputClass} value={committeeForm.committeeType} onChange={(e) => setCommitteeForm({ ...committeeForm, committeeType: e.target.value })}>{["Management", "Loan", "Welfare", "Audit", "Election"].map((type) => <option key={type}>{type}</option>)}</select></FormField><div className="sm:col-span-3"><FormActions onCancel={() => resetForm("committee")}/></div></form>}<div className="grid gap-3 md:grid-cols-2">{committees.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)).map((row) => <div key={row.id || row.dbId} className="rounded-xl border border-slate-100 p-3"><div className="flex items-center justify-between gap-2"><div><p className="text-[12px] font-bold text-slate-800">{row.name}</p><p className="text-[10.5px] text-slate-500">{row.committeeType} · {fmtGroup(row.groupId)}</p></div><CommunityStatus value={row.status}/></div><p className="mt-2 text-[10.5px] text-slate-500">{committeeMembers.rows.filter((member) => String(member.committeeId) === String(row.id || row.dbId)).length} assigned members</p></div>)}{!committees.rows.length && <CommunityEmpty title="No committees configured" detail="Create loan, welfare, audit or election committees for group leadership accountability."/>}</div></CommunitySection><CommunitySection title="Approval history" subtitle="The approval ledger connects decisions back to their source records"><div className="space-y-2">{approvals.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)).map((row) => <div key={row.id || row.dbId} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[12px] font-bold text-slate-800">{row.action}</p><p className="text-[10.5px] text-slate-500">{row.entityType} · {communityDate(row.requestedAt)} · {fmtGroup(row.groupId)}</p></div><CommunityStatus value={row.status}/></div>)}{!approvals.rows.length && <CommunityEmpty title="No approval records" detail="Approval records are created when expense requests are submitted and when loan or welfare decisions are made."/>}</div></CommunitySection></div>}

    {tab === "communications" && <div className="space-y-4"><CommunitySection title="Announcements and group messaging" subtitle="Create in-app announcements and retain message history" action={<button type="button" onClick={() => setShowForm("comms")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> Compose</button>}>{showForm === "comms" && <form onSubmit={createComms} className="mb-4 grid gap-3 rounded-xl border border-cyan-100 bg-cyan-50/30 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Message type"><select className={inputClass} value={commsForm.kind} onChange={(e) => setCommsForm({ ...commsForm, kind: e.target.value })}><option value="announcement">Announcement</option><option value="message">Message</option></select></FormField><FormField label="Group" required><GroupSelect value={commsForm.groupId} onChange={(value) => setCommsForm({ ...commsForm, groupId: value })}/></FormField><FormField label="Title"><input className={inputClass} value={commsForm.title} onChange={(e) => setCommsForm({ ...commsForm, title: e.target.value })}/></FormField><FormField label="Audience / channel"><select className={inputClass} value={commsForm.kind === "announcement" ? commsForm.audience : commsForm.channel} onChange={(e) => setCommsForm({ ...commsForm, ...(commsForm.kind === "announcement" ? { audience: e.target.value } : { channel: e.target.value }) })}>{(commsForm.kind === "announcement" ? ["All Members", "Leaders", "Treasurers", "Committee"] : ["In-app", "SMS-ready", "WhatsApp-ready", "Email-ready"]).map((type) => <option key={type}>{type}</option>)}</select></FormField><div className="sm:col-span-2 lg:col-span-4"><FormField label={commsForm.kind === "message" ? "Message" : "Announcement body"} required><textarea className={`${inputClass} min-h-24`} value={commsForm.body} onChange={(e) => setCommsForm({ ...commsForm, body: e.target.value })}/></FormField></div><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("comms")}/></div></form>}<div className="grid gap-4 lg:grid-cols-2"><div className="space-y-2">{announcements.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)).map((row) => <div key={row.id || row.dbId} className="rounded-xl border border-slate-100 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[13px] font-black text-slate-900">{row.title}</p><p className="text-[10px] text-slate-500">{row.audience} · {communityDate(row.publishedAt)}</p></div><Megaphone size={16} className="text-cyan-600"/></div><p className="mt-3 whitespace-pre-wrap text-[11px] leading-5 text-slate-600">{row.body}</p></div>)}{!announcements.rows.length && <CommunityEmpty title="No announcements" detail="Create an announcement to write to the notification history."/>}</div><div className="space-y-2">{messages.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)).map((row) => <div key={row.id || row.dbId} className="rounded-xl border border-slate-100 p-4"><div className="flex items-center justify-between gap-3"><p className="text-[12px] font-bold text-slate-800">{row.subject || "Group message"}</p><CommunityStatus value={row.status}/></div><p className="mt-2 whitespace-pre-wrap text-[11px] leading-5 text-slate-600">{row.body}</p><p className="mt-2 text-[10px] text-slate-400">{row.channel} · {communityDate(row.createdAt)}</p></div>)}{!messages.rows.length && <CommunityEmpty title="No messages" detail="Compose a message to retain the group communication history."/>}</div></div></CommunitySection></div>}

    {tab === "documents" && <div className="space-y-4"><CommunitySection title="Documents and events" subtitle="Constitution, registers, minutes, evidence and community calendar" action={<button type="button" onClick={() => setShowForm("document")} className="btn-primary inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-[11px] font-bold text-white"><Plus size={14}/> Add record</button>}>{showForm === "document" && <form onSubmit={createDocumentOrEvent} className="mb-4 grid gap-3 rounded-xl border border-slate-200 bg-slate-50/60 p-4 sm:grid-cols-2 lg:grid-cols-4"><FormField label="Record type"><select className={inputClass} value={documentForm.kind} onChange={(e) => setDocumentForm({ ...documentForm, kind: e.target.value })}><option value="document">Document</option><option value="event">Event</option></select></FormField><FormField label="Group" required><GroupSelect value={documentForm.groupId} onChange={(value) => setDocumentForm({ ...documentForm, groupId: value })}/></FormField><FormField label="Title" required><input className={inputClass} value={documentForm.title} onChange={(e) => setDocumentForm({ ...documentForm, title: e.target.value })}/></FormField>{documentForm.kind === "document" ? <><FormField label="Document type"><select className={inputClass} value={documentForm.documentType} onChange={(e) => setDocumentForm({ ...documentForm, documentType: e.target.value })}>{["Constitution", "Minutes", "Member Register", "KYC Evidence", "Receipt", "Statement", "Other"].map((type) => <option key={type}>{type}</option>)}</select></FormField><FormField label="File URL"><input type="url" className={inputClass} value={documentForm.fileUrl} onChange={(e) => setDocumentForm({ ...documentForm, fileUrl: e.target.value })} placeholder="S3 or document URL"/></FormField><FormField label="Expiry date"><input type="date" className={inputClass} value={documentForm.expiresAt} onChange={(e) => setDocumentForm({ ...documentForm, expiresAt: e.target.value })}/></FormField></> : <><FormField label="Event type"><input className={inputClass} value={documentForm.eventType} onChange={(e) => setDocumentForm({ ...documentForm, eventType: e.target.value })}/></FormField><FormField label="Venue"><input className={inputClass} value={documentForm.venue} onChange={(e) => setDocumentForm({ ...documentForm, venue: e.target.value })}/></FormField><FormField label="Start time"><input type="time" className={inputClass} value={documentForm.startTime} onChange={(e) => setDocumentForm({ ...documentForm, startTime: e.target.value })}/></FormField></>}<FormField label={documentForm.kind === "document" ? "Document date" : "Event date"}><input type="date" className={inputClass} value={documentForm.date} onChange={(e) => setDocumentForm({ ...documentForm, date: e.target.value })}/></FormField><div className="sm:col-span-2 lg:col-span-4"><FormActions onCancel={() => resetForm("document")}/></div></form>}<div className="grid gap-4 lg:grid-cols-2"><div><h3 className="mb-2 text-[12px] font-black uppercase tracking-wide text-slate-500">Documents</h3><div className="space-y-2">{documents.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)).map((row) => <div key={row.id || row.dbId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-[12px] font-bold text-slate-800">{row.title}</p><p className="text-[10.5px] text-slate-500">{row.documentType} · {communityDate(row.documentDate)}{row.expiresAt ? ` · expires ${communityDate(row.expiresAt)}` : ""}</p></div>{row.fileUrl ? <a href={row.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] font-bold text-violet-700">Open</a> : <CommunityStatus value={row.status}/>}</div>)}{!documents.rows.length && <CommunityEmpty title="No documents" detail="Store constitutions, KYC evidence, minutes, receipts and statements against the group."/>}</div></div><div><h3 className="mb-2 text-[12px] font-black uppercase tracking-wide text-slate-500">Events</h3><div className="space-y-2">{events.rows.filter((row) => !activeGroupId || String(row.groupId) === String(activeGroupId)).map((row) => <div key={row.id || row.dbId} className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-3"><div><p className="text-[12px] font-bold text-slate-800">{row.title}</p><p className="text-[10.5px] text-slate-500">{row.eventType} · {communityDate(row.eventDate)} · {row.venue || "Venue not set"}</p></div><CommunityStatus value={row.status}/></div>)}{!events.rows.length && <CommunityEmpty title="No events" detail="Schedule training, elections, fundraising drives and other group events."/>}</div></div></div></CommunitySection></div>}

    {tab === "reports" && <div className="space-y-4"><div className="grid grid-cols-2 gap-3 lg:grid-cols-4"><CommunityKpi label="Income" value={communityTzs(paidContributions + savingsDeposits + activeIncome.reduce((sum, row) => sum + row.amount, 0))} hint="Contributions, savings and other income" icon={TrendingUp} tone="emerald"/><CommunityKpi label="Outflows" value={communityTzs(welfarePaid + expenseTotal + loanPortfolio + savingsWithdrawals)} hint="Welfare, expenses, loans and withdrawals" icon={TrendingDown} tone="rose"/><CommunityKpi label="Net movement" value={communityTzs(totalFund)} hint="Calculated group position" icon={Scale} tone="violet"/><CommunityKpi label="Repayments" value={communityTzs(repayments.rows.filter((row) => !activeGroupId || activeLoans.some((loan) => String(loan.id || loan.dbId) === String(row.loanId))).reduce((sum, row) => sum + row.amount, 0))} hint="Confirmed loan receipts" icon={ReceiptText} tone="navy"/></div><CommunitySection title="Financial statement and member balances" subtitle="Export a TZS statement for the selected group"><div className="mb-4 flex flex-wrap gap-2"><button type="button" onClick={exportStatement} className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-bold text-emerald-700"><Download size={14}/> Export contribution statement</button><button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-600"><Printer size={14}/> Print report</button></div><div className="grid gap-4 lg:grid-cols-2"><div className="rounded-xl bg-slate-50 p-4"><h3 className="text-[12px] font-black text-slate-800">Statement of funds</h3><div className="mt-3 space-y-2 text-[11px]"><div className="flex justify-between"><span className="text-slate-500">Paid contributions</span><strong>{communityTzs(paidContributions)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Savings deposits and dividends</span><strong>{communityTzs(savingsDeposits)}</strong></div><div className="flex justify-between"><span className="text-slate-500">Other income</span><strong>{communityTzs(activeIncome.reduce((sum, row) => sum + row.amount, 0))}</strong></div><div className="flex justify-between border-t border-slate-200 pt-2"><span className="text-slate-500">Welfare paid / expenses</span><strong className="text-rose-700">−{communityTzs(welfarePaid + expenseTotal + savingsWithdrawals)}</strong></div><div className="flex justify-between border-t border-slate-200 pt-2 text-[13px]"><span className="font-black text-slate-800">Net group funds</span><strong className="text-violet-700">{communityTzs(totalFund)}</strong></div></div></div><div className="overflow-x-auto rounded-xl border border-slate-100"><table className="w-full min-w-[480px] text-left text-[11px]"><thead className="bg-slate-50 text-[10px] uppercase tracking-wide text-slate-400"><tr><th className="px-3 py-2.5">Member</th><th className="px-3 py-2.5">Contributions</th><th className="px-3 py-2.5">Savings</th><th className="px-3 py-2.5">Loan due</th></tr></thead><tbody>{activeMembers.map((member) => { const c = activeContributions.filter((row) => String(row.memberId) === String(member.id || member.dbId) && row.status === "Paid").reduce((sum, row) => sum + row.amount, 0); const s = activeSavings.filter((row) => String(row.memberId) === String(member.id || member.dbId)).reduce((sum, row) => sum + (row.transactionType === "Withdrawal" ? -row.amount : row.amount), 0); const l = activeLoans.filter((row) => String(row.memberId) === String(member.id || member.dbId)).reduce((sum, row) => sum + row.outstandingPrincipal + row.outstandingInterest, 0); return <tr key={member.id || member.dbId} className="border-t border-slate-100"><td className="px-3 py-2.5 font-bold text-slate-800">{member.fullName}</td><td className="px-3 py-2.5 font-mono">{communityTzs(c)}</td><td className="px-3 py-2.5 font-mono text-emerald-700">{communityTzs(s)}</td><td className="px-3 py-2.5 font-mono text-amber-700">{communityTzs(l)}</td></tr>; })}</tbody></table>{!activeMembers.length && <CommunityEmpty title="No member balances" detail="Member balances are calculated from confirmed contributions, savings and loan rows."/>}</div></div></CommunitySection></div>}

    {tab === "activity" && <CommunitySection title="Community Groups audit trail" subtitle="Immutable operational history for group, member, finance and approval actions"><div className="space-y-2">{visible(activity.rows, ["action", "entityType", "actorName"]).map((row) => <div key={row.id || row.dbId} className="flex flex-col gap-2 rounded-xl border border-slate-100 p-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-[12px] font-bold text-slate-800">{row.action}</p><p className="text-[10.5px] text-slate-500">{row.entityType} · {row.actorName} · {fmtGroup(row.groupId)}</p></div><p className="text-[10px] font-mono text-slate-400">{communityDate(row.createdAt)}</p></div>)}{!activity.rows.length && <CommunityEmpty title="No audit events" detail="Confirmed live actions write to the dedicated Community Groups audit table and the shared activity stream."/>}</div></CommunitySection>}
  </div>;
}

function LegacyHealthcareClinicModule({ currentUser, company }) {
  const [tab, setTab] = useState("overview");
  const [subTab, setSubTab] = useState("list");
  const [selected, setSelected] = useState(null);
  const [modalType, setModalType] = useState(null); // "patient" | "doctor" | "appointment" | "visit" | "prescription" | "report" | "laborder"

  // Data hooks
  const patients      = useCompanyTable("hc_patients",      HC_PATIENTS_SEED,      { mapRow: (r) => ({ ...r, fullName: (r.firstName||"") + " " + (r.lastName||"") }) });
  const doctors       = useCompanyTable("hc_doctors",       HC_DOCTORS_SEED,       { mapRow: (r) => ({ ...r, fullName: "Dr. " + r.firstName + " " + r.lastName }) });
  const appointments  = useCompanyTable("hc_appointments",  HC_APPTS_SEED,         { mapRow: (r) => r });
  const visits        = useCompanyTable("hc_visits",        HC_VISITS_SEED,        { mapRow: (r) => r });
  const prescriptions = useCompanyTable("hc_prescriptions", HC_PRESCRIPTIONS_SEED, { mapRow: (r) => r });
  const reports       = useCompanyTable("hc_reports",       HC_REPORTS_SEED,       { mapRow: (r) => r });
  const labOrders     = useCompanyTable("hc_lab_orders",    [],                    { mapRow: (r) => r });

  // Forms
  const blankPatient  = { firstName:"", lastName:"", gender:"Male", dob:"", bloodType:"A+", marital:"Single", status:"Stable", phone:"", email:"", nationalId:"", nationality:"", occupation:"", allergies:"None", chronicDiseases:"None", notes:"" };
  const blankDoctor   = { firstName:"", lastName:"", gender:"Male", specialty:"General Medicine", dept:"General Medicine", license:"", qualifications:"", fee:"", experience:"", phone:"", email:"", bio:"" };
  const blankAppt     = { patientId:"", doctorId:"", type:"Consultation", start:"", end:"", fee:"", reason:"", notes:"" };
  const blankVisit    = { patientId:"", doctorId:"", diagnosis:"", notes:"" };
  const blankRx       = { patientId:"", doctorId:"", notes:"", drugs:[{ name:HC_MEDICATIONS[0], dosage:"", frequency:"2x/day", days:7, qty:1, instructions:"" }] };
  const blankReport   = { visitId:"", patientId:"", doctorId:"", title:"", description:"", signature:"" };

  const [pForm, setPForm] = useState(blankPatient);
  const [dForm, setDForm] = useState(blankDoctor);
  const [aForm, setAForm] = useState(blankAppt);
  const [vForm, setVForm] = useState(blankVisit);
  const [rxForm, setRxForm] = useState(blankRx);
  const [repForm, setRepForm] = useState(blankReport);
  const [labSelected, setLabSelected] = useState([]);
  const [reviewPatient, setReviewPatient] = useState(patients.rows[0] || null);
  const [reviewDoc, setReviewDoc] = useState(doctors.rows[0] || null);
  const [reviewTab, setReviewTab] = useState("prescribe");

  const nextMrn = () => "MRN-001-" + String(patients.rows.length + 1).padStart(6, "0");
  const nextId  = (prefix, arr) => prefix + String(arr.length + 1).padStart(3, "0");

  // ── Saves ──────────────────────────────────────────────────────────────
  async function savePatient() {
    if (!pForm.firstName || !pForm.lastName) return;
    const row = { ...pForm, id: docId("PT"), mrn: nextMrn(), fullName: pForm.firstName + " " + pForm.lastName };
    patients.setRows((p) => [row, ...p]);
    setPForm(blankPatient); setModalType(null);
    notify("Patient " + row.fullName + " registered (" + row.mrn + ")");
    if (IS_CONFIGURED) { try { await sb("hc_patients").insert({ first_name:row.firstName, last_name:row.lastName, mrn:row.mrn, gender:row.gender, dob:row.dob, blood_type:row.bloodType, status:row.status, phone:row.phone, email:row.email, national_id:row.nationalId, nationality:row.nationality, allergies:row.allergies, chronic_diseases:row.chronicDiseases }).run(); } catch(_e){} }
  }

  async function saveDoctor() {
    if (!dForm.firstName || !dForm.lastName) return;
    const row = { ...dForm, id: nextId("DR-", doctors.rows), fee: Number(dForm.fee)||0, experience: Number(dForm.experience)||0, status:"Active", fullName:"Dr. " + dForm.firstName + " " + dForm.lastName };
    doctors.setRows((p) => [row, ...p]);
    setDForm(blankDoctor); setModalType(null);
    notify("Dr. " + dForm.firstName + " " + dForm.lastName + " added");
    if (IS_CONFIGURED) { try { await sb("hc_doctors").insert({ first_name:row.firstName, last_name:row.lastName, specialty:row.specialty, department:row.dept, license:row.license, qualifications:row.qualifications, fee:row.fee, experience:row.experience, phone:row.phone, email:row.email, status:"Active" }).run(); } catch(_e){} }
  }

  async function saveAppointment() {
    if (!aForm.patientId || !aForm.doctorId || !aForm.start) return;
    const pat = patients.rows.find((p) => p.id === aForm.patientId);
    const doc = doctors.rows.find((d) => d.id === aForm.doctorId);
    const row = { ...aForm, id: docId("APT"), patient: pat?.fullName||"", doctor: doc?.fullName||"", fee: Number(aForm.fee)||doc?.fee||0, status:"Scheduled" };
    appointments.setRows((p) => [row, ...p]);
    setAForm(blankAppt); setModalType(null);
    notify("Appointment booked for " + pat?.fullName);
    if (IS_CONFIGURED) { try { await sb("hc_appointments").insert({ patient_id:row.patientId, doctor_id:row.doctorId, type:row.type, start_time:row.start, end_time:row.end, fee:row.fee, reason:row.reason, status:"Scheduled" }).run(); } catch(_e){} }
  }

  async function openVisit(appt) {
    const existing = visits.rows.find((v) => v.patientId === appt.patientId && v.status === "Open");
    if (existing) { notify("Patient already has an open visit", "error"); return; }
    const row = { id: docId("V"), patientId: appt.patientId, patient: appt.patient, doctorId: appt.doctorId, doctor: appt.doctor, date: new Date().toISOString(), status:"Open", diagnosis:"", notes:"" };
    visits.setRows((p) => [row, ...p]);
    appointments.setRows((p) => p.map((a) => a.id === appt.id ? { ...a, status:"In Progress" } : a));
    notify("Visit opened for " + appt.patient);
  }

  async function closeVisit(visit, diagnosis, notes) {
    visits.setRows((p) => p.map((v) => v.id === visit.id ? { ...v, status:"Closed", diagnosis, notes } : v));
    notify("Visit closed for " + visit.patient);
    logAudit("Visit closed: " + visit.id, "Healthcare", currentUser?.name||"System", visit.patient);
  }

  async function issuePrescription() {
    if (!rxForm.patientId || !rxForm.doctorId || !rxForm.drugs.length) return;
    const pat = patients.rows.find((p) => p.id === rxForm.patientId);
    const doc = doctors.rows.find((d) => d.id === rxForm.doctorId);
    const row = { ...rxForm, id: docId("RX"), patient: pat?.fullName||"", doctor: doc?.fullName||"", date: TODAY.toISOString().slice(0,10), status:"Active" };
    prescriptions.setRows((p) => [row, ...p]);
    setRxForm(blankRx); setModalType(null);
    notify("Prescription issued for " + pat?.fullName);
  }

  async function createReport() {
    if (!repForm.patientId || !repForm.doctorId || !repForm.title) return;
    const pat = patients.rows.find((p) => p.id === repForm.patientId);
    const doc = doctors.rows.find((d) => d.id === repForm.doctorId);
    const row = { ...repForm, id: docId("RPT"), patient: pat?.fullName||"", doctor: doc?.fullName||"", date: TODAY.toISOString().slice(0,10), status: repForm.signature ? "Signed":"Draft" };
    reports.setRows((p) => [row, ...p]);
    setRepForm(blankReport); setModalType(null);
    notify("Medical report created for " + pat?.fullName);
  }

  function orderLabTests() {
    if (!labSelected.length || !reviewPatient) return;
    const row = { id: docId("LAB"), patientId: reviewPatient.id, patient: reviewPatient.fullName, doctor: reviewDoc?.fullName||"", tests: labSelected, date: TODAY.toISOString().slice(0,10), status:"Ordered" };
    labOrders.setRows((p) => [row, ...p]);
    setLabSelected([]);
    notify("Lab order created: " + labSelected.length + " test(s) for " + reviewPatient.fullName);
  }

  const HC_TABS = [
    { id:"overview",     label:"Overview",       icon: LayoutDashboard },
    { id:"patients",     label:"Patients",       icon: Users },
    { id:"doctors",      label:"Doctors",        icon: Stethoscope },
    { id:"appointments", label:"Appointments",   icon: CalendarCheck },
    { id:"visits",       label:"Visits",         icon: Activity },
    { id:"vitals",       label:"Triage / Vitals",icon: HeartPulse },
    { id:"doctorreview", label:"Doctor Review",  icon: ClipboardCheck },
    { id:"reports",      label:"Medical Reports",icon: FileText },
    { id:"prescriptions",label:"Prescriptions",  icon: Pill },
    { id:"laboratory",   label:"Laboratory",     icon: FlaskConical },
    { id:"radiology",    label:"Radiology",      icon: ScanLine },
    { id:"pharmacy",     label:"Pharmacy",       icon: Package },
    { id:"hcbilling",    label:"Billing",        icon: Receipt },
  ];

  const statusColor = { Stable:"#16A34A", Urgent:"#EF4444", Critical:"#DC2626", "In Progress":"#3B82F6", Scheduled:"#6B7280", Confirmed:"#059669", Completed:"#16A34A", Cancelled:"#9CA3AF", Active:"#16A34A", Signed:"#2563EB", Draft:"#F59E0B", Open:"#3B82F6", Closed:"#6B7280", Ordered:"#7C3AED" };
  const statusBg   = { Stable:"#DCFCE7", Urgent:"#FEE2E2", Critical:"#FEE2E2", "In Progress":"#DBEAFE", Scheduled:"#F3F4F6", Confirmed:"#DCFCE7", Completed:"#DCFCE7", Cancelled:"#F3F4F6", Active:"#DCFCE7", Signed:"#DBEAFE", Draft:"#FEF3C7", Open:"#DBEAFE", Closed:"#F3F4F6", Ordered:"#F5F3FF" };
  const StatusPill = ({ s }) => <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{ background: statusBg[s]||"#F3F4F6", color: statusColor[s]||"#6B7280" }}>{s}</span>;

  const HC_BLUE  = "#1B4DE4";
  const HC_TEAL  = "#0F9D8E";

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="rounded-2xl overflow-hidden px-5 py-5" style={{ background: "linear-gradient(135deg,#1B4DE4 0%,#2D6BE4 50%,#0F9D8E 100%)" }}>
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Stethoscope size={20} className="text-white" />
              <h1 className="text-[19px] font-bold text-white">Healthcare / Clinic Manager</h1>
            </div>
            <p className="text-[12px]" style={{ color:"rgba(255,255,255,.65)" }}>
              Patients &middot; Doctors &middot; Appointments &middot; Doctor Review &middot; Lab &middot; Prescriptions
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setModalType("patient"); setPForm(blankPatient); }} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white" style={{ background:"rgba(255,255,255,.15)", border:"1px solid rgba(255,255,255,.3)" }}><UserPlus size={13} />New Patient</button>
            <button onClick={()=>downloadCSV("patients",patients.rows.map(p=>({MRN:p.mrn||p.id,Name:(p.firstName||"")+" "+(p.lastName||""),Gender:p.gender||"",DOB:p.dob||"",BloodType:p.bloodType||"",Phone:p.phone||"",Insurance:p.insuranceProvider||""})),[{key:"MRN",label:"MRN"},{key:"Name",label:"Name"},{key:"Gender",label:"Gender"},{key:"DOB",label:"DOB"},{key:"BloodType",label:"Blood Type"},{key:"Phone",label:"Phone"},{key:"Insurance",label:"Insurance"}])}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white" style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)"}}>
              <Download size={13}/> CSV
            </button>
            <button onClick={()=>{const co=window.__smartManagerCompany||{};printReport("Patient Registry",`<div class="kpi-grid"><div class="kpi"><div class="kpi-label">Patients</div><div class="kpi-value" style="color:#0891B2">${patients.rows.length}</div></div></div><table><thead><tr><th>MRN</th><th>Name</th><th>Gender</th><th>Blood Type</th><th>Phone</th><th>Insurance</th></tr></thead><tbody>${patients.rows.map((p,i)=>`<tr style="background:${i%2===0?"white":"#F8FAFB"}"><td class="bold">${p.mrn||p.id}</td><td>${(p.firstName||"")} ${(p.lastName||"")}</td><td>${p.gender||"—"}</td><td>${p.bloodType||"—"}</td><td>${p.phone||"—"}</td><td>${p.insuranceProvider||"—"}</td></tr>`).join("")}</tbody></table>`,co);}}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white" style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.3)"}}>
              <Printer size={13}/> PDF
            </button>
            <button onClick={() => setModalType("appointment")} className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[12px] font-semibold text-white" style={{ background:"rgba(255,255,255,.2)", border:"1px solid rgba(255,255,255,.3)" }}><Plus size={13} />Book Appointment</button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0.5 bg-white rounded-xl p-1 border border-slate-200 overflow-x-auto">
        {HC_TABS.map((t) => { const I = t.icon; return (
          <button key={t.id} onClick={() => setTab(t.id)} className={"flex items-center gap-1 px-3 py-2 rounded-lg text-[11.5px] font-medium transition-colors whitespace-nowrap " + (tab === t.id ? "text-white shadow-sm" : "text-slate-500 hover:bg-slate-50")} style={{ background: tab === t.id ? HC_BLUE : "transparent" }}>
            <I size={12} />{t.label}
          </button>
        ); })}
      </div>

      {/* ── OVERVIEW ──────────────────────────────────────────────────── */}
      {tab === "overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label:"Patients",         value: patients.rows.length,                           sub:"Total registered",         color:"#1B4DE4", icon:Users,          bg:"linear-gradient(135deg,#1B4DE4,#4B79F5)" },
              { label:"Doctors",          value: doctors.rows.filter(d=>d.status==="Active").length, sub:"Active practitioners",  color:"#0F9D8E", icon:Stethoscope,    bg:"linear-gradient(135deg,#0F9D8E,#26BFB1)" },
              { label:"Appointments",     value: appointments.rows.length,                       sub:"Total booked",             color:"#7C3AED", icon:CalendarCheck,  bg:"linear-gradient(135deg,#7C3AED,#9F6FF0)" },
              { label:"Open Visits",      value: visits.rows.filter(v=>v.status==="Open").length, sub:"Currently active",        color:"#059669", icon:Activity,       bg:"linear-gradient(135deg,#059669,#10B981)" },
              { label:"Prescriptions",    value: prescriptions.rows.filter(p=>p.status==="Active").length, sub:"Active today",  color:"#D97706", icon:Pill,           bg:"linear-gradient(135deg,#D97706,#F59E0B)" },
              { label:"Lab Orders",       value: labOrders.rows.length,                          sub:"Pending results",          color:"#DC2626", icon:FlaskConical,   bg:"linear-gradient(135deg,#DC2626,#EF4444)" },
            ].map((k) => (
              <div key={k.label} className="rounded-xl p-4 text-white relative overflow-hidden" style={{ background: k.bg }}>
                <div className="absolute right-3 top-3 opacity-20"><k.icon size={44} /></div>
                <p className="text-[11px] font-medium uppercase tracking-wide" style={{color:"rgba(255,255,255,.8)"}}>{k.label}</p>
                <p className="text-[32px] font-bold mt-1">{k.value}</p>
                <p className="text-[11px]" style={{color:"rgba(255,255,255,.7)"}}>{k.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Appointments by status */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">&#x25D4; Appointments by Status</p>
              {["Scheduled","Confirmed","In Progress","Completed","Cancelled"].map((s) => {
                const n = appointments.rows.filter(a=>a.status===s).length;
                return n > 0 ? (
                  <div key={s} className="flex items-center justify-between py-1.5">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{background:statusColor[s]}} /><span className="text-[12px] text-slate-600">{s}</span></div>
                    <span className="text-[13px] font-bold" style={{color:statusColor[s]}}>{n}</span>
                  </div>
                ) : null;
              })}
            </div>

            {/* Upcoming appointments */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">&#x1F4C5; Upcoming Appointments</p>
              <div className="space-y-2">
                {appointments.rows.filter(a=>a.status!=="Cancelled"&&a.status!=="Completed").map((a) => (
                  <div key={a.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{background:HC_BLUE}}>{a.patient.charAt(0)}</div>
                    <div className="flex-1 min-w-0"><p className="text-[12px] font-medium text-[#111827] truncate">{a.patient}</p><p className="text-[10.5px] text-slate-400">{a.doctor} &middot; {a.type}</p></div>
                    <StatusPill s={a.status} />
                  </div>
                ))}
                {appointments.rows.filter(a=>a.status!=="Cancelled"&&a.status!=="Completed").length === 0 && <p className="text-[12px] text-slate-400 py-4 text-center">No upcoming appointments</p>}
              </div>
            </div>

            {/* Recent visits */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">&#x1F3E5; Recent Visits</p>
              <div className="space-y-2">
                {visits.rows.slice(0,4).map((v) => (
                  <div key={v.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                    <Activity size={14} style={{color:HC_TEAL}} className="shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-[12px] font-medium text-[#111827] truncate">{v.patient}</p><p className="text-[10.5px] text-slate-400 truncate">{v.diagnosis||"Pending"}</p></div>
                    <StatusPill s={v.status} />
                  </div>
                ))}
                {visits.rows.length === 0 && <p className="text-[12px] text-slate-400 py-4 text-center">No visits yet</p>}
              </div>
            </div>
          </div>

          {/* ANALYTICS ROW: Appointment status PieChart + Doctor workload BarChart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Appointment Status Distribution</h3>
              {(() => {
                const apptData = ["Scheduled","Confirmed","In Progress","Completed","Cancelled"].map((s,i)=>({
                  name:s, value:appointments.rows.filter(a=>a.status===s).length,
                  fill:["#F59E0B","#2563EB","#7C3AED","#16A34A","#EF4444"][i],
                })).filter(d=>d.value>0);
                return apptData.length===0?<p className="text-slate-400 text-center py-6">No appointments</p>:(
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={150}>
                      <RPieChart><Pie data={apptData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={32}>
                        {apptData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                      </Pie><Tooltip formatter={(v,n)=>[v+" appointments",n]}/></RPieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5">
                      {apptData.map(d=>(
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[12px]"><span className="w-2.5 h-2.5 rounded-full" style={{background:d.fill}}/>{d.name}</span>
                          <span className="text-[13px] font-bold" style={{color:d.fill}}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Appointment Load by Doctor</h3>
              {(() => {
                const doctorLoad = doctors.rows.map((d,i)=>({
                  name: d.fullName?.split(" ").pop()||d.lastName||"Dr.",
                  value: appointments.rows.filter(a=>a.doctorId===d.id).length,
                  fill: ["#1B4DE4","#059669","#D97706","#7C3AED","#EF4444"][i%5],
                })).filter(d=>d.value>0).sort((a,b)=>b.value-a.value).slice(0,6);
                return doctorLoad.length===0?<p className="text-slate-400 text-center py-6">No appointment data</p>:(
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={doctorLoad} margin={{left:0,right:10,top:0,bottom:0}}>
                      <CartesianGrid vertical={false} stroke="#EEF1F4"/>
                      <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v)=>[v+" appointments","Count"]}/>
                      <Bar dataKey="value" radius={[4,4,0,0]} maxBarSize={36}>
                        {doctorLoad.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* ── PATIENTS ──────────────────────────────────────────────────── */}
      {tab === "patients" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500">{patients.rows.length} registered patients</p>
            <button onClick={() => downloadCSV("patients", patients.rows, [{key:"mrn",label:"MRN"},{key:"fullName",label:"Name"},{key:"gender",label:"Gender"},{key:"bloodType",label:"Blood Type"},{key:"phone",label:"Phone"},{key:"status",label:"Status"},{key:"allergies",label:"Allergies"}])} className="flex items-center gap-1 text-[12px] font-medium text-slate-500 border border-slate-200 px-3 py-2.5 rounded-xl hover:border-blue-400 hover:text-blue-600 mr-1"><Download size={13}/>Export</button><button onClick={() => { setModalType("patient"); setPForm(blankPatient); }} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HC_BLUE}}><UserPlus size={13}/>New Patient</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">
                {["MRN","Patient","Age / Gender","Blood","Phone","Status","Allergies","Actions"].map((h) => <th key={h} className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}
              </tr></thead>
              <tbody>
                {patients.rows.map((p) => (
                  <tr key={p.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] font-medium" style={{color:HC_BLUE}}>{p.mrn}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-bold text-white shrink-0" style={{background:HC_BLUE}}>{(p.firstName||"?").charAt(0)}{(p.lastName||"").charAt(0)}</div>
                        <div><p className="font-medium text-[#111827]">{p.fullName}</p><p className="text-[10.5px] text-slate-400">{p.email}</p></div>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{p.age ? p.age + " yrs" : "—"} / {p.gender}</td>
                    <td className="px-4 py-3 font-semibold" style={{color:HC_BLUE}}>{p.bloodType}</td>
                    <td className="px-4 py-3 text-slate-500">{p.phone}</td>
                    <td className="px-4 py-3"><StatusPill s={p.status}/></td>
                    <td className="px-4 py-3 text-slate-500 text-[11.5px] max-w-[120px] truncate">{p.allergies}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <button onClick={() => { setReviewPatient(p); setTab("doctorreview"); }} title="Doctor Review" className="p-1 rounded text-slate-300 hover:text-[#1B4DE4]"><ClipboardCheck size={13}/></button>
                        <button onClick={() => setSelected(p)} title="View" className="p-1 rounded text-slate-300 hover:text-[#0F9D8E]"><Eye size={13}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DOCTORS ───────────────────────────────────────────────────── */}
      {tab === "doctors" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500">{doctors.rows.length} practitioners</p>
            <button onClick={() => { setModalType("doctor"); setDForm(blankDoctor); }} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HC_BLUE}}><Plus size={13}/>New Doctor</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {doctors.rows.map((d) => (
              <div key={d.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0" style={{background:HC_BLUE}}>{d.firstName.charAt(0)}{d.lastName.charAt(0)}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-semibold text-[#111827]">{d.fullName}</p>
                    <p className="text-[11.5px] text-slate-400">{d.id} &middot; {d.specialty}</p>
                    <div className="flex gap-1 mt-1">
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-[#1B4DE4]">{d.specialty}</span>
                      <StatusPill s={d.status} />
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-slate-100 pt-3">
                  <div><p className="text-[10.5px] text-slate-400">Fee</p><p className="text-[13px] font-semibold text-[#111827]">SAR {d.fee}</p></div>
                  <div><p className="text-[10.5px] text-slate-400">Experience</p><p className="text-[13px] font-semibold text-[#111827]">{d.experience} yrs</p></div>
                </div>
                <div className="flex gap-2 mt-3">
                  <button onClick={() => setSelected(d)} className="flex-1 flex items-center justify-center gap-1 text-[11.5px] font-medium py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-[#1B4DE4] hover:text-[#1B4DE4] transition-colors"><Eye size={12}/>View</button>
                  <button className="flex-1 flex items-center justify-center gap-1 text-[11.5px] font-medium py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:border-[#0F9D8E] hover:text-[#0F9D8E] transition-colors"><Edit2 size={12}/>Edit</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── APPOINTMENTS ──────────────────────────────────────────────── */}
      {tab === "appointments" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500">{appointments.rows.length} appointments</p>
            <button onClick={() => { setModalType("appointment"); setAForm(blankAppt); }} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HC_BLUE}}><Plus size={13}/>Book Appointment</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["#","Patient","Doctor","Type","Date / Time","Fee","Status","Action"].map(h=><th key={h} className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>
                {appointments.rows.map((a, i) => (
                  <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-400">{i+1}</td>
                    <td className="px-4 py-3 font-medium text-[#111827]">{a.patient}</td>
                    <td className="px-4 py-3 text-slate-600">{a.doctor}</td>
                    <td className="px-4 py-3 text-slate-500">{a.type}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-slate-500">{a.start?.replace("T"," ")}</td>
                    <td className="px-4 py-3 font-mono font-semibold text-[#111827]">SAR {a.fee}</td>
                    <td className="px-4 py-3"><StatusPill s={a.status}/></td>
                    <td className="px-4 py-3">
                      {(a.status==="Scheduled"||a.status==="Confirmed") && (
                        <button onClick={() => openVisit(a)} className="text-[11px] font-semibold text-white px-2.5 py-1 rounded-lg" style={{background:HC_TEAL}}>Open Visit</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── VISITS ────────────────────────────────────────────────────── */}
      {tab === "visits" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500">{visits.rows.length} visits total</p>
            <button onClick={() => { setModalType("visit"); setVForm(blankVisit); }} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HC_BLUE}}><Plus size={13}/>Open Visit</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["Visit ID","Patient","Doctor","Date","Diagnosis","Status","Action"].map(h=><th key={h} className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>
                {visits.rows.map((v) => (
                  <tr key={v.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-mono text-[11px] font-medium" style={{color:HC_BLUE}}>{v.id}</td>
                    <td className="px-4 py-3 font-medium text-[#111827]">{v.patient}</td>
                    <td className="px-4 py-3 text-slate-600">{v.doctor}</td>
                    <td className="px-4 py-3 font-mono text-[11.5px] text-slate-400">{v.date?.slice(0,16)?.replace("T"," ")}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[180px] truncate">{v.diagnosis||"Pending"}</td>
                    <td className="px-4 py-3"><StatusPill s={v.status}/></td>
                    <td className="px-4 py-3">
                      {v.status==="Open" && (
                        <button onClick={() => { const diag=prompt("Diagnosis:"); if(diag) closeVisit(v,diag,v.notes); }} className="text-[11px] font-semibold text-white px-2.5 py-1 rounded-lg bg-slate-600">Close</button>
                      )}
                      <button onClick={() => { const pat=patients.rows.find(p=>p.id===v.patientId); setReviewPatient(pat); setTab("doctorreview"); }} className="ml-1 text-[11px] font-medium text-[#1B4DE4] hover:underline">Review</button>
                    </td>
                  </tr>
                ))}
                {visits.rows.length===0 && <tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No visits yet. Open a visit from the Appointments tab.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── DOCTOR REVIEW ─────────────────────────────────────────────── */}
      {tab === "doctorreview" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div><h3 className="text-[15px] font-semibold text-[#111827]">Doctor Review</h3><p className="text-[12px] text-slate-400">Verify analyses, review the patient file, and approve what is needed.</p></div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-slate-500">Reviewing doctor:</span>
              <select className={inputClass + " text-[12.5px]"} value={reviewDoc?.id||""} onChange={e=>setReviewDoc(doctors.rows.find(d=>d.id===e.target.value)||null)}>
                {doctors.rows.map(d=><option key={d.id} value={d.id}>{d.fullName}</option>)}
              </select>
            </div>
          </div>

          {/* Patient card */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-white" style={{background:HC_BLUE}}>{reviewPatient?.firstName?.charAt(0)||"?"}{reviewPatient?.lastName?.charAt(0)||""}</div>
                <div>
                  <p className="text-[17px] font-bold text-[#111827]">{reviewPatient?.fullName||"No patient selected"}</p>
                  <p className="text-[12px] font-medium" style={{color:HC_BLUE}}>{reviewPatient?.mrn}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {reviewPatient?.gender && <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{reviewPatient.gender}</span>}
                    {reviewPatient?.age && <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{reviewPatient.age} yrs</span>}
                    {reviewPatient?.bloodType && <span className="text-[11.5px] px-2 py-0.5 rounded-full bg-blue-50 text-[#1B4DE4] font-semibold">{reviewPatient.bloodType}</span>}
                    {reviewPatient?.status && <StatusPill s={reviewPatient.status} />}
                  </div>
                </div>
              </div>
              <select className={inputClass + " text-[12.5px]"} value={reviewPatient?.id||""} onChange={e=>setReviewPatient(patients.rows.find(p=>p.id===e.target.value)||null)}>
                {patients.rows.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
              <div><p className="text-[10.5px] uppercase tracking-wide text-slate-400 mb-1">&#9888; Allergies</p><p className="text-[12.5px] text-[#111827]">{reviewPatient?.allergies||"None"}</p></div>
              <div><p className="text-[10.5px] uppercase tracking-wide text-slate-400 mb-1">&#x2693; Chronic Diseases</p><p className="text-[12.5px] text-[#111827]">{reviewPatient?.chronicDiseases||"None"}</p></div>
            </div>
          </div>

          {/* Lab results for this patient */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <p className="text-[13.5px] font-semibold text-[#111827] mb-3">&#x1F9EA; Analyses / Lab Orders</p>
            {labOrders.rows.filter(l=>l.patientId===reviewPatient?.id).length === 0
              ? <p className="text-[12.5px] text-slate-400">No analyses for this patient yet.</p>
              : labOrders.rows.filter(l=>l.patientId===reviewPatient?.id).map((lo) => (
                  <div key={lo.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-slate-50 mb-2">
                    <FlaskConical size={14} style={{color:"#7C3AED"}} className="shrink-0"/>
                    <div className="flex-1"><p className="text-[12px] font-medium text-[#111827]">{lo.tests?.join(", ")}</p><p className="text-[10.5px] text-slate-400">{lo.date} &middot; {lo.doctor}</p></div>
                    <StatusPill s={lo.status}/>
                  </div>
                ))
            }
          </div>

          {/* Action tabs */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <div className="flex gap-1 mb-4 border-b border-slate-100 pb-3">
              {[["prescribe","&#x1F489; Prescribe medications"],["laborder","&#x1F9EA; Order analysis"],["referral","&#x2708; Referral"]].map(([id,label]) => (
                <button key={id} onClick={()=>setReviewTab(id)} className={"px-3 py-1.5 rounded-lg text-[12.5px] font-medium transition-colors " + (reviewTab===id?"text-white":"text-slate-500 hover:bg-slate-50")} style={{background:reviewTab===id?HC_BLUE:"transparent"}} dangerouslySetInnerHTML={{__html:label}}/>
              ))}
            </div>

            {reviewTab === "prescribe" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <FormField label="Doctor"><select className={inputClass} value={reviewDoc?.id||""} onChange={e=>setReviewDoc(doctors.rows.find(d=>d.id===e.target.value)||null)}>{doctors.rows.map(d=><option key={d.id} value={d.id}>{d.fullName}</option>)}</select></FormField>
                  <FormField label="Drug Name"><input className={inputClass} placeholder="e.g. Paracetamol 500mg" defaultValue="" id="rx-drug"/></FormField>
                  <FormField label="Dosage"><input className={inputClass} placeholder="500mg" id="rx-dose"/></FormField>
                  <FormField label="Frequency"><input className={inputClass} defaultValue="2x/day" id="rx-freq"/></FormField>
                  <FormField label="Days"><input type="number" className={inputClass} defaultValue="7" id="rx-days"/></FormField>
                  <FormField label="Instructions"><input className={inputClass} placeholder="After meals" id="rx-instructions"/></FormField>
                </div>
                <button onClick={() => {
                  const drug = document.getElementById("rx-drug")?.value;
                  if (!drug || !reviewPatient) { notify("Enter drug name and select a patient","error"); return; }
                  const row = { id:docId("RX"), patientId:reviewPatient.id, patient:reviewPatient.fullName, doctorId:reviewDoc?.id||"", doctor:reviewDoc?.fullName||"", date:TODAY.toISOString().slice(0,10), status:"Active", notes:"",
                    drugs:[{ name:drug, dosage:document.getElementById("rx-dose")?.value||"", frequency:document.getElementById("rx-freq")?.value||"2x/day", days:Number(document.getElementById("rx-days")?.value)||7, qty:1, instructions:document.getElementById("rx-instructions")?.value||"" }]
                  };
                  prescriptions.setRows(p=>[row,...p]);
                  notify("Prescription issued for " + reviewPatient.fullName);
                }} className="text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HC_BLUE}}>Issue Prescription</button>
              </div>
            )}

            {reviewTab === "laborder" && (
              <div className="space-y-3">
                <p className="text-[12.5px] text-slate-500">Select tests to order for <strong>{reviewPatient?.fullName}</strong></p>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 max-h-48 overflow-y-auto">
                  {HC_LAB_TESTS.map((test) => (
                    <label key={test} className="flex items-center gap-2 text-[12.5px] text-slate-700 cursor-pointer py-0.5">
                      <input type="checkbox" checked={labSelected.includes(test)} onChange={e=>setLabSelected(prev=>e.target.checked?[...prev,test]:prev.filter(t=>t!==test))} className="rounded" style={{accentColor:HC_BLUE}}/>
                      {test}
                      <span className="text-[10px] text-slate-400 ml-auto">Blood</span>
                    </label>
                  ))}
                </div>
                {labSelected.length > 0 && <p className="text-[12px] text-[#1B4DE4] font-medium">{labSelected.length} test(s) selected</p>}
                <button onClick={orderLabTests} disabled={labSelected.length===0||!reviewPatient} className="text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl disabled:opacity-40" style={{background:HC_BLUE}}>Order Analysis</button>
              </div>
            )}

            {reviewTab === "referral" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Refer To (Specialty)"><input className={inputClass} placeholder="e.g. Cardiology, Orthopedics"/></FormField>
                  <FormField label="Urgency"><select className={inputClass}><option>Routine</option><option>Urgent</option><option>Emergency</option></select></FormField>
                  <FormField label="Reason" cls="col-span-2"><textarea className={inputClass + " min-h-[70px] resize-none"} placeholder="Reason for referral..."/></FormField>
                </div>
                <button onClick={()=>notify("Referral created for " + reviewPatient?.fullName)} className="text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HC_BLUE}}>Create Referral</button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── MEDICAL REPORTS ───────────────────────────────────────────── */}
      {tab === "reports" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500">{reports.rows.length} medical reports</p>
            <button onClick={() => { setModalType("report"); setRepForm(blankReport); }} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HC_BLUE}}><Plus size={13}/>New Report</button>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]"><thead><tr className="border-b border-slate-100 bg-slate-50">{["Report ID","Patient","Doctor","Title","Date","Status",""].map(h=><th key={h} className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>{reports.rows.length===0?<tr><td colSpan={7} className="px-4 py-10 text-center text-slate-400">No reports yet.</td></tr>:reports.rows.map((r)=>(
                <tr key={r.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-[11px] font-medium" style={{color:HC_BLUE}}>{r.id}</td>
                  <td className="px-4 py-3 font-medium text-[#111827]">{r.patient}</td>
                  <td className="px-4 py-3 text-slate-600">{r.doctor}</td>
                  <td className="px-4 py-3 font-medium text-[#111827]">{r.title}</td>
                  <td className="px-4 py-3 font-mono text-slate-400">{r.date}</td>
                  <td className="px-4 py-3"><StatusPill s={r.status}/></td>
                  <td className="px-4 py-3"><button onClick={()=>setSelected(r)} className="text-[11px] text-[#1B4DE4] hover:underline font-medium">View</button></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PRESCRIPTIONS ─────────────────────────────────────────────── */}
      {tab === "prescriptions" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[13px] text-slate-500">{prescriptions.rows.length} prescriptions issued</p>
            <div className="flex gap-2">
              <button onClick={()=>downloadCSV("prescriptions",prescriptions.rows.map(rx=>({ID:rx.id,Patient:rx.patient,Doctor:rx.doctor,Date:rx.date,Status:rx.status,Notes:rx.notes||""})),[{key:"ID",label:"ID"},{key:"Patient",label:"Patient"},{key:"Doctor",label:"Doctor"},{key:"Date",label:"Date"},{key:"Status",label:"Status"},{key:"Notes",label:"Notes"}])}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#16A34A] border border-[#16A34A]/25 bg-[#F0FDF4] px-3 py-2 rounded-lg">
                <Download size={12}/> CSV
              </button>
              <button onClick={() => { setModalType("prescription"); setRxForm(blankRx); }} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HC_BLUE}}><Plus size={13}/>New Prescription</button>
            </div>
          </div>
          <div className="space-y-3">
            {prescriptions.rows.map((rx) => (
              <div key={rx.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2"><span className="font-mono text-[11px] font-medium" style={{color:HC_BLUE}}>{rx.id}</span><StatusPill s={rx.status}/></div>
                    <p className="text-[14px] font-semibold text-[#111827] mt-0.5">{rx.patient}</p>
                    <p className="text-[12px] text-slate-400">{rx.doctor} &middot; {rx.date}</p>
                  </div>
                  <Pill size={18} style={{color:HC_BLUE}} className="shrink-0 mt-1"/>
                </div>
                <div className="space-y-1.5">
                  {rx.drugs?.map((d,i) => (
                    <div key={i} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                      <div><p className="text-[12.5px] font-medium text-[#111827]">{d.name}</p><p className="text-[11px] text-slate-400">{d.dosage} &middot; {d.frequency} &middot; {d.days} days &middot; Qty: {d.qty}</p></div>
                      <p className="text-[11px] text-slate-400 italic">{d.instructions}</p>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {prescriptions.rows.length===0&&<div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center"><Pill size={28} className="text-slate-200 mx-auto mb-2"/><p className="text-slate-400">No prescriptions yet.</p></div>}
          </div>
        </div>
      )}

      {/* ── LABORATORY ────────────────────────────────────────────────── */}
      {tab === "laboratory" && (
        <div className="space-y-4">
          <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200">
            {["Categories","Tests Catalog","Orders"].map((t,i)=>(
              <button key={t} onClick={()=>setSubTab(["cats","catalog","orders"][i])} className={"flex-1 py-2 rounded-lg text-[12.5px] font-medium transition-colors " + (subTab===["cats","catalog","orders"][i]?"text-white":"text-slate-500")} style={{background:subTab===["cats","catalog","orders"][i]?HC_BLUE:"transparent"}}>{t}</button>
            ))}
          </div>
          {(subTab==="cats"||!subTab||subTab==="list") && (
            <div>
              <div className="flex items-center justify-between mb-3"><p className="text-[13.5px] font-semibold text-[#111827]">Laboratory Categories</p><button onClick={()=>notify("Category form — add via settings")} className="flex items-center gap-1 text-[12.5px] font-medium text-white px-3 py-2 rounded-xl" style={{background:HC_BLUE}}><Plus size={12}/>New Category</button></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {HC_LAB_CATEGORIES.map((cat) => (
                  <div key={cat.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 hover:border-[#1B4DE4] transition-colors cursor-pointer">
                    <p className="text-[13.5px] font-semibold text-[#111827]">{cat.name}</p>
                    <p className="text-[12px] text-slate-400 mt-0.5">{cat.nameAr}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
          {subTab==="catalog" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Tests Catalog ({HC_LAB_TESTS.length} tests)</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {HC_LAB_TESTS.map((t) => (
                  <div key={t} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50">
                    <span className="text-[12.5px] text-[#111827]">{t}</span>
                    <span className="text-[10px] text-slate-400">Blood</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {subTab==="orders" && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <p className="text-[13.5px] font-semibold text-[#111827]">Lab Orders</p>
              </div>
              <table className="w-full text-[12.5px]"><thead><tr className="border-b border-slate-100 bg-slate-50">{["Order #","Patient","Tests","Date","Status"].map(h=><th key={h} className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
                <tbody>{labOrders.rows.length===0?<tr><td colSpan={5} className="px-4 py-10 text-center text-slate-400">No lab orders. Order from Doctor Review tab.</td></tr>:labOrders.rows.map((lo)=>(
                  <tr key={lo.id} className="border-b border-slate-50 last:border-0">
                    <td className="px-4 py-3 font-mono text-[11px] font-medium" style={{color:"#7C3AED"}}>{lo.id}</td>
                    <td className="px-4 py-3 font-medium text-[#111827]">{lo.patient}</td>
                    <td className="px-4 py-3 text-slate-500 max-w-[200px] truncate">{lo.tests?.join(", ")}</td>
                    <td className="px-4 py-3 font-mono text-slate-400">{lo.date}</td>
                    <td className="px-4 py-3"><StatusPill s={lo.status}/></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── PHARMACY ──────────────────────────────────────────────────── */}
      {tab === "pharmacy" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white rounded-xl border border-slate-200/80 p-4"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Active Prescriptions</p><p className="text-[22px] font-bold" style={{color:HC_BLUE}}>{prescriptions.rows.filter(p=>p.status==="Active").length}</p></div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Dispensed Today</p><p className="text-[22px] font-bold text-[#16A34A]">0</p></div>
            <div className="bg-white rounded-xl border border-slate-200/80 p-4"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">Medications</p><p className="text-[22px] font-bold text-[#7C3AED]">{HC_MEDICATIONS.length}</p></div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Pending Dispensing</p>
            <div className="space-y-2">
              {prescriptions.rows.filter(p=>p.status==="Active").map((rx) => (
                <div key={rx.id} className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-[#1B4DE4] transition-colors">
                  <div>
                    <p className="text-[13px] font-semibold text-[#111827]">{rx.patient}</p>
                    <p className="text-[11.5px] text-slate-400">{rx.drugs?.map(d=>d.name).join(", ")} &middot; {rx.date}</p>
                  </div>
                  <button onClick={()=>{prescriptions.setRows(p=>p.map(r=>r.id===rx.id?{...r,status:"Dispensed"}:r));notify("Dispensed to "+rx.patient);}} className="text-[12px] font-semibold text-white px-3 py-1.5 rounded-lg" style={{background:HC_TEAL}}>Dispense</button>
                </div>
              ))}
              {prescriptions.rows.filter(p=>p.status==="Active").length===0 && <p className="text-[12.5px] text-slate-400 py-6 text-center">No prescriptions pending dispensing.</p>}
            </div>
          </div>
        </div>
      )}

      {/* ── VITALS / TRIAGE ──────────────────────────────────────────── */}
      {tab === "vitals" && (
        <VitalsTriageView patients={patients} currentUser={currentUser} HC_BLUE={HC_BLUE} />
      )}

      {/* ── RADIOLOGY ─────────────────────────────────────────────────── */}
      {tab === "radiology" && (
        <RadiologyView patients={patients} doctors={doctors} currentUser={currentUser} HC_BLUE={HC_BLUE} HC_TEAL={HC_TEAL} />
      )}

      {/* ── HC BILLING ────────────────────────────────────────────────── */}
      {tab === "hcbilling" && (
        <HCBillingView patients={patients} appointments={appointments} visits={visits} prescriptions={prescriptions} labOrders={labOrders} currentUser={currentUser} HC_BLUE={HC_BLUE} />
      )}

      {/* ── MODALS ────────────────────────────────────────────────────── */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:"rgba(0,0,0,0.45)"}} onClick={()=>setModalType(null)}>
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>

            {/* NEW PATIENT */}
            {modalType === "patient" && (<>
              <div className="flex items-center justify-between mb-5"><h2 className="text-[17px] font-semibold text-[#111827]">New Patient</h2><button onClick={()=>setModalType(null)} className="text-slate-400"><X size={18}/></button></div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First name *"><input className={inputClass} value={pForm.firstName} onChange={e=>setPForm({...pForm,firstName:e.target.value})} placeholder="First name"/></FormField>
                <FormField label="Last name *"><input className={inputClass} value={pForm.lastName} onChange={e=>setPForm({...pForm,lastName:e.target.value})} placeholder="Last name"/></FormField>
                <FormField label="National ID"><input className={inputClass} value={pForm.nationalId} onChange={e=>setPForm({...pForm,nationalId:e.target.value})}/></FormField>
                <FormField label="Date of birth"><input type="date" className={inputClass} value={pForm.dob} onChange={e=>setPForm({...pForm,dob:e.target.value})}/></FormField>
                <FormField label="Gender"><select className={inputClass} value={pForm.gender} onChange={e=>setPForm({...pForm,gender:e.target.value})}><option>Male</option><option>Female</option></select></FormField>
                <FormField label="Blood Type"><select className={inputClass} value={pForm.bloodType} onChange={e=>setPForm({...pForm,bloodType:e.target.value})}>{BLOOD_TYPES.map(b=><option key={b}>{b}</option>)}</select></FormField>
                <FormField label="Marital Status"><select className={inputClass} value={pForm.marital} onChange={e=>setPForm({...pForm,marital:e.target.value})}><option>Single</option><option>Married</option><option>Divorced</option><option>Widowed</option></select></FormField>
                <FormField label="Status"><select className={inputClass} value={pForm.status} onChange={e=>setPForm({...pForm,status:e.target.value})}><option>Stable</option><option>Urgent</option><option>Critical</option></select></FormField>
                <FormField label="Phone"><input className={inputClass} value={pForm.phone} onChange={e=>setPForm({...pForm,phone:e.target.value})} placeholder="05XXXXXXXX"/></FormField>
                <FormField label="Email"><input className={inputClass} value={pForm.email} onChange={e=>setPForm({...pForm,email:e.target.value})}/></FormField>
                <FormField label="Nationality"><input className={inputClass} value={pForm.nationality} onChange={e=>setPForm({...pForm,nationality:e.target.value})}/></FormField>
                <FormField label="Occupation"><input className={inputClass} value={pForm.occupation} onChange={e=>setPForm({...pForm,occupation:e.target.value})}/></FormField>
                <FormField label="Allergies" cls="col-span-2"><input className={inputClass} value={pForm.allergies} onChange={e=>setPForm({...pForm,allergies:e.target.value})} placeholder="e.g. Penicillin, None"/></FormField>
                <FormField label="Chronic Diseases" cls="col-span-2"><input className={inputClass} value={pForm.chronicDiseases} onChange={e=>setPForm({...pForm,chronicDiseases:e.target.value})} placeholder="e.g. Diabetes, Hypertension, None"/></FormField>
                <FormField label="Notes" cls="col-span-2"><textarea className={inputClass + " min-h-[60px] resize-none"} value={pForm.notes} onChange={e=>setPForm({...pForm,notes:e.target.value})}/></FormField>
              </div>
              <div className="flex gap-2 mt-4 justify-end"><button onClick={()=>setModalType(null)} className="px-4 py-2.5 rounded-xl text-[13px] text-slate-500 border border-slate-200">Cancel</button><button onClick={savePatient} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{background:HC_BLUE}}>Create patient</button></div>
            </>)}

            {/* NEW DOCTOR */}
            {modalType === "doctor" && (<>
              <div className="flex items-center justify-between mb-5"><h2 className="text-[17px] font-semibold text-[#111827]">New Doctor</h2><button onClick={()=>setModalType(null)} className="text-slate-400"><X size={18}/></button></div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="First name *"><input className={inputClass} value={dForm.firstName} onChange={e=>setDForm({...dForm,firstName:e.target.value})}/></FormField>
                <FormField label="Last name *"><input className={inputClass} value={dForm.lastName} onChange={e=>setDForm({...dForm,lastName:e.target.value})}/></FormField>
                <FormField label="Gender"><select className={inputClass} value={dForm.gender} onChange={e=>setDForm({...dForm,gender:e.target.value})}><option>Male</option><option>Female</option></select></FormField>
                <FormField label="Department"><select className={inputClass} value={dForm.dept} onChange={e=>setDForm({...dForm,dept:e.target.value,specialty:e.target.value})}>
                  {["General Medicine","Cardiology","Neurology","Pediatrics","Orthopedics","Dermatology","Ophthalmology","ENT","Gynecology","Radiology","Emergency","Surgery","Psychiatry","Dental","Physiotherapy","Laboratory","Pharmacy"].map(d=><option key={d}>{d}</option>)}
                </select></FormField>
                <FormField label="License number"><input className={inputClass} value={dForm.license} onChange={e=>setDForm({...dForm,license:e.target.value})}/></FormField>
                <FormField label="Qualifications"><input className={inputClass} value={dForm.qualifications} onChange={e=>setDForm({...dForm,qualifications:e.target.value})} placeholder="MBBS, MD..."/></FormField>
                <FormField label="Consultation fee"><input type="number" className={inputClass} value={dForm.fee} onChange={e=>setDForm({...dForm,fee:e.target.value})}/></FormField>
                <FormField label="Years of experience"><input type="number" className={inputClass} value={dForm.experience} onChange={e=>setDForm({...dForm,experience:e.target.value})}/></FormField>
                <FormField label="Phone"><input className={inputClass} value={dForm.phone} onChange={e=>setDForm({...dForm,phone:e.target.value})}/></FormField>
                <FormField label="Email"><input className={inputClass} value={dForm.email} onChange={e=>setDForm({...dForm,email:e.target.value})}/></FormField>
                <FormField label="Biography" cls="col-span-2"><textarea className={inputClass + " min-h-[70px] resize-none"} value={dForm.bio} onChange={e=>setDForm({...dForm,bio:e.target.value})}/></FormField>
              </div>
              <div className="flex gap-2 mt-4 justify-end"><button onClick={()=>setModalType(null)} className="px-4 py-2.5 rounded-xl text-[13px] text-slate-500 border border-slate-200">Cancel</button><button onClick={saveDoctor} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{background:HC_BLUE}}>Create doctor</button></div>
            </>)}

            {/* BOOK APPOINTMENT */}
            {modalType === "appointment" && (<>
              <div className="flex items-center justify-between mb-5"><h2 className="text-[17px] font-semibold text-[#111827]">Book Appointment</h2><button onClick={()=>setModalType(null)} className="text-slate-400"><X size={18}/></button></div>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Patient *"><select className={inputClass} value={aForm.patientId} onChange={e=>setAForm({...aForm,patientId:e.target.value})}><option value="">Select a patient...</option>{patients.rows.map(p=><option key={p.id} value={p.id}>{p.fullName} ({p.mrn})</option>)}</select></FormField>
                <FormField label="Doctor *"><select className={inputClass} value={aForm.doctorId} onChange={e=>{const d=doctors.rows.find(d=>d.id===e.target.value);setAForm({...aForm,doctorId:e.target.value,fee:d?.fee||0});}}><option value="">Select a doctor...</option>{doctors.rows.map(d=><option key={d.id} value={d.id}>{d.fullName}</option>)}</select></FormField>
                <FormField label="Type"><select className={inputClass} value={aForm.type} onChange={e=>setAForm({...aForm,type:e.target.value})}>{APPT_TYPES.map(t=><option key={t}>{t}</option>)}</select></FormField>
                <FormField label="Start *"><input type="datetime-local" className={inputClass} value={aForm.start} onChange={e=>setAForm({...aForm,start:e.target.value})}/></FormField>
                <FormField label="End"><input type="datetime-local" className={inputClass} value={aForm.end} onChange={e=>setAForm({...aForm,end:e.target.value})}/></FormField>
                <FormField label="Fee (SAR)"><input type="number" className={inputClass} value={aForm.fee} onChange={e=>setAForm({...aForm,fee:e.target.value})}/></FormField>
                <FormField label="Reason"><input className={inputClass} value={aForm.reason} onChange={e=>setAForm({...aForm,reason:e.target.value})} placeholder="Reason for visit"/></FormField>
                <FormField label="Notes" cls="col-span-2"><textarea className={inputClass + " min-h-[60px] resize-none"} value={aForm.notes} onChange={e=>setAForm({...aForm,notes:e.target.value})}/></FormField>
              </div>
              <div className="flex gap-2 mt-4 justify-end"><button onClick={()=>setModalType(null)} className="px-4 py-2.5 rounded-xl text-[13px] text-slate-500 border border-slate-200">Cancel</button><button onClick={saveAppointment} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{background:HC_BLUE}}>Book appointment</button></div>
            </>)}

            {/* NEW PRESCRIPTION */}
            {modalType === "prescription" && (<>
              <div className="flex items-center justify-between mb-5"><h2 className="text-[17px] font-semibold text-[#111827]">New Prescription</h2><button onClick={()=>setModalType(null)} className="text-slate-400"><X size={18}/></button></div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <FormField label="Patient *"><select className={inputClass} value={rxForm.patientId} onChange={e=>setRxForm({...rxForm,patientId:e.target.value})}><option value="">Select patient...</option>{patients.rows.map(p=><option key={p.id} value={p.id}>{p.fullName}</option>)}</select></FormField>
                <FormField label="Doctor *"><select className={inputClass} value={rxForm.doctorId} onChange={e=>setRxForm({...rxForm,doctorId:e.target.value})}><option value="">Select doctor...</option>{doctors.rows.map(d=><option key={d.id} value={d.id}>{d.fullName}</option>)}</select></FormField>
              </div>
              <p className="text-[12px] font-medium text-slate-600 mb-2">Drugs</p>
              {rxForm.drugs.map((drug,i) => (
                <div key={i} className="border border-slate-100 rounded-xl p-3 mb-2">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <FormField label="Medication"><select className={inputClass + " text-[12px]"} value={drug.name} onChange={e=>{const d=[...rxForm.drugs];d[i]={...d[i],name:e.target.value};setRxForm({...rxForm,drugs:d});}}>{HC_MEDICATIONS.map(m=><option key={m}>{m}</option>)}</select></FormField>
                    <FormField label="Drug name *"><input className={inputClass} value={drug.name} onChange={e=>{const d=[...rxForm.drugs];d[i]={...d[i],name:e.target.value};setRxForm({...rxForm,drugs:d});}}/></FormField>
                    <FormField label="Dosage"><input className={inputClass} value={drug.dosage} placeholder="500mg" onChange={e=>{const d=[...rxForm.drugs];d[i]={...d[i],dosage:e.target.value};setRxForm({...rxForm,drugs:d});}}/></FormField>
                    <FormField label="Frequency"><input className={inputClass} value={drug.frequency} onChange={e=>{const d=[...rxForm.drugs];d[i]={...d[i],frequency:e.target.value};setRxForm({...rxForm,drugs:d});}}/></FormField>
                    <FormField label="Days"><input type="number" className={inputClass} value={drug.days} onChange={e=>{const d=[...rxForm.drugs];d[i]={...d[i],days:Number(e.target.value)};setRxForm({...rxForm,drugs:d});}}/></FormField>
                    <FormField label="Qty"><input type="number" className={inputClass} value={drug.qty} onChange={e=>{const d=[...rxForm.drugs];d[i]={...d[i],qty:Number(e.target.value)};setRxForm({...rxForm,drugs:d});}}/></FormField>
                    <FormField label="Instructions" cls="col-span-2"><input className={inputClass} value={drug.instructions} placeholder="After meals..." onChange={e=>{const d=[...rxForm.drugs];d[i]={...d[i],instructions:e.target.value};setRxForm({...rxForm,drugs:d});}}/></FormField>
                  </div>
                  {rxForm.drugs.length>1&&<button onClick={()=>setRxForm({...rxForm,drugs:rxForm.drugs.filter((_,j)=>j!==i)})} className="mt-1 text-[11px] text-[#EF4444] hover:underline">Remove drug</button>}
                </div>
              ))}
              <button onClick={()=>setRxForm({...rxForm,drugs:[...rxForm.drugs,{name:HC_MEDICATIONS[0],dosage:"",frequency:"2x/day",days:7,qty:1,instructions:""}]})} className="text-[12px] text-[#1B4DE4] hover:underline mb-3">+ Add drug</button>
              <FormField label="Notes"><textarea className={inputClass + " min-h-[60px] resize-none"} value={rxForm.notes} onChange={e=>setRxForm({...rxForm,notes:e.target.value})}/></FormField>
              <div className="flex gap-2 mt-4 justify-end"><button onClick={()=>setModalType(null)} className="px-4 py-2.5 rounded-xl text-[13px] text-slate-500 border border-slate-200">Cancel</button><button onClick={issuePrescription} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white" style={{background:HC_BLUE}}>Issue prescription</button></div>
            </>)}

            {/* NEW MEDICAL REPORT */}
            {modalType === "report" && (<>
              <div className="flex items-center justify-between mb-5"><h2 className="text-[17px] font-semibold text-[#111827]">New Medical Report</h2><button onClick={()=>setModalType(null)} className="text-slate-400"><X size={18}/></button></div>
              <div className="space-y-3">
                <FormField label="From a finished visit">
                  <select className={inputClass} value={repForm.visitId} onChange={e=>{const v=visits.rows.find(v=>v.id===e.target.value);setRepForm({...repForm,visitId:e.target.value,patientId:v?.patientId||"",doctorId:v?.doctorId||""});}}>
                    <option value="">Select visit...</option>{visits.rows.filter(v=>v.status==="Closed").map(v=><option key={v.id} value={v.id}>{v.id} &middot; {v.patient} &middot; {v.date?.slice(0,10)}</option>)}
                  </select>
                </FormField>
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Patient *"><select className={inputClass} value={repForm.patientId} onChange={e=>setRepForm({...repForm,patientId:e.target.value})}><option value="">Select...</option>{patients.rows.map(p=><option key={p.id} value={p.id}>{p.fullName} ({p.mrn})</option>)}</select></FormField>
                  <FormField label="Doctor *"><select className={inputClass} value={repForm.doctorId} onChange={e=>setRepForm({...repForm,doctorId:e.target.value})}><option value="">Select...</option>{doctors.rows.map(d=><option key={d.id} value={d.id}>{d.fullName}</option>)}</select></FormField>
                </div>
                <FormField label="Report title *"><input className={inputClass} value={repForm.title} onChange={e=>setRepForm({...repForm,title:e.target.value})} placeholder="e.g. Consultation summary"/></FormField>
                <FormField label="Situation / description"><textarea className={inputClass + " min-h-[100px] resize-none"} value={repForm.description} onChange={e=>setRepForm({...repForm,description:e.target.value})} placeholder="Describe the patient's condition, findings and recommendations..."/></FormField>
                <FormField label="Doctor signature">
                  <div className="border-2 border-dashed border-slate-200 rounded-xl p-4 text-center">
                    <p className="text-[12px] text-slate-400 mb-2">Draw signature here (or type initials)</p>
                    <input className={inputClass + " text-center italic text-[16px]"} value={repForm.signature} onChange={e=>setRepForm({...repForm,signature:e.target.value})} placeholder="Type initials or name"/>
                    {repForm.signature && <p className="mt-2 text-[11px] text-slate-400">Signature: <em>{repForm.signature}</em></p>}
                    <button onClick={()=>setRepForm({...repForm,signature:""})} className="mt-1 text-[11px] text-[#EF4444] hover:underline">Clear signature</button>
                  </div>
                </FormField>
              </div>
              <div className="flex gap-2 mt-4 justify-end"><button onClick={()=>setModalType(null)} className="px-4 py-2.5 rounded-xl text-[13px] text-slate-500 border border-slate-200">Cancel</button><button onClick={createReport} className="px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white flex items-center gap-1.5" style={{background:HC_BLUE}}><CheckCircle2 size={14}/>Create report</button></div>
            </>)}

          </div>
        </div>
      )}

      {/* ── DETAIL VIEW MODAL ─────────────────────────────────────────── */}
      {selected && !modalType && (
        <div className="fixed inset-0 z-40 flex justify-end" onClick={()=>setSelected(null)}>
          <div className="absolute inset-0 bg-[#111827]/20 backdrop-blur-[2px]"/>
          <div className="relative w-full sm:w-[440px] bg-white h-full shadow-2xl overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className="px-6 pt-6 pb-5 border-b border-slate-100">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center text-[16px] font-bold text-white" style={{background:HC_BLUE}}>{(selected.firstName||selected.title||"?").charAt(0)}{(selected.lastName||"").charAt(0)}</div>
                  <div><p className="text-[18px] font-bold text-[#111827]">{selected.fullName||selected.title||selected.patient}</p>{selected.mrn&&<p className="text-[12px] font-medium mt-0.5" style={{color:HC_BLUE}}>{selected.mrn}</p>}{selected.specialty&&<p className="text-[12px] text-slate-400">{selected.specialty}</p>}</div>
                </div>
                <button onClick={()=>setSelected(null)} className="text-slate-400"><X size={18}/></button>
              </div>
              {selected.status&&<StatusPill s={selected.status}/>}
            </div>
            <div className="px-6 py-4 space-y-3">
              {Object.entries(selected).filter(([k])=>!["id","fullName","mrn","status","firstName","lastName"].includes(k)).map(([k,v])=>v&&typeof v==="string"&&v.length<120?(
                <div key={k} className="flex items-start gap-3"><p className="text-[11px] text-slate-400 w-28 shrink-0 mt-0.5 capitalize">{k.replace(/([A-Z])/g," $1")}</p><p className="text-[12.5px] text-[#111827] font-medium">{v}</p></div>
              ):null)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LegacyHotelManagementModule({ currentUser, company }) {
  const [tab, setTab]         = useState("overview");
  const [checkInForm, setCheckInForm]   = useState({ guestName:"", email:"", phone:"", nationality:"", roomId:"", checkOut:"", adults:1, children:0, purpose:"Leisure", paymentMethod:"Card", specialRequests:"" });
  const [showCheckIn, setShowCheckIn]   = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [hsTab, setHsTab]               = useState("all");

  const rooms        = useCompanyTable("htl_rooms",        HTL_ROOMS_SEED,        { mapRow: r => r });
  const bookings     = useCompanyTable("htl_bookings",     HTL_BOOKINGS_SEED,     { mapRow: r => r });

  const HTL_BLUE = "#1E3A8A";
  const HTL_GOLD = "#B8860B";

  const TABS = [
    { id:"overview",     label:"Overview",      icon: LayoutDashboard },
    { id:"rooms",        label:"Room Status",   icon: Bed },
    { id:"checkin",      label:"Check-In/Out",  icon: UserCheck },
    { id:"bookings",     label:"Bookings",      icon: CalendarDays },
    { id:"housekeeping", label:"Housekeeping",  icon: Sparkles },
    { id:"reports",      label:"Reports",       icon: BarChart3 },
  ];

  const occupied   = rooms.rows.filter(r=>r.status==="Occupied").length;
  const available  = rooms.rows.filter(r=>r.status==="Available").length;
  const cleaning   = rooms.rows.filter(r=>r.status==="Cleaning").length;
  const occupancy  = rooms.rows.length>0?(occupied/rooms.rows.length*100).toFixed(0):0;
  const revenue    = bookings.rows.filter(b=>b.status==="Checked Out"||b.status==="Active").reduce((s,b)=>s+b.paid,0);
  const adr        = occupied>0?(revenue/Math.max(occupied,1)).toFixed(0):0; // Average Daily Rate
  const revPAR     = rooms.rows.length>0?(Number(adr)*occupied/rooms.rows.length).toFixed(0):0; // Revenue Per Available Room

  const statusConfig = {
    Available:  {bg:"#F0FDF4",border:"#86EFAC",dot:"#16A34A",text:"#15803D",label:"Available"},
    Occupied:   {bg:"#EFF6FF",border:"#93C5FD",dot:"#2563EB",text:"#1D4ED8",label:"Occupied"},
    Cleaning:   {bg:"#FFFBEB",border:"#FCD34D",dot:"#F59E0B",text:"#92400E",label:"Cleaning"},
    Maintenance:{bg:"#FEF2F2",border:"#FCA5A5",dot:"#EF4444",text:"#991B1B",label:"Maintenance"},
    Reserved:   {bg:"#F5F3FF",border:"#C4B5FD",dot:"#7C3AED",text:"#5B21B6",label:"Reserved"},
  };
  const bkgStatus = {Active:["#DBEAFE","#1E40AF"],"Checked Out":["#F3F4F6","#6B7280"],Upcoming:["#DCFCE7","#16A34A"],Cancelled:["#FEE2E2","#EF4444"],NoShow:["#FEF3C7","#D97706"]};
  const Chip=({s})=>{const[bg,col]=bkgStatus[s]||["#F3F4F6","#6B7280"];return<span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{background:bg,color:col}}>{s}</span>;};

  async function doCheckIn() {
    if (!checkInForm.guestName||!checkInForm.roomId||!checkInForm.checkOut) return;
    const room   = rooms.rows.find(r=>r.id===checkInForm.roomId);
    const nights = Math.max(1,Math.round((new Date(checkInForm.checkOut)-new Date())/86400000));
    const total  = (room?.price||0)*nights;
    const row    = { ...checkInForm, id:docId("BKG"), room:room?.number||"", type:room?.type||"", nights, total, paid:0, source:"Front Desk", status:"Active", checkIn:TODAY.toISOString().slice(0,10) };
    bookings.setRows(p=>[row,...p]);
    rooms.setRows(p=>p.map(r=>r.id===checkInForm.roomId?{...r,status:"Occupied",currentGuest:checkInForm.guestName}:r));
    setCheckInForm({guestName:"",email:"",phone:"",nationality:"",roomId:"",checkOut:"",adults:1,children:0,purpose:"Leisure",paymentMethod:"Card",specialRequests:""});
    setShowCheckIn(false);
    notify("✓ Check-in: "+checkInForm.guestName+" → Room "+room?.number);
    logAudit("Hotel check-in: "+room?.number,"Hotel",currentUser?.name||"Front Desk",checkInForm.guestName);
  }

  function doCheckOut(bookingId) {
    const bkg = bookings.rows.find(b=>b.id===bookingId);
    if (!bkg) return;
    bookings.setRows(p=>p.map(b=>b.id===bookingId?{...b,status:"Checked Out",paid:b.total}:b));
    rooms.setRows(p=>p.map(r=>r.number===bkg.room?{...r,status:"Cleaning",currentGuest:""}:r));
    notify("Check-out: "+bkg.guest+" from Room "+bkg.room+" · Total: USD "+bkg.total);
    logAudit("Hotel check-out: "+bkg.room,"Hotel",currentUser?.name||"Front Desk",bkg.guest+" USD "+bkg.total);
  }

  const houseKeepingTasks = rooms.rows.filter(r=>r.status==="Cleaning"||r.status==="Occupied");
  const roomsByType = ["Standard","Deluxe","Suite","Presidential"];

  return (
    <div className="space-y-4">
      {/* HEADER */}
      <div className="rounded-2xl px-6 py-5 relative overflow-hidden" style={{background:`linear-gradient(135deg,#0F172A 0%,${HTL_BLUE} 45%,#1e40af 100%)`}}>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:"url('data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22><path d=%22M0 30h60M30 0v60%22 stroke=%22white%22 stroke-width=%221%22 fill=%22none%22/></svg>')"}}/>
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><Hotel size={22} className="text-white"/><h1 className="text-[20px] font-bold text-white">{company?.name||"Hotel"} Property Management</h1></div>
            <p className="text-[12px]" style={{color:"rgba(255,255,255,.55)"}}>Front Desk · Rooms · Check-In/Out · Housekeeping · Revenue Analytics</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[["Rooms",rooms.rows.length,""],["Occupancy",occupancy+"%",""],["ADR","USD "+adr,""],["RevPAR","USD "+revPAR,""]].map(([l,v])=>(
              <div key={l} className="text-center rounded-xl px-4 py-2.5" style={{background:"rgba(255,255,255,.1)"}}>
                <p className="text-[18px] font-black text-white">{v}</p>
                <p className="text-[10px] text-white/50">{l}</p>
              </div>
            ))}
            <button onClick={()=>setShowCheckIn(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold text-white" style={{background:"rgba(255,255,255,.18)",border:"1px solid rgba(255,255,255,.25)"}}><UserCheck size={13}/>Check-In Guest</button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-0.5 bg-white rounded-xl p-1 border border-slate-200 overflow-x-auto">
        {TABS.map(t=>{const I=t.icon;return(
          <button key={t.id} onClick={()=>setTab(t.id)} className={"flex items-center gap-1 px-3 py-2 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap "+(tab===t.id?"text-white shadow-sm":"text-slate-500 hover:bg-slate-50")} style={{background:tab===t.id?HTL_BLUE:"transparent"}}>
            <I size={12}/>{t.label}
            {t.id==="housekeeping"&&cleaning>0&&<span className="ml-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{cleaning}</span>}
          </button>
        );})}
      </div>

      {/* OVERVIEW */}
      {tab==="overview" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
            {[
              {l:"Total Rooms",  v:rooms.rows.length,  c:HTL_BLUE,  I:Bed,          sub:"In property"},
              {l:"Occupied",     v:occupied,           c:"#2563EB",  I:UserCheck,    sub:occupancy+"% occupancy"},
              {l:"Available",    v:available,          c:"#16A34A",  I:CheckCircle,  sub:"Ready to sell"},
              {l:"Cleaning",     v:cleaning,           c:"#F59E0B",  I:Sparkles,     sub:"Being serviced"},
              {l:"Revenue",      v:"USD "+revenue,     c:HTL_GOLD,   I:CircleDollarSign, sub:"Total collected"},
            ].map(k=>(
              <div key={k.l} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{k.l}</p><p className="text-[22px] font-bold mt-1 text-[#111827]">{k.v}</p><p className="text-[11.5px] mt-0.5" style={{color:k.c}}>{k.sub}</p></div>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{background:k.c+"18"}}><k.I size={16} style={{color:k.c}}/></div>
                </div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Occupancy by Room Type</p>
              {roomsByType.map(type=>{
                const typeRooms=rooms.rows.filter(r=>r.type===type);
                const typeOccupied=typeRooms.filter(r=>r.status==="Occupied").length;
                const pct=typeRooms.length>0?typeOccupied/typeRooms.length*100:0;
                if(!typeRooms.length)return null;
                return(
                  <div key={type} className="flex items-center gap-2 mb-2.5">
                    <span className="text-[12px] text-slate-600 w-24 shrink-0">{type}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full transition-all" style={{width:pct+"%",background:pct>80?"#EF4444":pct>60?"#F59E0B":HTL_BLUE}}/></div>
                    <span className="text-[11.5px] text-slate-500 w-16 text-right">{typeOccupied}/{typeRooms.length} rooms</span>
                  </div>
                );
              }).filter(Boolean)}
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Revenue Performance</p>
              {[["Average Daily Rate (ADR)","USD "+adr,HTL_BLUE],["RevPAR","USD "+revPAR,"#16A34A"],["Total Revenue","USD "+revenue,HTL_GOLD],["Occupancy Rate",occupancy+"%","#7C3AED"]].map(([l,v,col])=>(
                <div key={l} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                  <span className="text-[12.5px] text-slate-500">{l}</span>
                  <span className="text-[14px] font-bold" style={{color:col}}>{v}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Active Guests</p>
            {bookings.rows.filter(b=>b.status==="Active").length===0
              ?<p className="text-slate-400 text-center py-4">No guests currently checked in</p>
              :<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {bookings.rows.filter(b=>b.status==="Active").map(b=>(
                  <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0" style={{background:HTL_BLUE}}>{b.guest?.charAt(0)||"G"}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-[#111827] truncate">{b.guest}</p>
                      <p className="text-[11.5px] text-slate-400">Room {b.room} · Check out: {b.checkOut}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[12.5px] font-bold" style={{color:HTL_BLUE}}>USD {b.total}</p>
                      <button onClick={()=>doCheckOut(b.id)} className="text-[10px] font-bold text-white px-2 py-0.5 rounded-lg mt-0.5" style={{background:"#EF4444"}}>Check Out</button>
                    </div>
                  </div>
                ))}
              </div>
            }
          </div>
        </div>
      )}

      {/* ROOM STATUS */}
      {tab==="rooms" && (
        <div className="space-y-4">
          <div className="flex gap-2 flex-wrap">
            {Object.entries(statusConfig).map(([s,cfg])=>{
              const n=rooms.rows.filter(r=>r.status===s).length;
              return(
                <div key={s} className="flex items-center gap-2 px-4 py-2 rounded-xl border" style={{background:cfg.bg,borderColor:cfg.border}}>
                  <div className="w-2.5 h-2.5 rounded-full" style={{background:cfg.dot}}/>
                  <span className="text-[12.5px] font-semibold" style={{color:cfg.text}}>{s}</span>
                  <span className="text-[16px] font-black" style={{color:cfg.text}}>{n}</span>
                </div>
              );
            })}
          </div>
          {["Standard","Deluxe","Suite","Presidential"].map(type=>{
            const typeRooms=rooms.rows.filter(r=>r.type===type);
            if(!typeRooms.length)return null;
            return(
              <div key={type}>
                <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-2">{type} Rooms</p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {typeRooms.map(r=>{
                    const sc=statusConfig[r.status]||statusConfig.Available;
                    const bkg=bookings.rows.find(b=>b.room===r.number&&b.status==="Active");
                    return(
                      <div key={r.id} className="rounded-2xl border-2 p-3 cursor-pointer hover:shadow-lg transition-all" style={{background:sc.bg,borderColor:sc.border}} onClick={()=>setSelectedRoom(r)}>
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[20px] font-black" style={{color:sc.text}}>#{r.number}</span>
                          <div className="w-2.5 h-2.5 rounded-full" style={{background:sc.dot}}/>
                        </div>
                        <p className="text-[10.5px] font-bold uppercase tracking-wide" style={{color:sc.text}}>{r.status}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{r.beds} bed · {r.seats||"—"} guests</p>
                        {bkg&&<p className="text-[11px] font-semibold mt-1.5 truncate" style={{color:sc.text}}>{bkg.guest}</p>}
                        <p className="text-[12px] font-bold mt-1.5" style={{color:HTL_BLUE}}>USD {r.price}<span className="text-[10px] font-normal text-slate-400">/night</span></p>
                        {r.status==="Available"&&<button onClick={e=>{e.stopPropagation();setCheckInForm(f=>({...f,roomId:r.id}));setShowCheckIn(true);}} className="mt-2 w-full text-[10.5px] font-bold py-1.5 rounded-lg text-white" style={{background:HTL_BLUE}}>Check In</button>}
                        {r.status==="Cleaning"&&<button onClick={e=>{e.stopPropagation();rooms.setRows(p=>p.map(x=>x.id===r.id?{...x,status:"Available"}:x));notify("Room "+r.number+" is now available");}} className="mt-2 w-full text-[10.5px] font-bold py-1.5 rounded-lg border" style={{color:sc.text,borderColor:sc.border,background:"white"}}>Mark Ready ✓</button>}
                        {r.status==="Occupied"&&bkg&&<button onClick={e=>{e.stopPropagation();doCheckOut(bkg.id);}} className="mt-2 w-full text-[10.5px] font-bold py-1.5 rounded-lg text-white bg-red-500">Check Out</button>}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CHECK IN/OUT */}
      {tab==="checkin" && (
        <div className="space-y-4">
          {!showCheckIn&&<div className="flex justify-end"><button onClick={()=>setShowCheckIn(true)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:HTL_BLUE}}><UserCheck size={13}/>Check-In Guest</button></div>}
          {showCheckIn&&(
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 space-y-4">
              <div className="flex items-center justify-between"><h3 className="text-[15px] font-bold text-[#111827]">Guest Check-In</h3><button onClick={()=>setShowCheckIn(false)} className="text-slate-400"><X size={16}/></button></div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField label="Guest Full Name *"><input className={inputClass} value={checkInForm.guestName} onChange={e=>setCheckInForm({...checkInForm,guestName:e.target.value})} placeholder="Full name"/></FormField>
                <FormField label="Email"><input className={inputClass} value={checkInForm.email} onChange={e=>setCheckInForm({...checkInForm,email:e.target.value})}/></FormField>
                <FormField label="Phone"><input className={inputClass} value={checkInForm.phone} onChange={e=>setCheckInForm({...checkInForm,phone:e.target.value})}/></FormField>
                <FormField label="Nationality"><input className={inputClass} value={checkInForm.nationality} onChange={e=>setCheckInForm({...checkInForm,nationality:e.target.value})} placeholder="Tanzania, Kenya..."/></FormField>
                <FormField label="Room *"><select className={inputClass} value={checkInForm.roomId} onChange={e=>setCheckInForm({...checkInForm,roomId:e.target.value})}><option value="">Select available room...</option>{rooms.rows.filter(r=>r.status==="Available").map(r=><option key={r.id} value={r.id}>Room {r.number} — {r.type} (USD {r.price}/night)</option>)}</select></FormField>
                <FormField label="Check-Out Date *"><input type="date" className={inputClass} value={checkInForm.checkOut} onChange={e=>setCheckInForm({...checkInForm,checkOut:e.target.value})} min={new Date(Date.now()+86400000).toISOString().slice(0,10)}/></FormField>
                <FormField label="Adults"><input type="number" min="1" className={inputClass} value={checkInForm.adults} onChange={e=>setCheckInForm({...checkInForm,adults:Number(e.target.value)})}/></FormField>
                <FormField label="Children"><input type="number" min="0" className={inputClass} value={checkInForm.children} onChange={e=>setCheckInForm({...checkInForm,children:Number(e.target.value)})}/></FormField>
                <FormField label="Purpose"><select className={inputClass} value={checkInForm.purpose} onChange={e=>setCheckInForm({...checkInForm,purpose:e.target.value})}>{["Leisure","Business","Transit","Event","Other"].map(p=><option key={p}>{p}</option>)}</select></FormField>
                <FormField label="Payment Method"><select className={inputClass} value={checkInForm.paymentMethod} onChange={e=>setCheckInForm({...checkInForm,paymentMethod:e.target.value})}>{["Card","Cash","Mobile Money","Bank Transfer","Corporate Account"].map(m=><option key={m}>{m}</option>)}</select></FormField>
                <FormField label="Special Requests" cls="col-span-2"><input className={inputClass} value={checkInForm.specialRequests} onChange={e=>setCheckInForm({...checkInForm,specialRequests:e.target.value})} placeholder="Late check-out, extra pillow, dietary..."/></FormField>
              </div>
              {checkInForm.roomId&&checkInForm.checkOut&&(()=>{
                const room=rooms.rows.find(r=>r.id===checkInForm.roomId);
                const nights=Math.max(1,Math.round((new Date(checkInForm.checkOut)-new Date())/86400000));
                return(
                  <div className="p-4 rounded-xl border-2 text-center" style={{borderColor:HTL_BLUE+"40",background:HTL_BLUE+"06"}}>
                    <p className="text-[12px] text-slate-500 mb-1">Stay Summary</p>
                    <p className="text-[22px] font-black" style={{color:HTL_BLUE}}>{nights} Night{nights>1?"s":""} — USD {(room?.price||0)*nights}</p>
                    <p className="text-[12px] text-slate-400">{room?.type} Room {room?.number} · USD {room?.price}/night · {checkInForm.paymentMethod}</p>
                  </div>
                );
              })()}
              <div className="flex gap-3"><button onClick={doCheckIn} className="flex-1 py-3 rounded-xl text-[13.5px] font-bold text-white" style={{background:HTL_BLUE}}>✓ Complete Check-In</button><button onClick={()=>setShowCheckIn(false)} className="px-6 py-3 rounded-xl text-[13px] text-slate-500 border border-slate-200">Cancel</button></div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100"><p className="text-[13.5px] font-semibold text-[#111827]">Currently Checked-In ({bookings.rows.filter(b=>b.status==="Active").length} guests)</p></div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["Guest","Room","Type","Check-In","Check-Out","Nights","Total","Special Requests","Action"].map(h=><th key={h} className="px-4 py-3 text-left text-[10px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>{bookings.rows.filter(b=>b.status==="Active").map(b=>(
                <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3"><div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white" style={{background:HTL_BLUE}}>{b.guest?.charAt(0)||"G"}</div><span className="font-medium text-[#111827]">{b.guest}</span></div></td>
                  <td className="px-4 py-3 font-bold" style={{color:HTL_BLUE}}>#{b.room}</td>
                  <td className="px-4 py-3 text-slate-500">{b.type}</td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-slate-400">{b.checkIn}</td>
                  <td className="px-4 py-3 font-mono text-[11.5px] text-slate-400">{b.checkOut}</td>
                  <td className="px-4 py-3 font-bold text-[#111827]">{b.nights}</td>
                  <td className="px-4 py-3 font-mono font-bold" style={{color:HTL_BLUE}}>USD {b.total}</td>
                  <td className="px-4 py-3 text-slate-400 text-[11.5px] max-w-[120px] truncate">{b.specialRequests||"—"}</td>
                  <td className="px-4 py-3"><button onClick={()=>doCheckOut(b.id)} className="text-[11px] font-bold text-white px-3 py-1.5 rounded-lg bg-red-500">Check Out</button></td>
                </tr>
              ))}</tbody>
            </table>
            {bookings.rows.filter(b=>b.status==="Active").length===0&&<p className="text-center text-slate-400 py-8">No guests currently checked in</p>}
          </div>
        </div>
      )}

      {/* BOOKINGS */}
      {tab==="bookings" && (
        <div className="space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><p className="text-[13.5px] font-semibold text-[#111827]">All Bookings</p><button onClick={()=>downloadCSV("hotel-bookings",bookings.rows,[{key:"guest",label:"Guest"},{key:"room",label:"Room"},{key:"checkIn",label:"Check In"},{key:"checkOut",label:"Check Out"},{key:"nights",label:"Nights"},{key:"total",label:"Total"},{key:"status",label:"Status"}])} className="flex items-center gap-1 text-[12px] text-slate-500 border border-slate-200 px-3 py-2 rounded-xl hover:border-blue-400 hover:text-blue-600"><Download size={13}/>Export</button></div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["Guest","Room","Type","Check-In","Check-Out","Nights","Total","Paid","Source","Status"].map(h=><th key={h} className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>{bookings.rows.map(b=>(
                <tr key={b.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-3 py-3 font-medium text-[#111827]">{b.guest}</td>
                  <td className="px-3 py-3 font-bold" style={{color:HTL_BLUE}}>#{b.room}</td>
                  <td className="px-3 py-3 text-slate-500">{b.type}</td>
                  <td className="px-3 py-3 font-mono text-[11.5px] text-slate-400">{b.checkIn}</td>
                  <td className="px-3 py-3 font-mono text-[11.5px] text-slate-400">{b.checkOut}</td>
                  <td className="px-3 py-3 font-bold text-[#111827]">{b.nights}</td>
                  <td className="px-3 py-3 font-mono font-bold" style={{color:HTL_BLUE}}>USD {b.total}</td>
                  <td className="px-3 py-3 font-mono font-bold text-green-600">USD {b.paid}</td>
                  <td className="px-3 py-3 text-slate-400 text-[11.5px]">{b.source}</td>
                  <td className="px-3 py-3"><Chip s={b.status}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* HOUSEKEEPING */}
      {tab==="housekeeping" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[["Rooms to Clean",cleaning,"#F59E0B"],["Currently Occupied",occupied,"#2563EB"],["Available",available,"#16A34A"]].map(([l,v,col])=>(
              <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{l}</p><p className="text-[24px] font-bold" style={{color:col}}>{v}</p></div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100"><p className="text-[13.5px] font-semibold text-[#111827]">Housekeeping Tasks</p></div>
            <div className="divide-y divide-slate-50">
              {rooms.rows.filter(r=>r.status==="Cleaning"||r.status==="Occupied").map(r=>{
                const sc=statusConfig[r.status]||statusConfig.Available;
                return(
                  <div key={r.id} className="flex items-center gap-4 px-4 py-3.5">
                    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[14px] font-black shrink-0" style={{background:sc.bg,color:sc.text}}>#{r.number}</div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-0.5"><p className="text-[13px] font-semibold text-[#111827]">Room {r.number}</p><span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{background:sc.bg,color:sc.text}}>{r.status}</span></div>
                      <p className="text-[11.5px] text-slate-400">{r.type} · Floor {r.floor} · {r.beds} bed{r.beds>1?"s":""}</p>
                      {r.amenities&&<div className="flex gap-1 mt-1">{r.amenities.slice(0,3).map(a=><span key={a} className="text-[9.5px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-medium">{a}</span>)}</div>}
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {r.status==="Cleaning"&&<button onClick={()=>{rooms.setRows(p=>p.map(x=>x.id===r.id?{...x,status:"Available"}:x));notify("Room "+r.number+" ready ✓");}} className="px-3 py-2 rounded-xl text-[12px] font-semibold text-white" style={{background:"#16A34A"}}>✓ Mark Ready</button>}
                      {r.status==="Occupied"&&<button onClick={()=>notify("Housekeeping request sent for Room "+r.number)} className="px-3 py-2 rounded-xl text-[12px] font-semibold border" style={{color:sc.text,borderColor:sc.border}}>Request Service</button>}
                    </div>
                  </div>
                );
              })}
              {rooms.rows.filter(r=>r.status==="Cleaning"||r.status==="Occupied").length===0&&<p className="text-center text-slate-400 py-10">All rooms are clean and available 🌟</p>}
            </div>
          </div>
        </div>
      )}

      {/* REPORTS */}
      {tab==="reports" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[["Occupancy Rate",occupancy+"%",HTL_BLUE],["ADR (Avg Daily Rate)","USD "+adr,HTL_GOLD],["RevPAR","USD "+revPAR,"#7C3AED"],["Total Revenue","USD "+revenue,"#16A34A"]].map(([l,v,col])=>(
              <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{l}</p><p className="text-[20px] font-bold" style={{color:col}}>{v}</p></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Revenue by Room Type</p>
              {roomsByType.map(type=>{
                const typeRevenue=bookings.rows.filter(b=>b.type===type).reduce((s,b)=>s+b.paid,0);
                const total=bookings.rows.reduce((s,b)=>s+b.paid,0);
                const pct=total>0?typeRevenue/total*100:0;
                if(!typeRevenue)return null;
                return(
                  <div key={type} className="flex items-center gap-2 mb-2.5">
                    <span className="text-[12px] text-slate-600 w-24 shrink-0">{type}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:pct+"%",background:HTL_BLUE}}/></div>
                    <span className="text-[12px] font-bold text-slate-700 w-16 text-right">USD {typeRevenue}</span>
                  </div>
                );
              }).filter(Boolean)}
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Bookings by Source</p>
              {["Direct","Booking.com","Expedia","Airbnb","Phone"].map(src=>{
                const n=bookings.rows.filter(b=>b.source===src).length;
                const total=bookings.rows.length;
                if(!n)return null;
                return(
                  <div key={src} className="flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0">
                    <span className="text-[12.5px] text-slate-600">{src}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(n/total*100)+"%",background:HTL_BLUE}}/></div>
                      <span className="text-[12px] font-bold" style={{color:HTL_BLUE}}>{n}</span>
                    </div>
                  </div>
                );
              }).filter(Boolean)}
            </div>
          </div>
        </div>
      )}

      {/* HOTEL REPORTS TAB */}
      {tab === "reports" && (() => {
        const revByType = ["Single","Double","Suite","Deluxe"].map(type=>{
          const typeRevenue = bookings.rows.filter(b=>b.type===type&&(b.status==="Checked Out"||b.status==="Active"))
            .reduce((s,b)=>s+(b.total||0),0);
          return { name:type, value:Math.round(typeRevenue/1000), fill:{Single:"#1E3A8A",Double:"#2563EB",Suite:"#D97706",Deluxe:"#7C3AED"}[type] };
        }).filter(d=>d.value>0);

        const sourceData = ["Direct","Booking.com","Expedia","Airbnb","Phone"].map((src,i)=>({
          name:src, value:bookings.rows.filter(b=>b.source===src).length,
          fill:["#1E3A8A","#2563EB","#16A34A","#EF4444","#F59E0B"][i],
        })).filter(d=>d.value>0);

        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[[`Occupancy`,`${occupancy}%`,"#1E3A8A"],["Total Revenue",`TZS ${money(Math.round(revenue/1000))}k`,"#16A34A"],["ADR (Avg Daily Rate)",`TZS ${money(adr)}`,"#D97706"],["RevPAR",`TZS ${money(revPAR)}`,"#7C3AED"]].map(([l,v,col])=>(
                <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
                  <p className="text-[10.5px] text-slate-400 uppercase tracking-wide mb-1">{l}</p>
                  <p className="text-[18px] font-bold" style={{color:col}}>{v}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Revenue by Room Type */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Revenue by Room Type (TZS k)</h3>
                {revByType.length===0?<p className="text-slate-400 text-center py-6">No checkout data yet</p>:(
                  <ResponsiveContainer width="100%" height={160}>
                    <BarChart data={revByType} margin={{left:0,right:10,top:0,bottom:0}}>
                      <CartesianGrid vertical={false} stroke="#EEF1F4"/>
                      <XAxis dataKey="name" tick={{fontSize:11}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v)=>[`TZS ${money(v)}k`,"Revenue"]}/>
                      <Bar dataKey="value" radius={[4,4,0,0]} maxBarSize={40}>
                        {revByType.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>

              {/* Booking Source */}
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Booking Sources</h3>
                {sourceData.length===0?<p className="text-slate-400 text-center py-6">No bookings yet</p>:(
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={150}>
                      <RPieChart>
                        <Pie data={sourceData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                          {sourceData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                        </Pie>
                        <Tooltip formatter={(v,n)=>[v+" bookings",n]}/>
                      </RPieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5">
                      {sourceData.map(d=>(
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[12px]">
                            <span className="w-2.5 h-2.5 rounded-full" style={{background:d.fill}}/>{d.name}
                          </span>
                          <span className="text-[12.5px] font-bold" style={{color:d.fill}}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Guest folio PDF */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Recent Bookings — Print Folio</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="bg-[#1E3A8A]">
                    {["ID","Guest","Room","Check-In","Check-Out","Nights","Source","Status","Total"].map(h=>(
                      <th key={h} className="px-3 py-2 text-left text-[10px] font-bold text-white">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {bookings.rows.slice(0,8).map((b,i)=>(
                      <tr key={b.id} className={i%2===0?"bg-white":"bg-slate-50/60"}>
                        <td className="px-3 py-2 font-mono text-[11px] font-bold">{b.id}</td>
                        <td className="px-3 py-2 font-semibold">{b.guestName}</td>
                        <td className="px-3 py-2">{b.room}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{b.checkIn}</td>
                        <td className="px-3 py-2 font-mono text-[11px]">{b.checkOut}</td>
                        <td className="px-3 py-2 text-center">{b.nights}</td>
                        <td className="px-3 py-2">{b.source}</td>
                        <td className="px-3 py-2">
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">{b.status}</span>
                        </td>
                        <td className="px-3 py-2 font-mono font-bold text-[#1E3A8A]">TZS {money(Math.round((b.total||0)/1000))}k</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                onClick={()=>{
                  const co=window.__smartManagerCompany||{};
                  const win=window.open("","_blank","width=950,height=1100");
                  if (!win) return;
                  const rows=bookings.rows.map((b,i)=>`<tr style="background:${i%2===0?"#fff":"#F8FAFB"}">
                    <td style="padding:7px 12px;font-family:monospace;font-size:11.5px;font-weight:700">${b.id}</td>
                    <td style="padding:7px 12px;font-size:12px;font-weight:600">${b.guestName}</td>
                    <td style="padding:7px 12px;font-size:11.5px">${b.room} (${b.type})</td>
                    <td style="padding:7px 12px;font-size:11.5px">${b.checkIn}</td>
                    <td style="padding:7px 12px;font-size:11.5px">${b.checkOut}</td>
                    <td style="padding:7px 12px;text-align:center">${b.nights}</td>
                    <td style="padding:7px 12px;font-size:11.5px">${b.source}</td>
                    <td style="padding:7px 12px;font-weight:700;font-family:monospace">TZS ${money(Math.round((b.total||0)/1000))}k</td>
                  </tr>`).join("");
                  win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Hotel Report</title>
                    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
                    <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,sans-serif;background:#F3F4F6;padding:24px;-webkit-print-color-adjust:exact;print-color-adjust:exact}
                    @media print{body{background:white}.toolbar{display:none!important}}
                    .page{max-width:900px;margin:0 auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.1)}
                    .hdr{background:#0F172A;padding:28px 36px;display:flex;justify-content:space-between;align-items:flex-start}
                    table.data{width:100%;border-collapse:collapse}table.data thead tr{background:#1E3A8A}
                    table.data thead th{padding:9px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.8)}
                    .kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#E5E7EB;border-bottom:1px solid #E5E7EB}
                    .kpi{background:white;padding:16px 20px;text-align:center}.kpi-label{font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px}.kpi-value{font-size:20px;font-weight:800}
                    .ftr{background:#0F172A;padding:14px 36px;display:flex;justify-content:space-between}.ftr-note{font-size:10.5px;color:rgba(255,255,255,.4)}.ftr-brand{font-size:11px;font-weight:700;color:#B8860B}
                    .toolbar{position:fixed;bottom:24px;right:24px;display:flex;gap:8px}.btn{padding:10px 20px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;border:none;font-family:Inter}
                    .btn-p{background:#1E3A8A;color:white}.btn-c{background:white;color:#111827;border:1.5px solid #E5E7EB}</style></head><body>
                    <div class="page">
                      <div class="hdr">
                        <div><div style="font-size:20px;font-weight:800;color:white">${co.name||"Hotel"}</div><div style="font-size:10.5px;color:rgba(255,255,255,.5);margin-top:3px">${[co.address,co.city,"Tanzania"].filter(Boolean).join(" · ")}</div></div>
                        <div style="text-align:right"><div style="font-size:32px;font-weight:900;color:#B8860B;letter-spacing:-1px">HOTEL REPORT</div><div style="font-size:11px;color:rgba(255,255,255,.4);margin-top:4px">Generated: ${new Date().toLocaleDateString()}</div></div>
                      </div>
                      <div class="kpis">
                        <div class="kpi"><div class="kpi-label">Occupancy</div><div class="kpi-value" style="color:#1E3A8A">${occupancy}%</div></div>
                        <div class="kpi"><div class="kpi-label">Total Revenue</div><div class="kpi-value" style="color:#16A34A">TZS ${money(Math.round(revenue/1000))}k</div></div>
                        <div class="kpi"><div class="kpi-label">Avg Daily Rate</div><div class="kpi-value">TZS ${money(adr)}</div></div>
                        <div class="kpi"><div class="kpi-label">RevPAR</div><div class="kpi-value" style="color:#7C3AED">TZS ${money(revPAR)}</div></div>
                      </div>
                      <div style="padding:24px 36px">
                        <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:12px">All Bookings</p>
                        <table class="data">
                          <thead><tr><th>ID</th><th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Nights</th><th>Source</th><th class="r">Total</th></tr></thead>
                          <tbody>${rows}</tbody>
                        </table>
                      </div>
                      <div class="ftr"><div class="ftr-note">Confidential · ${co.name||"Hotel"} · ${new Date().toLocaleDateString()}</div><div class="ftr-brand">BusinessSphere ERP</div></div>
                    </div>
                    <div class="toolbar"><button class="btn btn-c" onclick="window.close()">Close</button><button class="btn btn-p" onclick="window.print()">Print / PDF</button></div>
                  </body></html>`);
                  win.document.close();
                }}
                className="mt-3 flex items-center gap-1.5 text-[12.5px] font-bold text-white px-4 py-2.5 rounded-xl" style={{background:"#1E3A8A"}}>
                <Printer size={13}/> Download Hotel Report PDF
              </button>
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function LegacyBankingMFIModule({ currentUser, company, onLoansLoad = null, onOpenStandingOrderWorkflow = null }) {
  const [tab, setTab]   = useState("dashboard");
  const [tellerTab, setTellerTab] = useState("deposit");
  const [loanTab,   setLoanTab]   = useState("list");

  const accounts  = useCompanyTable("bank_accounts",    BANK_ACCOUNTS_SEED,    { mapRow: r => r });
  const txns      = useCompanyTable("bank_transactions", BANK_TRANSACTIONS_SEED, { mapRow: r => r });
  const loans     = useCompanyTable("bank_loans",        BANK_LOANS_SEED,        { mapRow: r => r });
  useEffect(() => { if (onLoansLoad) onLoansLoad(loans.rows); }, [loans.rows, onLoansLoad]);
  const fds       = useCompanyTable("bank_fixed_deposits",BANK_FIXED_DEPOSITS_SEED,{ mapRow: r => r });
  const sos       = useCompanyTable("bank_standing_orders",BANK_STANDING_ORDERS_SEED,{ mapRow: r => r });

  // Forms
  const [accForm,    setAccForm]    = useState({ name:"", type:"Savings", branch:BRANCHES[0], phone:"", email:"", idNo:"", openingBalance:"" });
  const [tellerForm, setTellerForm] = useState({ accountNo:"", amount:"", narration:"", toAccountNo:"" });
  const [loanForm,   setLoanForm]   = useState({ clientAccountNo:"", type:"Personal", principal:"", rate:18, months:12, collateral:"None", purpose:"" });
  const [showAccForm,  setShowAccForm]  = useState(false);
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [searchAcc,    setSearchAcc]    = useState("");
  const [selectedAcc,  setSelectedAcc]  = useState(null);

  const BANK_BLUE  = "#1E3A5F";
  const BANK_GOLD  = "#B8860B";

  const TABS = [
    { id:"dashboard",  label:"Dashboard",      icon: LayoutDashboard },
    { id:"accounts",   label:"Accounts",       icon: Users },
    { id:"teller",     label:"Teller",         icon: HandCoins },
    { id:"loans",      label:"Loans & Credit", icon: Landmark },
    { id:"deposits",   label:"Fixed Deposits", icon: PiggyBank },
    { id:"standing",   label:"Standing Orders",icon: Repeat },
    { id:"reports",    label:"Reports",        icon: BarChart3 },
  ];

  // KPIs
  const totalDeposits = accounts.rows.reduce((s,a)=>s+a.balance,0);
  const loanPortfolio = loans.rows.filter(l=>l.status==="Active"||l.status==="Overdue").reduce((s,l)=>s+l.balance,0);
  const npls          = loans.rows.filter(l=>l.status==="Overdue"||l.status==="Defaulted");
  const nplAmount     = npls.reduce((s,l)=>s+l.balance,0);
  const nplRatio      = loanPortfolio>0 ? (nplAmount/loanPortfolio*100).toFixed(2) : 0;
  const interestIncome = loans.rows.reduce((s,l)=>s+(l.principal*(l.rate/100)/12),0);
  const fdTotal       = fds.rows.filter(f=>f.status==="Active").reduce((s,f)=>s+f.amount,0);
  const todayTxns     = txns.rows.filter(t=>t.date?.startsWith(TODAY.toISOString().slice(0,10)));

  const nextAccNo = () => String(1000000000 + accounts.rows.length + 1);

  const accTypeColor = {
    "Savings":"#059669","Current":"#1E3A5F","Business":"#7C3AED",
    "Fixed Deposit":"#D97706","Corporate":"#0369A1","Dormant":"#9CA3AF",
  };
  const txnTypeColor  = { "Deposit":"#16A34A","Withdrawal":"#EF4444","Transfer Out":"#EF4444","Transfer In":"#16A34A","Interest":"#2563EB","Charge":"#F59E0B" };
  const loanStatusColor = { Active:["#DBEAFE","#1E40AF"],Overdue:["#FEF3C7","#D97706"],Defaulted:["#FEE2E2","#EF4444"],Closed:["#F3F4F6","#6B7280"] };

  const Chip = ({s, map}) => { const [bg,col]=(map?.[s]||["#F3F4F6","#6B7280"]); return <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{background:bg,color:col}}>{s}</span>; };
  const StatusBadge = ({s}) => {
    const c={Active:["#DCFCE7","#16A34A"],Dormant:["#F3F4F6","#6B7280"],Closed:["#FEE2E2","#EF4444"],Frozen:["#FEF3C7","#D97706"],Matured:["#DBEAFE","#1E40AF"]}[s]||["#F3F4F6","#6B7280"];
    return <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{background:c[0],color:c[1]}}>{s}</span>;
  };

  // Teller operations
  async function doTellerOp(opType) {
    const { accountNo, amount, narration, toAccountNo } = tellerForm;
    if (!accountNo || !amount) { notify("Enter account number and amount","error"); return; }
    const acc = accounts.rows.find(a => a.accountNo === accountNo);
    if (!acc) { notify("Account not found","error"); return; }
    const amt = Number(amount);
    if ((opType==="Withdrawal"||opType==="Transfer Out") && acc.balance < amt) { notify("Insufficient balance","error"); return; }

    const newBal = opType==="Deposit"||opType==="Transfer In" ? acc.balance + amt : acc.balance - amt;
    accounts.setRows(p => p.map(a => a.accountNo===accountNo ? {...a, balance: newBal} : a));

    if (opType==="Transfer Out" && toAccountNo) {
      const toAcc = accounts.rows.find(a => a.accountNo === toAccountNo);
      if (toAcc) {
        accounts.setRows(p => p.map(a => a.accountNo===toAccountNo ? {...a, balance: a.balance + amt} : a));
        const inTxn = { id:docId("TXN"), accountNo:toAccountNo, account:toAcc.name, type:"Transfer In", amount:amt, balance:toAcc.balance+amt, date:new Date().toISOString().slice(0,16).replace("T"," "), channel:"Teller", reference:"TRF-"+Date.now(), narration:"Transfer from "+acc.name, teller:currentUser?.name||"Teller", status:"Completed" };
        txns.setRows(p=>[inTxn,...p]);
      }
    }

    const txn = { id:docId("TXN"), accountNo, account:acc.name, type:opType==="Transfer"?"Transfer Out":opType, amount:amt, balance:newBal, date:new Date().toISOString().slice(0,16).replace("T"," "), channel:"Teller", reference:(opType==="Deposit"?"DEP":"WDR")+"-"+Date.now(), narration:narration||opType, teller:currentUser?.name||"Teller", status:"Completed" };
    txns.setRows(p => [txn, ...p]);
    logAudit(`Teller: ${opType} TZS ${money(amt)}k`, "Banking", currentUser?.name||"System", acc.name);
    notify(`${opType} TZS ${money(amt)}k — ${acc.name} | Balance: TZS ${money(newBal)}k`);
    setTellerForm({ accountNo:"", amount:"", narration:"", toAccountNo:"" });
    if (IS_CONFIGURED) { try { await sb("bank_transactions").insert(txn).run(); } catch(_e){} }
  }

  async function openAccount() {
    if (!accForm.name.trim()) return;
    const row = { ...accForm, id:docId("ACC"), accountNo:nextAccNo(), balance:Number(accForm.openingBalance)||0, openDate:TODAY.toISOString().slice(0,10), status:"Active", currency:"TZS" };
    accounts.setRows(p=>[row,...p]);
    setAccForm({ name:"", type:"Savings", branch:BRANCHES[0], phone:"", email:"", idNo:"", openingBalance:"" });
    setShowAccForm(false);
    notify("Account "+row.accountNo+" opened for "+row.name);
    if (IS_CONFIGURED) { try { await sb("bank_accounts").insert(row).run(); } catch(_e){} }
  }

  async function disburseLoan() {
    if (!loanForm.clientAccountNo||!loanForm.principal) return;
    const acc = accounts.rows.find(a=>a.accountNo===loanForm.clientAccountNo);
    if (!acc) { notify("Client account not found","error"); return; }
    const P = Number(loanForm.principal), r = loanForm.rate/100/12, n = Number(loanForm.months);
    const installment = r>0 ? P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1) : P/n;
    const row = { id:docId("LN"), loanNo:"LN"+Date.now().toString().slice(-8), clientId:acc.id, client:acc.name, type:loanForm.type, principal:P, rate:Number(loanForm.rate), months:n, disbursed:TODAY.toISOString().slice(0,10), installment:Math.round(installment*100)/100, balance:P, arrears:0, nextDue:new Date(Date.now()+30*24*60*60*1000).toISOString().slice(0,10), status:"Active", collateral:loanForm.collateral, purpose:loanForm.purpose };
    loans.setRows(p=>[row,...p]);
    // Credit loan amount to client account
    accounts.setRows(p=>p.map(a=>a.accountNo===loanForm.clientAccountNo?{...a,balance:a.balance+P}:a));
    const txn = { id:docId("TXN"), accountNo:loanForm.clientAccountNo, account:acc.name, type:"Loan Disbursement", amount:P, balance:acc.balance+P, date:TODAY.toISOString().slice(0,10)+" 00:00", channel:"System", reference:row.loanNo, narration:"Loan disbursement — "+loanForm.type, teller:"Credit", status:"Completed" };
    txns.setRows(p=>[txn,...p]);
    setLoanForm({ clientAccountNo:"", type:"Personal", principal:"", rate:18, months:12, collateral:"None", purpose:"" });
    setShowLoanForm(false);
    notify("Loan "+row.loanNo+" of TZS "+money(P)+"k disbursed to "+acc.name);
    logAudit("Loan disbursed: "+row.loanNo, "Banking", currentUser?.name||"System", acc.name+" TZS "+money(P)+"k");
  }

  const filteredAccounts = accounts.rows.filter(a => !searchAcc || a.name.toLowerCase().includes(searchAcc.toLowerCase()) || a.accountNo.includes(searchAcc) || a.type.toLowerCase().includes(searchAcc.toLowerCase()));

  // Account mini-statement modal
  const AccStatement = ({acc}) => {
    const accTxns = txns.rows.filter(t => t.accountNo === acc.accountNo);
    return (
      <div className="fixed inset-0 z-50 flex justify-end" onClick={()=>setSelectedAcc(null)}>
        <div className="absolute inset-0 bg-black/30 backdrop-blur-sm"/>
        <div className="relative w-full sm:w-[520px] bg-white h-full shadow-2xl overflow-y-auto" onClick={e=>e.stopPropagation()}>
          <div className="px-6 py-5 border-b border-slate-100" style={{background:BANK_BLUE}}>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11px] font-medium uppercase tracking-widest text-white/50 mb-1">Account Statement</p>
                <p className="text-[20px] font-bold text-white">{acc.name}</p>
                <p className="text-[13px] font-mono text-white/70">{acc.accountNo}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white/15 text-white">{acc.type}</span>
                  <StatusBadge s={acc.status}/>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[11px] text-white/50">Current Balance</p>
                <p className="text-[28px] font-black text-white">TZS {money(acc.balance)}k</p>
                <p className="text-[11px] text-white/50 mt-1">{acc.branch} · {acc.interest}% p.a.</p>
              </div>
            </div>
            <button onClick={()=>setSelectedAcc(null)} className="absolute top-4 right-4 text-white/60 hover:text-white"><X size={18}/></button>
          </div>
          <div className="p-4">
            <p className="text-[12px] font-semibold text-slate-500 uppercase tracking-wide mb-3">Transaction History ({accTxns.length})</p>
            {accTxns.length === 0 ? <p className="text-slate-400 text-center py-8">No transactions yet</p> :
              <div className="space-y-2">
                {accTxns.map(t => {
                  const isCredit = t.type==="Deposit"||t.type==="Transfer In"||t.type==="Interest"||t.type==="Loan Disbursement";
                  return (
                    <div key={t.id} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-slate-200">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0`} style={{background:isCredit?"#DCFCE7":"#FEE2E2"}}>
                        {isCredit ? <ArrowDownRight size={16} className="text-green-600"/> : <ArrowUpRight size={16} className="text-red-500"/>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12.5px] font-medium text-[#111827] truncate">{t.narration}</p>
                        <p className="text-[10.5px] text-slate-400">{t.date} · {t.channel} · {t.reference}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[14px] font-bold" style={{color:isCredit?"#16A34A":"#EF4444"}}>{isCredit?"+":"-"}TZS {money(t.amount)}k</p>
                        <p className="text-[10.5px] text-slate-400">Bal: {money(t.balance)}k</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            }
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">

      {/* ── HEADER ── */}
      <div className="rounded-2xl px-6 py-5 relative overflow-hidden" style={{background:`linear-gradient(135deg,${BANK_BLUE} 0%,#2D5F8A 50%,#1B4F72 100%)`}}>
        <div className="absolute inset-0" style={{backgroundImage:"repeating-linear-gradient(0deg,transparent,transparent 40px,rgba(255,255,255,.025) 40px,rgba(255,255,255,.025) 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,rgba(255,255,255,.025) 40px,rgba(255,255,255,.025) 41px)"}}/>
        <div className="relative flex items-start justify-between flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Landmark size={22} className="text-white"/>
              <h1 className="text-[20px] font-bold text-white">{company?.name||"Banking"} & Financial Institution</h1>
            </div>
            <p className="text-[12px]" style={{color:"rgba(255,255,255,.55)"}}>Accounts · Teller · Loans · Fixed Deposits · Standing Orders · NPL Management</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <div className="rounded-xl px-4 py-2.5 text-center" style={{background:"rgba(255,255,255,.1)"}}>
              <p className="text-[20px] font-black text-white">{accounts.rows.filter(a=>a.status==="Active").length}</p>
              <p className="text-[10px] text-white/55">Active Accounts</p>
            </div>
            <div className="rounded-xl px-4 py-2.5 text-center" style={{background:"rgba(255,255,255,.1)"}}>
              <p className="text-[20px] font-black text-white">TZS {money(totalDeposits)}k</p>
              <p className="text-[10px] text-white/55">Total Deposits</p>
            </div>
            <div className="rounded-xl px-4 py-2.5 text-center" style={{background:nplRatio>5?"rgba(239,68,68,.2)":"rgba(255,255,255,.1)"}}>
              <p className="text-[20px] font-black" style={{color:nplRatio>5?"#FCA5A5":"#fff"}}>{nplRatio}%</p>
              <p className="text-[10px] text-white/55">NPL Ratio</p>
            </div>
            <button onClick={()=>setShowAccForm(true)} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-[12.5px] font-semibold text-white" style={{background:"rgba(255,255,255,.15)",border:"1px solid rgba(255,255,255,.25)"}}>
              <Plus size={13}/>Open Account
            </button>
          </div>
        </div>
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-0.5 bg-white rounded-xl p-1 border border-slate-200 overflow-x-auto">
        {TABS.map(t=>{const I=t.icon;return(
          <button key={t.id} onClick={()=>setTab(t.id)} className={"flex items-center gap-1 px-3 py-2 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap "+(tab===t.id?"text-white shadow-sm":"text-slate-500 hover:bg-slate-50")} style={{background:tab===t.id?BANK_BLUE:"transparent"}}>
            <I size={12}/>{t.label}
            {t.id==="loans" && npls.length>0 && <span className="ml-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{npls.length}</span>}
          </button>
        );})}
      </div>

      {/* ── DASHBOARD ── */}
      {tab==="dashboard" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              {l:"Total Deposits",   v:"TZS "+money(totalDeposits)+"k",   sub:accounts.rows.filter(a=>a.status==="Active").length+" active accounts", c:BANK_BLUE,  I:PiggyBank },
              {l:"Loan Portfolio",   v:"TZS "+money(loanPortfolio)+"k",   sub:loans.rows.filter(l=>l.status==="Active").length+" active loans",       c:"#059669",  I:Landmark },
              {l:"Fixed Deposits",   v:"TZS "+money(fdTotal)+"k",         sub:fds.rows.filter(f=>f.status==="Active").length+" accounts",             c:BANK_GOLD,  I:Archive },
              {l:"Est. Monthly Income",v:"TZS "+money(interestIncome)+"k",sub:"From loan interest",                                                   c:"#7C3AED",  I:TrendingUp},
            ].map(k=>(
              <div key={k.l} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div><p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">{k.l}</p><p className="text-[20px] font-bold mt-1 text-[#111827]">{k.v}</p><p className="text-[11.5px] mt-0.5" style={{color:k.c}}>{k.sub}</p></div>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{background:k.c+"18"}}><k.I size={18} style={{color:k.c}}/></div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Deposits by Account Type</p>
              {ACCOUNT_TYPES.slice(0,5).map(type=>{
                const typeTotal=accounts.rows.filter(a=>a.type===type).reduce((s,a)=>s+a.balance,0);
                const pct=totalDeposits>0?typeTotal/totalDeposits*100:0;
                if(!typeTotal)return null;
                const col=accTypeColor[type]||"#6B7280";
                return(
                  <div key={type} className="flex items-center gap-2 mb-2.5">
                    <span className="text-[11.5px] text-slate-600 w-24 shrink-0">{type}</span>
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:pct+"%",background:col}}/></div>
                    <span className="text-[11.5px] font-mono font-bold text-slate-700 w-20 text-right">TZS {money(typeTotal)}k</span>
                  </div>
                );
              }).filter(Boolean)}
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Loan Portfolio Quality</p>
              {[["Performing","Active","#16A34A"],["Overdue","Overdue","#F59E0B"],["Defaulted","Defaulted","#EF4444"],["Closed","Closed","#6B7280"]].map(([l,s,col])=>{
                const n=loans.rows.filter(x=>x.status===s).length;
                const amt=loans.rows.filter(x=>x.status===s).reduce((sum,x)=>sum+x.balance,0);
                return(
                  <div key={l} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                    <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{background:col}}/><span className="text-[12.5px] text-slate-600">{l}</span></div>
                    <div className="text-right"><span className="text-[13px] font-bold" style={{color:col}}>{n}</span><span className="text-[10.5px] text-slate-400 ml-1.5">TZS {money(amt)}k</span></div>
                  </div>
                );
              })}
              <div className="mt-3 pt-2 border-t border-slate-100">
                <p className="text-[11.5px] text-slate-500">NPL Ratio: <strong className="text-[#EF4444]">{nplRatio}%</strong> <span className="text-slate-400">(Target: &lt;5%)</span></p>
              </div>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Today Activity</p>
              <div className="space-y-2">
                {todayTxns.length === 0 ? <p className="text-slate-400 text-[12.5px] text-center py-4">No transactions today yet</p>
                  : todayTxns.slice(0,5).map(t=>{
                    const isCredit=t.type==="Deposit"||t.type==="Transfer In"||t.type==="Interest";
                    return(
                      <div key={t.id} className="flex items-center gap-2 p-2.5 rounded-lg bg-slate-50">
                        <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{background:isCredit?"#DCFCE7":"#FEE2E2"}}>
                          {isCredit?<ArrowDownRight size={13} className="text-green-600"/>:<ArrowUpRight size={13} className="text-red-500"/>}
                        </div>
                        <div className="flex-1 min-w-0"><p className="text-[12px] font-medium text-[#111827] truncate">{t.account}</p><p className="text-[10.5px] text-slate-400">{t.type}</p></div>
                        <p className="text-[12.5px] font-bold shrink-0" style={{color:isCredit?"#16A34A":"#EF4444"}}>{isCredit?"+":"-"}TZS {money(t.amount)}k</p>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── ACCOUNTS ── */}
      {tab==="accounts" && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative"><Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"/><input className={inputClass+" pl-9"} placeholder="Search by name, account number or type..." value={searchAcc} onChange={e=>setSearchAcc(e.target.value)}/></div>
            <button onClick={()=>downloadCSV("accounts",accounts.rows,[{key:"accountNo",label:"Account No"},{key:"name",label:"Name"},{key:"type",label:"Type"},{key:"balance",label:"Balance"},{key:"status",label:"Status"},{key:"branch",label:"Branch"}])} className="flex items-center gap-1 text-[12px] font-medium text-slate-500 border border-slate-200 px-3 py-2.5 rounded-xl hover:border-[#16A34A] hover:text-[#16A34A] transition-colors"><Download size={13}/>Export</button>
            <button onClick={()=>setShowAccForm(true)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:BANK_BLUE}}><Plus size={13}/>Open Account</button>
          </div>

          {showAccForm && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
              <p className="text-[14px] font-semibold text-[#111827]">Open New Account</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <FormField label="Customer Name *"><input className={inputClass} value={accForm.name} onChange={e=>setAccForm({...accForm,name:e.target.value})} placeholder="Full name"/></FormField>
                <FormField label="Account Type"><select className={inputClass} value={accForm.type} onChange={e=>setAccForm({...accForm,type:e.target.value})}>{ACCOUNT_TYPES.map(t=><option key={t}>{t}</option>)}</select></FormField>
                <FormField label="Branch"><select className={inputClass} value={accForm.branch} onChange={e=>setAccForm({...accForm,branch:e.target.value})}>{BRANCHES.map(b=><option key={b}>{b}</option>)}</select></FormField>
                <FormField label="Opening Balance"><input type="number" className={inputClass} value={accForm.openingBalance} onChange={e=>setAccForm({...accForm,openingBalance:e.target.value})} placeholder="TZS thousands"/></FormField>
                <FormField label="Phone"><input className={inputClass} value={accForm.phone} onChange={e=>setAccForm({...accForm,phone:e.target.value})} placeholder="0712 XXX XXX"/></FormField>
                <FormField label="Email"><input className={inputClass} value={accForm.email} onChange={e=>setAccForm({...accForm,email:e.target.value})}/></FormField>
                <FormField label="ID / Passport No"><input className={inputClass} value={accForm.idNo} onChange={e=>setAccForm({...accForm,idNo:e.target.value})}/></FormField>
              </div>
              <div className="flex gap-2"><button onClick={openAccount} className="text-[12.5px] font-semibold text-white px-5 py-2.5 rounded-xl" style={{background:BANK_BLUE}}>Open Account</button><button onClick={()=>setShowAccForm(false)} className="text-[12.5px] text-slate-500 px-4 py-2.5">Cancel</button></div>
            </div>
          )}

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["Account No","Customer","Type","Branch","Balance","Interest","Status","Actions"].map(h=><th key={h} className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>
                {filteredAccounts.map(a=>(
                  <tr key={a.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60 cursor-pointer" onClick={()=>setSelectedAcc(a)}>
                    <td className="px-4 py-3 font-mono text-[11.5px] font-semibold" style={{color:BANK_BLUE}}>{a.accountNo}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0" style={{background:accTypeColor[a.type]||"#6B7280"}}>{a.name.charAt(0)}</div><span className="font-medium text-[#111827]">{a.name}</span></div>
                    </td>
                    <td className="px-4 py-3"><span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{background:(accTypeColor[a.type]||"#6B7280")+"18",color:accTypeColor[a.type]||"#6B7280"}}>{a.type}</span></td>
                    <td className="px-4 py-3 text-slate-500">{a.branch}</td>
                    <td className="px-4 py-3 font-mono font-bold text-[#111827]">TZS {money(a.balance)}k</td>
                    <td className="px-4 py-3 font-semibold" style={{color:BANK_GOLD}}>{a.interest}%</td>
                    <td className="px-4 py-3"><StatusBadge s={a.status}/></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <button onClick={e=>{e.stopPropagation();setTellerForm(f=>({...f,accountNo:a.accountNo}));setTab("teller");setTellerTab("deposit");}} className="text-[10.5px] font-semibold text-white px-2 py-1 rounded-lg" style={{background:"#16A34A"}}>Deposit</button>
                        <button onClick={e=>{e.stopPropagation();setTellerForm(f=>({...f,accountNo:a.accountNo}));setTab("teller");setTellerTab("withdraw");}} className="text-[10.5px] font-semibold text-white px-2 py-1 rounded-lg bg-red-500">Withdraw</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-4 py-2.5 border-t border-slate-100 bg-slate-50 text-[11.5px] text-slate-400">{filteredAccounts.length} of {accounts.rows.length} accounts · Total: TZS {money(totalDeposits)}k</div>
          </div>
        </div>
      )}

      {/* ── TELLER ── */}
      {tab==="teller" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-100">
              {[["deposit","Deposit","#16A34A"],["withdraw","Withdrawal","#EF4444"],["transfer","Transfer","#2563EB"],["balance","Balance Enquiry","#7C3AED"]].map(([id,label,col])=>(
                <button key={id} onClick={()=>setTellerTab(id)} className="flex-1 py-3.5 text-[12.5px] font-semibold transition-all" style={{background:tellerTab===id?col:"transparent",color:tellerTab===id?"#fff":col,borderBottom:tellerTab===id?"none":"1px solid transparent"}}>{label}</button>
              ))}
            </div>
            <div className="p-6">
              <div className="max-w-lg mx-auto space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="Account Number">
                    <input className={inputClass} value={tellerForm.accountNo} onChange={e=>setTellerForm({...tellerForm,accountNo:e.target.value})} placeholder="Enter account number"/>
                  </FormField>
                  {tellerTab!=="balance" && (
                    <FormField label="Amount (TZS thousands)">
                      <input type="number" className={inputClass} value={tellerForm.amount} onChange={e=>setTellerForm({...tellerForm,amount:e.target.value})} placeholder="0.00"/>
                    </FormField>
                  )}
                  {tellerTab==="transfer" && (
                    <FormField label="To Account Number">
                      <input className={inputClass} value={tellerForm.toAccountNo} onChange={e=>setTellerForm({...tellerForm,toAccountNo:e.target.value})} placeholder="Beneficiary account"/>
                    </FormField>
                  )}
                  {tellerTab!=="balance" && (
                    <FormField label="Narration" cls="col-span-2">
                      <input className={inputClass} value={tellerForm.narration} onChange={e=>setTellerForm({...tellerForm,narration:e.target.value})} placeholder="Transaction description..."/>
                    </FormField>
                  )}
                </div>

                {/* Account lookup */}
                {tellerForm.accountNo && (() => {
                  const acc = accounts.rows.find(a=>a.accountNo===tellerForm.accountNo);
                  if (!acc) return <div className="p-3 rounded-xl bg-red-50 border border-red-100"><p className="text-[12.5px] text-red-600 font-medium">⚠ Account not found</p></div>;
                  return (
                    <div className="p-4 rounded-xl border-2 border-blue-100 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div><p className="text-[13.5px] font-bold text-[#111827]">{acc.name}</p><p className="text-[11.5px] text-slate-500">{acc.type} · {acc.branch}</p></div>
                        <div className="text-right"><p className="text-[11px] text-slate-400">Available Balance</p><p className="text-[20px] font-black" style={{color:BANK_BLUE}}>TZS {money(acc.balance)}k</p></div>
                      </div>
                      <StatusBadge s={acc.status}/>
                    </div>
                  );
                })()}

                {tellerTab !== "balance" && (
                  <button onClick={()=>{
                    const op = tellerTab==="deposit"?"Deposit":tellerTab==="withdraw"?"Withdrawal":"Transfer Out";
                    doTellerOp(op);
                  }} className="w-full py-3.5 rounded-xl text-[14px] font-bold text-white transition-all" style={{background:tellerTab==="deposit"?"#16A34A":tellerTab==="withdraw"?"#EF4444":"#2563EB"}}>
                    {tellerTab==="deposit"?"✓ Confirm Deposit":tellerTab==="withdraw"?"✓ Confirm Withdrawal":"✓ Confirm Transfer"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100"><p className="text-[13.5px] font-semibold text-[#111827]">Today Teller Journal ({txns.rows.length} transactions)</p></div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["Reference","Account","Customer","Type","Amount","Balance","Channel","Time","Status"].map(h=><th key={h} className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>
                {txns.rows.slice(0,15).map(t=>{
                  const isCredit=t.type==="Deposit"||t.type==="Transfer In"||t.type==="Interest"||t.type==="Loan Disbursement";
                  return(
                    <tr key={t.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">{t.reference}</td>
                      <td className="px-3 py-2.5 font-mono text-[11.5px] font-semibold" style={{color:BANK_BLUE}}>{t.accountNo}</td>
                      <td className="px-3 py-2.5 font-medium text-[#111827]">{t.account}</td>
                      <td className="px-3 py-2.5"><span className="text-[10.5px] font-semibold" style={{color:isCredit?"#16A34A":"#EF4444"}}>{t.type}</span></td>
                      <td className="px-3 py-2.5 font-mono font-bold" style={{color:isCredit?"#16A34A":"#EF4444"}}>{isCredit?"+":"-"}TZS {money(t.amount)}k</td>
                      <td className="px-3 py-2.5 font-mono text-slate-500">TZS {money(t.balance)}k</td>
                      <td className="px-3 py-2.5 text-slate-400">{t.channel}</td>
                      <td className="px-3 py-2.5 font-mono text-[11px] text-slate-400">{t.date?.slice(11)}</td>
                      <td className="px-3 py-2.5"><span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-green-50 text-green-600">{t.status}</span></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── LOANS ── */}
      {tab==="loans" && (
        <div className="space-y-3">
          {npls.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={16} className="text-red-500 shrink-0 mt-0.5"/>
              <div><p className="text-[13px] font-semibold text-red-700">{npls.length} Non-Performing Loan{npls.length>1?"s":""} — Total: TZS {money(nplAmount)}k | NPL Ratio: {nplRatio}%</p><p className="text-[11.5px] text-red-500 mt-0.5">{npls.map(l=>l.client).join(", ")}</p></div>
            </div>
          )}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[["Active Loans",loans.rows.filter(l=>l.status==="Active").length,"#2563EB"],["Portfolio","TZS "+money(loanPortfolio)+"k","#059669"],["NPLs",npls.length,"#EF4444"],["Collected Est.","TZS "+money(loans.rows.filter(l=>l.status==="Active").reduce((s,l)=>s+l.installment,0))+"k","#7C3AED"]].map(([l,v,col])=>(
              <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{l}</p><p className="text-[20px] font-bold" style={{color:col}}>{v}</p></div>
            ))}
          </div>
          {!showLoanForm && <div className="flex justify-end"><button onClick={()=>setShowLoanForm(true)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:BANK_BLUE}}><Plus size={13}/>New Loan</button></div>}
          {showLoanForm && (
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
              <p className="text-[14px] font-semibold text-[#111827]">Disburse New Loan</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField label="Client Account No *"><input className={inputClass} value={loanForm.clientAccountNo} onChange={e=>setLoanForm({...loanForm,clientAccountNo:e.target.value})} placeholder="Account number"/></FormField>
                {loanForm.clientAccountNo && (() => { const a=accounts.rows.find(x=>x.accountNo===loanForm.clientAccountNo); return a?<div className="col-span-2 py-2 px-3 rounded-lg bg-blue-50 text-[12.5px] font-semibold text-blue-800">{a.name} · {a.type}</div>:null; })()}
                <FormField label="Loan Type"><select className={inputClass} value={loanForm.type} onChange={e=>setLoanForm({...loanForm,type:e.target.value})}>{BANKING_LOAN_TYPES.map(t=><option key={t}>{t}</option>)}</select></FormField>
                <FormField label="Principal (TZS k)"><input type="number" className={inputClass} value={loanForm.principal} onChange={e=>setLoanForm({...loanForm,principal:e.target.value})}/></FormField>
                <FormField label="Interest Rate (% p.a.)"><input type="number" className={inputClass} value={loanForm.rate} onChange={e=>setLoanForm({...loanForm,rate:Number(e.target.value)})}/></FormField>
                <FormField label="Term (months)"><input type="number" className={inputClass} value={loanForm.months} onChange={e=>setLoanForm({...loanForm,months:Number(e.target.value)})}/></FormField>
                <FormField label="Collateral"><input className={inputClass} value={loanForm.collateral} onChange={e=>setLoanForm({...loanForm,collateral:e.target.value})} placeholder="Property, Guarantor, None"/></FormField>
                <FormField label="Purpose"><input className={inputClass} value={loanForm.purpose} onChange={e=>setLoanForm({...loanForm,purpose:e.target.value})}/></FormField>
              </div>
              {loanForm.principal && (() => {
                const P=Number(loanForm.principal), r=loanForm.rate/100/12, n=loanForm.months;
                const inst=r>0?P*(r*Math.pow(1+r,n))/(Math.pow(1+r,n)-1):P/n;
                const total=inst*n;
                return(
                  <div className="grid grid-cols-3 gap-3">
                    {[["Monthly Installment","TZS "+money(inst)+"k",BANK_BLUE],["Total Repayable","TZS "+money(total)+"k","#111827"],["Interest Income","TZS "+money(total-P)+"k","#16A34A"]].map(([l,v,col])=>(
                      <div key={l} className="bg-slate-50 rounded-xl p-3 text-center"><p className="text-[10.5px] text-slate-400">{l}</p><p className="text-[15px] font-bold mt-0.5" style={{color:col}}>{v}</p></div>
                    ))}
                  </div>
                );
              })()}
              <div className="flex gap-2"><button onClick={disburseLoan} className="text-[12.5px] font-semibold text-white px-5 py-2.5 rounded-xl" style={{background:BANK_BLUE}}>Disburse Loan</button><button onClick={()=>setShowLoanForm(false)} className="text-[12.5px] text-slate-500 px-4 py-2.5">Cancel</button></div>
            </div>
          )}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["Loan No","Client","Type","Principal","Rate","Installment","Balance","Arrears","Next Due","Status"].map(h=><th key={h} className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>{loans.rows.map(l=>{
                const [bg,col]=loanStatusColor[l.status]||["#F3F4F6","#6B7280"];
                return(
                  <tr key={l.id} className={"border-b border-slate-50 last:border-0 hover:bg-slate-50/50 "+(l.status==="Overdue"||l.status==="Defaulted"?"bg-red-50/20":"")}>
                    <td className="px-3 py-3 font-mono text-[11px] font-semibold" style={{color:BANK_BLUE}}>{l.loanNo}</td>
                    <td className="px-3 py-3 font-medium text-[#111827]">{l.client}</td>
                    <td className="px-3 py-3"><span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-600">{l.type}</span></td>
                    <td className="px-3 py-3 font-mono">TZS {money(l.principal)}k</td>
                    <td className="px-3 py-3 font-semibold text-slate-600">{l.rate}%</td>
                    <td className="px-3 py-3 font-mono font-semibold" style={{color:BANK_BLUE}}>TZS {money(l.installment)}k</td>
                    <td className="px-3 py-3 font-mono font-bold" style={{color:l.balance>0?"#111827":"#16A34A"}}>TZS {money(l.balance)}k</td>
                    <td className="px-3 py-3 font-mono font-bold" style={{color:l.arrears>0?"#EF4444":"#16A34A"}}>{l.arrears>0?"TZS "+money(l.arrears)+"k":"None"}</td>
                    <td className="px-3 py-3 font-mono text-[11.5px] text-slate-400">{l.nextDue}</td>
                    <td className="px-3 py-3"><span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{background:bg,color:col}}>{l.status}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── FIXED DEPOSITS ── */}
      {tab==="deposits" && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-3">
            {[["Total FD Value","TZS "+money(fdTotal)+"k",BANK_GOLD],["Active FDs",fds.rows.filter(f=>f.status==="Active").length,"#2563EB"],["Total Interest Earned","TZS "+money(fds.rows.reduce((s,f)=>s+f.interestEarned,0))+"k","#16A34A"]].map(([l,v,col])=>(
              <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{l}</p><p className="text-[20px] font-bold" style={{color:col}}>{v}</p></div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><p className="text-[13.5px] font-semibold text-[#111827]">Fixed Deposit Accounts</p><button onClick={()=>notify("Create FD — form coming")} className="flex items-center gap-1 text-[12px] font-semibold text-white px-3 py-2 rounded-xl" style={{background:BANK_BLUE}}><Plus size={12}/>New FD</button></div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["Account No","Client","Amount","Rate","Months","Maturity Date","Interest Earned","Auto-Renew","Status"].map(h=><th key={h} className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>{fds.rows.map(f=>(
                <tr key={f.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-[11.5px] font-semibold" style={{color:BANK_BLUE}}>{f.accountNo}</td>
                  <td className="px-4 py-3 font-medium text-[#111827]">{f.client}</td>
                  <td className="px-4 py-3 font-mono font-bold">TZS {money(f.amount)}k</td>
                  <td className="px-4 py-3 font-semibold" style={{color:BANK_GOLD}}>{f.rate}%</td>
                  <td className="px-4 py-3">{f.months}m</td>
                  <td className="px-4 py-3 font-mono text-[11.5px]">{f.maturity}</td>
                  <td className="px-4 py-3 font-mono font-bold text-green-600">TZS {money(f.interestEarned)}k</td>
                  <td className="px-4 py-3"><span className={"text-[10.5px] font-semibold px-2 py-0.5 rounded-full "+(f.autoRenew?"bg-blue-50 text-blue-600":"bg-slate-100 text-slate-500")}>{f.autoRenew?"Yes":"No"}</span></td>
                  <td className="px-4 py-3"><StatusBadge s={f.status}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STANDING ORDERS ── */}
      {tab==="standing" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3"><p className="text-[11px] text-slate-500">Use the shared server-confirmed workflow for maker-checker approval, activation, pausing, resuming, cancellation, and run status.</p><button onClick={()=>{ if (onOpenStandingOrderWorkflow) onOpenStandingOrderWorkflow(); else notify("Open Bank & MFI > Cash & channels to use the server-confirmed Standing Order workflow.", "info"); }} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:BANK_BLUE}}><Plus size={13}/>Open Standing Order workflow</button></div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["Account No","Debtor","Beneficiary","Amount","Frequency","Next Run","Status"].map(h=><th key={h} className="px-4 py-3 text-left text-[10.5px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>{sos.rows.map(so=>(
                <tr key={so.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                  <td className="px-4 py-3 font-mono text-[11.5px] font-semibold" style={{color:BANK_BLUE}}>{so.accountNo}</td>
                  <td className="px-4 py-3 font-medium text-[#111827]">{so.debtor}</td>
                  <td className="px-4 py-3 text-slate-500">{so.beneficiary}</td>
                  <td className="px-4 py-3 font-mono font-bold">TZS {money(so.amount)}k</td>
                  <td className="px-4 py-3 text-slate-500">{so.frequency}</td>
                  <td className="px-4 py-3 font-mono text-[11.5px]">{so.nextRun}</td>
                  <td className="px-4 py-3"><StatusBadge s={so.status}/></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── REPORTS ── */}
      {tab==="reports" && (
        <div className="space-y-4">

          {/* KPI tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              ["Total Deposits",`TZS ${money(Math.round(totalDeposits/1000))}k`,"#2563EB"],
              ["Loan Portfolio",`TZS ${money(Math.round(loanPortfolio/1000))}k`,"#16A34A"],
              ["Interest Income (Mo.)",`TZS ${money(Math.round(interestIncome))}k`,"#D97706"],
              ["Active Accounts",String(accounts.rows.filter(a=>a.status==="Active").length),"#7C3AED"],
            ].map(([l,v,col])=>(
              <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
                <p className="text-[10.5px] text-slate-400 uppercase tracking-wide mb-1">{l}</p>
                <p className="text-[18px] font-bold" style={{color:col}}>{v}</p>
              </div>
            ))}
          </div>

          {/* Loan Status PieChart + Account Type BarChart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Loan Portfolio by Status</h3>
              {(() => {
                const statusData = ["Active","Overdue","Closed","Written Off"].map((s,i)=>({
                  name:s, value:loans.rows.filter(l=>l.status===s).length,
                  fill:["#16A34A","#EF4444","#94A3B8","#374151"][i],
                })).filter(d=>d.value>0);
                return statusData.length === 0 ? <p className="text-slate-400 text-center py-6">No loans</p> : (
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="55%" height={150}>
                      <RPieChart><Pie data={statusData} dataKey="value" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                        {statusData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                      </Pie><Tooltip formatter={(v,n)=>[v+" loans",n]}/></RPieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-1.5">
                      {statusData.map(d=>(
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[12px]"><span className="w-2.5 h-2.5 rounded-full" style={{background:d.fill}}/>{d.name}</span>
                          <span className="text-[13px] font-bold" style={{color:d.fill}}>{d.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Deposit by Account Type (TZS k)</h3>
              {(() => {
                const typeData = ACCOUNT_TYPES.slice(0,6).map((type,i)=>({
                  name:type.replace(" ",""),
                  value:Math.round(accounts.rows.filter(a=>a.type===type).reduce((s,a)=>s+(a.balance||0),0)/1000),
                  fill:["#2563EB","#16A34A","#D97706","#7C3AED","#EF4444","#0891B2"][i],
                })).filter(d=>d.value>0);
                return typeData.length === 0 ? <p className="text-slate-400 text-center py-6">No accounts</p> : (
                  <ResponsiveContainer width="100%" height={150}>
                    <BarChart data={typeData} layout="vertical" margin={{left:5,right:20,top:0,bottom:0}}>
                      <CartesianGrid vertical={false} stroke="#EEF1F4"/>
                      <XAxis type="number" tick={{fontSize:9}} axisLine={false} tickLine={false}/>
                      <YAxis dataKey="name" type="category" tick={{fontSize:10}} axisLine={false} tickLine={false} width={70}/>
                      <Tooltip formatter={(v)=>[`TZS ${money(v)}k`,"Balance"]}/>
                      <Bar dataKey="value" radius={[0,4,4,0]} maxBarSize={16}>
                        {typeData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                );
              })()}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <h3 className="text-[15px] font-semibold text-[#111827] mb-4">Balance Sheet Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between border-b border-slate-100 pb-2"><span className="text-[13px] font-semibold text-slate-700">ASSETS</span></div>
                <div className="flex justify-between"><span className="text-[12.5px] text-slate-500">Loans Receivable</span><span className="text-[12.5px] font-semibold text-[#111827]">TZS {money(loanPortfolio)}k</span></div>
                <div className="flex justify-between"><span className="text-[12.5px] text-slate-500">Fixed Deposits Invested</span><span className="text-[12.5px] font-semibold text-[#111827]">TZS {money(fdTotal)}k</span></div>
                <div className="flex justify-between border-t border-slate-100 pt-2"><span className="text-[13px] font-semibold text-slate-700">LIABILITIES</span></div>
                <div className="flex justify-between"><span className="text-[12.5px] text-slate-500">Customer Deposits</span><span className="text-[12.5px] font-semibold text-[#111827]">TZS {money(totalDeposits)}k</span></div>
                <div className="flex justify-between border-t border-slate-200 pt-2 mt-2">
                  <span className="text-[13px] font-bold text-[#111827]">Net Position</span>
                  <span className="text-[13px] font-bold" style={{color:loanPortfolio-totalDeposits>=0?"#16A34A":"#EF4444"}}>TZS {money(Math.abs(loanPortfolio-totalDeposits))}k</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
              <h3 className="text-[15px] font-semibold text-[#111827] mb-4">Income Statement (Estimated)</h3>
              <div className="space-y-2">
                {[["Interest on Loans (Monthly)",money(interestIncome)+"k","#16A34A"],["FD Interest Expense",money(fds.rows.reduce((s,f)=>s+(f.amount*f.rate/100/12),0))+"k","#EF4444"],["Net Interest Margin",money(interestIncome-fds.rows.reduce((s,f)=>s+(f.amount*f.rate/100/12),0))+"k","#2563EB"]].map(([l,v,col])=>(
                  <div key={l} className="flex justify-between items-center p-3 rounded-lg bg-slate-50">
                    <span className="text-[12.5px] text-slate-600">{l}</span>
                    <span className="text-[13.5px] font-bold font-mono" style={{color:col}}>TZS {v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {selectedAcc && <AccStatement acc={selectedAcc}/>}
    </div>
  );
}

function LegacyRestaurantModule({ currentUser, company }) {
  const [tab, setTab]       = useState("floor");
  const [kitchenTab, setKitchenTab] = useState("active");
  const [menuCat, setMenuCat]   = useState("All");
  const [activeTable, setActiveTable] = useState(null);
  const [activeOrder, setActiveOrder] = useState(null);
  const [cart, setCart]         = useState([]);
  const [orderNote, setOrderNote] = useState("");
  const [selectedWaiter, setSelectedWaiter] = useState(RST_WAITERS[0]);
  const [showResvForm, setShowResvForm] = useState(false);
  const [resvForm, setResvForm] = useState({ name:"", phone:"", date:"", time:"", covers:"", table:"", note:"" });

  const tables       = useCompanyTable("rst_tables",       RST_TABLES_SEED,       { mapRow: r => r });
  const menuItems    = useCompanyTable("rst_menu",         RST_MENU_SEED,         { mapRow: r => r });
  const orders       = useCompanyTable("rst_orders",       RST_ORDERS_SEED,       { mapRow: r => r });
  const reservations = useCompanyTable("rst_reservations", RST_RESERVATIONS_SEED, { mapRow: r => r });

  const RST_RED    = "#B91C1C";
  const RST_ORANGE = "#C2410C";
  const RST_GREEN  = "#16A34A";

  const TABS = [
    { id:"floor",    label:"Table Floor",    icon: Layers },
    { id:"order",    label:"Take Order",     icon: UtensilsCrossed },
    { id:"kitchen",  label:"Kitchen Display",icon: ChefHat },
    { id:"menu",     label:"Menu Manager",   icon: BookOpen },
    { id:"reservations",label:"Reservations",icon: CalendarDays },
    { id:"reports",  label:"Reports",        icon: BarChart3 },
  ];

  // Analytics
  const todayOrders  = orders.rows.filter(o=>o.status!=="Cancelled");
  const todayRevenue = todayOrders.filter(o=>o.status==="Paid").reduce((s,o)=>s+o.total,0);
  const pendingOrders= orders.rows.filter(o=>o.status==="Preparing"||o.status==="Ready");
  const occupiedTbls = tables.rows.filter(t=>t.status==="Occupied").length;
  const occupancy    = tables.rows.length>0?(occupiedTbls/tables.rows.length*100).toFixed(0):0;

  const tableStatusStyle = {
    Available:{ bg:"#F0FDF4", border:"#86EFAC",  dot:"#16A34A", text:"#15803D" },
    Occupied: { bg:"#FEF2F2", border:"#FCA5A5",  dot:"#EF4444", text:"#B91C1C" },
    Reserved: { bg:"#EFF6FF", border:"#93C5FD",  dot:"#3B82F6", text:"#1D4ED8" },
    Cleaning: { bg:"#FFFBEB", border:"#FCD34D",  dot:"#F59E0B", text:"#B45309" },
  };

  function addToCart(item) {
    setCart(prev => {
      const ex = prev.find(c=>c.id===item.id);
      if (ex) return prev.map(c=>c.id===item.id?{...c,qty:c.qty+1}:c);
      return [...prev, {...item, qty:1}];
    });
  }
  function removeFromCart(id) { setCart(p=>p.filter(c=>c.id!==id)); }
  function updateQty(id, delta) {
    setCart(p=>p.map(c=>c.id===id?{...c,qty:Math.max(1,c.qty+delta)}:c).filter(c=>c.qty>0));
  }

  const cartSubtotal = cart.reduce((s,c)=>s+c.price*c.qty,0);
  const cartTax      = Math.round(cartSubtotal * 0.1);
  const cartTotal    = cartSubtotal + cartTax;

  async function placeOrder() {
    if (!activeTable || cart.length===0) { notify("Select a table and add items","error"); return; }
    const tbl = tables.rows.find(t=>t.id===activeTable);
    const row = {
      id: docId("ORD"), table: tbl?.number||activeTable,
      waiter: selectedWaiter,
      items: cart.map(c=>({id:c.id,name:c.name,qty:c.qty,price:c.price})),
      subtotal: cartSubtotal, tax: cartTax, total: cartTotal,
      paid: 0, status:"Preparing", timeIn: new Date().toTimeString().slice(0,5), note: orderNote, kitchen:"In Progress"
    };
    orders.setRows(p=>[row,...p]);
    tables.setRows(p=>p.map(t=>t.id===activeTable?{...t,status:"Occupied",waiter:selectedWaiter,currentOrder:row.id}:t));
    setCart([]); setOrderNote(""); setActiveTable(null);
    notify("Order "+row.id+" placed for "+tbl?.number+" — "+cart.length+" items");
    logAudit("Order: "+row.id, "Restaurant", currentUser?.name||"Waiter", "Table "+tbl?.number+", TZS "+money(cartTotal)+"k");
  }

  async function updateOrderStatus(orderId, status) {
    orders.setRows(p=>p.map(o=>o.id===orderId?{...o,status,kitchen:status==="Ready"?"Ready":status==="Paid"?"Served":"In Progress"}:o));
    if (status==="Paid") {
      const ord = orders.rows.find(o=>o.id===orderId);
      if (ord) {
        orders.setRows(p=>p.map(o=>o.id===orderId?{...o,paid:o.total}:o));
        tables.setRows(p=>p.map(t=>t.number===ord.table?{...t,status:"Cleaning",waiter:"",currentOrder:null}:t));
      }
    }
    notify("Order "+orderId+" → "+status);
  }

  async function addReservation() {
    if (!resvForm.name||!resvForm.date||!resvForm.time) return;
    const row = {...resvForm, id:docId("RES"), covers:Number(resvForm.covers)||2, status:"Pending"};
    reservations.setRows(p=>[row,...p]);
    if (resvForm.table) {
      const tblId = tables.rows.find(t=>t.number===resvForm.table)?.id;
      if (tblId) tables.setRows(p=>p.map(t=>t.id===tblId?{...t,status:"Reserved"}:t));
    }
    setResvForm({name:"",phone:"",date:"",time:"",covers:"",table:"",note:""});
    setShowResvForm(false);
    notify("Reservation for "+resvForm.name+" on "+resvForm.date);
  }

  const filteredMenu = menuCat==="All" ? menuItems.rows : menuItems.rows.filter(m=>m.category===menuCat);

  return (
    <div className="space-y-4">

      {/* HEADER */}
      <div className="rounded-2xl px-6 py-5 relative overflow-hidden" style={{background:"linear-gradient(135deg,#7F1D1D 0%,#B91C1C 40%,#C2410C 100%)"}}>
        <div className="absolute right-6 top-3 opacity-10 text-[80px]">🍽️</div>
        <div className="relative flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1"><UtensilsCrossed size={22} className="text-white"/><h1 className="text-[20px] font-bold text-white">{company?.name||"Restaurant"} Management</h1></div>
            <p className="text-[12px]" style={{color:"rgba(255,255,255,.6)"}}>Tables · Orders · Kitchen · Menu · Reservations · Billing</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[["Tables",tables.rows.length],["Occupied",occupiedTbls+" ("+occupancy+"%)"],["Active Orders",pendingOrders.length],["Revenue",TZS_FMT(todayRevenue)]].map(([l,v])=>(
              <div key={l} className="text-center rounded-xl px-4 py-2" style={{background:"rgba(255,255,255,.12)"}}>
                <p className="text-[16px] font-black text-white">{v}</p>
                <p className="text-[10px] text-white/55">{l}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-0.5 bg-white rounded-xl p-1 border border-slate-200 overflow-x-auto">
        {TABS.map(t=>{const I=t.icon;return(
          <button key={t.id} onClick={()=>setTab(t.id)} className={"flex items-center gap-1 px-3 py-2 rounded-lg text-[11.5px] font-medium transition-all whitespace-nowrap "+(tab===t.id?"text-white shadow-sm":"text-slate-500 hover:bg-slate-50")} style={{background:tab===t.id?RST_RED:"transparent"}}>
            <I size={12}/>{t.label}
            {t.id==="kitchen"&&pendingOrders.length>0&&<span className="ml-0.5 bg-yellow-400 text-yellow-900 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">{pendingOrders.length}</span>}
          </button>
        );})}
      </div>

      {/* TABLE FLOOR */}
      {tab==="floor" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Object.entries({Available:"#16A34A",Occupied:"#EF4444",Reserved:"#3B82F6",Cleaning:"#F59E0B"}).map(([s,col])=>{
              const n=tables.rows.filter(t=>t.status===s).length;
              return <div key={s} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center"><p className="text-[22px] font-bold" style={{color:col}}>{n}</p><p className="text-[11.5px] text-slate-400 mt-0.5">{s}</p></div>;
            })}
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <p className="text-[13.5px] font-semibold text-[#111827] mb-4">Restaurant Floor Plan</p>
            {TABLE_ZONES.map(zone=>{
              const zoneTables = tables.rows.filter(t=>t.zone===zone);
              if (!zoneTables.length) return null;
              return (
                <div key={zone} className="mb-5 last:mb-0">
                  <p className="text-[11.5px] font-semibold text-slate-400 uppercase tracking-wide mb-2.5">{zone}</p>
                  <div className="flex flex-wrap gap-3">
                    {zoneTables.map(t=>{
                      const s = tableStatusStyle[t.status] || tableStatusStyle.Available;
                      const ord = t.currentOrder ? orders.rows.find(o=>o.id===t.currentOrder) : null;
                      return (
                        <div key={t.id} onClick={()=>{setActiveTable(t.id);setTab("order");}} className="w-36 rounded-2xl p-3 cursor-pointer hover:shadow-lg transition-all border-2" style={{background:s.bg,borderColor:s.border}}>
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{background:s.dot}}/><span className="text-[14px] font-black" style={{color:s.text}}>{t.number}</span></div>
                            <span className="text-[10px] font-medium text-slate-400">{t.seats} seats</span>
                          </div>
                          <p className="text-[10px] font-semibold uppercase tracking-wide" style={{color:s.text}}>{t.status}</p>
                          {t.waiter&&<p className="text-[10px] text-slate-500 truncate mt-0.5">{t.waiter}</p>}
                          {ord&&<p className="text-[11px] font-bold mt-1.5" style={{color:s.text}}>TZS {money(ord.total)}k</p>}
                          {t.status==="Cleaning"&&<button onClick={e=>{e.stopPropagation();tables.setRows(p=>p.map(x=>x.id===t.id?{...x,status:"Available"}:x));notify("Table "+t.number+" ready");}} className="mt-2 w-full text-[10px] font-bold py-1 rounded-lg bg-white border" style={{color:s.text,borderColor:s.border}}>Mark Ready</button>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAKE ORDER */}
      {tab==="order" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Left: Menu */}
          <div className="lg:col-span-2 space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex gap-1 overflow-x-auto">
                {["All",...MENU_CATEGORIES].map(cat=>(
                  <button key={cat} onClick={()=>setMenuCat(cat)} className={"px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all "+(menuCat===cat?"text-white":"text-slate-500 bg-white border border-slate-200 hover:border-red-300")} style={{background:menuCat===cat?RST_RED:"white"}}>{cat}</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredMenu.map(item=>(
                <div key={item.id} onClick={()=>item.available&&addToCart(item)} className={"bg-white rounded-xl border shadow-sm p-3 cursor-pointer transition-all "+(item.available?"hover:border-red-300 hover:shadow-md":"opacity-50 cursor-not-allowed")} style={{borderColor:cart.find(c=>c.id===item.id)?"#EF4444":"#E5E7EB"}}>
                  <div className="text-[28px] mb-2 text-center">{item.image}</div>
                  <p className="text-[12.5px] font-semibold text-[#111827] leading-tight">{item.name}</p>
                  <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">{item.description}</p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-[13px] font-bold" style={{color:RST_RED}}>{TZS_FMT(item.price)}</p>
                    {item.popular&&<span className="text-[9.5px] font-bold px-1.5 py-0.5 rounded-full bg-yellow-50 text-yellow-700">★ Popular</span>}
                  </div>
                  {!item.available&&<p className="text-[10px] text-red-400 font-semibold mt-1">Unavailable</p>}
                  {cart.find(c=>c.id===item.id)&&<div className="mt-1.5 bg-red-600 text-white text-[10px] font-bold text-center py-0.5 rounded-lg">In Order ({cart.find(c=>c.id===item.id).qty})</div>}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Order Ticket */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-4 border-b border-slate-100" style={{background:RST_RED}}>
                <p className="text-[14px] font-bold text-white">Order Ticket</p>
                <div className="flex gap-2 mt-2">
                  <select className="flex-1 bg-white/20 text-white border border-white/30 rounded-lg px-2 py-1.5 text-[11.5px]" value={activeTable||""} onChange={e=>setActiveTable(e.target.value)}>
                    <option value="">Select Table</option>
                    {tables.rows.filter(t=>t.status==="Available"||t.status===activeTable).map(t=><option key={t.id} value={t.id}>{t.number} — {t.seats} seats ({t.zone})</option>)}
                  </select>
                  <select className="flex-1 bg-white/20 text-white border border-white/30 rounded-lg px-2 py-1.5 text-[11.5px]" value={selectedWaiter} onChange={e=>setSelectedWaiter(e.target.value)}>
                    {RST_WAITERS.map(w=><option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
              </div>
              <div className="p-3 min-h-[200px]">
                {cart.length===0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-slate-300">
                    <UtensilsCrossed size={32}/>
                    <p className="text-[12px] mt-2">Tap menu items to add</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {cart.map(item=>(
                      <div key={item.id} className="flex items-center gap-2">
                        <span className="text-[11.5px]">{item.image}</span>
                        <div className="flex-1 min-w-0"><p className="text-[12px] font-medium text-[#111827] truncate">{item.name}</p><p className="text-[11px] text-slate-400">{TZS_FMT(item.price)}</p></div>
                        <div className="flex items-center gap-1">
                          <button onClick={()=>updateQty(item.id,-1)} className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[14px] font-bold hover:bg-red-100 hover:text-red-600">−</button>
                          <span className="text-[12.5px] font-bold w-5 text-center">{item.qty}</span>
                          <button onClick={()=>updateQty(item.id,1)} className="w-6 h-6 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[14px] font-bold hover:bg-green-100 hover:text-green-600">+</button>
                        </div>
                        <span className="text-[12px] font-bold text-[#111827] w-16 text-right">{TZS_FMT(item.price*item.qty)}</span>
                        <button onClick={()=>removeFromCart(item.id)} className="text-slate-300 hover:text-red-500"><X size={13}/></button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {cart.length>0&&(
                <div className="border-t border-slate-100 p-3 space-y-2">
                  <input className={inputClass+" text-[12px]"} value={orderNote} onChange={e=>setOrderNote(e.target.value)} placeholder="Special instructions (optional)..."/>
                  <div className="space-y-1 text-[12.5px]">
                    <div className="flex justify-between"><span className="text-slate-500">Subtotal</span><span>{TZS_FMT(cartSubtotal)}</span></div>
                    <div className="flex justify-between"><span className="text-slate-500">Tax (10%)</span><span>{TZS_FMT(cartTax)}</span></div>
                    <div className="flex justify-between font-bold text-[14px] border-t border-slate-100 pt-1.5"><span>Total</span><span style={{color:RST_RED}}>{TZS_FMT(cartTotal)}</span></div>
                  </div>
                  <button onClick={placeOrder} className="w-full py-3 rounded-xl text-[13.5px] font-bold text-white" style={{background:RST_RED}}>
                    🍽️ Send to Kitchen
                  </button>
                  <button onClick={()=>setCart([])} className="w-full py-2 rounded-xl text-[12px] text-slate-500 border border-slate-200">Clear Order</button>
                </div>
              )}
            </div>

            {/* Active orders summary */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <p className="text-[13px] font-semibold text-[#111827] mb-3">Active Orders</p>
              <div className="space-y-2">
                {pendingOrders.length===0?<p className="text-slate-400 text-[12px] text-center py-2">No active orders</p>:pendingOrders.map(o=>(
                  <div key={o.id} className="p-2.5 rounded-lg border border-slate-100">
                    <div className="flex justify-between items-center">
                      <div><p className="text-[12.5px] font-bold text-[#111827]">Table {o.table}</p><p className="text-[11px] text-slate-400">{o.items.length} items · {o.timeIn}</p></div>
                      <div className="flex gap-1">
                        {o.status==="Preparing"&&<button onClick={()=>updateOrderStatus(o.id,"Ready")} className="text-[10.5px] font-bold text-white px-2 py-1 rounded-lg bg-yellow-500">Ready</button>}
                        {o.status==="Ready"&&<button onClick={()=>updateOrderStatus(o.id,"Paid")} className="text-[10.5px] font-bold text-white px-2 py-1 rounded-lg bg-green-600">Bill & Pay</button>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KITCHEN DISPLAY */}
      {tab==="kitchen" && (
        <div className="space-y-4">
          <div className="flex gap-2">
            {[["active","Active Orders","#B91C1C"],["ready","Ready to Serve","#16A34A"],["all","All Today","#2563EB"]].map(([id,label,col])=>(
              <button key={id} onClick={()=>setKitchenTab(id)} className="px-4 py-2 rounded-xl text-[12.5px] font-semibold transition-all" style={{background:kitchenTab===id?col:"white",color:kitchenTab===id?"white":col,border:`1.5px solid ${col}`}}>{label}</button>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {orders.rows.filter(o=>{
              if(kitchenTab==="active") return o.status==="Preparing";
              if(kitchenTab==="ready") return o.status==="Ready";
              return o.status!=="Cancelled";
            }).map(o=>{
              const isReady=o.status==="Ready", isPreparing=o.status==="Preparing";
              return(
                <div key={o.id} className="bg-white rounded-2xl border-2 shadow-md overflow-hidden" style={{borderColor:isReady?"#16A34A":isPreparing?"#F59E0B":"#E5E7EB"}}>
                  <div className="px-4 py-3 flex items-center justify-between" style={{background:isReady?"#16A34A":isPreparing?"#F59E0B":"#F3F4F6"}}>
                    <div className="flex items-center gap-2">
                      <span className="text-[22px] font-black text-white">{o.table}</span>
                      <div><p className="text-[11px] text-white/80">{o.waiter}</p><p className="text-[11px] text-white/70">{o.timeIn}</p></div>
                    </div>
                    <div className="text-right"><p className="text-[12px] font-bold text-white">{isReady?"✓ READY":isPreparing?"⏳ COOKING":"✅ DONE"}</p><p className="text-[10px] text-white/70">{o.id}</p></div>
                  </div>
                  <div className="p-4">
                    <div className="space-y-2.5 mb-4">
                      {o.items.map((item,i)=>(
                        <div key={i} className="flex items-center gap-3">
                          <span className="text-[22px]">{menuItems.rows.find(m=>m.id===item.id)?.image||"🍽️"}</span>
                          <div className="flex-1"><p className="text-[13.5px] font-semibold text-[#111827]">{item.name}</p>{o.note&&i===0&&<p className="text-[11px] text-orange-500 font-medium">📝 {o.note}</p>}</div>
                          <span className="text-[20px] font-black" style={{color:isPreparing?"#F59E0B":"#16A34A"}}>×{item.qty}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      {isPreparing&&<button onClick={()=>updateOrderStatus(o.id,"Ready")} className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold text-white bg-green-600">✓ Mark Ready</button>}
                      {isReady&&<button onClick={()=>updateOrderStatus(o.id,"Paid")} className="flex-1 py-2.5 rounded-xl text-[12.5px] font-bold text-white" style={{background:RST_RED}}>Bill & Pay</button>}
                    </div>
                  </div>
                </div>
              );
            })}
            {orders.rows.filter(o=>kitchenTab==="active"?o.status==="Preparing":kitchenTab==="ready"?o.status==="Ready":o.status!=="Cancelled").length===0&&(
              <div className="col-span-full text-center py-16 text-slate-300"><ChefHat size={40} className="mx-auto mb-3"/><p className="text-[15px]">No {kitchenTab==="active"?"active orders":kitchenTab==="ready"?"orders ready":"orders"}</p></div>
            )}
          </div>
        </div>
      )}

      {/* MENU MANAGER */}
      {tab==="menu" && (
        <div className="space-y-3">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[["Menu Items",menuItems.rows.length,"#B91C1C"],["Available",menuItems.rows.filter(m=>m.available).length,"#16A34A"],["Popular",menuItems.rows.filter(m=>m.popular).length,"#F59E0B"],["Categories",MENU_CATEGORIES.length,"#7C3AED"]].map(([l,v,col])=>(
              <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{l}</p><p className="text-[22px] font-bold" style={{color:col}}>{v}</p></div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between"><p className="text-[13.5px] font-semibold text-[#111827]">Menu Items</p><button onClick={()=>notify("Add menu item")} className="flex items-center gap-1 text-[12px] font-semibold text-white px-3 py-2 rounded-xl" style={{background:RST_RED}}><Plus size={12}/>Add Item</button></div>
            <table className="w-full text-[12.5px]">
              <thead><tr className="border-b border-slate-100 bg-slate-50">{["","Item","Category","Price","Cost","Margin","Prep","Popular","Available"].map(h=><th key={h} className="px-3 py-3 text-left text-[10px] font-medium uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead>
              <tbody>{menuItems.rows.map(item=>{
                const margin=item.price>0?((item.price-item.cost)/item.price*100).toFixed(0):0;
                return(
                  <tr key={item.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/50">
                    <td className="px-3 py-3 text-[20px]">{item.image}</td>
                    <td className="px-3 py-3"><p className="font-medium text-[#111827]">{item.name}</p><p className="text-[11px] text-slate-400 max-w-[160px] truncate">{item.description}</p></td>
                    <td className="px-3 py-3"><span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full" style={{background:RST_RED+"15",color:RST_RED}}>{item.category}</span></td>
                    <td className="px-3 py-3 font-bold" style={{color:RST_RED}}>{TZS_FMT(item.price)}</td>
                    <td className="px-3 py-3 text-slate-400">{TZS_FMT(item.cost)}</td>
                    <td className="px-3 py-3 font-bold" style={{color:margin>50?"#16A34A":margin>30?"#F59E0B":"#EF4444"}}>{margin}%</td>
                    <td className="px-3 py-3 text-slate-500">{item.prepTime}min</td>
                    <td className="px-3 py-3">{item.popular?<span className="text-[10px] font-bold text-yellow-600 bg-yellow-50 px-1.5 py-0.5 rounded">★ Yes</span>:<span className="text-slate-300 text-[11px]">—</span>}</td>
                    <td className="px-3 py-3">
                      <button onClick={()=>menuItems.setRows(p=>p.map(m=>m.id===item.id?{...m,available:!m.available}:m))} className={"text-[10.5px] font-bold px-2 py-0.5 rounded-full "+(item.available?"bg-green-50 text-green-600":"bg-red-50 text-red-500")}>{item.available?"Available":"Unavail."}</button>
                    </td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      {/* RESERVATIONS */}
      {tab==="reservations" && (
        <div className="space-y-3">
          {!showResvForm&&<div className="flex justify-end"><button onClick={()=>setShowResvForm(true)} className="flex items-center gap-1.5 text-[12.5px] font-semibold text-white px-4 py-2.5 rounded-xl" style={{background:RST_RED}}><Plus size={13}/>New Reservation</button></div>}
          {showResvForm&&(
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5 space-y-3">
              <p className="text-[14px] font-semibold text-[#111827]">New Reservation</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <FormField label="Guest Name *"><input className={inputClass} value={resvForm.name} onChange={e=>setResvForm({...resvForm,name:e.target.value})}/></FormField>
                <FormField label="Phone"><input className={inputClass} value={resvForm.phone} onChange={e=>setResvForm({...resvForm,phone:e.target.value})}/></FormField>
                <FormField label="Date *"><input type="date" className={inputClass} value={resvForm.date} onChange={e=>setResvForm({...resvForm,date:e.target.value})}/></FormField>
                <FormField label="Time *"><input type="time" className={inputClass} value={resvForm.time} onChange={e=>setResvForm({...resvForm,time:e.target.value})}/></FormField>
                <FormField label="Covers (guests)"><input type="number" min="1" className={inputClass} value={resvForm.covers} onChange={e=>setResvForm({...resvForm,covers:e.target.value})}/></FormField>
                <FormField label="Table"><select className={inputClass} value={resvForm.table} onChange={e=>setResvForm({...resvForm,table:e.target.value})}><option value="">Select table...</option>{tables.rows.filter(t=>t.status==="Available").map(t=><option key={t.id} value={t.number}>{t.number} — {t.seats} seats ({t.zone})</option>)}</select></FormField>
                <FormField label="Special Note" cls="col-span-2"><input className={inputClass} value={resvForm.note} onChange={e=>setResvForm({...resvForm,note:e.target.value})} placeholder="Birthday, Anniversary, Dietary requirements..."/></FormField>
              </div>
              <div className="flex gap-2"><button onClick={addReservation} className="text-[12.5px] font-semibold text-white px-5 py-2.5 rounded-xl" style={{background:RST_RED}}>Confirm Reservation</button><button onClick={()=>setShowResvForm(false)} className="text-[12.5px] text-slate-500 px-4 py-2.5">Cancel</button></div>
            </div>
          )}
          <div className="space-y-3">
            {reservations.rows.map(r=>{
              const sty={Confirmed:["#DCFCE7","#16A34A"],Pending:["#FEF3C7","#D97706"],Cancelled:["#FEE2E2","#EF4444"]}[r.status]||["#F3F4F6","#6B7280"];
              return(
                <div key={r.id} className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 flex items-center gap-4 flex-wrap">
                  <div className="w-16 h-16 rounded-2xl flex flex-col items-center justify-center shrink-0" style={{background:RST_RED+"15"}}>
                    <p className="text-[10.5px] font-bold text-red-700">{r.date?.slice(5,7)}/{r.date?.slice(8,10)}</p>
                    <p className="text-[14px] font-black text-red-700">{r.time}</p>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-bold text-[#111827]">{r.name}</p>
                    <p className="text-[12px] text-slate-400">{r.covers} covers · Table {r.table||"TBA"} · {r.phone}</p>
                    {r.note&&<p className="text-[12px] text-orange-500 font-medium mt-0.5">📝 {r.note}</p>}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-semibold px-2 py-0.5 rounded-full" style={{background:sty[0],color:sty[1]}}>{r.status}</span>
                    {r.status==="Pending"&&<button onClick={()=>reservations.setRows(p=>p.map(x=>x.id===r.id?{...x,status:"Confirmed"}:x))} className="text-[11px] font-bold text-white px-2.5 py-1 rounded-lg" style={{background:RST_RED}}>Confirm</button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* REPORTS */}
      {tab==="reports" && (
        <div className="space-y-4">
          {/* Export bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <p className="text-[12.5px] text-slate-500">Today: {new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long"})}</p>
            <div className="flex gap-2">
              <button onClick={()=>downloadCSV("restaurant-orders",orders.rows.map(o=>({
                ID:o.id,Table:o.table||"—",Items:o.items?.map(i=>`${i.qty}×${i.name}`).join("; ")||"",
                Total_k:Math.round(o.items?.reduce((s,i)=>s+(i.price||0)*i.qty,0)||0),
                Status:o.status||"",Time:o.time||"",Server:o.server||"",
              })),[{key:"ID",label:"Order ID"},{key:"Table",label:"Table"},{key:"Items",label:"Items"},
                 {key:"Total_k",label:"Total (TZS k)"},{key:"Status",label:"Status"},{key:"Time",label:"Time"},{key:"Server",label:"Server"}])}
                className="flex items-center gap-1.5 text-[12px] font-semibold text-[#16A34A] border border-[#16A34A]/25 bg-[#F0FDF4] px-3 py-1.5 rounded-lg">
                <Download size={12}/> CSV
              </button>
              <button onClick={()=>{
                const co=window.__smartManagerCompany||{};
                const top=menuItems.rows.map(mi=>{
                  const sold=orders.rows.flatMap(o=>o.items||[]).filter(i=>i.id===mi.id).reduce((s,i)=>s+i.qty,0);
                  const rev=orders.rows.flatMap(o=>o.items||[]).filter(i=>i.id===mi.id).reduce((s,i)=>s+(i.price||0)*i.qty,0);
                  return {name:mi.name,sold,rev};
                }).filter(m=>m.sold>0).sort((a,b)=>b.rev-a.rev).slice(0,10);
                printReport("Restaurant Daily Report",`
                  <div class="kpi-grid">
                    <div class="kpi"><div class="kpi-label">Orders Today</div><div class="kpi-value" style="color:#B91C1C">${todayOrders.length}</div></div>
                    <div class="kpi"><div class="kpi-label">Revenue</div><div class="kpi-value" style="color:#16A34A">${TZS_FMT(todayRevenue)}</div></div>
                    <div class="kpi"><div class="kpi-label">Avg Order</div><div class="kpi-value">${TZS_FMT(todayOrders.length>0?todayRevenue/Math.max(todayOrders.filter(o=>o.status==="Paid").length,1):0)}</div></div>
                    <div class="kpi"><div class="kpi-label">Tables Served</div><div class="kpi-value" style="color:#7C3AED">${new Set(todayOrders.map(o=>o.table)).size}</div></div>
                  </div>
                  <table><thead><tr><th>Item</th><th class="r">Sold</th><th class="r">Revenue</th></tr></thead>
                  <tbody>${top.map((m,i)=>`<tr style="background:${i%2===0?"white":"#F8FAFB"}"><td class="bold">${m.name}</td><td class="r">${m.sold}×</td><td class="r">${TZS_FMT(m.rev)}</td></tr>`).join("")}</tbody></table>`,co);
              }} className="flex items-center gap-1.5 text-[12px] font-semibold text-white bg-[#B91C1C] px-3 py-1.5 rounded-lg">
                <Printer size={12}/> Daily Report
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[["Total Orders",todayOrders.length,"#B91C1C"],["Revenue",TZS_FMT(todayRevenue),"#16A34A"],["Avg Order Value",TZS_FMT(todayOrders.length>0?todayRevenue/Math.max(todayOrders.filter(o=>o.status==="Paid").length,1):0),"#2563EB"],["Tables Served",new Set(todayOrders.map(o=>o.table)).size,"#7C3AED"]].map(([l,v,col])=>(
              <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center"><p className="text-[11px] text-slate-400 uppercase tracking-wide mb-1">{l}</p><p className="text-[18px] font-bold" style={{color:col}}>{v}</p></div>
            ))}
          </div>
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <p className="text-[13.5px] font-semibold text-[#111827] mb-3">Best Selling Items</p>
            {menuItems.rows.map(m=>{
              const sold=orders.rows.flatMap(o=>o.items).filter(i=>i.id===m.id).reduce((s,i)=>s+i.qty,0);
              const rev=orders.rows.flatMap(o=>o.items).filter(i=>i.id===m.id).reduce((s,i)=>s+i.price*i.qty,0);
              if(!sold)return null;
              const maxSold=Math.max(...menuItems.rows.map(mi=>orders.rows.flatMap(o=>o.items).filter(i=>i.id===mi.id).reduce((s,i)=>s+i.qty,0)));
              return(
                <div key={m.id} className="flex items-center gap-3 mb-2.5">
                  <span className="text-[18px] shrink-0">{m.image}</span>
                  <span className="text-[12.5px] text-slate-700 w-40 shrink-0 truncate">{m.name}</span>
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{width:(sold/maxSold*100)+"%",background:RST_RED}}/></div>
                  <span className="text-[12px] font-bold text-slate-700 w-8 text-right">{sold}×</span>
                  <span className="text-[12px] font-mono font-bold w-20 text-right" style={{color:RST_RED}}>{TZS_FMT(rev)}</span>
                </div>
              );
            }).filter(Boolean)}
          </div>

          {/* Revenue Chart — Category Breakdown */}
          {(() => {
            const catRev = menuItems.rows.reduce((m,item)=>{
              const earned = orders.rows.flatMap(o=>o.items).filter(i=>i.id===item.id).reduce((s,i)=>s+i.price*i.qty,0);
              if (!earned) return m;
              m[item.category] = (m[item.category]||0) + earned;
              return m;
            },{});
            const catData = Object.entries(catRev).sort((a,b)=>b[1]-a[1]).map(([name,value],i)=>({
              name, value:Math.round(value/1000),
              fill:["#B91C1C","#C2410C","#16A34A","#2563EB","#7C3AED"][i%5],
            }));
            if (!catData.length) return null;
            return (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                  <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Revenue by Category (TZS k)</h3>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={catData} margin={{left:0,right:10,top:0,bottom:0}}>
                      <CartesianGrid vertical={false} stroke="#EEF1F4"/>
                      <XAxis dataKey="name" tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:10}} axisLine={false} tickLine={false}/>
                      <Tooltip formatter={(v)=>[`TZS ${money(v)}k`,"Revenue"]}/>
                      <Bar dataKey="value" radius={[4,4,0,0]} maxBarSize={40}>
                        {catData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                  <h3 className="text-[13.5px] font-semibold text-[#111827] mb-3">Category Mix</h3>
                  <div className="flex items-center gap-4">
                    <ResponsiveContainer width="60%" height={160}>
                      <RPieChart>
                        <Pie data={catData} dataKey="value" cx="50%" cy="50%" outerRadius={65} innerRadius={35}>
                          {catData.map((d,i)=><Cell key={i} fill={d.fill}/>)}
                        </Pie>
                        <Tooltip formatter={(v)=>[`TZS ${money(v)}k`,"Revenue"]}/>
                      </RPieChart>
                    </ResponsiveContainer>
                    <div className="flex-1 space-y-2">
                      {catData.map(d=>(
                        <div key={d.name} className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5 text-[12px]">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:d.fill}}/>
                            {d.name}
                          </span>
                          <span className="text-[12px] font-bold text-slate-700">TZS {money(d.value)}k</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* Print bill button */}
          {activeTable && (() => {
            const tblOrder = orders.rows.find(o=>o.tableId===activeTable&&o.status!=="Paid"&&o.status!=="Cancelled");
            if (!tblOrder) return null;
            return (
              <div className="bg-[#FEF2F2] border border-[#FECACA] rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-bold text-[#B91C1C]">Active order on Table {tables.rows.find(t=>t.id===activeTable)?.number}</p>
                  <p className="text-[11.5px] text-[#991B1B]">TZS {TZS_FMT(tblOrder.total)} · {tblOrder.items?.length} items</p>
                </div>
                <button
                  onClick={()=>{
                    const co=window.__smartManagerCompany||{};
                    const tbl=tables.rows.find(t=>t.id===activeTable);
                    const win=window.open("","_blank","width=420,height=640");
                    if (!win) return;
                    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Bill</title><style>
                      *{margin:0;padding:0;box-sizing:border-box}body{font-family:monospace;font-size:13px;padding:16px;max-width:300px;margin:0 auto}
                      h2{font-size:16px;font-weight:bold;text-align:center;margin-bottom:4px}.center{text-align:center}.divider{border-top:1px dashed #999;margin:8px 0}
                      .row{display:flex;justify-content:space-between;margin:3px 0}.total{font-weight:bold;font-size:15px}.btn{display:block;width:100%;padding:10px;background:#B91C1C;color:white;border:none;font-family:monospace;font-size:13px;cursor:pointer;margin-top:12px;border-radius:8px}
                      @media print{.btn{display:none!important}}
                    </style></head><body>
                      <h2>${co.name||"Restaurant"}</h2>
                      <div class="center" style="font-size:11px;color:#666">${co.address||""} · ${co.phone||""}</div>
                      <div class="divider"></div>
                      <div class="row"><span>Table:</span><span>${tbl?.number||""}</span></div>
                      <div class="row"><span>Waiter:</span><span>${tblOrder.waiter||""}</span></div>
                      <div class="row"><span>Date:</span><span>${new Date().toLocaleDateString()}</span></div>
                      <div class="divider"></div>
                      ${(tblOrder.items||[]).map(it=>`<div class="row"><span>${it.name} ×${it.qty}</span><span>${TZS_FMT??"TZS "+(it.price*it.qty/1000).toFixed(0)+"k"}</span></div>`).join("")}
                      <div class="divider"></div>
                      <div class="row"><span>Subtotal</span><span>TZS ${((tblOrder.total||0)/1000/1.1).toFixed(0)}k</span></div>
                      <div class="row"><span>Tax (10%)</span><span>TZS ${((tblOrder.total||0)/1000*0.1/1.1).toFixed(0)}k</span></div>
                      <div class="divider"></div>
                      <div class="row total"><span>TOTAL</span><span>TZS ${((tblOrder.total||0)/1000).toFixed(0)}k</span></div>
                      <div class="divider"></div>
                      <div class="center" style="font-size:11px;margin-top:8px">Thank you for dining with us!</div>
                      <button class="btn" onclick="window.print()">Print Bill</button>
                    </body></html>`);
                    win.document.close();
                  }}
                  className="flex items-center gap-1.5 text-[12.5px] font-bold text-white px-4 py-2 rounded-xl" style={{background:"#B91C1C"}}>
                  <Printer size={13}/> Print Bill
                </button>
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
}

function EmployeePortal({ currentUser, company, employees, leaveRequests, canManage, setInviteInput = () => {}, setInviteError = () => {} }) {
  if (IS_CONFIGURED && !DEMO_OVERRIDE) {
    return <EmployeePortalWorkspace
      currentUser={currentUser}
      configured={IS_CONFIGURED}
      rpc={(procedure, payload) => callRpc(procedure, payload, getStoredAccessToken() || "")}
    />;
  }

  const co = company || {};
  const TODAY_STR = TODAY.toISOString().slice(0,10);

  // ── Identity ──────────────────────────────────────────────────────────
  // Employee access is established by the authenticated workspace profile. The
  // secure invitation flow is handled by teamInvitations; no browser-only code
  // or local employee identity is accepted here.
  const [portalView, setPortalView] = useState("identify"); // identify | portal
  const [activeTab, setActiveTab] = useState("dashboard");

  // Find self in employees list
  const self = useMemo(()=>
    employees.find(e=>e.name.toLowerCase()===currentUser.name.toLowerCase()) ||
    employees.find(e=>e.name.toLowerCase().includes(currentUser.name.split(" ")[0].toLowerCase()))
  , [employees, currentUser.name]);

  // Auto-identify if we're an employee
  useEffect(()=>{
    if (self || canManage) setPortalView("portal");
  }, [self, canManage]);

  // ── Attendance / Clock In/Out ─────────────────────────────────────────
  const attendance = useCompanyTable("hr_attendance", attendanceSeed, {
    order:{ col:"attendance_date", ascending:false }, mapRow:mapAttendanceRow,
  });
  const myAttendance = useMemo(()=>
    attendance.rows.filter(a=>(self?.name||currentUser.name).toLowerCase().includes(a.employee?.toLowerCase()||"")||
      a.employee?.toLowerCase().includes((self?.name||currentUser.name).split(" ")[0].toLowerCase()))
  , [attendance.rows, self, currentUser.name]);

  const todayAtt = myAttendance.find(a=>a.date===TODAY_STR);
  const [clockedIn, setClockedIn] = useState(()=>todayAtt?.clockIn&&!todayAtt?.clockOut);

  const [clockInLocation,  setClockInLocation]  = useState(null);
  const [bioEnrolled,      setBioEnrolled]      = useState(false);
  const [bioAvailable,     setBioAvailable]     = useState(null);  // null=checking, true/false
  const [bioVerifying,     setBioVerifying]     = useState(false);
  const [bioSetupOpen,     setBioSetupOpen]     = useState(false);

  const BIO_KEY = `bs_ep_bio_${(self?.id||currentUser.name).replace(/\s+/g,"_")}`;

  // Check biometric availability + enrollment status
  useEffect(() => {
    if (!window.PublicKeyCredential) { setBioAvailable(false); return; }
    window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
      .then(available => {
        setBioAvailable(available);
        if (available) setBioEnrolled(!!localStorage.getItem(BIO_KEY));
      })
      .catch(() => setBioAvailable(false));
  }, [BIO_KEY]);

  // Enroll biometrics for this employee on this device
  async function enrollBiometric() {
    setBioVerifying(true);
    try {
      const name = self?.name || currentUser.name;
      const userId = self?.id || currentUser.name;
      const cred = await navigator.credentials.create({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          rp: { name: "BusinessSphere Employee Portal" },
          user: { id: new TextEncoder().encode(userId), name, displayName: name },
          pubKeyCredParams: [{ type:"public-key", alg:-7 }, { type:"public-key", alg:-257 }],
          authenticatorSelection: { authenticatorAttachment:"platform", userVerification:"required" },
          timeout: 60000,
        },
      });
      const b64 = bufToB64(cred.rawId);
      localStorage.setItem(BIO_KEY, b64);
      setBioEnrolled(true);
      setBioSetupOpen(false);
      notify(`🔒 Biometric registered for ${name} on this device — clock-ins are now biometrically verified`);
      logAudit("Biometric enrollment","Employee Portal",name,"Device biometric registered");
    } catch(_e) {
      notify("Biometric enrollment cancelled or not supported on this device.","error");
    } finally { setBioVerifying(false); }
  }

  // Verify biometric before clock-in/out/duty actions
  async function verifyBiometric() {
    const stored = localStorage.getItem(BIO_KEY);
    if (!stored) return { method:"none", verified:false };
    try {
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: crypto.getRandomValues(new Uint8Array(32)),
          allowCredentials: [{ type:"public-key", id:b64ToBuf(stored) }],
          userVerification: "required",
          timeout: 60000,
        },
      });
      return assertion ? { method:"biometric", verified:true } : { method:"none", verified:false };
    } catch(_e) { return null; } // null = cancelled
  }

  async function clockIn() {
    setBioVerifying(true);
    const now    = new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
    const isLate = (() => { const [h,m]=now.split(":").map(Number); return h>9||(h===9&&m>15); })();
    const status = isLate ? "Late" : "Present";

    // Biometric gate — require if enrolled, offer fallback if not
    let sigResult = { method:"none", verified:false };
    if (bioEnrolled && bioAvailable) {
      const result = await verifyBiometric();
      if (result === null) { // user cancelled
        setBioVerifying(false);
        notify("Biometric verification cancelled — clock-in not recorded.","error");
        return;
      }
      sigResult = result;
    } else if (bioAvailable && !bioEnrolled) {
      // Prompt to enroll
      setBioVerifying(false);
      setBioSetupOpen(true);
      notify("Please register your biometric first — tap 'Set Up Biometrics' below","error");
      return;
    }

    // GPS location
    let location = null;
    try {
      if (navigator.geolocation) {
        location = await new Promise(res=>navigator.geolocation.getCurrentPosition(
          pos=>res({lat:pos.coords.latitude.toFixed(4),lng:pos.coords.longitude.toFixed(4),acc:Math.round(pos.coords.accuracy)}),
          ()=>res(null), {timeout:3000}
        ));
      }
    } catch(_e){ location=null; }
    setClockInLocation(location);

    const draft = {
      id:docId("ATT"), employee:self?.name||currentUser.name,
      date:TODAY_STR, status, clockIn:now, clockOut:null,
      verified:  sigResult.verified,
      sigMethod: sigResult.method,
      location:  location ? `${location.lat},${location.lng}` : null,
      deviceId:  navigator.userAgent.slice(0,40),
    };
    attendance.setRows(p=>[draft,...p.filter(a=>!(a.date===TODAY_STR&&a.employee===draft.employee))]);
    setClockedIn(true);

    const sigBadge = sigResult.verified ? "🔒 Biometrically verified" : "📝 Manual entry";
    notify(`✓ Clocked in at ${now}${isLate?" (Late)":""} · ${sigBadge}${location?" · 📍 "+location.lat+","+location.lng:""}`);
    logAudit("Clock In","Employee Portal",currentUser.name,`${draft.employee} at ${now} (${status}) · ${sigResult.method}`);

    if (IS_CONFIGURED) {
      try {
        await sb("hr_attendance").insert({
          employee:draft.employee, attendance_date:TODAY_STR,
          status, clock_in:now,
          verified:sigResult.verified, sig_method:sigResult.method,
          location: location ? `${location.lat},${location.lng}` : null,
        }).run();
      } catch(_e){}
    }
    setBioVerifying(false);
  }

  async function clockOut() {
    setBioVerifying(true);
    const now = new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});

    // Biometric gate on clock-out too
    let sigResult = { method:"none", verified:false };
    if (bioEnrolled && bioAvailable) {
      const result = await verifyBiometric();
      if (result === null) {
        setBioVerifying(false);
        notify("Biometric verification cancelled — clock-out not recorded.","error");
        return;
      }
      sigResult = result;
    }

    attendance.setRows(p=>p.map(a=>
      a.date===TODAY_STR&&a.employee===(self?.name||currentUser.name)
        ? {...a, clockOut:now, sigMethod:sigResult.method, verified:sigResult.verified} : a
    ));
    setClockedIn(false);
    const sigBadge = sigResult.verified ? "🔒 Biometrically signed" : "📝 Manual";
    notify(`✓ Clocked out at ${now} · ${sigBadge}`);
    logAudit("Clock Out","Employee Portal",currentUser.name,`clocked out at ${now} · ${sigResult.method}`);
    if (IS_CONFIGURED) {
      try {
        await sb("hr_attendance").eq("attendance_date",TODAY_STR)
          .eq("employee",self?.name||currentUser.name)
          .update({clock_out:now, sig_method:sigResult.method, verified:sigResult.verified}).run();
      } catch(_e){}
    }
    setBioVerifying(false);
  }

  // ── Duties ────────────────────────────────────────────────────────────
  const duties = useCompanyTable("hr_duties", dutiesSeed, {
    order:{ col:"date", ascending:true }, mapRow:mapDutyRow,
  });
  const myDuties = useMemo(()=>
    duties.rows.filter(d=>
      d.assignee===(self?.name||currentUser.name)||d.assignee==="ALL"
    ).filter(d=>d.date>=TODAY_STR||["In Progress","Completed"].includes(d.status))
  , [duties.rows, self, currentUser.name, TODAY_STR]);

  const todayDuties  = myDuties.filter(d=>d.date===TODAY_STR);
  const upcoming     = myDuties.filter(d=>d.date>TODAY_STR).slice(0,5);
  const doneDuties   = myDuties.filter(d=>["Completed","Approved"].includes(d.status));

  async function startDuty(duty) {
    // Biometric gate on duty start
    if (bioEnrolled && bioAvailable) {
      setBioVerifying(true);
      const result = await verifyBiometric();
      setBioVerifying(false);
      if (result === null) { notify("Biometric cancelled — duty not started.","error"); return; }
    }
    const now = new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
    duties.setRows(p=>p.map(d=>d.id===duty.id?{...d,status:"In Progress",startedAt:now}:d));
    notify(`▶ "${duty.title}" started at ${now}${bioEnrolled?" · 🔒 Biometrically confirmed":""}`);
    logAudit("Duty started","Employee Portal",currentUser.name,`${duty.title} at ${now}`);
    if (IS_CONFIGURED&&duty.dbId) {
      try { await sb("hr_duties").eq("id",duty.dbId).update({status:"In Progress",started_at:now}).run(); } catch(_e){}
    }
  }

  async function completeDuty(duty) {
    // Require biometric to confirm duty completion — this is the record HR will see
    let sigResult = { method:"none", verified:false };
    if (bioEnrolled && bioAvailable) {
      setBioVerifying(true);
      const result = await verifyBiometric();
      setBioVerifying(false);
      if (result === null) { notify("Biometric cancelled — duty not marked complete.","error"); return; }
      sigResult = result;
    }
    const now = new Date().toISOString().slice(0,16).replace("T"," ");
    duties.setRows(p=>p.map(d=>d.id===duty.id?{
      ...d, status:"Completed", completedAt:now,
      completionVerified:sigResult.verified, completionMethod:sigResult.method,
    }:d));
    const badge = sigResult.verified ? "🔒 Biometrically signed" : "📝 Manual";
    notify(`✓ "${duty.title}" marked complete · ${badge} — awaiting manager approval`);
    logAudit("Duty completed","Employee Portal",currentUser.name,`${duty.title} · ${sigResult.method}`);
    if (IS_CONFIGURED&&duty.dbId) {
      try {
        await sb("hr_duties").eq("id",duty.dbId).update({
          status:"Completed", completed_at:now,
          completion_verified:sigResult.verified, completion_method:sigResult.method,
        }).run();
      } catch(_e){}
    }
  }

  // ── Leave Requests ────────────────────────────────────────────────────
  const [leaveForm, setLeaveForm] = useState({ type:"Annual Leave", startDate:TODAY_STR, endDate:"", reason:"" });
  const { rows: leaveRows, setRows: setLeaveRows } = leaveRequests;
  const myLeave = leaveRows.filter(l=>
    (l.employeeName||l.employee||"").toLowerCase().includes((self?.name||currentUser.name).split(" ")[0].toLowerCase())
  );

  async function submitLeave() {
    if (!leaveForm.startDate||!leaveForm.endDate) { notify("Please fill in dates","error"); return; }
    const draft = {
      id:docId("LV"), employeeName:self?.name||currentUser.name,
      employeeId:self?.id||"", type:leaveForm.type,
      startDate:leaveForm.startDate, endDate:leaveForm.endDate,
      reason:leaveForm.reason, status:"Pending",
    };
    setLeaveRows(p=>[draft,...p]);
    setLeaveForm({type:"Annual Leave",startDate:TODAY_STR,endDate:"",reason:""});
    notify("Leave request submitted — awaiting manager approval");
    logAudit("Leave request submitted","Employee Portal",currentUser.name,`${leaveForm.type} ${leaveForm.startDate}–${leaveForm.endDate}`);
  }

  // ── Payslip ───────────────────────────────────────────────────────────
  function printMyPayslip() {
    if (!self) { notify("Payslip requires your employee profile in the system","error"); return; }
    const co2 = window.__smartManagerCompany||company||{};
    const gross = self.salary||0;
    const PAYE  = (s)=>s<=270?0:s<=520?(s-270)*0.08:s<=760?20+(s-520)*0.20:s<=1000?68+(s-760)*0.25:128+(s-1000)*0.30;
    const paye  = Math.round(PAYE(gross)*100)/100;
    const sdl   = Math.round(gross*0.035*100)/100;
    const nhif  = Math.round(Math.min(gross*0.015,10)*100)/100;
    const net   = gross-paye-sdl-nhif;
    const fmt   = n=>new Intl.NumberFormat("en-US").format(Math.round(n));
    const ACCENT="#16A34A"; const DARK="#0D2214";
    const period= TODAY_STR.slice(0,7);
    const win=window.open("","_blank","width=900,height=1000");
    if (!win) { notify("Pop-up blocked","error"); return; }
    win.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8"/><title>Payslip ${period}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800;900&display=swap" rel="stylesheet"/>
      <style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:Inter,Arial,sans-serif;background:#F3F4F6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      @media print{body{background:white}.toolbar{display:none!important}}
      .page{max-width:680px;margin:24px auto;background:white;border-radius:14px;overflow:hidden;box-shadow:0 4px 32px rgba(0,0,0,.1)}
      .hdr{background:${DARK};padding:26px 32px;display:flex;justify-content:space-between;align-items:flex-start}
      .two-col{display:grid;grid-template-columns:1fr 1fr;gap:1px;background:#E5E7EB}
      .section{background:white;padding:18px 22px}
      .sec-title{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.12em;margin-bottom:8px}
      table.lines{width:100%;border-collapse:collapse}
      table.lines td{padding:6px 0;font-size:12.5px}
      .amt{text-align:right;font-family:monospace;font-weight:600}
      .green{color:#16A34A}.red{color:#EF4444}
      .total-row td{border-top:2px solid #E5E7EB;padding-top:8px;font-weight:700;font-size:13px}
      .net-banner{background:${DARK};padding:20px 32px;display:flex;justify-content:space-between;align-items:center}
      .ftr{background:#F8FAFB;border-top:1px solid #E5E7EB;padding:12px 32px;display:flex;justify-content:space-between;font-size:10.5px;color:#9CA3AF}
      .btn{padding:10px 20px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;border:none;font-family:Inter}
      .toolbar{position:fixed;bottom:24px;right:24px;display:flex;gap:8px}</style></head><body>
      <div class="page">
        <div class="hdr">
          <div><div style="font-size:18px;font-weight:800;color:white">${co2.name||"BusinessSphere"}</div><div style="font-size:10.5px;color:rgba(255,255,255,.5);margin-top:3px">${[co2.address,co2.city,"Tanzania"].filter(Boolean).join(" · ")}</div></div>
          <div style="text-align:right"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:rgba(255,255,255,.5)">Payslip</div><div style="font-size:20px;font-weight:900;color:${ACCENT};margin-top:2px">${period}</div></div>
        </div>
        <div style="background:#F8FAFB;border-bottom:1px solid #E5E7EB;padding:16px 32px;display:flex;justify-content:space-between;align-items:center">
          <div><div style="font-size:18px;font-weight:800;color:#111827">${self.name}</div><div style="font-size:12px;color:#6B7280;margin-top:2px">${self.role} · ${self.department}${self.id?" · "+self.id:""}</div></div>
          <div style="text-align:right"><div style="font-size:10px;color:#9CA3AF">Employee Since</div><div style="font-size:12.5px;font-weight:600;color:#374151">${self.hireDate||"—"}</div></div>
        </div>
        <div class="two-col">
          <div class="section"><div class="sec-title" style="color:${ACCENT}">EARNINGS</div>
            <table class="lines"><tr><td>Basic Salary</td><td class="amt green">TZS ${fmt(gross)}k</td></tr>
            <tr class="total-row"><td>GROSS PAY</td><td class="amt green" style="font-size:14px">TZS ${fmt(gross)}k</td></tr></table>
          </div>
          <div class="section"><div class="sec-title" style="color:#EF4444">DEDUCTIONS</div>
            <table class="lines"><tr><td>PAYE (TRA)</td><td class="amt red">− TZS ${fmt(paye)}k</td></tr>
            <tr><td>SDL (3.5%)</td><td class="amt red">− TZS ${fmt(sdl)}k</td></tr>
            <tr><td>NHIF (1.5%)</td><td class="amt red">− TZS ${fmt(nhif)}k</td></tr>
            <tr class="total-row"><td>TOTAL DEDUCTIONS</td><td class="amt red">− TZS ${fmt(paye+sdl+nhif)}k</td></tr></table>
          </div>
        </div>
        <div class="net-banner"><div style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.5)">NET PAY</div>
          <div style="font-size:28px;font-weight:900;color:white">TZS ${fmt(net)}k</div>
        </div>
        <div class="ftr"><span>Confidential · Employee copy</span><span>BusinessSphere ERP · ${new Date().toLocaleDateString()}</span></div>
      </div>
      <div class="toolbar"><button class="btn" style="background:white;border:1.5px solid #E5E7EB" onclick="window.close()">Close</button><button class="btn" style="background:#16A34A;color:white" onclick="window.print()">Print / PDF</button></div>
    </body></html>`);
    win.document.close();
    setTimeout(()=>win.focus(),200);
    notify("Payslip PDF ready");
  }

  // Weekly attendance stats
  const weekStart = new Date(TODAY); weekStart.setDate(weekStart.getDate()-weekStart.getDay()+1);
  const weekDays  = Array.from({length:7},(_,i)=>{
    const d=new Date(weekStart); d.setDate(d.getDate()+i);
    return d.toISOString().slice(0,10);
  });
  const weekAtt = weekDays.map(date=>{
    const att = myAttendance.find(a=>a.date===date);
    return { date, status:att?.status||"—", clockIn:att?.clockIn||"", clockOut:att?.clockOut||"" };
  });

  const STATUS_COLOR = {"Present":"#16A34A","Late":"#F59E0B","Absent":"#EF4444","On Leave":"#2563EB","—":"#E5E7EB"};
  const DUTY_STATUS_COLOR = {"Pending":"#94A3B8","In Progress":"#F59E0B","Completed":"#2563EB","Approved":"#16A34A","Rejected":"#EF4444"};

  // ── Notification badges ─────────────────────────────────────────────
  const pendingDutiesCount  = todayDuties.filter(d=>d.status==="Completed").length; // awaiting approval
  const pendingLeaveCount   = myLeave.filter(l=>l.status==="Pending").length;
  const PORTAL_TABS = [
    {id:"dashboard",    label:"Dashboard",       icon:LayoutDashboard,  badge:0},
    {id:"attendance",   label:"Attendance",       icon:CalendarCheck,    badge:0},
    {id:"duties",       label:"Duties",           icon:ClipboardList,    badge:pendingDutiesCount},
    {id:"leave",        label:"Leave",            icon:Clock,            badge:pendingLeaveCount},
    {id:"expenses",     label:"Expenses",         icon:Receipt,          badge:0},
    {id:"training",     label:"Training",         icon:GraduationCap,    badge:0},
    {id:"team",         label:"Team",             icon:Users,            badge:0},
    {id:"noticeboard",  label:"Noticeboard",      icon:Bell,             badge:0},
    {id:"payslip",      label:"Payslip",          icon:Banknote,         badge:0},
    {id:"profile",      label:"Profile",          icon:UserCircle,       badge:0},
  ];

  // ── Render: authenticated employee access notice ───────────────────────
  if (portalView === "identify") return (
    <div className="min-h-[600px] flex items-center justify-center">
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xl p-8 w-full max-w-md">
        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-[#0D2214] flex items-center justify-center mx-auto mb-4">
            <LogIn size={28} className="text-[#16A34A}"/>
          </div>
          <h2 className="text-[22px] font-black text-[#111827]">Employee Portal</h2>
          <p className="text-[13px] text-slate-500 mt-1">{co.name||"BusinessSphere"}</p>
        </div>
        <div className="space-y-3 text-center">
          <p className="text-[13px] leading-6 text-slate-600">Employee access is provisioned from a verified workspace profile after accepting a secure invitation email.</p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-left text-[11.5px] leading-5 text-amber-800">Browser-only invite codes are not accepted because they cannot safely persist membership or authenticate the employee.</div>
          {canManage ? (
            <button type="button" onClick={()=>setPortalView("portal")} className="w-full text-[12px] font-semibold text-white py-3 rounded-xl bg-[#16A34A] hover:bg-[#15803D]">Open manager portal</button>
          ) : (
            <p className="text-[12px] text-slate-500">Ask your HR manager to send a secure invitation, then sign in with the invited email address.</p>
          )}
        </div>
        <div className="mt-5 p-3 bg-slate-50 rounded-xl text-center">
          <p className="text-[11.5px] text-slate-500">Managers can send invitations from</p>
          <p className="text-[11.5px] font-bold text-[#16A34A]">HR → Employees → Secure team invitation</p>
        </div>
      </div>
    </div>
  );

  // ── Render: Employee Portal ───────────────────────────────────────────
  const empName = self?.name||currentUser.name;
  const greeting = new Date().getHours()<12?"Good morning":new Date().getHours()<17?"Good afternoon":"Good evening";

  return (
    <div className="space-y-5">
      {/* Portal header */}
      <div className="rounded-2xl overflow-hidden relative" style={{background:"linear-gradient(135deg,#0D2214 0%,#1a3a2a 60%,#16A34A 120%)"}}>
        <div className="absolute inset-0 opacity-5" style={{backgroundImage:"repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",backgroundSize:"20px 20px"}}/>
        <div className="relative px-6 py-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[rgba(255,255,255,.6)] text-[12px] mb-0.5">Employee Portal · {co.name||"BusinessSphere"}</p>
            <h1 className="text-white text-[22px] font-black">{greeting}, {empName.split(" ")[0]} 👋</h1>
            {self&&<p className="text-[rgba(255,255,255,.6)] text-[12px] mt-1">{self.role} · {self.department}</p>}
          </div>
          <div className="flex items-center gap-3">
            {/* BIG Clock In / Out Button — biometric-gated */}
            {bioVerifying?(
              <div className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-[rgba(255,255,255,.1)]">
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>
                <span className="text-white font-bold text-[13px]">Verifying…</span>
              </div>
            ):!clockedIn&&!todayAtt?.clockIn?(
              <div className="flex flex-col items-center gap-1.5">
                <button onClick={clockIn}
                  className="flex items-center gap-2 text-[13.5px] font-black text-[#0D2214] bg-[#16A34A] px-5 py-3 rounded-2xl shadow-lg hover:bg-[#15803D] transition-all">
                  {bioEnrolled ? <Fingerprint size={18}/> : <LogIn size={18}/>}
                  {bioEnrolled ? "🔒 Biometric Clock In" : "Clock In"}
                </button>
                {bioAvailable&&!bioEnrolled&&(
                  <button onClick={()=>setBioSetupOpen(true)}
                    className="text-[11px] text-[#16A34A] font-bold bg-[rgba(22,163,74,0.15)] px-3 py-1 rounded-full hover:bg-[rgba(22,163,74,0.25)]">
                    Set Up Biometrics →
                  </button>
                )}
                {bioAvailable===false&&(
                  <p className="text-[10.5px] text-[rgba(255,255,255,.4)]">📝 Manual sign-in (no sensor found)</p>
                )}
              </div>
            ):clockedIn?(
              <button onClick={clockOut}
                className="flex items-center gap-2 text-[13.5px] font-black text-white bg-[#EF4444] px-5 py-3 rounded-2xl shadow-lg hover:bg-[#DC2626] transition-all">
                {bioEnrolled ? <Fingerprint size={18}/> : <LogOut size={18}/>}
                {bioEnrolled ? "🔒 Biometric Clock Out" : "Clock Out"}
              </button>
            ):(
              <div className="text-center">
                <p className="text-[#16A34A] font-bold text-[12px] flex items-center gap-1">
                  {todayAtt?.verified?"🔒":"📝"} ✓ Done for today
                </p>
                <p className="text-[rgba(255,255,255,.5)] text-[11px]">{todayAtt?.clockIn} → {todayAtt?.clockOut}</p>
                <p className="text-[10px] text-[rgba(255,255,255,.35)]">
                  {todayAtt?.verified?"Biometrically verified":"Manual entry"}
                </p>
              </div>
            )}
            {todayAtt?.clockIn&&!todayAtt?.clockOut&&(
              <div className="text-right">
                <p className="text-[rgba(255,255,255,.6)] text-[11px]">Clocked in at</p>
                <p className="text-white font-black text-[18px]">{todayAtt.clockIn}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 bg-white rounded-xl p-1 border border-slate-200 overflow-x-auto">
        {PORTAL_TABS.map(t=>{
          const I=t.icon; const isActive=activeTab===t.id;
          return (
            <button key={t.id} onClick={()=>setActiveTab(t.id)}
              className={`relative flex items-center gap-1.5 justify-center px-3 py-2 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all ${isActive?"bg-[#0D2214] text-white":"text-slate-500 hover:text-[#111827]"}`}>
              <I size={13}/>{t.label}
              {t.badge>0&&(
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 flex items-center justify-center text-[9px] font-black text-white bg-[#EF4444] rounded-full">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── DASHBOARD ── */}
      {activeTab==="dashboard"&&(
        <div className="space-y-4">
          {/* KPI tiles */}
          {(() => {
            const weekPresent = weekAtt.filter(w=>w.status==="Present"||w.status==="Late").length;
            const weekDone    = weekDays.filter(d=>d<=TODAY_STR&&d>=weekDays[0]).length;
            const attRate     = weekDone > 0 ? Math.round(weekPresent/weekDone*100) : 0;
            const approvedLeave = myLeave.filter(l=>l.status==="Approved"&&l.endDate>=TODAY_STR);
            const totalAnnual   = 21; // TZS standard
            const usedLeave     = leaveRows.filter(l=>
              (l.employeeName||l.employee||"").toLowerCase().includes(empName.split(" ")[0].toLowerCase())&&
              l.status==="Approved"&&l.startDate?.startsWith(String(TODAY.getFullYear()))
            ).reduce((s,l)=>s+Math.max(0,Math.ceil((new Date(l.endDate)-new Date(l.startDate))/86400000)+1),0);
            const hoursToday = todayAtt?.clockIn&&todayAtt?.clockOut ? (()=>{
              const [ih,im]=(todayAtt.clockIn||"00:00").split(":").map(Number);
              const [oh,om]=(todayAtt.clockOut||"00:00").split(":").map(Number);
              return Math.max(0,((oh*60+om)-(ih*60+im))/60).toFixed(1);
            })() : todayAtt?.clockIn ? "Active" : "0";
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  ["Today Status",  todayAtt?.status||"Not In",  todayAtt?.status==="Present"?"#16A34A":todayAtt?.status==="Late"?"#F59E0B":"#94A3B8"],
                  ["Hours Today",     hoursToday+"h",               "#2563EB"],
                  ["Week Attendance", attRate+"%",                  attRate>=80?"#16A34A":attRate>=60?"#F59E0B":"#EF4444"],
                  ["Leave Balance",   (totalAnnual-usedLeave)+" days","#7C3AED"],
                ].map(([l,v,col])=>(
                  <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">{l}</p>
                    <p className="text-[20px] font-black" style={{color:col}}>{v}</p>
                  </div>
                ))}
              </div>
            );
          })()}

          {/* Quick Stats Row */}
          {myDuties.filter(d=>d.status==="Completed"&&!d.approvedBy).length>0&&(
            <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl p-3.5 flex items-center gap-2.5">
              <Bell size={15} className="text-[#2563EB] shrink-0"/>
              <div>
                <p className="text-[13px] font-bold text-[#1D4ED8]">
                  {myDuties.filter(d=>d.status==="Completed"&&!d.approvedBy).length} dut{myDuties.filter(d=>d.status==="Completed"&&!d.approvedBy).length===1?"y":"ies"} awaiting manager approval
                </p>
                <p className="text-[11.5px] text-[#2563EB]">Your manager will approve completed duties in HR → Timetable</p>
              </div>
            </div>
          )}

          {/* Today duties quick view */}
          {todayDuties.length>0&&(
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
              <h3 className="text-[14px] font-bold text-[#111827] mb-3">Today Duties</h3>
              <div className="space-y-2">
                {todayDuties.map(duty=>{
                  const col=DUTY_STATUS_COLOR[duty.status]||"#94A3B8";
                  const canStart=duty.status==="Pending";
                  const canComplete=duty.status==="In Progress";
                  return(
                    <div key={duty.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 border border-slate-100">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{background:col}}/>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#111827] truncate">{duty.title}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{duty.startTime}–{duty.endTime} · {duty.type}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{background:col+"20",color:col}}>{duty.status}</span>
                        {canStart&&<button onClick={()=>startDuty(duty)} className="text-[11px] font-bold text-white bg-[#F59E0B] px-2.5 py-1.5 rounded-lg disabled:opacity-50">
                              {bioVerifying?"⏳…":bioEnrolled?"🔒 Start":"▶ Start"}
                            </button>
                          }
                        {canComplete&&<button onClick={()=>completeDuty(duty)} disabled={bioVerifying}
                            className="text-[11px] font-bold text-white bg-[#2563EB] px-2.5 py-1.5 rounded-lg disabled:opacity-50">
                          {bioVerifying?"⏳…":bioEnrolled?"🔒 Done":"✓ Done"}
                        </button>}
                        {duty.status==="Approved"&&<span className="text-[#16A34A] font-bold text-[13px]">✓</span>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly attendance summary */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[14px] font-bold text-[#111827]">This Week Attendance</h3>
              <span className="text-[11px] font-bold text-[#16A34A]">
                {weekAtt.filter(w=>w.status==="Present"||w.status==="Late").length}/{weekAtt.filter((_,i)=>weekDays[i]<=TODAY_STR).length} days present
              </span>
            </div>
            <div className="flex gap-2 justify-between">
              {weekAtt.map((wa,i)=>{
                const isToday=wa.date===TODAY_STR;
                const dow=["Mon","Tue","Wed","Thu","Fri","Sat","Sun"][i];
                const col=STATUS_COLOR[wa.status]||"#E5E7EB";
                return(
                  <div key={wa.date} className={`flex-1 flex flex-col items-center gap-1 px-1 py-2 rounded-xl ${isToday?"bg-[#F0FDF4] border border-[#16A34A]/20":""}`}>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{background:col+"20",border:`2px solid ${col}`}}>
                      <span className="text-[9px] font-black" style={{color:col}}>{wa.clockIn?wa.clockIn:"—"}</span>
                    </div>
                    <span className={`text-[10.5px] font-bold ${isToday?"text-[#16A34A]":"text-slate-500"}`}>{dow}</span>
                    <span className="text-[9.5px] text-slate-400">{wa.status==="—"?"":wa.status}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── ATTENDANCE ── */}
      {activeTab==="attendance"&&(
        <div className="space-y-4">
          {/* Big clock in/out card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 text-center">
            <p className="text-[13px] text-slate-500 mb-2">{new Date().toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</p>
            <p className="text-[48px] font-black text-[#111827] font-mono leading-none mb-4">
              {new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})}
            </p>
            {/* Biometric status indicator */}
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[12px] font-bold mb-3 ${
              bioEnrolled?"bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]":
              bioAvailable===false?"bg-slate-100 text-slate-400 border border-slate-200":
              "bg-[#FFFBEB] text-[#D97706] border border-[#FDE68A]"
            }`}>
              <Fingerprint size={13}/>
              {bioEnrolled?"🔒 Biometric Active — clock-in will be cryptographically signed":
               bioAvailable===false?"No biometric sensor detected on this device":
               "⚠ Biometric not set up — clock-in will be manual"}
            </div>

            {!clockedIn&&!todayAtt?.clockIn?(
              <div className="space-y-2">
                <button onClick={clockIn} disabled={bioVerifying}
                  className="inline-flex items-center gap-2 text-[14px] font-black text-white px-8 py-3.5 rounded-2xl shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                  style={{background:bioEnrolled?"#16A34A":"#2563EB"}}>
                  {bioVerifying?<div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>:
                    bioEnrolled?<Fingerprint size={20}/>:<LogIn size={20}/>}
                  {bioVerifying?"Verifying…":bioEnrolled?"🔒 Biometric Clock In":"Clock In (Manual)"}
                </button>
                {bioAvailable&&!bioEnrolled&&(
                  <button onClick={()=>setBioSetupOpen(true)}
                    className="block mx-auto text-[12px] font-bold text-[#16A34A] underline">
                    Set up biometrics for secure sign-in
                  </button>
                )}
              </div>
            ):clockedIn?(
              <div className="space-y-3">
                <div className="flex items-center gap-2 justify-center">
                  <p className="text-[13px] font-semibold text-[#16A34A]">✓ Clocked in at <strong>{todayAtt?.clockIn}</strong></p>
                  {todayAtt?.verified&&<span className="text-[10.5px] font-bold text-[#16A34A] bg-[#F0FDF4] border border-[#BBF7D0] px-2 py-0.5 rounded-full flex items-center gap-1"><Fingerprint size={10}/>Verified</span>}
                </div>
                <button onClick={clockOut} disabled={bioVerifying}
                  className="inline-flex items-center gap-2 text-[14px] font-black text-white bg-[#EF4444] px-8 py-3.5 rounded-2xl shadow-lg hover:bg-[#DC2626] transition-all disabled:opacity-50">
                  {bioVerifying?<div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"/>:
                    bioEnrolled?<Fingerprint size={20}/>:<LogOut size={20}/>}
                  {bioVerifying?"Verifying…":bioEnrolled?"🔒 Biometric Clock Out":"Clock Out"}
                </button>
              </div>
            ):(
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4">
                <p className="text-[#16A34A] font-black text-[15px] flex items-center justify-center gap-2">
                  {todayAtt?.verified?<Fingerprint size={16}/>:null}
                  ✓ Attendance recorded for today
                </p>
                <p className="text-slate-500 text-[12.5px] mt-1">{todayAtt?.clockIn} → {todayAtt?.clockOut}</p>
                <p className="text-[11.5px] font-semibold mt-1" style={{color:todayAtt?.verified?"#16A34A":"#94A3B8"}}>
                  {todayAtt?.verified?"🔒 Biometrically verified — HR has tamper-proof record":"📝 Manual entry — not biometrically signed"}
                </p>
              </div>
            )}
          </div>

          {/* Monthly summary */}
          {myAttendance.length > 0 && (() => {
            const thisMonth = TODAY_STR.slice(0,7);
            const monthAtt  = myAttendance.filter(a=>a.date?.startsWith(thisMonth));
            const present   = monthAtt.filter(a=>a.status==="Present").length;
            const late      = monthAtt.filter(a=>a.status==="Late").length;
            const absent    = monthAtt.filter(a=>a.status==="Absent").length;
            const totalHrs  = monthAtt.reduce((s,a)=>{
              if (!a.clockIn||!a.clockOut) return s;
              const [ih,im]=a.clockIn.split(":").map(Number);
              const [oh,om]=a.clockOut.split(":").map(Number);
              return s+Math.max(0,((oh*60+om)-(ih*60+im))/60);
            },0);
            return (
              <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4">
                <p className="text-[13.5px] font-bold text-[#111827] mb-3">
                  This Month — {new Date(thisMonth+"-01").toLocaleDateString("en",{month:"long",year:"numeric"})}
                </p>
                <div className="grid grid-cols-4 gap-3">
                  {[
                    ["Present",  String(present), "#16A34A"],
                    ["Late",     String(late),    "#F59E0B"],
                    ["Absent",   String(absent),  "#EF4444"],
                    ["Hours",    totalHrs.toFixed(1)+"h","#2563EB"],
                  ].map(([l,v,col])=>(
                    <div key={l} className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{l}</p>
                      <p className="text-[18px] font-black" style={{color:col}}>{v}</p>
                    </div>
                  ))}
                </div>
                {/* Attendance rate bar */}
                {(present+late+absent)>0&&(
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                      <span>Attendance Rate</span>
                      <span className="font-bold" style={{color:(present+late)/(present+late+absent)>=0.9?"#16A34A":"#F59E0B"}}>
                        {Math.round((present+late)/(present+late+absent)*100)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[#16A34A]"
                        style={{width:Math.round((present+late)/(present+late+absent)*100)+"%"}}/>
                    </div>
                  </div>
                )}
                {clockInLocation&&(
                  <p className="text-[11px] text-slate-400 mt-2 flex items-center gap-1">
                    📍 Last clock-in: {clockInLocation.lat}, {clockInLocation.lng} (±{clockInLocation.acc}m)
                  </p>
                )}
              </div>
            );
          })()}

          {/* Attendance history */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[13.5px] font-bold text-[#111827]">My Attendance History ({myAttendance.length} records)</p>
            </div>
            {myAttendance.length===0?(
              <div className="py-10 text-center text-slate-400">
                <CalendarCheck size={32} className="mx-auto mb-2 text-slate-200"/>
                <p>No attendance records yet. Clock in to start tracking.</p>
              </div>
            ):(
              <table className="w-full text-[12.5px]">
                <thead><tr className="bg-slate-50 border-b border-slate-100">
                  {["Date","Day","Status","Clock In","Clock Out","Hours"].map(h=>(
                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-wide text-slate-400">{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {myAttendance.slice(0,20).map((att,i)=>{
                    const col=STATUS_COLOR[att.status]||"#94A3B8";
                    const hours = att.clockIn&&att.clockOut ? (()=>{
                      const [ih,im]=att.clockIn.split(":").map(Number);
                      const [oh,om]=att.clockOut.split(":").map(Number);
                      const diff=((oh*60+om)-(ih*60+im))/60;
                      return diff>0?diff.toFixed(1)+"h":"—";
                    })() : "—";
                    return(
                      <tr key={att.id} className={`border-b border-slate-50 last:border-0 ${att.date===TODAY_STR?"bg-[#F0FDF4]/50":""}`}>
                        <td className="px-4 py-3 font-mono text-[11.5px]">{att.date}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(att.date).toLocaleDateString("en",{weekday:"short"})}</td>
                        <td className="px-4 py-3">
                          <span className="text-[10.5px] font-bold px-2 py-0.5 rounded-full" style={{background:col+"18",color:col}}>{att.status}</span>
                        </td>
                        <td className="px-4 py-3 font-mono text-slate-600">{att.clockIn||"—"}</td>
                        <td className="px-4 py-3 font-mono text-slate-600">{att.clockOut||"—"}</td>
                        <td className="px-4 py-3 font-bold text-[#16A34A] font-mono">{hours}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── DUTIES ── */}
      {activeTab==="duties"&&(
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-3">
            {[
              ["Today",   String(todayDuties.length),           "#2563EB"],
              ["Upcoming",String(upcoming.length),              "#F59E0B"],
              ["Completed",String(doneDuties.length),           "#16A34A"],
            ].map(([l,v,col])=>(
              <div key={l} className="bg-white rounded-xl border border-slate-200/80 p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{l}</p>
                <p className="text-[22px] font-black" style={{color:col}}>{v}</p>
              </div>
            ))}
          </div>

          {todayDuties.length===0&&upcoming.length===0?(
            <div className="bg-white rounded-xl border border-slate-200/80 p-10 text-center">
              <ClipboardList size={36} className="text-slate-200 mx-auto mb-3"/>
              <p className="text-[14px] font-semibold text-slate-400">No duties assigned</p>
              <p className="text-[12.5px] text-slate-400 mt-1">Your manager will assign duties here. Check back later.</p>
            </div>
          ):(
            <div className="space-y-3">
              {[["Today",todayDuties],["Upcoming",upcoming],["Completed",doneDuties.slice(0,5)]].map(([section,dts])=>
                dts.length>0&&(
                  <div key={section} className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                    <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                      <p className="text-[12.5px] font-bold text-[#111827]">{section} ({dts.length})</p>
                    </div>
                    <div className="divide-y divide-slate-50">
                      {dts.map(duty=>{
                        const col=DUTY_STATUS_COLOR[duty.status]||"#94A3B8";
                        const canStart=duty.status==="Pending"&&duty.date===TODAY_STR;
                        const canComplete=duty.status==="In Progress";
                        return(
                          <div key={duty.id} className="px-4 py-3.5 flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[16px] shrink-0" style={{background:col+"18"}}>
                              {duty.status==="Approved"?"✅":duty.status==="Completed"?"☑️":duty.status==="In Progress"?"▶️":"📋"}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-[13px] font-bold text-[#111827] ${duty.status==="Approved"?"line-through opacity-60":""}`}>{duty.title}</p>
                              <div className="flex items-center gap-3 mt-1 flex-wrap">
                                <span className="text-[11px] font-mono text-slate-400">{duty.date} · {duty.startTime}–{duty.endTime}</span>
                                <span className="text-[10.5px] font-semibold text-slate-500">{duty.type}</span>
                                <span className="text-[10.5px] font-bold px-1.5 py-0.5 rounded-full" style={{background:col+"18",color:col}}>{duty.status}</span>
                              </div>
                              {duty.status==="Approved"&&duty.approvedBy&&(
                                <p className="text-[10.5px] text-[#16A34A] mt-0.5">✓ Approved by {duty.approvedBy.split("(")[0].trim()}</p>
                              )}
                              {duty.notes&&<p className="text-[11px] text-slate-500 mt-0.5">📝 {duty.notes}</p>}
                            </div>
                            <div className="flex gap-1.5 shrink-0 mt-0.5">
                              {canStart&&(
                                <button onClick={()=>startDuty(duty)} className="text-[11.5px] font-bold text-white bg-[#F59E0B] px-3 py-1.5 rounded-lg disabled:opacity-50">
                                  {bioVerifying?"⏳…":bioEnrolled?"🔒 Start":"▶ Start"}
                                </button>
                              )}
                              {canComplete&&(
                                <button onClick={()=>completeDuty(duty)} className="text-[11.5px] font-bold text-white bg-[#2563EB] px-3 py-1.5 rounded-lg disabled:opacity-50">
                                  {bioVerifying?"⏳…":bioEnrolled?"🔒 Mark Done":"✓ Mark Done"}
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* ── LEAVE ── */}
      {activeTab==="leave"&&(
        <div className="space-y-4">
          {/* Submit leave form */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
            <h3 className="text-[14px] font-bold text-[#111827] mb-4">Request Leave</h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11.5px] font-semibold text-slate-600 block mb-1">Leave Type</label>
                <select className={inputClass} value={leaveForm.type} onChange={e=>setLeaveForm(f=>({...f,type:e.target.value}))}>
                  {["Annual Leave","Sick Leave","Maternity Leave","Paternity Leave","Emergency Leave","Unpaid Leave","Study Leave"].map(t=><option key={t}>{t}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[11.5px] font-semibold text-slate-600 block mb-1">Start Date</label>
                <input type="date" className={inputClass} value={leaveForm.startDate} onChange={e=>setLeaveForm(f=>({...f,startDate:e.target.value}))}/>
              </div>
              <div>
                <label className="text-[11.5px] font-semibold text-slate-600 block mb-1">End Date</label>
                <input type="date" className={inputClass} value={leaveForm.endDate} onChange={e=>setLeaveForm(f=>({...f,endDate:e.target.value}))} min={leaveForm.startDate}/>
              </div>
              <div className="col-span-2 sm:col-span-1">
                <label className="text-[11.5px] font-semibold text-slate-600 block mb-1">Reason</label>
                <input className={inputClass} value={leaveForm.reason} onChange={e=>setLeaveForm(f=>({...f,reason:e.target.value}))} placeholder="Brief reason (optional)"/>
              </div>
            </div>
            <button onClick={submitLeave} className="mt-4 flex items-center gap-2 text-[13px] font-bold text-white px-5 py-2.5 rounded-xl bg-[#16A34A]">
              <Send size={14}/> Submit Leave Request
            </button>
          </div>

          {/* Leave history */}
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-100">
              <p className="text-[13.5px] font-bold text-[#111827]">My Leave History ({myLeave.length})</p>
            </div>
            {myLeave.length===0?(
              <div className="py-10 text-center text-slate-400">
                <Clock size={32} className="mx-auto mb-2 text-slate-200"/>
                <p>No leave requests yet</p>
              </div>
            ):(
              <div className="divide-y divide-slate-50">
                {myLeave.map(lv=>{
                  const sc={Pending:"#F59E0B",Approved:"#16A34A",Rejected:"#EF4444"}[lv.status]||"#94A3B8";
                  const days=lv.startDate&&lv.endDate?Math.ceil((new Date(lv.endDate)-new Date(lv.startDate))/86400000)+1:0;
                  return(
                    <div key={lv.id} className="px-4 py-3.5 flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[15px]" style={{background:sc+"18"}}>
                        {lv.status==="Approved"?"✅":lv.status==="Rejected"?"❌":"⏳"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-[13px] font-bold text-[#111827]">{lv.type}</p>
                          <span className="text-[10.5px] font-black px-2 py-0.5 rounded-full" style={{background:sc+"18",color:sc}}>{lv.status}</span>
                        </div>
                        <p className="text-[11.5px] text-slate-500 mt-0.5">{lv.startDate} → {lv.endDate} · {days} day{days!==1?"s":""}</p>
                        {lv.reason&&<p className="text-[11px] text-slate-400 mt-0.5">{lv.reason}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PAYSLIP ── */}
      {activeTab==="payslip"&&(
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center mx-auto mb-4">
              <Banknote size={28} className="text-[#16A34A]"/>
            </div>
            <h3 className="text-[16px] font-bold text-[#111827] mb-1">Monthly Payslip</h3>
            {self?(
              <>
                <div className="grid grid-cols-3 gap-3 my-4">
                  {[
                    ["Gross Pay","TZS "+money(self.salary)+"k","#16A34A"],
                    ["PAYE","-TZS "+money(Math.round(self.salary<=270?0:self.salary<=520?(self.salary-270)*0.08:self.salary<=760?20+(self.salary-520)*0.20:68+(self.salary-760)*0.25))+"k","#EF4444"],
                    ["Net Pay","TZS "+money(Math.round(self.salary-(self.salary<=270?0:self.salary<=520?(self.salary-270)*0.08:self.salary<=760?20+(self.salary-520)*0.20:68+(self.salary-760)*0.25)-self.salary*0.035-Math.min(self.salary*0.015,10)))+"k","#2563EB"],
                  ].map(([l,v,col])=>(
                    <div key={l} className="bg-slate-50 rounded-xl p-3">
                      <p className="text-[10px] text-slate-400 uppercase tracking-wide mb-1">{l}</p>
                      <p className="text-[15px] font-black" style={{color:col}}>{v}</p>
                    </div>
                  ))}
                </div>
                <p className="text-[12px] text-slate-500 mb-4">{self.role} · {self.department} · Pay Period: {TODAY_STR.slice(0,7)}</p>
                <button onClick={printMyPayslip}
                  className="inline-flex items-center gap-2 text-[13px] font-bold text-white px-6 py-3 rounded-xl bg-[#16A34A]">
                  <Printer size={14}/> Download Payslip PDF
                </button>
              </>
            ):(
              <div className="py-4">
                <p className="text-slate-500 text-[13px]">Your employee profile has not been set up yet.</p>
                <p className="text-slate-400 text-[12px] mt-1">Ask HR to add you to the employee list.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── PROFILE ── */}
      {activeTab==="profile"&&(
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="px-5 py-5 flex items-center gap-4 border-b border-slate-100" style={{background:"linear-gradient(135deg,#0D2214,#1a3a2a)"}}>
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-[28px] font-black bg-[#16A34A]">
                {empName.charAt(0)}
              </div>
              <div>
                <p className="text-white text-[18px] font-black">{empName}</p>
                <p className="text-[rgba(255,255,255,.6)] text-[12.5px] mt-0.5">{self?.role||"Employee"} · {self?.department||"—"}</p>
              </div>
            </div>
            <div className="p-5">
              {self?(
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    ["Employee ID",      self.id||"—"],
                    ["Department",       self.department||"—"],
                    ["Role",             self.role||"—"],
                    ["Contract Type",    self.contractType||"Permanent"],
                    ["Hire Date",        self.hireDate||"—"],
                    ["Email",            self.email||"—"],
                    ["Phone",            self.phone||"—"],
                    ["Status",           self.status||"Active"],
                  ].map(([l,v])=>(
                    <div key={l} className="border-b border-slate-100 pb-3">
                      <p className="text-[10.5px] font-bold text-slate-400 uppercase tracking-wide mb-0.5">{l}</p>
                      <p className="text-[13.5px] font-semibold text-[#111827]">{v}</p>
                    </div>
                  ))}
                </div>
              ):(
                <div className="py-6 text-center text-slate-400">
                  <UserCircle size={36} className="mx-auto mb-2 text-slate-200"/>
                  <p>Profile not yet set up. Ask HR to add your details.</p>
                </div>
              )}
            </div>
          </div>

          {/* Biometric setup card */}
          <div className={`rounded-xl border p-4 ${bioEnrolled?"bg-[#F0FDF4] border-[#BBF7D0]":"bg-[#F8FAFB] border-slate-200"}`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-[20px] ${bioEnrolled?"bg-[#16A34A]/10":"bg-slate-100"}`}>
                  {bioEnrolled?"🔒":"👆"}
                </div>
                <div>
                  <p className={`text-[13px] font-bold ${bioEnrolled?"text-[#15803D]":"text-[#111827]"}`}>
                    {bioEnrolled?"Biometrics Active":"Biometric Sign-In"}
                  </p>
                  <p className="text-[11.5px] text-slate-500">
                    {bioAvailable===false
                      ? "Not supported on this device"
                      : bioEnrolled
                        ? "Your fingerprint / Face ID is registered on this device"
                        : "Register your fingerprint or Face ID for secure clock-in"}
                  </p>
                </div>
              </div>
              {bioAvailable&&(
                <button
                  onClick={bioEnrolled ? () => { localStorage.removeItem(BIO_KEY); setBioEnrolled(false); notify("Biometrics removed from this device"); } : enrollBiometric}
                  disabled={bioVerifying}
                  className={`shrink-0 text-[12px] font-bold px-3.5 py-2 rounded-xl border transition-all ${
                    bioEnrolled
                      ? "text-[#EF4444] border-[#EF4444]/30 bg-white hover:bg-[#FEF2F2]"
                      : "text-white border-transparent bg-[#16A34A] hover:bg-[#15803D]"
                  }`}>
                  {bioVerifying ? "…" : bioEnrolled ? "Remove" : "Set Up"}
                </button>
              )}
            </div>
          </div>

          {/* Biometric setup modal */}
          {bioSetupOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center">
              <div className="absolute inset-0 bg-[#111827]/50 backdrop-blur-sm" onClick={()=>setBioSetupOpen(false)}/>
              <div className="relative bg-white rounded-2xl shadow-2xl p-7 w-full max-w-sm mx-4 text-center">
                <div className="w-16 h-16 rounded-2xl bg-[#F0FDF4] flex items-center justify-center text-[40px] mx-auto mb-4">
                  🔒
                </div>
                <h3 className="text-[18px] font-black text-[#111827] mb-2">Set Up Biometric Sign-In</h3>
                <p className="text-[12.5px] text-slate-500 mb-4 leading-relaxed">
                  Register your <strong>fingerprint or Face ID</strong> on this device. Every clock-in, clock-out, and duty completion will then be biometrically signed — giving HR tamper-proof verified records.
                </p>
                <div className="bg-slate-50 rounded-xl p-3 mb-4 text-left space-y-2">
                  {[
                    ["🔒","Your biometric never leaves your device"],
                    ["📡","Records sync to HR with 'Biometric Verified' badge"],
                    ["🕐","Works for Clock In, Clock Out, and Duty confirmations"],
                  ].map(([icon,text])=>(
                    <div key={text} className="flex items-start gap-2.5 text-[12px] text-slate-600">
                      <span className="text-[14px] shrink-0">{icon}</span>{text}
                    </div>
                  ))}
                </div>
                <button onClick={enrollBiometric} disabled={bioVerifying}
                  className="w-full flex items-center justify-center gap-2 text-[14px] font-black text-white py-3.5 rounded-xl bg-[#16A34A] disabled:opacity-50 mb-2">
                  <Fingerprint size={18}/> {bioVerifying?"Registering…":"Register Now"}
                </button>
                <button onClick={()=>setBioSetupOpen(false)}
                  className="w-full text-[12.5px] text-slate-400 py-2 hover:text-slate-600">
                  Skip for now (use manual sign-in)
                </button>
              </div>
            </div>
          )}

          {/* Change portal */}
          <button onClick={()=>{ setPortalView("identify"); setInviteInput(""); setInviteError(""); }}
            className="flex items-center gap-2 text-[12.5px] font-semibold text-[#EF4444] border border-[#EF4444]/20 bg-white px-4 py-2.5 rounded-xl hover:bg-[#FEF2F2]">
            <LogOut size={14}/> Switch Employee / Sign Out of Portal
          </button>
        </div>
      )}

      {/* ── EXPENSES TAB ── */}
      {activeTab==="expenses"&&<PortalExpenses empName={empName} employees={employees}/>}

      {/* ── TRAINING TAB ── */}
      {activeTab==="training"&&<PortalTraining empName={empName}/>}

      {/* ── TEAM TAB ── */}
      {activeTab==="team"&&<PortalTeam employees={employees} self={self} empName={empName}/>}

      {/* ── NOTICEBOARD TAB ── */}
      {activeTab==="noticeboard"&&<PortalNoticeboard company={company}/>}

    </div>
  );
}

  return {
    CommunityGroupsModule,
    LegacyHealthcareClinicModule,
    LegacyHotelManagementModule,
    LegacyBankingMFIModule,
    LegacyRestaurantModule,
    EmployeePortal,
  };
}
