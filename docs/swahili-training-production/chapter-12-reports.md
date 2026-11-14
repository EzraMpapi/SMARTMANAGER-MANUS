# Sura ya 12 — Reports

**Muda wa mpango:** 08:00.
**Hadhira:** Wasimamizi, viongozi wa timu, watumiaji wanaotayarisha mapitio ya biashara, na wanaoanza kuelewa ripoti.
**Ahadi ya kujifunza:** Mtazamaji ataweza kuanza report kwa swali, kuchagua muktadha, kuthibitisha chanzo, kutafsiri signal kwa tahadhari, na kuandaa follow-up bila kudai chart, export, schedule, delivery, value au data ya tenant yoyote.

> **Dokezo la mpangilio:** Hii ni pack ya subject sequence iliyoombwa ya Reports. Reports & Scheduled Reporting imeorodheshwa kama **imejengwa** kwa report delivery, schedules, exports na management views zinazowakilishwa na huduma zilizojaribiwa. Hilo halithibitishi report fulani, schedule, export, recipient, delivery, filter, value, chart au trend ya tenant.[1]

> **Mpaka wa UI:** Hakuna Reports UI capture iliyopitiwa kwa faragha kwenye pack hii. Sura hutumia diagramu na characters wa kubuniwa pekee. Report screen, export, email delivery, scheduled job na chart ya data halisi vinasubiri capture gate.[2]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:25 | Kadi ya `REPORTS: swali, muktadha, mapitio` | Kutaja mada | Motion graphic. |
| 00:25–01:30 | David na Bwana Ezra mbele ya board ya kubuniwa isiyo na numbers | Kuanza report kwa swali | Hakuna chart/value halisi. |
| 01:30–02:45 | Diagramu: swali → chanzo → kipindi → signal → review → follow-up | Kueleza report method | Diagramu ya mafunzo. |
| 02:45–03:55 | Kadi ya “sales / inventory / finance / people” | Kueleza families za report bila metrics | Hakuna data ya tenant. |
| 03:55–05:05 | David anaeleza kipindi na muktadha | Kuzuia comparison isiyo sawa | Scenario ya kubuniwa. |
| 05:05–06:10 | Diagramu ya export/schedule/delivery yenye dashed boundary | Kueleza capability na configuration | Si delivery proof wala recipient list. |
| 06:10–07:05 | Kadi ya capture gate ya Reports UI | Kueleza screen requirement | UI bado haijapitishwa. |
| 07:05–08:00 | Ulichojifunza na daraja la next operations pack | Kufunga sura | Kadi ya mwelekeo unaofuata. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:25 — Report inaanza na swali

> Ripoti—*report*—nzuri haianzi na chart. Inaanza na swali: nini kinahitaji kueleweka, kwa kipindi gani, kutoka chanzo gani, na ni nani atakayepitia hatua inayofuata? Sura hii haionyeshi report, chart, export au value ya tenant.

### 00:25–01:30 — Swali la uongozi

> **Bwana Ezra:** “Ninapohitaji taarifa ya usimamizi, niombe report gani?”

> **David:** “Anza na uamuzi unaotaka kuunga mkono. Kisha eleza chanzo, kipindi, muktadha na mtu anayehitaji kupitia. Report bila swali wazi inaweza kuleta namba nyingi lakini maamuzi hafifu.”

### 01:30–02:45 — Njia ya report

> Mchoro huu unaonyesha njia ya mafunzo: swali, chanzo, kipindi, signal, review, na follow-up. `Signal` si hitimisho; ni kitu kinachohitaji muktadha. Hatuonyeshi query, database, filter, chart, row, export au schedule halisi.

### 02:45–03:55 — Families za report

> Report inaweza kuhusiana na mauzo, inventory, fedha au watu, kulingana na data na ruhusa zinazotumika. Kutaja family ya report hakuthibitishi kwamba data imekamilika, kwamba metric fulani ipo, au kwamba mtazamaji anaweza kuona ripoti hiyo.

### 03:55–05:05 — Kipindi na muktadha

> **David:** “Usilinganishe taarifa bila kuelewa kipindi. Jiulize: hii ni siku, wiki, mwezi, au kipindi kingine? Chanzo cha record ni kipi? Kuna hatua au data quality issue inayoweza kubadilisha tafsiri?”

> Report hujenga mazungumzo yenye muktadha; haisemi ukweli wake yenyewe bila review.

### 05:05–06:10 — Export, schedule na delivery

> Chanzo cha mradi kinaonyesha report delivery, schedules na exports kama sehemu ya uwezo uliowakilishwa na huduma zilizojaribiwa. Lakini export au schedule inaweza kutegemea usanidi, recipient authorization na mazingira ya delivery. Hatuonyeshi email, attachment, recipient, cron, provider, success status au data kwenye sura hii.

### 06:10–07:05 — Capture gate ya Reports

> Kabla ya Reports UI kuingia kwenye kozi, screen lazima iwe ime-load kikamilifu na isiwe na value, chart label, table row, customer, employee, account, date, filter state, recipient, export filename, browser identity, debug text au action isiyobadilika. Mpaka huo bado haujapitishwa kwa pack hii.

### 07:05–08:00 — Hitimisho

> **Ulichojifunza:** Report huanza na swali; signal inahitaji chanzo, kipindi na review; export/schedule/delivery vinaweza kuhitaji usanidi na authorization; na Reports UI bado haijapitishwa kwa mafunzo haya.

> **Kinachofuata:** Kifurushi kinachofuata cha shughuli kitaendelea na Procurement na Supply Chain/Manufacturing kwa scope labels zilizo wazi, hasa pale Manufacturing inapobaki imejengwa kwa sehemu.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:08 | `REPORTS: swali, muktadha, mapitio` | Kichwa cha sura. |
| 01:42 | `Swali → chanzo → kipindi → signal → review → follow-up` | Mfuatano wa dhana. |
| 03:00 | `Family ya report ≠ data iliyothibitishwa` | Usionyeshe metrics. |
| 04:18 | `Kipindi na chanzo vinaongoza tafsiri` | Sentence case. |
| 05:22 | `Export / schedule / delivery: inaweza kuhitaji usanidi` | Usidai successful delivery. |
| 06:25 | `Reports UI: BADO HAIJAPITISHWA` | Hakuna background UI bandia. |

## Asset na QA

| Asset | Hali | Matumizi yanayoruhusiwa | Katazo |
|---|---|---|---|
| David/Bwana Ezra training characters | Imeidhinishwa | Scenario ya report review ya kubuniwa | Hakuna chart, values au business result halisi. |
| Deterministic report-method diagrams | Ya kutengenezwa wakati wa assembly | Kueleza swali, context na follow-up | Si report screen, export au schedule proof. |
| Reports UI capture | **Bado haijapitishwa** | Hairuhusiwi katika version hii | Inahitaji faragha, source label na claim-to-screen review. |
| Email/export/schedule visual | **Hairuhusiwi bila approval** | Inaweza kuongezwa baada ya review | Hakuna recipient, attachment, delivery status au provider detail. |

Mhariri athibitishe kwamba hakuna KPI, value, currency, date, percentage, table, chart, report title ya tenant, filter, export filename, email, recipient, schedule expression, status, user, account au success claim kwenye frame, narration au subtitle.

## Marejeo

[1] [`build_book.py`](../smart-manager-book/build_book.py) — status ya Reports & Scheduled Reporting na tested-service representation.
[2] [`swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — truthfulness vocabulary na UI-capture constraints.
