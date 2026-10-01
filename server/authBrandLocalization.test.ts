import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const languageSource = readFileSync(new URL("../client/src/contexts/LanguageContext.tsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const domLocalizationSource = readFileSync(new URL("../client/src/lib/domLocalization.ts", import.meta.url), "utf8");
const traSource = readFileSync(new URL("../client/src/components/TraPortalModule.jsx", import.meta.url), "utf8");
const stylesSource = readFileSync(new URL("../client/src/index.css", import.meta.url), "utf8");

describe("Tanzania-first authentication branding and localization", () => {
  it("defaults to Kiswahili for Tanzania signals while preserving saved preferences", () => {
    expect(languageSource).toContain('const stored = localStorage.getItem("smart_manager_lang")');
    expect(languageSource).toContain('startsWith("sw")');
    expect(languageSource).toContain('"Africa/Dar_es_Salaam"');
    expect(languageSource).toContain('localStorage.setItem("smart_manager_lang", newLang)');
  });

  it("supports the global international language registry and shared preference", () => {
    expect(languageSource).toContain('"fr"');
    expect(languageSource).toContain('"es"');
    expect(languageSource).toContain('"pt"');
    expect(languageSource).toContain('"zh"');
    expect(languageSource).toContain('"ar"');
    expect(languageSource).toContain('localStorage.setItem("bs_lang", newLang)');
    expect(dashboardSource).toContain("dashboard-topbar-language-control");
    expect(dashboardSource).toContain("languageOptions.map");
  });
  it("keeps the approved lockup on the workspace-completion screen and auth background", () => {
    expect(dashboardSource).toContain('SMART <span className="text-[#008A45]">MANAGER</span>');
    expect(dashboardSource).toContain("Simamia Biashara Yako. Popote, Wakati Wote.");
    expect(stylesSource).toContain("Tanzania-first public authentication treatment");
    expect(stylesSource).toContain("#FCD116");
    expect(stylesSource).toContain("prefers-reduced-motion: reduce");
  });
  it("localizes legacy and lazy-loaded UI without a refresh", () => {
    expect(languageSource).toContain("installDocumentLocalization");
    expect(languageSource).toContain("setDocumentLocalization(lang)");
    expect(domLocalizationSource).toContain("new MutationObserver");
    expect(domLocalizationSource).toContain("localizedPhraseCount");
    expect(dashboardSource).toContain("const { lang, t } = useLanguage();");
    expect(dashboardSource).not.toContain("setInterval(handleStorage, 1000)");
    expect(traSource).toContain('const { lang: sharedLang } = useLanguage();');
  });
});
