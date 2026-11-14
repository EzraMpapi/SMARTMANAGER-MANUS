import React, { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, ChevronDown, Eye, EyeOff, Fingerprint, Globe2, LockKeyhole, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import { PASSWORD_REQUIREMENT_LABELS, getPasswordChecks, isEnterprisePassword, passwordStrength } from "../lib/authOnboarding";
import { useLanguage, useLanguageOptional } from "../contexts/LanguageContext";
import { AUTH_SHELL_STATS, authUiFor } from "../lib/authTranslations";
import { INDUSTRY_LABELS } from "../lib/signupTranslations";
import { readRememberedOrganizationIndustryFocus } from "../lib/organizationIndustryFocus";
import { BrandLogo } from "./BrandLogo";
import { LoginModuleEcosystem } from "./LoginModuleEcosystem";

const OAUTH_PROVIDER_NAMES = { google: "Google", azure: "Microsoft", apple: "Apple" };


function TanzaniaMark() {
  return <span aria-hidden="true" className="relative h-5 w-5 shrink-0 overflow-hidden rounded-full shadow-sm" style={{ background: "linear-gradient(135deg,#00A651 0 42%,#FCD116 42% 47%,#101828 47% 56%,#1F75FE 56% 100%)" }} />;
}

function AuthInput({ label, icon, children }) {
  return <label className="block text-[13px] font-semibold text-slate-700"><span>{label}</span><span className="mt-2 flex h-[58px] items-center rounded-2xl border border-slate-200 bg-white px-2.5 transition focus-within:border-emerald-600 focus-within:ring-4 focus-within:ring-emerald-500/10 hover:border-emerald-200"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-emerald-50 text-emerald-700">{icon}</span>{children}</span></label>;
}

export function readAuthBranding() {
  if (typeof window === "undefined") return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem("bs_auth_branding") || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export function writeAuthBranding(branding) {
  if (typeof window === "undefined") return;
  const safe = {
    loginBackgroundImage: typeof branding?.loginBackgroundImage === "string" ? branding.loginBackgroundImage : null,
    onboardingBackgroundImage: typeof branding?.onboardingBackgroundImage === "string" ? branding.onboardingBackgroundImage : null,
  };
  window.localStorage.setItem("bs_auth_branding", JSON.stringify(safe));
}

export function EnterpriseAuthShell({ title, subtitle, children, asideTitle, asideCopy, motion = false, authSurface = "login" }) {
  const { lang, setLang, languageOptions, t } = useLanguage();
  const ui = authUiFor(lang);
  const industryLabels = INDUSTRY_LABELS[lang] || INDUSTRY_LABELS.en;
  const shellStats = AUTH_SHELL_STATS[lang] || AUTH_SHELL_STATS.en;
  const [industry, setIndustry] = useState(readRememberedOrganizationIndustryFocus);
  const [authBranding] = useState(readAuthBranding);
  const backgroundImage = authSurface === "onboarding" ? authBranding.onboardingBackgroundImage : authBranding.loginBackgroundImage;
  const sceneStyle = { fontFamily: "'Inter', system-ui, sans-serif", ...(backgroundImage ? { backgroundImage: `linear-gradient(120deg, rgba(247,251,248,.97), rgba(247,251,248,.88)), url("${backgroundImage}")`, backgroundPosition: "center", backgroundSize: "cover" } : {}) };
  const asideStyle = backgroundImage ? { backgroundImage: `linear-gradient(145deg, rgba(255,255,255,.96), rgba(240,253,244,.9)), url("${backgroundImage}")`, backgroundPosition: "center", backgroundSize: "cover" } : undefined;
  const resolvedAsideTitle = asideTitle || ui.aside.login.title;
  const resolvedAsideCopy = asideCopy || ui.aside.login.copy;

  return <div className={`sm-auth-scene min-h-screen overflow-x-hidden bg-[#f7fbf8] text-slate-950 ${motion ? "auth-screen-motion" : ""}`} style={sceneStyle}>
    <div className="mx-auto flex min-h-screen max-w-[1680px]">
      <aside className="relative hidden w-[45%] overflow-hidden border-r border-slate-200 bg-white px-12 py-10 lg:flex lg:flex-col lg:justify-between xl:px-16" style={asideStyle}>
        <div className="absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle at 18% 22%, rgba(16,185,129,.14), transparent 27%), radial-gradient(circle at 92% 78%, rgba(59,130,246,.1), transparent 27%), linear-gradient(rgba(15,23,42,.035) 1px, transparent 1px), linear-gradient(90deg, rgba(15,23,42,.035) 1px, transparent 1px)", backgroundSize: "auto,auto,54px 54px,54px 54px" }} />
        <LoginModuleEcosystem variant="desktop" industry={industry} />
        <div className="relative z-10"><BrandLogo variant="full" priority className="w-[min(25rem,95%)] rounded-[1.7rem]" /></div>
        <div className="relative z-10 max-w-[31rem] pb-14"><p className="mb-5 text-[11px] font-bold uppercase tracking-[.19em] text-emerald-700">{ui.shell.secure}</p><h1 className="max-w-[11ch] text-[48px] font-bold leading-[1.03] tracking-[-.05em] text-slate-950" style={{ fontFamily: "'Poppins', sans-serif" }}>{resolvedAsideTitle}</h1><p className="mt-6 max-w-md text-[15px] leading-7 text-slate-600">{resolvedAsideCopy}</p><label className="mt-7 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm"><span className="text-slate-500">{ui.shell.moduleFocus}</span><select value={industry} onChange={(event) => setIndustry(event.target.value)} className="max-w-40 bg-transparent text-slate-800 outline-none"><option value="general">{industryLabels.general}</option><option value="retail">{industryLabels.retail}</option><option value="manufacturing">{industryLabels.manufacturing}</option><option value="services">{industryLabels.services}</option><option value="healthcare">{industryLabels.healthcare}</option><option value="education">{industryLabels.education}</option><option value="hospitality">{industryLabels.hospitality}</option></select></label><div className="mt-10 grid grid-cols-3 gap-3 border-t border-slate-200 pt-6">{shellStats.map(([label, value]) => <div key={label}><p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p><p className="mt-1 text-[12px] font-semibold text-slate-800">{value}</p></div>)}</div></div>
        <p className="relative z-10 text-[11px] text-slate-400">© {new Date().getFullYear()} Smart Manager · {ui.shell.ecosystem}</p>
      </aside>
      <main className="relative flex flex-1 items-center justify-center px-4 py-7 sm:px-8 sm:py-10 lg:px-14"><LoginModuleEcosystem variant="mobile" industry={industry} /><section className="relative z-10 w-full max-w-[470px]">
        <header className="sm-auth-mobile-brand mb-7 flex flex-col items-center text-center lg:hidden"><BrandLogo variant="full" priority className="w-[min(22rem,92vw)] rounded-[1.5rem] shadow-[0_16px_38px_rgba(0,120,73,.14)]" /><p className="sr-only">Simamia Biashara Yako. Popote, Wakati Wote.</p><div className="mt-3 flex items-center gap-2 text-[11px] font-semibold text-emerald-800"><TanzaniaMark />{ui.shell.secure}</div></header>
        <div className={`sm-auth-card rounded-[28px] border border-emerald-950/8 bg-white/95 p-5 shadow-[0_24px_60px_rgba(19,58,42,.11)] backdrop-blur sm:p-8 ${motion ? "auth-card-enter" : ""}`}><div className="mb-7"><p className="mb-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-700">{ui.login.workspace}</p><h2 className="text-[27px] font-bold tracking-[-.04em] text-slate-950" style={{ fontFamily: "'Poppins', sans-serif" }}>{title}</h2><p className="mt-2 text-[13.5px] leading-6 text-slate-500">{subtitle}</p></div>{children}</div>
        <footer className="mt-5 flex flex-col items-center gap-3 text-center"><p className="flex items-center gap-2 text-[11px] leading-5 text-slate-500"><TanzaniaMark />{ui.shell.madeIn} · {ui.shell.protected}</p><label className="sm-language-control inline-flex min-h-10 items-center gap-2 rounded-full border border-slate-200 bg-white/80 px-3 py-2 text-[11px] font-semibold text-slate-600 shadow-sm" title={t("language")}><Globe2 size={14} aria-hidden="true" /><span className="sr-only">{t("language")}</span><span className="sm-language-code" aria-hidden="true">{lang.toUpperCase()}</span><select aria-label={t("language")} value={lang} onChange={(event) => setLang(event.target.value)} className="sm-language-select appearance-none bg-transparent pr-1 outline-none">{languageOptions.map((option) => <option key={option.code} value={option.code}>{option.nativeLabel}</option>)}</select><ChevronDown size={13} aria-hidden="true" /></label></footer>
      </section></main>
    </div>
  </div>;
}

