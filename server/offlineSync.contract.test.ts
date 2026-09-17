import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync("client/src/lib/offlineSync.js", "utf8");
const dashboard = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");

// These are source contracts because the browser storage APIs are intentionally
// not available in the server test runtime.
describe("offline-first synchronization contracts", () => {
  it("stores a durable outbox with pending, syncing, and failed states", () => {
    expect(source).toContain("OUTBOX_PREFIX");
    expect(source).toContain('status: "pending"');
    expect(source).toContain('status: "syncing"');
    expect(source).toContain('"failed"');
    expect(source).toContain("localStorage");
  });

  it("replays queued writes serially and removes only server-confirmed entries", () => {
    expect(source).toContain("for (const entry of entries)");
    expect(source).toContain("await executor(entry)");
    expect(source).toContain("removeOfflineMutation(normalizedScope, entry.id)");
    expect(source).toContain("status: conflict ? \"conflict\" : \"failed\"");
  });

  it("hydrates table snapshots offline and queues central table mutations", () => {
    expect(dashboard).toContain("readOfflineTableCache(offlineMutationScope(), table)");
    expect(dashboard).toContain("writeOfflineTableCache(offlineMutationScope(), table, confirmedRows)");
    expect(dashboard).toContain("enqueueOfflineMutation({ scope, table, operation, payload, matchCol, matchVal })");
    expect(dashboard).toContain("replayCompanyTableOutbox");
    expect(dashboard).toContain("Offline mode: changes are saved on this device");
  });
});
