import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { getDefaultLocale } from "@/lib/settings";
import { getHomepageContent } from "@/lib/homepage";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerAuthSession();

  if (session?.user?.role === "admin") {
    redirect("/admin");
  }

  const defaultLocale = await getDefaultLocale();
  const content = await getHomepageContent(defaultLocale);

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-stone-950 via-stone-900 to-stone-900 text-stone-100 animate-fade-in">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(16,185,129,0.12),transparent_45%)]" />
      <div className="relative mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-10 px-6 py-14 lg:flex-row lg:items-center">
        <aside className="hidden w-full rounded-3xl border border-white/10 bg-white/5 p-10 shadow-2xl shadow-emerald-900/20 backdrop-blur lg:flex lg:w-1/2 lg:flex-col lg:justify-between animate-fade-up">
          <div className="space-y-6">
            <Link
              href={`/${defaultLocale}`}
              className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
            >
              <span aria-hidden>←</span>
              {content.siteBackToHomeLabel}
            </Link>
            <div className="space-y-4">
              <Image
                src={content.siteLogoUrl || "/favicon.ico"}
                alt={content.siteName}
                width={64}
                height={64}
                className="h-16 w-16 rounded-xl border border-white/10 bg-white/10 p-2 shadow-lg"
                unoptimized
              />
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-200">
                {content.siteName}
              </p>
              <h1 className="text-3xl font-semibold text-white lg:text-4xl">
                {content.siteAdminTitle}
              </h1>
              <p className="text-sm leading-relaxed text-emerald-50/80">
                {content.siteAdminSubtitle}
              </p>
            </div>
          </div>
          <div className="grid gap-3 text-sm text-emerald-100/80">
            <p className="font-semibold uppercase tracking-[0.25em] text-emerald-300/70">
              Homestead tools
            </p>
            <p>
              Manage articles, categories, and homepages copy with the same calm cadence as the
              rest of the site. Your changes go live instantly for both English and Dutch readers.
            </p>
          </div>
        </aside>

        <main className="flex w-full justify-center lg:w-1/2">
          <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/95 p-8 text-stone-900 shadow-2xl shadow-emerald-900/10 animate-scale-in">
            <div className="mb-6 flex items-center justify-between lg:hidden">
              <Link
                href={`/${defaultLocale}`}
                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
              >
                <span aria-hidden>←</span>
                {content.siteBackToHomeLabel}
              </Link>
              <Image
                src={content.siteLogoUrl || "/favicon.ico"}
                alt={content.siteName}
                width={40}
                height={40}
                className="h-10 w-10 rounded-lg"
                unoptimized
              />
            </div>
            <header className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-500">
                Admin sign-in
              </p>
              <h2 className="text-2xl font-semibold text-stone-900">
                {content.siteAdminTitle}
              </h2>
              <p className="text-sm text-stone-600">
                {content.siteAdminSubtitle}
              </p>
            </header>
            <div className="mt-8">
              <Suspense
                fallback={
                  <div className="w-full rounded-2xl border border-stone-200 bg-stone-50 p-6 text-center text-sm text-stone-600">
                    {content.loginLoadingMessage}
                  </div>
                }
              >
                <LoginForm
                  copy={{
                    usernameLabel: content.loginUsernameLabel,
                    usernamePlaceholder: content.loginUsernamePlaceholder,
                    passwordLabel: content.loginPasswordLabel,
                    passwordPlaceholder: content.loginPasswordPlaceholder,
                    signInButtonLabel: content.loginSignInButtonLabel,
                    signingInLabel: content.loginSigningInLabel,
                    sessionExpiredMessage: content.loginSessionExpiredMessage,
                    invalidCredentialsMessage: content.loginInvalidCredentialsMessage,
                    successMessage: content.loginSuccessMessage,
                  }}
                />
              </Suspense>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
