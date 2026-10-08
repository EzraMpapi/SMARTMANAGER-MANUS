import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const source = readFileSync("client/src/components/GlobalAdminControlCenter.tsx", "utf8");

describe("Platform Administrator control-center interface contracts", () => {
  it("keeps platform data behind protected tRPC read and controlled-action boundaries", () => {
    expect(source).toContain("trpc.globalAdmin.snapshot.useQuery");
    expect(source).toContain("trpc.globalAdmin.executiveSnapshot.useQuery");
    expect(source).toContain("trpc.globalAdmin.feedback.useQuery");
    expect(source).toContain("trpc.globalAdmin.recordAction.useMutation");
    expect(source).toContain("trpc.globalAdmin.replyFeedback.useMutation");
    expect(source).not.toMatch(/\bsb\s*\(/);
    expect(source).toContain("The server could not verify a live Platform Administrator role for this session.");
  });

  it("exposes the documented operating sections and fails safely when a source is unavailable", () => {
    [
      "overview",
      "health",
      "tenants",
      "users",
      "billing",
      "modules",
      "security",
      "integrations",
      "whatsapp",
      "support",
      "feedback",
      "reports",
      "settings",
    ].forEach((section) => expect(source).toContain(`id: \"${section}\"`));
    expect(source).toContain("Data unavailable");
    expect(source).toContain("No cross-tenant data was loaded.");
  });

  it("retains responsive table containment and responsive executive layouts", () => {
    expect(source).toContain("overflow-x-auto");
    expect(source).toContain("min-w-[760px]");
    expect(source).toContain("sm:grid-cols-2");
    expect(source).toContain("xl:grid-cols-6");
    expect(source).toContain("xl:grid-cols-[1.55fr_.85fr]");
    expect(source).toContain("flex-col gap-4");
  });
});
