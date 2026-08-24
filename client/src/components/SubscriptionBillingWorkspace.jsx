import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowUpRight,
  BadgeCheck,
  Banknote,
  BarChart3,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock3,
  CreditCard,
  Download,
  FileText,
  LoaderCircle,
  LockKeyhole,
  Phone,
  Plus,
  ReceiptText,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Sparkles,
  Users,
  X,
} from "lucide-react";

const money = (amount, currency = "TZS") => new Intl.NumberFormat("en-TZ", { style: "currency", currency, maximumFractionDigits: 0 }).format(Number(amount || 0));
const dateTime = (value) => value ? new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value)) : "—";
const dateOnly = (value) => value ? new Intl.DateTimeFormat("en-TZ", { dateStyle: "medium" }).format(new Date(value)) : "—";
const statusStyle = {
  Active: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Trial: "bg-blue-50 text-blue-700 ring-blue-200",
  Pending: "bg-amber-50 text-amber-700 ring-amber-200",
  Grace: "bg-orange-50 text-orange-700 ring-orange-200",
  Expired: "bg-rose-50 text-rose-700 ring-rose-200",
  Completed: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  Failed: "bg-rose-50 text-rose-700 ring-rose-200",
  Cancelled: "bg-slate-100 text-slate-600 ring-slate-200",
  VerificationRequired: "bg-orange-50 text-orange-700 ring-orange-200",
};

