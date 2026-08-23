#import "report-theme.typ": report-accent, report-theme

#show: report-theme.with(title: "SMART MANAGER ERP", author: "Ezra Mpapi", rhythm: "longform", running-header: true)

#set text(font: ("Libertinus Serif", "Noto Serif CJK SC"), lang: "en")

#set par(justify: true)



#page(fill: rgb("#061A13"), margin: (top: 1.5cm, bottom: 1.5cm, x: 2cm), numbering: none, header: none)[#align(center)[#v(1cm)#image("assets/smart-manager-logo.png", width: 15cm)#v(0.6cm)#text(fill: white, size: 25pt, weight: "bold")[SMART MANAGER ERP]#v(0.3cm)#text(fill: rgb("#D6EADF"), size: 14pt)[The Official Enterprise Manual \ and Business Operations Guide]#v(1cm)#line(length: 70%, stroke: 1pt + rgb("#D6B36A"))#v(0.8cm)#text(fill: white, size: 11pt)[Your Business. Connected. Controlled. Intelligent.]#v(1.3cm)#text(fill: white, size: 11pt)[Prepared by Ezra Mpapi \ Owner & Creator \ Dar es Salaam, Tanzania \ English • Kiswahili • Français \ 23 August 2026]]]

#page(numbering: none, header: none)[#align(center)[#text(size: 20pt, weight: "bold", fill: report-accent)[About the Creator / Kuhusu Muumba / À propos du créateur]#v(0.8cm)#image("assets/ezra-mpapi-owner.png", width: 7cm)#v(0.5cm)#text(size: 11pt)[Ezra Mpapi is identified in the supplied materials as the Owner & Creator of SMART MANAGER ERP. This book does not add an unverified biography, qualification, award, or employment history. \ \ Ezra Mpapi ametajwa kwenye nyenzo zilizotolewa kama Mmiliki na Muumba wa SMART MANAGER ERP. Kitabu hiki hakiongezi wasifu au sifa ambazo hazijathibitishwa. \ \ Les documents fournis identifient Ezra Mpapi comme propriétaire et créateur de SMART MANAGER ERP. Aucune biographie non vérifiée n’est ajoutée. \ \ Headquarters / Makao makuu / Siège: Dar es Salaam, Tanzania]]]

#page(numbering: none, header: none)[#outline(title: [Contents / Yaliyomo / Sommaire], indent: 1.5em)]

#counter(page).update(1)

= Editorial and Evidence Note

This trilingual manual is grounded in the supplied master prompt, the current repository, verified architecture and workflow assets, the live Supabase migration ledger, and the subscription verification report. English is the primary reference language; Kiswahili and French accompany every major chapter. Technical routes, table names, package codes, and status labels remain in their verified project form.

*Editorial note / Dokezo la uhariri / Note éditoriale:* A status such as PLANNED, UI ONLY, PARTIALLY IMPLEMENTED, CONFIGURATION REQUIRED, or EXTERNAL SERVICE REQUIRED is an evidence boundary, not a negative judgment and not a current feature promise.



= Part 1: The Story Behind SMART MANAGER

*Hadithi ya SMART MANAGER*  \  *L’histoire de SMART MANAGER*

SMART MANAGER is designed around a practical observation: a growing organization loses time and control when its operations are scattered across notebooks, spreadsheets, messaging channels, separate finance tools, disconnected stock records, and manual reports. The product therefore brings the verified business surfaces of this repository into one authenticated workspace, where records, roles, workflows, and management views can be connected rather than repeatedly reconstructed.

SMART MANAGER imejengwa juu ya uelewa wa vitendo: taasisi inayokua hupoteza muda na udhibiti pale shughuli zinapotawanyika kwenye daftari, lahajedwali, ujumbe, zana tofauti za fedha, rekodi za bidhaa na ripoti za mikono. Bidhaa hii huleta sehemu za biashara zilizothibitishwa na mradi huu kwenye nafasi moja salama ya kazi, ambako rekodi, majukumu, mtiririko wa kazi na maoni ya uongozi vinaweza kuunganishwa.

SMART MANAGER part d’un constat pratique : une organisation en croissance perd du temps et du contrôle lorsque ses opérations sont dispersées entre carnets, tableurs, messageries, outils financiers séparés, stocks isolés et rapports manuels. Le produit réunit donc les surfaces métier vérifiées du dépôt dans un espace de travail authentifié, afin de relier les données, les rôles, les processus et les vues de pilotage.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [Fragmented records], [Rekodi zilizotawanyika], [Données fragmentées], [Centralized access reduces duplicate re-entry and improves the path from an operational action to a management view.], [Limited visibility], [Mwonekano mdogo], [Visibilité limitée], [Dashboards, reports, audit evidence, and command centers make the state of connected operations easier to inspect.], [Weak accountability], [Uwajibikaji dhaifu], [Responsabilité limitée], [Authentication, roles, company scope, audit events, and protected procedures establish a clearer control boundary.], [Scaling pressure], [Shinikizo la ukuaji], [Pression de croissance], [A modular architecture allows an organization to adopt relevant capabilities without claiming that every surface is equally complete.])


