import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const workspaceSource = readFileSync(resolve(process.cwd(), "client/src/components/BankMfiWorkspace.jsx"), "utf8");
const operationsSource = readFileSync(resolve(process.cwd(), "server/bankMfiOperations.ts"), "utf8");

describe("Banking/MFI uploaded-error regressions", () => {
  it("imports every rendered Banking/MFI icon, including the shares action", () => {
    expect(workspaceSource).toContain("ClipboardCheck, Coins, CreditCard");
    expect(workspaceSource).toContain("<Coins size={14}/>");
  });

  it("requests payment instructions using only the verified live table contract", () => {
    const paymentInstructionResource = operationsSource.match(/\["paymentInstructions",[^\n]+/)?.[0] || "";
    expect(paymentInstructionResource).toContain("requested_at");
    expect(paymentInstructionResource).not.toContain("created_at");
  });

  it("offers account-type setup instead of manufacturing a banking product", () => {
    expect(workspaceSource).toContain("No account types are configured yet");
    expect(workspaceSource).toContain("Configure account type");
    expect(workspaceSource).toContain('setTab("institution")');
  });
});
