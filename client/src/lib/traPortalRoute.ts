export type TraPortalLanguage = "en" | "sw";

export function resolveTraPortalLanguage(value: unknown): TraPortalLanguage {
  return value === "sw" ? "sw" : "en";
}

export function readPersistedTraPortalLanguage(storage: Pick<Storage, "getItem"> | null | undefined): TraPortalLanguage {
  try {
    return resolveTraPortalLanguage(storage?.getItem("bs_lang"));
  } catch {
    return "en";
  }
}

export function getTraPortalLanguage(): TraPortalLanguage {
  if (typeof window === "undefined") return "en";
  return readPersistedTraPortalLanguage(window.localStorage);
}
