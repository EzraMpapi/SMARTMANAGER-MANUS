# Attachment 5 Forensic Audit — Phase 3 Live Supabase Review

## Target and method

The enabled Supabase connector resolved project `rlhngsrihahhyxnjxrxm` (`EzraMpapi's Project`), PostgreSQL 17.6.1, region `ap-southeast-1`, status `ACTIVE_HEALTHY`. The audit used read-only metadata and advisor inspection. No migration, DML, privilege change, policy change, function rewrite, storage mutation, or authentication change was executed.

## Live schema inventory

The public schema currently reports **533 tables**. All 533 are reported with RLS enabled; none are reported with RLS disabled. Seventy-nine tables have non-zero reported row counts in the metadata response, while the remainder are empty or do not expose a positive row count through the inventory response. The inventory includes the repository’s major domains, including companies, branches, CRM, finance, inventory, POS, workforce/HR, banking/MFI, property management, healthcare, hospitality, restaurant, fleet, community, billing, documents, and collaboration entities.

The verbose table response includes column metadata, primary keys, and foreign-key relationships. The repository’s migration directory contains corresponding additive schema, RLS, helper-function, trigger, and index migrations. A schema object must not be added solely because it appears in a broad requirement list; it must first be proven absent and required by a live code path.

## Security advisor findings

The live security advisor returned **139 findings**: **6 INFO** notices for RLS-enabled tables with no policies and **133 WARN** findings. The named categories were six `rls_enabled_no_policy` notices, six anonymous SECURITY DEFINER execute findings, 126 authenticated SECURITY DEFINER execute findings, and one disabled leaked-password-protection setting.

The six policyless RLS tables are backend/webhook control tables and platform-administration action state identified by the advisor. Existing repository evidence treats these as deny-by-default candidates requiring exact grants and server/procedure guards, not generic authenticated policies. The SECURITY DEFINER findings require signature-specific review; broad revocation or conversion would risk breaking legitimate workflows and was not performed. Leaked-password protection is an Auth dashboard configuration concern rather than a safe SQL migration and remains an owner-controlled follow-up.

## Performance advisor findings

The live performance advisor returned **1,045 findings**: **885 INFO** and **160 WARN**. Categories include 514 unindexed foreign keys, 371 unused indexes, 150 multiple-permissive-policy notices, and 10 auth RLS init-plan notices. These are advisory findings, not automatic permission to add or drop indexes. Existing repository records document staged index review and remediation waves; any further index change must be justified by query workload and tested for migration safety.

## Decision

The live schema is substantially populated and RLS is broadly enabled. No missing table, column, relationship, function, trigger, storage object, or policy has yet been proven by this read-only pass. Therefore no schema completion migration is justified at this phase. The next work is to compare the generated feature-to-schema map against the live metadata, identify concrete mismatches, and repair verified application defects before considering additive DDL.

## Safety boundary

The requested attachment calls for live CRUD and cross-tenant tests. Those tests require a disposable test tenant plus at least two authenticated sessions. No such controlled identities were supplied. Service-role metadata access cannot substitute for authenticated RLS testing because it bypasses the policy boundary. Production business rows remain unchanged.
