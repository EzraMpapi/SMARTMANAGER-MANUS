import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const main = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");

describe("profile identity authenticated transport", () => {
  it("forwards a stored SMART MANAGER Supabase token before falling back to the legacy session cookie", () => {
    expect(main).toContain('import { readStoredAccessToken } from "./lib/authSessionStorage";');
    expect(main).toContain("const storedSupabaseToken = readStoredAccessToken();");
    expect(main).toContain('headers["x-supabase-authorization"] = `Bearer ${storedSupabaseToken}`;');
    expect(main.indexOf("const storedSupabaseToken = readStoredAccessToken();")).toBeLessThan(main.indexOf('const raw = sessionStorage.getItem("manus-cookie");'));
  });
});