#figure(image("assets/figures/01-live-homepage.png", width: 15cm), caption: [Figure 1 — Existing SMART MANAGER public homepage evidence.])

= Part 2: Why SMART MANAGER?

*Kwa nini SMART MANAGER?*  \  *Pourquoi SMART MANAGER ?*

The product name expresses a management promise rather than a claim of artificial intelligence everywhere. SMART means connected information, automation where implemented, intelligent analysis where configured, real-time visibility where data is available, and support for decisions. MANAGER means control, planning, coordination, accountability, monitoring, execution, and growth. The intended movement is from uncertainty to visibility, from visibility to control, from control to intelligence, and from intelligence to action.

Jina la bidhaa linaeleza ahadi ya usimamizi, si dai kwamba kila sehemu ina akili bandia. SMART inamaanisha taarifa zilizounganishwa, otomatiki pale ilipojengwa, uchambuzi wa akili pale umewekwa, mwonekano wa karibu na wakati halisi pale data ipo, na msaada wa maamuzi. MANAGER inamaanisha udhibiti, mipango, uratibu, uwajibikaji, ufuatiliaji, utekelezaji na ukuaji.

Le nom du produit exprime une promesse de gestion, et non l’affirmation que chaque surface utilise l’intelligence artificielle. SMART signifie informations connectées, automatisation lorsqu’elle est implémentée, analyse intelligente lorsqu’elle est configurée, visibilité proche du temps réel lorsque les données sont disponibles et aide à la décision. MANAGER signifie contrôle, planification, coordination, responsabilité, suivi, exécution et croissance.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [Uncertainty → visibility], [Kutokuwa na uhakika → mwonekano], [Incertitude → visibilité], [Management begins with a trustworthy view of what is recorded and what remains unconfigured.], [Visibility → control], [Mwonekano → udhibiti], [Visibilité → contrôle], [Roles, permissions, tenant boundaries, and auditability turn information into controlled action.], [Control → intelligence], [Udhibiti → uelewa], [Contrôle → intelligence], [Reports, analytics, AI services, and reconciliations add interpretation when their prerequisites exist.], [Intelligence → growth], [Uelewa → ukuaji], [Intelligence → croissance], [A disciplined operational record becomes a foundation for measured expansion.])


= Part 3: SMART MANAGER for Every Business Size

*SMART MANAGER kwa kila ukubwa wa biashara*  \  *SMART MANAGER pour chaque taille d’entreprise*

Small businesses can use the platform to establish orderly customer, sales, stock, payment, and accountability records early. Growing businesses can connect more people, branches, departments, and transaction streams. Larger organizations can use the company-scoped architecture, role boundaries, audit evidence, dashboards, integrations, and global administration surfaces where those capabilities are enabled and configured. The product should be adopted according to verified operational need, not according to a generic promise that every module is complete for every organization.

Biashara ndogo zinaweza kutumia mfumo kuanzisha mapema rekodi zilizopangwa za wateja, mauzo, bidhaa, malipo na uwajibikaji. Biashara zinazokua zinaweza kuunganisha watu, matawi, idara na miamala zaidi. Mashirika makubwa yanaweza kutumia usanifu wa kampuni, mipaka ya majukumu, ushahidi wa ukaguzi, dashibodi, miunganisho na usimamizi wa jumla pale uwezo huo umewezeshwa na kusanidiwa.

Les petites entreprises peuvent utiliser la plateforme pour structurer tôt les données clients, ventes, stocks, paiements et responsabilités. Les entreprises en croissance peuvent relier davantage de personnes, de succursales, de départements et de flux de transactions. Les grandes organisations peuvent exploiter l’architecture par entreprise, les rôles, les preuves d’audit, les tableaux de bord, les intégrations et l’administration globale lorsque ces capacités sont activées et configurées.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [Small business], [Biashara ndogo], [Petite entreprise], [Start with the core surfaces that create control: customers, sales, stock, payments, finance, users, and reporting.], [Growing business], [Biashara inayokua], [Entreprise en croissance], [Add procurement, POS, workforce, support, property, industry workspaces, and scheduled controls as operational complexity increases.], [Large business], [Biashara kubwa], [Grande entreprise], [Use company scope, role-aware access, audit, command centers, integrations, and platform administration with governance.])


= Part 4: The Product Tour and Operating Model

*Ziara ya bidhaa na namna ya uendeshaji*  \  *Visite du produit et modèle opératoire*

The verified user journey begins at the public brand entry, continues through authentication and account verification, then establishes or joins a company workspace. The authenticated shell presents role-aware navigation and connects the user to the modules that are available for the workspace. An operational action moves through UI validation, a protected server boundary, database constraints and tenant scope, an auditable result, and—where configured—a notification, report, integration, or scheduled follow-up.

Safari ya mtumiaji iliyo kwenye mradi huanza kwenye ukurasa wa chapa, inaendelea kupitia uthibitishaji wa akaunti, kisha huunda au kujiunga na nafasi ya kampuni. Ganda salama la programu huonyesha urambazaji unaozingatia jukumu na kuunganisha mtumiaji na moduli zinazopatikana. Kitendo cha uendeshaji hupitia uthibitishaji wa UI, mpaka wa seva, masharti ya database na kampuni, matokeo yanayoweza kukaguliwa, na—pale kumesanidiwa—arifa, ripoti, muunganisho au ufuatiliaji uliopangwa.

