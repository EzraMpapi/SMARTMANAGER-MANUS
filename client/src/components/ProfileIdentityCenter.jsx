import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Building2,
  CalendarDays,
  Check,
  ChevronRight,
  CircleHelp,
  Clock3,
  ImagePlus,
  KeyRound,
  Laptop2,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Pencil,
  Phone,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  UserRoundCheck,
  X,
} from "lucide-react";
import { trpc } from "../lib/trpc";

const TABS = [
  { id: "overview", label: "Overview", icon: UserRoundCheck },
  { id: "personal", label: "Personal", icon: UserRound },
  { id: "work", label: "Work", icon: Building2 },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "preferences", label: "Preferences", icon: Settings2 },
  { id: "activity", label: "Activity", icon: Activity },
];

function initialsFor(value) {
  return String(value || "?").trim().split(/\s+/).map((part) => part[0]).filter(Boolean).slice(0, 2).join("").toUpperCase() || "?";
}

function displayDate(value, withTime = false) {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleString("en-GB", withTime ? { dateStyle: "medium", timeStyle: "short" } : { dateStyle: "medium" });
}

function displayValue(value, empty = "Not assigned") {
  return value === null || value === undefined || value === "" ? empty : String(value);
}

function Avatar({ profile, name, size = "md", preview = null }) {
  const dimensions = size === "xl" ? "h-24 w-24 text-[25px]" : size === "lg" ? "h-16 w-16 text-[18px]" : "h-10 w-10 text-[12px]";
  const image = preview || profile?.avatarUrl;
  return (
    <div className={`${dimensions} relative shrink-0 overflow-hidden rounded-2xl bg-gradient-to-br from-[#0B5D3B] via-[#138A57] to-[#79D39D] font-bold text-white shadow-[0_10px_28px_rgba(11,93,59,.2)]`}>
      {image ? <img src={image} alt={`${name || "Workspace"} profile`} className="h-full w-full object-cover" /> : <span className="grid h-full w-full place-items-center">{initialsFor(name)}</span>}
    </div>
  );
}

