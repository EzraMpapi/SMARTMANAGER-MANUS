# SMART MANAGER ERP: Msingi wa Kozi ya Kiswahili — Script ya Uwasilishaji

**Hadhira:** Wadau wa kozi, viongozi wa biashara, na timu ya uzalishaji.
**Muda unaopendekezwa:** Dakika 10–12.
**Kanuni ya uwasilishaji:** Tumia Kiswahili cha Tanzania, ongea kwa utulivu, na usibadilishe taswira ya 3D au frame iliyosafishwa kuwa dai la workflow, role, KPI, integration, provider, transaction, au data halisi.

> Script hii inaendana na slides 10 za deck ya msingi wa Sura 01–06. Inatumia `muktadha wa demo ulioidhinishwa` badala ya kutaja jina la tenant, na haina rekodi binafsi, credentials, tokeni, maelezo ya akaunti, au data ya biashara.

## Slide 1 — SMART MANAGER ERP: Msingi wa Kozi ya Kiswahili

> Karibuni kwenye SMART MANAGER ERP: Msingi wa Kozi ya Kiswahili. Huu ni muhtasari wa kazi ya uzalishaji iliyotayarishwa kwa Sura 01 hadi 06, kwa kusisitiza ushahidi, faragha na uendeshaji salama. Sio tangazo la master video iliyokwisha renderiwa; master ya saa nane na nusu bado haijakusanywa. Wahusika mnaowaona ni wahusika wa mafunzo wa kubuniwa. Wanasaidia kueleza dhana za biashara kwa mazingira ya Tanzania, lakini hawawakilishi mtu halisi wala biashara halisi.

## Slide 2 — Kutoka maono hadi kozi ya saa 8:30

> Mpango mkuu una sura 48 zenye jumla ya dakika 510, sawa na saa nane na dakika 30. Sura 01 hadi 06 zinaunda dakika 58 za msingi wa kozi: utangulizi, tatizo la biashara, muktadha wa mfumo, usalama, na dashibodi. Mpango huu unaandaliwa kwa vipande makini, si kwa kuruka moja kwa moja kwenye video ndefu. Kila sura itahitaji script, assets zilizoidhinishwa, VTT, sauti, ukaguzi wa UI, na QA kabla ya kuingia kwenye assembly ya mwisho.

## Slide 3 — Ushahidi unaongoza kila madai

> Kanuni ya kozi ni kwamba ushahidi huongoza kila dai. Taswira za 3D hutumiwa kufafanua dhana na kuongoza simulizi; hazithibitishi muamala, ruhusa, provider, au workflow ya moja kwa moja. Frame za UI zilizofunikwa zinaweza kuonyesha mwelekeo wa module shell tu baada ya ukaguzi wa faragha. Pale capability inapohitaji usanidi, huduma ya nje, au haijathibitishwa kwa capture salama, tunasema hivyo wazi. Picha nzuri haziwezi kuchukua nafasi ya ushahidi uliopitiwa.

## Slide 4 — Sura 01–02: Tatizo linaongoza mwanzo

> Sura ya kwanza inaanzisha tatizo la rekodi zilizotawanyika na maana ya ERP kwa Kiswahili rahisi. Pia inaweka mpaka kati ya taswira ya dhana na ushahidi wa UI. Sura ya pili inachukua hatua inayofuata: badala ya kuanza na orodha ya moduli, inaanza na swali la biashara. Tunatafuta mtiririko mmoja unaohitaji mpangilio—kwa mfano mauzo, bidhaa au fedha—na kuujenga kwa hatua. Hii inasaidia timu kujifunza kwa udhibiti badala ya kujaribu kila kitu kwa wakati mmoja.

## Slide 5 — Sura 03–04: Muktadha kabla ya action

> Sura ya tatu na ya nne zinaeleza kwamba kazi salama huanza na muktadha. Tunafundisha mfuatano wa dhana: mtumiaji, uthibitishaji, kampuni, jukumu, na kazi inayofaa. Mchoro huu unarahisisha kuelewa kwa nini kampuni na jukumu vina umuhimu kabla ya hatua yoyote. Hata hivyo, ni mchoro wa mafunzo pekee. Hauonyeshi schema, query, sera ya RLS, au uthibitisho wa ruhusa ya mtumiaji. Role proof inahitaji session na capture iliyoidhinishwa kwa role na action husika.

