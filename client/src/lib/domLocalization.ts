import type { Lang } from "../contexts/LanguageContext";

type Phrase = Partial<Record<Lang, string>>;

// This bridge localizes literal text emitted by legacy and lazy-loaded modules while
// those modules are migrated to the typed `useLanguage().t()` API. It only touches
// exact text nodes and common accessibility attributes; inputs, user data, IDs,
// numbers, and generated documents are never modified.
const PHRASES: Record<string, Phrase> = {
  "Capabilities": { sw: "Uwezo", fr: "Fonctionnalités", es: "Capacidades", pt: "Capacidades", zh: "功能", ar: "القدرات", de: "Funktionen", hi: "क्षमताएँ", ja: "機能" },
  "Why Us": { sw: "Kwanini Sisi", fr: "Pourquoi nous", es: "Por qué nosotros", pt: "Por que nós", zh: "为什么选择我们", ar: "لماذا نحن", de: "Warum wir", hi: "हमें क्यों चुनें", ja: "選ばれる理由" },
  "Launch": { sw: "Anza", fr: "Lancer", es: "Iniciar", pt: "Iniciar", zh: "开始", ar: "بدء", de: "Starten", hi: "शुरू करें", ja: "開始" },
  "Dashboard": { sw: "Dashibodi", fr: "Tableau de bord", es: "Panel", pt: "Painel", zh: "仪表板", ar: "لوحة التحكم", de: "Dashboard", hi: "डैशबोर्ड", ja: "ダッシュボード" },
  "Settings": { sw: "Mipangilio", fr: "Paramètres", es: "Configuración", pt: "Definições", zh: "设置", ar: "الإعدادات", de: "Einstellungen", hi: "सेटिंग्स", ja: "設定" },
  "Profile": { sw: "Wasifu", fr: "Profil", es: "Perfil", pt: "Perfil", zh: "个人资料", ar: "الملف الشخصي", de: "Profil", hi: "प्रोफ़ाइल", ja: "プロフィール" },
  "Workspace": { sw: "Eneo la kazi", fr: "Espace de travail", es: "Espacio de trabajo", pt: "Espaço de trabalho", zh: "工作区", ar: "مساحة العمل", de: "Arbeitsbereich", hi: "वर्कस्पेस", ja: "ワークスペース" },
  "Workspace settings": { sw: "Mipangilio ya eneo la kazi", fr: "Paramètres de l’espace de travail", es: "Configuración del espacio de trabajo", pt: "Definições do espaço de trabalho", zh: "工作区设置", ar: "إعدادات مساحة العمل", de: "Arbeitsbereichseinstellungen", hi: "वर्कस्पेस सेटिंग्स", ja: "ワークスペース設定" },
  "Search everything": { sw: "Tafuta kila kitu", fr: "Tout rechercher", es: "Buscar todo", pt: "Pesquisar tudo", zh: "搜索全部", ar: "البحث عن كل شيء", de: "Alles suchen", hi: "सब कुछ खोजें", ja: "すべて検索" },
  "Help and support": { sw: "Msaada na usaidizi", fr: "Aide et support", es: "Ayuda y soporte", pt: "Ajuda e suporte", zh: "帮助与支持", ar: "المساعدة والدعم", de: "Hilfe und Support", hi: "सहायता और समर्थन", ja: "ヘルプとサポート" },
  "Messages": { sw: "Ujumbe", fr: "Messages", es: "Mensajes", pt: "Mensagens", zh: "消息", ar: "الرسائل", de: "Nachrichten", hi: "संदेश", ja: "メッセージ" },
  "Notifications": { sw: "Arifa", fr: "Notifications", es: "Notificaciones", pt: "Notificações", zh: "通知", ar: "الإشعارات", de: "Benachrichtigungen", hi: "सूचनाएं", ja: "通知" },
  "Inventory": { sw: "Hesabu ya bidhaa", fr: "Inventaire", es: "Inventario", pt: "Inventário", zh: "库存", ar: "المخزون", de: "Inventar", hi: "इन्वेंटरी", ja: "在庫" },
  "Finance": { sw: "Fedha", fr: "Finance", es: "Finanzas", pt: "Finanças", zh: "财务", ar: "المالية", de: "Finanzen", hi: "वित्त", ja: "財務" },
  "Sales": { sw: "Mauzo", fr: "Ventes", es: "Ventas", pt: "Vendas", zh: "销售", ar: "المبيعات", de: "Vertrieb", hi: "बिक्री", ja: "販売" },
  "CRM": { sw: "Usimamizi wa wateja", fr: "CRM", es: "CRM", pt: "CRM", zh: "客户管理", ar: "إدارة العملاء", de: "CRM", hi: "सीआरएम", ja: "CRM" },
  "Reports": { sw: "Ripoti", fr: "Rapports", es: "Informes", pt: "Relatórios", zh: "报告", ar: "التقارير", de: "Berichte", hi: "रिपोर्ट", ja: "レポート" },
  "Human Resources": { sw: "Rasilimali watu", fr: "Ressources humaines", es: "Recursos humanos", pt: "Recursos humanos", zh: "人力资源", ar: "الموارد البشرية", de: "Personalwesen", hi: "मानव संसाधन", ja: "人事" },
  "Customer Support": { sw: "Huduma kwa wateja", fr: "Assistance client", es: "Atención al cliente", pt: "Suporte ao cliente", zh: "客户支持", ar: "دعم العملاء", de: "Kundensupport", hi: "ग्राहक सहायता", ja: "カスタマーサポート" },
  "Open in app": { sw: "Fungua kwenye programu", fr: "Ouvrir dans l’application", es: "Abrir en la aplicación", pt: "Abrir na aplicação", zh: "在应用中打开", ar: "فتح في التطبيق", de: "In App öffnen", hi: "ऐप में खोलें", ja: "アプリで開く" },
  "Launch Workspace": { sw: "Fungua eneo la kazi", fr: "Ouvrir l’espace de travail", es: "Abrir el espacio de trabajo", pt: "Abrir o espaço de trabalho", zh: "打开工作区", ar: "فتح مساحة العمل", de: "Arbeitsbereich öffnen", hi: "वर्कस्पेस खोलें", ja: "ワークスペースを開く" },
  "Feedback": { sw: "Maoni", fr: "Commentaires", es: "Comentarios", pt: "Feedback", zh: "反馈", ar: "الملاحظات", de: "Feedback", hi: "प्रतिक्रिया", ja: "フィードバック" },
  "Save": { sw: "Hifadhi", fr: "Enregistrer", es: "Guardar", pt: "Guardar", zh: "保存", ar: "حفظ", de: "Speichern", hi: "सहेजें", ja: "保存" },
  "Cancel": { sw: "Ghairi", fr: "Annuler", es: "Cancelar", pt: "Cancelar", zh: "取消", ar: "إلغاء", de: "Abbrechen", hi: "रद्द करें", ja: "キャンセル" },
  "Close": { sw: "Funga", fr: "Fermer", es: "Cerrar", pt: "Fechar", zh: "关闭", ar: "إغلاق", de: "Schließen", hi: "बंद करें", ja: "閉じる" },
  "Loading…": { sw: "Inapakia…", fr: "Chargement…", es: "Cargando…", pt: "A carregar…", zh: "正在加载…", ar: "جار التحميل…", de: "Wird geladen…", hi: "लोड हो रहा है…", ja: "読み込み中…" },
  "No records found": { sw: "Hakuna rekodi zilizopatikana", fr: "Aucun enregistrement trouvé", es: "No se encontraron registros", pt: "Nenhum registo encontrado", zh: "未找到记录", ar: "لم يتم العثور على سجلات", de: "Keine Datensätze gefunden", hi: "कोई रिकॉर्ड नहीं मिला", ja: "記録が見つかりません" },
  "Take a Tour": { sw: "Anza ziara", fr: "Faire la visite", es: "Hacer el recorrido", pt: "Fazer o tour", zh: "开始导览", ar: "بدء الجولة", de: "Tour starten", hi: "टूर शुरू करें", ja: "ツアーを開始" },
  "Next": { sw: "Endelea", fr: "Suivant", es: "Siguiente", pt: "Seguinte", zh: "下一步", ar: "التالي", de: "Weiter", hi: "अगला", ja: "次へ" },
  "Back": { sw: "Nyuma", fr: "Retour", es: "Atrás", pt: "Voltar", zh: "返回", ar: "رجوع", de: "Zurück", hi: "वापस", ja: "戻る" },
  "Finish tour": { sw: "Maliza ziara", fr: "Terminer la visite", es: "Finalizar recorrido", pt: "Concluir tour", zh: "完成导览", ar: "إنهاء الجولة", de: "Tour beenden", hi: "टूर समाप्त करें", ja: "ツアーを終了" },
  "Run the work.": { sw: "Simamia kazi.", fr: "Faites avancer le travail.", es: "Haz avanzar el trabajo.", pt: "Faça o trabalho avançar.", zh: "推进工作。", ar: "أنجز العمل.", de: "Bringen Sie die Arbeit voran.", hi: "काम को आगे बढ़ाएं।", ja: "仕事を前へ。" },
  "See the whole business.": { sw: "Ona biashara nzima.", fr: "Voyez toute l’entreprise.", es: "Vea todo el negocio.", pt: "Veja todo o negócio.", zh: "看清整个业务。", ar: "شاهد العمل بالكامل.", de: "Sehen Sie das ganze Unternehmen.", hi: "पूरा व्यवसाय देखें।", ja: "ビジネス全体を見渡す。" },
  "Business Overview": { sw: "Muhtasari wa biashara", fr: "Vue d’ensemble", es: "Resumen del negocio", pt: "Visão geral do negócio", zh: "业务概览", ar: "نظرة عامة على الأعمال", de: "Geschäftsübersicht", hi: "व्यवसाय अवलोकन", ja: "ビジネス概要" },
  "Live Workspace": { sw: "Eneo la kazi la moja kwa moja", fr: "Espace de travail en direct", es: "Espacio de trabajo en vivo", pt: "Espaço de trabalho ao vivo", zh: "实时工作区", ar: "مساحة عمل مباشرة", de: "Live-Arbeitsbereich", hi: "लाइव वर्कस्पेस", ja: "ライブワークスペース" },
  "Connected": { sw: "Imeunganishwa", fr: "Connecté", es: "Conectado", pt: "Ligado", zh: "已连接", ar: "متصل", de: "Verbunden", hi: "कनेक्टेड", ja: "接続済み" },
  "Operational Momentum": { sw: "Kasi ya uendeshaji", fr: "Dynamique opérationnelle", es: "Impulso operativo", pt: "Ritmo operacional", zh: "运营势头", ar: "الزخم التشغيلي", de: "Operative Dynamik", hi: "परिचालन गति", ja: "業務の勢い" },
  "Live Workflow": { sw: "Mtiririko wa moja kwa moja", fr: "Flux de travail en direct", es: "Flujo de trabajo en vivo", pt: "Fluxo de trabalho ao vivo", zh: "实时工作流", ar: "سير عمل مباشر", de: "Live-Workflow", hi: "लाइव वर्कफ़्लो", ja: "ライブワークフロー" },
  "One Workspace": { sw: "Eneo moja la kazi", fr: "Un seul espace de travail", es: "Un solo espacio de trabajo", pt: "Um único espaço de trabalho", zh: "一个工作区", ar: "مساحة عمل واحدة", de: "Ein Arbeitsbereich", hi: "एक वर्कस्पेस", ja: "1つのワークスペース" },
  "Live Data Path": { sw: "Njia ya data ya moja kwa moja", fr: "Chemin des données en direct", es: "Ruta de datos en vivo", pt: "Caminho de dados ao vivo", zh: "实时数据路径", ar: "مسار البيانات المباشر", de: "Live-Datenpfad", hi: "लाइव डेटा पथ", ja: "ライブデータパス" },
  "Built-in Controls": { sw: "Udhibiti uliojengewa ndani", fr: "Contrôles intégrés", es: "Controles integrados", pt: "Controlos integrados", zh: "内置控制", ar: "ضوابط مدمجة", de: "Integrierte Kontrollen", hi: "अंतर्निहित नियंत्रण", ja: "組み込みコントロール" },
  "The Noble Ecosystem": { sw: "Mfumo thabiti", fr: "L’écosystème Noble", es: "El ecosistema Noble", pt: "O ecossistema Noble", zh: "Noble 生态系统", ar: "منظومة Noble", de: "Das Noble-Ökosystem", hi: "नोबल इकोसिस्टम", ja: "Nobleエコシステム" },
  "Capabilities that radiate authority.": { sw: "Uwezo unaoleta mamlaka.", fr: "Des capacités qui inspirent l’autorité.", es: "Capacidades que transmiten autoridad.", pt: "Capacidades que irradiam autoridade.", zh: "彰显权威的能力。", ar: "قدرات تعكس السلطة.", de: "Funktionen, die Autorität ausstrahlen.", hi: "अधिकार प्रदर्शित करने वाली क्षमताएं।", ja: "権威を放つ機能。" },
  "Help us improve Smart Manager.": { sw: "Tusaidie kuboresha Smart Manager.", fr: "Aidez-nous à améliorer Smart Manager.", es: "Ayúdenos a mejorar Smart Manager.", pt: "Ajude-nos a melhorar o Smart Manager.", zh: "帮助我们改进 Smart Manager。", ar: "ساعدنا على تحسين Smart Manager.", de: "Helfen Sie uns, Smart Manager zu verbessern.", hi: "Smart Manager को बेहतर बनाने में हमारी मदद करें।", ja: "Smart Managerの改善にご協力ください。" },
  "Ready to enter the command center?": { sw: "Uko tayari kuingia kwenye kituo cha udhibiti?", fr: "Prêt à entrer dans le centre de commande ?", es: "¿Listo para entrar en el centro de mando?", pt: "Pronto para entrar no centro de comando?", zh: "准备进入指挥中心了吗？", ar: "هل أنت مستعد لدخول مركز القيادة؟", de: "Bereit für das Kommandozentrum?", hi: "कमांड सेंटर में प्रवेश के लिए तैयार हैं?", ja: "コマンドセンターに入る準備はできましたか？" },
};

