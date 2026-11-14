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

const ECOSYSTEM_MODULE_LABELS = {
  en: { dashboard: "Dashboard", pos: "Point of Sale", sales: "Sales", inventory: "Inventory", finance: "Finance", crm: "CRM", hr: "Human Resources", reports: "Reports", ai: "AI Assistant", procurement: "Procurement", manufacturing: "Manufacturing", scm: "Supply Chain", projects: "Projects", documents: "Documents", support: "Customer Support", analytics: "Analytics", notifications: "Notifications", healthcare: "Healthcare / Clinic", pharmacy: "Pharmacy Management", school: "School Management", hotel: "Hotel & Hospitality", restaurant: "Restaurant & F&B" },
  sw: { dashboard: "Dashibodi", pos: "Sehemu ya Mauzo", sales: "Mauzo", inventory: "Hesabu ya Bidhaa", finance: "Fedha", crm: "Usimamizi wa Wateja", hr: "Rasilimali Watu", reports: "Ripoti", ai: "Msaidizi wa Akili Bandia", procurement: "Ununuzi", manufacturing: "Uzalishaji", scm: "Mnyororo wa Ugavi", projects: "Miradi", documents: "Nyaraka", support: "Huduma kwa Wateja", analytics: "Uchambuzi", notifications: "Arifa", healthcare: "Afya / Kliniki", pharmacy: "Usimamizi wa Famasi", school: "Usimamizi wa Shule", hotel: "Hoteli na Ukarimu", restaurant: "Mgahawa na Chakula" },
  fr: { dashboard: "Tableau de bord", pos: "Point de vente", sales: "Ventes", inventory: "Stocks", finance: "Finances", crm: "CRM", hr: "Ressources humaines", reports: "Rapports", ai: "Assistant IA", procurement: "Achats", manufacturing: "Production", scm: "Chaîne d’approvisionnement", projects: "Projets", documents: "Documents", support: "Assistance client", analytics: "Analytique", notifications: "Notifications", healthcare: "Santé / Clinique", pharmacy: "Gestion de pharmacie", school: "Gestion scolaire", hotel: "Hôtellerie", restaurant: "Restauration" },
  es: { dashboard: "Panel", pos: "Punto de venta", sales: "Ventas", inventory: "Inventario", finance: "Finanzas", crm: "CRM", hr: "Recursos humanos", reports: "Informes", ai: "Asistente de IA", procurement: "Compras", manufacturing: "Fabricación", scm: "Cadena de suministro", projects: "Proyectos", documents: "Documentos", support: "Atención al cliente", analytics: "Analítica", notifications: "Notificaciones", healthcare: "Salud / Clínica", pharmacy: "Gestión de farmacia", school: "Gestión escolar", hotel: "Hotelería", restaurant: "Restaurante y gastronomía" },
  pt: { dashboard: "Painel", pos: "Ponto de venda", sales: "Vendas", inventory: "Inventário", finance: "Finanças", crm: "CRM", hr: "Recursos humanos", reports: "Relatórios", ai: "Assistente de IA", procurement: "Compras", manufacturing: "Produção", scm: "Cadeia de abastecimento", projects: "Projetos", documents: "Documentos", support: "Apoio ao cliente", analytics: "Análise", notifications: "Notificações", healthcare: "Saúde / Clínica", pharmacy: "Gestão de farmácia", school: "Gestão escolar", hotel: "Hotelaria", restaurant: "Restaurante e restauração" },
  zh: { dashboard: "仪表盘", pos: "销售终端", sales: "销售", inventory: "库存", finance: "财务", crm: "客户管理", hr: "人力资源", reports: "报表", ai: "AI 助手", procurement: "采购", manufacturing: "生产制造", scm: "供应链", projects: "项目", documents: "文档", support: "客户支持", analytics: "分析", notifications: "通知", healthcare: "医疗 / 诊所", pharmacy: "药房管理", school: "学校管理", hotel: "酒店与餐饮", restaurant: "餐厅与餐饮" },
  ar: { dashboard: "لوحة التحكم", pos: "نقطة البيع", sales: "المبيعات", inventory: "المخزون", finance: "المالية", crm: "إدارة العملاء", hr: "الموارد البشرية", reports: "التقارير", ai: "مساعد الذكاء الاصطناعي", procurement: "المشتريات", manufacturing: "التصنيع", scm: "سلسلة التوريد", projects: "المشاريع", documents: "المستندات", support: "دعم العملاء", analytics: "التحليلات", notifications: "الإشعارات", healthcare: "الرعاية الصحية / العيادة", pharmacy: "إدارة الصيدلية", school: "إدارة المدارس", hotel: "الفنادق والضيافة", restaurant: "المطاعم والأغذية" },
  de: { dashboard: "Dashboard", pos: "Kassensystem", sales: "Vertrieb", inventory: "Lager", finance: "Finanzen", crm: "CRM", hr: "Personalwesen", reports: "Berichte", ai: "KI-Assistent", procurement: "Einkauf", manufacturing: "Fertigung", scm: "Lieferkette", projects: "Projekte", documents: "Dokumente", support: "Kundenservice", analytics: "Analyse", notifications: "Benachrichtigungen", healthcare: "Gesundheitswesen / Klinik", pharmacy: "Apothekenverwaltung", school: "Schulverwaltung", hotel: "Hotel und Gastgewerbe", restaurant: "Restaurant und Gastronomie" },
  hi: { dashboard: "डैशबोर्ड", pos: "पॉइंट ऑफ़ सेल", sales: "बिक्री", inventory: "इन्वेंटरी", finance: "वित्त", crm: "ग्राहक प्रबंधन", hr: "मानव संसाधन", reports: "रिपोर्ट", ai: "AI सहायक", procurement: "खरीद", manufacturing: "निर्माण", scm: "आपूर्ति श्रृंखला", projects: "परियोजनाएँ", documents: "दस्तावेज़", support: "ग्राहक सहायता", analytics: "विश्लेषण", notifications: "सूचनाएँ", healthcare: "स्वास्थ्य / क्लिनिक", pharmacy: "फार्मेसी प्रबंधन", school: "स्कूल प्रबंधन", hotel: "होटल और आतिथ्य", restaurant: "रेस्टोरेंट और खाद्य" },
  ja: { dashboard: "ダッシュボード", pos: "POS", sales: "営業", inventory: "在庫", finance: "財務", crm: "顧客管理", hr: "人事", reports: "レポート", ai: "AIアシスタント", procurement: "購買", manufacturing: "製造", scm: "サプライチェーン", projects: "プロジェクト", documents: "ドキュメント", support: "カスタマーサポート", analytics: "分析", notifications: "通知", healthcare: "医療 / クリニック", pharmacy: "薬局管理", school: "学校管理", hotel: "ホテル・ホスピタリティ", restaurant: "レストラン・飲食" },
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

function ModuleNode({ module, label }) {
  const Icon = module.icon;
  const style = { "--module-x": module.x, "--module-y": module.y, "--module-delay": module.delay, "--module-entry-delay": module.entryDelay, "--module-duration": module.duration };
  return <div className={`sm-auth-module sm-auth-module--${module.motion} sm-auth-module--${module.tone} ${module.mobile ? "sm-auth-module--mobile" : ""}`} style={style}>
    <div className="sm-auth-module__surface"><Icon size={18} strokeWidth={1.8} /></div>
    <span className="sm-auth-module__tooltip">{label}</span>
  </div>;
}

export function LoginModuleEcosystem({ variant = "desktop", industry = "general" }) {
  const { lang } = useLanguage();
  const labels = ECOSYSTEM_MODULE_LABELS[lang] || ECOSYSTEM_MODULE_LABELS.en;
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
    {modules.map((module) => <ModuleNode key={module.id} module={module} label={labels[module.id] || module.labels.en} />)}
  </div>;
}

export const loginModuleEcosystemModules = Object.values(MODULE_CATALOG).map(({ id, labels }) => ({ id, label: labels.en }));
