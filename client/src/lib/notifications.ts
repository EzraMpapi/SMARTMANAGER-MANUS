import { getSupabaseAuthClient } from "./supabaseAuthClient";
import { getBuildPublicSupabaseConfig } from "./publicSupabaseConfig";

export type NotificationRecord = {
  id: string;
  title: string;
  message: string;
  type: string;
  data: Record<string, unknown>;
  is_read: boolean;
  created_at: string;
};

const client = () => getSupabaseAuthClient(getBuildPublicSupabaseConfig());

export async function listNotifications(limit = 30): Promise<{ data: NotificationRecord[] | null; error: Error | null }> {
  const db = client();
  if (!db) return { data: [] as NotificationRecord[], error: new Error("Supabase is not configured") };
  const result = await db.from("notifications").select("id,title,message,type,data,is_read,created_at").order("created_at", { ascending: false }).limit(limit);
  return { data: (result.data || []) as NotificationRecord[], error: result.error as Error | null };
}

export async function markNotificationRead(id: string) {
  const db = client();
  if (!db) return { error: new Error("Supabase is not configured") };
  return db.from("notifications").update({ is_read: true }).eq("id", id);
}

export async function markAllNotificationsRead() {
  const db = client();
  if (!db) return { error: new Error("Supabase is not configured") };
  return db.from("notifications").update({ is_read: true }).eq("is_read", false);
}

export async function registerPushToken(token: string, metadata: { platform?: string; deviceName?: string; browser?: string; subscription?: PushSubscriptionJSON } = {}) {
  const db = client();
  if (!db || !token.trim()) return { error: new Error("Push registration is unavailable") };
  const { data: user } = await db.auth.getUser();
  if (!user.user) return { error: new Error("You must be signed in to register push notifications") };
  return db.from("push_tokens").upsert({
    user_id: user.user.id,
    token: token.trim(),
    platform: metadata.platform || "web",
    device_name: metadata.deviceName || (typeof navigator !== "undefined" ? navigator.platform : "browser"),
    browser: metadata.browser || (typeof navigator !== "undefined" ? navigator.userAgent.slice(0, 160) : "browser"),
    subscription: metadata.subscription || null,
    is_active: true,
  }, { onConflict: "user_id,token" });
}

export function subscribeToNotifications(userId: string, onInsert: (notification: NotificationRecord) => void) {
  const db = client();
  if (!db || !userId) return () => undefined;
  const channel = db.channel(`notifications:${userId}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` }, payload => onInsert(payload.new as NotificationRecord))
    .subscribe();
  return () => { void db.removeChannel(channel); };
}

export async function enableBrowserPush() {
  if (typeof window === "undefined" || !("Notification" in window) || !("serviceWorker" in navigator)) return { supported: false, permission: "unsupported" as const };
  const permission = await Notification.requestPermission();
  if (permission !== "granted") return { supported: true, permission };
  const registration = await navigator.serviceWorker.register("/notification-sw.js");
  const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: import.meta.env.VITE_WEB_PUSH_PUBLIC_KEY || undefined });
  const token = JSON.stringify(subscription.toJSON());
  const result = await registerPushToken(token, { subscription: subscription.toJSON(), platform: "web" });
  return { supported: true, permission, subscription, error: result.error || null };
}
