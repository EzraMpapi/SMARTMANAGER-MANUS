# Sura ya 07 — Sales: Kutoka Mteja hadi Ankara

**Muda wa mpango:** 14:00.
**Hadhira:** Timu za mauzo, wasimamizi wa biashara, na watumiaji wanaoanza kujifunza mtiririko wa kibiashara.
**Ahadi ya kujifunza:** Mtazamaji ataweza kueleza mfululizo wa kibiashara kutoka mazungumzo ya mteja hadi hati ya mauzo, na kujua wapi uthibitisho wa UI, mapitio ya binadamu, stock, fedha, malipo na risiti vinahitaji ushahidi mahsusi au usanidi unaofaa.

> **Mpaka wa ushahidi:** Sales & Billing imeorodheshwa kama **imejengwa** katika chanzo na historia ya database, ikiwa na mikataba ya nyaraka za mauzo, ankara, malipo na billing controls. Hilo si ruhusa ya kutumia taswira ya 3D au frame ya navigation kama uthibitisho wa muamala kamili, idhini ya role, stock movement, finance posting, payment confirmation, au risiti ya tenant.[1] [2]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:30 | Kadi ya `SALES: kutoka mteja hadi ankara`; mstari wa hatua unaanza tupu | Kutaja lengo na truthfulness rule | Motion graphic. |
| 00:30–01:45 | Neema na Amina; Neema anaeleza mazungumzo ya mteja ya kubuniwa | Kuonyesha kwamba biashara huanza kwa hitaji lililoeleweka | Wahusika wa mafunzo; hakuna mteja halisi. |
| 01:45–03:05 | Sales workflow concept yenye lebo `TASWIRA YA MAELEZO` | Kueleza mtiririko wa dhana: mazungumzo → hati → mapitio | Si screenshot; si proof ya transaction. |
| 03:05–04:20 | Redacted Sales orientation frame; callout ya `Sales` navigation shell pekee | Kuelekeza mahali pa moduli | Frame iliyoidhinishwa; hakuna rekodi, badge, role proof, au click. |
| 04:20–06:05 | Diagramu: mteja → pendekezo/oda/hati → uthibitishaji → hatua inayofuata | Kueleza nyaraka za mauzo kama muktadha wa kazi | Tumia `pale inapowezeshwa` kwa stock/finance. |
| 06:05–07:30 | Neema anaweka tofauti ya rasimu, mapitio, na uthibitisho wa mwisho | Kufundisha hatua zisikimbizwe | Dhana; si state ya UI. |
| 07:30–09:05 | Diagramu ya `mauzo ↔ stock ↔ fedha ↔ report` yenye nodes za dashed | Kueleza connection inaweza kuwepo kwa mikataba inayowezeshwa | Usidai cross-module post imetokea. |
| 09:05–10:30 | Checklist ya data quality: mteja, bidhaa/huduma, bei iliyoidhinishwa, owner wa hatua | Kutoa nidhamu ya kuingiza data | Hakuna mfano wa record halisi. |
| 10:30–12:00 | Scenario ya kubuniwa: Amina anaomba review kabla ya confirmation | Kueleza review na role boundary | Hakuna action ya live system. |
| 12:00–14:00 | Recap; kadi ya POS inaonekana kama daraja | Kufunga na kuanzisha Sura 08 | Sales concept pekee. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:30 — Utangulizi

> Mauzo si kubonyeza kitufe kimoja. Ni mfululizo wa kuelewa hitaji, kuandaa hati inayofaa, kupitia taarifa, na kufuata hatua inayofuata kwa uwajibikaji. Katika sura hii, tutatumia mfano wa dhana, si rekodi ya mteja au muamala halisi.

### 00:30–01:45 — Kuanzia na mteja, si na screen

> **Neema:** “Kabla ya kuunda hati ya mauzo, ninahitaji kuelewa kile mteja anahitaji, kilichoahidiwa, na nani anayewajibika kwa follow-up.”

> **Amina:** “Huo ni mwanzo sahihi. Mfumo unasaidia kuweka mazungumzo, nyaraka na hatua katika mpangilio; hauondoi haja ya maelezo sahihi na mapitio.”

### 01:45–03:05 — Taswira ya mtiririko

> Taswira hii inaeleza dhana. Inaonyesha kwamba mazungumzo yanaweza kugeuka kuwa hati ya biashara na baadaye kuhitaji mapitio. Haiwakilishi mteja, bidhaa, bei, malipo, ankara, au risiti iliyotengenezwa ndani ya SMART MANAGER.

### 03:05–04:20 — Mwelekeo wa Sales

> Frame iliyosafishwa inaonyesha eneo la Sales kwenye navigation. Content yote ya tenant imeondolewa. Hatuwezi kujua kutoka kwenye frame hii kama mtumiaji ana role gani, anaruhusiwa kufanya action gani, au kuna nyaraka ngapi za mauzo.

### 04:20–06:05 — Nyaraka na validation

