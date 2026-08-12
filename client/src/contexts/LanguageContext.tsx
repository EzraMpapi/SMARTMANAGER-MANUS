import React, { createContext, useContext, useState, useEffect } from "react";

export type Lang = "en" | "sw";

const translations: Record<Lang, Record<string, string>> = {
  en: {
    brandTitle: "Smart Manager",
    brandSubtitle: "Operational ERP",
    capabilities: "Capabilities",
    whyUs: "Why Us",
    launch: "Launch",
    launchApp: "Launch App",
    heroBadge: "Tanzanian Enterprise Solution for Businesses",
    heroTitle1: "Run the work.",
    heroTitle2: "See the whole business.",
    heroSubtitle: "Simamia Biashara Yako. Popote, Wakati Wote. Smart Manager brings commercial, financial, and operational workflows together in one noble command center.",
    exploreCapabilities: "Explore capabilities",
    liveOperationalData: "Live operational data",
    connectedModules: "Connected business modules",
    actionReadyWorkflows: "Action-ready workflows",
    businessOverview: "Business Overview",
    liveWorkspace: "Live Workspace",
    operationalMomentum: "Operational Momentum",
    nextBestAction: "Next Best Action",
    nextBestActionDesc: "Review the priorities surfaced by your connected business workflows.",
    oneWorkspace: "One Workspace",
    oneWorkspaceDesc: "Centralize customer, inventory, finance, and people workflows in one command center.",
    liveDataPath: "Live Data Path",
    liveDataPathDesc: "Direct Supabase integration ensures every signal is accurate and action-ready.",
    builtInControls: "Built-in Controls",
    builtInControlsDesc: "Role-aware access, audit visibility, and automated reporting for peace of mind.",
    ecosystemTitle: "The Noble Ecosystem",
    ecosystemHeading: "Capabilities that radiate authority.",
    ecosystemDesc: "Smart Manager keeps core business functions in reach while giving each team the dedicated workflows it needs to move work forward with precision.",
    readyCommandCenter: "Ready to enter the command center?",
    readyCommandCenterDesc: "Launch the Smart Manager ERP dashboard to work with connected modules and live operational data. Salama na Mwaminifu.",
    launchWorkspace: "Launch Workspace",
    madeInTanzania: "Imetengenezwa Tanzania",
    copyright: "© 2026 Smart Manager · Enterprise Business Ecosystem",
  },
  sw: {
    brandTitle: "Smart Manager",
    brandSubtitle: "Mfumo wa Uendeshaji",
    capabilities: "Uwezo",
    whyUs: "Kwanini Sisi",
    launch: "Anza",
    launchApp: "Fungua Mfumo",
    heroBadge: "Bidhaa ya Kitanzania kwa Wafanyabiashara",
    heroTitle1: "Simamia kazi.",
    heroTitle2: "Ona biashara nzima.",
    heroSubtitle: "Simamia Biashara Yako. Popote, Wakati Wote. Smart Manager inaleta pamoja mifumo ya fedha, mauzo, na uendeshaji katika kituo kimoja thabiti.",
    exploreCapabilities: "Chunguza uwezo",
    liveOperationalData: "Data za uendeshaji za moja kwa moja",
    connectedModules: "Moduli zilizounganishwa",
    actionReadyWorkflows: "Mifumo ya vitendo",
    businessOverview: "Muhtasari wa Biashara",
    liveWorkspace: "Kituo cha Kazi",
    operationalMomentum: "Kasi ya Uendeshaji",
    nextBestAction: "Hatua Inayofuata",
    nextBestActionDesc: "Kagua vipaumbele vilivyotolewa na mifumo yako ya biashara.",
    oneWorkspace: "Sehemu Moja",
    oneWorkspaceDesc: "Unganisha wateja, bidhaa, fedha, na rasilimali watu katika sehemu moja.",
    liveDataPath: "Data za Moja kwa Moja",
    liveDataPathDesc: "Uunganishaji wa Supabase unahakikisha kila taarifa iko sahihi na salama.",
    builtInControls: "Udhibiti Madhubuti",
    builtInControlsDesc: "Ulinzi wa viwango vya watumiaji, ukaguzi, na ripoti za kiotomatiki.",
    ecosystemTitle: "Mfumo Thabiti",
    ecosystemHeading: "Uwezo unaoleta mamlaka katika biashara.",
    ecosystemDesc: "Smart Manager huweka shughuli zote za biashara mikononi mwako kwa usahihi na urahisi.",
    readyCommandCenter: "Uko tayari kuingia kwenye mfumo?",
    readyCommandCenterDesc: "Fungua dashibodi ya Smart Manager ili kufanya kazi na moduli zilizounganishwa na data halisi. Salama na Mwaminifu.",
    launchWorkspace: "Fungua Dashibodi",
    madeInTanzania: "Imetengenezwa Tanzania",
    copyright: "© 2026 Smart Manager · Mfumo wa Biashara",
  }
};

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem("smart_manager_lang") as Lang) || "en";
    }
    return "en";
  });

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_manager_lang", newLang);
    }
  };

  const t = (key: string) => {
    return translations[lang]?.[key] || translations["en"][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
}
