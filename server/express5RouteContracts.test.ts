import express from "express";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { registerStorageProxy } from "./_core/storageProxy";

const viteSource = readFileSync(resolve(process.cwd(), "server/_core/vite.ts"), "utf8");
const storageSource = readFileSync(resolve(process.cwd(), "server/_core/storageProxy.ts"), "utf8");

describe("Express 5 route compatibility", () => {
  it("registers the storage proxy with a named wildcard", () => {
    const app = express();
    expect(() => registerStorageProxy(app)).not.toThrow();
    expect(storageSource).toContain('app.get("/manus-storage/*key"');
    expect(storageSource).toContain("rawKey");
    expect(storageSource).not.toContain('app.get("/manus-storage/*"');
  });

  it("uses function middleware for Vite SPA fallthrough instead of unnamed wildcard paths", () => {
    expect(viteSource).toContain("app.use(async (req, res, next) => {");
    expect(viteSource).not.toContain('app.use("*"');
  });
});
