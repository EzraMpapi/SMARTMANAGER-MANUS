-- Public website feedback is accepted only through the server-side tRPC procedure.
-- No anon/authenticated table policy is intentionally created.
CREATE TABLE IF NOT EXISTS public.website_feedback_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL CHECK (category IN ('bug', 'feature', 'ui', 'general')),
  message text NOT NULL CHECK (char_length(btrim(message)) BETWEEN 10 AND 3000),
  name text NULL CHECK (name IS NULL OR char_length(name) <= 120),
  email text NULL CHECK (email IS NULL OR char_length(email) <= 320),
  page_path text NOT NULL DEFAULT '/' CHECK (char_length(page_path) <= 240),
  source text NOT NULL DEFAULT 'public_website' CHECK (source = 'public_website'),
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'resolved', 'dismissed')),
  admin_notes text NULL CHECK (admin_notes IS NULL OR char_length(admin_notes) <= 3000),
  reviewed_at timestamptz NULL,
  reviewed_by uuid NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS website_feedback_submissions_status_created_idx
  ON public.website_feedback_submissions (status, created_at DESC);

CREATE INDEX IF NOT EXISTS website_feedback_submissions_created_idx
  ON public.website_feedback_submissions (created_at DESC);

ALTER TABLE public.website_feedback_submissions ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.website_feedback_submissions FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.website_feedback_submissions TO service_role;
