# SMART MANAGER ERP — Msingi wa Assembly ya Animation: Sura 01–15

**Hali ya package:** Msingi wa assembly uliopitiwa na **pilot video fupi ya maelezo**. Huu **si** video master ya 8.5-hour iliyokamilika, wala si uthibitisho wa workflow hai, data, au UI feature.

## Madhumuni na mpaka wa uzalishaji

Msingi huu unaunganisha chapter packs za Sura 01–15 katika njia salama ya kuunda video ya mafunzo ya Kiswahili. Kila sura itaendelea kutoka script, asset boundary, VTT, audio, na QA hadi segment iliyopitiwa. Hakuna sura itakayounganishwa kwenye master timeline kwa sababu tu ina storyboard; lazima ipite gate ya ushahidi na faragha kwanza.

| Kipengele | Hali ya sasa | Kanuni ya matumizi |
|---|---|---|
| Chapter packs 01–15 | Ipo na imeandikwa | Chanzo cha script, VTT, QA, na evidence boundary. |
| Fictional training cast | Ipo, reviewed | Wahusika wa kubuniwa pekee; si watu halisi au profile za mtumiaji. |
| Sales / Inventory / Finance 3D plates | Ipo, reviewed | Explanatory cutaways; si proof ya live workflow. |
| Dashboard / Finance / Inventory / Sales frames | Redacted, reviewed | Module-shell orientation pekee; si records, data, role proof, au action proof. |
| Chapter 01 narration/theme masters | Inahitaji kurejeshwa kabla ya full assembly | Rekodi ya awali ipo kwenye manifest, lakini masters hazipo kwenye workspace iliyorejeshwa. |
| Chapter 02–15 narration masters | Hazijazalishwa | Zitengenezwe na kupitiwa kwa kila sura. |
| 01–15 animation pilot | Ipo nje ya Git | Text-free fictional course-opening clip; si chapter segment kamili wala master opening iliyokubaliwa. |

## Mfuatano wa assembly wa sura 01–15

| Sura | Mada | Visual inayoruhusiwa sasa | UI / workflow limit | Hali ya segment |
|---:|---|---|---|---|
| 01 | Utangulizi | Fictional cast, brand-safe entry orientation | Hakuna data au private UI | Script + prior audio record; media master kurejeshwa |
| 02 | Maono, tatizo na suluhisho | Character explanation, abstract operations motifs | Hakuna live claim | Pre-production ready |
| 03 | Mfumo unavyofanya kazi | Explanatory 2.5D sequence | Hakuna tenant or result proof | Pre-production ready |
| 04 | Architecture na multi-tenant | Abstract isolation concept | Hakuna tenant/role proof | Pre-production ready |
| 05 | Authentication na user management | Abstract security concept | Hakuna login session, user, credential au role proof | Pre-production ready |
| 06 | Dashibodi ya uongozi | Redacted dashboard shell + conceptual plate | Orientation only | Pre-production ready |
| 07 | Mauzo | Sales concept + redacted Sales shell | Hakuna customer, invoice, payment au sale proof | Pre-production ready |
| 08 | POS | Character/abstract point-of-sale explanation | POS UI bado haijapitishwa | Pre-production ready |
| 09 | CRM | Character/relationship concept | CRM UI bado haijapitishwa | Pre-production ready |
| 10 | Inventory na ghala | Inventory concept + redacted Inventory shell | Hakuna item, idadi, location, transfer au value proof | Pre-production ready |
| 11 | Stock Control | Abstract count-to-review sequence | Detail UI bado haijapitishwa | Pre-production ready |
| 12 | Reports | Abstract source-period-signal sequence | Report UI, export, schedule, delivery bado haijapitishwa | Pre-production ready |
| 13 | Procurement | Abstract supplier decision sequence | Vendor, quote, price, purchase, receipt, approval UI haijapitishwa | Pre-production ready |
| 14 | Supply Chain | Abstract movement network | Route, vehicle, GPS, delivery, fleet, schedule UI haijapitishwa | Pre-production ready |
| 15 | Manufacturing | Abstract work-order vocabulary | `imejengwa kwa sehemu`; hakuna production/costing/quality/live-work-order proof | Pre-production ready |

## Audio na subtitles ledger

Kiswahili cha Tanzania ndicho lugha kuu. Subtitle track hutolewa kwa VTT kutoka kwenye cue plan ya kila chapter pack baada ya narration kufungwa. Audio haipaswi kuhaririwa ili kuficha private data; private data hairuhusiwi kuingia kwenye source scene kabisa.

| Component | Hali | Gate kabla ya timeline |
|---|---|---|
| Narration | Sura 01 iliwahi kuzalishwa; masters zinahitaji kurejeshwa. Sura 02–15 bado. | Script review, terminology review, pronunciation check, no tenant/private references. |
| Music/SFX | Theme ya Sura 01 iliwahi kuzalishwa; master inahitaji kurejeshwa. | Original / licensable, voice clarity, no false urgency or product-performance implication. |
| VTT | Cue plans zipo ndani ya packs. | Caption-to-audio sync, Kiswahili-first terminology, screen/action boundary check. |
| UI scenes | Redacted shell frames pekee kwa modules zilizopitiwa. | No visible identifiers, numbers, records, dates, dynamic badges, credentials, errors, debug text, or actions. |

## Gate ya chapter segment

Kila segment inahitaji kupita hatua zote tano kwa mpangilio: **script locked**, **visual source approved**, **audio/VTT synchronized**, **privacy and claim QA passed**, kisha **editorial approval**. Uzalishaji usiokidhi hatua hizi hubaki kwenye storyboard au conceptual animation; hauunganishwi kama evidence ya mfumo.

## Pilot video ya review

Pilot ya sekunde 10 imeundwa kama opening motion study isiyo na maandishi au sauti. Inaonyesha wahusika wa kubuniwa kwenye studio ya charcoal-emerald yenye props za dhana za inventory, ledger, shield, collaboration, na report. Haionyeshi UI, logo, rekodi, namba, majina, result, au transaction. Video iko nje ya Git na imeorodheshwa kwenye [`animation-asset-ledger.md`](./animation-asset-ledger.md).

> **Uamuzi wa QA:** Pilot inaweza kutumiwa kwa review ya tone, character continuity, pacing, na visual language pekee. Haiwezi kutumiwa kutangaza kwamba Chapters 01–15 zimekuwa video kamili, au kwamba SMART MANAGER imetekeleza workflow yoyote iliyoonyeshwa kwa props za dhana.

## Next controlled assembly action

Anza na kurejesha masters za Chapter 01, kuzi-sync na VTT ya Chapter 01, na kufanya chapter-level privacy/claim review. Kisha uzalishe audio na visual packages za Chapters 02–15, kwa sura moja baada ya nyingine, kabla ya kutengeneza master edit.

## Marejeo

[1] [`../swahili-training-course-architecture-20260826.md`](../swahili-training-course-architecture-20260826.md) — 48-chapter / 510-minute course architecture.
[2] [`../swahili-training-asset-and-feature-register-20260826.md`](../swahili-training-asset-and-feature-register-20260826.md) — asset provenance and feature boundary register.
[3] [`kmkm-redacted-output-privacy-review-20260826.md`](./kmkm-redacted-output-privacy-review-20260826.md) — approved redacted orientation-frame boundary.
[4] [`chapter-01-15-terminology-audit.md`](./chapter-01-15-terminology-audit.md) — canonical Kiswahili-first terminology through Chapter 15.
