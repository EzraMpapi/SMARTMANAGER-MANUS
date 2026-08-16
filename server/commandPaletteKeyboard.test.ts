import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboard.jsx", import.meta.url), "utf8");
const palette = source.slice(source.indexOf("function CommandPalette"), source.indexOf("function ProfileMenu"));

describe("global command palette keyboard behavior", () => {
  it("closes on Escape while preserving arrow-key and enter navigation", () => {
    expect(palette).toContain('if (e.key === "Escape") { e.preventDefault(); onClose(); return; }');
    expect(palette).toContain('else if (e.key === "Enter" && results[selectedIndex])');
    expect(palette).toContain(">Esc</kbd>");
  });
});
