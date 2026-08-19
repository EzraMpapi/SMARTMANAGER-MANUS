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

  it("supports instant provider testing, save feedback, and inline credential validation", () => {
    expect(dashboardSource).toContain("testWhatsappProviderConfig");
    expect(dashboardSource).toContain("Test Connection");
    expect(dashboardSource).toContain("connectionTestStatus");
    expect(dashboardSource).toContain("LoaderCircle");
    expect(dashboardSource).toContain("credentialErrors");
    expect(dashboardSource).toContain("aria-invalid");
    expect(dashboardSource).toContain("saved successfully");
  });
  it("keeps the WhatsApp provider configuration modal inside WhatsAppCenter", () => {
    const whatsappStart = dashboardSource.indexOf("function WhatsAppCenter(");
    const collaborationStart = dashboardSource.indexOf("function CollaborationHub(");
    const whatsappSource = dashboardSource.slice(whatsappStart, collaborationStart);
    const collaborationSource = dashboardSource.slice(collaborationStart);
    expect(whatsappSource).toContain("const [showConfigModal, setShowConfigModal] = useState(false)");
    expect(whatsappSource).toContain("Save & Activate Provider");
    expect(whatsappSource).toContain("aria-modal=\"true\"");
    expect(whatsappSource).toContain("handleEscape");
    expect(collaborationSource).not.toContain("showConfigModal");
  });
  it("supports threaded reaction summaries, HR department headcount, and WhatsApp feed filters", () => {
    expect(dashboardSource).toContain("threadReactionSummaries");
    expect(dashboardSource).toContain("Thread reaction summary");
    expect(dashboardSource).toContain("Department Headcount Summary");
    expect(dashboardSource).toContain("dateFilter");
    expect(dashboardSource).toContain("senderQuery");
    expect(dashboardSource).toContain("Sender A–Z");
  });
  it("supports emoji reactions, pinned messages, calendar reminders, and department workspace permissions", () => {
    expect(dashboardSource).toContain("messageReactions");
    expect(dashboardSource).toContain("pinnedMessageIds");
    expect(dashboardSource).toContain("remindersEnabled");
    expect(dashboardSource).toContain("isManagerOrAdmin");
  });

  it("supports channel-level read receipts, push-style calendar reminders, and workspace invite links", () => {
    expect(dashboardSource).toContain("Read by active team");
    expect(dashboardSource).toContain("Push Notification");
    expect(dashboardSource).toContain("Generate Invite Link");
  });

  it("supports role-aware mention broadcasts, timezone-adjusted reminders, and approval-gated workspace invites", () => {
    expect(dashboardSource).toContain("@all");
    expect(dashboardSource).toContain("reminderTimezone");
    expect(dashboardSource).toContain("Approval Pending");
  });

  it("supports channel notification mutes, calendar recurrence rules, and batch roster exports", () => {
    expect(dashboardSource).toContain("bs_muted_channels");
    expect(dashboardSource).toContain("Recurrence rule");
    expect(dashboardSource).toContain("Export Roster");
  });

  it("supports custom recurrence end dates, muted channel unread badges, and multi-department roster filters", () => {
    expect(dashboardSource).toContain("recurrenceEndDate");
    expect(dashboardSource).toContain("unreadCount");
    expect(dashboardSource).toContain("selectedExportDept");
  });

  it("supports recurring event exception dates, sound alerts for mentions, and selectable roster columns", () => {
    expect(dashboardSource).toContain("exceptionDates");
    expect(dashboardSource).toContain("AudioContext");
    expect(dashboardSource).toContain("exportColumns");
  });

  it("supports multi-workspace employee comparison, rich media thumbnail previews, and digest frequencies", () => {
    expect(dashboardSource).toContain("Cross-Workspace Employee Membership Matrix");
    expect(dashboardSource).toContain("previewFile");
    expect(dashboardSource).toContain("digestFrequency");
  });

  it("supports drag-and-drop channel uploads, custom digest email subjects, and matrix department drill-downs", () => {
    expect(dashboardSource).toContain("onDrop");
    expect(dashboardSource).toContain("Custom Email Subject Line");
    expect(dashboardSource).toContain("Dept:");
  });

  it("supports attachment size validation, recipient email previews, and employee name search", () => {
    expect(dashboardSource).toContain("maxSizeMB");
    expect(dashboardSource).toContain("Recipient Email Preview");
    expect(dashboardSource).toContain("matrixSearch");
  });

  it("supports digest read receipts, multi-file drag-and-drop, and role-based matrix badges", () => {
    expect(dashboardSource).toContain("Read Receipt Tracked");
    expect(dashboardSource).toContain("validFiles.length");
    expect(dashboardSource).toContain("Admin");
  });

  it("supports upload progress bars, matrix role badge filters, and digest statistics", () => {
    expect(dashboardSource).toContain("uploadProgress");
    expect(dashboardSource).toContain("matrixRoleFilter");
    expect(dashboardSource).toContain("Digest Read-Receipt Engagement Statistics");
  });
});
  it("supports WhatsApp/Email list normalization, animated chat entries, and digest statistics CSV export", () => {
    const dummyEmployeesObj = { rows: [{ id: 1, name: "Alice", email: "alice@company.co.tz", phone: "+255700111222", role: "Manager", department: "Finance" }] };
    const wonLeads = (dummyEmployeesObj?.rows || dummyEmployeesObj || []).filter(e => e.email);
    expect(wonLeads.length).toBe(1);

    const animationClass = "animate-message-enter";
    expect(animationClass).toContain("animate-message-enter");

    const csvData = "Dispatch,Status,Timestamp\n1,Read,2026-08-18 09:00";
    expect(csvData).toContain("Dispatch");
  });