function StatusPill({ active }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] ${active ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-slate-200 bg-slate-50 text-slate-500"}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function ActionButton({ icon: Icon, label, description, onClick, tone = "default", disabled = false }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick} className={`group flex min-h-[52px] w-full items-center gap-3 rounded-2xl border px-3.5 py-3 text-left transition active:scale-[.99] disabled:cursor-not-allowed disabled:opacity-50 ${tone === "danger" ? "border-red-100 bg-red-50/50 hover:bg-red-50" : "border-slate-200/80 bg-white hover:border-emerald-200 hover:bg-emerald-50/40"}`}>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${tone === "danger" ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600 group-hover:bg-emerald-100 group-hover:text-emerald-700"}`}><Icon size={16} aria-hidden="true" /></span>
      <span className="min-w-0 flex-1"><span className={`block text-[12px] font-bold ${tone === "danger" ? "text-red-800" : "text-slate-800"}`}>{label}</span>{description && <span className="mt-0.5 block text-[10.5px] leading-4 text-slate-500">{description}</span>}</span>
      {!disabled && <ChevronRight size={15} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-emerald-600" aria-hidden="true" />}
    </button>
  );
}

function Field({ label, value, onChange, type = "text", disabled = false, placeholder = "", readOnly = false, children }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-bold uppercase tracking-[.1em] text-slate-500">{label}</span>
      {children || <input type={type} value={value ?? ""} onChange={(event) => onChange?.(event.target.value)} disabled={disabled} readOnly={readOnly} placeholder={placeholder} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] text-slate-800 outline-none transition placeholder:text-slate-300 focus:border-emerald-400 focus:ring-4 focus:ring-emerald-100/60 disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400" />}
    </label>
  );
}

function SectionHeading({ eyebrow, title, copy, action }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div><p className="text-[10px] font-bold uppercase tracking-[.16em] text-emerald-700">{eyebrow}</p><h2 className="mt-1 text-[20px] font-bold tracking-[-.035em] text-slate-950">{title}</h2>{copy && <p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">{copy}</p>}</div>
      {action}
    </div>
  );
}

function profileFormFrom(profile) {
  return {
    preferredName: profile?.preferredName || "",
    firstName: profile?.firstName || "",
    middleName: profile?.middleName || "",
    lastName: profile?.lastName || "",
    fullName: profile?.fullName || "",
    dateOfBirth: profile?.dateOfBirth || "",
    gender: profile?.gender || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
    country: profile?.country || "Tanzania",
    preferredLanguage: profile?.preferredLanguage || "en",
    currencyDisplay: profile?.currencyDisplay || "TZS",
    timezone: profile?.timezone || "Africa/Dar_es_Salaam",
    dateFormat: profile?.dateFormat || "dd/MM/yyyy",
    theme: profile?.theme || "system",
    notificationPreferences: { email: profile?.notificationPreferences?.email !== false, push: profile?.notificationPreferences?.push !== false, sms: profile?.notificationPreferences?.sms === true },
  };
}

function useProfileIdentity(session, onUpdated) {
  const utils = trpc.useUtils();
  const enabled = Boolean(session?.accessToken && !session?.demo);
  const query = trpc.profileIdentity.get.useQuery(undefined, { enabled, retry: false, staleTime: 30_000, refetchOnWindowFocus: false });
  const update = trpc.profileIdentity.update.useMutation({
    onSuccess: (data) => { utils.profileIdentity.get.setData(undefined, data); onUpdated?.(data); },
  });
  const upload = trpc.profileIdentity.uploadAvatar.useMutation({
    onSuccess: (data) => { utils.profileIdentity.get.setData(undefined, data); onUpdated?.(data); },
  });
  const remove = trpc.profileIdentity.removeAvatar.useMutation({
    onSuccess: (data) => { utils.profileIdentity.get.setData(undefined, data); onUpdated?.(data); },
  });
  return { query, update, upload, remove, enabled };
}

function ProfileMenu({ currentUser, session, company, onSignOut, onNavigate, onOpenPasswordRecovery, roleChangeApprovalsQuery, onProfileUpdated }) {
  const [open, setOpen] = useState(false);
  const onProfileUpdatedRef = useRef(onProfileUpdated);
  onProfileUpdatedRef.current = onProfileUpdated;
  const profileCenter = useProfileIdentity(session, onProfileUpdated);
  const profile = profileCenter.query.data?.profile;
  useEffect(() => { if (profileCenter.query.data) onProfileUpdatedRef.current?.(profileCenter.query.data); }, [profileCenter.query.data?.profile?.updatedAt]);
  const displayName = profile?.preferredName || profile?.fullName || currentUser?.name || "Workspace user";
  const role = profile?.role || currentUser?.role || "Workspace member";
  const pendingApprovals = (roleChangeApprovalsQuery?.data?.approvals || []).filter((row) => row.status === "Pending Review").length;
  const go = (id, options = {}) => { setOpen(false); onNavigate?.(id, options); };
  const active = profile?.isActive !== false;
  return (
    <div className="relative flex items-center gap-2">
      {company && <span className="hidden max-w-36 truncate rounded-full border border-emerald-100 bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-800 sm:inline" title="Current workspace">{company.name || company.category || "Workspace"}</span>}
      <button type="button" onClick={() => setOpen((value) => !value)} className="group flex items-center gap-2 rounded-2xl border border-slate-200/80 bg-white px-1.5 py-1.5 shadow-sm transition hover:border-emerald-200 hover:shadow-md" aria-expanded={open} aria-haspopup="dialog" aria-label="Open account identity center">
        <Avatar profile={profile} name={displayName} size="md" />
        <span className="hidden max-w-28 text-left sm:block"><span className="block truncate text-[11.5px] font-bold text-slate-800">{displayName}</span><span className="block truncate text-[10px] text-slate-400">{role}</span></span>
        <ChevronRight size={14} className={`mr-1 hidden text-slate-300 transition sm:block ${open ? "rotate-90 text-emerald-600" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default bg-slate-950/10" aria-label="Close account identity center" onClick={() => setOpen(false)} />
          <section role="dialog" aria-label="Account identity center" className="absolute right-0 top-full z-40 mt-3 max-h-[calc(100vh-5.5rem)] w-[min(92vw,390px)] overflow-y-auto rounded-[26px] border border-slate-200/80 bg-white p-3 shadow-[0_24px_80px_rgba(15,23,42,.2)]">
            <div className="rounded-[21px] bg-gradient-to-br from-[#0B5D3B] via-[#0E7147] to-[#063B27] p-4 text-white">
              <div className="flex items-start gap-3"><Avatar profile={profile} name={displayName} size="lg" /><div className="min-w-0 flex-1"><div className="flex items-start justify-between gap-2"><div className="min-w-0"><p className="truncate text-[16px] font-bold tracking-[-.025em]">{displayName}</p><p className="mt-0.5 truncate text-[11px] text-emerald-100">{role}</p></div><StatusPill active={active} /></div><p className="mt-2 truncate text-[10.5px] text-emerald-100">{profile?.email || session?.email || currentUser?.email || "Verified workspace account"}</p></div></div>
              <div className="mt-4 grid grid-cols-2 gap-2"><div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[.13em] text-emerald-100">Workspace</p><p className="mt-1 truncate text-[11.5px] font-semibold">{profileCenter.query.data?.company?.name || company?.name || "Current workspace"}</p></div><div className="rounded-2xl border border-white/15 bg-white/10 px-3 py-2"><p className="text-[9px] font-bold uppercase tracking-[.13em] text-emerald-100">Completion</p><p className="mt-1 text-[11.5px] font-semibold">{profileCenter.query.data?.completion?.percentage ?? "—"}{profileCenter.query.data?.completion ? "%" : "Awaiting profile"}</p></div></div>
            </div>
            {(!session || session.demo) && <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-[11px] leading-4 text-amber-900"><AlertCircle size={15} className="mt-0.5 shrink-0" />Demo session — server-backed profile actions are disabled until you sign in.</div>}
            <div className="mt-3 grid gap-1.5"><ActionButton icon={UserRound} label="View My Profile" description="Identity, work details, preferences and activity" onClick={() => go("profile")} /><ActionButton icon={Pencil} label="Edit personal details" description={profileCenter.query.data?.capabilities?.extendedFieldsAvailable ? "Update fields you are authorized to own" : "Available after the identity-center migration is applied"} onClick={() => go("profile", { profileTab: "personal" })} disabled={!profileCenter.query.data?.capabilities?.extendedFieldsAvailable && Boolean(session?.accessToken)} /><ActionButton icon={LockKeyhole} label="Security & access" description="Session verification and secure account recovery" onClick={() => go("profile", { profileTab: "security" })} /><ActionButton icon={Mail} label="Notifications" description="Open the existing workspace notification center" onClick={() => go("notifications")} /><ActionButton icon={Settings2} label="Preferences" description="Personal language, currency, date and display settings" onClick={() => go("profile", { profileTab: "preferences" })} /><ActionButton icon={Activity} label="Activity" description={pendingApprovals ? `${pendingApprovals} pending approval${pendingApprovals === 1 ? "" : "s"} in the workspace` : "Recent account activity returned by the workspace"} onClick={() => go("profile", { profileTab: "activity" })} /></div>
            <div className="my-3 border-t border-slate-100" />
            <div className="grid gap-1.5"><ActionButton icon={Building2} label="Workspace settings" description="Open the existing permission-controlled workspace settings" onClick={() => go("settings")} /><ActionButton icon={KeyRound} label="Password recovery" description="Use the existing verified recovery flow; passwords never appear here" onClick={() => { setOpen(false); onOpenPasswordRecovery?.(); }} disabled={!onOpenPasswordRecovery} /><ActionButton icon={CircleHelp} label="Help & support" description="Open the existing support workspace" onClick={() => go("support")} /><ActionButton icon={ArrowRight} label={session && !session.demo ? "Sign out" : "Exit demo"} description="End this session on this device" onClick={onSignOut} tone="danger" /></div>
            <p className="px-2 pb-1 pt-3 text-[10px] leading-4 text-slate-400">Workspace switching and device/session listing are not enabled by the current backend contract, so no unverified selectors are shown.</p>
          </section>
        </>
      )}
    </div>
  );
}

