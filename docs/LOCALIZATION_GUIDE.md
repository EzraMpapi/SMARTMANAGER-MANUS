# Smart Manager Localization Guide

This guide explains how to add new UI phrases and how to add a supported language to the Smart Manager ERP application.

The application currently has two complementary localization paths:

1. **Typed React translations** — preferred for new components through `useLanguage().t(key)`.
2. **DOM localization bridge** — compatibility support for legacy, literal, lazy-loaded, and dynamically inserted UI through `PHRASES` in `client/src/lib/domLocalization.ts`.

Use the typed API for new code. Add a bridge phrase when a legacy or lazy-loaded module still renders a literal string, or when a phrase must be translated in an HTML attribute such as `placeholder`, `title`, or `aria-label`.

## Supported languages

Language codes are defined in `client/src/contexts/LanguageContext.tsx`:

| Code | Language | Direction |
|---|---|---|
| `en` | English | LTR |
| `sw` | Kiswahili | LTR |
| `fr` | French | LTR |
| `es` | Spanish | LTR |
| `pt` | Portuguese | LTR |
| `zh` | Simplified Chinese | LTR |
| `ar` | Arabic | RTL |
| `de` | German | LTR |
| `hi` | Hindi | LTR |
| `ja` | Japanese | LTR |

## Adding a phrase to a new component

### Preferred: use the typed translation API

Import and call `useLanguage()` in the component:

```tsx
import { useLanguage } from "../contexts/LanguageContext";

export function ExamplePanel() {
  const { t } = useLanguage();

  return (
    <section aria-label={t("Inventory overview")}>
      <h2>{t("Inventory overview")}</h2>
      <button type="button">{t("Add item")}</button>
    </section>
  );
}
```

Then add the key to the `translations` object in `LanguageContext.tsx` for every language. Keep the English key as the fallback:

```tsx
const translations: Record<Lang, Record<string, string>> = {
  en: {
    // existing entries...
    inventoryOverview: "Inventory overview",
    addItem: "Add item",
  },
  sw: {
    // existing entries...
    inventoryOverview: "Muhtasari wa hesabu ya bidhaa",
    addItem: "Ongeza bidhaa",
  },
  // Add the same keys to the other language records.
};
```

The current `t()` function accepts a string key. Existing code commonly uses semantic keys such as `inventoryOverview`; legacy code may use the literal English phrase as the key. Prefer semantic keys for new UI because they remain stable if English wording changes.

### Legacy or lazy-loaded UI: add a `PHRASES` entry

If a module still renders a literal string, add an entry to `PHRASES` in `client/src/lib/domLocalization.ts`:

```ts
"Inventory overview": {
  sw: "Muhtasari wa hesabu ya bidhaa",
  fr: "Vue d’ensemble de l’inventaire",
  es: "Resumen del inventario",
  pt: "Visão geral do inventário",
  zh: "库存概览",
  ar: "نظرة عامة على المخزون",
  de: "Inventarübersicht",
  hi: "इन्वेंटरी अवलोकन",
  ja: "在庫概要",
},
```

Rules for bridge phrases:

- The source key must exactly match the rendered English phrase after trimming whitespace.
- Preserve product names, acronyms, IDs, URLs, and tax codes.
- Do not add customer names, invoice values, database values, or other user data to the static catalog.
- Keep punctuation consistent across translations where it carries meaning.
- Include all supported non-English language fields. English is the source/fallback value and does not need to be repeated in `PHRASES`.
- Use `aria-label`, `title`, and `placeholder` for accessible and form-control text; the bridge stores the original attribute in `data-i18n-original-*` so language switching can be reversed safely.

## Finding phrases that still need translation

Run the extractor from the repository root:

```bash
python3 scripts/extract_localization_phrases.py
```

The script scans `client/src/**/*.jsx` and `client/src/**/*.tsx` for:

- Capitalized JSX text nodes such as `<h2>Inventory overview</h2>`.
- Literal `aria-label`, `title`, and `placeholder` attributes.

It writes the candidate list to:

```text
/tmp/localization_phrases.json
```

The extractor currently limits the output to 360 candidates and ignores phrases with more than 16 words. Review the generated list before translating it; not every extracted string is a user-facing phrase. Remove product names, examples, test fixtures, and data values that should not be translated.

## Using the translation schema tooling

The schema at `scripts/translation_schema.json` describes the structured output expected for batch translation. Each translation item has this shape:

```json
{
  "source": "Inventory overview",
  "sw": "Muhtasari wa hesabu ya bidhaa",
  "fr": "Vue d’ensemble de l’inventaire",
  "es": "Resumen del inventario",
  "pt": "Visão geral do inventário",
  "zh": "库存概览",
  "ar": "نظرة عامة على المخزون",
  "de": "Inventarübersicht",
  "hi": "इन्वेंटरी अवलोकन",
  "ja": "在庫概要"
}
```

For a batch, the top-level response is:

```json
{
  "translations": [
    {
      "source": "Inventory overview",
      "sw": "Muhtasari wa hesabu ya bidhaa",
      "fr": "Vue d’ensemble de l’inventaire",
      "es": "Resumen del inventario",
      "pt": "Visão geral do inventário",
      "zh": "库存概览",
      "ar": "نظرة عامة على المخزون",
      "de": "Inventarübersicht",
      "hi": "इन्वेंटरी अवलोकन",
      "ja": "在庫概要"
    }
  ]
}
```

The schema rejects missing language fields and unexpected fields. Validate any generated response before merging it into the bridge. For automated generation through the built-in LLM batch helper, use the schema with a modest worker count:

