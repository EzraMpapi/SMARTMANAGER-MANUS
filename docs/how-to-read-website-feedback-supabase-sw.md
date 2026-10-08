# Jinsi ya Kuangalia Maoni ya Watumiaji

## Njia ya kwanza: Global Admin Dashboard

1. Ingia kwenye SMART MANAGER kwa akaunti yenye jukumu la **Platform Administrator** au **Super Administrator**.
2. Fungua **Global Admin Control Center**.
3. Chagua sehemu ya **Website feedback**.
4. Mfumo utaonyesha maoni yaliyotumwa kutoka kwenye website, pamoja na tarehe, category, jina, email kama imetolewa, ukurasa uliotumika, status, na ujumbe kamili.
5. Tumia kisanduku cha kutafuta kuchuja kwa category, status, jina, email, au neno lililopo kwenye ujumbe.
6. Kuandika jibu, fungua sehemu ya **Reply**, andika majibu yako, chagua status kama **New**, **Reviewing**, **Resolved**, au **Dismissed**, kisha bonyeza **Save reply**.

Jibu linahifadhiwa kwenye rekodi ileile ya feedback pamoja na muda wa kujibiwa na mtumiaji wa admin aliyefanya kitendo. Kitendo cha kujibu pia kinaandikwa kwenye audit ledger ya Global Admin. Kwa hiyo, ni salama kutumia paneli hii badala ya kubadilisha rekodi moja kwa moja.

## Njia ya pili: Supabase SQL Editor

Mtumiaji mwenye ruhusa ya kusoma database anaweza kufungua **Supabase Dashboard → SQL Editor** na kuendesha query hii:

```sql
select
  id,
  category,
  message,
  name,
  email,
  page_path,
  status,
  admin_reply,
  created_at,
  replied_at
from public.website_feedback_submissions
order by created_at desc
limit 100;
```

Query hii inaonyesha maoni 100 ya hivi karibuni. Kwa kuhesabu maoni kwa status, tumia:

```sql
select status, count(*) as total
from public.website_feedback_submissions
group by status
order by status
limit 20;
```

## Usalama muhimu

Table `website_feedback_submissions` imewekewa **Row-Level Security (RLS)**. `anon` na `authenticated` hazina direct SELECT au INSERT privileges kwenye table hiyo. Maoni ya public yanaingia kupitia server-side tRPC procedure, wakati usomaji wa queue unaruhusiwa tu baada ya backend kuthibitisha jukumu la Global Admin.

Usitumie SQL Editor kubadilisha `admin_reply`, `status`, au `replied_at` moja kwa moja wakati wa kazi za kawaida, kwa sababu kufanya hivyo kutapita audit action ya Global Admin. Tumia paneli ya **Website feedback** ili jibu na mabadiliko ya status viwe na kumbukumbu sahihi ya kiutawala.
