const args = new Map(process.argv.slice(2).map((argument) => {
  const [key, ...value] = argument.split("=");
  return [key, value.join("=")];
}));

const environment = args.get("--environment");
const testProduct = args.get("--test-product");
const testShift = args.get("--test-shift");
const approvedWrite = args.has("--approved-staging-write");

if (environment !== "staging") {
  throw new Error("This acceptance preflight is restricted to --environment=staging. It will not run against a production workspace.");
}

if (!testProduct || !testShift) {
  throw new Error("Specify an approved --test-product=<barcode-or-sku> and --test-shift=<approved-shift-label>.");
}

const steps = [
  "Open the approved staging shift and verify its opening float.",
  `Scan the approved test product (${testProduct}) and confirm the exact match in the cart.`,
  "Complete one split cash/card sale, verify change, then retain the receipt reference.",
  "Hold and resume a second cart without reducing stock until the confirmed completion action.",
  "Record one pay-in and one pay-out using only the approved staging values.",
  "Print one receipt using the configured counter profile.",
  "Process one permitted return against the approved sale and confirm the server receipt reference.",
  "Close the approved shift, review the Z-report, and verify only server-confirmed outcomes in Reconciliation.",
];

if (!approvedWrite) {
  console.log(JSON.stringify({
    mode: "preflight-only",
    environment,
    testProduct,
    testShift,
    warning: "No transaction was created. Re-run with --approved-staging-write only after a designated operator confirms the approved test values.",
    steps,
  }, null, 2));
  process.exit(0);
}

console.log(JSON.stringify({
  mode: "operator-confirmed-manual-execution",
  environment,
  testProduct,
  testShift,
  warning: "This utility deliberately does not click transactional POS controls. The designated operator must perform the approved actions in the staging workspace so every write remains reviewable and attributable.",
  steps,
}, null, 2));
