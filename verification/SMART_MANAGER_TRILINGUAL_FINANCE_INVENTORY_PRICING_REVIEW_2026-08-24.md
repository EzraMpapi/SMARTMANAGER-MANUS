# SMART MANAGER ERP — Trilingual Finance, Inventory & East African Pricing Review

**Prepared:** 24 August 2026
**Basis:** Published SMART MANAGER ERP manual, current repository source, live Supabase catalog, and the attachment `pasted_content_2.txt`.

## Executive interpretation

SMART MANAGER’s strongest customer proposition is not a single accounting or stock screen. It is the connected operating loop: sales and POS create commercial records; inventory tracks quantities, value, suppliers, warehouses, and movements; Finance turns confirmed invoices, expenses, and payments into receivables, payables, ledger, tax, banking, and management views; reports and audit evidence make the activity reviewable. The implementation is strongest when the customer enters confirmed records into the shared company-scoped workspace.

The current live catalog supports a low-friction East African rollout: FREE_15 gives fifteen days at TZS 0 with no payment, and every paid plan provides one paid calendar month plus one bonus calendar month. The product should sell the connection between modules and the speed of first value, not unsupported claims about automatic tax filing, provider availability, or predictive outcomes.

## 1. Finance & Accounting — detailed trilingual breakdown

| English capability | Kiswahili | Français | Verified scope and customer value |
|---|---|---|---|
| Finance overview | Muhtasari wa fedha | Vue d’ensemble financière | Executive view of revenue collected, outstanding receivables, expenses, and net cash movement from confirmed invoice, expense, and POS records. |
| Receivables | Wadai / fedha zinazodaiwa | Créances clients | Review unpaid invoices, balances, overdue records, and payment status so the team can follow up on cash owed. |
| Payables / expenses | Madeni na matumizi | Dettes fournisseurs et dépenses | Record, update, classify, and review operating expenses and payable-side activity within the company workspace. |
| General Ledger | Daftari kuu la hesabu | Grand livre général | Brings confirmed invoice, expense, and POS activity into a chronological financial record for management review. |
| Chart of Accounts | Mpangilio wa akaunti | Plan comptable | Provides the accounting classification surface needed to organize financial records and reporting views. |
| Budgets | Bajeti | Budgets | Provides a budget workspace for comparing planned and recorded expense activity; usefulness depends on configured and entered data. |
| Document scanning | Kuchanganua nyaraka | Numérisation des documents | Supports a document-scanning workflow connected to finance expense handling; external OCR or provider outcomes must be verified separately. |
| Financial ratios | Viwango vya kifedha | Ratios financiers | Presents ratio analysis from available confirmed financial sources. Unsupported metrics are not inferred from incomplete data. |
| Loans | Mikopo | Prêts | Provides a loan-management surface; loan calculations and records must be populated and verified for the customer’s operating context. |
| Other debtors | Wadaiwa wengine | Autres débiteurs | Tracks non-standard debtor relationships beyond the main receivables path. |
| Other income | Mapato mengine | Autres produits | Records income outside the primary sales and invoice stream. |
| Banking | Benki | Banque | Provides banking and cash-control workspace surfaces connected to company finance activity. External bank connectivity requires configuration and is not implied by the UI alone. |
| Tax | Kodi | Fiscalité | Provides tax preparation and review surfaces using confirmed records. It does not by itself prove successful external filing or TRA submission. |
| Assets | Mali | Actifs | Provides an asset-management surface for company records and reporting. |
| Finance command center | Kituo cha udhibiti wa fedha | Centre de contrôle financier | Highlights cash, receivables, expenses, exceptions, and report coverage; deliberately labels gross margin, cash forecast, or payables as insufficient when confirmed source data is absent. |
| Reconciliation and audit | Upatanisho na ukaguzi | Rapprochement et audit | Connects financial review to reconciliation, audit evidence, and tenant/company-scoped controls. |

### Finance operating loop

**English:** Invoice or POS sale → confirmed payment → receivable cleared → expense/payable recorded → ledger and cash movement → reconciliation → tax/report review → audit evidence.

**Kiswahili:** Ankara au mauzo ya POS → malipo yaliyothibitishwa → dai linafungwa → matumizi/deni linawekwa → daftari kuu na mtiririko wa fedha → upatanisho → mapitio ya kodi/ripoti → ushahidi wa ukaguzi.

**Français:** Facture ou vente PDV → paiement confirmé → créance soldée → dépense/dette enregistrée → grand livre et mouvement de trésorerie → rapprochement → revue fiscale et rapports → preuve d’audit.

### Finance boundaries to communicate honestly