export function AuthNotice({ type = "error", children }) {
  const success = type === "success";
  return <div role={success ? "status" : "alert"} aria-live={success ? "polite" : "assertive"} className={`mb-5 flex items-start gap-2.5 rounded-2xl border px-3.5 py-3 text-[12.5px] leading-5 ${success ? "border-emerald-100 bg-emerald-50 text-emerald-800" : "border-red-100 bg-red-50 text-red-800"}`}><span className="mt-0.5 shrink-0">{success ? <CheckCircle2 size={15} aria-hidden="true" /> : <AlertCircle size={15} aria-hidden="true" />}</span><span>{children}</span></div>;
}

export function PasswordStrengthMeter({ password }) {
  const { lang } = useLanguageOptional();
  const strengthUi = authUiFor(lang).strength;
  const checks = getPasswordChecks(password); const strength = passwordStrength(password); const labels = strengthUi.levels;
  if (!password) return null;
  return <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3"><div className="flex items-center justify-between"><p className="text-[11px] font-semibold text-slate-600">{strengthUi.title}</p><p className={`text-[11px] font-semibold ${strength >= 4 ? "text-emerald-700" : "text-amber-700"}`}>{labels[Math.max(0, strength - 1)]}</p></div><div className="mt-2 grid grid-cols-5 gap-1">{Array.from({ length: 5 }, (_, index) => <span key={index} className={`h-1 rounded-full ${index < strength ? (strength >= 4 ? "bg-emerald-500" : "bg-amber-400") : "bg-slate-200"}`} />)}</div><div className="mt-3 grid gap-1.5 sm:grid-cols-2">{PASSWORD_REQUIREMENT_LABELS.map(([key], index) => <p key={key} className={`flex items-center gap-1.5 text-[10.5px] ${checks[key] ? "text-emerald-700" : "text-slate-400"}`}><CheckCircle2 size={12} />{strengthUi.requirements[index]}</p>)}</div></div>;
}

