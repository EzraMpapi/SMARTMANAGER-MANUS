import React, { useEffect, useMemo, useRef, useState } from "react";
import { Wifi, WifiOff, LoaderCircle, Cloud } from "lucide-react";
import { getGuardedPersistenceCompanyId } from "../lib/guardedPersistenceClient";
import { offlineQueueSummary, offlineScope } from "../lib/offlineSync";

type ConnectionState = "offline" | "connecting" | "live" | "disconnected";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

function getOutboxCount() {
  const scope = offlineScope(getGuardedPersistenceCompanyId() || "current-company");
  const summary = offlineQueueSummary(scope);
  return summary.pending + summary.syncing + summary.failed + summary.conflicts;
}

export function RealtimeConnectivityBadge() {
  const [browserOnline, setBrowserOnline] = useState(() => typeof navigator === "undefined" ? true : navigator.onLine);
  const [connection, setConnection] = useState<ConnectionState>(() => typeof navigator === "undefined" || navigator.onLine ? "connecting" : "offline");
  const [outboxCount, setOutboxCount] = useState(getOutboxCount);
  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<number | null>(null);
  const clientId = useMemo(() => `status-${Math.random().toString(36).slice(2, 10)}`, []);

  useEffect(() => {
    const refreshOutbox = () => setOutboxCount(getOutboxCount());
    const handleOnline = () => {
      setBrowserOnline(true);
      setConnection("connecting");
      refreshOutbox();
    };
    const handleOffline = () => {
      setBrowserOnline(false);
      setConnection("offline");
      refreshOutbox();
    };
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("smart-manager:offline-sync-updated", refreshOutbox);
    refreshOutbox();
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("smart-manager:offline-sync-updated", refreshOutbox);
    };
  }, []);

  useEffect(() => {
    let disposed = false;
    const connect = () => {
      if (disposed || !browserOnline) return;
      if (!supabaseUrl || !supabaseAnonKey || typeof WebSocket === "undefined") {
        setConnection("disconnected");
        return;
      }
      setConnection("connecting");
      const wsBase = supabaseUrl.replace(/^http/, "ws").replace(/\/$/, "");
      const socket = new WebSocket(`${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(supabaseAnonKey)}&vsn=1.0.0`);
      socketRef.current = socket;
      socket.onopen = () => {
        if (disposed) return;
        socket.send(JSON.stringify({ topic: "realtime:smart-manager-connectivity", event: "phx_join", payload: { config: { private: false }, client_id: clientId }, ref: "1" }));
        setConnection("live");
      };
      socket.onerror = () => { if (!disposed) setConnection("disconnected"); };
      socket.onclose = () => {
        if (disposed) return;
        setConnection(browserOnline ? "disconnected" : "offline");
        reconnectTimerRef.current = window.setTimeout(connect, 5000);
      };
    };
    connect();
    return () => {
      disposed = true;
      if (reconnectTimerRef.current !== null) window.clearTimeout(reconnectTimerRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [browserOnline, clientId]);

  const state = !browserOnline ? "offline" : connection;
  const label = state === "live" ? "Live" : state === "connecting" ? "Connecting" : state === "offline" ? "Offline" : "Reconnecting";
  const description = state === "live" ? "Live WebSocket connected" : state === "offline" ? "Offline: changes are saved on this device" : "WebSocket is reconnecting";
  const StatusIcon = state === "offline" ? WifiOff : state === "connecting" ? LoaderCircle : state === "live" ? Wifi : Cloud;
  const tone = state === "live" ? "border-emerald-200 bg-emerald-50 text-emerald-700" : state === "offline" ? "border-slate-700 bg-slate-900 text-white" : "border-amber-200 bg-amber-50 text-amber-800";

  return (
    <div
      className={`inline-flex min-w-0 items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${tone}`}
      data-testid="realtime-connectivity-indicator"
      aria-label={`${description}. ${outboxCount} pending outbox ${outboxCount === 1 ? "change" : "changes"}.`}
      title={`${description} · ${outboxCount} pending outbox ${outboxCount === 1 ? "change" : "changes"}`}
    >
      <StatusIcon size={12} className={state === "connecting" ? "animate-spin" : ""} aria-hidden="true" />
      <span className="hidden sm:inline">{label}</span>
      <span className="h-1 w-1 rounded-full bg-current" aria-hidden="true" />
      <span className="whitespace-nowrap">{outboxCount} pending</span>
    </div>
  );
}
