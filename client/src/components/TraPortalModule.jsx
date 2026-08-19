import React, { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowUpRight,
  Building2,
  CheckCircle2,
  Clock3,
  Download,
  FileCheck2,
  FileText,
  Globe2,
  LayoutDashboard,
  Moon,
  Printer,
  ReceiptText,
  RefreshCw,
  Search,
  Settings2,
  ShieldAlert,
  ShieldCheck,
  Sun,
  XCircle,
} from "lucide-react";
import { jsPDF } from "jspdf";
import { trpc } from "../lib/trpc";

const OFFICIAL_TAXPAYER_PORTAL = "https://taxpayerportal.tra.go.tz/";
const OFFICIAL_RECEIPT_VERIFICATION = "https://verify.tra.go.tz/";

function monthKey(value) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatDate(value) {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleString();
}

function formatAmount(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString("en-TZ", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—";
}

function maskIdentifier(value) {
  if (!value) return "Not configured";
  const text = String(value);
  return text.length <= 4 ? "••••" : `${text.slice(0, 2)}••••${text.slice(-2)}`;
}

function escapeCsv(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function downloadBlob(content, filename, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function statusCopy(status, lang) {
  const labels = {
    READY: lang === "sw" ? "IKO TAYARI" : "READY",
    AWAITING_CONFIGURATION: lang === "sw" ? "INASUBIRI MIPANGILIO" : "AWAITING CONFIGURATION",
    UNAVAILABLE: lang === "sw" ? "HAIPATIKANI" : "UNAVAILABLE",
    connected: lang === "sw" ? "IMEUNGANISHWA" : "CONNECTED",
    unavailable: lang === "sw" ? "HAIPATIKANI" : "UNAVAILABLE",
    degraded: lang === "sw" ? "IMEPUNGUZA UTENDAJI" : "DEGRADED",
  };
  return labels[status] || status || (lang === "sw" ? "HAIJULIKANI" : "UNKNOWN");
}

function StatusPill({ status, lang = "en" }) {
  const good = status === "READY" || status === "connected";
  const bad = status === "UNAVAILABLE" || status === "unavailable";
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-wide ${good ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/70 dark:text-emerald-300" : bad ? "bg-rose-100 text-rose-800 dark:bg-rose-950/70 dark:text-rose-300" : "bg-amber-100 text-amber-800 dark:bg-amber-950/70 dark:text-amber-300"}`}>
      {good ? <CheckCircle2 size={12} /> : bad ? <XCircle size={12} /> : <Clock3 size={12} />}
      {statusCopy(status, lang)}
    </span>
  );
}

export function TraPortalModule({ companyId, lang = "en", onNavigate }) {
  const currentLang = lang || "en";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notice, setNotice] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [vatSearch, setVatSearch] = useState("");
  const [vatMonth, setVatMonth] = useState(monthKey(new Date()));
  const [profileForm, setProfileForm] = useState({
    tin: "",
    vrn: "",
    businessName: "",
    branchId: "MAIN",
    region: "",
    environment: "sandbox",
  });

  const profileQuery = trpc.traFiscal.getProfile.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const connectionQuery = trpc.traFiscal.getConnectionStatus.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const receiptsQuery = trpc.traFiscal.listReceipts.useQuery({ companyId, limit: 100 }, { enabled: Boolean(companyId) });
  const operationsQuery = trpc.traFiscal.getOperationsSummary.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const anomalySettingsQuery = trpc.traFiscal.getVatAnomalySettings.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const evidenceQuery = trpc.traFiscal.listDocumentEvidence.useQuery({ companyId, limit: 50 }, { enabled: Boolean(companyId) && activeTab === "documents", retry: false });
  const profile = profileQuery.data;
  const receipts = receiptsQuery.data || [];
  const operations = operationsQuery.data;
  const evidence = evidenceQuery.data;
  const connection = connectionQuery.data?.connection;
  const readiness = connection?.readiness;
  const [anomalyForm, setAnomalyForm] = useState({ enabled: true, thresholdPercent: 50, cooldownMinutes: 1440 });

  useEffect(() => {
    if (!anomalySettingsQuery.data) return;
    setAnomalyForm({ enabled: Boolean(anomalySettingsQuery.data.enabled), thresholdPercent: Number(anomalySettingsQuery.data.thresholdPercent || 50), cooldownMinutes: Number(anomalySettingsQuery.data.cooldownMinutes || 1440) });
  }, [anomalySettingsQuery.data]);

  useEffect(() => {
    if (!profile) return;
    setProfileForm({
      tin: profile.tin || "",
      vrn: profile.vrn || "",
      businessName: profile.businessName || "",
      branchId: profile.branchId || "MAIN",
      region: profile.region || "",
      environment: profile.environment || "sandbox",
    });
  }, [profile]);

  const saveAnomalyMutation = trpc.traFiscal.saveVatAnomalySettings.useMutation({
    onSuccess: () => {
      setNotice({ type: "success", message: "VAT anomaly schedule settings saved. The job uses the deployed Heartbeat callback and remains internal monitoring only." });
      void anomalySettingsQuery.refetch();
      void operationsQuery.refetch();
    },
    onError: (error) => setNotice({ type: "error", message: error.message || "Unable to save VAT anomaly settings." }),
  });

  const saveProfileMutation = trpc.traFiscal.saveProfile.useMutation({
    onSuccess: () => {
      setNotice({ type: "success", message: currentLang === "sw" ? "Profaili ya ndani imehifadhiwa. Uthibitisho wa TRA bado haujaunganishwa." : "Internal tax profile saved. TRA verification is still not connected." });
      void profileQuery.refetch();
      void connectionQuery.refetch();
    },
    onError: (error) => setNotice({ type: "error", message: error.message || "Unable to save the tax profile." }),
  });

  const filteredReceipts = useMemo(() => {
    const query = vatSearch.trim().toLowerCase();
    return receipts.filter((receipt) => {
      const sameMonth = !vatMonth || monthKey(receipt.receiptTimestamp || receipt.createdAt) === vatMonth;
      const haystack = [receipt.receiptNumber, receipt.sourceType, receipt.sourceId, receipt.responseMessage, receipt.status].filter(Boolean).join(" ").toLowerCase();
      return sameMonth && (!query || haystack.includes(query));
    });
  }, [receipts, vatMonth, vatSearch]);

  const totals = useMemo(() => filteredReceipts.reduce((summary, receipt) => {
    summary.net += Number(receipt.netAmount) || 0;
    summary.vat += Number(receipt.vatAmount) || 0;
    summary.gross += Number(receipt.grossAmount) || 0;
    return summary;
  }, { net: 0, vat: 0, gross: 0 }), [filteredReceipts]);

  const updateForm = (field, value) => setProfileForm((current) => ({ ...current, [field]: value }));

  const exportCsv = () => {
    const header = ["Receipt number", "Status", "Source type", "Source ID", "Receipt date", "Net amount", "VAT amount", "Gross amount"];
    const rows = filteredReceipts.map((receipt) => [receipt.receiptNumber, receipt.status, receipt.sourceType, receipt.sourceId, formatDate(receipt.receiptTimestamp || receipt.createdAt), receipt.netAmount, receipt.vatAmount, receipt.grossAmount]);
    downloadBlob([header, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\n"), `tra-vat-schedule-${vatMonth || "all"}.csv`, "text/csv;charset=utf-8");
    setNotice({ type: "success", message: `Exported ${filteredReceipts.length} internal ERP receipt record(s).` });
  };

  const exportPdf = () => {
    const pdf = new jsPDF({ unit: "pt", format: "a4" });
    pdf.setFontSize(16);
    pdf.text("Smart Manager ERP — Internal VAT Schedule", 40, 48);
    pdf.setFontSize(9);
    pdf.text("Not a TRA filing or TRA acknowledgement. Submit through the official TRA portal unless an approved adapter is configured.", 40, 66);
    pdf.text(`Period: ${vatMonth || "All periods"} | Records: ${filteredReceipts.length}`, 40, 84);
    let y = 112;
    pdf.setFontSize(8);
    ["Receipt", "Status", "Date", "Net", "VAT", "Gross"].forEach((label, index) => pdf.text(label, [40, 160, 250, 335, 405, 475][index], y));
    y += 14;
    filteredReceipts.slice(0, 42).forEach((receipt) => {
      const values = [receipt.receiptNumber || "—", receipt.status || "—", formatDate(receipt.receiptTimestamp || receipt.createdAt).slice(0, 16), formatAmount(receipt.netAmount), formatAmount(receipt.vatAmount), formatAmount(receipt.grossAmount)];
      values.forEach((value, index) => pdf.text(String(value), [40, 160, 250, 335, 405, 475][index], y));
      y += 13;
    });
    y += 14;
    pdf.setFontSize(9);
    pdf.text(`Totals — Net: TZS ${formatAmount(totals.net)} | VAT: TZS ${formatAmount(totals.vat)} | Gross: TZS ${formatAmount(totals.gross)}`, 40, y);
    pdf.save(`tra-vat-schedule-${vatMonth || "all"}.pdf`);
    setNotice({ type: "success", message: "Generated an internal VAT schedule PDF. It is not a TRA submission." });
  };

  const printSchedule = () => {
    window.print();
    setNotice({ type: "success", message: "Print dialog opened for the current internal VAT schedule." });
  };

  const runSync = async () => {
    setNotice({ type: "info", message: "Refreshing tenant-scoped TRA records and provider readiness…" });
    await Promise.all([profileQuery.refetch(), connectionQuery.refetch(), receiptsQuery.refetch(), operationsQuery.refetch(), anomalySettingsQuery.refetch()]);
    setNotice({ type: "success", message: "TRA workspace data refreshed. No unverified fiscal response was created." });
  };

  const busy = profileQuery.isLoading || connectionQuery.isLoading || receiptsQuery.isLoading || operationsQuery.isLoading || anomalySettingsQuery.isLoading;
  const currentStatus = readiness?.status || (profile ? "AWAITING_CONFIGURATION" : "UNAVAILABLE");
  const appTheme = darkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-950";
  const panelTheme = darkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white";
  const mutedTheme = darkMode ? "text-slate-400" : "text-slate-500";

  return (
    <div className={`min-h-screen ${appTheme} font-sans transition-colors duration-200`}>
      <header className={`sticky top-0 z-20 border-b ${darkMode ? "border-slate-800 bg-slate-950/95" : "border-slate-200 bg-white/95"} px-4 py-4 backdrop-blur sm:px-6`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20"><ShieldCheck size={23} /></div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base font-bold tracking-tight sm:text-lg">TRA Integration Center</h1>
                <StatusPill status={currentStatus} lang={currentLang} />
              </div>
              <p className={`mt-1 max-w-3xl text-xs ${mutedTheme}`}>Tanzania-first fiscal preparation, evidence, and official-service access. Internal ERP records are never presented as TRA acknowledgements.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setDarkMode((current) => !current)} className={`rounded-xl border p-2.5 ${darkMode ? "border-slate-700 text-slate-200 hover:bg-slate-800" : "border-slate-200 text-slate-600 hover:bg-slate-100"}`} aria-label="Toggle theme">{darkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
            <a href={OFFICIAL_TAXPAYER_PORTAL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"><Globe2 size={14} /> Official TRA portal <ArrowUpRight size={13} /></a>
            <button type="button" onClick={runSync} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"><RefreshCw className={busy ? "animate-spin" : ""} size={14} /> Refresh</button>
          </div>
        </div>
        <nav className="mt-4 flex gap-1 overflow-x-auto border-t border-slate-100 pt-3 dark:border-slate-800" aria-label="TRA sections">
          {[{ id: "dashboard", label: "Overview", icon: LayoutDashboard }, { id: "operations", label: "Compliance ops", icon: Activity }, { id: "receipts", label: "Fiscal records", icon: ReceiptText }, { id: "vat", label: "VAT schedule", icon: FileText }, { id: "documents", label: "Documents & audit", icon: FileCheck2 }, { id: "settings", label: "Tax profile", icon: Settings2 }].map((tab) => {
            const Icon = tab.icon;
            return <button type="button" key={tab.id} onClick={() => setActiveTab(tab.id)} className={`inline-flex shrink-0 items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold transition ${activeTab === tab.id ? "bg-emerald-600 text-white shadow-sm" : `${mutedTheme} hover:bg-slate-100 dark:hover:bg-slate-800`}`}><Icon size={14} />{tab.label}</button>;
          })}
        </nav>
      </header>

      {notice && <div className={`mx-4 mt-4 flex items-start justify-between gap-4 rounded-2xl border p-4 text-xs shadow-sm sm:mx-6 ${notice.type === "error" ? "border-rose-200 bg-rose-50 text-rose-900 dark:border-rose-900 dark:bg-rose-950/40 dark:text-rose-200" : notice.type === "info" ? "border-sky-200 bg-sky-50 text-sky-900 dark:border-sky-900 dark:bg-sky-950/40 dark:text-sky-200" : "border-emerald-200 bg-emerald-50 text-emerald-900 dark:border-emerald-900 dark:bg-emerald-950/40 dark:text-emerald-200"}`}><div className="flex items-start gap-2">{notice.type === "error" ? <AlertCircle size={16} /> : notice.type === "info" ? <Clock3 size={16} /> : <CheckCircle2 size={16} />}<span>{notice.message}</span></div><button type="button" onClick={() => setNotice(null)} className="font-semibold underline">Dismiss</button></div>}

      <main className="space-y-6 p-4 sm:p-6">
        {!companyId && <div className={`rounded-2xl border p-6 ${panelTheme}`}><div className="flex items-center gap-3"><ShieldAlert className="text-amber-600" /><div><h2 className="text-sm font-bold">Workspace context required</h2><p className={`mt-1 text-xs ${mutedTheme}`}>The TRA center needs a verified workspace before it can load fiscal records.</p></div></div></div>}
        {companyId && activeTab === "dashboard" && <div className="space-y-6">
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[{ label: "Tax profile", value: profile ? "Configured" : "Not configured", detail: profile ? maskIdentifier(profile.tin) : "Add your registered TIN", icon: Building2, tone: "text-emerald-600" }, { label: "Provider readiness", value: statusCopy(currentStatus, currentLang), detail: readiness?.reason || "Awaiting server confirmation", icon: Activity, tone: "text-amber-600" }, { label: "Internal fiscal records", value: String(receipts.length), detail: "Tenant-scoped records", icon: ReceiptText, tone: "text-blue-600" }, { label: "Last server check", value: connection?.latencyMs != null ? `${connection.latencyMs} ms` : "Not measured", detail: connection?.reason || "No official request made", icon: Clock3, tone: "text-violet-600" }].map((card) => { const Icon = card.icon; return <div key={card.label} className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex items-center justify-between"><span className={`text-xs font-medium ${mutedTheme}`}>{card.label}</span><Icon size={18} className={card.tone} /></div><p className="mt-3 text-lg font-bold tracking-tight">{card.value}</p><p className={`mt-1 text-xs ${mutedTheme}`}>{card.detail}</p></div>; })}
          </section>
          <section className={`grid grid-cols-1 gap-6 xl:grid-cols-[1.3fr_0.7fr]`}>
            <div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}>
              <div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Control plane</p><h2 className="mt-1 text-sm font-bold">TRA connection and evidence posture</h2></div><StatusPill status={currentStatus} lang={currentLang} /></div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"><p className={`text-[10px] font-bold uppercase tracking-wider ${mutedTheme}`}>Environment</p><p className="mt-2 text-sm font-semibold">{profile?.environment || "Not configured"}</p><p className={`mt-1 text-xs ${mutedTheme}`}>The environment is stored with the tenant profile.</p></div><div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"><p className={`text-[10px] font-bold uppercase tracking-wider ${mutedTheme}`}>Submission gate</p><p className="mt-2 text-sm font-semibold">{readiness?.canSubmit ? "Approved adapter available" : "Blocked until approved adapter"}</p><p className={`mt-1 text-xs ${mutedTheme}`}>{readiness?.reason || "No production fiscal submission has been attempted."}</p></div></div>
              <div className="mt-5 flex flex-wrap gap-2"><a href={OFFICIAL_RECEIPT_VERIFICATION} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"><FileCheck2 size={14} /> Verify receipt on TRA <ArrowUpRight size={13} /></a><button type="button" onClick={() => setActiveTab("settings")} className="rounded-xl border border-slate-200 px-3.5 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800">Review tax profile</button></div>
            </div>
            <div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex items-center gap-2"><ShieldAlert className="text-amber-600" size={18} /><h2 className="text-sm font-bold">What this workspace can claim</h2></div><ul className={`mt-4 space-y-3 text-xs leading-5 ${mutedTheme}`}><li>• Internal sales, POS, VAT, and Z-report preparation can be recorded here.</li><li>• Fiscalized status appears only after a verified server response from an approved adapter.</li><li>• Taxpayer portal actions remain explicit user actions on the official TRA site.</li><li>• No browser credentials, private keys, or TRA responses are stored in this UI.</li></ul></div>
          </section>
          <section className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800"><div><h2 className="text-sm font-bold">Recent internal fiscal records</h2><p className={`mt-1 text-xs ${mutedTheme}`}>Only tenant-scoped records returned by the server are shown.</p></div><button type="button" onClick={() => setActiveTab("receipts")} className="text-xs font-semibold text-emerald-600 hover:underline">View all</button></div><ReceiptTable receipts={receipts.slice(0, 5)} mutedTheme={mutedTheme} /></section>
        </div>}

        {companyId && activeTab === "operations" && <section className="space-y-6"><div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">Operations and evidence</p><h2 className="mt-1 text-sm font-bold">Compliance operations control room</h2><p className={`mt-1 text-xs ${mutedTheme}`}>Internal retries, archives, configuration, and anomaly monitoring are shown separately from official TRA acknowledgements.</p></div><StatusPill status={operations?.provider?.readiness?.status || "UNAVAILABLE"} lang={currentLang} /></div><div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{[{ label: "Fiscal records", value: operations?.fiscalReceipts?.total ?? "—", detail: `${operations?.fiscalReceipts?.verified ?? 0} server-confirmed`, icon: ReceiptText }, { label: "Retry queue", value: operations?.retryQueue?.pending ?? "—", detail: `${operations?.retryQueue?.exhausted ?? 0} exhausted`, icon: RefreshCw }, { label: "Z-report archive", value: operations?.zReports?.total ?? "—", detail: operations?.zReports?.latestBusinessDate ? `Latest ${operations.zReports.latestBusinessDate}` : "No archive evidence", icon: FileText }, { label: "Tax configuration", value: operations?.taxConfigurations?.active ?? "—", detail: `${operations?.taxConfigurations?.total ?? 0} configured`, icon: Settings2 }].map((card) => { const Icon = card.icon; return <div key={card.label} className={`rounded-xl border border-slate-100 p-4 dark:border-slate-800`}><div className="flex items-center justify-between"><span className={`text-xs font-semibold ${mutedTheme}`}>{card.label}</span><Icon size={16} className="text-emerald-600" /></div><p className="mt-3 text-xl font-bold">{card.value}</p><p className={`mt-1 text-xs ${mutedTheme}`}>{card.detail}</p></div>; })}</div></div><div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex items-center gap-2"><ShieldAlert className="text-amber-600" size={17} /><h3 className="text-sm font-bold">VAT anomaly monitoring</h3></div>{operations?.anomaly?.status === "available" ? <div className="mt-4 space-y-3 text-xs"><div className="flex items-center justify-between"><span className={mutedTheme}>Schedule</span><span className="font-semibold">{operations.anomaly.settings?.enabled ? "Enabled" : "Paused"}</span></div><div className="flex items-center justify-between"><span className={mutedTheme}>Threshold</span><span className="font-semibold">{operations.anomaly.settings?.thresholdPercent ?? "—"}%</span></div><div className="flex items-center justify-between"><span className={mutedTheme}>Recent events</span><span className="font-semibold">{operations.anomaly.recentEvents?.length ?? 0}</span></div><p className={`rounded-xl border border-slate-100 p-3 leading-5 dark:border-slate-800 ${mutedTheme}`}>This monitor compares internal VAT records and sends configured operational alerts. It does not file returns or confirm TRA acceptance.</p><div className="mt-4 grid gap-3 sm:grid-cols-3"><label className="text-xs font-semibold"><span className={`mb-1.5 block ${mutedTheme}`}>Threshold %</span><input type="number" min="5" max="500" value={anomalyForm.thresholdPercent} onChange={(event) => setAnomalyForm((current) => ({ ...current, thresholdPercent: Number(event.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-xs dark:border-slate-700" /></label><label className="text-xs font-semibold"><span className={`mb-1.5 block ${mutedTheme}`}>Cooldown minutes</span><input type="number" min="15" max="10080" value={anomalyForm.cooldownMinutes} onChange={(event) => setAnomalyForm((current) => ({ ...current, cooldownMinutes: Number(event.target.value) }))} className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-xs dark:border-slate-700" /></label><label className="flex items-center gap-2 pt-5 text-xs font-semibold"><input type="checkbox" checked={anomalyForm.enabled} onChange={(event) => setAnomalyForm((current) => ({ ...current, enabled: event.target.checked }))} /> Enabled</label></div><button type="button" onClick={() => saveAnomalyMutation.mutate({ companyId, ...anomalyForm })} disabled={saveAnomalyMutation.isPending} className="mt-4 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50">{saveAnomalyMutation.isPending ? "Saving…" : "Save monitoring settings"}</button></div> : <p className={`mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-5 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200`}>{operations?.anomaly?.reason || "Optional anomaly tables are not available."}</p>}</div><div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex items-center gap-2"><Globe2 className="text-blue-600" size={17} /><h3 className="text-sm font-bold">Official-service actions</h3></div><p className={`mt-3 text-xs leading-5 ${mutedTheme}`}>Use the official portal for authenticated taxpayer actions and the official verification service for receipt checks. The ERP does not automate protected portal sessions.</p><div className="mt-4 flex flex-wrap gap-2"><a href={OFFICIAL_TAXPAYER_PORTAL} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900">Taxpayer portal <ArrowUpRight size={13} /></a><a href={OFFICIAL_RECEIPT_VERIFICATION} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800">Receipt verification <ArrowUpRight size={13} /></a></div></div></div></section>}

        {companyId && activeTab === "documents" && <section className="space-y-6"><div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Evidence center</p><h2 className="mt-1 text-sm font-bold">Archived compliance documents</h2><p className={`mt-1 text-xs ${mutedTheme}`}>Only tenant-scoped Z-report archive metadata and secured storage references are shown. These documents remain internal ERP evidence unless linked to a verified TRA response.</p></div><StatusPill status={evidenceQuery.isError ? "UNAVAILABLE" : evidenceQuery.isLoading ? "AWAITING_CONFIGURATION" : "READY"} lang={currentLang} /></div>{evidenceQuery.isError ? <div className="mt-5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs leading-5 text-rose-800 dark:border-rose-900 dark:bg-rose-950/30 dark:text-rose-200">Document evidence is restricted to authorized tenant administrators or is not available for this workspace.</div> : <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800"><th className="pb-3 font-semibold">Business date</th><th className="pb-3 font-semibold">Branch</th><th className="pb-3 font-semibold">Archive status</th><th className="pb-3 font-semibold">Created</th><th className="pb-3 text-right font-semibold">Action</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{(evidence?.archives || []).map((archive) => <tr key={archive.id}><td className="py-3 font-medium">{archive.businessDate || "—"}</td><td className="py-3">{archive.branchId || "—"}</td><td className="py-3"><StatusPill status={archive.status === "ARCHIVED" || archive.status === "COMPLETED" ? "READY" : "AWAITING_CONFIGURATION"} /></td><td className="py-3 whitespace-nowrap">{formatDate(archive.createdAt)}</td><td className="py-3 text-right">{archive.storageUrl ? <a href={archive.storageUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-semibold text-emerald-600 hover:underline">Download <ArrowUpRight size={13} /></a> : <span className={mutedTheme}>Not stored</span>}</td></tr>)}{!evidenceQuery.isLoading && (evidence?.archives || []).length === 0 && <tr><td colSpan="5" className={`py-12 text-center ${mutedTheme}`}>No archived Z-report documents are available for this workspace.</td></tr>}</tbody></table></div>}</div><div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex items-center gap-2"><ShieldCheck size={17} className="text-emerald-600" /><h3 className="text-sm font-bold">TRA audit evidence</h3></div><p className={`mt-2 text-xs ${mutedTheme}`}>Administrative actions in this module are recorded as internal audit events. A log entry does not mean TRA accepted a filing.</p><div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">{(evidence?.audit || []).slice(0, 10).map((log) => <div key={log.id} className="flex flex-col gap-1 py-3 text-xs sm:flex-row sm:items-start sm:justify-between"><div><p className="font-semibold">{log.action}</p><p className={mutedTheme}>{log.details || "No additional details"}</p></div><span className={`whitespace-nowrap ${mutedTheme}`}>{formatDate(log.createdAt)}</span></div>)}{!evidenceQuery.isLoading && (evidence?.audit || []).length === 0 && <p className={`py-8 text-center text-xs ${mutedTheme}`}>No TRA audit events are available for this workspace.</p>}</div></div></section>}

        {companyId && activeTab === "receipts" && <section className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex flex-col gap-3 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-blue-600">Evidence ledger</p><h2 className="mt-1 text-sm font-bold">Internal fiscal records</h2><p className={`mt-1 text-xs ${mutedTheme}`}>This list is not a substitute for a TRA acknowledgement or official receipt verification.</p></div><a href={OFFICIAL_TAXPAYER_PORTAL} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-xs font-semibold text-white hover:bg-emerald-700">Open official service <ArrowUpRight size={13} /></a></div><ReceiptTable receipts={receipts} mutedTheme={mutedTheme} showDetails /></section>}

        {companyId && activeTab === "vat" && <section className={`rounded-2xl border p-5 shadow-sm print:border-0 print:shadow-none ${panelTheme}`}><div className="flex flex-col gap-4 border-b border-slate-100 pb-4 dark:border-slate-800 sm:flex-row sm:items-start sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-violet-600">Preparation workspace</p><h2 className="mt-1 text-sm font-bold">Internal VAT schedule</h2><p className={`mt-1 text-xs ${mutedTheme}`}>Built from tenant fiscal records. It is not submitted to TRA automatically.</p></div><div className="flex flex-wrap gap-2 print:hidden"><button type="button" onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><Download size={14} /> CSV</button><button type="button" onClick={exportPdf} className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3 py-2.5 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-white dark:text-slate-900"><FileText size={14} /> PDF</button><button type="button" onClick={printSchedule} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2.5 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><Printer size={14} /> Print</button></div></div><div className="mt-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between print:hidden"><label className="relative block w-full md:max-w-md"><Search size={15} className="absolute left-3 top-3 text-slate-400" /><input value={vatSearch} onChange={(event) => setVatSearch(event.target.value)} placeholder="Search receipt, source, status…" className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-9 pr-3 text-xs outline-none focus:border-emerald-600 dark:border-slate-700" /></label><label className="flex items-center gap-2 text-xs font-semibold"><span className={mutedTheme}>Period</span><input type="month" value={vatMonth} onChange={(event) => setVatMonth(event.target.value)} className="rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-xs dark:border-slate-700" /></label></div><div className="mt-5 overflow-x-auto"><table className="w-full min-w-[760px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800"><th className="pb-3 font-semibold">Receipt</th><th className="pb-3 font-semibold">Status</th><th className="pb-3 font-semibold">Source</th><th className="pb-3 font-semibold">Date</th><th className="pb-3 text-right font-semibold">Net (TZS)</th><th className="pb-3 text-right font-semibold">VAT (TZS)</th><th className="pb-3 text-right font-semibold">Gross (TZS)</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{filteredReceipts.map((receipt) => <tr key={receipt.id}><td className="py-3 font-mono font-medium">{receipt.receiptNumber || "—"}</td><td className="py-3"><StatusPill status={receipt.status === "VERIFIED" ? "READY" : receipt.status === "FAILED" || receipt.status === "REJECTED" ? "UNAVAILABLE" : "AWAITING_CONFIGURATION"} /></td><td className="py-3">{receipt.sourceType || "—"} / {receipt.sourceId || "—"}</td><td className="py-3 whitespace-nowrap">{formatDate(receipt.receiptTimestamp || receipt.createdAt)}</td><td className="py-3 text-right font-mono">{formatAmount(receipt.netAmount)}</td><td className="py-3 text-right font-mono">{formatAmount(receipt.vatAmount)}</td><td className="py-3 text-right font-mono font-semibold">{formatAmount(receipt.grossAmount)}</td></tr>)}{filteredReceipts.length === 0 && <tr><td colSpan="7" className={`py-12 text-center ${mutedTheme}`}>{receipts.length === 0 ? "No internal fiscal records are available for this workspace." : "No records match the selected period and search."}</td></tr>}</tbody><tfoot><tr className="border-t-2 border-slate-200 font-bold dark:border-slate-700"><td colSpan="4" className="py-4">Filtered totals</td><td className="py-4 text-right">{formatAmount(totals.net)}</td><td className="py-4 text-right">{formatAmount(totals.vat)}</td><td className="py-4 text-right text-emerald-600">{formatAmount(totals.gross)}</td></tr></tfoot></table></div></section>}

        {companyId && activeTab === "settings" && <section className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_0.85fr]"><div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><div className="flex items-start gap-3"><div className="rounded-xl bg-emerald-100 p-2.5 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300"><Building2 size={18} /></div><div><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-600">Tenant profile</p><h2 className="mt-1 text-sm font-bold">Registered business details</h2><p className={`mt-1 text-xs ${mutedTheme}`}>These details support internal tax preparation. TRA verification happens through the approved official path.</p></div></div><div className="mt-5 grid gap-4 sm:grid-cols-2"><Field label="TIN" value={profileForm.tin} onChange={(value) => updateForm("tin", value)} placeholder="Registered TIN" /><Field label="VRN (optional)" value={profileForm.vrn} onChange={(value) => updateForm("vrn", value)} placeholder="Registered VRN" /><Field label="Business name" value={profileForm.businessName} onChange={(value) => updateForm("businessName", value)} placeholder="Legal business name" /><Field label="Branch ID" value={profileForm.branchId} onChange={(value) => updateForm("branchId", value)} placeholder="MAIN" /><Field label="Region" value={profileForm.region} onChange={(value) => updateForm("region", value)} placeholder="Region" /><label className="block text-xs font-semibold"><span className={`mb-1.5 block ${mutedTheme}`}>Environment</span><select value={profileForm.environment} onChange={(event) => updateForm("environment", event.target.value)} className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-xs outline-none focus:border-emerald-600 dark:border-slate-700"><option value="sandbox">Sandbox / test</option><option value="production">Production</option></select></label></div><button type="button" onClick={() => saveProfileMutation.mutate({ companyId, tin: profileForm.tin, vrn: profileForm.vrn || undefined, businessName: profileForm.businessName, branchId: profileForm.branchId || "MAIN", region: profileForm.region || undefined, environment: profileForm.environment })} disabled={saveProfileMutation.isPending || !profileForm.tin || !profileForm.businessName} className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"><ShieldCheck size={15} />{saveProfileMutation.isPending ? "Saving…" : "Save internal tax profile"}</button></div><div className={`rounded-2xl border p-5 shadow-sm ${panelTheme}`}><p className="text-[10px] font-bold uppercase tracking-[0.18em] text-amber-600">Official integration gate</p><h2 className="mt-1 text-sm font-bold">Direct TRA submission is currently blocked</h2><p className={`mt-2 text-xs leading-5 ${mutedTheme}`}>{readiness?.reason || "An approved TRA adapter, credentials, certificates, and endpoint metadata are required before production fiscalization can be enabled."}</p><div className="mt-5 space-y-3"><div className="rounded-xl border border-slate-100 p-4 dark:border-slate-800"><p className="text-xs font-bold">Keep secrets server-side</p><p className={`mt-1 text-xs ${mutedTheme}`}>Credentials, certificates, and private keys must never be entered into this browser form or stored in frontend state.</p></div><a href={OFFICIAL_TAXPAYER_PORTAL} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><span>Open official TRA taxpayer portal</span><ArrowUpRight size={14} /></a><a href={OFFICIAL_RECEIPT_VERIFICATION} target="_blank" rel="noreferrer" className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold hover:bg-slate-100 dark:border-slate-700 dark:hover:bg-slate-800"><span>Open official receipt verification</span><ArrowUpRight size={14} /></a></div></div></section>}
      </main>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }) {
  return <label className="block text-xs font-semibold"><span className="mb-1.5 block text-slate-500 dark:text-slate-400">{label}</span><input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="w-full rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-xs outline-none focus:border-emerald-600 dark:border-slate-700" /></label>;
}

function ReceiptTable({ receipts, mutedTheme, showDetails = false }) {
  return <div className="mt-5 overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead><tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800"><th className="pb-3 font-semibold">Receipt</th><th className="pb-3 font-semibold">Status</th><th className="pb-3 font-semibold">Source</th><th className="pb-3 font-semibold">Date</th><th className="pb-3 text-right font-semibold">Gross (TZS)</th>{showDetails && <th className="pb-3 text-right font-semibold">Response</th>}</tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-800">{receipts.map((receipt) => <tr key={receipt.id}><td className="py-3 font-mono font-medium">{receipt.receiptNumber || "—"}</td><td className="py-3"><StatusPill status={receipt.status === "VERIFIED" ? "READY" : receipt.status === "FAILED" || receipt.status === "REJECTED" ? "UNAVAILABLE" : "AWAITING_CONFIGURATION"} /></td><td className="py-3">{receipt.sourceType || "—"} / {receipt.sourceId || "—"}</td><td className="py-3 whitespace-nowrap">{formatDate(receipt.receiptTimestamp || receipt.createdAt)}</td><td className="py-3 text-right font-mono font-semibold">{formatAmount(receipt.grossAmount)}</td>{showDetails && <td className={`max-w-[240px] truncate py-3 text-right ${mutedTheme}`}>{receipt.responseMessage || "No response message"}</td>}</tr>)}{receipts.length === 0 && <tr><td colSpan={showDetails ? "6" : "5"} className={`py-10 text-center ${mutedTheme}`}>No server-confirmed internal fiscal records are available.</td></tr>}</tbody></table></div>;
}
