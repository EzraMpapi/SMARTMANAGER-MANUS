import fs from "node:fs";
import { describe, expect, it } from "vitest";

const source = fs.readFileSync("client/src/lib/offlineSync.js", "utf8");

describe("large offline storage compression", () => {
  it("compresses payloads before AES-GCM encryption", () => {
    expect(source).toContain('new CompressionStream("gzip")');
    expect(source).toContain('new DecompressionStream("gzip")');
    expect(source).toContain("compression: compressed.compression");
    expect(source).toContain("originalBytes: jsonBytes.byteLength");
  });

  it("spills payloads larger than the localStorage-safe threshold into IndexedDB", () => {
    expect(source).toContain("const LARGE_PAYLOAD_BYTES = 512 * 1024");
    expect(source).toContain("const PAYLOAD_STORE_NAME = \"payloads\"");
    expect(source).toContain('version: 3, storage: "indexeddb"');
    expect(source).toContain("writeIndexedPayload(key, envelope)");
    expect(source).toContain("readIndexedPayload(parsed.key || key)");
  });

  it("keeps legacy encrypted and plaintext hydration paths compatible", () => {
    expect(source).toContain("parsed.version === 1 || parsed.version === 2");
    expect(source).toContain("parsed?.version === 1 && parsed.ciphertext");
    expect(source).toContain("persistEncrypted(key, value)");
    expect(source).toContain("deleteIndexedPayload(key)");
  });
});
