import React, { useEffect, useMemo, useRef, useState } from "react";
import { Users } from "lucide-react";

interface WorkspacePresenceBadgeProps {
  userName: string;
}

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "";

export function WorkspacePresenceBadge({ userName }: WorkspacePresenceBadgeProps) {
  const [activeUsers, setActiveUsers] = useState(1);
  const [connected, setConnected] = useState(false);
  const clientId = useMemo(() => `erp-${Math.random().toString(36).slice(2, 10)}`, []);
  const socketRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    if (!supabaseUrl || !supabaseAnonKey || typeof WebSocket === "undefined") return;
    const wsBase = supabaseUrl.replace(/^http/, "ws").replace(/\/$/, "");
    const socket = new WebSocket(`${wsBase}/realtime/v1/websocket?apikey=${encodeURIComponent(supabaseAnonKey)}&vsn=1.0.0`);
    socketRef.current = socket;
    const topic = "realtime:smart-manager-presence";

    socket.onopen = () => {
      socket.send(JSON.stringify({
        topic,
        event: "phx_join",
        payload: { config: { presence: { key: clientId }, private: false } },
        ref: "1",
      }));
      socket.send(JSON.stringify({
        topic,
        event: "presence",
        payload: { user_name: userName, online_at: new Date().toISOString() },
        ref: "2",
      }));
      setConnected(true);
    };

    socket.onmessage = (message) => {
      try {
        const payload = JSON.parse(message.data);
        if (payload.event === "presence_state" && payload.payload) {
          setActiveUsers(Math.max(1, Object.keys(payload.payload).length));
        }
        if (payload.event === "presence_diff") {
          setActiveUsers((current) => Math.max(1, current + Object.keys(payload.payload?.joins || {}).length - Object.keys(payload.payload?.leaves || {}).length));
        }
      } catch {
        // Presence is purely additive: preserve a local-only fallback badge.
      }
    };
    socket.onerror = () => setConnected(false);
    socket.onclose = () => setConnected(false);

    return () => socket.close();
  }, [clientId, userName]);

  return (
    <div title={connected ? "Live workspace presence" : "Presence fallback: only this browser is visible"} className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-2.5 py-1.5 text-[11.5px] font-semibold text-emerald-700">
      <span className={`h-1.5 w-1.5 rounded-full ${connected ? "bg-emerald-500 animate-pulse" : "bg-slate-400"}`} />
      <Users size={13} />
      {activeUsers} active
    </div>
  );
}
