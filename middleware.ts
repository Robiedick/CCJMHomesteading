import { NextResponse } from "next/server";
import type { NextFetchEvent, NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";
import type { NextRequestWithAuth } from "next-auth/middleware";

const SUPPORTED_LOCALES = ["en", "nl"] as const;
const FALLBACK_LOCALE = "en" as const;
const DEFAULT_LOCALE_ENDPOINT = "/api/settings/default-locale";
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number];

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
  try {
    const url = new URL(DEFAULT_LOCALE_ENDPOINT, request.url);
    const response = await fetch(url, {
      headers: {
        "x-middleware-fetch": "default-locale",
      },
      cache: "no-store",
    });

    if (response.ok) {
      const payload = (await response.json()) as { locale?: string };
      const locale = payload.locale;
      if (
        typeof locale === "string" &&
        SUPPORTED_LOCALES.includes(locale as SupportedLocale)
      ) {
        return locale as SupportedLocale;
      }
    }
  } catch (error) {
    console.error("Failed to fetch default locale in middleware", error);
  }

  return FALLBACK_LOCALE;
}

export default async function middleware(request: NextRequest, event: NextFetchEvent) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return adminMiddleware(request as NextRequestWithAuth, event);
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
