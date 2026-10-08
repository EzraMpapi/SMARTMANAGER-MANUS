import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";

export async function setupVite(app: Express, server: Server) {
  // Vite and its Rollup dependency are development-only. Keep them behind a
  // runtime import so the production server can start from the bundled output
  // after Render prunes dev dependencies.
  const [{ createServer: createViteServer }, { default: viteConfig }] = await Promise.all([
    import("vite"),
    import("../../vite.config"),
  ]);

  const serverOptions = {
    ...(viteConfig.server ?? {}),
    middlewareMode: true,
    // The managed preview is served through an HTTPS proxy. Without an
    // explicit browser-facing transport Vite emits localhost:5173 into the
    // client, which cannot be reached from a browser outside the sandbox.
    // Keep the socket on the existing Express HTTP server and let the browser
    // retain its public preview hostname while using WSS on port 443.
    hmr: { server, protocol: "wss" as const, clientPort: 443 },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use(async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
