import { describe, expect, it } from "vitest";

const describeRemote = process.env.RUN_REMOTE_INTEGRATION_TESTS === "true" ? describe : describe.skip;

describeRemote("managed Supabase configuration", () => {
  it("authenticates a lightweight Auth settings request", async () => {
    const url = process.env.VITE_SUPABASE_URL;
    const anonKey = process.env.VITE_SUPABASE_ANON_KEY;

    expect(url).toMatch(/^https:\/\/[a-z0-9-]+\.supabase\.co$/);
    expect(anonKey).toBeTruthy();

    const response = await fetch(`${url}/auth/v1/settings`, {
      headers: {
        apikey: anonKey!,
      },
    });

    expect(response.status).toBe(200);
  });
});
