self.addEventListener("push", event => {
  let payload = {};
  try { payload = event.data ? event.data.json() : {}; } catch { payload = { title: "Smart Manager", body: event.data ? event.data.text() : "You have a new notification." }; }
  const title = payload.title || "Smart Manager";
  const options = { body: payload.message || payload.body || "You have a new notification.", icon: "/favicon.ico", badge: "/favicon.ico", data: payload.data || {} };
  event.waitUntil(self.registration.showNotification(title, options));
});
self.addEventListener("notificationclick", event => {
  event.notification.close();
  const target = event.notification.data && (event.notification.data.screen || event.notification.data.url) || "/app";
  event.waitUntil(clients.matchAll({ type: "window", includeUncontrolled: true }).then(list => {
    const existing = list.find(client => "focus" in client);
    if (existing) { existing.navigate(target); return existing.focus(); }
    return clients.openWindow(target);
  }));
});
