import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync("client/src/lib/offlineSync.js", "utf8");
const dashboard = fs.readFileSync("client/src/BusinessSphereDashboard.jsx", "utf8");

describe("encrypted offline persistence contracts", () => {
  it("uses a non-extractable device AES-GCM key stored in IndexedDB", () => {
    expect(source).toContain("indexedDB");
    expect(source).toContain("generateKey({ name: \"AES-GCM\", length: 256 }, false");
    expect(source).toContain("algorithm: \"AES-GCM-256\"");
    expect(source).toContain("subtle.encrypt");
    expect(source).toContain("subtle.decrypt");
  });

  it("never writes new cache or outbox values as plaintext JSON", () => {
    expect(source).toContain("persistEncrypted(key, limited)");
    expect(source).toContain("persistEncrypted(key, value)");
    expect(source).toContain("parsed?.ciphertext && (parsed.version === 1 || parsed.version === 2)");
    expect(source).toContain("compression: compressed.compression");
  });

  it("hydrates encrypted storage before refreshing offline table views", () => {
    expect(source).toContain("export async function hydrateOfflineStorage");
    expect(dashboard).toContain("void hydrateOfflineStorage(offlineMutationScope())");
    expect(dashboard).toContain("event?.detail?.hydrated");
  });
});
