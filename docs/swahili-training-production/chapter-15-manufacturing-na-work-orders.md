# Sura ya 15 — Manufacturing na Work Orders

**Muda wa mpango:** 12:00.
**Hadhira:** Wasimamizi wa uzalishaji, operations leaders, warehouse teams, na wakurugenzi wanaohitaji kuelewa scope ya manufacturing kwa tahadhari.
**Ahadi ya kujifunza:** Mtazamaji ataweza kueleza kwa dhana input, work order, hatua ya kazi, review na output, huku akielewa kuwa Manufacturing & Work Orders imeorodheshwa kama **imejengwa kwa sehemu** na kwamba operational depth lazima ithibitishwe kwa deployment husika.

> **Mpaka wa ukweli:** Manufacturing & Work Orders ni **imejengwa kwa sehemu**. Chanzo kinatambua surface na persistence boundaries, lakini kinaelekeza kwamba operational depth ithibitishwe kwa deployment husika. Hivyo sura hii haitadai BOM, recipe, routing, production plan, machine state, quality result, work-order execution, stock consumption, output, costing, au approval ya live.[1]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:30 | Kadi ya `MANUFACTURING: imejengwa kwa sehemu` | Kutaja qualifier mapema | Label lazima ibaki. |
| 00:30–01:45 | Juma na David kwenye board ya kubuniwa yenye `input`, `kazi`, `review`, `output` | Kueleza language ya uzalishaji | Hakuna work order halisi. |
| 01:45–03:10 | Diagramu: input → work order concept → hatua → review → output | Kuweka thinking model | Si production screen. |
| 03:10–04:20 | V04 concept yenye boundary label | Kuonyesha relationship na operations | Si manufacturing proof. |
| 04:20–05:45 | Kadi ya `imejengwa kwa sehemu` dhidi ya `imehakikiwa kwa deployment` | Kueleza tofauti ya scope na evidence | Truthfulness card. |
| 05:45–07:10 | Scenario ya work order ya kubuniwa inayosubiri review | Kueleza kwamba record si execution result | Hakuna ID, quantity, cost au role. |
| 07:10–08:35 | Diagramu ya quality/review boundary | Kuzuia claims za quality result | Hakuna inspection output. |
| 08:35–09:55 | Nodes za Inventory/Procurement/Finance kwa dashed lines | Kueleza potential context | Si consumption/cost/posting proof. |
| 09:55–10:55 | Capture-gate card ya Manufacturing | Kueleza evidence inahitajika | UI haitumiki. |
| 10:55–12:00 | Recap na daraja la People/HR sequence | Kufunga chapter | Muktadha unaofuata. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:30 — Qualifier ya sura

> Katika SMART MANAGER, Manufacturing na Work Orders zimeorodheshwa kama **imejengwa kwa sehemu**. Hii ndiyo lebo ya ukweli wa sura: surface na persistence boundaries zinatambuliwa, lakini depth ya uendeshaji lazima ithibitishwe kwa deployment inayotumika. Hatuwezi kubadilisha label hii kuwa ahadi ya production workflow kamili.

### 00:30–01:45 — Lugha ya dhana

> **Juma:** “Kwa level ya mafunzo, tunaanza na input, kazi, mapitio na output. Lakini hatusemi kwamba item fulani imetumika, order imekamilika, au output imepokelewa.”

> **David:** “Sahihi. Hizi ni pointi za kufikiri. Kila deployment inaweza kuwa na scope, role, data na usanidi tofauti.”

### 01:45–03:10 — Work order kama dhana

> Mchoro huu unaweka work order kama concept ya kupanga kazi inayoweza kuhitaji input, hatua, review na output. Hatuonyeshi work-order screen, ID, product, recipe, quantity, cost, machine, operator, start/end time au status. Diagramu haijathibitisha kwamba execution path inafanya kazi katika mazingira ya live.

### 03:10–04:20 — Relationship ya operations

> V04 inatumika hapa kama visual ya high-level operations. Inaweza kusaidia kueleza kwamba manufacturing inaweza kugusa Inventory, Procurement au Finance. Lakini relationship hiyo ni ya dhana. Haitoi proof ya stock consumption, material issue, output receipt, costing, journal entry, or reconciliation.

