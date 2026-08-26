# SMART MANAGER ERP: Mpango Mkuu wa Kozi ya Kiswahili

**Toleo:** 2026-08-26
**Lengo la muda:** Dakika 510 — saa 8 na dakika 30
**Muundo wa utoaji:** Vipande 48 vya sura, kila kimoja kikiwa na intro, mafunzo, ushahidi wa UI au taswira ya 3D yenye lebo sahihi, muhtasari wa *Ulichojifunza*, na daraja la *Kinachofuata*.

> Kozi hii ni mpango wa uzalishaji unaotegemea ushahidi. Haidai kwamba kila skrini, mtoa huduma wa nje, au mtiririko wa kazi umewezeshwa kwa kila kampuni. Kila onyesho la UI litachaguliwa baada ya ukaguzi wa faragha katika mazingira ya demo yaliyothibitishwa.

## Kanuni ya simulizi

Kozi inaanza na tatizo la biashara lililotawanyika, inaingia kwenye utambulisho salama na ganda la programu, inaonyesha shughuli za kila siku, kisha inaendelea hadi usimamizi, uchambuzi, usalama, na mtiririko wa biashara unaounganisha moduli. Kiswahili cha Tanzania kinatangulia; istilahi ya Kiingereza inaonekana tu pale inaposaidia kujifunza, kwa mfano: **utenganishaji wa kampuni — multi-tenant isolation**.

| Kipengele | Kiwango cha uzalishaji |
|---|---|
| Picha | 16:9, 3840×2160 master pale inapowezekana; 1920×1080 delivery; 25 fps thabiti |
| Sauti | 48 kHz, narration inayoeleweka, muziki wa chini ya sauti ya msimulizi, na SFX fupi za UI |
| Uandishi wa skrini | Kiswahili kifupi na kinachosomwa kwa urahisi; istilahi za Kiingereza ziwekwe baada ya maana ya Kiswahili |
| Uthibitisho wa UI | UI halisi tu baada ya data kuondolewa/kuwa demo na skrini kuwa haina loader, error, token, au taarifa binafsi |
| Taswira ya 3D | Hufanya kazi kama maelezo ya dhana, daraja la sura, au hadithi ya wahusika; si uthibitisho wa workflow |
| Manukuu | Kiswahili `.vtt` kwa kila sura; istilahi muhimu ziwe subtitle-ready kwa Kiingereza |

## Ratiba ya sura: dakika 510

### Sehemu A — Kuanzia na mfumo salama: dakika 106

| # | Sura ya Kiswahili | Dakika | Lengo la kujifunza | Ushahidi/visual unaoruhusiwa |
|---:|---|---:|---|---|
| 01 | Utangulizi wa SMART MANAGER ERP | 10 | Tatizo la rekodi zilizotawanyika na ahadi ya nafasi moja ya kazi | V09 + logo; V01 kama platform story |
| 02 | Maono, Tatizo na Suluhisho | 6 | Kuelewa thamani bila kuahidi matokeo yasiyothibitishwa | Wahusika + V01 |
| 03 | Mfumo Unavyofanya Kazi | 8 | Safari ya public entry, auth, kampuni, role, action na evidence | UI public entry + V02 |
| 04 | Architecture na Multi-Tenant System | 12 | User → company → permissions → data | V03/V08 + mchoro wa data unaoeleza dhana |
| 05 | Authentication na User Management | 10 | Kuingia, wasifu, session, na mipaka ya jukumu | UI login redacted + Profile/Settings safe capture |
| 06 | Dashboard ya Uongozi | 12 | KPI zilizothibitishwa, range, alerts, na layout preference | Isolated dashboard-preference evidence + V01 |
| 07 | Sales: Kutoka Mteja hadi Ankara | 14 | Lifecycle ya lead/quotation/invoice/payout kulingana na workflow iliyothibitishwa | V02 + UI ya Sales iliyosafishwa |
| 08 | Point of Sale (POS) | 14 | Register, cart, payment, return na reconciliation kwa demo salama | UI POS inayothibitishwa; V04 transition |
| 09 | CRM na Mahusiano ya Wateja | 10 | Lead, contact, opportunity, follow-up, na pipeline | UI CRM safi + Neema dialogue |

### Sehemu B — Shughuli, fedha, na watu: dakika 142

