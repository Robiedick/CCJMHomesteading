import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { withAuth } from "next-auth/middleware";

const SUPPORTED_LOCALES = ["en", "nl"] as const;
const DEFAULT_LOCALE = "en" as const;

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

export default function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/admin")) {
    return adminMiddleware(request);
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
    const locale = DEFAULT_LOCALE;
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}${pathname === "/" ? "" : pathname}`;
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/:path*"],
};
