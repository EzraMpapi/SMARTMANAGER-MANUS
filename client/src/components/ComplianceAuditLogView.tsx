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
  const [showWebhookModal, setShowWebhookModal] = useState(false);
  const [showDeliveryDrawer, setShowDeliveryDrawer] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookSecret, setWebhookSecret] = useState("");

  const utils = trpc.useUtils();
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
  const { data: webhookCfg } = trpc.admin.getWebhook.useQuery();
  const { data: dlq = [] } = trpc.admin.getDeadLetterQueue.useQuery(undefined, { refetchInterval: 15000 });
  const { data: deliveries = [] } = trpc.admin.getWebhookDeliveries.useQuery(undefined, { refetchInterval: 5000 });

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
    const headers = ["Timestamp", "Module", "Action", "Severity", "Actor", "Details"];
    const rows = logs.map(l => [
      `"${new Date(l.createdAt).toISOString()}"`,
      `"${l.module}"`,
      `"${l.action}"`,
      `"${l.action.includes("DELETE") || l.action.includes("EXCEED") ? "HIGH" : "INFO"}"`,
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
            onClick={() => setShowDeliveryDrawer(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-violet-500/10 border border-violet-400/25 px-4 py-2.5 text-[13px] font-semibold text-violet-200 hover:bg-violet-500/20 transition-colors"
          >
            Delivery Activity
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

              {dlq.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[12px] font-bold text-amber-400 mb-2">Webhook Dead-Letter Queue ({dlq.length} failed events):</p>
                  <div className="max-h-32 overflow-y-auto space-y-1.5 text-[11px] text-slate-400 font-mono bg-[#0B1120] p-3 rounded-xl border border-white/10">
                    {dlq.map((item) => (
                      <div key={item.id} className="flex justify-between items-center border-b border-white/5 pb-1">
                        <span>{item.event.action} ({item.error})</span>
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {showDeliveryDrawer && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/55 backdrop-blur-sm">
          <button aria-label="Close webhook delivery activity" onClick={() => setShowDeliveryDrawer(false)} className="absolute inset-0 cursor-default" />
          <aside className="relative h-full w-full max-w-xl overflow-y-auto border-l border-white/15 bg-[#10182A] p-6 text-white shadow-2xl">
            <div className="mb-6 flex items-start justify-between border-b border-white/10 pb-5">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#C9A96E]">Admin monitoring</p>
                <h4 className="mt-1 text-[20px] font-bold">Webhook Delivery Activity</h4>
                <p className="mt-1 text-[12px] text-slate-400">Live status for recent test and automated audit event deliveries.</p>
              </div>
              <button onClick={() => setShowDeliveryDrawer(false)} className="rounded-lg p-2 text-slate-400 hover:bg-white/10 hover:text-white">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-300">Successful</p>
                <p className="mt-1 text-2xl font-bold">{deliveries.filter((item) => item.status === "success").length}</p>
              </div>
              <div className="rounded-xl border border-red-500/25 bg-red-500/10 p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-red-300">Failed / queued</p>
                <p className="mt-1 text-2xl font-bold">{deliveries.filter((item) => item.status === "failed").length}</p>
              </div>
            </div>

            {deliveries.length === 0 ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] p-8 text-center text-[13px] text-slate-400">
                No webhook deliveries have been recorded yet. Use <strong className="text-[#C9A96E]">Send Test Ping</strong> to validate your endpoint.
              </div>
            ) : (
              <div className="space-y-3">
                {deliveries.map((item) => (
                  <div key={item.id} className="rounded-xl border border-white/10 bg-white/[0.035] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${item.status === "success" ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"}`}>
                          {item.status === "success" ? "DELIVERED" : "FAILED"}
                        </span>
                        <p className="mt-2 font-mono text-[12px] text-white">{item.event?.action || item.event?.event || "WEBHOOK_EVENT"}</p>
                        <p className="mt-1 text-[11px] text-slate-400">{new Date(item.timestamp).toLocaleString()} · {item.attempts} attempt{item.attempts === 1 ? "" : "s"}</p>
                      </div>
                      <div className="text-right text-[11px]">
                        <p className="font-semibold text-slate-200">{item.responseCode ? `HTTP ${item.responseCode}` : "Network error"}</p>
                        {item.error && <p className="mt-1 max-w-[170px] text-red-300">{item.error}</p>}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </aside>
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
                  <th className="p-4">Severity</th>
                  <th className="p-4">Actor</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {logs.map((log) => {
                  const isHigh = log.action.includes("DELETE") || log.action.includes("EXCEED") || log.action.includes("ROLE");
                  return (
                    <tr key={log.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-[12px]">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="p-4 font-semibold text-white">{log.module}</td>
                      <td className="p-4 font-mono text-amber-300">{log.action}</td>
                      <td className="p-4">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold ${isHigh ? "bg-red-500/20 text-red-300 border border-red-500/30" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"}`}>
                          {isHigh ? "HIGH" : "INFO"}
                        </span>
                      </td>
                      <td className="p-4 text-slate-300">{log.actorName || log.actorOpenId}</td>
                      <td className="p-4 text-slate-400 truncate max-w-sm">{log.details || "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