| # | Sura ya Kiswahili | Dakika | Lengo la kujifunza | Ushahidi/visual unaoruhusiwa |
|---:|---|---:|---|---|
| 10 | Inventory na Ghala | 16 | SKU, bidhaa, kiwango cha stock, reorder, movement na transfer | V04 + UI Inventory |
| 11 | Procurement na Wasambazaji | 12 | Ombi, approval, PO, receiving na supplier bill kwa scope iliyothibitishwa | V04 + workflow diagram |
| 12 | Supply Chain na Manufacturing | 8 | Uhusiano wa supply chain; manufacturing iwe na caveat ya partial verification | V04; “imejengwa kwa sehemu” lower-third |
| 13 | Finance | 16 | Mapato, matumizi, receivables, cash flow na management view | V06 + UI Finance |
| 14 | Accounting | 14 | Chart of accounts, journal, debit/credit, na balance concept | David explainer + deterministic debit/credit diagram |
| 15 | Banking & MFI | 10 | Bank/MFI controls, reconciliation na external-provider boundary | UI Banking safe capture + V07 caveat |
| 16 | Microfinance | 10 | Credit, collections, ledger, escalation na role boundary | UI Microfinance safe capture |
| 17 | VICOBA / SACCOS | 6 | Vikundi, approvals, documents, na security boundaries | UI VICOBA safe capture |
| 18 | HR na Payroll | 14 | Employee lifecycle, attendance, leave na payroll | Rehema dialogue + UI HR safe capture |
| 19 | Employee Portal | 6 | Self-service na mipaka ya employee role | UI Employee Portal; role-capture prerequisite |
| 20 | Documents na Collaboration | 10 | Nyaraka salama, collaboration, na configuration caveat | UI Documents/Collaboration safe capture |

### Sehemu C — Sekta maalumu na shughuli za kisasa: dakika 124

| # | Sura ya Kiswahili | Dakika | Lengo la kujifunza | Ushahidi/visual unaoruhusiwa |
|---:|---|---:|---|---|
| 21 | Healthcare / Clinic | 8 | Muonekano wa clinic na privacy-first operating model | V05 + only privacy-approved demo UI |
| 22 | Pharmacy Management | 12 | Pharmacy workspace na stock/dispensing concepts in approved demo | UI Pharmacy safe capture |
| 23 | School Management | 10 | Learner, fees, attendance, assignments na report-card paths | UI School safe capture |
| 24 | Hotel & Hospitality | 10 | Guest/service/finance workflow overview | UI Hotel safe capture |
| 25 | Restaurant & F&B | 8 | Restaurant operations na POS relationship | UI Restaurant safe capture |
| 26 | Fleet Management | 14 | Vehicle records, controls, na operational planning | UI Fleet safe capture |
| 27 | Property Management | 8 | Portfolio, tenant-safe context, na scheduled property controls | UI Property safe capture |
| 28 | Community Groups | 8 | Community workflow, documents, approvals, na hardening boundary | UI Community safe capture |
| 29 | Projects | 8 | Project persistence boundary na partial verification statement | UI Projects safe capture; caveat overlay |
| 30 | Customer Support | 14 | Ticket, inbox, metrics na protected support workflow | UI Support safe capture |
| 31 | Marketing na E-Commerce | 12 | Kutenganisha UI-only marketing na planned e-commerce from live claims | UI registry explanation; no imaginary checkout flow |
| 32 | Subscription na Billing | 8 | Package, entitlement, verification, invoice na monthly boundary | Safe admin/billing explanation only |

### Sehemu D — Uongozi, automation, na uaminifu: dakika 104

| # | Sura ya Kiswahili | Dakika | Lengo la kujifunza | Ushahidi/visual unaoruhusiwa |
|---:|---|---:|---|---|
| 33 | Reports | 8 | Sales, finance, stock, HR na management reports | UI Reports safe capture |
| 34 | Analytics na Business Intelligence | 8 | Analytics surfaces na data-quality caveat | UI Analytics safe capture; “imejengwa kwa sehemu” label |
| 35 | Workflow Studio | 8 | Automation concept; UI-only boundary | V02 workflow diagram + UI-only disclosure |
| 36 | Integration Hub | 8 | Configured, pending, failed, confirmed distinction | V07 + UI Integration Hub |
| 37 | AI Assistant | 6 | AI only when configured; never invent database answer | UI AI surface only if response/data is approved; otherwise show configuration prerequisite |
| 38 | Notifications na Activity Stream | 12 | Alert, activity, traceability, and action context | V08 + UI activity evidence |
| 39 | Settings, Roles na Permissions | 16 | Roles, profile, access, safe settings and role limits | V03 + Settings safe capture; no permission proof without role session |
| 40 | Security, RLS na Audit Trails | 8 | Authentication, authorization, company scope, RLS, audit | V08 + architecture diagram |
| 41 | Mobile Experience | 12 | Responsive mobile operating pattern, not a separately claimed native app | Verified mobile preference capture + current responsive UI |
| 42 | Complete Business Workflow | 18 | CRM → sales → invoice/POS → inventory → finance → reports | V02/V04 + chapter-specific safe UI evidence |
| 43 | Real-World Scenario: Biashara ya Usambazaji | 16 | Morning-to-close fictional demo narrative with only approved UI states | Bwana Ezra, Amina, David, Neema, Juma, Rehema + V01/V04 |
| 44 | Administrator Training | 16 | Company, settings, audit, integrations, configuration and recovery boundaries | Admin safe capture; secrets redacted |

