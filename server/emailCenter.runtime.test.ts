// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import React from "react";
import { describe, expect, it, vi } from "vitest";

vi.mock("../client/src/lib/trpc", () => ({
  trpc: {
    emailTemplateWorkflow: {
      status: { useQuery: () => ({ data: { enabled: false } }) },
      dispatch: { useMutation: () => ({ isPending: false, mutate: vi.fn() }) },
    },
  },
}));

import { EmailCenter } from "../client/src/BusinessSphereDashboardCore.jsx";

describe("Collaboration Hub EmailCenter runtime", () => {
  it("mounts the composer, opens contact autocomplete, and toggles live preview without undefined callbacks", async () => {
    render(React.createElement(EmailCenter, {
      currentUser: { id: "user-1", name: "Asha Admin" },
      crm: { rows: [{ id: 1, company: "Acme Co", contact: "Asha", email: "asha@acme.example" }] },
      employees: { rows: [{ id: 2, name: "Mariam Finance", email: "mariam@example.com" }] },
      invoices: { rows: [] },
      company: { name: "Acme Workspace", email: "hello@acme.example", phone: "+255 700 000 000", signatureLogo: null },
    }));

    const recipient = screen.getByPlaceholderText("Recipient email address or name…") as HTMLInputElement;
    fireEvent.change(recipient, { target: { value: "acme" } });
    expect(await screen.findByText("Acme Co")).toBeTruthy();

    fireEvent.mouseDown(screen.getByText("Acme Co"));
    expect(recipient.value).toContain("asha@acme.example");

    fireEvent.click(screen.getByRole("button", { name: "👁 Live Preview" }));
    expect(screen.getByText(/Branded Template Preview Active/)).toBeTruthy();
  });
});
