-- Allow direct authenticated reads and creates for property-management tables.
-- RLS remains enabled and continues to decide which rows each session may access.
-- This migration intentionally does not grant UPDATE, DELETE, TRUNCATE, REFERENCES,
-- TRIGGER, ownership, BYPASSRLS, or any service-role capability.

BEGIN;

DO $$
DECLARE
  property_table record;
BEGIN
  FOR property_table IN
    SELECT c.relname
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE n.nspname = 'public'
      AND c.relkind = 'r'
      AND c.relname LIKE 'property\_%' ESCAPE '\'
    ORDER BY c.relname
  LOOP
    EXECUTE format(
      'GRANT SELECT, INSERT ON TABLE public.%I TO authenticated',
      property_table.relname
    );
  END LOOP;
END;
$$;

COMMIT;
