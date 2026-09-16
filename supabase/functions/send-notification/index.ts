import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

type Payload = { user_id: string; title: string; message: string; type?: string; data?: Record<string, unknown>; notification_key?: string };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const authHeader = req.headers.get("Authorization") || "";
  const token = authHeader.replace(/^Bearer\s+/i, "");
  if (!token) return json({ error: "Authorization required" }, 401);
  const { data: caller, error: callerError } = await admin.auth.getUser(token);
  if (callerError || !caller.user) return json({ error: "Unauthorized" }, 401);
  let payload: Payload;
  try { payload = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!isUuid(payload.user_id) || !payload.title?.trim() || !payload.message?.trim()) return json({ error: "user_id, title and message are required" }, 400);
  const { data: callerProfile } = await admin.from("profiles").select("id,company_id,role").eq("id", caller.user.id).maybeSingle();
  const { data: recipient } = await admin.from("profiles").select("id,company_id").eq("id", payload.user_id).maybeSingle();
  if (!callerProfile || !recipient || callerProfile.company_id !== recipient.company_id) return json({ error: "Recipient is not in your workspace" }, 403);
  const role = String(callerProfile.role || "").toLowerCase();
  const allowed = ["admin", "administrator", "organization owner", "ceo", "super administrator", "platform administrator", "finance manager"].some(value => role.includes(value));
  if (caller.user.id !== payload.user_id && !allowed) return json({ error: "Administrator authorization required" }, 403);
  const { data: notification, error: insertError } = await admin.from("notifications").insert({ user_id: payload.user_id, company_id: recipient.company_id, title: payload.title.trim(), message: payload.message.trim(), type: payload.type || "system", data: payload.data || {}, notification_key: payload.notification_key || null }).select("id,title,message,type,data,is_read,created_at").single();
  if (insertError) return json({ error: "Could not create notification", details: insertError.message }, 500);
  const { data: tokens } = await admin.from("push_tokens").select("id,token,platform,subscription").eq("user_id", payload.user_id).eq("is_active", true);
  const delivery = { notification_id: notification.id, attempted: tokens?.length || 0, delivered: 0, deactivated: 0, provider_configured: Boolean(Deno.env.get("FCM_SERVICE_ACCOUNT_JSON") || Deno.env.get("VAPID_PRIVATE_KEY")) };
  // Provider delivery is deliberately isolated from the durable in-app record. Configure FCM/VAPID secrets before enabling it.
  // Invalid providers are marked inactive by the provider-specific delivery adapter in the next deployment.
  return json({ ok: true, notification, delivery });
});