Le parcours vérifié commence sur l’entrée publique de la marque, se poursuit par l’authentification et la vérification du compte, puis crée ou rejoint un espace d’entreprise. La coquille authentifiée présente une navigation adaptée au rôle et relie l’utilisateur aux modules disponibles. Une action opérationnelle traverse la validation de l’interface, une frontière serveur protégée, les contraintes de base de données et le périmètre de l’entreprise, un résultat auditable et, lorsque configuré, une notification, un rapport, une intégration ou un suivi planifié.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [Discover → register], [Gundua → sajili], [Découvrir → s’inscrire], [Public entry and secure onboarding establish the first relationship with the platform.], [Company → workspace], [Kampuni → nafasi ya kazi], [Entreprise → espace de travail], [Company identity becomes the boundary for data, roles, and operational context.], [Action → evidence], [Kitendo → ushahidi], [Action → preuve], [Protected procedures, database constraints, and audit records provide the control path.], [Result → management], [Matokeo → uongozi], [Résultat → pilotage], [Reports and command centers turn recorded work into a management conversation.])


#figure(image("assets/figures/03-auth-workflow.png", width: 15cm), caption: [Figure 2 — Authentication and secure onboarding workflow evidence.])

#figure(image("assets/figures/02-live-module-map.png", width: 15cm), caption: [Figure 3 — Live module map evidence.])

= Part 5: The SMART MANAGER Module Encyclopedia

*Ensaiklopidia ya moduli za SMART MANAGER*  \  *Encyclopédie des modules SMART MANAGER*

The following inventory is grounded in the project’s verified module registry, source files, migration names, and tested persistence boundaries. Status labels are deliberate: IMPLEMENTED means a connected source and/or database workflow is present; PARTIALLY IMPLEMENTED means only part of the end-to-end contract is verified; UI ONLY means a surface exists without a complete persistence claim; CONFIGURATION REQUIRED and EXTERNAL SERVICE REQUIRED identify prerequisites; PLANNED and NOT VERIFIED are not product promises.

Orodha ifuatayo imetokana na rejista ya moduli, mafaili ya chanzo, majina ya migrations na mipaka ya uhifadhi iliyojaribiwa. Lebo za hali zimetumika kwa makusudi: IMEJENGWA inamaanisha chanzo na/au mtiririko wa database umeonekana; IMEJENGWA KWA SEHEMU inamaanisha mkataba kamili bado haujathibitishwa; UI TU inamaanisha mwonekano upo bila dai la uhifadhi kamili; INAHITAJI USANIDI na INAHITAJI HUDUMA YA NJE zinaonyesha masharti; ILIYOPANGWA si ahadi ya sasa.

L’inventaire suivant est fondé sur le registre des modules, les fichiers source, les noms de migrations et les frontières de persistance testées. Les statuts sont intentionnels : IMPLÉMENTÉ signifie qu’un flux source et/ou base de données est présent ; PARTIELLEMENT IMPLÉMENTÉ signifie que le contrat de bout en bout n’est pas entièrement vérifié ; INTERFACE SEULE indique une surface sans promesse de persistance complète ; CONFIGURATION REQUISE et SERVICE EXTERNE REQUIS signalent des prérequis ; PLANIFIÉ n’est pas une promesse actuelle.

= Part 6: Connected Workflows

*Mtiririko wa kazi uliounganishwa*  \  *Flux de travail connectés*

SMART MANAGER should be understood as a set of connected control paths rather than isolated screens. The most important connections are sales to inventory and finance; procurement to vendors, stock, and payables; customers to CRM, sales, payments, and support; users to roles, permissions, modules, actions, and audit; and subscriptions to company access, payment verification, invoices, notifications, and reporting.

SMART MANAGER inapaswa kueleweka kama seti ya njia za udhibiti zilizounganishwa, si skrini zilizotengwa. Miunganisho muhimu ni mauzo na hesabu pamoja na fedha; ununuzi na wasambazaji, bidhaa na madeni; wateja na CRM, mauzo, malipo na huduma; watumiaji na majukumu, ruhusa, moduli, vitendo na ukaguzi; na usajili na ruhusa ya kampuni, uthibitishaji wa malipo, ankara, arifa na ripoti.

SMART MANAGER doit être compris comme un ensemble de chemins de contrôle connectés et non comme des écrans isolés. Les connexions majeures sont ventes–stocks–finance ; achats–fournisseurs–stocks–dettes ; clients–CRM–ventes–paiements–support ; utilisateurs–rôles–permissions–modules–actions–audit ; et abonnements–accès entreprise–vérification des paiements–factures–notifications–rapports.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [Sales → Inventory → Finance → Reports], [Mauzo → Hesabu → Fedha → Ripoti], [Ventes → Stocks → Finance → Rapports], [A recorded sale can become stock movement, financial evidence, and management information where the relevant contracts are enabled.], [Procurement → Supplier → Payables → Finance], [Ununuzi → Msambazaji → Madeni → Fedha], [Achats → Fournisseur → Dettes → Finance], [Purchasing controls are designed to preserve the relationship between what was ordered, received, owed, and reported.], [User → Role → Permission → Action → Audit], [Mtumiaji → Jukumu → Ruhusa → Kitendo → Ukaguzi], [Utilisateur → Rôle → Permission → Action → Audit], [Security is a workflow: identity and role boundaries precede access, mutation, and evidence.], [Subscription → Access → Payment → Invoice], [Usajili → Ruhusa → Malipo → Ankara], [Abonnement → Accès → Paiement → Facture], [The billing model uses server and database checks so browser state cannot grant an entitlement.])


