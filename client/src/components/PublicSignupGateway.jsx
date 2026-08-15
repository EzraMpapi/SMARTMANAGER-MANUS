import React, { useMemo, useState } from "react";
import { AlertCircle, Check, CheckCircle2, Eye, EyeOff, Globe2, KeyRound, Mail, MapPin, UserRound, UsersRound } from "lucide-react";
import { trpc } from "../lib/trpc";
import { BrandLogo } from "./BrandLogo";
import { AuthModuleShowcase } from "./AuthModuleShowcase";
import { useLanguage } from "../contexts/LanguageContext";
import { companyDefaultsForCountry, getPasswordChecks, isEnterprisePassword } from "../lib/authOnboarding";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";
const ACCESS_TOKEN_KEY = "bs_access_token";
const REFRESH_TOKEN_KEY = "bs_refresh_token";
const COUNTRIES = ["Tanzania", "Kenya", "Uganda", "Rwanda", "Zambia", "Other"];
const CATEGORIES = ["Retail & Wholesale", "Professional Services", "Manufacturing", "Hospitality", "Healthcare", "Education", "Other"];
const MODULES = [
  { id: "sales", label: "Sales & POS" },
  { id: "inventory", label: "Inventory" },
  { id: "finance", label: "Finance" },
  { id: "crm", label: "CRM" },
  { id: "hr", label: "HR & Payroll" },
  { id: "procurement", label: "Procurement" },
  { id: "projects", label: "Projects" },
  { id: "reports", label: "Reports" },
];

function persistSession(result) {
  if (!result?.access_token) return;
  localStorage.setItem(ACCESS_TOKEN_KEY, result.access_token);
  if (result.refresh_token) localStorage.setItem(REFRESH_TOKEN_KEY, result.refresh_token);
}

function clearSession() {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

async function supabaseRequest(path, token, init = {}) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });
  const body = await response.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { /* response may be empty */ }
  if (!response.ok) throw new Error(data?.message || data?.hint || "Workspace setup could not be saved.");
  return data;
}

async function callRpc(name, params, token) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.message || data?.error_description || `${name} failed.`);
  return data;
}

