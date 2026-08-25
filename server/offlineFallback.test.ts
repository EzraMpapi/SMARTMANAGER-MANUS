import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const offlinePage = readFileSync(new URL("../client/public/offline.html", import.meta.url), "utf8");
const serviceWorker = readFileSync(new URL("../client/public/sw.js", import.meta.url), "utf8");
const bootstrap = readFileSync(new URL("../client/src/main.tsx", import.meta.url), "utf8");

describe("PWA offline fallback boundary", () => {
  it("ships a self-contained, accessible reconnect experience", () => {
    expect(offlinePage).toContain('data-testid="offline-fallback"');
    expect(offlinePage).toContain("You’re offline");
    expect(offlinePage).toContain("window.location.reload()");
    expect(offlinePage).toContain("window.addEventListener(\"online\"");
    expect(offlinePage).not.toContain("/api/");
  });

  it("uses the offline document only for failed navigations and does not cache API traffic", () => {
    expect(serviceWorker).toContain('const OFFLINE_URL = "/offline.html"');
    expect(serviceWorker).toContain('request.mode === "navigate"');
    expect(serviceWorker).toContain('url.pathname.startsWith("/api/")');
    expect(serviceWorker).toContain('request.method !== "GET"');
    expect(serviceWorker).toContain("caches.match(OFFLINE_URL)");
  });

  it("registers the service worker only in production", () => {
    expect(bootstrap).toContain('import.meta.env.MODE !== "development" && "serviceWorker" in navigator');
    expect(bootstrap).toContain('navigator.serviceWorker.register("/sw.js", { scope: "/" })');
  });
});
