# Sura ya 14 — Supply Chain

**Muda wa mpango:** 12:00.
**Hadhira:** Timu za operations, logistics, wasimamizi wa ghala, na viongozi wanaoratibu handoff za biashara.
**Ahadi ya kujifunza:** Mtazamaji ataweza kueleza kwa dhana mnyororo wa ugavi kupitia source, handoff, movement, exception na coordination, bila kudai vehicle, route, GPS, delivery, fleet record, schedule, dispatcher, driver, location, au control result ya tenant yoyote.

> **Mpaka wa ushahidi:** Supply Chain & Fleet imeorodheshwa kama **imejengwa**, kwa source na controls zinazoshughulikia operational fleet records na scheduled controls. Kwa pack hii, hakuna UI capture ya Supply Chain/Fleet iliyopitiwa kwa faragha; uwezo huo hautumiki kuthibitisha route, delivery, vehicle availability, GPS, driver, or scheduled-control result.[1] [2]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:25 | Kadi ya `SUPPLY CHAIN: handoff, muktadha, coordination` | Kutaja mada | Motion graphic. |
| 00:25–01:35 | David na Juma kwenye board ya kubuniwa ya handoff | Kueleza chain kama coordination | Hakuna route/location. |
| 01:35–02:55 | Diagramu: source → handoff → movement → exception → follow-up | Kuweka vocabulary | Diagramu ya elimu. |
| 02:55–04:10 | V04 concept kwa lebo ya dhana | Kuunganisha supply chain na operations | Si logistics screen. |
| 04:10–05:35 | Kadi za “visibility” na “muktadha” | Kuzuia misconception ya real-time tracking | Hakuna GPS/telemetry. |
| 05:35–07:00 | Scenario ya handoff iliyochelewa ya kubuniwa | Kueleza exception review | Hakuna delivery record. |
| 07:00–08:30 | Diagramu ya coordination na escalation | Kufundisha owner na follow-up | Si dispatcher/role proof. |
| 08:30–09:55 | Fleet/schedule boundary card | Kueleza controls bila overclaim | Inahitaji UI capture na configuration evidence. |
| 09:55–10:55 | Checklist ya taarifa salama | Kulinda route, person na customer context | Scenario ya kubuniwa. |
| 10:55–12:00 | Recap na daraja la Manufacturing | Kufunga sura | Manufacturing qualifier inaandaliwa. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:25 — Supply Chain ni mfululizo wa handoff

> Mnyororo wa ugavi si mstari wa ramani pekee. Ni namna ya kuunganisha source, handoff, movement, exception na coordination. Kwa sura hii, tunafundisha dhana. Hatuonyeshi vehicle, route, GPS, driver, location, delivery, schedule au operational fleet record.

### 00:25–01:35 — Handoff inahitaji owner

> **David:** “Kazi inapohama kutoka upande mmoja kwenda mwingine, tunahitaji kujua nini kinahamishwa, ni nani anapokea muktadha, na hatua inayofuata ni ipi.”

> **Juma:** “Hiyo ndiyo handoff nzuri. Haitegemei kumbukumbu za mdomo pekee; inahitaji maelezo yanayoruhusiwa na owner anayejulikana.”

### 01:35–02:55 — Mnyororo wa dhana

> Mchoro unaonyesha source, handoff, movement, exception, na follow-up. `Movement` hapa ni wazo la mabadiliko ya uendeshaji, si GPS trail au vehicle trip. `Exception` ni signal ya review, si hukumu ya delivery failure. `Follow-up` ni ufuatiliaji wenye owner na muktadha.

### 02:55–04:10 — Uhusiano na shughuli kuu

> V04 inaonyesha high-level operations chain. Tunaitumia kueleza kwamba supply chain inaweza kuhitaji kuzungumza na stock, procurement au shughuli nyingine. Hii haimaanishi kwamba integration, route optimization, stock movement, au fulfillment imethibitishwa katika mazingira ya live.

### 04:10–05:35 — Visibility si ufuatiliaji wa moja kwa moja

