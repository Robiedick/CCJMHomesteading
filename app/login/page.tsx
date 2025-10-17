import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { getServerAuthSession } from "@/lib/auth";
import { DEFAULT_LOCALE } from "@/lib/i18n";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

export default async function LoginPage() {
  const session = await getServerAuthSession();

  if (session?.user?.role === "admin") {
    redirect("/admin");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-stone-900/40 px-6 py-16">
      <Link
        href={`/${DEFAULT_LOCALE}`}
        className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-emerald-200 transition hover:text-emerald-100"
      >
        <span aria-hidden>←</span>
        Back to homestead
      </Link>
      <div className="mb-8 text-center">
        <Image
          src="/favicon.ico"
          alt="CCJM Homesteading"
          width={48}
          height={48}
          className="mx-auto"
        />
        <h1 className="mt-4 text-3xl font-semibold text-white">
          CCJM Homesteading Admin
        </h1>
        <p className="mt-1 text-sm text-stone-200">
          Sign in to manage articles and categories.
        </p>
      </div>
      <Suspense
        fallback={
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-white/40 p-6 text-center text-sm text-stone-700">
            Loading form…
          </div>
        }
      >
        <LoginForm />
      </Suspense>
    </div>
  );
}
