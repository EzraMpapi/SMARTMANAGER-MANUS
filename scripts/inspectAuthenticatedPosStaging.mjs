const targetTab = process.argv[2] || "checkout";
const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.url.includes("bserp-dashbo-xgm6fauw.manus.space/app"));

if (!page?.webSocketDebuggerUrl) throw new Error("Authenticated Smart Manager browser target was not available.");

const socket = new WebSocket(page.webSocketDebuggerUrl);
const pending = new Map();
let sequence = 0;

function command(method, params = {}) {
  const id = ++sequence;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
}

await new Promise((resolve, reject) => {
  socket.addEventListener("open", resolve, { once: true });
  socket.addEventListener("error", reject, { once: true });
});

socket.addEventListener("message", (event) => {
  const message = JSON.parse(event.data);
  if (!message.id) return;
  const handler = pending.get(message.id);
  if (!handler) return;
  pending.delete(message.id);
  if (message.error) handler.reject(new Error(message.error.message));
  else handler.resolve(message.result);
});

await command("Runtime.evaluate", {
  expression: `(() => {
    const button = [...document.querySelectorAll("button")].find((entry) => entry.textContent.trim() === "Point of Sale");
    if (!button || button.offsetParent === null) return { clicked: false };
    button.click();
    const profile = [...document.querySelectorAll("details")].find((entry) => entry.textContent.includes("Counter device profile"));
    if (profile) profile.open = true;
    return { clicked: true };
  })()`,
  returnByValue: true,
});
await new Promise((resolve) => setTimeout(resolve, 650));

if (targetTab === "reconciliation") {
  await command("Runtime.evaluate", {
    expression: `(() => {
      const button = [...document.querySelectorAll("button")].find((entry) => entry.textContent.includes("Reconciliation"));
      if (!button || button.offsetParent === null) return { clicked: false };
      button.click();
      return { clicked: true };
    })()`,
    returnByValue: true,
  });
  await new Promise((resolve) => setTimeout(resolve, 500));
}

const result = await command("Runtime.evaluate", {
  expression: `(() => {
    const text = document.body?.innerText || "";
    return {
      title: document.querySelector("h1")?.textContent?.trim() || null,
      deviceProfileVisible: text.includes("Counter device profile"),
      checkoutVisible: text.includes("Complete Sale") || text.includes("Hold sale"),
      reconciliationTabVisible: [...document.querySelectorAll("button")].some((button) => button.textContent.includes("Reconciliation")),
      reconciliationSurfaceVisible: text.includes("POS reconciliation") && text.includes("Server outcomes") && text.includes("Needs attention"),
      browserOnlyQueueExplained: text.includes("Device-only pending carts"),
      printerSafetyNoticeVisible: text.includes("No printer credentials, serial ports, payment tokens"),
      viewport: { width: window.innerWidth, documentWidth: document.documentElement.scrollWidth },
      documentOverflow: document.documentElement.scrollWidth > window.innerWidth,
    };
  })()`,
  returnByValue: true,
});

console.log(JSON.stringify(result.result.value));
socket.close();
