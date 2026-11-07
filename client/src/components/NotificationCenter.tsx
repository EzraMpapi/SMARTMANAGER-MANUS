import { Bell, Check, ExternalLink, Loader2, Settings2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  enableBrowserPush,
  listNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToNotifications,
  type NotificationRecord,
} from "@/lib/notifications";

function relativeTime(value: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export function NotificationCenter() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const unread = useMemo(() => items.filter(item => !item.is_read).length, [items]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const result = await listNotifications();
      if (result.error) throw result.error;
      setItems(result.data || []);
    } catch {
      // Notification UI must not interrupt the main workspace when offline.
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => { void load(); }, [load]);
  useEffect(() => {
    if (!user?.id) return;
    return subscribeToNotifications(user.id, notification => {
      setItems(current => current.some(item => item.id === notification.id) ? current : [notification, ...current].slice(0, 30));
      toast(notification.title, { description: notification.message });
    });
  }, [user?.id]);

  const markRead = async (item: NotificationRecord) => {
    if (item.is_read) return;
    setItems(current => current.map(candidate => candidate.id === item.id ? { ...candidate, is_read: true } : candidate));
    const result = await markNotificationRead(item.id);
    if (result.error) void load();
  };
  const markAllRead = async () => {
    setItems(current => current.map(item => ({ ...item, is_read: true })));
    const result = await markAllNotificationsRead();
    if (result.error) void load();
  };
  const enablePush = async () => {
    try {
      const result = await enableBrowserPush();
      if (!result.supported) toast.info("Push notifications are not supported by this browser.");
      else if (result.permission !== "granted") toast.info("Browser notification permission was not granted.");
      else if (result.error) toast.error("Push registration could not be saved.");
      else toast.success("Browser push notifications enabled.");
    } catch { toast.error("Push notifications could not be enabled right now."); }
  };

  return <div className="relative">
    <button type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} onClick={() => setOpen(value => !value)} className="relative flex h-9 w-9 items-center justify-center rounded-lg hover:bg-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Bell className="h-4 w-4" />
      {unread > 0 && <span className="absolute -right-0.5 -top-0.5 min-w-4 rounded-full bg-destructive px-1 text-center text-[10px] font-bold leading-4 text-destructive-foreground">{unread > 9 ? "9+" : unread}</span>}
    </button>
    {open && <div role="dialog" aria-label="Notifications" className="absolute right-0 top-11 z-50 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl">
      <div className="flex items-center justify-between border-b px-4 py-3"><div><h2 className="text-sm font-semibold">Notifications</h2><p className="text-xs text-muted-foreground">{unread ? `${unread} unread` : "All caught up"}</p></div><div className="flex items-center gap-1"><button type="button" onClick={() => void enablePush()} className="rounded-md p-2 text-muted-foreground hover:bg-accent" aria-label="Enable browser push"><Settings2 className="h-4 w-4" /></button><button type="button" onClick={() => void markAllRead()} disabled={!unread} className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent disabled:opacity-40">Mark all read</button></div></div>
      <div className="max-h-[min(28rem,70vh)] overflow-y-auto">{loading && !items.length ? <div className="flex justify-center p-8"><Loader2 className="h-5 w-5 animate-spin" /></div> : items.length === 0 ? <p className="p-8 text-center text-sm text-muted-foreground">No notifications yet.</p> : items.map(item => <button type="button" key={item.id} onClick={() => { void markRead(item); const screen = typeof item.data?.screen === "string" ? item.data.screen : typeof item.data?.url === "string" ? item.data.url : ""; if (screen) window.location.assign(screen); }} className={`flex w-full gap-3 border-b px-4 py-3 text-left hover:bg-accent/50 ${item.is_read ? "opacity-70" : "bg-primary/5"}`}><span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${item.is_read ? "bg-muted" : "bg-primary"}`} /><span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-2"><strong className="truncate text-sm">{item.title}</strong><span className="shrink-0 text-[10px] text-muted-foreground">{relativeTime(item.created_at)}</span></span><span className="mt-1 block text-xs leading-5 text-muted-foreground">{item.message}</span>{typeof item.data?.screen === "string" && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-medium text-primary">Open <ExternalLink className="h-3 w-3" /></span>}</span>{item.is_read && <Check className="mt-1 h-3.5 w-3.5 shrink-0 text-muted-foreground" />}</button>)}</div>
    </div>}
  </div>;
}
