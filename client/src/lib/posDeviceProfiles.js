const PROFILE_PREFIX = "smart_manager:pos:device-profile:v1";

export const DEFAULT_POS_DEVICE_PROFILE = Object.freeze({
  printerLabel: "Browser print dialog",
  printerMode: "browser_print",
  paperWidth: "80mm",
  autoPrint: false,
  copyCount: 1,
  scannerMode: "keyboard",
  scanTerminator: "Enter",
  scannerPrefix: "",
  minScanLength: 3,
  scanFeedback: true,
  scanDebounceMs: 250,
});

export function posDeviceProfileKey({ companyId, userId }) {
  return `${PROFILE_PREFIX}:${String(companyId || "workspace")}:${String(userId || "session")}`;
}

export function normalizePosDeviceProfile(profile = {}) {
  return {
    printerLabel: String(profile.printerLabel || DEFAULT_POS_DEVICE_PROFILE.printerLabel).slice(0, 80),
    printerMode: profile.printerMode === "pdf_only" ? "pdf_only" : DEFAULT_POS_DEVICE_PROFILE.printerMode,
    paperWidth: ["58mm", "80mm", "A4"].includes(profile.paperWidth) ? profile.paperWidth : DEFAULT_POS_DEVICE_PROFILE.paperWidth,
    autoPrint: Boolean(profile.autoPrint),
    copyCount: Math.min(5, Math.max(1, Number.parseInt(profile.copyCount, 10) || DEFAULT_POS_DEVICE_PROFILE.copyCount)),
    scannerMode: profile.scannerMode === "keyboard" ? "keyboard" : DEFAULT_POS_DEVICE_PROFILE.scannerMode,
    scanTerminator: profile.scanTerminator === "Tab" ? "Tab" : "Enter",
    scannerPrefix: String(profile.scannerPrefix || "").slice(0, 24),
    minScanLength: Math.min(64, Math.max(1, Number.parseInt(profile.minScanLength, 10) || DEFAULT_POS_DEVICE_PROFILE.minScanLength)),
    scanFeedback: profile.scanFeedback !== false,
    scanDebounceMs: Math.min(1500, Math.max(0, Number.parseInt(profile.scanDebounceMs, 10) || 0)),
  };
}

export function readPosDeviceProfile(storage, scope) {
  try {
    const parsed = JSON.parse(storage?.getItem(posDeviceProfileKey(scope)) || "{}");
    return normalizePosDeviceProfile(parsed);
  } catch (_error) {
    return { ...DEFAULT_POS_DEVICE_PROFILE };
  }
}

export function writePosDeviceProfile(storage, scope, profile) {
  const normalized = normalizePosDeviceProfile(profile);
  try { storage?.setItem(posDeviceProfileKey(scope), JSON.stringify(normalized)); } catch (_error) { /* device storage is optional */ }
  return normalized;
}

export function normalizeScannerInput(value, profile) {
  let normalized = String(value || "").trim();
  const prefix = normalizePosDeviceProfile(profile).scannerPrefix;
  if (prefix && normalized.startsWith(prefix)) normalized = normalized.slice(prefix.length);
  return normalized.trim();
}
