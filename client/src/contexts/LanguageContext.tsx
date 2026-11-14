import React, { createContext, useContext, useMemo, useState, useEffect } from "react";
import { trpc } from "../lib/trpc";
import { useAuthContext } from "./AuthContext";
import { installDocumentLocalization, setDocumentLocalization } from "../lib/domLocalization";

export type Lang = "en" | "sw" | "fr" | "es" | "pt" | "zh" | "ar" | "de" | "hi" | "ja";

export type LanguageOption = { code: Lang; label: string; nativeLabel: string; dir?: "ltr" | "rtl" };

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: "sw", label: "Swahili", nativeLabel: "Kiswahili" },
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية", dir: "rtl" },
  { code: "de", label: "German", nativeLabel: "Deutsch" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "ja", label: "Japanese", nativeLabel: "日本語" },
];

const translations: Record<Lang, Record<string, string>> = {
  en: {
    brandTitle: "Smart Manager", brandSubtitle: "Operational ERP", capabilities: "Capabilities", whyUs: "Why Us", launch: "Launch", launchApp: "Launch App",
    heroBadge: "Tanzanian Enterprise Solution for Businesses", heroTitle1: "Run the work.", heroTitle2: "See the whole business.",
    heroSubtitle: "Simamia Biashara Yako. Popote, Wakati Wote. Smart Manager brings commercial, financial, and operational workflows together in one noble command center.",
    exploreCapabilities: "Explore capabilities", liveOperationalData: "Live operational data", connectedModules: "Connected business modules", actionReadyWorkflows: "Action-ready workflows",
    businessOverview: "Business Overview", liveWorkspace: "Live Workspace", operationalMomentum: "Operational Momentum", nextBestAction: "Next Best Action", nextBestActionDesc: "Review the priorities surfaced by your connected business workflows.",
    oneWorkspace: "One Workspace", oneWorkspaceDesc: "Centralize customer, inventory, finance, and people workflows in one command center.", liveDataPath: "Live Data Path", liveDataPathDesc: "Direct Supabase integration ensures every signal is accurate and action-ready.",
    builtInControls: "Built-in Controls", builtInControlsDesc: "Role-aware access, audit visibility, and automated reporting for peace of mind.", ecosystemTitle: "The Noble Ecosystem", ecosystemHeading: "Capabilities that radiate authority.",
    ecosystemDesc: "Smart Manager keeps core business functions in reach while giving each team the dedicated workflows it needs to move work forward with precision.", readyCommandCenter: "Ready to enter the command center?", readyCommandCenterDesc: "Launch the Smart Manager ERP dashboard to work with connected modules and live operational data. Salama na Mwaminifu.",
    launchWorkspace: "Launch Workspace", madeInTanzania: "Made in Tanzania", copyright: "© 2026 Smart Manager · Enterprise Business Ecosystem",
    language: "Language", workspaceArea: "Workspace area", searchEverything: "Search modules, records, and actions", helpSupport: "Help and support", messages: "Messages", theme: "Theme", switchLanguage: "Switch language", takeTour: "Take a Tour", closeTour: "Close onboarding tour",
  },
  sw: {
    brandTitle: "Smart Manager", brandSubtitle: "Mfumo wa Uendeshaji", capabilities: "Uwezo", whyUs: "Kwanini Sisi", launch: "Anza", launchApp: "Fungua Mfumo",
    heroBadge: "Bidhaa ya Kitanzania kwa Wafanyabiashara", heroTitle1: "Simamia kazi.", heroTitle2: "Ona biashara nzima.", heroSubtitle: "Simamia Biashara Yako. Popote, Wakati Wote. Smart Manager inaleta pamoja mifumo ya fedha, mauzo, na uendeshaji katika kituo kimoja thabiti.",
    exploreCapabilities: "Chunguza uwezo", liveOperationalData: "Data za uendeshaji za moja kwa moja", connectedModules: "Moduli zilizounganishwa", actionReadyWorkflows: "Mifumo ya vitendo", businessOverview: "Muhtasari wa Biashara", liveWorkspace: "Kituo cha Kazi", operationalMomentum: "Kasi ya Uendeshaji", nextBestAction: "Hatua Inayofuata", nextBestActionDesc: "Kagua vipaumbele vilivyotolewa na mifumo yako ya biashara.",
    oneWorkspace: "Sehemu Moja", oneWorkspaceDesc: "Unganisha wateja, bidhaa, fedha, na rasilimali watu katika sehemu moja.", liveDataPath: "Data za Moja kwa Moja", liveDataPathDesc: "Uunganishaji wa Supabase unahakikisha kila taarifa iko sahihi na salama.", builtInControls: "Udhibiti Madhubuti", builtInControlsDesc: "Ulinzi wa viwango vya watumiaji, ukaguzi, na ripoti za kiotomatiki.", ecosystemTitle: "Mfumo Thabiti", ecosystemHeading: "Uwezo unaoleta mamlaka katika biashara.", ecosystemDesc: "Smart Manager huweka shughuli zote za biashara mikononi mwako kwa usahihi na urahisi.", readyCommandCenter: "Uko tayari kuingia kwenye mfumo?", readyCommandCenterDesc: "Fungua dashibodi ya Smart Manager ili kufanya kazi na moduli zilizounganishwa na data halisi. Salama na Mwaminifu.", launchWorkspace: "Fungua Dashibodi", madeInTanzania: "Imetengenezwa Tanzania", copyright: "© 2026 Smart Manager · Mfumo wa Biashara",
    language: "Lugha", workspaceArea: "Eneo la kazi", searchEverything: "Tafuta moduli, rekodi na vitendo", helpSupport: "Msaada", messages: "Ujumbe", theme: "Muonekano", switchLanguage: "Badilisha lugha", takeTour: "Anza Ziara", closeTour: "Funga ziara ya mfumo",
  },
  fr: {
    brandTitle: "Smart Manager", brandSubtitle: "ERP opérationnel", capabilities: "Fonctionnalités", whyUs: "Pourquoi nous", launch: "Lancer", launchApp: "Ouvrir l’application",
    heroBadge: "Solution d’entreprise tanzanienne pour les entreprises", heroTitle1: "Pilotez le travail.", heroTitle2: "Voyez toute l’entreprise.",
    heroSubtitle: "Gérez votre entreprise. Partout, à tout moment. Smart Manager réunit les flux commerciaux, financiers et opérationnels dans un seul centre de commande.",
    exploreCapabilities: "Explorer les fonctionnalités", liveOperationalData: "Données opérationnelles en direct", connectedModules: "Modules métiers connectés", actionReadyWorkflows: "Flux de travail prêts à l’action",
    businessOverview: "Aperçu de l’entreprise", liveWorkspace: "Espace de travail en direct", operationalMomentum: "Dynamique opérationnelle", nextBestAction: "Prochaine meilleure action", nextBestActionDesc: "Passez en revue les priorités révélées par vos flux de travail connectés.",
    oneWorkspace: "Un seul espace de travail", oneWorkspaceDesc: "Centralisez les flux clients, stocks, finances et RH dans un seul centre de commande.", liveDataPath: "Flux de données en direct", liveDataPathDesc: "L’intégration directe de Supabase garantit que chaque signal est exact et prêt à l’action.",
    builtInControls: "Contrôles intégrés", builtInControlsDesc: "Accès selon les rôles, visibilité des audits et rapports automatisés pour plus de sérénité.", ecosystemTitle: "L’écosystème noble",
    ecosystemHeading: "Des capacités qui rayonnent d’autorité.", ecosystemDesc: "Smart Manager garde les fonctions métier essentielles à portée de main tout en offrant à chaque équipe les flux dédiés dont elle a besoin pour avancer avec précision.",
    readyCommandCenter: "Prêt à entrer dans le centre de commande ?", readyCommandCenterDesc: "Lancez le tableau de bord ERP Smart Manager pour travailler avec des modules connectés et des données opérationnelles en direct. Salama na Mwaminifu.",
    launchWorkspace: "Lancer l’espace de travail", madeInTanzania: "Fabriqué en Tanzanie", copyright: "© 2026 Smart Manager · Écosystème d’entreprise",
    language: "Langue", workspaceArea: "Espace de travail", searchEverything: "Rechercher des modules, dossiers et actions", helpSupport: "Aide et support", messages: "Messages", theme: "Thème", switchLanguage: "Changer de langue", takeTour: "Faire une visite", closeTour: "Fermer la visite d’intégration",
  },
  es: {
    brandTitle: "Smart Manager", brandSubtitle: "ERP operativo", capabilities: "Capacidades", whyUs: "Por qué nosotros", launch: "Iniciar", launchApp: "Abrir aplicación",
    heroBadge: "Solución empresarial tanzana para empresas", heroTitle1: "Dirige el trabajo.", heroTitle2: "Ve todo el negocio.",
    heroSubtitle: "Administra tu negocio. En cualquier lugar, en todo momento. Smart Manager reúne los flujos comerciales, financieros y operativos en un solo centro de mando.",
    exploreCapabilities: "Explorar capacidades", liveOperationalData: "Datos operativos en vivo", connectedModules: "Módulos de negocio conectados", actionReadyWorkflows: "Flujos de trabajo listos para la acción",
    businessOverview: "Resumen del negocio", liveWorkspace: "Espacio de trabajo en vivo", operationalMomentum: "Impulso operativo", nextBestAction: "Siguiente mejor acción", nextBestActionDesc: "Revisa las prioridades que revelan tus flujos de trabajo conectados.",
    oneWorkspace: "Un solo espacio", oneWorkspaceDesc: "Centraliza los flujos de clientes, inventario, finanzas y personas en un solo centro de mando.", liveDataPath: "Ruta de datos en vivo", liveDataPathDesc: "La integración directa con Supabase garantiza que cada señal sea precisa y esté lista para actuar.",
    builtInControls: "Controles integrados", builtInControlsDesc: "Acceso según roles, visibilidad de auditoría e informes automáticos para tu tranquilidad.", ecosystemTitle: "El ecosistema noble",
    ecosystemHeading: "Capacidades que irradian autoridad.", ecosystemDesc: "Smart Manager mantiene las funciones comerciales esenciales al alcance mientras ofrece a cada equipo los flujos dedicados que necesita para avanzar con precisión.",
    readyCommandCenter: "¿Listo para entrar al centro de mando?", readyCommandCenterDesc: "Inicia el panel ERP de Smart Manager para trabajar con módulos conectados y datos operativos en vivo. Salama na Mwaminifu.",
    launchWorkspace: "Iniciar espacio de trabajo", madeInTanzania: "Hecho en Tanzania", copyright: "© 2026 Smart Manager · Ecosistema empresarial",
    language: "Idioma", workspaceArea: "Área de trabajo", searchEverything: "Buscar módulos, registros y acciones", helpSupport: "Ayuda y soporte", messages: "Mensajes", theme: "Tema", switchLanguage: "Cambiar idioma", takeTour: "Hacer un recorrido", closeTour: "Cerrar el recorrido de introducción",
  },
  pt: {
    brandTitle: "Smart Manager", brandSubtitle: "ERP operacional", capabilities: "Capacidades", whyUs: "Por que nós", launch: "Iniciar", launchApp: "Abrir aplicação",
    heroBadge: "Solução empresarial tanzaniana para empresas", heroTitle1: "Conduza o trabalho.", heroTitle2: "Veja todo o negócio.",
    heroSubtitle: "Gerencie o seu negócio. Em qualquer lugar, a qualquer momento. O Smart Manager reúne os fluxos comerciais, financeiros e operacionais num único centro de comando.",
    exploreCapabilities: "Explorar capacidades", liveOperationalData: "Dados operacionais em tempo real", connectedModules: "Módulos de negócio conectados", actionReadyWorkflows: "Fluxos de trabalho prontos para agir",
    businessOverview: "Visão geral do negócio", liveWorkspace: "Espaço de trabalho em tempo real", operationalMomentum: "Impulso operacional", nextBestAction: "Próxima melhor ação", nextBestActionDesc: "Reveja as prioridades reveladas pelos seus fluxos de trabalho conectados.",
    oneWorkspace: "Um só espaço", oneWorkspaceDesc: "Centralize os fluxos de clientes, inventário, finanças e pessoas num único centro de comando.", liveDataPath: "Fluxo de dados em tempo real", liveDataPathDesc: "A integração direta com o Supabase garante que cada sinal seja preciso e esteja pronto para agir.",
    builtInControls: "Controlos integrados", builtInControlsDesc: "Acesso por funções, visibilidade de auditoria e relatórios automáticos para maior tranquilidade.", ecosystemTitle: "O ecossistema nobre",
    ecosystemHeading: "Capacidades que irradiam autoridade.", ecosystemDesc: "O Smart Manager mantém as funções essenciais do negócio ao alcance, ao mesmo tempo que dá a cada equipa os fluxos dedicados de que precisa para avançar com precisão.",
    readyCommandCenter: "Pronto para entrar no centro de comando?", readyCommandCenterDesc: "Abra o painel ERP do Smart Manager para trabalhar com módulos conectados e dados operacionais em tempo real. Salama na Mwaminifu.",
    launchWorkspace: "Abrir espaço de trabalho", madeInTanzania: "Feito na Tanzânia", copyright: "© 2026 Smart Manager · Ecossistema empresarial",
    language: "Idioma", workspaceArea: "Área de trabalho", searchEverything: "Pesquisar módulos, registos e ações", helpSupport: "Ajuda e suporte", messages: "Mensagens", theme: "Tema", switchLanguage: "Mudar idioma", takeTour: "Fazer uma visita", closeTour: "Fechar a visita de introdução",
  },
  zh: {
    brandTitle: "Smart Manager", brandSubtitle: "运营 ERP", capabilities: "功能", whyUs: "为什么选择我们", launch: "开始", launchApp: "打开应用",
    heroBadge: "面向企业的坦桑尼亚企业解决方案", heroTitle1: "经营工作。", heroTitle2: "看清整个业务。",
    heroSubtitle: "随时随地管理您的业务。Smart Manager 将商业、财务和运营工作流汇聚于一个卓越的指挥中心。",
    exploreCapabilities: "探索功能", liveOperationalData: "实时运营数据", connectedModules: "互联业务模块", actionReadyWorkflows: "可执行的工作流",
    businessOverview: "业务概览", liveWorkspace: "实时工作区", operationalMomentum: "运营动能", nextBestAction: "下一步最佳行动", nextBestActionDesc: "查看互联业务工作流呈现的优先事项。",
    oneWorkspace: "一个工作区", oneWorkspaceDesc: "在同一个指挥中心集中管理客户、库存、财务和人员工作流。", liveDataPath: "实时数据通道", liveDataPathDesc: "直接对接 Supabase，确保每个信号都准确且可立即执行。",
    builtInControls: "内置管控", builtInControlsDesc: "基于角色的访问、审计可见性和自动化报告，让您安心无忧。", ecosystemTitle: "卓越生态系统",
    ecosystemHeading: "彰显权威的功能体系。", ecosystemDesc: "Smart Manager 让核心业务功能触手可及，同时为每个团队提供精准推进工作所需的专属工作流。",
    readyCommandCenter: "准备好进入指挥中心了吗？", readyCommandCenterDesc: "启动 Smart Manager ERP 仪表板，使用互联模块和实时运营数据开展工作。Salama na Mwaminifu.",
    launchWorkspace: "启动工作区", madeInTanzania: "坦桑尼亚制造", copyright: "© 2026 Smart Manager · 企业业务生态系统",
    language: "语言", workspaceArea: "工作区", searchEverything: "搜索模块、记录和操作", helpSupport: "帮助与支持", messages: "消息", theme: "主题", switchLanguage: "切换语言", takeTour: "开始导览", closeTour: "关闭入门导览",
  },
  ar: {
    brandTitle: "Smart Manager", brandSubtitle: "نظام تخطيط موارد المؤسسات", capabilities: "القدرات", whyUs: "لماذا نحن", launch: "بدء", launchApp: "فتح التطبيق",
    heroBadge: "حل مؤسسي تنزاني للشركات", heroTitle1: "أدر العمل.", heroTitle2: "شاهد الأعمال بأكملها.",
    heroSubtitle: "أدر أعمالك. في أي مكان، وفي أي وقت. يجمع Smart Manager سير العمل التجاري والمالي والتشغيلي في مركز قيادة واحد.",
    exploreCapabilities: "استكشاف القدرات", liveOperationalData: "بيانات تشغيلية مباشرة", connectedModules: "وحدات أعمال متصلة", actionReadyWorkflows: "سير عمل جاهز للتنفيذ",
    businessOverview: "نظرة عامة على الأعمال", liveWorkspace: "مساحة عمل مباشرة", operationalMomentum: "الزخم التشغيلي", nextBestAction: "أفضل إجراء تالٍ", nextBestActionDesc: "راجع الأولويات التي تكشفها سير عمل أعمالك المتصلة.",
    oneWorkspace: "مساحة عمل واحدة", oneWorkspaceDesc: "اجمع سير عمل العملاء والمخزون والمالية والأفراد في مركز قيادة واحد.", liveDataPath: "مسار بيانات مباشر", liveDataPathDesc: "يضمن التكامل المباشر مع Supabase أن كل إشارة دقيقة وجاهزة للتنفيذ.",
    builtInControls: "ضوابط مدمجة", builtInControlsDesc: "وصول حسب الأدوار ووضوح التدقيق وتقارير تلقائية لراحة البال.", ecosystemTitle: "النظام البيئي النبيل",
    ecosystemHeading: "قدرات تشع بالمكانة.", ecosystemDesc: "يبقي Smart Manager وظائف الأعمال الأساسية في المتناول مع منح كل فريق سير العمل المخصص الذي يحتاجه للمضي قدمًا بدقة.",
    readyCommandCenter: "هل أنت مستعد لدخول مركز القيادة؟", readyCommandCenterDesc: "افتح لوحة تحكم Smart Manager ERP للعمل مع وحدات متصلة وبيانات تشغيلية مباشرة. Salama na Mwaminifu.",
    launchWorkspace: "فتح مساحة العمل", madeInTanzania: "صُنع في تنزانيا", copyright: "© 2026 Smart Manager · نظام بيئي للأعمال المؤسسية",
    language: "اللغة", workspaceArea: "مساحة العمل", searchEverything: "البحث في الوحدات والسجلات والإجراءات", helpSupport: "المساعدة والدعم", messages: "الرسائل", theme: "السمة", switchLanguage: "تغيير اللغة", takeTour: "بدء الجولة", closeTour: "إغلاق جولة التعريف",
  },
  de: {
    brandTitle: "Smart Manager", brandSubtitle: "Operatives ERP", capabilities: "Funktionen", whyUs: "Warum wir", launch: "Starten", launchApp: "App öffnen",
    heroBadge: "Tansanische Unternehmenslösung für Unternehmen", heroTitle1: "Führen Sie die Arbeit.", heroTitle2: "Sehen Sie das ganze Unternehmen.",
    heroSubtitle: "Führen Sie Ihr Unternehmen. Überall, jederzeit. Smart Manager vereint kaufmännische, finanzielle und operative Abläufe in einem zentralen Kommandocenter.",
    exploreCapabilities: "Funktionen entdecken", liveOperationalData: "Live-Betriebsdaten", connectedModules: "Verbundene Geschäftsmodule", actionReadyWorkflows: "Handlungsbereite Workflows",
    businessOverview: "Geschäftsübersicht", liveWorkspace: "Live-Arbeitsbereich", operationalMomentum: "Betriebliche Dynamik", nextBestAction: "Nächste beste Aktion", nextBestActionDesc: "Überprüfen Sie die Prioritäten, die Ihre verbundenen Geschäfts-Workflows aufzeigen.",
    oneWorkspace: "Ein Arbeitsbereich", oneWorkspaceDesc: "Zentralisieren Sie Kunden-, Lager-, Finanz- und Personal-Workflows in einem Kommandocenter.", liveDataPath: "Live-Datenpfad", liveDataPathDesc: "Die direkte Supabase-Integration stellt sicher, dass jedes Signal präzise und handlungsbereit ist.",
    builtInControls: "Integrierte Kontrollen", builtInControlsDesc: "Rollenbasierter Zugriff, Audit-Transparenz und automatisierte Berichte für Sicherheit.", ecosystemTitle: "Das edle Ökosystem",
    ecosystemHeading: "Funktionen, die Autorität ausstrahlen.", ecosystemDesc: "Smart Manager hält Kernfunktionen des Unternehmens griffbereit und gibt jedem Team die speziellen Workflows, die es braucht, um präzise voranzukommen.",
    readyCommandCenter: "Bereit, das Kommandocenter zu betreten?", readyCommandCenterDesc: "Starten Sie das Smart Manager ERP-Dashboard, um mit verbundenen Modulen und Live-Betriebsdaten zu arbeiten. Salama na Mwaminifu.",
    launchWorkspace: "Arbeitsbereich starten", madeInTanzania: "Hergestellt in Tansania", copyright: "© 2026 Smart Manager · Unternehmens-Ökosystem",
    language: "Sprache", workspaceArea: "Arbeitsbereich", searchEverything: "Module, Datensätze und Aktionen suchen", helpSupport: "Hilfe und Support", messages: "Nachrichten", theme: "Design", switchLanguage: "Sprache wechseln", takeTour: "Tour starten", closeTour: "Einführungstour schließen",
  },
  hi: {
    brandTitle: "Smart Manager", brandSubtitle: "ऑपरेशनल ERP", capabilities: "क्षमताएँ", whyUs: "हमें क्यों चुनें", launch: "शुरू करें", launchApp: "ऐप खोलें",
    heroBadge: "व्यवसायों के लिए तंज़ानियाई एंटरप्राइज़ समाधान", heroTitle1: "काम चलाएँ।", heroTitle2: "पूरा व्यवसाय देखें।",
    heroSubtitle: "अपना व्यवसाय संभालें। कहीं भी, कभी भी। Smart Manager वाणिज्यिक, वित्तीय और परिचालन वर्कफ़्लो को एक शानदार कमांड सेंटर में एक साथ लाता है।",
    exploreCapabilities: "क्षमताएँ देखें", liveOperationalData: "लाइव परिचालन डेटा", connectedModules: "जुड़े व्यावसायिक मॉड्यूल", actionReadyWorkflows: "कार्य-तैयार वर्कफ़्लो",
    businessOverview: "व्यवसाय अवलोकन", liveWorkspace: "लाइव वर्कस्पेस", operationalMomentum: "परिचालन गति", nextBestAction: "अगला सर्वोत्तम कार्य", nextBestActionDesc: "अपने जुड़े व्यावसायिक वर्कफ़्लो द्वारा सामने आई प्राथमिकताओं की समीक्षा करें।",
    oneWorkspace: "एक वर्कस्पेस", oneWorkspaceDesc: "ग्राहक, इन्वेंटरी, वित्त और लोगों के वर्कफ़्लो को एक कमांड सेंटर में केंद्रित करें।", liveDataPath: "लाइव डेटा पथ", liveDataPathDesc: "सीधा Supabase एकीकरण सुनिश्चित करता है कि हर संकेत सटीक और कार्य-तैयार हो।",
    builtInControls: "अंतर्निहित नियंत्रण", builtInControlsDesc: "भूमिका-आधारित पहुँच, ऑडिट पारदर्शिता और स्वचालित रिपोर्टिंग से मन की शांति।", ecosystemTitle: "उत्तम पारिस्थितिकी तंत्र",
    ecosystemHeading: "अधिकार बिखेरने वाली क्षमताएँ।", ecosystemDesc: "Smart Manager मुख्य व्यावसायिक कार्यों को पहुँच में रखता है और हर टीम को सटीकता से आगे बढ़ने के लिए आवश्यक समर्पित वर्कफ़्लो देता है।",
    readyCommandCenter: "कमांड सेंटर में प्रवेश के लिए तैयार हैं?", readyCommandCenterDesc: "जुड़े मॉड्यूल और लाइव परिचालन डेटा के साथ काम करने के लिए Smart Manager ERP डैशबोर्ड लॉन्च करें। Salama na Mwaminifu.",
    launchWorkspace: "वर्कस्पेस लॉन्च करें", madeInTanzania: "तंज़ानिया में निर्मित", copyright: "© 2026 Smart Manager · एंटरप्राइज़ व्यवसाय पारिस्थितिकी तंत्र",
    language: "भाषा", workspaceArea: "वर्कस्पेस", searchEverything: "मॉड्यूल, रिकॉर्ड और कार्य खोजें", helpSupport: "सहायता और समर्थन", messages: "संदेश", theme: "थीम", switchLanguage: "भाषा बदलें", takeTour: "टूर लें", closeTour: "ऑनबोर्डिंग टूर बंद करें",
  },
  ja: {
    brandTitle: "Smart Manager", brandSubtitle: "業務 ERP", capabilities: "機能", whyUs: "選ばれる理由", launch: "開始", launchApp: "アプリを開く",
    heroBadge: "企業向けタンザニア発エンタープライズソリューション", heroTitle1: "業務を動かす。", heroTitle2: "ビジネス全体を見る。",
    heroSubtitle: "ビジネスを管理。いつでも、どこでも。Smart Manager は商業・財務・運用のワークフローを一つの洗練されたコマンドセンターに統合します。",
    exploreCapabilities: "機能を見る", liveOperationalData: "ライブ運用データ", connectedModules: "連携ビジネスモジュール", actionReadyWorkflows: "実行可能なワークフロー",
    businessOverview: "ビジネス概要", liveWorkspace: "ライブワークスペース", operationalMomentum: "運用の勢い", nextBestAction: "次の最適なアクション", nextBestActionDesc: "連携ワークフローが示す優先事項を確認します。",
    oneWorkspace: "一つのワークスペース", oneWorkspaceDesc: "顧客、在庫、財務、人材のワークフローを一つのコマンドセンターに集約します。", liveDataPath: "ライブデータパス", liveDataPathDesc: "Supabase との直接連携により、すべてのシグナルが正確で実行可能であることを保証します。",
    builtInControls: "組み込みコントロール", builtInControlsDesc: "ロールベースのアクセス、監査の可視性、自動レポートで安心を提供します。", ecosystemTitle: "気高いエコシステム",
    ecosystemHeading: "権威を放つ機能。", ecosystemDesc: "Smart Manager は中核となるビジネス機能を手の届くところに置き、各チームが正確に前進するための専用ワークフローを提供します。",
    readyCommandCenter: "コマンドセンターに入る準備はできましたか？", readyCommandCenterDesc: "Smart Manager ERP ダッシュボードを起動し、連携モジュールとライブ運用データで作業します。Salama na Mwaminifu.",
    launchWorkspace: "ワークスペースを起動", madeInTanzania: "タンザニア製", copyright: "© 2026 Smart Manager · エンタープライズビジネスエコシステム",
    language: "言語", workspaceArea: "ワークスペース", searchEverything: "モジュール、記録、操作を検索", helpSupport: "ヘルプとサポート", messages: "メッセージ", theme: "テーマ", switchLanguage: "言語を変更", takeTour: "ツアーを開始", closeTour: "オンボーディングツアーを閉じる",
  },
};