#figure(image("assets/figures/04-business-workflow.png", width: 15cm), caption: [Figure 4 — Connected business workflow evidence.])

#figure(image("assets/figures/09-sales-to-receipt.png", width: 15cm), caption: [Figure 5 — Sales-to-receipt workflow evidence.])

#figure(image("assets/figures/10-inventory-movement.png", width: 15cm), caption: [Figure 6 — Inventory movement workflow evidence.])

= Part 7: Subscriptions and Customer Value

*Usajili na thamani kwa mteja*  \  *Abonnements et valeur client*

The live subscription model has one free package and six paid packages. FREE_15 provides 15 days at TZS 0 and requires no payment. Each paid package is monthly-only and represents one paid calendar month plus one promotional bonus calendar month, for two total calendar months. The application and database verify the selected package, amount, tenant, provider order, payment state, and idempotency key. Expired Free access transitions to RequiresPlan without an automatic charge; paid expiry uses calendar-month arithmetic.

Mfumo wa sasa wa usajili una kifurushi kimoja cha bure na vifurushi sita vya kulipia. FREE_15 hutoa siku 15 kwa TZS 0 bila malipo. Kila kifurushi cha kulipia ni cha kila mwezi na kinawakilisha mwezi mmoja uliolipiwa pamoja na mwezi mmoja wa ziada wa ofa, jumla ya miezi miwili ya kalenda. Programu na database huthibitisha kifurushi, kiasi, kampuni, oda ya mtoa huduma, hali ya malipo na ufunguo wa kutorudia.

Le modèle actuel comprend une offre gratuite et six offres payantes. FREE_15 offre 15 jours à 0 TZS sans paiement. Chaque offre payante est mensuelle et représente un mois civil payé plus un mois civil promotionnel, soit deux mois au total. L’application et la base vérifient l’offre, le montant, l’entreprise, la commande du prestataire, l’état du paiement et la clé d’idempotence. L’expiration du gratuit passe à RequiresPlan sans prélèvement automatique ; l’expiration payante utilise des mois calendaires.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [FREE_15], [FREE_15], [FREE_15], [TZS 0; 15 days; no payment; no automatic charge; expiry leads to a paid-plan requirement while data is retained.], [TWIGA / TEMBO / SIMBA], [TWIGA / TEMBO / SIMBA], [TWIGA / TEMBO / SIMBA], [TZS 5,000 / 10,000 / 15,000 per month; one paid month plus one bonus month; two calendar months total.], [SIMBA SC / YANGA SC / AZAM FC], [SIMBA SC / YANGA SC / AZAM FC], [SIMBA SC / YANGA SC / AZAM FC], [TZS 4,500 / 9,000 / 7,000 per month; one paid month plus one bonus month; two calendar months total.])


#figure(image("assets/figures/08-webhook-state-machine.png", width: 15cm), caption: [Figure 7 — Verified payment/webhook state-machine evidence.])

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*Code*], [*Name*], [*Nom*], [*Verified commercial contract*]), [FREE_15], [FREE], [FREE], [TZS 0; 15 days; no payment.], [TWIGA], [TWIGA], [TWIGA], [TZS 5,000/month; 1 paid + 1 bonus; 2 calendar months.], [TEMBO], [TEMBO], [TEMBO], [TZS 10,000/month; 1 paid + 1 bonus; 2 calendar months.], [SIMBA], [SIMBA], [SIMBA], [TZS 15,000/month; 1 paid + 1 bonus; 2 calendar months.], [SIMBA_SC], [SIMBA SC], [SIMBA SC], [TZS 4,500/month; 1 paid + 1 bonus; 2 calendar months.], [YANGA_SC], [YANGA SC], [YANGA SC], [TZS 9,000/month; 1 paid + 1 bonus; 2 calendar months.], [AZAM_FC], [AZAM FC], [AZAM FC], [TZS 7,000/month; 1 paid + 1 bonus; 2 calendar months.])


= Part 8: Operating Routines and Learning Paths

*Ratiba za uendeshaji na njia za kujifunza*  \  *Routines opératoires et parcours d’apprentissage*

A disciplined customer should establish a first-day baseline, a weekly review habit, and a monthly management rhythm. Beginners learn identity, navigation, company context, and safe record creation. Operational users learn their module’s inputs, validations, outputs, and exception paths. Managers learn dashboards, approvals, reconciliations, reports, and accountability. Administrators learn tenancy, permissions, integrations, scheduled services, database migrations, security evidence, and recovery boundaries.

