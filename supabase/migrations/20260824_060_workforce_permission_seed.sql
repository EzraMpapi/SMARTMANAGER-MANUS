-- Idempotent permission catalog seed for the new workforce evaluator.
-- This migration creates role/permission definitions only; it never assigns a
-- role to a user and does not change legacy profile.role or company_modules data.
BEGIN;

-- Seed data is installed by the migration owner, not by an end-user session.
-- This transaction-local marker permits the existing tenant validation trigger
-- to validate the explicit company_id values without trusting auth.uid().
SELECT set_config('app.internal_write', 'on', true);

WITH workspace_actors AS (
  SELECT c.id AS company_id, p.id AS actor_id
  FROM public.companies c
  JOIN LATERAL (
    SELECT p0.id
    FROM public.profiles p0
    WHERE p0.company_id = c.id
      AND coalesce(p0.is_active, true)
    ORDER BY p0.created_at NULLS LAST, p0.id
    LIMIT 1
  ) p ON true
), permission_seed(code, module_id, resource, permission_action, description, is_sensitive) AS (
  VALUES
    ('workforce.role.assign', 'team_workforce', 'roles', 'manage', 'Request a workforce role assignment.', true),
    ('workforce.role.approve', 'team_workforce', 'roles', 'approve', 'Approve or reject a workforce role assignment.', true),
    ('workforce.access.manage', 'team_workforce', 'access_control', 'manage', 'Manage workforce module and data access configuration.', true),
    ('workforce.access.approve', 'team_workforce', 'access_control', 'approve', 'Approve workforce access-control changes.', true),
    ('workforce.member.view', 'team_workforce', 'members', 'view', 'View the workforce member directory.', false),
    ('workforce.member.edit', 'team_workforce', 'members', 'edit', 'Edit workforce member administration records.', true),
    ('workforce.audit.view', 'team_workforce', 'audit', 'view', 'View workforce authorization and audit evidence.', true),
    ('pos.register.view', 'pos', 'registers', 'view', 'View POS registers, terminals, and shifts.', false),
    ('pos.register.operate', 'pos', 'registers', 'manage', 'Open and operate POS register shifts.', true),
    ('pos.sale.view', 'pos', 'sales', 'view', 'View normalized POS sales and receipts.', false),
    ('pos.sale.create', 'pos', 'sales', 'create', 'Create a validated POS sale.', true),
    ('pos.sale.approve', 'pos', 'sales', 'approve', 'Approve POS sale adjustments, refunds, or exceptions.', true),
    ('pos.cash.record', 'pos', 'cash', 'create', 'Record POS cash movements pending approval.', true),
    ('pos.cash.approve', 'pos', 'cash', 'approve', 'Approve and post POS cash movements.', true),
    ('pos.pricing.manage', 'pos', 'pricing', 'manage', 'Manage approved POS tax, discount, promotion, and loyalty configuration.', true),
    ('pos.reconciliation.view', 'pos', 'reconciliation', 'view', 'View POS reconciliation status and exceptions.', false),
    ('pos.reconciliation.manage', 'pos', 'reconciliation', 'manage', 'Resolve POS reconciliation exceptions.', true),
    ('finance.journal.view', 'finance', 'journal', 'view', 'View shared journal batches and lines.', true),
    ('finance.reconciliation.manage', 'finance', 'reconciliation', 'manage', 'Manage shared financial reconciliation.', true),
    ('finance.cash.approve', 'finance', 'cash', 'approve', 'Approve cash movement posting within configured limits.', true)
)
INSERT INTO public.workforce_permissions (
  company_id, code, module_id, resource, permission_action, description,
  is_sensitive, status, created_by, metadata
)
SELECT w.company_id, s.code, s.module_id, s.resource, s.permission_action,
       s.description, s.is_sensitive, 'Active', w.actor_id,
       jsonb_build_object('seededBy', '20260824_060_workforce_permission_seed', 'seedVersion', 1)
FROM workspace_actors w
CROSS JOIN permission_seed s
ON CONFLICT (company_id, code) DO UPDATE
SET module_id = EXCLUDED.module_id,
    resource = EXCLUDED.resource,
    permission_action = EXCLUDED.permission_action,
    description = EXCLUDED.description,
    is_sensitive = EXCLUDED.is_sensitive,
    status = 'Active',
    updated_at = now(),
    metadata = coalesce(public.workforce_permissions.metadata, '{}'::jsonb)
      || jsonb_build_object('seededBy', '20260824_060_workforce_permission_seed', 'seedVersion', 1);

