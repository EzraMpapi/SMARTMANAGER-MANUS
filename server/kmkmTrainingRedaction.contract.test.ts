import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const redactionScript = readFileSync(
  resolve(process.cwd(), "scripts/redact_kmkm_training_captures.py"),
  "utf8",
);

describe("KMKM training capture redaction contract", () => {
  it("keeps private screenshots and training outputs outside the repository", () => {
    expect(redactionScript).toContain("/home/ubuntu/smartmanager-training-assets/kmkm-private-source");
    expect(redactionScript).toContain("/home/ubuntu/smartmanager-training-assets/kmkm-redacted");
    expect(redactionScript).not.toContain("client/public");
  });

  it("removes header, identity, record workspace, and dynamic rail regions", () => {
    expect(redactionScript).toContain("Header contains account, alerts, tenant, and contextual metadata.");
    expect(redactionScript).toContain("Workspace identity is tenant/user-specific");
    expect(redactionScript).toContain("Remove all record-bearing workspace content");
    expect(redactionScript).toContain("dynamic notification/count badges and state labels");
    expect(redactionScript).toContain("round(width * 0.13)");
  });

  it("labels every output as a redacted training frame instead of live product evidence", () => {
    expect(redactionScript).toContain("TRAINING FRAME");
    expect(redactionScript).toContain("Redacted owner-approved demonstration capture");
    expect(redactionScript).not.toContain(
      '"Redacted approved KMKM demonstration capture',
    );
    expect(redactionScript).toContain("record details intentionally removed");
    expect(redactionScript).toContain("generic Kiswahili narration only");
  });
});
