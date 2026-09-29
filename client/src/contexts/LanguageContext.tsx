import React, { createContext, useContext, useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useAuthContext } from "./AuthContext";

export type Lang = "en" | "sw" | "fr" | "es" | "pt" | "zh" | "ar" | "de" | "hi" | "ja";

export type LanguageOption = { code: Lang; label: string; nativeLabel: string; dir?: "ltr" | "rtl" };

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
];

const translations: Record<Lang, Record<string, string>> = {
  en: {
    brandTitle: "Smart Manager", brandSubtitle: "Operational ERP", capabilities: "Capabilities", whyUs: "Why Us", launch: "Launch", launchApp: "Launch App",
    heroBadge: "Tanzanian Enterprise Solution for Businesses", heroTitle1: "Run the work.", heroTitle2: "See the whole business.",
    heroSubtitle: "Simamia Biashara Yako. Popote, Wakati Wote. Smart Manager brings commercial, financial, and operational workflows together in one noble command center.",
    exploreCapabilities: "Explore capabilities", liveOperationalData: "Live operational data", connectedModules: "Connected business modules", actionReadyWorkflows: "Action-ready workflows",
    businessOverview: "Business Overview", liveWorkspace: "Live Workspace", operationalMomentum: "Operational Momentum", nextBestAction: "Next Best Action", nextBestActionDesc: "Review the priorities surfaced by your connected business workflows.",
    oneWorkspace: "One Workspace", oneWorkspaceDesc: "Centralize customer, inventory, finance, and people workflows in one command center.", liveDataPath: "Live Data Path", liveDataPathDesc: "Direct Supabase integration ensures every signal is accurate and action-ready.",
    builtInControls: "Built-in Controls", builtInControlsDesc: "Role-aware access, audit visibility, and automated reporting for peace of mind.", ecosystemTitle: "The Noble Ecosystem", ecosystemHeading: "Capabilities that radiate authority.",
    ecosystemDesc: "Smart Manager keeps core business functions in reach while giving each team the dedicated workflows it needs to move work forward with precision.", readyCommandCenter: "Ready to enter the command center?", readyCommandCenterDesc: "Launch the Smart Manager ERP dashboard to work with connected modules and live operational data. Salama na Mwaminifu.",
    launchWorkspace: "Launch Workspace", madeInTanzania: "Made in Tanzania", copyright: "© 2026 Smart Manager · Enterprise Business Ecosystem",
    language: "Language", workspaceArea: "Workspace area", searchEverything: "Search modules, records, and actions", helpSupport: "Help and support", messages: "Messages", theme: "Theme", switchLanguage: "Switch language",
  },
  sw: {
    brandTitle: "Smart Manager", brandSubtitle: "Mfumo wa Uendeshaji", capabilities: "Uwezo", whyUs: "Kwanini Sisi", launch: "Anza", launchApp: "Fungua Mfumo",
    heroBadge: "Bidhaa ya Kitanzania kwa Wafanyabiashara", heroTitle1: "Simamia kazi.", heroTitle2: "Ona biashara nzima.", heroSubtitle: "Simamia Biashara Yako. Popote, Wakati Wote. Smart Manager inaleta pamoja mifumo ya fedha, mauzo, na uendeshaji katika kituo kimoja thabiti.",
    exploreCapabilities: "Chunguza uwezo", liveOperationalData: "Data za uendeshaji za moja kwa moja", connectedModules: "Moduli zilizounganishwa", actionReadyWorkflows: "Mifumo ya vitendo", businessOverview: "Muhtasari wa Biashara", liveWorkspace: "Kituo cha Kazi", operationalMomentum: "Kasi ya Uendeshaji", nextBestAction: "Hatua Inayofuata", nextBestActionDesc: "Kagua vipaumbele vilivyotolewa na mifumo yako ya biashara.",
    oneWorkspace: "Sehemu Moja", oneWorkspaceDesc: "Unganisha wateja, bidhaa, fedha, na rasilimali watu katika sehemu moja.", liveDataPath: "Data za Moja kwa Moja", liveDataPathDesc: "Uunganishaji wa Supabase unahakikisha kila taarifa iko sahihi na salama.", builtInControls: "Udhibiti Madhubuti", builtInControlsDesc: "Ulinzi wa viwango vya watumiaji, ukaguzi, na ripoti za kiotomatiki.", ecosystemTitle: "Mfumo Thabiti", ecosystemHeading: "Uwezo unaoleta mamlaka katika biashara.", ecosystemDesc: "Smart Manager huweka shughuli zote za biashara mikononi mwako kwa usahihi na urahisi.", readyCommandCenter: "Uko tayari kuingia kwenye mfumo?", readyCommandCenterDesc: "Fungua dashibodi ya Smart Manager ili kufanya kazi na moduli zilizounganishwa na data halisi. Salama na Mwaminifu.", launchWorkspace: "Fungua Dashibodi", madeInTanzania: "Imetengenezwa Tanzania", copyright: "© 2026 Smart Manager · Mfumo wa Biashara",
    language: "Lugha", workspaceArea: "Eneo la kazi", searchEverything: "Tafuta moduli, rekodi na vitendo", helpSupport: "Msaada", messages: "Ujumbe", theme: "Muonekano", switchLanguage: "Badilisha lugha",
  },
  fr: { ...{}, brandTitle: "Smart Manager", brandSubtitle: "ERP opérationnel", capabilities: "Fonctionnalités", whyUs: "Pourquoi nous", launch: "Lancer", launchApp: "Ouvrir l’application", language: "Langue", workspaceArea: "Espace de travail", searchEverything: "Rechercher des modules, dossiers et actions", helpSupport: "Aide et support", messages: "Messages", theme: "Thème", switchLanguage: "Changer de langue" },
  es: { ...{}, brandTitle: "Smart Manager", brandSubtitle: "ERP operativo", capabilities: "Capacidades", whyUs: "Por qué nosotros", launch: "Iniciar", launchApp: "Abrir aplicación", language: "Idioma", workspaceArea: "Área de trabajo", searchEverything: "Buscar módulos, registros y acciones", helpSupport: "Ayuda y soporte", messages: "Mensajes", theme: "Tema", switchLanguage: "Cambiar idioma" },
  pt: { ...{}, brandTitle: "Smart Manager", brandSubtitle: "ERP operacional", capabilities: "Capacidades", whyUs: "Por que nós", launch: "Iniciar", launchApp: "Abrir aplicação", language: "Idioma", workspaceArea: "Área de trabalho", searchEverything: "Pesquisar módulos, registos e ações", helpSupport: "Ajuda e suporte", messages: "Mensagens", theme: "Tema", switchLanguage: "Mudar idioma" },
  zh: { ...{}, brandTitle: "Smart Manager", brandSubtitle: "运营 ERP", capabilities: "功能", whyUs: "为什么选择我们", launch: "开始", launchApp: "打开应用", language: "语言", workspaceArea: "工作区", searchEverything: "搜索模块、记录和操作", helpSupport: "帮助与支持", messages: "消息", theme: "主题", switchLanguage: "切换语言" },
  ar: { ...{}, brandTitle: "Smart Manager", brandSubtitle: "نظام تخطيط موارد المؤسسات", capabilities: "القدرات", whyUs: "لماذا نحن", launch: "بدء", launchApp: "فتح التطبيق", language: "اللغة", workspaceArea: "مساحة العمل", searchEverything: "البحث في الوحدات والسجلات والإجراءات", helpSupport: "المساعدة والدعم", messages: "الرسائل", theme: "السمة", switchLanguage: "تغيير اللغة" },
  de: { ...{}, brandTitle: "Smart Manager", brandSubtitle: "Operatives ERP", capabilities: "Funktionen", whyUs: "Warum wir", launch: "Starten", launchApp: "App öffnen", language: "Sprache", workspaceArea: "Arbeitsbereich", searchEverything: "Module, Datensätze und Aktionen suchen", helpSupport: "Hilfe und Support", messages: "Nachrichten", theme: "Design", switchLanguage: "Sprache wechseln" },
  hi: { ...{}, brandTitle: "Smart Manager", brandSubtitle: "ऑपरेशनल ERP", capabilities: "क्षमताएँ", whyUs: "हमें क्यों चुनें", launch: "शुरू करें", launchApp: "ऐप खोलें", language: "भाषा", workspaceArea: "वर्कस्पेस", searchEverything: "मॉड्यूल, रिकॉर्ड और कार्य खोजें", helpSupport: "सहायता और समर्थन", messages: "संदेश", theme: "थीम", switchLanguage: "भाषा बदलें" },
  ja: { ...{}, brandTitle: "Smart Manager", brandSubtitle: "業務 ERP", capabilities: "機能", whyUs: "選ばれる理由", launch: "開始", launchApp: "アプリを開く", language: "言語", workspaceArea: "ワークスペース", searchEverything: "モジュール、記録、操作を検索", helpSupport: "ヘルプとサポート", messages: "メッセージ", theme: "テーマ", switchLanguage: "言語を変更" },
};