function IdentityHero({ profile, company, work, completion, security, onTab, onSignOut }) {
  const name = profile?.preferredName || profile?.fullName || "Workspace user";
  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-[#073A27] via-[#0B5D3B] to-[#138A57] p-5 text-white shadow-[0_20px_55px_rgba(11,93,59,.22)] sm:p-7">
      <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full border-[28px] border-white/10" /><div className="pointer-events-none absolute -bottom-28 right-20 h-60 w-60 rounded-full border-[34px] border-emerald-200/10" />
      <div className="relative flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between"><div className="flex min-w-0 items-start gap-4"><Avatar profile={profile} name={name} size="xl" /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><p className="text-[24px] font-bold tracking-[-.045em] sm:text-[30px]">{name}</p><StatusPill active={profile?.isActive !== false} /></div><p className="mt-1 text-[13px] text-emerald-100">{displayValue(profile?.role, "Workspace member")} · {displayValue(work?.assigned ? work.positionId : null, "Role-managed position")}</p><p className="mt-2 max-w-xl text-[11.5px] leading-5 text-emerald-100">{profile?.email || "Verified workspace account"}</p></div></div><button type="button" onClick={onSignOut} className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/20"><ArrowRight size={14} />Sign out</button></div>
      <div className="relative mt-7 grid gap-2 sm:grid-cols-3"><div className="rounded-2xl border border-white/15 bg-white/10 p-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-emerald-100">Current workspace</p><p className="mt-1 truncate text-[12.5px] font-semibold">{company?.name || "Workspace"}</p><p className="mt-0.5 truncate text-[10.5px] text-emerald-100">{company?.category || "Organization account"}</p></div><div className="rounded-2xl border border-white/15 bg-white/10 p-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-emerald-100">Profile completion</p><div className="mt-2 flex items-end justify-between gap-3"><p className="text-[20px] font-bold">{completion?.percentage ?? 0}%</p><p className="text-[10px] text-emerald-100">{completion?.completed ?? 0}/{completion?.total ?? 0} essentials</p></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/15"><div className="h-full rounded-full bg-emerald-200 transition-all" style={{ width: `${completion?.percentage ?? 0}%` }} /></div></div><div className="rounded-2xl border border-white/15 bg-white/10 p-3"><p className="text-[9px] font-bold uppercase tracking-[.14em] text-emerald-100">Last sign-in</p><p className="mt-1 text-[12px] font-semibold">{displayDate(security?.lastLoginAt, true)}</p><p className="mt-0.5 text-[10.5px] text-emerald-100">Returned by the verified auth provider</p></div></div>
      <div className="relative mt-5 flex flex-wrap gap-2">{[{ id: "personal", label: "Edit personal details" }, { id: "security", label: "Review security" }, { id: "preferences", label: "Manage preferences" }].map((item) => <button type="button" key={item.id} onClick={() => onTab(item.id)} className="rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-[11px] font-bold text-white transition hover:bg-white/20">{item.label}</button>)}</div>
    </section>
  );
}

