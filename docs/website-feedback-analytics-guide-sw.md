# Mwongozo wa Kuchambua Maoni ya Watumiaji

## Muhtasari wa jedwali la live

Ukaguzi wa live Supabase wa tarehe **26 Agosti 2026** ulithibitisha kuwa `public.website_feedback_submissions` ina fields za maoni, contact details za hiari, review status, admin reply, na email notification status. Kwa wakati wa ukaguzi kulikuwa na **records 0**. Jedwali lina RLS enabled, halina policies za public users, na roles `anon` pamoja na `authenticated` hazina direct `SELECT` au `INSERT` privileges. Kwa hiyo, queries hizi zinapaswa kuendeshwa na mtumiaji aliyeidhinishwa katika Supabase SQL Editor au kupitia Global Admin backend; si kupitia browser client.

Query zote ziko kwenye faili [`website-feedback-analytics-queries.sql`](./website-feedback-analytics-queries.sql). Zote ni read-only na zimewekewa `LIMIT` kwa usalama wa result size.

## Muundo wa taarifa unaochambuliwa

| Eneo | Fields muhimu | Matumizi |
|---|---|---|
| Maoni | `category`, `message`, `page_path`, `source` | Kutambua aina ya tatizo au ombi na sehemu iliyozalisha feedback |
| Review | `status`, `admin_notes`, `reviewed_at`, `reviewed_by` | Kufuatilia triage na hatua ya kushughulikia |
| Muda | `created_at`, `replied_at` | Kupima volume na response time |
| Jibu | `admin_reply`, `replied_by` | Kuthibitisha kama feedback ilijibiwa |
| Email | `email`, `email_notification_status`, `email_notification_id`, `email_notification_sent_at` | Kufuatilia ombi na matokeo ya notification |

## Query za msingi

**Query 1–3: picha ya jumla.** Query ya kwanza inaonyesha jumla ya maoni, tarehe ya kwanza, na tarehe ya mwisho. Query ya pili inaonyesha distribution ya status kama `new`, `reviewing`, `resolved`, au `dismissed`. Query ya tatu inaonyesha categories kama bug, feature, UI, au general. Hizi ndizo query za kuanza nazo kila review inapofanyika.


## Query za muda na response performance

**Query 4–5: mwenendo wa muda.** Query ya kila siku hutumia saa za Tanzania kupitia `Africa/Dar_es_Salaam` na inaonyesha siku 30 zilizopita. Query ya kila mwezi inaonyesha miezi 12 iliyopita. Tumia matokeo haya kulinganisha engagement kabla na baada ya release, campaign, au invitation ya reviewers.



## Query za majibu na email

**Query 6–7: queue ya operational review.** Query ya 6 inarudisha records za hivi karibuni pamoja na message na contact data; itumike tu katika admin session iliyoidhinishwa. Query ya 7 ni salama zaidi kwa triage ya awali kwa sababu haionyeshi full message.

**Query 8–9: kipimo cha response.** Query ya 8 hupima average na median ya muda kutoka `created_at` hadi `replied_at`, kwa saa. Median ni muhimu kwa sababu haipotoshwi sana na rekodi chache zilizochelewa. Query ya 9 inaonyesha response rate kwa kila category ili timu ijue kama aina fulani ya maoni inapuuzwa au inahitaji owner maalum.


**Query 10** inaonyesha email notification outcomes: `not_requested`, `disabled`, `sent`, au `failed`.

**Query 11** inapima idadi ya records zilizokuwa na email, sent, failed, disabled, na sent rate. Ikiwa status ni `disabled`, owner anahitaji kuweka `FEEDBACK_REPLY_EMAIL_NOTIFICATIONS=true` pamoja na Resend server credentials kwenye deployment environment.

## Query za data quality na usalama

**Query 12–13: chanzo na umri wa queue.** Query ya 12 inaonyesha pages zinazozalisha feedback nyingi. Query ya 13 inaonyesha oldest unresolved items na age yao kwa siku; hii inaweza kutumika kama SLA review queue.


**Query 15** inathibitisha RLS na direct privileges za client roles. Matokeo yanayotarajiwa ni `rls_enabled = true`, `anon_select = false`, `anon_insert = false`, `authenticated_select = false`, na `authenticated_insert = false`.

## Utaratibu wa matumizi

Anza na Query 1–3 kupata KPI za msingi. Tumia Query 4–5 kwa trend analysis, Query 7–13 kwa operational review, na Query 14–15 kwa data-quality na security verification. Kwa kusoma na kujibu ujumbe wenyewe, tumia **Global Admin → Website feedback** badala ya kutoa dataset kubwa kutoka SQL Editor. Njia hiyo pia inalinda audit trail ya admin actions na email notification status.

Usifanye `UPDATE`, `DELETE`, au `TRUNCATE` kwa query pack hii. Reply na status changes zifanyike kupitia Global Admin ili validation, authorization, audit, na delivery tracking vifanyike pamoja.

## Faragha na usalama

Majina, email, na message ni taarifa ambazo zinaweza kumtambua mtumiaji au kufichua taarifa za biashara. Usiziweke kwenye public report, screenshot, au WhatsApp group bila sababu halali. Tumia aggregate queries inapowezekana, na tumia Query 6 pekee katika admin context yenye authorization sahihi.

Waalike reviewers watumie data ya mfano tu wakati wa kujaribu. Waambie wasiweke password, API key, token, namba za benki, au taarifa nyingine nyeti kwenye feedback form.

## Marejeo

- [SMART MANAGER GitHub repository](https://github.com/EzraMpapi/SMARTMANAGER-MANUS)
- Live table: `public.website_feedback_submissions`
- Global Admin procedure: `globalAdmin.feedback` na `globalAdmin.replyFeedback`
