import "dotenv/config";
import { createServer } from "http";
import net from "net";
import { serveStatic } from "./static";
import { createApiApp } from "./apiApp";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = createApiApp();
  const server = createServer(app);

  if (process.env.NODE_ENV === "development") {
    // Keep the development-only bridge out of the production bundle. A
    // literal relative dynamic import is still followed by esbuild, which
    // would pull Vite, Rollup, and vite.config.ts into dist/index.js even
    // though this branch never runs in production.
    const viteModulePath = "./vite";
    const { setupVite } = await import(viteModulePath);
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

// Vercel imports the API app through api/index.ts. Do not start a listener when
// the module is loaded as a serverless function.
if (process.env.VERCEL !== "1") {
  startServer().catch(console.error);
}

export { createApiApp };
