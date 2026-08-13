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

function userHeaders(accessToken, write = false) {
  return {
    apikey: anonKey,
    authorization: `Bearer ${accessToken}`,
    ...(write ? { Prefer: "return=representation" } : {}),
  };
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

async function signInAgain(email) {
  const session = await request("/auth/v1/token?grant_type=password", {
    method: "POST",
    headers: { apikey: anonKey },
    body: { email, password },
  });
  return session.access_token;
}

async function readIdentity(accessToken) {
  return request("/auth/v1/user", { headers: userHeaders(accessToken) });
}

async function readCurrentCompany(accessToken) {
  return request("/rest/v1/rpc/current_company_id", {
    method: "POST",
    headers: userHeaders(accessToken),
    body: {},
  });
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

function firstRow(payload) {
  return Array.isArray(payload) ? payload[0] : payload;
}

async function exerciseCrud({ table, create, update }, accessToken, expectedCompanyId) {
  const inserted = firstRow(await request(`/rest/v1/${table}`, {
    method: "POST",
    headers: userHeaders(accessToken, true),
    body: create,
  }));
  if (!inserted?.id || inserted.company_id !== expectedCompanyId) {
    throw new Error(`${table} CREATE did not receive the authenticated database-derived company_id.`);
  }

  const read = await request(`/rest/v1/${table}?select=*&id=eq.${inserted.id}`, {
    headers: userHeaders(accessToken),
  });
  if (read.length !== 1 || read[0].company_id !== expectedCompanyId) {
    throw new Error(`${table} READ did not return the authenticated tenant row.`);
  }

  const patched = firstRow(await request(`/rest/v1/${table}?id=eq.${inserted.id}`, {
    method: "PATCH",
    headers: userHeaders(accessToken, true),
    body: update,
  }));
  if (!patched?.id) throw new Error(`${table} UPDATE did not return the authenticated tenant row.`);

  const deleted = firstRow(await request(`/rest/v1/${table}?id=eq.${inserted.id}`, {
    method: "DELETE",
    headers: userHeaders(accessToken, true),
  }));
  if (deleted?.id !== inserted.id) throw new Error(`${table} DELETE did not return the authenticated tenant row.`);

  const afterDelete = await request(`/rest/v1/${table}?select=id&id=eq.${inserted.id}`, {
    headers: userHeaders(accessToken),
  });
  if (afterDelete.length !== 0) throw new Error(`${table} DELETE did not remove the tenant row.`);
  return { table, id: inserted.id };
}

const tenantAUser = await createConfirmedTestUser("a");
const tenantBUser = await createConfirmedTestUser("b");

const bareProfile = await request(`/rest/v1/profiles?select=id,company_id&id=eq.${tenantAUser.id}`, {
  headers: userHeaders(tenantAUser.accessToken),
});
if (bareProfile.length !== 1 || bareProfile[0].company_id !== null) {
  throw new Error("A newly authenticated QA user was expected to have a bare profile before authorized company onboarding.");
}

const tenantAIdentity = await readIdentity(tenantAUser.accessToken);
if (tenantAIdentity.id !== tenantAUser.id) throw new Error("Authenticated /auth/v1/user identity did not match Tenant A's user UUID.");

const tenantA = await createTenant(tenantAUser, "A");
const tenantB = await createTenant(tenantBUser, "B");
const tenantACompanyContext = await readCurrentCompany(tenantAUser.accessToken);
const tenantBCompanyContext = await readCurrentCompany(tenantBUser.accessToken);
if (tenantACompanyContext !== tenantA.id || tenantBCompanyContext !== tenantB.id) {
  throw new Error("current_company_id() did not resolve each real authenticated user to its own company UUID.");
}

const moduleChecks = [
  { table: "pos_shifts", create: { name: "QA POS shift", status: "open", amount: 0, data: { operator: "QA", run_id: runId } }, update: { status: "closed" } },
  { table: "inventory_items", create: { name: "QA inventory item", status: "active", amount: 1250, data: { sku: `QA-${runId}`, qty_on_hand: 7 } }, update: { status: "verified" } },
  { table: "crm_contacts", create: { name: "QA CRM contact", status: "lead", data: { run_id: runId, email: `qa-${runId}@example.invalid` } }, update: { status: "qualified" } },
  { table: "finance_expenses", create: { amount: "1250", category: "Verification", vendor: "QA Supplier", method: "cash", status: "draft" }, update: { status: "approved" } },
  { table: "sales_invoices", create: { name: "QA sales invoice", status: "draft", amount: 1250, data: { invoice_no: `QA-${runId}` } }, update: { status: "approved" } },
  { table: "hr_employees", create: { name: "QA employee", status: "active", data: { employee_no: `QA-${runId}` } }, update: { status: "verified" } },
];

const moduleCrud = [];
for (const check of moduleChecks) {
  moduleCrud.push(await exerciseCrud(check, tenantAUser.accessToken, tenantA.id));
}

const persistenceRow = firstRow(await request("/rest/v1/pos_shifts", {
  method: "POST",
  headers: userHeaders(tenantAUser.accessToken, true),
  body: { name: "QA reload-persistence shift", status: "open", amount: 0, data: { run_id: runId } },
}));
const refreshedAAccessToken = await signInAgain(tenantAUser.email);
const refreshedCompanyContext = await readCurrentCompany(refreshedAAccessToken);
const reloadedShift = await request(`/rest/v1/pos_shifts?select=*&id=eq.${persistenceRow.id}`, {
  headers: userHeaders(refreshedAAccessToken),
});
if (refreshedCompanyContext !== tenantA.id || reloadedShift.length !== 1 || reloadedShift[0].company_id !== tenantA.id) {
  throw new Error("pos_shifts data or company context did not persist across a fresh authenticated login.");
}

const tenantBRead = await request(`/rest/v1/pos_shifts?select=*&id=eq.${persistenceRow.id}`, {
  headers: userHeaders(tenantBUser.accessToken),
});
if (tenantBRead.length !== 0) throw new Error("Tenant B could read Tenant A pos_shifts data.");

const tenantBUpdate = await request(`/rest/v1/pos_shifts?id=eq.${persistenceRow.id}`, {
  method: "PATCH",
  headers: userHeaders(tenantBUser.accessToken, true),
  body: { status: "cross-tenant-overwrite" },
});
if (Array.isArray(tenantBUpdate) && tenantBUpdate.length !== 0) throw new Error("Tenant B received a cross-tenant pos_shifts update response.");

const serviceVerifiedShift = await request(`/rest/v1/pos_shifts?select=*&id=eq.${persistenceRow.id}`, {
  headers: { apikey: secretKey, authorization: `Bearer ${secretKey}` },
});
if (serviceVerifiedShift[0]?.status !== "open") throw new Error("Cross-tenant mutation modified Tenant A pos_shifts data.");

await request(`/rest/v1/pos_shifts?id=eq.${persistenceRow.id}`, {
  method: "DELETE",
  headers: userHeaders(refreshedAAccessToken, true),
});

const auditWrite = await request("/rest/v1/audit_log", {
  method: "POST",
  headers: userHeaders(refreshedAAccessToken, true),
  body: { action: "QA RLS context verification", module: "Platform", actor: "BusinessSphere QA A", details: "Controlled tenant-isolation verification" },
});
const auditRow = firstRow(auditWrite);
if (!auditRow?.id || auditRow.company_id !== tenantA.id) throw new Error("Audit-log write did not receive a database-derived company_id.");
await request(`/rest/v1/audit_log?id=eq.${auditRow.id}`, {
  method: "DELETE",
  headers: userHeaders(refreshedAAccessToken, true),
});

console.log(JSON.stringify({
  ok: true,
  verification: {
    authenticatedUserMatchesJwtSubject: true,
    bareProfileRequiresCompanySetup: true,
    tenantARpcOnboarding: Boolean(tenantA.id),
    tenantBRpcOnboarding: Boolean(tenantB.id),
    currentCompanyMatchesAuthenticatedTenant: true,
    posShiftsCrud: true,
    moduleCrud: moduleCrud.map(({ table }) => table),
    authenticatedReload: true,
    crossTenantReadDenied: true,
    crossTenantMutationDenied: true,
    auditPersistence: true,
  },
}, null, 2));
