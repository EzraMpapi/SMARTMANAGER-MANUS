import { gzipSync } from "node:zlib";
import { appendFile, readdir, readFile } from "node:fs/promises";
import path from "node:path";

const assetsDir = path.resolve("dist/public/assets");
const budgets = {
  dashboardRaw: 3_500_000,
  dashboardGzip: 750_000,
};
const warningThreshold = 0.9;

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
  const usage = actual / limit;
  const percentage = (usage * 100).toFixed(1);
  const status = passed ? "PASS" : "FAIL";
  console.log(`${status} ${name}: ${formatBytes(actual)} / ${formatBytes(limit)} (${percentage}%)`);

  if (usage >= warningThreshold) {
    const level = passed ? "near budget" : "over budget";
    const message = `${name} is ${level} at ${percentage}% (${formatBytes(actual)} of ${formatBytes(limit)}).`;
    console.warn(`WARNING ${message}`);
    if (process.env.GITHUB_ACTIONS === "true") {
      console.log(`::warning title=Bundle budget near limit::${message}`);
    }
  }

  return passed;
}

console.log(`Checking ${dashboardFile}`);
const rawOk = report("Dashboard raw size", rawBytes, budgets.dashboardRaw);
const gzipOk = report("Dashboard gzip size", gzipBytes, budgets.dashboardGzip);

if (process.env.GITHUB_STEP_SUMMARY) {
  const summary = [
    "## Bundle budget report",
    "",
    `| Asset | Measured | Budget | Usage |`,
    `| --- | ---: | ---: | ---: |`,
    `| Dashboard raw | ${formatBytes(rawBytes)} | ${formatBytes(budgets.dashboardRaw)} | ${(rawBytes / budgets.dashboardRaw * 100).toFixed(1)}% |`,
    `| Dashboard gzip | ${formatBytes(gzipBytes)} | ${formatBytes(budgets.dashboardGzip)} | ${(gzipBytes / budgets.dashboardGzip * 100).toFixed(1)}% |`,
    "",
    `Near-limit warning threshold: ${(warningThreshold * 100).toFixed(0)}%.`,
  ].join("\n");
  await appendFile(process.env.GITHUB_STEP_SUMMARY, `${summary}\n`);
}

if (!rawOk || !gzipOk) {
  process.exitCode = 1;
}
