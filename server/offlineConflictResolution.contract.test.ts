import fs from "node:fs";
import { describe, expect, it } from "vitest";

const sync = fs.readFileSync("client/src/lib/offlineSync.js", "utf8");
const dashboard = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");

describe("offline conflict resolution contracts", () => {
  it("records the base snapshot and supports explicit resolution strategies", () => {
    expect(sync).toContain("baseSnapshot");
    expect(sync).toContain("conflictStrategy: \"manual\"");
    expect(sync).toContain("server-wins");
    expect(sync).toContain("client-wins");
    expect(sync).toContain("resolveOfflineConflict");
  });

  it("detects server changes before replaying offline updates and deletes", () => {
    expect(dashboard).toContain("OFFLINE_CONFLICT");
    expect(dashboard).toContain("offlineRowsConflict(baseSnapshot, current)");
    expect(dashboard).toContain("conflictStrategy !== \"client-wins\"");
    expect(dashboard).toContain("baseSnapshot: entry.baseSnapshot");
  });

  it("exposes server-wins and client-wins actions for queued conflicts", () => {
    expect(dashboard).toContain("resolveOfflineConflict(offlineMutationScope(), entry.id, strategy");
    expect(dashboard).toContain('"server-wins"');
    expect(dashboard).toContain('"client-wins"');
    expect(dashboard).toContain("conflicts > 0");
  });
});