WITH workspace_actors AS (
  SELECT c.id AS company_id, p.id AS actor_id
  FROM public.companies c
  JOIN LATERAL (
    SELECT p0.id
    FROM public.profiles p0
    WHERE p0.company_id = c.id
      AND coalesce(p0.is_active, true)
    ORDER BY p0.created_at NULLS LAST, p0.id
    LIMIT 1
  ) p ON true
), role_seed(code, name, description, hierarchy_level) AS (
  VALUES
    ('super_administrator', 'Super Administrator', 'Full workspace administration and approval authority.', 1000),
    ('organization_owner', 'Organization Owner', 'Workspace owner with full business approval authority.', 900),
    ('hr_manager', 'HR Manager', 'Workforce administration without self-approval authority.', 700),
    ('pos_manager', 'POS Manager', 'POS register, sale, cash, pricing, and reconciliation operations.', 600),
    ('cashier', 'Cashier', 'POS register and sale operations within assigned scope.', 300),
    ('finance_manager', 'Finance Manager', 'Journal, reconciliation, and financial approval operations.', 700)
)
INSERT INTO public.workforce_roles (
  company_id, code, name, role_kind, description, hierarchy_level,
  is_assignable, status, created_by, metadata
)
SELECT w.company_id, r.code, r.name, 'System', r.description, r.hierarchy_level,
       true, 'Active', w.actor_id,
       jsonb_build_object('seededBy', '20260824_060_workforce_permission_seed', 'seedVersion', 1)
FROM workspace_actors w
CROSS JOIN role_seed r
ON CONFLICT (company_id, code) DO UPDATE
SET name = EXCLUDED.name,
    role_kind = 'System',
    description = EXCLUDED.description,
    hierarchy_level = EXCLUDED.hierarchy_level,
    is_assignable = true,
    status = 'Active',
    updated_at = now(),
    metadata = coalesce(public.workforce_roles.metadata, '{}'::jsonb)
      || jsonb_build_object('seededBy', '20260824_060_workforce_permission_seed', 'seedVersion', 1);

WITH role_permission_seed(role_code, permission_code) AS (
  VALUES
    ('super_administrator', 'workforce.role.assign'),
    ('super_administrator', 'workforce.role.approve'),
    ('super_administrator', 'workforce.access.manage'),
    ('super_administrator', 'workforce.access.approve'),
    ('super_administrator', 'workforce.member.view'),
    ('super_administrator', 'workforce.member.edit'),
    ('super_administrator', 'workforce.audit.view'),
    ('super_administrator', 'pos.register.view'),
    ('super_administrator', 'pos.register.operate'),
    ('super_administrator', 'pos.sale.view'),
    ('super_administrator', 'pos.sale.create'),
    ('super_administrator', 'pos.sale.approve'),
    ('super_administrator', 'pos.cash.record'),
    ('super_administrator', 'pos.cash.approve'),
    ('super_administrator', 'pos.pricing.manage'),
    ('super_administrator', 'pos.reconciliation.view'),
    ('super_administrator', 'pos.reconciliation.manage'),
    ('super_administrator', 'finance.journal.view'),
    ('super_administrator', 'finance.reconciliation.manage'),
    ('super_administrator', 'finance.cash.approve'),
    ('organization_owner', 'workforce.role.assign'),
    ('organization_owner', 'workforce.role.approve'),
    ('organization_owner', 'workforce.access.manage'),
    ('organization_owner', 'workforce.access.approve'),
    ('organization_owner', 'workforce.member.view'),
    ('organization_owner', 'workforce.member.edit'),
    ('organization_owner', 'workforce.audit.view'),
    ('organization_owner', 'pos.register.view'),
    ('organization_owner', 'pos.register.operate'),
    ('organization_owner', 'pos.sale.view'),
    ('organization_owner', 'pos.sale.create'),
    ('organization_owner', 'pos.sale.approve'),
    ('organization_owner', 'pos.cash.record'),
    ('organization_owner', 'pos.cash.approve'),
    ('organization_owner', 'pos.pricing.manage'),
    ('organization_owner', 'pos.reconciliation.view'),
    ('organization_owner', 'pos.reconciliation.manage'),
    ('organization_owner', 'finance.journal.view'),
    ('organization_owner', 'finance.reconciliation.manage'),
    ('organization_owner', 'finance.cash.approve'),
    ('hr_manager', 'workforce.role.assign'),
    ('hr_manager', 'workforce.member.view'),
    ('hr_manager', 'workforce.member.edit'),
    ('hr_manager', 'workforce.audit.view'),
    ('pos_manager', 'pos.register.view'),
    ('pos_manager', 'pos.register.operate'),
    ('pos_manager', 'pos.sale.view'),
    ('pos_manager', 'pos.sale.create'),
    ('pos_manager', 'pos.sale.approve'),
    ('pos_manager', 'pos.cash.record'),
    ('pos_manager', 'pos.cash.approve'),
    ('pos_manager', 'pos.pricing.manage'),
    ('pos_manager', 'pos.reconciliation.view'),
    ('pos_manager', 'pos.reconciliation.manage'),
    ('cashier', 'pos.register.view'),
    ('cashier', 'pos.register.operate'),
    ('cashier', 'pos.sale.view'),
    ('cashier', 'pos.sale.create'),
    ('cashier', 'pos.cash.record'),
    ('finance_manager', 'pos.sale.view'),
    ('finance_manager', 'pos.sale.approve'),
    ('finance_manager', 'pos.cash.approve'),
    ('finance_manager', 'pos.reconciliation.view'),
    ('finance_manager', 'pos.reconciliation.manage'),
    ('finance_manager', 'finance.journal.view'),
    ('finance_manager', 'finance.reconciliation.manage'),
    ('finance_manager', 'finance.cash.approve')
)
INSERT INTO public.workforce_role_permissions (
  company_id, role_id, permission_id, effect, status, effective_from,
  granted_by, granted_at, metadata
)
SELECT r.company_id, r.id, p.id, 'Allow', 'Active', TIMESTAMPTZ '2000-01-01 00:00:00+00',
       r.created_by, now(),
       jsonb_build_object('seededBy', '20260824_060_workforce_permission_seed', 'seedVersion', 1)
