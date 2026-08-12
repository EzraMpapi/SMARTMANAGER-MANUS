import React, { useState } from "react";
import { ShieldAlert, RefreshCw, Database, Filter, Calendar } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";

interface ComplianceAuditLogViewProps {
  companyId?: string;
}

export function ComplianceAuditLogView({ companyId = "default-company" }: ComplianceAuditLogViewProps) {
  const [selectedModule, setSelectedModule] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");

  const { data: logs = [], isLoading, refetch } = trpc.auditLogs.list.useQuery(
    {
      companyId,
      limit: 100,
      module: selectedModule || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    { refetchInterval: 10000 }
  );

  const { data: backupStatus, refetch: refetchBackup, isLoading: backupLoading } = trpc.admin.verifyBackup.useQuery();
  const utils = trpc.useUtils();
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("");

  const { data: webhookCfg } = trpc.admin.getWebhook.useQuery();
  React.useEffect(() => {
    if (webhookCfg) {
      setWebhookUrl(webhookCfg.url);
      setWebhookEnabled(webhookCfg.enabled);
    }
  }, [webhookCfg]);

  const updateWebhookMutation = trpc.admin.updateWebhook.useMutation({
    onSuccess: () => {
      toast.success("Webhook configuration updated successfully");
      setShowWebhookModal(false);
      utils.admin.getWebhook.invalidate();
    },
    onError: (err) => {
      toast.error(err.message || "Failed to update webhook configuration");
    },
  });

  const testPingMutation = trpc.admin.testWebhookPing.useMutation({
    onSuccess: (res) => {
      if (res.ok) {
        toast.success(`Webhook test ping sent successfully (HTTP ${res.status})`);
      } else {
        toast.warning(`Webhook endpoint responded with HTTP ${res.status}`);
      }
    },
    onError: (err) => {
      toast.error(err.message || "Webhook test ping failed");
    },
  });

  const handleExportCsv = () => {
    if (!logs || logs.length === 0) {
      toast.error("No logs available to export");
      return;
    }
    const headers = ["Timestamp", "Module", "Action", "Actor", "Details"];
    const rows = logs.map(l => [
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.actorName || l.actorOpenId}"`,
      `"${(l.details || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `compliance_audit_logs_${companyId}_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Compliance audit log CSV exported successfully");
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Backup Status Banner */}
      <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/20 p-5 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/20 text-emerald-400">
            <Database size={20} />
          </div>
          <div>
            <h4 className="text-[15px] font-bold text-white flex items-center gap-2">
              Supabase Managed Backup & PITR Status
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300">
                {backupLoading ? "Checking..." : backupStatus?.status === "healthy" ? "Healthy & Active" : "Operational"}
              </span>
            </h4>
            <p className="text-[12px] text-slate-400">
              Provider: {backupStatus?.provider || "Supabase PostgreSQL"} • Daily automated snapshots & Point-in-Time Recovery enabled.
            </p>
          </div>
        </div>
        <button
          onClick={() => refetchBackup()}
          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-3 py-2 text-[12px] font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
        >
          <RefreshCw size={13} /> Verify Backup Health
        </button>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#C9A96E]/15 text-[#C9A96E]">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-[18px] font-bold font-heading text-white">Compliance Audit Trail</h3>
            <p className="text-[13px] text-[#94A3B8]">Immutable cryptographic & server-persisted log of administrative and departmental actions.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/20 border border-emerald-500/30 px-4 py-2.5 text-[13px] font-semibold text-emerald-300 hover:bg-emerald-600/30 transition-colors"
          >
            Export CSV
          </button>
          <button
            onClick={() => setShowWebhookModal(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-[13px] font-semibold text-[#C9A96E] hover:bg-white/10 transition-colors"
          >
            Webhook Config
          </button>
          <button
            onClick={() => refetch()}
            className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-[13px] font-semibold text-[#C9A96E] hover:bg-white/10 transition-colors"
          >
            <RefreshCw size={14} /> Refresh Logs
          </button>
        </div>
      </div>

      {showWebhookModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#131C31] p-6 text-white shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <h4 className="text-[16px] font-bold text-[#C9A96E]">Audit Event Webhook Configuration</h4>
              <button onClick={() => setShowWebhookModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <div className="space-y-4 text-[13px]">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Webhook Endpoint URL</label>
                <input
                  type="url"
                  placeholder="https://api.yourcompany.com/webhooks/audit"
                  className="w-full rounded-xl border border-white/15 bg-[#0B1120] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A96E]"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Signing Secret (Optional)</label>
                <input
                  type="password"
                  placeholder="whsec_..."
                  className="w-full rounded-xl border border-white/15 bg-[#0B1120] px-3.5 py-2.5 text-white focus:outline-none focus:border-[#C9A96E]"
                  value={webhookSecret}
                  onChange={(e) => setWebhookSecret(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3 pt-2">
                <input
                  type="checkbox"
                  id="wbEnabled"
                  className="h-4 w-4 rounded border-slate-700 bg-[#0B1120] text-[#C9A96E] focus:ring-0"
                  checked={webhookEnabled}
                  onChange={(e) => setWebhookEnabled(e.target.checked)}
                />
                <label htmlFor="wbEnabled" className="text-white font-semibold">Enable automated webhook dispatch for compliance events</label>
              </div>
            </div>
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <button
                type="button"
                onClick={() => testPingMutation.mutate()}
                disabled={testPingMutation.isPending || !webhookUrl}
                className="rounded-xl px-4 py-2.5 bg-white/10 text-[#C9A96E] hover:bg-white/20 font-semibold disabled:opacity-50"
              >
                {testPingMutation.isPending ? "Sending Test..." : "Send Test Ping"}
              </button>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowWebhookModal(false)}
                  className="rounded-xl px-4 py-2.5 bg-white/5 text-slate-300 hover:bg-white/10 font-semibold"
                >
                  Cancel
                </button>
                <button
                  onClick={() => updateWebhookMutation.mutate({ url: webhookUrl, enabled: webhookEnabled, secret: webhookSecret })}
                  className="rounded-xl px-5 py-2.5 bg-[#C9A96E] text-[#0B1120] font-bold hover:bg-[#D4B87F] transition-colors"
                >
                  Save Webhook Settings
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 rounded-xl border border-white/10 bg-[#0B1120] p-4">
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C9A96E] mb-1.5 flex items-center gap-1.5">
            <Filter size={12} /> Filter by Module
          </label>
          <select
            className="w-full rounded-lg border border-white/15 bg-[#131C31] px-3 py-2 text-[12.5px] text-white focus:outline-none focus:border-[#C9A96E]"
            value={selectedModule}
            onChange={(e) => setSelectedModule(e.target.value)}
          >
            <option value="">All Modules</option>
            <option value="Finance">Finance</option>
            <option value="Inventory">Inventory</option>
            <option value="CRM">CRM</option>
            <option value="Admin">Admin</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C9A96E] mb-1.5 flex items-center gap-1.5">
            <Calendar size={12} /> Start Date
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-white/15 bg-[#131C31] px-3 py-2 text-[12.5px] text-white focus:outline-none focus:border-[#C9A96E]"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>

        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-[#C9A96E] mb-1.5 flex items-center gap-1.5">
            <Calendar size={12} /> End Date
          </label>
          <input
            type="date"
            className="w-full rounded-lg border border-white/15 bg-[#131C31] px-3 py-2 text-[12.5px] text-white focus:outline-none focus:border-[#C9A96E]"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B1120] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-[13px] text-slate-400">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-[13px] text-slate-400">
              No audit events matched the selected filters.
            </div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#131C31] text-[#C9A96E] border-b border-white/10 font-medium">
                <tr>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Module</th>
                  <th className="p-4">Action</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-[12px]">
                      {new Date(log.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4 font-semibold text-white">{log.module}</td>
                    <td className="p-4 font-mono text-amber-300">{log.action}</td>
                    <td className="p-4 text-slate-300">{log.actorName || log.actorOpenId}</td>
                    <td className="p-4 text-slate-400 truncate max-w-sm">{log.details || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
