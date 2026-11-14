# Sura ya 08 — Point of Sale (POS)

**Muda wa mpango:** 14:00.
**Hadhira:** Wahudumu wa mauzo ya moja kwa moja, wasimamizi wa register, na viongozi wa shughuli za kila siku.
**Ahadi ya kujifunza:** Mtazamaji ataweza kueleza kwa dhana mzunguko wa POS—rejista ya mauzo, bidhaa au huduma, uthibitishaji, muamala, risiti/marejesho/mkopo wa mteja, ulinganifu wa rekodi na ukaguzi—na kuelewa kwamba checkout halisi, uthibitisho wa malipo, marejesho, loyalty, kodi, au matokeo ya ulinganifu haitaonyeshwa bila capture salama mahsusi.

> **Mpaka wa ushahidi:** POS imeorodheshwa kama **imejengwa** kwa njia za transaction, return, customer credit, register control, loyalty, reconciliation na audit. Kwa sasa hakuna capture ya POS iliyopitiwa kwa faragha kwenye package hii. Kwa hiyo sura hutumia wahusika, diagramu, na visual concept kama maelezo; haionyeshi UI ya checkout, kiasi, receipt, payment provider, customer, item, au cash result.[1] [2]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:30 | Kadi ya `POS: shughuli ya kaunta kwa utaratibu` | Kutaja mada na no-live-checkout rule | Motion graphic. |
| 00:30–01:50 | Neema na Bwana Ezra kwenye kaunta ya kubuniwa isiyo na bidhaa zenye majina | Kuonyesha mazingira ya huduma ya moja kwa moja | Wahusika/props za kubuniwa. |
| 01:50–03:15 | Diagramu ya POS: rejista → bidhaa/huduma → uthibitishaji → muamala → risiti/marejesho/mkopo | Kufundisha mfululizo | Diagramu si operational evidence. |
| 03:15–04:35 | Sahani ya Sales workflow concept kwa lebo ya dhana | Kuunganisha POS na biashara kwa level ya juu | Si POS screen, si receipt proof. |
| 04:35–06:10 | Kadi za “kabla ya kuuza / wakati wa kuuza / baada ya kuuza” | Kueleza control points | Hakuna payment action. |
| 06:10–07:40 | Scenario ya register change na review boundary | Kueleza mabadiliko ya shift kwa uaminifu | Hakuna register halisi. |
| 07:40–09:15 | Diagramu ya return na customer-credit path, yenye `inategemea sera na ruhusa` | Kueleza return/credit si shortcut | Usidai return imekamilika. |
| 09:15–10:40 | Diagramu ya reconciliation: rekodi → mapitio → tofauti → hatua ya ufuatiliaji | Kueleza kwa nini reconciliation inahitajika | Hakuna cash figure au report. |
| 10:40–12:10 | Amina anaonyesha “capture gate” ya POS kwenye kadi | Kueleza nini kinahitajika kabla ya UI demo | Transparent scope label. |
| 12:10–14:00 | Recap na daraja la CRM | Kufunga POS, kuingia customer relationship | Kadi na character beat. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:30 — POS kwa lugha rahisi

> Point of Sale, au POS, ni eneo la uendeshaji wa mauzo ya moja kwa moja. Kwa mafunzo haya, tunajifunza kanuni ya mchakato—si checkout halisi. Hakuna malipo, risiti, cash drawer, mteja, bidhaa, au namba ya muamala itakayoonyeshwa kwenye sura hii.

### 00:30–01:50 — Huduma yenye mpangilio

> **Bwana Ezra:** “Mteja akiwa mbele ya kaunta, nini kinahitaji kuwa sawa?”

> **Neema:** “Kwanza ni mazingira ya rejista ya mauzo—*register*—na jukumu la mtumiaji. Kisha ni bidhaa au huduma inayohusika, maelezo yanayothibitishwa, na hatua inayofuata kulingana na sera. Kasi ni muhimu, lakini usahihi na mapitio—*review*—ni muhimu pia.”

### 01:50–03:15 — Mzunguko wa dhana

> Mchoro huu unaonyesha njia ya kufikiri: rejista ya mauzo, bidhaa au huduma, uthibitishaji—*validation*—muamala—*transaction*—halafu njia ya risiti, marejesho au mkopo wa mteja inapohusika. Chanzo cha mradi kinaonyesha kwamba njia hizi zipo katika scope ya POS, lakini hatutumii mchoro huu kuthibitisha muamala, malipo, hesabu ya kodi, loyalty award, au tukio halisi la ukaguzi.

### 03:15–04:35 — Uhusiano na biashara pana

> Sahani hii ya Sales inaunganisha wazo la POS na shughuli pana za biashara. Inabaki kuwa taswira ya maelezo. Haiwakilishi checkout, cash, card, mobile money, fiscal acceptance, au settlement ya huduma ya nje.

### 04:35–06:10 — Control points tatu