The finance surface is migration-backed and connected to shared operational records, but the quality of an output depends on the quality and completeness of the customer’s confirmed rows. The manual’s verified positioning is therefore “control and visibility from confirmed data,” not a guarantee that every metric is populated on day one. Gross margin, cash forecasting, and supplier-payables analytics should remain explicitly marked as insufficient until the required source data is present.

## 2. Inventory & Warehouse Management — detailed trilingual breakdown

| English capability | Kiswahili | Français | Verified scope and customer value |
|---|---|---|---|
| Inventory dashboard | Dashibodi ya hesabu | Tableau de bord des stocks | Shows total SKUs, stock value, low-stock count, out-of-stock count, category value, stock health, value trend, and top items by value from inventory rows. |
| Stock register | Orodha ya bidhaa | Registre des stocks | Provides searchable stock rows with item, category, warehouse, on-hand quantity, status, expiry, value, and detail fields. |
| Add and edit items | Kuongeza na kuhariri bidhaa | Ajouter et modifier des articles | Uses the company-scoped `inventory_items` persistence boundary for real records when the application is connected to Supabase. |
| Bulk product import | Uingizaji wa bidhaa kwa wingi | Importation groupée des produits | Supports importing named product rows into the same inventory persistence path used by the item form; missing SKU values can be generated by the workflow. |
| Warehouses | Maghala | Entrepôts | Uses the `inventory_warehouses` company-scoped source for warehouse records and warehouse-aware stock views. |
| Smart inventory analysis | Uchambuzi mahiri wa hesabu | Analyse intelligente des stocks | Provides analysis surfaces for stock value, concentration, warehouse patterns, and item prioritization; conclusions remain bounded by the quality of stored stock data. |
| Transfers | Uhamishaji wa bidhaa | Transferts de stock | Provides a transfer workspace for movement between operational stock locations; actual movement depth depends on the deployed persistence path and entered records. |
| Batches | Makundi ya bidhaa | Lots | Provides a batch-management surface for lot and expiry-oriented stock control. |
| Suppliers | Wasambazaji | Fournisseurs | Connects supplier records and purchasing context to inventory activity, procurement, and finance review. |
| Stock audit | Ukaguzi wa hesabu | Audit des stocks | Provides a stock-audit workspace for reviewing discrepancies and accountability around inventory movement. |
| Low-stock control | Udhibiti wa bidhaa zinazopungua | Contrôle des stocks faibles | Flags items at or below reorder levels and separates low-stock from out-of-stock conditions. |
| Expiry awareness | Ufuatiliaji wa muda wa matumizi | Suivi des dates d’expiration | Exposes expiry information in stock views so teams can prioritize action where expiry data is stored. |
| Valuation | Uthamini wa bidhaa | Valorisation des stocks | Calculates stock value from quantity multiplied by unit cost for confirmed inventory rows. |
| Sales/procurement connection | Muunganiko wa mauzo na ununuzi | Connexion ventes-achats | The manual identifies inventory movement and warehouse surfaces as connected to sales and procurement, with finance/report visibility where relevant records exist. |

### Inventory operating loop

**English:** Supplier or opening stock → item and warehouse → receipt or movement → quantity/value update → sales or POS issue → low-stock/expiry signal → reorder or transfer → audit and report.

**Kiswahili:** Msambazaji au salio la mwanzo → bidhaa na ghala → upokeaji au uhamishaji → sasisho la kiasi/thamani → mauzo au matumizi ya POS → ishara ya upungufu/muda wa matumizi → agizo jipya au uhamishaji → ukaguzi na ripoti.

**Français:** Fournisseur ou stock initial → article et entrepôt → réception ou mouvement → mise à jour quantité/valeur → vente ou sortie PDV → alerte de stock faible/expiration → réapprovisionnement ou transfert → audit et rapport.

### Inventory boundaries to communicate honestly

The inventory module is operationally meaningful when item, unit-cost, reorder-level, warehouse, supplier, movement, and expiry fields are populated. A dashboard visualization is not evidence of a completed stock movement. The sales, procurement, and finance connections should be marketed as a connected workflow with server persistence, while deployment-specific depth of transfers, batches, and external integrations should remain configurable or verified per environment.

## 3. Live subscription limits and tier boundaries

The following values were read from the live Supabase `billing_plans` catalog on 24 August 2026. They are not marketing estimates.