## Slide 6 — Sura 05: Usalama ni kanuni ya uzalishaji

> Sura ya tano inasisitiza kwamba usalama si mada ya mwisho tu; ni kanuni ya namna tunavyotengeneza na kutumia mafunzo. Tunafundisha matumizi ya njia iliyoidhinishwa, kutenganisha entry ya umma na workspace binafsi, kuomba review ya role, na kufanya sign-out inapohitajika. Kinachozuiwa kwenye media ni wazi: hakuna nenosiri, tokeni, session, email, profile halisi, recovery link au siri ya provider. Wasifu, role na permission hujadiliwa kama dhana mpaka evidence inayofaa iidhinishwe.

## Slide 7 — Sura 06: Dashboard huanza na swali

> Dashibodi haifundishwi kama ukurasa wa namba; inafundishwa kama mzunguko wa uongozi. Kwanza tunauliza swali, kisha tunaangalia signal, tunaweka muktadha, na tunachukua hatua kwa utaratibu. Signal bila chanzo, kipindi, owner na ubora wa data haijitoshelezi. Frame iliyosafishwa ya Dashboard haitumiki kuthibitisha KPI, alert, trend, value au identity. Inatumika tu kuonyesha kuwa dashboard ni eneo la navigation; uamuzi unaofuata unahitaji review ya binadamu na wajibu unaoeleweka.

## Slide 8 — Capture ilihifadhiwa kwa redaction

> Hapa tunaona namna frame ya muktadha wa demo ulioidhinishwa ilivyolindwa kabla ya kutumika kwenye mafunzo. Header, identity, workspace content, rekodi, values, dates na dynamic badge zones vilifunikwa. Ukaguzi wa kuona uliondoa pia tenant reference na badge iliyobaki. Kinachobaki ni majina ya module kwa orientation pekee. Frame hii haithibitishi workflow, role, KPI, transaction, permission, au record. Redaction ni njia ya kupunguza hatari ya faragha; si njia ya kuongeza madai ya bidhaa.

## Slide 9 — Msingi uko tayari kupanuka kwa udhibiti

> Msingi wa uzalishaji sasa una character bible, assets za dhana zilizopitiwa, Sura 01–06 scripts, VTT cues, asset lists, QA, na protocol ya redaction. Sura 07 ya Sales inaendelea kwa kutumia frame ya orientation iliyosafishwa pamoja na taswira ya dhana. POS na CRM zina packs za script, lakini UI yao bado haijapitishwa kwa sababu checkout, payment, receipt, contact na pipeline data haziruhusiwi kuingia bila capture salama. Hii ndiyo namna ya kupanua kozi bila kupunguza uaminifu au faragha.

## Slide 10 — Njia ya master course ni chapter-by-chapter

> Tunafunga kwa kanuni moja: master course itatokana na sura zilizopitiwa, si ahadi ya haraka. Kwa kila sura, tunaanza na script na asset boundary; tunaendelea na UI review, VTT na audio sync; halafu tunafanya QA na approval. Capture yoyote mpya lazima iwe fully loaded, bila record binafsi, error, credential, secret, dynamic count, au action isiyobadilika. Kwa njia hii, Sales, POS, CRM na sura zinazofuata zinaweza kuendelea bila kugeuza kozi kuwa chanzo cha madai yasiyothibitishwa au hatari ya faragha.

## Marejeo

[1] [`foundation-deck-outline.md`](./foundation-deck-outline.md) — narrative structure ya slides 01–10.
[2] [`swahili-training-course-architecture-20260826.md`](../swahili-training-course-architecture-20260826.md) — 48-chapter, 510-minute course architecture and production gates.
[3] [`kmkm-redacted-output-privacy-review-20260826.md`](./kmkm-redacted-output-privacy-review-20260826.md) — controlled-frame privacy validation and evidence boundary.
