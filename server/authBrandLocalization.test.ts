import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const languageSource = readFileSync(new URL("../client/src/contexts/LanguageContext.tsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("Tanzania-first authentication branding and localization", () => {
  it("defaults to Kiswahili for Tanzania signals while preserving saved preferences", () => {
    expect(languageSource).toContain('const stored = localStorage.getItem("smart_manager_lang")');
    expect(languageSource).toContain('startsWith("sw")');
    expect(languageSource).toContain('"Africa/Dar_es_Salaam"');
    expect(languageSource).toContain('localStorage.setItem("smart_manager_lang", newLang)');
  });

  it("keeps the approved lockup on the workspace-completion screen and auth background", () => {
    expect(dashboardSource).toContain('SMART <span className="text-[#008A45]">MANAGER</span>');
    expect(dashboardSource).toContain("Simamia Biashara Yako. Popote, Wakati Wote.");
    expect(stylesSource).toContain("Tanzania-first public authentication treatment");
    expect(stylesSource).toContain("#FCD116");
    expect(stylesSource).toContain("prefers-reduced-motion: reduce");
  });
});
