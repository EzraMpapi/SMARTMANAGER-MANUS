# Generated phrase bundles

Each `<language>.json` file maps an English source string to its translation for
one locale. They are loaded on demand by `client/src/lib/localizationDictionaries.ts`
and applied to the whole document by the bridge in `client/src/lib/domLocalization.ts`.

## How the bridge uses them

1. Curated phrases inside `domLocalization.ts` (`PHRASES`) always win.
2. Otherwise the selected language's bundle is consulted for an exact match,
   then a case/punctuation-insensitive match, then an interpolated counter such
   as `12 Items`.
3. Text nodes, `aria-label`, `title`, `placeholder`, `alt`, `<option>` labels and
   the document title are localised. User data that is not a known phrase is
   never rewritten.
4. The bundle is only downloaded when a non-English language is selected, so the
   English payload stays unchanged.

## Editing translations

* Preferred: add or override the phrase in `PHRASES` in `domLocalization.ts` so
  the change is reviewable and applies to every language at once.
* Bulk fixes can be made directly in the per-language JSON files. Keep the
  English source string as the key and do not leave the key without a value.
* Never remove a key that still exists in the UI: it will simply fall back to the
  English source.

The current contents were machine translated from the strings rendered by the
client application. Native-speaker review of domain terminology is recommended
before a regulated or customer-facing release.
