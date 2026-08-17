import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";

const source = fs.readFileSync(path.resolve(process.cwd(), "client/src/BusinessSphereDashboard.jsx"), "utf8");
const channels = source.slice(source.indexOf("function ChannelsView("), source.indexOf("function ChannelFormPanel("));
const channelForm = source.slice(source.indexOf("function ChannelFormPanel("), source.indexOf("/* ----------------------------------- SHARED CALENDAR"));
const calendar = source.slice(source.indexOf("function SharedCalendar("), source.indexOf("function EventFormPanel("));
const eventForm = source.slice(source.indexOf("function EventFormPanel("), source.indexOf("/* ----------------------------------- TEAM WORKSPACES"));
const workspaces = source.slice(source.indexOf("function TeamWorkspaces("), source.indexOf("function WorkspaceFormPanel("));
const workspaceForm = source.slice(source.indexOf("function WorkspaceFormPanel("), source.indexOf("/* ----------------------------------- FILE SHARING"));

describe("Collaboration Hub persistence boundaries", () => {
  it("shows messages only after the live insert returns a server row", () => {
    const mutationAt = channels.indexOf('runCompanyTableMutation("collab_messages", "insert"');
    const stateAt = channels.indexOf("setMessages((prev) => [...prev, confirmed]);");

    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(channels).toContain("The server did not return the sent message.");
    expect(channels).toContain("Your draft is still available to retry.");
    expect(channels).not.toContain("Message shown locally, but saving to the server failed.");
  });

  it("creates channels from confirmed rows and prevents duplicate saves", () => {
    const mutationAt = channels.indexOf('runCompanyTableMutation("collab_channels", "insert"');
    const stateAt = channels.indexOf("channels.setRows((prev) => [...prev, confirmed]);");

    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(channels).toContain("if (savingChannel) return;");
    expect(channels).toContain("Channel was not created.");
    expect(channelForm).toContain("disabled={saving}");
    expect(channelForm).toContain('{saving ? "Saving…" : "Create Channel"}');
  });

  it("disables duplicate message sends while preserving the draft during a failure", () => {
    expect(channels).toContain("if (!text || !activeChannelId || messageSending) return;");
    expect(channels).toContain("disabled={!draft.trim() || messageSending}");
    expect(channels).toContain("aria-busy={messageSending}");
    expect(channels).toContain("className={messageSending ? \"animate-pulse\" : \"\"}");
  });

  it("creates calendar events from confirmed rows and keeps the event form retryable", () => {
    const mutationAt = calendar.indexOf('runCompanyTableMutation("calendar_events", "insert"');
    const stateAt = calendar.indexOf("events.setRows((prev) => [...prev, confirmed]);");
    expect(mutationAt).toBeGreaterThan(-1);
    expect(stateAt).toBeGreaterThan(mutationAt);
    expect(calendar).toContain("if (savingEvent) return;");
    expect(calendar).toContain("Event was not scheduled.");
    expect(eventForm).toContain("disabled={saving}");
    expect(eventForm).toContain('{saving ? "Saving…" : "Save Event"}');
  });

  it("creates and deletes workspaces only after server confirmation", () => {
    expect(workspaces).toContain('runCompanyTableMutation("workspaces", "insert"');
    expect(workspaces).toContain('runCompanyTableMutation("workspaces", "delete"');
    expect(workspaces).toContain("if (deletingWorkspaceId) return;");
    expect(workspaces).toContain("Workspace was not created.");
    expect(workspaces).toContain("Workspace was not deleted.");
    expect(workspaces).toContain("disabled={deletingWorkspaceId === w.id}");
    expect(workspaceForm).toContain("disabled={saving}");
    expect(workspaceForm).toContain('{saving ? "Saving…" : "Create Workspace"}');
  });
});

export {};
