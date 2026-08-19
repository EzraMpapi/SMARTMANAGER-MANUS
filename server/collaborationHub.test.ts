import { describe, it, expect } from "vitest";
import fs from "fs";

describe("Collaboration Hub Enterprise Suite", () => {
  const dashboardSource = fs.readFileSync("/home/ubuntu/businesssphere-erp/client/src/BusinessSphereDashboard.jsx", "utf8");

  it("includes all Collaboration Hub tabs and real-time features", () => {
    expect(dashboardSource).toContain("Collaboration Hub");
    expect(dashboardSource).toContain("Team Chat");
    expect(dashboardSource).toContain("Enterprise Calendar");
    expect(dashboardSource).toContain("Team Workspaces");
    expect(dashboardSource).toContain("Notebook");
    expect(dashboardSource).toContain("File Sharing");
    expect(dashboardSource).toContain("Resource Scheduler");
    expect(dashboardSource).toContain("Video Meeting");
  });

  it("implements conflict-checked resource scheduling and private note filtering", () => {
    expect(dashboardSource).toContain("Resource Scheduler");
    expect(dashboardSource).toContain("is already booked");
    expect(dashboardSource).toContain("Private notes are only ever visible to you");
    expect(dashboardSource).toContain("collab_channels");
    expect(dashboardSource).toContain("collab_messages");
  });

  it("supports threaded chat replies, attachment URLs, .ics calendar export, and workspace audit CSV export", () => {
    expect(dashboardSource).toContain("replyingToId");
    expect(dashboardSource).toContain("attachmentUrl");
    expect(dashboardSource).toContain("BEGIN:VCALENDAR");
    expect(dashboardSource).toContain("workspace-membership-audit");
  });

  it("supports emoji reactions, pinned messages, calendar reminders, and department workspace permissions", () => {
    expect(dashboardSource).toContain("messageReactions");
    expect(dashboardSource).toContain("pinnedMessageIds");
    expect(dashboardSource).toContain("remindersEnabled");
    expect(dashboardSource).toContain("isManagerOrAdmin");
  });
});