function OverviewTab({ identity, onTab, onNavigate, onSignOut, roleChangeApprovalsQuery }) {
  const pending = (roleChangeApprovalsQuery?.data?.approvals || []).filter((row) => row.status === "Pending Review");
  const { profile, company, work, security, completion } = identity;
  return <div className="space-y-5"><IdentityHero profile={profile} company={company} work={work} completion={completion} security={security} onTab={onTab} onSignOut={onSignOut} /><div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(300px,.65fr)]"><section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><SectionHeading eyebrow="Workspace identity" title="Your operating context" copy="These fields are sourced from the verified workspace profile and HR linkage. They are not self-assigned in the browser." /><div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoItem icon={Building2} label="Company" value={company?.name} /><InfoItem icon={MapPin} label="Region" value={company?.region || company?.country} /><InfoItem icon={ShieldCheck} label="Role" value={profile?.role} /><InfoItem icon={UserRoundCheck} label="Account status" value={profile?.status} /></div><div className="mt-5 rounded-2xl border border-emerald-100 bg-emerald-50/60 p-4"><div className="flex items-start gap-3"><Sparkles size={17} className="mt-0.5 shrink-0 text-emerald-700" /><div><p className="text-[12px] font-bold text-emerald-900">Profile completion guidance</p><p className="mt-1 text-[11px] leading-5 text-emerald-800">Add a phone number, country, timezone and profile photo to make your account easier to identify across workspace workflows.</p><button type="button" onClick={() => onTab("personal")} className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 hover:underline">Complete personal details <ArrowRight size={12} /></button></div></div></div></section><div className="space-y-5"><section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm"><SectionHeading eyebrow="Approvals" title="Pending approvals" /><div className="mt-4 flex items-end justify-between gap-4"><p className="text-[34px] font-bold tracking-[-.05em] text-slate-950">{pending.length}</p><p className="max-w-[170px] text-right text-[11px] leading-4 text-slate-500">{pending.length ? "Server-backed requests awaiting an authorized decision." : "No pending role-change approvals were returned for this account."}</p></div>{pending.length > 0 && <button type="button" onClick={() => onNavigate?.("settings")} className="mt-4 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline">Open approval controls <ArrowRight size={12} /></button>}</section><section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm"><SectionHeading eyebrow="Security posture" title="Current session" /><div className="mt-4 flex items-start gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-100 text-emerald-700"><ShieldCheck size={17} /></span><div><p className="text-[12px] font-bold text-slate-800">{security?.currentSessionVerified ? "Verified by the workspace auth provider" : "Verification unavailable"}</p><p className="mt-1 text-[10.5px] leading-4 text-slate-500">Last login: {displayDate(security?.lastLoginAt, true)}</p></div></div></section></div></div></div>;
}

function InfoItem({ icon: Icon, label, value }) { return <div className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><span className="grid h-8 w-8 place-items-center rounded-xl bg-white text-slate-500 shadow-sm"><Icon size={15} /></span><div className="min-w-0"><p className="text-[9.5px] font-bold uppercase tracking-[.1em] text-slate-400">{label}</p><p className="mt-1 truncate text-[12px] font-semibold text-slate-800">{displayValue(value)}</p></div></div>; }

