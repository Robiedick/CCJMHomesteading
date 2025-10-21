import { prisma } from "@/lib/prisma";
import { FALLBACK_LOCALE, isSupportedLocale, type Locale } from "@/lib/i18n";

const DEFAULT_LOCALE_KEY = "defaultLocale";

function resolveLocale(value: unknown): Locale {
  if (typeof value === "string" && isSupportedLocale(value)) {
    return value;
  }
  return FALLBACK_LOCALE;
}

export async function getDefaultLocale(): Promise<Locale> {
  try {
    const record = await prisma.siteSetting.findUnique({
      where: { key: DEFAULT_LOCALE_KEY },
    });
    return resolveLocale(record?.value);
  } catch (error) {
    console.error("Failed to load default locale", error);
    return FALLBACK_LOCALE;
  }
}

export async function setDefaultLocale(locale: Locale): Promise<Locale> {
  await prisma.siteSetting.upsert({
    where: { key: DEFAULT_LOCALE_KEY },
    update: { value: locale },
    create: { key: DEFAULT_LOCALE_KEY, value: locale },
  });

  return locale;
}

export function getFallbackLocale(): Locale {
  return FALLBACK_LOCALE;
}
