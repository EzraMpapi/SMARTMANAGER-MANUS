import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, LoaderCircle, RefreshCw, ShieldCheck, Trash2, Users } from "lucide-react";

type WorkspaceMember = {
  user_id: string;
  full_name: string | null;
  email: string | null;
  role: string;
  created_at: string;
};

const MEMBERSHIP_ROLES = ["admin", "manager", "staff", "viewer"] as const;

function memberName(member: WorkspaceMember) {
  return member.full_name?.trim() || member.email || "Workspace member";
}

function roleLabel(role: string) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

export function WorkspaceMembershipManager({ accessToken, currentUserEmail }: { accessToken?: string; currentUserEmail?: string | null }) {
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(Boolean(accessToken));
  const [error, setError] = useState<string | null>(null);
  const [busyMemberId, setBusyMemberId] = useState<string | null>(null);
  const [confirmRemovalId, setConfirmRemovalId] = useState<string | null>(null);

  const rpc = useCallback(async (name: string, params: Record<string, unknown> = {}) => {
    if (!accessToken) throw new Error("A current workspace session is required.");
    const baseUrl = import.meta.env.VITE_SUPABASE_URL || "";
    const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
    const response = await fetch(`${baseUrl}/rest/v1/rpc/${name}`, {
      method: "POST",
      headers: { "content-type": "application/json", apikey: anonKey, authorization: `Bearer ${accessToken}` },
      body: JSON.stringify(params),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload.message || "The workspace membership action was not authorized.");
    return payload;
  }, [accessToken]);

  const loadMembers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);
    try {
      const result = await rpc("list_workspace_members");
      setMembers(Array.isArray(result) ? result : []);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Workspace members could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [accessToken, rpc]);

  useEffect(() => { void loadMembers(); }, [loadMembers]);

  async function updateRole(member: WorkspaceMember, nextRole: string) {
    if (nextRole === member.role) return;
    setBusyMemberId(member.user_id);
    setError(null);
    try {
      await rpc("update_workspace_member_role", { p_member_user_id: member.user_id, p_role: nextRole });
      setMembers((current) => current.map((row) => row.user_id === member.user_id ? { ...row, role: nextRole } : row));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The member role could not be updated.");
    } finally {
      setBusyMemberId(null);
    }
  }

  async function confirmRemoval(member: WorkspaceMember) {
    setBusyMemberId(member.user_id);
    setError(null);
    try {
      await rpc("remove_workspace_member", { p_member_user_id: member.user_id });
      setMembers((current) => current.filter((row) => row.user_id !== member.user_id));
      setConfirmRemovalId(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The member could not be removed.");
    } finally {
      setBusyMemberId(null);
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden" aria-labelledby="workspace-members-heading">
      <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="mt-0.5 grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Users size={19} /></span>
          <div>
            <h2 id="workspace-members-heading" className="text-[15px] font-semibold text-slate-950">Workspace membership</h2>
            <p className="mt-1 max-w-xl text-[12.5px] leading-5 text-slate-500">Manage the members already assigned to this workspace. Roles and removals are verified by the server for the active tenant.</p>
          </div>
        </div>
        <button type="button" onClick={() => void loadMembers()} disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60">
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {error && <div role="alert" className="mx-5 mt-5 flex gap-2 rounded-xl border border-red-100 bg-red-50 p-3 text-[12px] leading-5 text-red-700 sm:mx-6"><AlertTriangle size={15} className="mt-0.5 shrink-0" />{error}</div>}

      {loading ? (
        <div className="flex items-center gap-3 p-6 text-[13px] text-slate-500"><LoaderCircle size={18} className="animate-spin text-emerald-600" />Loading server-authorized workspace members…</div>
      ) : members.length === 0 ? (
        <div className="p-6 text-center"><ShieldCheck size={24} className="mx-auto text-emerald-600" /><p className="mt-3 text-[13px] font-semibold text-slate-800">No members are available</p><p className="mt-1 text-[12px] text-slate-500">Use the secure join-code flow to add a colleague to this workspace.</p></div>
      ) : (
        <div className="divide-y divide-slate-100">
          {members.map((member) => {
            const isOwner = member.role === "owner";
            const isSelf = Boolean(member.email && currentUserEmail && member.email.toLowerCase() === currentUserEmail.toLowerCase());
            const busy = busyMemberId === member.user_id;
            const confirming = confirmRemovalId === member.user_id;
            return <div key={member.user_id} className="p-5 sm:px-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0"><p className="truncate text-[13px] font-semibold text-slate-900">{memberName(member)} {isSelf && <span className="ml-1 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">You</span>}</p><p className="mt-1 truncate text-[11.5px] text-slate-500">{member.email || "Email unavailable"}</p></div>
                <div className="flex items-center gap-2">
                  {isOwner ? <span className="rounded-lg bg-amber-50 px-2.5 py-2 text-[11px] font-semibold text-amber-700">Owner</span> : <select aria-label={`Role for ${memberName(member)}`} value={member.role} disabled={busy || isSelf} onChange={(event) => void updateRole(member, event.target.value)} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-[12px] font-medium text-slate-700 outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400">{MEMBERSHIP_ROLES.map((role) => <option key={role} value={role}>{roleLabel(role)}</option>)}</select>}
                  {!isOwner && !isSelf && !confirming && <button type="button" onClick={() => setConfirmRemovalId(member.user_id)} disabled={busy} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:opacity-50" aria-label={`Remove ${memberName(member)} from the workspace`}><Trash2 size={15} /></button>}
                  {busy && <LoaderCircle size={16} className="animate-spin text-emerald-600" aria-label="Saving membership change" />}
                </div>
              </div>
              {confirming && <div className="mt-3 flex flex-col gap-2 rounded-xl border border-red-100 bg-red-50 p-3 sm:flex-row sm:items-center sm:justify-between"><p className="text-[12px] leading-5 text-red-700">Remove {memberName(member)} from this workspace? Their other workspace memberships are not changed.</p><div className="flex gap-2"><button type="button" onClick={() => setConfirmRemovalId(null)} className="rounded-lg border border-red-100 bg-white px-3 py-1.5 text-[11px] font-semibold text-slate-600">Cancel</button><button type="button" onClick={() => void confirmRemoval(member)} disabled={busy} className="rounded-lg bg-red-600 px-3 py-1.5 text-[11px] font-semibold text-white disabled:opacity-60">Remove member</button></div></div>}
            </div>;
          })}
        </div>
      )}
    </section>
  );
}
