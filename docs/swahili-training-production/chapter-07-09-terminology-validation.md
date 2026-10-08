# Sura 07–09: Ukaguzi wa Kiswahili na Uthabiti wa Istilahi

**Tarehe ya ukaguzi:** 26 Agosti 2026
**Upeo:** Sura 07 — Sales; Sura 08 — Point of Sale (POS); Sura 09 — CRM na Mahusiano ya Wateja.
**Matokeo:** **Imepita baada ya marekebisho ya istilahi.** Sura zote tatu zinatumia Kiswahili cha Tanzania kama lugha ya kwanza; istilahi za Kiingereza zimeachwa tu pale zinapotaja jina la moduli, brand, au zinawekwa baada ya maana ya Kiswahili mara ya kwanza.

## Mbinu ya ukaguzi

Ukaguzi ulipitia kichwa, ahadi ya kujifunza, storyboard, narration, VTT/callout, asset/QA, na marejeo ya kila sura. Kila istilahi yenye uwezo wa kuathiri hatua ya mtumiaji ilikaguliwa kwa maana, uwiano wa matumizi, na kama inaweza kuleta claim ya workflow au data ambayo haijaonyeshwa kwa usalama.

> Kanuni ya uandishi wa kozi ni: **Kiswahili hutangulia; Kiingereza hufuata mara ya kwanza tu pale kinaposaidia kutambua istilahi ya kiufundi.** Brand names, majina ya moduli, na lebo zilizo katika source reference hazigeuzwi kuwa claim mpya ya bidhaa.[1]

## Rejesta ya istilahi iliyosanifiwa

| Eneo | Istilahi sanifu ya Kiswahili | Kiingereza kinachoruhusiwa | Matumizi yaliyoidhinishwa |
|---|---|---|---|
| Sales | uthibitishaji | validation | Baada ya Kiswahili mara ya kwanza; hutumika kwa review ya taarifa, si success claim. |
| Sales | rasimu | draft | Hatua ya kuangalia maelezo kabla ya hatua inayofuata. |
| Sales | mapitio | review | Ukaguzi wa wajibu, ubora na muktadha. |
| Sales | uthibitisho wa mwisho | confirmation | Hatua ya baadaye inayofuata mchakato na ruhusa. |
| POS | rejista ya mauzo | register | Muktadha wa kaunta; si register ID au live state. |
| POS | bidhaa au huduma | item | Neno la kawaida badala ya item ya Kiingereza. |
| POS | muamala | transaction | Dhana ya mchakato; si muamala uliothibitishwa. |
| POS | marejesho | return | Path inayotegemea sera na ruhusa. |
| POS | mkopo wa mteja | credit | Path inayotegemea sera na ruhusa. |
| POS | ulinganifu wa rekodi | reconciliation | Mapitio ya muktadha, si report au cash result. |
| CRM | ishara ya awali | lead | Hufafanuliwa mara ya kwanza katika promise ya sura. |
| CRM | mawasiliano | contact | Hufafanuliwa kama upande wa mawasiliano wenye madhumuni sahihi. |
| CRM | fursa ya biashara | opportunity | Hufafanuliwa mara ya kwanza katika promise na narration. |
| CRM | ufuatiliaji | follow-up | Hufafanuliwa kama hatua iliyopangwa. |
| CRM | mfuatano | pipeline | Hufafanuliwa kama hatua zinazopitiwa, si stage za tenant. |

## Marekebisho yaliyofanywa

Sura 07 ilibadilisha kauli za awali za `quote/order/document`, `validation`, `draft`, `review`, na `confirmation` ili Kiswahili—pendekezo, oda, hati, uthibitishaji, rasimu, mapitio, na uthibitisho wa mwisho—kitangulie. Sura 08 ilisanifisha `register`, `item`, `validation`, `transaction`, `receipt`, `return`, `credit`, na `reconciliation` kuwa rejista ya mauzo, bidhaa/huduma, uthibitishaji, muamala, risiti, marejesho, mkopo wa mteja, na ulinganifu wa rekodi. Sura 09 ilifafanua lead, contact, opportunity, follow-up na pipeline kwa Kiswahili katika ahadi ya kujifunza na narration ya kwanza.

Marekebisho hayo hayakubadilisha mipaka ya ushahidi. Sura 07 bado hutumia Sales orientation frame kwa mwelekeo wa moduli pekee. Sura 08 haina POS UI capture iliyoidhinishwa. Sura 09 haina CRM UI capture iliyoidhinishwa; mawasiliano ya mteja, owner, pipeline data na record detail havionyeshwi.[2] [3] [4]

## Uthabiti na claim-safety

| Kipimo | Matokeo | Uamuzi wa ukaguzi |
|---|---|---|
| Lugha ya kwanza | Kiswahili cha Tanzania | Imepita. |
| Istilahi za POS/CRM | Kiswahili kilitangulia kwenye matumizi ya kwanza | Imepita baada ya marekebisho. |
| Brand na majina ya moduli | SMART MANAGER, Sales, POS, CRM | Zinabaki kama labels sahihi za product/course. |
| Privacy vocabulary | `imeidhinishwa`, `bado haijapitishwa`, `orientation pekee`, `taswira ya maelezo` | Imepita; matumizi ni thabiti. |
| Overclaim | Hakuna live checkout, payment, receipt, contact, pipeline, role, au workflow success claim | Imepita. |

## Matokeo ya QA ya baadaye

Kabla ya narration kurekodiwa, msomaji atumie `mfuatano` kwa pipeline, `ufuatiliaji` kwa follow-up, `ulinganifu wa rekodi` kwa reconciliation, na `uthibitishaji` kwa validation. Kiingereza kinapotamkwa, kifuate maana ya Kiswahili mara ya kwanza na kisiwekewe mkazo unaodai capability mpya. VTT lazima iendelee kutumia Kauli fupi za Kiswahili; istilahi ndefu ziwekwe kwenye narration badala ya kulazimishwa kwenye screen.

## Marejeo

[1] [`swahili-training-course-architecture-20260826.md`](../swahili-training-course-architecture-20260826.md) — kanuni ya Kiswahili-kutangulia na capture-readiness gate.
[2] [`chapter-07-sales-kutoka-mteja-hadi-ankara.md`](./chapter-07-sales-kutoka-mteja-hadi-ankara.md) — Sales terminology na evidence boundary.
[3] [`chapter-08-point-of-sale.md`](./chapter-08-point-of-sale.md) — POS terminology na no-live-checkout gate.
[4] [`chapter-09-crm-na-mahusiano-ya-wateja.md`](./chapter-09-crm-na-mahusiano-ya-wateja.md) — CRM terminology na no-contact-data gate.
