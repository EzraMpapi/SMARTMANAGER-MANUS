import React, { useState } from "react";
import { Users, Shield, UserCheck, Loader2 } from "lucide-react";
import { trpc } from "../lib/trpc";
import { toast } from "sonner";
import { EnterpriseColumnCustomizer } from "./EnterpriseLayout";

const ADMIN_USER_COLUMNS = [
  { id: "name", label: "User Name" },
  { id: "email", label: "Email" },
  { id: "openId", label: "OpenID" },
  { id: "role", label: "Current Role" },
  { id: "lastSignedIn", label: "Last Signed In" },
  { id: "actions", label: "Actions" },
];

export function AdminUserDirectoryView() {
  const utils = trpc.useUtils();
  const { data: users = [], isLoading, refetch } = trpc.admin.listUsers.useQuery();
  const [updatingOpenId, setUpdatingOpenId] = useState<string | null>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>(() => Object.fromEntries(ADMIN_USER_COLUMNS.map((column) => [column.id, true])));
  const toggleColumn = (id: string) => setColumnVisibility((current) => ({ ...current, [id]: current[id] === false }));

  const updateRoleMutation = trpc.admin.updateUserRole.useMutation({
    onSuccess: (data) => {
      setUpdatingOpenId(null);
      toast.success(`Successfully updated user role to ${data.newRole.toUpperCase()}`);
      utils.admin.listUsers.invalidate();
    },
    onError: (err) => {
      setUpdatingOpenId(null);
      toast.error(err.message || "Failed to update user role");
    },
  });

  const handleRoleToggle = (openId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    setUpdatingOpenId(openId);
    updateRoleMutation.mutate({ openId, role: newRole });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#C9A96E]/15 text-[#C9A96E]">
            <Users size={20} />
          </div>
          <div>
            <h3 className="text-[18px] font-bold font-heading text-white">Administrator User Directory & RBAC</h3>
            <p className="text-[13px] text-[#94A3B8]">Manage tenant access roles and administrative privileges securely.</p>
          </div>
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex items-center gap-2 rounded-xl bg-white/5 border border-white/10 px-4 py-2.5 text-[13px] font-semibold text-[#C9A96E] hover:bg-white/10 transition-colors"
        >
          Refresh Directory
        </button>
      </div>

      <div className="rounded-2xl border border-white/10 bg-[#0B1120] overflow-hidden shadow-xl">
        <div className="flex items-center justify-end border-b border-white/10 px-4 py-3">
          <EnterpriseColumnCustomizer columns={ADMIN_USER_COLUMNS} visibility={columnVisibility} onToggle={toggleColumn} onReset={() => setColumnVisibility(Object.fromEntries(ADMIN_USER_COLUMNS.map((column) => [column.id, true])))} />
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-12 text-center text-[13px] text-slate-400">Loading user directory...</div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center text-[13px] text-slate-400">No registered users found.</div>
          ) : (
            <table className="w-full text-left text-[13px]">
              <thead className="bg-[#131C31] text-[#C9A96E] border-b border-white/10 font-medium">
                <tr>
                  {columnVisibility.name !== false && <th className="p-4">User Name</th>}
                  {columnVisibility.email !== false && <th className="p-4">Email</th>}
                  {columnVisibility.openId !== false && <th className="p-4">OpenID</th>}
                  {columnVisibility.role !== false && <th className="p-4">Current Role</th>}
                  {columnVisibility.lastSignedIn !== false && <th className="p-4">Last Signed In</th>}
                  {columnVisibility.actions !== false && <th className="p-4 text-right">Actions</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 text-slate-300">
                {users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {columnVisibility.name !== false && <td className="p-4 font-semibold text-white flex items-center gap-2">
                      <UserCheck size={15} className="text-emerald-400" />
                      {u.name}
                    </td>}
                    {columnVisibility.email !== false && <td className="p-4 text-slate-400">{u.email || "—"}</td>}
                    {columnVisibility.openId !== false && <td className="p-4 font-mono text-[11px] text-slate-500">{u.openId}</td>}
                    {columnVisibility.role !== false && <td className="p-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${u.role === "admin" ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-slate-800 text-slate-300 border border-slate-700"}`}>
                        {u.role === "admin" && <Shield size={12} />}
                        {u.role.toUpperCase()}
                      </span>
                    </td>}
                    {columnVisibility.lastSignedIn !== false && <td className="p-4 text-slate-400 font-mono text-[12px]">
                      {u.lastSignedIn ? new Date(u.lastSignedIn).toLocaleString() : "Never"}
                    </td>}
                    {columnVisibility.actions !== false && <td className="p-4 text-right">
                      <button
                        disabled={updatingOpenId === u.openId}
                        onClick={() => handleRoleToggle(u.openId, u.role)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-white/10 disabled:opacity-50 transition-colors"
                      >
                        {updatingOpenId === u.openId && <Loader2 size={12} className="animate-spin" />}
                        <span>{u.role === "admin" ? "Demote to User" : "Promote to Admin"}</span>
                      </button>
                    </td>}
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