function StatusBadge({ value }) {
  const label = value || "Pending";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusStyle[label] || "bg-slate-100 text-slate-600 ring-slate-200"}`}><span className="h-1.5 w-1.5 rounded-full bg-current" />{label}</span>;
}

function getApiError(body, fallback) {
  return typeof body?.error === "string" && body.error.trim() ? body.error.trim() : fallback;
}

function dataArray(value) {
  return Array.isArray(value) ? value : [];
}

function usageEntries(subscription, plan) {
  if (!subscription || !plan) return [];
  const usage = subscription.metadata?.usage && typeof subscription.metadata.usage === "object" ? subscription.metadata.usage : {};
  return [
    { label: "Users", current: usage.users, limit: plan.included_users },
    { label: "Branches", current: usage.branches, limit: plan.included_branches },
    { label: "Transactions", current: usage.transactions, limit: plan.included_transactions },
    { label: "Storage", current: usage.storageMb, limit: plan.included_storage_mb, unit: " MB" },
  ].filter((item) => item.limit !== null && item.limit !== undefined);
}

export function SubscriptionBillingWorkspace({ accessToken, company, onBack }) {
  const [snapshot, setSnapshot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("overview");
  const [cycle, setCycle] = useState("Monthly");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkout, setCheckout] = useState({ phone: "", description: "" });
  const [payment, setPayment] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({});
  const [planEditor, setPlanEditor] = useState(null);
  const [notice, setNotice] = useState("");
  const pollingRef = useRef(null);

  const headers = useMemo(() => ({
    "content-type": "application/json",
    "x-supabase-authorization": `Bearer ${accessToken || ""}`,
  }), [accessToken]);

  const api = async (path, init = {}) => {
    const response = await fetch(path, { ...init, headers: { ...headers, ...(init.headers || {}) } });
    const body = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(getApiError(body, "The billing request could not be completed."));
    return body;
  };

  const refresh = async () => {
    if (!accessToken) {
      setError("A current workspace session is required to load billing.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/billing/subscription");
      setSnapshot(data);
      setError("");
    } catch (nextError) {
      setError(nextError.message || "Billing could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, [accessToken]);
  useEffect(() => () => { if (pollingRef.current) window.clearInterval(pollingRef.current); }, []);

  const plans = dataArray(snapshot?.plans);
  const checkoutPlans = plans.filter((plan) => plan.status === "Active");
  const payments = dataArray(snapshot?.payments);
  const invoices = dataArray(snapshot?.invoices);
  const notifications = dataArray(snapshot?.notifications);
  const subscription = snapshot?.subscription && Object.keys(snapshot.subscription).length ? snapshot.subscription : null;
  const isPlatformAdmin = Boolean(snapshot?.viewer?.isPlatformAdmin);
  const activePlan = plans.find((plan) => plan.id === subscription?.plan_id) || selectedPlan;
  const pendingPayment = payment || payments.find((item) => item.status === "Pending" && item.provider_order_id);
  const usage = usageEntries(subscription, activePlan);
  const activePaymentCount = payments.filter((item) => item.status === "Completed").length;
  const completedRevenue = payments.filter((item) => item.status === "Completed").reduce((sum, item) => sum + Number(item.amount || 0), 0);

  useEffect(() => {
    const orderId = pendingPayment?.providerOrderId || pendingPayment?.provider_order_id;
    const pending = pendingPayment?.status === "Pending";
    if (!pending || !orderId || !accessToken) return undefined;
    const verify = async () => {
      try {
        const result = await api(`/api/payments/harakapay/status/${encodeURIComponent(orderId)}`);
        setPayment(result);
        if (result.status !== "Pending") {
          window.clearInterval(pollingRef.current);
          pollingRef.current = null;
          await refresh();
        }
      } catch (nextError) {
        setNotice(nextError.message || "Payment status could not be refreshed. You can retry safely.");
      }
    };
    verify();
    pollingRef.current = window.setInterval(verify, 10000);
    return () => { if (pollingRef.current) window.clearInterval(pollingRef.current); pollingRef.current = null; };
  }, [pendingPayment?.providerOrderId, pendingPayment?.provider_order_id, pendingPayment?.status, accessToken]);

  const beginCheckout = (plan) => {
    setSelectedPlan(plan);
    setCheckoutOpen(true);
    setNotice("");
  };

  const startTrial = async (plan) => {
    if (!plan || submitting) return;
    setSubmitting(true);
    setNotice("");
    try {
      const result = await api("/api/billing/trial/start", { method: "POST", body: JSON.stringify({ planCode: plan.code }) });
      const trial = result?.subscription || {};
      setNotice(result?.created === false ? "This company has already used its one-time free trial. Choose a paid package to continue." : `30-Day Free Trial activated for ${plan.name}. No payment has been requested.`);
      setSelectedPlan(plans.find((entry) => entry.id === trial.plan_id) || plan);
      await refresh();
    } catch (nextError) {
      setNotice(nextError.message || "The free trial could not be started.");
    } finally { setSubmitting(false); }
  };

  const selectTrialPlan = async (plan) => {
    if (!plan || submitting) return;
    setSubmitting(true);
    setNotice("");
    try {
      await api("/api/billing/trial/select-plan", { method: "POST", body: JSON.stringify({ planCode: plan.code }) });
      setNotice(`${plan.name} is now your selected package. Your existing 30-day trial end date has not changed.`);
      await refresh();
    } catch (nextError) {
      setNotice(nextError.message || "The selected package could not be updated.");
    } finally { setSubmitting(false); }
  };

  const requestPayment = async (event) => {
    event.preventDefault();
    if (!selectedPlan || submitting) return;
    setSubmitting(true);
    setNotice("");
    try {
      const result = await api("/api/payments/harakapay/collect", {
        method: "POST",
        body: JSON.stringify({
          planId: selectedPlan.id,
          billingCycle: cycle,
          phone: checkout.phone,
          description: checkout.description,
          idempotencyKey: `SM-SUB-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
        }),
      });
      setPayment(result.payment);
      setCheckoutOpen(false);
      setTab("payments");
      setNotice(result.message || "USSD request sent. Confirm the payment on your phone.");
      await refresh();
    } catch (nextError) {
      setNotice(nextError.message || "The payment request could not be started.");
    } finally {
      setSubmitting(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await api("/api/billing/profile", { method: "POST", body: JSON.stringify(profileForm) });
      setEditingProfile(false);
      setNotice("Billing information saved.");
      await refresh();
    } catch (nextError) {
      setNotice(nextError.message || "Billing information could not be saved.");
    } finally { setSubmitting(false); }
  };

  const savePlan = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...planEditor };
      try {
        payload.features = JSON.parse(payload.featuresJson || "{}");
        payload.moduleEntitlements = JSON.parse(payload.moduleEntitlementsJson || "[]");
      } catch {
        throw new Error("Features and module entitlements must use valid JSON.");
      }
      delete payload.featuresJson;
      delete payload.moduleEntitlementsJson;
      await api("/api/billing/plans", { method: "POST", body: JSON.stringify(payload) });
      setPlanEditor(null);
      setNotice("Subscription plan saved and its change was recorded in the billing audit log.");
      await refresh();
    } catch (nextError) {
      setNotice(nextError.message || "The subscription plan could not be saved.");
    } finally { setSubmitting(false); }
  };

  if (loading) return <BillingLoading />;
  if (error) return <BillingError error={error} onRetry={refresh} onBack={onBack} />;

  return (
    <section className="min-h-full space-y-5 bg-[#F7F8FA] p-3 sm:p-5 lg:p-7">
      <header className="overflow-hidden rounded-[26px] bg-[#15191F] px-5 py-6 text-white shadow-[0_20px_50px_rgba(17,24,39,.18)] sm:px-7">
        <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-[#D4AF37]"><Sparkles size={13} /> Smart Manager Billing</div>
            <h1 className="text-[25px] font-bold tracking-[-.045em] sm:text-[32px]">Subscription control, without compromise.</h1>
            <p className="mt-2 max-w-2xl text-[13px] leading-6 text-slate-300">Manage your workspace plan, HarakaPay USSD payments, invoices, and plan usage through server-verified tenant controls.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {onBack && <button type="button" onClick={onBack} className="rounded-xl border border-white/15 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-white/10">Back to workspace</button>}
            <button type="button" onClick={() => { setProfileForm(normalizeProfile(snapshot?.profile)); setEditingProfile(true); }} className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-3.5 py-2 text-[12px] font-semibold text-white transition hover:bg-white/15"><Settings2 size={15} /> Billing details</button>
            <button type="button" onClick={() => { setTab("plans"); }} className="inline-flex items-center gap-2 rounded-xl bg-[#D4AF37] px-3.5 py-2 text-[12px] font-bold text-[#17130A] transition hover:bg-[#E4C15A]"><ArrowUpRight size={15} /> Upgrade plan</button>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <HeroMetric label="Current plan" value={activePlan?.name || "No active plan"} icon={BadgeCheck} />
          <HeroMetric label="Subscription status" value={subscription?.status || "Not subscribed"} icon={ShieldCheck} />
          <HeroMetric label="Next renewal" value={subscription?.expires_at ? dateOnly(subscription.expires_at) : "—"} icon={Clock3} />
        </div>
      </header>

      {notice && <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-[12.5px] text-amber-900"><AlertCircle className="mt-0.5 shrink-0 text-amber-600" size={17} /><p className="flex-1 leading-5">{notice}</p><button type="button" onClick={() => setNotice("")} className="text-amber-700"><X size={16} /></button></div>}

      <TrialBanner subscription={subscription} activePlan={activePlan} notifications={notifications} onChoosePlan={() => setTab("plans")} />

      {pendingPayment?.status === "Pending" && <PaymentWaiting payment={pendingPayment} onRefresh={async () => { const id = pendingPayment.providerOrderId || pendingPayment.provider_order_id; if (!id) return; const result = await api(`/api/payments/harakapay/status/${encodeURIComponent(id)}`); setPayment(result); await refresh(); }} />}

      <div className="flex gap-1 overflow-x-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-sm">
        {[
          ["overview", "Overview", BarChart3], ["plans", "Plans", Sparkles], ["payments", "Payments", CreditCard], ["invoices", "Invoices", ReceiptText], ["usage", "Usage", Users], ["admin", "Plan settings", Settings2],
          ...(isPlatformAdmin ? [["trial-notice-admin", "Trial notice support", ShieldCheck]] : []),
        ].map(([id, label, Icon]) => <button key={id} type="button" onClick={() => setTab(id)} className={`inline-flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-[12px] font-semibold transition ${tab === id ? "bg-[#15191F] text-white shadow-sm" : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"}`}><Icon size={14} />{label}</button>)}
      </div>

      {tab === "overview" && <Overview subscription={subscription} activePlan={activePlan} company={company} payments={payments} invoices={invoices} completedRevenue={completedRevenue} onChoosePlan={() => setTab("plans")} />}
      {tab === "plans" && <CategorizedPlans plans={checkoutPlans} subscription={subscription} activePlan={activePlan} onStartTrial={startTrial} onSelectTrialPlan={selectTrialPlan} onChoosePaidPlan={beginCheckout} submitting={submitting} />}
      {tab === "payments" && <Payments payments={payments} activePaymentCount={activePaymentCount} completedRevenue={completedRevenue} onRetry={(item) => { const plan = plans.find((entry) => entry.id === item.plan_id); if (plan) beginCheckout(plan); }} />}
      {tab === "invoices" && <Invoices invoices={invoices} payments={payments} company={company} />}
      {tab === "usage" && <Usage usage={usage} plan={activePlan} />}
      {tab === "admin" && <PlanSettings plans={plans} onAdd={() => setPlanEditor(emptyPlan())} onEdit={(plan) => setPlanEditor(planToForm(plan))} />}
      {tab === "trial-notice-admin" && isPlatformAdmin && <TrialNoticeAdmin api={api} />}

      {checkoutOpen && <Checkout plan={selectedPlan} cycle={cycle} setCycle={setCycle} values={checkout} setValues={setCheckout} submitting={submitting} onClose={() => setCheckoutOpen(false)} onSubmit={requestPayment} />}
      {editingProfile && <BillingProfile values={profileForm} setValues={setProfileForm} submitting={submitting} onClose={() => setEditingProfile(false)} onSubmit={saveProfile} />}
      {planEditor && <PlanEditor values={planEditor} setValues={setPlanEditor} submitting={submitting} onClose={() => setPlanEditor(null)} onSubmit={savePlan} />}
    </section>
  );
}

function BillingLoading() { return <div className="space-y-5 bg-[#F7F8FA] p-5"><div className="h-56 animate-pulse rounded-[26px] bg-slate-200" /><div className="grid gap-4 md:grid-cols-3">{[1, 2, 3].map((key) => <div key={key} className="h-40 animate-pulse rounded-2xl bg-white" />)}</div></div>; }
function BillingError({ error, onRetry, onBack }) { return <div className="m-6 rounded-3xl border border-rose-100 bg-white p-8 text-center shadow-sm"><AlertCircle className="mx-auto text-rose-500" size={28} /><h2 className="mt-3 text-lg font-bold text-slate-900">Billing is securely unavailable</h2><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">{error}</p><div className="mt-5 flex justify-center gap-2"><button onClick={onRetry} className="inline-flex items-center gap-2 rounded-xl bg-[#15191F] px-4 py-2.5 text-sm font-semibold text-white"><RefreshCw size={15} /> Retry</button>{onBack && <button onClick={onBack} className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700">Back</button>}</div></div>; }
function HeroMetric({ label, value, icon: Icon }) { return <div className="rounded-2xl border border-white/10 bg-white/[.06] p-3.5"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.12em] text-slate-400"><Icon size={13} className="text-[#D4AF37]" />{label}</div><p className="mt-2 truncate text-[15px] font-bold text-white">{value}</p></div>; }

function Overview({ subscription, activePlan, company, payments, invoices, completedRevenue, onChoosePlan }) {
  const active = subscription?.status === "Active" || subscription?.status === "Grace" || subscription?.status === "Trial";
  return <div className="space-y-4"><div className="grid gap-4 xl:grid-cols-[1.3fr_.7fr]"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="text-[10px] font-bold uppercase tracking-[.15em] text-slate-400">Subscription overview</p><div className="mt-3 flex flex-wrap items-center gap-2"><h2 className="text-[22px] font-bold tracking-[-.04em] text-slate-950">{activePlan?.name || "Choose a subscription plan"}</h2>{subscription && <StatusBadge value={subscription.status} />}</div><p className="mt-2 max-w-xl text-[13px] leading-6 text-slate-500">{activePlan?.description || "Plan pricing and included limits are configured by a billing administrator. No plan or price is assumed by Smart Manager."}</p></div><button type="button" onClick={onChoosePlan} className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-[#15191F] px-4 py-2.5 text-[12px] font-bold text-white transition hover:bg-slate-800"><ArrowUpRight size={15} /> {active ? "Change plan" : "Select plan"}</button></div><div className="mt-5 grid gap-3 sm:grid-cols-3"><StatCard label="Billing cycle" value={subscription?.billing_cycle || "—"} icon={RefreshCw} /><StatCard label="Amount" value={subscription ? money(subscription.amount, subscription.currency) : "—"} icon={CircleDollarSign} /><StatCard label="Renewal / expiry" value={subscription?.expires_at ? dateOnly(subscription.expires_at) : "—"} icon={Clock3} /></div></div><div className="rounded-2xl border border-[#E6D38C] bg-[linear-gradient(145deg,#FFFBEB,#FFFFFF)] p-5 shadow-sm"><div className="flex items-center gap-2 text-[#8B6914]"><ShieldCheck size={18} /><p className="text-[11px] font-bold uppercase tracking-[.13em]">Verified payment protection</p></div><p className="mt-3 text-[17px] font-bold tracking-[-.03em] text-slate-950">Every activation is server-confirmed.</p><p className="mt-2 text-[12.5px] leading-5 text-slate-600">Payments activate a plan only after the provider order, amount, and tenant are verified. Browser state never grants subscription access.</p><div className="mt-4 flex items-center gap-2 text-[11px] font-semibold text-[#8B6914]"><LockKeyhole size={13} /> Workspace: {company?.name || "Current company"}</div></div></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Completed payments" value={String(payments.filter((item) => item.status === "Completed").length)} icon={BadgeCheck} /><StatCard label="Paid billing total" value={money(completedRevenue, subscription?.currency || "TZS")} icon={Banknote} /><StatCard label="Invoices" value={String(invoices.length)} icon={FileText} /><StatCard label="Pending payment" value={payments.some((item) => item.status === "Pending") ? "Awaiting action" : "None"} icon={Clock3} /></div></div>;
}
function StatCard({ label, value, icon: Icon }) { return <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"><div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400"><Icon size={14} className="text-[#B88918]" />{label}</div><p className="mt-2 truncate text-[16px] font-bold text-slate-950">{value}</p></div>; }

function Plans({ plans, cycle, setCycle, activePlan, onChoose }) { return <div className="space-y-4"><div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"><div><h2 className="text-[17px] font-bold text-slate-950">Plans designed by your billing administrator</h2><p className="mt-1 text-[12px] text-slate-500">Prices are read from the protected billing configuration; Smart Manager does not invent prices.</p></div><div className="inline-flex rounded-xl bg-slate-100 p-1"><button onClick={() => setCycle("Monthly")} className={`rounded-lg px-3 py-1.5 text-[12px] font-bold ${cycle === "Monthly" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>Monthly</button><button onClick={() => setCycle("Annual")} className={`rounded-lg px-3 py-1.5 text-[12px] font-bold ${cycle === "Annual" ? "bg-white text-slate-950 shadow-sm" : "text-slate-500"}`}>Annual</button></div></div>{plans.length === 0 ? <NoData icon={Sparkles} title="No subscription plans are published" text="A billing administrator must configure an active plan and its real price before a company can start a payment." /> : <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">{plans.map((plan) => { const price = cycle === "Annual" ? plan.annual_price : plan.monthly_price; const current = activePlan?.id === plan.id; const features = Object.entries(plan.features || {}).filter(([, value]) => Boolean(value)).map(([key]) => key.replace(/([A-Z])/g, " $1")).slice(0, 7); return <article key={plan.id} className={`relative overflow-hidden rounded-3xl border bg-white p-5 shadow-sm ${plan.recommended ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/40" : "border-slate-200"}`}>{plan.recommended && <span className="absolute right-4 top-4 rounded-full bg-[#D4AF37] px-2 py-1 text-[10px] font-bold text-[#17130A]">RECOMMENDED</span>}<p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-400">{plan.code}</p><h3 className="mt-2 text-[21px] font-bold tracking-[-.04em] text-slate-950">{plan.name}</h3><p className="mt-2 min-h-10 text-[12.5px] leading-5 text-slate-500">{plan.description || "Configured benefits and limits for this workspace."}</p><div className="mt-5 flex items-end gap-1"><strong className="text-[28px] tracking-[-.05em] text-slate-950">{price === null || price === undefined ? "Contact billing" : money(price, plan.currency)}</strong>{price !== null && price !== undefined && <span className="mb-1 text-[12px] text-slate-400">/ {cycle.toLowerCase()}</span>}</div>{cycle === "Annual" && plan.annual_savings_label && <p className="mt-1 text-[11px] font-semibold text-emerald-700">{plan.annual_savings_label}</p>}<div className="mt-5 space-y-2 border-t border-slate-100 pt-4 text-[12px] text-slate-600"><p className="flex items-center gap-2"><Users size={14} className="text-[#B88918]" />{plan.included_users ?? "—"} included users</p><p className="flex items-center gap-2"><BarChart3 size={14} className="text-[#B88918]" />{plan.included_transactions ?? "—"} included transactions</p>{features.map((feature) => <p key={feature} className="flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-600" />{feature}</p>)}</div><button disabled={current || price === null || price === undefined || Number(price) <= 0} onClick={() => onChoose(plan)} className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#15191F] py-2.5 text-[12px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500">{current ? "Current plan" : <><CreditCard size={14} /> {activePlan ? "Change to this plan" : "Choose plan"}</>}</button></article>; })}</div>}</div>; }

function trialDaysRemaining(subscription) {
  const end = subscription?.trial_ends_at || subscription?.expires_at;
  if (!end) return null;
  return Math.max(0, Math.ceil((new Date(end).getTime() - Date.now()) / 86400000));
}

function TrialBanner({ subscription, activePlan, notifications, onChoosePlan }) {
  const days = trialDaysRemaining(subscription);
  const isTrial = subscription?.status === "Trial";
  const isExpired = subscription?.status === "Expired";
  const latest = notifications.slice(0, 2);
  if (!isTrial && !isExpired && subscription?.status === "Active") return null;
  const progress = isTrial && days !== null ? Math.max(0, Math.min(100, (days / Math.max(1, Number(activePlan?.trial_days || 30))) * 100)) : 0;
  return <section className={`overflow-hidden rounded-3xl border p-5 shadow-sm ${isExpired ? "border-rose-200 bg-[linear-gradient(135deg,#FFF1F2,#FFFFFF)]" : "border-emerald-200 bg-[linear-gradient(135deg,#ECFDF5,#FFFFFF)]"}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><p className={`text-[10px] font-bold uppercase tracking-[.16em] ${isExpired ? "text-rose-700" : "text-emerald-700"}`}>30-DAY FREE TRIAL</p><h2 className="mt-1 text-[21px] font-bold tracking-[-.04em] text-slate-950">{isExpired ? "Trial yako imekwisha." : days === null ? "Anza na siku 30 BURE." : `Siku ${days} zimebaki`}</h2><p className="mt-1 max-w-2xl text-[12.5px] leading-5 text-slate-600">{isExpired ? "Chagua kifurushi kuendelea kutumia huduma za premium. Data ya kampuni yako imehifadhiwa; hakuna malipo ya moja kwa moja yaliyofanyika." : `Selected package: ${activePlan?.name || "Choose a package"}. Hakuna malipo yanayohitajika kuanza trial.`}</p></div><button type="button" onClick={onChoosePlan} className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[12px] font-bold text-white ${isExpired ? "bg-rose-700 hover:bg-rose-800" : "bg-emerald-700 hover:bg-emerald-800"}`}>{isExpired ? "Subscribe Now" : "Choose package"} <ArrowUpRight size={15} /></button></div>
    {isTrial && <><div className="mt-5 h-2.5 overflow-hidden rounded-full bg-emerald-100"><div className="h-full rounded-full bg-emerald-600 transition-[width] duration-300" style={{ width: `${progress}%` }} /></div><div className="mt-2 flex flex-wrap justify-between gap-2 text-[11px] font-semibold text-emerald-900"><span>Trial inaisha: {dateOnly(subscription?.trial_ends_at || subscription?.expires_at)}</span><span>{activePlan?.currency || "TZS"} {Number(activePlan?.monthly_price || 0).toLocaleString()} / mwezi after trial</span></div></>}
    {latest.length > 0 && <div className="mt-4 space-y-2">{latest.map((notification) => <div key={notification.id} className="rounded-xl border border-white/70 bg-white/70 px-3 py-2 text-[11.5px] text-slate-700"><strong>{notification.title}</strong><span className="ml-2 text-slate-500">{notification.message}</span></div>)}</div>}
  </section>;
}

function planTheme(plan) {
  if (plan.visual_theme === "simba-sc") return "border-red-200 bg-[linear-gradient(145deg,#FFF1F2,#FFFFFF)]";
  if (plan.visual_theme === "yanga-sc") return "border-emerald-200 bg-[linear-gradient(145deg,#ECFDF5,#FFFFFF)]";
  if (plan.visual_theme === "azam-fc") return "border-sky-200 bg-[linear-gradient(145deg,#F0F9FF,#FFFFFF)]";
  return plan.recommended ? "border-[#D4AF37] bg-[linear-gradient(145deg,#FFFBEB,#FFFFFF)]" : "border-slate-200 bg-white";
}

function PlanCard({ plan, subscription, activePlan, onStartTrial, onSelectTrialPlan, onChoosePaidPlan, submitting }) {
  const current = activePlan?.id === plan.id;
  const trialing = subscription?.status === "Trial";
  const paid = subscription?.status === "Active" || subscription?.status === "Grace";
  const expired = subscription?.status === "Expired";
  const features = Object.entries(plan.features || {}).filter(([, value]) => Boolean(value)).map(([key]) => key.replace(/([A-Z])/g, " $1")).slice(0, 4);
  const cta = !subscription ? "Subscribe now" : trialing ? (current ? "Selected for trial" : "Select for trial") : paid ? (current ? "Current plan" : "Upgrade / downgrade") : expired ? "Subscribe" : "Start Free Trial";
  const action = () => { if (!subscription) return onChoosePaidPlan(plan); if (trialing) return current ? undefined : onSelectTrialPlan(plan); return current && paid ? undefined : onChoosePaidPlan(plan); };
  return <article className={`relative overflow-hidden rounded-3xl border p-5 shadow-sm ${planTheme(plan)}`}><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.14em] text-slate-500">{plan.plan_category === "Football" ? "Football Fans Special" : "Smart Manager Business Plan"}</p><h3 className="mt-1 text-[21px] font-bold tracking-[-.04em] text-slate-950">{plan.name}</h3></div>{(plan.badge || plan.recommended) && <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[9.5px] font-bold uppercase tracking-[.08em] text-white">{plan.badge || "Popular"}</span>}</div><p className="mt-2 min-h-10 text-[12px] leading-5 text-slate-600">{plan.description}</p><div className="mt-4"><strong className="text-[28px] tracking-[-.05em] text-slate-950">{money(plan.monthly_price, plan.currency)}</strong><span className="ml-1 text-[12px] text-slate-500">/ mwezi</span></div><p className="mt-2 inline-flex rounded-full bg-white/80 px-2.5 py-1 text-[10px] font-bold text-emerald-700 ring-1 ring-emerald-200">30 DAYS FREE TRIAL</p><div className="mt-4 space-y-2 border-t border-slate-200/70 pt-4 text-[11.5px] text-slate-600"><p><Users className="mr-1.5 inline text-slate-500" size={13} />{plan.included_users ?? "—"} users · {plan.included_branches ?? "—"} branches</p><p><BarChart3 className="mr-1.5 inline text-slate-500" size={13} />{plan.included_transactions ?? "—"} transactions</p>{features.map((feature) => <p key={feature}><CheckCircle2 className="mr-1.5 inline text-emerald-600" size={13} />{feature}</p>)}</div><div className="mt-5 space-y-2"><button type="button" disabled={(current && (trialing || paid)) || submitting} onClick={action} className="flex w-full items-center justify-center gap-2 rounded-xl bg-slate-950 py-2.5 text-[12px] font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300">{cta}</button>{!subscription && <button type="button" disabled={submitting} onClick={() => onStartTrial(plan)} className="w-full rounded-xl border border-slate-300 bg-white py-2.5 text-[12px] font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50">Start free trial instead</button>}</div></article>;
}

function CategorizedPlans({ plans, subscription, activePlan, onStartTrial, onSelectTrialPlan, onChoosePaidPlan, submitting }) {
  const business = plans.filter((plan) => plan.plan_category !== "Football");
  const football = plans.filter((plan) => plan.plan_category === "Football");
  const render = (items) => <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{items.map((plan) => <PlanCard key={plan.id} plan={plan} subscription={subscription} activePlan={activePlan} onStartTrial={onStartTrial} onSelectTrialPlan={onSelectTrialPlan} onChoosePaidPlan={onChoosePaidPlan} submitting={submitting} />)}</div>;
  return <div className="space-y-8"><section><div className="mb-4"><p className="text-[10px] font-bold uppercase tracking-[.16em] text-slate-500">Section A</p><h2 className="mt-1 text-[22px] font-bold tracking-[-.04em] text-slate-950">SMART MANAGER BUSINESS PLANS</h2><p className="mt-1 text-[12.5px] text-slate-500">Every package starts with a one-time 30-day free trial. Prices are controlled by the protected database catalog.</p></div>{render(business)}</section><section className="rounded-[28px] border border-slate-200 bg-slate-950 p-4 sm:p-6"><div className="mb-5"><p className="text-[10px] font-bold uppercase tracking-[.17em] text-amber-300">Section B</p><h2 className="mt-1 text-[24px] font-bold tracking-[-.04em] text-white">⚽ FOOTBALL FANS SPECIAL</h2><p className="mt-1 text-[13px] text-slate-300">Chagua timu yako. Furahia SMART MANAGER kwa bei maalum.</p><p className="mt-1 text-[11px] text-slate-400">Abstract club-themed colors only; no unlicensed club logos are used.</p></div>{render(football)}</section></div>;
}

function PaymentWaiting({ payment, onRefresh }) { return <div className="rounded-2xl border border-amber-200 bg-[linear-gradient(120deg,#FFFBEB,#FFFFFF)] p-4 shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-center"><div className="grid h-11 w-11 place-items-center rounded-2xl bg-amber-100 text-amber-700"><LoaderCircle className="animate-spin" size={20} /></div><div className="flex-1"><p className="text-[13px] font-bold text-amber-950">Waiting for payment approval</p><p className="mt-0.5 text-[12px] text-amber-800">Approve the USSD request on your phone. Smart Manager checks the server-verified provider status every 10 seconds.</p><p className="mt-1 font-mono text-[11px] text-amber-700">Order: {payment.providerOrderId || payment.provider_order_id || "Dispatching"}</p></div><button onClick={onRefresh} className="inline-flex items-center justify-center gap-2 rounded-xl border border-amber-300 bg-white px-3 py-2 text-[12px] font-bold text-amber-900"><RefreshCw size={14} /> Check now</button></div></div>; }

function Payments({ payments, activePaymentCount, completedRevenue, onRetry }) { return <div className="space-y-4"><div className="grid gap-4 sm:grid-cols-3"><StatCard label="Completed" value={String(activePaymentCount)} icon={CheckCircle2} /><StatCard label="Payment requests" value={String(payments.length)} icon={CreditCard} /><StatCard label="Payment value" value={money(completedRevenue)} icon={Banknote} /></div><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-[16px] font-bold text-slate-950">Payment history</h2><p className="mt-1 text-[12px] text-slate-500">Server-created payment records with provider order and verification states.</p></div>{payments.length === 0 ? <NoData icon={CreditCard} title="No subscription payments yet" text="Start from a published plan. A payment record is created before the USSD request is dispatched." /> : <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400"><tr><th className="px-5 py-3">Date / reference</th><th className="px-5 py-3">Plan</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Order ID</th><th className="px-5 py-3">Status</th><th className="px-5 py-3" /></tr></thead><tbody>{payments.map((item) => <tr key={item.id} className="border-t border-slate-100 text-[12px]"><td className="px-5 py-4"><p className="font-mono font-semibold text-slate-800">{item.internal_reference}</p><p className="mt-1 text-slate-400">{dateTime(item.created_at)}</p></td><td className="px-5 py-4 text-slate-600">{item.provider_response?.planName || item.provider_response?.planName || "Subscription"}<p className="mt-1 text-[11px] text-slate-400">{item.billing_cycle}</p></td><td className="px-5 py-4 font-semibold text-slate-900">{money(item.amount, item.currency)}<p className="mt-1 text-[11px] font-normal text-slate-400">Fee {item.fee === null || item.fee === undefined ? "pending" : money(item.fee, item.currency)}</p></td><td className="px-5 py-4 font-mono text-[11px] text-slate-500">{item.provider_order_id || "Awaiting dispatch"}</td><td className="px-5 py-4"><StatusBadge value={item.status} />{item.failure_reason && <p className="mt-1 max-w-48 text-[10px] leading-4 text-rose-600">{item.failure_reason}</p>}</td><td className="px-5 py-4 text-right">{["Failed", "Cancelled"].includes(item.status) && <button onClick={() => onRetry(item)} className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50">Try again</button>}</td></tr>)}</tbody></table></div>}</div></div>; }

function Invoices({ invoices, payments, company }) { return <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h2 className="text-[16px] font-bold text-slate-950">Subscription invoices & receipts</h2><p className="mt-1 text-[12px] text-slate-500">Invoice records are created only after server-verified payment completion.</p></div>{invoices.length === 0 ? <NoData icon={ReceiptText} title="No subscription invoices yet" text="When a payment is verified as completed, Smart Manager creates one tenant-scoped paid invoice and receipt record." /> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400"><tr><th className="px-5 py-3">Invoice</th><th className="px-5 py-3">Issued</th><th className="px-5 py-3">Amount</th><th className="px-5 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-t border-slate-100 text-[12px]"><td className="px-5 py-4"><p className="font-mono font-semibold text-slate-800">{invoice.invoice_number}</p><p className="mt-1 text-slate-400">{company?.name || "Current company"}</p></td><td className="px-5 py-4 text-slate-600">{dateTime(invoice.issued_at)}</td><td className="px-5 py-4 font-semibold text-slate-950">{money(invoice.total_amount, invoice.currency)}</td><td className="px-5 py-4"><StatusBadge value={invoice.status} /></td><td className="px-5 py-4 text-right"><button onClick={() => printInvoice(invoice, company, payments.find((item) => item.id === invoice.payment_id))} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-2.5 py-1.5 text-[11px] font-bold text-slate-700 hover:bg-slate-50"><Download size={13} /> Print / save PDF</button></td></tr>)}</tbody></table></div>}</div>; }

function Usage({ usage, plan }) { return <div className="space-y-4"><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><h2 className="text-[17px] font-bold text-slate-950">Plan usage</h2><p className="mt-1 text-[12px] text-slate-500">Usage is displayed only when it has been recorded by the server. Limits come from the selected subscription plan.</p></div>{!plan ? <NoData icon={Users} title="Usage begins with an active plan" text="Select and verify a subscription plan to enable plan-limit monitoring for this workspace." /> : usage.length === 0 ? <NoData icon={BarChart3} title="No usage limits are configured" text="This plan does not yet define a measurable user, branch, transaction, or storage limit." /> : <div className="grid gap-4 md:grid-cols-2">{usage.map((item) => { const current = Number(item.current || 0); const limit = Number(item.limit || 0); const percent = limit > 0 ? Math.min(100, Math.round((current / limit) * 100)) : 0; return <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-end justify-between gap-3"><div><p className="text-[11px] font-bold uppercase tracking-[.13em] text-slate-400">{item.label}</p><p className="mt-2 text-[22px] font-bold tracking-[-.04em] text-slate-950">{item.current === undefined || item.current === null ? "Not recorded" : `${current.toLocaleString()} / ${limit.toLocaleString()}${item.unit || ""}`}</p></div><span className="text-[12px] font-bold text-slate-500">{item.current === undefined || item.current === null ? "—" : `${percent}%`}</span></div><div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${percent >= 90 ? "bg-rose-500" : percent >= 75 ? "bg-amber-500" : "bg-emerald-500"}`} style={{ width: `${item.current === undefined || item.current === null ? 0 : percent}%` }} /></div></div>; })}</div>}</div>; }

function PlanSettings({ plans, onAdd, onEdit }) { return <div className="space-y-4"><div className="flex flex-col justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:flex-row sm:items-center"><div><h2 className="text-[17px] font-bold text-slate-950">Subscription plan settings</h2><p className="mt-1 text-[12px] text-slate-500">Create and publish real plans with actual prices, limits, and entitlements. Draft plans are intentionally hidden from checkout.</p></div><button onClick={onAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#15191F] px-4 py-2.5 text-[12px] font-bold text-white"><Plus size={15} /> Add plan</button></div>{plans.length === 0 ? <NoData icon={Settings2} title="No active plans" text="Add a plan and set it to Active when its pricing and features are approved." /> : <div className="grid gap-4 lg:grid-cols-2">{plans.map((plan) => <button key={plan.id} onClick={() => onEdit(plan)} className="group rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:border-[#D4AF37] hover:shadow-md"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">{plan.code}</p><h3 className="mt-1 text-[17px] font-bold text-slate-950">{plan.name}</h3></div><ChevronRight className="text-slate-300 transition group-hover:text-[#B88918]" size={18} /></div><div className="mt-4 flex flex-wrap gap-2 text-[11px]"><StatusBadge value={plan.status} /><span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">Monthly: {plan.monthly_price === null || plan.monthly_price === undefined ? "Not set" : money(plan.monthly_price, plan.currency)}</span><span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-600">Annual: {plan.annual_price === null || plan.annual_price === undefined ? "Not set" : money(plan.annual_price, plan.currency)}</span></div></button>)}</div>}</div>; }

function TrialNoticeAdmin({ api }) {
  const [filters, setFilters] = useState({ companyId: "", userId: "", subscriptionId: "" });
  const [reason, setReason] = useState("");
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams(Object.entries(filters).filter(([, value]) => value.trim()).map(([key, value]) => [key, value.trim()]));
      const result = await api(`/api/billing/admin/trial-expiry-notices${params.toString() ? `?${params.toString()}` : ""}`);
      setRows(Array.isArray(result?.notices) ? result.notices : []);
    } catch (nextError) {
      setError(nextError.message || "Support data could not be loaded.");
    } finally { setLoading(false); }
  };

  const reset = async (row) => {
    const resetReason = reason.trim();
    if (resetReason.length < 5) { setError("Enter a support/testing reason of at least five characters before resetting."); return; }
    setLoading(true);
    setError("");
    setMessage("");
    try {
      await api("/api/billing/admin/trial-expiry-notices/reset", { method: "POST", body: JSON.stringify({ companyId: row.company_id, userId: row.user_id, subscriptionId: row.subscription_id, reason: resetReason }) });
      setMessage("The notice was reset and the action was recorded in the audit log.");
      await load();
    } catch (nextError) {
      setError(nextError.message || "The notice could not be reset.");
    } finally { setLoading(false); }
  };

  return <div className="space-y-4"><div className="rounded-2xl border border-amber-200 bg-amber-50 p-5"><div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-amber-700" size={19} /><div><h2 className="text-[17px] font-bold text-amber-950">Global Admin trial-notice support</h2><p className="mt-1 text-[12px] leading-5 text-amber-900">Inspect the durable per-user notice state or reset it only for a documented support/testing reason. Every reset writes a Subscription Billing audit event.</p></div></div></div><div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="grid gap-3 md:grid-cols-3"><Field label="Company ID"><input value={filters.companyId} onChange={(event) => setFilters({ ...filters, companyId: event.target.value })} className={inputClass} placeholder="Optional UUID" /></Field><Field label="User ID"><input value={filters.userId} onChange={(event) => setFilters({ ...filters, userId: event.target.value })} className={inputClass} placeholder="Optional Auth UUID" /></Field><Field label="Subscription ID"><input value={filters.subscriptionId} onChange={(event) => setFilters({ ...filters, subscriptionId: event.target.value })} className={inputClass} placeholder="Optional UUID" /></Field></div><Field label="Reset reason" hint="Required only when resetting a row; keep it specific and support-related."><input value={reason} onChange={(event) => setReason(event.target.value)} maxLength={1000} className={inputClass} placeholder="e.g. Disposable staging fixture reset" /></Field><button type="button" onClick={load} disabled={loading} className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[#15191F] px-4 py-2.5 text-[12px] font-bold text-white disabled:opacity-50"><RefreshCw size={14} /> {loading ? "Loading…" : "Inspect notice state"}</button></div>{message && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-[12px] text-emerald-800">{message}</div>}{error && <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-[12px] text-rose-800">{error}</div>}<div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-5 py-4"><h3 className="text-[15px] font-bold text-slate-950">Notice records</h3><p className="mt-1 text-[12px] text-slate-500">No row is changed by inspection.</p></div>{rows.length === 0 ? <NoData icon={ShieldCheck} title="No notice records loaded" text="Filter by a specific company, user, or subscription, then inspect the live server state." /> : <div className="overflow-x-auto"><table className="w-full min-w-[900px] text-left"><thead className="bg-slate-50 text-[10px] font-bold uppercase tracking-[.13em] text-slate-400"><tr><th className="px-5 py-3">Company / user</th><th className="px-5 py-3">Subscription</th><th className="px-5 py-3">State</th><th className="px-5 py-3">Updated</th><th className="px-5 py-3 text-right">Action</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id} className="border-t border-slate-100 text-[12px]"><td className="px-5 py-4"><p className="font-mono text-[11px] text-slate-700">{row.company_id}</p><p className="mt-1 font-mono text-[11px] text-slate-500">{row.user_id}</p></td><td className="px-5 py-4 font-mono text-[11px] text-slate-600">{row.subscription_id}</td><td className="px-5 py-4"><StatusBadge value={row.notice_shown ? "Completed" : "Pending"} /><p className="mt-1 text-[10px] text-slate-500">Claims: {row.claim_count || 0} · Resets: {row.reset_count || 0}</p></td><td className="px-5 py-4 text-slate-500">{dateTime(row.updated_at)}</td><td className="px-5 py-4 text-right"><button type="button" onClick={() => reset(row)} disabled={loading || !row.notice_shown} className="rounded-lg border border-amber-300 px-2.5 py-1.5 text-[11px] font-bold text-amber-800 disabled:cursor-not-allowed disabled:opacity-40">Reset notice</button></td></tr>)}</tbody></table></div>}</div></div>;
}

function NoData({ icon: Icon, title, text }) { return <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-12 text-center"><div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-slate-100 text-slate-500"><Icon size={20} /></div><h3 className="mt-3 text-[15px] font-bold text-slate-900">{title}</h3><p className="mx-auto mt-2 max-w-md text-[12.5px] leading-5 text-slate-500">{text}</p></div>; }
function normalizeProfile(profile) { return { legalName: profile?.legal_name || "", contactName: profile?.contact_name || "", email: profile?.email || "", phone: profile?.phone || "", taxIdentifier: profile?.tax_identifier || "", notes: profile?.notes || "", address: profile?.address || {} }; }
function emptyPlan() { return { code: "", name: "", description: "", status: "Draft", currency: "TZS", monthlyPrice: "", annualPrice: "", annualSavingsLabel: "", includedUsers: "", includedBranches: "", includedStorageMb: "", includedTransactions: "", featuresJson: "{}", moduleEntitlementsJson: "[]", sortOrder: "0", recommended: false, planCategory: "Business", badge: "", visualTheme: "standard", trialDays: "30", isGlobal: false }; }
function planToForm(plan) { return { planId: plan.id, code: plan.code || "", name: plan.name || "", description: plan.description || "", status: plan.status || "Draft", currency: plan.currency || "TZS", monthlyPrice: plan.monthly_price ?? "", annualPrice: plan.annual_price ?? "", annualSavingsLabel: plan.annual_savings_label || "", includedUsers: plan.included_users ?? "", includedBranches: plan.included_branches ?? "", includedStorageMb: plan.included_storage_mb ?? "", includedTransactions: plan.included_transactions ?? "", featuresJson: JSON.stringify(plan.features || {}, null, 2), moduleEntitlementsJson: JSON.stringify(plan.module_entitlements || [], null, 2), sortOrder: plan.sort_order ?? "0", recommended: Boolean(plan.recommended), planCategory: plan.plan_category || "Business", badge: plan.badge || "", visualTheme: plan.visual_theme || "standard", trialDays: plan.trial_days ?? "30", isGlobal: !plan.company_id }; }

function Checkout({ plan, cycle, setCycle, values, setValues, submitting, onClose, onSubmit }) { const price = cycle === "Annual" ? plan?.annual_price : plan?.monthly_price; const validPhone = /^(?:\+?255|0)[67]\d{8}$/.test(String(values.phone).replace(/[\s-]/g, "")); return <Modal title="Secure USSD checkout" subtitle="Plan activation occurs only after Smart Manager confirms the provider payment status on the server." onClose={onClose}><form onSubmit={onSubmit} className="space-y-4"><div className="rounded-2xl bg-slate-50 p-4"><div className="flex items-start justify-between gap-3"><div><p className="text-[10px] font-bold uppercase tracking-[.13em] text-slate-400">Selected plan</p><p className="mt-1 text-[17px] font-bold text-slate-950">{plan?.name}</p><p className="mt-1 text-[12px] text-slate-500">{cycle} billing</p></div><strong className="text-[17px] text-slate-950">{money(price, plan?.currency)}</strong></div><div className="mt-3 inline-flex rounded-xl bg-white p-1 shadow-sm"><button type="button" onClick={() => setCycle("Monthly")} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${cycle === "Monthly" ? "bg-[#15191F] text-white" : "text-slate-500"}`}>Monthly</button><button type="button" onClick={() => setCycle("Annual")} className={`rounded-lg px-3 py-1.5 text-[11px] font-bold ${cycle === "Annual" ? "bg-[#15191F] text-white" : "text-slate-500"}`}>Annual</button></div></div><Field label="Tanzanian mobile number" hint="Example: 0712 345 678 or +255 712 345 678"><div className="relative"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input required value={values.phone} onChange={(event) => setValues((current) => ({ ...current, phone: event.target.value }))} className="w-full rounded-xl border border-slate-200 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#B88918] focus:ring-2 focus:ring-[#D4AF37]/20" placeholder="0712 345 678" /></div>{values.phone && !validPhone && <p className="mt-1 text-[11px] text-rose-600">Enter a valid Tanzania mobile number.</p>}</Field><Field label="Payment description (optional)"><input value={values.description} onChange={(event) => setValues((current) => ({ ...current, description: event.target.value }))} maxLength={250} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#B88918] focus:ring-2 focus:ring-[#D4AF37]/20" placeholder="Smart Manager subscription" /></Field><div className="flex items-start gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-[11.5px] leading-5 text-emerald-900"><ShieldCheck size={15} className="mt-0.5 shrink-0" />Payment is sent from the server. Your browser never receives a provider API key and cannot activate a plan by itself.</div><div className="flex gap-2 pt-2"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[12px] font-bold text-slate-700">Cancel</button><button disabled={!validPhone || submitting || !price || Number(price) <= 0} className="flex-1 rounded-xl bg-[#15191F] py-2.5 text-[12px] font-bold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{submitting ? <span className="inline-flex items-center gap-2"><LoaderCircle className="animate-spin" size={15} /> Sending request</span> : <span className="inline-flex items-center gap-2"><CreditCard size={15} /> Pay with USSD Push</span>}</button></div></form></Modal>; }
function BillingProfile({ values, setValues, submitting, onClose, onSubmit }) { return <Modal title="Billing information" subtitle="This company-scoped information appears on subscription invoices and receipts." onClose={onClose}><form onSubmit={onSubmit} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Legal company name"><input value={values.legalName} onChange={(event) => setValues({ ...values, legalName: event.target.value })} className={inputClass} /></Field><Field label="Billing contact"><input value={values.contactName} onChange={(event) => setValues({ ...values, contactName: event.target.value })} className={inputClass} /></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Billing email"><input type="email" value={values.email} onChange={(event) => setValues({ ...values, email: event.target.value })} className={inputClass} /></Field><Field label="Billing phone"><input value={values.phone} onChange={(event) => setValues({ ...values, phone: event.target.value })} className={inputClass} /></Field></div><Field label="Tax identifier"><input value={values.taxIdentifier} onChange={(event) => setValues({ ...values, taxIdentifier: event.target.value })} className={inputClass} /></Field><Field label="Notes"><textarea value={values.notes} onChange={(event) => setValues({ ...values, notes: event.target.value })} rows={3} className={inputClass} /></Field><SubmitRow submitting={submitting} onClose={onClose} label="Save billing details" /></form></Modal>; }
function PlanEditor({ values, setValues, submitting, onClose, onSubmit }) {
  const set = (key, value) => setValues({ ...values, [key]: value });
  return <Modal title={values.planId ? "Edit subscription plan" : "Add subscription plan"} subtitle="Price, features, limits, and trial rules are audited server-side. Only platform administrators can save a global official package." onClose={onClose}><form onSubmit={onSubmit} className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><Field label="Plan code" required><input required value={values.code} onChange={(event) => set("code", event.target.value)} className={inputClass} placeholder="BUSINESS" /></Field><Field label="Plan name" required><input required value={values.name} onChange={(event) => set("name", event.target.value)} className={inputClass} placeholder="Business" /></Field></div><Field label="Description"><textarea value={values.description} onChange={(event) => set("description", event.target.value)} rows={2} className={inputClass} /></Field><div className="grid gap-3 sm:grid-cols-3"><Field label="Status"><select value={values.status} onChange={(event) => set("status", event.target.value)} className={inputClass}><option>Draft</option><option>Active</option><option>Archived</option></select></Field><Field label="Monthly price (TZS)"><input type="number" min="0" step="0.01" value={values.monthlyPrice} onChange={(event) => set("monthlyPrice", event.target.value)} className={inputClass} /></Field><Field label="Trial days"><input type="number" min="0" max="90" value={values.trialDays} onChange={(event) => set("trialDays", event.target.value)} className={inputClass} /></Field></div><div className="grid gap-3 sm:grid-cols-3"><Field label="Category"><select value={values.planCategory} onChange={(event) => set("planCategory", event.target.value)} className={inputClass}><option>Business</option><option>Football</option></select></Field><Field label="Badge"><input value={values.badge} onChange={(event) => set("badge", event.target.value)} className={inputClass} placeholder="Popular" /></Field><Field label="Visual theme"><select value={values.visualTheme} onChange={(event) => set("visualTheme", event.target.value)} className={inputClass}><option value="standard">Standard</option><option value="twiga">Twiga</option><option value="tembo">Tembo</option><option value="simba">Simba</option><option value="simba-sc">Simba SC abstract</option><option value="yanga-sc">Yanga SC abstract</option><option value="azam-fc">Azam FC abstract</option></select></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Annual price"><input type="number" min="0" step="0.01" value={values.annualPrice} onChange={(event) => set("annualPrice", event.target.value)} className={inputClass} /></Field><Field label="Currency"><input value={values.currency} onChange={(event) => set("currency", event.target.value.toUpperCase())} maxLength={3} className={inputClass} /></Field></div><div className="grid gap-3 sm:grid-cols-2"><Field label="Included users"><input type="number" min="0" value={values.includedUsers} onChange={(event) => set("includedUsers", event.target.value)} className={inputClass} /></Field><Field label="Included branches"><input type="number" min="0" value={values.includedBranches} onChange={(event) => set("includedBranches", event.target.value)} className={inputClass} /></Field><Field label="Included transactions"><input type="number" min="0" value={values.includedTransactions} onChange={(event) => set("includedTransactions", event.target.value)} className={inputClass} /></Field><Field label="Included storage (MB)"><input type="number" min="0" value={values.includedStorageMb} onChange={(event) => set("includedStorageMb", event.target.value)} className={inputClass} /></Field></div><Field label="Feature flags JSON" hint='Example: {"advancedReports": true}'><textarea value={values.featuresJson} onChange={(event) => set("featuresJson", event.target.value)} rows={4} className={`${inputClass} font-mono text-[11px]`} /></Field><Field label="Module entitlements JSON" hint='Example: ["finance", "inventory"]'><textarea value={values.moduleEntitlementsJson} onChange={(event) => set("moduleEntitlementsJson", event.target.value)} rows={3} className={`${inputClass} font-mono text-[11px]`} /></Field><div className="grid gap-2 sm:grid-cols-2"><label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-700"><input type="checkbox" checked={values.recommended} onChange={(event) => set("recommended", event.target.checked)} /> Mark as recommended</label><label className="flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-[12px] font-semibold text-slate-700"><input type="checkbox" checked={values.isGlobal} onChange={(event) => set("isGlobal", event.target.checked)} /> Official global package</label></div><SubmitRow submitting={submitting} onClose={onClose} label="Save audited plan" /></form></Modal>;
}
function Field({ label, hint, required, children }) { return <label className="block"><span className="text-[11px] font-bold text-slate-600">{label}{required && <span className="text-rose-600"> *</span>}</span>{hint && <span className="mt-0.5 block text-[10.5px] leading-4 text-slate-400">{hint}</span>}<div className="mt-1.5">{children}</div></label>; }
function Modal({ title, subtitle, onClose, children }) { return <div className="fixed inset-0 z-[90] flex items-end justify-center bg-slate-950/50 p-0 backdrop-blur-sm sm:items-center sm:p-5"><div className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-t-[28px] bg-white p-5 shadow-2xl sm:rounded-[28px] sm:p-6"><div className="mb-5 flex items-start justify-between gap-4"><div><h2 className="text-[20px] font-bold tracking-[-.04em] text-slate-950">{title}</h2><p className="mt-1 max-w-xl text-[12px] leading-5 text-slate-500">{subtitle}</p></div><button onClick={onClose} className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" aria-label="Close"><X size={18} /></button></div>{children}</div></div>; }
function SubmitRow({ submitting, onClose, label }) { return <div className="flex gap-2 pt-3"><button type="button" onClick={onClose} className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[12px] font-bold text-slate-700">Cancel</button><button disabled={submitting} className="flex-1 rounded-xl bg-[#15191F] py-2.5 text-[12px] font-bold text-white disabled:bg-slate-300">{submitting ? "Saving…" : label}</button></div>; }
const inputClass = "w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition focus:border-[#B88918] focus:ring-2 focus:ring-[#D4AF37]/20";

function printInvoice(invoice, company, payment) { const content = `<!doctype html><html><head><title>${invoice.invoice_number}</title><style>body{font-family:Inter,Arial,sans-serif;padding:42px;color:#172033}h1{font-size:25px;margin:0}p{line-height:1.5}.card{border:1px solid #e5e7eb;border-radius:16px;padding:24px;margin-top:24px}.row{display:flex;justify-content:space-between;gap:18px;border-bottom:1px solid #f1f5f9;padding:10px 0}.muted{color:#64748b;font-size:12px}</style></head><body><h1>SMART MANAGER</h1><p class="muted">Subscription billing receipt</p><div class="card"><div class="row"><span>Company</span><strong>${escapeHtml(company?.name || "Current company")}</strong></div><div class="row"><span>Invoice number</span><strong>${escapeHtml(invoice.invoice_number)}</strong></div><div class="row"><span>Issued</span><strong>${escapeHtml(dateTime(invoice.issued_at))}</strong></div><div class="row"><span>Payment order</span><strong>${escapeHtml(payment?.provider_order_id || "—")}</strong></div><div class="row"><span>Status</span><strong>${escapeHtml(invoice.status)}</strong></div><div class="row"><span>Total</span><strong>${escapeHtml(money(invoice.total_amount, invoice.currency))}</strong></div><div class="row"><span>Paid</span><strong>${escapeHtml(money(invoice.paid_amount, invoice.currency))}</strong></div></div><p class="muted">This receipt reflects a server-verified subscription payment.</p><script>window.print();</script></body></html>`; const popup = window.open("", "_blank", "noopener,noreferrer"); if (popup) { popup.document.write(content); popup.document.close(); } }
function escapeHtml(value) { return String(value ?? "").replace(/[&<>'"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char])); }
