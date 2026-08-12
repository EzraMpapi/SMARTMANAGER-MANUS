import React from "react";
import { ShieldAlert, RefreshCw } from "lucide-react";
import { trpc } from "../lib/trpc";

interface ComplianceAuditLogViewProps {
  companyId?: string;
}

export function ComplianceAuditLogView({ companyId = "default-company" }: ComplianceAuditLogViewProps) {
  const { data: logs = [], isLoading, refetch } = trpc.auditLogs.list.useQuery(
    { companyId, limit: 50 },
    { refetchInterval: 10000 }
  );

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#C9A96E]/15 text-[#C9A96E]">
            <ShieldAlert size={20} />
          </div>
          <div>
            <h3 className="text-[18px] font-bold font-heading text-white">Compliance Audit Trail</h3>
            <p className="text-[13px] text-[#94A3B8]">Immutable cryptographic & server-persisted log of administrative and departmental actions.</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-[13px] font-semibold text-[#C9A96E] hover:bg-white/10 transition-colors"
        >
          <RefreshCw size={14} /> Refresh Logs
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B1120] overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-[13px] text-slate-400">Loading audit records...</div>
          ) : logs.length === 0 ? (
            <div className="p-12 text-center text-[13px] text-slate-400">
              No audit events recorded for company <span className="font-mono text-white">{companyId}</span>.
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