function GoogleGlyph({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 48 48" aria-hidden="true" focusable="false" className="shrink-0">
    <path fill="#EA4335" d="M24 9.5c3.4 0 6.4 1.2 8.8 3.5l6.5-6.5C35.3 2.6 30 .5 24 .5 14.9.5 7.1 5.7 3.3 13.3l7.6 5.9C12.7 13.3 17.9 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.6c-.5 3-2.2 5.5-4.7 7.2l7.3 5.7c4.3-3.9 6.8-9.7 6.8-17.4z" />
    <path fill="#FBBC05" d="M10.9 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.6-5.9C1.6 16.7.5 20.2.5 24s1.1 7.3 2.8 10.5l7.6-5.9z" />
    <path fill="#34A853" d="M24 47.5c6 0 11.3-2 15-5.4l-7.3-5.7c-2 1.4-4.6 2.2-7.7 2.2-6.1 0-11.3-3.8-13.1-9.5l-7.6 5.9C7.1 42.3 14.9 47.5 24 47.5z" />
  </svg>;
}

function MicrosoftGlyph({ size = 16 }) {
  return <span aria-hidden="true" className="grid shrink-0 grid-cols-2 gap-[2px]" style={{ width: size, height: size }}>
    <span style={{ backgroundColor: "#F25022" }} /><span style={{ backgroundColor: "#7FBA00" }} />
    <span style={{ backgroundColor: "#00A4EF" }} /><span style={{ backgroundColor: "#FFB900" }} />
  </span>;
}

function AppleGlyph({ size = 16 }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" focusable="false" className="shrink-0" fill="currentColor">
    <path d="M16.4 12.7c0-2.2 1.8-3.3 1.9-3.4-1-1.5-2.6-1.7-3.2-1.7-1.4-.1-2.7.8-3.4.8-.7 0-1.8-.8-3-.8-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7c1.2 0 2.1-1.1 2.9-2.2.9-1.3 1.3-2.6 1.3-2.7-.1 0-2.8-1.1-2.8-3.9zM14.3 5.5c.6-.8 1.1-1.9 1-3-.9 0-2.1.6-2.8 1.4-.6.7-1.1 1.9-1 3 1.1.1 2.1-.6 2.8-1.4z" />
  </svg>;
}

export function EnterpriseLoginView({ onSignIn, onSignup, onForgot, onOAuth, onPasskey, onClearOAuthError, oauthProvider = "google", toMessage, configured, initialError = null, terminalDiagnostic = null }) {
  const { lang } = useLanguage();
  const loginUi = authUiFor(lang);
  const ui = loginUi.login;
  const providerName = OAUTH_PROVIDER_NAMES[oauthProvider] || OAUTH_PROVIDER_NAMES.google;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockOn, setCapsLockOn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => { setError(null); }, [lang]);

  async function submit(event) {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail && !password) {
      setError(ui.credentialsRequired);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError(ui.invalidEmail);
      return;
    }
    if (!password) {
      setError(ui.missingPassword);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await onSignIn(email.trim(), password, rememberMe);
    } catch (signInError) {
      setError(toMessage(signInError));
    } finally {
      setBusy(false);
    }
  }

  const providerRecovery = { title: ui.oauthFailed(providerName), copy: ui.oauthFailedCopy(providerName), retry: ui.retryProvider(providerName) };
  function useEmailInstead() { setError(null); onClearOAuthError?.(); }
  function retryProvider() { setError(null); onClearOAuthError?.(); setBusy(true); onOAuth(oauthProvider); }
  function updateCapsLock(event) { setCapsLockOn(Boolean(event.getModifierState?.("CapsLock"))); }
  async function signInWithPasskey() {
    if (!onPasskey) return;
    setBusy(true);
    setError(null);
    try { await onPasskey(rememberMe); } catch (passkeyError) { setError(toMessage(passkeyError)); } finally { setBusy(false); }
  }

  return <EnterpriseAuthShell title={ui.welcome} subtitle={ui.welcomeCopy}>
    <form onSubmit={submit} className="space-y-4" noValidate aria-busy={busy}>
      <p className="flex items-center gap-2 rounded-xl bg-emerald-50/70 px-3 py-2 text-[11px] leading-5 text-emerald-800"><ShieldCheck size={15} aria-hidden="true" />{ui.secureHint}</p>
      {error && <AuthNotice>{error}</AuthNotice>}
      {terminalDiagnostic && <AuthNotice><span>{ui.terminalNotice}</span><span className="mt-1 block text-[10px] font-bold uppercase tracking-[.12em]">{ui.diagnostic}: {terminalDiagnostic}</span></AuthNotice>}
      {initialError && <section aria-labelledby="oauth-recovery-title" className="rounded-2xl border border-amber-200 bg-amber-50/80 p-3.5 shadow-sm"><div className="flex gap-2.5"><span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-800"><RefreshCw size={16} aria-hidden="true" /></span><div><h3 id="oauth-recovery-title" className="text-[12.5px] font-bold text-amber-950">{providerRecovery.title}</h3><p className="mt-1 text-[11.5px] leading-5 text-amber-900/80">{providerRecovery.copy}</p></div></div><div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2"><button type="button" onClick={retryProvider} disabled={busy || !configured} className="rounded-xl bg-amber-800 px-3 py-2 text-[11.5px] font-semibold text-white transition hover:bg-amber-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{providerRecovery.retry}</button><button type="button" onClick={useEmailInstead} className="rounded-xl border border-amber-200 bg-white px-3 py-2 text-[11.5px] font-semibold text-amber-950 transition hover:bg-amber-100/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-700 focus-visible:ring-offset-2">{ui.oauthEmail}</button></div></section>}
      <AuthInput label={ui.email} icon={<Mail size={19} aria-hidden="true" />}><input id="smart-manager-login-email" name="email" type="email" inputMode="email" autoComplete="username" autoCapitalize="none" spellCheck={false} required value={email} onChange={(event) => setEmail(event.target.value)} placeholder={ui.emailPlaceholder} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500/30" /></AuthInput>
      <AuthInput label={ui.password} icon={<LockKeyhole size={19} aria-hidden="true" />}><input id="smart-manager-login-password" name="password" type={showPassword ? "text" : "password"} autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} onKeyDown={updateCapsLock} onKeyUp={updateCapsLock} onBlur={() => setCapsLockOn(false)} placeholder={ui.passwordPlaceholder} aria-describedby={capsLockOn ? "login-caps-lock" : undefined} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500/30" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? ui.hidePassword : ui.showPassword} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-1">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></AuthInput>
      {capsLockOn && <p id="login-caps-lock" role="status" className="-mt-2 flex items-center gap-1.5 text-[11px] font-medium text-amber-700"><AlertCircle size={13} aria-hidden="true" />{ui.capsLock}</p>}
      <div className="flex items-center justify-between gap-3"><label className="flex cursor-pointer items-center gap-2 text-[12px] font-medium text-slate-600"><input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500" />{ui.remember}</label><button type="button" onClick={onForgot} className="rounded-md text-[12px] font-semibold text-emerald-700 transition hover:text-emerald-900 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{ui.forgot}</button></div>
      <button type="submit" disabled={busy} className="relative flex min-h-[50px] w-full items-center justify-center rounded-2xl bg-gradient-to-r from-[#008a45] to-[#00a651] py-3.5 text-[14px] font-bold text-white shadow-[0_12px_25px_rgba(0,138,69,.24)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_28px_rgba(0,138,69,.3)] active:translate-y-0 active:scale-[.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60" aria-label={busy ? ui.signingIn : ui.signIn}>{busy && <RefreshCw size={16} className="mr-2 animate-spin" aria-hidden="true" />}{busy ? ui.signingIn : ui.signIn}</button>
      {configured && onPasskey && <button type="button" onClick={signInWithPasskey} disabled={busy} className="flex min-h-[46px] w-full items-center justify-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50/60 py-3 text-[13px] font-semibold text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 active:scale-[.985] disabled:cursor-not-allowed disabled:opacity-50"><Fingerprint size={16} aria-hidden="true" />{busy ? ui.passkeyBusy : ui.passkey}</button>}
      {configured && <><div className="flex items-center gap-3 py-1 text-[10px] font-semibold uppercase tracking-[.14em] text-slate-400"><span className="h-px flex-1 bg-slate-200" />{ui.divider}<span className="h-px flex-1 bg-slate-200" /></div><div className="grid grid-cols-3 gap-2"><button type="button" disabled={busy} onClick={() => onOAuth("google")} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-2 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-50"><GoogleGlyph />Google</button><button type="button" disabled={busy} onClick={() => onOAuth("azure")} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-2 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-50"><MicrosoftGlyph />Microsoft</button><button type="button" disabled={busy} onClick={() => onOAuth("apple")} className="inline-flex min-h-[42px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-2 py-2.5 text-[11px] font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-emerald-200 hover:bg-emerald-50/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2 disabled:opacity-50"><AppleGlyph />Apple</button></div><p className="text-center text-[10.5px] leading-5 text-slate-400">{ui.oauthNote}</p></>}
      <p className="pt-1 text-center text-[12.5px] text-slate-500">{ui.newAccount} <button type="button" onClick={onSignup} className="rounded-md font-semibold text-emerald-700 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{ui.create}</button></p>
      <p className="text-center text-[11px] leading-5 text-slate-400">{ui.help}</p>
    </form>
  </EnterpriseAuthShell>;
}

