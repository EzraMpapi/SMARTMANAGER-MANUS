/* @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const setData = vi.fn();

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    useUtils: () => ({ profileIdentity: { get: { setData } } }),
    profileIdentity: {
      get: { useQuery: () => ({ data: { profile: { id: "user-1", preferredName: "Asha", fullName: "Asha Example", role: "Operations Manager", email: "asha@example.test", isActive: true, updatedAt: "2026-08-25T00:00:00.000Z" }, company: { id: "company-1", name: "Example Workspace" }, completion: { percentage: 80 }, capabilities: { extendedFieldsAvailable: true } } }) },
      update: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      uploadAvatar: { useMutation: () => ({ mutateAsync: vi.fn() }) },
      removeAvatar: { useMutation: () => ({ mutateAsync: vi.fn() }) },
    },
  },
}));

import { ProfileMenu } from "../client/src/components/ProfileIdentityCenter";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const profileMenuSource = readFileSync(resolve(process.cwd(), "client/src/components/ProfileIdentityCenter.jsx"), "utf8");
const dashboardStyles = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

describe("authenticated profile-menu click behavior", () => {
  afterEach(() => {
    document.body.innerHTML = "";
    setData.mockClear();
  });

  it("opens from an authenticated account trigger, closes without covering the page, and routes the selected profile action", () => {
    const onNavigate = vi.fn();
    render(React.createElement("div", null,
      React.createElement("button", { type: "button" }, "Workspace content remains clickable"),
      React.createElement(ProfileMenu, {
        currentUser: { id: "user-1", name: "Asha Example", role: "Operations Manager", email: "asha@example.test" },
        session: { accessToken: "authenticated-session-token", email: "asha@example.test" },
        company: { id: "company-1", name: "Example Workspace" },
        onNavigate,
        onSignOut: vi.fn(),
        onOpenPasswordRecovery: vi.fn(),
        roleChangeApprovalsQuery: { data: { approvals: [] } },
      }),
    ));

    const trigger = screen.getByRole("button", { name: "Open account identity center" });
    fireEvent.click(trigger);
    expect(screen.getByRole("dialog", { name: "Account identity center" })).toBeTruthy();
    expect(document.querySelector(".fixed.inset-0")).toBeNull();

    const accountDialog = screen.getByRole("dialog", { name: "Account identity center" });
    fireEvent.click(within(accountDialog).getByRole("button", { name: /View My Profile/i }));
    expect(onNavigate).toHaveBeenCalledWith("profile", {});
    expect(screen.queryByRole("dialog", { name: "Account identity center" })).toBeNull();

    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("dialog", { name: "Account identity center" })).toBeNull();

    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Workspace content remains clickable" }));
    expect(screen.queryByRole("dialog", { name: "Account identity center" })).toBeNull();
  });

  it("keeps the top-header profile trigger square and professional", () => {
    expect(profileMenuSource).toContain("dashboard-topbar-profile-trigger group relative z-40 grid h-11 w-11 min-h-11 min-w-11 cursor-pointer place-items-center rounded-none");
    expect(dashboardStyles).toContain(".dashboard-topbar-profile-slot > div > button.dashboard-topbar-profile-trigger");
    expect(dashboardStyles).toContain("border-radius: 0;");
  });

  it("keeps the profile trigger clickable on small screens", () => {
    expect(dashboardStyles).toContain(".dashboard-topbar-profile-slot > .dashboard-topbar-profile > .dashboard-topbar-profile-trigger");
    expect(dashboardStyles).toContain("pointer-events: auto;");
    expect(dashboardStyles).toContain("touch-action: manipulation;");
    expect(dashboardStyles).toContain("z-index: 71;");
  });
});
