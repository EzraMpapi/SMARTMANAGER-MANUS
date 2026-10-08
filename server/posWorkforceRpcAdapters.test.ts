import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const adapter = readFileSync(resolve(process.cwd(), "server/posWorkforceRpcAdapters.ts"), "utf8");
const router = readFileSync(resolve(process.cwd(), "server/routers.ts"), "utf8");
const seed = readFileSync(resolve(process.cwd(), "supabase/migrations/20260824_060_workforce_permission_seed.sql"), "utf8");

describe("POS and workforce application RPC activation", () => {
  it("uses verified profile identity and bearer-token Supabase RPC calls", () => {
    expect(adapter).toContain("resolveVerifiedProfile(req)");
    expect(adapter).toContain("getBearerToken(req)");
    expect(adapter).toContain("/rest/v1/rpc/${functionName}");
    expect(adapter).toContain("authorization: `Bearer ${token}`");
    expect(adapter).not.toContain("companyId: z.string().uuid()");
  });

  it("exposes protected POS procedures for shift, cash, sync, and sale operations", () => {
    for (const route of ["openShift", "recordCashMovement", "acceptSyncSequence", "completeSale"]) {
      expect(router).toContain(`${route}: protectedProcedure`);
    }
    for (const routine of ["pos_open_shift", "pos_record_cash_movement", "pos_accept_sync_device_sequence", "complete_pos_sale"]) {
      expect(adapter).toContain(`\"${routine}\"`);
    }
  });

  it("uses money-safe strings and validates supported POS payment methods", () => {
    expect(adapter).toContain("const money = z.string()");
    expect(adapter).toContain("at most two decimal places");
    expect(adapter).toContain("const quantity = z.string()");
    for (const method of ["Cash", "Card", "Mobile Money", "Bank Transfer", "Customer Credit"]) {
      expect(adapter).toContain(`\"${method}\"`);
    }
    expect(adapter).toContain("p_opening_float: input.openingFloat");
    expect(adapter).toContain("p_total: input.total");
  });

  it("exposes protected workforce assignment and decision procedures", () => {
    expect(router).toContain("requestRoleAssignment: protectedProcedure");
    expect(router).toContain("decideRoleAssignment: protectedProcedure");
    expect(adapter).toContain("workforce_request_role_assignment");
    expect(adapter).toContain("workforce_decide_role_assignment");
    expect(adapter).toContain("p_expected_version: input.expectedVersion");
  });

  it("maps provider errors to safe tRPC classes without leaking database details", () => {
    expect(adapter).toContain("UNAUTHORIZED");
    expect(adapter).toContain("FORBIDDEN");
    expect(adapter).toContain("CONFLICT");
    expect(adapter).toContain("BAD_REQUEST");
    expect(adapter).toContain("The workspace operation could not be completed.");
    expect(adapter).not.toContain("throw new TRPCError({ code: \"INTERNAL_SERVER_ERROR\", message: String(body)");
  });

  it("seeds permissions and system roles idempotently without assigning users", () => {
    expect(seed).toContain("ON CONFLICT (company_id, code) DO UPDATE");
    expect(seed).toContain("ON CONFLICT (company_id, role_id, permission_id, effect, effective_from) DO UPDATE");
    expect(seed).toContain("ON CONFLICT (company_id, conflict_code) DO UPDATE");
    expect(seed).toContain("workforce.role.assign");
    expect(seed).toContain("workforce.role.approve");
    expect(seed).toContain("pos.register.operate");
    expect(seed).toContain("pos.sale.create");
    expect(seed).toContain("finance.cash.approve");
    expect(seed).not.toContain("workforce_member_roles");
  });

  it("seeds SoD conflicts and uses a transaction-local internal-write marker", () => {
    expect(seed).toContain("SELECT set_config('app.internal_write', 'on', true)");
    expect(seed).toContain("workforce.role.assign.approve");
    expect(seed).toContain("pos.sale.create.approve");
    expect(seed).toContain("pos.cash.record.approve");
    expect(seed).toContain("'Critical', 'Block'");
    expect(seed).toContain("'High', 'Block'");
  });

  it("does not replace the current legacy team invitation or role routes", () => {
    expect(router).toContain("teamInvitations: router({");
    expect(router).toContain("listTeamInvitations");
    expect(router).toContain("requestRoleChangeApproval");
    expect(router).toContain("teamWorkforce: router({");
  });
});