### Sehemu E — Ustadi, adoption, na hitimisho: dakika 34

| # | Sura ya Kiswahili | Dakika | Lengo la kujifunza | Ushahidi/visual unaoruhusiwa |
|---:|---|---:|---|---|
| 45 | Manager Training | 12 | KPI, approval, exception, report, and team rhythm | Dashboard/Reports safe capture |
| 46 | Employee Training | 8 | Role-focused daily work, help path, and privacy | Employee role-safe capture; pending approval if unavailable |
| 47 | Best Practices na QA | 8 | Daily/weekly/monthly discipline, data quality, privacy and review | V10 + checklist motion graphic |
| 48 | Muhtasari wa Mfumo Mzima | 6 | Connected departments and responsible next steps | V09/V10 + all approved 3D plates in a labelled closing montage |

## Wahusika na uendelevu wa muonekano

| Mhusika | Jukumu la mafunzo | Anchors za muonekano | Matumizi salama |
|---|---|---|---|
| Bwana Ezra | Mmiliki/CEO; huuliza tatizo na hufunga maamuzi | Tanzanian business leader, emerald tie accent, confident posture | Opening, dashboard, scenario, conclusion |
| Amina | ERP consultant; hueleza mfumo na mipaka | Professional consultant, deep-emerald blazer accent, calm explanatory gestures | Architecture, onboarding, workflows, security |
| David | Finance manager | Smart navy suit, ledger/tablet prop, measured tone | Finance, accounting, reports, reconciliation |
| Neema | Sales manager | Professional warm-neutral palette, client-conversation gestures | CRM, sales, POS, customer workflow |
| Juma | Inventory/operations manager | Warehouse-smart attire, safety-green accent, scanner/tablet prop | Inventory, procurement, fleet, supply chain |
| Rehema | HR manager | Professional corporate dress, friendly but precise posture | HR, payroll, employee portal, compliance |

Every character scene should use the same approved model sheet, palette, silhouette, and face anchors. A character can explain a concept, but a UI claim only becomes a tutorial moment when the corresponding approved screen is actually highlighted.

## Reusable scene grammar

Each chapter follows a seven-part rhythm: logo and chapter title; a 20–45 second character question; a concise concept animation; privacy-screened UI demonstration; deliberate cursor/callout sequence; *Ulichojifunza* with three to seven points; and *Kinachofuata*. UI actions must be narrated synchronously: the named button, tab, table, or visual cue must be visibly highlighted when spoken.

The ten conceptual 3D plates are deliberately distributed across the programme: V09 and V01 establish the platform, V02 and V04 support connected workflows, V03/V08 explain role and security control, V05 covers verticals, V06 local operations, V07 integrations, and V10 adoption/QA/closing. The final montage will use all ten plates with on-screen wording that says **“taswira ya maelezo”** where necessary.

## Audio and subtitles plan

| Layer | Requirement |
|---|---|
| Narration | Natural professional Tanzanian Swahili; measured pace with pauses; no claim of actual database result unless a redacted, approved UI state shows it |
| Dialogue | Short Bwana Ezra/Amina exchanges before core chapters; David, Neema, Juma, and Rehema introduced only in their subject areas |
| Music | Light corporate themes for opening, problem, technology, finance, security, and conclusion; ducked under speech |
| SFX | Minimal click, notification, highlight, and transition cues synchronized with safe UI actions |
| Subtitles | One Kiswahili VTT per chapter; separate terminology-ready English glossary for terms such as dashboard, reconciliation, tenant, and workflow |

## Capture readiness gate

No live screen can enter the course until it passes this gate: page fully loaded; no error, skeleton, debug text, credentials, account data, personal data, or private records; exact feature status documented; and the capture is linked to a chapter and evidence boundary in the asset register. If no safe capture exists, the chapter uses an explanatory 3D/diagram scene and labels the capability as configuration-required, external-service-required, partial, UI-only, planned, or not verified.

## Pre-production output register

The programme will maintain the following versioned artefacts before chapter rendering: a master storyboard; Kiswahili narration and dialogue scripts; character bible; 48-scene list; UI capture list; subtitle manifests; music and SFX sheets; timing sheet; asset/provenance register; and QA checklist. The 8–9 hour master is assembled only after every chapter is separately reviewed for narration/UI sync, visual continuity, source accuracy, privacy, spelling, audio level, and subtitle timing.

## References

[1] [`pasted_content_2.txt`](../../upload/pasted_content_2.txt) — user-supplied master production brief.
[2] [`swahili-training-asset-and-feature-register-20260826.md`](./swahili-training-asset-and-feature-register-20260826.md) — approved asset and feature boundaries.
[3] [`enterpriseNavigation.js`](../client/src/navigation/enterpriseNavigation.js) — canonical role-aware module navigation.
[4] [`build_book.py`](./smart-manager-book/build_book.py) — verified module-status inventory used for scope control.
