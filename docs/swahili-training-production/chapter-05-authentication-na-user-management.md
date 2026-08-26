# Sura ya 05 — Authentication na User Management

**Muda wa mpango:** 10:00.
**Ahadi ya kujifunza:** Mtazamaji ataweza kufuata kanuni salama za kuingia, kusimamia wasifu na kuelewa mipaka ya jukumu bila kuonyesha au kutafuta siri, akaunti, session, au ruhusa za mtu halisi.

> **Mpaka wa usalama:** Sura hii haionyeshi nenosiri, tokeni, OTP, email, namba ya simu, session cookie, browser profile, recovery link, au maelezo ya mtoa huduma. Haisemi authentication method mahususi isipokuwa pale UI iliyosafishwa inapoonyesha kwa uwazi na kwa usalama.[1]

## Storyboard ya muda

| Muda | Taswira na mwendo | Kusudi la sauti | Kanuni ya ushahidi |
|---|---|---|---|
| 00:00–00:25 | Kadi ya sura yenye alama ya ngao | Kutaja security-first learning | Motion graphic. |
| 00:25–01:25 | Bwana Ezra anaona simulator ya sign-in iliyojaa placeholders za kubuniwa | Kueleza usalama bila kutumia login halisi | Simulator, si UI ya production. |
| 01:25–02:35 | Amina anaonyesha kanuni za “ingia kwa njia iliyoidhinishwa” | Kueleza safe behaviour | Hakuna credential handling. |
| 02:35–03:50 | Public entry iliyopitiwa; callout kwenye boundary ya public/private | Kuonyesha orientation pekee | Hakuna click, session au account. |
| 03:50–05:10 | V03 concept na diagramu ya profile → role → allowed work | Kutenganisha identity, profile, role | Dhana, si permission proof. |
| 05:10–06:45 | Redacted Inventory/Sales module-shell frames; profile/settings icons zinaelekezwa bila action | Kuonyesha navigation context | Frames ni orientation pekee. |
| 06:45–08:10 | Checklist ya user management: profile, role request, review, sign-out | Kutoa utaratibu wa operational hygiene | Checklist ya mafunzo, si policy ya tenant. |
| 08:10–10:00 | Matukio mawili: device shared / role changed; muhtasari | Kuimarisha tabia salama | Wahusika wa kubuniwa. |

## Simulizi na mazungumzo ya Kiswahili

### 00:00–00:25 — Kanuni ya msingi

> Usalama wa mfumo huanza kabla ya kuona dashboard. Kila mtumiaji anapaswa kutumia njia iliyoidhinishwa na shirika lake na kuepuka kushiriki siri za kuingia.

### 00:25–01:25 — Usitumie siri kama somo la video

> Katika mafunzo haya, nafasi za username, password na uthibitishaji zinaonyeshwa kwa mfano wa kubuniwa pekee. Hatuingizi siri, hatuihifadhi, hatuombi kwa mtazamaji, na hatutengenezi njia ya kuvuka ulinzi wa akaunti.

### 01:25–02:35 — Nidhamu ya kuingia

> **Amina:** “Tumia njia ya kuingia iliyoanzishwa na msimamizi. Ukiona mazingira ya pamoja, tumia utaratibu wa sign-out unapomaliza. Ukiona mabadiliko ya jukumu yanahitajika, omba mapitio badala ya kutumia akaunti ya mtu mwingine.”

### 02:35–03:50 — Public na private

> Sehemu ya kuingia ni mwanzo wa safari, si ruhusa ya kuona data. Baada ya hatua ya uthibitishaji, kinachoweza kuonekana na kufanywa hutegemea muktadha unaodhibitiwa. Hatuonyeshi sehemu hiyo ya ndani bila capture iliyoidhinishwa na iliyosafishwa.

### 03:50–05:10 — Wasifu, jukumu na kazi

> Wasifu unaweza kusaidia kutambua mtumiaji; jukumu linaweza kuelekeza aina ya kazi; lakini sahani hii ya 3D haithibitishi ruhusa ya mtu. Tofautisha “muundo unaoeleweka” na “uthibitisho wa access.”

### 05:10–06:45 — Mwelekeo wa UI

> Frames hizi zinaonyesha majina ya navigation yaliyoachwa kimakusudi. Hatufungui Profile au Settings, hatubadilishi data, na hatudai kwamba icon yoyote inathibitisha permission. Hizi ni pointi za mwelekeo tu kwa sura za baadaye zinazokuwa na capture salama.

### 06:45–08:10 — User management kwa utaratibu

> Kwa utendaji mzuri, pitia wasifu wako kwa njia iliyoruhusiwa, omba mabadiliko ya jukumu kwa njia ya ukaguzi, linda kifaa unachotumia, na rudi kwenye eneo la msaada endapo hujui hatua inayofuata. Sera maalumu zinaweza kutofautiana kati ya kampuni.

### 08:10–10:00 — Hitimisho

> **Ulichojifunza:** Umejua kutoshiriki siri; umetofautisha entry ya umma na workspace binafsi; umeelewa tofauti kati ya wasifu, jukumu na ruhusa; na umeona kwamba UI orientation si role proof.

> **Kinachofuata:** Sura ya 06 itaangalia Dashboard ya Uongozi na namna ya kuisoma bila kutafsiri frame iliyosafishwa kama takwimu halisi.

## Mpango wa VTT na callout

| Muda | Maandishi ya skrini | Kanuni ya subtitle |
|---|---|---|
| 00:10 | `USISHIRIKI SIRI ZA KUINGIA` | Maneno manne; contrast ya juu. |
| 01:45 | `Njia iliyoidhinishwa` | Usitaje provider. |
| 03:08 | `Public entry ≠ ruhusa ya data` | Kaa juu ya public/private boundary. |
| 04:15 | `Wasifu → Jukumu → Kazi` | Lebo ya `dhana` chini yake. |
| 06:58 | `Orientation si role proof` | Lazima ionekane kwenye redacted frames. |

## Asset na QA

| Asset | Matumizi | Kizuizi |
|---|---|---|
| Sign-in simulator | Behavioural lesson | Placeholder za kubuniwa tu; si replica ya credential UI. |
| Public entry capture | Orientation | Hakuna attempt ya login, account, au browser data. |
| V03 + redacted Inventory/Sales frames | Dhana na module orientation | Hakuna profile change, settings action, role claim, au badge.[2] |

Mhariri athibitishe kwamba hakuna secret-like string, email, number, profile image, name, session, QR code, recovery link, au provider mark isiyohitajika katika frame yoyote.

## Marejeo

[1] [`swahili-training-course-architecture-20260826.md`](../swahili-training-course-architecture-20260826.md) — Sura 05 na capture-readiness gate.
[2] [`kmkm-redacted-output-privacy-review-20260826.md`](./kmkm-redacted-output-privacy-review-20260826.md) — mipaka ya orientation-frame zilizopitishwa.
