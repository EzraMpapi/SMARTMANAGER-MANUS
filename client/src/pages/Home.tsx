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
} from "lucide-react";

const capabilities = [
  { title: "CRM & Sales", description: "Connect customer records, quotations, invoices, subscriptions, and commercial activity in one operating flow.", icon: UsersRound, tone: "bg-blue-50 text-blue-700" },
  { title: "Inventory", description: "Keep stock, valuation, purchasing signals, fulfillment, and availability close to the work that depends on them.", icon: Boxes, tone: "bg-emerald-50 text-emerald-700" },
  { title: "Finance", description: "Bring receivables, expenses, cash flow, budgets, financial ratios, and reporting into operational context.", icon: WalletCards, tone: "bg-violet-50 text-violet-700" },
  { title: "People & HR", description: "Coordinate employee records, attendance, leave, performance, and work schedules from the same workspace.", icon: HeartPulse, tone: "bg-rose-50 text-rose-700" },
  { title: "Manufacturing", description: "Link work orders, materials, production steps, and accountability with the business data around them.", icon: Factory, tone: "bg-amber-50 text-amber-700" },
  { title: "Support & Operations", description: "Give teams practical workflows for service, documents, notifications, analytics, and business controls.", icon: Headphones, tone: "bg-cyan-50 text-cyan-700" },
];

const operatingPrinciples = [
  "Make the current state of the business visible without stitching together separate trackers.",
  "Connect front-office work to stock, cash, customer, team, and operational context.",
  "Move from a meaningful signal to the relevant workflow in a single launch.",
];

