import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");
const section = source.slice(source.indexOf("function NotificationChannels"), source.indexOf("function NotificationChannels") + 2800);

describe("notification channel persistence", () => {
  it("restores the previous channel configuration when a configured-workspace update is rejected", () => {
    expect(section).toContain("const previous = rows.find((channel) => channel.id === id);");
    expect(section).toContain("if (!previous) return;");
    expect(section).toContain("The server did not save this notification-channel change. The previous setting was restored.");
    expect(section).toContain("setRows((prev) => prev.map((channel) => (channel.id === id ? previous : channel)));");
  });
});
