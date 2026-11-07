# Sura ya 04 — Architecture na Multi-Tenant System

**Muda wa mpango:** 12:00.
**Ahadi ya kujifunza:** Mtazamaji ataweza kueleza maana ya utenganishaji wa kampuni, jukumu, ruhusa na hatua inayokaguliwa kwa lugha ya uendeshaji, bila kufanya dai lisilothibitishwa kuhusu utekelezaji wa ndani au uwezo wa role fulani.

> **Mpaka wa ushahidi:** Mchoro wa architecture ni wa mafunzo. Unafafanua kanuni ya “mtumiaji sahihi ndani ya kampuni sahihi,” lakini hauonyeshi schema, sera, logi, au matokeo ya query. Uthibitisho wa role unahitaji session iliyoidhinishwa kwa role husika na hautolewi katika sura hii.[1]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:25 | Kadi ya kichwa; vitalu vitatu vya kampuni vinaonekana | Kutaja mada na mpaka wa dhana | Motion graphic. |
| 00:25–01:45 | Amina na Bwana Ezra mbele ya mchoro wa kampuni A/B/C | Kueleza kwa nini kampuni hutenganishwa | Kampuni za kubuniwa. |
| 01:45–03:15 | Diagramu ya `mtumiaji → kampuni → jukumu → ruhusa → action` | Kuweka vocabulary ya msingi | Diagramu ya elimu. |
| 03:15–04:45 | V03 identity/permission concept | Kuonyesha identity na access kama dhana | Lebo `TASWIRA YA MAELEZO`. |
| 04:45–06:20 | Diagramu ya “request context” na boundary ya data | Kueleza company scope bila SQL claim | Hakuna schema ya production. |
| 06:20–07:50 | V08 governance concept | Kueleza traceability na review | Haiwakilishi audit event halisi. |
| 07:50–09:25 | Controlled Dashboard frame; outer callouts za navigation pekee | Kutenganisha orientation ya UI na proof ya ruhusa | Hakuna record au role claim. |
| 09:25–10:45 | Jedwali la “unachojua / usichodhani” | Kuzuia overclaim | On-screen scope discipline. |
| 10:45–12:00 | Ulichojifunza, Kinachofuata | Kufunga na kuingia authentication | Kadi ya sura inayofuata. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:25 — Maana ya multi-tenant

> *Multi-tenant system* ni namna ya kuendesha mazingira ya kampuni nyingi kwa utenganishaji wa muktadha. Kwa Kiswahili rahisi: kila kazi lazima ijulikane inafanyika ndani ya kampuni gani na kwa ruhusa gani.

### 00:25–01:45 — Kwa nini muktadha wa kampuni ni muhimu

> **Amina:** “Tukisema kampuni A na kampuni B, hatusemi kwamba mtu mmoja hawezi kuwa na majukumu yaliyokaguliwa katika zaidi ya mazingira moja. Tunasema tu kwamba kila action inahitaji muktadha sahihi.”

> **Bwana Ezra:** “Kwa hiyo, si sahihi kudhani taarifa ya kampuni moja ina maana kwa kampuni nyingine?”

> **Amina:** “Ndiyo. Utenganishaji ni kanuni ya usalama na utaratibu wa kazi.”

### 01:45–03:15 — Maneno matano ya architecture

> Mtumiaji ni anayefanya kazi. Kampuni ni mazingira ya biashara. Jukumu linaeleza aina ya wajibu. Ruhusa huweka mipaka ya action. Na action ndiyo hatua inayofanywa ndani ya muktadha huo. Mchoro huu ni lugha ya mafunzo; hauonyeshi kanuni za ndani za database.

### 03:15–04:45 — Identity na ruhusa

> Taswira ya identity inaeleza kwamba mtu na jukumu lake havifanani na data yenyewe. Huwezi kuthibitisha kwamba role fulani inaweza kuona, kuhariri, au kuidhinisha kitu kwa kutumia sahani ya 3D. Uthibitisho huo utahitaji capture iliyoidhinishwa ya role na action husika.

### 04:45–06:20 — Company scope

> Fikiria ombi la kazi kama bahasha yenye alama. Bahasha ina jina la mtumiaji, kampuni anayofanyia kazi, na jukumu lake. Mfumo unaodhibitiwa hutumia muktadha huo kuamua kama hatua inaendana na kazi inayoruhusiwa. Huu ni mfano wa kueleza, si uchunguzi wa query au sera ya production.

### 06:20–07:50 — Ufuatiliaji wa hatua

> Uongozi unaohusika unahitaji uwezo wa kuelewa ni hatua ipi ilifanyika na kwa nini mapitio yanahitajika. Taswira ya governance inaonyesha wazo la ufuatiliaji. Haisemi kwamba logi maalumu imeundwa, imejazwa, au imehakikiwa katika tenant yoyote.

### 07:50–09:25 — UI bila overclaim

> Frame hii iliyosafishwa inaonyesha ganda la navigation tu. Haionyeshi role ya mtu, data, kampuni, ruhusa, au rekodi. Tuitumie kama mwelekeo wa kufahamu majina ya maeneo; tusiipe maana ya uthibitisho wa access.

### 09:25–12:00 — Hitimisho

> **Ulichojifunza:** Umeelewa company context; umetofautisha jukumu na ruhusa; umeona kwamba role proof inahitaji session maalumu; na umejifunza kutumia michoro ya architecture kama dhana pekee.

> **Kinachofuata:** Sura ya 05 itazungumzia authentication na user management kwa mtazamo wa matumizi salama na wa faragha.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:12 | `Kampuni sahihi. Jukumu sahihi. Kazi sahihi.` | Kauli ya dhana, si claim ya mfumo. |
| 02:08 | `Mtumiaji → Kampuni → Jukumu → Ruhusa → Action` | `Action` ifafanuliwe kwa subtitle `kitendo`. |
| 03:36 | `TASWIRA YA MAELEZO` | Kaa kwenye V03. |
| 06:40 | `Ufuatiliaji ≠ ushahidi wa logi halisi` | Usiiondoe kwenye V08. |
| 09:36 | `Unachojua / Usichodhani` | Tumia columns mbili bila data binafsi. |

## Asset na QA

| Asset | Matumizi | Kizuizi |
|---|---|---|
| V03 na V08 | Identity, permission na governance concepts | Lebo ya conceptual lazima ionekane. |
| Diagramu za 2D | Company scope na request context | Usitumie majina ya kampuni halisi, schema, au query. |
| Dashboard redacted frame | Navigation orientation | Usidai role proof, KPI, audit, au data isolation result.[2] |

Mhariri athibitishe kwamba michoro haina claim ya “guaranteed,” hakuna mfano wa kampuni halisi, na lower-third inaeleza `role proof inahitaji capture iliyoidhinishwa`.

## Marejeo

[1] [`swahili-training-course-architecture-20260826.md`](../swahili-training-course-architecture-20260826.md) — Sura 04 na capture-readiness gate.
[2] [`swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — mipaka ya V03/V08 na role-proof caveat.
