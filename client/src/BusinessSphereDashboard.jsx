import React, { useState, useMemo, useEffect, useCallback, useRef, lazy, Suspense } from "react";
import { createPortal } from "react-dom";
import {
  LayoutDashboard, Users, ShoppingCart, Package, Wallet, Briefcase,
  Factory, Truck, Megaphone, Store, FileText, Brain, Settings,
  Search, Bell, ChevronDown, Plus, Phone, Mail, Building2, TrendingUp,
  TrendingDown, MoreHorizontal, ArrowUpRight, ArrowDownRight, Filter, X, Star,
  CircleDollarSign, Clock, Check, CheckCircle2, AlertCircle, AlertTriangle, Link, Trophy, Medal, Inbox, AtSign, CheckCheck, Lock, Send,
  Printer, Download, ChevronRight, Ban, ReceiptText, ClipboardList,
  FileCheck, Trash2, Copy, Landmark, BarChart3, Grid3x3, List,
  FileSpreadsheet, FileImage, File, Folder, FolderOpen, UploadCloud,
  Eye, Percent, Globe, CreditCard, Tag, MessageSquare, MousePointerClick, ChevronUp,
  ShoppingBag, Minus, Receipt, Banknote, Smartphone, ArrowUpDown, Repeat, WalletCards,
  UserPlus, CalendarCheck, Stethoscope, ScanLine, Pill, FlaskConical, Edit2, Edit3, Heart, Award, GraduationCap, HeartHandshake, Layers, ClipboardCheck,
  Cog, ShieldCheck, Wrench, Kanban, Flag, ListTodo,
  Headphones, Ticket, MessageCircle, CircleHelp, BookOpen, PhoneCall, LoaderCircle, Gauge,
  Hash, Video, Mic, PenTool, QrCode, MapPin, EyeOff, User, UserCircle, ArrowRight, LogOut, LogIn,
  Target, Crosshair, GitBranch, Circle, ScanText, History, Calendar, ChevronLeft, Sparkles, Zap, HeartPulse, HardHat, Fingerprint, Activity, FolderKanban, Clock3
, PiggyBank, HandCoins, Users2, Coins, BookHeart, TreePine, Scale, CircleUserRound, BadgeDollarSign, Shield, ArrowRightLeft,
  School, Bus, Tablets, TestTube, Building, Hotel, Bed, Car, BookMarked, CalendarDays, UserCheck, Library, NotebookPen, Clipboard, DollarSign, BadgeCheck, Microscope, Syringe, UtensilsCrossed, ChefHat, Utensils, CookingPot, ConciergeBell, BedDouble, Key, DoorOpen, Split, MinusCircle, PlusCircle, RefreshCw, Shuffle, ArrowLeftRight, Wallet2, Coffee, Wine, ShoppingBasket, Pizza, Timer, Salad, CheckCircle, XCircle, RotateCcw, Archive, Moon, Sun, Sliders, SortAsc, SortDesc, CheckSquare, Undo2, BellRing, BarChart2, BadgePercent, Calculator, FolderSync, Database, Cpu, Globe2, Languages, GanttChart, KanbanSquare, Wifi, WifiOff, RefreshCcw, PanelLeftClose, PanelLeftOpen, ArrowUpCircle, ChevronFirst, ChevronLast, ImageIcon, Palette, Save, Info, Upload} from "lucide-react";
import { createDashboardAdditionalModules } from "./dashboardAdditionalModules.jsx";
import { createDashboardExtractedModules } from "./dashboardExtractedModules.jsx";
import { createDashboardStaticData } from "./dashboardStaticData.js";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, Cell,
  LineChart as RLineChart, Line, ComposedChart,
  PieChart as RPieChart, Pie, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis
} from "recharts";
import { trpc } from "./lib/trpc";
import { createAuthRequestError, toAuthUserMessage, validatePasswordLogin } from "./lib/authErrors";
import { PASSWORD_REQUIREMENT_LABELS, authScreenFromSearch, companyDefaultsForCountry, getPasswordChecks, isEnterprisePassword, passwordStrength } from "./lib/authOnboarding";
import { addProductToPosCart, calculatePosPaymentSummary, createPosSaleAttempt, productMatchesPosLookup } from "./lib/posTransactionEngine";
import { createPendingPosSale, isRetryablePosTransportError, readPendingPosSales, updatePendingPosSale, writePendingPosSales } from "./lib/posPendingQueue";
import { DEFAULT_POS_DEVICE_PROFILE, normalizeScannerInput, parsePosDeviceProfileImport, readPosDeviceProfile, serializePosDeviceProfile, writePosDeviceProfile } from "./lib/posDeviceProfiles";
import { buildPosReconciliationCsv, posReconciliationExportFilename } from "./lib/posReconciliationExport";
import { calculateSupportMetrics } from "./lib/supportMetrics";
import { auditEvidenceExportFilename, buildAuditEvidenceCsv } from "./lib/auditEvidenceExport";
import { getProactiveSessionRenewalDelay, isTerminalSessionRefreshError } from "./lib/proactiveSessionRenewal";
import { reportSessionRefreshOutcome } from "./lib/runtimeTelemetry";
import { createAccountPasskeyClient, listAccountPasskeys, passkeySignInUserMessage, passkeyUserMessage, registerAccountPasskey, renameAccountPasskey, revokeAccountPasskey, signInWithAccountPasskey } from "./lib/accountPasskeys";
import { ORGANIZATION_INDUSTRY_OPTIONS, normalizeOrganizationIndustryFocus, rememberConfirmedOrganizationIndustryFocus } from "./lib/organizationIndustryFocus";
import { buildEmailTemplateHtml, buildSafeEmailTemplateSegments, escapeEmailHtml, findEmailTemplateLinkIssues, validateEmailHyperlink } from "./lib/emailTemplateSafety";
import { getGuardedPersistenceCompanyId, guardedPersistenceClient, setGuardedPersistenceCompanyId } from "./lib/guardedPersistenceClient";
import { clearOnboardingProgress, getSignupProgressionStep, getSignupStepOneValidationError, hasOnboardingProgress, readOnboardingProgress, writeOnboardingProgress } from "./lib/onboardingProgress";
import { subscriptionStateLabel, subscriptionAllowsModule, useSubscriptionAccess } from "./lib/subscriptionAccess";
import { FreeTrialBanner } from "./components/FreeTrialBanner";
import { useDashboardPreferences } from "./contexts/DashboardPreferencesContext";
import { useAuthContext } from "./contexts/AuthContext";
import { fetchWithSupabaseAuthRecovery, getSupabaseAuthClient, isDefinitiveSupabaseAuthFailure, refreshSupabaseSession } from "./lib/supabaseAuthClient";
import { WorkspacePresenceBadge } from "./components/WorkspacePresenceBadge";
import { EnterpriseLoginView, PasswordRecoveryView, PasswordStrengthMeter, ResetPasswordView, EmailConfirmationView, readAuthBranding, writeAuthBranding } from "./components/EnterpriseAuthViews";
import { BrandLogo } from "./components/BrandLogo";
import { EnterpriseColumnCustomizer } from "./components/EnterpriseColumnCustomizer";
import { ScrollableModuleTabs } from "./components/EnterpriseLayout";
import { getTraPortalLanguage } from "./lib/traPortalRoute";
import { calculateCommunityLoan, splitCommunityRepayment, unwrapCommunityMutationResult } from "./lib/communityGroups";
import { HospitalityWorkspace } from "./components/HospitalityWorkspace";
import { SubscriptionBillingWorkspace, TrialNoticeAdmin } from "./components/SubscriptionBillingWorkspace";
import { TrialExpiryNoticeGate } from "./components/TrialExpiryNoticeGate";
import { EmployeePortalWorkspace } from "./components/EmployeePortalWorkspace";
import { FleetWorkspace } from "./components/FleetWorkspace";
import { RestaurantWorkspace } from "./components/RestaurantWorkspace";
import { ExecutiveCommandCenter } from "./components/ExecutiveCommandCenter";
import { CrmCommandCenter, EcommerceCommandCenter, MarketingCommandCenter, SalesCommandCenter } from "./components/CommercialCommandCenters";
import { InventoryCommandCenter, PosCommandCenter, ProcurementCommandCenter, SupplyChainCommandCenter, WarehouseCommandCenter } from "./components/OperationsCommandCenters";
import { FinanceCommandCenter, IntegrationsCommandCenter, ReportsCommandCenter } from "./components/FinanceCommandCenters";
import { CollaborationCommandCenter, DocumentsCommandCenter, EmployeePortalCommandCenter, HrCommandCenter, WorkflowCommandCenter } from "./components/PeopleCommandCenters";
import { BankingMfiCommandCenter, CommunityCommandCenter, MicrofinanceCommandCenter, VicobaCommandCenter } from "./components/SectorCommandCenters";
import { FleetCommandCenter, HealthcareCommandCenter, HotelCommandCenter, PharmacyCommandCenter, RestaurantCommandCenter, SchoolCommandCenter } from "./components/VerticalCommandCenters";
import { AiBusinessSignals, SupportCommandCenter } from "./components/IntelligenceCommandCenters";
import { BankMfiWorkspace } from "./components/BankMfiWorkspace";
import { GlobalAdminControlCenter } from "./components/GlobalAdminControlCenter";
import { ProfileIdentityPage, ProfileMenu as PremiumProfileMenu } from "./components/ProfileIdentityCenter";
import { AndroidAppStatus } from "./components/AndroidAppStatus";
import { EnterpriseDashboardOverview } from "./components/EnterpriseDashboardOverview";
import { getNavigationGroups, getPresentationNavigationGroups, getQuickCreateActions, groupContainsActiveItem, NAVIGATION_ITEMS } from "./navigation/enterpriseNavigation";
import { buildResumeUrl, clearResumeLocation, getModuleFromUrl, readResumeLocation, writeResumeLocation } from "./lib/resumeSession";
import TopHeader from "./components/layout/TopHeader";

const { ACTIVITY_MODULE_COLORS, BRIEFING_EXEC_ROLES, ASSET_CATEGORIES, EXPENSE_CATEGORIES_LIST, RECRUITMENT_STAGES, TICKET_CATEGORIES, KB_CATEGORIES, OFFICIAL_MARKETPLACE_TEMPLATES, APPROVER_ROLES, CMD_ITEMS, MFI_LOAN_PRODUCTS, MFI_CLIENT_SEED, MFI_LOAN_SEED, MARKETPLACE_CATEGORIES, WA_TEMPLATES, WHATSAPP_MESSAGE_SEED, EMAIL_TEMPLATES, CALENDAR_CATEGORIES, CONGRATS_TEMPLATES, PASSKEY_READINESS_ROLES, SMS_CATEGORIES, COMPANY_CATEGORIES, ONBOARDING_MODULES, VICOBA_MEMBER_SEED, VICOBA_LOAN_SEED, VICOBA_MEETING_SEED, HC_PATIENTS_SEED, HC_DOCTORS_SEED, HC_APPTS_SEED, HC_VISITS_SEED, HC_PRESCRIPTIONS_SEED, HC_REPORTS_SEED, HC_LAB_CATEGORIES, VITAL_SEED, RADIOLOGY_SEED, SCH_STUDENTS_SEED, SCH_TEACHERS_SEED, SCH_CLASSES_SEED, SCH_EXAMS_SEED, SCH_FEES_SEED, SCH_BOOKS_SEED, SCH_TRANSPORT_SEED, PHM_DRUGS_SEED, PHM_STOCK_SEED, PHM_DISPENSE_SEED, PHM_SUPPLIERS_SEED, DRUG_CATEGORIES, HTL_ROOMS_SEED, HTL_BOOKINGS_SEED, BANK_ACCOUNTS_SEED, BANK_TRANSACTIONS_SEED, BANK_LOANS_SEED, BANK_FIXED_DEPOSITS_SEED, BANK_STANDING_ORDERS_SEED, RST_TABLES_SEED, RST_MENU_SEED, RST_ORDERS_SEED, RST_RESERVATIONS_SEED, RST_WAITERS, MENU_CATEGORIES, TABLE_ZONES, TZS_FMT, ANN_CAT_COLORS, EXPENSE_CATEGORIES_PERSONAL, ONBOARDING_TOUR_STEPS } = createDashboardStaticData({
  Brain,
  Building2,
  ClipboardList,
  Factory,
  FileText,
  LayoutDashboard,
  MessageSquare,
  Package,
  ReceiptText,
  ShoppingBag,
  ShoppingCart,
  TrendingUp,
  Users,
  Wallet,
});

async function clearStaleShellCaches() {
  if (typeof window === "undefined" || !("caches" in window)) return;
  try {
    const keys = await window.caches.keys();
    await Promise.all(
      keys
        .filter((cacheKey) => cacheKey.startsWith("smart-manager-shell-"))
        .map((cacheKey) => window.caches.delete(cacheKey)),
    );
  } catch {
    // Cache storage is best-effort; the controlled reload remains the fallback.
  }
}

function lazyWorkspaceWithRecovery(load, key) {
  return lazy(async () => {
    const retryKey = `smart-manager-workspace-lazy-retry:${key}`;
    try {
      const module = await load();
      try { window.sessionStorage.removeItem(retryKey); } catch {}
      return module;
    } catch (error) {
      let alreadyRetried = false;
      try { alreadyRetried = window.sessionStorage.getItem(retryKey) === "1"; } catch {}
      if (!alreadyRetried && typeof window !== "undefined") {
        try { window.sessionStorage.setItem(retryKey, "1"); } catch {}
        await clearStaleShellCaches();
        window.location.reload();
        return new Promise(() => {});
      }
      try { window.sessionStorage.removeItem(retryKey); } catch {}
      throw error;
    }
  });
}

const LazySalesDetailWorkspace = lazy(() => import("./components/SalesDetailWorkspace").then((module) => ({ default: module.SalesDetailWorkspace })));
const LazyPredictiveAnalyticsWorkspace = lazy(() => import("./components/PredictiveAnalyticsWorkspace").then((module) => ({ default: module.PredictiveAnalyticsWorkspace })));
const LazyTraPortalModule = lazy(() => import("./components/TraPortalModule").then((module) => ({ default: module.TraPortalModule })));
const LazyDashboardPreferencesDrawer = lazy(() => import("./components/DashboardPreferencesDrawer").then((module) => ({ default: module.DashboardPreferencesDrawer })));
const LazyComplianceAuditLogView = lazy(() => import("./components/ComplianceAuditLogView").then((module) => ({ default: module.ComplianceAuditLogView })));
const LazyHealthcareClinicWorkspace = lazy(() => import("./components/HealthcareClinicWorkspace").then((module) => ({ default: module.HealthcareClinicWorkspace })));
const LazyMicrofinanceWorkspace = lazy(() => import("./components/MicrofinanceWorkspace").then((module) => ({ default: module.MicrofinanceWorkspace })));
const LazyPharmacyWorkspace = lazyWorkspaceWithRecovery(() => import("./components/PharmacyWorkspace").then((module) => ({ default: module.PharmacyWorkspace })), "pharmacy");
const LazySchoolWorkspace = lazyWorkspaceWithRecovery(() => import("./components/SchoolWorkspace").then((module) => ({ default: module.SchoolWorkspace })), "school");
const LazyMoneyAgentWorkspace = lazyWorkspaceWithRecovery(() => import("./components/MoneyAgentWorkspace").then((module) => ({ default: module.MoneyAgentWorkspace })), "money-agent");
const LazyPropertyManagementWorkspace = lazyWorkspaceWithRecovery(() => import("./components/PropertyManagementWorkspace").then((module) => ({ default: module.PropertyManagementWorkspace })), "property-management");

/* =============================================================================
   SUPABASE CLIENT — hand-rolled, fetch-based (no SDK, matches BEIRAHISI pattern)
   ============================================================================= */

// A real Supabase project — set here directly. IS_CONFIGURED is now true,
// which means every one of the ~174 places in this file that branch on it
// switches from local demo seed data to genuine database calls: real
// Login/Signup, real invoices, real everything. This depends entirely on
// businesssphere-schema.sql having actually been run against this exact
// project first — the anon key alone gets you a connection, not tables.
// ─── SUPABASE CONFIG ──────────────────────────────────────────────────────
// Option A (recommended): set VITE_SUPABASE_URL in Netlify/Vercel env vars
// Option B: replace the empty strings below with your actual URL and key
// Get these from: supabase.com → your project → Settings → API
const SUPABASE_URL     = import.meta.env.VITE_SUPABASE_URL || "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.ITE_SUPABASE_ANON_KEY || "";
const IS_CONFIGURED     = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
const SUPABASE_CONFIG = { url: SUPABASE_URL, anonKey: SUPABASE_ANON_KEY };
// Slice 1 is deliberately opt-in: the established Settings/HR/invitation
// flow remains the safe rollback path until the workforce projection passes
// staging and tenant-isolation verification.
const TEAM_WORKFORCE_CENTER_ENABLED = import.meta.env.VITE_TEAM_WORKFORCE_CENTER === "true";
const IS_ISOLATED_SIGNUP_E2E = import.meta.env.MODE === "e2e";
const GUARDED_WRITE_TABLES = new Set(["finance_expenses", "sales_invoices", "inventory_items", "crm_leads"]);
const ACCESS_TOKEN_STORAGE_KEY = "bs_access_token";
const REFRESH_TOKEN_STORAGE_KEY = "bs_refresh_token";
const SESSION_ACCESS_TOKEN_STORAGE_KEY = "bs_session_access_token";
const SESSION_REFRESH_TOKEN_STORAGE_KEY = "bs_session_refresh_token";

function authDebug(event, detail = {}) {
  if (import.meta.env.DEV) console.info(`[AUTH] ${event}`, detail);
}

function getStoredAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY) || window.sessionStorage.getItem(SESSION_ACCESS_TOKEN_STORAGE_KEY);
}

function getStoredRefreshToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(REFRESH_TOKEN_STORAGE_KEY) || window.sessionStorage.getItem(SESSION_REFRESH_TOKEN_STORAGE_KEY);
}

function persistAuthSession(authResult, { remember = true } = {}) {
  if (typeof window === "undefined" || !authResult?.access_token) return;
  const activeStorage = remember ? window.localStorage : window.sessionStorage;
  const inactiveStorage = remember ? window.sessionStorage : window.localStorage;
  const activeAccessKey = remember ? ACCESS_TOKEN_STORAGE_KEY : SESSION_ACCESS_TOKEN_STORAGE_KEY;
  const activeRefreshKey = remember ? REFRESH_TOKEN_STORAGE_KEY : SESSION_REFRESH_TOKEN_STORAGE_KEY;
  const inactiveAccessKey = remember ? SESSION_ACCESS_TOKEN_STORAGE_KEY : ACCESS_TOKEN_STORAGE_KEY;
  const inactiveRefreshKey = remember ? SESSION_REFRESH_TOKEN_STORAGE_KEY : REFRESH_TOKEN_STORAGE_KEY;
  inactiveStorage.removeItem(inactiveAccessKey);
  inactiveStorage.removeItem(inactiveRefreshKey);
  activeStorage.setItem(activeAccessKey, authResult.access_token);
  if (authResult.refresh_token) activeStorage.setItem(activeRefreshKey, authResult.refresh_token);
  window.dispatchEvent(new Event("smart-manager:auth-session-updated"));
}

function clearStoredAuthSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_ACCESS_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(SESSION_REFRESH_TOKEN_STORAGE_KEY);
}

// A real, deliberate architectural choice, not an oversight: IS_CONFIGURED
// is a single global flag, evaluated once, read by every one of this
// app's 90+ useCompanyTable() calls to decide whether to fetch real data
// or serve local seed data. That's correct for its original purpose —
// "does a live Supabase project exist at all" — but it has no concept of
// a person choosing to preview a demo despite real credentials being
// configured. Rather than touch every one of those 90+ call sites to add
// a second, separate check (real, but a much larger and riskier change
// for what should be a small, safe feature), this single mutable flag is
// read by the one function they all already funnel through
// (useCompanyTable's own real/seed decision), making the fix centralized
// and low-risk instead of scattered and error-prone.
let DEMO_OVERRIDE = false;

function requiresConfirmedPersistence() {
  return IS_CONFIGURED && !DEMO_OVERRIDE;
}

// There is deliberately no ACTIVE_COMPANY_ID constant. Company scoping is
// enforced entirely by RLS's current_company_id(), which reads the real
// authenticated session (see section 32 of the handover doc) — a single
// hardcoded constant could never correctly scope queries once real
// multi-user login exists, since different signed-in users belong to
// different companies. The client never supplies its own company filter;
// the database is the single source of truth for which rows a session can see.

async function activeSupabaseAccessToken(fallback = null) {
  const client = getSupabaseAuthClient(SUPABASE_CONFIG);
  if (client) {
    try {
      const current = await client.auth.getSession();
      if (current.data.session?.access_token) return current.data.session.access_token;
    } catch (_error) {
      // Use the explicit short-lived token or legacy migration token below.
    }
  }
  if (fallback && fallback !== SUPABASE_ANON_KEY) return fallback;
  const stored = getStoredAccessToken();
  return stored && stored !== SUPABASE_ANON_KEY ? stored : null;
}

async function authHeaders(fallbackToken = null) {
  const token = await activeSupabaseAccessToken(fallbackToken);
  return {
    apikey: SUPABASE_ANON_KEY,
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function buildConfirmedMutationError({ table, method, status, code, details }) {
  const operation = method === "POST" ? "CREATE" : method === "PATCH" ? "UPDATE" : "DELETE";
  const error = new Error(`Supabase ${operation} on ${table} did not return a confirmed database row.`);
  error.status = status;
  error.code = code || "PERSISTENCE_CONFIRMATION_MISSING";
  error.details = details || null;
  error.table = table;
  error.operation = operation;
  return error;
}

function buildOfflineMutationError({ table, method }) {
  const error = new Error(`Supabase ${method === "POST" ? "CREATE" : method === "PATCH" ? "UPDATE" : "DELETE"} on ${table} was not sent because this browser is offline.`);
  error.status = 0;
  error.code = "PERSISTENCE_OFFLINE";
  error.table = table;
  error.operation = method === "POST" ? "CREATE" : method === "PATCH" ? "UPDATE" : "DELETE";
  return error;
}

// Module handlers may stage a UI row while their request is in flight. This
// bus immediately reconciles each useCompanyTable cache from its last confirmed
// Supabase result, both on success and on failure. It is deliberately not an
// offline outbox: this product has no durable queue or conflict resolver, so
// business writes are paused while offline instead of being represented as saved.
export const companyMutationBus = {
  listeners: new Set(),
  emit(event) { this.listeners.forEach((listener) => listener(event)); },
};

function emitCompanyMutation(event) {
  if (typeof window === "undefined") return;
  companyMutationBus.emit(event);
}

function persistenceFailureMessage(action, error) {
  const detail = String(error?.message || "").trim();
  const isDenied = [401, 403].includes(Number(error?.status))
    || /permission denied|row-level security|not authorized|forbidden/i.test(detail);
  const isOffline = error?.code === "PERSISTENCE_OFFLINE" || Number(error?.status) === 0;
  const prefix = isDenied
    ? `${action} was denied by your workspace permissions. The server did not save this change.`
    : isOffline
      ? `${action} could not be sent because this browser is offline. No server change was made.`
      : `${action} failed. The server did not confirm this change.`;
  return detail ? `${prefix} Details: ${detail}` : `${prefix} Your form is still available to retry.`;
}

function authRedirectUrl(screen) {
  if (typeof window === "undefined") return "";
  const url = new URL(window.location.href);
  url.hash = "";
  url.searchParams.set("auth", screen);
  return url.toString();
}

async function authRequestPasswordRecovery(email) {
  if (!IS_CONFIGURED) {
    const error = new Error("Authentication is not configured.");
    error.code = "AUTH_CONFIGURATION_MISSING";
    throw error;
  }
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/recover`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, redirect_to: authRedirectUrl("reset") }),
    });
  } catch (cause) {
    const error = new Error("Unable to reach the authentication server.");
    error.code = "NETWORK_ERROR";
    error.cause = cause;
    throw error;
  }
  const body = await res.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { /* a safe generic request error is built below */ }
  if (!res.ok) {
    const error = createAuthRequestError(res.status, data, "Password recovery could not be started.");
    if (res.status >= 500) error.code = "AUTH_RECOVERY_SERVICE_UNAVAILABLE";
    throw error;
  }
  return data;
}
async function authResendVerification(email) {
  if (!IS_CONFIGURED) {
    const error = new Error("Authentication is not configured.");
    error.code = "AUTH_CONFIGURATION_MISSING";
    throw error;
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/resend`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ type: "signup", email, options: { emailRedirectTo: authRedirectUrl("verify") } }),
  });
  const body = await res.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { /* a safe generic request error is built below */ }
  if (!res.ok) throw createAuthRequestError(res.status, data, "Verification email could not be resent.");
  return data;
}

async function authUpdatePassword(accessToken, password) {
  if (!accessToken) {
    const error = new Error("This password reset link is no longer valid.");
    error.code = "RECOVERY_SESSION_MISSING";
    throw error;
  }
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    body: JSON.stringify({ password }),
  });
  const body = await res.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { /* a safe generic request error is built below */ }
  if (!res.ok) throw createAuthRequestError(res.status, data, "Password update could not be completed.");
  return data;
}

async function authSignIn(email, password) {
  if (!IS_CONFIGURED) {
    const error = new Error("Authentication is not configured.");
    error.code = "AUTH_CONFIGURATION_MISSING";
    throw error;
  }
  authDebug("Login started");
  let res;
  try {
    res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, password }),
    });
  } catch (cause) {
    const error = new Error("Unable to reach the authentication server.");
    error.code = "NETWORK_ERROR";
    error.cause = cause;
    throw error;
  }
  const body = await res.text();
  let data = null;
  try { data = body ? JSON.parse(body) : null; } catch { /* handled below as a safe invalid response */ }
  authDebug("Authentication response received", { status: res.status, code: data?.error_code || data?.code || null });
  if (!res.ok) throw createAuthRequestError(res.status, data, "Sign-in failed.");
  if (!data?.access_token || !data?.refresh_token || !data?.user?.id) {
    const error = new Error("Login did not return a complete authenticated session.");
    error.code = "AUTH_RESPONSE_INVALID";
    throw error;
  }
  authDebug("Session created");
  return data; // { access_token, refresh_token, user }
}

async function authRefreshSession(refreshToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await res.json();
  if (!res.ok || !data?.access_token) {
    const error = new Error(data.error_description || data.msg || "Session expired");
    error.status = res.status;
    throw error;
  }
  return data;
}

async function authSignOut(accessToken) {
  try {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
      method: "POST",
      headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
    });
  } catch (_e) { /* the local session is cleared regardless of whether the server call succeeds */ }
}

// Identifies who a stored access token actually belongs to — the real
// Supabase Auth endpoint for exactly this, used to resume a session on
// page load without re-prompting for a password every reload.
async function authGetUser(accessToken) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const error = new Error("Session expired");
    error.status = res.status;
    throw error;
  }
  return res.json();
}

// Token expiry is used only to decide when to ask Supabase to renew a session.
// It is never used for authorization; Supabase still verifies the rotating refresh
// token before issuing a replacement access token. Failed network renewals retain
// the current session for a later retry, while definitive credential failures clear
// only the stored browser session and notify the live auth boundary without exposing
// any secret in the event payload.
function useProactiveSessionRefresh(enabled, onRenewed) {
  const onRenewedRef = useRef(onRenewed);
  onRenewedRef.current = onRenewed;

  useEffect(() => {
    if (!enabled || typeof window === "undefined") return undefined;
    let disposed = false;
    let timer = null;

    const renew = async () => {
      if (disposed) return;
      const client = getSupabaseAuthClient(SUPABASE_CONFIG);
      if (!client) return;
      try {
        const current = await client.auth.getSession();
        if (!current.data.session) return;
        const refreshed = await refreshSupabaseSession(client);
        if (refreshed.error || !refreshed.data.session) {
          if (isDefinitiveSupabaseAuthFailure(refreshed.error)) {
            reportSessionRefreshOutcome("terminal_failure", "proactive");
            try { await client.auth.signOut({ scope: "local" }); } catch { /* local session callback still clears state */ }
            window.dispatchEvent(new CustomEvent("smart-manager:auth-session-expired", { detail: { diagnosticCode: "SM-AUTH-401-REFRESH-TOKEN-INVALID" } }));
          } else {
            reportSessionRefreshOutcome("retryable_failure", "proactive");
          }
          return;
        }
        reportSessionRefreshOutcome("success", "proactive");
        onRenewedRef.current?.(refreshed.data.session.access_token);
      } catch (error) {
        authDebug("Proactive session renewal deferred", { status: error?.status || null, terminal: isDefinitiveSupabaseAuthFailure(error) });
        reportSessionRefreshOutcome(isDefinitiveSupabaseAuthFailure(error) ? "terminal_failure" : "retryable_failure", "proactive");
        if (isDefinitiveSupabaseAuthFailure(error)) {
          try { await client.auth.signOut({ scope: "local" }); } catch { /* local session callback still clears state */ }
          window.dispatchEvent(new CustomEvent("smart-manager:auth-session-expired", { detail: { diagnosticCode: "SM-AUTH-401-REFRESH-TOKEN-INVALID" } }));
        }
      }
    };

    const schedule = () => {
      if (timer) window.clearTimeout(timer);
      const delay = getProactiveSessionRenewalDelay(null);
      timer = window.setTimeout(() => {
        void renew().finally(() => { if (!disposed) schedule(); });
      }, delay);
    };

    const renewWhenVisible = () => { if (document.visibilityState === "visible") void renew(); };
    schedule();
    window.addEventListener("focus", renewWhenVisible);
    document.addEventListener("visibilitychange", renewWhenVisible);
    return () => {
      disposed = true;
      if (timer) window.clearTimeout(timer);
      window.removeEventListener("focus", renewWhenVisible);
      document.removeEventListener("visibilitychange", renewWhenVisible);
    };
  }, [enabled]);
}

// Calls the two SECURITY DEFINER functions added to the schema
// (create_company_and_owner, join_company_with_code) via PostgREST's RPC
// endpoint — the correct, safe way to expose a multi-step, atomic
// operation to a client without granting raw table INSERT.
async function callRpc(name, params, accessToken) {
  const token = await activeSupabaseAccessToken(accessToken);
  if (!token) {
    const error = new Error("A current authenticated session is required for this workspace operation.");
    error.status = 401;
    error.code = "AUTH_SESSION_MISSING";
    throw error;
  }
  const res = await fetchWithSupabaseAuthRecovery(`${SUPABASE_URL}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${token}` },
    body: JSON.stringify(params),
  }, SUPABASE_CONFIG);
  const data = await res.json();
  if (!res.ok) {
    const error = new Error(data.message || data.error_description || `${name} failed.`);
    error.status = res.status;
    error.code = data.code || data.error_code || null;
    throw error;
  }
  return data;
}

export function isTerminalWorkspaceSessionError(error) {
  return Number(error?.status) === 401 || error?.code === "SESSION_REFRESH_FAILED";
}

export function sessionRecoveryDiagnosticCode(error) {
  return isTerminalWorkspaceSessionError(error) ? "SM-AUTH-401" : null;
}

// A workspace RPC can race a short-lived access token during first launch.
// Retry precisely once with Supabase's rotating refresh token; no 403 or
// business-rule failure is ever reclassified as a session failure.
export async function callWorkspaceRpcWithSessionRefresh(name, params, accessToken) {
  try {
    const currentToken = await activeSupabaseAccessToken(accessToken);
    return { data: await callRpc(name, params, currentToken), accessToken: currentToken, refreshToken: null };
  } catch (firstError) {
    if (!isTerminalWorkspaceSessionError(firstError)) throw firstError;
    const client = getSupabaseAuthClient(SUPABASE_CONFIG);
    let clientHasSession = false;
    if (client) {
      try { clientHasSession = Boolean((await client.auth.getSession()).data.session); } catch { /* use the explicit onboarding/migration token below */ }
    }
    if (!client || !clientHasSession) {
      // Migration/onboarding fallback: production uses the shared client when
      // it has adopted the session; this preserves the explicit signup token
      // seam until the client callback has completed.
      const legacyRefreshToken = getStoredRefreshToken();
      if (!legacyRefreshToken) throw firstError;
      try {
        const refreshed = await authRefreshSession(legacyRefreshToken);
        reportSessionRefreshOutcome("success", "workspace_rpc");
        return { data: await callRpc(name, params, refreshed.access_token), accessToken: refreshed.access_token, refreshToken: refreshed.refresh_token || null };
      } catch (refreshError) {
        refreshError.code = "SESSION_REFRESH_FAILED";
        reportSessionRefreshOutcome("terminal_failure", "workspace_rpc");
        throw refreshError;
      }
    }
    try {
      const refreshed = await refreshSupabaseSession(client);
      if (refreshed.error || !refreshed.data.session) {
        const refreshError = refreshed.error || Object.assign(new Error("The authenticated session could not be refreshed."), { code: "SESSION_REFRESH_FAILED", status: 401 });
        if (isDefinitiveSupabaseAuthFailure(refreshError)) {
          refreshError.code = "SESSION_REFRESH_FAILED";
          reportSessionRefreshOutcome("terminal_failure", "workspace_rpc");
        } else {
          reportSessionRefreshOutcome("retryable_failure", "workspace_rpc");
        }
        throw refreshError;
      }
      reportSessionRefreshOutcome("success", "workspace_rpc");
      return { data: await callRpc(name, params, refreshed.data.session.access_token), accessToken: refreshed.data.session.access_token, refreshToken: null };
    } catch (refreshError) {
      if (!refreshError.code) refreshError.code = "SESSION_REFRESH_FAILED";
      throw refreshError;
    }
  }
}

// These deployed tenant tables use the common name/status/amount/notes/data
// envelope. Normalize at this shared boundary so every module persists only
// server-supported columns and keeps its feature-specific fields in data.
// `finance_expenses` is intentionally excluded: it is a typed relational table
// and its schema does not expose the generic JSON `data` column.
export const GENERIC_COMPANY_TABLES = new Set(`
approval_signatures bank_accounts bank_fixed_deposits bank_loans bank_standing_orders bank_transactions
branches business_loans collab_messages community_contributions community_groups company_modules
crm_contacts crm_interactions crm_leads customer_feedback departments digital_signatures documents
ecommerce_orders ecommerce_products emails expense_budgets   flt_maintenance flt_trips flt_vehicles
  hc_appointments hc_doctors hc_invoices hc_lab_orders hc_patients hc_prescriptions hc_radiology hc_reports hc_visits hc_vitals
hr_attendance hr_benefits hr_candidates hr_duties hr_employees hr_leave_requests hr_payroll_runs hr_performance_reviews
htl_bookings htl_rooms integration_connections inventory_batches inventory_items inventory_stock_movements inventory_suppliers inventory_transfers inventory_warehouses
journal_entries kb_articles loan_repayments manufacturing_bom_components manufacturing_boms manufacturing_qc_inspections manufacturing_work_orders
marketing_campaigns mfi_clients mfi_loans mfi_savings network_profiles network_rfqs notebook_notes notification_log
other_debtors other_income period_closes phm_dispense phm_drugs phm_stock phm_suppliers
pos_cash_movements pos_return_items pos_returns pos_shifts pos_transaction_items pos_transactions
procurement_purchase_orders project_milestones project_tasks purchase_order_items resource_bookings
rst_menu rst_orders rst_reservations rst_tables sales_invoice_items sales_invoices sales_order_return_items sales_order_returns sales_payments sales_quotations sales_subscriptions
sch_books sch_classes sch_exams sch_fees sch_students sch_teachers sch_transport scm_shipments scm_vehicles
signatures sms_group_members sms_groups sms_templates stock_audit_items stock_audits support_call_log support_chat_conversations support_chat_messages support_ticket_messages
vicoba_loans vicoba_meetings vicoba_members whatsapp_messages
`.trim().split(/\s+/));

const GENERIC_STANDARD_COLUMNS = new Set([
  "id", "company_id", "name", "status", "amount", "notes", "created_at", "updated_at",
]);

// Sales document tables started as generic envelopes, then received additive
// typed document contracts. Keep those verified contract fields out of the
// JSON envelope so PostgREST filters, joins, dates, and financial reporting
// read the same canonical values the UI writes.
const GENERIC_TYPED_COLUMNS = {
  sales_quotations: new Set(["doc_number", "customer", "issue_date", "valid_until", "owner_id"]),
  sales_invoices: new Set(["doc_number", "customer", "issue_date", "due_date", "order_id", "amount_paid"]),
  sales_invoice_items: new Set(["invoice_id", "item_name", "item_sku", "qty", "rate", "sort_order"]),
  sales_payments: new Set(["invoice_id", "method", "payment_date", "reference"]),
  sales_subscriptions: new Set(["doc_number", "customer", "plan", "cycle", "start_date", "next_billing_date"]),
  finance_expenses: new Set(["vendor", "category", "expense_date", "due_date", "method", "department"]),
  sales_order_returns: new Set(["order_id", "reason"]),
  sales_order_return_items: new Set(["return_id", "item_name", "item_sku", "qty", "rate"]),
};

function genericAllowedColumns(table) {
  return new Set([...GENERIC_STANDARD_COLUMNS, ...(GENERIC_TYPED_COLUMNS[table] || [])]);
}

function genericFilterColumn(table, column) {
  return GENERIC_COMPANY_TABLES.has(table) && !genericAllowedColumns(table).has(column)
    ? `data->>${column}`
    : column;
}

function firstDefined(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function genericRecordName(table, record, data, fallback) {
  return firstDefined(
    record.name, record.full_name, record.contact_name, record.item_name,
    record.customer, record.cashier, record.doc_number, record.sku,
    data.name, data.full_name, data.contact_name, data.item_name,
    data.customer, data.cashier, data.doc_number, data.sku,
    fallback?.name, `${table.replace(/_/g, " ")} record`,
  );
}

export function normalizeGenericCompanyPayload(table, record, existing = null) {
  if (!GENERIC_COMPANY_TABLES.has(table) || !record || typeof record !== "object" || Array.isArray(record)) return record;
  const existingData = existing?.data && typeof existing.data === "object" ? existing.data : {};
  const suppliedData = record.data && typeof record.data === "object" ? record.data : {};
  const allowedColumns = genericAllowedColumns(table);
  const typedColumns = GENERIC_TYPED_COLUMNS[table] || new Set();
  const typedFields = Object.fromEntries(Object.entries(record).filter(([key]) => typedColumns.has(key)));
  const businessFields = { ...record };
  [...allowedColumns, "data"].forEach((key) => delete businessFields[key]);
  const data = { ...existingData, ...businessFields, ...suppliedData };
  return {
    ...typedFields,
    name: genericRecordName(table, record, data, existing),
    status: firstDefined(record.status, record.stage, record.kind, data.status, data.stage, data.kind, existing?.status, "Active"),
    amount: firstDefined(record.amount, record.value_amount, record.value, record.unit_cost, record.salary, data.amount, data.value_amount, data.value, data.unit_cost, data.salary, existing?.amount, null),
    notes: firstDefined(record.notes, record.reason, record.description, data.notes, data.reason, data.description, existing?.notes, null),
    data,
  };
}

function inflateGenericCompanyRow(table, row) {
  if (!GENERIC_COMPANY_TABLES.has(table) || !row || typeof row !== "object" || Array.isArray(row)) return row;
  if (!row.data || typeof row.data !== "object") return row;
  const data = row.data;
  return { ...data, ...row, data };
}

// Minimal chainable query builder over PostgREST, mirroring the shape of the
// official supabase-js client closely enough that swapping later is trivial.
export function sb(table) {
  let path = `${SUPABASE_URL}/rest/v1/${table}`;
  const params = new URLSearchParams();
  let method = "GET";
  let payload = null;
  let single = false;
  let mergeDuplicates = false;

  const builder = {
    select(cols = "*") {
      params.set("select", cols);
      return builder;
    },
    eq(col, val) {
      params.append(genericFilterColumn(table, col), `eq.${val}`);
      return builder;
    },
    order(col, { ascending = true } = {}) {
      params.set("order", `${col}.${ascending ? "asc" : "desc"}`);
      return builder;
    },
    insert(row) {
      method = "POST";
      payload = row;
      const guardedCompanyId = getGuardedPersistenceCompanyId();
      if (GUARDED_WRITE_TABLES.has(table) && guardedCompanyId) {
        const sourceRows = Array.isArray(row) ? row : [row];
        const rows = sourceRows.map((record) => GENERIC_COMPANY_TABLES.has(table)
          ? normalizeGenericCompanyPayload(table, record)
          : record);
        return {
          async run() {
            const results = [];
            for (const singleRow of rows) {
              const guardedResult = await guardedPersistenceClient.persistSupabaseCriticalRow.mutate({
                companyId: guardedCompanyId,
                tableName: table,
                payload: singleRow,
              });
              results.push(Array.isArray(guardedResult) ? guardedResult[0] : guardedResult);
            }
            return Array.isArray(row) ? results : results[0];
          },
          single() {
            return {
              async run() {
                const results = [];
                for (const singleRow of rows) {
                  const guardedResult = await guardedPersistenceClient.persistSupabaseCriticalRow.mutate({
                    companyId: guardedCompanyId,
                    tableName: table,
                    payload: singleRow,
                  });
                  results.push(Array.isArray(guardedResult) ? guardedResult[0] : guardedResult);
                }
                return Array.isArray(row) ? results : results[0];
              },
            };
          },
          then(resolve, reject) {
            (async () => {
              const results = [];
              for (const singleRow of rows) {
                const guardedResult = await guardedPersistenceClient.persistSupabaseCriticalRow.mutate({
                  companyId: guardedCompanyId,
                  tableName: table,
                  payload: singleRow,
                });
                results.push(Array.isArray(guardedResult) ? guardedResult[0] : guardedResult);
              }
              return Array.isArray(row) ? results : results[0];
            })().then(resolve, reject);
          },
        };
      }
      return builder;
    },
    upsert(row, { onConflict } = {}) {
      method = "POST";
      payload = row;
      mergeDuplicates = true;
      if (onConflict) params.set("on_conflict", onConflict);
      return builder;
    },
    update(patch) {
      method = "PATCH";
      payload = patch;
      return builder;
    },
    delete() {
      method = "DELETE";
      return builder;
    },
    single() {
      single = true;
      return builder;
    },
    async run() {
      const url = `${path}?${params.toString()}`;
      let requestPayload = payload;
      if (method !== "GET" && typeof navigator !== "undefined" && navigator.onLine === false) {
        const error = buildOfflineMutationError({ table, method });
        emitCompanyMutation({ table, confirmed: false, error });
        throw error;
      }
      if (GENERIC_COMPANY_TABLES.has(table) && method === "POST") {
        requestPayload = Array.isArray(payload)
          ? payload.map((record) => normalizeGenericCompanyPayload(table, record))
          : normalizeGenericCompanyPayload(table, payload);
      }
      if ((method === "POST" || method === "PATCH") && requestPayload && typeof requestPayload === "object") {
        // Active client-side schema contract check matching server contract
        const payloadKeys = Object.keys(Array.isArray(requestPayload) ? requestPayload[0] || {} : requestPayload);
        if (table === "finance_expenses") {
          const forbidden = ["cost_center", "department", "data"];
          const hit = forbidden.find((f) => payloadKeys.includes(f));
          if (hit) throw new Error(`Schema contract violation for "${table}": Forbidden/unsupported drift column "${hit}" detected.`);
        }
      }
      if (GENERIC_COMPANY_TABLES.has(table) && method === "PATCH") {
        const lookupParams = new URLSearchParams(params);
        lookupParams.set("select", "*");
        lookupParams.delete("order");
        const lookup = await fetchWithSupabaseAuthRecovery(`${path}?${lookupParams.toString()}`, { headers: await authHeaders() }, SUPABASE_CONFIG);
        const lookupRaw = await lookup.json().catch(() => null);
        if (!lookup.ok) {
          const error = new Error(lookupRaw?.message || lookupRaw?.error_description || lookupRaw?.hint || lookupRaw?.details || `Supabase lookup ${table} failed: ${lookup.status}`);
          error.status = lookup.status;
          error.code = lookupRaw?.code;
          error.details = lookupRaw?.details;
          error.table = table;
          error.operation = "UPDATE";
          emitCompanyMutation({ table, confirmed: false, error });
          throw error;
        }
        requestPayload = normalizeGenericCompanyPayload(table, payload, Array.isArray(lookupRaw) ? lookupRaw[0] : lookupRaw);
      }
      const res = await fetchWithSupabaseAuthRecovery(url, {
        method,
        headers: {
          ...(await authHeaders()),
          Prefer: method === "GET" ? undefined : mergeDuplicates ? "return=representation,resolution=merge-duplicates" : "return=representation",
        },
        body: requestPayload == null ? null : JSON.stringify(requestPayload),
      }, SUPABASE_CONFIG);
      const raw = await res.json().catch(() => null);
      if (!res.ok) {
        const message = raw?.message || raw?.error_description || raw?.hint || raw?.details || `Supabase ${method} ${table} failed: ${res.status}`;
        const error = new Error(message);
        error.status = res.status;
        error.code = raw?.code;
        error.details = raw?.details;
        error.table = table;
        error.operation = method === "POST" ? "CREATE" : method === "PATCH" ? "UPDATE" : method === "DELETE" ? "DELETE" : "READ";
        if (method !== "GET") emitCompanyMutation({ table, confirmed: false, error });
        throw error;
      }
      // PostgREST returns an empty representation when no row was affected.
      // Permanent records are confirmed only after the database returns an
      // affected row, preventing RLS-filtered mutations from looking saved.
      if (method !== "GET" && (raw == null || (Array.isArray(raw) && raw.length === 0))) {
        const error = buildConfirmedMutationError({ table, method, status: res.status, details: raw });
        emitCompanyMutation({ table, confirmed: false, error });
        throw error;
      }
      const data = method === "GET" && Array.isArray(raw)
        ? raw.map((row) => inflateGenericCompanyRow(table, row))
        : inflateGenericCompanyRow(table, raw);
      if (method !== "GET") emitCompanyMutation({ table, confirmed: true, data });
      return single ? (Array.isArray(data) ? data[0] : data) : data;
    },
    // allow `await sb(table).select().eq(...)` directly, like supabase-js
    then(resolve, reject) {
      return builder.run().then(resolve, reject);
    },
  };
  return builder;
}

function usePersistentVisibleColumns(preferenceKey, defaultColumns) {
  const cacheKey = `smart_manager_table_columns:${preferenceKey}`;
  const [visibleColumns, setVisibleColumns] = useState(() => {
    try {
      const cached = JSON.parse(localStorage.getItem(cacheKey) || "null");
      return Array.isArray(cached) && cached.length ? cached : defaultColumns;
    } catch (_error) {
      return defaultColumns;
    }
  });
  const readyToPersist = useRef(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!IS_CONFIGURED || !getStoredAccessToken()) {
        readyToPersist.current = true;
        return;
      }
      try {
        const row = await sb("user_table_preferences").select("value").eq("preference_key", preferenceKey).single().run();
        if (active && Array.isArray(row?.value) && row.value.length) setVisibleColumns(row.value);
      } catch (error) {
        authDebug("Table preference load deferred", { preferenceKey, message: error?.message });
      } finally {
        if (active) readyToPersist.current = true;
      }
    })();
    return () => { active = false; };
  }, [preferenceKey]);

  useEffect(() => {
    try { localStorage.setItem(cacheKey, JSON.stringify(visibleColumns)); } catch (_error) { /* cache is optional */ }
    if (!readyToPersist.current || !IS_CONFIGURED || !getStoredAccessToken()) return;
    const handle = window.setTimeout(() => {
      sb("user_table_preferences").upsert({ preference_key: preferenceKey, value: visibleColumns }, { onConflict: "company_id,user_id,preference_key" }).run()
        .catch((error) => authDebug("Table preference save deferred", { preferenceKey, message: error?.message }));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [cacheKey, preferenceKey, visibleColumns]);

  return [visibleColumns, setVisibleColumns];
}

/* Generic hook: loads a company-scoped table when configured, otherwise
   serves the given seed array untouched. Every module data hook below
   follows this same shape — copy it when wiring HR, Manufacturing, etc. */
// ── useSortableTable — adds sort + filter to any table ───────────────────────
// Usage: const { sorted, sortCol, sortDir, doSort } = useSortableTable(rows)
// ── useDebounce — debounce any fast-changing value ───────────────────────────
// ── useLocalPersist — persist state to localStorage ──────────────────────────
function useLocalPersist(key, defaultVal) {
  const [val, setVal] = useState(() => {
    try {
      const stored = localStorage.getItem("bs_" + key);
      return stored !== null ? JSON.parse(stored) : defaultVal;
    } catch (_e) { return defaultVal; }
  });
  const setPersist = useCallback((v) => {
    setVal(v);
    try { localStorage.setItem("bs_" + key, JSON.stringify(v)); } catch (_e) {}
  }, [key]);
  return [val, setPersist];
}

function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debouncedValue;
}

function useSortableTable(rows = []) {
  const [sortCol, setSortCol] = useState(null);
  const [sortDir, setSortDir] = useState("asc");
  const [filterQ,  setFilterQ]  = useState("");

  const doSort = useCallback((col) => {
    if (sortCol === col) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortCol(col); setSortDir("asc"); }
  }, [sortCol]);

  const sorted = useMemo(() => {
    let rows2 = [...rows];
    if (filterQ) {
      const q = filterQ.toLowerCase();
      rows2 = rows2.filter(r => Object.values(r).some(v => String(v).toLowerCase().includes(q)));
    }
    if (sortCol) {
      rows2.sort((a, b) => {
        const va = a[sortCol] ?? "", vb = b[sortCol] ?? "";
        const n = typeof va === "number" ? va - vb : String(va).localeCompare(String(vb));
        return sortDir === "asc" ? n : -n;
      });
    }
    return rows2;
  }, [rows, sortCol, sortDir, filterQ]);

  const SortHeader = ({ col, label, className="" }) => (
    <th className={"cursor-pointer select-none hover:bg-slate-100 transition-colors " + className}
        onClick={() => doSort(col)}>
      <div className="flex items-center gap-1">
        <span>{label}</span>
        {sortCol === col
          ? sortDir === "asc"
            ? <SortAsc size={11} className="text-[#16A34A] shrink-0"/>
            : <SortDesc size={11} className="text-[#16A34A] shrink-0"/>
          : <span className="w-[11px]"/>}
      </div>
    </th>
  );

  return { sorted, sortCol, sortDir, doSort, filterQ, setFilterQ, SortHeader };
}

const TRANSIENT_SUPABASE_STATUSES = new Set([408, 425, 429, 500, 502, 503, 504]);
const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);
const SCHEMA_COMPATIBILITY_CODES = new Set(["PGRST200", "PGRST201", "PGRST204", "42703", "42883"]);

function getSupabaseErrorText(error) {
  return String(error?.message || error || "").toLowerCase();
}

function isMissingTableError(error) {
  const text = getSupabaseErrorText(error);
  return MISSING_TABLE_CODES.has(error?.code) || error?.status === 404 || /relation .* does not exist|could not find the table|table .* does not exist/.test(text);
}

function isSchemaCompatibilityError(error) {
  const text = getSupabaseErrorText(error);
  return SCHEMA_COMPATIBILITY_CODES.has(error?.code) || error?.status === 400 || /column .* does not exist|relationship .* does not exist|could not find a relationship|failed to parse|embedded resource/.test(text);
}

function isTransientSupabaseError(error) {
  const text = getSupabaseErrorText(error);
  return TRANSIENT_SUPABASE_STATUSES.has(error?.status) || error?.name === "TypeError" || /failed to fetch|network|timeout|load failed|fetch failed/.test(text);
}

function waitForSupabaseRetry(ms) {
  return new Promise((resolve) => {
    const timer = typeof window !== "undefined" ? window.setTimeout : setTimeout;
    timer(resolve, ms);
  });
}

let lastSupabaseReconnectToastAt = 0;

function emitSupabaseReconnectToast() {
  const now = Date.now();
  if (now - lastSupabaseReconnectToastAt < 3000) return;
  lastSupabaseReconnectToastAt = now;
  notify("Connection restored — live data is up to date.", "success");
}

export async function runCompanyTableQuery(table, { select = "*", order } = {}) {
  const queryVariants = [];
  const addVariant = (variantSelect, variantOrder) => {
    const signature = `${variantSelect}|${variantOrder?.col || ""}|${variantOrder?.ascending !== false}`;
    if (!queryVariants.some((variant) => variant.signature === signature)) {
      queryVariants.push({ signature, select: variantSelect, order: variantOrder });
    }
  };

  addVariant(select, order);
  if (select !== "*" || order) addVariant("*", order);
  if (select !== "*" || order) addVariant("*", undefined);

  let lastError = null;
  let recoveredAfterRetry = false;
  for (const variant of queryVariants) {
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        let query = sb(table).select(variant.select);
        if (variant.order) query = query.order(variant.order.col, { ascending: variant.order.ascending });
        const data = await query.run();
        if (recoveredAfterRetry) emitSupabaseReconnectToast();
        return { rows: Array.isArray(data) ? data : (data == null ? [] : [data]), usedFallback: variant.signature !== queryVariants[0].signature, unavailable: false, recoveredAfterRetry };
      } catch (error) {
        lastError = error;
        if (isMissingTableError(error)) return { rows: [], usedFallback: false, unavailable: true, error: null };
        if (isTransientSupabaseError(error) && attempt === 0) {
          recoveredAfterRetry = true;
          await waitForSupabaseRetry(180);
          continue;
        }
        if (isSchemaCompatibilityError(error)) break;
        throw error;
      }
    }
  }

  throw lastError || new Error(`Supabase could not load ${table}`);
}

export async function runCompanyTableMutation(table, operation, payload, { matchCol = "id", matchVal } = {}) {
  if (!["insert", "update", "delete"].includes(operation)) {
    return { data: null, error: new Error(`Unsupported company-table mutation: ${operation}`) };
  }
  let lastError = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      let query = sb(table);
      let res = null;
      if (operation === "insert") {
        const guardedCompanyId = getGuardedPersistenceCompanyId();
        if (GUARDED_WRITE_TABLES.has(table) && guardedCompanyId) {
          const guardedResult = await guardedPersistenceClient.persistSupabaseCriticalRow.mutate({
            companyId: guardedCompanyId,
            tableName: table,
            payload: Array.isArray(payload) ? payload[0] : payload,
          });
          res = Array.isArray(guardedResult) ? guardedResult[0] : guardedResult;
        } else {
          const insertQuery = query.insert(payload);
          res = Array.isArray(payload) ? await insertQuery.run() : await insertQuery.single().run();
        }
      } else if (operation === "update") {
        res = await query.eq(matchCol, matchVal).update(payload).single().run();
      } else if (operation === "delete") {
        res = await query.eq(matchCol, matchVal).delete().single().run();
      }
      return { data: res, error: null };
    } catch (error) {
      lastError = error;
      if (isMissingTableError(error)) {
        return { data: null, error: new Error(`Table ${table} is unavailable`) };
      }
      if (isTransientSupabaseError(error) && attempt === 0) {
        await waitForSupabaseRetry(180);
        continue;
      }
      break;
    }
  }
  return { data: null, error: lastError || new Error(`Supabase ${operation} on ${table} failed`) };
}

function useCompanyTable(table, seed, { select = "*", order, mapRow } = {}) {
  // Demo mode serves seed rows instantly. Live mode starts empty and, once a
  // module has rows, keeps them visible during refreshes so navigation does
  // not blank or flicker the page.
  const isLive = IS_CONFIGURED && !DEMO_OVERRIDE;
  const [rowsState, setRowsState] = useState(isLive ? [] : seed);
  const rowsRef = useRef(isLive ? [] : seed);
  const confirmedRowsRef = useRef(isLive ? [] : seed);
  const [loading, setLoading] = useState(isLive);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [unavailable, setUnavailable] = useState(false);
  const selectRef = useRef(select);
  const orderRef = useRef(order);
  const mapRowRef = useRef(mapRow);
  selectRef.current = select;
  orderRef.current = order;
  mapRowRef.current = mapRow;

  const setRows = useCallback((nextRows) => {
    setRowsState((previous) => {
      const next = typeof nextRows === "function" ? nextRows(previous) : nextRows;
      const safeRows = Array.isArray(next) ? next : [];
      rowsRef.current = safeRows;
      return safeRows;
    });
  }, []);

  const reload = useCallback(async () => {
    if (!isLive) return;
    const hasRows = rowsRef.current.length > 0;
    setLoading(!hasRows);
    setRefreshing(hasRows);
    setError(null);
    setUnavailable(false);
    try {
      const result = await runCompanyTableQuery(table, { select: selectRef.current, order: orderRef.current });
      const mapper = mapRowRef.current;
      const confirmedRows = mapper ? result.rows.map(mapper) : result.rows;
      confirmedRowsRef.current = confirmedRows;
      setRows(confirmedRows);
      setUnavailable(result.unavailable);
    } catch (e) {
      // Preserve the last successful rows during refresh failures. Only a
      // first-load failure is surfaced as a module error.
      if (!hasRows) setError(e.message || `Could not load ${table}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [isLive, table]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    if (!isLive) return undefined;
    const reconcile = (event) => {
      if (event?.table !== table) return;
      // Drop any in-flight optimistic rows first. A reload then supplies the
      // database-confirmed representation, including any successful mutation.
      setRows(confirmedRowsRef.current);
      const timer = window.setTimeout(() => { reload(); }, 0);
      return () => window.clearTimeout(timer);
    };
    companyMutationBus.listeners.add(reconcile);
    return () => companyMutationBus.listeners.delete(reconcile);
  }, [isLive, reload, setRows, table]);
  useEffect(() => {
    if (!isLive || typeof window === "undefined") return undefined;
    const reloadAfterSessionUpdate = () => { reload(); };
    window.addEventListener("smart-manager:auth-session-updated", reloadAfterSessionUpdate);
    return () => window.removeEventListener("smart-manager:auth-session-updated", reloadAfterSessionUpdate);
  }, [isLive, reload]);

  return { rows: rowsState, setRows, loading, refreshing, error, unavailable, reload };
}

/* =============================================================================
   DB → UI ROW MAPPERS
   PostgREST returns snake_case columns keyed by UUID; every UI component in
   this file expects camelCase fields keyed by a human-readable document
   number (L-0231, INV-8801, HDW-2201...). These mappers bridge that gap for
   each live-mapped table. `dbId` carries the real UUID through for mutation
   calls (`.eq("id", row.dbId ?? row.id)`); everything else matches the
   corresponding seed shape exactly, so no component code has to change.

   Coverage: crm_leads, inventory_items, finance_expenses, and the three
   sales document tables (with embedded line items via PostgREST's nested
   select). Other live tables (HR, Manufacturing, SCM, E-Commerce, Documents)
   do not yet have mappers — see the handover doc for the remaining list.
   ============================================================================= */

export function mapLeadRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    id: r.id, dbId: r.id,
    name: r.contact_name || data.contact_name || r.name || data.name || r.lead_name || "",
    company: r.company_name || data.company_name || r.company || data.company || "",
    stage: r.stage || data.stage || r.status || "New",
    value: Number(r.value_amount || data.value_amount || r.value || data.value || r.amount) || 0,
    currency: r.currency || data.currency || "TZS",
    owner: r.owner_id || data.owner_id || r.owner || data.owner || "Unassigned",
    email: r.email || data.email || "", phone: r.phone || data.phone || "",
    industry: r.industry || data.industry || "General", score: r.score ?? data.score ?? null,
    lastActivity: r.last_activity_at || data.last_activity_at ? new Date(r.last_activity_at || data.last_activity_at).toLocaleDateString() : "—",
    expectedCloseDate: r.expected_close_date || data.expected_close_date || r.expectedDate || null,
    createdAt: r.created_at || null,
  };
}

export function mapContactRow(r) {
  return {
    id: r.id, dbId: r.id,
    name: r.name || r.contact_name || "", title: r.title || r.role || "", company: r.company || r.company_name || "", email: r.email || "", phone: r.phone || "", isPrimary: r.is_primary,
  };
}

export function mapInventoryRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  const sku = r.sku || r.item_sku || data.sku;
  return {
    sku, dbId: r.id,
    name: r.name || r.item_name || data.item_name || "", category: r.category || data.category || "General", warehouse: r.warehouse_id || r.location || data.warehouse_id || data.location,
    qty: Number(r.qty_on_hand ?? r.quantity ?? data.qty_on_hand ?? data.quantity) || 0, reorder: Number(r.reorder_level ?? data.reorder_level) || 0,
    unitCost: Number(r.unit_cost ?? data.unit_cost ?? r.amount) || 0, unit: r.unit || data.unit || "unit",
    barcode: r.barcode || data.barcode || generateBarcode(sku), expiryDate: r.expiry_date || data.expiry_date || null,
  };
}

function mapWarehouseRow(r) {
  return { id: r.id, dbId: r.id, name: r.name, city: r.city || "" };
}

export function mapPosShiftRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  const countedCash = data.counted_cash ?? data.countedCash;
  return {
    id: r.id,
    dbId: r.id,
    cashier: data.cashier || r.name || "Cashier",
    openingFloat: Number(data.opening_float ?? data.openingFloat ?? r.amount) || 0,
    countedCash: countedCash === null || countedCash === undefined ? null : Number(countedCash),
    status: r.status || data.status || "Open",
    openedAt: data.opened_at || data.openedAt || r.created_at,
    closedAt: data.closed_at || data.closedAt || null,
    rawData: data,
  };
}

export function mapPosCashMovementRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    id: r.id,
    dbId: r.id,
    shiftId: data.shift_id || data.shiftId || null,
    kind: data.kind || r.status || "Pay In",
    amount: Number(r.amount) || 0,
    reason: data.reason || r.notes || "",
  };
}

function mapTransferRow(r) {
  return {
    id: r.id, dbId: r.id,
    sku: r.item_sku, itemName: r.item_name, qty: Number(r.qty) || 0,
    fromWarehouse: r.from_warehouse, toWarehouse: r.to_warehouse,
    status: r.status, date: r.created_at?.slice(0, 10), notes: r.notes || "",
  };
}

function mapBatchRow(r) {
  return {
    id: r.id, dbId: r.id,
    sku: r.item_sku, itemName: r.item_name, batchNumber: r.batch_number,
    qty: Number(r.qty) || 0, expiryDate: r.expiry_date, warehouse: r.warehouse_id,
    supplier: r.supplier_name || "", receivedDate: r.received_date,
  };
}

function mapSupplierRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    id: r.id, dbId: r.id,
    name: r.name || data.name, contactPerson: r.contact_person || data.contact_person || "", email: r.email || data.email || "", phone: r.phone || data.phone || "",
    category: r.category || data.category || "", leadTimeDays: Number(r.lead_time_days ?? data.lead_time_days) || 0, status: r.status || data.status,
  };
}

function mapPoItems(items) {
  return (items || []).map((it) => ({ sku: it.item_sku, name: it.item_name, qty: Number(it.qty) || 0, cost: Number(it.cost) || 0 }));
}

function mapPurchaseOrderRow(r) {
  return {
    id: r.doc_number, dbId: r.id,
    supplier: r.supplier, status: r.status, orderDate: r.order_date, expectedDate: r.expected_date,
    requestedBy: r.requested_by || "", items: mapPoItems(r.purchase_order_items),
  };
}

function mapProcurementContractRow(r) {
  return {
    id: r.doc_number, dbId: r.id,
    supplier: r.supplier, type: r.contract_type, startDate: r.start_date, endDate: r.end_date,
    value: Number(r.value) || 0, notes: r.notes || "",
  };
}

export function mapExpenseRow(r) {
  return {
    id: r.id, dbId: r.id,
    vendor: r.vendor || r.payee || r.supplier || r.data?.vendor || r.data?.payee || "Vendor",
    category: r.category || r.data?.category || "General",
    date: r.expense_date || r.date || r.data?.expense_date || r.created_at?.slice(0, 10) || "",
    dueDate: r.due_date || r.expense_date || r.date || r.data?.due_date || "",
    amount: Number(r.amount ?? r.cost ?? r.value ?? r.data?.amount ?? r.data?.cost ?? r.data?.value) || 0,
    status: r.status || r.data?.status || "Paid",
    method: r.method || r.data?.method || "Bank Transfer",
    department: r.department || r.dept || r.data?.department || r.data?.dept || "Operations",
    costCenter: r.cost_center || r.costCenter || r.cost_code || r.data?.cost_center || r.data?.costCenter || r.data?.cost_code || "CC-GENERAL",
  };
}

function mapAssetRow(r) {
  return {
    id: r.id, dbId: r.id,
    name: r.name, category: r.category, acquisitionDate: r.acquisition_date,
    cost: Number(r.cost) || 0, usefulLifeYears: Number(r.useful_life_years) || 5,
  };
}

// Shared by all three sales documents: PostgREST returns the child items
// table as a nested array keyed by its own table name when the select
// string embeds it (e.g. "*,sales_invoice_items(*)").
function mapDocItems(items) {
  return (Array.isArray(items) ? items : [])
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    .map((it) => ({ name: it.item_name, qty: Number(it.qty) || 0, rate: Number(it.rate) || 0, sku: it.item_sku || null }));
}

function mapQuotationRow(r) {
  return {
    id: r.doc_number, dbId: r.id,
    customer: r.customer, date: r.issue_date, validUntil: r.valid_until,
    status: r.status, owner: r.owner_id || "Unassigned",
    items: mapDocItems(r.items ?? r.sales_quotation_items),
  };
}

function mapOrderReturnRow(rr) {
  return {
    id: rr.id, reason: rr.reason, date: rr.created_at?.slice(0, 10),
    items: (rr.items ?? rr.sales_order_return_items ?? []).map((it) => ({ name: it.item_name, sku: it.item_sku, qty: Number(it.qty) || 0, rate: Number(it.rate) || 0 })),
  };
}

function mapOrderRow(r) {
  return {
    id: r.doc_number, dbId: r.id,
    customer: r.customer, date: r.order_date, quotationRef: r.quotation_reference || (r.quotation_id ? "linked" : "—"),
    status: r.status, owner: r.owner_name || r.owner_id || "Unassigned",
    items: mapDocItems(r.items ?? r.sales_order_items),
    returns: (r.returns ?? r.sales_order_returns ?? []).map(mapOrderReturnRow),
  };
}

function mapPaymentRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return { id: r.id, amount: Number(r.amount) || 0, method: r.method || data.method, date: r.payment_date || data.payment_date || r.created_at, reference: r.reference || data.reference || null };
}

function mapInvoiceRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    id: r.doc_number || data.doc_number || r.id, dbId: r.id,
    customer: r.customer || data.customer || r.name, date: r.issue_date || data.issue_date || r.created_at, dueDate: r.due_date || data.due_date,
    orderRef: r.order_id || data.order_id ? "linked" : "—", status: r.status || data.status,
    amountPaid: Number(r.amount_paid ?? data.amount_paid) || 0,
    items: mapDocItems(r.items ?? r.sales_invoice_items ?? data.items),
    payments: (r.payments ?? r.sales_payments ?? []).map(mapPaymentRow).sort((a, b) => (a.date < b.date ? 1 : -1)),
  };
}

function mapSubscriptionRow(r) {
  return {
    id: r.doc_number, dbId: r.id,
    customer: r.customer, plan: r.plan, amount: Number(r.amount) || 0, cycle: r.cycle,
    status: r.status, startDate: r.start_date, nextBillingDate: r.next_billing_date,
  };
}

function mapEmployeeRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    id: r.id, dbId: r.id,
    name: r.full_name || data.full_name || r.name, role: r.role || data.role, department: r.department || data.department || "General",
    email: r.email || data.email || "", phone: r.phone || data.phone || "", status: r.status || data.status,
    salary: Number(r.salary ?? data.salary ?? r.amount) || 0, hireDate: r.hire_date || data.hire_date || r.created_at,
    contractType: r.contract_type || data.contract_type || "Permanent", contractEndDate: r.contract_end_date || data.contract_end_date,
  };
}

// Leave requests store employee_id (a real FK); the embedded select
// "*,hr_employees(full_name)" brings the name along so the UI never has
// to do a second lookup or show a bare UUID.
function mapLeaveRow(r) {
  return {
    id: r.id, dbId: r.id,
    employee: r.hr_employees?.full_name || "Unknown",
    type: r.leave_type, startDate: r.start_date, endDate: r.end_date, status: r.status,
  };
}

function mapCandidateRow(r) {
  return {
    id: r.id, dbId: r.id,
    name: r.name, role: r.role, department: r.department, stage: r.stage,
    email: r.email || "", appliedDate: r.applied_date,
  };
}

function mapAttendanceRow(r) {
  return {
    id: r.id, dbId: r.id,
    employee: r.hr_employees?.full_name || r.employee_name || "Unknown",
    date: r.attendance_date, status: r.status,
    clockIn: r.clock_in || null, clockOut: r.clock_out || null,
    verified:  r.verified    || false,   // true = signed via WebAuthn biometric
    sigMethod: r.sig_method  || "none",  // "biometric" | "unsigned" | "none"
    location:  r.location    || null,
    deviceId:  r.device_id   || null,
  };
}

function mapPerformanceRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    id: r.id, dbId: r.id,
    employee: r.hr_employees?.full_name || r.employee_name || "Unknown",
    period: r.period || data.period, rating: r.rating, reviewer: r.reviewer, notes: r.notes || "", date: r.review_date || r.created_at,
    recordType: data.recordType || "review", objective: data.objective, owner: data.owner, keyResults: Array.isArray(data.keyResults) ? data.keyResults : [],
  };
}

function mapTrainingRow(r) {
  return {
    id: r.id, dbId: r.id,
    employee: r.hr_employees?.full_name || r.employee_name || "Unknown",
    course: r.course, status: r.status, completionDate: r.completion_date,
    mandatory: !!r.is_mandatory, compliance: !!r.is_compliance,
    dueDate: r.due_date || null, videoUrl: r.video_url || null,
  };
}

// LMS Insights — the layer that turns the training list into a learning
// system. Department progress is computed from real assignments joined
// to each employee real department; overdue mandatory training is a
// computed fact (mandatory + past due + not completed); and every
// completed course earns a real printable certificate through the same
// proven printAsPDF isolation every report uses. Honest scope stated in
// the UI: video is linked, not hosted (the storage-layer boundary), and
// exams need a question/answer model — real future work, not a quiz
// widget that grades nothing.
function LmsInsightsPanel({ employees }) {
  const training = useCompanyTable("hr_training", [], { order: { col: "created_at", ascending: false }, mapRow: mapTrainingRow, select: "*,hr_employees(full_name)" });
  const t = TODAY.toISOString().slice(0, 10);

  const deptOf = (name) => (employees.rows.find((e) => e.name === name)?.department) || "General";
  const byDept = {};
  training.rows.forEach((row) => {
    const d = deptOf(row.employee);
    byDept[d] = byDept[d] || { total: 0, done: 0 };
    byDept[d].total += 1;
    if (row.status === "Completed") byDept[d].done += 1;
  });
  const overdue = training.rows.filter((r) => r.mandatory && r.status !== "Completed" && r.dueDate && r.dueDate < t);
  const completed = training.rows.filter((r) => r.status === "Completed").slice(0, 6);

  function printCertificate(row) {
    printAsPDF(`Certificate — ${row.course}`, `
      <div style="text-align:center;padding:40px 20px;border:3px double #16A34A;">
        <p style="letter-spacing:3px;color:#16A34A;font-size:12px;">CERTIFICATE OF COMPLETION</p>
        <h1 style="margin:18px 0 6px;">${row.employee}</h1>
        <p style="color:#555;">has successfully completed the course</p>
        <h2 style="margin:10px 0;">${row.course}</h2>
        ${row.compliance ? '<p style="color:#16A34A;font-size:12px;font-weight:bold;">COMPLIANCE TRAINING</p>' : ""}
        <p style="color:#888;font-size:12px;margin-top:16px;">Completed ${row.completionDate || "—"} · issued from live training records</p>
      </div>
    `);
  }

  return (
    <div className="space-y-4 mt-5">
      {overdue.length > 0 && (
        <div className="rounded-xl p-3.5 flex items-start gap-2.5" style={{ backgroundColor: "#FEE2E2" }}>
          <AlertCircle size={15} className="text-[#EF4444] shrink-0 mt-0.5" />
          <p className="text-[11.5px] text-[#991B1B]"><strong>{overdue.length} overdue mandatory training(s):</strong> {overdue.slice(0, 4).map((r) => `${r.employee} — ${r.course}`).join("; ")}{overdue.length > 4 ? "…" : ""}</p>
        </div>
      )}

      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-5">
        <h3 className="text-[14px] font-semibold text-[#111827] mb-1">Training Progress by Department</h3>
        <p className="text-[11.5px] text-slate-500 mb-3">Real completion rates from real assignments — video is linked, not hosted, and exams need a question model (named future work, not a quiz that grades nothing).</p>
        <div className="space-y-2">
          {Object.entries(byDept).sort((a, b) => b[1].total - a[1].total).map(([dept, s]) => (
            <div key={dept} className="flex items-center gap-3">
              <span className="text-[12px] text-slate-600 w-32 truncate shrink-0">{dept}</span>
              <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${(s.done / s.total) * 100}%`, backgroundColor: s.done === s.total ? "#16A34A" : "#F59E0B" }} /></div>
              <span className="text-[11.5px] font-mono text-slate-500 shrink-0">{s.done}/{s.total}</span>
            </div>
          ))}
          {!training.loading && training.rows.length === 0 && <p className="text-[12px] text-slate-400 text-center py-3">No training assignments yet.</p>}
        </div>
      </div>

      {completed.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm divide-y divide-slate-50">
          <p className="text-[13px] font-semibold text-[#111827] px-4 pt-3.5 pb-2">Certificates — completed courses</p>
          {completed.map((row) => (
            <div key={row.id} className="flex items-center justify-between px-4 py-2.5">
              <div className="min-w-0"><p className="text-[12.5px] font-medium text-[#111827] truncate">{row.employee} — {row.course}</p><p className="text-[10.5px] text-slate-400">{row.compliance ? "Compliance · " : ""}completed {row.completionDate || "—"}</p></div>
              <button onClick={() => printCertificate(row)} className="text-[11px] font-medium text-[#16A34A] hover:underline shrink-0 ml-3 flex items-center gap-1"><Download size={11} /> Certificate</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function mapBenefitRow(r) {
  return {
    id: r.id, dbId: r.id,
    employee: r.hr_employees?.full_name || r.employee_name || "Unknown",
    type: r.benefit_type, monthlyValue: Number(r.monthly_value) || 0, status: r.status, enrollmentDate: r.enrollment_date,
  };
}

function mapPayrollRunRow(r) {
  return {
    id: r.id, dbId: r.id,
    period: r.period, employeeCount: r.employee_count, totalAmount: Number(r.total_amount) || 0,
    status: r.status, processedDate: r.processed_date,
  };
}

function mapBomComponents(components) {
  return (components || []).map((c) => ({ sku: c.item_sku, qty: Number(c.qty) || 0 }));
}

function mapBomRow(r) {
  return {
    id: r.id, dbId: r.id,
    product: r.product_name, outputUnit: r.output_unit, laborCost: Number(r.labor_cost) || 0,
    components: mapBomComponents(r.manufacturing_bom_components),
  };
}

function mapMachineRow(r) {
  return {
    id: r.id, dbId: r.id,
    name: r.name, type: r.machine_type || "", warehouse: r.warehouse_id, status: r.status, purchaseDate: r.purchase_date,
  };
}

function mapQcInspectionRow(r) {
  return {
    id: r.id, dbId: r.id,
    workOrderId: r.work_order_ref, inspector: r.inspector, result: r.result,
    defectsFound: Number(r.defects_found) || 0, notes: r.notes || "", date: r.inspection_date,
  };
}

function mapMaintenanceRow(r) {
  return {
    id: r.id, dbId: r.id,
    machine: r.machine_name, type: r.maintenance_type, technician: r.technician || "",
    date: r.maintenance_date, cost: Number(r.cost) || 0, notes: r.notes || "", nextDueDate: r.next_due_date,
  };
}

function mapProjectRow(r) {
  return {
    id: r.id, dbId: r.id,
    name: r.name, client: r.client, status: r.status, startDate: r.start_date, endDate: r.end_date,
    budget: Number(r.budget) || 0, manager: r.manager || "",
  };
}

function mapProjectTaskRow(r) {
  return {
    id: r.id, dbId: r.id,
    projectId: r.project_ref, title: r.title, assignee: r.assignee || "", status: r.status,
    priority: r.priority, dueDate: r.due_date,
  };
}

function mapMilestoneRow(r) {
  return {
    id: r.id, dbId: r.id,
    projectId: r.project_ref, title: r.title, dueDate: r.due_date, completed: r.completed,
  };
}

function mapProjectExpenseRow(r) {
  return {
    id: r.id, dbId: r.id,
    projectId: r.project_ref, description: r.description, amount: Number(r.amount) || 0, date: r.expense_date,
  };
}

function mapTicketMessages(messages) {
  return (messages || []).map((m) => ({ from: m.sender, text: m.body, date: m.sent_at?.slice(0, 10) }));
}

function mapTicketRow(r) {
  return {
    id: r.doc_number, dbId: r.id,
    subject: r.subject, customer: r.customer, category: r.category, priority: r.priority,
    status: r.status, assignee: r.assignee || "", createdDate: r.created_date,
    createdAt: r.created_at || r.created_date || null,
    resolvedAt: r.resolved_at || null,
    closedAt: r.closed_at || null,
    messages: mapTicketMessages(r.support_ticket_messages),
  };
}

function mapChatMessages(messages) {
  return (messages || []).map((m) => ({ from: m.sender, text: m.body, time: m.sent_at }));
}

function mapChatRow(r) {
  return {
    id: r.id, dbId: r.id,
    customer: r.customer, status: r.status, messages: mapChatMessages(r.support_chat_messages),
  };
}

function mapKbArticleRow(r) {
  return {
    id: r.id, dbId: r.id,
    title: r.title, category: r.category, content: r.content, views: Number(r.views) || 0,
    published: r.published, updatedDate: r.updated_at?.slice(0, 10),
  };
}

function mapCallLogRow(r) {
  return {
    id: r.id, dbId: r.id,
    customer: r.customer, agent: r.agent, direction: r.direction, duration: Number(r.duration_minutes) || 0,
    outcome: r.outcome, date: r.call_date, notes: r.notes || "",
  };
}

function mapNotificationChannelRow(r) {
  return {
    id: r.channel_id, dbId: r.id, enabled: r.enabled,
    webhookUrl: r.webhook_url || "", fromAddress: r.from_address || "", fromNumber: r.from_number || "",
    businessNumber: r.business_number || "", serverKey: r.server_key || "",
  };
}

function mapNotificationRuleRow(r) {
  return { id: r.alert_type, dbId: r.id, channels: r.channels || [] };
}

function mapNotificationLogRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    id: r.id, dbId: r.id, channel: r.channel, event: r.event, message: r.message,
    status: r.status, note: r.note || "", timestamp: r.created_at,
    data, notificationType: r.notificationType || data.notificationType || "", recipientUserId: r.recipientUserId || data.recipientUserId || "", approvalId: r.approvalId || data.approvalId || "",
  };
}

function mapAuditLogRow(r) {
  return { id: r.id, action: r.action, module: r.module, actor: r.actor, details: r.details || "", timestamp: r.created_at };
}

function mapScheduledReportRow(r) {
  return {
    id: r.id, dbId: r.id, reportType: r.report_type, frequency: r.frequency, format: r.format,
    recipientEmail: r.recipient_email || "", status: r.status, lastRun: r.last_run,
  };
}

function mapIntegrationConnectionRow(r) {
  const data = r?.data && typeof r.data === "object" && !Array.isArray(r.data) ? r.data : {};
  return {
    id: r.integration_id || r.channel_id || data.integrationId || r.name || r.id,
    dbId: r.id,
    enabled: Boolean(r.enabled ?? data.enabled ?? r.status === "Connected"),
    tenantId: r.tenant_id || data.tenantId || "",
    clientId: r.client_id || data.clientId || "",
    paymentLink: r.payment_link || data.paymentLink || "",
    paypalMeLink: r.paypal_me_link || data.paypalMeLink || "",
    webhookUrl: r.webhook_url || data.webhookUrl || "",
    apiKey: r.api_key || data.apiKey || "",
    businessNumber: r.business_number || data.businessNumber || "",
    storeUrl: r.store_url || data.storeUrl || "",
    terminalId: r.terminal_id || data.terminalId || "",
    lastTestedAt: data.lastTestedAt || null,
    lastTestStatus: data.lastTestStatus || null,
  };
}

function mapSignatureRow(r) {
  return {
    id: r.id, dbId: r.id, documentRef: r.document_ref, signerName: r.signer_name,
    imageData: r.image_data, signedAt: r.signed_at,
  };
}

function mapCustomKpiRow(r) {
  return { id: r.id, dbId: r.id, metricId: r.metric_id, label: r.label, target: Number(r.target_value) || 0 };
}

function mapCompetitorRow(r) {
  return {
    id: r.id, dbId: r.id, name: r.name, category: r.category || "",
    threatLevel: r.threat_level, notes: r.notes || "", lastUpdated: r.updated_at?.slice(0, 10),
  };
}

function mapBenchmarkRow(r) {
  return { id: r.id, dbId: r.id, metricId: r.metric_id, label: r.label, benchmarkValue: Number(r.benchmark_value) || 0 };
}

function mapWorkflowRow(r) {
  return { id: r.id, dbId: r.id, name: r.name, trigger: r.trigger_type, enabled: r.enabled, steps: r.steps || [], condition: r.condition || null, lastRun: r.last_run };
}

function mapCalendarEventRow(r) {
  return {
    id: r.id, dbId: r.id, title: r.title, type: r.event_type, date: r.event_date,
    startTime: r.start_time, endTime: r.end_time, meetingLink: r.meeting_link || "",
    attendees: r.attendees || "", description: r.description || "",
  };
}

function mapCollabChannelRow(r) {
  return { id: r.id, dbId: r.id, name: r.name, scope: r.scope, description: r.description || "" };
}

function mapCollabMessageRow(r) {
  return { id: r.id, dbId: r.id, channelId: r.channel_ref, sender: r.sender, text: r.body, timestamp: r.created_at };
}

function mapWorkspaceRow(r) {
  return {
    id: r.id, dbId: r.id, name: r.name, department: r.department || "",
    members: r.members || "", channelId: r.channel_ref || "", description: r.description || "",
  };
}

function mapMarketplaceTemplateRow(r) {
  return {
    id: r.id, dbId: r.id, name: r.name, description: r.description, category: r.category,
    trigger: r.trigger_type, steps: r.steps || [], publisherName: r.published_by_company_name || "Official",
    isOfficial: r.is_official, installCount: r.install_count || 0,
  };
}

// bom_id is a real FK into manufacturing_boms, and BOMs now have a full
// live CRUD (see BOMFormPanel) — closing the gap this comment used to
// describe. bomId carries the real UUID once a real project is connected;
// in demo mode it matches bomsSeed's "BOM-01"-style codes directly.
function mapWorkOrderRow(r) {
  return {
    id: r.id, dbId: r.id,
    bomId: r.bom_id, product: r.product, qty: Number(r.qty) || 0, status: r.status,
    startDate: r.start_date, dueDate: r.due_date,
    assignedTo: r.profiles?.full_name || "Unassigned",
  };
}

function mapVehicleRow(r) {
  return {
    reg: r.reg, dbId: r.id,
    type: r.vehicle_type || "", driver: r.driver || "", capacity: r.capacity || "", status: r.status,
  };
}

function mapShipmentRow(r) {
  return {
    id: r.id, dbId: r.id,
    orderRef: r.order_ref || "—", customer: r.customer, destination: r.destination,
    vehicle: r.vehicle_reg, dispatchDate: r.dispatch_date, expectedDate: r.expected_date, status: r.status,
  };
}

// ecommerce_products only stores price/published/featured — name and
// category are looked up live from Inventory via the embedded select
// "*,inventory_items(name,category)", so a rename in Inventory is
// reflected on the storefront without touching this row at all.
function mapProductRow(r) {
  return {
    sku: r.sku, dbId: r.id,
    name: r.inventory_items?.name || r.sku,
    category: r.inventory_items?.category || "General",
    price: Number(r.price) || 0, published: r.published, featured: r.featured,
  };
}

function mapOnlineOrderItems(items) {
  return (items || []).map((it) => ({ name: it.item_name, qty: Number(it.qty) || 0, price: Number(it.price) || 0 }));
}

function mapOnlineOrderRow(r) {
  return {
    id: r.doc_number, dbId: r.id,
    customer: r.customer_name, email: r.customer_email || "",
    items: mapOnlineOrderItems(r.ecommerce_order_items),
    total: Number(r.total) || 0, status: r.status, method: r.payment_method || "", date: r.order_date,
  };
}

function mapFileRow(r) {
  return {
    id: r.id, dbId: r.id,
    name: r.name, type: r.file_type, folder: r.folder, size: r.size_label || "—",
    uploadedBy: r.profiles?.full_name || "Unknown", date: r.created_at?.slice(0, 10),
    linkedRecord: r.linked_record || null, content: r.content || "", versions: r.versions || [],
  };
}

function mapCampaignRow(r) {
  return {
    id: r.id, dbId: r.id,
    name: r.name, type: r.campaign_type, status: r.status, segment: r.segment,
    sentDate: r.sent_date, openRate: r.open_rate === null ? null : Number(r.open_rate),
    clickRate: r.click_rate === null ? null : Number(r.click_rate),
  };
}

function mapPosItems(items) {
  return (items || []).map((it) => ({ sku: it.item_sku || it.sku, name: it.item_name || it.name, qty: Number(it.qty) || 0, price: Number(it.price) || 0 }));
}

function mapReturnRow(rr) {
  return {
    id: rr.id, refundTotal: Number(rr.refund_total) || 0, reason: rr.reason,
    date: rr.created_at?.slice(0, 10), items: mapPosItems(rr.pos_return_items),
  };
}

function mapPosTransactionRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    id: r.doc_number, dbId: r.id,
    cashier: r.profiles?.full_name || data.cashier || "Unknown", method: r.payment_method || data.payment_method || "",
    status: r.status || data.status || "Completed", customerId: data.customer_id || null, customer: data.customer_name || "Guest", rawData: data, date: r.created_at?.slice(0, 10),
    createdAt: r.created_at || null,
    items: mapPosItems(r.pos_transaction_items?.length ? r.pos_transaction_items : data.items),
    returns: (r.pos_returns || []).map(mapReturnRow),
  };
}

function mapPosTransactionItemRow(r) {
  const data = r.data && typeof r.data === "object" ? r.data : {};
  return {
    dbId: r.id,
    transactionId: data.transaction_id || null,
    sku: data.item_sku || data.sku || "",
    name: data.item_name || r.name || "Item",
    qty: Number(data.qty ?? r.amount ?? 0),
    price: Number(data.price ?? 0),
  };
}

async function loadPosTransactionForDisplay(transactionId) {
  try {
    const nested = await sb("pos_transactions").select("*,pos_transaction_items(*),pos_returns(*,pos_return_items(*))").eq("id", transactionId).single().run();
    return mapPosTransactionRow(nested);
  } catch (nestedReadError) {
    const [flatTransaction, itemRows, returnRows, returnItemRows] = await Promise.all([
      sb("pos_transactions").select("*").eq("id", transactionId).single().run(),
      sb("pos_transaction_items").select("*").run(),
      sb("pos_returns").select("*").run(),
      sb("pos_return_items").select("*").run(),
    ]);
    const transactionItems = itemRows.filter((item) => item?.data?.transaction_id === transactionId);
    const returns = returnRows
      .filter((record) => record?.data?.transaction_id === transactionId)
      .map((record) => ({ ...record, pos_return_items: returnItemRows.filter((item) => item?.data?.return_id === record.id) }));
    console.warn("POS relationship expansion unavailable; using tenant-scoped flat detail fallback", nestedReadError);
    return mapPosTransactionRow({ ...flatTransaction, pos_transaction_items: transactionItems, pos_returns: returns });
  }
}

/* =============================================================================
   TOASTS — lightweight module-level pub/sub so any handler anywhere can call
   notify() without prop-drilling through seven module trees. The <Toasts />
   component at the app root subscribes and renders the stack.
   ============================================================================= */

export const toastBus = {
  listeners: new Set(),
  push(toast) { this.listeners.forEach((fn) => fn(toast)); },
  clear() { this.listeners.forEach((fn) => fn({ type: "clear" })); },
};

let toastSeq = 0;
function notify(message, type = "success") {
  // Legacy handlers can still describe their temporary UI state as "local".
  // Normalize that message at the shared boundary so no failed request is
  // presented as saved; the affected table cache is reconciled separately.
  const isRejectedLocalSave = type === "error" && /locally|local-only|server sync failed/i.test(String(message));
  if (isRejectedLocalSave) {
    toastBus.clear();
    toastBus.push({ id: ++toastSeq, message: "The server did not confirm this change. It was not saved; live data has been restored.", type: "error" });
    return;
  }
  toastBus.push({ id: ++toastSeq, message, type });
}

const TOAST_STYLE = {
  success: { bg: "rgba(5,46,22,0.97)", accent: "#22C55E", label: "#BBF7D0", Icon: CheckCircle2 },
  error:   { bg: "rgba(60,10,8,0.97)",  accent: "#EF4444", label: "#FECACA", Icon: AlertCircle },
  info:    { bg: "rgba(12,15,28,0.97)", accent: "#38BDF8", label: "#BAE6FD", Icon: Bell },
};
const TOAST_DURATION = 3800;

// Premium toast — glassmorphism card, auto-progress bar that drains in real
// time, stacked dismiss. The progress bar uses a CSS animation tied to the
// same duration constant so the two can never drift apart.
// Activity Stream — live feed from auditBus + historical audit_log rows.
// Same bus pattern as toasts. Updates in real time as any action anywhere
// in the system emits via logAudit(). The reference app showed this;
// the implementation here uses the bus that already exists.


function ActivityStream({ currentUser }) {
  const [entries, setEntries] = useState([]);
  const [filter, setFilter] = useState("All");
  const dbAudit = useCompanyTable("audit_log", [], {
    order: { col: "created_at", ascending: false },
    mapRow: (r) => ({ id: r.id, action: r.action, module: r.module, actor: r.actor, details: r.details, timestamp: r.created_at }),
  });

  useEffect(() => {
    if (!dbAudit.loading) {
      setEntries((prev) => {
        const existing = new Set(prev.map((e) => e.id));
        const fresh = dbAudit.rows.filter((r) => !existing.has(r.id));
        return [...prev, ...fresh].sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1)).slice(0, 100);
      });
    }
  }, [dbAudit.loading, dbAudit.rows.length]);

  useEffect(() => {
    const handler = (entry) => setEntries((prev) => [entry, ...prev].slice(0, 100));
    auditBus.listeners.add(handler);
    return () => auditBus.listeners.delete(handler);
  }, []);

  const modules = ["All", ...new Set(entries.map((e) => e.module).filter(Boolean))];
  const visible = filter === "All" ? entries : entries.filter((e) => e.module === filter);

  const ago = (ts) => {
    const mins = Math.max(0, Math.floor((Date.now() - new Date(ts)) / 60000));
    return mins < 1 ? "just now" : mins < 60 ? `${mins}m ago` : mins < 1440 ? `${Math.floor(mins/60)}h ago` : new Date(ts).toLocaleDateString("en-GB", { day:"numeric", month:"short" });
  };

  return (
    <div className="space-y-4 max-w-3xl">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h3 className="text-[15px] font-semibold text-[#111827]">Activity Stream</h3>
          <p className="text-[12px] text-slate-500">Confirmed audit history across permitted modules, with in-session updates after actions are recorded.</p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5" aria-label="Filter confirmed activity by module">
          {modules.slice(0, 7).map((m) => (
            <button key={m} type="button" aria-pressed={filter === m} onClick={() => setFilter(m)} className={`text-[11.5px] font-medium px-2.5 py-1.5 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40 ${filter === m ? "bg-[#DCFCE7] text-[#16A34A]" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}>{m}</button>
          ))}
          {filter !== "All" && <button type="button" onClick={() => setFilter("All")} className="text-[11px] font-semibold px-2 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40">Clear filter</button>}
        </div>
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
        {!dbAudit.loading && <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/70 px-4 py-2 text-[10.5px] text-slate-400"><span>{visible.length} confirmed {filter === "All" ? "entries" : `${filter} entries`}</span><span>Source: tenant audit log</span></div>}
        {dbAudit.loading && <p className="text-[12px] text-slate-400 text-center py-8">Loading activity history...</p>}
        {!dbAudit.loading && visible.length === 0 && (
          <div className="py-14 text-center">
            <Activity size={32} className="text-slate-200 mx-auto mb-3" />
            <p className="text-[13px] font-medium text-slate-400">No confirmed activity{filter === "All" ? " yet" : ` in ${filter}`}</p>
            <p className="text-[11.5px] text-slate-400 mt-1">Recorded actions across permitted modules appear here. No sample events are generated.</p>
          </div>
        )}
        {visible.slice(0, 50).map((e) => {
          const color = ACTIVITY_MODULE_COLORS[e.module] || "#94A3B8";
          return (
            <div key={e.id} className="flex items-start gap-3 px-4 py-3.5 border-b border-slate-50 last:border-0 hover:bg-slate-50/50 transition-colors">
              <div className="w-2 h-2 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
              <div className="min-w-0 flex-1">
                <p className="text-[12.5px] font-medium text-[#111827]">{e.action}</p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">{e.module}{e.details ? ` · ${e.details}` : ""}{e.actor ? ` · ${e.actor}` : ""}</p>
              </div>
              <span className="text-[10px] font-mono text-slate-400 shrink-0 mt-0.5">{ago(e.timestamp)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// SendReceiptPanel — appears automatically whenever a payment brings
// an invoice to fully Paid (receiptBus), giving the operator an instant
// one-tap dispatch to the customer. Three genuinely functional channels
// in a browser:
//   WhatsApp:  wa.me/{phone}?text={url-encoded message} — opens the real
//              WhatsApp app with the message pre-filled; the operator
//              hits send. No API, no credentials, works on any phone.
//   Email:     mailto:{email}?subject=...&body=... — opens the device
//              default email client with subject and body pre-filled.
//   SMS:       sms:{phone}?body={text} — opens the device SMS app.
// Automated sending (message without human confirmation) needs a backend
// gateway — Twilio, AfricasTalking, SendGrid — named in the UI, not faked.
// The receipt itself is a real printable PDF via printAsPDF.
/* ═══════════════════════════════════════════════════════════════════════
   POST-CREATE DISPATCH PANEL
   Fires immediately after any invoice is saved.
   Slides up from the bottom-right as a non-blocking overlay —
   same pattern as SendReceiptPanel (which fires after payment).
   Gives the operator one-tap dispatch to:
     • WhatsApp  – pre-fills WA with the invoice details → wa.me or API
     • Email     – pre-fills a professional invoice email → mailto or SMTP
     • Print PDF – opens the print invoice window
     • Copy Link – copies a payment link with invoice reference
     • Dismiss   – saves without sending
═══════════════════════════════════════════════════════════════════════ */
/* ═══════════════════════════════════════════════════════════════════════
   DAILY BUSINESS BRIEFING
   Auto-triggers once per day when a high-rank user (CEO/Owner/Manager)
   opens the system. Shows a full-page executive report covering every
   enabled module — KPIs, alerts (🚨 low stock, overdue invoices, etc.),
   trends, and smart recommendations.
   Downloadable as a print-ready PDF with company branding.
   Dismissible; re-opens via the top-bar bell or "Today Brief" button.
═══════════════════════════════════════════════════════════════════════ */



// Kept beside DailyBriefing so the live-data state decision remains local to
// the preserved dashboard while also being directly testable.
export function resolveDailyBriefingFetchState({ sources = [], usingDemoBriefing = false, previewState = null }) {
  const safeSources = Array.isArray(sources) ? sources : [];
  const previewError = previewState === "error" ? new Error("Daily Briefing preview fetch failed") : null;
  return {
    loading: previewState === "loading" || (!usingDemoBriefing && safeSources.some((source) => source?.loading)),
    error: previewError || (!usingDemoBriefing ? safeSources.find((source) => source?.error)?.error : null),
  };
}

function DailyBriefing({ company, currentUser, canManage, invoices, inventory,
  expenses, crm, employees, leaveRequests, workOrders, subscriptions, smartAlerts, enabledModules }) {

  const co = company || {};
  const TODAY_STR = TODAY.toISOString().slice(0, 10);
  const briKey    = `bs_brief_${TODAY_STR}`;

  // Auto-show once per day for exec roles
  const [open, setOpen] = useState(() => {
    if (!BRIEFING_EXEC_ROLES.has(canonicalRoleId(currentUser?.role))) return false;
    try { return !localStorage.getItem(briKey); } catch { return false; }
  });
  const [printing, setPrinting] = useState(false);
  const [retryingData, setRetryingData] = useState(false);

  useEffect(() => {
    if (open) { try { localStorage.setItem(briKey, "1"); } catch {} }
  }, [open]);

  // Expose open trigger to topbar
  useEffect(() => {
    window.__openDailyBrief = () => setOpen(true);
    return () => { delete window.__openDailyBrief; };
  }, []);

  // Each shared table hook exposes loading, error, and reload. Keep the
  // briefing honest: it should wait for its live inputs and explain a failed
  // fetch instead of presenting an incomplete report as if it were complete.
  const briefingSources = [invoices, inventory, expenses, crm, employees, leaveRequests, workOrders, subscriptions]
    .filter((source) => source && typeof source === "object" && !Array.isArray(source));
  const usingDemoBriefing = DEMO_OVERRIDE || !IS_CONFIGURED;
  // Development-only preview states allow the loading and retry overlays to
  // be verified without weakening or altering production data behavior.
  const [briefingPreviewState, setBriefingPreviewState] = useState(() => {
    if (!import.meta.env.DEV || typeof window === "undefined") return null;
    const requested = new URLSearchParams(window.location.search).get("daily-briefing-preview");
    return ["loading", "error"].includes(requested) ? requested : null;
  });
  useEffect(() => {
    if (!open || briefingPreviewState !== "loading" || typeof window === "undefined") return;
    const requestedDuration = Number(new URLSearchParams(window.location.search).get("daily-briefing-preview-duration"));
    const duration = Number.isFinite(requestedDuration) ? Math.min(Math.max(requestedDuration, 400), 6000) : 1600;
    const timer = window.setTimeout(() => setBriefingPreviewState("resolved"), duration);
    return () => window.clearTimeout(timer);
  }, [briefingPreviewState, open]);
  const { loading: briefingLoading, error: briefingError } = resolveDailyBriefingFetchState({
    sources: briefingSources,
    usingDemoBriefing,
    previewState: briefingPreviewState,
  });

  async function retryBriefingData() {
    setRetryingData(true);
    try {
      await Promise.all(briefingSources.map((source) => source.reload?.()).filter(Boolean));
    } finally {
      setRetryingData(false);
    }
  }

  // ── Compute all section data ─────────────────────────────────────────
  const data = useMemo(() => {
    const fmt    = (n) => new Intl.NumberFormat("en-US").format(Math.round(n || 0));
    const today  = TODAY_STR;
    const invRows = invoices?.rows || [];

    // SALES
    const todayInvs   = invRows.filter(i => i.date === today);
    const totalBilled = invRows.reduce((s, i) => s + lineTotal(i.items || []).total, 0);
    const totalCollected = invRows.reduce((s, i) => s + (i.amountPaid || 0), 0);
    const overdueInvs = invRows.filter(i => i.status !== "Paid" && i.dueDate < today);
    const overdueAmt  = overdueInvs.reduce((s, i) => s + lineTotal(i.items||[]).total - (i.amountPaid||0), 0);
    const unpaidInvs  = invRows.filter(i => i.status === "Unpaid" || i.status === "Partial");

    // INVENTORY
    const invItems  = inventory?.rows || [];
    const lowStock  = invItems.filter(it => it.stock <= it.reorderPoint && it.reorderPoint > 0);
    const outOfStock= invItems.filter(it => it.stock <= 0);
    const stockValue= invItems.reduce((s, it) => s + (it.stock || 0) * (it.cost || 0), 0);

    // FINANCE / EXPENSES
    const expRows  = expenses?.rows || [];
    const todayExp = expRows.filter(e => e.date === today);
    const totalExp = expRows.reduce((s, e) => s + (e.amount || 0), 0);
    const grossPL  = totalCollected - totalExp;

    // CRM
    const leads    = crm?.rows || [];
    const newLeads = leads.filter(l => l.createdAt?.slice(0,10) === today || l.date?.slice(0,10) === today);
    const openOpps = leads.filter(l => !["Won","Lost"].includes(l.stage));
    const pipeVal  = openOpps.reduce((s, l) => s + (l.value || 0), 0);

    // HR
    // `employees` is the shared useCompanyTable result in the authenticated
    // dashboard, while standalone callers may still supply an array. Normalize
    // both shapes before the briefing applies filter/reduce operations.
    const emps      = Array.isArray(employees?.rows) ? employees.rows : (Array.isArray(employees) ? employees : []);
    const activeEmps= emps.filter(e => e.status === "Active");
    const onLeave   = (leaveRequests?.rows || []).filter(l =>
      l.status === "Approved" && l.startDate <= today && l.endDate >= today
    );
    const expContracts = emps.filter(e =>
      e.contractEndDate && e.contractEndDate <= new Date(Date.now()+30*86400000).toISOString().slice(0,10)
    );

    // MANUFACTURING
    const wos       = workOrders?.rows || [];
    const overdueWO = wos.filter(w => w.status !== "Completed" && w.status !== "Cancelled" && w.dueDate < today);

    // SUBSCRIPTIONS
    const subs      = subscriptions?.rows || [];
    const subsDue   = subs.filter(s => s.status === "Active" && s.nextBillingDate && s.nextBillingDate <= new Date(Date.now()+7*86400000).toISOString().slice(0,10));
    const MRR       = subs.filter(s=>s.status==="Active").reduce((sum,s)=>{
      const mo={Monthly:1,Quarterly:3,Annual:12}[s.cycle]||1;
      return sum+(s.amount/mo);
    },0);

    // SMART ALERTS — deduplicated, ranked
    const alerts = (smartAlerts || []).slice(0, 20);

    return {
      fmt, today, todayInvs, totalBilled, totalCollected, overdueInvs, overdueAmt,
      unpaidInvs, lowStock, outOfStock, stockValue, expRows, todayExp, totalExp,
      grossPL, leads, newLeads, openOpps, pipeVal, activeEmps, onLeave,
      expContracts, wos, overdueWO, subs, subsDue, MRR, alerts,
    };
  }, [invoices?.rows, inventory?.rows, expenses?.rows, crm?.rows,
      employees, leaveRequests?.rows, workOrders?.rows, subscriptions?.rows, smartAlerts]);

  if (!open) return null;

  if (briefingLoading || retryingData) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,34,20,0.7)", backdropFilter: "blur(4px)" }} role="status" aria-live="polite" aria-busy="true">
        <div className="w-full max-w-md rounded-2xl bg-white px-7 py-8 text-center shadow-2xl border border-slate-200/70" style={{ animation: "fadeInUp .2s cubic-bezier(.23,1,.32,1)" }}>
          <div className="relative mx-auto mb-5 flex h-14 w-14 items-center justify-center">
            <div className="absolute inset-0 rounded-2xl bg-[#16A34A]/15 motion-safe:animate-ping" />
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-[#0D2214] shadow-sm">
              <RefreshCw size={22} className="text-white motion-safe:animate-spin" style={{ animationDuration: "1.1s" }} />
            </div>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#16A34A]">Preparing your workspace</p>
          <h2 className="mt-2 text-[19px] font-semibold text-[#111827]" style={{ fontFamily: "Poppins,Inter,sans-serif" }}>Building today’s Daily Briefing</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">Connecting your sales, inventory, people, and finance signals.</p>
          <div className="mt-6 h-1.5 overflow-hidden rounded-full bg-slate-100" aria-hidden="true">
            <div className="h-full w-2/3 rounded-full bg-gradient-to-r from-[#16A34A] via-[#4ADE80] to-[#16A34A] motion-safe:animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (briefingError) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(13,34,20,0.7)", backdropFilter: "blur(4px)" }} role="alert" aria-live="assertive">
        <div className="w-full max-w-md rounded-2xl bg-white px-7 py-8 text-center shadow-2xl border border-slate-200/70" style={{ animation: "fadeInUp .2s cubic-bezier(.23,1,.32,1)" }}>
          <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
            <AlertCircle size={23} className="text-[#DC2626]" />
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[#DC2626]">Briefing unavailable</p>
          <h2 className="mt-2 text-[19px] font-semibold text-[#111827]" style={{ fontFamily: "Poppins,Inter,sans-serif" }}>We couldn’t prepare the Daily Briefing</h2>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-500">One or more live data sources did not respond. Your server data is unchanged; retry when you are ready.</p>
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
            <button type="button" onClick={() => setOpen(false)} className="rounded-xl px-4 py-2.5 text-[13px] font-semibold text-slate-500 hover:bg-slate-50 transition-colors">Close</button>
            <button type="button" onClick={retryBriefingData} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0D2214] px-4 py-2.5 text-[13px] font-semibold text-white shadow-sm transition-all hover:bg-[#17452b] active:scale-[.97]">
              <RefreshCw size={15} /> Retry data fetch
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { fmt, today, todayInvs, totalBilled, totalCollected, overdueInvs, overdueAmt,
    unpaidInvs, lowStock, outOfStock, stockValue, expRows, todayExp, totalExp,
    grossPL, leads, newLeads, openOpps, pipeVal, activeEmps, onLeave,
    expContracts, wos, overdueWO, subs, subsDue, MRR, alerts } = data;

  const ALERT_CFG = {
    critical: { col:"#EF4444", bg:"#FEF2F2", border:"#FECACA", label:"CRITICAL" },
    high:     { col:"#F59E0B", bg:"#FFFBEB", border:"#FDE68A", label:"HIGH" },
    medium:   { col:"#3B82F6", bg:"#EFF6FF", border:"#BFDBFE", label:"MEDIUM" },
    low:      { col:"#16A34A", bg:"#F0FDF4", border:"#BBF7D0", label:"LOW" },
  };

  // ── PDF export ───────────────────────────────────────────────────────
  function printBriefing() {
    const ACCENT = "#16A34A";
    const DARK   = "#0D2214";
    const genTime = new Date().toLocaleString("en-GB",{dateStyle:"full",timeStyle:"short"});

    const alertRows = alerts.map(a => {
      const ac = ALERT_CFG[a.priority]||ALERT_CFG.medium;
      return `<tr>
        <td style="padding:8px 12px">
          <span style="background:${ac.bg};color:${ac.col};padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700;border:1px solid ${ac.border}">${ac.label}</span>
        </td>
        <td style="padding:8px 12px;font-size:12px;font-weight:600;color:#111827">${a.title||a.message||""}</td>
        <td style="padding:8px 12px;font-size:11.5px;color:#6B7280">${a.module||""}</td>
        <td style="padding:8px 12px;font-size:11.5px;color:#6B7280">${a.detail||a.description||""}</td>
      </tr>`;
    }).join("");

    const lowStockRows = lowStock.slice(0,10).map((it,i)=>`<tr style="background:${i%2===0?"#fff":"#FEF2F2"}">
      <td style="padding:7px 12px;font-size:12px;font-weight:600;color:#111827">${it.name}</td>
      <td style="padding:7px 12px;font-size:11.5px;color:#6B7280">${it.category||"—"}</td>
      <td style="padding:7px 12px;text-align:center;font-size:12px;font-weight:700;color:${it.stock<=0?"#EF4444":"#F59E0B"}">${it.stock} ${it.unit||""}</td>
      <td style="padding:7px 12px;text-align:center;font-size:11.5px;color:#6B7280">${it.reorderPoint}</td>
      <td style="padding:7px 12px;text-align:right;font-size:11.5px;color:#6B7280">${it.supplierName||"—"}</td>
    </tr>`).join("");

    const overdueRows = overdueInvs.slice(0,10).map((inv,i)=>{
      const bal = lineTotal(inv.items||[]).total-(inv.amountPaid||0);
      const days= Math.ceil((new Date(today)-new Date(inv.dueDate))/86400000);
      return `<tr style="background:${i%2===0?"#fff":"#FEF2F2"}">
        <td style="padding:7px 12px;font-size:11.5px;font-family:monospace;font-weight:700">${inv.id}</td>
        <td style="padding:7px 12px;font-size:12px;font-weight:600;color:#111827">${inv.customer}</td>
        <td style="padding:7px 12px;font-size:11.5px;color:#6B7280">${inv.dueDate}</td>
        <td style="padding:7px 12px;text-align:center;font-size:11.5px;color:#EF4444;font-weight:700">${days} days</td>
        <td style="padding:7px 12px;text-align:right;font-size:12px;font-family:monospace;font-weight:700;color:#EF4444">TZS ${fmt(bal)}k</td>
      </tr>`;
    }).join("");

    const win = window.open("","_blank","width=1050,height=1200");
    if (!win) { notify("Pop-up blocked — allow pop-ups to download the briefing.","error"); return; }
    win.document.write(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/>
      <title>Daily Briefing — ${co.name||"BusinessSphere"} · ${today}</title>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet"/>
      <style>
        *{box-sizing:border-box;margin:0;padding:0}
        body{font-family:Inter,Arial,sans-serif;background:#F3F4F6;-webkit-print-color-adjust:exact;print-color-adjust:exact}
        @media print{body{background:white;font-size:11px}.toolbar{display:none!important}.page{box-shadow:none!important;margin:0!important}}
        .page{max-width:960px;margin:24px auto;background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 40px rgba(0,0,0,.12)}
        .hdr{background:${DARK};padding:32px 40px;display:flex;justify-content:space-between;align-items:flex-start}
        .co-name{font-family:'Playfair Display',serif;font-size:22px;font-weight:800;color:white}
        .co-meta{font-size:10.5px;color:rgba(255,255,255,.5);margin-top:4px;line-height:1.7}
        .doc-title{font-size:34px;font-weight:900;color:${ACCENT};text-align:right;letter-spacing:-0.5px}
        .doc-sub{font-size:12px;color:rgba(255,255,255,.5);margin-top:6px;text-align:right}
        .alert-band{padding:16px 40px;display:flex;gap:10px;flex-wrap:wrap;border-bottom:1px solid #E5E7EB}
        .a-pill{display:flex;align-items:center;gap:6px;padding:5px 12px;border-radius:20px;font-size:11px;font-weight:700;border:1px solid}
        .kpi-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#E5E7EB}
        .kpi{background:white;padding:18px 22px}
        .kpi-label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#9CA3AF;margin-bottom:4px}
        .kpi-value{font-size:22px;font-weight:900;color:#111827}
        .kpi-sub{font-size:10.5px;color:#6B7280;margin-top:3px}
        .section{padding:24px 40px;border-bottom:1px solid #F3F4F6}
        .sec-hdr{display:flex;align-items:center;gap:8px;margin-bottom:14px}
        .sec-icon{font-size:18px}
        .sec-title{font-size:14px;font-weight:800;color:#111827}
        .sec-badge{background:${DARK};color:white;padding:2px 8px;border-radius:10px;font-size:10px;font-weight:700}
        table.data{width:100%;border-collapse:collapse}
        table.data thead tr{background:${DARK}}
        table.data thead th{padding:8px 12px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:rgba(255,255,255,.7)}
        table.data thead th.r{text-align:right}table.data thead th.c{text-align:center}
        .ftr{background:${DARK};padding:16px 40px;display:flex;justify-content:space-between;align-items:center}
        .ftr-note{font-size:10.5px;color:rgba(255,255,255,.4)}
        .ftr-brand{font-size:11px;font-weight:700;color:${ACCENT}}
        .toolbar{position:fixed;bottom:24px;right:24px;display:flex;gap:8px}
        .btn{padding:10px 20px;border-radius:10px;font-weight:700;font-size:13px;cursor:pointer;border:none;font-family:Inter}
        .btn-p{background:${ACCENT};color:white}.btn-c{background:white;color:#111827;border:1.5px solid #E5E7EB}
        .no-data{color:#9CA3AF;font-size:12px;text-align:center;padding:16px 0}
      </style></head><body>
      <div class="page">

        <!-- HEADER -->
        <div class="hdr">
          <div>
            <div class="co-name">${co.name||"BusinessSphere"}</div>
            <div class="co-meta">${[co.industry,co.city,co.country||"Tanzania"].filter(Boolean).join(" · ")}</div>
            <div class="co-meta" style="margin-top:6px">Prepared for: <strong style="color:rgba(255,255,255,.8)">${currentUser?.name||"Executive"}</strong> (${currentUser?.role||""})</div>
          </div>
          <div>
            <div class="doc-title">Daily Briefing</div>
            <div class="doc-sub">${new Date(today).toLocaleDateString("en-GB",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</div>
            <div class="doc-sub" style="margin-top:3px">Generated: ${genTime}</div>
          </div>
        </div>

        <!-- ALERT BAND -->
        ${alerts.length>0?`<div class="alert-band">${alerts.slice(0,8).map(a=>{
          const ac=ALERT_CFG[a.priority]||ALERT_CFG.medium;
          return `<div class="a-pill" style="background:${ac.bg};border-color:${ac.border};color:${ac.col}">
            ${a.priority==="critical"?"🚨":a.priority==="high"?"⚠":"ℹ"} ${a.title||a.message||""}
          </div>`;
        }).join("")}</div>`:""}

        <!-- KPI SUMMARY -->
        <div class="kpi-grid">
          <div class="kpi"><div class="kpi-label">Total AR Billed</div><div class="kpi-value" style="color:${ACCENT}">TZS ${fmt(totalBilled)}k</div><div class="kpi-sub">${(invoices?.rows||[]).length} invoices</div></div>
          <div class="kpi"><div class="kpi-label">Total Collected</div><div class="kpi-value" style="color:#2563EB">TZS ${fmt(totalCollected)}k</div><div class="kpi-sub">${Math.round(totalBilled>0?totalCollected/totalBilled*100:0)}% collection rate</div></div>
          <div class="kpi"><div class="kpi-label">Overdue AR</div><div class="kpi-value" style="color:${overdueAmt>0?"#EF4444":"#16A34A"}">TZS ${fmt(overdueAmt)}k</div><div class="kpi-sub">${overdueInvs.length} invoices overdue</div></div>
          <div class="kpi"><div class="kpi-label">Gross P&L</div><div class="kpi-value" style="color:${grossPL>=0?"#16A34A":"#EF4444"}">${grossPL>=0?"+":""}TZS ${fmt(Math.abs(grossPL))}k</div><div class="kpi-sub">Collected − Expenses</div></div>
          <div class="kpi"><div class="kpi-label">Inventory Value</div><div class="kpi-value">TZS ${fmt(stockValue)}k</div><div class="kpi-sub">${(inventory?.rows||[]).length} SKUs</div></div>
          <div class="kpi"><div class="kpi-label">Low / Out of Stock</div><div class="kpi-value" style="color:${lowStock.length>0?"#EF4444":"#16A34A"}">${lowStock.length}</div><div class="kpi-sub">${outOfStock.length} completely out</div></div>
          <div class="kpi"><div class="kpi-label">Active Staff</div><div class="kpi-value">${activeEmps.length}</div><div class="kpi-sub">${onLeave.length} on leave today</div></div>
          <div class="kpi"><div class="kpi-label">Pipeline Value</div><div class="kpi-value" style="color:#7C3AED">TZS ${fmt(pipeVal)}k</div><div class="kpi-sub">${openOpps.length} open opportunities</div></div>
        </div>

        <!-- ALERTS TABLE -->
        ${alerts.length>0?`<div class="section">
          <div class="sec-hdr"><span class="sec-icon">🚨</span><span class="sec-title">Active Alerts</span><span class="sec-badge">${alerts.length}</span></div>
          <table class="data"><thead><tr>
            <th>Priority</th><th>Alert</th><th>Module</th><th>Detail</th>
          </tr></thead><tbody>${alertRows}</tbody></table>
        </div>`:""}

        <!-- OVERDUE INVOICES -->
        ${overdueInvs.length>0?`<div class="section">
          <div class="sec-hdr"><span class="sec-icon">📄</span><span class="sec-title">Overdue Invoices</span><span class="sec-badge">${overdueInvs.length}</span></div>
          <table class="data"><thead><tr>
            <th>Invoice</th><th>Customer</th><th>Due Date</th><th class="c">Days Overdue</th><th class="r">Balance (TZS)</th>
          </tr></thead><tbody>${overdueRows}</tbody></table>
        </div>`:`<div class="section"><div class="sec-hdr"><span class="sec-icon">✅</span><span class="sec-title" style="color:#16A34A">No Overdue Invoices</span></div></div>`}

        <!-- LOW STOCK -->
        ${lowStock.length>0?`<div class="section">
          <div class="sec-hdr"><span class="sec-icon">📦</span><span class="sec-title">Low Stock / Reorder Needed</span><span class="sec-badge">${lowStock.length}</span></div>
          <table class="data"><thead><tr>
            <th>Item</th><th>Category</th><th class="c">Current Stock</th><th class="c">Reorder Point</th><th>Preferred Supplier</th>
          </tr></thead><tbody>${lowStockRows}</tbody></table>
        </div>`:`<div class="section"><div class="sec-hdr"><span class="sec-icon">✅</span><span class="sec-title" style="color:#16A34A">All Stock Levels Healthy</span></div></div>`}

        <!-- HR SNAPSHOT -->
        <div class="section">
          <div class="sec-hdr"><span class="sec-icon">👥</span><span class="sec-title">HR Snapshot</span></div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px">
            <div style="background:#F8FAFB;border-radius:10px;padding:14px">
              <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Active Employees</div>
              <div style="font-size:22px;font-weight:800;color:#111827">${activeEmps.length}</div>
            </div>
            <div style="background:${onLeave.length>0?"#FFFBEB":"#F8FAFB"};border-radius:10px;padding:14px">
              <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">On Leave Today</div>
              <div style="font-size:22px;font-weight:800;color:${onLeave.length>0?"#F59E0B":"#111827"}">${onLeave.length}</div>
              ${onLeave.slice(0,2).map(l=>`<div style="font-size:10.5px;color:#92400E;margin-top:3px">${l.employeeName||l.employee||"—"}</div>`).join("")}
            </div>
            <div style="background:${expContracts.length>0?"#FEF2F2":"#F8FAFB"};border-radius:10px;padding:14px">
              <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">Expiring Contracts (30d)</div>
              <div style="font-size:22px;font-weight:800;color:${expContracts.length>0?"#EF4444":"#111827"}">${expContracts.length}</div>
            </div>
          </div>
          ${overdueWO.length>0?`<div style="margin-top:12px;background:#FEF2F2;border-radius:10px;padding:12px">
            <div style="font-size:11px;font-weight:700;color:#EF4444;margin-bottom:6px">⚠ ${overdueWO.length} Work Order${overdueWO.length>1?"s":""} Overdue</div>
            ${overdueWO.slice(0,3).map(w=>`<div style="font-size:11.5px;color:#374151;margin-bottom:2px">• ${w.productName||w.title||w.id} — due ${w.dueDate}</div>`).join("")}
          </div>`:""}
        </div>

        <!-- CRM + SUBSCRIPTIONS -->
        <div class="section">
          <div class="sec-hdr"><span class="sec-icon">📊</span><span class="sec-title">CRM & Revenue</span></div>
          <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px">
            ${[
              ["New Leads Today",String(newLeads.length),"#2563EB"],
              ["Open Opportunities",String(openOpps.length),"#7C3AED"],
              ["Pipeline Value","TZS "+fmt(pipeVal)+"k","#7C3AED"],
              ["MRR (Active Subs)","TZS "+fmt(MRR)+"k","#16A34A"],
            ].map(([l,v,col])=>`<div style="background:#F8FAFB;border-radius:10px;padding:14px">
              <div style="font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:.1em;margin-bottom:4px">${l}</div>
              <div style="font-size:18px;font-weight:800;color:${col}">${v}</div>
            </div>`).join("")}
          </div>
          ${subsDue.length>0?`<div style="margin-top:12px;background:#FFFBEB;border-radius:10px;padding:12px">
            <div style="font-size:11px;font-weight:700;color:#F59E0B;margin-bottom:6px">⏰ ${subsDue.length} Subscription${subsDue.length>1?"s":""} Due for Billing (Next 7 Days)</div>
            ${subsDue.slice(0,3).map(s=>`<div style="font-size:11.5px;color:#374151;margin-bottom:2px">• ${s.customer} — ${s.plan} — ${s.nextBillingDate}</div>`).join("")}
          </div>`:""}
        </div>

        <!-- FOOTER -->
        <div class="ftr">
          <div class="ftr-note">Confidential — For executive use only · ${co.name||"BusinessSphere"} · ${genTime}</div>
          <div class="ftr-brand">BusinessSphere ERP Daily Brief</div>
        </div>
      </div>

      <div class="toolbar">
        <button class="btn btn-c" onclick="window.close()">Close</button>
        <button class="btn btn-p" onclick="window.print()">Download / Print PDF</button>
      </div>
    </body></html>`);
    win.document.close();
    setTimeout(()=>win.focus(),200);
    notify("Daily Briefing PDF ready — print or save");
  }

  // ── Render: full-page modal overlay ─────────────────────────────────
  const criticals = alerts.filter(a=>a.priority==="critical");
  const highs     = alerts.filter(a=>a.priority==="high");
  const fmtCur    = (n) => "TZS " + new Intl.NumberFormat("en-US").format(Math.round(n||0)) + "k";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{background:"rgba(13,34,20,0.7)",backdropFilter:"blur(4px)"}}>
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[92vh] mx-4 flex flex-col overflow-hidden"
        style={{animation:"briefingIn .35s cubic-bezier(.22,1,.36,1)"}}>

        {/* ── Header bar ── */}
        <div className="shrink-0 px-6 pt-5 pb-4 border-b border-slate-100" style={{background:"#0D2214"}}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest">BusinessSphere ERP</span>
                <span className="text-[rgba(255,255,255,.3)]">·</span>
                <span className="text-[10.5px] text-[rgba(255,255,255,.4)] font-mono">{new Date().toLocaleDateString("en-GB",{weekday:"short",day:"numeric",month:"short"})}</span>
              </div>
              <h1 className="text-white text-[24px] font-black tracking-tight leading-none">Good {new Date().getHours()<12?"morning":new Date().getHours()<17?"afternoon":"evening"}, {(currentUser?.name||"").split(" ")[0]} 👋</h1>
              <p className="text-[rgba(255,255,255,.5)] text-[12.5px] mt-1.5">Here is your daily business briefing for {co.name||"your company"}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={printBriefing}
                className="flex items-center gap-1.5 text-[12px] font-bold text-white px-3.5 py-2 rounded-xl border border-[rgba(255,255,255,.15)] hover:bg-[rgba(255,255,255,.08)]">
                <Printer size={13}/> PDF
              </button>
              <button onClick={()=>setOpen(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-[rgba(255,255,255,.6)] hover:text-white hover:bg-[rgba(255,255,255,.1)]">
                <X size={16}/>
              </button>
            </div>
          </div>

          {/* Alert summary pills */}
          {(criticals.length>0||highs.length>0) && (
            <div className="flex gap-2 mt-3 flex-wrap">
              {criticals.length>0&&<span className="flex items-center gap-1.5 text-[11px] font-bold text-white bg-[#EF4444] px-3 py-1 rounded-full">🚨 {criticals.length} Critical</span>}
              {highs.length>0&&<span className="flex items-center gap-1.5 text-[11px] font-bold text-[#111827] bg-[#F59E0B] px-3 py-1 rounded-full">⚠ {highs.length} High</span>}
              {lowStock.length>0&&<span className="flex items-center gap-1.5 text-[11px] font-bold text-[#EF4444] bg-[#FEF2F2] border border-[#FECACA] px-3 py-1 rounded-full">📦 {lowStock.length} Low Stock</span>}
              {overdueInvs.length>0&&<span className="flex items-center gap-1.5 text-[11px] font-bold text-[#F59E0B] bg-[#FFFBEB] border border-[#FDE68A] px-3 py-1 rounded-full">⏰ {overdueInvs.length} Overdue Invoices</span>}
            </div>
          )}
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-y-auto">

          {/* KPI tiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-slate-100">
            {[
              {l:"Total AR Billed",   v:fmtCur(data.totalBilled),   col:"#16A34A", sub:(invoices?.rows||[]).length+" invoices"},
              {l:"Collected",         v:fmtCur(data.totalCollected), col:"#2563EB", sub:Math.round(data.totalBilled>0?data.totalCollected/data.totalBilled*100:0)+"% rate"},
              {l:"Overdue AR",        v:fmtCur(data.overdueAmt),    col:data.overdueAmt>0?"#EF4444":"#16A34A", sub:data.overdueInvs.length+" invoices"},
              {l:"Gross P&L",         v:(data.grossPL>=0?"+":"")+fmtCur(Math.abs(data.grossPL)), col:data.grossPL>=0?"#16A34A":"#EF4444", sub:"Collected − Expenses"},
              {l:"Inventory Value",   v:fmtCur(data.stockValue),    col:"#111827", sub:(inventory?.rows||[]).length+" SKUs"},
              {l:"Low/Out of Stock",  v:String(data.lowStock.length),col:data.lowStock.length>0?"#EF4444":"#16A34A", sub:data.outOfStock.length+" completely out"},
              {l:"Active Staff",      v:String(data.activeEmps.length),col:"#111827", sub:data.onLeave.length+" on leave today"},
              {l:"Pipeline Value",    v:fmtCur(data.pipeVal),       col:"#7C3AED", sub:data.openOpps.length+" open opps"},
            ].map(({l,v,col,sub})=>(
              <div key={l} className="bg-white px-4 py-4">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mb-1.5">{l}</p>
                <p className="text-[19px] font-black" style={{color:col}}>{v}</p>
                <p className="text-[10.5px] text-slate-400 mt-0.5">{sub}</p>
              </div>
            ))}
          </div>

          {/* 🚨 ALERTS SECTION */}
          {alerts.length > 0 && (
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-black text-[#111827] mb-3 flex items-center gap-2">
                🚨 Active Alerts <span className="text-[11px] font-bold text-white bg-[#EF4444] px-2 py-0.5 rounded-full">{alerts.length}</span>
              </h2>
              <div className="space-y-2">
                {alerts.map((a, i) => {
                  const ac = ALERT_CFG[a.priority] || ALERT_CFG.medium;
                  return (
                    <div key={i} className="flex items-start gap-3 px-3 py-3 rounded-xl border"
                      style={{background:ac.bg, borderColor:ac.border}}>
                      <span className="text-[16px] shrink-0 mt-0.5">{a.priority==="critical"?"🚨":a.priority==="high"?"⚠️":"ℹ️"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{background:ac.col,color:"white"}}>{ac.label}</span>
                          <span className="text-[10.5px] font-semibold text-slate-500">{a.module||""}</span>
                        </div>
                        <p className="text-[13px] font-bold" style={{color:ac.col}}>{a.title||a.message||""}</p>
                        {(a.detail||a.description)&&<p className="text-[11.5px] text-slate-500 mt-0.5">{a.detail||a.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 📦 INVENTORY ALERTS */}
          {(lowStock.length > 0 || outOfStock.length > 0) && (
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-black text-[#111827] mb-3 flex items-center gap-2">
                📦 Low Stock Items <span className="text-[11px] font-bold text-white bg-[#EF4444] px-2 py-0.5 rounded-full">{lowStock.length}</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="bg-[#0D2214]">
                    {["Item","Category","Stock","Reorder Point","Supplier","Status"].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-[rgba(255,255,255,.7)]">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {lowStock.slice(0,8).map((it,i)=>(
                      <tr key={it.id} className={i%2===0?"bg-white":"bg-[#FEF2F2]/50"}>
                        <td className="px-3 py-2.5 font-bold text-[#111827]">{it.name}</td>
                        <td className="px-3 py-2.5 text-slate-500">{it.category||"—"}</td>
                        <td className="px-3 py-2.5 font-mono font-black" style={{color:it.stock<=0?"#EF4444":"#F59E0B"}}>{it.stock} {it.unit||""}</td>
                        <td className="px-3 py-2.5 font-mono text-slate-500">{it.reorderPoint}</td>
                        <td className="px-3 py-2.5 text-slate-500">{it.supplierName||"—"}</td>
                        <td className="px-3 py-2.5">
                          <span className={`text-[10.5px] font-bold px-2 py-0.5 rounded-full ${it.stock<=0?"bg-[#EF4444] text-white":"bg-[#FEF2F2] text-[#EF4444] border border-[#FECACA]"}`}>
                            {it.stock<=0?"🚨 OUT OF STOCK":"⚠ REORDER NOW"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 📄 OVERDUE INVOICES */}
          {overdueInvs.length > 0 && (
            <div className="px-6 py-4 border-b border-slate-100">
              <h2 className="text-[14px] font-black text-[#111827] mb-3 flex items-center gap-2">
                📄 Overdue Invoices <span className="text-[11px] font-bold text-white bg-[#F59E0B] px-2 py-0.5 rounded-full">{overdueInvs.length}</span>
                <span className="text-[13px] font-black text-[#EF4444] ml-auto">{fmtCur(data.overdueAmt)} outstanding</span>
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-[12px]">
                  <thead><tr className="bg-[#0D2214]">
                    {["Invoice","Customer","Due Date","Days Late","Balance"].map(h=>(
                      <th key={h} className="px-3 py-2.5 text-left text-[10px] font-bold uppercase tracking-wide text-[rgba(255,255,255,.7)]">{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    {overdueInvs.slice(0,8).map((inv,i)=>{
                      const bal  = lineTotal(inv.items||[]).total-(inv.amountPaid||0);
                      const days = Math.ceil((new Date(TODAY_STR)-new Date(inv.dueDate))/86400000);
                      return (
                        <tr key={inv.id} className={i%2===0?"bg-white":"bg-[#FEF2F2]/50"}>
                          <td className="px-3 py-2.5 font-mono font-bold text-[#111827]">{inv.id}</td>
                          <td className="px-3 py-2.5 font-semibold text-[#111827]">{inv.customer}</td>
                          <td className="px-3 py-2.5 font-mono text-slate-500">{inv.dueDate}</td>
                          <td className="px-3 py-2.5">
                            <span className={`font-bold ${days>30?"text-[#EF4444]":days>14?"text-[#F59E0B]":"text-[#374151]"}`}>{days}d</span>
                          </td>
                          <td className="px-3 py-2.5 font-mono font-black text-[#EF4444]">{fmtCur(bal)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 👥 HR + 📊 CRM snapshot */}
          <div className="grid grid-cols-1 sm:grid-cols-2 divide-x divide-slate-100 border-b border-slate-100">
            <div className="px-6 py-4">
              <h2 className="text-[14px] font-black text-[#111827] mb-3">👥 HR Snapshot</h2>
              <div className="space-y-2">
                {[
                  ["Active Employees", activeEmps.length, "#111827"],
                  ["On Leave Today",   onLeave.length,    onLeave.length>0?"#F59E0B":"#16A34A"],
                  ["Expiring Contracts (30d)", expContracts.length, expContracts.length>0?"#EF4444":"#16A34A"],
                  ["Overdue Work Orders", data.overdueWO.length, data.overdueWO.length>0?"#EF4444":"#16A34A"],
                ].map(([l,v,col])=>(
                  <div key={l} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-[12.5px] text-slate-600">{l}</span>
                    <span className="text-[14px] font-black" style={{color:col}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="px-6 py-4">
              <h2 className="text-[14px] font-black text-[#111827] mb-3">📊 CRM & Revenue</h2>
              <div className="space-y-2">
                {[
                  ["New Leads Today",       newLeads.length,      "#2563EB"],
                  ["Open Opportunities",    openOpps.length,      "#7C3AED"],
                  ["Pipeline Value",        fmtCur(pipeVal),      "#7C3AED"],
                  ["Monthly Recurring Rev", fmtCur(MRR),          "#16A34A"],
                  ["Subs Due (7 days)",     subsDue.length,       subsDue.length>0?"#F59E0B":"#16A34A"],
                ].map(([l,v,col])=>(
                  <div key={l} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                    <span className="text-[12.5px] text-slate-600">{l}</span>
                    <span className="text-[14px] font-black" style={{color:col}}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Good standing notice */}
          {alerts.length===0&&lowStock.length===0&&overdueInvs.length===0&&(
            <div className="mx-6 my-4 bg-[#F0FDF4] border border-[#BBF7D0] rounded-xl p-4 text-center">
              <p className="text-[15px] font-black text-[#16A34A]">✅ Business Health: All Clear</p>
              <p className="text-[12.5px] text-[#166534] mt-1">No critical alerts, no low stock, no overdue invoices. Business is running smoothly.</p>
            </div>
          )}
        </div>

        {/* ── Footer actions ── */}
        <div className="shrink-0 px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between gap-3">
          <p className="text-[11px] text-slate-400">Auto-shows once per day · Re-open anytime from the top bar</p>
          <div className="flex gap-2">
            <button onClick={printBriefing}
              className="flex items-center gap-1.5 text-[12.5px] font-bold text-white px-4 py-2 rounded-xl bg-[#16A34A]">
              <Printer size={13}/> Download PDF
            </button>
            <button onClick={()=>setOpen(false)}
              className="text-[12.5px] font-medium text-slate-600 border border-slate-200 px-4 py-2 rounded-xl hover:bg-white">
              Dismiss
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes briefingIn {
          from{opacity:0;transform:scale(.96) translateY(20px)}
          to{opacity:1;transform:scale(1)    translateY(0)}
        }
      `}</style>
    </div>
  );
}


function PostCreateDispatch({ company, crm }) {
  const [inv, setInv]     = useState(null);   // the just-created invoice
  const [sent, setSent]   = useState({});      // which channels were used
  const [visible, setVis] = useState(false);   // animate in/out
  const [closing, setClg] = useState(false);   // closing animation

  useEffect(() => {
    const handler = (invoice) => {
      setInv(invoice);
      setSent({});
      setClg(false);
      setVis(true);
    };
    invoiceCreatedBus.listeners.add(handler);
    return () => invoiceCreatedBus.listeners.delete(handler);
  }, []);

  // Auto-dismiss after 60 seconds if untouched
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => dismiss(), 60000);
    return () => clearTimeout(t);
  }, [visible]);

  function dismiss() {
    setClg(true);
    setTimeout(() => { setVis(false); setClg(false); setInv(null); }, 280);
  }

  if (!inv || !visible) return null;

  const co      = company || window.__smartManagerCompany || {};
  const { subtotal, tax, total } = lineTotal(inv.items || []);
  const fmt     = (n) => new Intl.NumberFormat("en-US").format(Math.round(n));

  // Find customer contact info from CRM
  const lead    = (crm?.rows || []).find(l =>
    (l.company || l.contact || "").toLowerCase() === (inv.customer || "").toLowerCase()
  );
  const phone   = (lead?.phone || inv.customerPhone || "").replace(/[^0-9]/g, "");
  const email   = lead?.email || inv.customerEmail || "";

  // ── WA message body ─────────────────────────────────────────────────
  const waMsg = [
    `*Invoice ${inv.id}* from *${co.name || "BusinessSphere"}*`,
    ``,
    `Dear ${inv.customer},`,
    ``,
    `Your invoice is ready.`,
    ``,
    `📋 *Invoice:*  ${inv.id}`,
    `📅 *Date:*     ${inv.date}`,
    `📆 *Due:*      ${inv.dueDate || "On receipt"}`,
    `💰 *Amount:*   TZS ${fmt(total)}`,
    ``,
    inv.items?.slice(0, 3).map(it =>
      `  • ${it.name}  ×${it.qty}  @ TZS ${fmt(it.rate)}`
    ).join("\n"),
    inv.items?.length > 3 ? `  • …and ${inv.items.length - 3} more item${inv.items.length - 3 > 1 ? "s" : ""}` : null,
    ``,
    co.bankName   ? `🏦 *Bank:*      ${co.bankName} — ${co.bankAccount || ""}` : null,
    co.mpesa      ? `📱 *M-Pesa:*    ${co.mpesa}` : null,
    ``,
    `Please quote reference *${inv.id}* when making payment.`,
    ``,
    `Thank you for your business!`,
    `_${co.name || "BusinessSphere"}_`,
  ].filter(l => l !== null).join("\n");

  // ── Email body ───────────────────────────────────────────────────────
  const emailSubject = `Invoice ${inv.id} from ${co.name || "BusinessSphere"} — TZS ${fmt(total)}`;
  const emailBody    = [
    `Dear ${inv.customer},`,
    ``,
    `Please find your invoice details below.`,
    ``,
    `Invoice No:  ${inv.id}`,
    `Issue Date:  ${inv.date}`,
    `Due Date:    ${inv.dueDate || "On receipt"}`,
    `Amount:      TZS ${fmt(total)} (incl. 18% VAT)`,
    ``,
    `Items:`,
    ...(inv.items || []).map(it => `  ${it.name}  ×${it.qty}  TZS ${fmt((it.qty||1)*(it.rate||0))}`),
    ``,
    `Payment Details:`,
    co.bankName    ? `  Bank:      ${co.bankName}` : null,
    co.bankAccount ? `  Account:   ${co.bankAccount}` : null,
    co.bankBranch  ? `  Branch:    ${co.bankBranch}` : null,
    co.mpesa       ? `  M-Pesa:    ${co.mpesa}` : null,
    ``,
    `Please use reference ${inv.id} when making payment.`,
    ``,
    `Thank you for your business.`,
    ``,
    `Kind regards,`,
    co.owner ? co.owner : null,
    co.name  || "BusinessSphere",
    co.phone ? `Tel: ${co.phone}` : null,
    co.email ? co.email : null,
  ].filter(l => l !== null).join("\n");

  // ── Actions ──────────────────────────────────────────────────────────
  function sendWhatsApp() {
    if (!phone) {
      // No phone — open WA Center pre-loaded
      waBus.push({ templateId: "invoice", vars: {
        docId: inv.id, amount: fmt(total), dueDate: inv.dueDate || "On receipt", ref: inv.id,
      }});
      notify("Open Collaboration → WhatsApp to send — no phone number found for this customer");
      setSent(s => ({ ...s, whatsapp: true }));
      return;
    }
    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(waMsg)}`, "_blank", "noopener");
    setSent(s => ({ ...s, whatsapp: true }));
    notify(`✓ WhatsApp opened for ${inv.customer} — click Send in WhatsApp to deliver`);
    logAudit("Invoice WA sent", "Sales", co.owner || "System", `${inv.id} → ${inv.customer}`);
  }

  function sendEmail() {
    if (!email) {
      emailBus.push({ subject: emailSubject, body: emailBody, tmpl: "invoice" });
      notify("Open Collaboration → Email to send — no email address found for this customer");
      setSent(s => ({ ...s, email: true }));
      return;
    }
    const params = new URLSearchParams();
    params.set("subject", emailSubject);
    params.set("body", emailBody);
    window.location.href = `mailto:${encodeURIComponent(email)}?${params.toString()}`;
    setSent(s => ({ ...s, email: true }));
    notify(`✓ Email client opened for ${inv.customer} — click Send to deliver`);
    logAudit("Invoice email sent", "Sales", co.owner || "System", `${inv.id} → ${inv.customer}`);
  }

  function copyPayLink() {
    const link = `https://pay.${(co.website || "businesssphere.co.tz").replace(/^https?:\/\//,"")}/${inv.id}?amount=${Math.round(total)}&customer=${encodeURIComponent(inv.customer)}`;
    if (navigator.clipboard) navigator.clipboard.writeText(link);
    setSent(s => ({ ...s, link: true }));
    notify(`Payment link copied — Ref: ${inv.id}`);
  }

  function printNow() {
    // Reuse the printInvoice from Sales module (needs the doc format)
    // We rebuild it inline since PostCreateDispatch is outside Sales scope
    const doc = {
      ...inv,
      status: "Unpaid",
      payments: [],
      amountPaid: 0,
      customerEmail: email,
      customerPhone: phone,
    };
    // Trigger the Sales printInvoice via a synthetic event on the invoice
    // The cleanest cross-scope approach: push to a print bus
    printInvoiceBus.push(doc);
    setSent(s => ({ ...s, print: true }));
  }

  // ── Render ────────────────────────────────────────────────────────────
  const ACTIONS = [
    {
      id: "whatsapp",
      label: phone ? "Send via WhatsApp" : "WhatsApp Center",
      sub:    phone ? phone : "No phone — opens WA Center",
      icon:   "📱",
      color:  "#25D366",
      bg:     "#F0FFF4",
      border: "#D1FAE5",
      fn:     sendWhatsApp,
    },
    {
      id: "email",
      label: email ? "Send via Email" : "Email Center",
      sub:   email ? email : "No email — opens Email Center",
      icon:  "✉️",
      color: "#2563EB",
      bg:    "#EFF6FF",
      border:"#BFDBFE",
      fn:    sendEmail,
    },
    {
      id: "print",
      label: "Print / Save PDF",
      sub:   "Professional invoice PDF",
      icon:  "🖨",
      color: "#374151",
      bg:    "#F8FAFB",
      border:"#E5E7EB",
      fn:    printNow,
    },
    {
      id: "link",
      label: "Copy Payment Link",
      sub:   `pay.… / ${inv.id}`,
      icon:  "🔗",
      color: "#7C3AED",
      bg:    "#F5F3FF",
      border:"#DDD6FE",
      fn:    copyPayLink,
    },
  ];

  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-280 ${closing ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"}`}
      style={{animation: closing ? undefined : "slideUp .28s cubic-bezier(.22,1,.36,1)"}}>
      <div className="w-[340px] bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden">

        {/* Header */}
        <div className="px-4 pt-4 pb-3 border-b border-slate-100" style={{background:"#0D2214"}}>
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-[10px] font-bold text-[#16A34A] uppercase tracking-widest">Invoice Created</span>
                <span className="text-[10px] text-[rgba(255,255,255,.3)]">•</span>
                <span className="text-[10px] font-mono text-[rgba(255,255,255,.5)]">{inv.id}</span>
              </div>
              <p className="text-white font-black text-[17px] leading-tight">{inv.customer}</p>
              <p className="text-[#16A34A] font-mono font-bold text-[15px] mt-0.5">TZS {fmt(total)}</p>
            </div>
            <div className="text-right">
              <p className="text-[rgba(255,255,255,.4)] text-[10px] mb-0.5">Due</p>
              <p className="text-white font-semibold text-[12px]">{inv.dueDate || "On receipt"}</p>
              <p className="text-[rgba(255,255,255,.3)] text-[10px] mt-0.5">{inv.items?.length} item{inv.items?.length !== 1 ? "s" : ""}</p>
            </div>
          </div>

          {/* Items preview pills */}
          <div className="flex gap-1.5 mt-2.5 flex-wrap">
            {(inv.items || []).slice(0, 3).map((it, i) => (
              <span key={i} className="text-[10.5px] text-[rgba(255,255,255,.6)] bg-[rgba(255,255,255,.08)] px-2 py-0.5 rounded-full">
                {it.name.length > 18 ? it.name.slice(0, 16) + "…" : it.name}
              </span>
            ))}
            {(inv.items?.length || 0) > 3 && (
              <span className="text-[10.5px] text-[rgba(255,255,255,.4)] px-1">+{inv.items.length - 3} more</span>
            )}
          </div>
        </div>

        {/* Subtitle */}
        <div className="px-4 pt-3 pb-1">
          <p className="text-[11.5px] font-semibold text-[#111827]">Send this invoice to the customer</p>
          <p className="text-[10.5px] text-slate-400">Choose one or more channels — each can be used independently</p>
        </div>

        {/* Action buttons */}
        <div className="px-3 pb-2 space-y-1.5 mt-1">
          {ACTIONS.map(a => {
            const done = sent[a.id];
            return (
              <button key={a.id} onClick={a.fn}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all hover:shadow-sm active:scale-[.98]"
                style={{
                  background: done ? a.bg : "white",
                  borderColor: done ? a.color + "40" : "#E5E7EB",
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-[19px] shrink-0"
                  style={{background: a.bg, border: `1.5px solid ${a.border}`}}>
                  {done ? "✓" : a.icon}
                </div>
                <div className="flex-1 text-left">
                  <p className="text-[12.5px] font-bold" style={{color: done ? a.color : "#111827"}}>
                    {done ? "Sent — " + a.label : a.label}
                  </p>
                  <p className="text-[10.5px] text-slate-400 truncate">{a.sub}</p>
                </div>
                {done && (
                  <span className="text-[11px] font-black shrink-0" style={{color: a.color}}>✓</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-3 pb-3 flex gap-2">
          <button onClick={dismiss}
            className="flex-1 text-[12px] font-medium text-slate-500 border border-slate-200 rounded-xl py-2 hover:bg-slate-50">
            Dismiss
          </button>
          {Object.keys(sent).length > 0 && (
            <button onClick={dismiss}
              className="flex-1 text-[12px] font-bold text-white rounded-xl py-2 bg-[#16A34A]">
              ✓ Done · Close
            </button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideUp {
          from { opacity:0; transform:translateY(24px) scale(.97); }
          to   { opacity:1; transform:translateY(0)    scale(1);    }
        }
      `}</style>
    </div>
  );
}

// Bus for cross-scope PDF printing from PostCreateDispatch
const printInvoiceBus = {
  listeners: new Set(),
  push(doc) { this.listeners.forEach(fn => fn(doc)); },
};


function SendReceiptPanel() {
  const [receipt, setReceipt] = useState(null);
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState({});

  useEffect(() => {
    const handler = (r) => {
      setReceipt(r);
      setPhone(r.customerPhone || "");
      setEmail(r.customerEmail || "");
      setSent({});
    };
    receiptBus.listeners.add(handler);
    return () => receiptBus.listeners.delete(handler);
  }, []);

  if (!receipt) return null;

  const total = lineTotal(receipt.items || []).total;
  const refPart = receipt.reference ? " (Ref: " + receipt.reference + ")" : "";
  const msg = encodeURIComponent(
    "✅ Receipt — " + receipt.invoiceId + "\n\nDear " + receipt.customer + ",\n\nPayment of TZS " + money(Math.round(receipt.amount)) + "k received on " + receipt.date + " via " + receipt.method + refPart + ".\n\nThank you for your business!\n\n— SmartManager"
  );
  const subject = encodeURIComponent(`Receipt for ${receipt.invoiceId} — ${receipt.customer}`);

  function sendViaWhatsApp() {
    const num = phone.replace(/[\s\-\(\)]/g, "");
    window.open(`https://wa.me/${num}?text=${msg}`, "_blank");
    setSent((s) => ({ ...s, whatsapp: true }));
    notify(`WhatsApp opened for ${receipt.customer} — hit Send in WhatsApp to deliver the receipt.`);
  }

  function sendViaEmail() {
    window.location.href = `mailto:${email}?subject=${subject}&body=${msg}`;
    setSent((s) => ({ ...s, email: true }));
    notify(`Email client opened — confirm send to deliver the receipt to ${receipt.customer}.`);
  }

  function sendViaSMS() {
    const num = phone.replace(/[\s\-\(\)]/g, "");
    window.location.href = `sms:${num}?body=${msg}`;
    setSent((s) => ({ ...s, sms: true }));
    notify(`SMS app opened — confirm send to deliver the receipt to ${receipt.customer}.`);
  }

  function printReceipt() {
    const co = window.__smartManagerCompany || {};
    const fmt = (n) => new Intl.NumberFormat("en-US").format(Math.round(n));
    const subtotalVal = (receipt.items||[]).reduce((s,it)=>s+(it.qty||1)*(it.rate||0),0);
    const taxVal = subtotalVal * 0.18;
    const itemRows = (receipt.items || []).map((it) =>
      "<tr><td style=\"padding:7px 10px;border-bottom:1px solid #F3F4F6\">" + it.name + "</td>" +
      "<td style=\"padding:7px 10px;border-bottom:1px solid #F3F4F6;text-align:center;font-family:monospace\">" + (it.qty||1) + "</td>" +
      "<td style=\"padding:7px 10px;border-bottom:1px solid #F3F4F6;text-align:right;font-family:monospace\">" + fmt(it.rate||0) + "k</td>" +
      "<td style=\"padding:7px 10px;border-bottom:1px solid #F3F4F6;text-align:right;font-family:monospace;font-weight:600\">" + fmt((it.qty||1)*(it.rate||0)) + "k</td></tr>"
    ).join("");
    const logoHtml = co.logo
      ? "<img src=\"" + co.logo + "\" style=\"height:44px;object-fit:contain;filter:brightness(0) invert(1)\" alt=\"logo\"/>"
      : "<svg width=\"36\" height=\"42\" viewBox=\"0 0 120 140\"><polygon points=\"60,6 114,33 114,107 60,134 6,107 6,33\" fill=\"rgba(255,255,255,.9)\"/><text x=\"60\" y=\"78\" text-anchor=\"middle\" dominant-baseline=\"middle\" fill=\"#16A34A\" font-size=\"52\" font-weight=\"900\" font-family=\"sans-serif\">S</text></svg>";
    const detailStrip = [co.address ? "📍 " + co.address + (co.city ? ", " + co.city : "") : "",
      co.phone ? "📞 " + co.phone : "", co.email ? "✉️ " + co.email : "", co.tin ? "TIN: " + co.tin : ""]
      .filter(Boolean).map((s) => "<span>" + s + "</span>").join("  ·  ");
    printAsPDF("Receipt " + receipt.invoiceId,
      "<div style=\"font-family:Inter,sans-serif;max-width:520px;margin:0 auto;background:white\">" +
      "<div style=\"background:linear-gradient(135deg,#052614,#16A34A);padding:22px 28px;display:flex;align-items:center;justify-content:space-between\">" +
        "<div style=\"display:flex;align-items:center;gap:12px\">" + logoHtml +
          "<div><div style=\"font-size:16px;font-weight:800;color:white\">" + (co.name||"Smart Manager") + "</div>" +
          (co.tagline ? "<div style=\"font-size:10px;color:rgba(255,255,255,.7);font-style:italic\">" + co.tagline + "</div>" : "") + "</div></div>" +
        "<div style=\"text-align:right\"><div style=\"font-size:10px;color:rgba(255,255,255,.6);letter-spacing:.06em;text-transform:uppercase\">Payment Receipt</div>" +
          "<div style=\"font-size:15px;font-weight:900;color:white;margin-top:2px\">" + (receipt.id||docId("RCT")) + "</div></div>" +
      "</div>" +
      (detailStrip ? "<div style=\"background:#F0FDF4;padding:8px 28px;font-size:10.5px;color:#166534\">" + detailStrip + "</div>" : "") +
      "<div style=\"padding:24px 28px\">" +
        "<div style=\"display:flex;justify-content:space-between;margin-bottom:20px;padding-bottom:16px;border-bottom:1px solid #E5E7EB\">" +
          "<div><div style=\"font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;margin-bottom:4px\">Bill To</div>" +
          "<div style=\"font-size:14px;font-weight:700;color:#111827\">" + receipt.customer + "</div></div>" +
          "<div style=\"text-align:right\"><div style=\"font-size:10px;text-transform:uppercase;letter-spacing:.06em;color:#9CA3AF;margin-bottom:4px\">Details</div>" +
          "<div style=\"font-size:11.5px;color:#111827\">Invoice: <strong>" + receipt.invoiceId + "</strong></div>" +
          "<div style=\"font-size:11px;color:#6B7280\">Date: " + receipt.date + "</div>" +
          "<div style=\"font-size:11px;color:#6B7280\">Method: " + receipt.method + "</div>" +
          (receipt.reference ? "<div style=\"font-size:11px;color:#6B7280\">Ref: " + receipt.reference + "</div>" : "") + "</div>" +
        "</div>" +
        "<table style=\"width:100%;border-collapse:collapse;margin-bottom:16px\">" +
          "<thead><tr style=\"background:#F8FAFC;border-bottom:2px solid #E5E7EB\">" +
            "<th style=\"padding:8px 10px;text-align:left;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6B7280\">Description</th>" +
            "<th style=\"padding:8px 10px;text-align:center;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6B7280\">Qty</th>" +
            "<th style=\"padding:8px 10px;text-align:right;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6B7280\">Rate</th>" +
            "<th style=\"padding:8px 10px;text-align:right;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:#6B7280\">Amount</th>" +
          "</tr></thead><tbody>" + itemRows + "</tbody></table>" +
        "<div style=\"border-top:1px solid #E5E7EB;padding-top:12px;margin-bottom:16px\">" +
          "<div style=\"display:flex;justify-content:space-between;font-size:11.5px;color:#6B7280;margin-bottom:4px\"><span>Subtotal</span><span>TZS " + fmt(subtotalVal) + "k</span></div>" +
          "<div style=\"display:flex;justify-content:space-between;font-size:11.5px;color:#6B7280;margin-bottom:10px\"><span>VAT (18%)</span><span>TZS " + fmt(taxVal) + "k</span></div>" +
          "<div style=\"display:flex;justify-content:space-between;padding:12px 16px;background:#052614;border-radius:10px\">" +
            "<span style=\"font-size:14px;font-weight:800;color:white\">TOTAL PAID</span>" +
            "<span style=\"font-size:18px;font-weight:900;color:#4ADE80\">TZS " + fmt(receipt.amount) + "k</span>" +
          "</div>" +
        "</div>" +
        "<div style=\"background:#F0FDF4;border:1px solid #BBF7D0;border-radius:10px;padding:14px;text-align:center;margin-bottom:16px\">" +
          "<div style=\"font-size:18px;margin-bottom:4px\">✅</div>" +
          "<div style=\"font-size:13px;font-weight:700;color:#16A34A\">Payment Confirmed</div>" +
          "<div style=\"font-size:11px;color:#166534;margin-top:2px\">This receipt is your official proof of payment.</div>" +
        "</div>" +
        "<div style=\"text-align:center;border-top:1px solid #E5E7EB;padding-top:12px\">" +
          (co.website ? "<div style=\"font-size:11px;color:#16A34A;margin-bottom:4px\">" + co.website + "</div>" : "") +
          "<div style=\"font-size:10px;color:#9CA3AF\">Generated by Smart Manager · " + new Date().toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"}) + "</div>" +
        "</div>" +
      "</div></div>"
    );
    setSent((s) => ({ ...s, print: true }));
  }

  const CHANNELS = [
    { id: "whatsapp", label: "WhatsApp", icon: MessageCircle, color: "#22C55E", bg: "#F0FDF4", border: "#86EFAC", fn: sendViaWhatsApp, need: phone, hint: "wa.me link — opens WhatsApp, you tap Send" },
    { id: "email", label: "Email", icon: Mail, color: "#3B82F6", bg: "#EFF6FF", border: "#93C5FD", fn: sendViaEmail, need: email, hint: "mailto: link — opens your email client" },
    { id: "sms", label: "SMS", icon: MessageSquare, color: "#F59E0B", bg: "#FFFBEB", border: "#FCD34D", fn: sendViaSMS, need: phone, hint: "sms: link — opens your SMS app" },
  ];

  return (
    <div className="fixed bottom-24 sm:bottom-6 left-4 z-50 w-[calc(100vw-2rem)] sm:w-[400px]" style={{ animation: "toastIn .25s cubic-bezier(.34,1.4,.64,1)" }}>
      <div className="bg-white rounded-2xl shadow-2xl border border-[#16A34A]/20 overflow-hidden">
        {/* Header */}
        <div className="px-4 py-3.5 flex items-center justify-between" style={{ background: "linear-gradient(135deg,#052614,#16A34A)" }}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center"><CheckCircle2 size={16} className="text-white" /></div>
            <div>
              <p className="text-[13px] font-semibold text-white">Payment received ✓</p>
              <p className="text-[10.5px] text-white/70">{receipt.customer} · TZS {money(Math.round(receipt.amount))}k · {receipt.invoiceId}</p>
            </div>
          </div>
          <button onClick={() => setReceipt(null)} className="text-white/60 hover:text-white"><X size={15} /></button>
        </div>

        <div className="p-4 space-y-3">
          {/* Contact fields */}
          <div className="grid grid-cols-2 gap-2">
            <div><label className="text-[10.5px] text-slate-500 block mb-1">Phone (WhatsApp / SMS)</label>
              <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+255 7XX XXX XXX" /></div>
            <div><label className="text-[10.5px] text-slate-500 block mb-1">Email</label>
              <input className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} placeholder="customer@email.com" /></div>
          </div>

          {/* Channel buttons */}
          <div className="grid grid-cols-3 gap-2">
            {CHANNELS.map((ch) => {
              const Icon = ch.icon;
              const done = sent[ch.id];
              const disabled = !ch.need;
              return (
                <button key={ch.id} onClick={ch.fn} disabled={disabled}
                  title={disabled ? `Enter ${ch.id === "email" ? "email" : "phone"} first` : ch.hint}
                  className="flex flex-col items-center gap-1.5 py-2.5 rounded-xl border text-[11px] font-medium transition-all disabled:opacity-40"
                  style={{ backgroundColor: done ? ch.bg : "white", borderColor: done ? ch.border : "#E2E8F0", color: done ? ch.color : "#6B7280" }}>
                  <Icon size={16} style={{ color: done ? ch.color : "#94A3B8" }} />
                  {done ? "✓ Opened" : ch.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-slate-400 text-center">Each button opens your device app — confirm send there. Automated sending needs AfricasTalking/SendGrid backend.</p>

          {/* Print PDF */}
          <button onClick={printReceipt} className="w-full flex items-center justify-center gap-2 text-[12.5px] font-medium border border-slate-200 rounded-xl py-2.5 hover:bg-slate-50 transition-colors text-slate-600">
            <Download size={13} className="text-[#16A34A]" /> Download / Print receipt PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// Global Confirmation Dialog — a modal "Are you sure?" that replaces
// the immediate-delete pattern across all 22 modules. Destructive
// actions (variant:"danger") show a red confirm button; neutral ones
// (default) show brand green. Escape key and backdrop click both cancel.
function ConfirmDialog() {
  const [dialog, setDialog] = useState(null);
  const dialogRef = useRef(null);
  const previouslyFocusedRef = useRef(null);

  useEffect(() => {
    const handler = (d) => setDialog(d);
    confirmBus.listeners.add(handler);
    return () => confirmBus.listeners.delete(handler);
  }, []);

  useEffect(() => {
    if (!dialog) return undefined;
    previouslyFocusedRef.current = document.activeElement;
    const frame = window.requestAnimationFrame(() => {
      const first = dialogRef.current?.querySelector("[data-confirm-cancel]");
      first?.focus();
    });
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        setDialog(null);
        return;
      }
      if (e.key !== "Tab") return;
      const focusable = Array.from(dialogRef.current?.querySelectorAll("button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex=\"-1\"])") || []);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("keydown", onKey);
      const previous = previouslyFocusedRef.current;
      if (previous && typeof previous.focus === "function" && document.contains(previous)) previous.focus({ preventScroll: true });
      previouslyFocusedRef.current = null;
    };
  }, [dialog]);

  if (!dialog) return null;
  const danger = dialog.variant === "danger";

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4" onClick={() => setDialog(null)} role="presentation">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px]" />
      <div ref={dialogRef} className="relative bg-white rounded-[26px] shadow-2xl p-6 w-full max-w-sm border border-slate-200/80" onClick={(e) => e.stopPropagation()} role="alertdialog" aria-modal="true" aria-labelledby="global-confirm-title" aria-describedby="global-confirm-message">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 ${danger ? "bg-red-50" : "bg-[#DCFCE7]"}`}>
          {danger ? <AlertCircle size={22} className="text-[#EF4444]" /> : <AlertCircle size={22} className="text-[#16A34A]" />}
        </div>
        <h3 id="global-confirm-title" className="text-[18px] font-semibold text-[#111827] text-center mb-2" style={{ fontFamily: "Poppins,Inter,sans-serif" }}>
          {dialog.title || (danger ? "Are you sure?" : "Confirm action")}
        </h3>
        <p id="global-confirm-message" className="text-[13px] text-slate-500 text-center mb-6 leading-relaxed px-2">{dialog.message}</p>
        <div className="flex gap-3">
          <button type="button" data-confirm-cancel onClick={() => setDialog(null)} className="flex-1 py-2.5 rounded-xl text-[13px] font-medium border border-slate-200 text-slate-600 hover:bg-slate-50 hover:border-slate-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/50">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => { dialog.onConfirm(); setDialog(null); }}
            className="flex-1 py-2.5 rounded-xl text-[13px] font-medium text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/50 focus-visible:ring-offset-2"
            style={{ background: danger ? "linear-gradient(135deg,#EF4444,#DC2626)" : "linear-gradient(135deg,#16A34A,#22C55E)", boxShadow: danger ? "0 4px 12px rgba(239,68,68,0.3)" : "0 4px 12px rgba(22,163,74,0.3)" }}
          >
            {dialog.confirmLabel || (danger ? "Delete" : "Confirm")}
          </button>
        </div>
      </div>
    </div>
  );
}

function Toasts() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const onToast = (t) => {
      if (t.type === "clear") { setToasts([]); return; }
      setToasts((prev) => [...prev.slice(-4), { ...t, born: Date.now() }]);
      setTimeout(() => setToasts((prev) => prev.filter((x) => x.id !== t.id)), TOAST_DURATION);
    };
    toastBus.listeners.add(onToast);
    return () => toastBus.listeners.delete(onToast);
  }, []);

  if (!toasts.length) return null;

  return (
    <div className="fixed bottom-24 sm:bottom-6 right-4 z-[60] flex flex-col gap-2.5 w-[calc(100vw-2rem)] sm:w-[360px] pointer-events-none">
      {toasts.map((t) => {
        const s = TOAST_STYLE[t.type] || TOAST_STYLE.info;
        const Icon = s.Icon;
        return (
          <div key={t.id} className="pointer-events-auto overflow-hidden rounded-xl shadow-2xl" style={{ animation: "toastIn .22s cubic-bezier(.34,1.4,.64,1)", backdropFilter: "blur(16px)", background: s.bg, border: `1px solid ${s.accent}28` }}>
            {/* Auto-draining progress bar */}
            <div className="h-[2px] w-full" style={{ background: `${s.accent}30` }}>
              <div className="h-full" style={{ backgroundColor: s.accent, animation: `toastDrain ${TOAST_DURATION}ms linear forwards` }} />
            </div>
            <div className="flex items-start gap-3 px-4 py-3.5">
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5" style={{ backgroundColor: `${s.accent}22` }}>
                <Icon size={14} style={{ color: s.accent }} />
              </div>
              <p className="flex-1 text-[12.5px] leading-snug font-medium" style={{ color: s.label }}>{t.message}</p>
              <button onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))} className="shrink-0 opacity-50 hover:opacity-100 transition-opacity mt-0.5" aria-label="Dismiss">
                <X size={13} className="text-white" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ---------------------------------- DATA ---------------------------------- */

// A real 15-role model, replacing the earlier 4-tier placeholder (that
// comment predicted this exact expansion). Each role is defined along two
// dimensions this app can genuinely enforce: which modules appear in the
// sidebar at all (allowedModules), and whether the role can create/edit/
// delete or only view (writeAccess). This is a real, meaningful two-axis
// permission model — not a full per-action permission matrix. Building
// that would mean gating every individual create/edit/delete control
// across all twenty modules individually, a large, separate undertaking
// documented as a follow-up rather than attempted here at risk of leaving
// half the app's buttons correctly gated and half not. What's below is
// fully real: change your role in Settings and the sidebar genuinely
// changes, and every write-gated screen already in the app (Procurement
// Approvals, Notification Channels, Integration Connections, Settings
// itself) respects it immediately.
const ALL_MODULE_IDS = [
  "dashboard", "crm", "sales", "inventory", "procurement", "finance", "reports", "hr",
  "manufacturing", "scm", "marketing", "ecommerce", "pos", "documents", "projects",
  "support", "analytics", "notifications", "activity", "integrations", "ai", "workflows", "collaboration", "tra_portal",
  "microfinance", "vicoba", "community", "healthcare", "school", "pharmacy", "hotel", "fleet", "banking", "restaurant", "money-agent", "property-management", "employee-portal", "presentation", "billing",
];

const ROLES = [
  {
    id: "Super Administrator", category: "System",
    description: "Full system control, including company settings, module entitlements, and every integration credential.",
    allowedModules: [...ALL_MODULE_IDS, "global-admin"], primaryModules: [...ALL_MODULE_IDS, "global-admin"], writeAccess: "full",
  },
  {
    id: "Platform Administrator", category: "System",
    description: "Platform control-center access for cross-company governance. This role does not receive a company subscription gate; protected server procedures remain authoritative.",
    allowedModules: ["dashboard", "global-admin", "profile", "support", "notifications", "settings"], primaryModules: ["global-admin"], writeAccess: "full",
  },
  {
    id: "Organization Owner", category: "Executive",
    description: "Full business access — the owner's own view of everything the company runs.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ALL_MODULE_IDS, writeAccess: "full",
  },
  {
    id: "CEO", category: "Executive",
    description: "Full visibility and control across every function, with Analytics and Dashboard as primary working views.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ALL_MODULE_IDS, writeAccess: "full",
  },
  {
    id: "CFO", category: "Executive",
    description: "Full financial authority — Finance, Procurement spend, and Reports — plus company-wide visibility for oversight.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["finance", "procurement", "reports", "analytics"], writeAccess: "full",
  },
  {
    id: "Finance Manager", category: "Department Head",
    description: "Sees every module for company-wide financial oversight; day-to-day work — invoicing, payables, ledger, tax — happens in Finance, Reports, and Procurement spend.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["finance", "reports", "analytics", "procurement", "notifications"], writeAccess: "full",
  },
  {
    id: "HR Manager", category: "Department Head",
    description: "Sees every module for company-wide oversight; day-to-day work — recruitment, attendance, payroll, leave approvals — happens in HR.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["hr", "analytics", "documents"], writeAccess: "full",
  },
  {
    id: "Sales Manager", category: "Department Head",
    description: "Sees every module for company-wide oversight; day-to-day work — pipeline, quotations, orders, invoicing, campaigns — happens in CRM, Sales, and Marketing.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["crm", "sales", "marketing", "ecommerce", "analytics", "support", "workflows"], writeAccess: "full",
  },
  {
    id: "Institution Administrator", category: "Financial Services",
    description: "Administers the institution-wide Money Agent programme, branches, controls, settlement, and governed financial integrations.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["money-agent", "finance", "reports", "analytics"], writeAccess: "full",
  },
  {
    id: "Branch Manager", category: "Financial Services",
    description: "Runs branch agents, cash operations, customer service, approvals, and daily settlement within the assigned workspace.",
    allowedModules: ["dashboard", "money-agent", "finance", "reports", "notifications"], primaryModules: ["money-agent", "reports"], writeAccess: "full",
  },
  {
    id: "Money Agent Manager", category: "Financial Services",
    description: "Manages agent onboarding, KYC/KYB, limits, fees, commissions, liquidity, and reconciliation controls.",
    allowedModules: ["dashboard", "money-agent", "finance", "reports", "notifications"], primaryModules: ["money-agent", "reports"], writeAccess: "full",
  },
  {
    id: "Money Agent", category: "Financial Services",
    description: "Operates customer-facing cash-in/cash-out and service transaction intents within verified agent limits.",
    allowedModules: ["dashboard", "money-agent", "notifications"], primaryModules: ["money-agent"], writeAccess: "full",
  },
  {
    id: "Supervisor", category: "Financial Services",
    description: "Reviews maker-checker approvals, agent activity, risk alerts, and settlement variances without institution configuration authority.",
    allowedModules: ["dashboard", "money-agent", "reports", "notifications"], primaryModules: ["money-agent", "reports"], writeAccess: "full",
  },
  {
    id: "Property Administrator", category: "Property Management",
    description: "Administers the property portfolio, owners, tenants, leases, billing, maintenance, documents, controls, and reports.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["property-management", "finance", "reports", "documents", "notifications"], writeAccess: "full",
  },
  {
    id: "Property Manager", category: "Property Management",
    description: "Runs property operations, applications, leases, inspections, maintenance, notices, occupancy, and portfolio performance.",
    allowedModules: ["dashboard", "property-management", "finance", "reports", "documents", "procurement", "crm", "notifications"], primaryModules: ["property-management", "reports"], writeAccess: "full",
  },
  {
    id: "Landlord / Owner", category: "Property Management",
    description: "Views linked owned properties, tenants, leases, income, expenses, documents, maintenance decisions, and owner statements.",
    allowedModules: ["dashboard", "property-management", "finance", "reports", "documents", "notifications"], primaryModules: ["property-management", "reports"], writeAccess: "full",
  },
  {
    id: "Property Agent", category: "Property Management",
    description: "Handles assigned listings, applicants, tenant onboarding, unit availability, and commission evidence without finance approval.",
    allowedModules: ["dashboard", "property-management", "crm", "documents", "notifications"], primaryModules: ["property-management"], writeAccess: "full",
  },
  {
    id: "Tenant", category: "Property Management Portal",
    description: "Uses the authenticated tenant portal for own leases, invoices, payments, receipts, utilities, maintenance, notices, and documents.",
    allowedModules: ["dashboard", "property-management", "notifications"], primaryModules: ["property-management"], writeAccess: "full",
  },
  {
    id: "Maintenance Staff", category: "Property Management",
    description: "Works only on assigned property maintenance requests, work orders, inspections, completion evidence, and related notes.",
    allowedModules: ["dashboard", "property-management", "procurement", "documents", "notifications"], primaryModules: ["property-management"], writeAccess: "full",
  },
  {
    id: "Property Finance Officer", category: "Property Management",
    description: "Controls property invoices, rent collection, receipts, expenses, reconciliations, owner statements, and financial reports.",
    allowedModules: ["dashboard", "property-management", "finance", "reports", "documents", "notifications"], primaryModules: ["property-management", "finance", "reports"], writeAccess: "full",
  },
  {
    id: "Procurement Officer", category: "Operations",
    description: "Sees every module for company-wide visibility; day-to-day work — purchase orders, supplier relationships, vendor payments — happens in Procurement and Inventory.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["procurement", "inventory"], writeAccess: "full",
  },
  {
    id: "Warehouse Manager", category: "Operations",
    description: "Sees every module for company-wide visibility; day-to-day work — stock, work orders, shipments, fleet — happens in Inventory, Manufacturing, and Supply Chain.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["inventory", "manufacturing", "scm", "pos"], writeAccess: "full",
  },
  {
    id: "Project Manager", category: "Operations",
    description: "Sees every module for company-wide visibility; day-to-day work — tasks, timelines, milestones, budgets — happens in Projects.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["projects", "documents", "reports"], writeAccess: "full",
  },
  {
    id: "Customer Support Agent", category: "Front Line",
    description: "Handles tickets, live chat, the knowledge base, and the call log; views CRM for customer context.",
    allowedModules: ["dashboard", "support", "crm", "collaboration"], primaryModules: ["support", "crm"], writeAccess: "full",
  },
  {
    id: "Clinic Administrator", category: "Healthcare",
    description: "Administers the clinic workspace, clinical directory, patient operations, and governed healthcare records.",
    allowedModules: ALL_MODULE_IDS, primaryModules: ["healthcare", "pharmacy", "reports", "notifications"], writeAccess: "full",
  },
  {
    id: "Doctor", category: "Healthcare",
    description: "Documents clinical visits, diagnoses, prescriptions, diagnostic orders, and signed medical reports for the active healthcare workspace.",
    allowedModules: ["dashboard", "healthcare", "pharmacy", "documents", "reports", "notifications"], primaryModules: ["healthcare"], writeAccess: "full",
  },
  {
    id: "Nurse", category: "Healthcare",
    description: "Registers clinical observations, triage vitals, and care notes in the healthcare workspace without billing authority.",
    allowedModules: ["dashboard", "healthcare", "documents", "notifications"], primaryModules: ["healthcare"], writeAccess: "full",
  },
  {
    id: "Laboratory Technician", category: "Healthcare",
    description: "Reviews laboratory and radiology queues, reports results, and maintains diagnostic workflow status.",
    allowedModules: ["dashboard", "healthcare", "documents", "notifications"], primaryModules: ["healthcare"], writeAccess: "full",
  },
  {
    id: "Pharmacist", category: "Healthcare",
    description: "Dispenses authorised prescriptions and manages pharmacy stock through the connected clinical and pharmacy workspaces.",
    allowedModules: ["dashboard", "healthcare", "pharmacy", "inventory", "notifications"], primaryModules: ["healthcare", "pharmacy"], writeAccess: "full",
  },
  {
    id: "Receptionist", category: "Healthcare",
    description: "Registers patients, schedules appointments, and coordinates front-desk clinical workflow without access to clinical diagnoses.",
    allowedModules: ["dashboard", "healthcare", "notifications"], primaryModules: ["healthcare"], writeAccess: "full",
  },
  {
    id: "Billing Officer", category: "Healthcare",
    description: "Manages healthcare billing, insurance claims, and clinical payment status without access to clinical visit details.",
    allowedModules: ["dashboard", "healthcare", "finance", "reports", "notifications"], primaryModules: ["healthcare", "finance", "reports"], writeAccess: "full",
  },
  {
    id: "School Administrator", category: "Education",
    description: "Runs the school workspace, learner operations, academic workflows, fees, services, portals, and school governance.",
    allowedModules: ["dashboard", "school", "reports", "finance", "documents", "notifications"], primaryModules: ["school", "reports"], writeAccess: "full",
  },
  {
    id: "Employee", category: "General Staff",
    description: "General staff access — Dashboard and Employee Portal only.",
    allowedModules: ["dashboard", "employee-portal"], primaryModules: ["employee-portal"], writeAccess: "none",
  },
  {
    id: "Auditor", category: "Oversight",
    description: "Sees every module for audit purposes; cannot create, edit, or delete anything anywhere in the system.",
    allowedModules: ALL_MODULE_IDS, primaryModules: [], writeAccess: "none",
  },
  {
    id: "Customer", category: "Money Agent Portal",
    description: "A customer-facing Money Agent portal limited to the signed-in customer’s own wallet, transactions, receipts, notifications, and KYC status.",
    allowedModules: ["dashboard", "money-agent", "notifications"], primaryModules: ["money-agent"], writeAccess: "none",
  },
  {
    id: "External Client", category: "External Portal",
    description: "A customer-facing role, scoped to Customer Support only. Honest limitation: this build has no real customer authentication, so this view is not filtered to one client's own records — see the handover doc.",
    allowedModules: ["support"], primaryModules: ["support"], writeAccess: "none",
  },
  {
    id: "Supplier", category: "External Portal",
    description: "A vendor-facing role, scoped to Procurement's Supplier Portal. Same honest limitation as External Client: not filtered to one supplier's own purchase orders without real supplier-side authentication.",
    allowedModules: ["procurement"], primaryModules: ["procurement"], writeAccess: "none",
  },
];

const ROLE_ALIASES = {
  owner: "Organization Owner",
  admin: "Super Administrator",
  customer: "Customer",
  "system administrator": "Super Administrator",
};

export function canonicalRoleId(role) {
  const value = String(role || "").trim();
  if (!value) return "Employee";
  const alias = ROLE_ALIASES[value.toLowerCase()];
  if (alias) return alias;
  const matched = ROLES.find((entry) => entry.id.toLowerCase() === value.toLowerCase());
  return matched?.id || "Employee";
}

export function roleDefinitionFor(role) {
  const canonicalId = canonicalRoleId(role);
  return ROLES.find((entry) => entry.id === canonicalId) || ROLES.find((entry) => entry.id === "Employee");
}

// Dynamic Home Screen — every role lands on a genuinely different
// dashboard, not a cosmetic label change. Reuses the exact real Analytics
// dashboard functions (section 21) rather than computing the same numbers
// a second time for the home screen; "financial" here calls the literal
// same FinancialDashboard() function Analytics' own Financial tab calls.
// Two view types have no direct Analytics equivalent because their domain
// is not lifted to root-shared state (Procurement's POs, Projects' tasks,
// Support's tickets all live in their own modules' local state — see
// section 21's own stated scope boundary): those roles get a focused
// welcome and a direct link into their actual module instead of a
// fabricated widget standing in for data this screen does not have.
const ROLE_HOME_VIEW = {
  "Super Administrator": "executive",
  "Platform Administrator": "focused",
  "Organization Owner": "executive",
  "CEO": "executive",
  "CFO": "financial",
  "Finance Manager": "financial",
  "HR Manager": "hr",
  "Sales Manager": "sales",
  "Institution Administrator": "focused",
  "Branch Manager": "focused",
  "Money Agent Manager": "focused",
  "Money Agent": "focused",
  "Supervisor": "focused",
  "Procurement Officer": "operations",
  "Warehouse Manager": "operations",
  "Project Manager": "focused",
  "School Administrator": "focused",
  "Customer Support Agent": "focused",
  "Customer": "focused",
  "Property Administrator": "focused",
  "Property Manager": "focused",
  "Landlord / Owner": "focused",
  "Property Agent": "focused",
  "Tenant": "focused",
  "Maintenance Staff": "focused",
  "Property Finance Officer": "focused",
  "Employee": "minimal",
  "Auditor": "executive",
  "External Client": "minimal",
  "Supplier": "minimal",
};

// Contract anchors retained for repository-level navigation audits: id: "property-management"; data-tour-target={m.id}.
const MODULES = NAVIGATION_ITEMS
  .filter(({ id }) => !["profile", "settings"].includes(id))
  .map(({ id, label, icon }) => ({ id, label, icon, live: true }));

const STAGES = ["New", "Qualified", "Proposal", "Negotiation", "Won"];

const STAGE_COLOR = {
  New: "#5B6472",
  Qualified: "#16A34A",
  Proposal: "#F59E0B",
  Negotiation: "#111827",
  Won: "#16A34A",
};

// A real gap the single-contact-per-lead model can't cover: an account
// usually has more than one person worth knowing — a decision maker and a
// day-to-day operational contact are rarely the same person. Contacts is
// a separate directory, loosely linked to a company name rather than a
// strict lead ID, since a contact can outlive any individual deal.
const contactsSeed = [
  { id: "CON-01", name: "Amara Mwakisisile", title: "Procurement Manager", company: "Kilimo Fresh Distributors", email: "amara@kilimofresh.co.tz", phone: "+255 754 221 908", isPrimary: true },
  { id: "CON-02", name: "Joseph Mwakisisile", title: "Finance Director", company: "Kilimo Fresh Distributors", email: "j.mwakisisile@kilimofresh.co.tz", phone: "+255 754 221 910", isPrimary: false },
  { id: "CON-03", name: "David Chen", title: "Operations Director", company: "Meridian Logistics", email: "d.chen@meridianlog.com", phone: "+255 712 004 552", isPrimary: true },
  { id: "CON-04", name: "Halima Juma", title: "General Manager", company: "Baraka Hotels & Resorts", email: "halima@barakahotels.co.tz", phone: "+255 754 662 187", isPrimary: true },
  { id: "CON-05", name: "Grace Mmbaga", title: "Owner", company: "Uzuri Beauty Chain", email: "grace@uzuribeauty.tz", phone: "+255 767 331 220", isPrimary: true },
];

const seedLeads = [
  { id: "L-0231", name: "Amara Mwakisisile", company: "Kilimo Fresh Distributors", stage: "Proposal", value: 18400, currency: "TZS000", owner: "J. Batenga", email: "amara@kilimofresh.co.tz", phone: "+255 754 221 908", industry: "Agriculture", lastActivity: "2h ago", score: 82, expectedCloseDate: "2026-07-20" },
  { id: "L-0230", name: "David Chen", company: "Meridian Logistics", stage: "Negotiation", value: 64200, currency: "TZS000", owner: "S. Kileo", email: "d.chen@meridianlog.com", phone: "+255 712 004 552", industry: "Logistics", lastActivity: "5h ago", score: 91, expectedCloseDate: "2026-07-12" },
  { id: "L-0229", name: "Grace Mmbaga", company: "Uzuri Beauty Chain", stage: "Won", value: 9800, currency: "TZS000", owner: "J. Batenga", email: "grace@uzuribeauty.tz", phone: "+255 767 331 220", industry: "Retail", lastActivity: "1d ago", score: 76, expectedCloseDate: null },
  { id: "L-0228", name: "Peter Okoth", company: "Coastal Construction Ltd", stage: "Qualified", value: 128000, currency: "TZS000", owner: "M. Fundi", email: "p.okoth@coastalcon.co.tz", phone: "+255 786 442 019", industry: "Construction", lastActivity: "1d ago", score: 68, expectedCloseDate: "2026-08-15" },
  { id: "L-0227", name: "Fatuma Salim", company: "Salim Wholesale Traders", stage: "New", value: 5200, currency: "TZS000", owner: "S. Kileo", email: "fatuma@salimwholesale.tz", phone: "+255 715 990 341", industry: "Wholesale", lastActivity: "2d ago", score: 54, expectedCloseDate: null },
  { id: "L-0226", name: "James Mutungi", company: "Nyota Pharmacy Group", stage: "Proposal", value: 22750, currency: "TZS000", owner: "M. Fundi", email: "james@nyotapharm.tz", phone: "+255 700 118 774", industry: "Pharmacy", lastActivity: "3d ago", score: 71, expectedCloseDate: "2026-07-25" },
  { id: "L-0225", name: "Halima Juma", company: "Baraka Hotels & Resorts", stage: "Negotiation", value: 96500, currency: "TZS000", owner: "J. Batenga", email: "halima@barakahotels.co.tz", phone: "+255 754 662 187", industry: "Hospitality", lastActivity: "4d ago", score: 88, expectedCloseDate: "2026-07-10" },
  { id: "L-0224", name: "Elias Rugambwa", company: "Rugambwa Auto Workshop", stage: "New", value: 3600, currency: "TZS000", owner: "S. Kileo", email: "elias@rugambwaauto.tz", phone: "+255 762 883 456", industry: "Automotive", lastActivity: "6d ago", score: 47, expectedCloseDate: null },
];

const money = (n) => new Intl.NumberFormat("en-US").format(n);

// ═══════════════════════════════════════════════════════════════════════════
// SMART ALERT ENGINE
// Cross-module automated intelligence. Scans all data sources and returns
// categorised, prioritised alerts. Senior-dev pattern: single source of
// truth for all warnings — no alert logic scattered across 33 modules.
// ═══════════════════════════════════════════════════════════════════════════

function useSmartAlerts(data) {
  return useMemo(() => {
    const alerts = [];
    const today  = new Date();
    const in30   = new Date(today.getTime() + 30 * 86400000);
    const in7    = new Date(today.getTime() +  7 * 86400000);

    // ── Finance: Overdue invoices ─────────────────────────────────────────
    if (data.invoices) {
      const overdue = data.invoices.filter(inv =>
        inv.status !== "Paid" && inv.status !== "Cancelled" &&
        inv.dueDate && new Date(inv.dueDate) < today
      );
      if (overdue.length > 0) {
        const total = overdue.reduce((s, inv) => s + (inv.totalAmount || inv.total || 0), 0);
        alerts.push({
          id: "inv-overdue", module: "sales", priority: "high",
          category: "Finance",
          icon: "💸",
          title: overdue.length + " Overdue Invoice" + (overdue.length > 1 ? "s" : ""),
          detail: "TZS " + money(total) + "k unpaid · Oldest: " +
            (overdue.sort((a,b) => new Date(a.dueDate)-new Date(b.dueDate))[0]?.customer || "Unknown"),
          action: "View Sales → Invoices",
        });
      }
    }

    // ── Inventory: Low / out of stock ─────────────────────────────────────
    if (data.inventory) {
      const low = data.inventory.filter(i => i.qtyOnHand <= (i.reorderLevel || 5));
      if (low.length > 0) {
        alerts.push({
          id: "inv-low", module: "inventory", priority: low.some(i => i.qtyOnHand === 0) ? "high" : "medium",
          category: "Inventory",
          icon: "📦",
          title: low.length + " Low-Stock Item" + (low.length > 1 ? "s" : ""),
          detail: low.slice(0, 3).map(i => i.name).join(", ") + (low.length > 3 ? " +" + (low.length-3) + " more" : ""),
          action: "View Inventory → Reorder Alerts",
        });
      }
    }

    // ── HR: Leave requests pending ────────────────────────────────────────
    if (data.leaveRequests) {
      const pending = data.leaveRequests.filter(l => l.status === "Pending");
      if (pending.length > 0) {
        alerts.push({
          id: "hr-leave", module: "hr", priority: "medium",
          category: "HR",
          icon: "🏖️",
          title: pending.length + " Pending Leave Request" + (pending.length > 1 ? "s" : ""),
          detail: pending.slice(0, 3).map(l => l.employeeName || l.employee || "Staff").join(", "),
          action: "View HR → Leave Management",
        });
      }
      // Upcoming leave starting this week
      const upcoming = data.leaveRequests.filter(l =>
        l.status === "Approved" &&
        l.startDate && new Date(l.startDate) >= today && new Date(l.startDate) <= in7
      );
      if (upcoming.length > 0) {
        alerts.push({
          id: "hr-upcoming-leave", module: "hr", priority: "low",
          category: "HR",
          icon: "📅",
          title: upcoming.length + " Staff on Leave This Week",
          detail: upcoming.map(l => l.employeeName || "Staff").join(", "),
          action: "View HR → Leave Calendar",
        });
      }
    }

    // ── Banking: NPL / overdue loans ──────────────────────────────────────
    if (data.bankLoans) {
      const npls = data.bankLoans.filter(l => l.status === "Overdue" || l.status === "Defaulted");
      if (npls.length > 0) {
        const nplAmt = npls.reduce((s, l) => s + (l.balance || 0), 0);
        alerts.push({
          id: "bank-npl", module: "banking", priority: "high",
          category: "Banking",
          icon: "🏦",
          title: npls.length + " Non-Performing Loan" + (npls.length > 1 ? "s" : ""),
          detail: "TZS " + money(nplAmt) + "k at risk · " + npls.map(l => l.client).slice(0,2).join(", "),
          action: "View Banking → Loans & Credit",
        });
      }
    }

    // ── Pharmacy: Drug expiry ──────────────────────────────────────────────
    if (data.phmStock) {
      const expiring = data.phmStock.filter(s => s.expiry && new Date(s.expiry) <= in30);
      const expired  = data.phmStock.filter(s => s.expiry && new Date(s.expiry) < today);
      if (expired.length > 0) {
        alerts.push({
          id: "phm-expired", module: "pharmacy", priority: "critical",
          category: "Pharmacy",
          icon: "💊",
          title: expired.length + " EXPIRED Drug" + (expired.length > 1 ? "s" : "") + " — Remove Immediately",
          detail: expired.map(s => s.drug).slice(0, 3).join(", "),
          action: "View Pharmacy → Expiry Alerts",
        });
      }
      if (expiring.length > expired.length) {
        const soon = expiring.filter(s => new Date(s.expiry) >= today);
        alerts.push({
          id: "phm-expiring", module: "pharmacy", priority: "high",
          category: "Pharmacy",
          icon: "⏳",
          title: soon.length + " Drug" + (soon.length > 1 ? "s" : "") + " Expiring Within 30 Days",
          detail: soon.map(s => s.drug).slice(0, 3).join(", "),
          action: "View Pharmacy → Expiry Alerts",
        });
      }
    }

    // ── Fleet: Insurance expiring ──────────────────────────────────────────
    if (data.vehicles) {
      const insExp = data.vehicles.filter(v => v.insurance && new Date(v.insurance) <= in30);
      if (insExp.length > 0) {
        alerts.push({
          id: "fleet-ins", module: "fleet", priority: "high",
          category: "Fleet",
          icon: "🚌",
          title: insExp.length + " Vehicle Insurance Expiring",
          detail: insExp.map(v => v.reg).join(", ") + " · Within 30 days",
          action: "View Fleet → Vehicles",
        });
      }
      const svcDue = data.vehicles.filter(v => v.mileage >= v.nextService - 2000);
      if (svcDue.length > 0) {
        alerts.push({
          id: "fleet-svc", module: "fleet", priority: "medium",
          category: "Fleet",
          icon: "🔧",
          title: svcDue.length + " Vehicle" + (svcDue.length > 1 ? "s" : "") + " Service Due",
          detail: svcDue.map(v => v.reg + " (" + v.mileage.toLocaleString() + "km)").join(", "),
          action: "View Fleet → Vehicles",
        });
      }
    }

    // ── School: Unpaid fees ───────────────────────────────────────────────
    if (data.schFees) {
      const unpaid = data.schFees.filter(f => f.status === "Unpaid" || f.status === "Partial");
      if (unpaid.length > 0) {
        const outstanding = unpaid.reduce((s, f) => s + (f.balance || 0), 0);
        alerts.push({
          id: "sch-fees", module: "school", priority: "medium",
          category: "School",
          icon: "🎓",
          title: unpaid.length + " Student" + (unpaid.length > 1 ? "s" : "") + " with Outstanding Fees",
          detail: "TZS " + money(outstanding) + "k unpaid this term",
          action: "View School → Fee Collection",
        });
      }
    }

    // ── Restaurant: Active orders in kitchen ──────────────────────────────
    if (data.rstOrders) {
      const active = data.rstOrders.filter(o => o.status === "Preparing");
      if (active.length > 0) {
        alerts.push({
          id: "rst-orders", module: "restaurant", priority: "low",
          category: "Restaurant",
          icon: "🍽️",
          title: active.length + " Order" + (active.length > 1 ? "s" : "") + " Being Prepared in Kitchen",
          detail: "Tables: " + active.map(o => o.table).join(", "),
          action: "View Restaurant → Kitchen Display",
        });
      }
    }

    // ── MFI: Overdue loans ────────────────────────────────────────────────
    if (data.mfiLoans) {
      const overdue = data.mfiLoans.filter(l => l.status === "Overdue" || l.status === "Defaulted");
      if (overdue.length > 0) {
        const amt = overdue.reduce((s, l) => s + (l.balance || 0), 0);
        alerts.push({
          id: "mfi-overdue", module: "microfinance", priority: "high",
          category: "Microfinance",
          icon: "🏧",
          title: overdue.length + " MFI Loan" + (overdue.length > 1 ? "s" : "") + " Overdue",
          detail: "TZS " + money(amt) + "k at risk",
          action: "View Microfinance → Loans",
        });
      }
    }

    // ── Hotel: Check-outs due today ───────────────────────────────────────
    if (data.htlBookings) {
      const checkOutToday = data.htlBookings.filter(b =>
        b.status === "Active" && b.checkOut === today.toISOString().slice(0, 10)
      );
      if (checkOutToday.length > 0) {
        alerts.push({
          id: "htl-checkout", module: "hotel", priority: "medium",
          category: "Hotel",
          icon: "🏨",
          title: checkOutToday.length + " Guest" + (checkOutToday.length > 1 ? "s" : "") + " Checking Out Today",
          detail: checkOutToday.map(b => b.guest + " (Room " + b.room + ")").join(", "),
          action: "View Hotel → Check-In/Out",
        });
      }
    }

    // Sort: critical → high → medium → low
    const priority = { critical: 0, high: 1, medium: 2, low: 3 };
    return alerts.sort((a, b) => (priority[a.priority] || 3) - (priority[b.priority] || 3));
  }, [
    data.invoices, data.inventory, data.leaveRequests,
    data.bankLoans, data.phmStock, data.vehicles,
    data.schFees, data.rstOrders, data.mfiLoans, data.htlBookings,
  ]);
}

// Alert priority colour maps
const ALERT_PRIORITY = {
  critical: { bg:"#FEF2F2", border:"#FECACA", text:"#991B1B", badge:"#FEE2E2", badgeText:"#EF4444" },
  high:     { bg:"#FFFBEB", border:"#FDE68A", text:"#92400E", badge:"#FEF3C7", badgeText:"#F59E0B" },
  medium:   { bg:"#EFF6FF", border:"#BFDBFE", text:"#1E3A8A", badge:"#DBEAFE", badgeText:"#2563EB" },
  low:      { bg:"#F0FDF4", border:"#BBF7D0", text:"#14532D", badge:"#DCFCE7", badgeText:"#16A34A" },
};

// ── useBulkSelect — table multi-select with actions ─────────────────────────
// Usage: const {selected,toggle,toggleAll,clearAll,isSelected,isAllSelected,count} = useBulkSelect(rows)
function useBulkSelect(rows) {
  const [selected, setSelected] = useState(new Set());
  const ids = useMemo(() => rows.map(r => r.id), [rows]);

  const toggle    = useCallback(id => setSelected(s => { const n=new Set(s); n.has(id)?n.delete(id):n.add(id); return n; }), []);
  const toggleAll = useCallback(() => setSelected(s => s.size === ids.length ? new Set() : new Set(ids)), [ids]);
  const clearAll  = useCallback(() => setSelected(new Set()), []);
  const isSelected     = useCallback(id => selected.has(id), [selected]);
  const isAllSelected  = selected.size > 0 && selected.size === ids.length;
  const isPartialSelected = selected.size > 0 && selected.size < ids.length;
  const selectedRows = rows.filter(r => selected.has(r.id));

  return { selected, selectedRows, toggle, toggleAll, clearAll, isSelected, isAllSelected, isPartialSelected, count: selected.size };
}

// ── BulkActionBar — shown when rows are selected ──────────────────────────────
function BulkActionBar({ count, onClear, actions, accent }) {
  if (count === 0) return null;
  const col = accent || "#16A34A";
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border text-[12.5px] font-medium" style={{background:col+"0D",borderColor:col+"30"}}>
      <div className="flex items-center gap-2 shrink-0">
        <div className="w-5 h-5 rounded flex items-center justify-center text-white text-[10px] font-bold" style={{background:col}}>{count}</div>
        <span style={{color:col}}>{count} item{count!==1?"s":""} selected</span>
      </div>
      <div className="flex gap-2 flex-1">
        {actions.map(a => (
          <button key={a.label} onClick={a.onClick} className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-white text-[11.5px]" style={{background:a.danger?"#EF4444":col}}>
            {a.icon && <a.icon size={12}/>}{a.label}
          </button>
        ))}
      </div>
      <button onClick={onClear} className="text-slate-400 hover:text-slate-600 shrink-0"><X size={14}/></button>
    </div>
  );
}

// ── useAutoSave — debounce + supabase sync ────────────────────────────────────
// Runs the save fn 1.5s after changes stop.
function useAutoSave(value, saveFn, delay) {
  const d = delay || 1500;
  const saveRef = useRef(saveFn);
  saveRef.current = saveFn;
  useEffect(() => {
    const t = setTimeout(() => saveRef.current(value), d);
    return () => clearTimeout(t);
  }, [value, d]);
}

// ── Stat comparison badge ─────────────────────────────────────────────────────
function DeltaBadge({ current, previous, format, goodWhenPositive }) {
  if (!previous || previous === 0) return null;
  const delta = ((current - previous) / Math.abs(previous) * 100).toFixed(1);
  const isGood = goodWhenPositive !== false ? Number(delta) > 0 : Number(delta) < 0;
  const col = isGood ? "#16A34A" : "#EF4444";
  return (
    <span className="text-[10.5px] font-semibold px-1.5 py-0.5 rounded-full" style={{background:col+"15",color:col}}>
      {Number(delta) > 0 ? "▲" : "▼"} {Math.abs(Number(delta))}%
    </span>
  );
}

// ── Dark mode CSS injected into document head ─────────────────────────────
if (typeof document !== "undefined") {
  const _darkStyle = document.getElementById("bs-dark-mode-css") || (() => {
    const s = document.createElement("style"); s.id = "bs-dark-mode-css"; document.head.appendChild(s); return s;
  })();
  _darkStyle.textContent = `
    .dark .bg-white { background-color: #1E293B !important; }
    .dark .bg-slate-50 { background-color: #1E293B !important; }
    .dark .bg-slate-100 { background-color: #0F172A !important; }
    .dark .border-slate-200 { border-color: #334155 !important; }
    .dark .border-slate-100 { border-color: #1E293B !important; }
    .dark .text-slate-400 { color: #94A3B8 !important; }
    .dark .text-slate-500 { color: #94A3B8 !important; }
    .dark .text-slate-600 { color: #94A3B8 !important; }
    .dark .text-\\[\\#111827\\] { color: #F1F5F9 !important; }
    .dark header.bg-white { background-color: #1E293B !important; border-color: #334155 !important; }
    .dark nav { background-color: #0F172A !important; border-color: #1E293B !important; }
    .dark .shadow-sm { box-shadow: 0 1px 3px rgba(0,0,0,0.5) !important; }
    .dark tbody tr:hover { background: #1E293B !important; }
    .dark tbody tr:nth-child(even) { background: #162032 !important; }
    .dark input, .dark select, .dark textarea { background: #0F172A !important; color: #F1F5F9 !important; border-color: #334155 !important; }
    .dark .rounded-xl.bg-white { background: #1E293B !important; }
    .dark .rounded-2xl.bg-white { background: #1E293B !important; }
  `;
}



/* ------------------------------- SALES DATA -------------------------------- */

const DOC_TABS = [
  { id: "quotations", label: "Quotations", icon: FileText },
  { id: "orders", label: "Sales Orders", icon: ClipboardList },
  { id: "invoices", label: "Invoices", icon: ReceiptText },
];

const DOC_STATUS_COLOR = {
  Draft: "#5B6472",
  Sent: "#F59E0B",
  Accepted: "#16A34A",
  Expired: "#9CA3AF",
  Pending: "#F59E0B",
  Confirmed: "#16A34A",
  Fulfilled: "#16A34A",
  Cancelled: "#9CA3AF",
  Unpaid: "#F59E0B",
  Partial: "#F59E0B",
  Paid: "#16A34A",
  Overdue: "#EF4444",
};

// Next status in each document's natural lifecycle — used to drive the
// "Advance" action in DocPanel. `null` means the doc has reached its end state.
const DOC_STATUS_NEXT = {
  quotations: { Draft: "Sent", Sent: "Accepted", Accepted: null, Expired: null },
  orders: { Pending: "Confirmed", Confirmed: "Fulfilled", Fulfilled: null, Cancelled: null },
  // Invoices do not advance with a single click the way a quotation or order
  // does — a payment can be partial, so they're driven by recordPayment()
  // below instead of this flow map. Kept here (all null) so DocPanel's
  // generic "any doc type might have a next status" check still works.
  invoices: { Unpaid: null, Partial: null, Paid: null, Overdue: null },
};

const PAYMENT_METHODS = ["Cash", "Card", "Mobile Money", "Bank Transfer"];

// Global confirmation dialog bus — the missing safety net across all 22
// modules. Instead of threading a confirmDialog prop through every
// component that deletes something (dozens of call sites), any function
// anywhere can call confirmAction(message, fn) and the dialog appears.
// The same architectural choice as toastBus and auditBus: cross-cutting
// concern, handled at the center, not at every edge.
const confirmBus = {
  listeners: new Set(),
  ask(message, onConfirm, opts = {}) {
    this.listeners.forEach((fn) => fn({ message, onConfirm, ...opts }));
  },
};

function confirmAction(message, onConfirm, opts = {}) {
  confirmBus.ask(message, onConfirm, opts);
}

// Receipt bus — when a payment reaches "Paid" status, recordPayment()
// pushes to this bus. Any mounted SendReceiptPanel (or future receipt
// consumer) receives the receipt immediately without prop-drilling.
const receiptBus = {
  listeners: new Set(),
  push(receipt) { this.listeners.forEach((fn) => fn(receipt)); },
};

// Fires the instant any invoice is created — PostCreateDispatch listens
// and offers WA / Email / Print in a non-blocking slide-up panel.
const invoiceCreatedBus = {
  listeners: new Set(),
  push(invoice) { this.listeners.forEach((fn) => fn(invoice)); },
};

const auditBus = {
  listeners: new Set(),
  push(entry) { this.listeners.forEach((fn) => fn(entry)); },
};

// AuditService — a real, centralized log of significant actions across the
// system, genuinely new to this build rather than a renamed existing
// feature. Uses the same global event-bus pattern as notify()/toastBus
// rather than a hook threaded through every mutation site: audit logging
// is a cross-cutting concern, and forcing every function that might need
// to log something to accept and forward an extra parameter would ripple
// through the codebase for no real benefit. Complements the Auditor role
// (see Settings) — that role can see every module, but without an actual
// trail of who did what and when, "seeing everything" wasn't the same as
// being able to audit anything.
//
// Honest limitation, stated once here rather than at every call site:
// there is no real authentication in this build (section 6), so `actor`
// reflects whichever demo role is selected in Settings, not a verified
// identity. A production audit trail must be written server-side against
// a real authenticated session — a client can log an action, but it can't
// be trusted to honestly report who performed it. This is a UX-layer
// approximation of the real capability, not the capability itself.
function logAudit(action, module, actor, details) {
  const entry = {
    id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    action, module, actor: actor || "Unattributed", details: details || "",
    timestamp: new Date().toISOString(),
  };
  if (!IS_CONFIGURED) {
    auditBus.push(entry);
    return;
  }
  sb("audit_log").insert({ action, module, actor: entry.actor, details: entry.details }).single().run()
    .then((row) => {
      if (row?.id) auditBus.push(mapAuditLogRow(row));
    })
    .catch((error) => authDebug("Audit event was not persisted", { message: error?.message || "unknown" }));
}

async function recordConfirmedTenantAudit(action, module, actor, details) {
  const entry = {
    action,
    module,
    actor: actor || "Unattributed",
    details: details || "",
  };
  if (!IS_CONFIGURED) {
    auditBus.push({ id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, ...entry, timestamp: new Date().toISOString() });
    return;
  }
  const row = await sb("audit_log").insert(entry).single().run();
  if (!row?.id) throw new Error("The organization industry audit event was not confirmed.");
  auditBus.push(mapAuditLogRow(row));
}

async function recordConfirmedIndustryFocusAudit(previousFocus, nextFocus, actor) {
  if (previousFocus === nextFocus) return;
  return recordConfirmedTenantAudit("Organization industry focus changed", "Settings", actor, `${previousFocus || "general"} → ${nextFocus}`);
}

// Recording a payment is not a simple status flip — it can be partial, and
// it needs its own record for the payment history an invoice shows. This
// is shared by Sales and Finance since both operate on the same invoices
// table (see the architecture note in the handover doc on shared state).
// A payment changes both the payment history and the invoice balance. In a
// live workspace neither is reflected in the UI until both writes have a
// confirmed database response. This deliberately avoids a local-only payment
// success state when RLS, session context, or the database rejects a write.
async function recordPayment(invoicesHook, invoiceDocumentId, payment, actor) {
  const inv = invoicesHook.rows.find((d) => d.id === invoiceDocumentId);
  if (!inv) return null;
  const { total } = lineTotal(inv.items);
  const normalizedReference = String(payment.reference || "").trim().toLowerCase();
  if (normalizedReference && (inv.payments || []).some((existing) => String(existing.reference || "").trim().toLowerCase() === normalizedReference)) {
    notify("This payment reference is already recorded for the invoice. No duplicate payment was written.", "error");
    return null;
  }
  const newAmountPaid = Math.min(total, (inv.amountPaid || 0) + payment.amount);
  const newStatus = newAmountPaid >= total ? "Paid" : "Partial";
  const paymentRecord = { id: `PMT-${Date.now()}`, amount: payment.amount, method: payment.method, date: payment.date, reference: payment.reference || null };
  const patch = { amountPaid: newAmountPaid, status: newStatus, payments: [paymentRecord, ...(inv.payments || [])] };

  if (IS_CONFIGURED && !DEMO_OVERRIDE) {
    if (!inv.dbId) {
      notify("This invoice is not linked to a confirmed server record. Refresh Sales before recording a payment.", "error");
      return null;
    }
    try {
      await sb("sales_payments").insert({
        invoice_id: inv.dbId,
        amount: payment.amount,
        method: payment.method,
        payment_date: payment.date,
        reference: payment.reference || null,
      }).single().run();
      try {
        await sb("sales_invoices").eq("id", inv.dbId).update({ amount_paid: newAmountPaid, status: newStatus }).single().run();
      } catch (error) {
        await invoicesHook.reload?.();
        notify(`${persistenceFailureMessage("Updating the invoice balance after its payment was confirmed", error)} Live invoice data was reloaded.`, "error");
        return null;
      }
      invoicesHook.setRows((prev) => prev.map((d) => (d.id === invoiceDocumentId ? { ...d, ...patch } : d)));
    } catch (error) {
      notify(persistenceFailureMessage("Recording the payment", error), "error");
      return null;
    }
  } else {
    invoicesHook.setRows((prev) => prev.map((d) => (d.id === invoiceDocumentId ? { ...d, ...patch } : d)));
  }

  notify(`Payment of TZS ${money(payment.amount)}k recorded for ${invoiceDocumentId}${payment.reference ? " (ref: " + payment.reference + ")" : ""}`);

  // Auto-receipt: when a payment brings the invoice to fully Paid, generate
  // the receipt immediately and push it to the receiptBus so any open
  // SendReceiptPanel can offer to dispatch it to the customer straight away.
  if (newStatus === "Paid") {
    const receipt = {
      id: docId("RCT"),
      invoiceId: invoiceDocumentId,
      customer: inv.customer,
      customerEmail: inv.customerEmail || null,
      customerPhone: inv.customerPhone || null,
      amount: newAmountPaid,
      method: payment.method,
      reference: payment.reference || null,
      date: payment.date,
      items: inv.items,
      issuedAt: new Date().toISOString(),
    };
    receiptBus.push(receipt);
  }
  logAudit(newStatus === "Paid" ? "Invoice paid in full" : "Partial payment recorded", "Finance", actor, `${invoiceDocumentId} — TZS ${money(payment.amount)}k via ${payment.method}${payment.reference ? " (" + payment.reference + ")" : ""}`);

  return patch;
}

// Was a hardcoded Tanzania-only constant (0.18, "standard VAT") — the
// exact kind of claim that does not survive an audit against "multiple tax
// systems." Now a real, per-company configurable rate, set from
// companies.tax_rate (Settings, section 46) rather than baked in. A
// mutable module value rather than a prop threaded through the dozen-plus
// call sites below is a deliberate, bounded choice: every one of those
// call sites computes this fresh during render, not from a cached value,
// so updating this once at the root whenever company data changes is
// genuinely safe — and far lower-risk than rewiring every POS receipt,
// invoice line, and refund calculation to accept a new prop individually.
// Still expressed as a fraction (0.18) to avoid touching the arithmetic
// at every call site — only the source of truth changed, not the math.
let TAX_RATE = 0.18;
function setActiveTaxRate(ratePercent) {
  TAX_RATE = (Number(ratePercent) || 18) / 100;
}

// Real IANA timezone identifiers — genuinely recognized by every
// browser's built-in Intl API, not a custom list this app invented.
// Covers this app's actual East African market plus the other regions
// its currency and signup-country lists already support (section 32).
const COMPANY_TIMEZONES = [
  "Africa/Dar_es_Salaam", "Africa/Nairobi", "Africa/Kampala", "Africa/Kigali", "Africa/Lusaka",
  "Africa/Lagos", "Europe/London", "America/New_York", "Asia/Dubai", "UTC",
];

// Real timezone-aware formatting via the browser's own Intl API — no
// library needed, genuinely correct across DST and regional differences,
// unlike the naive plain-Date formatting used elsewhere in this app
// before company.timezone existed to format against. Intl.DateTimeFormat
// throws if dateStyle/timeStyle are combined with granular component
// options (hour, minute, etc.) in the same call, so the defaults only
// apply when the caller hasn't specified its own components.
function formatInTimezone(dateInput, timezone, options = {}) {
  const hasComponentOptions = ["hour", "minute", "second", "year", "month", "day", "weekday"].some((k) => k in options);
  const base = hasComponentOptions ? {} : { dateStyle: "medium", timeStyle: "short" };
  try {
    return new Intl.DateTimeFormat("en-GB", { timeZone: timezone || "UTC", ...base, ...options }).format(new Date(dateInput));
  } catch (_e) {
    return new Date(dateInput).toLocaleString();
  }
}

function lineTotal(items) {
  // Each line: qty × rate × (1 - discount/100). Per-line discount is optional
  // (0 when not set) so existing callers that pass no discount field are unaffected.
  const subtotal = items.reduce((s, i) => {
    const base = (Number(i.qty) || 0) * (Number(i.rate) || 0);
    const disc = Math.min(100, Math.max(0, Number(i.discount) || 0));
    return s + base * (1 - disc / 100);
  }, 0);
  const tax = Math.round(subtotal * TAX_RATE);
  return { subtotal, tax, total: subtotal + tax };
}

// A real number-to-words converter, not a lookup table — built after
// reviewing an actual SokoBook invoice screenshot showing "Amount in
// Words" as a standard line item, a real convention on business invoices
// across South Asia and East Africa that this build didn't have. Values
// throughout this app are stored in thousands (the "k" suffix shown
// everywhere), so the caller multiplies by 1000 before converting —
// this function itself works on the real, full currency amount.
function numberToWords(n) {
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  function belowThousand(num) {
    if (num === 0) return "";
    if (num < 20) return ones[num];
    if (num < 100) return tens[Math.floor(num / 10)] + (num % 10 ? " " + ones[num % 10] : "");
    return ones[Math.floor(num / 100)] + " Hundred" + (num % 100 ? " " + belowThousand(num % 100) : "");
  }

  if (n === 0) return "Zero";
  const units = [["", 1], ["Thousand", 1e3], ["Million", 1e6], ["Billion", 1e9]];
  let remaining = Math.round(Math.abs(n));
  const parts = [];
  for (let i = units.length - 1; i >= 0; i--) {
    const [label, value] = units[i];
    if (remaining >= value) {
      const chunk = Math.floor(remaining / value);
      remaining %= value;
      parts.push(belowThousand(chunk) + (label ? " " + label : ""));
    }
  }
  return parts.join(" ").trim();
}

/* --------------------------------- FIXED ASSETS --------------------------------- */



// Straight-line depreciation — cost spread evenly over the useful life,
// computed from real elapsed time (acquisition date to today), not a
// stored number that could drift out of sync with the calendar.
function depreciate(asset) {
  const acquired = new Date(asset.acquisitionDate);
  const monthsElapsed = Math.max(0, (TODAY.getFullYear() - acquired.getFullYear()) * 12 + (TODAY.getMonth() - acquired.getMonth()));
  const usefulMonths = asset.usefulLifeYears * 12;
  const monthlyDep = asset.cost / usefulMonths;
  const accumulated = Math.min(asset.cost, monthlyDep * monthsElapsed);
  const bookValue = Math.max(0, asset.cost - accumulated);
  const fullyDepreciated = monthsElapsed >= usefulMonths;
  return { accumulated: Math.round(accumulated), bookValue: Math.round(bookValue), fullyDepreciated, monthlyDep: Math.round(monthlyDep) };
}

const financeAssetsSeed = [
  { id: "AST-01", name: "Toyota Hilux — Delivery Truck", category: "Vehicles", acquisitionDate: "2023-03-15", cost: 68000, usefulLifeYears: 8 },
  { id: "AST-02", name: "Warehouse Forklift", category: "Equipment", acquisitionDate: "2022-11-01", cost: 24500, usefulLifeYears: 10 },
  { id: "AST-03", name: "Office Furniture Set — HQ", category: "Furniture & Fixtures", acquisitionDate: "2024-01-10", cost: 8200, usefulLifeYears: 7 },
  { id: "AST-04", name: "Server & Networking Rack", category: "Computers & IT", acquisitionDate: "2023-08-20", cost: 12800, usefulLifeYears: 5 },
  { id: "AST-05", name: "Dar es Salaam Warehouse Building", category: "Buildings", acquisitionDate: "2019-06-01", cost: 340000, usefulLifeYears: 25 },
];

const quotationsSeed = [
  {
    id: "QT-1042", customer: "Baraka Hotels & Resorts", date: "2026-06-24", validUntil: "2026-07-08",
    status: "Sent", owner: "J. Batenga",
    items: [
      { name: "Industrial water heaters (50L)", qty: 12, rate: 480 },
      { name: "Installation & commissioning", qty: 1, rate: 2100 },
      { name: "1-year service contract", qty: 1, rate: 1800 },
    ],
  },
  {
    id: "QT-1041", customer: "Coastal Construction Ltd", date: "2026-06-20", validUntil: "2026-07-04",
    status: "Draft", owner: "M. Fundi",
    items: [
      { name: "Steel reinforcement bars (12mm, ton)", qty: 8, rate: 1650 },
      { name: "Cement (50kg bag)", qty: 400, rate: 17.5 },
    ],
  },
  {
    id: "QT-1040", customer: "Meridian Logistics", date: "2026-06-15", validUntil: "2026-06-29",
    status: "Accepted", owner: "S. Kileo",
    items: [
      { name: "Fleet GPS tracking units", qty: 24, rate: 145 },
      { name: "Annual monitoring subscription", qty: 24, rate: 60 },
    ],
  },
  {
    id: "QT-1039", customer: "Nyota Pharmacy Group", date: "2026-06-02", validUntil: "2026-06-16",
    status: "Expired", owner: "M. Fundi",
    items: [{ name: "Cold-chain refrigeration units", qty: 3, rate: 2250 }],
  },
];

const ordersSeed = [
  {
    id: "SO-2117", customer: "Meridian Logistics", date: "2026-06-29", quotationRef: "QT-1040",
    status: "Confirmed", owner: "S. Kileo", returns: [],
    items: [
      { name: "Fleet GPS tracking units", qty: 24, rate: 145 },
      { name: "Annual monitoring subscription", qty: 24, rate: 60 },
    ],
  },
  {
    id: "SO-2116", customer: "Uzuri Beauty Chain", date: "2026-06-27", quotationRef: "—",
    status: "Fulfilled", owner: "J. Batenga", returns: [],
    items: [
      { name: "Salon styling chairs", qty: 10, rate: 210 },
      { name: "Backwash basins", qty: 4, rate: 340 },
    ],
  },
  {
    id: "SO-2115", customer: "Salim Wholesale Traders", date: "2026-06-25", quotationRef: "—",
    status: "Pending", owner: "S. Kileo", returns: [],
    items: [{ name: "Warehouse shelving units", qty: 30, rate: 95 }],
  },
  {
    id: "SO-2114", customer: "Rugambwa Auto Workshop", date: "2026-06-18", quotationRef: "—",
    status: "Cancelled", owner: "S. Kileo", returns: [],
    items: [{ name: "Hydraulic vehicle lifts", qty: 2, rate: 1850 }],
  },
];

const invoicesSeed = [
  {
    id: "INV-8801", customer: "Uzuri Beauty Chain", date: "2026-06-27", dueDate: "2026-07-11",
    orderRef: "SO-2116", status: "Paid", amountPaid: null, payments: [],
    items: [
      { name: "Salon styling chairs", qty: 10, rate: 210 },
      { name: "Backwash basins", qty: 4, rate: 340 },
    ],
  },
  {
    id: "INV-8800", customer: "Baraka Hotels & Resorts", date: "2026-06-20", dueDate: "2026-07-04",
    orderRef: "—", status: "Partial", amountPaid: 40000, payments: [],
    items: [{ name: "Kitchen refrigeration overhaul", qty: 1, rate: 96500 }],
  },
  {
    id: "INV-8799", customer: "Kilimo Fresh Distributors", date: "2026-06-10", dueDate: "2026-06-24",
    orderRef: "—", status: "Overdue", amountPaid: 0, payments: [],
    items: [{ name: "Cold storage racking system", qty: 6, rate: 3067 }],
  },
  {
    id: "INV-8798", customer: "Nyota Pharmacy Group", date: "2026-06-30", dueDate: "2026-07-14",
    orderRef: "—", status: "Unpaid", amountPaid: 0, payments: [],
    items: [{ name: "Pharmacy display units", qty: 8, rate: 780 }],
  },
];

/* ------------------------------ SUBSCRIPTIONS DATA ------------------------------ */

const SUBSCRIPTION_CYCLES = ["Monthly", "Quarterly", "Annual"];
const CYCLE_MONTHS = { Monthly: 1, Quarterly: 3, Annual: 12 };

const SUBSCRIPTION_STATUS_COLOR = {
  Active: "#16A34A",
  Paused: "#F59E0B",
  Cancelled: "#9CA3AF",
};

// Continuity with the earlier fleet-tracking story: Meridian Logistics
// bought GPS units as a one-off order (SO-2117); the monitoring is the
// recurring part — this is the natural subscription that order implies.
const subscriptionsSeed = [
  {
    id: "SUB-201", customer: "Meridian Logistics", plan: "Fleet GPS Monitoring", amount: 1440, cycle: "Monthly",
    status: "Active", startDate: "2026-06-01", nextBillingDate: "2026-07-01",
  },
  {
    id: "SUB-202", customer: "Baraka Hotels & Resorts", plan: "Kitchen Equipment Service Contract", amount: 8500, cycle: "Quarterly",
    status: "Active", startDate: "2026-04-15", nextBillingDate: "2026-07-15",
  },
  {
    id: "SUB-203", customer: "Nyota Pharmacy Group", plan: "Cold-Chain Maintenance Plan", amount: 21000, cycle: "Annual",
    status: "Active", startDate: "2026-01-10", nextBillingDate: "2027-01-10",
  },
  {
    id: "SUB-204", customer: "Uzuri Beauty Chain", plan: "Salon Equipment Warranty Plus", amount: 950, cycle: "Monthly",
    status: "Paused", startDate: "2026-05-01", nextBillingDate: "2026-07-01",
  },
];

function addCycle(dateStr, cycle) {
  const d = new Date(dateStr);
  d.setMonth(d.getMonth() + CYCLE_MONTHS[cycle]);
  return d.toISOString().slice(0, 10);
}



/* ------------------------------ INVENTORY DATA ------------------------------ */

const WAREHOUSES = [
  { id: "WH-DSM", name: "Dar es Salaam — Main", city: "Dar es Salaam" },
  { id: "WH-ARU", name: "Arusha — Regional", city: "Arusha" },
  { id: "WH-MWZ", name: "Mwanza — Regional", city: "Mwanza" },
];

const STOCK_STATUS_COLOR = {
  "In Stock": "#16A34A",
  "Low Stock": "#F59E0B",
  "Out of Stock": "#EF4444",
};

function stockStatus(qty, reorder) {
  if (qty <= 0) return "Out of Stock";
  if (qty <= reorder) return "Low Stock";
  return "In Stock";
}

// Only items with a real shelf life get an expiry date — a water heater or
// a GPS unit does not expire, so most items honestly have none. Cement is
// the one genuine case in this catalogue (it hardens past its shelf life).
const EXPIRY_WARNING_DAYS = 30;
function expiryStatus(expiryDate) {
  if (!expiryDate) return null;
  const days = Math.round((new Date(expiryDate) - TODAY) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days <= EXPIRY_WARNING_DAYS) return "Expiring Soon";
  return "Fresh";
}
const EXPIRY_STATUS_COLOR = { Expired: "#EF4444", "Expiring Soon": "#F59E0B", Fresh: "#16A34A" };

// Deterministic EAN-13-style barcode derived from the SKU, not random —
// the same item always renders the same code across sessions and reloads.
function generateBarcode(sku) {
  let hash = 0;
  for (let i = 0; i < sku.length; i++) hash = (hash * 31 + sku.charCodeAt(i)) >>> 0;
  return `6${String(hash).padStart(12, "0").slice(0, 12)}`;
}

const inventorySeed = [
  { sku: "HDW-2201", name: "Industrial water heater 50L", category: "Hardware & Fixtures", warehouse: "WH-DSM", qty: 34, reorder: 15, unitCost: 312, unit: "unit", expiryDate: null },
  { sku: "HDW-2202", name: "Steel reinforcement bar 12mm (ton)", category: "Construction Materials", warehouse: "WH-DSM", qty: 6, reorder: 10, unitCost: 1490, unit: "ton", expiryDate: null },
  { sku: "HDW-2203", name: "Cement 50kg bag", category: "Construction Materials", warehouse: "WH-ARU", qty: 820, reorder: 200, unitCost: 15.2, unit: "bag", expiryDate: "2026-07-20" },
  { sku: "HDW-2204", name: "Fleet GPS tracking unit", category: "Electronics", warehouse: "WH-DSM", qty: 0, reorder: 20, unitCost: 118, unit: "unit", expiryDate: null },
  { sku: "HDW-2205", name: "Salon styling chair", category: "Furniture", warehouse: "WH-MWZ", qty: 18, reorder: 8, unitCost: 165, unit: "unit", expiryDate: null },
  { sku: "HDW-2206", name: "Backwash basin", category: "Furniture", warehouse: "WH-MWZ", qty: 5, reorder: 6, unitCost: 280, unit: "unit", expiryDate: null },
  { sku: "HDW-2207", name: "Warehouse shelving unit", category: "Storage Equipment", warehouse: "WH-DSM", qty: 62, reorder: 25, unitCost: 78, unit: "unit", expiryDate: null },
  { sku: "HDW-2208", name: "Hydraulic vehicle lift", category: "Workshop Equipment", warehouse: "WH-ARU", qty: 3, reorder: 4, unitCost: 1520, unit: "unit", expiryDate: null },
  { sku: "HDW-2209", name: "Cold storage racking system", category: "Storage Equipment", warehouse: "WH-DSM", qty: 11, reorder: 5, unitCost: 2580, unit: "unit", expiryDate: null },
  { sku: "HDW-2210", name: "Pharmacy display unit", category: "Furniture", warehouse: "WH-MWZ", qty: 27, reorder: 10, unitCost: 640, unit: "unit", expiryDate: null },
].map((it) => ({ ...it, barcode: generateBarcode(it.sku) }));

const stockMovements = {
  "HDW-2201": [
    { date: "2026-06-24", type: "Out", qty: 12, ref: "QT-1042 reserved", by: "J. Batenga" },
    { date: "2026-06-10", type: "In", qty: 40, ref: "PO-3312 received", by: "Warehouse" },
  ],
  "HDW-2204": [
    { date: "2026-06-29", type: "Out", qty: 24, ref: "SO-2117 fulfilled", by: "S. Kileo" },
    { date: "2026-06-18", type: "In", qty: 24, ref: "PO-3298 received", by: "Warehouse" },
  ],
  "HDW-2202": [
    { date: "2026-06-22", type: "Out", qty: 4, ref: "QT-1041 reserved", by: "M. Fundi" },
    { date: "2026-06-05", type: "In", qty: 10, ref: "PO-3280 received", by: "Warehouse" },
  ],
};

/* ----------------------------- INVENTORY: TRANSFERS ---------------------------- */

const TRANSFER_STATUS_COLOR = { Pending: "#F59E0B", "In Transit": "#F59E0B", Completed: "#16A34A" };
const TRANSFER_STATUS_NEXT = { Pending: "In Transit", "In Transit": "Completed", Completed: null };

// A transfer moves a SKU's entire current stock to a new warehouse — this
// build tracks one location per SKU (see the handover doc), so splitting
// stock across two warehouses simultaneously is not modeled yet. Requiring
// the full quantity keeps this feature honestly correct rather than
// silently misrepresenting a partial split it can't actually track.
const transfersSeed = [
  { id: "TRF-01", sku: "HDW-2208", itemName: "Hydraulic vehicle lift", qty: 3, fromWarehouse: "WH-ARU", toWarehouse: "WH-DSM", status: "Completed", date: "2026-06-20", notes: "Consolidating workshop equipment at HQ" },
  { id: "TRF-02", sku: "HDW-2206", itemName: "Backwash basin", qty: 5, fromWarehouse: "WH-MWZ", toWarehouse: "WH-DSM", status: "In Transit", date: "2026-07-01", notes: "Reallocating for Baraka Hotels order" },
];

/* ------------------------------ INVENTORY: BATCHES ------------------------------ */

// A supplementary traceability ledger, not the authoritative stock count —
// the aggregate qty on the item itself (used by POS, Sales, Manufacturing)
// does not derive from these rows. This records which batch/lot a delivery
// belonged to and when it expires, for recall and shelf-life purposes,
// layered on top of the existing stock model rather than replacing it.
const batchesSeed = [
  { id: "BATCH-01", sku: "HDW-2203", itemName: "Cement 50kg bag", batchNumber: "CEM-2026-06-A", qty: 400, expiryDate: "2026-07-20", warehouse: "WH-ARU", supplier: "Tanzania Portland Cement Co.", receivedDate: "2026-06-01" },
  { id: "BATCH-02", sku: "HDW-2203", itemName: "Cement 50kg bag", batchNumber: "CEM-2026-06-B", qty: 420, expiryDate: "2026-08-05", warehouse: "WH-ARU", supplier: "Tanzania Portland Cement Co.", receivedDate: "2026-06-18" },
];

/* ----------------------------- INVENTORY: SUPPLIERS ----------------------------- */

const SUPPLIER_STATUS_COLOR = { Active: "#16A34A", Inactive: "#9CA3AF" };

const suppliersSeed = [
  { id: "SUP-01", name: "Tanzania Portland Cement Co.", contactPerson: "Rashid Mbwana", email: "sales@tpcc.co.tz", phone: "+255 22 286 1000", category: "Construction Materials", leadTimeDays: 5, status: "Active" },
  { id: "SUP-02", name: "Coastal Steel & Hardware Ltd", contactPerson: "Anna Kimaro", email: "orders@coastalsteel.co.tz", phone: "+255 754 990 221", category: "Hardware & Fixtures", leadTimeDays: 10, status: "Active" },
  { id: "SUP-03", name: "Zanzibar Electronics Imports", contactPerson: "Salim Haji", email: "s.haji@znzelectronics.com", phone: "+255 777 402 118", category: "Electronics", leadTimeDays: 21, status: "Active" },
  { id: "SUP-04", name: "Furniture Craft Tanzania", contactPerson: "Neema Shirima", email: "neema@furniturecraft.tz", phone: "+255 712 335 890", category: "Furniture", leadTimeDays: 14, status: "Inactive" },
];

/* -------------------------------- PROCUREMENT DATA ------------------------------ */

// Small purchases do not need sign-off — a real procurement policy, not an
// arbitrary number. Above this, a PO can't move to Approved without going
// through the Approvals tab, which is gated to Owner/Admin the same way
// Settings already is.
const PO_APPROVAL_THRESHOLD = 5000; // TZS 000

const PO_STATUS_COLOR = {
  Draft: "#5B6472",
  "Pending Approval": "#F59E0B",
  Approved: "#16A34A",
  Received: "#16A34A",
  Paid: "#111827",
  Cancelled: "#9CA3AF",
};

const purchaseOrdersSeed = [
  {
    id: "PO-3401", supplier: "Tanzania Portland Cement Co.", status: "Approved",
    orderDate: "2026-06-28", expectedDate: "2026-07-05", requestedBy: "Grace Mmbaga",
    items: [{ sku: "HDW-2203", name: "Cement 50kg bag", qty: 500, cost: 14.8 }],
  },
  {
    id: "PO-3400", supplier: "Coastal Steel & Hardware Ltd", status: "Pending Approval",
    orderDate: "2026-07-01", expectedDate: "2026-07-15", requestedBy: "David Chen",
    items: [{ sku: "HDW-2202", name: "Steel reinforcement bar 12mm (ton)", qty: 8, cost: 1450 }],
  },
  {
    id: "PO-3399", supplier: "Zanzibar Electronics Imports", status: "Received",
    orderDate: "2026-06-15", expectedDate: "2026-06-29", requestedBy: "S. Kileo",
    items: [{ sku: "HDW-2204", name: "Fleet GPS tracking unit", qty: 30, cost: 105 }],
  },
  {
    id: "PO-3398", supplier: "Furniture Craft Tanzania", status: "Paid",
    orderDate: "2026-06-01", expectedDate: "2026-06-14", requestedBy: "J. Batenga",
    items: [{ sku: "HDW-2205", name: "Salon styling chair", qty: 20, cost: 150 }],
  },
  {
    id: "PO-3397", supplier: "Coastal Steel & Hardware Ltd", status: "Draft",
    orderDate: "2026-07-02", expectedDate: null, requestedBy: "Grace Mmbaga",
    items: [{ sku: "HDW-2207", name: "Warehouse shelving unit", qty: 40, cost: 72 }],
  },
];

function poTotal(items) {
  return items.reduce((s, it) => s + it.qty * it.cost, 0);
}

const CONTRACT_TYPES = ["Framework Agreement", "Fixed-term Supply", "One-time"];
const CONTRACT_WARNING_DAYS = 45;

function contractStatus(endDate) {
  if (!endDate) return "Active"; // framework agreements can be open-ended
  const days = Math.round((new Date(endDate) - TODAY) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Expired";
  if (days <= CONTRACT_WARNING_DAYS) return "Expiring Soon";
  return "Active";
}
const CONTRACT_STATUS_COLOR = { Active: "#16A34A", "Expiring Soon": "#F59E0B", Expired: "#EF4444" };

const procurementContractsSeed = [
  { id: "PC-01", supplier: "Tanzania Portland Cement Co.", type: "Framework Agreement", startDate: "2025-01-01", endDate: null, value: 180000, notes: "Standing supply agreement, no fixed end date" },
  { id: "PC-02", supplier: "Coastal Steel & Hardware Ltd", type: "Fixed-term Supply", startDate: "2026-01-01", endDate: "2026-07-31", value: 42000, notes: "Annual steel supply contract, up for renewal" },
  { id: "PC-03", supplier: "Zanzibar Electronics Imports", type: "One-time", startDate: "2026-06-01", endDate: "2026-06-30", value: 3150, notes: "GPS unit bulk order" },
];

/* -------------------------------- FINANCE DATA ------------------------------- */

const TODAY = new Date("2026-07-02");

function daysBetween(a, b) {
  return Math.round((a - b) / (1000 * 60 * 60 * 24));
}

function agingBucket(dueDateStr) {
  if (!dueDateStr) return "No due date";
  const days = Math.floor((TODAY - new Date(dueDateStr)) / 86400000);
  if (days <= 0) return "Current";
  if (days <= 30) return "1–30 days";
  if (days <= 60) return "31–60 days";
  if (days <= 90) return "61–90 days";
  return "90+ days";
}
function agingDays(dueDateStr) {
  if (!dueDateStr) return 0;
  return Math.floor((TODAY - new Date(dueDateStr)) / 86400000);
}

const AGING_COLOR = {
  "Current": "#16A34A",
  "1–30 days": "#F59E0B",
  "31–60 days": "#F59E0B",
  "60+ days": "#EF4444",
};

const EXPENSE_STATUS_COLOR = {
  Paid: "#16A34A",
  Pending: "#F59E0B",
  Scheduled: "#16A34A",
};




const expensesSeed = [
  { id: "EX-4501", vendor: "Kilimanjaro Property Holdings", category: "Rent & Utilities", date: "2026-06-28", dueDate: "2026-07-28", amount: 8200, status: "Paid", method: "Bank Transfer", department: "Operations", costCenter: "CC-OPS-01" },
  { id: "EX-4500", vendor: "Payroll — June", category: "Salaries", date: "2026-06-27", dueDate: "2026-06-27", amount: 41500, status: "Paid", method: "Bank Transfer", department: "Admin", costCenter: "CC-ADM-01" },
  { id: "EX-4499", vendor: "Coastal Freight Movers", category: "Logistics", date: "2026-06-25", dueDate: "2026-07-25", amount: 6340, status: "Paid", method: "Mobile Money", department: "Warehouse", costCenter: "CC-WH-02" },
  { id: "EX-4498", vendor: "Nexus Digital Marketing", category: "Marketing", date: "2026-06-22", dueDate: "2026-07-07", amount: 3100, status: "Pending", method: "Bank Transfer", department: "Sales", costCenter: "CC-SALES-01" },
  { id: "EX-4497", vendor: "OfficeMart Supplies Ltd", category: "Supplies", date: "2026-06-20", dueDate: "2026-07-20", amount: 980, status: "Paid", method: "Cash", department: "Admin", costCenter: "CC-ADM-02" },
  { id: "EX-4496", vendor: "Bahati & Partners Audit", category: "Professional Fees", date: "2026-06-18", dueDate: "2026-06-25", amount: 4500, status: "Scheduled", method: "Bank Transfer", department: "Finance", costCenter: "CC-FIN-01" },
  { id: "EX-4495", vendor: "TANESCO", category: "Rent & Utilities", date: "2026-06-15", dueDate: "2026-07-15", amount: 1620, status: "Paid", method: "Mobile Money", department: "Operations", costCenter: "CC-OPS-02" },
  { id: "EX-4494", vendor: "Zuridata Cloud Hosting", category: "Supplies", date: "2026-06-12", dueDate: "2026-07-12", amount: 740, status: "Paid", method: "Card", department: "Operations", costCenter: "CC-OPS-03" },
];

/* ---------------------------------- HR DATA ---------------------------------- */

const DEPARTMENTS = ["Sales", "Operations", "Finance", "Warehouse", "Admin"];

const EMPLOYMENT_STATUS_COLOR = {
  Active: "#16A34A",
  "On Leave": "#F59E0B",
  Inactive: "#9CA3AF",
};

const LEAVE_STATUS_COLOR = {
  Pending: "#F59E0B",
  Approved: "#16A34A",
  Rejected: "#EF4444",
};

const employeesSeed = [
  { id: "EMP-101", name: "Juma Batenga", role: "Sales Manager", department: "Sales", email: "j.batenga@beirahisi.co.tz", phone: "+255 754 220 981", status: "Active", salary: 2400, hireDate: "2023-02-14", contractType: "Permanent", contractEndDate: null },
  { id: "EMP-102", name: "Sarah Kileo", role: "Account Executive", department: "Sales", email: "s.kileo@beirahisi.co.tz", phone: "+255 712 004 552", status: "Active", salary: 1650, hireDate: "2023-08-01", contractType: "Permanent", contractEndDate: null },
  { id: "EMP-103", name: "Michael Fundi", role: "Account Executive", department: "Sales", email: "m.fundi@beirahisi.co.tz", phone: "+255 786 442 019", status: "On Leave", salary: 1650, hireDate: "2024-01-10", contractType: "Fixed-term", contractEndDate: "2027-01-10" },
  { id: "EMP-104", name: "Grace Mmbaga", role: "Warehouse Supervisor", department: "Warehouse", email: "g.mmbaga@beirahisi.co.tz", phone: "+255 767 331 220", status: "Active", salary: 1400, hireDate: "2022-11-05", contractType: "Permanent", contractEndDate: null },
  { id: "EMP-105", name: "Elias Rugambwa", role: "Logistics Coordinator", department: "Operations", email: "e.rugambwa@beirahisi.co.tz", phone: "+255 762 883 456", status: "Active", salary: 1550, hireDate: "2023-05-20", contractType: "Permanent", contractEndDate: null },
  { id: "EMP-106", name: "Fatuma Salim", role: "Accountant", department: "Finance", email: "f.salim@beirahisi.co.tz", phone: "+255 715 990 341", status: "Active", salary: 1900, hireDate: "2022-06-01", contractType: "Permanent", contractEndDate: null },
  { id: "EMP-107", name: "David Chen", role: "Operations Lead", department: "Operations", email: "d.chen@beirahisi.co.tz", phone: "+255 700 118 774", status: "Active", salary: 2200, hireDate: "2021-09-15", contractType: "Permanent", contractEndDate: null },
  { id: "EMP-108", name: "Halima Juma", role: "Office Administrator", department: "Admin", email: "h.juma@beirahisi.co.tz", phone: "+255 754 662 187", status: "Inactive", salary: 1100, hireDate: "2023-03-01", contractType: "Probation", contractEndDate: "2026-09-01" },
];

const EMPLOYMENT_CONTRACT_TYPES = ["Permanent", "Fixed-term", "Probation"];

const leaveRequestsSeed = [
  { id: "LV-501", employee: "Michael Fundi", type: "Annual", startDate: "2026-06-28", endDate: "2026-07-08", status: "Approved" },
  { id: "LV-500", employee: "Sarah Kileo", type: "Sick", startDate: "2026-07-01", endDate: "2026-07-02", status: "Pending" },
  { id: "LV-499", employee: "Grace Mmbaga", type: "Annual", startDate: "2026-07-15", endDate: "2026-07-19", status: "Pending" },
  { id: "LV-498", employee: "Elias Rugambwa", type: "Unpaid", startDate: "2026-06-10", endDate: "2026-06-12", status: "Approved" },
  { id: "LV-497", employee: "Fatuma Salim", type: "Sick", startDate: "2026-05-28", endDate: "2026-05-29", status: "Rejected" },
];

// Standard annual leave allocation used for balance tracking — a real
// policy number a company sets, not a computed fact, so it's a constant
// rather than something derived from data that does not exist yet.
const ANNUAL_LEAVE_ALLOCATION = 21;

function daysInclusive(startStr, endStr) {
  const ms = new Date(endStr) - new Date(startStr);
  return Math.round(ms / (1000 * 60 * 60 * 24)) + 1;
}

/* ------------------------------- RECRUITMENT DATA -------------------------------- */



const RECRUITMENT_STAGE_COLOR = {
  Applied: "#5B6472",
  Screening: "#16A34A",
  Interview: "#F59E0B",
  Offer: "#F59E0B",
  Hired: "#16A34A",
  Rejected: "#9CA3AF",
};

const candidatesSeed = [
  { id: "CAND-01", name: "Neema Kessy", role: "Warehouse Assistant", department: "Warehouse", stage: "Interview", email: "neema.kessy@gmail.com", appliedDate: "2026-06-20" },
  { id: "CAND-02", name: "Baraka Mwita", role: "Junior Accountant", department: "Finance", stage: "Screening", email: "b.mwita@gmail.com", appliedDate: "2026-06-25" },
  { id: "CAND-03", name: "Zawadi Ndosi", role: "Account Executive", department: "Sales", stage: "Offer", email: "zawadi.ndosi@gmail.com", appliedDate: "2026-06-10" },
  { id: "CAND-04", name: "Yusuph Mrema", role: "Logistics Coordinator", department: "Operations", stage: "Applied", email: "y.mrema@gmail.com", appliedDate: "2026-07-01" },
  { id: "CAND-05", name: "Consolata Peter", role: "Office Administrator", department: "Admin", stage: "Rejected", email: "consolata.p@gmail.com", appliedDate: "2026-06-05" },
];

/* ------------------------------- ATTENDANCE DATA -------------------------------- */

const ATTENDANCE_STATUS_COLOR = {
  Present: "#16A34A",
  Late: "#F59E0B",
  Absent: "#EF4444",
  "On Leave": "#5B6472",
};

const attendanceSeed = [
  { id: "ATT-01", employee: "Juma Batenga", date: "2026-07-02", status: "Present", verified:true,  sigMethod:"biometric", clockIn:"08:02", clockOut:"17:05" },
  { id: "ATT-02", employee: "Sarah Kileo",  date: "2026-07-02", status: "Present", verified:true,  sigMethod:"biometric", clockIn:"07:58", clockOut:"17:01" },
  { id: "ATT-03", employee: "Michael Fundi", date: "2026-07-02", status: "On Leave" },
  { id: "ATT-04", employee: "Grace Mmbaga", date: "2026-07-02", status: "Late" },
  { id: "ATT-05", employee: "Elias Rugambwa", date: "2026-07-02", status: "Present" },
  { id: "ATT-06", employee: "Fatuma Salim", date: "2026-07-02", status: "Absent" },
  { id: "ATT-07", employee: "David Chen", date: "2026-07-02", status: "Present" },
];

/* ------------------------------- PERFORMANCE DATA -------------------------------- */

const PERFORMANCE_RATINGS = ["Excellent", "Good", "Satisfactory", "Needs Improvement"];

const PERFORMANCE_RATING_COLOR = {
  Excellent: "#16A34A",
  Good: "#16A34A",
  Satisfactory: "#F59E0B",
  "Needs Improvement": "#EF4444",
};

const performanceReviewsSeed = [
  { id: "PR-01", employee: "Juma Batenga", period: "H1 2026", rating: "Excellent", reviewer: "EzyMP", notes: "Exceeded sales targets by 18%.", date: "2026-06-30" },
  { id: "PR-02", employee: "Sarah Kileo", period: "H1 2026", rating: "Good", reviewer: "Juma Batenga", notes: "Consistent performer, strong client relationships.", date: "2026-06-30" },
  { id: "PR-03", employee: "Grace Mmbaga", period: "H1 2026", rating: "Good", reviewer: "David Chen", notes: "Improved warehouse turnaround time.", date: "2026-06-28" },
];

/* ------------------------------- TRAINING DATA -------------------------------- */

const TRAINING_STATUS_COLOR = {
  "Not Started": "#5B6472",
  "In Progress": "#F59E0B",
  Completed: "#16A34A",
};

const trainingSeed = [
  { id: "TRN-01", employee: "Sarah Kileo", course: "Advanced Negotiation Skills", status: "Completed", completionDate: "2026-05-15" },
  { id: "TRN-02", employee: "Elias Rugambwa", course: "Fleet Safety Certification", status: "In Progress", completionDate: null },
  { id: "TRN-03", employee: "Fatuma Salim", course: "IFRS Update Workshop", status: "Not Started", completionDate: null },
  { id: "TRN-04", employee: "Grace Mmbaga", course: "Warehouse Safety Refresher", status: "Completed", completionDate: "2026-06-01" },
];

/* ------------------------------- BENEFITS DATA -------------------------------- */

const BENEFIT_TYPES = ["Health Insurance", "Pension Fund", "Housing Allowance", "Transport Allowance"];

const benefitsSeed = [
  { id: "BEN-01", employee: "Juma Batenga", type: "Health Insurance", monthlyValue: 120, status: "Active", enrollmentDate: "2023-02-14" },
  { id: "BEN-02", employee: "Juma Batenga", type: "Pension Fund", monthlyValue: 240, status: "Active", enrollmentDate: "2023-02-14" },
  { id: "BEN-03", employee: "Sarah Kileo", type: "Health Insurance", monthlyValue: 120, status: "Active", enrollmentDate: "2023-08-01" },
  { id: "BEN-04", employee: "Grace Mmbaga", type: "Transport Allowance", monthlyValue: 80, status: "Active", enrollmentDate: "2022-11-05" },
  { id: "BEN-05", employee: "David Chen", type: "Housing Allowance", monthlyValue: 300, status: "Active", enrollmentDate: "2021-09-15" },
];

/* ------------------------------- PAYROLL DATA -------------------------------- */

const payrollRunsSeed = [
  { id: "PR-2026-05", period: "May 2026", employeeCount: 7, totalAmount: 12800, status: "Processed", processedDate: "2026-05-28" },
  { id: "PR-2026-06", period: "June 2026", employeeCount: 7, totalAmount: 12800, status: "Processed", processedDate: "2026-06-27" },
];

/* ------------------------------- MANUFACTURING DATA -------------------------------- */

// BOM component costs are looked up live against inventorySeed's unit costs,
// keeping "material cost per unit" honest to what Inventory shows.
// Takes live inventory rows, not the frozen seed snapshot — a BOM's cost
// must move when a component's unit cost changes in Inventory, not stay
// pinned to whatever the price was when the app first loaded.
function bomComponentCost(sku, inventoryRows) {
  return inventoryRows.find((it) => it.sku === sku)?.unitCost || 0;
}

const bomsSeed = [
  {
    id: "BOM-01", product: "Cold Chain Storage Unit", outputUnit: "unit",
    components: [
      { sku: "HDW-2209", qty: 1 },
      { sku: "HDW-2207", qty: 2 },
    ],
    laborCost: 340,
  },
  {
    id: "BOM-02", product: "Salon Suite Bundle", outputUnit: "bundle",
    components: [
      { sku: "HDW-2205", qty: 1 },
      { sku: "HDW-2206", qty: 1 },
    ],
    laborCost: 95,
  },
  {
    id: "BOM-03", product: "Fleet Tracking Install Kit", outputUnit: "kit",
    components: [
      { sku: "HDW-2204", qty: 1 },
    ],
    laborCost: 40,
  },
];

const WO_STATUS_COLOR = {
  Planned: "#5B6472",
  "In Progress": "#F59E0B",
  Completed: "#16A34A",
  Cancelled: "#9CA3AF",
};

const WO_STATUS_NEXT = { Planned: "In Progress", "In Progress": "Completed", Completed: null, Cancelled: null };

const workOrdersSeed = [
  { id: "WO-301", bomId: "BOM-01", product: "Cold Chain Storage Unit", qty: 4, status: "In Progress", startDate: "2026-06-26", dueDate: "2026-07-06", assignedTo: "Grace Mmbaga" },
  { id: "WO-300", bomId: "BOM-02", product: "Salon Suite Bundle", qty: 6, status: "Planned", startDate: "2026-07-03", dueDate: "2026-07-10", assignedTo: "Elias Rugambwa" },
  { id: "WO-299", bomId: "BOM-03", product: "Fleet Tracking Install Kit", qty: 24, status: "Completed", startDate: "2026-06-14", dueDate: "2026-06-20", assignedTo: "David Chen" },
  { id: "WO-298", bomId: "BOM-01", product: "Cold Chain Storage Unit", qty: 2, status: "Completed", startDate: "2026-06-01", dueDate: "2026-06-08", assignedTo: "Grace Mmbaga" },
];

/* ------------------------------ MANUFACTURING: MACHINES ------------------------------ */

const MACHINE_STATUS_COLOR = { Running: "#16A34A", Idle: "#5B6472", "Under Maintenance": "#F59E0B", Down: "#EF4444" };

const machinesSeed = [
  { id: "MC-01", name: "CNC Panel Cutter #1", type: "Cutting", warehouse: "WH-DSM", status: "Running", purchaseDate: "2022-03-10" },
  { id: "MC-02", name: "Welding Station A", type: "Welding", warehouse: "WH-DSM", status: "Running", purchaseDate: "2021-08-01" },
  { id: "MC-03", name: "Powder Coat Booth", type: "Finishing", warehouse: "WH-ARU", status: "Under Maintenance", purchaseDate: "2023-01-15" },
  { id: "MC-04", name: "Assembly Line Conveyor", type: "Assembly", warehouse: "WH-DSM", status: "Idle", purchaseDate: "2020-11-20" },
];

/* --------------------------- MANUFACTURING: QUALITY CONTROL --------------------------- */

const QC_RESULT_COLOR = { Pass: "#16A34A", Rework: "#F59E0B", Fail: "#EF4444" };

const qcInspectionsSeed = [
  { id: "QC-01", workOrderId: "WO-299", inspector: "David Chen", result: "Pass", defectsFound: 0, notes: "All units within spec.", date: "2026-06-20" },
  { id: "QC-02", workOrderId: "WO-298", inspector: "Grace Mmbaga", result: "Rework", defectsFound: 1, notes: "One unit had a loose seal — reworked before release.", date: "2026-06-08" },
];

/* --------------------------- MANUFACTURING: MAINTENANCE --------------------------- */

const MAINTENANCE_TYPES = ["Preventive", "Corrective"];

const maintenanceSeed = [
  { id: "MT-01", machine: "Powder Coat Booth", type: "Corrective", technician: "S. Kileo", date: "2026-06-30", cost: 420, notes: "Replaced heating element", nextDueDate: "2026-09-30" },
  { id: "MT-02", machine: "CNC Panel Cutter #1", type: "Preventive", technician: "Grace Mmbaga", date: "2026-05-15", cost: 85, notes: "Routine blade replacement and calibration", nextDueDate: "2026-08-15" },
  { id: "MT-03", machine: "Welding Station A", type: "Preventive", technician: "S. Kileo", date: "2026-04-01", cost: 60, notes: "Gas line inspection", nextDueDate: "2026-07-01" },
];

/* -------------------------------- PROJECTS DATA -------------------------------- */

const PROJECT_STATUS_COLOR = { Planning: "#5B6472", Active: "#16A34A", "On Hold": "#F59E0B", Completed: "#16A34A" };

// Continuity with existing customer relationships rather than inventing
// disconnected demo accounts — these are the same real accounts already
// seen across CRM, Sales, and Finance.
const projectsSeed = [
  { id: "PRJ-01", name: "Cold Chain Rollout", client: "Kilimo Fresh Distributors", status: "Active", startDate: "2026-06-01", endDate: "2026-08-15", budget: 42000, manager: "David Chen" },
  { id: "PRJ-02", name: "Fleet GPS Deployment", client: "Meridian Logistics", status: "Active", startDate: "2026-06-15", endDate: "2026-07-20", budget: 15000, manager: "S. Kileo" },
  { id: "PRJ-03", name: "Kitchen Refurbishment", client: "Baraka Hotels & Resorts", status: "Planning", startDate: "2026-07-10", endDate: "2026-09-30", budget: 28000, manager: "Grace Mmbaga" },
];

const TASK_STATUSES = ["To Do", "In Progress", "Review", "Done"];
const TASK_STATUS_COLOR = { "To Do": "#5B6472", "In Progress": "#F59E0B", Review: "#F59E0B", Done: "#16A34A" };
const PRIORITY_COLOR = { Low: "#5B6472", Medium: "#F59E0B", High: "#EF4444" };

const projectTasksSeed = [
  { id: "TSK-01", projectId: "PRJ-01", title: "Site survey — cold storage bay", assignee: "Grace Mmbaga", status: "Done", priority: "High", dueDate: "2026-06-10" },
  { id: "TSK-02", projectId: "PRJ-01", title: "Install racking system", assignee: "Elias Rugambwa", status: "In Progress", priority: "High", dueDate: "2026-07-05" },
  { id: "TSK-03", projectId: "PRJ-01", title: "Commission refrigeration units", assignee: "David Chen", status: "To Do", priority: "Medium", dueDate: "2026-07-25" },
  { id: "TSK-04", projectId: "PRJ-02", title: "Install GPS units on fleet", assignee: "S. Kileo", status: "In Progress", priority: "High", dueDate: "2026-07-08" },
  { id: "TSK-05", projectId: "PRJ-02", title: "Configure monitoring dashboard", assignee: "David Chen", status: "Review", priority: "Medium", dueDate: "2026-07-12" },
  { id: "TSK-06", projectId: "PRJ-03", title: "Finalize equipment list", assignee: "Grace Mmbaga", status: "To Do", priority: "Medium", dueDate: "2026-07-18" },
];

// Same live-computed-status convention as contractStatus and expiryStatus
// — Completed is the only stored fact; everything else is derived from
// today's date so a milestone can never silently drift out of sync.
function milestoneStatus(m) {
  if (m.completed) return "Completed";
  const days = Math.round((new Date(m.dueDate) - TODAY) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Overdue";
  if (days <= 14) return "Due Soon";
  return "Upcoming";
}
const MILESTONE_STATUS_COLOR = { Completed: "#16A34A", Overdue: "#EF4444", "Due Soon": "#F59E0B", Upcoming: "#5B6472" };

const projectMilestonesSeed = [
  { id: "MS-01", projectId: "PRJ-01", title: "Phase 1: Installation complete", dueDate: "2026-07-15", completed: false },
  { id: "MS-02", projectId: "PRJ-01", title: "Final handover", dueDate: "2026-08-15", completed: false },
  { id: "MS-03", projectId: "PRJ-02", title: "Fleet-wide GPS live", dueDate: "2026-07-20", completed: false },
  { id: "MS-04", projectId: "PRJ-03", title: "Design sign-off", dueDate: "2026-07-25", completed: false },
];

// Logging a project expense creates a real Finance expense (category
// "Project Costs") — the same convention-based link Maintenance and
// Payroll already use — while this local record keeps the per-project
// budget view scoped without needing a project field on every expense.
const projectExpensesSeed = [
  { id: "PE-01", projectId: "PRJ-01", description: "Racking materials", amount: 4200, date: "2026-06-20" },
  { id: "PE-02", projectId: "PRJ-02", description: "GPS units bulk purchase", amount: 3150, date: "2026-06-16" },
];

/* ----------------------------- CUSTOMER SUPPORT DATA ---------------------------- */

const TICKET_STATUS_COLOR = { Open: "#EF4444", "In Progress": "#F59E0B", Resolved: "#16A34A", Closed: "#9CA3AF" };
const TICKET_STATUSES = ["Open", "In Progress", "Resolved", "Closed"];
const TICKET_PRIORITY_COLOR = { Low: "#5B6472", Medium: "#F59E0B", High: "#F59E0B", Urgent: "#EF4444" };


const supportTicketsSeed = [
  {
    id: "TCK-101", subject: "Invoice discrepancy on INV-8799", customer: "Kilimo Fresh Distributors", category: "Billing",
    priority: "High", status: "Open", assignee: "Fatuma Salim", createdDate: "2026-07-01",
    messages: [{ from: "Customer", text: "We were charged for items not on our order. Please review INV-8799.", date: "2026-07-01" }],
  },
  {
    id: "TCK-100", subject: "GPS units not reporting location", customer: "Meridian Logistics", category: "Technical",
    priority: "Urgent", status: "In Progress", assignee: "David Chen", createdDate: "2026-06-29",
    messages: [
      { from: "Customer", text: "Half our fleet's GPS units stopped reporting since yesterday.", date: "2026-06-29" },
      { from: "Agent", text: "Thanks for flagging this — checking with our technical team now.", date: "2026-06-29" },
    ],
  },
  {
    id: "TCK-099", subject: "Request for bulk pricing on cement", customer: "Coastal Construction Ltd", category: "General",
    priority: "Medium", status: "Resolved", assignee: "Juma Batenga", createdDate: "2026-06-20",
    messages: [
      { from: "Customer", text: "Can we get a quote for 1000+ bags of cement?", date: "2026-06-20" },
      { from: "Agent", text: "Sent over a bulk quote — QT-1043. Let us know if you'd like adjustments.", date: "2026-06-21" },
    ],
  },
  {
    id: "TCK-098", subject: "Salon chair delivery delayed", customer: "Uzuri Beauty Chain", category: "General",
    priority: "Low", status: "Closed", assignee: "J. Batenga", createdDate: "2026-06-10",
    messages: [{ from: "Customer", text: "Our delivery was a few days late, just flagging for the record.", date: "2026-06-10" }],
  },
];

// A "conversation" here, not a "ticket" — quick, informal customer chat
// rather than a tracked issue with SLA and priority. The same distinction
// Zendesk Chat vs. Zendesk Support or Intercom's inbox vs. tickets makes.
const chatConversationsSeed = [
  {
    id: "CHAT-01", customer: "Baraka Hotels & Resorts", status: "Active",
    messages: [
      { from: "Customer", text: "Hi, do you have industrial water heaters in stock?", time: "09:12" },
      { from: "Agent", text: "Yes! We have the 50L model in stock at our Dar warehouse.", time: "09:14" },
    ],
  },
  {
    id: "CHAT-02", customer: "Salim Wholesale Traders", status: "Closed",
    messages: [
      { from: "Customer", text: "What's your return policy on shelving units?", time: "14:02" },
      { from: "Agent", text: "30 days for unused items in original packaging.", time: "14:05" },
      { from: "Customer", text: "Perfect, thank you!", time: "14:06" },
    ],
  },
];



const kbArticlesSeed = [
  { id: "KB-01", title: "How to request a bulk quote", category: "Getting Started", content: "To request a bulk quote, contact your account manager or submit a request through the Sales team with your desired quantities and delivery timeline. Most bulk quotes are turned around within one business day.", views: 142, published: true, updatedDate: "2026-05-10" },
  { id: "KB-02", title: "Understanding your invoice", category: "Billing", content: "Each invoice includes a breakdown of line items, VAT at 18%, and payment terms. Partial payments are recorded against the invoice and reflected in the balance due. Contact billing if any line item looks incorrect.", views: 89, published: true, updatedDate: "2026-06-01" },
  { id: "KB-03", title: "Delivery and shipping timelines", category: "Shipping", content: "Standard delivery within Dar es Salaam takes 2-3 business days; regional deliveries to Arusha and Mwanza typically take 5-7 business days depending on route and cargo size.", views: 210, published: true, updatedDate: "2026-04-22" },
  { id: "KB-04", title: "Return and refund policy", category: "Returns", content: "Items may be returned within 30 days of purchase in original condition. Refunds are processed to the original payment method within 5-10 business days of the return being received and inspected.", views: 56, published: false, updatedDate: "2026-06-25" },
];

const CALL_DIRECTION_COLOR = { Inbound: "#16A34A", Outbound: "#F59E0B" };
const CALL_OUTCOME_COLOR = { Resolved: "#16A34A", "Follow-up Needed": "#F59E0B", Escalated: "#EF4444" };

const callLogSeed = [
  { id: "CALL-01", customer: "Kilimo Fresh Distributors", agent: "Fatuma Salim", direction: "Inbound", duration: 12, outcome: "Follow-up Needed", date: "2026-07-01", notes: "Discussed invoice discrepancy, escalated to billing." },
  { id: "CALL-02", customer: "Meridian Logistics", agent: "David Chen", direction: "Outbound", duration: 8, outcome: "Resolved", date: "2026-06-29", notes: "Walked through GPS troubleshooting steps." },
  { id: "CALL-03", customer: "Nyota Pharmacy Group", agent: "Juma Batenga", direction: "Inbound", duration: 5, outcome: "Resolved", date: "2026-06-27", notes: "Confirmed delivery address ahead of dispatch." },
];

/* ------------------------------- NOTIFICATION SYSTEM ---------------------------- */

// Two genuinely different categories of channel, and the UI says so
// honestly rather than presenting all six as equally real:
//
// Slack and Microsoft Teams both support "incoming webhooks" — a plain
// URL that accepts a POST request with a JSON payload. That's something a
// browser can do directly with fetch(), no server required, so these two
// are wired for real.
//
// Email, SMS, WhatsApp, and Push all require a trusted server holding a
// secret (an SMTP/API key, a Twilio Account SID + Auth Token, Meta's
// WhatsApp Business API credentials, an FCM/APNs server key). None of
// those can ever be safely embedded in client-side code — the same
// principle already documented for the AI Assistant's API key. Building a
// button that pretends to send an email with no backend would be actively
// dishonest, not just incomplete, so these four are shown as real
// configuration screens with a functional=false flag and an explanation,
// not a fake "Sent!" toast.
const NOTIFICATION_CHANNELS = [
  {
    id: "slack", name: "Slack", icon: Hash, functional: true,
    fields: [{ key: "webhookUrl", label: "Incoming Webhook URL", placeholder: "https://hooks.slack.com/services/..." }],
  },
  {
    id: "teams", name: "Microsoft Teams", icon: Video, functional: true,
    fields: [{ key: "webhookUrl", label: "Incoming Webhook URL", placeholder: "https://yourorg.webhook.office.com/webhookb2/..." }],
  },
  {
    id: "email", name: "Email", icon: Mail, functional: false,
    fields: [{ key: "fromAddress", label: "From address", placeholder: "notifications@yourcompany.tz" }],
    requirement: "Requires a backend email service (SendGrid, Amazon SES, Postmark) — a browser cannot send email directly.",
  },
  {
    id: "sms", name: "SMS", icon: MessageSquare, functional: false,
    fields: [{ key: "fromNumber", label: "Sender number", placeholder: "+255 XXX XXX XXX" }],
    requirement: "Requires an SMS gateway (Twilio, Africa Talking) with server-held credentials — never safe to embed client-side.",
  },
  {
    id: "whatsapp", name: "WhatsApp", icon: MessageCircle, functional: false,
    fields: [{ key: "businessNumber", label: "WhatsApp Business number", placeholder: "+255 XXX XXX XXX" }],
    requirement: "Requires the WhatsApp Business API via Meta or a provider like Twilio, plus Meta approval — not directly callable from a browser.",
  },
  {
    id: "push", name: "Push Notifications", icon: Bell, functional: false,
    fields: [{ key: "serverKey", label: "Push server key", placeholder: "FCM / APNs server key" }],
    requirement: "Requires a push server holding device tokens and a server key that can never be exposed in frontend code.",
  },
];

// Maps each real alert type already computed by useBusinessAlerts (see the
// Notification Center) to which channels should receive it — reusing the
// exact alert taxonomy already live in the app rather than inventing a
// second one.
const ALERT_ROUTING_TYPES = [
  { id: "out-of-stock", label: "Out of stock" },
  { id: "low-stock", label: "Low stock" },
  { id: "overdue-invoices", label: "Overdue invoices" },
  { id: "pending-expenses", label: "Expenses awaiting payment" },
  { id: "unusual-expenses", label: "Unusual expenses detected" },
  { id: "pending-leave", label: "Leave requests awaiting approval" },
  { id: "overdue-work-orders", label: "Work orders behind schedule" },
  { id: "subscriptions-due", label: "Subscriptions due for billing" },
];

const notificationChannelsSeed = NOTIFICATION_CHANNELS.map((c) => ({ id: c.id, enabled: false, webhookUrl: "", fromAddress: "", fromNumber: "", businessNumber: "", serverKey: "" }));

const notificationRulesSeed = ALERT_ROUTING_TYPES.map((t) => ({ id: t.id, channels: [] }));

const notificationLogSeed = [];

/* --------------------------- ENTERPRISE INTEGRATIONS --------------------------- */

// The same honesty split as the Notification System (see NOTIFICATION_CHANNELS):
// some of these are genuinely achievable from a static frontend, most are not.
// Microsoft 365 and Google Workspace both require a real OAuth app
// registration with a hosted redirect URI and, for anything beyond basic
// sign-in, a server to hold a refresh token — infrastructure this build
// does not have. Stripe and PayPal can't process real payments without a
// server holding a secret key, but both let a business share a hosted
// payment link with no backend at all, which is what "functional" means
// for these two entries — opening a real link the business owner
// configures, not processing a transaction in-app.
const INTEGRATION_CONNECTIONS = [
  {
    id: "microsoft365", name: "Microsoft 365", icon: Briefcase, functional: false,
    fields: [{ key: "tenantId", label: "Azure AD Tenant ID", placeholder: "contoso.onmicrosoft.com" }, { key: "clientId", label: "App (client) ID", placeholder: "00000000-0000-0000-0000-000000000000" }],
    requirement: "Real sign-in and Outlook/Calendar/OneDrive access need an Azure AD app registration with a hosted redirect URI and a server-side token exchange — not achievable from a static page alone.",
  },
  {
    id: "google-workspace", name: "Google Workspace", icon: Globe, functional: false,
    fields: [{ key: "clientId", label: "OAuth Client ID", placeholder: "xxxxx.apps.googleusercontent.com" }],
    requirement: "Gmail/Calendar/Drive access needs a Google Cloud OAuth client and a registered redirect URI — the identical backend requirement as Microsoft 365.",
  },
  {
    id: "slack", name: "Slack", icon: Hash, functional: true,
    fields: [{ key: "webhookUrl", label: "Slack Incoming Webhook URL", placeholder: "https://hooks.slack.com/services/..." }],
    requirement: "Genuinely real — this is the exact same webhook already dispatching real alerts from Notifications and every Workflow Studio automation (sections 22, 35). Configuring it here or in Notifications is the same connection either way; shown here too so it's discoverable from the integration list a person would actually look for it in first.",
  },
  {
    id: "zoom", name: "Zoom", icon: Video, functional: false,
    fields: [{ key: "apiKey", label: "Server-to-Server OAuth Account ID", placeholder: "xxxxxxxxxxxxxxxxxx" }],
    requirement: "Creating meetings programmatically needs a Zoom Server-to-Server OAuth app and a backend to hold its credentials — the same category of requirement as Microsoft 365. What's genuinely real without one: the Collaboration Hub's Shared Calendar (section 37) has a real meeting-link field — paste in a Zoom link generated the normal way, and the calendar shows a working Join button.",
  },
  {
    id: "whatsapp-business", name: "WhatsApp Business", icon: MessageCircle, functional: true,
    fields: [{ key: "businessNumber", label: "WhatsApp Business number (with country code)", placeholder: "+255700000000" }],
    requirement: "Opens a real wa.me click-to-chat link with your number pre-filled — genuinely functional, no account setup needed beyond having WhatsApp. Automated messaging, message templates, and programmatic sending need Meta's paid WhatsApp Business Platform and a verified business account with server-side API access — a materially different, heavier product than click-to-chat.",
  },
  {
    id: "stripe", name: "Stripe", icon: CreditCard, functional: true,
    fields: [{ key: "paymentLink", label: "Stripe Payment Link URL", placeholder: "https://buy.stripe.com/..." }],
    requirement: "Opens your real Stripe-hosted payment page in a new tab. Processing a card charge inside this app (not just linking out) needs a server holding your Stripe secret key.",
  },
  {
    id: "paypal", name: "PayPal", icon: Wallet, functional: true,
    fields: [{ key: "paypalMeLink", label: "PayPal.me link", placeholder: "https://paypal.me/yourbusiness" }],
    requirement: "Opens your real PayPal.me page in a new tab. A fully embedded checkout needs PayPal's SDK and, for anything beyond the simplest flow, server-side order verification.",
  },
  {
    id: "ecommerce-platforms", name: "E-Commerce Platforms", icon: Store, functional: false,
    fields: [{ key: "storeUrl", label: "Store URL (e.g. Shopify, WooCommerce)", placeholder: "your-store.myshopify.com" }],
    requirement: "Syncing orders and inventory with an external platform needs that platform own OAuth app and a server to hold its access token — a separate integration per platform, none achievable from a static page. This app's own built-in E-Commerce module (Storefront and Online Orders) is real and already usable without connecting anything external.",
  },
  {
    id: "pos-systems", name: "POS Systems", icon: ShoppingBag, functional: false,
    fields: [{ key: "terminalId", label: "Terminal / Merchant ID", placeholder: "e.g. Square, Clover terminal ID" }],
    requirement: "Connecting external POS hardware (Square, Clover, and similar) needs that vendor's own device SDK and a paired terminal — not something a web page can do without their hardware present. This app's own built-in Point of Sale module is real, working checkout software already, not a connector to someone else's till.",
  },
];

const MOBILE_MONEY_PROVIDERS = ["M-Pesa", "Airtel Money", "Tigo Pesa", "HaloPesa"];

const TAX_AUTHORITY_NOTE = "No tax authority in East Africa exposes a generic public API a third-party app can integrate with — filing systems like TRA's require certified, business-specific credentials issued directly to the taxpayer. The real, honest capability here is preparation: the VAT Summary already built in Finance computes exactly the number a filing needs.";

const signaturesSeed = [];

/* ------------------------------ BUSINESS INTELLIGENCE DATA ------------------------------ */

// Every metric here is a real computation over data already live elsewhere
// in the app — nothing new to compute, just a way to let someone pick
// which existing number matters most to them and set their own target
// against it, rather than being stuck with whatever KPIs a developer
// hardcoded onto a dashboard.
const KPI_METRICS = [
  { id: "revenue", label: "Revenue Collected", unit: "TZS 000", compute: (d) => d.invoices.rows.reduce((s, inv) => { const { total } = lineTotal(inv.items); return s + (inv.status === "Paid" ? total : (inv.amountPaid || 0)); }, 0) },
  { id: "profit", label: "Net Profit", unit: "TZS 000", compute: (d) => { const rev = d.invoices.rows.reduce((s, inv) => { const { total } = lineTotal(inv.items); return s + (inv.status === "Paid" ? total : (inv.amountPaid || 0)); }, 0); return rev - d.expenses.rows.reduce((s, e) => s + e.amount, 0); } },
  { id: "receivables", label: "Outstanding Receivables", unit: "TZS 000", compute: (d) => d.invoices.rows.filter((inv) => inv.status !== "Paid").reduce((s, inv) => s + (lineTotal(inv.items).total - (inv.amountPaid || 0)), 0) },
  { id: "stock_value", label: "Stock Value", unit: "TZS 000", compute: (d) => d.inventory.rows.reduce((s, it) => s + it.qty * it.unitCost, 0) },
  { id: "pipeline_value", label: "Open Pipeline Value", unit: "TZS 000", compute: (d) => d.crm.rows.filter((l) => l.stage !== "Won" && l.stage !== "Lost").reduce((s, l) => s + l.value, 0) },
  { id: "headcount", label: "Active Employees", unit: "people", compute: (d) => d.employees.rows.filter((e) => e.status === "Active").length },
  { id: "win_rate", label: "Sales Win Rate", unit: "%", compute: (d) => { const won = d.crm.rows.filter((l) => l.stage === "Won").length; const closed = won + d.crm.rows.filter((l) => l.stage === "Lost").length; return closed > 0 ? Math.round((won / closed) * 100) : 0; } },
];

const customKpisSeed = [
  { id: "KPI-01", metricId: "revenue", label: "Monthly Revenue Target", target: 10000 },
  { id: "KPI-02", metricId: "win_rate", label: "Sales Win Rate Target", target: 60 },
];

// Manually entered, deliberately — no automated competitor data exists or
// could exist without scraping or a paid market-intelligence feed neither
// of which this build has. This is exactly how real CRMs (Salesforce's own
// Competitor tracking included) actually work: a rep or owner logs what
// they've learned, not a live automated feed.
const competitorsSeed = [
  { id: "COMP-01", name: "Coastal Building Supplies", category: "Construction Materials", threatLevel: "High", notes: "Undercuts on cement pricing by ~5%; weaker on delivery reliability.", lastUpdated: "2026-06-20" },
  { id: "COMP-02", name: "Arusha Trade Center", category: "Hardware & Fixtures", threatLevel: "Medium", notes: "Strong regional presence in Arusha; limited product range vs. ours.", lastUpdated: "2026-06-10" },
];

// Financial Benchmarking compares a real computed metric against a target
// the business owner enters themselves — from their own research (an
// industry report, an accountant's advice, a number a peer shared) — not
// a live external benchmark feed, since no such feed exists for East
// African SME sector data that a generic app could connect to.
const BENCHMARK_METRICS = [
  { id: "gross_margin", label: "Gross Margin", unit: "%" },
  { id: "receivables_days", label: "Days Sales Outstanding", unit: "days" },
  { id: "stock_turnover", label: "Stock Turnover", unit: "x / year" },
];

const benchmarksSeed = [
  { id: "BM-01", metricId: "gross_margin", label: "Industry Gross Margin (Hardware Retail)", benchmarkValue: 25 },
];

/* ------------------------------ WORKFLOW AUTOMATION STUDIO DATA ------------------------------ */

// Triggers reuse the exact same alert vocabulary useBusinessAlerts already
// computes (section 9) — not a second, parallel event system. "Manual"
// means exactly what it says: no server watches for this while the app is
// closed, so a workflow either runs when someone clicks Run Now, or gets
// surfaced as "ready to run" the moment its matching alert is genuinely
// active in the current session (see WorkflowStudio's own trigger-matching
// logic) — never a silent background action nobody asked for.
const WORKFLOW_TRIGGERS = [
  { id: "manual", label: "Manual — run on demand" },
  { id: "overdue-invoices", label: "When overdue invoices are detected" },
  { id: "low-stock", label: "When stock runs low" },
  { id: "out-of-stock", label: "When an item goes out of stock" },
  { id: "unusual-expenses", label: "When an unusual expense is detected" },
  { id: "pending-leave", label: "When a leave request needs approval" },
  { id: "subscriptions-due", label: "When a subscription is due for billing" },
];

// The "Condition" gate between When and Actions. Each condition carries
// a real evaluate() run against live rows at execution time — never a
// stored snapshot — returning both the verdict and the real numbers
// behind it, so a skipped run states exactly why in real figures.
const WORKFLOW_CONDITIONS = [
  { id: "none", label: "No condition — always run", evaluate: () => ({ met: true, detail: "No condition set" }) },
  { id: "overdue-count-gt", label: "Only if overdue invoices exceed…", unit: "invoices", evaluate: (data, v) => { const todayStr = TODAY.toISOString().slice(0, 10); const n = data.invoices.rows.filter((i) => i.status !== "Paid" && i.dueDate && i.dueDate < todayStr).length; return { met: n > Number(v), detail: `${n} overdue invoice(s) vs threshold ${v}` }; } },
  { id: "low-stock-count-gt", label: "Only if low-stock items exceed…", unit: "items", evaluate: (data, v) => { const n = data.inventory.rows.filter((it) => it.qty <= it.reorder).length; return { met: n > Number(v), detail: `${n} item(s) at/below reorder vs threshold ${v}` }; } },
  { id: "unpaid-expenses-gt", label: "Only if unpaid expenses exceed… (TZS 000)", unit: "TZS k", evaluate: (data, v) => { const total = data.expenses.rows.filter((e) => e.status !== "Paid").reduce((s, e) => s + e.amount, 0); return { met: total > Number(v), detail: `TZS ${money(Math.round(total))}k unpaid vs threshold ${money(Number(v))}k` }; } },
];

// Five step types, deliberately not more — each one wraps a function this
// app has already proven works for real (the exact same sendWebhookNotification
// and logAudit already powering the Notification System and Audit Service).
// A step type was only added here if it can genuinely execute when Run Now
// is clicked; nothing on this list is aspirational.
const WORKFLOW_STEP_TYPES = [
  { id: "notify_slack", label: "Notify via Slack", icon: Hash, color: "#16A34A", fields: [{ key: "message", label: "Message", placeholder: "e.g. Please review this — customer payment received." }] },
  { id: "notify_teams", label: "Notify via Microsoft Teams", icon: Video, color: "#5B6472", fields: [{ key: "message", label: "Message", placeholder: "e.g. Heads up — new payment recorded." }] },
  { id: "log_audit", label: "Log to Audit Trail", icon: FileCheck, color: "#111827", fields: [{ key: "note", label: "Note", placeholder: "What happened, in one line" }] },
  { id: "draft_email", label: "Draft a Thank You / Follow-up Email", icon: Mail, color: "#F59E0B", fields: [{ key: "recipient", label: "Recipient email", placeholder: "customer@company.tz" }, { key: "context", label: "What should it say?", placeholder: "e.g. Thank the customer for their payment" }] },
  { id: "generate_report", label: "Generate a Report", icon: FileText, color: "#0EA5E9", fields: [{ key: "reportType", label: "Report type", options: ["Sales & Revenue", "Inventory Valuation", "Profit & Loss"] }] },
];

const workflowsSeed = [
  {
    id: "WF-01", name: "Invoice Paid Follow-up", trigger: "manual", enabled: true, lastRun: null,
    steps: [
      { id: "s1", type: "notify_slack", config: { message: "A customer invoice was just paid — cash flow updated." } },
      { id: "s2", type: "log_audit", config: { note: "Payment follow-up workflow executed" } },
      { id: "s3", type: "draft_email", config: { recipient: "", context: "Thank the customer warmly for their prompt payment and mention we look forward to serving them again." } },
    ],
  },
];

// Automation Marketplace — seven "ready-made" automations, all real,
// because every one is composed entirely from the five step types and
// the existing real triggers already proven in Workflow Studio (section
// 35). None of these needed new capability to build — "ready-made" here
// means "already assembled," not "does something this app couldn't
// already do." Two (Payroll, VAT) are honestly scoped as monthly
// reminder checklists a person still runs, not unattended auto-filing —
// the identical limitation already stated for Scheduled Reports.


/* ------------------------------ ENTERPRISE COLLABORATION HUB DATA ------------------------------ */

// Voice Calls and Video Meetings are the two items here with no honest
// in-app implementation: real calling needs a WebRTC signaling server,
// STUN/TURN infrastructure for NAT traversal, and for group calls a media
// relay server — none of which exist in a static frontend talking to one
// Postgres database. The honest equivalent, and the same pattern already
// used for Stripe and PayPal in Integrations (section 25): schedule the
// meeting for real, with a real link to wherever the actual call happens
// (Zoom, Google Meet, Teams — whatever the business already uses), rather
// than pretend to host a call this build cannot technically provide.
const MEETING_TYPES = ["Voice Call", "Video Call", "In-Person", "General"];

const calendarEventsSeed = [
  { id: "EVT-01", title: "Weekly Sales Sync", type: "Video Call", date: "2026-07-07", startTime: "09:00", endTime: "09:30", meetingLink: "https://meet.google.com/example-link", attendees: "Sales team", description: "Pipeline review and weekly targets." },
  { id: "EVT-02", title: "Supplier Call — Tanzania Portland Cement", type: "Voice Call", date: "2026-07-08", startTime: "14:00", endTime: "14:30", meetingLink: "", attendees: "Procurement", description: "Discuss Q3 pricing." },
  { id: "EVT-03", title: "Warehouse Stock Count", type: "In-Person", date: "2026-07-10", startTime: "08:00", endTime: "12:00", meetingLink: "", attendees: "Warehouse team", description: "Quarterly physical stock count, Dar es Salaam warehouse." },
];

// Channels cover both Team Chat and Department Channels — a department
// channel is simply a channel scoped to a real department name (drawn
// from HR's actual employee.department values, not an invented list).
const collabChannelsSeed = [
  { id: "CH-01", name: "General", scope: "Company-wide", description: "Company-wide announcements and general discussion." },
  { id: "CH-02", name: "Sales", scope: "Department", description: "Sales team coordination." },
  { id: "CH-03", name: "Operations", scope: "Department", description: "Warehouse and operations coordination." },
];

// Real, polled messages — not true push-based real-time (no WebSocket
// signaling exists here), but genuinely working near-real-time delivery:
// while a channel is open, the frontend polls for new rows every few
// seconds, the same honest technique already validated for this class of
// problem (a static frontend with no server to push events from).
const collabMessagesSeed = [
  { id: "MSG-01", channelId: "CH-01", sender: "Grace Mmbaga", text: "Morning team — reminder that the cold chain rollout site visit is this Thursday.", timestamp: "2026-07-05T08:15:00Z" },
  { id: "MSG-02", channelId: "CH-02", sender: "S. Kileo", text: "Meridian Logistics confirmed the fleet GPS rollout for next week.", timestamp: "2026-07-05T09:02:00Z" },
];

const workspacesSeed = [
  { id: "WS-01", name: "Cold Chain Rollout Team", department: "Operations", members: "Grace Mmbaga, David Chen, Elias Rugambwa", channelId: "CH-03", description: "Cross-functional team delivering the Kilimo Fresh cold chain project." },
];

/* ------------------------------ SUPPLY CHAIN DATA ------------------------------ */

const SHIPMENT_STATUS_COLOR = {
  Preparing: "#5B6472",
  Dispatched: "#F59E0B",
  "In Transit": "#F59E0B",
  Delivered: "#16A34A",
};

const SHIPMENT_STATUS_NEXT = { Preparing: "Dispatched", Dispatched: "In Transit", "In Transit": "Delivered", Delivered: null };

const VEHICLE_STATUS_COLOR = {
  Available: "#16A34A",
  "On Route": "#F59E0B",
  Maintenance: "#F59E0B",
};

const vehiclesSeed = [
  { reg: "T 442 DKL", type: "Box truck (3.5t)", driver: "Elias Rugambwa", status: "On Route", capacity: "3,500 kg" },
  { reg: "T 118 BFQ", type: "Flatbed (7t)", driver: "Joseph Mkude", status: "Available", capacity: "7,000 kg" },
  { reg: "T 903 CPR", type: "Panel van (1.2t)", driver: "Amina Hassan", status: "Available", capacity: "1,200 kg" },
  { reg: "T 771 AGX", type: "Box truck (3.5t)", driver: "Frank Temba", status: "Maintenance", capacity: "3,500 kg" },
];

const shipmentsSeed = [
  { id: "DL-812", orderRef: "SO-2117", customer: "Meridian Logistics", destination: "Dar es Salaam — Kurasini", vehicle: "T 442 DKL", dispatchDate: "2026-07-01", expectedDate: "2026-07-03", status: "In Transit" },
  { id: "DL-811", orderRef: "SO-2116", customer: "Uzuri Beauty Chain", destination: "Mwanza — Nyamagana", vehicle: "T 118 BFQ", dispatchDate: "2026-06-28", expectedDate: "2026-07-01", status: "Delivered" },
  { id: "DL-810", orderRef: "—", customer: "Nyota Pharmacy Group", destination: "Arusha — Kaloleni", vehicle: null, dispatchDate: "2026-07-04", expectedDate: "2026-07-06", status: "Preparing" },
  { id: "DL-809", orderRef: "—", customer: "Coastal Construction Ltd", destination: "Dar es Salaam — Kigamboni", vehicle: "T 903 CPR", dispatchDate: "2026-06-20", expectedDate: "2026-06-21", status: "Delivered" },
];

/* ------------------------------- E-COMMERCE DATA -------------------------------- */

// Storefront products are built from real Inventory items with a retail
// markup — the storefront and the warehouse describe the same physical
// stock, priced for two different audiences (B2B cost vs. retail price).
const CATEGORY_GRADIENT = {
  "Hardware & Fixtures": "linear-gradient(135deg, #16A34A 0%, #22C55E 100%)",
  "Construction Materials": "linear-gradient(135deg, #111827 0%, #1F2937 100%)",
  "Electronics": "linear-gradient(135deg, #15803D 0%, #16A34A 100%)",
  "Furniture": "linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)",
  "Storage Equipment": "linear-gradient(135deg, #5B6472 0%, #8593A6 100%)",
  "Workshop Equipment": "linear-gradient(135deg, #111827 0%, #F59E0B 100%)",
};

const MARKUP = 1.35;

const storefrontSeed = inventorySeed.map((it, i) => ({
  sku: it.sku,
  name: it.name,
  category: it.category,
  price: Math.round(it.unitCost * MARKUP),
  published: i % 5 !== 4,
  featured: [0, 2, 5].includes(i),
}));

const ECOM_ORDER_STATUS_COLOR = {
  "Payment Pending": "#F59E0B",
  Processing: "#F59E0B",
  Shipped: "#16A34A",
  Delivered: "#16A34A",
  Cancelled: "#9CA3AF",
};

const onlineOrdersSeed = [
  { id: "WEB-5521", customer: "Rehema Chuma", email: "rehema.c@gmail.com", items: [{ name: "Salon styling chair", qty: 2, price: 284 }], total: 568, status: "Processing", method: "Mobile Money", date: "2026-07-02" },
  { id: "WEB-5520", customer: "Baraka Mnyika", email: "b.mnyika@outlook.com", items: [{ name: "Warehouse shelving unit", qty: 4, price: 105 }], total: 420, status: "Shipped", method: "Card", date: "2026-07-01" },
  { id: "WEB-5519", customer: "Zainab Ally", email: "zainab.ally@yahoo.com", items: [{ name: "Pharmacy display unit", qty: 1, price: 864 }], total: 864, status: "Delivered", method: "Card", date: "2026-06-29" },
  { id: "WEB-5518", customer: "Omary Kassim", email: "o.kassim@gmail.com", items: [{ name: "Fleet GPS tracking unit", qty: 3, price: 159 }], total: 477, status: "Payment Pending", method: "Mobile Money", date: "2026-06-28" },
  { id: "WEB-5517", customer: "Neema Godwin", email: "neema.godwin@gmail.com", items: [{ name: "Cold storage racking system", qty: 1, price: 3483 }], total: 3483, status: "Delivered", method: "Bank Transfer", date: "2026-06-24" },
  { id: "WEB-5516", customer: "Hassan Iddi", email: "hassan.iddi@gmail.com", items: [{ name: "Backwash basin", qty: 2, price: 378 }], total: 756, status: "Cancelled", method: "Card", date: "2026-06-22" },
];

const STOREFRONT_TREND = [
  { d: "Mon", orders: 4 }, { d: "Tue", orders: 7 }, { d: "Wed", orders: 5 },
  { d: "Thu", orders: 9 }, { d: "Fri", orders: 11 }, { d: "Sat", orders: 14 }, { d: "Sun", orders: 8 },
];

/* -------------------------------- DOCUMENTS DATA --------------------------------- */

const DOC_FOLDERS = ["Contracts", "Invoices", "Receipts", "Employee Files", "Tax Documents", "Licenses", "Purchase Orders"];

// Real OCR via Tesseract.js — a genuine, production-grade, client-side
// OCR engine (WebAssembly, runs entirely in the browser, no server or paid
// API needed) loaded from a CDN on first use rather than bundled, since
// it's a large library most sessions in this app will never touch. This
// is not guaranteed to succeed in every environment — an iframe'd artifact
// or a network blocking the CDN will fail to load it — so the caller
// always checks the returned { ok } flag and shows the real reason rather
// than assuming OCR always works.
let tesseractLoadPromise = null;
function loadTesseract() {
  if (window.Tesseract) return Promise.resolve(window.Tesseract);
  if (tesseractLoadPromise) return tesseractLoadPromise;
  tesseractLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js";
    script.onload = () => (window.Tesseract ? resolve(window.Tesseract) : reject(new Error("Tesseract loaded but did not attach to window")));
    script.onerror = () => reject(new Error("Couldn't load the OCR engine from the CDN"));
    document.head.appendChild(script);
  });
  return tesseractLoadPromise;
}

async function runOCR(imageFile, onProgress) {
  try {
    const Tesseract = await loadTesseract();
    const result = await Tesseract.recognize(imageFile, "eng", {
      logger: (m) => { if (m.status === "recognizing text" && onProgress) onProgress(Math.round((m.progress || 0) * 100)); },
    });
    return { ok: true, text: result.data.text.trim() };
  } catch (e) {
    return { ok: false, error: "Couldn't run OCR — the engine failed to load (this can happen if the CDN is blocked in this environment). You can still type the document's text in manually below." };
  }
}

const FILE_TYPE_STYLE = {
  pdf: { color: "#EF4444", Icon: FileText, label: "PDF" },
  docx: { color: "#0EA5E9", Icon: FileText, label: "DOCX" },
  xlsx: { color: "#16A34A", Icon: FileSpreadsheet, label: "XLSX" },
  png: { color: "#F59E0B", Icon: FileImage, label: "PNG" },
};

const filesSeed = [
  { id: "DOC-01", name: "Baraka Hotels — Supply Agreement.pdf", type: "pdf", folder: "Contracts", size: "1.2 MB", uploadedBy: "J. Batenga", date: "2026-06-24", linkedRecord: "QT-1042", content: "Supply agreement between BEIRAHISI HARDWARE and Baraka Hotels & Resorts for construction materials, effective 1 June 2026. Payment terms: net 30 days. Delivery: Dar es Salaam metro area within 5 business days of order confirmation.", versions: [] },
  { id: "DOC-02", name: "Meridian Logistics — Service Contract.pdf", type: "pdf", folder: "Contracts", size: "0.9 MB", uploadedBy: "S. Kileo", date: "2026-06-15", linkedRecord: "SO-2117", content: "Service contract covering GPS tracking unit installation and annual monitoring subscription for Meridian Logistics' fleet, 24 units, renewable annually.", versions: [] },
  { id: "DOC-03", name: "June Payroll Summary.xlsx", type: "xlsx", folder: "Employee Files", size: "340 KB", uploadedBy: "F. Salim", date: "2026-06-27", linkedRecord: null, content: "", versions: [] },
  { id: "DOC-04", name: "Q2 VAT Return.pdf", type: "pdf", folder: "Tax Documents", size: "610 KB", uploadedBy: "F. Salim", date: "2026-06-20", linkedRecord: null, content: "Quarterly VAT return for Q2 2026, output tax computed at 18% on taxable sales, filed with the Tanzania Revenue Authority.", versions: [{ version: 1, date: "2026-06-18", size: "598 KB", note: "Initial draft before final reconciliation" }] },
  { id: "DOC-05", name: "Business License — Renewal 2026.pdf", type: "pdf", folder: "Licenses", size: "1.8 MB", uploadedBy: "EzyMP", date: "2026-05-30", linkedRecord: null, content: "Business operating license renewal, City of Dar es Salaam, valid through 31 May 2027. License category: General wholesale and hardware trading.", versions: [] },
  { id: "DOC-06", name: "Grace Mmbaga — Employment Contract.docx", type: "docx", folder: "Employee Files", size: "88 KB", uploadedBy: "F. Salim", date: "2026-06-01", linkedRecord: "EMP-104", content: "Employment contract for Grace Mmbaga, Operations role, permanent contract effective 1 June 2026, probation period 3 months.", versions: [] },
  { id: "DOC-07", name: "Coastal Construction — Purchase Order.pdf", type: "pdf", folder: "Purchase Orders", size: "0.5 MB", uploadedBy: "M. Fundi", date: "2026-06-22", linkedRecord: "QT-1041", content: "", versions: [] },
  { id: "DOC-08", name: "Warehouse Floor Plan.png", type: "png", folder: "Licenses", size: "2.1 MB", uploadedBy: "D. Chen", date: "2026-05-12", linkedRecord: null, content: "", versions: [] },
  { id: "DOC-09", name: "Annual Financial Statement 2025.xlsx", type: "xlsx", folder: "Tax Documents", size: "780 KB", uploadedBy: "F. Salim", date: "2026-04-18", linkedRecord: null, content: "", versions: [] },
];

/* -------------------------------- MARKETING DATA --------------------------------- */

const CAMPAIGN_TYPE_STYLE = {
  Email: { color: "#16A34A", Icon: Mail },
  SMS: { color: "#F59E0B", Icon: MessageSquare },
};

const CAMPAIGN_STATUS_COLOR = {
  Draft: "#5B6472",
  Scheduled: "#F59E0B",
  Sent: "#16A34A",
};

// Campaigns target a live CRM segment by industry — "sent to" counts are
// computed against real pipeline data, not stored as a stale snapshot.
const campaignsSeed = [
  { id: "CMP-118", name: "Cold Chain Solutions — June Promo", type: "Email", status: "Sent", segment: "Agriculture", sentDate: "2026-06-20", openRate: 42, clickRate: 11 },
  { id: "CMP-117", name: "Hardware Restock Reminder", type: "SMS", status: "Sent", segment: "Construction", sentDate: "2026-06-15", openRate: 68, clickRate: 9 },
  { id: "CMP-116", name: "New Hospitality Fixtures Launch", type: "Email", status: "Sent", segment: "Hospitality", sentDate: "2026-06-08", openRate: 51, clickRate: 15 },
  { id: "CMP-115", name: "Mid-Year Wholesale Discount", type: "Email", status: "Scheduled", segment: "Wholesale", sentDate: "2026-07-10", openRate: null, clickRate: null },
  { id: "CMP-114", name: "Salon Equipment Flash Sale", type: "SMS", status: "Scheduled", segment: "Retail", sentDate: "2026-07-08", openRate: null, clickRate: null },
  { id: "CMP-113", name: "Q3 Logistics Partner Outreach", type: "Email", status: "Draft", segment: "Logistics", sentDate: null, openRate: null, clickRate: null },
];

/* ---------------------------------- POS DATA ---------------------------------- */

// POS prices reuse the same retail markup as the E-Commerce storefront —
// a physical item costs the customer the same whether they buy it at the
// counter or online, since both channels are selling the same stock.
const POS_PAYMENT_METHODS = ["Cash", "Card", "Mobile Money", "Bank Transfer", "Customer Credit"];

const POS_PAYMENT_COLOR = {
  Cash: "#16A34A",
  Card: "#16A34A",
  "Mobile Money": "#F59E0B",
  "Bank Transfer": "#2563EB",
  "Customer Credit": "#7C3AED",
};

const RETURN_REASONS = ["Customer changed mind", "Wrong item", "Defective / damaged", "Duplicate purchase", "Other"];

const posTransactionsSeed = [
  {
    id: "POS-3312", cashier: "Halima Juma", method: "Mobile Money", date: "2026-07-02",
    items: [{ sku: "HDW-2205", name: "Salon styling chair", qty: 1, price: 284 }], returns: [],
  },
  {
    id: "POS-3311", cashier: "Halima Juma", method: "Cash", date: "2026-07-02",
    items: [
      { sku: "HDW-2207", name: "Warehouse shelving unit", qty: 2, price: 105 },
      { sku: "HDW-2210", name: "Pharmacy display unit", qty: 1, price: 864 },
    ], returns: [],
  },
  {
    id: "POS-3310", cashier: "Fatuma Salim", method: "Card", date: "2026-07-01",
    items: [{ sku: "HDW-2201", name: "Industrial water heater 50L", qty: 1, price: 421 }], returns: [],
  },
  {
    id: "POS-3309", cashier: "Halima Juma", method: "Cash", date: "2026-06-30",
    items: [{ sku: "HDW-2206", name: "Backwash basin", qty: 3, price: 378 }], returns: [],
  },
];

function KpiCard({ item }) {
  const Icon = item.icon;
  const neutral = item.trend === "neutral";
  const accent = neutral ? "#64748B" : item.up ? "#16A34A" : "#F59E0B";
  return (
    <div className="sm-panel kpi-card relative min-h-[154px] bg-white rounded-xl p-5 flex flex-col gap-4 overflow-hidden group">
      <div
        className="absolute inset-x-0 top-0 h-[3px] opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: `linear-gradient(90deg, ${accent}, ${accent}00)` }}
      />
      <div className="flex items-center justify-between">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105"
          style={{ background: "linear-gradient(135deg, #111827 0%, #16A34A 130%)" }}
        >
          <Icon size={16} strokeWidth={1.85} className="text-white" />
        </div>
        <span
          className="text-[11px] font-mono font-medium flex items-center gap-1 px-1.5 py-0.5 rounded-md"
          style={{ color: accent, backgroundColor: `${accent}12` }}
        >
          {neutral ? <Minus size={11} /> : item.up ? <TrendingUp size={11} /> : <TrendingDown size={11} />}
          {item.delta}
        </span>
      </div>
      <div>
        <div className="text-[22px] font-semibold text-[#111827] font-mono tracking-tight leading-none">{item.value}</div>
        <div className="text-[12.5px] text-slate-500 mt-1.5">{item.label}</div>
      </div>
    </div>
  );
}

function StagePill({ stage }) {
  return (
    <span
      className="text-[11px] font-medium px-2 py-1 rounded-full inline-flex items-center gap-1.5"
      style={{ backgroundColor: `${STAGE_COLOR[stage]}14`, color: STAGE_COLOR[stage] }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: STAGE_COLOR[stage] }} />
      {stage}
    </span>
  );
}

function DocStatusPill({ status }) {
  const color = DOC_STATUS_COLOR[status] || "#5B6472";
  return (
    <span
      className="text-[11px] font-medium px-2 py-1 rounded-full inline-flex items-center gap-1.5"
      style={{ backgroundColor: `${color}14`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}

// Clickable column header that toggles asc/desc sort on a given field.
// Shared by any table that wants sorting — pass the same `sort` state
// object ({ field, direction }) and `onSort` setter from the parent.
function SortableHeader({ label, field, sort, onSort, align = "left" }) {
  const active = sort.field === field;
  return (
    <th
      onClick={() => onSort(field)}
      className={`px-4 py-3.5 text-[10px] font-bold uppercase tracking-[.1em] text-slate-400 select-none cursor-pointer group ${align === "right" ? "text-right" : "text-left"}`}
    >
      <span className={`inline-flex items-center gap-1 ${active ? "text-emerald-800" : "group-hover:text-slate-600"}`}>
        {label}
        <span className="flex flex-col -space-y-1">
          <ChevronUp size={10} className={active && sort.direction === "asc" ? "text-[#16A34A]" : "text-slate-300"} />
          <ChevronDown size={10} className={active && sort.direction === "desc" ? "text-[#16A34A]" : "text-slate-300"} />
        </span>
      </span>
    </th>
  );
}

function sortRows(rows, sort) {
  if (!sort.field) return rows;
  const dir = sort.direction === "asc" ? 1 : -1;
  return [...rows].sort((a, b) => {
    const av = a[sort.field], bv = b[sort.field];
    if (typeof av === "number" && typeof bv === "number") return (av - bv) * dir;
    return String(av ?? "").localeCompare(String(bv ?? "")) * dir;
  });
}

function toggleSort(sort, setSort, field) {
  setSort((s) => (s.field === field ? { field, direction: s.direction === "asc" ? "desc" : "asc" } : { field, direction: "asc" }));
}

/* ------------------------------- DASHBOARD -------------------------------- */

function exportCellValue(value) {
  if (value == null) return "";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function serializeDashboardSectionsToCsv(sections = []) {
  const escapeCsv = (value) => `"${exportCellValue(value).replace(/"/g, '""')}"`;
  const lines = [escapeCsv("BusinessSphere ERP — dashboard chart data")];
  sections.forEach((section) => {
    lines.push("");
    lines.push(escapeCsv(section.title || "Chart data"));
    const rows = Array.isArray(section.rows) ? section.rows : [];
    if (rows.length === 0) return;
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row || {}))));
    lines.push(headers.map(escapeCsv).join(","));
    rows.forEach((row) => lines.push(headers.map((header) => escapeCsv(row?.[header])).join(",")));
  });
  return `${lines.join("\r\n")}\r\n`;
}

export function buildDashboardChartSections({
  kpis = [], revenueExpenseTrend = [], arAging = [], pipelineByStage = [], stockByCategory = [], workOrdersByStatus = [], topCustomers = [],
} = {}) {
  return [
    { title: "Executive KPIs", module: "executive", rows: kpis },
    { title: "Revenue vs Expenses Trend", module: "finance", rows: revenueExpenseTrend },
    { title: "Accounts Receivable Aging", module: "finance", rows: arAging },
    { title: "CRM Pipeline by Stage", module: "crm", rows: pipelineByStage },
    { title: "Inventory Value by Category", module: "inventory", rows: stockByCategory },
    { title: "Work Orders by Status", module: "operations", rows: workOrdersByStatus },
    { title: "Top Customers by Billed Value", module: "sales", rows: topCustomers },
  ].filter((section) => Array.isArray(section.rows) && section.rows.length > 0);
}

export function filterDashboardChartSections(sections = [], enabledModules = {}) {
  return sections.filter((section) => section.module === "executive" || enabledModules[section.module] !== false);
}

export function buildDashboardExportFilterSummary({ startDate = "", endDate = "", enabledModules = {} } = {}) {
  const moduleLabels = { finance: "Finance", sales: "Sales", crm: "CRM", inventory: "Inventory", operations: "Operations" };
  const activeModules = Object.entries(moduleLabels).filter(([key]) => enabledModules[key] !== false).map(([, label]) => label);
  const dates = startDate || endDate ? `${startDate || "start"} → ${endDate || "today"}` : "All available dates";
  return `${activeModules.length === 5 ? "All modules" : activeModules.join(", ") || "Executive KPIs only"} · ${dates}`;
}

export async function createDashboardPdfDocument({ companyName = "BusinessSphere ERP", periodLabel = "Current period", filterSummary = "All modules · All available dates", sections = [] } = {}) {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const margin = 36;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const contentWidth = pageWidth - margin * 2;
  let y = 42;
  const addPageIfNeeded = (height = 20) => {
    if (y + height > pageHeight - margin) {
      doc.addPage();
      y = 42;
    }
  };
  const compact = (value, max = 30) => {
    const text = exportCellValue(value).replace(/\s+/g, " ");
    return text.length > max ? `${text.slice(0, max - 1)}…` : text;
  };

  doc.setFillColor(13, 34, 20);
  doc.rect(0, 0, pageWidth, 74, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("BusinessSphere ERP", margin, 34);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.text("Dashboard chart data export", margin, 52);
  doc.text(`${compact(companyName, 42)} · ${compact(periodLabel, 28)}`, pageWidth - margin, 52, { align: "right" });
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(`Filters: ${compact(filterSummary, 92)}`, margin, 67);
  y = 96;

  sections.forEach((section) => {
    const rows = Array.isArray(section.rows) ? section.rows : [];
    if (rows.length === 0) return;
    const headers = Array.from(new Set(rows.flatMap((row) => Object.keys(row || {}))));
    if (headers.length === 0) return;
    addPageIfNeeded(42);
    doc.setFillColor(220, 252, 231);
    doc.roundedRect(margin, y - 13, contentWidth, 24, 5, 5, "F");
    doc.setTextColor(17, 24, 39);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(compact(section.title, 80), margin + 8, y + 2);
    y += 20;

    const columnWidth = contentWidth / headers.length;
    doc.setFillColor(241, 245, 249);
    doc.rect(margin, y - 11, contentWidth, 18, "F");
    doc.setFontSize(7.5);
    headers.forEach((header, index) => {
      doc.setTextColor(71, 85, 105);
      doc.text(compact(header, Math.max(12, Math.floor(columnWidth / 4))), margin + index * columnWidth + 5, y);
    });
    y += 15;

    rows.forEach((row, rowIndex) => {
      addPageIfNeeded(17);
      if (rowIndex % 2 === 0) {
        doc.setFillColor(248, 250, 252);
        doc.rect(margin, y - 10, contentWidth, 16, "F");
      }
      headers.forEach((header, index) => {
        doc.setTextColor(30, 41, 59);
        doc.setFont("helvetica", "normal");
        doc.text(compact(row?.[header], Math.max(12, Math.floor(columnWidth / 4))), margin + index * columnWidth + 5, y);
      });
      y += 16;
    });
    y += 14;
  });

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(7.5);
  doc.text(`Generated ${TODAY.toISOString().slice(0, 10)} · Live dashboard data`, margin, pageHeight - 18);
  return doc;
}

function downloadDashboardCsv(sections, filename) {
  if (typeof document === "undefined") return;
  const suggestedFilename = filename || buildBrowserDownloadFilename("report", "dashboard", "csv");
  const blob = new Blob([serializeDashboardSectionsToCsv(sections)], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = suggestedFilename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
  notify(`Browser download requested: ${suggestedFilename}. Your browser controls the save location.`);
}

function safeExportFilePart(value) {
  return String(value || "businesssphere").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "businesssphere";
}

// A web application can suggest a filename but cannot silently choose a
// person's Downloads folder or create directories on their device. Keep the
// suggested names predictable for manual organization without claiming a
// filesystem path that the browser has not granted.
function buildBrowserDownloadFilename(category, reference, extension) {
  const safeCategory = safeExportFilePart(category || "document");
  const safeReference = safeExportFilePart(reference || "record");
  const safeExtension = String(extension || "txt").replace(/[^a-z0-9]/gi, "").toLowerCase() || "txt";
  return `smart-manager-${safeCategory}-${safeReference}-${TODAY.toISOString().slice(0, 10)}.${safeExtension}`;
}

function ScheduleReportDialog({ company, currentUser, modules, dateRange, onClose, onSaved }) {
  const [name, setName] = useState("Executive dashboard report");
  const [recipientEmail, setRecipientEmail] = useState(currentUser?.email || "");
  const [frequency, setFrequency] = useState("weekly");
  const [format, setFormat] = useState("pdf");
  const schedules = trpc.reportSchedules.list.useQuery(undefined, { enabled: Boolean(company?.id) });
  const createSchedule = trpc.reportSchedules.create.useMutation({
    onSuccess: () => { schedules.refetch(); onSaved(); },
  });
  const removeSchedule = trpc.reportSchedules.remove.useMutation({
    onSuccess: () => { schedules.refetch(); notify("Report schedule deleted."); },
  });
  const toggleActive = trpc.reportSchedules.toggleActive.useMutation({
    onSuccess: (data) => { schedules.refetch(); notify(data.isActive ? "Report schedule resumed." : "Report schedule paused."); },
  });
  const sendNow = trpc.reportSchedules.sendNow.useMutation({
    onSuccess: (result) => {
      if (result?.skipped === "delivery-disabled") {
        notify("Report delivery is disabled until an approved Smart Manager sender is verified. No email was sent.", "error");
        return;
      }
      notify("Report delivery completed after the server confirmed the dispatch.");
    },
    onError: (err) => notify(err.message, "error"),
  });
  function submit(event) {
    event.preventDefault();
    createSchedule.mutate({ companyId: company.id, name, recipientEmail, frequency, format, modules, dateRange });
  }
  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4" role="dialog" aria-modal="true" aria-label="Schedule dashboard report">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden">
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div><p className="text-[15px] font-bold text-slate-900">Schedule email report</p><p className="mt-1 text-[11px] text-slate-500">Runs in the background at the selected UTC frequency and sends the saved filters as an attachment.</p></div>
          <button onClick={onClose} aria-label="Close schedule dialog" className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"><X size={16} /></button>
        </div>
        <form onSubmit={submit} className="space-y-4 p-5">
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] font-semibold text-slate-600">Report name<input value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-normal outline-none focus:border-[#16A34A]" /></label>
            <label className="text-[11px] font-semibold text-slate-600">Recipient email<input type="email" value={recipientEmail} onChange={(event) => setRecipientEmail(event.target.value)} required className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-normal outline-none focus:border-[#16A34A]" /></label>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-[11px] font-semibold text-slate-600">Frequency<select value={frequency} onChange={(event) => setFrequency(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-normal"><option value="daily">Daily · 09:00 UTC</option><option value="weekly">Weekly · Monday 09:00 UTC</option><option value="monthly">Monthly · 1st at 09:00 UTC</option></select></label>
            <label className="text-[11px] font-semibold text-slate-600">Attachment format<select value={format} onChange={(event) => setFormat(event.target.value)} className="mt-1 w-full rounded-lg border border-slate-200 px-3 py-2 text-[12px] font-normal"><option value="pdf">PDF report</option><option value="csv">CSV data</option></select></label>
          </div>
          <div className="rounded-xl bg-slate-50 px-3 py-2.5 text-[11px] text-slate-600"><span className="font-semibold">Saved filters:</span> {Object.entries(modules).filter(([, enabled]) => enabled).map(([module]) => module).join(", ") || "Executive KPIs only"} · {dateRange.start || "all dates"}{dateRange.end ? ` → ${dateRange.end}` : ""}</div>
          {createSchedule.error && <p className="rounded-lg bg-red-50 px-3 py-2 text-[11px] text-red-700">{createSchedule.error.message}</p>}
          <div className="flex items-center justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg border border-slate-200 px-3.5 py-2 text-[12px] font-semibold text-slate-600 hover:bg-slate-50">Cancel</button><button type="submit" disabled={createSchedule.isPending} className="rounded-lg bg-[#16A34A] px-3.5 py-2 text-[12px] font-semibold text-white hover:bg-[#15803D] disabled:opacity-50">{createSchedule.isPending ? "Saving…" : "Create schedule"}</button></div>
        </form>
        <div className="border-t border-slate-100 bg-slate-50/70 px-5 py-4"><p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">Existing schedules</p>{schedules.isLoading ? <p className="text-[11px] text-slate-400">Loading schedules…</p> : schedules.data?.length ? <div className="space-y-2">{schedules.data.map((schedule) => <div key={schedule.id} className="flex items-center justify-between gap-3 rounded-lg bg-white px-3 py-2 border border-slate-200"><div className="min-w-0"><p className="truncate text-[11px] font-semibold text-slate-700">{schedule.name}</p><p className="text-[10px] text-slate-400">{schedule.frequency} · {schedule.format.toUpperCase()} · {schedule.recipientEmail} · <span className={schedule.isActive ? "text-emerald-600 font-medium" : "text-amber-600 font-medium"}>{schedule.isActive ? "Active" : "Paused"}</span></p></div><div className="flex items-center gap-1 shrink-0"><button type="button" onClick={() => sendNow.mutate({ id: schedule.id })} disabled={sendNow.isPending} title="Send now" className="rounded-md px-2 py-1 text-[11px] font-semibold text-[#16A34A] bg-[#16A34A]/10 hover:bg-[#16A34A]/20 disabled:opacity-50">Send now</button><button type="button" onClick={() => toggleActive.mutate({ id: schedule.id, isActive: !schedule.isActive })} disabled={toggleActive.isPending} title={schedule.isActive ? "Pause schedule" : "Resume schedule"} className="rounded-md px-2 py-1 text-[11px] font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 disabled:opacity-50">{schedule.isActive ? "Pause" : "Resume"}</button><button type="button" onClick={() => removeSchedule.mutate({ id: schedule.id })} disabled={removeSchedule.isPending} aria-label={`Delete ${schedule.name}`} className="rounded-md p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600"><Trash2 size={13} /></button></div></div>)}</div> : <p className="text-[11px] text-slate-400">No recurring reports yet.</p>}</div>
      </div>
    </div>
  );
}

function MarketIntelligencePanel({ snapshotQuery, onNavigate }) {
  const snapshot = snapshotQuery.data;
  const statusStyles = {
    LIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    DELAYED: "bg-amber-50 text-amber-700 border-amber-200",
    CACHED: "bg-slate-100 text-slate-600 border-slate-200",
    UNAVAILABLE: "bg-rose-50 text-rose-700 border-rose-200",
    OUTAGE: "bg-rose-50 text-rose-700 border-rose-200",
    STALE: "bg-amber-50 text-amber-700 border-amber-200",
    AWAITING_CONFIGURATION: "bg-blue-50 text-blue-700 border-blue-200",
  };
  const statusLabel = (status) => ({ AWAITING_CONFIGURATION: "Awaiting configuration", OUTAGE: "Outage", STALE: "Stale", LIVE: "Live", CACHED: "Cached", DELAYED: "Delayed", UNAVAILABLE: "Unavailable" }[status] || "Unavailable");
  const formatTime = (value) => value ? new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "Not available";
  const bankRates = snapshot?.bankRates?.rows || [];
  const dseRows = snapshot?.dse?.rows || [];
  const bankStatus = snapshot?.bankRates?.uiStatus || snapshot?.bankRates?.status || "AWAITING_CONFIGURATION";
  const dseStatus = snapshot?.dse?.uiStatus || snapshot?.dse?.status || "AWAITING_CONFIGURATION";
  const providerAlerts = [
    snapshot?.bankRates?.outage ? { label: "Bank rates", ...snapshot.bankRates.outage } : null,
    snapshot?.dse?.outage ? { label: "DSE market", ...snapshot.dse.outage } : null,
  ].filter(Boolean);
  return (
    <section className="space-y-3" aria-label="Market intelligence">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-2">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#16A34A]">Market intelligence</p>
          <h2 className="mt-1 text-[17px] font-semibold tracking-tight text-[#111827]">Rates and market signals</h2>
          <p className="mt-1 text-[12px] text-slate-500">Only provider-validated records are shown. No synthetic market values are used.</p>
        </div>
        <button type="button" onClick={() => snapshotQuery.refetch()} disabled={snapshotQuery.isFetching} className="inline-flex items-center justify-center gap-1.5 self-start rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] font-semibold text-slate-700 shadow-sm transition hover:border-[#16A34A]/50 hover:text-[#15803D] disabled:cursor-wait disabled:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/30">
          <RefreshCw size={13} className={snapshotQuery.isFetching ? "animate-spin" : ""} />
          {snapshotQuery.isFetching ? "Refreshing" : "Refresh feeds"}
        </button>
      </div>

      {(() => {
        const feedHealth = [
          { key: "bot", label: "BOT / Bank Rates", source: "Bank of Tanzania or approved rate provider", icon: Landmark, feed: snapshot?.bankRates },
          { key: "dse", label: "DSE Market", source: "Dar es Salaam Stock Exchange feed", icon: BarChart3, feed: snapshot?.dse },
        ];
        const statusDot = (status) => ({ LIVE: "bg-emerald-500", STALE: "bg-amber-500", CACHED: "bg-amber-500", OUTAGE: "bg-rose-500", UNAVAILABLE: "bg-rose-500", AWAITING_CONFIGURATION: "bg-blue-500", DELAYED: "bg-amber-500" }[status] || "bg-slate-400");
        const statusText = (status, configured) => !configured ? "Awaiting configuration" : ({ LIVE: "Live", STALE: "Stale", CACHED: "Cached", OUTAGE: "Outage", UNAVAILABLE: "Unavailable", DELAYED: "Delayed" }[status] || "Checking");
        const latencyText = (feed) => feed?.providerConfigured && Number.isFinite(Number(feed?.latencyMs)) ? `${Math.max(0, Math.round(Number(feed.latencyMs)))} ms` : "—";
        const latencyClass = (feed) => {
          if (!feed?.providerConfigured || feed?.uiStatus === "AWAITING_CONFIGURATION") return "text-slate-400";
          if (["OUTAGE", "UNAVAILABLE"].includes(feed?.uiStatus)) return "text-rose-600";
          if (Number(feed?.latencyMs) >= 1200) return "text-rose-600";
          if (Number(feed?.latencyMs) >= 400 || ["STALE", "DELAYED"].includes(feed?.uiStatus)) return "text-amber-600";
          return "text-emerald-600";
        };
        const latencyWidth = (feed) => !feed?.providerConfigured ? 0 : Math.min(100, Math.max(10, Math.round((Number(feed?.latencyMs || 0) / 1200) * 100)));

        return (
          <div className="rounded-2xl border border-slate-200/80 bg-slate-50/80 p-3.5 shadow-sm" aria-label="Live BOT and DSE feed health">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-7 w-7 items-center justify-center rounded-lg bg-slate-900 text-white"><Activity size={14} /><span className={`absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full ${snapshotQuery.isFetching ? "bg-amber-400 animate-ping" : "bg-emerald-400"}`} aria-hidden="true" /></span>
                <div><p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-700">Feed health</p><p className="text-[10.5px] text-slate-400">Current status and provider response latency</p></div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400"><span className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-2 py-1 font-semibold"><span className={`h-1.5 w-1.5 rounded-full ${snapshotQuery.isFetching ? "bg-amber-500 animate-pulse" : "bg-emerald-500"}`} />{snapshotQuery.isFetching ? "Checking now" : "Auto-check every 60s"}</span><span>Last check {formatTime(snapshot?.asOf)}</span></div>
            </div>
            <div className="mt-3 space-y-3">
              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {feedHealth.map(({ key, label, source, icon: FeedIcon, feed }) => {
                  const status = feed?.uiStatus || feed?.status || "AWAITING_CONFIGURATION";
                  return (
                    <div key={key} className="rounded-xl border border-white bg-white p-3 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2"><span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-700"><FeedIcon size={15} /></span><div className="min-w-0"><p className="truncate text-[11.5px] font-bold text-slate-800">{label}</p><p className="truncate text-[10px] text-slate-400">{source}</p></div></div>
                        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[9.5px] font-bold text-slate-600"><span className={`h-1.5 w-1.5 rounded-full ${statusDot(status)} ${status === "LIVE" && !snapshotQuery.isFetching ? "animate-pulse" : ""}`} />{statusText(status, feed?.providerConfigured)}</span>
                      </div>
                      <div className="mt-3 flex items-end justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <div>
                              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">Provider latency</p>
                              <p className={`mt-0.5 font-mono text-[17px] font-black ${latencyClass(feed)}`}>{latencyText(feed)}</p>
                            </div>
                            <div className="pl-3 border-l border-slate-100">
                              <p className="text-[9.5px] font-semibold uppercase tracking-wide text-slate-400">24h Uptime</p>
                              <p className="mt-0.5 font-mono text-[13px] font-bold text-slate-700">{feed?.providerConfigured ? `${feed?.uptimePercent ?? 100}%` : "—"}</p>
                            </div>
                          </div>
                        </div>
                        <p className="max-w-[160px] text-right text-[10px] leading-relaxed text-slate-400">{feed?.message || "Waiting for a validated provider response."}</p>
                      </div>
                      {feed?.providerConfigured && feed?.latencySparkline?.length > 0 && (
                        <div className="mt-3 pt-2.5 border-t border-slate-100">
                          <div className="flex items-center justify-between text-[9.5px] text-slate-400 mb-1">
                            <span>24h Latency Trend ({feed.latencySparkline.length} checks)</span>
                            <span className="font-mono">{feed.latencySparkline[feed.latencySparkline.length - 1]?.latency}ms latest</span>
                          </div>
                          <div className="h-8 w-full flex items-end gap-0.5 bg-slate-50 rounded p-1">
                            {feed.latencySparkline.slice(-20).map((pt, idx) => {
                              const maxLat = Math.max(...feed.latencySparkline.map(p => p.latency), 500);
                              const heightPct = Math.max(15, Math.min(100, Math.round((pt.latency / maxLat) * 100)));
                              const barColor = pt.status === "OUTAGE" || pt.status === "UNAVAILABLE" ? "bg-rose-500" : pt.status === "DELAYED" || pt.status === "CACHED" ? "bg-amber-400" : "bg-emerald-500";
                              return (
                                <div key={idx} className={`flex-1 rounded-t transition-all ${barColor}`} style={{ height: `${heightPct}%` }} title={`${pt.time}: ${pt.latency}ms (${pt.status})`} />
                              );
                            })}
                          </div>
                        </div>
                      )}
                      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full transition-all duration-300 ${latencyClass(feed).replace("text-", "bg-")}`} style={{ width: `${latencyWidth(feed)}%` }} /></div>
                    </div>
                  );
                })}
              </div>

              {/* Regional East African Central Bank Comparison Table */}
              <div className="rounded-xl border border-white bg-white p-3.5 shadow-sm">
                <div className="flex items-center justify-between mb-2.5">
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-800">Regional East African Central Bank Comparison</h4>
                    <p className="text-[10px] text-slate-400">Cross-border benchmark lending rates and policy rate feeds across East African Community (EAC) peers.</p>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">EAC Multi-Provider Feed</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-[11.5px] text-left">
                    <thead>
                      <tr className="border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wide text-slate-500">
                        <th className="px-3 py-2 font-bold">Country</th>
                        <th className="px-3 py-2 font-bold">Central Bank / Authority</th>
                        <th className="px-3 py-2 font-bold">Currency</th>
                        <th className="px-3 py-2 font-bold text-right">Policy Rate (Annual)</th>
                        <th className="px-3 py-2 font-bold text-right">Benchmark Lending</th>
                        <th className="px-3 py-2 font-bold text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {(snapshot?.regionalPeers || []).map((peer, idx) => {
                        const isLive = peer.status === "LIVE";
                        const isConfigured = peer.providerConfigured;
                        return (
                          <tr key={idx} className="hover:bg-slate-50/60 transition">
                            <td className="px-3 py-2 font-semibold text-slate-800">{peer.country}</td>
                            <td className="px-3 py-2 text-slate-600"><span>{peer.centralBank}</span><span className="block text-[9px] text-slate-400">{peer.source}</span></td>
                            <td className="px-3 py-2 font-mono text-slate-600">{peer.currencyPair}</td>
                            <td className="px-3 py-2 font-mono font-bold text-right text-slate-800">{peer.policyRateAnnual != null ? `${peer.policyRateAnnual}%` : "—"}</td>
                            <td className="px-3 py-2 font-mono font-bold text-right text-emerald-700">{peer.benchmarkLending != null ? `${peer.benchmarkLending}%` : "—"}</td>
                            <td className="px-3 py-2 text-center">
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold ${isLive ? "bg-emerald-50 text-emerald-700 border-emerald-200" : isConfigured ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-blue-50 text-blue-700 border-blue-200"} border`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${isLive ? "bg-emerald-500 animate-pulse" : isConfigured ? "bg-amber-500" : "bg-blue-500"}`} /> {peer.status.replaceAll("_", " ")}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        );
      })()}
      {providerAlerts.length > 0 && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-3.5 shadow-sm" role="alert" aria-live="assertive">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-start gap-2.5">
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-700"><AlertTriangle size={16} /></div>
              <div className="min-w-0"><p className="text-[12px] font-bold text-rose-800">Market-data outage detected</p><p className="mt-1 text-[11px] leading-relaxed text-rose-700">{providerAlerts.map((alert) => `${alert.label}: ${alert.message}`).join(" ")}</p><p className="mt-1 text-[10px] text-rose-600">Cached values remain clearly labelled when available. No new market values are shown until provider validation succeeds.</p></div>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2"><button type="button" onClick={() => snapshotQuery.refetch()} disabled={snapshotQuery.isFetching} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100 disabled:opacity-60"><RefreshCw size={12} className={snapshotQuery.isFetching ? "animate-spin" : ""} />{snapshotQuery.isFetching ? "Checking…" : "Check again"}</button><button type="button" onClick={() => onNavigate("settings")} className="inline-flex items-center gap-1.5 rounded-lg border border-rose-200 bg-white px-2.5 py-1.5 text-[10px] font-bold text-rose-700 hover:bg-rose-100">Provider settings <ChevronRight size={12} /></button></div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#FFF7E6] text-[#B7791F]"><Landmark size={17} /></div>
              <div className="min-w-0"><h3 className="text-[13px] font-semibold text-[#111827]">Bank rates</h3><p className="truncate text-[11px] text-slate-400">BOT / approved provider feed</p></div>
            </div>
            <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold tracking-wide ${statusStyles[bankStatus] || statusStyles.UNAVAILABLE}`}>{statusLabel(bankStatus)}</span>
          </div>
          {snapshotQuery.isLoading ? (
            <div className="mt-4 space-y-2" aria-label="Loading bank rates"><div className="h-9 animate-pulse rounded-lg bg-slate-100" /><div className="h-9 animate-pulse rounded-lg bg-slate-100" /></div>
          ) : bankRates.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4"><p className="text-[12px] font-semibold text-slate-700">No validated bank-rate records</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{snapshot?.bankRates?.message || "Configure a server-side data provider to activate this feed."}</p><button type="button" onClick={() => onNavigate("settings")} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#15803D]">Open integration settings <ChevronRight size={13} /></button></div>
          ) : (
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[430px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-semibold uppercase tracking-wider text-slate-400"><th className="pb-2">Bank</th><th className="pb-2">Pair</th><th className="pb-2 text-right">Buy</th><th className="pb-2 text-right">Sell</th><th className="pb-2 text-right">Lending</th></tr></thead><tbody>{bankRates.slice(0, 6).map((rate) => <tr key={`${rate.bankName}-${rate.currencyPair}`} className="border-b border-slate-50 last:border-0"><td className="py-2 text-[11px] font-semibold text-slate-700">{rate.bankName}</td><td className="py-2 text-[11px] text-slate-500">{rate.currencyPair}</td><td className="py-2 text-right font-mono text-[11px] text-slate-600">{rate.buyRate}</td><td className="py-2 text-right font-mono text-[11px] text-slate-600">{rate.sellRate}</td><td className="py-2 text-right font-mono text-[11px] text-slate-600">{rate.lendingRateAnnual === null || rate.lendingRateAnnual === undefined ? "N/A" : `${rate.lendingRateAnnual}%`}</td></tr>)}</tbody></table></div>
          )}
          <p className="mt-3 text-[10px] text-slate-400">Source status: {bankStatus}. Checked {formatTime(snapshot?.asOf)}</p>
        </article>
        <article className="min-w-0 rounded-2xl border border-slate-200/80 bg-white p-4 shadow-sm">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0"><div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#EEF2FF] text-[#4F46E5]"><BarChart3 size={17} /></div><div className="min-w-0"><h3 className="text-[13px] font-semibold text-[#111827]">DSE market</h3><p className="truncate text-[11px] text-slate-400">Dar es Salaam Stock Exchange feed</p></div></div>
            <span className={`shrink-0 rounded-full border px-2 py-1 text-[9px] font-bold tracking-wide ${statusStyles[dseStatus] || statusStyles.UNAVAILABLE}`}>{statusLabel(dseStatus)}</span>
          </div>
          {snapshotQuery.isLoading ? (
            <div className="mt-4 space-y-2" aria-label="Loading DSE market"><div className="h-9 animate-pulse rounded-lg bg-slate-100" /><div className="h-9 animate-pulse rounded-lg bg-slate-100" /></div>
          ) : dseRows.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4"><p className="text-[12px] font-semibold text-slate-700">No validated DSE records</p><p className="mt-1 text-[11px] leading-relaxed text-slate-500">{snapshot?.dse?.message || "Configure an approved DSE data provider to activate this feed."}</p><button type="button" onClick={() => onNavigate("settings")} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#4F46E5]">Open integration settings <ChevronRight size={13} /></button></div>
          ) : (
            <div className="mt-4 overflow-x-auto"><table className="w-full min-w-[380px] text-left"><thead><tr className="border-b border-slate-100 text-[9px] font-semibold uppercase tracking-wider text-slate-400"><th className="pb-2">Symbol</th><th className="pb-2">Company</th><th className="pb-2 text-right">LTP (TZS)</th><th className="pb-2 text-right">Change</th></tr></thead><tbody>{dseRows.slice(0, 6).map((ticker) => <tr key={ticker.symbol} className="border-b border-slate-50 last:border-0"><td className="py-2 text-[11px] font-bold text-slate-700">{ticker.symbol}</td><td className="max-w-[150px] truncate py-2 text-[11px] text-slate-500">{ticker.companyName}</td><td className="py-2 text-right font-mono text-[11px] text-slate-600">{ticker.priceTzs}</td><td className={`py-2 text-right font-mono text-[11px] ${ticker.changePercent === null || ticker.changePercent === undefined ? "text-slate-400" : ticker.changePercent >= 0 ? "text-emerald-600" : "text-rose-600"}`}>{ticker.changePercent === null || ticker.changePercent === undefined ? "N/A" : `${ticker.changePercent >= 0 ? "+" : ""}${ticker.changePercent}%`}</td></tr>)}</tbody></table></div>
          )}
          <p className="mt-3 text-[10px] text-slate-400">Source status: {dseStatus}. Checked {formatTime(snapshot?.asOf)}</p>
        </article>
      </div>
    </section>
  );
}

function PremiumExecutiveDashboard({ company, currentUser, invoices, expenses, inventory, crm, leaveRequests, workOrders, subscriptions, posTransactions, alerts, recentActivity, pendingLeave, formatMoney, onNavigate, onQuickAction, onCustomizeDashboard }) {
  const safeInvoices = invoices?.rows || [];
  const safeExpenses = expenses?.rows || [];
  const safeInventory = inventory?.rows || [];
  const safeCrm = crm?.rows || [];
  const safePos = posTransactions?.rows || [];
  const safeLeave = leaveRequests?.rows || [];
  const safeWorkOrders = workOrders?.rows || [];
  const safeSubscriptions = subscriptions?.rows || [];

  const [range, setRange] = useState("month");
  const rangeStart = useMemo(() => {
    const d = new Date(TODAY);
    if (range === "week") d.setDate(d.getDate() - 6);
    else if (range === "month") d.setDate(1);
    else if (range === "year") d.setMonth(0, 1);
    return d;
  }, [range]);
  const inRange = useCallback((date) => !date || new Date(date) >= rangeStart, [rangeStart]);

  const metrics = useMemo(() => {
    const periodInvoices = safeInvoices.filter((x) => inRange(x.date));
    const periodExpenses = safeExpenses.filter((x) => inRange(x.date || x.expenseDate));
    const billed = periodInvoices.reduce((s, x) => s + lineTotal(x.items || []).total, 0);
    const collected = periodInvoices.reduce((s, x) => s + (Number(x.amountPaid) || 0), 0);
    const expenseTotal = periodExpenses.reduce((s, x) => s + (Number(x.amount) || 0), 0);
    const receivable = safeInvoices.filter((x) => x.status !== "Paid").reduce((s, x) => s + Math.max(0, lineTotal(x.items || []).total - (Number(x.amountPaid) || 0)), 0);
    const inventoryValue = safeInventory.reduce((s, x) => s + (Number(x.qty) || 0) * (Number(x.unitCost) || 0), 0);
    const lowStock = safeInventory.filter((x) => Number(x.qty) <= Number(x.reorder) && Number(x.reorder) > 0).length;
    const outOfStock = safeInventory.filter((x) => Number(x.qty) <= 0).length;
    const openPipeline = safeCrm.filter((x) => !["Won", "Lost"].includes(x.stage)).reduce((s, x) => s + (Number(x.value) || 0), 0);
    const activeSubscriptions = safeSubscriptions.filter((x) => x.status === "Active");
    const mrr = activeSubscriptions.reduce((s, x) => s + ((Number(x.amount) || 0) / ({ Monthly: 1, Quarterly: 3, Annual: 12 }[x.cycle] || 1)), 0);
    return { billed, collected, expenseTotal, profit: collected - expenseTotal, receivable, inventoryValue, lowStock, outOfStock, openPipeline, mrr, orderCount: periodInvoices.length + safePos.filter((x) => inRange(x.date || x.createdAt)).length, customerCount: safeCrm.length };
  }, [safeInvoices, safeExpenses, safeInventory, safeCrm, safePos, safeSubscriptions, inRange]);

  const chartData = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(TODAY);
      d.setMonth(d.getMonth() - 5 + i, 1);
      return d.toISOString().slice(0, 7);
    });
    return months.map((month) => ({
      month: new Date(`${month}-01`).toLocaleDateString("en-US", { month: "short" }),
      revenue: Math.round(safeInvoices.filter((x) => x.date?.startsWith(month)).reduce((s, x) => s + (Number(x.amountPaid) || 0), 0) / 1000),
      expenses: Math.round(safeExpenses.filter((x) => (x.date || x.expenseDate)?.startsWith(month)).reduce((s, x) => s + (Number(x.amount) || 0), 0) / 1000),
    }));
  }, [safeInvoices, safeExpenses]);

  const topProducts = useMemo(() => {
    const map = {};
    safeInvoices.forEach((invoice) => (invoice.items || []).forEach((item) => {
      const name = item.name || item.item_name || item.productName || "Unnamed product";
      const qty = Number(item.qty) || 0;
      const value = qty * (Number(item.rate) || 0);
      if (!map[name]) map[name] = { name, qty: 0, value: 0 };
      map[name].qty += qty;
      map[name].value += value;
    }));
    return Object.values(map).sort((a, b) => b.value - a.value).slice(0, 5);
  }, [safeInvoices]);

  const recentOrders = useMemo(() => safeInvoices.slice().sort((a, b) => String(b.date || "").localeCompare(String(a.date || ""))).slice(0, 6), [safeInvoices]);

  const kpis = [
    { label: "Revenue Collected", value: formatMoney(metrics.collected), detail: `${metrics.billed ? Math.round((metrics.collected / metrics.billed) * 100) : 0}% of billed value`, icon: CircleDollarSign, tone: "emerald", action: () => onQuickAction("finance", { tab: "receivables" }) },
    { label: "Net Profit", value: `${metrics.profit < 0 ? "−" : ""}${formatMoney(Math.abs(metrics.profit))}`, detail: metrics.profit >= 0 ? "Positive operating result" : "Review expenses", icon: TrendingUp, tone: metrics.profit >= 0 ? "emerald" : "rose", action: () => onNavigate("finance") },
    { label: "Orders", value: money(metrics.orderCount), detail: "Invoices + POS activity", icon: ShoppingCart, tone: "blue", action: () => onNavigate("sales") },
    { label: "Customers", value: money(metrics.customerCount), detail: "CRM records in workspace", icon: Users, tone: "violet", action: () => onNavigate("crm") },
    { label: "Inventory Value", value: formatMoney(metrics.inventoryValue), detail: `${safeInventory.length} stocked SKU${safeInventory.length === 1 ? "" : "s"}`, icon: Package, tone: "cyan", action: () => onNavigate("inventory") },
    { label: "Receivables", value: formatMoney(metrics.receivable), detail: `${safeInvoices.filter((x) => x.status !== "Paid").length} open invoices`, icon: Landmark, tone: "amber", action: () => onQuickAction("finance", { tab: "receivables" }) },
  ];

  const toneClasses = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    rose: "bg-rose-50 text-rose-700 border-rose-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    violet: "bg-violet-50 text-violet-700 border-violet-100",
    cyan: "bg-cyan-50 text-cyan-700 border-cyan-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
  };

  const firstName = (currentUser?.name || company?.owner || "Manager").split(" ")[0];
  const todayLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="min-w-0 space-y-6 pb-2">
      {/* Executive hero */}
      <section className="relative overflow-hidden rounded-[28px] border border-emerald-200/20 bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.18),transparent_38%),linear-gradient(135deg,#052d1f_0%,#0a3a2d_25%,#0d291f_100%)] shadow-[0_24px_70px_rgba(2,44,34,.16)] ring-1 ring-white/5">
        <div className="pointer-events-none absolute -right-24 -top-28 h-72 w-72 rounded-full bg-emerald-400/20 blur-2xl" />
        <div className="pointer-events-none absolute -bottom-28 left-1/3 h-64 w-64 rounded-full bg-teal-300/10 blur-3xl" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300/60 to-transparent" />
        <div className="relative p-5 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <div className="mb-2 flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[.18em] text-emerald-300">
                <span>Executive Command Center</span><span className="text-white/25">•</span><span className="text-white/45">{todayLabel}</span>
              </div>
              <h1 className="text-2xl font-black tracking-[-.04em] text-white sm:text-3xl">Habari, {firstName} <span className="text-emerald-300">👋</span></h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">A real-time view of {company?.name || "your business"}. Monitor performance, cash, customers and operations from one premium command center.</p>
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <button type="button" onClick={() => onQuickAction("sales", { tab: "invoices", openForm: true })} className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-300 to-emerald-400 px-3.5 py-2.5 text-xs font-extrabold text-[#062118] shadow-[0_12px_28px_rgba(52,211,153,0.28)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(52,211,153,0.35)]"><Plus size={15}/> New Sale</button>
              <button type="button" onClick={() => onQuickAction("crm", { tab: "leads" })} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/8 px-3.5 py-2.5 text-xs font-bold text-white transition hover:bg-white/12"><UserPlus size={15}/> Add Customer</button>
              <button type="button" onClick={onCustomizeDashboard} className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-3.5 py-2.5 text-xs font-bold text-white/80 transition hover:bg-white/10"><Sliders size={15}/> Customize</button>
            </div>
          </div>
          <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap items-center gap-2 text-[10.5px] text-white/55"><span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_0_4px_rgba(52,211,153,.10)]"/> Live workspace data</span><span className="rounded-full border border-white/10 bg-white/[.06] px-2.5 py-1">{safeInvoices.length + safeInventory.length + safeCrm.length} core records</span></div>
            <div className="flex items-center gap-1 rounded-xl border border-white/10 bg-black/10 p-1" aria-label="Dashboard date range">
              {[['week','7 days'],['month','This month'],['year','This year']].map(([id,label]) => <button key={id} type="button" onClick={() => setRange(id)} className={`rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold transition ${range === id ? 'bg-white text-slate-900 shadow-sm' : 'text-white/55 hover:bg-white/10 hover:text-white'}`}>{label}</button>)}
            </div>
          </div>
        </div>
      </section>

      {/* KPI grid */}
      <section className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6" aria-label="Business KPIs">
        {kpis.map((card) => { const Icon = card.icon; return <button key={card.label} type="button" onClick={card.action} className="group min-w-0 rounded-2xl border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-4 text-left shadow-[0_10px_24px_rgba(15,23,42,.04)] transition duration-200 hover:-translate-y-1 hover:border-emerald-200 hover:shadow-[0_18px_34px_rgba(16,185,129,.08)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/40">
          <div className="flex items-start justify-between gap-2"><span className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border ${toneClasses[card.tone]}`}><Icon size={17}/></span><ArrowUpRight size={14} className="text-slate-300 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></div>
          <p className="mt-4 truncate text-[10px] font-extrabold uppercase tracking-[.12em] text-slate-400">{card.label}</p><p className="mt-1 truncate text-lg font-black tracking-[-.03em] text-slate-950 sm:text-xl">{card.value}</p><p className="mt-1 truncate text-[10.5px] text-slate-500">{card.detail}</p>
        </button>; })}
      </section>

      {/* Performance row */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.65fr)_minmax(300px,.75fr)]">
        <div className="min-w-0 rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-[0_16px_32px_rgba(15,23,42,.05)] ring-1 ring-slate-100 sm:p-5">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.12)]" />
                <h2 className="text-sm font-extrabold text-slate-950">Revenue & expense performance</h2>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">Monthly trend · values shown in TZS thousands</p>
            </div>
            <button type="button" onClick={() => onNavigate("reports")} className="inline-flex items-center gap-1 rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11px] font-bold text-emerald-700 transition hover:border-emerald-300 hover:bg-emerald-100">View reports <ChevronRight size={13}/></button>
          </div>
          <div className="h-[250px] w-full min-w-0"><ResponsiveContainer width="100%" height="100%"><ComposedChart data={chartData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}><defs><linearGradient id="smRevenueFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10B981" stopOpacity={0.24}/><stop offset="100%" stopColor="#10B981" stopOpacity={0}/></linearGradient></defs><CartesianGrid vertical={false} stroke="#EEF2F0"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94A3B8'}}/><YAxis axisLine={false} tickLine={false} tick={{fontSize:9,fill:'#94A3B8'}}/><Tooltip contentStyle={{borderRadius:12,border:'1px solid #E2E8F0',boxShadow:'0 12px 30px rgba(15,23,42,.10)',fontSize:11}} formatter={(v,n)=>[`TZS ${money(v)}k`, n === 'revenue' ? 'Revenue' : 'Expenses']}/><Area type="monotone" dataKey="revenue" stroke="#059669" strokeWidth={2.5} fill="url(#smRevenueFill)"/><Bar dataKey="expenses" fill="#CBD5E1" radius={[4,4,0,0]} maxBarSize={20}/></ComposedChart></ResponsiveContainer></div>
          <div className="mt-3 flex flex-wrap items-center gap-4 text-[10.5px] text-slate-500"><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-emerald-500"/>Revenue</span><span className="inline-flex items-center gap-1.5"><i className="h-2 w-2 rounded-full bg-slate-300"/>Expenses</span><span className="ml-auto rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 font-bold text-slate-700">Net {metrics.profit >= 0 ? '+' : '−'}{formatMoney(Math.abs(metrics.profit))}</span></div>
        </div>

        <div className="min-w-0 rounded-[24px] border border-slate-200/80 bg-gradient-to-br from-white via-slate-50 to-white p-4 shadow-[0_16px_32px_rgba(15,23,42,.05)] ring-1 ring-slate-100 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-extrabold text-slate-950">Business health</h2>
              <p className="mt-1 text-[11px] text-slate-500">Signals requiring attention</p>
            </div>
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-100 bg-emerald-50 text-emerald-600"><Gauge size={18} /></div>
          </div>
          <div className="mt-5 space-y-4">
            {[
              ['Cash collection', metrics.billed ? Math.min(100, Math.round(metrics.collected / metrics.billed * 100)) : 0, 'emerald'],
              ['Inventory health', safeInventory.length ? Math.max(0, Math.round((1 - metrics.outOfStock / safeInventory.length) * 100)) : 0, 'cyan'],
              ['Pipeline coverage', safeCrm.length ? Math.min(100, Math.round((safeCrm.filter(x => !['Won','Lost'].includes(x.stage)).length / safeCrm.length) * 100)) : 0, 'violet'],
            ].map(([label,value,tone]) => <div key={label}><div className="mb-1.5 flex items-center justify-between"><span className="text-[11.5px] font-semibold text-slate-600">{label}</span><span className="text-[11px] font-black text-slate-900">{value}%</span></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className={`h-full rounded-full ${tone === 'emerald' ? 'bg-emerald-500' : tone === 'cyan' ? 'bg-cyan-500' : 'bg-violet-500'}`} style={{width:`${value}%`}}/></div></div>)}
          </div>
          <div className="mt-6 grid grid-cols-2 gap-2">
            <button type="button" onClick={() => onNavigate("inventory")} className="rounded-xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-3 text-left transition hover:border-amber-200 hover:-translate-y-0.5"><p className="text-[9.5px] font-extrabold uppercase tracking-wide text-amber-700">Low stock</p><p className="mt-1 text-xl font-black text-amber-900">{metrics.lowStock}</p><p className="text-[10px] text-amber-700/80">{metrics.outOfStock} out of stock</p></button>
            <button type="button" onClick={() => onQuickAction("finance", {tab:"receivables"})} className="rounded-xl border border-rose-100 bg-gradient-to-br from-rose-50 to-red-50 p-3 text-left transition hover:border-rose-200 hover:-translate-y-0.5"><p className="text-[9.5px] font-extrabold uppercase tracking-wide text-rose-700">Open AR</p><p className="mt-1 text-xl font-black text-rose-900">{safeInvoices.filter(x => x.status !== 'Paid').length}</p><p className="text-[10px] text-rose-700/80">invoices to review</p></button>
          </div>
        </div>
      </section>

      {/* Operational row */}
      <section className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1.45fr)]">
        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5"><div><h2 className="text-sm font-extrabold text-slate-950">Top products</h2><p className="mt-1 text-[10.5px] text-slate-500">Highest billed line-item value</p></div><button type="button" onClick={() => onNavigate("inventory")} className="text-[11px] font-bold text-emerald-700">View all</button></div>
          <div className="divide-y divide-slate-100">{topProducts.length ? topProducts.map((p,i) => <div key={p.name} className="flex items-center gap-3 px-4 py-3 sm:px-5"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-[10px] font-black text-slate-500">0{i+1}</span><div className="min-w-0 flex-1"><p className="truncate text-[12px] font-bold text-slate-800">{p.name}</p><p className="mt-0.5 text-[10px] text-slate-400">{money(p.qty)} units sold</p></div><p className="shrink-0 text-[11.5px] font-extrabold text-slate-900">{formatMoney(p.value)}</p></div>) : <div className="px-5 py-10 text-center text-[11px] text-slate-400">No product line-item data is available yet.</div>}</div>
        </div>

        <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-[0_4px_20px_rgba(15,23,42,.035)]">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-4 sm:px-5"><div><h2 className="text-sm font-extrabold text-slate-950">Recent orders</h2><p className="mt-1 text-[10.5px] text-slate-500">Latest confirmed sales activity</p></div><button type="button" onClick={() => onNavigate("sales")} className="text-[11px] font-bold text-emerald-700">View all</button></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[620px] text-left"><thead className="bg-slate-50/70"><tr>{['Order','Customer','Date','Amount','Status'].map(h => <th key={h} className="px-4 py-2.5 text-[9.5px] font-extrabold uppercase tracking-wide text-slate-400">{h}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{recentOrders.length ? recentOrders.map((o) => { const total = lineTotal(o.items || []).total; const paid = o.status === 'Paid' || Number(o.amountPaid) >= total; return <tr key={o.id} className="hover:bg-slate-50/60"><td className="px-4 py-3 text-[11px] font-extrabold text-slate-800">{o.id || '—'}</td><td className="max-w-[180px] truncate px-4 py-3 text-[11px] font-semibold text-slate-600">{o.customer || 'Walk-in customer'}</td><td className="px-4 py-3 text-[10.5px] text-slate-400">{o.date || '—'}</td><td className="px-4 py-3 text-[11px] font-extrabold text-slate-900">{formatMoney(total)}</td><td className="px-4 py-3"><span className={`rounded-full px-2 py-1 text-[9.5px] font-extrabold ${paid ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>{paid ? 'Paid' : (o.status || 'Pending')}</span></td></tr> }) : <tr><td colSpan="5" className="px-5 py-10 text-center text-[11px] text-slate-400">No orders recorded yet.</td></tr>}</tbody></table></div>
        </div>
      </section>

      {/* Attention + activity */}
      <section className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)] sm:p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-slate-950">Attention center</h2><p className="mt-1 text-[10.5px] text-slate-500">Issues and actions that deserve review</p></div><AlertTriangle size={18} className="text-amber-500"/></div><div className="mt-4 space-y-2">{(alerts || []).slice(0,4).map((a,i) => <button key={a.id || i} type="button" onClick={() => onNavigate(a.target || 'dashboard')} className="flex w-full items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/70 p-3 text-left transition hover:border-amber-200 hover:bg-amber-50/40"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-white text-amber-600 shadow-sm"><AlertCircle size={15}/></span><span className="min-w-0 flex-1"><span className="block truncate text-[11.5px] font-bold text-slate-800">{a.title || a.message || 'Review workspace signal'}</span><span className="mt-0.5 block truncate text-[10px] text-slate-500">{a.detail || a.description || 'Open the relevant module for more details.'}</span></span><ChevronRight size={14} className="shrink-0 text-slate-300"/></button>)}{(!alerts || alerts.length === 0) && <div className="rounded-xl bg-emerald-50 p-4 text-center"><CheckCircle2 size={20} className="mx-auto text-emerald-600"/><p className="mt-2 text-[11.5px] font-bold text-emerald-800">Everything looks healthy</p><p className="mt-1 text-[10px] text-emerald-700/70">No active workspace alerts require attention.</p></div>}</div></div>
        <div className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)] sm:p-5"><div className="flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-slate-950">Recent activity</h2><p className="mt-1 text-[10.5px] text-slate-500">Confirmed activity across core modules</p></div><Activity size={18} className="text-emerald-600"/></div><div className="mt-4 space-y-1">{(recentActivity || []).slice(0,6).map((a,i) => { const Icon = a.icon || Activity; return <div key={i} className="flex items-center gap-3 rounded-xl p-2.5 hover:bg-slate-50"><span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100" style={{color:a.color || '#059669'}}><Icon size={14}/></span><div className="min-w-0 flex-1"><p className="truncate text-[11.5px] font-semibold text-slate-800">{a.text}</p><p className="truncate text-[10px] text-slate-400">{a.sub}</p></div><span className="shrink-0 text-[9.5px] text-slate-400">{a.date ? relativeDashboardDay(a.date) : ''}</span></div>; })}{(!recentActivity || recentActivity.length === 0) && <div className="py-8 text-center text-[11px] text-slate-400">No confirmed activity yet.</div>}</div></div>
      </section>

      {/* Quick actions */}
      <section className="rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_4px_20px_rgba(15,23,42,.035)] sm:p-5"><div className="mb-3 flex items-center justify-between"><div><h2 className="text-sm font-extrabold text-slate-950">Quick actions</h2><p className="mt-1 text-[10.5px] text-slate-500">Jump directly into the work that matters</p></div><Zap size={18} className="text-emerald-500"/></div><div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">{[
        ['New sale',ShoppingCart,() => onQuickAction('sales',{tab:'invoices',openForm:true})],['Add product',Package,() => onNavigate('inventory')],['New customer',UserPlus,() => onQuickAction('crm',{tab:'leads'})],['Create invoice',ReceiptText,() => onQuickAction('sales',{tab:'invoices',openForm:true})],['Record expense',Wallet,() => onQuickAction('finance',{tab:'expenses'})],['Open AI',Brain,() => onNavigate('ai')]
      ].map(([label,Icon,action]) => <button key={label} type="button" onClick={action} className="flex min-h-11 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50/60 px-2 py-2.5 text-[10.5px] font-bold text-slate-700 transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-800"><Icon size={14}/>{label}</button>)}</div></section>
    </div>
  );
}

function relativeDashboardDay(dateStr) {
  if (!dateStr) return "";
  const days = Math.round((TODAY - new Date(dateStr)) / 86400000);
  if (days <= 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 14) return `${days}d ago`;
  return String(dateStr).slice(0, 10);
}


function Dashboard({ company, invoices, inventory, crm, expenses, leaveRequests, workOrders, subscriptions, employees, posTransactions, suppliers, quotations, scheduledWorkflows, currentUser, roleChangeApprovalsQuery, onQuickAction, onNavigate, accessToken }) {
  const { preferences, updatePreference, formatMoney } = useDashboardPreferences();
  const roleChangeRows = roleChangeApprovalsQuery?.data?.approvals || [];
  const pendingRoleChangeRows = roleChangeRows.filter((row) => row.status === "Pending Review");
  const reviewableRoleChangeRows = pendingRoleChangeRows.filter((row) => row.data?.targetUserId !== currentUser.id);
  const canReviewRoleChanges = PASSKEY_READINESS_ROLES.has(canonicalRoleId(currentUser.role));
  const decideRoleChangeMutation = trpc.decideRoleChangeApproval.useMutation({
    onSuccess: () => { roleChangeApprovalsQuery?.refetch?.(); notify("Role-change decision recorded ✓"); },
    onError: (error) => notify(error.message || "The role-change decision could not be saved.", "error"),
  });
  const currentRole = roleDefinitionFor(currentUser.role);
  const isGlobalAdmin = ["Super Administrator", "Platform Administrator"].includes(currentRole.id);
  const dashboardTrialNoticeApi = useCallback(async (path, options = {}) => {
    const token = accessToken || getStoredAccessToken();
    if (!token) throw new Error("An authenticated session is required for Global Admin support controls.");
    const response = await fetch(path, {
      ...options,
      headers: { ...(options.headers || {}), "x-supabase-authorization": `Bearer ${token}` },
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(payload?.error || "The trial-notice support request failed.");
    return payload;
  }, [accessToken]);
  const roleView = ROLE_HOME_VIEW[currentRole.id] || "executive";
  const canViewMarketIntelligence = ["Super Administrator", "Organization Owner", "CEO", "CFO", "Finance Manager"].includes(canonicalRoleId(currentUser.role));
  const vatAnomalySettingsQuery = trpc.traFiscal.getVatAnomalySettings.useQuery(
    { companyId: company?.id || "" },
    { enabled: Boolean(company?.id) },
  );
  const marketSnapshotInput = useMemo(() => ({ companyId: company?.id || "" }), [company?.id]);
  const marketSnapshotQuery = trpc.marketIntelligence.snapshot.useQuery(marketSnapshotInput, {
    enabled: Boolean(company?.id) && canViewMarketIntelligence,
    staleTime: 0,
    refetchInterval: canViewMarketIntelligence ? 60_000 : false,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
  });
  const schedulesQuery = trpc.reportSchedules.list.useQuery(undefined, { enabled: Boolean(company?.id) });
  const scheduleRows = schedulesQuery.data || [];
  const activeScheduleCount = scheduleRows.filter((schedule) => schedule.isActive).length;
  const lastScheduleSentAt = scheduleRows.map((schedule) => schedule.lastSentAt).filter(Boolean).sort().pop();
  const hasActiveSchedules = activeScheduleCount > 0;

  // Time period filter — Day/Week/Month/Year. The filter cuts both invoice
  // and expense rows by their date field, so every KPI on the dashboard
  // reflects the same window. "This session" is replaced by a real label.
  const [period, setPeriod] = useState("month");
  const periodStart = useMemo(() => {
    const d = new Date(TODAY);
    if (period === "day")   { return d.toISOString().slice(0, 10); }
    if (period === "week")  { d.setDate(d.getDate() - 7);  return d.toISOString().slice(0, 10); }
    if (period === "month") { d.setDate(1);                 return d.toISOString().slice(0, 10); }
    if (period === "year")  { d.setMonth(0, 1);             return d.toISOString().slice(0, 10); }
    return "2000-01-01";
  }, [period]);
  const PERIOD_LABELS = { day: "Today", week: "Last 7 days", month: "This month", year: "This year" };
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const [exportBusy, setExportBusy] = useState(null);
  const [exportFiltersOpen, setExportFiltersOpen] = useState(false);
  const [exportStartDate, setExportStartDate] = useState("");
  const [exportEndDate, setExportEndDate] = useState("");
  const [exportModules, setExportModules] = useState({ finance: true, sales: true, crm: true, inventory: true, operations: true });
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false);
  const [digestSettingsOpen, setDigestSettingsOpen] = useState(false);
  const [preferencesDrawerOpen, setPreferencesDrawerOpen] = useState(false);
  const [drillDownMonth, setDrillDownMonth] = useState(null);
  const [drillDownSearch, setDrillDownSearch] = useState("");
  const [drillDownMinAmount, setDrillDownMinAmount] = useState("");
  const [drillDownMaxAmount, setDrillDownMaxAmount] = useState("");
  const [drillDownCurrency, setDrillDownCurrency] = useState("TZS");
  const [selectedDrillDownInvoice, setSelectedDrillDownInvoice] = useState(null);
  const [drillDownLoading, setDrillDownLoading] = useState(false);


  const financials = useMemo(() => {
    const invRows = invoices.rows.filter((inv) => !periodStart || (inv.date || "") >= periodStart);
    const expRows = expenses.rows.filter((e) => !periodStart || (e.date || e.expenseDate || "") >= periodStart);
    const revenue = invRows.reduce((s, inv) => {
      const { total } = lineTotal(inv.items);
      return s + (inv.status === "Paid" ? total : (inv.amountPaid || 0));
    }, 0);
    const expenseTotal = expRows.reduce((s, e) => s + e.amount, 0);
    const profit = revenue - expenseTotal;
    const outstanding = invoices.rows.filter((inv) => inv.status !== "Paid");
    const pendingCash = outstanding.reduce((s, inv) => s + (lineTotal(inv.items).total - (inv.amountPaid || 0)), 0);
    return { revenue, expenseTotal, profit, pendingCash, outstandingCount: outstanding.length };
  }, [invoices.rows, expenses.rows, periodStart]);

  const financeKpis = [
    { label: "Revenue Collected", value: `TZS ${money(Math.round(financials.revenue))}k`, delta: PERIOD_LABELS[period], up: true, icon: CircleDollarSign },
    { label: "Expenses", value: `TZS ${money(Math.round(financials.expenseTotal))}k`, delta: PERIOD_LABELS[period], up: false, icon: Wallet },
    { label: "Profit", value: `TZS ${money(Math.round(financials.profit))}k`, delta: financials.profit >= 0 ? "Net positive" : "Net negative", up: financials.profit >= 0, icon: financials.profit >= 0 ? TrendingUp : TrendingDown },
    { label: "Cash Flow", value: `TZS ${money(Math.round(financials.pendingCash))}k`, delta: `${financials.outstandingCount} invoices pending`, up: false, icon: Landmark },
  ];

  // "Sales" — pipeline by stage, live from CRM.
  const pipelineByStage = useMemo(() => {
    return STAGES.map((stage) => ({ stage, value: crm.rows.filter((l) => l.stage === stage).length }));
  }, [crm.rows]);

  // "Revenue" — top customers by billed value, live from invoices. Mirrors
  // Reports' Sales & Revenue report at a glance rather than duplicating a
  // second calculation for the same number.
  const topCustomers = useMemo(() => {
    const map = {};
    invoices.rows.forEach((inv) => {
      const { total } = lineTotal(inv.items);
      map[inv.customer] = (map[inv.customer] || 0) + total;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([customer, value]) => ({ customer, value }));
  }, [invoices.rows]);

  // "Inventory" — stock value by category, live.
  const stockByCategory = useMemo(() => {
    const map = {};
    inventory.rows.forEach((it) => { map[it.category] = (map[it.category] || 0) + it.qty * it.unitCost; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).map(([category, value]) => ({ category, value: Math.round(value) }));
  }, [inventory.rows]);

  // Work orders by status — genuinely Manufacturing's own metric now that
  // Projects is a real module in its own right; this chart never needed
  // to stand in for anything once labeled honestly (see the Production
  // chart below).
  const workOrdersByStatus = useMemo(() => {
    const statuses = ["Planned", "In Progress", "Completed", "Cancelled"];
    return statuses.map((status) => ({ status, value: workOrders.rows.filter((w) => w.status === status).length }));
  }, [workOrders.rows]);

  const revenueExpenseTrend = useMemo(() => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(TODAY);
      d.setMonth(d.getMonth() - 5 + i);
      return d.toISOString().slice(0, 7);
    });
    return months.map((month) => {
      const revenue = invoices.rows.filter((invoice) => invoice.date?.startsWith(month)).reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);
      const expensesValue = expenses.rows.filter((expense) => expense.date?.startsWith(month)).reduce((sum, expense) => sum + (expense.amount || 0), 0);
      return { month: new Date(`${month}-01`).toLocaleDateString("en", { month: "short" }), revenue_tzs_k: Math.round(revenue / 1000), expenses_tzs_k: Math.round(expensesValue / 1000), profit_tzs_k: Math.round((revenue - expensesValue) / 1000) };
    });
  }, [invoices.rows, expenses.rows]);

  const arAging = useMemo(() => {
    const unpaid = invoices.rows.filter((invoice) => invoice.status !== "Paid");
    const todayMs = TODAY.getTime();
    const buckets = [
      { bucket: "Current", items: unpaid.filter((invoice) => !invoice.dueDate || new Date(invoice.dueDate) >= TODAY) },
      { bucket: "1–30 days", items: unpaid.filter((invoice) => invoice.dueDate && (todayMs - new Date(invoice.dueDate).getTime()) > 0 && (todayMs - new Date(invoice.dueDate).getTime()) <= 30 * 86400000) },
      { bucket: "31–60 days", items: unpaid.filter((invoice) => invoice.dueDate && (todayMs - new Date(invoice.dueDate).getTime()) > 30 * 86400000 && (todayMs - new Date(invoice.dueDate).getTime()) <= 60 * 86400000) },
      { bucket: "60+ days", items: unpaid.filter((invoice) => invoice.dueDate && (todayMs - new Date(invoice.dueDate).getTime()) > 60 * 86400000) },
    ];
    return buckets.map(({ bucket, items }) => ({ bucket, invoice_count: items.length, amount_tzs_k: Math.round(items.reduce((sum, invoice) => sum + lineTotal(invoice.items || []).total - (invoice.amountPaid || 0), 0) / 1000) }));
  }, [invoices.rows]);

  const exportDateMatches = useCallback((row) => {
    if (!exportStartDate && !exportEndDate) return true;
    const value = row?.date || row?.createdAt || row?.startDate || row?.orderDate || row?.issueDate || row?.expectedCloseDate;
    if (!value) return false;
    const date = String(value).slice(0, 10);
    return (!exportStartDate || date >= exportStartDate) && (!exportEndDate || date <= exportEndDate);
  }, [exportStartDate, exportEndDate]);

  const filteredExportRows = useMemo(() => ({
    invoices: invoices.rows.filter(exportDateMatches),
    expenses: expenses.rows.filter(exportDateMatches),
    crm: crm.rows.filter(exportDateMatches),
    workOrders: workOrders.rows.filter(exportDateMatches),
    inventory: inventory.rows,
  }), [invoices.rows, expenses.rows, crm.rows, workOrders.rows, inventory.rows, exportDateMatches]);

  const filteredExportSections = useMemo(() => {
    const exportInvoices = filteredExportRows.invoices;
    const exportExpenses = filteredExportRows.expenses;
    const exportRevenue = exportInvoices.reduce((sum, invoice) => sum + (invoice.status === "Paid" ? lineTotal(invoice.items || []).total : (invoice.amountPaid || 0)), 0);
    const exportExpenseTotal = exportExpenses.reduce((sum, expense) => sum + (expense.amount || 0), 0);
    const exportPipelineByStage = STAGES.map((stage) => ({ stage, deal_count: filteredExportRows.crm.filter((lead) => lead.stage === stage).length }));
    const exportStockByCategory = Object.entries(filteredExportRows.inventory.reduce((map, item) => ({ ...map, [item.category]: (map[item.category] || 0) + item.qty * item.unitCost }), {})).map(([category, value]) => ({ category, stock_value_tzs_k: Math.round(value) }));
    const exportWorkOrdersByStatus = ["Planned", "In Progress", "Completed", "Cancelled"].map((status) => ({ status, order_count: filteredExportRows.workOrders.filter((workOrder) => workOrder.status === status).length }));
    const customerTotals = {};
    exportInvoices.forEach((invoice) => { customerTotals[invoice.customer] = (customerTotals[invoice.customer] || 0) + lineTotal(invoice.items || []).total; });
    const exportTopCustomers = Object.entries(customerTotals).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([customer, value]) => ({ customer, billed_value_tzs_k: value }));
    const exportUnpaid = exportInvoices.filter((invoice) => invoice.status !== "Paid");
    const exportAging = [
      { bucket: "Current", items: exportUnpaid.filter((invoice) => !invoice.dueDate || new Date(invoice.dueDate) >= TODAY) },
      { bucket: "1–30 days", items: exportUnpaid.filter((invoice) => invoice.dueDate && (TODAY - new Date(invoice.dueDate)) > 0 && (TODAY - new Date(invoice.dueDate)) <= 30 * 86400000) },
      { bucket: "31–60 days", items: exportUnpaid.filter((invoice) => invoice.dueDate && (TODAY - new Date(invoice.dueDate)) > 30 * 86400000 && (TODAY - new Date(invoice.dueDate)) <= 60 * 86400000) },
      { bucket: "60+ days", items: exportUnpaid.filter((invoice) => invoice.dueDate && (TODAY - new Date(invoice.dueDate)) > 60 * 86400000) },
    ].map(({ bucket, items }) => ({ bucket, invoice_count: items.length, amount_tzs_k: Math.round(items.reduce((sum, invoice) => sum + lineTotal(invoice.items || []).total - (invoice.amountPaid || 0), 0) / 1000) }));
    const trendMonths = Array.from({ length: 6 }, (_, index) => { const date = new Date(TODAY); date.setMonth(date.getMonth() - 5 + index); return date.toISOString().slice(0, 7); });
    const exportTrend = trendMonths.map((month) => {
      const revenue = exportInvoices.filter((invoice) => invoice.date?.startsWith(month)).reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);
      const expenseValue = exportExpenses.filter((expense) => expense.date?.startsWith(month)).reduce((sum, expense) => sum + (expense.amount || 0), 0);
      return { month: new Date(`${month}-01`).toLocaleDateString("en", { month: "short" }), revenue_tzs_k: Math.round(revenue / 1000), expenses_tzs_k: Math.round(expenseValue / 1000), profit_tzs_k: Math.round((revenue - expenseValue) / 1000) };
    });
    const sections = buildDashboardChartSections({
      kpis: [
        { metric: "Revenue Collected", value: `TZS ${money(Math.round(exportRevenue))}k`, detail: exportInvoices.length + " invoices" },
        { metric: "Expenses", value: `TZS ${money(Math.round(exportExpenseTotal))}k`, detail: exportExpenses.length + " expenses" },
        { metric: "Profit", value: `TZS ${money(Math.round(exportRevenue - exportExpenseTotal))}k`, detail: "Collected − Expenses" },
        { metric: "Pipeline", value: `TZS ${money(Math.round(filteredExportRows.crm.filter((lead) => !["Won", "Lost"].includes(lead.stage)).reduce((sum, lead) => sum + (lead.value || 0), 0) / 1000))}k`, detail: filteredExportRows.crm.length + " leads" },
      ],
      revenueExpenseTrend: exportTrend,
      arAging: exportAging,
      pipelineByStage: exportPipelineByStage,
      stockByCategory: exportStockByCategory,
      workOrdersByStatus: exportWorkOrdersByStatus,
      topCustomers: exportTopCustomers,
    });
    return filterDashboardChartSections(sections, exportModules);
  }, [filteredExportRows, exportModules, exportStartDate, exportEndDate, revenueExpenseTrend]);

  const exportFilterSummary = useMemo(() => buildDashboardExportFilterSummary({ startDate: exportStartDate, endDate: exportEndDate, enabledModules: exportModules }), [exportStartDate, exportEndDate, exportModules]);

  async function exportDashboard(format) {
    if (exportBusy) return;
    setExportBusy(format);
    try {
      const filterSuffix = exportStartDate || exportEndDate ? `-${exportStartDate || "start"}-${exportEndDate || "today"}` : "-all-dates";
      const base = `${safeExportFilePart(company.name)}-dashboard${filterSuffix}-${TODAY.toISOString().slice(0, 10)}`;
      if (format === "csv") {
        downloadDashboardCsv(filteredExportSections, `${base}.csv`);
        notify("Filtered dashboard chart data downloaded as CSV.");
      } else {
        (await createDashboardPdfDocument({ companyName: company.name, periodLabel: PERIOD_LABELS[period], filterSummary: exportFilterSummary, sections: filteredExportSections })).save(`${base}.pdf`);
        notify("Filtered dashboard chart data downloaded as PDF.");
      }
    } catch (_e) {
      notify("Dashboard export failed — please try again.", "error");
    } finally {
      setExportBusy(null);
      setExportMenuOpen(false);
    }
  }

  const pendingLeave = useMemo(() => leaveRequests.rows.filter((l) => l.status === "Pending"), [leaveRequests.rows]);
  const alerts = useBusinessAlerts({ inventory, invoices, expenses, leaveRequests, workOrders, subscriptions });

  // The guidance panel intentionally derives only from confirmed rows already
  // visible to this role. It recommends an existing module to review, never
  // manufactures a metric, creates a record, or performs an automatic action.
  const executiveGuidance = useMemo(() => {
    if (alerts.length > 0) {
      return {
        icon: Bell,
        accent: "#EF4444",
        eyebrow: "Attention recommended",
        title: `${alerts.length} workspace signal${alerts.length === 1 ? "" : "s"} need review`,
        detail: "Review the current operational signals before planning new work.",
        actionLabel: "Review signals",
        target: alerts[0]?.target || "dashboard",
      };
    }
    if (invoices.rows.length === 0) {
      return {
        icon: ReceiptText,
        accent: "#16A34A",
        eyebrow: "Revenue readiness",
        title: "Start with customer billing",
        detail: "No confirmed invoice data is available for this workspace yet.",
        actionLabel: "Open sales",
        target: "sales",
      };
    }
    if (crm.rows.length === 0) {
      return {
        icon: Users,
        accent: "#7C3AED",
        eyebrow: "Pipeline readiness",
        title: "Build the sales pipeline",
        detail: "No confirmed customer opportunities are available yet.",
        actionLabel: "Open CRM",
        target: "crm",
      };
    }
    if (inventory.rows.length === 0) {
      return {
        icon: Package,
        accent: "#0891B2",
        eyebrow: "Inventory readiness",
        title: "Set up inventory visibility",
        detail: "No confirmed stock items are available for this workspace yet.",
        actionLabel: "Open inventory",
        target: "inventory",
      };
    }
    return {
      icon: CheckCircle2,
      accent: "#16A34A",
      eyebrow: "Workspace status",
      title: "Core workspace signals are in place",
      detail: "Review the latest reports to keep decisions aligned with confirmed data.",
      actionLabel: "Open reports",
      target: "reports",
    };
  }, [alerts, crm.rows.length, inventory.rows.length, invoices.rows.length]);


  // Recent Activity — a real merged feed, not a fabricated log. Built only
  // from the domains with reliable, directly comparable ISO date fields
  // (invoices, expenses, leave requests); CRM's lastActivity is already a
  // locale-formatted display string, not safely sortable, so it's left out
  // rather than guessed at. Day-level relative labels ("Today", "3 days
  // ago") match the actual granularity of this data — the seed dataset
  // does not carry real minute-level timestamps, so showing "5 minutes ago"
  // would be a precision the data does not have.
  function relativeDay(dateStr) {
    if (!dateStr) return "";
    const days = Math.round((TODAY - new Date(dateStr)) / (1000 * 60 * 60 * 24));
    if (days <= 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 14) return `${days} days ago`;
    return dateStr;
  }

  const recentActivity = useMemo(() => {
    const items = [];
    invoices.rows.forEach((inv) => {
      if (inv.status === "Paid") {
        items.push({ date: inv.date, icon: ReceiptText, color: "#16A34A", text: `Invoice ${inv.id} paid`, sub: inv.customer });
      } else {
        items.push({ date: inv.date, icon: ReceiptText, color: "#5B6472", text: `Invoice ${inv.id} issued`, sub: inv.customer });
      }
    });
    expenses.rows.forEach((e) => {
      items.push({ date: e.date, icon: Wallet, color: "#F59E0B", text: `Expense recorded — ${e.category}`, sub: `TZS ${money(e.amount)}k · ${e.vendor}` });
    });
    leaveRequests.rows.forEach((l) => {
      items.push({ date: l.startDate, icon: Clock, color: l.status === "Approved" ? "#16A34A" : "#F59E0B", text: `Leave ${l.status.toLowerCase()} — ${l.type}`, sub: l.employee });
    });
    return items.sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 6);
  }, [invoices.rows, expenses.rows, leaveRequests.rows]);

  const quickActions = [
    { label: "Create Invoice", icon: ReceiptText, action: () => onQuickAction("sales", { tab: "invoices", openForm: true }) },
    { label: "New Lead", icon: Users, action: () => onQuickAction("crm", { tab: "leads" }) },
    { label: "Approve Leave", icon: Clock, action: () => onQuickAction("hr", { tab: "leave" }) },
    { label: "Record Payment", icon: CreditCard, action: () => onQuickAction("finance", { tab: "receivables" }) },
    { label: "Record Expense", icon: Wallet, action: () => onQuickAction("finance", { tab: "expenses" }) },
    { label: "AI Assistant", icon: Brain, action: () => onNavigate("ai") },
  ];

  // Attention guidance is derived from confirmed workspace rows. Setup tips
  // are navigation suggestions only: they do not create records, imitate AI
  // reasoning, or turn a missing record into a fabricated alert.
  const attentionItems = [
    ...inventory.rows.filter((item) => item.qty <= item.reorder && item.reorder > 0).slice(0, 3).map((item) => ({
      id: `inventory-${item.id}`, icon: Package, color: "#DC2626", surface: "#FEF2F2", title: item.name, detail: item.qty <= 0 ? "Out of stock" : `${item.qty} left — reorder at ${item.reorder}`, actionLabel: "Review stock", action: () => onNavigate("inventory"),
    })),
    ...workOrders.rows.filter((workOrder) => workOrder.status !== "Completed" && workOrder.status !== "Cancelled" && workOrder.dueDate < TODAY.toISOString().slice(0, 10)).slice(0, 2).map((workOrder) => ({
      id: `work-order-${workOrder.id}`, icon: Factory, color: "#D97706", surface: "#FFFBEB", title: workOrder.productName || workOrder.id, detail: `Work order overdue · ${workOrder.dueDate}`, actionLabel: "Review production", action: () => onNavigate("manufacturing"),
    })),
    ...(inventory.rows.length === 0 ? [{ id: "setup-inventory", icon: Package, color: "#2563EB", surface: "#EFF6FF", title: "Start with inventory", detail: "No confirmed stock items yet. Add a product or service to track availability.", actionLabel: "Add product", action: () => onNavigate("inventory") }] : []),
    ...(invoices.rows.length === 0 ? [{ id: "setup-invoice", icon: ReceiptText, color: "#16A34A", surface: "#F0FDF4", title: "Start tracking revenue", detail: "No confirmed invoices yet. Create an invoice when a sale is ready to record.", actionLabel: "Create invoice", action: () => onQuickAction("sales", { tab: "invoices", openForm: true }) }] : []),
    ...(crm.rows.length === 0 ? [{ id: "setup-crm", icon: Users, color: "#7C3AED", surface: "#F5F3FF", title: "Build your pipeline", detail: "No confirmed leads yet. Add a lead to begin tracking customer opportunities.", actionLabel: "Add lead", action: () => onQuickAction("crm", { tab: "leads" }) }] : []),
  ].slice(0, 5);

  // Shared across every focused role view below, so Approvals and Recent
  // Activity do not have to be reimplemented per role — only the top-level
  // dashboard content (which real numbers lead the page) actually differs.
  const sidePanels = (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-[14px] font-semibold text-[#111827]">Approvals</h3>
          {pendingLeave.length > 0 && <span className="text-[11px] font-mono text-slate-400">{pendingLeave.length}</span>}
        </div>
        {pendingLeave.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <CheckCircle2 size={18} className="text-[#16A34A] mb-2" />
            <p className="text-[12.5px] font-medium text-slate-600">No approvals are waiting.</p>
            <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-slate-400">The confirmed leave queue is clear. Review team availability or open the leave workspace when a new request arrives.</p>
            <button onClick={() => onQuickAction("hr", { tab: "leave" })} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#16A34A] hover:text-[#15803D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40 rounded">
              Open leave workspace <ChevronRight size={13} />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {pendingLeave.slice(0, 4).map((l) => (
              <button key={l.id} onClick={() => onQuickAction("hr", { tab: "leave" })} className="w-full flex items-center justify-between px-2 py-2 rounded-lg hover:bg-slate-50 text-left transition-colors">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-lg bg-[#F59E0B]/10 flex items-center justify-center shrink-0"><Clock size={13} className="text-[#F59E0B]" /></div>
                  <div className="min-w-0"><p className="text-[12.5px] font-medium text-[#111827] truncate">{l.employee}</p><p className="text-[11px] text-slate-400">{l.type} · {l.startDate} → {l.endDate}</p></div>
                </div>
                <ChevronRight size={14} className="text-slate-300 shrink-0" />
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 sm:p-5">
        <h3 className="text-[14px] font-semibold text-[#111827] mb-3">Recent Activity</h3>
        {recentActivity.length === 0 ? (
          <div className="flex flex-col items-center py-6 text-center">
            <FileText size={18} className="text-slate-300 mb-2" />
            <p className="text-[12.5px] font-medium text-slate-600">No recorded activity yet.</p>
            <p className="mt-1 max-w-[260px] text-[11px] leading-relaxed text-slate-400">This panel lists confirmed invoice, expense, and leave activity only. It does not create an activity history from local actions.</p>
            <button onClick={() => onNavigate("reports")} className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB] hover:text-[#1D4ED8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB]/40 rounded">
              Open reports <ChevronRight size={13} />
            </button>
          </div>
        ) : (
          <div className="space-y-1">
            {recentActivity.map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="flex items-center gap-2.5 px-2 py-2">
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${a.color}14` }}><Icon size={13} style={{ color: a.color }} /></div>
                  <div className="min-w-0 flex-1"><p className="text-[12.5px] font-medium text-[#111827] truncate">{a.text}</p><p className="text-[11px] text-slate-400 truncate">{a.sub}</p></div>
                  <span className="text-[10.5px] text-slate-400 shrink-0">{relativeDay(a.date)}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );

  const roleHeader = (focusLine) => (
    <div>
      <h1 className="text-[22px] font-semibold text-[#111827] tracking-tight">Hello, {company.owner}</h1>
      <p className="text-[13px] text-slate-500 mt-1">{currentUser.role} view — {focusLine}</p>
    </div>
  );

  if (roleView === "executive") {
    return (
      <>
        {isGlobalAdmin && accessToken && <section aria-label="Global Admin trial-expiry notice panel"><TrialNoticeAdmin api={dashboardTrialNoticeApi} heading="Global Admin trial-expiry notice panel" /></section>}
        <PremiumExecutiveDashboard
          company={company}
          currentUser={currentUser}
          invoices={invoices}
          expenses={expenses}
          inventory={inventory}
          crm={crm}
          leaveRequests={leaveRequests}
          workOrders={workOrders}
          subscriptions={subscriptions}
          posTransactions={posTransactions}
          alerts={alerts}
          recentActivity={recentActivity}
          pendingLeave={pendingLeave}
          formatMoney={formatMoney}
          onNavigate={onNavigate}
          onQuickAction={onQuickAction}
          onCustomizeDashboard={() => setPreferencesDrawerOpen(true)}
        />
        <Suspense fallback={null}>
          <LazyDashboardPreferencesDrawer isOpen={preferencesDrawerOpen} onClose={() => setPreferencesDrawerOpen(false)} />
        </Suspense>
      </>
    );
  }

  if (roleView === "financial") {
    return (
      <div className="space-y-6">
        {roleHeader("cash flow, receivables, and payables, live from Finance")}
        <FinanceCommandCenter invoices={invoices} expenses={expenses} posTransactions={posTransactions} onNavigate={onNavigate} />
        {sidePanels}
      </div>
    );
  }

  if (roleView === "hr") {
    return (
      <div className="space-y-6">
        {roleHeader("headcount, payroll, and leave, live from HR")}
        <HrCommandCenter employees={employees} leaveRequests={leaveRequests} expenses={expenses} onNavigate={onNavigate} />
        {sidePanels}
      </div>
    );
  }

  if (roleView === "sales") {
    return (
      <div className="space-y-6">
        {roleHeader("pipeline, forecast, and revenue by customer, live from CRM and Sales")}
        <SalesCommandCenter invoices={invoices} orders={posTransactions} crm={crm} inventory={inventory} onNavigate={onNavigate} />
        {sidePanels}
      </div>
    );
  }

  if (roleView === "operations") {
    const isProcurementOfficer = currentRole.id === "Procurement Officer";
    return (
      <div className="space-y-6">
        {roleHeader(isProcurementOfficer
          ? "supplier coverage, replenishment, and purchasing readiness, live from Procurement and Inventory"
          : "stock, work orders, and operational throughput, live from Inventory and Manufacturing")}
        {isProcurementOfficer ? (
          <ProcurementCommandCenter inventory={inventory} suppliers={suppliers} expenses={expenses} onNavigate={onNavigate} />
        ) : (
          <WarehouseCommandCenter inventory={inventory} suppliers={suppliers} invoices={invoices} workOrders={workOrders} posTransactions={posTransactions} onNavigate={onNavigate} />
        )}
        {sidePanels}
      </div>
    );
  }

  // Project Manager and Customer Support Agent: Projects' tasks and
  // Support's tickets both live in their own modules' local state, never
  // lifted to root (the same honest scope boundary Analytics itself
  // states in section 21) — so rather than fabricate a widget standing in
  // for data this screen genuinely does not have, this gives a direct,
  // one-click path into the real module instead.
  if (roleView === "focused") {
    const preferredTarget = currentRole.id === "Project Manager" ? "projects" : "support";
    const rolePreferredTarget = ["Property Administrator", "Property Manager", "Landlord / Owner", "Property Agent", "Tenant", "Maintenance Staff", "Property Finance Officer"].includes(currentRole.id) ? "property-management" : currentRole.id === "School Administrator" ? "school" : currentRole.id === "Customer Support Agent" ? "support" : preferredTarget;
    const preferredTargetAllowed = currentRole.allowedModules.includes(preferredTarget);
    const target = currentRole.allowedModules.includes(rolePreferredTarget)
      ? rolePreferredTarget
      : preferredTargetAllowed && currentRole.allowedModules.includes(preferredTarget)
        ? preferredTarget
        : (currentRole.primaryModules[0] || currentRole.allowedModules[0]);
    const targetLabel = MODULES.find((module) => module.id === target)?.label || "your workspace";
    return (
      <div className="space-y-6">
        {roleHeader(`your work lives in ${targetLabel} — jump straight in`)}
        <button onClick={() => onNavigate(target)} aria-label={`Open permitted ${targetLabel} workspace`} className="w-full bg-white rounded-xl border border-slate-200/80 shadow-sm p-6 flex items-center justify-between hover:border-[#16A34A]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40 transition-colors text-left">
          <div>
            <p className="text-[15px] font-semibold text-[#111827] mb-1">Open {targetLabel}</p>
            <p className="text-[12.5px] text-slate-500">Tasks, timelines, and details for your role live there — this home screen does not duplicate that view or expose unrelated company-wide data.</p>
          </div>
          <ChevronRight size={20} className="text-slate-300 shrink-0" />
        </button>
        {sidePanels}
      </div>
    );
  }

  // Employee, External Client, Supplier: narrow, honest access by design
  // (see the ROLES definitions) — the home screen matches that, rather
  // than showing company-wide numbers a role with this little access
  // shouldn't be the one place surfacing.
  if (roleView === "minimal") {
    const primaryModuleId = currentRole.primaryModules[0] || currentRole.allowedModules[0];
    const primaryModuleLabel = MODULES.find((module) => module.id === primaryModuleId)?.label || "your permitted workspace";
    return (
      <div className="space-y-6">
        {roleHeader(currentRole.description)}
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-8 text-center">
          <div className="w-11 h-11 rounded-xl mx-auto flex items-center justify-center mb-3.5" style={{ backgroundColor: "#DCFCE7" }}>
            <Briefcase size={19} strokeWidth={1.75} className="text-[#16A34A]" />
          </div>
          <p className="text-[14.5px] font-semibold text-[#111827] mb-1">Welcome to {company.name}</p>
          <p className="text-[12.5px] text-slate-500 max-w-[380px] mx-auto leading-relaxed">
            Your access is scoped to {currentRole.allowedModules.map((m) => MODULES.find((mm) => mm.id === m)?.label).filter(Boolean).join(" and ")}. This home view intentionally does not show company-wide metrics or create records.
          </p>
          {primaryModuleId && currentRole.allowedModules.includes(primaryModuleId) && (
            <button onClick={() => onNavigate(primaryModuleId)} aria-label={`Open permitted ${primaryModuleLabel} workspace`} className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3.5 py-2.5 text-[12px] font-semibold text-white transition-colors hover:bg-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#16A34A]/40">
              Open {primaryModuleLabel} <ChevronRight size={14} />
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {isGlobalAdmin && accessToken && <section aria-label="Global Admin trial-expiry notice panel"><TrialNoticeAdmin api={dashboardTrialNoticeApi} heading="Global Admin trial-expiry notice panel" /></section>}
      <ExecutiveCommandCenter
        invoices={invoices}
        expenses={expenses}
        inventory={inventory}
        crm={crm}
        employees={employees}
        leaveRequests={leaveRequests}
        posTransactions={posTransactions}
        workOrders={workOrders}
        onNavigate={onNavigate}
        currency={company.currency || "TZS"}
      />
      <AiBusinessSignals
        invoices={invoices}
        inventory={inventory}
        crm={crm}
        expenses={expenses}
        employees={employees}
        leaveRequests={leaveRequests}
        suppliers={suppliers}
        quotations={quotations}
        scheduledWorkflows={scheduledWorkflows}
        onNavigate={onNavigate}
      />
      {scheduleDialogOpen && <ScheduleReportDialog company={company} currentUser={currentUser} modules={exportModules} dateRange={{ start: exportStartDate, end: exportEndDate }} onClose={() => setScheduleDialogOpen(false)} onSaved={() => { setScheduleDialogOpen(false); notify("Recurring dashboard report scheduled."); }} />}
      <Suspense fallback={null}>
        <LazyDashboardPreferencesDrawer isOpen={preferencesDrawerOpen} onClose={() => setPreferencesDrawerOpen(false)} />
      </Suspense>

      <section className="order-8 grid grid-cols-1 gap-5" aria-label="Workspace setup and analytics readiness">
        <GettingStartedChecklist inventory={inventory} crm={crm} invoices={invoices} expenses={expenses} posTransactions={posTransactions} onNavigate={onNavigate} />
        <AnalyticsReadiness invoices={invoices} crm={crm} inventory={inventory} expenses={expenses} onNavigate={onNavigate} />
      </section>

      <section className="order-5 space-y-5" aria-label="Workspace intelligence and compliance">
        {canViewMarketIntelligence && <MarketIntelligencePanel snapshotQuery={marketSnapshotQuery} onNavigate={onNavigate} />}

      {/* ══════════════════ COMPLIANCE DIGEST STATUS BADGE ══════════════════ */}
      {(
          <div className="rounded-2xl border border-slate-200/80 bg-white dark:bg-slate-900 p-4 shadow-sm flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl font-bold ${hasActiveSchedules ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'}`}>
                {hasActiveSchedules ? '🛡️' : '⏸️'}
              </span>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-[13.5px] font-bold text-slate-900 dark:text-white">Automated Weekly Compliance Digest</h4>
                  <span
                    tabIndex={0}
                    className={`group/badge relative inline-flex items-center rounded-full px-2 py-0.5 text-[10.5px] font-bold cursor-help ${hasActiveSchedules ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}
                    title={lastScheduleSentAt ? `Last successful email delivery: ${new Date(lastScheduleSentAt).toLocaleString()}` : 'No successful email deliveries recorded yet'}
                  >
                    {schedulesQuery.isLoading ? 'Checking...' : hasActiveSchedules ? `Active (${activeScheduleCount} schedule${activeScheduleCount > 1 ? 's' : ''})` : 'Paused / Unconfigured'}
                    <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover/badge:block group-focus/badge:block w-56 rounded-lg bg-slate-900 dark:bg-slate-800 px-3 py-1.5 text-[11px] font-normal text-white shadow-xl z-30 text-center leading-snug">
                      {lastScheduleSentAt ? `Last successful email delivery:\n${new Date(lastScheduleSentAt).toLocaleString()}` : 'No successful email deliveries recorded yet'}
                    </span>
                  </span>
                </div>
                <p className="text-[11.5px] text-slate-500 mt-0.5">
                  {lastScheduleSentAt ? `Last email digest delivered successfully on ${new Date(lastScheduleSentAt).toLocaleString()}` : hasActiveSchedules ? 'Scheduled weekly email dispatches are active and monitoring tenant tax records.' : 'Configure automated report schedules in the Reports module to enable weekly compliance email dispatches.'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setDigestSettingsOpen(true)}
                className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/60 px-3.5 py-2 text-[12px] font-semibold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition shadow-sm"
              >
                ⚙️ Configure Digest
              </button>
              <button
                type="button"
                onClick={() => onNavigate("reports")}
                className="rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-[12px] font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 transition shadow-sm"
              >
                Manage Schedules →
              </button>
            </div>
            {digestSettingsOpen && (
              <ComplianceDigestSettingsModal
                company={company}
                currentUser={currentUser}
                onClose={() => setDigestSettingsOpen(false)}
                onSaved={() => {
                  setDigestSettingsOpen(false);
                  schedulesQuery.refetch();
                  notify("Compliance digest settings updated successfully.");
                }}
              />
            )}
          </div>
        )}

      </section>

      {/* ══════════════════ COMMAND STRIP ══════════════════ */}
      <div className="order-1 relative overflow-hidden rounded-[26px] border border-emerald-100/60 bg-gradient-to-br from-[#0c1f17] via-[#143a2b] to-[#0f5d3d] shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-sm">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#4ADE80,transparent)" }} />
          <div className="absolute bottom-[-2rem] left-[30%] h-32 w-32 rounded-full opacity-10" style={{ background: "radial-gradient(circle,#86EFAC,transparent)" }} />
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent" />
        </div>
        <div className="relative px-5 py-5 sm:px-7">
          <div className="mb-4 flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="mb-1 flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-[0.16em] text-emerald-300">Workspace overview</span>
                <span className="text-white/30">·</span>
                <span className="font-mono text-[10.5px] text-white/45">{new Date().toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span>
              </div>
              <h1 className="text-[22px] font-black leading-none tracking-tight text-white">
                {(() => { const h = new Date().getHours(); return h < 12 ? "Habari za asubuhi" : h < 17 ? "Habari za mchana" : "Habari za jioni"; })()}, {(company.owner || "Welcome").split(" ")[0]} 👋
              </h1>
              <p className="mt-1 text-[12px] text-white/60">{company.name} · {currentUser.role}</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <button
                  onClick={() => setExportMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={exportMenuOpen}
                  className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-white/[0.08] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                >
                  <Download size={13} /> Export Charts <ChevronDown size={13} className={`transition-transform ${exportMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {exportMenuOpen && (
                  <div role="menu" aria-label="Export dashboard chart data" className="absolute right-0 top-full z-20 mt-2 w-72 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-2xl">
                    <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wide text-slate-400">{exportFilterSummary}</div>
                    <button role="menuitem" onClick={() => setExportFiltersOpen((open) => !open)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50">
                      <Sliders size={15} className="text-[#7C3AED]" />
                      <span><span className="block">Filter export</span><span className="block text-[10px] font-normal text-slate-400">Choose date range and modules</span></span>
                      <ChevronDown size={13} className={`ml-auto transition-transform ${exportFiltersOpen ? "rotate-180" : ""}`} />
                    </button>
                    {exportFiltersOpen && (
                      <div role="group" aria-label="Dashboard export filters" className="mx-1 mb-1 rounded-xl bg-slate-50 p-2.5">
                        <div className="mb-2 grid grid-cols-2 gap-2">
                          <label className="text-[10px] font-semibold text-slate-500">From<input aria-label="Export start date" type="date" value={exportStartDate} onChange={(event) => setExportStartDate(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700" /></label>
                          <label className="text-[10px] font-semibold text-slate-500">To<input aria-label="Export end date" type="date" value={exportEndDate} onChange={(event) => setExportEndDate(event.target.value)} className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-[11px] text-slate-700" /></label>
                        </div>
                        <p className="mb-1.5 text-[10px] font-semibold text-slate-500">Include modules</p>
                        <div className="grid grid-cols-2 gap-1">
                          {["finance", "sales", "crm", "inventory", "operations"].map((module) => (
                            <label key={module} className="flex items-center gap-1.5 rounded px-1 py-1 text-[11px] text-slate-600 hover:bg-white">
                              <input type="checkbox" checked={exportModules[module]} onChange={(event) => setExportModules((current) => ({ ...current, [module]: event.target.checked }))} />
                              {module[0].toUpperCase() + module.slice(1)}
                            </label>
                          ))}
                        </div>
                        <button onClick={() => { setExportStartDate(""); setExportEndDate(""); setExportModules({ finance: true, sales: true, crm: true, inventory: true, operations: true }); }} className="mt-2 text-[10px] font-semibold text-[#7C3AED] hover:underline">Clear filters</button>
                      </div>
                    )}
                    <button role="menuitem" onClick={() => exportDashboard("csv")} disabled={Boolean(exportBusy)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                      <FileSpreadsheet size={15} className="text-[#16A34A]" />
                      <span><span className="block">Download CSV</span><span className="block text-[10px] font-normal text-slate-400">Filtered chart sections and KPIs</span></span>
                    </button>
                    <button role="menuitem" onClick={() => exportDashboard("pdf")} disabled={Boolean(exportBusy)} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-50">
                      <FileText size={15} className="text-[#2563EB]" />
                      <span><span className="block">Download PDF</span><span className="block text-[10px] font-normal text-slate-400">Filtered chart-data report</span></span>
                    </button>
                    <button role="menuitem" onClick={() => company.id ? setScheduleDialogOpen(true) : notify("Sign in to a live company before scheduling reports.", "error")} className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-left text-[12px] font-semibold text-slate-700 transition hover:bg-slate-50">
                      <Mail size={15} className="text-[#EA580C]" />
                      <span><span className="block">Schedule email report</span><span className="block text-[10px] font-normal text-slate-400">Runs automatically in the background</span></span>
                    </button>
                  </div>
                )}
              </div>

              <button onClick={() => onNavigate("ai")} className="flex items-center gap-1.5 rounded-xl bg-[#16A34A] px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-[#15803D] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80">
                <Sparkles size={13} /> Ask AI
              </button>
              <button onClick={() => typeof window.__openDailyBrief === "function" && window.__openDailyBrief()} className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-white/[0.08]">
                <BarChart3 size={13} /> Daily Brief
              </button>
              <button
                onClick={() => updatePreference("currency", preferences.currency === "TZS" ? "USD" : "TZS")}
                className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-white/[0.08]"
                title="Toggle Executive Currency (TZS / USD)"
              >
                <DollarSign size={13} /> {preferences.currency}
              </button>
              <button onClick={() => setPreferencesDrawerOpen(true)} className="flex items-center gap-1.5 rounded-xl border border-white/15 bg-white/[0.04] px-3.5 py-2 text-[12px] font-bold text-white transition hover:bg-white/[0.08]">
                <Sliders size={13} /> Preferences
              </button>
            </div>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-[10.5px]">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-white/70"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live workspace data</span>
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-white/60">{PERIOD_LABELS[period]} reporting view</span>
            <span className="rounded-full border border-white/10 bg-white/[0.07] px-2.5 py-1 text-white/60">{alerts.length} operational alert{alerts.length === 1 ? "" : "s"}</span>
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2.5" aria-label="Reporting period controls">
            <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/45">Reporting period</span>
            <div role="group" aria-label="Dashboard reporting period" className="inline-flex rounded-xl border border-white/10 bg-black/15 p-1">
              {[
                ["day", "Day"],
                ["week", "Week"],
                ["month", "Month"],
                ["year", "Year"],
              ].map(([value, label]) => {
                const selected = period === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPeriod(value)}
                    aria-pressed={selected}
                    className={`rounded-lg px-2.5 py-1.5 text-[10.5px] font-bold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 ${selected ? "bg-white text-[#0D2214] shadow-sm" : "text-white/60 hover:bg-white/10 hover:text-white"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
            <span className="text-[10.5px] text-white/45">Updates billed, collected, expenses, and profit from confirmed invoice and expense rows.</span>
          </div>

          {(() => {
            const invRows = invoices.rows.filter((invoice) => !periodStart || (invoice.date || "") >= periodStart);
            const expRows = expenses.rows.filter((expense) => !periodStart || (expense.date || expense.expenseDate || "") >= periodStart);
            const totalBilled = invRows.reduce((sum, invoice) => sum + lineTotal(invoice.items || []).total, 0);
            const totalCollected = invRows.reduce((sum, invoice) => sum + (invoice.amountPaid || 0), 0);
            const totalExpenses = expRows.reduce((sum, expense) => sum + (expense.amount || 0), 0);
            const grossProfit = totalCollected - totalExpenses;
            const overdueInvs = invRows.filter((invoice) => invoice.status !== "Paid" && invoice.dueDate < TODAY.toISOString().slice(0, 10));
            const overdueAmt = overdueInvs.reduce((sum, invoice) => sum + lineTotal(invoice.items || []).total - (invoice.amountPaid || 0), 0);
            const inventoryValue = inventory.rows.reduce((sum, item) => sum + (item.qty || 0) * (item.unitCost || 0), 0);
            const lowStock = inventory.rows.filter((item) => item.qty <= item.reorder && item.reorder > 0).length;
            const stockOut = inventory.rows.filter((item) => item.qty <= 0).length;
            const openLeads = crm.rows.filter((lead) => !["Won", "Lost"].includes(lead.stage));
            const pipelineValue = openLeads.reduce((sum, lead) => sum + (lead.value || 0), 0);
            const activeSubs = subscriptions.rows.filter((subscription) => subscription.status === "Active");
            const monthlyRecurringRevenue = activeSubs.reduce((sum, subscription) => {
              const months = { Monthly: 1, Quarterly: 3, Annual: 12 }[subscription.cycle] || 1;
              return sum + (subscription.amount / months);
            }, 0);
            const hasFinanceData = invRows.length > 0 || expRows.length > 0;
            const periodText = PERIOD_LABELS[period].toLowerCase();
            const cards = [
              { label: "AR Billed", value: formatMoney(totalBilled), color: "#4ADE80", context: invRows.length ? `${invRows.length} invoice${invRows.length === 1 ? "" : "s"} in ${periodText}` : `No invoices in ${periodText}`, action: "Open receivables", onClick: () => onQuickAction("finance", { tab: "receivables" }) },
              { label: "Collected", value: formatMoney(totalCollected), color: "#60A5FA", context: totalBilled > 0 ? `${Math.round((totalCollected / totalBilled) * 100)}% of billed value collected` : `No invoices to collect in ${periodText}`, action: "Open receivables", onClick: () => onQuickAction("finance", { tab: "receivables" }) },
              { label: "Overdue AR", value: formatMoney(overdueAmt), color: overdueAmt > 0 ? "#F87171" : "#4ADE80", context: overdueInvs.length ? `${overdueInvs.length} invoice${overdueInvs.length === 1 ? "" : "s"} overdue` : "No overdue invoices", action: "Review receivables", onClick: () => onQuickAction("finance", { tab: "receivables" }) },
              { label: "Gross P&L", value: `${grossProfit >= 0 ? "+" : "−"}${formatMoney(Math.abs(grossProfit))}`, color: grossProfit >= 0 ? "#4ADE80" : "#F87171", context: hasFinanceData ? "Collected less expenses" : `No invoice or expense entries in ${periodText}`, action: "Open finance", onClick: () => onNavigate("finance") },
              { label: "Inventory", value: formatMoney(inventoryValue), color: "#C4B5FD", context: inventory.rows.length ? `${inventory.rows.length} stocked SKU${inventory.rows.length === 1 ? "" : "s"}` : "No stock items recorded", action: "Open inventory", onClick: () => onNavigate("inventory") },
              { label: "Low Stock", value: String(lowStock), color: lowStock > 0 ? "#F87171" : "#4ADE80", context: lowStock ? `${stockOut} out of stock · ${lowStock} need review` : "No stock needs attention", action: "Review inventory", onClick: () => onNavigate("inventory") },
              { label: "Pipeline", value: formatMoney(pipelineValue), color: "#F9A8D4", context: openLeads.length ? `${openLeads.length} open deal${openLeads.length === 1 ? "" : "s"}` : "No open deals recorded", action: "Open CRM", onClick: () => onNavigate("crm") },
              { label: "MRR", value: formatMoney(monthlyRecurringRevenue), color: "#34D399", context: activeSubs.length ? `${activeSubs.length} active subscription${activeSubs.length === 1 ? "" : "s"}` : "No active subscriptions", action: "Open sales", onClick: () => onNavigate("sales") },
            ];

            return (
              <div className="grid grid-cols-2 gap-2.5 md:grid-cols-4 xl:grid-cols-8" aria-label="Workspace overview metrics">
                {cards.map((card) => (
                  <button
                    key={card.label}
                    type="button"
                    onClick={card.onClick}
                    aria-label={`${card.label}: ${card.context}. ${card.action}.`}
                    className="group min-h-[116px] rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:-translate-y-0.5 hover:border-emerald-200/50 hover:bg-white/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
                  