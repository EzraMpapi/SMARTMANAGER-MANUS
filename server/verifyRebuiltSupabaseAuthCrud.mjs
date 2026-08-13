const required = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY", "SUPABASE_SECRET_KEY"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required for controlled rebuild verification.`);
}

const url = process.env.VITE_SUPABASE_URL.replace(/\/$/, "");
const anonKey = process.env.VITE_SUPABASE_ANON_KEY;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const runId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
const password = `BsVerify!${runId}Aa9`;

async function request(endpoint, { method = "GET", headers = {}, body } = {}) {
  const response = await fetch(`${url}${endpoint}`, {
    method,
    headers: { ...headers, ...(body === undefined ? {} : { "content-type": "application/json" }) },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`${method} ${endpoint} failed (${response.status}): ${payload?.message || payload?.error_description || payload?.hint || payload?.details || "unknown error"}`);
  }
  return payload;
}

async function createConfirmedTestUser(label) {
  const email = `businesssphere-qa-${label}-${runId}@example.invalid`;
  const user = await request("/auth/v1/admin/users", {
    method: "POST",
    headers: { apikey: secretKey, authorization: `Bearer ${secretKey}` },
    body: {
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: `BusinessSphere QA ${label}` },
    },
  });
  const session = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey },
    body: { email, password },
  });
  return { id: user.id, email, accessToken: session.access_token };
}

function userHeaders(accessToken, write = false) {
  return {
    apikey: anonKey,
    authorization: `Bearer ${accessToken}`,
    ...(write ? { Prefer: "return=representation" } : {}),
  };
}

async function createTenant(user, label) {
  const result = await request("/rest/v1/rpc/create_company_and_owner", {
    method: "POST",
    headers: userHeaders(user.accessToken, true),
    body: {
      p_name: `BusinessSphere QA Tenant ${label}`,
      p_industry: "Verification",
      p_country: "Tanzania",
      p_currency: "TZS",
      p_full_name: `BusinessSphere QA ${label}`,
    },
  });
  if (!result?.id || !result?.join_code) throw new Error(`Tenant ${label} onboarding response did not include id and join_code.`);
  return result;
}

async function signInAgain(email) {
  const session = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey },
    body: { email, password },
  });
  return session.access_token;
}

const tenantAUser = await createConfirmedTestUser("a");
const tenantBUser = await createConfirmedTestUser("b");
const tenantA = await createTenant(tenantAUser, "A");
const tenantB = await createTenant(tenantBUser, "B");

const insertedInventory = await request("/rest/v1/inventory_items", {
  method: "POST",
  headers: userHeaders(tenantAUser.accessToken, true),
  body: {
    name: "QA verification inventory record",
    data: { sku: `QA-${runId}`, qty_on_hand: 7, unit_cost: 1250, category: "Verification" },
  },
});

const inventoryRow = Array.isArray(insertedInventory) ? insertedInventory[0] : insertedInventory;
if (!inventoryRow?.id || inventoryRow.company_id !== tenantA.id) {
  throw new Error("Tenant A inventory write did not receive a database-derived company_id.");
}

await request(`/rest/v1/inventory_items?id=eq.${inventoryRow.id}`, {
  method: "PATCH",
  headers: userHeaders(tenantAUser.accessToken, true),
  body: { data: { warehouse: "QA Reload Check" } },
});

const refreshedAAccessToken = await signInAgain(tenantAUser.email);
const reloadedInventory = await request(`/rest/v1/inventory_items?select=*&id=eq.${inventoryRow.id}`, {
  headers: userHeaders(refreshedAAccessToken),
});
if (reloadedInventory.length !== 1 || reloadedInventory[0]?.data?.warehouse !== "QA Reload Check") {
  throw new Error("Tenant A inventory record did not persist across a fresh authenticated session.");
}

const tenantBRead = await request(`/rest/v1/inventory_items?select=*&id=eq.${inventoryRow.id}`, {
  headers: userHeaders(tenantBUser.accessToken),
});
if (tenantBRead.length !== 0) throw new Error("Tenant B could read Tenant A inventory data.");

const tenantBUpdate = await request(`/rest/v1/inventory_items?id=eq.${inventoryRow.id}`, {
  method: "PATCH",
  headers: userHeaders(tenantBUser.accessToken, true),
  body: { data: { warehouse: "Cross-tenant overwrite" } },
});
if (Array.isArray(tenantBUpdate) && tenantBUpdate.length !== 0) {
  throw new Error("Tenant B received a cross-tenant inventory update response.");
}

const serviceVerifiedRow = await request(`/rest/v1/inventory_items?select=*&id=eq.${inventoryRow.id}`, {
  headers: { apikey: secretKey, authorization: `Bearer ${secretKey}` },
});
if (serviceVerifiedRow[0]?.data?.warehouse !== "QA Reload Check") {
  throw new Error("Cross-tenant mutation modified Tenant A inventory data.");
}

const auditWrite = await request("/rest/v1/audit_log", {
  method: "POST",
  headers: userHeaders(refreshedAAccessToken, true),
  body: { action: "QA reconstruction verification", module: "Platform", actor: "BusinessSphere QA A", details: "Controlled tenant-isolation verification" },
});
const auditRow = Array.isArray(auditWrite) ? auditWrite[0] : auditWrite;
if (!auditRow?.id || auditRow.company_id !== tenantA.id) {
  throw new Error("Audit-log write did not receive a database-derived company_id.");
}

const auditReload = await request(`/rest/v1/audit_log?select=*&id=eq.${auditRow.id}`, {
  headers: userHeaders(refreshedAAccessToken),
});
if (auditReload.length !== 1) throw new Error("Audit-log row was not readable after authenticated reload.");

console.log(JSON.stringify({
  ok: true,
  verification: {
    authenticatedSignIn: true,
    tenantARpcOnboarding: Boolean(tenantA.id),
    tenantBRpcOnboarding: Boolean(tenantB.id),
    tenantScopedCrud: true,
    authenticatedReload: true,
    crossTenantReadDenied: true,
    crossTenantMutationDenied: true,
    auditPersistence: true,
  },
}, null, 2));
