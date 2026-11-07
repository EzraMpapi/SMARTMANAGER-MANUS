ALTER TABLE public.website_feedback_submissions
  ADD COLUMN IF NOT EXISTS admin_reply text NULL CHECK (admin_reply IS NULL OR char_length(admin_reply) <= 3000),
  ADD COLUMN IF NOT EXISTS replied_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS replied_by uuid NULL;

CREATE INDEX IF NOT EXISTS website_feedback_submissions_replied_at_idx
  ON public.website_feedback_submissions (replied_at DESC);
