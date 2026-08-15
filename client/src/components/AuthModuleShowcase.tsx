import { useEffect, useState } from "react";
import {
  BarChart3,
  Boxes,
  BriefcaseBusiness,
  ClipboardList,
  Factory,
  FileText,
  Package,
  ReceiptText,
  Users,
  Wallet,
} from "lucide-react";

const AUTH_MODULES = [
  { id: "finance", en: "Finance", sw: "Fedha", icon: Wallet },
  { id: "hr", en: "HR & Payroll", sw: "Rasilimali Watu", icon: Users },
  { id: "crm", en: "CRM", sw: "CRM", icon: BriefcaseBusiness },
  { id: "inventory", en: "Inventory", sw: "Hesabu ya Bidhaa", icon: Package },
  { id: "procurement", en: "Procurement", sw: "Ununuzi", icon: ClipboardList },
  { id: "sales", en: "Sales & POS", sw: "Mauzo na POS", icon: ReceiptText },
  { id: "projects", en: "Projects", sw: "Miradi", icon: FileText },
  { id: "manufacturing", en: "Manufacturing", sw: "Uzalishaji", icon: Factory },
  { id: "analytics", en: "Analytics", sw: "Uchambuzi", icon: BarChart3 },
];

type AuthModuleShowcaseProps = {
  compact?: boolean;
};

export function AuthModuleShowcase({ compact = false }: AuthModuleShowcaseProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const language = typeof window !== "undefined" ? localStorage.getItem("smart_manager_lang") : "en";
  const current = AUTH_MODULES[activeIndex];
  const ActiveIcon = current.icon;

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % AUTH_MODULES.length);
    }, 3600);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <div
      className={compact ? "auth-module-showcase auth-module-showcase--compact" : "auth-module-showcase"}
      aria-hidden="true"
    >
      <div className="auth-module-showcase__orbit auth-module-showcase__orbit--one" />
      <div className="auth-module-showcase__orbit auth-module-showcase__orbit--two" />
      <div className="auth-module-showcase__core">
        <div className="auth-module-showcase__core-icon">
          <Boxes size={compact ? 16 : 20} strokeWidth={1.8} />
        </div>
        <span>Smart Manager</span>
      </div>
      <div className="auth-module-showcase__active-module">
        <span className="auth-module-showcase__active-icon">
          <ActiveIcon size={compact ? 13 : 15} strokeWidth={1.9} />
        </span>
        <span>{language === "sw" ? current.sw : current.en}</span>
      </div>
      {!compact && (
        <div className="auth-module-showcase__module-grid">
          {AUTH_MODULES.map((module, index) => {
            const Icon = module.icon;
            const active = index === activeIndex;
            return (
              <span
                key={module.id}
                className={`auth-module-chip ${active ? "auth-module-chip--active" : ""}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <Icon size={13} strokeWidth={1.8} />
                <span>{language === "sw" ? module.sw : module.en}</span>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

export { AUTH_MODULES };
export default AuthModuleShowcase;