function PersonalTab({ profile, update, upload, remove, onSaved }) {
  const editable = Boolean(profile?.extendedFieldsAvailable);
  const [form, setForm] = useState(() => profileFormFrom(profile));
  const [notice, setNotice] = useState(null);
  const [avatarDraft, setAvatarDraft] = useState(null);
  const fileRef = useRef(null);
  useEffect(() => { setForm(profileFormFrom(profile)); }, [profile?.updatedAt, profile?.id]);
  function setField(field, value) { setForm((previous) => ({ ...previous, [field]: value })); setNotice(null); }
  function selectFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!["image/png", "image/jpeg", "image/webp"].includes(file.type)) { setNotice({ type: "error", text: "Choose a PNG, JPEG, or WebP image." }); return; }
    if (file.size > 2 * 1024 * 1024) { setNotice({ type: "error", text: "Your profile photo must be under 2 MB." }); return; }
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const side = Math.min(image.naturalWidth, image.naturalHeight);
        const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 512;
        const context = canvas.getContext("2d");
        if (!context) { setNotice({ type: "error", text: "Your browser could not prepare this image." }); return; }
        context.drawImage(image, (image.naturalWidth - side) / 2, (image.naturalHeight - side) / 2, side, side, 0, 0, 512, 512);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.9);
        setAvatarDraft({ mimeType: "image/jpeg", base64: dataUrl.split(",")[1], preview: dataUrl });
        setNotice({ type: "info", text: "A centered square preview is ready. Save photo to upload it securely." });
      };
      image.onerror = () => setNotice({ type: "error", text: "The selected image could not be decoded." });
      image.src = String(reader.result);
    };
    reader.onerror = () => setNotice({ type: "error", text: "The selected file could not be read." });
    reader.readAsDataURL(file);
  }
  async function saveProfile(event) {
    event.preventDefault();
    setNotice(null);
    if (!editable) { setNotice({ type: "error", text: "Profile self-service fields are awaiting the controlled identity-center migration." }); return; }
    try { await update.mutateAsync(form); if (avatarDraft?.remove) await remove.mutateAsync(); else if (avatarDraft) await upload.mutateAsync({ mimeType: avatarDraft.mimeType, base64: avatarDraft.base64 }); setNotice({ type: "success", text: "Your profile changes were confirmed by the workspace." }); onSaved?.(); } catch (error) { setNotice({ type: "error", text: error?.message || "Your profile could not be saved." }); }
  }
  return <form onSubmit={saveProfile} className="space-y-5"><SectionHeading eyebrow="Personal identity" title="Your details" copy="Edit only the personal fields owned by this account. Email, role, company and work assignment remain read-only and are managed by verified workspace systems." action={<span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500">{editable ? "Server-backed" : "Migration pending"}</span>} />{!editable && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-5 text-amber-900"><AlertCircle size={16} className="mt-0.5 shrink-0" /><span>The profile schema extension is source-ready but not live in this environment. Fields are intentionally disabled so the UI never reports a local-only save.</span></div>}<div className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Avatar profile={profile} name={profile?.fullName} size="lg" preview={avatarDraft?.preview} /><div><p className="text-[13px] font-bold text-slate-800">Identity photo</p><p className="mt-1 max-w-sm text-[11px] leading-4 text-slate-500">PNG, JPEG or WebP, up to 2 MB. The browser prepares a centered square preview before secure server upload.</p></div></div><div className="flex flex-wrap gap-2"><input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" onChange={selectFile} className="hidden" disabled={!editable} /><button type="button" disabled={!editable} onClick={() => fileRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:opacity-50"><ImagePlus size={14} />Choose photo</button>{profile?.avatarUrl && <button type="button" disabled={!editable} onClick={() => { setAvatarDraft({ remove: true }); setNotice({ type: "info", text: "Photo removal is queued. Save changes to confirm it on the server." }); }} className="inline-flex items-center gap-2 rounded-xl border border-red-100 px-3 py-2 text-[11px] font-bold text-red-700 transition hover:bg-red-50 disabled:opacity-50"><Trash2 size={14} />Remove</button>}</div></div>{avatarDraft?.remove && <p className="mt-3 rounded-xl bg-red-50 px-3 py-2 text-[11px] font-semibold text-red-800">The current photo will be removed when you save. The storage object is left unreferenced according to the storage contract.</p>}</div><div className="grid gap-4 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:grid-cols-2 sm:p-6"><Field label="Preferred name" value={form.preferredName} onChange={(value) => setField("preferredName", value)} disabled={!editable} placeholder="How colleagues should address you" /><Field label="Legal / full name" value={form.fullName} onChange={(value) => setField("fullName", value)} disabled={!editable} /><Field label="First name" value={form.firstName} onChange={(value) => setField("firstName", value)} disabled={!editable} /><Field label="Middle name" value={form.middleName} onChange={(value) => setField("middleName", value)} disabled={!editable} /><Field label="Last name" value={form.lastName} onChange={(value) => setField("lastName", value)} disabled={!editable} /><Field label="Email" value={profile?.email || ""} readOnly /><Field label="Phone" value={form.phone} onChange={(value) => setField("phone", value)} disabled={!editable} placeholder="e.g. +255 7xx xxx xxx" /><Field label="Date of birth" type="date" value={form.dateOfBirth} onChange={(value) => setField("dateOfBirth", value)} disabled={!editable} /><Field label="Gender" value={form.gender} onChange={(value) => setField("gender", value)} disabled={!editable} placeholder="Optional" /><Field label="Country" value={form.country} onChange={(value) => setField("country", value)} disabled={!editable} /><div className="sm:col-span-2"><Field label="Address" value={form.address} onChange={(value) => setField("address", value)} disabled={!editable} placeholder="Optional mailing address" /></div></div>{notice && <div role={notice.type === "error" ? "alert" : "status"} className={`rounded-2xl px-4 py-3 text-[11.5px] leading-5 ${notice.type === "error" ? "border border-red-200 bg-red-50 text-red-800" : notice.type === "success" ? "border border-emerald-200 bg-emerald-50 text-emerald-800" : "border border-sky-200 bg-sky-50 text-sky-800"}`}>{notice.text}</div>}<div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="submit" disabled={!editable || update.isPending || upload.isPending || remove.isPending} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#0B5D3B] px-5 text-[12px] font-bold text-white transition hover:bg-[#084B30] disabled:cursor-not-allowed disabled:opacity-50">{update.isPending || upload.isPending || remove.isPending ? <><RefreshCw size={14} className="animate-spin" />Saving…</> : <><Check size={14} />Save personal details</>}</button></div></form>;
}

