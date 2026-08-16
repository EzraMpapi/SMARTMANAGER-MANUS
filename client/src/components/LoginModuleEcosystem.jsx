import React from "react";
import { BarChart3, Brain, Briefcase, LayoutDashboard, Package, ShoppingBag, ShoppingCart, Users, Wallet } from "lucide-react";

// These are a deliberately small, representative selection of the real module
// identifiers and Lucide icons defined in BusinessSphereDashboard.jsx. The login
// scene is decorative only; it neither navigates nor changes authorization.
const AUTH_MODULES = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, motion: "orbit", x: "14%", y: "22%", delay: "-4.4s", entryDelay: ".12s", duration: "15s", tone: "emerald", mobile: true },
  { id: "pos", label: "Point of Sale", icon: ShoppingBag, motion: "float", x: "72%", y: "14%", delay: "-1.8s", entryDelay: ".2s", duration: "7.5s", tone: "gold", mobile: true },
  { id: "sales", label: "Sales", icon: ShoppingCart, motion: "slide", x: "79%", y: "42%", delay: "-5.2s", entryDelay: ".28s", duration: "10.5s", tone: "blue", mobile: false },
  { id: "inventory", label: "Inventory", icon: Package, motion: "float", x: "18%", y: "60%", delay: "-3.1s", entryDelay: ".36s", duration: "8.5s", tone: "emerald", mobile: true },
  { id: "finance", label: "Finance", icon: Wallet, motion: "orbit-reverse", x: "70%", y: "68%", delay: "-7.1s", entryDelay: ".44s", duration: "17s", tone: "gold", mobile: true },
  { id: "crm", label: "CRM", icon: Users, motion: "pulse", x: "42%", y: "17%", delay: "-2.6s", entryDelay: ".52s", duration: "4.8s", tone: "blue", mobile: false },
  { id: "hr", label: "HR", icon: Briefcase, motion: "rotate", x: "43%", y: "74%", delay: "-6.4s", entryDelay: ".6s", duration: "20s", tone: "emerald", mobile: false },
  { id: "reports", label: "Reports", icon: BarChart3, motion: "float", x: "9%", y: "80%", delay: "-5.8s", entryDelay: ".68s", duration: "6.4s", tone: "gold", mobile: false },
  { id: "ai", label: "AI Assistant", icon: Brain, motion: "orbit", x: "84%", y: "83%", delay: "-8.5s", entryDelay: ".76s", duration: "14s", tone: "blue", mobile: false },
];

function ModuleNode({ module }) {
  const Icon = module.icon;
  const style = { "--module-x": module.x, "--module-y": module.y, "--module-delay": module.delay, "--module-entry-delay": module.entryDelay, "--module-duration": module.duration };
  return <div className={`sm-auth-module sm-auth-module--${module.motion} sm-auth-module--${module.tone} ${module.mobile ? "sm-auth-module--mobile" : ""}`} style={style}>
    <div className="sm-auth-module__surface"><Icon size={18} strokeWidth={1.8} /></div>
    <span className="sm-auth-module__tooltip">{module.label}</span>
  </div>;
}

export function LoginModuleEcosystem({ variant = "desktop" }) {
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
    {AUTH_MODULES.map((module) => <ModuleNode key={module.id} module={module} />)}
  </div>;
}

export const loginModuleEcosystemModules = AUTH_MODULES.map(({ id, label }) => ({ id, label }));
