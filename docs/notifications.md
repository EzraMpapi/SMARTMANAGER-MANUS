# Notification system

Smart Manager now has a tenant-scoped notification foundation backed by Supabase. The browser notification center reads the authenticated user's records, subscribes to Supabase Realtime inserts, supports optimistic read state, registers Web Push subscriptions, and routes actionable notifications through `data.screen` or `data.url`.

## Required public variables

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
VITE_WEB_PUSH_PUBLIC_KEY=<VAPID-public-key>
```

Only the Supabase URL, anon key, and VAPID public key may be exposed to the browser. Never commit `SUPABASE_SERVICE_ROLE_KEY`, FCM credentials, or VAPID private keys.

## Supabase setup

Apply `supabase/migrations/20260916_001_notifications_push_system.sql`. It creates `notifications`, `push_tokens`, and `notification_preferences`, indexes them, enables tenant/user RLS, and adds `notifications` to the `supabase_realtime` publication. The migration uses the existing `current_company_id()` and `billing_is_manager()` authorization helpers.

Deploy `supabase/functions/send-notification/index.ts` as `send-notification` with JWT verification enabled. Configure the Edge Function secrets `SUPABASE_SERVICE_ROLE_KEY`, `FCM_SERVICE_ACCOUNT_JSON`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT`. The durable notification record is created before provider delivery so in-app delivery remains reliable if a push provider is unavailable.

## Sending an application notification

Authenticated server-side code should call the Edge Function with the user's bearer token:

```json
{
  "user_id": "recipient-profile-uuid",
  "title": "New Order",
  "message": "You have received order #BH-1045.",
  "type": "order",
  "notification_key": "order:BH-1045:new",
  "data": { "order_id": "BH-1045", "screen": "/orders/BH-1045" }
}
```

The unique `(user_id, notification_key)` index prevents retry storms from creating duplicate records.

## Validation

Run `pnpm exec tsc --noEmit`, `pnpm test --run`, and `pnpm build`. For a live test, sign in as two users in one workspace, insert/send a notification to the recipient, confirm the bell badge and toast update without refresh, enable browser push, close/background the tab, and click the resulting notification to verify its deep link.

Android FCM delivery requires adding the Firebase client configuration to the Android wrapper and implementing the provider-specific adapter using Edge Function secrets. This repository currently contains an Android Trusted Web Activity shell, so the browser Web Push path is the active frontend integration.