export function PasswordRecoveryView({ onBack, onRequest, toMessage }) {
  const { lang } = useLanguage(); const authUi = authUiFor(lang); const ui = authUi.recovery;
  const [email, setEmail] = useState(""); const [busy, setBusy] = useState(false); const [error, setError] = useState(null); const [sent, setSent] = useState(false);
  useEffect(() => { setError(null); }, [lang]);
  async function submit(event) { event.preventDefault(); if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) { setError(ui.validEmail); return; } setBusy(true); setError(null); try { await onRequest(email.trim().toLowerCase()); setSent(true); } catch (requestError) { setError(toMessage(requestError)); } finally { setBusy(false); } }
  return <EnterpriseAuthShell title={sent ? ui.sentTitle : ui.title} subtitle={sent ? ui.sentCopy : ui.copy} asideTitle={authUi.aside.recovery.title} asideCopy={authUi.aside.recovery.copy} motion>{sent ? <div className="space-y-4"><AuthNotice type="success">{ui.sentNotice}</AuthNotice><button type="button" onClick={onBack} className="min-h-[46px] w-full rounded-2xl border border-slate-200 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{ui.back}</button></div> : <form onSubmit={submit} className="space-y-5" noValidate aria-busy={busy}>{error && <AuthNotice>{error}</AuthNotice>}<AuthInput label={authUi.login.email} icon={<Mail size={19} aria-hidden="true" />}><input id="smart-manager-recovery-email" name="email" type="email" inputMode="email" autoComplete="username" autoFocus value={email} onChange={(event) => setEmail(event.target.value)} placeholder={ui.emailPlaceholder} autoCapitalize="none" spellCheck={false} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none placeholder:text-slate-400 focus-visible:ring-2 focus-visible:ring-emerald-500/30" /></AuthInput><button type="submit" disabled={busy} className="min-h-[50px] w-full rounded-2xl bg-[#008a45] py-3.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#006f37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{busy ? ui.sending : ui.send}</button><button type="button" onClick={onBack} className="mx-auto block rounded-md text-[12.5px] font-semibold text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{ui.back}</button></form>}</EnterpriseAuthShell>;
}

