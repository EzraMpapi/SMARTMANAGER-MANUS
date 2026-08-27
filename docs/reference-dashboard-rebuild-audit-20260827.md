# Ukaguzi wa Ujenzi Mpya wa Dashboard ya ERP

**Tarehe:** 27 Agosti 2026
**Chanzo cha muonekano:** Picha ya rejea iliyowasilishwa na mtumiaji katika kazi hii.
**Chanzo cha mahitaji:** `/home/ubuntu/upload/pasted_content.txt`.

## Mipaka ya utekelezaji

Ujenzi upya unahusu muonekano wa executive overview pekee ndani ya dashboard iliyolindwa. Haufanyi mradi wa mfano, hauanzishi Supabase client, hook, route, au njia ya kuhifadhi data ya pili. `BusinessSphereDashboard.jsx` inaendelea kumiliki session, role, navigation, data hooks, tenant scope na vitendo vya module; overview hupokea props zilizo tayari zimeshughulikiwa.

## Mkataba wa data uliopo

| Sehemu ya dashboard | Chanzo cha data kilichopo | Uhalisia unaoruhusiwa |
|---|---|---|
| Revenue, expenses, net movement, receivables | `sales_invoices`, `sales_invoice_items`, `sales_payments`, `finance_expenses` | Thamani za invoice zilizolipwa/kiasi kilichopokelewa na expense zilizorekodiwa; si bank balance au forecast. |
| Orders na sales status | `sales_invoices`, `pos_transactions` | Hesabu, status, na activity kutoka safu zinazoweza kufikiwa na kampuni husika. |
| Inventory health na top products | `inventory_items`, invoice line items | Stock, reorder level, unit cost, na mauzo yaliyorekodiwa; hakuna bidhaa au category ya kubuniwa. |
| CRM na customers | `crm_leads`, `crm_contacts` | Pipeline na lead/contact information tu pale inapofikiwa na role husika. |
| Approvals na activity | `hr_leave_requests`, `hr_employees`, `manufacturing_work_orders` | Mistari halisi ya approval/activity inayoruhusiwa kwa user. |

## Ukaguzi wa Supabase wa kusoma-tu

Kiunganishi cha Supabase kilithibitishwa kuwa kimewashwa kwa mradi `rlhngsrihahhyxnjxrxm`, wenye hali `ACTIVE_HEALTHY`. Ukaguzi wa metadata wa public schema ulithibitisha uwepo wa jedwali kuu la dashboard—ikiwa ni pamoja na `sales_invoices`, `sales_invoice_items`, `sales_payments`, `finance_expenses`, `inventory_items`, `crm_leads`, `crm_contacts`, `pos_transactions`, `hr_leave_requests`, `hr_employees`, `manufacturing_work_orders`, na `inventory_warehouses`—yakiwa na RLS imewashwa.

> **Uamuzi:** Hakuna DDL, DML, migration, view, function, index, au RLS policy jipya linalothibitishwa kuwa muhimu kwa ujenzi huu wa muonekano. Hakuna SQL itakayotumika isipokuwa ukaguzi wa mwisho uonyeshe hitaji salama, la kuongeza, na linalothibitishwa.

## Muundo unaolengwa

Muonekano utafuata hierarchy ya picha ya rejea: top command bar, sidebar iliyopo, welcome/quick-action strip, KPI command center, revenue-performance surface, sales distribution panels, operations tables, inventory health, receivables aging, business health, activity, alerts, na quick actions. Vipengele visivyo na chanzo halisi vitaonyesha loading, empty, unavailable, au error state inayosema ukweli badala ya takwimu za mfano.

## Ulinzi wa lazima

- `ProtectedSurface`, session/authentication, RBAC, RLS, tenant/company isolation, na route ownership vinasalia bila kubadilishwa.
- Uandishi wa data hubaki kupitia callbacks na hooks zilizopo; hakuna `company_id` ya mtumiaji inayotumwa kama filter ya frontend.
- Vitendo huonekana tu kwa `allowedModules` na `writeAccess`; kila kitendo kinatumia `onNavigate` au `onQuickAction` iliyopo.
- Vipimo vitatumia fixture iliyotengwa na `https://e2e.supabase.invalid`, si data ya tenant ya production.

## Ukaguzi wa visual wa fixture iliyotengwa

Capture ya desktop yenye viewport ya `1440 × 960` imethibitisha command bar, sidebar, KPI za safu saba, chart ya performance, na panels za jedwali kuanza kwa hierarchy inayolingana na muundo uliolengwa. Capture ya mobile yenye CSS viewport ya `375 × 812` imethibitisha single-column KPI stacking na bottom navigation, lakini imeonyesha mambo mawili ya kurekebishwa kabla ya uthibitishaji wa mwisho: lebo ya tab ya Dashboard ilikatwa kuwa `Dashbo…`, na kitufe cha AI kilielea juu ya KPI ya tatu.

> Marekebisho ya mwisho yataweka kitendo cha AI ndani ya command strip ya mobile, na kutenga lebo fupi ya navigation inayosomeka. Hii huzuia kufunika KPI bila kuanzisha action au data path mpya.

Baada ya marekebisho hayo, capture ya mobile imethibitisha lebo kamili ya **Dashboard** na AI entry ndani ya command strip bila overlap ya KPI. Capture ya desktop ilionyesha kuwa breakpoint ya safu tatu iliunda urefu usio wa lazima kwenye viewport ya `1440px`; grid itatumia safu nne kuanzia `xl` na safu saba kwenye `2xl` ili kuendana vizuri na msongamano wa picha ya rejea bila kubana cards.

Uthibitishaji wa mwisho umeonyesha safu nne kisha safu tatu za KPI kwenye desktop ya `1440 × 960`, zenye spacing thabiti na bila nafasi kubwa tupu. Revenue & Sales Performance panel inaonyesha source note na performance controls. Kwenye mobile ya `375 × 812`, command strip ina AI, Create na notification controls zilizo na nafasi, KPI zinaendelea kuwa safu moja, AI haifunika tena card ya mauzo, na bottom navigation inaonyesha **Dashboard** kwa ukamilifu bila horizontal overflow.

## Matokeo ya uthibitishaji

| Uthibitishaji | Matokeo |
|---|---|
| Focused dashboard contracts | Faili 4 zimepita; assertions 21 zimepita. |
| Full regression | Faili 268 na tests 1,100 zimepita; faili 7 na tests 15 zilirukwa na configuration iliyokuwepo. |
| TypeScript | `pnpm exec tsc --noEmit` imepita. |
| Isolated browser | Assertions 3 zimepita kwa desktop/mobile; duplicates 3 zimerukwa kwa makusudi na project guards. Requests zimebaki kwenye `e2e.supabase.invalid` au `/api/trpc/`. |
| Schema verifier | Jedwali 201 yaliyorejelewa yamepimwa dhidi ya 554 yaliyotumika; hakuna missing table, tenant-table issue, au critical-table issue. |
| Production build | `NODE_OPTIONS=--max-old-space-size=4096 pnpm build` imepita; ilitoa onyo lisilozuia kuhusu BusinessSphereDashboard chunk kubwa. |

Hakuna data ya production, session ya mtumiaji halisi, wala mutation ya database iliyotumiwa na visual verification. Hakuna migration au SQL iliyotumika kwa sababu ukaguzi wa mkataba haujaonyesha object salama ya kuongeza inayokosekana.
