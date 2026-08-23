import { useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleHelp,
  Clock3,
  Database,
  FileClock,
  Globe2,
  Layers3,
  LayoutDashboard,
  LockKeyhole,
  MessageCircle,
  RefreshCw,
  Search,
  Server,
  Settings2,
  ShieldCheck,
  Sparkles,
  Ticket,
  UserRound,
  UsersRound,
  WalletCards,
  Webhook,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { trpc } from "../lib/trpc";

type JsonRecord = Record<string, any>;

type Snapshot = {
  generatedAt?: string;
  overview?: JsonRecord;
  tenants?: JsonRecord[];
  users?: JsonRecord[];
  modules?: JsonRecord[];
  billing?: { events?: JsonRecord[]; payments?: JsonRecord[]; invoices?: JsonRecord[] };
  support?: JsonRecord[];
  whatsapp?: JsonRecord;
  rbac?: JsonRecord;
  actions?: JsonRecord[];
  health?: JsonRecord;
};

type SectionId = "overview" | "health" | "tenants" | "users" | "billing" | "modules" | "security" | "integrations" | "whatsapp" | "ai" | "support" | "notifications" | "database" | "api" | "reports" | "settings";

const sections: Array<{ id: SectionId; label: string; icon: typeof LayoutDashboard; description: string }> = [
  { id: "overview", label: "Overview", icon: LayoutDashboard, description: "Cross-platform operating picture" },
  { id: "health", label: "Platform health", icon: Activity, description: "Database and provider readiness" },
  { id: "tenants", label: "Tenants / companies", icon: Building2, description: "Company inventory and module footprint" },
  { id: "users", label: "Users & access", icon: UsersRound, description: "Profiles and live access state" },
  { id: "billing", label: "Subscriptions & billing", icon: WalletCards, description: "Plans, payments, and events" },
  { id: "modules", label: "Modules", icon: Layers3, description: "Module adoption across companies" },
  { id: "security", label: "Security & audit", icon: ShieldCheck, description: "RBAC and controlled action evidence" },
  { id: "integrations", label: "Integrations", icon: Globe2, description: "Configured platform connectors" },
  { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, description: "Account and message readiness" },
  { id: "ai", label: "AI", icon: Sparkles, description: "Provider readiness and governance" },
  { id: "support", label: "Support", icon: Ticket, description: "Cross-tenant support operations" },
  { id: "notifications", label: "Notifications", icon: Bell, description: "Persisted notification sources" },
  { id: "database", label: "Database", icon: Database, description: "Live database health signal" },
  { id: "api", label: "API / webhooks", icon: Webhook, description: "Runtime telemetry and delivery" },
  { id: "reports", label: "Reports", icon: BarChart3, description: "Report source and scheduling readiness" },
  { id: "settings", label: "Settings", icon: Settings2, description: "Guardrails and control policies" },
];

function number(value: unknown) {
  return typeof value === "number" ? value.toLocaleString("en-TZ") : Number(value || 0).toLocaleString("en-TZ");
}

function money(value: unknown, currency = "TZS") {
  if (value === null || value === undefined || value === "") return "Data unavailable";
  return `${currency} ${Number(value).toLocaleString("en-TZ", { maximumFractionDigits: 0 })}`;
}

function date(value: unknown) {
  if (!value) return "—";
  const parsed = new Date(String(value));
  return Number.isNaN(parsed.getTime()) ? "—" : parsed.toLocaleString("en-TZ", { dateStyle: "medium", timeStyle: "short" });
}

function tone(status: unknown) {
  const normalized = String(status || "").toLowerCase();
  if (["healthy", "active", "enabled", "paid", "completed", "success", "succeeded"].includes(normalized)) return "bg-emerald-50 text-emerald-700";
  if (["failed", "disabled", "cancelled", "error"].includes(normalized)) return "bg-rose-50 text-rose-700";
  if (["unavailable", "pending", "trial"].includes(normalized)) return "bg-amber-50 text-amber-800";
  return "bg-slate-100 text-slate-600";
}

function StatusPill({ status }: { status: unknown }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.08em] ${tone(status)}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{String(status || "Unknown")}</span>;
}

