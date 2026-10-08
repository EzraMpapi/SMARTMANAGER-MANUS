import { createReadStream, existsSync } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";

const root = resolve(process.cwd(), "dist", "public");
const port = Number(process.env.E2E_STATIC_PORT || 4173);
const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};

function safeAssetPath(pathname) {
  const candidate = resolve(root, `.${normalize(pathname)}`);
  return candidate.startsWith(root) ? candidate : null;
}

const server = createServer(async (request, response) => {
  const pathname = new URL(request.url || "/", `http://${request.headers.host || "127.0.0.1"}`).pathname;
  if (pathname === "/api/config/public") {
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify({ url: "https://e2e.supabase.invalid", anonKey: "e2e-anon-key" }));
    return;
  }
  if (pathname.startsWith("/api/trpc/")) {
    const procedurePath = pathname.slice("/api/trpc/".length).split("?")[0];
    const procedures = procedurePath.split(",").filter(Boolean);
    response.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
    response.end(JSON.stringify(procedures.map(() => ({ result: { data: { json: null } } }))));
    return;
  }
  const requestedPath = safeAssetPath(pathname);
  const fallback = join(root, "index.html");
  let filePath = requestedPath && existsSync(requestedPath) ? requestedPath : fallback;

  try {
    if ((await stat(filePath)).isDirectory()) filePath = join(filePath, "index.html");
    response.writeHead(200, { "Content-Type": contentTypes[extname(filePath)] || "application/octet-stream", "Cache-Control": "no-store" });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Build asset not found");
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Static e2e preview listening on http://127.0.0.1:${port}`);
});