export default function PublicSignupGateway({ onBack }) {
  const { lang, setLang } = useLanguage();
  const [mode, setMode] = useState("create");
  const [step, setStep] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [account, setAccount] = useState({ fullName: "", email: "", password: "", confirmPassword: "" });
  const [workspace, setWorkspace] = useState({ name: "", category: CATEGORIES[0], country: COUNTRIES[0], currency: "TZS", website: "", taxId: "", firstBranch: "" });
  const [join, setJoin] = useState({ code: "", role: "Employee", customerRef: "" });
  const [selectedModules, setSelectedModules] = useState(() => new Set(MODULES.map((module) => module.id)));
  const accountMutation = trpc.accountRegistration.createConfirmedPasswordAccount.useMutation();
  const brandingMutation = trpc.workspaceBranding.save.useMutation();
  const passwordChecks = useMemo(() => getPasswordChecks(account.password), [account.password]);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(account.email.trim());
  const accountValid = account.fullName.trim().length > 1 && emailValid && isEnterprisePassword(account.password) && account.password === account.confirmPassword;
  const workspaceValid = workspace.name.trim().length > 1;
  const joinValid = join.code.trim().length >= 6;
  const totalSteps = mode === "create" ? 3 : 2;

  const updateAccount = (key, value) => setAccount((current) => ({ ...current, [key]: value }));
  const updateWorkspace = (key, value) => setWorkspace((current) => key === "country" ? { ...current, country: value, ...companyDefaultsForCountry(value) } : { ...current, [key]: value });
  const toggleModule = (id) => setSelectedModules((current) => {
    const next = new Set(current);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  function selectMode(nextMode) {
    setMode(nextMode);
    setStep(1);
    setError("");
  }

  function nextStep(event) {
    event.preventDefault();
    setError("");
    if (step === 1 && !accountValid) {
      setError("Enter your name, a valid work email, and a matching enterprise password.");
      return;
    }
    if (mode === "create" && step === 2 && !workspaceValid) {
      setError("Enter your company name to continue.");
      return;
    }
    if (mode === "join" && step === 2 && !joinValid) {
      setError("Enter the workspace join code provided by your administrator.");
      return;
    }
    if (step < totalSteps) setStep((current) => current + 1);
    else submit();
  }

  async function submit() {
    if (busy) return;
    setBusy(true);
    setError("");
    let accountCreated = false;
    try {
      const result = await accountMutation.mutateAsync({ email: account.email.trim(), password: account.password });
      accountCreated = true;
      persistSession(result);
      const token = result.access_token;
      const company = mode === "create"
        ? await callRpc("create_company_and_owner", { p_name: workspace.name.trim(), p_industry: workspace.category, p_country: workspace.country, p_currency: workspace.currency, p_full_name: account.fullName.trim() }, token)
        : await callRpc("join_company_with_code", { p_join_code: join.code.trim(), p_full_name: account.fullName.trim(), p_role: join.role, p_customer_ref: join.customerRef.trim() || null }, token);
      if (!company?.id) throw new Error("Workspace creation did not return a confirmed company record.");

      const warnings = [];
      if (mode === "create") {
        try {
          await supabaseRequest(`companies?id=eq.${encodeURIComponent(company.id)}`, token, { method: "PATCH", body: JSON.stringify({ website: workspace.website || null, tax_id: workspace.taxId || null, business_scale: "large", timezone: companyDefaultsForCountry(workspace.country).timezone }) });
          await supabaseRequest("company_modules", token, { method: "POST", body: JSON.stringify([...selectedModules].map((id) => ({ company_id: company.id, name: id, status: "active", data: { module_key: id, enabled: true } }))) });
          await supabaseRequest("branches", token, { method: "POST", body: JSON.stringify({ company_id: company.id, name: workspace.firstBranch.trim() || "Head Office", is_headquarters: true }) });
        } catch (setupError) {
          warnings.push(setupError.message || "Some optional workspace details could not be saved.");
        }
        try {
          await brandingMutation.mutateAsync({ primaryColor: "#0B5D3B", accentColor: "#16A34A" });
        } catch (brandingError) {
          warnings.push(brandingError.message || "Workspace branding can be completed later in Settings.");
        }
      }
      clearSession();
      setSuccess({ email: result.user?.email || account.email, name: company.name || workspace.name, warnings });
    } catch (submissionError) {
      clearSession();
      setError(accountCreated ? "Your account was created, but workspace setup could not complete. Please sign in to continue setup." : submissionError.message || "Could not complete account creation. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-[#F4F7F6] px-5 py-8 sm:px-8" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
        <div className="mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-md items-center justify-center">
          <section className="w-full rounded-[24px] border border-emerald-100 bg-white p-7 text-center shadow-[0_20px_60px_rgba(15,23,42,.1)] sm:p-9">
            <BrandLogo variant="full" priority className="mx-auto mb-7 w-[clamp(170px,60vw,235px)] h-auto" />
            <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><CheckCircle2 size={30} /></div>
            <p className="mt-6 text-[10px] font-bold uppercase tracking-[.17em] text-emerald-700">Account created</p>
            <h1 className="mt-2 text-[25px] font-bold tracking-[-.04em] text-slate-950" style={{ fontFamily: "Poppins, sans-serif" }}>Congratulations — you’re ready.</h1>
            <p className="mx-auto mt-3 max-w-sm text-[13.5px] leading-6 text-slate-500">Your Smart Manager account and {success.name} workspace are ready. Sign in with {success.email} to continue.</p>
            {success.warnings.map((warning) => <p key={warning} role="alert" className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-left text-[11.5px] leading-5 text-amber-800">{warning}</p>)}
            <button type="button" onClick={onBack} className="mt-7 min-h-11 w-full rounded-xl bg-[#0B5D3B] py-3.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#084B30]">Continue to sign in</button>
          </section>
        </div>
      </div>
    );
  }

  const labels = lang === "sw" ? { create: "Tengeneza kampuni", join: "Jiunge kwa msimbo", account: "Akaunti", workspace: "Kampuni", modules: "Moduli", continue: "Endelea", back: "Rudi kwenye kuingia" } : { create: "Create company", join: "Join with code", account: "Account", workspace: "Workspace", modules: "Modules", continue: "Continue", back: "Back to sign in" };
  const progressLabels = mode === "create" ? [labels.account, labels.workspace, labels.modules] : [labels.account, labels.workspace];

  return (
    <div className="min-h-screen w-full lg:flex" style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
      <aside className="relative hidden min-h-screen overflow-hidden bg-[#0B2D22] p-10 lg:flex lg:w-[45%] lg:flex-col lg:justify-between xl:p-12">
        <div className="relative z-10"><BrandLogo variant="full" priority className="w-[clamp(170px,20vw,270px)] h-auto" /><AuthModuleShowcase /><h2 className="mt-8 max-w-md text-[34px] font-bold leading-tight text-white" style={{ fontFamily: "Poppins, sans-serif" }}>Start managing your business the smart way</h2><p className="mt-4 max-w-md text-[14px] leading-6 text-white/65">Set up in minutes. Everything from sales to tax, payroll, and AI insights — ready on day one.</p></div>
        <p className="relative z-10 text-[11px] text-white/40">© {new Date().getFullYear()} Smart Manager · Enterprise Business Ecosystem</p>
      </aside>
      <main className="flex min-h-screen flex-1 items-center justify-center overflow-y-auto bg-[#F8FAFC] px-5 py-7 sm:px-8 lg:px-12">
        <div className="w-full max-w-md">
          <div className="mb-5 flex flex-col items-center lg:hidden"><BrandLogo variant="full" priority className="w-[clamp(150px,56vw,220px)] h-auto" /><AuthModuleShowcase compact /></div>
          <div className="mb-5 flex items-center gap-1 rounded-xl bg-slate-100 p-1"><button type="button" onClick={() => selectMode("create")} className={`min-h-11 flex-1 rounded-lg px-3 text-[12px] font-semibold transition ${mode === "create" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>🏢 {labels.create}</button><button type="button" onClick={() => selectMode("join")} className={`min-h-11 flex-1 rounded-lg px-3 text-[12px] font-semibold transition ${mode === "join" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"}`}>🔑 {labels.join}</button></div>
          <div className="mb-5 flex items-center gap-2">{progressLabels.map((label, index) => <React.Fragment key={label}><div className="flex items-center gap-2"><span className={`grid h-7 w-7 place-items-center rounded-full text-[11px] font-bold ${step > index ? "bg-emerald-600 text-white" : step === index + 1 ? "bg-emerald-600 text-white" : "bg-slate-200 text-slate-500"}`}>{step > index + 1 ? <Check size={13} /> : index + 1}</span><span className={`text-[11px] font-semibold ${step === index + 1 ? "text-slate-900" : "text-slate-400"}`}>{label}</span></div>{index < progressLabels.length - 1 && <div className={`h-px flex-1 ${step > index + 1 ? "bg-emerald-500" : "bg-slate-200"}`} />}</React.Fragment>)}</div>
          <section className="rounded-[22px] border border-slate-200/80 bg-white p-6 shadow-[0_18px_50px_rgba(15,23,42,.08)] sm:p-8">
            {error && <div role="alert" className="mb-5 flex items-start gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-[12.5px] text-red-700"><AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span></div>}
            {step === 1 && <form onSubmit={nextStep} className="space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-emerald-700">Smart Manager workspace</p><h1 className="mt-2 text-[24px] font-bold tracking-[-.04em] text-slate-950" style={{ fontFamily: "Poppins, sans-serif" }}>{lang === "sw" ? "Karibu Smart Manager" : "Create your account"}</h1><p className="mt-2 text-[13px] leading-5 text-slate-500">{lang === "sw" ? "Anza kusimamia biashara yako kwa usalama." : "Start with a secure account for your business workspace."}</p></div><label className="block text-[12px] font-semibold text-slate-700">Full name<input required autoComplete="name" value={account.fullName} onChange={(event) => updateAccount("fullName", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-4 text-[13.5px] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="Your full name" /></label><label className="block text-[12px] font-semibold text-slate-700">Work email<input required type="email" autoComplete="email" value={account.email} onChange={(event) => updateAccount("email", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-4 text-[13.5px] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="you@company.com" /></label><label className="block text-[12px] font-semibold text-slate-700">Password<div className="relative mt-1.5"><input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={account.password} onChange={(event) => updateAccount("password", event.target.value)} className="min-h-11 w-full rounded-xl border border-slate-200 px-4 pr-11 text-[13.5px] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="8+ characters with upper, lower, number, symbol" /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-2 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}</button></div></label><div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-50 p-3 text-[10.5px] text-slate-500">{Object.entries(passwordChecks).map(([key, valid]) => <span key={key} className={valid ? "text-emerald-700" : ""}>{valid ? "✓" : "○"} {key}</span>)}</div><label className="block text-[12px] font-semibold text-slate-700">Confirm password<input required type={showPassword ? "text" : "password"} autoComplete="new-password" value={account.confirmPassword} onChange={(event) => updateAccount("confirmPassword", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-4 text-[13.5px] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="Repeat your password" /></label><button type="submit" className="min-h-11 w-full rounded-xl bg-[#0B5D3B] py-3.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#084B30]">{labels.continue} →</button></form>}
            {mode === "create" && step === 2 && <form onSubmit={nextStep} className="space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-emerald-700">Workspace details</p><h1 className="mt-2 text-[24px] font-bold tracking-[-.04em] text-slate-950" style={{ fontFamily: "Poppins, sans-serif" }}>Create your workspace</h1></div><label className="block text-[12px] font-semibold text-slate-700">Company name<input required value={workspace.name} onChange={(event) => updateWorkspace("name", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-4 text-[13.5px] outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100" placeholder="Your company name" /></label><label className="block text-[12px] font-semibold text-slate-700">Business category<select value={workspace.category} onChange={(event) => updateWorkspace("category", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[13.5px] outline-none focus:border-emerald-600">{CATEGORIES.map((item) => <option key={item}>{item}</option>)}</select></label><div className="grid grid-cols-2 gap-3"><label className="block text-[12px] font-semibold text-slate-700">Country<select value={workspace.country} onChange={(event) => updateWorkspace("country", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-3 text-[13px] outline-none focus:border-emerald-600">{COUNTRIES.map((item) => <option key={item}>{item}</option>)}</select></label><label className="block text-[12px] font-semibold text-slate-700">First branch<input value={workspace.firstBranch} onChange={(event) => updateWorkspace("firstBranch", event.target.value)} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 px-3 text-[13px] outline-none focus:border-emerald-600" placeholder="Head Office" /></label></div><div className="flex gap-2"><button type="button" onClick={() => setStep(1)} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600">Back</button><button type="submit" className="min-h-11 flex-1 rounded-xl bg-[#0B5D3B] py-3.5 text-[13.5px] font-semibold text-white">{labels.continue} →</button></div></form>}
            {mode === "join" && step === 2 && <form onSubmit={nextStep} className="space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-emerald-700">Workspace access</p><h1 className="mt-2 text-[24px] font-bold tracking-[-.04em] text-slate-950" style={{ fontFamily: "Poppins, sans-serif" }}>Join a workspace</h1></div><label className="block text-[12px] font-semibold text-slate-700">Join code<div className="relative mt-1.5"><KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600" size={16} /><input required value={join.code} onChange={(event) => setJoin((current) => ({ ...current, code: event.target.value }))} className="min-h-11 w-full rounded-xl border border-slate-200 pl-10 pr-4 text-[13.5px] uppercase outline-none focus:border-emerald-600" placeholder="Enter your workspace code" /></div></label><label className="block text-[12px] font-semibold text-slate-700">Role<select value={join.role} onChange={(event) => setJoin((current) => ({ ...current, role: event.target.value }))} className="mt-1.5 min-h-11 w-full rounded-xl border border-slate-200 bg-white px-4 text-[13.5px] outline-none focus:border-emerald-600"><option>Employee</option><option>Manager</option><option>External Client</option><option>Supplier</option></select></label><div className="flex gap-2"><button type="button" onClick={() => setStep(1)} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600">Back</button><button type="submit" className="min-h-11 flex-1 rounded-xl bg-[#0B5D3B] py-3.5 text-[13.5px] font-semibold text-white">{labels.continue} →</button></div></form>}
            {mode === "create" && step === 3 && <form onSubmit={nextStep} className="space-y-4"><div><p className="text-[10px] font-bold uppercase tracking-[.17em] text-emerald-700">Modules</p><h1 className="mt-2 text-[24px] font-bold tracking-[-.04em] text-slate-950" style={{ fontFamily: "Poppins, sans-serif" }}>Choose your business modules</h1><p className="mt-2 text-[13px] leading-5 text-slate-500">Start with the workflows your team needs. You can change them later.</p></div><div className="grid grid-cols-2 gap-2.5">{MODULES.map((module) => { const selected = selectedModules.has(module.id); return <button key={module.id} type="button" onClick={() => toggleModule(module.id)} className={`flex min-h-12 items-center justify-between rounded-xl border px-3 text-left text-[12px] font-semibold transition ${selected ? "border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-emerald-300"}`} aria-pressed={selected}><span>{module.label}</span>{selected && <CheckCircle2 size={16} className="text-emerald-600" />}</button>; })}</div><div className="flex gap-2"><button type="button" onClick={() => setStep(2)} className="min-h-11 flex-1 rounded-xl border border-slate-200 text-[13px] font-semibold text-slate-600">Back</button><button type="submit" disabled={busy || selectedModules.size === 0} className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-[#0B5D3B] py-3.5 text-[13.5px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Creating workspace…" : "Create workspace"} →</button></div></form>}
            <div className="mt-6 flex items-center justify-between border-t border-slate-100 pt-4"><button type="button" onClick={onBack} className="inline-flex min-h-11 items-center gap-2 text-[12.5px] font-semibold text-slate-500 hover:text-slate-800"><UsersRound size={15} /> {labels.back}</button><button type="button" onClick={() => setLang(lang === "en" ? "sw" : "en")} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-slate-200 px-3 text-[12px] font-semibold text-slate-600 hover:border-emerald-300" aria-label="Switch language"><Globe2 size={14} /> {lang === "en" ? "Kiswahili" : "English"}</button></div>
          </section>
        </div>
      </main>
    </div>
  );
}
