import { describe, expect, it } from "vitest";
import { DEFAULT_POS_DEVICE_PROFILE, normalizePosDeviceProfile, normalizeScannerInput, posDeviceProfileKey, readPosDeviceProfile, writePosDeviceProfile } from "../client/src/lib/posDeviceProfiles";

describe("POS device profiles", () => {
  it("scopes local hardware configuration to the active company and user", () => {
    expect(posDeviceProfileKey({ companyId: "a", userId: "u1" })).not.toBe(posDeviceProfileKey({ companyId: "a", userId: "u2" }));
  });

  it("persists only browser-safe printer and keyboard-scanner configuration", () => {
    const values = new Map();
    const storage = { getItem: (key: string) => values.get(key) || null, setItem: (key: string, value: string) => values.set(key, value) };
    const scope = { companyId: "company", userId: "user" };
    const saved = writePosDeviceProfile(storage, scope, { printerLabel: "Counter 1", printerMode: "pdf_only", paperWidth: "58mm", autoPrint: true, copyCount: 2, scannerMode: "keyboard", scanTerminator: "Tab", scannerPrefix: "POS-", minScanLength: 4, scanFeedback: false, scanDebounceMs: 400, secret: "never-kept" });
    expect(saved).toEqual({ printerLabel: "Counter 1", printerMode: "pdf_only", paperWidth: "58mm", autoPrint: true, copyCount: 2, scannerMode: "keyboard", scanTerminator: "Tab", scannerPrefix: "POS-", minScanLength: 4, scanFeedback: false, scanDebounceMs: 400 });
    expect(readPosDeviceProfile(storage, scope)).toEqual(saved);
    expect(JSON.stringify(saved)).not.toContain("secret");
  });

  it("normalizes scanner input and bounds unsupported configuration values", () => {
    expect(normalizeScannerInput("POS-123456", { scannerPrefix: "POS-" })).toBe("123456");
    expect(normalizePosDeviceProfile({ paperWidth: "unsupported", scannerMode: "serial", scanTerminator: "Escape", copyCount: 99, minScanLength: 1000, scanDebounceMs: 4000 })).toEqual({ ...DEFAULT_POS_DEVICE_PROFILE, copyCount: 5, minScanLength: 64, scanDebounceMs: 1500 });
  });
});
