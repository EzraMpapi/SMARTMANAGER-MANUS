const [widthArg = "360", moduleLabel = "CRM"] = process.argv.slice(2);
const width = Number(widthArg);
const height = 844;

const targets = await fetch("http://127.0.0.1:9222/json").then((response) => response.json());
const page = targets.find((target) => target.type === "page" && target.url.includes("bserp-dashbo-xgm6fauw.manus.space/app"));

if (!page?.webSocketDebuggerUrl) {
  throw new Error("Authenticated Smart Manager browser target was not available.");
}

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

const windowInfo = await command("Browser.getWindowForTarget", { targetId: page.id });
await command("Browser.setWindowBounds", {
  windowId: windowInfo.windowId,
  bounds: { width, height },
});
await new Promise((resolve) => setTimeout(resolve, 300));
await command("Emulation.setDeviceMetricsOverride", {
  width,
  height,
  deviceScaleFactor: 1,
  mobile: true,
  screenWidth: width,
  screenHeight: height,
  scale: 1,
});
await new Promise((resolve) => setTimeout(resolve, 300));
const windowBounds = await command("Browser.getWindowBounds", { windowId: windowInfo.windowId });

async function clickVisibleModule(label) {
  const result = await command("Runtime.evaluate", {
    expression: `(() => {
    const target = [...document.querySelectorAll('button')].find((button) => button.textContent.trim() === ${JSON.stringify(moduleLabel)});
    if (!target || target.offsetParent === null) return { clicked: false, reason: 'Module button not found' };
    target.click();
    return { clicked: true };
    })()`.replaceAll(JSON.stringify(moduleLabel), JSON.stringify(label)),
    returnByValue: true,
  });
  return result.result.value;
}

let navigation = await clickVisibleModule(moduleLabel);
if (!navigation.clicked && moduleLabel !== "Dashboard") {
  const dashboardNavigation = await clickVisibleModule("Dashboard");
  if (dashboardNavigation.clicked) {
    await new Promise((resolve) => setTimeout(resolve, 300));
    navigation = { ...await clickVisibleModule(moduleLabel), viaDashboard: true };
  }
}

await new Promise((resolve) => setTimeout(resolve, 750));

const inspection = await command("Runtime.evaluate", {
  expression: `(() => ({
    module: ${JSON.stringify(moduleLabel)},
    width: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    pageOverflow: document.documentElement.scrollWidth > window.innerWidth,
    title: document.querySelector('h1')?.textContent?.trim() || null,
    activeNavigation: [...document.querySelectorAll('button')].filter((button) => button.getAttribute('aria-current') === 'page').map((button) => button.textContent.trim()),
    tabStrips: [...document.querySelectorAll('[role="tablist"]')].map((strip) => ({
      clientWidth: Math.round(strip.clientWidth),
      scrollWidth: Math.round(strip.scrollWidth),
      scrollable: strip.scrollWidth > strip.clientWidth,
    })),
    actionGroups: [...document.querySelectorAll('.sm-mobile-action-group')].filter((group) => group.offsetParent !== null).map((group) => ({
      width: Math.round(group.getBoundingClientRect().width),
      scrollWidth: Math.round(group.scrollWidth),
      wrapped: getComputedStyle(group).flexWrap === 'wrap',
      exceedsViewport: group.getBoundingClientRect().right > window.innerWidth,
    })),
  }))()`,
  returnByValue: true,
});

console.log(JSON.stringify({ windowBounds: windowBounds.bounds, navigation, inspection: inspection.result.value }));
socket.close();