function DataUnavailable({ label, reason }: { label: string; reason?: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-5"><div className="flex items-start gap-3"><AlertTriangle size={18} className="mt-0.5 shrink-0 text-amber-600" /><div><p className="text-sm font-bold text-slate-800">{label}: Data unavailable</p><p className="mt-1 text-xs leading-5 text-slate-500">{reason || "No verified source is configured for this surface."}</p></div></div></div>;
}

function Stat({ label, value, detail, icon: Icon, accent = "emerald" }: { label: string; value: string; detail: string; icon: typeof Activity; accent?: string }) {
  const accents: Record<string, string> = { emerald: "bg-emerald-50 text-emerald-700", blue: "bg-blue-50 text-blue-700", violet: "bg-violet-50 text-violet-700", amber: "bg-amber-50 text-amber-700", rose: "bg-rose-50 text-rose-700" };
  return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_10px_30px_rgba(15,23,42,.04)]"><div className="flex items-start justify-between gap-3"><span className={`grid h-10 w-10 place-items-center rounded-xl ${accents[accent] || accents.emerald}`}><Icon size={18} /></span><span className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Live</span></div><p className="mt-4 text-[11px] font-bold uppercase tracking-[.12em] text-slate-400">{label}</p><p className="mt-1 text-2xl font-black tracking-[-.04em] text-slate-950">{value}</p><p className="mt-1 text-xs leading-5 text-slate-500">{detail}</p></div>;
}