Mteja mwenye nidhamu aanzishe msingi wa siku ya kwanza, utaratibu wa mapitio ya kila wiki na mzunguko wa uongozi wa kila mwezi. Mwanzo ajifunze utambulisho, urambazaji, kampuni na uundaji salama wa rekodi. Mtumiaji wa uendeshaji ajifunze pembejeo, uthibitishaji, matokeo na njia za kasoro za moduli yake. Meneja ajifunze dashibodi, vibali, upatanisho, ripoti na uwajibikaji. Msimamizi ajifunze kampuni, ruhusa, miunganisho, huduma zilizopangwa, migrations, ushahidi wa usalama na mipaka ya urejeshaji.

Un client discipliné établit une base le premier jour, une revue hebdomadaire et un rythme mensuel de pilotage. Le débutant apprend l’identité, la navigation, le contexte de l’entreprise et la création sûre de données. L’utilisateur opérationnel apprend les entrées, validations, sorties et exceptions de son module. Le manager apprend les tableaux de bord, validations, rapprochements, rapports et responsabilités. L’administrateur apprend la multi-tenance, les permissions, les intégrations, les services planifiés, les migrations, les preuves de sécurité et les limites de reprise.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [Beginner], [Mwanzo], [Débutant], [Learn the workspace, role, module purpose, safe input, and where to find help.], [Operational user], [Mtumiaji wa uendeshaji], [Utilisateur opérationnel], [Execute repeatable workflows, check validations, and resolve normal exceptions.], [Manager], [Meneja], [Manager], [Review movement, cash, customers, people, exceptions, reports, and approvals.], [Administrator / expert], [Msimamizi / mtaalamu], [Administrateur / expert], [Govern access, configuration, integrations, scheduled services, audit, and recovery.])


= Part 9: Security, Administration, and Trust

*Usalama, usimamizi na uaminifu*  \  *Sécurité, administration et confiance*

The project’s security model is layered. Authentication establishes the user session. Authorization establishes role and manager boundaries. Company scope and Row Level Security help separate tenant data. Server-side API handlers keep provider credentials away from the browser. Database functions use explicit search paths, role grants, constraints, and audit records. Global administration is a separate control plane and must not be confused with ordinary company operations. Customers should treat configuration, provider credentials, and recovery procedures as part of the security program, not as afterthoughts.

Mfumo wa usalama una tabaka kadhaa. Uthibitishaji huanzisha kikao cha mtumiaji. Uidhinishaji huweka mipaka ya jukumu na meneja. Kampuni na Row Level Security husaidia kutenganisha data. Handlers za seva huweka siri za watoa huduma mbali na browser. Functions za database hutumia search path wazi, grants, masharti na rekodi za ukaguzi. Usimamizi wa jumla ni eneo tofauti na shughuli za kampuni za kawaida.

Le modèle de sécurité est en couches. L’authentification établit la session. L’autorisation définit les limites de rôle et de gestion. Le périmètre entreprise et la sécurité au niveau des lignes contribuent à séparer les données. Les handlers serveur gardent les secrets des prestataires hors du navigateur. Les fonctions de base utilisent des chemins explicites, des droits, des contraintes et des audits. L’administration globale est un plan de contrôle distinct des opérations ordinaires.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [Authentication], [Uthibitishaji], [Authentification], [Use verified sessions and do not share credentials or bypass the supported entry path.], [Authorization and RLS], [Uidhinishaji na RLS], [Autorisation et RLS], [Use role, company, and policy boundaries; never treat a browser-visible control as proof of permission.], [Secrets and integrations], [Siri na miunganisho], [Secrets et intégrations], [Keep Supabase service credentials, provider keys, and webhook secrets server-side.], [Audit and recovery], [Ukaguzi na urejeshaji], [Audit et reprise], [Keep audit evidence, backups, migration records, and incident procedures reviewable.])


#figure(image("assets/figures/06-auth-tenancy.png", width: 15cm), caption: [Figure 8 — Authentication and tenancy evidence.])

#figure(image("assets/figures/07-financial-control.png", width: 15cm), caption: [Figure 9 — Financial control-flow evidence.])

= Part 10: Current Limitations and the Future

*Mipaka ya sasa na mustakabali*  \  *Limites actuelles et avenir*

A trustworthy product book must distinguish what is implemented from what is planned. Some surfaces depend on external providers, credentials, scheduled execution, or connected business records. Some registry entries are UI-only or partially verified. The roadmap should therefore prioritize deployment alignment, complete provider configuration, stronger endpoint-by-endpoint review of privileged routines, richer customer-facing screenshots, and measured validation of each industry workflow. Future vision should extend the verified foundation rather than obscure current limitations.

Kitabu cha bidhaa kinachoaminika lazima kitenganishe kilichojengwa na kilichopangwa. Baadhi ya sehemu zinahitaji watoa huduma wa nje, siri, uendeshaji uliopangwa au rekodi za biashara zilizounganishwa. Baadhi ya entries za rejista ni UI tu au zimehakikiwa kwa sehemu. Kwa hiyo roadmap ianze na ulinganifu wa deployment, usanidi wa huduma, mapitio ya routines zenye nguvu, screenshots zaidi za wateja na uthibitishaji wa kila workflow ya sekta.

