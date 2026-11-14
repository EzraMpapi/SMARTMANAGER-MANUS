import { describe, expect, it, vi } from "vitest";

describe("dashboard preference configuration marker", () => {
  it("passes the configured marker only as an internal API header", async () => {
    const marker = process.env.DASHBOARD_PREFERENCES_NO_NEW_SECRET;
    const internalMarker = process.env.DASHBOARD_PREFERENCE_API_INTERNAL_MARKER;
    const schemaVersion = process.env.DASHBOARD_PREFERENCES_SCHEMA_VERSION;
    expect(marker).toEqual(expect.any(String));
    expect(marker).not.toHaveLength(0);
    expect(internalMarker).toBe("dashboard-preferences-internal");
    expect(schemaVersion).toBe("1");

    const request = vi.fn(async (_url: string, init?: RequestInit) => {
      expect(init?.headers).toEqual({
        "x-dashboard-preferences-config": marker,
        "x-dashboard-preferences-internal": internalMarker,
        "x-dashboard-preferences-schema": schemaVersion,
      });
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    });

    const response = await request("/api/dashboard-preferences/health", {
      headers: {
        "x-dashboard-preferences-config": marker,
        "x-dashboard-preferences-internal": internalMarker,
        "x-dashboard-preferences-schema": schemaVersion,
      },
    });

    expect(response.ok).toBe(true);
    expect((await response.json()).ok).toBe(true);
    expect(request).toHaveBeenCalledOnce();
  });
});
