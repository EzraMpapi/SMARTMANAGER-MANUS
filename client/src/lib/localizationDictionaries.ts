import type { Lang } from "../contexts/LanguageContext";
import type { PhraseDictionary } from "./domLocalization";

// Generated per-language phrase bundles. They are code-split by the bundler so
// English keeps the smallest payload and each translation is only fetched when
// the user actually selects that language.
type DictionaryModule = { default: PhraseDictionary };

const DICTIONARY_LOADERS: Record<Exclude<Lang, "en">, () => Promise<DictionaryModule>> = {
  sw: () => import("./phrases/sw.json"),
  fr: () => import("./phrases/fr.json"),
  es: () => import("./phrases/es.json"),
  pt: () => import("./phrases/pt.json"),
  zh: () => import("./phrases/zh.json"),
  ar: () => import("./phrases/ar.json"),
  de: () => import("./phrases/de.json"),
  hi: () => import("./phrases/hi.json"),
  ja: () => import("./phrases/ja.json"),
};

const cache = new Map<Lang, PhraseDictionary>();

export async function loadLanguageDictionary(lang: Lang): Promise<PhraseDictionary> {
  if (lang === "en") return {};
  const cached = cache.get(lang);
  if (cached) return cached;
  const loaded = await DICTIONARY_LOADERS[lang]();
  const dictionary = loaded.default || {};
  cache.set(lang, dictionary);
  return dictionary;
}

export function preloadLanguageDictionary(lang: Lang): void {
  if (lang === "en") return;
  void loadLanguageDictionary(lang).catch(() => undefined);
}
