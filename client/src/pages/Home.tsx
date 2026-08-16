import { Link } from "wouter";
import {
  ArrowRight,
  Boxes,
  Check,
  ChevronRight,
  ClipboardCheck,
  Factory,
  Headphones,
  HeartPulse,
  Layers3,
  ShieldCheck,
  Sparkles,
  UsersRound,
  WalletCards,
  Sun,
  Moon,
  Globe,
  Fingerprint,
} from "lucide-react";
import { useState } from "react";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { AnimatedGoldMesh } from "../components/AnimatedGoldMesh";
import { BrandLogo } from "../components/BrandLogo";
import { passkeySignInUserMessage, signInWithAccountPasskey } from "../lib/accountPasskeys";
import { persistAuthSession } from "../lib/authSessionStorage";

const capabilities = [
  { title: "CRM & Sales", description: "Connect customer records, quotations, invoices, and commercial activity in one operating flow.", icon: UsersRound, tone: "bg-[#C9A96E]/10 text-[#C9A96E]" },
  { title: "Inventory", description: "Keep stock, valuation, purchasing signals, and fulfillment close to the work that depends on them.", icon: Boxes, tone: "bg-[#16A34A]/10 text-[#16A34A]" },
  { title: "Finance", description: "Bring receivables, expenses, cash flow, budgets, and reporting into operational context.", icon: WalletCards, tone: "bg-[#C9A96E]/10 text-[#C9A96E]" },
  { title: "People & HR", description: "Coordinate employee records, attendance, leave, and performance from the same workspace.", icon: HeartPulse, tone: "bg-[#16A34A]/10 text-[#16A34A]" },
  { title: "Manufacturing", description: "Link work orders, materials, and production steps with the business data around them.", icon: Factory, tone: "bg-[#C9A96E]/10 text-[#C9A96E]" },
  { title: "Support & Operations", description: "Give teams practical workflows for service, documents, and business controls.", icon: Headphones, tone: "bg-[#16A34A]/10 text-[#16A34A]" },
];

