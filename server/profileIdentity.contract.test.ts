import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

const migration = readFileSync(new URL("../supabase/migrations/20260823_045_profile_identity_center.sql", import.meta.url), "utf8");
const service = readFileSync(new URL("./profileIdentity.ts", import.meta.url), "utf8");
const component = readFileSync(new URL("../client/src/components/ProfileIdentityCenter.jsx", import.meta.url), "utf8");
const dashboard = readFileSync(new URL("../client/src/BusinessSphereDashboardCore.jsx", import.meta.url), "utf8");

describe("profile identity center source contract", () => {
  it("adds profile-owned fields without assuming uncertain branch/department foreign-key definitions", () => {
    expect(migration).toContain("ALTER TABLE public.profiles");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS avatar_url text");
    expect(migration).toContain("ADD COLUMN IF NOT EXISTS avatar_storage_key text");
    expect(migration).not.toContain("REFERENCES public.branches");
    expect(migration).not.toContain("REFERENCES public.departments");
  });

  it("keeps role, company, email and avatar storage references outside the personal update allowlist", () => {
    expect(migration).toContain("IF v_key NOT IN (");
    expect(migration).toContain("'notificationPreferences'");
    expect(migration).toContain("profile field is not self-service editable");
    expect(migration).not.toMatch(/'role'\s*,\s*'companyId'/);
    expect(migration).toContain("CREATE OR REPLACE FUNCTION public.set_current_profile_avatar");
    expect(migration).toContain("GRANT EXECUTE ON FUNCTION public.set_current_profile_avatar(text, text) TO authenticated");
  });

  it("keeps avatar uploads server-side and scoped by verified profile/company", () => {
    expect(service).toContain("resolveVerifiedProfile(req)");
    expect(service).toContain("storagePut(`profile-avatars/${verified.company_id}/${verified.id}/");
    expect(service).toContain("set_current_profile_avatar");
    expect(service).toContain("MAX_AVATAR_BYTES = 2 * 1024 * 1024");
    expect(service).toContain("The selected file does not match its declared image type.");
  });

  it("integrates the premium menu and dedicated profile destination without removing existing navigation primitives", () => {
    expect(component).toContain("Account identity center");
    expect(component).toContain("View My Profile");
    expect(service).toContain("workspaceSwitchingAvailable: false");
    expect(component).toContain("Start password recovery");
    expect(dashboard).toContain("<PremiumProfileMenu");
    expect(dashboard).toContain("<ProfileIdentityPage");
    expect(dashboard).toContain("NotificationCenter");
    expect(dashboard).toContain("Mobile bottom navigation");
  });
});