> Kabla ya kuuza, tambua muktadha wa rejista ya mauzo na jukumu. Wakati wa kuuza, hakiki bidhaa au huduma na maelezo yanayohitajika. Baada ya kuuza, fuata njia ya shirika kwa rekodi, risiti, marejesho au mkopo wa mteja pale inapohusika. Hatua yoyote ya malipo au muunganisho wa provider inahitaji usanidi na ushahidi wake wenyewe.

### 06:10–07:40 — Register na review

> **Amina:** “Mabadiliko ya rejista ya mauzo au shift yasichukuliwe kama kazi ya kubonyeza tu. Yanahitaji mapitio yanayolingana na sera, wajibu wa mtumiaji, na ushahidi wa hatua unaoruhusiwa.”

> Hapa hatuonyeshi register halisi. Tunajifunza nidhamu ya kutenganisha action ya kila siku na uthibitisho unaohitajika.

### 07:40–09:15 — Return na customer credit

> Marejesho—*return*—au mkopo wa mteja—*credit*—unaweza kuhitaji sababu, uhusiano na rekodi ya awali, mapitio, na role inayofaa. Uwepo wa njia hizi kwenye scope ya POS hauimaanishi kila mtumiaji anaweza kuanzisha au kukamilisha hatua hizo. Sera na ruhusa za kampuni husika ndizo huongoza.

### 09:15–10:40 — Reconciliation

> Ulinganifu wa rekodi—*reconciliation*—ni kulinganisha kile kilichorekodiwa na kile kinachopaswa kupitiwa kwa utaratibu wa shirika. Ukiwa na tofauti, usitunge namba au kuficha tofauti. Tambua chanzo, fanya mapitio, na elekeza hatua kwa mtu mwenye jukumu sahihi. Hatuonyeshi cash figure au report ya ulinganifu hapa.

### 10:40–12:10 — Capture gate ya POS

> Kabla ya UI demonstration ya POS kuingia kwenye master course, lazima page iwe ime-load kikamilifu, isiwe na customer, item, value, tender, receipt, provider detail, debug text au credentials; action za irreversible zisiwe zinafanywa; na claim ya script ilingane na kile kinachoonekana. Mpaka huo haujapitishwa kwa sura hii, hivyo tunabaki kwenye maelezo ya dhana.

### 12:10–14:00 — Hitimisho

> **Ulichojifunza:** POS ina mzunguko wa register, item/huduma, validation na record path; return au credit inahitaji sera na ruhusa; reconciliation ni mapitio, si namba ya kubuni; na UI checkout haijaidhinishwa kwa sura hii.

> **Kinachofuata:** Sura ya 09 itaangalia CRM na mahusiano ya wateja—lead, contact, opportunity, follow-up na pipeline—kwa kutumia scenario za kubuniwa hadi CRM UI salama ipitie capture gate.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:08 | `POS: huduma ya kaunta kwa utaratibu` | Kichwa cha sura. |
| 02:05 | `Rejista → bidhaa/huduma → uthibitishaji → njia ya rekodi` | Kiswahili hutangulia istilahi ya Kiingereza. |
| 03:28 | `TASWIRA YA MAELEZO` | Lazima ibaki kwenye Sales concept. |
| 05:10 | `Malipo / provider: inahitaji usanidi na ushahidi` | Usitaje provider yoyote. |
| 08:00 | `Marejesho au mkopo: sera + ruhusa` | Kauli ya ndani ya diagramu. |
| 10:55 | `UI capture gate: BADO HAIJAPITISHWA` | Onyesha wazi, bila kuunda UI bandia. |

## Asset na QA

| Asset | Hali | Matumizi yanayoruhusiwa | Katazo |
|---|---|---|---|
| Neema/Bwana Ezra training characters | Imeidhinishwa | Scenario ya kaunta ya kubuniwa | Hakuna bidhaa, mteja, receipt, au cash halisi. |
| Deterministic POS diagrams | Ya kutengenezwa wakati wa assembly | Kueleza mtiririko na control points | Si screenshot, transaction proof, wala payment proof. |
| Sales workflow concept | Imehakikiwa | Daraja la high-level relationship | Usiiite POS UI au receipt. |
| POS UI capture | **Bado haijapitishwa** | Hairuhusiwi katika version hii | Inahitaji review ya faragha, no-action capture, na claim-to-screen match. |

Mhariri athibitishe kwamba hakuna price, tax, tender type, payment phone, wallet, provider, item name, customer name, receipt, barcode inayosomeka, loyalty balance, cash drawer amount, au register identifier. Music/SFX zisisikike kama confirmation ya malipo.

## Marejeo

[1] [`build_book.py`](../smart-manager-book/build_book.py) — status na POS transaction/return/credit/reconciliation/audit paths.
[2] [`swahili-training-course-architecture-20260826.md`](../swahili-training-course-architecture-20260826.md) — lengo la Sura 08 na capture-readiness gate.
