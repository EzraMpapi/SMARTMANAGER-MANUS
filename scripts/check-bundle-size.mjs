import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const assetsDir = path.resolve("dist/public/assets");
const budgets = {
  dashboardRaw: 3_500_000,
  dashboardGzip: 750_000,
};

const files = await readdir(assetsDir);
const dashboardFile = files.find(
  (file) => file.startsWith("BusinessSphereDashboard-") && file.endsWith(".js"),
);

if (!dashboardFile) {
  throw new Error(`BusinessSphereDashboard bundle not found in ${assetsDir}`);
}

const dashboardBuffer = await readFile(path.join(assetsDir, dashboardFile));
const rawBytes = dashboardBuffer.byteLength;
const gzipBytes = gzipSync(dashboardBuffer, { level: 9 }).byteLength;

function formatBytes(bytes) {
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
}

function report(name, actual, limit) {
  const passed = actual <= limit;
  console.log(`${passed ? "PASS" : "FAIL"} ${name}: ${formatBytes(actual)} / ${formatBytes(limit)}`);
  return passed;
}

console.log(`Checking ${dashboardFile}`);
const rawOk = report("Dashboard raw size", rawBytes, budgets.dashboardRaw);
const gzipOk = report("Dashboard gzip size", gzipBytes, budgets.dashboardGzip);

if (!rawOk || !gzipOk) {
  process.exitCode = 1;
}
