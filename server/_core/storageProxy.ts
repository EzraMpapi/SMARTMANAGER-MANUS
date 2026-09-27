import type { Express, Request, Response } from "express";
import { storageGetSignedUrl } from "../storage";

export function registerStorageProxy(app: Express) {
  const serveObject = async (req: Request, res: Response) => {
    const rawKey = (req.params as Record<string, string | string[]>).key;
    const key = Array.isArray(rawKey) ? rawKey.join("/") : rawKey;
    if (!key) {
      res.status(400).send("Missing storage key");
      return;
    }

    try {
      const url = await storageGetSignedUrl(key);
      res.set("Cache-Control", "private, max-age=300");
      res.redirect(307, url);
    } catch (err) {
      console.error("[StorageProxy] failed:", err);
      res.status(502).send("Storage backend error");
    }
  };
  app.get("/manus-storage/*key", serveObject);
  app.get("/api/manus-storage/*key", serveObject);
}
