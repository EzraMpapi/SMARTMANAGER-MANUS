import { afterAll, describe, expect, it } from "vitest";

const runRemote = process.env.RUN_REMOTE_AUTH_RLS_TESTS === "true";
const runWrites = runRemote && process.env.RUN_REMOTE_AUTH_RLS_WRITE_TESTS === "true";
const describeRemote = runRemote ? describe : describe.skip;

const baseUrl = (process.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, "");
const anonKey = process.env.VITE_SUPABASE_ANON_KEY ?? "";
const createdContactIds: Array<{ token: string; id: string }> = [];

function requireConfigured(value: string | undefined, name: string): string {
  expect(value, `${name} must be configured for remote auth/RLS tests`).toBeTruthy();
  return value as string;
}

async function signIn(email: string, password: string) {
  const response = await fetch(`${baseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { "content-type": "application/json", apikey: anonKey },
    body: JSON.stringify({ email, password }),
  });
  const body = await response.json().catch(() => ({}));
  expect(response.status, JSON.stringify({ code: body.code || body.error_code, message: body.message || body.error_description || body.msg, status: response.status })).toBe(200);
  expect(body.access_token).toBeTruthy();
  expect(body.user?.id).toBeTruthy();
  return body as { access_token: string; refresh_token?: string; user: { id: string; email: string } };
}

async function fetchProfile(token: string, userId: string) {
  const response = await fetch(`${baseUrl}/rest/v1/profiles?select=id,company_id,role,is_active&id=eq.${encodeURIComponent(userId)}`, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => []);
  expect(response.status, JSON.stringify(body)).toBe(200);
  expect(body).toHaveLength(1);
  expect(body[0].id).toBe(userId);
  expect(body[0].company_id).toBeTruthy();
  return body[0] as { id: string; company_id: string; role: string; is_active: boolean };
}

async function insertTenantContact(token: string, marker: string) {
  const response = await fetch(`${baseUrl}/rest/v1/crm_contacts`, {
    method: "POST",
    headers: {
      apikey: anonKey,
      authorization: `Bearer ${token}`,
      "content-type": "application/json",
      prefer: "return=representation",
    },
    body: JSON.stringify({ name: marker, status: "TEST", amount: 1000, notes: "Authenticated tenant isolation verification" }),
  });
  const body = await response.json().catch(() => []);
  expect(response.status, JSON.stringify(body)).toBe(201);
  expect(body).toHaveLength(1);
  expect(body[0].id).toBeTruthy();
  expect(body[0].company_id).toBeTruthy();
  createdContactIds.push({ token, id: body[0].id });
  return body[0] as { id: string; company_id: string };
}

async function readContactById(token: string, id: string) {
  const response = await fetch(`${baseUrl}/rest/v1/crm_contacts?select=id,company_id&id=eq.${encodeURIComponent(id)}`, {
    headers: { apikey: anonKey, authorization: `Bearer ${token}` },
  });
  const body = await response.json().catch(() => []);
  expect(response.status, JSON.stringify(body)).toBe(200);
  return body as Array<{ id: string; company_id: string }>;
}

describeRemote("Supabase Auth sessions and tenant RLS", () => {
  it("authenticates both approved accounts and resolves each profile using auth.users.id", async () => {
    requireConfigured(baseUrl, "VITE_SUPABASE_URL");
    requireConfigured(anonKey, "VITE_SUPABASE_ANON_KEY");
    const ezra = await signIn(requireConfigured(process.env.SUPABASE_EZRA_EMAIL, "SUPABASE_EZRA_EMAIL"), requireConfigured(process.env.SUPABASE_EZRA_PASSWORD, "SUPABASE_EZRA_PASSWORD"));
    const mary = await signIn(requireConfigured(process.env.SUPABASE_MARY_EMAIL, "SUPABASE_MARY_EMAIL"), requireConfigured(process.env.SUPABASE_MARY_PASSWORD, "SUPABASE_MARY_PASSWORD"));
    const [ezraProfile, maryProfile] = await Promise.all([
      fetchProfile(ezra.access_token, ezra.user.id),
      fetchProfile(mary.access_token, mary.user.id),
    ]);
    expect(ezraProfile.company_id).not.toBe(maryProfile.company_id);
  }, 30_000);

  it.skipIf(!runWrites)("derives crm_contacts.company_id from each authenticated tenant and blocks cross-tenant reads", async () => {
    const ezra = await signIn(requireConfigured(process.env.SUPABASE_EZRA_EMAIL, "SUPABASE_EZRA_EMAIL"), requireConfigured(process.env.SUPABASE_EZRA_PASSWORD, "SUPABASE_EZRA_PASSWORD"));
    const mary = await signIn(requireConfigured(process.env.SUPABASE_MARY_EMAIL, "SUPABASE_MARY_EMAIL"), requireConfigured(process.env.SUPABASE_MARY_PASSWORD, "SUPABASE_MARY_PASSWORD"));
    const [ezraProfile, maryProfile] = await Promise.all([
      fetchProfile(ezra.access_token, ezra.user.id),
      fetchProfile(mary.access_token, mary.user.id),
    ]);
    const marker = `AUTH_RLS_TEST_${Date.now()}`;
    const ezraContact = await insertTenantContact(ezra.access_token, `${marker}_EZRA`);
    expect(ezraContact.company_id).toBe(ezraProfile.company_id);
    expect(await readContactById(mary.access_token, ezraContact.id)).toEqual([]);
    const maryContact = await insertTenantContact(mary.access_token, `${marker}_MARY`);
    expect(maryContact.company_id).toBe(maryProfile.company_id);
    expect(await readContactById(ezra.access_token, maryContact.id)).toEqual([]);
  }, 45_000);
});

afterAll(async () => {
  await Promise.all(createdContactIds.map(async ({ token, id }) => {
    await fetch(`${baseUrl}/rest/v1/crm_contacts?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: { apikey: anonKey, authorization: `Bearer ${token}` },
    });
  }));
});
