import fs from "node:fs";

const dashboardPath = "/home/ubuntu/businesssphere-erp/client/src/BusinessSphereDashboard.jsx";
const testPath = "/home/ubuntu/businesssphere-erp/server/collaborationHub.test.ts";
let source = fs.readFileSync(dashboardPath, "utf8");

const whatsappStart = source.indexOf("function WhatsAppCenter(");
const collaborationStart = source.indexOf("function CollaborationHub(");
if (whatsappStart < 0 || collaborationStart < 0 || whatsappStart > collaborationStart) {
  throw new Error("Could not locate WhatsAppCenter and CollaborationHub boundaries");
}

const modalStart = source.indexOf("      {showConfigModal && (", collaborationStart);
const collaborationClosing = "\n    </div>\n  );\n}";
const modalEnd = source.indexOf(collaborationClosing, modalStart);
if (modalStart < 0 || modalEnd < 0) throw new Error("Misplaced Collaboration Hub configuration modal block was not found");

const modalBlock = source.slice(modalStart, modalEnd);
source = source.slice(0, modalStart) + source.slice(modalEnd);

const whatsappClosing = source.indexOf(collaborationClosing, whatsappStart);
if (whatsappClosing < 0 || whatsappClosing > collaborationStart) throw new Error("WhatsAppCenter return boundary was not found");

let repairedModal = modalBlock
  .replace(
    '<div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">',
    '<div role="presentation" aria-label="Close WhatsApp provider configuration" onMouseDown={(event) => { if (event.target === event.currentTarget && !updateBirdMutation.isPending) setShowConfigModal(false); }} className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">',
  )
  .replace(
    '<div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full p-6 space-y-5 animate-modal-fade">',
    '<div role="dialog" aria-modal="true" aria-labelledby="bird-provider-config-title" onMouseDown={(event) => event.stopPropagation()} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl max-w-lg w-full max-h-[calc(100dvh-2rem)] overflow-y-auto p-6 space-y-5 animate-modal-fade">',
  )
  .replace(
    '<h3 className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">',
    '<h3 id="bird-provider-config-title" className="text-[16px] font-bold text-slate-900 dark:text-white flex items-center gap-2">',
  )
  .replace(
    '<button onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold">×</button>',
    '<button type="button" aria-label="Close provider configuration" onClick={() => setShowConfigModal(false)} className="text-slate-400 hover:text-slate-600 text-lg font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 rounded-md">×</button>',
  )
  .replace(
    'onClick={() => {\n                  updateBirdMutation.mutate({\n                    apiKey: birdApiKey.trim(),\n                    signingSecret: birdSigningSecret.trim(),\n                    workspaceId: birdWorkspaceId.trim(),\n                    channelId: birdChannelId.trim(),\n                    deliveryEnabled: birdDeliveryEnabled,\n                  });\n                }}',
    'onClick={() => {\n                  const config = {\n                    apiKey: birdApiKey.trim(),\n                    signingSecret: birdSigningSecret.trim(),\n                    workspaceId: birdWorkspaceId.trim(),\n                    channelId: birdChannelId.trim(),\n                    deliveryEnabled: birdDeliveryEnabled,\n                  };\n                  if (birdDeliveryEnabled && Object.values(config).slice(0, 4).some((value) => !value)) {\n                    notify("Enter all Bird provider credentials before enabling automated delivery.", "error");\n                    return;\n                  }\n                  updateBirdMutation.mutate(config);\n                }}',
  )
  .replace(
    'disabled={updateBirdMutation.isPending}\n                onClick',
    'disabled={updateBirdMutation.isPending}\n                aria-busy={updateBirdMutation.isPending}\n                onClick',
  );

source = source.slice(0, whatsappClosing) + "\n" + repairedModal + source.slice(whatsappClosing);

const effectMarker = '  const updateBirdMutation = trpc.support.updateWhatsappProviderConfig.useMutation({';
const effectEnd = '  });\n\n  // Build contact list: CRM won leads + employees';
const effectInsertAt = source.indexOf(effectEnd, source.indexOf(effectMarker));
if (effectInsertAt < 0) throw new Error("Provider mutation boundary was not found");
const escapeEffect = `  });\n\n  useEffect(() => {\n    if (!showConfigModal) return undefined;\n    const handleEscape = (event) => {\n      if (event.key === "Escape" && !updateBirdMutation.isPending) setShowConfigModal(false);\n    };\n    window.addEventListener("keydown", handleEscape);\n    return () => window.removeEventListener("keydown", handleEscape);\n  }, [showConfigModal, updateBirdMutation.isPending]);\n  // Build contact list: CRM won leads + employees`;
source = source.slice(0, effectInsertAt) + escapeEffect + source.slice(effectInsertAt + effectEnd.length);

fs.writeFileSync(dashboardPath, source);

let tests = fs.readFileSync(testPath, "utf8");
const marker = '  it("supports threaded reaction summaries, HR department headcount, and WhatsApp feed filters", () => {';
const testBlock = `  it("keeps the WhatsApp provider configuration modal inside WhatsAppCenter", () => {\n    const whatsappStart = dashboardSource.indexOf("function WhatsAppCenter(");\n    const collaborationStart = dashboardSource.indexOf("function CollaborationHub(");\n    const whatsappSource = dashboardSource.slice(whatsappStart, collaborationStart);\n    const collaborationSource = dashboardSource.slice(collaborationStart);\n    expect(whatsappSource).toContain("const [showConfigModal, setShowConfigModal] = useState(false)");\n    expect(whatsappSource).toContain("Save & Activate Provider");\n    expect(whatsappSource).toContain("aria-modal=\\\"true\\\"");\n    expect(whatsappSource).toContain("handleEscape");\n    expect(collaborationSource).not.toContain("showConfigModal");\n  });\n`;
if (!tests.includes("keeps the WhatsApp provider configuration modal inside WhatsAppCenter")) {
  tests = tests.replace(marker, `${testBlock}${marker}`);
}
fs.writeFileSync(testPath, tests);

console.log("Moved the provider configuration modal into WhatsAppCenter and restored its close, validation, loading, and accessibility boundaries.");
