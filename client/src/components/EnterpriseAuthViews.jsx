import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Eye, EyeOff, Fingerprint, Globe2, LockKeyhole, Mail, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { PASSWORD_REQUIREMENT_LABELS, getPasswordChecks, isEnterprisePassword, passwordStrength } from "../lib/authOnboarding";
import { useLanguage } from "../contexts/LanguageContext";
import { readRememberedOrganizationIndustryFocus } from "../lib/organizationIndustryFocus";
import { BrandLogo } from "./BrandLogo";
import { LoginModuleEcosystem } from "./LoginModuleEcosystem";

const copy = {
  en: {
    workspace: "Smart Manager workspace",
    secure: "Secure business workspace",
    madeIn: "Made in Tanzania",
    protected: "Protected by secure authentication and tenant-aware access controls.",
    welcome: "Welcome back",
    welcomeCopy: "Sign in to continue to your secure Smart Manager workspace.",
    email: "Work email",
    emailPlaceholder: "you@company.com",
    password: "Password",
    passwordPlaceholder: "Enter your password",
    remember: "Remember me",
    forgot: "Forgot password?",
    signIn: "Sign in securely",
    signingIn: "Signing you in…",
    divider: "or continue with",
    newAccount: "New to Smart Manager?",
    create: "Create your workspace",
    oauthEmail: "Use email instead",
    passkey: "Sign in with a passkey",
    passkeyBusy: "Waiting for your passkey…",
    moduleFocus: "Module focus",
    industries: { general: "Universal business", retail: "Retail & wholesale", manufacturing: "Manufacturing", services: "Professional services", healthcare: "Healthcare", education: "Education", hospitality: "Hospitality" },
    oauthRecovery: {
      google: { title: "Google sign-in was not completed", copy: "Try Google again, or use your work email and password instead. Your workspace and account data are unchanged.", retry: "Try Google again" },
      azure: { title: "Microsoft sign-in was not completed", copy: "Try Microsoft again, or use your work email and password instead. Your workspace and account data are unchanged.", retry: "Try Microsoft again" },
      apple: { title: "Apple sign-in was not completed", copy: "Try Apple again, or use your work email and password instead. Your workspace and account data are unchanged.", retry: "Try Apple again" },
    },
  },
  sw: {
    workspace: "Eneo la kazi la Smart Manager",
    secure: "Eneo salama la biashara",
    madeIn: "Imetengenezwa Tanzania",
    protected: "Imelindwa kwa uthibitishaji salama na udhibiti wa upatikanaji wa kila kampuni.",
    welcome: "Karibu tena",
    welcomeCopy: "Ingia kuendelea kwenye eneo lako salama la Smart Manager.",
    email: "Barua pepe ya kazi",
    emailPlaceholder: "wewe@kampuni.co.tz",
    password: "Nenosiri",
    passwordPlaceholder: "Ingiza nenosiri lako",
    remember: "Kumbuka mimi",
    forgot: "Umesahau nenosiri?",
    signIn: "Ingia kwa usalama",
    signingIn: "Inaingia…",
    divider: "au endelea na",
    newAccount: "Huna akaunti ya Smart Manager?",
    create: "Unda eneo lako la kazi",
    oauthEmail: "Tumia barua pepe badala yake",
    passkey: "Ingia kwa passkey",
    passkeyBusy: "Inasubiri passkey yako…",
    moduleFocus: "Mwelekeo wa moduli",
    industries: { general: "Biashara ya jumla", retail: "Rejareja na jumla", manufacturing: "Uzalishaji", services: "Huduma za kitaalamu", healthcare: "Afya", education: "Elimu", hospitality: "Ukarimu" },
    oauthRecovery: {
      google: { title: "Kuingia kwa Google hakukukamilika", copy: "Jaribu Google tena, au tumia barua pepe ya kazi na nenosiri lako. Eneo lako la kazi na taarifa za akaunti havijabadilika.", retry: "Jaribu Google tena" },
      azure: { title: "Kuingia kwa Microsoft hakukukamilika", copy: "Jaribu Microsoft tena, au tumia barua pepe ya kazi na nenosiri lako. Eneo lako la kazi na taarifa za akaunti havijabadilika.", retry: "Jaribu Microsoft tena" },
      apple: { title: "Kuingia kwa Apple hakukukamilika", copy: "Jaribu Apple tena, au tumia barua pepe ya kazi na nenosiri lako. Eneo lako la kazi na taarifa za akaunti havijabadilika.", retry: "Jaribu Apple tena" },
    },
  },
};

