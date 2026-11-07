ALTER TABLE public.website_feedback_submissions
  ADD COLUMN IF NOT EXISTS email_notification_status text NOT NULL DEFAULT 'not_requested' CHECK (email_notification_status IN ('not_requested', 'disabled', 'sent', 'failed')),
  ADD COLUMN IF NOT EXISTS email_notification_id text NULL,
  ADD COLUMN IF NOT EXISTS email_notification_sent_at timestamptz NULL;

CREATE INDEX IF NOT EXISTS website_feedback_email_delivery_status_idx
  ON public.website_feedback_submissions (email_notification_status, created_at DESC);
