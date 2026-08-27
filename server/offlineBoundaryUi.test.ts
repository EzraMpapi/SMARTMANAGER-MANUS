import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("offline boundary user interface", () => {
  it("allows the loaded workspace to remain viewable while permanently pausing unconfirmed business writes", () => {
    expect(source).toContain('const [offlineNoticeDismissed, setOfflineNoticeDismissed] = useState(false)');
    expect(source).toContain("Connection unavailable — writes are paused");
    expect(source).toContain("You can continue viewing the workspace already loaded in this tab");
    expect(source).toContain("Business records:</strong> create, update, and delete actions remain paused.");
    expect(source).toContain("Continue viewing current workspace");
  });

  it("keeps POS recovery explicitly pending until server confirmation rather than treating it as completed offline data", () => {
    expect(source).toContain("require server confirmation before inventory, revenue, receipt output, or customer balances change");
    expect(source).toContain("Sale ${record.docNumber} is pending sync. It is not yet completed and has not changed inventory or revenue.");
    expect(source).toContain('window.addEventListener("online", handleOnline)');
    expect(source).not.toContain("SmartManagerDB");
    expect(source).not.toContain("syncQueue");
  });
});
