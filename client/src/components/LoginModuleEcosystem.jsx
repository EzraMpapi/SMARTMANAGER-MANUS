import React from "react";
import { BarChart3, Bell, Brain, Briefcase, ClipboardCheck, Factory, FileText, Gauge, Headphones, HeartPulse, Hotel, Kanban, LayoutDashboard, Package, School, ShoppingBag, ShoppingCart, Tablets, Truck, Users, UtensilsCrossed, Wallet } from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";
import { normalizeOrganizationIndustryFocus } from "../lib/organizationIndustryFocus";

// All identifiers and icons below are existing Smart Manager modules from the
// shared dashboard module registry. This decorative surface never changes
// permissions, navigation, or the active workspace configuration.
const MODULE_CATALOG = {
  dashboard: { id: "dashboard", icon: LayoutDashboard, labels: { en: "Dashboard", sw: "Dashibodi" } },
  pos: { id: "pos", icon: ShoppingBag, labels: { en: "Point of Sale", sw: "Sehemu ya Mauzo" } },
  sales: { id: "sales", icon: ShoppingCart, labels: { en: "Sales", sw: "Mauzo" } },
  inventory: { id: "inventory", icon: Package, labels: { en: "Inventory", sw: "Hesabu ya Bidhaa" } },
  finance: { id: "finance", icon: Wallet, labels: { en: "Finance", sw: "Fedha" } },
  crm: { id: "crm", icon: Users, labels: { en: "CRM", sw: "Usimamizi wa Wateja" } },
  hr: { id: "hr", icon: Briefcase, labels: { en: "Human Resources", sw: "Rasilimali Watu" } },
  reports: { id: "reports", icon: BarChart3, labels: { en: "Reports", sw: "Ripoti" } },
  ai: { id: "ai", icon: Brain, labels: { en: "AI Assistant", sw: "Msaidizi wa Akili Bandia" } },
  procurement: { id: "procurement", icon: ClipboardCheck, labels: { en: "Procurement", sw: "Ununuzi" } },
  manufacturing: { id: "manufacturing", icon: Factory, labels: { en: "Manufacturing", sw: "Uzalishaji" } },
  scm: { id: "scm", icon: Truck, labels: { en: "Supply Chain", sw: "Mnyororo wa Ugavi" } },
  projects: { id: "projects", icon: Kanban, labels: { en: "Projects", sw: "Miradi" } },
  documents: { id: "documents", icon: FileText, labels: { en: "Documents", sw: "Nyaraka" } },
  support: { id: "support", icon: Headphones, labels: { en: "Customer Support", sw: "Huduma kwa Wateja" } },
  analytics: { id: "analytics", icon: Gauge, labels: { en: "Analytics", sw: "Uchambuzi" } },
  notifications: { id: "notifications", icon: Bell, labels: { en: "Notifications", sw: "Arifa" } },
  healthcare: { id: "healthcare", icon: HeartPulse, labels: { en: "Healthcare / Clinic", sw: "Afya / Kliniki" } },
  pharmacy: { id: "pharmacy", icon: Tablets, labels: { en: "Pharmacy Management", sw: "Usimamizi wa Famasi" } },
  school: { id: "school", icon: School, labels: { en: "School Management", sw: "Usimamizi wa Shule" } },
  hotel: { id: "hotel", icon: Hotel, labels: { en: "Hotel & Hospitality", sw: "Hoteli na Ukarimu" } },
  restaurant: { id: "restaurant", icon: UtensilsCrossed, labels: { en: "Restaurant & F&B", sw: "Mgahawa na Chakula" } },
};

const INDUSTRY_MODULES = {
  general: ["dashboard", "pos", "sales", "inventory", "finance", "crm", "hr", "reports", "ai"],
  retail: ["dashboard", "pos", "sales", "inventory", "crm", "procurement", "finance", "reports", "ai"],
  manufacturing: ["dashboard", "manufacturing", "inventory", "procurement", "scm", "finance", "projects", "reports", "ai"],
  services: ["dashboard", "crm", "projects", "documents", "finance", "hr", "support", "analytics", "ai"],
  healthcare: ["dashboard", "healthcare", "pharmacy", "inventory", "crm", "finance", "reports", "hr", "ai"],
  education: ["dashboard", "school", "crm", "finance", "hr", "documents", "notifications", "reports", "ai"],
  hospitality: ["dashboard", "hotel", "restaurant", "pos", "inventory", "crm", "finance", "reports", "ai"],
};

