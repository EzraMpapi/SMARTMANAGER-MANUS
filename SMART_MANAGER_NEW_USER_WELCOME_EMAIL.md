# Smart Manager New-User Welcome Email Template

## Sending notes

Replace every `{{placeholder}}` before sending. Deliver this message only through an approved, verified email service to a recipient who has just created, been invited to, or otherwise consented to receive a Smart Manager account communication. The application’s in-app Email Center is currently disabled for external delivery, so do not send this template from it.

| Field | Value to set before sending |
|---|---|
| Recipient | `{{first_name}}`, `{{work_email}}` |
| Workspace | `{{company_name}}` |
| Application link | `https://bserp-dashbo-xgm6fauw.manus.space/app` |
| Manual link | `{{manual_download_url}}` |
| Help contact | `{{support_email_or_phone}}` |

## Subject line options

**English:** Welcome to Smart Manager — your workspace is ready  
**Kiswahili:** Karibu Smart Manager — workspace yako iko tayari

**Preview text:** Start with the user manual, then explore your dashboard, customers, inventory, finance, reports, and more.

---

## Bilingual email body

**Hello {{first_name}}, / Habari {{first_name}},**

Welcome to **Smart Manager**. Your workspace for **{{company_name}}** gives your authorised team one organised place to work with business operations, records, and insights.

Karibu kwenye **Smart Manager**. Workspace yako ya **{{company_name}}** inaipa timu iliyoidhinishwa sehemu moja iliyopangwa ya kufanya kazi na shughuli, rekodi, na taarifa muhimu za biashara.

### Start here / Anza hapa

1. **Open your workspace / Fungua workspace yako**  
   Sign in using the same email and identity provider connected to your account.  
   Ingia kwa kutumia email na identity provider ile ile iliyounganishwa na akaunti yako.

   **[Open Smart Manager / Fungua Smart Manager]({{app_url}})**

2. **Read the user manual / Soma mwongozo wa mtumiaji**  
   The bilingual manual explains navigation, sign-in, company setup, secure use, core workflows, troubleshooting, and the modules that may be available to your role.  
   Mwongozo wa lugha mbili unaelezea navigation, kuingia, company setup, matumizi salama, workflow za msingi, troubleshooting, na moduli zinazoweza kupatikana kwa role yako.

   **[Read or download the manual / Soma au pakua mwongozo]({{manual_url}})**

### Core areas you may see / Maeneo muhimu unayoweza kuona

| English | Kiswahili |
|---|---|
| **Dashboard:** Review the information and actions relevant to your work. | **Dashibodi:** Kagua taarifa na vitendo vinavyohusu kazi yako. |
| **CRM and Sales:** Work with leads, customers, quotations, orders, invoices, payments, and related activity where your role permits. | **CRM na Mauzo:** Fanya kazi na leads, wateja, quotation, oda, ankara, malipo, na shughuli zinazohusiana pale role yako inaporuhusu. |
| **Inventory and Procurement:** Review products, stock, warehouses, suppliers, transfers, and purchasing work where enabled. | **Inventory na Procurement:** Kagua bidhaa, stock, maghala, wasambazaji, transfers, na kazi za ununuzi pale inapowezeshwa. |
| **Finance and Reports:** Review expenses, payments, financial records, reports, and analysis views that are available to you. | **Fedha na Ripoti:** Kagua matumizi, malipo, rekodi za fedha, ripoti, na views za uchambuzi unazoruhusiwa kuona. |
| **People, workflows, and collaboration:** Coordinate employee, document, project, workflow, and team activity according to your access. | **Watu, workflows, na ushirikiano:** Ratibu wafanyakazi, nyaraka, miradi, workflows, na shughuli za timu kulingana na access yako. |
| **AI Assistant:** Ask supported questions and review guidance carefully before taking business action. | **AI Assistant:** Uliza maswali yanayoruhusiwa na kagua mwongozo kwa makini kabla ya kuchukua hatua ya biashara. |

### A few important reminders / Mambo muhimu ya kukumbuka

Please use only your own account, protect your password and any sign-in codes, and sign out when you are finished on a shared device. Your available modules and actions are determined by your company configuration and assigned role. A record is saved only after the system confirms a successful server response; if you see an error, keep the form information, correct the issue, and try again.

Tafadhali tumia akaunti yako mwenyewe, linda password na sign-in codes zako, na toka kwenye akaunti ukimaliza kutumia kifaa cha pamoja. Moduli na vitendo unavyoona vinaamuliwa na company configuration na role uliyopewa. Rekodi huhifadhiwa baada ya mfumo kuthibitisha majibu ya server; ukiona error, acha taarifa kwenye form, rekebisha tatizo, kisha jaribu tena.

If you need help with access, a module, or a workflow, contact your company administrator or **{{support_email_or_phone}}**. Please include the module name, the step you were taking, and the safe error message—never send your password or access token.

Ukihitaji msaada kuhusu access, moduli, au workflow, wasiliana na msimamizi wa kampuni au **{{support_email_or_phone}}**. Taja jina la moduli, hatua uliyokuwa unafanya, na error message salama—usitume password au access token yako.

**Welcome again. / Karibu tena.**  
**The Smart Manager Team / Timu ya Smart Manager**

---

## Plain-text fallback

Hello {{first_name}} / Habari {{first_name}},

Welcome to Smart Manager for {{company_name}}. / Karibu Smart Manager ya {{company_name}}.

Open your workspace / Fungua workspace yako: {{app_url}}

Read the bilingual user manual / Soma mwongozo wa mtumiaji wa lugha mbili: {{manual_url}}

Core areas may include Dashboard, CRM and Sales, Inventory and Procurement, Finance and Reports, People and Collaboration, and AI Assistant—depending on your company configuration and role. / Maeneo muhimu yanaweza kujumuisha Dashibodi, CRM na Mauzo, Inventory na Procurement, Fedha na Ripoti, Watu na Ushirikiano, na AI Assistant—kulingana na company configuration na role yako.

For assistance, contact your company administrator or {{support_email_or_phone}}. Never send your password or access token. / Kwa msaada, wasiliana na msimamizi wa kampuni au {{support_email_or_phone}}. Usitume password au access token yako.

The Smart Manager Team / Timu ya Smart Manager
