-- SMART MANAGER website feedback analytics queries
-- Read-only queries for Supabase SQL Editor.
-- Do not update feedback records directly; use Global Admin for replies/status changes.

-- 1. Total volume and latest submission timestamp.
SELECT
  count(*)::integer AS total_feedback,
  min(created_at) AS first_received_at,
  max(created_at) AS latest_received_at
FROM public.website_feedback_submissions
LIMIT 1;

-- 2. Feedback volume by review status.
SELECT
  status,
  count(*)::integer AS total
FROM public.website_feedback_submissions
GROUP BY status
ORDER BY total DESC, status
LIMIT 20;

-- 3. Feedback volume by category.
SELECT
  category,
  count(*)::integer AS total
FROM public.website_feedback_submissions
GROUP BY category
ORDER BY total DESC, category
LIMIT 20;

-- 4. Daily volume for the most recent 30 days.
SELECT
  (created_at AT TIME ZONE 'Africa/Dar_es_Salaam')::date AS local_day,
  count(*)::integer AS total
FROM public.website_feedback_submissions
WHERE created_at >= now() - interval '30 days'
GROUP BY local_day
ORDER BY local_day DESC
LIMIT 31;

-- 5. Monthly volume trend for the most recent 12 months.
SELECT
  date_trunc('month', created_at AT TIME ZONE 'Africa/Dar_es_Salaam')::date AS month_start,
  count(*)::integer AS total
FROM public.website_feedback_submissions
WHERE created_at >= now() - interval '12 months'
GROUP BY month_start
ORDER BY month_start DESC
LIMIT 12;

-- 6. Recent feedback queue for admin review. This includes contact data; run only in an authorized admin session.
SELECT
  id,
  category,
  status,
  name,
  email,
  page_path,
  message,
  admin_reply,
  created_at,
  replied_at,
  email_notification_status
FROM public.website_feedback_submissions
ORDER BY created_at DESC
LIMIT 100;

-- 7. Unresolved feedback queue without exposing the full message by default.
SELECT
  id,
  category,
  status,
  coalesce(name, 'Anonymous visitor') AS submitter,
  page_path,
  created_at,
  (admin_reply IS NOT NULL) AS has_reply,
  email_notification_status
FROM public.website_feedback_submissions
WHERE status IN ('new', 'reviewing')
ORDER BY created_at ASC
LIMIT 100;

-- 8. Average and median response time in hours for replied feedback.
SELECT
  count(*)::integer AS replied_total,
  round(avg(extract(epoch FROM (replied_at - created_at)) / 3600.0)::numeric, 2) AS average_response_hours,
  round((percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (replied_at - created_at)) / 3600.0))::numeric, 2) AS median_response_hours
FROM public.website_feedback_submissions
WHERE replied_at IS NOT NULL
  AND replied_at >= created_at
LIMIT 1;

-- 9. Response rate by category.
SELECT
  category,
  count(*)::integer AS received,
  count(*) FILTER (WHERE replied_at IS NOT NULL)::integer AS replied,
  round((100.0 * count(*) FILTER (WHERE replied_at IS NOT NULL) / nullif(count(*), 0))::numeric, 2) AS response_rate_percent
FROM public.website_feedback_submissions
GROUP BY category
ORDER BY received DESC, category
LIMIT 20;

-- 10. Email notification outcomes.
SELECT
  email_notification_status,
  count(*)::integer AS total
FROM public.website_feedback_submissions
GROUP BY email_notification_status
ORDER BY total DESC, email_notification_status
LIMIT 20;

-- 11. Email notification success rate for records that requested delivery.
SELECT
  count(*) FILTER (WHERE email IS NOT NULL AND btrim(email) <> '')::integer AS email_requested,
  count(*) FILTER (WHERE email_notification_status = 'sent')::integer AS sent,
  count(*) FILTER (WHERE email_notification_status = 'failed')::integer AS failed,
  count(*) FILTER (WHERE email_notification_status = 'disabled')::integer AS disabled,
  round((100.0 * count(*) FILTER (WHERE email_notification_status = 'sent') / nullif(count(*) FILTER (WHERE email IS NOT NULL AND btrim(email) <> ''), 0))::numeric, 2) AS sent_rate_percent
FROM public.website_feedback_submissions
LIMIT 1;

-- 12. Pages generating the most feedback.
SELECT
  page_path,
  count(*)::integer AS total
FROM public.website_feedback_submissions
GROUP BY page_path
ORDER BY total DESC, page_path
LIMIT 50;

-- 13. Oldest unresolved items, useful for an SLA review.
SELECT
  id,
  category,
  status,
  created_at,
  floor(extract(epoch FROM (now() - created_at)) / 86400)::integer AS age_days
FROM public.website_feedback_submissions
WHERE status IN ('new', 'reviewing')
ORDER BY created_at ASC
LIMIT 50;

-- 14. Basic data-quality checks without returning message or contact contents.
SELECT
  count(*) FILTER (WHERE message IS NULL OR char_length(btrim(message)) < 10)::integer AS invalid_message_count,
  count(*) FILTER (WHERE email IS NOT NULL AND btrim(email) <> '' AND email !~ '^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')::integer AS malformed_email_count,
  count(*) FILTER (WHERE category NOT IN ('bug', 'feature', 'ui', 'general'))::integer AS unsupported_category_count
FROM public.website_feedback_submissions
LIMIT 1;

-- 15. RLS and direct client-role posture. This returns metadata only.
SELECT
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS force_rls,
  has_table_privilege('anon', 'public.website_feedback_submissions', 'SELECT') AS anon_select,
  has_table_privilege('anon', 'public.website_feedback_submissions', 'INSERT') AS anon_insert,
  has_table_privilege('authenticated', 'public.website_feedback_submissions', 'SELECT') AS authenticated_select,
  has_table_privilege('authenticated', 'public.website_feedback_submissions', 'INSERT') AS authenticated_insert
FROM pg_class c
WHERE c.oid = 'public.website_feedback_submissions'::regclass
LIMIT 1;
