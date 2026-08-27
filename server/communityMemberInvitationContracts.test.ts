import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const community = read("client/src/dashboardExtractedModules.jsx");
const dashboard = read("client/src/BusinessSphereDashboardCore.jsx");
const invitations = read("server/teamInvitations.ts");

 describe("Community Groups member invitation contracts", () => {
  it("exposes an Invite member action from the real Members tab", () => {
    expect(community).toContain("onOpenMemberInvitation");
    expect(community).toContain("> Invite member</button>");
    expect(community).toContain("disabled={!canWrite || !onOpenMemberInvitation}");
  });

  it("routes the action to the secure persisted workspace invitation flow", () => {
    expect(dashboard).toContain("onOpenMemberInvitation={() => goWithIntent(\"hr\", { tab: \"employees\", openInvitation: true })}");
    expect(dashboard).toContain("trpc.teamInvitations.create.useMutation");
    expect(dashboard).toContain("Invitation recorded by the server");
    expect(invitations).toContain("hashInvitationToken");
    expect(invitations).toContain("sendInvitationEmail");
  });

  it("does not create browser-only membership or invite codes", () => {
    expect(community).not.toContain("Math.random().toString(36)");
    expect(community).not.toContain("localStorage.setItem(\"member");
    expect(community).toContain("requiresConfirmedPersistence()");
  });
});