const NODE_LAYOUT = [
  { motion: "orbit", x: "14%", y: "22%", delay: "-4.4s", entryDelay: ".12s", duration: "15s", tone: "emerald", mobile: true },
  { motion: "float", x: "72%", y: "14%", delay: "-1.8s", entryDelay: ".2s", duration: "7.5s", tone: "gold", mobile: true },
  { motion: "slide", x: "79%", y: "42%", delay: "-5.2s", entryDelay: ".28s", duration: "10.5s", tone: "blue", mobile: false },
  { motion: "float", x: "18%", y: "60%", delay: "-3.1s", entryDelay: ".36s", duration: "8.5s", tone: "emerald", mobile: true },
  { motion: "orbit-reverse", x: "70%", y: "68%", delay: "-7.1s", entryDelay: ".44s", duration: "17s", tone: "gold", mobile: true },
  { motion: "pulse", x: "42%", y: "17%", delay: "-2.6s", entryDelay: ".52s", duration: "4.8s", tone: "blue", mobile: false },
  { motion: "rotate", x: "43%", y: "74%", delay: "-6.4s", entryDelay: ".6s", duration: "20s", tone: "emerald", mobile: false },
  { motion: "float", x: "9%", y: "80%", delay: "-5.8s", entryDelay: ".68s", duration: "6.4s", tone: "gold", mobile: false },
  { motion: "orbit", x: "84%", y: "83%", delay: "-8.5s", entryDelay: ".76s", duration: "14s", tone: "blue", mobile: false },
];

export function getLoginModulesForIndustry(industry = "general") {
  const focus = normalizeOrganizationIndustryFocus(industry);
  return (INDUSTRY_MODULES[focus] || INDUSTRY_MODULES.general).map((id, index) => ({ ...MODULE_CATALOG[id], ...NODE_LAYOUT[index] }));
}

function ModuleNode({ module, lang }) {
  const Icon = module.icon;
  const style = { "--module-x": module.x, "--module-y": module.y, "--module-delay": module.delay, "--module-entry-delay": module.entryDelay, "--module-duration": module.duration };
  return <div className={`sm-auth-module sm-auth-module--${module.motion} sm-auth-module--${module.tone} ${module.mobile ? "sm-auth-module--mobile" : ""}`} style={style}>
    <div className="sm-auth-module__surface"><Icon size={18} strokeWidth={1.8} /></div>
    <span className="sm-auth-module__tooltip">{module.labels[lang]}</span>
  </div>;
}

export function LoginModuleEcosystem({ variant = "desktop", industry = "general" }) {
  const { lang } = useLanguage();
  const modules = getLoginModulesForIndustry(industry);
  return <div className={`sm-auth-ecosystem sm-auth-ecosystem--${variant}`} aria-hidden="true">
    <svg className="sm-auth-ecosystem__links" viewBox="0 0 100 100" preserveAspectRatio="none" focusable="false">
      <path d="M14 24 C 28 20, 34 19, 43 18 S 64 15, 72 16" />
      <path d="M72 16 C 83 23, 83 34, 79 43 S 76 59, 70 68" />
      <path d="M18 61 C 29 69, 35 75, 43 75 S 62 72, 70 68" />
      <path d="M18 61 C 21 45, 20 33, 14 24" />
    </svg>
    <span className="sm-auth-ecosystem__particle sm-auth-ecosystem__particle--one" />
    <span className="sm-auth-ecosystem__particle sm-auth-ecosystem__particle--two" />
    <span className="sm-auth-ecosystem__particle sm-auth-ecosystem__particle--three" />
    {modules.map((module) => <ModuleNode key={module.id} module={module} lang={lang} />)}
  </div>;
}

export const loginModuleEcosystemModules = Object.values(MODULE_CATALOG).map(({ id, labels }) => ({ id, label: labels.en }));
