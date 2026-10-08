import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  new URL("../supabase/migrations/20260825_020_healthcare_lab_categories_schema.sql", import.meta.url),
  "utf8",
);

describe("Healthcare Laboratory category migration", () => {
  it("creates both tenant-scoped category tables with stable constraints and indexes", () => {
    expect(migration).toContain("CREATE TABLE public.hc_lab_categories (");
    expect(migration).toContain("CREATE TABLE public.hc_lab_category_events (");
    expect(migration).toContain("UNIQUE (company_id, id)");
    expect(migration).toContain("REFERENCES public.companies(id) ON DELETE CASCADE");
    expect(migration).toContain("FOREIGN KEY (company_id, category_id)");
    expect(migration).toContain("hc_lab_categories_company_code_key");
    expect(migration).toContain("hc_lab_category_events_category_time");
    expect(migration).toContain("hc_lab_category_events_company_idempotency");
  });

  it("enforces category input and lifecycle invariants", () => {
    expect(migration).toContain("code = upper(btrim(code))");
    expect(migration).toContain("default_turnaround_hours BETWEEN 1 AND 720");
    expect(migration).toContain("base_price >= 0");
    expect(migration).toContain("status IN ('DRAFT', 'ACTIVE', 'SUSPENDED', 'ARCHIVED')");
    expect(migration).toContain("jsonb_typeof(specimen_requirements) = 'array'");
    expect(migration).toContain("status = 'ARCHIVED' AND archived_at IS NOT NULL");
  });

  it("enables tenant RLS and grants only authenticated reads", () => {
    expect(migration).toContain("ALTER TABLE public.hc_lab_categories ENABLE ROW LEVEL SECURITY;");
    expect(migration).toContain("ALTER TABLE public.hc_lab_category_events ENABLE ROW LEVEL SECURITY;");
    expect(migration).toContain("company_id = public.current_company_id()");
    expect(migration).toContain("public.workforce_has_permission('healthcare.lab_categories.read')");
    expect(migration).toContain("REVOKE ALL ON TABLE public.hc_lab_categories FROM PUBLIC, anon, authenticated;");
    expect(migration).toContain("GRANT SELECT ON TABLE public.hc_lab_categories TO authenticated;");
    expect(migration).toContain("REVOKE ALL ON TABLE public.hc_lab_category_events FROM PUBLIC, anon, authenticated;");
    expect(migration).toContain("GRANT SELECT ON TABLE public.hc_lab_category_events TO authenticated;");
  });

  it("protects lifecycle evidence and trigger helpers from direct client execution", () => {
    expect(migration).toContain("CREATE TRIGGER hc_lab_category_events_immutable_trigger");
    expect(migration).toContain("BEFORE UPDATE OR DELETE ON public.hc_lab_category_events");
    expect(migration).toContain("Healthcare laboratory category events are immutable.");
    expect(migration).toContain("SET search_path = pg_catalog, public, auth");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.hc_lab_categories_set_updated_at() FROM PUBLIC, anon, authenticated;");
    expect(migration).toContain("REVOKE ALL ON FUNCTION public.hc_lab_category_events_immutable() FROM PUBLIC, anon, authenticated;");
    expect(migration).not.toContain("GRANT INSERT ON TABLE public.hc_lab_categories");
    expect(migration).not.toContain("GRANT UPDATE ON TABLE public.hc_lab_categories");
    expect(migration).not.toContain("GRANT DELETE ON TABLE public.hc_lab_categories");
  });
});