const originals = new WeakMap<Text, string>();
let observer: MutationObserver | null = null;
let activeLanguage: Lang = "en";

function canonicalValue(value: string): string {
  const trimmed = value.trim();
  if (PHRASES[trimmed]) return trimmed;
  for (const [source, phrase] of Object.entries(PHRASES)) {
    if (Object.values(phrase).some((translated) => translated === trimmed)) return source;
  }
  return value;
}

function translateValue(value: string): string {
  const leading = value.match(/^\s*/)?.[0] || "";
  const trailing = value.match(/\s*$/)?.[0] || "";
  const canonical = canonicalValue(value);
  const phrase = PHRASES[canonical.trim()];
  return `${leading}${phrase?.[activeLanguage] || canonical}${trailing}`;
}
function visit(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) {
    const text = root as Text;
    if (!originals.has(text)) originals.set(text, canonicalValue(text.nodeValue || ""));
    const original = originals.get(text) || "";
    const translated = translateValue(original);
    if (text.nodeValue !== translated) text.nodeValue = translated;
    return;
  }
  if (root.nodeType !== Node.ELEMENT_NODE) return;
  const element = root as HTMLElement;
  if (["SCRIPT", "STYLE", "NOSCRIPT", "TEXTAREA", "INPUT", "OPTION"].includes(element.tagName)) return;
  for (const child of Array.from(root.childNodes)) visit(child);
  for (const attribute of ["aria-label", "title", "placeholder"]) {
    const value = element.getAttribute(attribute);
    if (value && PHRASES[value.trim()]) {
      const key = `data-i18n-original-${attribute}`;
      if (!element.hasAttribute(key)) element.setAttribute(key, value);
      element.setAttribute(attribute, translateValue(value));
    }
  }
}

export function installDocumentLocalization(language: Lang) {
  if (typeof document === "undefined") return () => undefined;
  activeLanguage = language;
  observer?.disconnect();
  visit(document.body);
  observer = new MutationObserver((records) => {
    observer?.disconnect();
    for (const record of records) {
      if (record.type === "characterData") visit(record.target);
      record.addedNodes.forEach(visit);
    }
    observer?.observe(document.body, { childList: true, subtree: true, characterData: true });
  });
  observer.observe(document.body, { childList: true, subtree: true, characterData: true });
  return () => observer?.disconnect();
}

export function setDocumentLocalization(language: Lang) {
  activeLanguage = language;
  if (typeof document !== "undefined" && document.body) visit(document.body);
}

export const localizedPhraseCount = Object.keys(PHRASES).length;