FROM public.workforce_roles r
JOIN role_permission_seed s ON s.role_code = r.code
JOIN public.workforce_permissions p
  ON p.company_id = r.company_id AND p.code = s.permission_code
WHERE r.role_kind = 'System' AND r.status = 'Active' AND p.status = 'Active'
ON CONFLICT (company_id, role_id, permission_id, effect, effective_from) DO UPDATE
SET status = 'Active',
    revoked_by = NULL,
    revoked_at = NULL,
    version = public.workforce_role_permissions.version + 1,
    metadata = coalesce(public.workforce_role_permissions.metadata, '{}'::jsonb)
      || jsonb_build_object('seededBy', '20260824_060_workforce_permission_seed', 'seedVersion', 1);

WITH conflict_seed(conflict_code, permission_a_code, permission_b_code, severity, resolution_policy, description) AS (
  VALUES
    ('workforce.role.assign.approve', 'workforce.role.assign', 'workforce.role.approve', 'Critical', 'Block', 'The same effective actor must not request and approve a workforce role assignment.'),
    ('pos.sale.create.approve', 'pos.sale.create', 'pos.sale.approve', 'High', 'Block', 'A POS sale creator must not approve the same sale exception or adjustment.'),
    ('pos.cash.record.approve', 'pos.cash.record', 'pos.cash.approve', 'High', 'Block', 'A POS cash movement recorder must not approve the same cash movement.')
)
INSERT INTO public.workforce_permission_conflicts (
  company_id, conflict_code, permission_a_id, permission_b_id, severity,
  resolution_policy, status, description, created_by, metadata
)
SELECT p1.company_id, c.conflict_code, p1.id, p2.id, c.severity,
       c.resolution_policy, 'Active', c.description,
       p1.created_by,
       jsonb_build_object('seededBy', '20260824_060_workforce_permission_seed', 'seedVersion', 1)
FROM conflict_seed c
JOIN public.workforce_permissions p1 ON p1.code = c.permission_a_code
JOIN public.workforce_permissions p2 ON p2.company_id = p1.company_id AND p2.code = c.permission_b_code
WHERE p1.status = 'Active' AND p2.status = 'Active'
ON CONFLICT (company_id, conflict_code) DO UPDATE
SET permission_a_id = EXCLUDED.permission_a_id,
    permission_b_id = EXCLUDED.permission_b_id,
    severity = EXCLUDED.severity,
    resolution_policy = EXCLUDED.resolution_policy,
    status = 'Active',
    description = EXCLUDED.description,
    updated_at = now(),
    metadata = coalesce(public.workforce_permission_conflicts.metadata, '{}'::jsonb)
      || jsonb_build_object('seededBy', '20260824_060_workforce_permission_seed', 'seedVersion', 1);

COMMIT;
