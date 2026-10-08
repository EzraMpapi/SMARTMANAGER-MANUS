# Sura ya 13 — Ununuzi (Procurement) na Wasambazaji

**Muda wa mpango:** 14:00.
**Hadhira:** Timu za ununuzi, wasimamizi wa ghala, wasimamizi wa fedha, na viongozi wanaosimamia ufuatiliaji wa mahitaji ya biashara.
**Ahadi ya kujifunza:** Mtazamaji ataweza kueleza kwa dhana safari ya hitaji la ununuzi—uhitaji, mtoa huduma au muuzaji, mapitio, hati ya ununuzi, upokeaji, na ufuatiliaji—bila kudai msambazaji, nukuu ya bei, bei, agizo la ununuzi, ankara, idhini, risiti au matokeo ya kuunganisha moduli ya kampuni yoyote.

> **Mpaka wa ushahidi:** Procurement & Vendor Management imeorodheshwa kama **imejengwa**, ikiwa na mipaka ya persistence ya procurement na vendor workflows zinazounganisha ununuzi na stock/finance. Hilo halithibitishi vendor fulani, offer, price, purchase order, receipt, financial posting, approval, au reconciliation iliyofanyika.[1]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:30 | Kadi ya `UNUNUZI: hitaji, mapitio, ufuatiliaji` | Kutaja mada na kanuni ya ukweli | Motion graphic. |
| 00:30–01:45 | Juma na Amina wakitazama board ya kubuniwa yenye `hitaji` na `review` pekee | Kuanza na mahitaji ya kazi | Hakuna vendor, quote au price. |
| 01:45–03:05 | V04 core-operations concept yenye lebo `TASWIRA YA MAELEZO` | Kuonyesha ununuzi katika mnyororo wa dhana | Si procurement screen wala transaction proof. |
| 03:05–04:30 | Diagramu: hitaji → source → mapitio → hati → upokeaji → follow-up | Kuweka vocabulary | Hakuna PO, GRN au approval detail. |
| 04:30–06:00 | Scenario ya mtoa huduma wa kubuniwa na criteria za mapitio | Kueleza ubora wa source | Hakuna supplier identity au ranking. |
| 06:00–07:30 | Kadi ya `hati ya ununuzi si ruhusa ya mwisho` | Kutofautisha draft, review na hatua inayofuata | Dhana; si UI state. |
| 07:30–09:00 | Nodes za dashed: Procurement ↔ Inventory ↔ Finance | Kueleza uhusiano unaowezekana | Si cross-module posting proof. |
| 09:00–10:40 | Diagramu ya upokeaji na exception review | Kueleza kupokea kama hatua ya uthibitishaji | Hakuna quantity, value au receipt. |
| 10:40–12:00 | Amina anaweka checklist ya data quality | Kuzuia duplicate, guesswork na off-system sharing | Scenario ya kubuniwa. |
| 12:00–14:00 | Capture-gate card na recap | Kufunga Procurement na kuingia Supply Chain | Hakuna Procurement UI iliyopitiwa. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:30 — Procurement ni mpangilio wa uamuzi

> Ununuzi wa biashara—Procurement—huanza na hitaji linaloeleweka. Hapa hatufundishi jinsi ya kuunda agizo halisi; tunafundisha mnyororo wa maamuzi, mapitio na uwajibikaji. Hakuna msambazaji, nukuu ya bei, bei, agizo, ankara au risiti halisi itakayoonekana.

### 00:30–01:45 — Hitaji kabla ya hati

> **Juma:** “Kabla ya hati yoyote, tunahitaji kujua kwa nini hitaji lipo, linahusu nini, na ni nani anapaswa kulipitia.”

> **Amina:** “Ndiyo. Hati ni sehemu ya mchakato, si mbadala wa muktadha. Bila hitaji lililo wazi na mapitio sahihi, taarifa inaweza kuonekana imepangwa lakini isiwe tayari kwa hatua inayofuata.”

### 01:45–03:05 — Taswira ya shughuli kuu

> Taswira hii ya shughuli kuu inaunganisha mauzo, stock, procurement na fedha katika kiwango cha dhana. Haionyeshi vendor workflow, receipt, posting, reconciliation, au matokeo ya muamala. Inasaidia mtazamaji kuona kwamba ununuzi haupo peke yake; unaweza kuhitaji kuhusiana na maeneo mengine pale mikataba na usanidi unaofaa vimewezeshwa.

### 03:05–04:30 — Vocabulary ya safari ya ununuzi

> Safari ya dhana ni: hitaji, chanzo—source—mapitio, hati, upokeaji, na ufuatiliaji. Chanzo hapa kina maana ya mahali pa kupata taarifa au mtoa huduma anayepitiwa kwa madhumuni sahihi. Hati ni rekodi ya hatua; haimaanishi idhini ya moja kwa moja. Upokeaji unahitaji uthibitishaji wa kilichohusika. Ufuatiliaji unaweka hatua inayofuata wazi.