Un livre produit fiable doit distinguer ce qui est implémenté de ce qui est planifié. Certaines surfaces dépendent de prestataires externes, de secrets, d’exécution planifiée ou de données métier connectées. Certaines entrées du registre sont uniquement des interfaces ou partiellement vérifiées. La feuille de route doit donc commencer par l’alignement du déploiement, la configuration des services, la revue des routines privilégiées, davantage de captures client et la validation mesurée de chaque workflow sectoriel.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*English focus*], [*Kiswahili*], [*Français*], [*Verified guidance*]), [Implemented], [Imejengwa], [Implémenté], [Connected source, database, or tested workflow evidence exists.], [Configuration required], [Inahitaji usanidi], [Configuration requise], [The contract exists but depends on environment variables, roles, storage, provider, or schedule configuration.], [External service required], [Inahitaji huduma ya nje], [Service externe requis], [TRA, AI, WhatsApp, email, mobile money, or other providers must be configured and available.], [Planned / not verified], [Iliyopangwa / haijathibitishwa], [Planifié / non vérifié], [Do not market this classification as a current guaranteed capability.])


#figure(image("assets/figures/05-deployment-observation.png", width: 15cm), caption: [Figure 10 — Deployment observation evidence.])

= Complete Module Encyclopedia

The inventory below is grounded in the project module registry, source files, migration names, and tested persistence boundaries. Status labels distinguish evidence from aspiration.

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*Module / English*], [*Kiswahili*], [*Français*], [*Status and verified evidence*]), [Public Brand & Marketing Entry], [Ukurasa wa chapa na masoko], [Accueil de marque et marketing], [IMPLEMENTED: Home.tsx and the public entry experience establish the product proposition and sign-in path.], [Authentication & Secure Onboarding], [Uthibitishaji na uanzishaji salama], [Authentification et intégration sécurisée], [IMPLEMENTED: LoginModuleEcosystem, account verification, company creation, and protected session boundaries are present.], [Master Application Shell & Navigation], [Ganda kuu la programu na urambazaji], [Coquille applicative et navigation], [IMPLEMENTED: DashboardLayout and BusinessSphereDashboard provide the authenticated workspace shell.], [Profile Identity Center], [Kituo cha utambulisho wa wasifu], [Centre d’identité du profil], [IMPLEMENTED: Profile identity and preference services are backed by authenticated self-service operations.], [Executive Dashboard], [Dashibodi ya uongozi], [Tableau de bord exécutif], [IMPLEMENTED: Executive and command-center surfaces summarize connected business information.], [Daily Business Briefing], [Muhtasari wa kila siku wa biashara], [Briefing commercial quotidien], [PARTIALLY IMPLEMENTED: Briefing and scheduled report services exist; availability depends on configured data and delivery services.], [CRM & Customer Pipeline], [CRM na mfuatano wa wateja], [CRM et pipeline clients], [IMPLEMENTED: Customer and lead persistence boundaries, interactions, and sales-facing workflows are represented.], [Sales & Billing], [Mauzo na malipo], [Ventes et facturation], [IMPLEMENTED: Sales document contracts, invoices, payments, and billing controls are represented in source and database history.], [Point of Sale (POS)], [Mauzo ya moja kwa moja (POS)], [Point de vente (POS)], [IMPLEMENTED: Transaction, return, customer credit, register control, loyalty, reconciliation, and audit paths are present.], [Inventory & Warehouse Management], [Usimamizi wa hesabu na ghala], [Stocks et entrepôts], [IMPLEMENTED: Inventory movement and warehouse command-center surfaces connect operational quantities to sales and procurement.], [Procurement & Vendor Management], [Ununuzi na wasambazaji], [Achats et fournisseurs], [IMPLEMENTED: Procurement persistence boundaries and vendor workflows connect purchasing to stock and finance.], [Finance & Accounting], [Fedha na uhasibu], [Finance et comptabilité], [IMPLEMENTED: Finance foundations, journal core, reconciliation, and financial command centers are migration-backed.], [Reports & Scheduled Reporting], [Ripoti na ripoti zilizopangwa], [Rapports et rapports planifiés], [IMPLEMENTED: Report delivery, schedules, exports, and management views are represented by tested server services.], [Human Resources & Payroll], [Rasilimali watu na mishahara], [Ressources humaines et paie], [IMPLEMENTED: Employee, workforce authorization, Tanzania payroll, leave decisions, and role approvals are present.], [Manufacturing & Work Orders], [Uzalishaji na maagizo ya kazi], [Fabrication et ordres de travail], [PARTIALLY IMPLEMENTED: The project inventory recognizes the surface and persistence boundaries; operational depth must be verified per deployment.], [Supply Chain & Fleet], [Mnyororo wa ugavi na magari], [Chaîne logistique et flotte], [IMPLEMENTED: Fleet management source and controls cover operational fleet records and scheduled controls.], [Marketing Campaigns], [Kampeni za masoko], [Campagnes marketing], [UI ONLY: The surface exists in the module registry; campaign execution depth is not presented as fully verified.], [E-Commerce Storefront], [Duka la kielektroniki], [Boutique e-commerce], [PLANNED: The project inventory names the surface, but a production commerce contract is not asserted by this book.], [Documents & Secure Files], [Nyaraka na mafaili salama], [Documents et fichiers sécurisés], [IMPLEMENTED: Document and notebook persistence boundaries are tested; storage configuration remains environment-dependent.], [Projects & Task Management], [Miradi na usimamizi wa kazi], [Projets et tâches], [PARTIALLY IMPLEMENTED: Project persistence boundaries are represented; complete project operations should be validated with customer data.], [Customer Support & Helpdesk], [Huduma kwa wateja na helpdesk], [Support client et helpdesk], [IMPLEMENTED: Support workflow, ticket persistence, authenticated policy, metrics, and inbox surfaces are present.], [Enterprise Analytics & BI], [Uchambuzi wa biashara na BI], [Analytique d’entreprise et BI], [PARTIALLY IMPLEMENTED: Analytics command centers and predictive surfaces exist; results depend on connected records and configuration.], [Notifications & Alerting], [Arifa na tahadhari], [Notifications et alertes], [IMPLEMENTED: Notification history, reminders, scheduled jobs, and subscription notifications are represented.], [Activity Stream & Audit Evidence], [Mtiririko wa shughuli na ushahidi wa ukaguzi], [Flux d’activité et preuves d’audit], [IMPLEMENTED: Audit logs, evidence export, compliance views, and billing audits provide traceability.], [Integration Hub], [Kitovu cha miunganisho], [Hub d’intégrations], [CONFIGURATION REQUIRED: Webhook, provider, email, mobile-money, and data integrations are available only when their services are configured.], [Workflow Studio & Marketplace], [Studio ya mtiririko wa kazi na soko], [Studio des flux et marketplace], [UI ONLY: The project inventory recognizes the surface; a complete marketplace execution contract is not asserted.], [Collaboration Hub], [Kitovu cha ushirikiano], [Hub de collaboration], [PARTIALLY IMPLEMENTED: Collaboration and email-link checks exist, subject to configured delivery channels.], [TRA VFD Fiscalization Portal], [Portal ya TRA VFD], [Portail de fiscalisation TRA VFD], [EXTERNAL SERVICE REQUIRED: TRA fiscal and Z-report services are present but require external credentials and provider availability.], [AI Assistant & Smart Intelligence], [Msaidizi wa AI na akili ya biashara], [Assistant IA et intelligence], [EXTERNAL SERVICE REQUIRED: AI approvals, summaries, and assistant workflows are protected and require configured model/service access.], [WhatsApp Web Integration], [Muunganisho wa WhatsApp Web], [Intégration WhatsApp Web], [CONFIGURATION REQUIRED: The UI supports linked-device interaction patterns; external WhatsApp/provider configuration is required.], [Microfinance], [Mikopo midogo], [Microfinance], [IMPLEMENTED: Production microfinance workflows, credit scoring, collections, and escalation services are represented.], [Money Agent], [Wakala wa fedha], [Agent de transfert d’argent], [IMPLEMENTED: Money Agent core operations, fee/commission controls, ledger repair, and reconciliation are present.], [VICOBA / SACCOS & Community Groups], [VICOBA / SACCOS na vikundi vya jamii], [VICOBA / SACCOS et groupes communautaires], [IMPLEMENTED: Community group schema, relationship guards, documents, approvals, and security hardening are migration-backed.], [Healthcare / Clinic], [Afya na kliniki], [Santé et clinique], [IMPLEMENTED: Healthcare operations, claims, reminders, portals, interoperability, and internal-role boundaries are represented.], [School Management], [Usimamizi wa shule], [Gestion scolaire], [IMPLEMENTED: School management and linked learner portal surfaces are present with fee, attendance, assignment, and report-card paths.], [Pharmacy Management], [Usimamizi wa famasi], [Gestion de pharmacie], [IMPLEMENTED: Pharmacy operations and tenant-safe persistence boundaries are represented.], [Hotel & Hospitality], [Hoteli na ukarimu], [Hôtellerie et hospitalité], [IMPLEMENTED: Hospitality core, POS/services, guest engagement, finance reconciliation, and access remediation are present.], [Restaurant & F&B], [Mgahawa na chakula/vinywaji], [Restaurant et restauration], [IMPLEMENTED: Restaurant F&B core, operations extension, Tanzania fiscal configuration, and helper hardening are present.], [Fleet Management], [Usimamizi wa magari], [Gestion de flotte], [IMPLEMENTED: Fleet management core and scheduled control surfaces are represented.], [Banking & MFI], [Benki na MFI], [Banque et IMF], [IMPLEMENTED: Bank/MFI core, security hardening, credit ledger, disbursement, and workflow completion are present.], [Employee Portal], [Portal ya mfanyakazi], [Portail employé], [IMPLEMENTED: Employee portal, self-service boundaries, payroll, leave, and authorization controls are present.], [Property Management], [Usimamizi wa mali isiyohamishika], [Gestion immobilière], [IMPLEMENTED: Property portfolio controls, tenant-safe data boundaries, and scheduled property controls are represented.], [Subscription & Billing], [Usajili na malipo], [Abonnements et facturation], [IMPLEMENTED: FREE_15 and six paid bonus packages, monthly-only payment contracts, idempotency, and provider verification are live in the applied schema.], [Global Admin Control Center], [Kituo cha udhibiti wa msimamizi wa mfumo], [Centre de contrôle administrateur global], [IMPLEMENTED: Platform-wide company, user, subscription, audit, integration, security, and health controls are represented.], [Enterprise Settings & Security Control Center], [Mipangilio na udhibiti wa usalama], [Paramètres et contrôle de sécurité], [IMPLEMENTED: Settings, permissions, passkeys, session recovery, RLS evidence, and security hardening surfaces are present.], [Predictive Analytics], [Uchambuzi wa utabiri], [Analytique prédictive], [PARTIALLY IMPLEMENTED: Predictive analytics surfaces exist; model quality and business outcomes depend on data quality and configured services.])


