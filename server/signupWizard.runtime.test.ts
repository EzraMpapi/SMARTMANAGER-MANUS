// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { clearOnboardingProgress, ONBOARDING_PROGRESS_STORAGE_KEY, writeOnboardingProgress } from "../client/src/lib/onboardingProgress";

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    accountRegistration: { createConfirmedPasswordAccount: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
    workspaceBranding: { save: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
    passkeySecurity: { notifyRegistered: { useMutation: () => ({ mutateAsync: vi.fn(), isPending: false }) } },
  },
}));

import { SignupPage } from "../client/src/BusinessSphereDashboardCore.jsx";

describe("SignupPage mounted interaction flow", () => {
  beforeEach(() => {
    clearOnboardingProgress();
  });

  it("accepts valid input and advances through the account, company, and module-selection steps without creating an account", () => {
    render(React.createElement(SignupPage, { onAuthenticated: vi.fn(), onSwitchToLogin: vi.fn() }));

    fireEvent.change(screen.getByPlaceholderText("Your full name"), { target: { value: "Asha Mrema" } });
    fireEvent.change(screen.getByPlaceholderText("you@company.tz"), { target: { value: "asha@example.com" } });
    fireEvent.change(screen.getByPlaceholderText("Create a password"), { target: { value: "StrongPass!123" } });
    fireEvent.change(screen.getByPlaceholderText("Repeat password"), { target: { value: "StrongPass!123" } });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(screen.getByRole("button", { name: "Continue to company setup →" }));

    expect(screen.getByText("Register your company")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("e.g. Kilimanjaro Traders Ltd"), { target: { value: "Kilimanjaro Traders" } });
    fireEvent.click(screen.getByRole("button", { name: "Continue to modules →" }));

    expect(screen.getByText("Choose your starting modules")).toBeTruthy();
    expect((screen.getByRole("button", { name: "Launch Smart Manager →" }) as HTMLButtonElement).disabled).toBe(false);
  });

  it("lets the user discard a restored draft and starts the signup form again", () => {
    writeOnboardingProgress({
      account: { fullName: "Saved Asha", email: "saved@example.com" },
      company: { name: "Saved Traders" },
    });
    render(React.createElement(SignupPage, { onAuthenticated: vi.fn(), onSwitchToLogin: vi.fn() }));

    expect(screen.getByRole("status").textContent).toContain("in-progress setup was restored");
    expect((screen.getByPlaceholderText("Your full name") as HTMLInputElement).value).toBe("Saved Asha");
    fireEvent.click(screen.getByRole("button", { name: "Discard saved setup and start again" }));

    expect(window.sessionStorage.getItem(ONBOARDING_PROGRESS_STORAGE_KEY)).toBeNull();
    expect(screen.queryByRole("status")).toBeNull();
    expect((screen.getByPlaceholderText("Your full name") as HTMLInputElement).value).toBe("");
  });
});