export const ForgotPasswordView = PasswordRecoveryView;

export function ResetPasswordView({ recoveryToken, onBack, onUpdate, toMessage }) {
  const { lang } = useLanguage(); const authUi = authUiFor(lang); const ui = authUi.recovery;
  const [password, setPassword] = useState(""); const [confirmPassword, setConfirmPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [showConfirmPassword, setShowConfirmPassword] = useState(false); const [busy, setBusy] = useState(false); const [error, setError] = useState(null); const [complete, setComplete] = useState(false);
  useEffect(() => { setError(null); }, [lang]);
  async function submit(event) { event.preventDefault(); if (!isEnterprisePassword(password)) { setError(ui.passwordError); return; } if (password !== confirmPassword) { setError(ui.matchError); return; } setBusy(true); setError(null); try { await onUpdate(recoveryToken, password); setComplete(true); } catch (updateError) { setError(updateError?.code === "RECOVERY_SESSION_MISSING" ? ui.resetLinkError : toMessage(updateError)); } finally { setBusy(false); } }
  return <EnterpriseAuthShell title={complete ? ui.resetCompleteTitle : ui.resetTitle} subtitle={complete ? ui.resetCompleteCopy : ui.resetCopy} asideTitle={authUi.aside.reset.title} asideCopy={authUi.aside.reset.copy} motion>{complete ? <div className="space-y-4"><AuthNotice type="success">{ui.resetComplete}</AuthNotice><button type="button" onClick={onBack} className="min-h-[50px] w-full rounded-2xl bg-[#008a45] py-3.5 text-[13.5px] font-semibold text-white transition hover:bg-[#006f37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2">{ui.continueToSignIn}</button></div> : <form onSubmit={submit} className="space-y-4" noValidate aria-busy={busy}>{error && <AuthNotice>{error}</AuthNotice>}<AuthInput label={ui.newPassword} icon={<LockKeyhole size={19} aria-hidden="true" />}><input id="smart-manager-reset-password" name="new-password" type={showPassword ? "text" : "password"} autoComplete="new-password" autoFocus value={password} onChange={(event) => setPassword(event.target.value)} spellCheck={false} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? authUi.login.hidePassword : authUi.login.showPassword} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{showPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></AuthInput><AuthInput label={ui.confirmPassword} icon={<LockKeyhole size={19} aria-hidden="true" />}><input id="smart-manager-reset-confirm-password" name="confirm-password" type={showConfirmPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} spellCheck={false} className="h-full min-w-0 flex-1 bg-transparent px-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/30" /><button type="button" onClick={() => setShowConfirmPassword((value) => !value)} aria-label={showConfirmPassword ? ui.hideConfirmPassword : ui.showConfirmPassword} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-slate-100 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600">{showConfirmPassword ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />}</button></AuthInput><PasswordStrengthMeter password={password} /><button type="submit" disabled={busy} className="min-h-[50px] w-full rounded-2xl bg-[#008a45] py-3.5 text-[13.5px] font-semibold text-white shadow-sm transition hover:bg-[#006f37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50">{busy ? ui.updating : ui.update}</button><button type="button" onClick={onBack} className="mx-auto block rounded-md text-[12.5px] font-semibold text-slate-500 hover:text-slate-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2">{ui.back}</button></form>}</EnterpriseAuthShell>;
}

export function EmailConfirmationView({ email, onBack, onResend, toMessage }) {
  const { lang } = useLanguage(); const authUi = authUiFor(lang); const ui = authUi.verify;
  const [cooldown, setCooldown] = useState(0); const [busy, setBusy] = useState(false); const [error, setError] = useState(null); const [sent, setSent] = useState(false);
  useEffect(() => { setError(null); }, [lang]);
  useEffect(() => { if (!cooldown) return; const timer = window.setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000); return () => window.clearInterval(timer); }, [cooldown]);
  async function resend() { if (!email || cooldown) return; setBusy(true); setError(null); try { await onResend(email); setSent(true); setCooldown(45); } catch (resendError) { setError(toMessage(resendError)); } finally { setBusy(false); } }
  return <EnterpriseAuthShell title={ui.title} subtitle={ui.subtitle} asideTitle={authUi.aside.verify.title} asideCopy={authUi.aside.verify.copy} motion><div className="space-y-4">{error && <AuthNotice>{error}</AuthNotice>}{sent && <AuthNotice type="success">{ui.resent}</AuthNotice>}<div className="rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-sky-50 p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><span className="grid h-11 w-11 place-items-center rounded-2xl bg-emerald-100 text-emerald-700"><Mail size={20} aria-hidden="true" /></span><span className="rounded-full border border-emerald-200 bg-white/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[.12em] text-emerald-700">{ui.step}</span></div><p className="text-[13px] font-semibold text-slate-800">{ui.open}</p><p className="mt-1 text-[12px] leading-5 text-slate-500">{ui.sent(email || ui.fallbackEmail)}</p></div><button type="button" disabled={busy || cooldown > 0 || !email} onClick={resend} className="w-full rounded-2xl border border-slate-200 py-3 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">{busy ? ui.resending : cooldown ? ui.resendIn(cooldown) : ui.resend}</button><button type="button" onClick={onBack} className="mx-auto block text-[12.5px] font-semibold text-slate-500 hover:text-slate-800">{ui.back}</button></div></EnterpriseAuthShell>;
}

export const VerificationView = EmailConfirmationView;
