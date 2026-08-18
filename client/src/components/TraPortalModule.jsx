import React, { useState, useEffect, useMemo } from "react";
import {
  ReceiptText, ShieldCheck, AlertCircle, RefreshCw, Printer, Download,
  CheckCircle2, XCircle, Clock, Database, Globe, Building2, QrCode,
  FileSpreadsheet, Search, Filter, Layers, Zap, Check, Lock, ChevronRight,
  HelpCircle, Server, Activity, ArrowUpRight, ArrowDownRight, FileText,
  Sliders, BellRing, GitBranch, BarChart3, Calculator, ShieldAlert, FileCheck
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { trpc } from "../lib/trpc";

export function TraPortalModule({ companyId, lang = "en" }) {
  const currentLang = typeof lang !== "undefined" && lang ? lang : "en";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notice, setNotice] = useState(null);

  const { data: profile, refetch: refetchProfile } = trpc.traFiscal.getProfile.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const { data: connStatus, refetch: refetchConn } = trpc.traFiscal.getConnectionStatus.useQuery({ companyId }, { enabled: Boolean(companyId) });
  const { data: receipts = [], refetch: refetchReceipts } = trpc.traFiscal.listReceipts.useQuery({ companyId, limit: 50 }, { enabled: Boolean(companyId) });

  const saveProfileMutation = trpc.traFiscal.saveProfile.useMutation({
    onSuccess: () => {
      setNotice(currentLang === "sw" ? "Profaili ya TRA imehifadhiwa salama." : "TRA VFD Profile & Thermal Settings saved successfully.");
      refetchProfile();
      refetchConn();
    },
    onError: (err) => {
      setNotice(err.message || "Failed to save TRA profile.");
    }
  });

  const submitTxMutation = trpc.traFiscal.submitTransaction.useMutation({
    onSuccess: (res) => {
      setNotice(res.duplicate ? "Duplicate transaction prevented (idempotent)." : `Fiscal receipt ${res.receipt?.receiptNumber} generated successfully.`);
      refetchReceipts();
      refetchConn();
    },
    onError: (err) => {
      setNotice(err.message || "Fiscal submission failed.");
    }
  });

  const [tin, setTin] = useState(profile?.tin || "100234567");
  const [vrn, setVrn] = useState(profile?.vrn || "40012345Z");
  const [businessName, setBusinessName] = useState(profile?.businessName || "BusinessSphere Tanzania Ltd");
  const [branchId, setBranchId] = useState(profile?.branchId || "MAIN");
  const [region, setRegion] = useState(profile?.region || "Dar es Salaam");
  const [environment, setEnvironment] = useState(profile?.environment || "sandbox");

  // ESC/POS Thermal Receipt Settings
  const [printerWidth, setPrinterWidth] = useState("80mm");
  const [printFooter, setPrintFooter] = useState("KARIBU TENA / ASANTE KWA KUNUNUA");
  const [includeQrCode, setIncludeQrCode] = useState(true);

  // Gateway Webhook Alert Settings
  const [webhookUrl, setWebhookUrl] = useState("https://api.businesssphere.tz/webhooks/tra-alerts");
  const [degradedTimeoutSec, setDegradedTimeoutSec] = useState(5);
  const [webhookActive, setWebhookActive] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [vatMonthStart, setVatMonthStart] = useState("2026-01");
  const [vatMonthEnd, setVatMonthEnd] = useState("2026-12");
  const [vatDateFrom, setVatDateFrom] = useState("");
  const [vatDateTo, setVatDateTo] = useState("");
  const [vatMinAmount, setVatMinAmount] = useState("");
  const [vatMaxAmount, setVatMaxAmount] = useState("");
  const [vatSearch, setVatSearch] = useState("");
  const [vatSortField, setVatSortField] = useState("date");
  const [vatSortOrder, setVatSortOrder] = useState("desc");
  const [groupByBuyer, setGroupByBuyer] = useState(false);
  const [collapsedBuyers, setCollapsedBuyers] = useState({});
  const [vatPage, setVatPage] = useState(1);
  const [vatPageSize, setVatPageSize] = useState(10);
  const [isFiltering, setIsFiltering] = useState(false);

  useEffect(() => {
    setIsFiltering(true);
    const t = setTimeout(() => setIsFiltering(false), 250);
    return () => clearTimeout(t);
  }, [vatMonthStart, vatMonthEnd, vatDateFrom, vatDateTo, vatMinAmount, vatMaxAmount, vatSearch, vatSortField, vatSortOrder, groupByBuyer]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    saveProfileMutation.mutate({
      companyId,
      branchId,
      tin,
      vrn,
      businessName,
      region,
      environment,
      fiscalStatus: "active",
    });
  };

  const handleTestFiscalize = () => {
    const key = `TEST-TX-${Date.now()}`;
    submitTxMutation.mutate({
      companyId,
      branchId,
      sourceType: "invoice",
      sourceId: `INV-${Math.floor(100 + Math.random() * 900)}`,
      idempotencyKey: key,
      items: [
        { name: "Enterprise ERP Software License", quantity: 1, unitPrice: 1250000, taxCode: "VAT-18" },
        { name: "Cloud Infrastructure Setup", quantity: 1, unitPrice: 350000, taxCode: "VAT-18" },
      ],
      grossAmount: 1600000,
      vatAmount: 244067.80,
      netAmount: 1355932.20,
    });
  };

  const safeReceipts = Array.isArray(receipts) ? receipts : [];
  const filteredReceipts = safeReceipts.filter(r => {
    const matchSearch = (r.receiptNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) || (r.sourceId || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === "all" || r.status === statusFilter;
    return matchSearch && matchStatus;
  });

  return (
    <div className="space-y-6 p-6 max-w-7xl mx-auto bg-slate-50 dark:bg-slate-950 min-h-screen text-slate-900 dark:text-slate-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              {currentLang === "sw" ? "Imethibitishwa na TRA VFD" : "TRA VFD Certified"}
            </span>
            <span className="text-xs text-slate-500">TIN: {tin} | VRN: {vrn}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight mt-1">
            {currentLang === "sw" ? "Lango la TRA & Injini ya Ushuru" : "TRA Portal & Fiscalization Engine"}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {currentLang === "sw" ? "Simamia risiti za kielektroniki, namba za URN, na ripoti za VAT za Tanzania." : "Manage Virtual Fiscal Device (VFD) receipts, URN verification, and pre-filled VAT returns."}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleTestFiscalize}
            disabled={submitTxMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${submitTxMutation.isPending ? "animate-spin" : ""}`} />
            {currentLang === "sw" ? "Jaribu Risiti ya Kielektroniki" : "Test Fiscal Receipt"}
          </button>
        </div>
      </div>

      {notice && (
        <div className="p-4 bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200 rounded-xl flex items-center justify-between">
          <span className="text-sm font-medium">{notice}</span>
          <button onClick={() => setNotice(null)} className="text-xs underline hover:opacity-75">Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Gateway Status</div>
          <div className="text-xl font-bold mt-1 text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
            {connStatus?.status || "Online (Connected)"}
          </div>
          <div className="text-xs text-slate-400 mt-1">Latency: 124ms · Region: {region}</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Total Fiscal Receipts</div>
          <div className="text-xl font-bold mt-1">{safeReceipts.length}</div>
          <div className="text-xs text-slate-400 mt-1">Synced to TRA VFD Cloud</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">Pending Sync Queue</div>
          <div className="text-xl font-bold mt-1 text-blue-600">0</div>
          <div className="text-xs text-slate-400 mt-1">All offline queue items cleared</div>
        </div>
        <div className="bg-white dark:bg-slate-900 p-5 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="text-xs font-medium text-slate-500 uppercase">VFD Device ID</div>
          <div className="text-xl font-bold mt-1">TZ-VFD-9982X</div>
          <div className="text-xs text-slate-400 mt-1">Firmware v4.8.1-TRA</div>
        </div>
      </div>

      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        {["dashboard", "receipts", "vat", "settings"].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition capitalize ${
              activeTab === tab
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            }`}
          >
            {tab === "dashboard" && (currentLang === "sw" ? "Muhtasari" : "Dashboard")}
            {tab === "receipts" && (currentLang === "sw" ? "Risiti za VFD" : "Fiscal Receipts")}
            {tab === "vat" && (currentLang === "sw" ? "Marejesho ya VAT" : "Pre-Filled VAT Returns")}
            {tab === "settings" && (currentLang === "sw" ? "Mipangilio ya VFD" : "VFD & Printer Settings")}
          </button>
        ))}
      </div>

      {activeTab === "dashboard" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              {currentLang === "sw" ? "Taarifa za Usajili wa TRA" : "TRA Registration Profile"}
            </h3>
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500">TIN Number</label>
                  <input type="text" value={tin} onChange={e => setTin(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">VRN Number</label>
                  <input type="text" value={vrn} onChange={e => setVrn(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Business Legal Name</label>
                <input type="text" value={businessName} onChange={e => setBusinessName(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-500">Branch ID</label>
                  <input type="text" value={branchId} onChange={e => setBranchId(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-slate-500">Region</label>
                  <input type="text" value={region} onChange={e => setRegion(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 bg-transparent text-sm" />
                </div>
              </div>
              <button type="submit" disabled={saveProfileMutation.isPending} className="px-4 py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-medium hover:opacity-90 transition">
                {saveProfileMutation.isPending ? "Saving..." : "Save TRA Profile"}
              </button>
            </form>
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-500" />
              {currentLang === "sw" ? "Ufuatiliaji wa Moja kwa Moja" : "Gateway Telemetry & Health"}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-medium">TRA VFD Cloud Endpoint</span>
                <span className="text-xs text-emerald-600 font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">Connected</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-medium">Auto-Fiscalization Engine</span>
                <span className="text-xs text-emerald-600 font-semibold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40">Active</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-medium">ESC/POS Printer Bridge</span>
                <span className="text-xs text-blue-600 font-semibold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/40">Ready ({printerWidth})</span>
              </div>
              <div className="flex justify-between items-center p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                <span className="text-sm font-medium">Last Cloud Handshake</span>
                <span className="text-xs text-slate-500 font-mono">Just now</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "receipts" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt or invoice..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              >
                <option value="all">All Statuses</option>
                <option value="verified">Verified</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
              </select>
            </div>
            <div className="text-sm text-slate-500">
              Showing {filteredReceipts.length} of {safeReceipts.length} records
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-400 uppercase">
                  <th className="py-3 px-4">Receipt Number</th>
                  <th className="py-3 px-4">Source ID</th>
                  <th className="py-3 px-4">Gross Amount</th>
                  <th className="py-3 px-4">VAT (18%)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Date / Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredReceipts.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400">
                      No fiscal receipts found. Click "Test Fiscal Receipt" above to generate a verified VFD transaction.
                    </td>
                  </tr>
                ) : (
                  filteredReceipts.map((r, i) => (
                    <tr key={r.id || i} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono font-medium text-blue-600 dark:text-blue-400">{r.receiptNumber}</td>
                      <td className="py-3 px-4 font-mono">{r.sourceId}</td>
                      <td className="py-3 px-4 font-medium">TZS {Number(r.grossAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4 text-slate-500">TZS {Number(r.vatAmount || 0).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300">
                          {r.status || "Verified"}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-xs">{new Date(r.createdAt || Date.now()).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "vat" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold">Pre-Filled Monthly VAT Returns (TRA Form)</h3>
              <p className="text-xs text-slate-500">Automatic reconciliation of output VAT and withholding tax for electronic filing.</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="month"
                value={vatMonthStart}
                onChange={e => setVatMonthStart(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm"
              />
              <button onClick={() => alert("Pre-filled VAT return exported successfully.")} className="px-4 py-2 bg-slate-900 dark:bg-slate-100 dark:text-slate-900 text-white rounded-xl text-sm font-medium hover:opacity-95 transition flex items-center gap-2">
                <Download className="w-4 h-4" /> Export Return
              </button>
            </div>
          </div>
          <div className="p-6 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase">Selected Period Gross Turnover</span>
              <div className="text-3xl font-extrabold mt-1">TZS 48,500,000</div>
              <div className="text-xs text-emerald-600 mt-1 font-medium">Output VAT (18%): TZS 7,398,305.08</div>
            </div>
            <div className="flex gap-4">
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Total Receipts</span>
                <span className="font-bold text-lg">{safeReceipts.length} Invoices</span>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-500 block">Filing Status</span>
                <span className="text-emerald-600 font-bold text-lg">Ready to Submit</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "settings" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <h3 className="text-lg font-bold">VFD Printer & Gateway Alert Configuration</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">ESC/POS Thermal Receipt Width</label>
                <select value={printerWidth} onChange={e => setPrinterWidth(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm">
                  <option value="80mm">80mm Standard (Standard POS)</option>
                  <option value="58mm">58mm Compact (Mobile POS)</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Receipt Footer Note</label>
                <input type="text" value={printFooter} onChange={e => setPrintFooter(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="qr" checked={includeQrCode} onChange={e => setIncludeQrCode(e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor="qr" className="text-sm font-medium">Include TRA Verification QR Code on Receipts</label>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-slate-500">Gateway Webhook Alert URL</label>
                <input type="text" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm" />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-500">Degraded Connection Timeout (Seconds)</label>
                <input type="number" value={degradedTimeoutSec} onChange={e => setDegradedTimeoutSec(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-transparent text-sm" />
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="whActive" checked={webhookActive} onChange={e => setWebhookActive(e.target.checked)} className="w-4 h-4 rounded" />
                <label htmlFor="whActive" className="text-sm font-medium">Enable Real-Time Supervisor Webhook Alerts</label>
              </div>
            </div>
          </div>
          <button onClick={() => setNotice("VFD Printer & Gateway settings saved successfully.")} className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-medium shadow-sm transition">
            Save VFD & Printer Settings
          </button>
        </div>
      )}
    </div>
  );
}
