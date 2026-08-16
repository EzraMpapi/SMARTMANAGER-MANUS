import { createClient } from "@supabase/supabase-js";

function requirePasskeySession(session) {
  if (!session?.accessToken || !session?.refreshToken) {
    const error = new Error("An active account session is required to manage passkeys.");
    error.code = "PASSKEY_SESSION_MISSING";
    throw error;
  }
}

export async function createAccountPasskeyClient({ supabaseUrl, supabaseAnonKey, session }) {
  requirePasskeySession(session);
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      experimental: { passkey: true },
    },
  });
  const { error } = await client.auth.setSession({
    access_token: session.accessToken,
    refresh_token: session.refreshToken,
  });
  if (error) throw error;
  return client;
}

export function createPublicPasskeyClient({ supabaseUrl, supabaseAnonKey }) {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
      experimental: { passkey: true },
    },
  });
}

export async function signInWithPasskeyUsingClient(client) {
  const { data, error } = await client.auth.signInWithPasskey();
  if (error) throw error;
  if (!data?.session?.access_token || !data?.session?.refresh_token || !data?.user?.id) {
    const sessionError = new Error("The passkey service did not return a complete authenticated session.");
    sessionError.code = "AUTH_RESPONSE_INVALID";
    throw sessionError;
  }
  return data.session;
}

export async function signInWithAccountPasskey({ supabaseUrl, supabaseAnonKey }) {
  const client = createPublicPasskeyClient({ supabaseUrl, supabaseAnonKey });
  return signInWithPasskeyUsingClient(client);
}

export async function listAccountPasskeys(client) {
  const { data, error } = await client.auth.passkey.list();
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

export async function registerAccountPasskey(client) {
  const { data, error } = await client.auth.registerPasskey();
  if (error) throw error;
  return data;
}

export async function renameAccountPasskey(client, passkeyId, friendlyName) {
  const { data, error } = await client.auth.passkey.update({ passkeyId, friendlyName });
  if (error) throw error;
  return data;
}

export async function revokeAccountPasskey(client, passkeyId) {
  const { error } = await client.auth.passkey.delete({ passkeyId });
  if (error) throw error;
}

export function passkeyUserMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  if (code === "passkey_disabled") return "Account passkeys are not enabled for this workspace yet. An administrator must finish the Supabase relying-party setup first.";
  if (code === "too_many_passkeys") return "This account has reached its passkey limit. Revoke an unused credential before adding another.";
  if (code === "webauthn_credential_exists") return "This device or password manager already has a passkey for this account.";
  if (code.includes("webauthn") || code === "not_allowed_error") return "The passkey ceremony was cancelled or could not be verified. Try again from a supported HTTPS browser.";
  if (error?.name === "NotAllowedError") return "The passkey ceremony was cancelled or timed out. No credential was added.";
  return error?.message || "Passkey management could not be completed. Please try again.";
}

export function passkeySignInUserMessage(error) {
  const code = String(error?.code || "").toLowerCase();
  if (code === "passkey_disabled") return "Passkey sign-in is not enabled for this workspace yet. Use your email or an approved provider, then ask an administrator to complete the Supabase relying-party setup.";
  if (code === "webauthn_credential_not_found") return "No matching Smart Manager passkey was found on this device or password manager. Use your email or another approved sign-in method.";
  if (code === "email_not_confirmed") return "Confirm your email before using a registered passkey to sign in.";
  if (code === "user_banned") return "This account cannot sign in. Contact a workspace administrator for assistance.";
  if (code.includes("webauthn") || error?.name === "NotAllowedError") return "Passkey sign-in was cancelled, timed out, or could not be verified. Your account was not signed in.";
  return passkeyUserMessage(error);
}
