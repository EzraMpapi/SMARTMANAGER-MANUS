import { readFile, writeFile } from "node:fs/promises";

const [, , rawPath, outputPath] = process.argv;
if (!rawPath || !outputPath) {
  throw new Error("Usage: node scripts/merge_resume_remote.mjs <browser-raw-capture> <output>");
}

const rawCapture = await readFile(rawPath, "utf8");
const captureLines = rawCapture.split(/\r?\n/);
const source = captureLines.slice(3).join("\n");
let merged = source;
let replacements = 0;

function replaceOnce(find, replace, label) {
  const count = merged.split(find).length - 1;
  if (count !== 1) throw new Error(`${label}: expected exactly one match, received ${count}`);
  merged = merged.replace(find, replace);
  replacements += 1;
}

replaceOnce(
  'import { subscriptionStateLabel, subscriptionAllowsModule, useSubscriptionAccess } from "./lib/subscriptionAccess";\n',
  'import { subscriptionStateLabel, subscriptionAllowsModule, useSubscriptionAccess } from "./lib/subscriptionAccess";\nimport { buildResumeUrl, clearResumeLocation, getModuleFromUrl, readResumeLocation, writeResumeLocation } from "./lib/resumeSession";\n',
  "resume import",
);

replaceOnce(
  '    setActive(id);\n    setSidebarOpen(false);\n  }\n\n  // Lets a Dashboard',
  `    setActive(id);
    persistResumeLocation(id);
    setSidebarOpen(false);
  }

  const resumeSafeShellModules = ["dashboard", "profile", "support", "notifications", "settings", "billing"];
  const resumeRestoreKey = \`${"${currentUser?.id || \"\"}"}:${"${company?.id || \"\"}"}\`;
  const resumeRestoredRef = useRef("");
  const persistResumeLocation = useCallback((moduleId) => {
    if (typeof window === "undefined" || !IS_CONFIGURED || !session?.accessToken || session?.demo || !currentUser?.id || !company?.id || !moduleId) return;
    const resumeUrl = buildResumeUrl({
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      moduleId,
    });
    if (\`${"${window.location.pathname}"}${"${window.location.search}"}${"${window.location.hash}"}\` !== resumeUrl) {
      window.history.replaceState(null, "", resumeUrl);
    }
    writeResumeLocation(window.localStorage, {
      userId: currentUser.id,
      companyId: company.id,
      pathname: window.location.pathname,
      search: window.location.search,
      hash: window.location.hash,
      moduleId,
      savedAt: Date.now(),
    }, {
      userId: currentUser.id,
      companyId: company.id,
      allowedModuleIds: MODULES.map((module) => module.id),
      safeModuleIds: resumeSafeShellModules,
    });
  }, [company?.id, currentUser?.id, session?.accessToken, session?.demo]);

  // Restore only after workspace identity, role access, and subscription
  // entitlements are resolved. URL state wins over the reopen fallback.
  useEffect(() => {
    if (!IS_CONFIGURED || !session?.accessToken || session?.demo || !currentUser?.id || !company?.id) {
      resumeRestoredRef.current = "";
      return;
    }
    if (!subscriptionFilteringReady || resumeRestoredRef.current === resumeRestoreKey) return;
    const allowedModuleIds = visibleModules.map((module) => module.id);
    const fromUrl = typeof window !== "undefined"
      ? getModuleFromUrl(window.location.search, allowedModuleIds, resumeSafeShellModules)
      : null;
    const stored = typeof window !== "undefined"
      ? readResumeLocation(window.localStorage, {
        userId: currentUser.id,
        companyId: company.id,
        allowedModuleIds,
        safeModuleIds: resumeSafeShellModules,
      })
      : null;
    const candidate = fromUrl || stored?.moduleId || "dashboard";
    const nextModule = allowedModuleIds.includes(candidate) || resumeSafeShellModules.includes(candidate) ? candidate : "dashboard";
    setActive(nextModule);
    if (!fromUrl && stored && typeof window !== "undefined") {
      window.history.replaceState(null, "", buildResumeUrl({ pathname: stored.pathname, search: stored.search, hash: stored.hash, moduleId: nextModule }));
    }
    resumeRestoredRef.current = resumeRestoreKey;
    persistResumeLocation(nextModule);
  }, [company?.id, currentUser?.id, persistResumeLocation, resumeRestoreKey, session?.accessToken, session?.demo, subscriptionFilteringReady, visibleModules]);

  useEffect(() => {
    if (resumeRestoredRef.current === resumeRestoreKey && session?.accessToken && !session?.demo && active) persistResumeLocation(active);
  }, [active, persistResumeLocation, resumeRestoreKey, session?.accessToken, session?.demo]);

  useEffect(() => {
    const handlePopState = () => {
      if (typeof window === "undefined") return;
      const moduleId = getModuleFromUrl(window.location.search, visibleModules.map((module) => module.id), resumeSafeShellModules);
      if (moduleId) setActive(moduleId);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [visibleModules]);

  // Lets a Dashboard`,
  "resume navigation integration",
);

const signOutStart = merged.indexOf('  const handleSignOut = useCallback(async () => {');
const signOutEnd = merged.indexOf('  const isAdministrativeSession', signOutStart);
if (signOutStart < 0 || signOutEnd <= signOutStart) throw new Error("logout cleanup: handler boundary not found");
const signOutBlock = merged.slice(signOutStart, signOutEnd);
const signOutNeedle = '      clearStoredAuthSession();\n';
if ((signOutBlock.match(/clearStoredAuthSession\(\);/g) || []).length !== 1) throw new Error("logout cleanup: expected one handler clear call");
const patchedSignOutBlock = signOutBlock.replace(signOutNeedle, '      if (typeof window !== "undefined" && session?.userId && session?.company?.id) clearResumeLocation(window.localStorage, session.userId, session.company.id);\n      clearStoredAuthSession();\n');
if (patchedSignOutBlock === signOutBlock) throw new Error("logout cleanup: exact call not found");
merged = merged.slice(0, signOutStart) + patchedSignOutBlock + merged.slice(signOutEnd);
replacements += 1;

if (!merged.includes("readResumeLocation") || !merged.includes("clearResumeLocation(window.localStorage")) {
  throw new Error("resume patch markers are missing after merge");
}

await writeFile(outputPath, merged);
console.log(JSON.stringify({ sourceLength: source.length, mergedLength: merged.length, replacements, hasSidebarOrdering: merged.includes("sidebar ordering"), hasResumePatch: merged.includes("readResumeLocation") }));
