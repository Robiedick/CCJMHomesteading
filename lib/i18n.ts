const dictionaries = {
  en: () => import("@/messages/en.json").then((module) => module.default),
  nl: () => import("@/messages/nl.json").then((module) => module.default),
} as const;

export const locales = ["en", "nl"] as const;

export type Locale = (typeof locales)[number];

export const DEFAULT_LOCALE: Locale = "en";

export async function getDictionary(locale: Locale) {
  const dictionaryLoader = dictionaries[locale] ?? dictionaries[DEFAULT_LOCALE];
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