> Kwa lugha rahisi, mauzo yanaweza kuhitaji kutunza mawasiliano ya mteja, hati ya pendekezo au oda, na uthibitishaji wa taarifa—*validation*—kabla ya hatua inayofuata. Chanzo cha mradi kinaonyesha mikataba ya nyaraka za mauzo, ankara, malipo na udhibiti wa billing. Hata hivyo, hatua ya stock au fedha hutegemea kama mikataba na usanidi husika vimewezeshwa kwa mazingira yanayotumika.

### 06:05–07:30 — Draft si confirmation

> **Neema:** “Je, nikishaandika hati, kazi imekamilika?”

> **Amina:** “Siyo lazima. Rasimu—*draft*—ni nafasi ya kuangalia maelezo. Mapitio—*review*—ni nafasi ya kuthibitisha wajibu na ubora. Uthibitisho wa mwisho—*confirmation*—au hatua ya baadaye lazima ifuate mchakato wa shirika na ruhusa zinazotumika.”

### 07:30–09:05 — Uhusiano na stock na fedha

> Tunapotaja mauzo, stock, fedha na ripoti kwenye mstari mmoja, tunaeleza **uhusiano unaowezekana** wa shughuli, si matokeo yaliyoonekana kwenye tenant. Pale mikataba inayohusika imewezeshwa, taarifa ya biashara inaweza kuhitaji kuonekana kwenye maeneo mengi kwa utaratibu unaokaguliwa. Hatutengenezi dai la posting au reconciliation bila ushahidi mahsusi.

### 09:05–10:30 — Ubora wa taarifa

> Kabla ya kuendelea, hakikisha unajua chanzo cha taarifa ya mteja, bidhaa au huduma inayohusika, bei au masharti yaliyoidhinishwa, na mtu anayemiliki hatua inayofuata. Usikisie maelezo, usitumie rekodi ya mtu mwingine kama template, na usionyeshe taarifa za mteja kwenye mafunzo.

### 10:30–12:00 — Scenario ya mafunzo

> **Neema:** “Nina mazungumzo ya mteja yaliyo tayari kwa review.”

> **Amina:** “Basi hakiki maelezo, tambua role inayotakiwa kwa hatua inayofuata, na utumie njia iliyowekwa na shirika. Usihamishe taarifa kwa njia zisizoidhinishwa, na usichukulie taswira ya maelezo kama uthibitisho wa muamala.”

### 12:00–14:00 — Hitimisho

> **Ulichojifunza:** Mauzo huanza na hitaji la mteja na maelezo sahihi; nyaraka zinahitaji validation na review; connection na stock au fedha inahitaji mikataba/usanidi unaofaa; na Sales navigation frame si uthibitisho wa role, record, au transaction.

> **Kinachofuata:** Sura ya 08 itaangalia Point of Sale—POS—kwa mtazamo wa register, item, validation, receipt/return paths na reconciliation, bila kuonyesha checkout halisi mpaka capture salama iidhinishwe.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:08 | `SALES: mazungumzo → hati → mapitio` | Kauli ya dhana; si workflow proof. |
| 01:58 | `TASWIRA YA MAELEZO` | Lazima ibaki kwenye workflow concept. |
| 03:22 | `UI ILIYOSAFISHWA: mwelekeo wa moduli pekee` | Onyesha kwenye Sales frame. |
| 04:40 | `Pale inapowezeshwa: stock / fedha` | Usibadilishe kuwa ahadi. |
| 06:20 | `Rasimu ≠ uthibitisho wa mwisho` | Isomeke kwa urahisi. |
| 12:20 | `ULICHOJIFUNZA` | Pointi nne, si zaidi ya mistari miwili kila moja. |

## Asset na QA

| Asset | Hali | Matumizi yanayoruhusiwa | Katazo |
|---|---|---|---|
| Sales workflow concept | Imehakikiwa | Daraja la dhana na narrative | Usiiite screenshot, invoice, payment, au receipt proof.[3] |
| Redacted Sales orientation frame | Imehakikiwa | Module-shell orientation | Usibofye, usionyeshe record, na usidai role/workflow result.[4] |
| Neema/Amina training characters | Imeidhinishwa | Mazungumzo ya scenario ya kubuniwa | Usitumie jina, kampuni, au data ya mteja halisi. |
| Fresh Sales UI capture | Haijapitishwa kwa sura hii | Inaweza kuongezwa tu baada ya capture-readiness gate | Hakuna private record, count, price, date, browser/account detail, au irreversible action. |

Mhariri athibitishe kwamba hakuna amount, invoice number, customer name, product string, payment provider, sale count, role assertion, au phrase inayodai matokeo ya muamala. SFX ya click itumike tu kwenye diagramu, si kuiga action ya UI isiyoonyeshwa.

## Marejeo

[1] [`build_book.py`](../smart-manager-book/build_book.py) — status ya Sales & Billing na connection boundaries.
[2] [`swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — V02, Sales workspace, na kanuni za evidence.
[3] [`operational-workflow-visual-review-20260826.md`](./operational-workflow-visual-review-20260826.md) — matumizi ya Sales concept kama cutaway ya dhana pekee.
[4] [`kmkm-redacted-output-privacy-review-20260826.md`](./kmkm-redacted-output-privacy-review-20260826.md) — approval na mipaka ya Sales orientation frame.