| Plan | Price | Users | Branches | Storage | Transactions | Main features | Finance/inventory entitlement |
|---|---:|---:|---:|---:|---:|---|---|
| FREE_15 | TZS 0 for 15 days | 3 | 1 | 512 MB | 300 | Core operations, basic reports, support | Finance, Sales, Inventory, HR |
| TWIGA | TZS 5,000/month | 3 | 1 | 512 MB | 300 | Core operations, basic reports, support | Finance, Sales, Inventory, HR |
| TEMBO | TZS 10,000/month | 10 | 3 | 2,048 MB | 2,000 | Core operations, approvals, advanced reports, support | Finance, Sales, Inventory, HR, Procurement, Reports |
| SIMBA | TZS 15,000/month | 30 | 10 | 8,192 MB | 10,000 | Core operations, approvals, multi-branch, advanced reports, priority support | Finance, Sales, Inventory, HR, Procurement, Reports, POS, Hospitality |
| SIMBA SC | TZS 4,500/month | 3 | 1 | 512 MB | 300 | Core operations, basic reports, support | Finance, Sales, Inventory, HR |
| YANGA SC | TZS 9,000/month | 10 | 3 | 2,048 MB | 2,000 | Core operations, approvals, advanced reports, support | Finance, Sales, Inventory, HR, Procurement, Reports |
| AZAM FC | TZS 7,000/month | 6 | 2 | 1,024 MB | 1,000 | Core operations, approvals, basic reports, support | Finance, Sales, Inventory, HR, Procurement |

Every paid package is contractually **one paid calendar month plus one bonus calendar month, two months total access**. Paid activation is monthly-only, and the server/database—not browser-submitted amount or local state—determines the package, amount, entitlement, and expiry. FREE_15 is one-time introductory access with no payment and no automatic charge.

## 3A. Live persistence and Supabase schema decision

The live Supabase audit found no need to create a duplicate finance or inventory architecture. The repository’s actual write targets are present and protected by company-scoped RLS: `inventory_items`, `inventory_warehouses`, `inventory_suppliers`, `inventory_stock_movements`, `inventory_transfers`, `inventory_batches`, `stock_audits`, `stock_audit_items`, `finance_expenses`, `finance_assets`, `expense_budgets`, `journal_entries`, `sales_invoices`, `sales_invoice_items`, `sales_payments`, `pos_transactions`, `pos_transaction_items`, `pos_returns`, `pos_return_items`, `bank_accounts`, and `bank_transactions`.

The initial comparison used generic names such as `inventory_movements`, `inventory_stock_audits`, `budgets`, `chart_of_accounts`, and `fixed_assets`; those are not the application’s actual persistence names. The source maps these concepts to `inventory_stock_movements`, `stock_audits`, `expense_budgets`, `finance_assets`, and existing ledger/chart views. The corrected live audit confirmed all 21 actual write targets exist, all are RLS-enabled, each has at least one company-scoped policy, and the relevant tables have the shared `updated_at` and/or `businesssphere_merge_data` triggers. No DDL was applied because no genuinely missing table, column, index, function, trigger, or policy was identified.

The current Security Advisor has 119 findings: 118 WARN and one INFO. The WARN set includes six intentionally public SafariTiketi booking/seat SECURITY DEFINER functions, 111 authenticated SECURITY DEFINER function-execution notices, including seven billing routines, and one Auth leaked-password-protection warning. The INFO finding is `public.platform_admin_actions` with RLS enabled and no policy; it is intentionally service-role-only under the existing global-admin migration, so adding an authenticated policy would widen access unnecessarily. Subscription billing routines retain fixed search paths, server-side plan/amount validation, company scope, and explicit role grants. Remediation should therefore be signature-specific and least-privilege: review the seven billing routines first, keep `billing_start_free_plan` authenticated-only, narrow or document the platform-admin boundary, then review the remaining endpoint families and enable leaked-password protection.

## 4. East African pricing optimization and rollout recommendation

I am an AI, not a licensed financial advisor—this is commercial analysis, not guaranteed advice; market and pricing outcomes carry risk that the business bears.

The regional case for a mobile-first rollout is credible but should not be overstated. GSMA reported that East Africa was the leading driver of monthly active mobile-money account growth in 2024, within a global market that exceeded two billion registered accounts and half a billion monthly active users.[1] The World Bank’s Global Findex brief reported that in Tanzania, 45% of adults had a mobile-money account in 2021, versus 23% with a bank account, and that 11% borrowed through mobile money versus 4% through a bank or similar institution.[2] These facts support payment-localization and low-friction onboarding; they do not prove willingness to pay for SMART MANAGER at any particular price.

### Recommended pricing architecture