function TanzaniaMark() {
  return <span aria-hidden="true" className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full shadow-sm" style={{ background: "linear-gradient(135deg,#00A651 0 42%,#FCD116 42% 47%,#101828 47% 56%,#1F75FE 56% 100%)" }} />;
}

function AuthInput({ label, icon, children }) {
  return <label className="block text-[13px] font-semibold text-slate-700"><span>{label}</span><span className="mt-2 flex h-[58px] items-center rounded-2xl border border-slate-200 bg-white px-2.5 transition focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 hover:border-emerald-200"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</span>{children}</span></label>;
}

export function EnterpriseAuthShell({ title, subtitle, children, asideTitle = "Your business, in command.", asideCopy = "Bring finance, sales, people, inventory, and insight together in one secure workspace." }) {
  const { lang, setLang } = useLanguage();
  const ui = copy[lang];
  const [industry, setIndustry] = useState(readRememberedOrganizationIndustryFocus);

  return <div className="sm-auth-scene min-h-screen overflow-x-hidden bg-[#f7fbf8] text-slate-950" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
    <div className="mx-auto flex min-h-screen max-w-[1680px]">
      <aside className="relative hidden w-[45%] overflow-hidden bg-[#071c15] px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16">
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(circle at 18% 22%, rgba(0,166,81,.38), transparent 27%), radial-gradient(circle at 92% 78%, rgba(31,117,254,.2), transparent 27%), linear-gradient(rgba(255,255,255,.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.05) 1px, transparent 1px)", backgroundSize: "auto,auto,54px 54px,54px 54px" }} />
        <LoginModuleEcosystem variant="desktop" industry={industry} />
        <div className="relative z-10"><BrandLogo variant="full" priority className="w-[min(25rem,95%)] rounded-[1.7rem]" /></div>
        <div className="relative z-10 max-w-[31rem] pb-14"><p className="mb-5 text-[11px] font-bold uppercase tracking-[.19em] text-emerald-300">{ui.secure}</p><h1 className="max-w-[11ch] text-[48px] font-bold leading-[1.03] tracking-[-.05em] text-white" style={{ fontFamily: "'Poppins', sans-serif" }}>{asideTitle}</h1><p className="mt-6 max-w-md text-[15px] leading-7 text-emerald-50/72">{asideCopy}</p><label className="mt-7 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#08291c]/70 px-3 py-2 text-[11px] font-semibold text-emerald-100 shadow-sm backdrop-blur"><span className="text-emerald-200/70">{ui.moduleFocus}</span><select value={industry} onChange={(event) => setIndustry(event.target.value)} className="max-w-40 bg-transparent text-white outline-none"><option value="general">{ui.industries.general}</option><option value="retail">{ui.industries.retail}</option><option value="manufacturing">{ui.industries.manufacturing}</option><option value="services">{ui.industries.services}</option><option value="healthcare">{ui.industries.healthcare}</option><option value="education">{ui.industries.education}</option><option value="hospitality">{ui.industries.hospitality}</option></select></label><div className="mt-10 grid grid-cols-3 gap-3 border-t border-white/10 pt-6">{[["Security", "Tenant-aware"], ["Control", "Role-based"], ["Ready", "Modular ERP"]].map(([label, value]) => <div key={label}><p className="text-[10px] font-semibold uppercase tracking-wider text-emerald-200/55">{label}</p><p className="mt-1 text-[12px] font-semibold text-white">{value}</p></div>)}</div></div>
        <p className="relative z-10 text-[11px] text-emerald-100/50">© {new Date().getFullYear()} Smart Manager · Enterprise Business Ecosystem</p>
      </aside>
      <main className="relative flex flex-1 items-center justify-center px-4 py-7 sm:px-8 sm:py-10 lg:px-14"><LoginModuleEcosystem variant="mobile" industry={industry} /><section className="relative z-10 w-full max-w-[470px]">
        <header className="sm-auth-mobile-brand mb-7 flex flex-col items-center text-center lg:hidden"><BrandLogo variant="full" priority className="w-[min(22rem,92vw)] rounded-[1.5rem] shadow-[0_16px_38px_rgba(0,120,73,.14)]" /><p className="sr-only">Simamia Biashara Yako. Popote, Wakati Wote.</p><div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-800"><TanzaniaMark />{ui.secure}</div></header>
        <div className="sm-auth-card rounded-[28px] border border-emerald-950/8 bg-white/95 p-5 shadow-[0_24px_60px_rgba(19,58,42,.11)] backdrop-blur sm:p-8"><div className="mb-7"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">{ui.workspace}</p><h2 className="text-[27px] font-bold tracking-[-.04em] text-slate-950" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h2><p className="mt-2 text-[13.5px] leading-6 text-slate-500">{subtitle}</p></div>{children}</div>
        <footer className="mt-5 flex flex-col items-center gap-3 text-center"><p className="flex items-center gap-2 text-[11px] leading-5 text-slate-500"><TanzaniaMark />{ui.madeIn} · {ui.protected}</p><label className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm"><Globe2 size={14} aria-hidden="true" /><span className="sr-only">Language</span><select value={lang} onChange={(event) => setLang(event.target.value)} className="appearance-none bg-transparent pr-1 outline-none"><option value="sw">Kiswahili</option><option value="en">English</option></select><ChevronDown size={13} aria-hidden="true" /></label></footer>
      </section></main>
    </div>
  </div>;
}

export function AuthNotice({ type = "error", children }) {
  const success = type === "success";
  return <div role={success ? "status" : "alert"} className={`mb-5 flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-[12.5px] leading-5 ${success ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-red-100 bg-red-50 text-red-800"}`}><span className="mt-0.5 shrink-0">{success ? <CheckCircle2 size={15} /> : <AlertCircle size={15} />}</span><span>{children}</span></div>;
}

export function PasswordStrengthMeter({ password }) {
  const checks = getPasswordChecks(password); const strength = passwordStrength(password); const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  if (!password) return null;
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold text-slate-600">Password strength</p><p className={`text-[11px] font-semibold ${strength >= 4 ? "text-emerald-700" : "text-amber-700"}`}>{labels[Math.max(0, strength - 1)]}</p></div><div className="mt-2 grid grid-cols-5 gap-1">{Array.from({ length: 5 }, (_, index) => <span key={index} className={`h-1 rounded-full ${index < strength ? (strength >= 4 ? "bg-emerald-500" : "bg-amber-400") : "bg-slate-200"}`} />)}</div><div className="mt-3 grid gap-1.5 sm:grid-cols-2">{PASSWORD_REQUIREMENT_LABELS.map(([key, label]) => <p key={key} className={`flex items-center gap-1.5 text-[10.5px] ${checks[key] ? "text-emerald-700" : "text-slate-400"}`}><CheckCircle2 size={12} />{label}</p>)}</div></div>;
}

export function EnterpriseLoginView({ onSignIn, onSignup, onForgot, onOAuth, onPasskey, onClearOAuthError, oauthProvider = "google", toMessage, configured, initialError = null }) {
  const { lang } = useLanguage(); const ui = copy[lang];
  const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [rememberMe, setRememberMe] = useState(true); const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(null);
  useEffect(() => { if (initialError) setError(initialError); }, [initialError]);
  async function submit(event) { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) || !password) { setError(lang === "sw" ? "Ingiza barua pepe ya kazi na nenosiri lako kuendelea." : "Enter your work email and password to continue."); return; } setBusy(true); setError(null); try { await onSignIn(email.trim(), password, rememberMe); } catch (signInError) { setError(toMessage(signInError)); } finally { setBusy(false); } }
  const providerRecovery = ui.oauthRecovery[oauthProvider] || ui.oauthRecovery.google;
  function useEmailInstead() { setError(null); onClearOAuthError?.(); }
  function retryProvider() { setError(null); onClearOAuthError?.(); setBusy(true); onOAuth(oauthProvider); }
  async function signInWithPasskey() { if (!onPasskey) return; setBusy(true); setError(null); try { await onPasskey(rememberMe); } catch (passkeyError) { setError(toMessage(passkeyError)); } finally { setBusy(false); } }
  return <EnterpriseAuthShell title={ui.welcome} subtitle={ui.welcomeCopy} asideTitle="Your operations, in command." asideCopy="Bring finance, sales, people, inventory, and insight into a workspace designed for accountable execution."><form onSubmit={submit} className="space-y-4">{error && <AuthNotice>{error}</AuthNotice>}{initialError && <section aria-labelledby="oauth-recovery-title" className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 shadow-sm"><div className="flex gap-2.5"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800"><RefreshCw size={16} aria-hidden="true" /></span><div><h3 id="oauth-recovery-title" className="text-[12.5px] font-bold text-amber-950">{providerRecovery.title}</h3><p className="mt-1 text-[11.5px] leading-5 text-amber-900/80">{providerRecovery.copy}</p></div></div><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"><button type="button" onClick={retryProvider} disabled={busy || !configured} className="rounded-xl bg-amber-800 px-3 py-2 text-[11.5px] font-semibold text-white transition hover:bg-amber-900 disabled:cursor-not-allowed disabled:opacity-50">{providerRecovery.retry}</button><button type="button" onClick={useEmailInstead} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-[11.5px] font-semibold text-amber-950 transition hover:bg-amber-100/60">{ui.oauthEmail}</button></div></section>}<AuthInput label={ui.email} icon={<UserRound size={19} aria-hidden="true" />}><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={ui.emailPlaceholder} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400" /></AuthInput><AuthInput label={ui.password} icon={<LockKeyhole size={19} aria-hidden="true" />}><input type={showPassword ? "text" : "password"} autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder={ui.passwordPlaceholder} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></AuthInput><div className="flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-600"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />{ui.remember}</label><button type="button" onClick={onForgot} className="text-[12px] font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline">{ui.forgot}</button></div><button type="submit" disabled={busy} className="relative w-full rounded-2xl bg-gradient-to-r from-[#008a45] to-[#00a651] py-3.5 text-[14px] font-bold text-white shadow-[0_12px_25px_rgba(0,138,69,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(0,138,69,.3)] active:translate-y-0 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-50">{busy ? ui.signingIn : ui.signIn}</button>{configured && onPasskey && <button type="button" onClick={signInWithPasskey} disabled={busy} className="flex w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 py-3 text-[13px] font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-50"><Fingerprint size={16} aria-hidden="true" />{busy ? ui.passkeyBusy : ui.passkey}</button>}{configured && <><div className="flex items-center gap-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400"><span className="h-px flex-1 bg-slate-200" />{ui.divider}<span className="h-px flex-1 bg-slate-200" /></div><div className="grid grid-cols-3 gap-2"><button type="button" disabled={busy} onClick={() => onOAuth("google")} className="rounded-xl border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 disabled:opacity-50">Google</button><button type="button" disabled={busy} onClick={() => onOAuth("azure")} className="rounded-xl border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 disabled:opacity-50">Microsoft</button><button type="button" disabled={busy} onClick={() => onOAuth("apple")} className="rounded-xl border border-slate-200 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 disabled:opacity-50">Apple</button></div><p className="text-center text-[10.5px] leading-5 text-slate-400">{lang === "sw" ? "Tumia njia ileile uliyotumia kuunda akaunti yako." : "Use the same provider you used when your workspace account was created."}</p></>}<p className="pt-1 text-center text-[12.5px] text-slate-500">{ui.newAccount} <button type="button" onClick={onSignup} className="font-semibold text-emerald-700 hover:underline">{ui.create}</button></p></form></EnterpriseAuthShell>;
}

