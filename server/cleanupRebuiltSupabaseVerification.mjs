const required = ["VITE_SUPABASE_URL", "SUPABASE_SECRET_KEY"];
for (const key of required) {
  if (!process.env[key]) throw new Error(`${key} is required for QA cleanup.`);
}

const url = process.env.VITE_SUPABASE_URL.replace(/\/$/, "");
const secretKey = process.env.SUPABASE_SECRET_KEY;
const serviceHeaders = { apikey: secretKey, authorization: `Bearer ${secretKey}` };

async function request(endpoint, { method = "GET" } = {}) {
  const response = await fetch(`${url}${endpoint}`, { method, headers: serviceHeaders });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(`${method} ${endpoint} failed (${response.status}): ${payload?.message || payload?.hint || "unknown error"}`);
  return payload;
}

const profiles = await request("/rest/v1/profiles?select=id,company_id,email&email=like.businesssphere-qa-%25%40example.invalid");
const userIds = profiles.map((profile) => profile.id).filter(Boolean);
const companyIds = [...new Set(profiles.map((profile) => profile.company_id).filter(Boolean))];

if (userIds.length) {
  const list = userIds.join(",");
  await request(`/rest/v1/profiles?id=in.(${list})`, { method: "DELETE" });
  for (const userId of userIds) {
    await request(`/auth/v1/admin/users/${userId}`, { method: "DELETE" });
  }
}

if (companyIds.length) {
  await request(`/rest/v1/companies?id=in.(${companyIds.join(",")})`, { method: "DELETE" });
}

const remainingProfiles = await request("/rest/v1/profiles?select=id&email=like.businesssphere-qa-%25%40example.invalid");
const remainingCompanies = await request("/rest/v1/companies?select=id&name=like.BusinessSphere%20QA%20Tenant%25");
if (remainingProfiles.length || remainingCompanies.length) {
  throw new Error("Controlled verification cleanup did not complete.");
}

console.log(JSON.stringify({ ok: true, removedTestUsers: userIds.length, removedTestCompanies: companyIds.length }, null, 2));