> Neno visibility linaweza kumaanisha uwezo wa timu kuona muktadha unaofaa. Katika sura hii, halimaanishi real-time location, GPS, vehicle status, map, or delivery confirmation. Capabilities za data na UI lazima zionyeshwe tu baada ya capture salama na usanidi husika kuthibitishwa.

### 05:35–07:00 — Exception review

> **David:** “Tukiona handoff haijakamilika, hatutungi sababu wala kuonyesha mtu fulani amekosea. Tunaweka exception, tunapitia muktadha, na tunajua owner wa hatua inayofuata.”

> Huu ni scenario wa kubuniwa. Haina customer, consignment, dispatch, route, time, au delivery data.

### 07:00–08:30 — Coordination na escalation

> Coordination ni kutengeneza picha moja ya hatua inayofuata. Escalation ni kupeleka issue kwa role au mwenye jukumu sahihi pale inapohitajika. Diagramu haithibitishi role, notification, task creation, scheduled job, au outcome ya escalation.

### 08:30–09:55 — Fleet na schedule boundary

> Chanzo cha mradi kinaonyesha operational fleet records na scheduled controls. Lakini pack hii haitoi dai la vehicle availability, driver management, route plan, schedule execution, location, mawasiliano, au control outcome. Uwezo wowote wa aina hiyo unaweza kuhitaji usanidi na UI evidence iliyopitiwa.

### 09:55–10:55 — Taarifa salama

> Usisambaze route, address, jina la dereva, namba ya gari, customer context, phone, ETA, au document ya usafirishaji kwenye mafunzo. Tumia scenario ya kubuniwa na labels za jumla ili ufundishe coordination bila kuathiri faragha au usalama wa uendeshaji.

### 10:55–12:00 — Hitimisho

> **Ulichojifunza:** Supply Chain inahusu handoff na coordination; movement na exception ni dhana zinazohitaji muktadha; visibility si automatically real-time tracking; na Supply Chain/Fleet UI bado haijapitishwa kwa mafunzo haya.

> **Kinachofuata:** Sura ya 15 itaangalia Manufacturing na Work Orders kwa qualifier wazi ya imejengwa kwa sehemu, bila kudai uwezo wa kina ambao haujathibitishwa kwa deployment husika.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:08 | `SUPPLY CHAIN: handoff, muktadha, coordination` | Kichwa cha sura. |
| 01:48 | `Source → handoff → movement → exception → follow-up` | Dhana, si route trace. |
| 03:08 | `TASWIRA YA MAELEZO` | Kaa kwenye V04 concept. |
| 04:25 | `Visibility ≠ real-time tracking` | Usitumie GPS icon kama proof. |
| 08:45 | `Fleet / schedule: inahitaji evidence na usanidi` | Usiweke status ya success. |
| 10:10 | `Supply Chain UI: BADO HAIJAPITISHWA` | Hakuna UI bandia. |

## Asset na QA

| Asset | Hali | Matumizi yanayoruhusiwa | Katazo |
|---|---|---|---|
| V04 core-operations concept | Imehakikiwa | High-level operations narrative | Usiiite route, delivery, GPS, fleet au integration proof.[3] |
| David/Juma training characters | Imeidhinishwa | Handoff scenario ya kubuniwa | Hakuna driver, customer, vehicle au route halisi. |
| Deterministic supply-chain diagrams | Ya kutengenezwa wakati wa assembly | Handoff/exception/coordination concepts | Si tracking screen au schedule result. |
| Supply Chain/Fleet UI | **Bado haijapitishwa** | Hairuhusiwi katika version hii | Inahitaji privacy review, safe demo state na configuration evidence. |

Mhariri athibitishe kwamba hakuna vehicle, plate, route, map, address, GPS coordinate, driver, customer, phone, ETA, delivery, dispatch, schedule, fuel, mileage, event count, date, user au notification katika visual, narration au subtitle.

## Marejeo

[1] [`build_book.py`](../smart-manager-book/build_book.py) — status ya Supply Chain & Fleet na fleet-control scope.
[2] [`swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — Operations eligibility na fresh-capture constraints.
[3] [`swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — V04 evidence boundary.