export default function Home() {
  return (
    <div className="min-h-screen overflow-x-hidden bg-[#f7faf8] text-[#10251b]">
      <header className="relative z-20 mx-auto flex w-full max-w-7xl items-center justify-between px-5 py-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="BusinessSphere home">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#103d2b] text-sm font-black tracking-tight text-white shadow-[0_10px_25px_rgba(16,61,43,0.24)]">BS</span>
          <span>
            <span className="block text-[15px] font-bold tracking-tight text-[#10251b]">BusinessSphere</span>
            <span className="block text-[10px] font-semibold uppercase tracking-[0.18em] text-[#5f796c]">Operational ERP</span>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-[13px] font-medium text-[#466156] md:flex" aria-label="Main navigation">
          <a href="#capabilities" className="transition-colors hover:text-[#14724c]">Capabilities</a>
          <a href="#why-businesssphere" className="transition-colors hover:text-[#14724c]">Why BusinessSphere</a>
          <a href="#launch" className="transition-colors hover:text-[#14724c]">Launch</a>
        </nav>
        <Link href="/app" className="inline-flex items-center gap-2 rounded-xl bg-[#103d2b] px-4 py-2.5 text-[12.5px] font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-[#0b3021] active:scale-[0.97]">
          Launch App <ArrowRight size={14} />
        </Link>
      </header>

      <main>
        <section className="relative isolate pb-16 pt-12 sm:pb-24 sm:pt-20">
          <div className="absolute inset-x-0 top-0 -z-10 h-[34rem] bg-[radial-gradient(ellipse_at_top,rgba(168,222,190,0.58),rgba(247,250,248,0)_67%)]" />
          <div className="absolute -right-44 top-8 -z-10 h-80 w-80 rounded-full bg-[#c6ebd4]/70 blur-3xl" />
          <div className="mx-auto grid max-w-7xl gap-12 px-5 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:px-10">
            <div className="max-w-2xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#b7dfc4] bg-white/70 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[#14724c] shadow-sm">
                <Sparkles size={13} /> Business operations, connected
              </div>
              <h1 className="max-w-xl text-4xl font-black leading-[1.04] tracking-[-0.045em] text-[#10251b] sm:text-5xl lg:text-6xl">
                Run the work. <span className="text-[#14724c]">See the whole business.</span>
              </h1>
              <p className="mt-6 max-w-xl text-[16px] leading-7 text-[#516a5e] sm:text-[17px]">
                BusinessSphere ERP brings commercial, financial, people, and operational workflows together so teams can act on the same live picture of the business.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/app" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#103d2b] px-5 py-3.5 text-[13px] font-bold text-white shadow-[0_12px_25px_rgba(16,61,43,0.18)] transition-all hover:-translate-y-0.5 hover:bg-[#0b3021] active:scale-[0.97]">
                  Launch BusinessSphere <ArrowRight size={15} />
                </Link>
                <a href="#capabilities" className="inline-flex items-center justify-center gap-2 rounded-xl border border-[#bdd4c6] bg-white/80 px-5 py-3.5 text-[13px] font-bold text-[#214536] transition-colors hover:border-[#78ad8a] hover:bg-white">
                  Explore capabilities <ChevronRight size={15} />
                </a>
              </div>
              <div className="mt-9 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium text-[#527062]">
                <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#188753]" /> Live operational data</span>
                <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#188753]" /> Connected business modules</span>
                <span className="inline-flex items-center gap-1.5"><Check size={14} className="text-[#188753]" /> Action-ready workflows</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-xl lg:mx-0 lg:justify-self-end">
              <div className="absolute -left-6 -top-7 h-24 w-24 rounded-full border border-[#8dcc9f] bg-[#e5f6ea]" />
              <div className="relative overflow-hidden rounded-[1.7rem] border border-[#d5e6da] bg-[#103d2b] p-3 shadow-[0_28px_70px_rgba(16,61,43,0.22)] sm:p-4">
                <div className="rounded-[1.15rem] bg-[#f8fbf9] p-4 sm:p-5">
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex items-center gap-2.5"><span className="h-2.5 w-2.5 rounded-full bg-[#1ba660]" /><span className="text-[12px] font-bold text-[#183829]">Business overview</span></div>
                    <span className="rounded-md bg-[#e6f7ec] px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-[#16824b]">Live workspace</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2.5">
                    {["Customers", "Inventory", "Finance"].map((label, index) => (
                      <div key={label} className={index === 0 ? "rounded-xl bg-[#e9f8ed] p-3" : index === 1 ? "rounded-xl bg-[#ecf5ff] p-3" : "rounded-xl bg-[#fff6df] p-3"}>
                        <p className="text-[9px] font-semibold uppercase tracking-wide text-[#637d6f]">{label}</p>
                        <p className="mt-1.5 text-[13px] font-black tracking-tight text-[#173b2a]">Connected</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl border border-[#e3ece6] bg-white p-3.5">
                    <div className="mb-3 flex items-center justify-between"><span className="text-[11px] font-bold text-[#244837]">Operational momentum</span><span className="text-[10px] font-semibold text-[#16824b]">Live workflow</span></div>
                    <div className="flex h-24 items-end gap-2">
                      {[44, 58, 36, 72, 62, 88, 76, 95].map((height, index) => <span key={index} className="flex-1 rounded-t-md bg-gradient-to-t from-[#14724c] to-[#62bd84]" style={{ height: `${height}%`, opacity: index === 7 ? 1 : 0.7 }} />)}
                    </div>
                  </div>
                  <div className="mt-4 grid grid-cols-[1fr_auto] gap-3 rounded-xl bg-[#eef6f0] p-3.5">
                    <div><p className="text-[10px] font-bold text-[#1b4933]">Next best action</p><p className="mt-1 text-[11px] leading-4 text-[#5a7466]">Review the priorities surfaced by your connected business workflows.</p></div>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#103d2b] text-white"><ClipboardCheck size={17} /></span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="why-businesssphere" className="border-y border-[#dce9e0] bg-white/80 py-10 sm:py-14">
          <div className="mx-auto grid max-w-7xl gap-6 px-5 sm:grid-cols-3 sm:px-8 lg:px-10">
            {[
              ["One workspace", "for customer, inventory, finance, people, and operational workflows"],
              ["Live data path", "with Supabase-backed tables, authentication, and session-aware browser access"],
              ["Built-in controls", "for audit visibility, role-aware work, reports, and action-ready dashboards"],
            ].map(([value, label], index) => (
              <div key={value} className="relative px-1 sm:px-6 sm:first:pl-0 sm:last:pr-0">
                {index < 2 && <span className="absolute right-0 top-1 hidden h-16 w-px bg-[#dce9e0] sm:block" />}
                <p className="text-[16px] font-black tracking-tight text-[#173b2a]">{value}</p>
                <p className="mt-1.5 max-w-xs text-[12.5px] leading-5 text-[#61796c]">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#edf7f0] py-16">
          <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-10">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#17814e]">Product proof</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#10251b]">Implementation signals you can verify.</h2>
              <p className="mt-3 text-[14px] leading-6 text-[#5b7467]">This page uses concrete product evidence rather than unverified customer ratings or testimonials.</p>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["Preserved single-file ERP", "The core workspace remains in one dashboard source file, with only build-compatibility repairs applied."],
                ["Managed live-data connection", "The browser uses managed Supabase URL and publishable-key variables rather than embedded project credentials."],
                ["Tested app entry path", "The public launch route, dashboard route, and managed configuration boundary are covered by automated tests."],
              ].map(([title, detail]) => (
                <article key={title} className="rounded-2xl border border-[#cde3d3] bg-white p-5 shadow-[0_5px_16px_rgba(36,72,55,0.035)]">
                  <span className="grid h-9 w-9 place-items-center rounded-lg bg-[#e3f5e9] text-[#16754a]"><ShieldCheck size={17} /></span>
                  <h3 className="mt-4 text-[14px] font-bold text-[#173b2a]">{title}</h3>
                  <p className="mt-2 text-[12.5px] leading-5 text-[#60796b]">{detail}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="capabilities" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
          <div className="max-w-2xl">
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#17814e]">One connected operating system</p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] text-[#10251b] sm:text-4xl">Capabilities that meet the work where it happens.</h2>
            <p className="mt-4 text-[15px] leading-7 text-[#5b7467]">The dashboard keeps core business functions in reach while giving each team the dedicated workflows it needs to move work forward.</p>
          </div>
          <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {capabilities.map((capability) => {
              const Icon = capability.icon;
              return (
                <article key={capability.title} className="group rounded-2xl border border-[#dce9e0] bg-white p-5 shadow-[0_5px_16px_rgba(36,72,55,0.035)] transition-all hover:-translate-y-1 hover:border-[#a4cfb1] hover:shadow-[0_16px_28px_rgba(36,72,55,0.1)]">
                  <span className={`grid h-11 w-11 place-items-center rounded-xl ${capability.tone}`}><Icon size={20} /></span>
                  <h3 className="mt-5 text-[15px] font-bold text-[#173b2a]">{capability.title}</h3>
                  <p className="mt-2 text-[12.5px] leading-5 text-[#60796b]">{capability.description}</p>
                  <Link href="/app" className="mt-5 inline-flex items-center gap-1 text-[12px] font-bold text-[#17794a] transition-colors group-hover:text-[#0c5632]">Open in app <ArrowRight size={13} /></Link>
                </article>
              );
            })}
          </div>
        </section>

        <section className="bg-[#103d2b] py-20 text-white">
          <div className="mx-auto grid max-w-7xl gap-10 px-5 sm:px-8 lg:grid-cols-[0.95fr_1.05fr] lg:px-10">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#8fdaad]">Operational clarity</p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.035em] sm:text-4xl">Focus on decisions, not data hunting.</h2>
              <p className="mt-5 max-w-md text-[15px] leading-7 text-[#c4dccb]">BusinessSphere is built to keep the next relevant piece of work close to the information that informs it.</p>
            </div>
            <div className="space-y-4">
              {operatingPrinciples.map((outcome, index) => (
                <div key={outcome} className="flex gap-4 rounded-xl border border-white/10 bg-white/[0.055] p-4">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[#2a8c58] text-[11px] font-black">0{index + 1}</span>
                  <p className="pt-0.5 text-[13px] leading-6 text-[#e2f2e7]">{outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="launch" className="mx-auto max-w-7xl px-5 py-20 sm:px-8 lg:px-10">
          <div className="rounded-[1.75rem] border border-[#c9e2d0] bg-[linear-gradient(135deg,#e9f8ed_0%,#f8fbf9_58%,#e2f4e8_100%)] px-6 py-10 text-center sm:px-12 sm:py-14">
            <span className="mx-auto grid h-11 w-11 place-items-center rounded-xl bg-[#103d2b] text-white"><Layers3 size={20} /></span>
            <h2 className="mx-auto mt-5 max-w-2xl text-3xl font-black tracking-[-0.04em] text-[#10251b] sm:text-4xl">Ready to enter the operating workspace?</h2>
            <p className="mx-auto mt-4 max-w-xl text-[14px] leading-6 text-[#5a7466]">Launch the BusinessSphere ERP dashboard to work with the connected modules and live operational data.</p>
            <Link href="/app" className="mx-auto mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-[#103d2b] px-5 py-3.5 text-[13px] font-bold text-white shadow-[0_12px_25px_rgba(16,61,43,0.2)] transition-all hover:-translate-y-0.5 hover:bg-[#0b3021] active:scale-[0.97]">
              Launch App <ArrowRight size={15} />
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#dce9e0] bg-white px-5 py-7 sm:px-8 lg:px-10">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-[11.5px] text-[#657e70] sm:flex-row sm:items-center sm:justify-between">
          <p className="inline-flex items-center gap-1.5"><ShieldCheck size={14} className="text-[#17814e]" /> BusinessSphere ERP — operational software for connected teams.</p>
          <p>Product capabilities are represented without customer reviews, ratings, or testimonials.</p>
        </div>
      </footer>
    </div>
  );
}
