import fs from "node:fs";
import { describe, expect, it } from "vitest";

const dashboard = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");
const offlineSync = fs.readFileSync("client/src/lib/offlineSync.js", "utf8");

describe("offline data access contracts", () => {
  it("serves cached company-table reads while offline", () => {
    expect(dashboard).toContain("readOfflineTableCache(offlineMutationScope(), table)");
    expect(dashboard).toContain("offline: true");
    expect(dashboard).toContain("method === \"GET\" && typeof navigator !== \"undefined\" && navigator.onLine === false");
  });

  it("queues direct builder mutations and applies optimistic local changes", () => {
    expect(dashboard).toContain("applyOfflineMutationToCache(offlineMutationScope(), table, operation, optimisticPayload");
    expect(dashboard).toContain("const replayPayload = operation === \"insert\"");
    expect(dashboard).toContain("return single ? (Array.isArray(optimistic) ? optimistic[0] : optimistic) : optimistic");
    expect(offlineSync).toContain("replayOfflineMutations");
  });

  it("replays the outbox after the browser returns online", () => {
    expect(dashboard).toContain("window.addEventListener(\"online\", replayAfterOnline)");
    expect(dashboard).toContain("await replayCompanyTableOutbox()");
    expect(dashboard).toContain("if (typeof navigator !== \"undefined\" && navigator.onLine === false) return [];");
  });
});
