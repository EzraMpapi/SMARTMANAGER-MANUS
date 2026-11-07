# Sura ya 10 — Inventory na Ghala

**Muda wa mpango:** 16:00.
**Hadhira:** Wasimamizi wa ghala, timu za ununuzi, wauzaji, na viongozi wanaohitaji kuelewa uendeshaji wa stock kwa utaratibu.
**Ahadi ya kujifunza:** Mtazamaji ataweza kueleza kwa dhana bidhaa, eneo la kuhifadhi, movement, transfer, kiwango cha kuagiza upya (reorder) na review ya stock bila kudai quantity, SKU, value, location, transaction, au stock availability ya tenant yoyote.

> **Mpaka wa ushahidi:** Inventory & Warehouse Management imeorodheshwa kama **imejengwa**, ikiwa na inventory movement na warehouse command-center surfaces zinazounganisha quantities za uendeshaji na Sales/Procurement. Hilo halithibitishi stock count, availability, transfer, reorder, warehouse location, au muamala wowote wa tenant.[1] [2]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:30 | Kadi ya `INVENTORY: kuona, kufuatilia, kupitia` | Kutaja mada na ukomo wa data | Motion graphic. |
| 00:30–01:50 | Juma na Amina kwenye mazingira ya ghala ya kubuniwa bila labels za bidhaa | Kuonyesha wajibu wa operational visibility | Wahusika na props za kubuniwa. |
| 01:50–03:20 | Inventory workflow concept yenye lebo `TASWIRA YA MAELEZO` | Kueleza location, movement na review kama dhana | Si stock screen, si count proof. |
| 03:20–04:35 | Redacted Inventory orientation frame; callout kwenye `Inventory` navigation shell | Kuelekeza module kwa usalama | Frame ya orientation tu; hakuna action/click. |
| 04:35–06:20 | Diagramu: item → eneo → movement → review | Kuweka vocabulary ya msingi | Hakuna SKU, quantity au location halisi. |
| 06:20–08:05 | Diagramu ya transfer na receiving, yenye label `pale inapowezeshwa` | Kueleza handoff ya uendeshaji | Usidai transfer/receipt halisi. |
| 08:05–09:40 | Kadi za kiwango cha kuagiza upya na mapitio ya exception | Kueleza trigger kama swali la review | Hakuna reorder level au alert halisi. |
| 09:40–11:20 | Uhusiano wa Sales, Procurement na Inventory kwa nodes za dashed | Kueleza uhusiano wa mikataba | Si uthibitisho wa cross-module posting. |
| 11:20–13:00 | Juma anaweka checklist ya data quality na count discipline | Kuzuia guesswork na duplicate records | Scenario ya kubuniwa. |
| 13:00–14:30 | Kadi ya capture gate ya Inventory detail screens | Kueleza ni nini kinahitajika kabla ya UI demo ya ndani | Transparency label. |
| 14:30–16:00 | Muhtasari na daraja la Stock Control | Kufunga sura | Kadi ya sura inayofuata. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:30 — Inventory kwa lugha rahisi

> Inventory ni nidhamu ya kujua bidhaa au vifaa vinavyohusika katika uendeshaji, mahali vinapopaswa kueleweka, na hatua zinazohitaji review. Katika sura hii, hatutaonyesha SKU, stock count, value, location, supplier, au record halisi.

### 00:30–01:50 — Uwepo wa bidhaa si namba pekee

> **Juma:** “Ninahitaji timu ijue kilicho katika mzunguko wa kazi na kinachohitaji kufuatiliwa. Lakini siwezi kuandika au kutangaza quantity ambayo haijapitiwa.”

> **Amina:** “Hiyo ndiyo tofauti kati ya operational visibility na kubahatisha. Mfumo unaweza kusaidia kupanga rekodi; ubora wa rekodi na review ya timu bado ni muhimu.”

### 01:50–03:20 — Taswira ya maelezo

> Sahani hii inaonyesha cartons, location pin na mzunguko wa movement kama **taswira ya maelezo**. Haiwakilishi warehouse yako, item zako, idadi ya stock, reorder alert, barcode, au transfer iliyofanyika kwenye SMART MANAGER.

### 03:20–04:35 — Module shell ya Inventory

> Frame iliyosafishwa inaonyesha tu mahali Inventory ilipo kwenye navigation. Header, profile, workspace content na dynamic badges vimeondolewa. Hatuwezi kutumia frame hii kudai kwamba mtumiaji ana ruhusa, kwamba record ipo, au kwamba movement imekamilika.

### 04:35–06:20 — Vocabulary ya msingi

