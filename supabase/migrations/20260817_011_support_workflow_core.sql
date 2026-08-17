-- Smart Manager Customer Support & Workflows core.
-- This migration preserves existing support, CRM, and WhatsApp tables. It adds
-- only structured metadata and collaboration records required for server-backed
-- ticketing; every support record remains constrained by current_company_id().

ALTER TABLE public.support_tickets
  ADD COLUMN IF NOT EXISTS assigned_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS team_id uuid,
  ADD COLUMN IF NOT EXISTS source_channel text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS customer_reference text,
  ADD COLUMN IF NOT EXISTS due_at timestamptz,
  ADD COLUMN IF NOT EXISTS resolved_at timestamptz,
  ADD COLUMN IF NOT EXISTS closed_at timestamptz;

ALTER TABLE public.support_ticket_messages
  ADD COLUMN IF NOT EXISTS ticket_id uuid REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS body text,
  ADD COLUMN IF NOT EXISTS sender_kind text NOT NULL DEFAULT 'customer',
  ADD COLUMN IF NOT EXISTS sender_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS delivery_status text NOT NULL DEFAULT 'recorded',
  ADD COLUMN IF NOT EXISTS provider_message_id text,
  ADD COLUMN IF NOT EXISTS sent_at timestamptz NOT NULL DEFAULT now();

CREATE TABLE IF NOT EXISTS public.support_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  department_name text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.support_agents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_id uuid REFERENCES public.support_teams(id) ON DELETE SET NULL,
  availability text NOT NULL DEFAULT 'available',
  workload_limit integer NOT NULL DEFAULT 20 CHECK (workload_limit > 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, profile_id)
);

ALTER TABLE public.support_tickets
  ADD CONSTRAINT support_tickets_team_id_fkey
  FOREIGN KEY (team_id) REFERENCES public.support_teams(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS public.support_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  team_id uuid NOT NULL REFERENCES public.support_teams(id) ON DELETE CASCADE,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'agent',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, team_id, profile_id)
);

CREATE TABLE IF NOT EXISTS public.support_ticket_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  author_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
  body text NOT NULL CHECK (char_length(trim(body)) > 0),
  kind text NOT NULL DEFAULT 'internal_note' CHECK (kind = 'internal_note'),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_ticket_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  ticket_id uuid NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  actor_profile_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.support_sla_policies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  priority text NOT NULL,
  first_response_minutes integer NOT NULL CHECK (first_response_minutes > 0),
  resolution_minutes integer NOT NULL CHECK (resolution_minutes > 0),
  warning_minutes integer CHECK (warning_minutes >= 0),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name)
);

CREATE TABLE IF NOT EXISTS public.support_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name text NOT NULL,
  provider text NOT NULL DEFAULT 'bird',
  channel text NOT NULL DEFAULT 'whatsapp',
  language text NOT NULL DEFAULT 'en',
  category text,
  body text NOT NULL,
  variables jsonb NOT NULL DEFAULT '[]'::jsonb,
  approval_status text NOT NULL DEFAULT 'draft',
  is_active boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (company_id, name, language)
);

CREATE INDEX IF NOT EXISTS support_tickets_company_status_due_idx
  ON public.support_tickets (company_id, status, due_at);
CREATE INDEX IF NOT EXISTS support_tickets_company_assignee_idx
  ON public.support_tickets (company_id, assigned_profile_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS support_ticket_messages_company_ticket_sent_idx
  ON public.support_ticket_messages (company_id, ticket_id, sent_at);
CREATE UNIQUE INDEX IF NOT EXISTS support_ticket_messages_provider_message_uq
  ON public.support_ticket_messages (company_id, provider_message_id)
  WHERE provider_message_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS support_ticket_notes_company_ticket_created_idx
  ON public.support_ticket_notes (company_id, ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_ticket_activity_company_ticket_created_idx
  ON public.support_ticket_activity (company_id, ticket_id, created_at DESC);
CREATE INDEX IF NOT EXISTS support_agents_company_profile_idx
  ON public.support_agents (company_id, profile_id);
CREATE INDEX IF NOT EXISTS support_team_members_company_profile_idx
  ON public.support_team_members (company_id, profile_id);
CREATE INDEX IF NOT EXISTS support_templates_company_active_idx
  ON public.support_message_templates (company_id, is_active, channel);

ALTER TABLE public.support_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ticket_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_sla_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_message_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY support_teams_tenant ON public.support_teams
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY support_agents_tenant ON public.support_agents
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY support_team_members_tenant ON public.support_team_members
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY support_ticket_notes_tenant ON public.support_ticket_notes
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY support_ticket_activity_tenant ON public.support_ticket_activity
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY support_sla_policies_tenant ON public.support_sla_policies
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
CREATE POLICY support_message_templates_tenant ON public.support_message_templates
  FOR ALL USING (company_id = current_company_id()) WITH CHECK (company_id = current_company_id());