const PUBLIC_SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "";
const PUBLIC_SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export default function Home() {
  const { theme, toggleTheme } = useTheme();
  const { lang, setLang, t } = useLanguage();
  const [passkeyPending, setPasskeyPending] = useState(false);
  const [passkeyError, setPasskeyError] = useState("");

  async function signInWithPublicPasskey() {
    if (!PUBLIC_SUPABASE_URL || !PUBLIC_SUPABASE_ANON_KEY) {
      setPasskeyError("Passkey sign-in is not configured for this workspace. Use the secure workspace sign-in page instead.");
      return;
    }
    setPasskeyPending(true);
    setPasskeyError("");
    try {
      const result = await signInWithAccountPasskey({ supabaseUrl: PUBLIC_SUPABASE_URL, supabaseAnonKey: PUBLIC_SUPABASE_ANON_KEY });
      persistAuthSession(result);
      window.location.assign("/app");
    } catch (error) {
      setPasskeyError(passkeySignInUserMessage(error));
    } finally {
      setPasskeyPending(false);
    }
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[#0B1120] text-[#F8FAFC]">
      {/* Navigation */}
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-6 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center" aria-label="Smart Manager home"><BrandLogo variant="compact" priority className="h-12 w-12 shadow-lg sm:h-14 sm:w-14" /></Link>
        <div className="flex items-center gap-4">
          <nav className="hidden items-center gap-8 text-[13px] font-medium text-[#94A3B8] md:flex" aria-label="Main navigation">
            <a href="#capabilities" className="transition-colors hover:text-[#C9A96E]">{t("capabilities")}</a>
            <a href="#why-smart-manager" className="transition-colors hover:text-[#C9A96E]">{t("whyUs")}</a>
            <a href="#launch" className="transition-colors hover:text-[#C9A96E]">{t("launch")}</a>
          </nav>
          
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            <button
              onClick={toggleTheme}
              className="grid h-9 w-9 place-items-center rounded-lg border border-white/10 bg-white/5 text-white transition-colors hover:bg-white/10"
              title="Toggle theme"
            >
              {theme === "dark" ? <Sun size={15} className="text-[#C9A96E]" /> : <Moon size={15} className="text-[#C9A96E]" />}
            </button>
            <button
              onClick={() => setLang(lang === "en" ? "sw" : "en")}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-2 text-[12px] font-bold text-white transition-colors hover:bg-white/10"
              title="Switch language"
            >
              <Globe size={14} className="text-[#16A34A]" />
              <span>{lang.toUpperCase()}</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button type="button" onClick={signInWithPublicPasskey} disabled={passkeyPending} aria-describedby={passkeyError ? "public-passkey-status" : undefined} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-[#16A34A]/35 bg-[#16A34A]/10 px-3 text-[12px] font-bold text-[#D1FAE5] transition-all hover:bg-[#16A34A]/20 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70" aria-label="Sign in with a passkey">
              <Fingerprint size={15} /><span className="hidden sm:inline">{passkeyPending ? "Opening…" : "Passkey"}</span>
            </button>
            <Link href="/app" className="inline-flex items-center gap-2 rounded-lg bg-[#C9A96E] px-5 py-2.5 text-[13px] font-bold text-[#0B1120] shadow-lg transition-all hover:-translate-y-0.5 hover:bg-[#D4B87F] active:scale-[0.97]">
              {t("launchApp")} <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative isolate pb-20 pt-16 sm:pb-32 sm:pt-24">
          {/* Noble Background Accents & Animated Gold Mesh */}
          <div className="absolute inset-x-0 top-0 -z-10 h-[40rem] bg-[radial-gradient(ellipse_at_top,rgba(201,169,110,0.12),rgba(11,17,32,0)_70%)]" />
          <AnimatedGoldMesh />
          <div className="absolute -right-44 top-8 -z-10 h-96 w-96 rounded-full bg-[#16A34A]/5 blur-[100px]" />
          
          <div className="mx-auto grid max-w-7xl gap-16 px-5 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:px-10">
            <div className="max-w-2xl">
              <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-[#C9A96E]/20 bg-[#C9A96E]/5 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.15em] text-[#C9A96E] shadow-sm">
                <Sparkles size={13} /> Bidhaa ya Kitanzania kwa Wafanyabiashara
              </div>
              <h1 className="max-w-xl text-5xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl font-heading">
                Run the work. <span className="text-[#C9A96E]">See the whole business.</span>
              </h1>
              <p className="mt-8 max-w-xl text-[18px] leading-8 text-[#94A3B8] sm:text-[19px]">
                Simamia Biashara Yako. Popote, Wakati Wote. Smart Manager brings commercial, financial, and operational workflows together in one noble command center.
              </p>
              <div className="mt-10 flex flex-col gap-4 sm:flex-row">
                <Link href="/app" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A96E] px-7 py-4 text-[14px] font-bold text-[#0B1120] shadow-[0_15px_30px_rgba(201,169,110,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#D4B87F] active:scale-[0.97]">
                  Launch Smart Manager <ArrowRight size={16} />
                </Link>
                <button type="button" onClick={signInWithPublicPasskey} disabled={passkeyPending} className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#16A34A]/35 bg-[#16A34A]/10 px-7 py-4 text-[14px] font-bold text-[#D1FAE5] transition-all hover:bg-[#16A34A]/20 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70">
                  <Fingerprint size={16} /> {passkeyPending ? "Opening passkey…" : "Sign in with a passkey"}
                </button>
                <a href="#capabilities" className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-7 py-4 text-[14px] font-bold text-white transition-all hover:bg-white/10">
                  Explore capabilities <ChevronRight size={16} />
                </a>
              </div>
              <p id="public-passkey-status" className="mt-4 min-h-5 max-w-xl text-[13px] text-amber-200" aria-live="polite">{passkeyError}</p>
              <div className="mt-12 flex flex-wrap gap-x-8 gap-y-3 text-[13px] font-medium text-[#64748B]">
                <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#16A34A]" /> Live operational data</span>
                <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#16A34A]" /> Connected business modules</span>
                <span className="inline-flex items-center gap-2"><Check size={16} className="text-[#16A34A]" /> Action-ready workflows</span>
              </div>
            </div>

            {/* Noble Dashboard Preview Card */}
            <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:justify-self-end">
              <div className="absolute -left-10 -top-10 h-32 w-32 rounded-full border border-[#C9A96E]/10 bg-[#C9A96E]/5 blur-2xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#131C31] p-3 shadow-2xl sm:p-4 gold-glow">
                <div className="rounded-[1.4rem] bg-[#0B1120] p-5 sm:p-6">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full bg-[#16A34A] animate-pulse" /><span className="text-[13px] font-bold text-white font-heading tracking-wide">Business Overview</span></div>
                    <span className="rounded-md bg-[#16A34A]/10 border border-[#16A34A]/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[#16A34A]">Live Workspace</span>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    {["Customers", "Inventory", "Finance"].map((label) => (
                      <div key={label} className="rounded-xl bg-[#131C31] border border-white/5 p-4 transition-transform hover:scale-[1.02]">
                        <p className="text-[10px] font-bold uppercase tracking-widest text-[#94A3B8]">{label}</p>
                        <p className="mt-2 text-[14px] font-extrabold tracking-tight text-[#C9A96E]">Connected</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-5 rounded-xl border border-white/5 bg-[#131C31]/50 p-4">
                    <div className="mb-4 flex items-center justify-between"><span className="text-[12px] font-bold text-white font-heading">Operational Momentum</span><span className="text-[11px] font-semibold text-[#16A34A]">Live Workflow</span></div>
                    <div className="flex h-28 items-end gap-2.5">
                      {[44, 58, 36, 72, 62, 88, 76, 95].map((height, index) => <span key={index} className="flex-1 rounded-t-lg bg-gradient-to-t from-[#16A34A] to-[#22C55E]" style={{ height: `${height}%`, opacity: index === 7 ? 1 : 0.4 }} />)}
                    </div>
                  </div>
                  <div className="mt-5 grid grid-cols-[1fr_auto] gap-4 rounded-xl bg-[#C9A96E]/5 border border-[#C9A96E]/10 p-4">
                    <div><p className="text-[11px] font-bold text-[#C9A96E] font-heading">Next Best Action</p><p className="mt-1.5 text-[12px] leading-5 text-[#94A3B8]">Review the priorities surfaced by your connected business workflows.</p></div>
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#C9A96E] text-[#0B1120] shadow-lg"><ClipboardCheck size={20} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Value Propositions */}
        <section id="why-smart-manager" className="border-y border-white/5 bg-[#131C31]/30 py-12 sm:py-16">
          <div className="mx-auto grid max-w-7xl gap-8 px-5 sm:grid-cols-3 sm:px-8 lg:px-10">
            {[
              ["One Workspace", "Centralize customer, inventory, finance, and people workflows in one command center."],
              ["Live Data Path", "Direct Supabase integration ensures every signal is accurate and action-ready."],
              ["Built-in Controls", "Role-aware access, audit visibility, and automated reporting for peace of mind."],
            ].map(([value, label], index) => (
              <div key={value} className="relative px-2 sm:px-8 sm:first:pl-0 sm:last:pr-0">
                {index < 2 && <span className="absolute right-0 top-1 hidden h-16 w-px bg-white/5 sm:block" />}
                <p className="text-[18px] font-extrabold tracking-tight text-white font-heading">{value}</p>
                <p className="mt-2 max-w-xs text-[14px] leading-6 text-[#94A3B8]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Capabilities Section */}
        <section id="capabilities" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[12px] font-bold uppercase tracking-[0.2em] text-[#C9A96E]">The Noble Ecosystem</p>
            <h2 className="mt-4 text-4xl font-extrabold tracking-tight text-white sm:text-5xl font-heading">Capabilities that radiate authority.</h2>
            <p className="mt-6 text-[16px] leading-8 text-[#94A3B8]">Smart Manager keeps core business functions in reach while giving each team the dedicated workflows it needs to move work forward with precision.</p>
          </div>
          <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <article key={capability.title} className="group relative rounded-2xl border border-white/5 bg-[#131C31] p-6 transition-all hover:-translate-y-1 hover:border-[#C9A96E]/30 hover:bg-[#131C31]/80 hover:shadow-2xl">
                  <span className={`grid h-12 w-12 place-items-center rounded-xl ${capability.tone} transition-transform group-hover:scale-110`}><Icon size={22} /></span>
                  <h3 className="mt-6 text-[17px] font-bold text-white font-heading">{capability.title}</h3>
                  <p className="mt-3 text-[14px] leading-6 text-[#94A3B8]">{capability.description}</p>
                  <Link href="/app" className="mt-6 inline-flex items-center gap-2 text-[13px] font-bold text-[#C9A96E] transition-all group-hover:gap-3">Open in app <ArrowRight size={14} /></Link>
                </article>
              );
            })}
          </div>
        </section>

        {/* Call to Action */}
        <section id="launch" className="mx-auto max-w-7xl px-5 py-24 sm:px-8 lg:px-10">
          <div className="relative overflow-hidden rounded-[2.5rem] border border-[#C9A96E]/20 bg-gradient-to-br from-[#131C31] to-[#0B1120] px-8 py-16 text-center sm:px-16 sm:py-20 gold-glow">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(201,169,110,0.05),transparent_70%)]" />
            <span className="relative z-10 mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#C9A96E] text-[#0B1120] shadow-xl"><Layers3 size={28} /></span>
            <h2 className="relative z-10 mx-auto mt-8 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl font-heading">Ready to enter the command center?</h2>
            <p className="relative z-10 mx-auto mt-6 max-w-xl text-[16px] leading-7 text-[#94A3B8]">Launch the Smart Manager ERP dashboard to work with connected modules and live operational data. Salama na Mwaminifu.</p>
            <div className="relative z-10 mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link href="/app" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#C9A96E] px-8 py-4 text-[15px] font-bold text-[#0B1120] shadow-xl transition-all hover:-translate-y-0.5 hover:bg-[#D4B87F] active:scale-[0.97]">
                Launch Workspace <ArrowRight size={18} />
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-6 border-t border-white/5 pt-12 md:flex-row">
          <BrandLogo variant="compact" className="h-11 w-11" />
          <div className="flex items-center gap-2 text-[12px] font-medium text-[#64748B]">
            <img src="https://upload.wikimedia.org/wikipedia/commons/3/38/Flag_of_Tanzania.svg" alt="Tanzania" className="h-3 w-auto rounded-sm" />
            <span>Imetengenezwa Tanzania</span>
          </div>
          <p className="text-[12px] font-medium text-[#475569]">© 2026 Smart Manager · Enterprise Business Ecosystem</p>
        </div>
      </footer>
    </div>
  );
}