### 04:30–06:00 — Mapitio ya source

> **Amina:** “Usichague source kwa kubahatisha. Tumia vigezo vya shirika, kusanya maelezo yanayoruhusiwa, na uache mapitio yawe sehemu ya mchakato.”

> Hii ni scenario ya mafunzo. Hatuonyeshi msambazaji, mawasiliano, nukuu ya bei, mpangilio wa tathmini, maelezo ya benki, maelezo ya kodi, au makubaliano halisi.

### 06:00–07:30 — Hati si ruhusa ya mwisho

> Hati ya ununuzi inaweza kuwa rasimu au rekodi inayosubiri mapitio. Haihakikishi kwamba idhini imepatikana, kwamba fedha zimeidhinishwa, au kwamba bidhaa zimepokelewa. Hatua inayofuata huongozwa na sera, jukumu na usanidi wa mazingira yanayotumika.

### 07:30–09:00 — Uhusiano na Inventory na Finance

> Procurement inaweza kuhusiana na Inventory na Finance pale mikataba husika inapowezeshwa. Mstari huu wa dashed unaonyesha uwezekano wa muktadha wa kazi, si proof kwamba order imesababisha stock movement au financial posting. Hakuna claim ya reconciliation inayotolewa.

### 09:00–10:40 — Upokeaji na exception review

> Upokeaji unauliza swali: je, kilichorekodiwa kinaendana na kilichohitajiwa na kilichopitiwa? Tofauti inahitaji mapitio; haimaanishi kubadilisha rekodi haraka au kutoa lawama. Hatuonyeshi skrini ya upokeaji, idadi, thamani, tofauti, au tukio la idhini.

### 10:40–12:00 — Ubora na uwajibikaji

> Kabla ya kuendelea, thibitisha hitaji, chanzo kinachopitiwa, hatua ya mapitio, na mwenye jukumu la ufuatiliaji. Usitumie taarifa ya msambazaji au mteja wa kampuni kama mfano wa mafunzo. Usihamishe taarifa nyeti kwa njia isiyoidhinishwa ili kuharakisha mchakato.

### 12:00–14:00 — Hitimisho

> **Ulichojifunza:** Procurement huanza na hitaji, si na hati; source, mapitio, upokeaji na ufuatiliaji ni hatua tofauti; uhusiano na Inventory/Finance unategemea mikataba na usanidi; na Procurement UI bado haijapitishwa kwa mafunzo haya.

> **Kinachofuata:** Sura ya 14 itaangalia Supply Chain—mnyororo wa ugavi—kwa dhana ya handoff, visibility, exception na coordination, bila kudai route, vehicle, delivery au fleet result halisi.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:08 | `UNUNUZI: hitaji, mapitio, ufuatiliaji` | Kichwa cha sura. |
| 01:58 | `TASWIRA YA MAELEZO` | Lazima ibaki kwenye V04 cutaway. |
| 03:18 | `Hitaji → chanzo → mapitio → hati → upokeaji` | Mfuatano wa dhana. |
| 06:18 | `Hati ≠ ruhusa ya mwisho` | Contrast ya juu. |
| 07:45 | `Pale inapowezeshwa: Procurement ↔ Inventory ↔ Finance` | Usibadilishe kuwa ahadi. |
| 12:18 | `Procurement UI: BADO HAIJAPITISHWA` | Hakuna UI bandia. |

## Asset na QA

| Asset | Hali | Matumizi yanayoruhusiwa | Katazo |
|---|---|---|---|
| V04 core-operations concept | Imehakikiwa | Cutaway ya dhana ya operations chain | Usiiite vendor, PO, receipt, posting au reconciliation proof.[2] |
| Juma/Amina training characters | Imeidhinishwa | Scenario ya hitaji na mapitio ya kubuniwa | Hakuna supplier, quote, price au company data halisi. |
| Deterministic procurement diagrams | Ya kutengenezwa wakati wa assembly | Vocabulary na review boundary | Si Procurement UI au approval event. |
| Procurement UI capture | **Bado haijapitishwa** | Hairuhusiwi katika version hii | Inahitaji source-safe, no-record, no-action capture review. |

Mhariri athibitishe kwamba hakuna supplier name, contact, address, quotation, price, currency, item, purchase order, invoice, receipt, payment, bank, tax, date, user, approval, signature, document ID au delivery claim katika visual, subtitle au narration.

## Marejeo

[1] [`build_book.py`](../smart-manager-book/build_book.py) — status ya Procurement & Vendor Management na connection boundaries.
[2] [`swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — V04 matumizi na operations truthfulness rules.
