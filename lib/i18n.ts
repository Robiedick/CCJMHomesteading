const dictionaries = {
  en: () => import("@/messages/en.json").then((module) => module.default),
  nl: () => import("@/messages/nl.json").then((module) => module.default),
} as const;

export const locales = ["en", "nl"] as const;

export type Locale = (typeof locales)[number];

export const FALLBACK_LOCALE: Locale = "nl";
export const DEFAULT_LOCALE: Locale = FALLBACK_LOCALE;

export async function getDictionary(locale: Locale) {
  const dictionaryLoader = dictionaries[locale] ?? dictionaries[FALLBACK_LOCALE];
  return dictionaryLoader();
}

export function getLocaleLabel(locale: Locale) {
  switch (locale) {
    case "nl":
      return { label: "Nederlands", short: "NL" };
    case "en":
    default:
      return { label: "English", short: "EN" };
  }
}

export function isSupportedLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}