> Fikiria item kama kitu kinachofuatiliwa kwa madhumuni ya kazi. Eneo ni mahali au muktadha wa uendeshaji. Movement ni mabadiliko yanayohitaji rekodi na review. Na review ni hatua ya kuangalia kama maelezo yanaeleweka kabla ya kufanya maamuzi. Maneno haya ni ya mafunzo, si data ya tenant.

### 06:20–08:05 — Transfer na receiving

> Transfer au receiving inaweza kuhitaji mchakato wa uthibitishaji, mtu mwenye jukumu na record inayolingana na sera ya kampuni. Pale mikataba inayohusika imewezeshwa, uhusiano huo unaweza kuonekana na shughuli za Procurement au Sales. Hatuonyeshi receipt, transfer document, quantity, au approval halisi.

### 08:05–09:40 — Reorder ni signal ya review

> Kiwango cha kuagiza upya—*reorder*—haimaanishi oda ya moja kwa moja. Ni ishara inayoweza kuhitaji kuangaliwa pamoja na matumizi, muda wa upatikanaji, sera ya kampuni na ruhusa za kufanya hatua. Usitengeneze threshold au alert kwenye video bila capture iliyoidhinishwa.

### 09:40–11:20 — Uhusiano unaowezekana

> Sales, Procurement na Inventory zinaweza kuhusiana pale mikataba na usanidi unaofaa vimewezeshwa. Mchoro huu unaonyesha uhusiano wa dhana, si proof kwamba sale fulani imepunguza stock au purchase fulani imeongeza quantity.

### 11:20–13:00 — Nidhamu ya ubora wa data

> **Juma:** “Kabla ya kutegemea record, thibitisha item inayohusika, chanzo cha movement, muktadha wa eneo, na mtu anayepaswa kupitia hatua. Usiongeze record inayofanana kwa kubahatisha, na usitumie taarifa ya tenant kama mfano wa mafunzo.”

### 13:00–14:30 — Capture gate ya screens za ndani

> UI demo ya Inventory detail screen itahitaji page iliyo-load kikamilifu, isiyo na SKU, quantity, price, location, supplier, user, date, document, alert count, browser identity au action isiyobadilika. Mpaka huo haujapitishwa katika pack hii.

### 14:30–16:00 — Hitimisho

> **Ulichojifunza:** Inventory inahitaji vocabulary na record discipline; movement, transfer na reorder ni maeneo ya review; Inventory frame ni orientation pekee; na connection na Sales/Procurement inategemea mikataba na usanidi unaofaa.

> **Kinachofuata:** Sura ya 11 itaingia kwenye Stock Control: count discipline, tofauti, exception review, adjustment boundary na uamuzi unaowajibika bila kuonyesha quantity au valuation ya tenant.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:08 | `INVENTORY: kuona, kufuatilia, kupitia` | Kichwa cha sura. |
| 02:05 | `TASWIRA YA MAELEZO` | Lazima ibaki kwenye Inventory concept. |
| 03:35 | `UI ILIYOSAFISHWA: mwelekeo wa moduli pekee` | Kaa kwenye Inventory frame. |
| 05:00 | `Item → eneo → movement → review` | Mfuatano wa dhana. |
| 08:20 | `Reorder ni signal ya review` | Usitumie namba au threshold. |
| 13:18 | `Inventory detail UI: BADO HAIJAPITISHWA` | Onyesha bila UI bandia. |

## Asset na QA

| Asset | Hali | Matumizi yanayoruhusiwa | Katazo |
|---|---|---|---|
| Inventory workflow concept | Imehakikiwa | Cutaway ya dhana | Usiiite warehouse screen, count, transfer au alert proof.[3] |
| Redacted Inventory orientation frame | Imehakikiwa | Module-shell orientation | Usidai role, item, quantity, location au movement result.[4] |
| Juma/Amina training characters | Imeidhinishwa | Scenario ya ghala ya kubuniwa | Hakuna product, supplier, quantity au company halisi. |
| Inventory detail UI | **Bado haijapitishwa** | Hairuhusiwi katika version hii | Inahitaji privacy gate na claim-to-screen match. |

Mhariri athibitishe kwamba hakuna SKU, barcode, count, unit, price, value, warehouse name, supplier, document, stock alert, date, user, chart value au “in stock” claim katika scene, subtitle au SFX.

## Marejeo

[1] [`build_book.py`](../smart-manager-book/build_book.py) — status ya Inventory & Warehouse Management na connection boundaries.
[2] [`swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — V04, Inventory workspace, na truthfulness rules.
[3] [`operational-workflow-visual-review-20260826.md`](./operational-workflow-visual-review-20260826.md) — matumizi ya Inventory concept kama dhana pekee.
[4] [`kmkm-redacted-output-privacy-review-20260826.md`](./kmkm-redacted-output-privacy-review-20260826.md) — approval na mipaka ya Inventory orientation frame.