= Workflow Reference

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*Workflow*], [*Kiswahili*], [*Français*], [*Verified path*]), [Authentication], [Uthibitishaji], [Authentification], [Public entry → verified session → company/profile context → protected workspace.], [Company onboarding], [Uanzishaji wa kampuni], [Intégration entreprise], [Register → verify → create/join company → authenticated FREE_15 activation → workspace.], [Sales], [Mauzo], [Ventes], [Customer → document → validation → stock/finance → payment/receipt → report/audit.], [Procurement], [Ununuzi], [Achats], [Supplier → order → receipt → stock → payable/finance → report.], [POS], [POS], [PDV], [Register → item/customer → validation → transaction → receipt/return/credit → reconciliation.], [Property], [Mali isiyohamishika], [Immobilier], [Portfolio → company-scoped records → scheduled controls → tenant-safe reporting.], [Subscription], [Usajili], [Abonnement], [Catalog → access → verified payment intent → provider status → payment/subscription/invoice/audit.], [Administration], [Usimamizi], [Administration], [Platform control → scoped action → audit evidence → support/recovery.])


= Business Problem to Solution

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*Business struggle*], [*Kiswahili*], [*Français*], [*Verified response*]), [Fragmented records], [Rekodi zilizotawanyika], [Données fragmentées], [Connected workspace and shared management views.], [Poor inventory visibility], [Mwonekano mdogo wa bidhaa], [Stocks peu visibles], [Inventory movement linked to sales, procurement, POS, and reports where enabled.], [Uncontrolled access], [Ufikiaji usiodhibitiwa], [Accès non contrôlé], [Sessions, roles, company scope, RLS, policies, and audit.], [Payment uncertainty], [Kutokuwa na uhakika wa malipo], [Paiement incertain], [Server amount verification, provider checks, idempotency, invoice, and audit.], [Manual reporting], [Ripoti za mikono], [Rapports manuels], [Dashboards, report services, schedules, and exports where configured.])


