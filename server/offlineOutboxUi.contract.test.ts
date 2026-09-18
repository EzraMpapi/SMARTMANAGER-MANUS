import fs from "node:fs";
import { describe, expect, it } from "vitest";

const sync = fs.readFileSync("client/src/lib/offlineSync.js", "utf8");
const dashboard = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");

describe("offline outbox management UI contracts", () => {
  it("provides retry and discard operations for individual queued mutations", () => {
    expect(sync).toContain("export function retryOfflineMutation");
    expect(sync).toContain("export function discardOfflineMutation");
    expect(dashboard).toContain("retryOfflineMutation(offlineMutationScope(), entry.id)");
    expect(dashboard).toContain("discardOfflineMutation(offlineMutationScope(), entry.id)");
  });

  it("shows an expandable encrypted outbox list with item status and actions", () => {
    expect(dashboard).toContain('aria-expanded={expanded}');
    expect(dashboard).toContain("Offline outbox");
    expect(dashboard).toContain('entry.status === "failed"');
    expect(dashboard).toContain("Retry");
    expect(dashboard).toContain("Discard");
  });

  it("keeps pending, syncing, failed, and conflict entries visible", () => {
    expect(dashboard).toContain('["pending", "syncing", "failed", "conflict"]');
    expect(dashboard).toContain("summary.conflicts === 0");
  });
});