function EmptyState({ label }: { label: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center"><p className="text-sm font-semibold text-slate-700">No {label} records</p><p className="mt-1 text-xs text-slate-500">The live source returned an empty result.</p></div>;
}

export function GlobalAdminControlCenter() {
  const [section, setSection] = useState<SectionId>("overview");
  const [search, setSearch] = useState("");
  const [actionTarget, setActionTarget] = useState<JsonRecord | null>(null);
  const [reason, setReason] = useState("");
  const snapshotQuery = trpc.globalAdmin.snapshot.useQuery(undefined, { retry: false, refetchOnWindowFocus: false });
  const recordAction = trpc.globalAdmin.recordAction.useMutation({
    onSuccess: () => {
      toast.success("Controlled action recorded in the platform audit ledger.");
      setActionTarget(null);
      setReason("");
      snapshotQuery.refetch();
    },
    onError: (error) => toast.error(error.message || "The controlled action was not recorded."),
  });

  const snapshot = snapshotQuery.data as Snapshot | undefined;
  const overview = snapshot?.overview || {};
  const normalizedSearch = search.trim().toLowerCase();
  const tenants = useMemo(() => (snapshot?.tenants || []).filter((row) => !normalizedSearch || `${row.name} ${row.country} ${row.category}`.toLowerCase().includes(normalizedSearch)), [snapshot?.tenants, normalizedSearch]);
  const users = useMemo(() => (snapshot?.users || []).filter((row) => !normalizedSearch || `${row.full_name} ${row.email} ${row.role}`.toLowerCase().includes(normalizedSearch)), [snapshot?.users, normalizedSearch]);
  const activeSection = sections.find((entry) => entry.id === section) || sections[0];

  if (snapshotQuery.isLoading) return <div className="grid min-h-[520px] place-items-center rounded-3xl border border-slate-200 bg-white"><div className="text-center"><RefreshCw size={28} className="mx-auto animate-spin text-emerald-600" /><p className="mt-4 text-sm font-bold text-slate-800">Verifying platform administrator access…</p><p className="mt-1 text-xs text-slate-500">Loading bounded live platform metrics.</p></div></div>;
  if (snapshotQuery.isError) return <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8"><div className="flex items-start gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-rose-700" size={22} /><div><h2 className="text-lg font-black text-rose-950">Global Admin access denied</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-rose-900/80">The server could not verify a live Platform Administrator role for this session. No cross-tenant data was loaded.</p><p className="mt-3 rounded-xl bg-white/70 px-3 py-2 font-mono text-[11px] text-rose-800">{snapshotQuery.error.message}</p><button type="button" onClick={() => snapshotQuery.refetch()} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-rose-700 px-4 py-2.5 text-xs font-bold text-white"><RefreshCw size={14} />Retry verification</button></div></div></div>;
  if (!snapshot) return <DataUnavailable label="Global Admin snapshot" />;

  const submitAction = () => {
    if (!actionTarget || !reason.trim()) return;
    const action = "REVIEW_TENANT_ACCESS";
    const targetId = String(actionTarget.id || "GLOBAL");
    recordAction.mutate({ action, targetType: "company", targetId, reason: reason.trim(), confirmationText: `CONFIRM:${action}:${targetId}`, details: { source: "global_admin_control_center", tenantName: actionTarget.name || null } });
  };

  const renderOverview = () => <div className="space-y-5"><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5"><Stat label="Companies" value={number(overview.companyCount)} detail="Live tenant inventory" icon={Building2} /><Stat label="Users" value={number(overview.userCount)} detail={`${number(overview.activeUserCount)} active profiles`} icon={UsersRound} accent="blue" /><Stat label="Active modules" value={number(overview.activeModuleCount)} detail="Across all companies" icon={Layers3} accent="violet" /><Stat label="Subscription payments" value={money(overview.paidSubscriptionAmount)} detail={`${number(overview.failedPaymentCount)} failed payment records`} icon={WalletCards} accent="amber" /><Stat label="Open support" value={number(overview.openSupportTicketCount)} detail="Live support ticket source" icon={Ticket} accent="rose" /></div><div className="grid gap-5 xl:grid-cols-[1.1fr_.9fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] font-black uppercase tracking-[.16em] text-emerald-700">Control plane</p><h2 className="mt-1 text-xl font-black tracking-[-.035em] text-slate-950">Platform operating picture</h2><p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">A bounded read model assembled by a server-side Supabase RPC. This view never grants access to a tenant; it reflects the verified Platform Administrator role.</p></div><ShieldCheck className="text-emerald-600" size={24} /></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">Subscriptions</p><p className="mt-1 text-lg font-black text-slate-950">{number(overview.activeSubscriptionCount)} active / {number(overview.subscriptionCount)} total</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] font-bold uppercase tracking-[.12em] text-slate-400">WhatsApp</p><p className="mt-1 text-lg font-black text-slate-950">{number(overview.enabledWhatsappAccountCount)} enabled / {number(overview.whatsappAccountCount)} total</p></div></div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Clock3 size={18} /></span><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">Snapshot timestamp</p><p className="mt-1 text-sm font-bold text-slate-900">{date(snapshot.generatedAt)}</p></div></div><div className="mt-5 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4"><p className="text-xs font-bold text-emerald-900">Safe by default</p><p className="mt-1 text-xs leading-5 text-emerald-900/75">There is no silent impersonation, no browser-only elevation, and no destructive action in this release.</p></div><button type="button" onClick={() => snapshotQuery.refetch()} className="mt-4 inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50"><RefreshCw size={14} />Refresh live snapshot</button></section></div></div>;

  const renderHealth = () => <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Object.entries(snapshot.health || {}).map(([key, value]) => { const item = value as JsonRecord; return <section key={key} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.14em] text-slate-400">{key}</p><p className="mt-1 text-base font-black capitalize text-slate-950">{key} health</p></div><StatusPill status={item.status} /></div><p className="mt-4 text-xs leading-5 text-slate-500">{item.reason || `Checked at ${date(item.checkedAt)}`}</p>{item.source && <p className="mt-3 font-mono text-[10px] text-slate-400">Source: {item.source}</p>}</section>; })}</div>;

  const renderTenants = () => <section className="rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-slate-100 bg-slate-50"><tr>{["Company", "Country", "Users", "Active modules", "Subscription", "Control"].map((heading) => <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{tenants.map((row) => <tr key={row.id} className="hover:bg-slate-50/70"><td className="px-4 py-4"><p className="text-sm font-bold text-slate-900">{row.name || "Unnamed company"}</p><p className="mt-1 text-[11px] text-slate-400">{row.category || "Category unavailable"}</p></td><td className="px-4 py-4 text-xs text-slate-600">{row.country || "—"}<br /><span className="text-[10px] text-slate-400">{row.currency || "Currency unavailable"}</span></td><td className="px-4 py-4 text-sm font-bold text-slate-800">{number(row.user_count)}</td><td className="px-4 py-4 text-sm font-bold text-slate-800">{number(row.active_module_count)}<span className="ml-1 text-[10px] font-normal text-slate-400">/ {number(row.module_row_count)}</span></td><td className="px-4 py-4 text-xs text-slate-500">{date(row.subscription_updated_at)}</td><td className="px-4 py-4"><button type="button" onClick={() => setActionTarget(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-2 text-[11px] font-bold text-slate-700 hover:border-emerald-300 hover:text-emerald-700">Record review <ChevronRight size={13} /></button></td></tr>)}</tbody></table></div>{tenants.length === 0 && <div className="p-6"><EmptyState label="tenant" /></div>}</section>;

  const renderUsers = () => <section className="rounded-2xl border border-slate-200 bg-white"><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left"><thead className="border-b border-slate-100 bg-slate-50"><tr>{["User", "Workspace", "Role", "State", "Created"].map((heading) => <th key={heading} className="px-4 py-3 text-[10px] font-black uppercase tracking-[.12em] text-slate-400">{heading}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{users.map((row) => <tr key={row.id}><td className="px-4 py-4"><p className="text-sm font-bold text-slate-900">{row.full_name || "Unnamed profile"}</p><p className="mt-1 text-xs text-slate-500">{row.email || "Email unavailable"}</p></td><td className="px-4 py-4 font-mono text-[10px] text-slate-400">{row.company_id || "Global profile"}</td><td className="px-4 py-4"><StatusPill status={row.role || "Unassigned"} /></td><td className="px-4 py-4"><StatusPill status={row.is_active ? "Active" : "Disabled"} /></td><td className="px-4 py-4 text-xs text-slate-500">{date(row.created_at)}</td></tr>)}</tbody></table></div>{users.length === 0 && <div className="p-6"><EmptyState label="user" /></div>}</section>;

  const renderBilling = () => <div className="grid gap-5 xl:grid-cols-2"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-base font-black text-slate-950">Payment activity</h2><div className="mt-4 space-y-2">{(snapshot.billing?.payments || []).map((row) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"><div><p className="text-xs font-bold text-slate-800">{row.provider || "Provider unavailable"}</p><p className="mt-1 text-[10px] text-slate-400">{row.company_id} · {date(row.created_at)}</p></div><div className="text-right"><p className="text-sm font-black text-slate-900">{money(row.amount, row.currency || "TZS")}</p><StatusPill status={row.status} /></div></div>)}{!(snapshot.billing?.payments || []).length && <EmptyState label="payment" />}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-base font-black text-slate-950">Subscription events</h2><div className="mt-4 space-y-2">{(snapshot.billing?.events || []).map((row) => <div key={row.id} className="rounded-xl border border-slate-100 px-3 py-3"><div className="flex items-center justify-between gap-3"><p className="text-xs font-bold text-slate-800">{row.event_type}</p><p className="text-[10px] text-slate-400">{date(row.created_at)}</p></div><p className="mt-1 text-[10px] text-slate-500">{row.previous_status || "—"} → {row.new_status || "—"} · {row.actor_type || "actor unavailable"}</p></div>)}{!(snapshot.billing?.events || []).length && <EmptyState label="subscription event" />}</div></section></div>;

  const renderModules = () => <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{(snapshot.modules || []).map((row) => <div key={row.module_name} className="rounded-2xl border border-slate-200 bg-white p-4"><div className="flex items-start justify-between gap-3"><p className="text-sm font-black text-slate-900">{row.module_name}</p><Layers3 size={16} className="text-emerald-600" /></div><div className="mt-4 grid grid-cols-3 gap-2"><div><p className="text-[10px] text-slate-400">Companies</p><p className="mt-1 text-lg font-black text-slate-950">{number(row.company_count)}</p></div><div><p className="text-[10px] text-slate-400">Active</p><p className="mt-1 text-lg font-black text-emerald-700">{number(row.active_company_count)}</p></div><div><p className="text-[10px] text-slate-400">Disabled</p><p className="mt-1 text-lg font-black text-slate-700">{number(row.disabled_company_count)}</p></div></div></div>)}{!(snapshot.modules || []).length && <EmptyState label="module" />}</section>;

  const renderSecurity = () => <div className="grid gap-5 xl:grid-cols-[.9fr_1.1fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-50 text-violet-700"><ShieldCheck size={18} /></span><div><h2 className="text-base font-black text-slate-950">Workforce authorization catalog</h2><p className="text-xs text-slate-500">Live roles and permissions in the current schema.</p></div></div><div className="mt-5 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Roles</p><p className="mt-1 text-xl font-black">{number(snapshot.rbac?.roleCount)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Permissions</p><p className="mt-1 text-xl font-black">{number(snapshot.rbac?.permissionCount)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Assignments</p><p className="mt-1 text-xl font-black">{number(snapshot.rbac?.memberRoleAssignmentCount)}</p></div></div><div className="mt-4 space-y-2">{(snapshot.rbac?.roles || []).slice(0, 8).map((row: JsonRecord) => <div key={row.id} className="flex items-center justify-between rounded-xl border border-slate-100 px-3 py-2.5"><span className="text-xs font-semibold text-slate-700">{row.name}</span><span className="text-[10px] text-slate-400">Level {row.hierarchy_level}</span></div>)}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-50 text-amber-700"><FileClock size={18} /></span><div><h2 className="text-base font-black text-slate-950">Controlled action ledger</h2><p className="text-xs text-slate-500">Only confirmed platform-admin actions are recorded here.</p></div></div><div className="mt-4 space-y-2">{(snapshot.actions || []).map((row) => <div key={row.id} className="rounded-xl border border-slate-100 px-3 py-3"><div className="flex flex-wrap items-center justify-between gap-2"><p className="text-xs font-black text-slate-800">{row.action}</p><p className="text-[10px] text-slate-400">{date(row.created_at)}</p></div><p className="mt-1 text-[11px] text-slate-500">{row.target_type}{row.target_id ? ` · ${row.target_id}` : ""} · {row.actor_role}</p><p className="mt-2 text-xs leading-5 text-slate-600">{row.reason}</p></div>)}{!(snapshot.actions || []).length && <EmptyState label="controlled action" />}</div></section></div>;

  const renderWhatsApp = () => <div className="grid gap-5 xl:grid-cols-[1fr_.8fr]"><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-base font-black text-slate-950">WhatsApp accounts</h2><div className="mt-4 space-y-2">{(snapshot.whatsapp?.accounts || []).map((row: JsonRecord) => <div key={row.id} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-3"><div><p className="text-xs font-bold text-slate-800">{row.display_phone_number || row.phone_number_id}</p><p className="mt-1 text-[10px] text-slate-400">{row.provider} · {row.company_id}</p></div><StatusPill status={row.enabled ? "Enabled" : "Disabled"} /></div>)}{!(snapshot.whatsapp?.accounts || []).length && <EmptyState label="WhatsApp account" />}</div></section><section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="text-base font-black text-slate-950">Messaging volume</h2><div className="mt-4 grid grid-cols-3 gap-2"><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Conversations</p><p className="mt-1 text-xl font-black">{number(snapshot.whatsapp?.conversationCount)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Messages</p><p className="mt-1 text-xl font-black">{number(snapshot.whatsapp?.messageCount)}</p></div><div className="rounded-xl bg-slate-50 p-3"><p className="text-[10px] text-slate-400">Events</p><p className="mt-1 text-xl font-black">{number(snapshot.whatsapp?.messageEventCount)}</p></div></div><p className="mt-4 text-xs text-slate-500">Last message: {date(snapshot.whatsapp?.lastMessageAt)}</p></section></div>;

  const renderSupport = () => <section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-50 text-blue-700"><CircleHelp size={18} /></span><div><h2 className="text-base font-black text-slate-950">Cross-tenant support queue</h2><p className="text-xs text-slate-500">Live support tickets are shown with operational metadata only.</p></div></div><div className="mt-5 space-y-2">{(snapshot.support || []).map((row) => <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-100 px-3 py-3"><div><p className="text-xs font-bold text-slate-800">{row.subject || "Untitled ticket"}</p><p className="mt-1 text-[10px] text-slate-400">{row.company_id} · {row.source_channel || "channel unavailable"}</p></div><div className="flex items-center gap-2"><StatusPill status={row.priority || "Normal"} /><StatusPill status={row.status || "Unknown"} /></div></div>)}{!(snapshot.support || []).length && <EmptyState label="support ticket" />}</div></section>;

  const renderUnavailable = (key: string) => <DataUnavailable label={activeSection.label} reason={(snapshot.health?.[key] as JsonRecord | undefined)?.reason || "No persisted source is configured for this platform surface."} />;

  const content = section === "overview" ? renderOverview() : section === "health" ? renderHealth() : section === "tenants" ? renderTenants() : section === "users" ? renderUsers() : section === "billing" ? renderBilling() : section === "modules" ? renderModules() : section === "security" ? renderSecurity() : section === "whatsapp" ? renderWhatsApp() : section === "support" ? renderSupport() : section === "database" ? <div className="space-y-4"><div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5"><div className="flex items-center gap-3"><CheckCircle2 className="text-emerald-700" size={20} /><div><p className="text-sm font-black text-emerald-950">Database query path healthy</p><p className="mt-1 text-xs leading-5 text-emerald-900/75">The protected platform snapshot executed successfully against live Supabase at {date((snapshot.health?.database as JsonRecord)?.checkedAt)}.</p></div></div></div><p className="text-xs text-slate-500">This is an execution health signal, not a claim that every external Supabase advisor notice is resolved.</p></div> : section === "ai" ? renderUnavailable("ai") : section === "integrations" ? renderUnavailable("integrations") : section === "api" ? renderUnavailable("api") : section === "notifications" ? <DataUnavailable label="Notifications" reason="No cross-tenant persisted notification registry is configured; module-specific notification tables remain tenant-scoped." /> : section === "reports" ? <DataUnavailable label="Reports" reason="No platform-wide report catalog or scheduler source is configured. Tenant report schedules remain available in the existing Reports module." /> : <div className="space-y-4"><section className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><Settings2 className="text-slate-600" size={20} /><div><h2 className="text-base font-black text-slate-950">Platform control policy</h2><p className="mt-1 text-xs leading-5 text-slate-500">Global Admin is intentionally read-first. Future mutations must be added as server-side, reasoned, confirmed, audited procedures.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">No silent impersonation</div><div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">No browser-only elevation</div><div className="rounded-xl bg-slate-50 p-3 text-xs leading-5 text-slate-600">No destructive action in this release</div></div></section><DataUnavailable label="Platform settings" reason="No global settings registry is configured beyond the existing tenant-scoped settings." /></div>;

  return <div className="min-h-[680px] overflow-hidden rounded-3xl border border-slate-200 bg-[#F8FAFC] shadow-[0_20px_60px_rgba(15,23,42,.08)]"><div className="border-b border-slate-200 bg-white px-4 py-5 sm:px-6"><div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.18em] text-emerald-700"><Server size={13} />Platform command center</div><h1 className="mt-2 text-2xl font-black tracking-[-.05em] text-slate-950 sm:text-3xl">Global Admin Control Center</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">Secure, cross-tenant visibility for Smart Manager operations. Live data only; unavailable sources are labeled.</p></div><div className="flex items-center gap-2"><div className="relative min-w-0 flex-1 sm:w-64"><Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search live records" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" aria-label="Search live Global Admin records" /></div><button type="button" onClick={() => snapshotQuery.refetch()} className="grid h-10 w-10 place-items-center rounded-xl border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-700" aria-label="Refresh Global Admin snapshot"><RefreshCw size={15} /></button></div></div></div><div className="grid lg:grid-cols-[230px_minmax(0,1fr)]"><nav className="border-b border-slate-200 bg-white p-2 lg:border-b-0 lg:border-r" aria-label="Global Admin sections"><div className="flex gap-1 overflow-x-auto lg:block">{sections.map((entry) => { const Icon = entry.icon; const active = entry.id === section; return <button key={entry.id} type="button" onClick={() => setSection(entry.id)} className={`flex min-w-max items-center gap-2 rounded-xl px-3 py-2.5 text-left text-xs font-bold lg:mb-1 lg:w-full ${active ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`} aria-current={active ? "page" : undefined}><Icon size={15} /><span>{entry.label}</span></button>; })}</div></nav><section className="min-w-0 p-4 sm:p-6"><div className="mb-5 flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-slate-400">{activeSection.label}</p><p className="mt-1 text-sm text-slate-500">{activeSection.description}</p></div><span className="hidden items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold text-emerald-700 sm:inline-flex"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />Verified session</span></div>{content}</section></div>{actionTarget && <div className="fixed inset-0 z-[120] grid place-items-center bg-slate-950/45 p-4" role="dialog" aria-modal="true" aria-labelledby="global-admin-action-title"><div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-black uppercase tracking-[.15em] text-amber-700">Controlled action</p><h2 id="global-admin-action-title" className="mt-1 text-xl font-black text-slate-950">Record a tenant access review</h2></div><button type="button" onClick={() => setActionTarget(null)} aria-label="Close controlled action dialog"><X size={18} className="text-slate-400" /></button></div><div className="mt-4 rounded-xl bg-slate-50 p-3 text-xs text-slate-600"><p className="font-bold text-slate-800">Target: {actionTarget.name || actionTarget.id}</p><p className="mt-1 font-mono text-[10px]">{actionTarget.id}</p></div><label className="mt-4 block text-xs font-bold text-slate-700">Reason<textarea value={reason} onChange={(event) => setReason(event.target.value)} className="mt-1.5 min-h-24 w-full rounded-xl border border-slate-200 p-3 text-xs outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10" placeholder="Explain why this review is required." /></label><div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3"><p className="text-[10px] font-black uppercase tracking-[.12em] text-amber-800">Confirmation text</p><p className="mt-1 font-mono text-[11px] text-amber-950">CONFIRM:REVIEW_TENANT_ACCESS:{actionTarget.id}</p><p className="mt-2 text-[10px] leading-4 text-amber-900/75">This release records an auditable review intent only. It does not suspend, delete, impersonate, or mutate the tenant.</p></div><div className="mt-5 flex justify-end gap-2"><button type="button" onClick={() => setActionTarget(null)} className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-bold text-slate-700">Cancel</button><button type="button" disabled={!reason.trim() || recordAction.isPending} onClick={submitAction} className="inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-50">{recordAction.isPending && <RefreshCw size={13} className="animate-spin" />}Confirm and record</button></div></div></div>}</div>;
}
