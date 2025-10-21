import type { Locale } from "@/lib/i18n";

const dictionaries = {
  en: () => import("@/messages/admin/en.json").then((module) => module.default),
  nl: () => import("@/messages/admin/nl.json").then((module) => module.default),
} as const;

export type AdminDictionary = Awaited<ReturnType<typeof dictionaries["en"]>>;

const FALLBACK_ADMIN_LOCALE: Locale = "nl";

export async function getAdminDictionary(locale: Locale): Promise<AdminDictionary> {
  const loader = (dictionaries as Record<string, () => Promise<AdminDictionary>>)[locale] ??
    dictionaries[FALLBACK_ADMIN_LOCALE];
  return loader();
}

export function createAdminTranslator(dictionary: AdminDictionary) {
  return (path: string, variables: Record<string, string | number> = {}) => {
    const value = path.split(".").reduce<unknown>((acc, key) => {
      if (acc && typeof acc === "object" && key in acc) {
        return (acc as Record<string, unknown>)[key];
      }
      return undefined;
    }, dictionary);

    if (typeof value !== "string") {
      return path;
    }

    return value.replace(/{{(.*?)}}/g, (_, token: string) => {
      const normalised = token.trim();
      return String(variables[normalised] ?? "");
    });
  };
}