= FAQ, Troubleshooting, and Best Practices

*Can a small business use SMART MANAGER? / Je, biashara ndogo inaweza kuitumia? / Une petite entreprise peut-elle l’utiliser ?* Yes, by starting with relevant verified core surfaces and adopting additional controls as the business grows.

*How does subscription work? / Usajili unafanyaje kazi? / Comment fonctionne l’abonnement ?* FREE_15 provides 15 days at TZS 0. Paid packages are monthly-only with one paid month and one bonus calendar month. Server and database logic, not browser values, decide price and entitlement.

*What is the safest troubleshooting rule? / Kanuni salama ya utatuzi ni ipi? / Quelle est la règle de dépannage la plus sûre ?* Confirm the verified session, company scope, role, configuration, provider health, and audit evidence; fail closed rather than trusting a local browser state.

= Glossary and Reference Notes

#table(columns: (2.4cm, 3.6cm, 3.3cm, 7.0cm), inset: 5pt, stroke: 0.35pt + luma(190), table.header([*Term*], [*Kiswahili*], [*Français*], [*Meaning*]), [Company scope], [Mipaka ya kampuni], [Périmètre entreprise], [The organization boundary used to separate tenant operations.], [RLS], [Usalama wa kiwango cha mstari], [Sécurité au niveau des lignes], [Database policy enforcement over rows.], [Idempotency], [Kutokurudia madhara], [Idempotence], [Repeated request keys do not create duplicate operations.], [FREE_15], [Kifurushi cha siku 15], [Offre de 15 jours], [Free access for 15 days at TZS 0.], [RequiresPlan], [Inahitaji kifurushi], [Forfait requis], [Access state requiring a confirmed package.])


= SMART MANAGER — From Business Operations to Business Intelligence

SMART MANAGER is strongest when it makes work measurable, responsibility visible, and decisions easier to explain. Its value is the disciplined connection of people, records, workflows, controls, integrations, and insight—not a claim that every problem is solved automatically.

SMART MANAGER huwa na nguvu zaidi inapofanya kazi ipimwe, uwajibikaji uonekane na maamuzi yaelezeke. Thamani yake ni kuunganisha watu, rekodi, mitiririko, udhibiti, miunganisho na uelewa kwa nidhamu—si dai kwamba kila tatizo linatatuliwa kiotomatiki.

SMART MANAGER est le plus utile lorsqu’il rend le travail mesurable, les responsabilités visibles et les décisions explicables. Sa valeur est la connexion disciplinée des personnes, données, processus, contrôles, intégrations et analyses—et non la promesse de résoudre automatiquement chaque problème.