function normalizeLanguage(value: string | null | undefined): Lang | null {
  const normalized = String(value || "").toLowerCase().split(/[-_]/)[0] as Lang;
  return LANGUAGE_OPTIONS.some((option) => option.code === normalized) ? normalized : null;
}

function initialLanguage(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem("smart_manager_lang");
  const legacyStored = localStorage.getItem("bs_lang");
  const savedLanguage = normalizeLanguage(stored) || normalizeLanguage(legacyStored);
  if (savedLanguage) return savedLanguage;
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const browserLanguage of browserLanguages) {
    if (browserLanguage?.toLowerCase().startsWith("sw")) return "sw";
    const detected = normalizeLanguage(browserLanguage);
    if (detected) return detected;
  }
  try { if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Africa/Dar_es_Salaam") return "sw"; } catch { /* English fallback */ }
  return "en";
}

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  languageOptions: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthContext();
  const liveSession = Boolean(auth.configured && auth.session?.access_token && auth.isAuthenticated);
  const authenticatedUserId = auth.user?.id;
  const profileQuery = trpc.profileIdentity.get.useQuery(undefined, {
    enabled: liveSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const persistLanguageMutation = trpc.profileIdentity.update.useMutation();
  const [lang, setLangState] = useState<Lang>(initialLanguage);
  const [profileHydrated, setProfileHydrated] = useState(!liveSession);

  useEffect(() => {
    if (liveSession) setProfileHydrated(false);
  }, [authenticatedUserId, liveSession]);

  useEffect(() => {
    if (!liveSession) {
      setProfileHydrated(true);
      return;
    }
    if (profileQuery.isPending || profileQuery.isFetching) return;
    const remoteProfile = profileQuery.data?.profile;
    const remoteLanguage = remoteProfile && remoteProfile.id === authenticatedUserId
      ? normalizeLanguage(profileQuery.data?.preferences?.language || remoteProfile.preferredLanguage)
      : null;
    if (remoteLanguage) {
      setLangState(remoteLanguage);
      if (typeof window !== "undefined") {
        localStorage.setItem("smart_manager_lang", remoteLanguage);
        localStorage.setItem("bs_lang", remoteLanguage);
      }
    }
    setProfileHydrated(true);
  }, [authenticatedUserId, liveSession, profileQuery.data, profileQuery.isFetching, profileQuery.isPending]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_manager_lang", newLang);
      localStorage.setItem("bs_lang", newLang);
      document.documentElement.lang = newLang;
      document.documentElement.dir = LANGUAGE_OPTIONS.find((option) => option.code === newLang)?.dir || "ltr";
      window.dispatchEvent(new CustomEvent("smart-manager:language-changed", { detail: { lang: newLang } }));
    }
    if (liveSession && profileHydrated && profileQuery.data?.profile?.id === authenticatedUserId) {
      persistLanguageMutation.mutate({ preferredLanguage: newLang });
    }
  };
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.lang = lang;
      document.documentElement.dir = LANGUAGE_OPTIONS.find((option) => option.code === lang)?.dir || "ltr";
    }
  }, [lang]);
  const t = (key: string) => translations[lang]?.[key] || translations.en[key] || key;
  return <LanguageContext.Provider value={{ lang, setLang, t, languageOptions: LANGUAGE_OPTIONS }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