| Decision | Recommendation | Why it improves conversion or retention |
|---|---|---|
| Keep FREE_15 | Keep TZS 0, 15 days, three users, one branch, 512 MB, 300 transactions, and the existing four core entitlements. | It gives a prospective customer enough time to enter real customers, products, invoices, and expenses without requiring payment first. |
| Preserve the value ladder | Keep the live ladder at TZS 4,500 / 5,000 / 7,000 / 9,000 / 10,000 / 15,000, but explain each tier using capacity plus module entitlements. | Customers can self-select by business size rather than guessing which feature name matters. |
| Separate football sponsorship from business capacity | Present SIMBA SC, YANGA SC, and AZAM FC as campaign packages with the same capacity logic as their underlying business bands. | This prevents themed packages from confusing the core product ladder while preserving community-led acquisition. |
| Make the bonus unambiguous | State “pay one month, receive two calendar months of access” next to the actual amount payable, with renewal terms shown separately. | It makes the promotion easy to understand and avoids implying automatic renewal where none is implemented. |
| Add live usage visibility | Show users, branches, storage, and transactions used versus included, with an upgrade prompt before a limit is reached. | Capacity warnings create a natural upgrade moment and reduce surprise lockouts. |
| Localize payment choice | Use mobile-money-first checkout in Tanzania, then add country-specific payment rails and local-currency catalog variants for Kenya, Uganda, and Rwanda only after provider, tax, and settlement configuration is verified. | The mobile-money evidence supports reducing payment friction, while local-currency support prevents customers from carrying FX uncertainty. |
| Test positioning before changing prices | Run cohort tests on package names, proof points, onboarding sequence, and demo-to-activation messaging before changing the price amounts. | The current prices are already live and changing them before measuring activation could confound product and pricing effects. |

### Recommended rollout sequence

**Phase 0 — measurement and reliability.** Instrument Free-plan activation, time to first saved customer/product/invoice, first report viewed, checkout initiation, payment confirmation, entitlement refresh, failed payment, cancellation, upgrade, downgrade, and support contact. Confirm that the event sequence is visible from server records, not only from browser notices.

**Phase 1 — Tanzania beachhead.** Lead with Swahili-first onboarding, TZS display, mobile-money payment, and vertical landing pages for wholesalers, retailers, service businesses, property operators, hospitality, and finance teams. Use the FREE_15 period to help a new company complete one real workflow: customer → product → invoice/POS → payment → stock/finance review.

**Phase 2 — controlled cross-border expansion.** Reuse the product core but localize currency, payment providers, tax wording, date/number formats, support language, and data-residency/compliance requirements per country. Do not simply convert TZS prices into foreign currency and publish them as final pricing.

**Phase 3 — retention and expansion.** Offer guided onboarding for TEMBO and SIMBA prospects, triggered by measured usage or branch/user needs. Keep tier upgrades and downgrades server-confirmed and preserve company data while access changes. Use renewal, payment success, time-to-value, and expansion rates as decision metrics.

### Pricing experiments to run safely

The first experiments should be non-destructive and cohort-based: compare “two months access” versus “one month paid + one month bonus” wording; compare capability-led versus capacity-led plan cards; test a Free-to-TWIGA upgrade prompt at day 7 versus day 12; and compare a vertical-specific landing page with a general ERP landing page. The database should remain authoritative for price, package, and entitlement; experiment assignments should never be accepted from the browser as billing truth.

## 5. Marketing language by audience

**English:** “SMART MANAGER connects the numbers that run your business. See what you sold, what you still hold, what customers owe, where cash moved, and what needs attention—inside one secure company workspace.”

**Kiswahili:** “SMART MANAGER inaunganisha taarifa zinazoendesha biashara yako. Ona ulicho uza, bidhaa ulizonazo, wadaiwa wako, fedha zilipoelekea, na hatua inayofuata—katika nafasi moja salama ya kampuni.”

**Français:** « SMART MANAGER relie les informations qui font fonctionner votre entreprise. Visualisez vos ventes, vos stocks, vos créances, vos mouvements de trésorerie et vos priorités dans un espace d’entreprise sécurisé. »

## References

[1]: https://www.gsma.com/newsroom/press-release/mobile-money-surpasses-two-billion-registered-accounts-and-over-half-a-billion-monthly-active-users-globally/ — GSMA, “Mobile Money Surpasses Two Billion Registered Accounts and Over Half a Billion Monthly Active Users Globally,” 8 April 2025.

[2]: https://www.worldbank.org/en/publication/globalfindex/brief/data-from-the-global-findex-2021-the-impact-of-mobile-money-in-sub-saharan-africa — World Bank, “Data From the Global Findex 2021: The Impact of Mobile Money in Sub-Saharan Africa,” 17 April 2024.

Internal evidence: `docs/smart-manager-book/deliverables/SMART_MANAGER_ERP_OFFICIAL_MANUAL.pdf`; `client/src/BusinessSphereDashboard.jsx`; `supabase/migrations/20260824_061_subscription_activation_flow_repair.sql`; live Supabase `billing_plans` catalog queried 24 August 2026.
