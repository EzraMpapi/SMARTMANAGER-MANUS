import { ENV } from "./_core/env";
import { assertPayloadContract } from "./schemaDriftChecker";

export const CRITICAL_SUPABASE_TABLES = [
  "finance_expenses",
  "sales_invoices",
  "inventory_items",
  "crm_leads",
] as const;

export type CriticalSupabaseTable = (typeof CRITICAL_SUPABASE_TABLES)[number];

interface SupabasePersistenceOptions {
  url?: string;
  secretKey?: string;
  fetchImpl?: typeof fetch;
}

export async function persistSupabaseRow(
  tableName: CriticalSupabaseTable,
  payload: Record<string, unknown>,
  options: SupabasePersistenceOptions = {},
) {
  // This assertion deliberately runs before reading credentials or invoking fetch.
  // A drifted payload must never reach Supabase.
  assertPayloadContract(tableName, payload);

  const url = (options.url ?? ENV.supabaseUrl).replace(/\/$/, "");
  const secretKey = options.secretKey ?? ENV.supabaseSecretKey;
  if (!url || !secretKey) {
    throw new Error("Supabase server persistence is not configured.");
  }

  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(`${url}/rest/v1/${tableName}`, {
    method: "POST",
    headers: {
      accept: "application/json",
      apikey: secretKey,
      authorization: `Bearer ${secretKey}`,
      "content-type": "application/json",
      Prefer: "return=representation",
    },
    body: JSON.stringify(payload),
  });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Supabase ${tableName} insert failed (${response.status}): ${body?.message || body?.hint || "unknown error"}`);
  }
  return body;
}