function WorkTab({ identity }) {
  const { profile, company, work } = identity;
  return <div className="space-y-5"><SectionHeading eyebrow="Read-only assignment" title="Work identity" copy="Role, company and work assignment are returned from verified workspace and HR records. They cannot be changed from this self-service center." /><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><Building2 size={18} className="mt-0.5 text-emerald-700" /><div><p className="text-[13px] font-bold text-slate-800">Workspace and permissions</p><p className="mt-1 text-[11px] leading-5 text-slate-500">These values are authoritative for navigation and access decisions.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoItem icon={Building2} label="Company" value={company?.name} /><InfoItem icon={ShieldCheck} label="Role" value={profile?.role} /><InfoItem icon={MapPin} label="Region / country" value={company?.region || company?.country} /><InfoItem icon={Clock3} label="Profile timezone" value={profile?.timezone} /></div></section><section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><UserRoundCheck size={18} className="mt-0.5 text-emerald-700" /><div><p className="text-[13px] font-bold text-slate-800">HR assignment</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Only an HR-linked employee record can populate these fields.</p></div></div>{work?.assigned ? <div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoItem icon={UserRound} label="Employee number" value={work.employeeNumber} /><InfoItem icon={Building2} label="Department ID" value={work.departmentId} /><InfoItem icon={Sparkles} label="Position ID" value={work.positionId} /><InfoItem icon={CalendarDays} label="Employment start" value={work.employmentStartDate} /><InfoItem icon={ShieldCheck} label="Assignment status" value={work.status} /><InfoItem icon={Clock3} label="HR timezone" value={work.timezone} /></div> : <div className="mt-5 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-[11px] leading-5 text-slate-500">No HR employee record is assigned to this verified profile. Branch, department, title and manager are therefore shown as not assigned rather than inferred.</div>}</section></div></div>;
}

function SecurityTab({ identity, onNavigate, onOpenPasswordRecovery }) {
  const security = identity.security;
  return <div className="space-y-5"><SectionHeading eyebrow="Account protection" title="Security and access" copy="Sensitive credentials and session tokens are never displayed here. The controls below link to verified authentication and existing workspace security surfaces." /><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-[24px] border border-emerald-100 bg-emerald-50/50 p-5 sm:p-6"><div className="flex items-start gap-3"><ShieldCheck size={20} className="mt-0.5 text-emerald-700" /><div><p className="text-[13px] font-bold text-emerald-950">Current session verified</p><p className="mt-1 text-[11px] leading-5 text-emerald-900">The server verified this account against the current auth-provider session and workspace profile.</p></div></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><InfoItem icon={Clock3} label="Last sign-in" value={displayDate(security?.lastLoginAt, true)} /><InfoItem icon={Laptop2} label="Session details" value={security?.sessionDeviceDetailsAvailable ? "Available" : "Not exposed"} /></div></section><section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><p className="text-[13px] font-bold text-slate-800">Recovery and security actions</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Password values are handled only by the authentication provider. Active device/session listing is not exposed by the current backend contract.</p><div className="mt-4 grid gap-2"><button type="button" onClick={onOpenPasswordRecovery} disabled={!onOpenPasswordRecovery} className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-200 px-3.5 text-[11.5px] font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-50"><span className="inline-flex items-center gap-2"><KeyRound size={15} />Start password recovery</span><ArrowRight size={14} /></button><button type="button" onClick={() => onNavigate?.("settings")} className="inline-flex min-h-11 items-center justify-between rounded-xl border border-slate-200 px-3.5 text-[11.5px] font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50"><span className="inline-flex items-center gap-2"><Settings2 size={15} />Open existing security settings</span><ArrowRight size={14} /></button></div></section></div><div className="rounded-2xl border border-slate-200/80 bg-white p-4 text-[11px] leading-5 text-slate-500"><span className="font-bold text-slate-700">Truthful limitation:</span> {security?.note || "Device-level session detail is not exposed by this application."}</div></div>;
}