export function ForgotPasswordView({ onBack, onRequest, toMessage }) {
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(null); const [sent, setSent] = useState(false);
  async function submit(event) { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError("Enter a valid work email address."); return; } setBusy(true); setError(null); try { await onRequest(email.trim()); setSent(true); } catch (requestError) { setError(toMessage(requestError)); } finally { setBusy(false); } }
  return <EnterpriseAuthShell title={sent ? "Check your inbox" : "Recover access"} subtitle={sent ? "If the address is associated with a password-based workspace account, a secure reset link is on its way." : "Enter your work email and we’ll send a secure password reset link."} asideTitle="Access is recoverable." asideCopy="Password recovery is private by design. We never disclose whether a particular email address has an account.">{sent ? <div className="space-y-4"><AuthNotice type="success">For security, this confirmation is the same whether or not the address is registered. Check your inbox and spam folder for a Smart Manager recovery link.</AuthNotice><button type="button" onClick={onBack} className="w-full rounded-2xl border border-slate-200 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50">Back to sign in</button></div> : <form onSubmit={submit} className="space-y-5">{error && <AuthNotice>{error}</AuthNotice>}<AuthInput label="Work email" icon={<Mail size={19} aria-hidden="true" />}><input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400" /></AuthInput><button type="submit" disabled={busy} className="w-full rounded-2xl bg-[#008a45] py-3.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#006f37] disabled:opacity-50">{busy ? "Sending secure link…" : "Send reset link"}</button><button type="button" onClick={onBack} className="mx-auto block text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">Back to sign in</button></form>}</EnterpriseAuthShell>;
}

export function ResetPasswordView({ recoveryToken, onBack, onUpdate, toMessage }) {
  const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(null); const [complete, setComplete] = useState(false);
  async function submit(event) { event.preventDefault(); if (!isEnterprisePassword(password)) { setError("Use a password that meets all the requirements below."); return; } if (password !== confirmPassword) { setError("The password confirmation does not match."); return; } setBusy(true); setError(null); try { await onUpdate(recoveryToken, password); setComplete(true); } catch (updateError) { setError(updateError?.code === "RECOVERY_SESSION_MISSING" ? "This reset link is invalid or has expired. Request a new one to continue." : toMessage(updateError)); } finally { setBusy(false); } }
  return <EnterpriseAuthShell title={complete ? "Password updated" : "Choose a new password"} subtitle={complete ? "Your password has been changed securely. Sign in with your new credentials." : "Create a strong password to protect your business workspace."} asideTitle="Security starts here." asideCopy="A valid recovery session is required before Smart Manager can update a password.">{complete ? <div className="space-y-4"><AuthNotice type="success">Your password has been updated successfully.</AuthNotice><button type="button" onClick={onBack} className="w-full rounded-2xl bg-[#008a45] py-3.5 text-[13.5px] font-semibold text-white">Continue to sign in</button></div> : <form onSubmit={submit} className="space-y-4">{error && <AuthNotice>{error}</AuthNotice>}<AuthInput label="New password" icon={<LockKeyhole size={19} aria-hidden="true" />}><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"} className="grid h-9 w-9 place-items-center text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button></AuthInput><AuthInput label="Confirm new password" icon={<LockKeyhole size={19} aria-hidden="true" />}><input type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none" /></AuthInput><PasswordStrengthMeter password={password} /><button type="submit" disabled={busy} className="w-full rounded-2xl bg-[#008a45] py-3.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#006f37] disabled:opacity-50">{busy ? "Updating password…" : "Update password"}</button><button type="button" onClick={onBack} className="mx-auto block text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">Back to sign in</button></form>}</EnterpriseAuthShell>;
}

export function VerificationView({ email, onBack, onResend, toMessage }) {
  const [cooldown, setCooldown] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState(null); const [sent, setSent] = useState(false);
  useEffect(() => { if (!cooldown) return; const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [cooldown]);
  async function resend() { if (!email || cooldown) return; setBusy(true); setError(null); try { await onResend(email); setSent(true); setCooldown(45); } catch (resendError) { setError(toMessage(resendError)); } finally { setBusy(false); } }
  return <EnterpriseAuthShell title="Check your inbox" subtitle="Verify your email before creating or joining a Smart Manager workspace." asideTitle="Your workspace begins securely." asideCopy="Email verification protects your organisation and confirms the identity behind its first administrative account."><div className="space-y-4">{error && <AuthNotice>{error}</AuthNotice>}{sent && <AuthNotice type="success">A new verification email has been requested. Please allow a few minutes for delivery.</AuthNotice>}<div className="rounded-2xl border border-slate-100 bg-slate-50 p-4"><Mail className="mb-3 text-emerald-700" size={20} /><p className="text-[13px] font-semibold text-slate-800">Open the verification email</p><p className="mt-1 text-[12px] leading-5 text-slate-500">We sent instructions to <span className="font-medium text-slate-700">{email || "your email address"}</span>. The link will securely continue your setup.</p></div><button type="button" disabled={busy || cooldown > 0 || !email} onClick={resend} className="w-full rounded-2xl border border-slate-200 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Resending…" : cooldown ? `Resend available in ${cooldown}s` : "Resend verification email"}</button><button type="button" onClick={onBack} className="mx-auto block text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">Back to sign in</button></div></EnterpriseAuthShell>;
}
