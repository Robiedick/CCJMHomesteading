import { prisma } from "@/lib/prisma";
import {
  FALLBACK_LOCALE,
  isSupportedLocale,
  type Locale,
} from "@/lib/i18n";

const DEFAULT_LOCALE_KEY = "defaultLocale";
const CACHE_TTL_MS = 60 * 1000;

let cachedLocale: Locale | null = null;
let cacheExpiresAt = 0;

function resolveLocale(value: unknown): Locale {
  if (typeof value === "string" && isSupportedLocale(value)) {
    return value;
  }
  return FALLBACK_LOCALE;
}

async function loadDefaultLocaleFromDatabase(): Promise<Locale> {
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

export async function getDefaultLocale(forceRefresh = false): Promise<Locale> {
  const now = Date.now();
  if (!forceRefresh && cachedLocale && now < cacheExpiresAt) {
    return cachedLocale;
  }

  const locale = await loadDefaultLocaleFromDatabase();
  cachedLocale = locale;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return locale;
}

export async function setDefaultLocale(locale: Locale): Promise<Locale> {
  await prisma.siteSetting.upsert({
    where: { key: DEFAULT_LOCALE_KEY },
    update: { value: locale },
    create: { key: DEFAULT_LOCALE_KEY, value: locale },
  });

  cachedLocale = locale;
  cacheExpiresAt = Date.now() + CACHE_TTL_MS;
  return locale;
}

export function clearDefaultLocaleCache() {
  cachedLocale = null;
  cacheExpiresAt = 0;
}

export function getFallbackLocale(): Locale {
  return FALLBACK_LOCALE;
}