### 04:20–05:45 — Scope dhidi ya deployment verification

> `Imejengwa kwa sehemu` inamaanisha hatusemi zaidi ya tulichothibitisha. Inaweza kuwa na surface na persistence boundaries, lakini capability ya kina—kama routing, quality, costing au execution—lazima ipitiwe kwa deployment husika. Uwazi huu hulinda mtazamaji dhidi ya kuchukulia UI au diagramu kama ahadi ya kila workflow.

### 05:45–07:10 — Scenario ya mafunzo

> **David:** “Tuna work order ya kubuniwa inayosubiri review. Hatutaweka quantity, cost, operator, hatua ya mashine, au approval. Tutafundisha tu swali la msingi: kazi hii inahitaji input gani, ni nani anaipitia, na ni evidence gani inahitajika kabla ya hatua inayofuata?”

### 07:10–08:35 — Quality na review boundary

> Quality ni eneo linalohitaji data, sera na evidence sahihi. Hatuonyeshi inspection, pass/fail, defect, batch, audit, au score. Tunafundisha kanuni: usibadilishe review ya ubora kuwa claim ya result bila source iliyoidhinishwa.

### 08:35–09:55 — Muktadha wa modules nyingine

> Inventory, Procurement na Finance zinaweza kuwa relevant kwa muktadha wa manufacturing, lakini mshale wa dashed unaonyesha tu mahali ambapo timu inaweza kuhitaji kuangalia zaidi. Hautoi proof ya material consumption, purchase linkage, cost allocation, posting, au report result.

### 09:55–10:55 — Capture gate

> Manufacturing UI haijapitishwa kwa sura hii. Kabla ya capture, page lazima isiwe na product, order, quantity, cost, location, operator, machine, formula, batch, quality result, user, date, dynamic count, error, debug text, credentials, au irreversible action. Deployment-level verification itahitajika pia.

### 10:55–12:00 — Hitimisho

> **Ulichojifunza:** Manufacturing & Work Orders imejengwa kwa sehemu; mchoro wa input, work order, review na output ni wa dhana; operational depth inahitaji deployment verification; na Manufacturing UI bado haijapitishwa kwa mafunzo haya.

> **Kinachofuata:** Kozi itaendelea kwenye People na HR, kisha Finance na Administration, kwa status labels, privacy gates na evidence boundaries zilezile.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:08 | `MANUFACTURING: IMEJENGWA KWA SEHEMU` | Label lazima ionekane. |
| 01:55 | `Input → work order concept → hatua → review → output` | `concept` ifafanuliwe kwenye narration. |
| 03:22 | `TASWIRA YA MAELEZO` | Kaa kwenye V04 concept. |
| 04:35 | `Scope ≠ deployment verification` | Contrast ya juu. |
| 07:25 | `Quality review ≠ quality result` | Usionyeshe data ya quality. |
| 10:08 | `Manufacturing UI: BADO HAIJAPITISHWA` | Hakuna UI bandia. |

## Asset na QA

| Asset | Hali | Matumizi yanayoruhusiwa | Katazo |
|---|---|---|---|
| V04 core-operations concept | Imehakikiwa | High-level operations relationship | Usiiite manufacturing, work-order, cost au inventory-consumption proof.[2] |
| David/Juma training characters | Imeidhinishwa | Scenario ya work order ya kubuniwa | Hakuna operator, product, quantity, machine au result halisi. |
| Deterministic manufacturing diagrams | Ya kutengenezwa wakati wa assembly | Scope/verification concept | Si production plan, routing au execution UI. |
| Manufacturing UI capture | **Bado haijapitishwa** | Hairuhusiwi katika version hii | Inahitaji privacy review na deployment-level capability verification. |

Mhariri athibitishe kwamba `imejengwa kwa sehemu` inaonekana kwenye opener, narrative, VTT na recap. Hakuna BOM, recipe, routing, product, work-order ID, quantity, cost, machine, operator, batch, quality result, date, user, action result au claim ya completion inayoonekana.

## Marejeo

[1] [`build_book.py`](../smart-manager-book/build_book.py) — Manufacturing & Work Orders status na deployment-verification qualifier.
[2] [`swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — V04 operations evidence boundary na Manufacturing partial-verification rule.
