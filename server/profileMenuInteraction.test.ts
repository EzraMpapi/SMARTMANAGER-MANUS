/* @vitest-environment jsdom */
import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
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

    const trigger = screen.getByRole("button", { name: "Open account menu" });
    fireEvent.click(trigger);
    expect(screen.getByRole("menu", { name: "Account menu" })).toBeTruthy();
    expect(document.querySelector(".fixed.inset-0")).toBeNull();

    fireEvent.click(screen.getByRole("menuitem", { name: /My profile/i }));
    expect(onNavigate).toHaveBeenCalledWith("profile", {});
    expect(screen.queryByRole("menu", { name: "Account menu" })).toBeNull();

    fireEvent.click(trigger);
    fireEvent.keyDown(window, { key: "Escape" });
    expect(screen.queryByRole("menu", { name: "Account menu" })).toBeNull();

    fireEvent.click(trigger);
    fireEvent.pointerDown(screen.getByRole("button", { name: "Workspace content remains clickable" }));
    expect(screen.queryByRole("menu", { name: "Account menu" })).toBeNull();
  });
});