function PreferencesTab({ profile, update, onThemeChange }) {
  const editable = Boolean(profile?.extendedFieldsAvailable);
  const [form, setForm] = useState(() => profileFormFrom(profile));
  const [notice, setNotice] = useState(null);
  useEffect(() => { setForm(profileFormFrom(profile)); }, [profile?.updatedAt, profile?.id]);
  function setField(field, value) { setForm((previous) => ({ ...previous, [field]: value })); setNotice(null); }
  async function save(event) { event.preventDefault(); if (!editable) { setNotice("Preferences are awaiting the controlled identity-center migration."); return; } try { await update.mutateAsync({ preferredLanguage: form.preferredLanguage, currencyDisplay: form.currencyDisplay, timezone: form.timezone, dateFormat: form.dateFormat, theme: form.theme, notificationPreferences: form.notificationPreferences }); onThemeChange?.(form.theme); setNotice("Preferences were confirmed by the workspace database."); } catch (error) { setNotice(error?.message || "Preferences could not be saved."); } }
  const toggle = (field) => setField("notificationPreferences", { ...form.notificationPreferences, [field]: !form.notificationPreferences[field] });
  return <form onSubmit={save} className="space-y-5"><SectionHeading eyebrow="Personal settings" title="Preferences" copy="These preferences are stored on the authenticated profile when the identity-center schema is available. They are not browser-only settings." /><div className="grid gap-5 lg:grid-cols-2"><section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><p className="text-[13px] font-bold text-slate-800">Display and localisation</p><div className="mt-4 grid gap-4"><Field label="Language" value={form.preferredLanguage} onChange={(value) => setField("preferredLanguage", value)} disabled={!editable} /><Field label="Currency" value={form.currencyDisplay} onChange={(value) => setField("currencyDisplay", value.toUpperCase())} disabled={!editable} /><Field label="Timezone" value={form.timezone} onChange={(value) => setField("timezone", value)} disabled={!editable} /><Field label="Date format" value={form.dateFormat} onChange={(value) => setField("dateFormat", value)} disabled={!editable}><select value={form.dateFormat} onChange={(event) => setField("dateFormat", event.target.value)} disabled={!editable} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] text-slate-800 outline-none focus:border-emerald-400 disabled:bg-slate-50"><option value="dd/MM/yyyy">dd/MM/yyyy</option><option value="MM/dd/yyyy">MM/dd/yyyy</option><option value="yyyy-MM-dd">yyyy-MM-dd</option></select></Field><Field label="Theme" value={form.theme} onChange={(value) => setField("theme", value)} disabled={!editable}><select value={form.theme} onChange={(event) => setField("theme", event.target.value)} disabled={!editable} className="h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[12.5px] text-slate-800 outline-none focus:border-emerald-400 disabled:bg-slate-50"><option value="system">System</option><option value="light">Light</option><option value="dark">Dark</option></select></Field></div></section><section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-sm sm:p-6"><p className="text-[13px] font-bold text-slate-800">Notification channels</p><p className="mt-1 text-[11px] leading-5 text-slate-500">Only channels represented in the profile contract are shown.</p><div className="mt-4 grid gap-2">{[{ id: "email", label: "Email notifications", copy: "Workspace messages and account notices" }, { id: "push", label: "Push notifications", copy: "Browser or device alerts when configured" }, { id: "sms", label: "SMS notifications", copy: "Only when a supported workflow delivers SMS" }].map((item) => <label key={item.id} className="flex cursor-pointer items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><input type="checkbox" checked={Boolean(form.notificationPreferences[item.id])} onChange={() => toggle(item.id)} disabled={!editable} className="h-4 w-4 accent-emerald-700" /><span><span className="block text-[12px] font-bold text-slate-800">{item.label}</span><span className="mt-0.5 block text-[10.5px] text-slate-500">{item.copy}</span></span></label>)}</div></section></div>{notice && <div role="status" className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-[11.5px] text-slate-700">{notice}</div>}<div className="flex justify-end"><button type="submit" disabled={!editable || update.isPending} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-[#0B5D3B] px-5 text-[12px] font-bold text-white transition hover:bg-[#084B30] disabled:opacity-50">{update.isPending ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}Save preferences</button></div></form>;
}

function ActivityTab({ identity, onNavigate }) {
  const items = identity.activity || [];
  return <div className="space-y-5"><SectionHeading eyebrow="Server-returned history" title="Activity" copy="This timeline is limited to activity records returned for the authenticated profile. No browser-only events are fabricated." action={<button type="button" onClick={() => onNavigate?.("notifications")} className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><Mail size={14} />Open notifications</button>} /><section className="overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-sm">{items.length === 0 ? <div className="p-8 text-center"><Activity size={25} className="mx-auto text-slate-300" /><p className="mt-3 text-[13px] font-bold text-slate-700">No activity records returned</p><p className="mx-auto mt-1 max-w-md text-[11px] leading-5 text-slate-500">The current workspace backend did not return profile notifications for this account. This is intentionally shown as unavailable rather than replaced with sample events.</p></div> : <div className="divide-y divide-slate-100">{items.map((item) => <div key={item.id || `${item.createdAt}-${item.title}`} className="flex gap-3 p-4 sm:p-5"><span className="mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700"><Activity size={15} /></span><div className="min-w-0 flex-1"><div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"><p className="text-[12px] font-bold text-slate-800">{displayValue(item.title, "Workspace notification")}</p><p className="text-[10px] text-slate-400">{displayDate(item.createdAt, true)}</p></div><p className="mt-1 text-[11px] leading-5 text-slate-500">{displayValue(item.body, "No message supplied")}</p></div>{item.readAt ? <Check size={14} className="mt-1 shrink-0 text-emerald-600" aria-label="Read" /> : <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" aria-label="Unread" />}</div>)}</div>}</section></div>;
}

