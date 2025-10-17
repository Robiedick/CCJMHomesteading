import Link from "next/link";
import type { ReactNode } from "react";
import { getServerAuthSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import { DEFAULT_LOCALE } from "@/lib/i18n";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  const username = session?.user?.name ?? "Admin";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-6 py-4">
          <Link href={`/${DEFAULT_LOCALE}`} className="text-lg font-semibold">
            CCJM Homesteading Admin
          </Link>
          <div className="flex items-center gap-6">
            <nav className="flex gap-4 text-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded px-2 py-1 font-medium text-stone-600 transition hover:bg-stone-100 hover:text-stone-900"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-3">
              <Link
                href={`/${DEFAULT_LOCALE}`}
                className="rounded-full border border-stone-200 px-3 py-1.5 text-sm font-semibold text-emerald-600 transition hover:bg-stone-100 hover:text-emerald-700"
              >
                View site
              </Link>
              <p className="text-sm text-stone-500">Signed in as {username}</p>
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-6 py-10">
        {children}
      </main>
    </div>
  );
}
