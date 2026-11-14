# Sura ya 03 — Mfumo Unavyofanya Kazi

**Muda wa mpango:** 08:00.
**Ahadi ya kujifunza:** Mtazamaji ataweza kueleza kwa kiwango cha dhana safari ya mtumiaji kutoka sehemu ya kuingia hadi kwenye kazi inayoruhusiwa, bila kudai aina ya uthibitishaji, idhini, au data ambayo haijaonyeshwa kwa usalama.

> **Mpaka wa ushahidi:** Sehemu ya kuingia ya umma inaweza kuonyeshwa tu ikiwa haina akaunti, session, hitilafu, loader, tokeni, au maelezo ya kivinjari. Hakuna kuingia, kubonyeza ndani ya nafasi binafsi, au kurekodi uthibitishaji halisi katika sura hii.[1]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:25 | Kadi ya kichwa; ramani ya njia inaonekana kama mstari mmoja | Kueleza “safari ya kazi” | Motion graphic. |
| 00:25–01:25 | Public entry iliyopitiwa kwa faragha; pointer inaonyesha eneo la kuanza bila kubonyeza | Kutofautisha entry ya umma na workspace binafsi | Hakuna account/session inayoonekana. |
| 01:25–02:25 | V02 workflow plate yenye lebo ya dhana | Kueleza hatua kama mtiririko wa kufikiri | Si skrini ya UI, si proof ya automation. |
| 02:25–03:45 | Diagramu: mtumiaji → uthibitishaji → kampuni → jukumu → kazi iliyoruhusiwa | Kueleza principle ya access context | Diagramu haithibitishi implementation mahususi. |
| 03:45–05:05 | Amina na Bwana Ezra; karatasi ya “nani / kwa nini / hatua gani” | Kuonyesha wajibu kabla ya action | Wahusika wa mafunzo. |
| 05:05–06:30 | Controlled redacted module-shell montage: Dashboard, Sales, Inventory, Finance | Kuonyesha navigation orientation tu | Frames zilizoidhinishwa; content imeondolewa. |
| 06:30–08:00 | Muhtasari wa safe-workspace principles na daraja | Kukumbusha kutokuonyesha siri | Kadi ya summary. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:25 — Mfumo si ukurasa mmoja

> Mfumo wa biashara hauanzi na jedwali au ripoti. Unaanza na njia salama ya mtumiaji kufika kwenye kazi anayoruhusiwa kufanya. Hii ndiyo ramani ya sura yetu.

### 00:25–01:25 — Sehemu ya kuingia

> Hapa tunaona sehemu ya kuingia ya umma iliyopitiwa kwa faragha. Hatutaandika nenosiri, kuonyesha akaunti, kusoma tokeni, au kurekodi session. Kusudi ni kuelewa kwamba sehemu ya kuingia si sawa na nafasi ya kazi ya ndani.

### 01:25–02:25 — Mtiririko wa dhana

> Taswira ya workflow inaonyesha dhana ya hatua zinazofuatana. Taswira hii haisemi kwamba automation, notification, au muunganisho wowote umefanikiwa. Inasaidia tu kuandaa akili kabla ya kuona UI iliyokaguliwa kwa kila sura inayofuata.

### 02:25–03:45 — Muktadha wa kazi

> Tunaweza kueleza safari kwa maneno matano: mtumiaji, uthibitishaji, kampuni, jukumu, na kazi. Kila neno lina swali lake. Ni nani anatumia? Anaingia kwa njia gani iliyoidhinishwa? Anafanya kazi ndani ya kampuni gani? Jukumu lake linaruhusu nini? Na kitendo hicho kinafuatwa kwa utaratibu gani?

> Hii ni kanuni ya kufundishia. Haijaribu kutabiri ruhusa za mtu yeyote kwenye mazingira ya uzalishaji.

### 03:45–05:05 — Wajibu kabla ya kubonyeza

> **Bwana Ezra:** “Kwa nini tusibofye tu moduli tunayotaka?”

> **Amina:** “Kwa sababu mfumo salama huanza na muktadha. Mtumiaji asipojua anachoruhusiwa kufanya, anaweza kutafuta taarifa au hatua ambazo si sehemu ya jukumu lake. Kazi sahihi huanza na mtu sahihi, ndani ya mazingira sahihi.”

### 05:05–06:30 — Ganda la moduli

> Frames hizi zimesafishwa kwa makusudi. Zinaonyesha tu mwelekeo wa majina ya moduli, si rekodi za biashara. Hatuwezi kutoa hitimisho kuhusu mauzo, bidhaa, fedha, dashboard, au ruhusa kwa kutazama ganda la navigation pekee.

### 06:30–08:00 — Hitimisho

> **Ulichojifunza:** Umetofautisha sehemu ya kuingia na workspace binafsi; umejifunza ramani ya mtumiaji hadi kazi; na umeona kwa nini muktadha wa kampuni na jukumu ni muhimu kabla ya action.

> **Kinachofuata:** Sura ya 04 itapanua ramani hii na kueleza utenganishaji wa kampuni—*multi-tenant isolation*—kwa lugha rahisi na kwa mchoro wa dhana.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:12 | `NJIA YA KAZI ILIYODHIBITIWA` | Sentensi fupi. |
| 00:48 | `Sehemu ya kuingia ≠ workspace binafsi` | Tumia alama moja tu ya `≠`. |
| 02:40 | `Mtumiaji → Uthibitishaji → Kampuni → Jukumu → Kazi` | Mfuatano lazima ulingane na narration. |
| 05:24 | `UI ILIYOSAFISHWA: mwelekeo wa moduli pekee` | Onyesha kwenye kila redacted frame. |
| 06:50 | `Usionyeshe siri, session au rekodi binafsi` | Tafsiri sahihi ya security boundary. |

## Asset na QA

| Asset | Hali | Matumizi | Mipaka |
|---|---|---|---|
| Public entry capture | Inahitaji ukaguzi wa mwisho | Orientation ya sehemu ya kuingia | Hairuhusu login attempt au akaunti. |
| V02 | Conceptual | Njia ya workflow | Si uthibitisho wa automation. |
| Dashboard/Sales/Inventory/Finance redacted frames | Imepitishwa kwa orientation | Montage ya majina ya moduli | Si proof ya role, record, KPI, au workflow.[2] |

Mhariri athibitishe kwamba kila redacted frame ina caption ya tenant-neutral, hakuna badge, count, date, value, jina, au record text, na pointer haifanyi action ndani ya mazingira binafsi.

## Marejeo

[1] [`swahili-training-course-architecture-20260826.md`](../swahili-training-course-architecture-20260826.md) — Sura 03 na capture-readiness gate.
[2] [`kmkm-redacted-output-privacy-review-20260826.md`](./kmkm-redacted-output-privacy-review-20260826.md) — uhalali wa frame za orientation baada ya hardening.
