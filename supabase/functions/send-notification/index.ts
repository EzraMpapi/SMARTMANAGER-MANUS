import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import webpush from "npm:web-push";
import { importPKCS8, SignJWT } from "npm:jose";

type Payload = { user_id: string; title: string; message: string; type?: string; data?: Record<string, unknown>; notification_key?: string };
type Token = { id: string; token: string; platform: string; subscription: Record<string, unknown> | null };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });
const isUuid = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

async function fcmAccessToken(serviceAccount: { client_email: string; private_key: string; token_uri?: string }) {
  const key = await importPKCS8(serviceAccount.private_key.replace(/\\n/g, "\n"), "RS256");
  const assertion = await new SignJWT({ scope: "https://www.googleapis.com/auth/firebase.messaging" }).setProtectedHeader({ alg: "RS256", typ: "JWT" }).setIssuer(serviceAccount.client_email).setAudience(serviceAccount.token_uri || "https://oauth2.googleapis.com/token").setIssuedAt().setExpirationTime("1h").sign(key);
  const response = await fetch(serviceAccount.token_uri || "https://oauth2.googleapis.com/token", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion }) });
  const body = await response.json();
  if (!response.ok || !body.access_token) throw new Error("FCM OAuth token request failed");
  return body.access_token as string;
}

async function deliverWebPush(token: Token, payload: Record<string, unknown>) {
  const publicKey = Deno.env.get("VAPID_PUBLIC_KEY"); const privateKey = Deno.env.get("VAPID_PRIVATE_KEY"); const subject = Deno.env.get("VAPID_SUBJECT");
  if (!publicKey || !privateKey || !subject || !token.subscription) return { configured: false, invalid: false };
  webpush.setVapidDetails(subject, publicKey, privateKey);
  try { await webpush.sendNotification(token.subscription as webpush.PushSubscription, JSON.stringify(payload)); return { configured: true, invalid: false }; }
  catch (error) { const status = Number((error as { statusCode?: number }).statusCode); return { configured: true, invalid: status === 404 || status === 410 }; }
}

async function deliverFcm(token: Token, payload: Payload, serviceAccount: { project_id: string; client_email: string; private_key: string; token_uri?: string }) {
  try {
    const accessToken = await fcmAccessToken(serviceAccount);
    const response = await fetch(`https://fcm.googleapis.com/v1/projects/${serviceAccount.project_id}/messages:send`, { method: "POST", headers: { authorization: `Bearer ${accessToken}`, "content-type": "application/json" }, body: JSON.stringify({ message: { token: token.token, notification: { title: payload.title, body: payload.message }, data: Object.fromEntries(Object.entries(payload.data || {}).map(([key, value]) => [key, String(value)])) } }) });
    return { configured: true, invalid: response.status === 404 || response.status === 410 || response.status === 400 };
  } catch { return { configured: true, invalid: false }; }
}

Deno.serve(async req => {
  if (req.method !== "POST") return json({ error: "Method not allowed" }, 405);
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!; const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const admin = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const token = (req.headers.get("Authorization") || "").replace(/^Bearer\s+/i, ""); if (!token) return json({ error: "Authorization required" }, 401);
  const { data: caller, error: callerError } = await admin.auth.getUser(token); if (callerError || !caller.user) return json({ error: "Unauthorized" }, 401);
  let payload: Payload; try { payload = await req.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (!isUuid(payload.user_id) || !payload.title?.trim() || !payload.message?.trim()) return json({ error: "user_id, title and message are required" }, 400);
  const { data: callerProfile } = await admin.from("profiles").select("id,company_id,role").eq("id", caller.user.id).maybeSingle();
  const { data: recipient } = await admin.from("profiles").select("id,company_id").eq("id", payload.user_id).maybeSingle();
  if (!callerProfile || !recipient || callerProfile.company_id !== recipient.company_id) return json({ error: "Recipient is not in your workspace" }, 403);
  const role = String(callerProfile.role || "").toLowerCase(); const allowed = ["admin", "administrator", "organization owner", "ceo", "super administrator", "platform administrator", "finance manager"].some(value => role.includes(value));
  if (caller.user.id !== payload.user_id && !allowed) return json({ error: "Administrator authorization required" }, 403);
  const { data: notification, error: insertError } = await admin.from("notifications").insert({ user_id: payload.user_id, company_id: recipient.company_id, title: payload.title.trim(), message: payload.message.trim(), type: payload.type || "system", data: payload.data || {}, notification_key: payload.notification_key || null }).select("id,title,message,type,data,is_read,created_at").single();
  if (insertError) return json({ error: "Could not create notification", details: insertError.message }, 500);
  const { data: tokens } = await admin.from("push_tokens").select("id,token,platform,subscription").eq("user_id", payload.user_id).eq("is_active", true) as { data: Token[] | null };
  const serviceAccountRaw = Deno.env.get("FCM_SERVICE_ACCOUNT_JSON"); const serviceAccount = serviceAccountRaw ? JSON.parse(serviceAccountRaw) : null;
  let delivered = 0; let deactivated = 0; let configured = false;
  for (const device of tokens || []) {
    const result = device.platform === "web" ? await deliverWebPush(device, { title: payload.title, message: payload.message, data: payload.data || {} }) : serviceAccount ? await deliverFcm(device, payload, serviceAccount) : { configured: false, invalid: false };
    configured ||= result.configured;
    if (result.invalid) { await admin.from("push_tokens").update({ is_active: false }).eq("id", device.id); deactivated++; }
    else if (result.configured) delivered++;
  }
  return json({ ok: true, notification, delivery: { notification_id: notification.id, attempted: tokens?.length || 0, delivered, deactivated, provider_configured: configured } });
});