```bash
python3 /home/ubuntu/skills/builtin-llm-models/scripts/llm_batch.py \
  --input /tmp/translation_chunks.json \
  --out /tmp/translation_results.jsonl \
  --model gpt-5-mini \
  --workers 6 \
  --schema scripts/translation_schema.json \
  --system 'You are a professional software UI translator. Preserve placeholders, acronyms, product names, numbers, and punctuation.' \
  --template 'Translate every source phrase in this JSON array into all schema languages. Return strict JSON only: {input}'
```

Before using a model, verify the live model catalog as required by the built-in model guidance:

```bash
curl -s "$OPENAI_API_BASE/models" \
  -H "Authorization: Bearer $OPENAI_API_KEY" \
  -o /tmp/models.json
```

Do not commit `/tmp` files or generated credentials. Review generated translations manually, especially Arabic RTL text, Kiswahili terminology, tax terminology, and industry-specific labels.

## Adding a completely new language

Adding a language requires coordinated updates in four places.

### 1. Extend the `Lang` type and language selector

In `client/src/contexts/LanguageContext.tsx`, add the new code to `Lang` and add a `LANGUAGE_OPTIONS` entry:

```tsx
export type Lang = "en" | "sw" | "fr" | "es" | "pt" | "zh" | "ar" | "de" | "hi" | "ja" | "it";

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  // existing options...
  { code: "it", label: "Italian", nativeLabel: "Italiano" },
];
```

If the language is RTL, add `dir: "rtl"` and verify the application layout, menus, dialogs, tables, and charts in that direction.

### 2. Add a typed translation record

Add an `it` record to `translations` and provide translations for the typed application keys. English remains the fallback when a key is missing, but a production language should not intentionally rely on that fallback.

### 3. Extend the bridge phrase type and catalog

`PHRASES` is typed from `Lang`, so TypeScript will identify phrase objects that need the new field. Add the new language field to every bridge phrase, including existing entries and new entries.

For a large language addition, use a script to update every object rather than editing thousands of lines manually. Validate the result with `pnpm run check` and review a representative sample from every module.

### 4. Extend the translation schema

Add the new language code to:

- `properties` in `scripts/translation_schema.json`.
- The `required` array in the same schema.
- The translation prompt used for batch generation.
- Any scripts that enumerate language fields.

Example for Italian:

```json
"it": { "type": "string" }
```

and:

```json
"required": [
  "source", "sw", "fr", "es", "pt", "zh", "ar", "de", "hi", "ja", "it"
]
```

Do not add a language only to the schema. The selector, typed translations, bridge catalog, and document direction behavior must all be updated together.

## Dynamic content and placeholders

Use the typed translation function for dynamic phrases with interpolation handled explicitly by the component:

```tsx
const { t } = useLanguage();
const label = `${t("Invoice")} ${invoiceNumber}`;
```

Do not place a database value directly into `PHRASES`. For a fixed phrase containing a placeholder, preserve the placeholder consistently in every language:

```ts
"Delete {name}": {
  sw: "Futa {name}",
  fr: "Supprimer {name}",
  // ...
},
```

The bridge translates exact text nodes and common attributes. It deliberately skips `INPUT`, `TEXTAREA`, `OPTION`, scripts, and styles so it does not overwrite user-entered values or implementation content.

## Validation checklist

Run these commands from the repository root:

```bash
pnpm run check
pnpm run test
pnpm exec vite build
```

The full production command also runs the Supabase schema guard:

```bash
pnpm run build
```

That command requires valid `SUPABASE_URL` (or `VITE_SUPABASE_URL`) and `SUPABASE_SECRET_KEY` environment variables. If those secrets are not available locally, use `pnpm exec vite build` for frontend validation and run the full build in CI or the deployment environment.

Before committing, manually verify:

- The new phrase changes when switching from English to Kiswahili and back.
- A lazy-loaded module translates after navigation without a page refresh.
- A modal and its buttons translate.
- `aria-label`, `title`, and `placeholder` values translate and restore correctly.
- User-entered input values remain unchanged.
- Arabic sets `document.documentElement.dir` to `rtl` when selected.
- Product names, customer data, invoice numbers, and IDs remain unchanged.
- No phrase is duplicated with conflicting translations.

Then inspect the diff and commit:

```bash
git diff --check
git status --short
git add client/src/contexts/LanguageContext.tsx client/src/lib/domLocalization.ts scripts/translation_schema.json
git commit -m "feat: add <language> localization"
git push origin main
```

## Troubleshooting

### The phrase remains in English

Check that the source text matches the catalog key exactly after trimming whitespace. For typed translations, check that the key exists in the selected language record and in English. For literal legacy UI, ensure the phrase exists in `PHRASES`.

### The phrase translates once but not after switching languages

Make sure the text node was not replaced outside React without preserving its original value. The bridge stores original text nodes and attributes; inspect `data-i18n-original-aria-label`, `data-i18n-original-title`, or `data-i18n-original-placeholder` in DevTools.

### A new language causes TypeScript errors

Search for all `Lang`-typed records and language switches. Update `LANGUAGE_OPTIONS`, `translations`, `PHRASES`, schema fields, and any language-specific test fixtures.

### Prettier changes the catalog format

This is expected. Do not write tests that depend on whether valid object keys are quoted or unquoted, or on exact line wrapping. Test phrase presence with semantic regexes or runtime behavior instead.

### The extractor misses a phrase

The extractor intentionally targets a conservative set of static JSX patterns. Add the phrase manually to the typed translation record or bridge catalog, and consider migrating the component to `useLanguage().t()` rather than expanding a regex for one-off content.
