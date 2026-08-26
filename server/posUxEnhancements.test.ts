import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

describe("POS UX Enhancements", () => {
  const dashboardPath = path.resolve(process.cwd(), "client/src/BusinessSphereDashboardCore.jsx");
  const source = fs.readFileSync(dashboardPath, "utf-8");

  it("includes offline connection status alert banner with manual force sync button", () => {
    expect(source).toContain("Network connection interrupted");
    expect(source).toContain("Force sync all");
    expect(source).toContain("isOnline");
  });

  it("includes visual busy loading spinner and message indicator during checkout processing", () => {
    expect(source).toContain("Processing transaction...");
    expect(source).toContain("animate-spin");
  });

  it("includes offline queue inspection modal for viewing queued transactions", () => {
    expect(source).toContain("Offline Queue Inspection");
    expect(source).toContain("inspectingQueueItem");
    expect(source).toContain("Cart Items");
  });

  it("includes CSV export and print-friendly report options for offline queued transactions", () => {
    expect(source).toContain("exportPendingSalesCsv");
    expect(source).toContain("printPendingSalesQueue");
    expect(source).toContain("POS Offline Pending-Sync Queue Report");
  });

  it("includes success notification and audio feedback when queued sales successfully synchronize", () => {
    expect(source).toContain("synchronized successfully. Inventory deducted and revenue recorded");
    expect(source).toContain("AudioContext");
  });

  it("highlights failed sync attempts in red and provides accessible tooltips with error reasons", () => {
    expect(source).toContain("bg-red-50/90");
    expect(source).toContain("Sync Error:");
    expect(source).toContain("Reason:");
  });

  it("includes options to edit or delete failed transactions directly from the offline queue modal", () => {
    expect(source).toContain("editingQueueItem");
    expect(source).toContain("Edit Queued Sale");
    expect(source).toContain("Save changes");
  });

  it("shows an accessible badge with the current pending offline transaction count in the edit modal", () => {
    expect(source).toContain("pending offline transactions");
    expect(source).toContain("aria-label={`${pendingSales.length} pending offline transactions`}");
    expect(source).toContain("{pendingSales.length} pending");
  });

  it("provides a disabled-aware Sync Now action beside the pending badge", () => {
    expect(source).toContain("async function syncPendingSales()");
    expect(source).toContain("setSyncingQueue(true)");
    expect(source).toContain("Sync Now");
    expect(source).toContain("disabled={pendingSales.length === 0 || syncingQueue}");
    expect(source).toContain("Sync pending offline transactions now");
    expect(source).toContain("aria-busy={syncingQueue}");
    expect(source).toContain('className={syncingQueue ? "animate-spin" : ""}');
  });

  it("shows truthful completion toasts after the manual queue sync finishes", () => {
    expect(source).toContain("Sync complete:");
    expect(source).toContain("confirmed by the server");
    expect(source).toContain("Sync finished with");
    expect(source).toContain("still pending");
    expect(source).toContain("needs attention");
  });
});