export function ProfileIdentityPage({ currentUser, session, company, onNavigate, onSignOut, onOpenPasswordRecovery, onThemeChange, roleChangeApprovalsQuery, initialTab = "overview" }) {
  const [tab, setTab] = useState(TABS.some((item) => item.id === initialTab) ? initialTab : "overview");
  const profileCenter = useProfileIdentity(session, (data) => { if (data?.profile?.fullName) onThemeChange?.(data.profile.theme); });
  const identity = profileCenter.query.data;
  useEffect(() => { if (TABS.some((item) => item.id === initialTab)) setTab(initialTab); }, [initialTab]);
  const safeIdentity = identity || { profile: { id: currentUser?.id, fullName: currentUser?.name, email: session?.email || currentUser?.email, role: currentUser?.role, isActive: true, extendedFieldsAvailable: false, status: "Unknown" }, company: company || null, work: { assigned: false }, security: { currentSessionVerified: false, sessionDeviceDetailsAvailable: false, passwordChangeAvailable: false }, completion: { completed: 0, total: 0, percentage: 0 }, activity: [] };
  const loading = profileCenter.enabled && profileCenter.query.isLoading;
  const title = safeIdentity.profile?.preferredName || safeIdentity.profile?.fullName || currentUser?.name || "Workspace user";
  return <div className="min-h-full bg-transparent pb-8"><div className="mx-auto max-w-[1440px] px-3 py-4 sm:px-6 sm:py-7 lg:px-8"><div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">Account identity center</p><h1 className="mt-1 text-[26px] font-bold tracking-[-.05em] text-slate-950 sm:text-[34px]">My Profile</h1><p className="mt-1 max-w-2xl text-[12px] leading-5 text-slate-500">A secure, personal view of {title}'s workspace identity, preferences and verified account context.</p></div>{loading && <span className="inline-flex items-center gap-2 text-[11px] font-semibold text-slate-400"><RefreshCw size={14} className="animate-spin" />Refreshing identity…</span>}</div><div className="grid gap-5 lg:grid-cols-[230px_minmax(0,1fr)]"><aside className="h-fit rounded-[24px] border border-slate-200/80 bg-white p-2 shadow-sm lg:sticky lg:top-5"><div className="mb-2 rounded-2xl bg-slate-50 p-3"><div className="flex items-center gap-3"><Avatar profile={safeIdentity.profile} name={title} size="md" /><div className="min-w-0"><p className="truncate text-[12px] font-bold text-slate-800">{title}</p><p className="truncate text-[10px] text-slate-500">{safeIdentity.profile?.role || "Workspace member"}</p></div></div></div><nav aria-label="Profile sections" className="grid grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-1">{TABS.map((item) => { const Icon = item.icon; const selected = tab === item.id; return <button type="button" key={item.id} onClick={() => setTab(item.id)} aria-current={selected ? "page" : undefined} className={`flex min-h-10 items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px] font-bold transition ${selected ? "bg-emerald-50 text-emerald-800" : "text-slate-500 hover:bg-slate-50 hover:text-slate-800"}`}><Icon size={15} /><span>{item.label}</span></button>; })}</nav><div className="mt-2 hidden border-t border-slate-100 pt-2 lg:block"><button type="button" onClick={() => onNavigate?.("settings")} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px] font-bold text-slate-500 hover:bg-slate-50 hover:text-slate-800"><Settings2 size={15} />Workspace settings</button><button type="button" onClick={onSignOut} className="flex min-h-10 w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[11px] font-bold text-red-700 hover:bg-red-50"><ArrowRight size={15} />Sign out</button></div></aside><main className="min-w-0">{profileCenter.query.error && <div role="alert" className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-[11px] leading-5 text-amber-900"><AlertCircle size={16} className="mt-0.5 shrink-0" /><span>Identity details could not be refreshed from the server. Existing header identity remains visible, but edits stay disabled until the verified profile can be read.</span></div>}{tab === "overview" && <OverviewTab identity={safeIdentity} onTab={setTab} onNavigate={onNavigate} onSignOut={onSignOut} roleChangeApprovalsQuery={roleChangeApprovalsQuery} />}{tab === "personal" && <PersonalTab profile={safeIdentity.profile} update={profileCenter.update} upload={profileCenter.upload} remove={profileCenter.remove} onSaved={() => profileCenter.query.refetch()} />}{tab === "work" && <WorkTab identity={safeIdentity} />}{tab === "security" && <SecurityTab identity={safeIdentity} onNavigate={onNavigate} onOpenPasswordRecovery={onOpenPasswordRecovery} />}{tab === "preferences" && <PreferencesTab profile={safeIdentity.profile} update={profileCenter.update} onThemeChange={onThemeChange} />}{tab === "activity" && <ActivityTab identity={safeIdentity} onNavigate={onNavigate} />}</main></div></div></div>;
}

export { ProfileMenu };