function normalizeLanguage(value: string | null | undefined): Lang | null {
  const normalized = String(value || "").toLowerCase().split(/[-_]/)[0] as Lang;
  return LANGUAGE_OPTIONS.some((option) => option.code === normalized) ? normalized : null;
}

function readStoredLanguage(key: string): string | null {
  try {
    return window.localStorage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function initialLanguage(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = readStoredLanguage("smart_manager_lang");
  const legacyStored = readStoredLanguage("bs_lang");
  const savedLanguage = normalizeLanguage(stored) || normalizeLanguage(legacyStored);
  if (savedLanguage) return savedLanguage;
  const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const browserLanguage of browserLanguages) {
    if (browserLanguage?.toLowerCase().startsWith("sw")) return "sw";
    const detected = normalizeLanguage(browserLanguage);
    if (detected) return detected;
  }
  try { if (Intl.DateTimeFormat().resolvedOptions().timeZone === "Africa/Dar_es_Salaam") return "sw"; } catch { /* English fallback */ }
  return "en";
}

function syncLanguageDocument(newLang: Lang) {
  if (typeof document === "undefined") return;
  const option = LANGUAGE_OPTIONS.find((item) => item.code === newLang);
  document.documentElement.lang = newLang;
  document.documentElement.dir = option?.dir || "ltr";
  document.documentElement.dataset.smartManagerLanguage = newLang;
  window.dispatchEvent(new CustomEvent("smart-manager:language-changed", { detail: { lang: newLang, source: "smart-manager-localization" } }));
  document.querySelectorAll<HTMLElement>(".dashboard-language-code, .sm-language-code").forEach((element) => {
    element.textContent = newLang.toUpperCase();
  });
}

interface LanguageContextType {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string) => string;
  languageOptions: LanguageOption[];
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthContext();
  const liveSession = Boolean(auth.configured && auth.session?.access_token && auth.isAuthenticated);
  const authenticatedUserId = auth.user?.id;
  const profileQuery = trpc.profileIdentity.get.useQuery(undefined, {
    enabled: liveSession,
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
  const persistLanguageMutation = trpc.profileIdentity.update.useMutation();
  const [lang, setLangState] = useState<Lang>(initialLanguage);
  const [profileHydrated, setProfileHydrated] = useState(!liveSession);

  useEffect(() => {
    if (liveSession) setProfileHydrated(false);
  }, [authenticatedUserId, liveSession]);

  useEffect(() => {
    if (!liveSession) {
      setProfileHydrated(true);
      return;
    }
    if (profileQuery.isPending || profileQuery.isFetching) return;
    const remoteProfile = profileQuery.data?.profile;
    const remoteLanguage = remoteProfile && remoteProfile.id === authenticatedUserId
      ? normalizeLanguage(profileQuery.data?.preferences?.language || remoteProfile.preferredLanguage)
      : null;
    if (remoteLanguage) {
      setLangState(remoteLanguage);
      if (typeof window !== "undefined") {
        localStorage.setItem("smart_manager_lang", remoteLanguage);
        localStorage.setItem("bs_lang", remoteLanguage);
      }
    }
    setProfileHydrated(true);
  }, [authenticatedUserId, liveSession, profileQuery.data, profileQuery.isFetching, profileQuery.isPending]);

  const setLang = (newLang: Lang) => {
    setLangState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem("smart_manager_lang", newLang);
      localStorage.setItem("bs_lang", newLang);
    }
    if (liveSession && profileHydrated && profileQuery.data?.profile?.id === authenticatedUserId) {
      persistLanguageMutation.mutate({ preferredLanguage: newLang });
    }
  };
  useEffect(() => {
    syncLanguageDocument(lang);
  }, [lang]);
  useEffect(() => installDocumentLocalization(lang), []);
  useEffect(() => setDocumentLocalization(lang), [lang]);
  const t = (key: string) => translations[lang]?.[key] || translations.en[key] || key;
  return <LanguageContext.Provider value={{ lang, setLang, t, languageOptions: LANGUAGE_OPTIONS }}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

// Auth surfaces can be mounted in isolated tests without the provider. In that
// case they still need a working switcher, so fall back to an equivalent local
// controller backed by the same storage keys and document attributes.
export function useLanguageOptional(): LanguageContextType {
  const context = useContext(LanguageContext);
  const [fallbackLang, setFallbackLang] = useState<Lang>(initialLanguage);
  useEffect(() => {
    if (!context) syncLanguageDocument(fallbackLang);
  }, [context, fallbackLang]);
  const fallback = useMemo<LanguageContextType>(() => ({
    lang: fallbackLang,
    setLang: (nextLang: Lang) => {
      setFallbackLang(nextLang);
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem("smart_manager_lang", nextLang);
          localStorage.setItem("bs_lang", nextLang);
        } catch { /* storage can be unavailable in embedded or test contexts */ }
      }
    },
    t: (key: string) => translations[fallbackLang]?.[key] || translations.en[key] || key,
    languageOptions: LANGUAGE_OPTIONS,
  }), [fallbackLang]);
  return context || fallback;
}
