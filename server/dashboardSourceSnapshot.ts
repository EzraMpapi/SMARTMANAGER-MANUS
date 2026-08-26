import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const dashboardSourceFiles = [
  "client/src/BusinessSphereDashboardCore.jsx",
  "client/src/dashboardStaticData.js",
  "client/src/dashboardAdditionalModules.jsx",
  "client/src/dashboardExtractedModules.jsx",
];

export const dashboardSource = dashboardSourceFiles
  .map((relativePath) => readFileSync(resolve(process.cwd(), relativePath), "utf8"))
  .join("\n");
