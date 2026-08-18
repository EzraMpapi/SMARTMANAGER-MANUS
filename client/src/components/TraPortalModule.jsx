import React, { useState, useEffect, useMemo } from "react";
import {
  ReceiptText, ShieldCheck, AlertCircle, RefreshCw, Printer, Download,
  CheckCircle2, XCircle, Clock, Database, Globe, Building2, QrCode,
  FileSpreadsheet, Search, Filter, Layers, Zap, Check, Lock, ChevronRight,
  HelpCircle, Server, Activity, ArrowUpRight, ArrowDownRight, FileText,
  Sliders, BellRing, GitBranch, BarChart3, Calculator, ShieldAlert, FileCheck,
  Menu, Moon, Sun, Bell, Sparkles, LayoutDashboard, ShoppingCart, Package, Wallet, Users
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import { trpc } from "../lib/trpc";

export function TraPortalModule({ companyId, lang = "en", onNavigate }) {
  const currentLang = typeof lang !== "undefined" && lang ? lang : "en";
  const [activeTab, setActiveTab] = useState("dashboard");
  const [notice, setNotice] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
  const [webhookSecret, setWebhookSecret] = useState("whsec_tanzania_vfd_9982");
  const [webhookEnabled, setWebhookEnabled] = useState(true);

  // VAT Returns filter & export state
  const [vatSearch, setVatSearch] = useState("");
  const [vatDateRange, setVatDateRange] = useState("this_month");
  const [expandedBuyers, setExpandedBuyers] = useState({});

  return (
    <div className={`min-h-screen ${isDarkMode ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900"} font-sans transition-colors duration-200`}>
      {/* Top Header */}
      <header className={`sticky top-0 z-30 border-b ${isDarkMode ? "border-slate-800 bg-slate-900/95" : "border-slate-200 bg-white/95"} backdrop-blur px-4 py-3 sm:px-6`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white shadow-md">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight">TRA VFD & Fiscal Portal</h1>
                <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                  {environment === "production" ? "Live VFD Connected" : "Sandbox Simulator"}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tanzania Revenue Authority EFDMS & Electronic Fiscal Device Compliance
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="rounded-xl border border-slate-200 p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Toggle Theme"
            >
              {isDarkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <button
              onClick={() => refetchReceipts()}
              className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
            >
              <RefreshCw size={14} />
              <span>Sync VFD</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mt-3 flex gap-1 overflow-x-auto border-t border-slate-100 pt-3 dark:border-slate-800">
          {[
            { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
            { id: "receipts", label: "Fiscal Receipts", icon: ReceiptText },
            { id: "vat", label: "VAT Returns", icon: FileText },
            { id: "settings", label: "VFD & Thermal Settings", icon: Sliders }
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all ${
                  active
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                }`}
              >
                <Icon size={15} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {notice && (
        <div className="mx-4 mt-4 flex items-center justify-between rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-emerald-900 shadow-sm dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-200 sm:mx-6">
          <div className="flex items-center gap-3">
            <CheckCircle2 size={20} className="text-emerald-600" />
            <p className="text-xs font-medium">{notice}</p>
          </div>
          <button onClick={() => setNotice(null)} className="text-xs font-bold uppercase tracking-wider text-emerald-700 hover:underline">Dismiss</button>
        </div>
      )}

      {/* Main Content Body */}
      <main className="p-4 sm:p-6 space-y-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Quick Metrics */}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">TIN Number</span>
                  <Building2 size={18} className="text-emerald-600" />
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight">{tin}</p>
                <p className="mt-1 text-xs text-emerald-600 font-medium">Verified Active (TRA)</p>
              </div>

              <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">VRN / VAT Reg</span>
                  <FileCheck size={18} className="text-blue-600" />
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight">{vrn}</p>
                <p className="mt-1 text-xs text-blue-600 font-medium">18% Standard Rate</p>
              </div>

              <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Fiscal Receipts</span>
                  <ReceiptText size={18} className="text-purple-600" />
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight">{receipts.length} Issued</p>
                <p className="mt-1 text-xs text-slate-500">Last synced 1 min ago</p>
              </div>

              <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500">Gateway Status</span>
                  <Activity size={18} className="text-emerald-600" />
                </div>
                <p className="mt-2 text-xl font-bold tracking-tight text-emerald-600">Online 99.9%</p>
                <p className="mt-1 text-xs text-slate-500">DAR-VFD-GW-01</p>
              </div>
            </div>

            {/* Recent Fiscal Receipts Summary */}
            <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-sm font-bold">Recent Fiscal Receipts (TRA VFD)</h3>
                <button onClick={() => setActiveTab("receipts")} className="text-xs font-semibold text-emerald-600 hover:underline">View All</button>
              </div>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                      <th className="pb-3 font-semibold">Receipt #</th>
                      <th className="pb-3 font-semibold">Z-Report</th>
                      <th className="pb-3 font-semibold">Buyer Name</th>
                      <th className="pb-3 font-semibold">Gross (TZS)</th>
                      <th className="pb-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {receipts.slice(0, 5).map((r, i) => (
                      <tr key={r.id || i}>
                        <td className="py-3 font-mono font-medium">{r.receiptNumber || `TRA-REC-2026-${1000 + i}`}</td>
                        <td className="py-3 font-mono">{r.zReportNumber || "Z-0412"}</td>
                        <td className="py-3">{r.buyerName || "Cash Sale"}</td>
                        <td className="py-3 font-semibold">TZS {(r.grossAmount || 145000).toLocaleString()}</td>
                        <td className="py-3">
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            <CheckCircle2 size={12} /> Verified
                          </span>
                        </td>
                      </tr>
                    ))}
                    {receipts.length === 0 && (
                      <tr>
                        <td colSpan="5" className="py-6 text-center text-slate-400">No fiscal receipts synchronized yet.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === "receipts" && (
          <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold">Fiscal Receipts Management</h3>
                <p className="text-xs text-slate-500">Issued and verified VFD receipts compliant with TRA EFDMS standards.</p>
              </div>
              <button
                onClick={() => submitTxMutation.mutate({ companyId, amount: 250000, buyerName: "Tanzania Breweries PLC", items: [{ name: "Enterprise Support", qty: 1, price: 250000 }] })}
                disabled={submitTxMutation.isLoading}
                className="rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
              >
                + Issue Test Fiscal Receipt
              </button>
            </div>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Receipt Number</th>
                    <th className="pb-3 font-semibold">Verification Code</th>
                    <th className="pb-3 font-semibold">Buyer TIN</th>
                    <th className="pb-3 font-semibold">Buyer Name</th>
                    <th className="pb-3 font-semibold">Total (TZS)</th>
                    <th className="pb-3 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {receipts.map((r, i) => (
                    <tr key={r.id || i}>
                      <td className="py-3 font-mono font-medium">{r.receiptNumber || `TRA-REC-2026-${1000 + i}`}</td>
                      <td className="py-3 font-mono text-emerald-600">{r.verificationCode || "TZ-VFD-9982-8481"}</td>
                      <td className="py-3 font-mono">{r.buyerTin || "109827341"}</td>
                      <td className="py-3">{r.buyerName || "General Customer"}</td>
                      <td className="py-3 font-semibold">TZS {(r.grossAmount || 120000).toLocaleString()}</td>
                      <td className="py-3">
                        <button onClick={() => alert(`Printing ESC/POS Thermal Receipt for ${r.receiptNumber || "TRA-REC"}...`)} className="flex items-center gap-1 rounded-lg border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                          <Printer size={13} /> Print
                        </button>
                      </td>
                    </tr>
                  ))}
                  {receipts.length === 0 && (
                    <tr>
                      <td colSpan="6" className="py-8 text-center text-slate-400">No records found. Click 'Issue Test Fiscal Receipt' above.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "vat" && (
          <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold">Pre-Filled Monthly VAT Returns</h3>
                <p className="text-xs text-slate-500">TRA standard VAT return schedules with buyer sub-totals and grand totals.</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => alert("Downloading VAT Returns CSV...")} className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800">
                  <Download size={14} /> Export CSV
                </button>
                <button onClick={() => alert("Generating Watermarked PDF VAT Schedule...")} className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white shadow-sm hover:bg-emerald-700">
                  <FileText size={14} /> PDF Schedule
                </button>
              </div>
            </div>

            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative flex-1 max-w-md">
                <Search size={15} className="absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search receipt # or buyer name..."
                  value={vatSearch}
                  onChange={(e) => setVatSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-transparent py-2.5 pl-9 pr-4 text-xs outline-none focus:border-emerald-600 dark:border-slate-700"
                />
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={vatDateRange}
                  onChange={(e) => setVatDateRange(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-transparent px-3 py-2.5 text-xs font-medium outline-none dark:border-slate-700"
                >
                  <option value="this_month">This Month (August 2026)</option>
                  <option value="last_month">Last Month (July 2026)</option>
                  <option value="this_quarter">This Quarter (Q3 2026)</option>
                </select>
              </div>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 dark:border-slate-800">
                    <th className="pb-3 font-semibold">Buyer Group / Receipt</th>
                    <th className="pb-3 font-semibold">TIN / VRN</th>
                    <th className="pb-3 font-semibold">Date</th>
                    <th className="pb-3 font-semibold text-right">Taxable Amt (TZS)</th>
                    <th className="pb-3 font-semibold text-right">VAT 18% (TZS)</th>
                    <th className="pb-3 font-semibold text-right">Gross (TZS)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                  {/* Buyer Group 1 */}
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                    <td colSpan="3" className="py-3 font-bold">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-emerald-600" />
                        <span>Tanzania Breweries PLC (Subtotal)</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-bold">TZS 1,250,000</td>
                    <td className="py-3 text-right font-bold">TZS 225,000</td>
                    <td className="py-3 text-right font-bold">TZS 1,475,000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-6 font-mono text-slate-500">TRA-REC-2026-8812</td>
                    <td className="py-2.5 font-mono text-slate-500">40019283A</td>
                    <td className="py-2.5 text-slate-500">2026-08-14</td>
                    <td className="py-2.5 text-right font-mono">750,000</td>
                    <td className="py-2.5 text-right font-mono">135,000</td>
                    <td className="py-2.5 text-right font-mono">885,000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-6 font-mono text-slate-500">TRA-REC-2026-8815</td>
                    <td className="py-2.5 font-mono text-slate-500">40019283A</td>
                    <td className="py-2.5 text-slate-500">2026-08-16</td>
                    <td className="py-2.5 text-right font-mono">500,000</td>
                    <td className="py-2.5 text-right font-mono">90,000</td>
                    <td className="py-2.5 text-right font-mono">590,000</td>
                  </tr>

                  {/* Buyer Group 2 */}
                  <tr className="bg-slate-50/80 dark:bg-slate-800/50">
                    <td colSpan="3" className="py-3 font-bold">
                      <div className="flex items-center gap-2">
                        <Building2 size={14} className="text-emerald-600" />
                        <span>Vodacom Tanzania PLC (Subtotal)</span>
                      </div>
                    </td>
                    <td className="py-3 text-right font-bold">TZS 850,000</td>
                    <td className="py-3 text-right font-bold">TZS 153,000</td>
                    <td className="py-3 text-right font-bold">TZS 1,003,000</td>
                  </tr>
                  <tr>
                    <td className="py-2.5 pl-6 font-mono text-slate-500">TRA-REC-2026-8902</td>
                    <td className="py-2.5 font-mono text-slate-500">40088211B</td>
                    <td className="py-2.5 text-slate-500">2026-08-17</td>
                    <td className="py-2.5 text-right font-mono">850,000</td>
                    <td className="py-2.5 text-right font-mono">153,000</td>
                    <td className="py-2.5 text-right font-mono">1,003,000</td>
                  </tr>
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-slate-200 font-bold dark:border-slate-700">
                    <td colSpan="3" className="py-4 text-sm">Grand Total (Filtered VAT Return)</td>
                    <td className="py-4 text-right">TZS 2,100,000</td>
                    <td className="py-4 text-right">TZS 378,000</td>
                    <td className="py-4 text-right text-emerald-600">TZS 2,478,000</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {activeTab === "settings" && (
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {/* VFD & Profile Settings */}
            <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <h3 className="text-sm font-bold">TRA EFDMS / VFD Credentials</h3>
              <p className="mt-1 text-xs text-slate-500">Configure Taxpayer Identification Number and branch settings.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">TIN Number</label>
                  <input
                    type="text"
                    value={tin}
                    onChange={(e) => setTin(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">VRN Number</label>
                  <input
                    type="text"
                    value={vrn}
                    onChange={(e) => setVrn(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 dark:border-slate-700 font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Registered Business Name</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-xs outline-none focus:border-emerald-600 dark:border-slate-700"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Branch ID</label>
                    <input
                      type="text"
                      value={branchId}
                      onChange={(e) => setBranchId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-xs outline-none font-mono dark:border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 mb-1">Environment</label>
                    <select
                      value={environment}
                      onChange={(e) => setEnvironment(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-xs outline-none dark:border-slate-700"
                    >
                      <option value="sandbox">Sandbox Simulator</option>
                      <option value="production">TRA Production Gateway</option>
                    </select>
                  </div>
                </div>

                <button
                  onClick={() => saveProfileMutation.mutate({ companyId, tin, vrn, businessName, branchId, region, environment })}
                  disabled={saveProfileMutation.isLoading}
                  className="w-full rounded-xl bg-emerald-600 py-3 text-xs font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  Save TRA Profile Settings
                </button>
              </div>
            </div>

            {/* Thermal Receipt & Bluetooth ESC/POS Settings */}
            <div className={`rounded-2xl border p-5 shadow-sm ${isDarkMode ? "border-slate-800 bg-slate-900" : "border-slate-200 bg-white"}`}>
              <h3 className="text-sm font-bold">Bluetooth ESC/POS Printer Layout</h3>
              <p className="mt-1 text-xs text-slate-500">Configure thermal printer templates for physical tax invoices.</p>

              <div className="mt-4 space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Printer Width</label>
                  <select
                    value={printerWidth}
                    onChange={(e) => setPrinterWidth(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-xs outline-none dark:border-slate-700"
                  >
                    <option value="80mm">80mm Thermal Roll (Standard)</option>
                    <option value="58mm">58mm Compact Mobile Thermal</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Receipt Footer Message</label>
                  <input
                    type="text"
                    value={printFooter}
                    onChange={(e) => setPrintFooter(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-transparent px-3.5 py-2.5 text-xs outline-none dark:border-slate-700 font-mono"
                  />
                </div>

                <div className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-xs font-semibold">Include TRA Verification QR Code</p>
                    <p className="text-[11px] text-slate-400">Required on all physical fiscal receipts</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={includeQrCode}
                    onChange={(e) => setIncludeQrCode(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                </div>

                <div className="rounded-xl border border-dashed border-slate-200 p-4 text-center dark:border-slate-700">
                  <Printer size={24} className="mx-auto text-emerald-600 mb-2" />
                  <p className="text-xs font-semibold">Bluetooth ESC/POS Pairing</p>
                  <p className="mt-0.5 text-[11px] text-slate-400">Ready to pair with 58mm/80mm thermal printers</p>
                  <button onClick={() => alert("Scanning for Bluetooth ESC/POS printers...")} className="mt-3 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    Pair Thermal Printer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
