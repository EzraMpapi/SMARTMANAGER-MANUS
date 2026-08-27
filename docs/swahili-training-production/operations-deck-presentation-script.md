# SMART MANAGER ERP: Sura 10–12 — Script ya Uwasilishaji

**Hadhira:** Wadau wa kozi, timu za operations, wasimamizi wa ghala, viongozi wa biashara na wahakiki wa uzalishaji.
**Muda unaopendekezwa:** Dakika 8–10.
**Kanuni ya uwasilishaji:** Tumia Kiswahili cha Tanzania na istilahi ya Kiingereza baada ya maana ya Kiswahili inapohitajika. Taswira ya 3D hueleza dhana pekee. Frame iliyosafishwa ya Inventory ni orientation ya module shell pekee. Usidai stock movement, transfer, adjustment, count, report, export, schedule, delivery, role, transaction, KPI au result iliyothibitishwa.

## Slide 1 — SMART MANAGER ERP: Sura 10–12

> Karibuni kwenye muhtasari wa Sura 10 hadi 12: Inventory, Stock Control na Reports. Hizi ni chapter packs za uzalishaji zenye storyboard, narration, VTT, asset boundary na QA. Zinaweka msingi wa operations kwa Kiswahili cha Tanzania, lakini si video master iliyokamilika. Katika kila slide, tunatenganisha taswira ya maelezo, orientation ya UI iliyosafishwa, na evidence inayosubiri approval.

## Slide 2 — Operations huanza na uaminifu wa rekodi

> Operations huanza na uaminifu wa rekodi. Inventory husaidia kueleza bidhaa, eneo na mzunguko. Stock Control huweka tofauti na marekebisho chini ya mapitio. Reports husaidia kuelewa chanzo na kipindi. Huu ni mfuatano wa mafunzo; hauthibitishi kwamba idadi, value, transfer, approval, report, export au delivery imetokea kwenye mazingira yoyote.

## Slide 3 — Taswira inaeleza; UI iliyosafishwa huelekeza

> V04 ni taswira ya maelezo ya uhusiano wa shughuli kuu. Inaweza kueleza muktadha kati ya sales, stock, procurement na finance, lakini haiwezi kuthibitisha cross-module transaction au reconciliation. Frame ya Inventory iliyosafishwa inaruhusiwa kwa navigation shell pekee. Stock-detail na Reports UI bado hazijapitishwa. Hivyo, dhana na mipaka ya ushahidi ndiyo inayoongoza uwasilishaji huu.

## Slide 4 — Sura 10: Inventory huunganisha muktadha na nidhamu

> Sura ya Inventory inaanza na bidhaa, eneo, mzunguko na kiwango cha kuagiza upya—reorder. Hizi ni istilahi za kueleza muktadha wa uendeshaji. Hatuonyeshi item record, SKU, quantity, warehouse location, movement, transfer, adjustment au value. Inventory shell iliyosafishwa haiwakilishi data ya ndani wala mfuatano wa vitendo. Kila action ya baadaye inahitaji capture salama na ushahidi unaolingana na script.

## Slide 5 — Sura 11: Stock Control inalinda mapitio ya tofauti

> Stock Control hufundisha idadi—count—rekodi, tofauti, marekebisho ya rekodi—adjustment—na idhini. Tofauti haimaanishi kosa la mtu wala ruhusa ya kurekebisha data. Inahitaji chanzo, mapitio na jukumu sahihi. Hakuna count, approval, location, item, value, adjustment event au audit outcome inayoonyeshwa. Mchoro wa dhana unaeleza hatua bila kuiga UI au hali halisi ya stock.

## Slide 6 — Sura 12: Ripoti huanza na chanzo na kipindi

> Ripoti—report—huanza na swali: chanzo ni kipi, kipindi ni kipi, ishara inamaanisha nini, na ni nani anafuata? Export, schedule na delivery zinaweza kuwa labels za uwezo unaowezekana, lakini si ushahidi wa execution. Hatuonyeshi report UI, filter, amount, metric, customer, employee, date, download, email au recipient. Hii inalinda tafsiri sahihi ya ripoti bila kuchanganya visual na matokeo.

## Slide 7 — Gates za ushahidi hulinda operations

> Gates za ushahidi hulinda operations dhidi ya overclaim. Inventory ina module-shell orientation frame iliyosafishwa. Stock-detail UI na Reports UI bado hazijapitishwa. Kabla ya UI mpya kutumika, screen lazima iwe fully loaded na isiwe na record, private data, credentials, error, debug text, dynamic counts, au irreversible action. Kile kinachosemwa lazima kilingane na kinachoonekana; vinginevyo, tunabaki kwenye taswira ya dhana.

## Slide 8 — Operations master hujengwa kwa QA ya sura

> Njia ya assembly ni script na asset boundary, ikifuatiwa na safe UI review, VTT na audio sync, halafu QA na approval ya sura. Nidhamu hii inalinda accuracy ya Kiswahili, faragha ya data, na truthfulness ya capability. Sura 10 hadi 12 zinaweza kuendelea kupanuliwa, lakini hakutakuwa na dai la live operations, complete workflow au report result kabla ya evidence gate yake kupita.

## Marejeo

[1] [`operations-deck-outline.md`](./operations-deck-outline.md) — muundo wa deck ya Slides 01–08.
[2] [`chapter-10-inventory-na-ghala.md`](./chapter-10-inventory-na-ghala.md) — Inventory evidence boundary.
[3] [`chapter-11-stock-control.md`](./chapter-11-stock-control.md) — Stock Control no-live-detail gate.
[4] [`chapter-12-reports.md`](./chapter-12-reports.md) — Reports no-UI/no-export-proof gate.
