import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const homeSource = readFileSync(new URL("../client/src/pages/Home.tsx", import.meta.url), "utf8");
const dashboardSource = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");

describe("public and dashboard interaction contracts", () => {
  it("gives public theme and language controls explicit button semantics and state handlers", () => {
    expect(homeSource).toContain('type="button"\n              onClick={toggleTheme}');
    expect(homeSource).toContain('type="button"\n              onClick={() => setLang(lang === "en" ? "sw" : "en")}');
    expect(homeSource).toContain('title="Toggle theme"');
    expect(homeSource).toContain('title="Switch language"');
  });

  it("keeps public navigation and passkey controls bound to supported destinations or clear availability feedback", () => {
    expect(homeSource).toContain('href="#capabilities"');
    expect(homeSource).toContain('href="/app"');
    expect(homeSource).toContain('onClick={signInWithPublicPasskey}');
    expect(homeSource).toContain('disabled={passkeyPending}');
    expect(homeSource).toContain('id="public-passkey-status"');
    expect(homeSource).toContain('Passkey sign-in is not configured for this workspace.');
  });

  it("keeps dashboard action controls connected to real navigation, command, or confirmation paths", () => {
    expect(dashboardSource).toContain('onNavigate(module.id)');
    expect(dashboardSource).toContain('setPaletteOpen(true)');
    expect(dashboardSource).toContain('confirmAction(');
    expect(dashboardSource).not.toContain('onClick={() => {}}');
  });
});
