/**
 * Smart Manager desktop shell
 * Packaging philosophy: preserve the production React/Vite app at its verified
 * HTTPS origin so same-origin /api, Supabase cookies, local/session storage,
 * routes, and existing auth controls continue to operate unchanged.
 */
import { app, BrowserWindow, shell, session } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appUrl = process.env.SMART_MANAGER_APP_URL ?? "https://menejajanja.vercel.app/app";
const appOrigin = new URL(appUrl).origin;
const desktopPartition = "persist:smart-manager";

const isAppOrigin = (url) => {
  try {
    return new URL(url).origin === appOrigin;
  } catch {
    return false;
  }
};

const isSupabaseAuthOrigin = (url) => {
  try {
    const { hostname, protocol } = new URL(url);
    return protocol === "https:" && hostname.endsWith(".supabase.co");
  } catch {
    return false;
  }
};

function createWindow(url = appUrl, { authPopup = false } = {}) {
  const window = new BrowserWindow({
    width: authPopup ? 560 : 1440,
    height: authPopup ? 780 : 920,
    minWidth: authPopup ? 420 : 980,
    minHeight: authPopup ? 600 : 680,
    show: false,
    autoHideMenuBar: true,
    title: authPopup ? "Smart Manager sign in" : "Smart Manager",
    icon: path.join(__dirname, "..", "smart-manager-logo.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      partition: desktopPartition,
      preload: path.join(__dirname, "preload.mjs"),
    },
  });

  window.once("ready-to-show", () => window.show());
  window.loadURL(url);

  window.webContents.setWindowOpenHandler(({ url: targetUrl }) => {
    if (isAppOrigin(targetUrl) || isSupabaseAuthOrigin(targetUrl)) {
      createWindow(targetUrl, { authPopup: true });
      return { action: "deny" };
    }
    if (targetUrl.startsWith("https:")) {
      void shell.openExternal(targetUrl);
    }
    return { action: "deny" };
  });

  window.webContents.on("will-navigate", (event, targetUrl) => {
    const isAllowedAuthNavigation = authPopup && targetUrl.startsWith("https:");
    if (isAppOrigin(targetUrl) || isAllowedAuthNavigation) return;
    event.preventDefault();
    if (targetUrl.startsWith("https:")) void shell.openExternal(targetUrl);
  });

  return window;
}

app.whenReady().then(() => {
  const persistentSession = session.fromPartition(desktopPartition);
  persistentSession.setPermissionRequestHandler((webContents, permission, callback) => {
    const sourceUrl = webContents.getURL();
    const allowed = isAppOrigin(sourceUrl) && ["notifications", "clipboard-read", "clipboard-sanitized-write", "fullscreen"].includes(permission);
    callback(allowed);
  });

  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
