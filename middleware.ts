import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

const SUPPORTED_LOCALES = ["en", "nl"] as const;
const FALLBACK_LOCALE = "en" as const;
const DEFAULT_LOCALE_ENDPOINT = "/api/settings/default-locale";
const CACHE_TTL_MS = 60 * 1000;

type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

let cachedDefaultLocale: SupportedLocale | null = null;
let cacheExpiresAt = 0;

if (!process.env.NEXTAUTH_SECRET && process.env.NODE_ENV !== "production") {
  process.env.NEXTAUTH_SECRET = "ccjm-homesteading-dev-secret-placeholder-key-123456";
}

const adminMiddleware = withAuth({
  callbacks: {
    authorized: ({ token }) => token?.role === "admin",
  },
  pages: {
    signIn: "/login",
  },
});

const PUBLIC_FILE = /\.(.*)$/;

async function resolveDefaultLocale(request: NextRequest): Promise<SupportedLocale> {
  const now = Date.now();
  if (cachedDefaultLocale && now < cacheExpiresAt) {
    return cachedDefaultLocale;
  }

  try {
    const url = new URL(DEFAULT_LOCALE_ENDPOINT, request.url);
    const response = await fetch(url, {
      headers: {
        "x-middleware-fetch": "default-locale",
      },
    });

    if (response.ok) {
      const payload = (await response.json()) as { locale?: string };
      const locale = payload.locale;
      if (
        typeof locale === "string" &&
        SUPPORTED_LOCALES.includes(locale as SupportedLocale)
      ) {
        cachedDefaultLocale = locale as SupportedLocale;
        cacheExpiresAt = now + CACHE_TTL_MS;
        return cachedDefaultLocale;
      }
    }
  } catch (error) {
    console.error("Failed to fetch default locale in middleware", error);
  }

  cachedDefaultLocale = FALLBACK_LOCALE;
  cacheExpiresAt = now + CACHE_TTL_MS;
  return FALLBACK_LOCALE;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return adminMiddleware(request as NextRequestWithAuth);
  }

  if (
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/signup")
  ) {
    return NextResponse.next();
  }

  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  const pathSegments = pathname.split("/").filter(Boolean);
  const hasLocale =
    pathSegments.length > 0 &&
    SUPPORTED_LOCALES.includes(pathSegments[0] as (typeof SUPPORTED_LOCALES)[number]);

  if (!hasLocale) {
    const locale = await resolveDefaultLocale(request);
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
