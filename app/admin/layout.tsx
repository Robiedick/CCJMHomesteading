import Link from "next/link";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import { DEFAULT_LOCALE } from "@/lib/i18n";

const links = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/search", label: "Search" },
  { href: "/admin/articles", label: "Articles" },
  { href: "/admin/categories", label: "Categories" },
  { href: "/admin/users", label: "Users" },
  { href: "/admin/homepage", label: "Change homepage" },
];

function isActivePath(currentPath: string, href: string) {
  if (href === "/admin") {
    return currentPath === "/admin";
  }
  return currentPath.startsWith(href);
}

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getServerAuthSession();
  const username = session?.user?.name ?? "Admin";
  const headerList = await headers();
  const pathname =
    headerList.get("x-invoke-path") ??
    headerList.get("x-next-pathname") ??
    headerList.get("x-pathname") ??
    "";

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <div className="mx-auto flex w-full max-w-6xl gap-6 px-6 py-8">
        <aside className="hidden w-64 shrink-0 rounded-2xl border border-stone-200 bg-white p-6 shadow-sm lg:flex lg:flex-col lg:justify-between">
          <div className="space-y-6">
            <div>
              <Link href={`/${DEFAULT_LOCALE}`} className="text-lg font-semibold text-stone-900">
                CCJM Admin
              </Link>
              <p className="mt-1 text-xs text-stone-500">Signed in as {username}</p>
            </div>
            <nav className="flex flex-col gap-1 text-sm">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 font-medium transition ${
                    isActivePath(pathname, link.href)
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-stone-600 hover:bg-stone-100 hover:text-stone-900"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
            <form action="/admin/search" method="get" className="rounded-lg border border-stone-200 bg-stone-50/80 p-3">
              <label className="flex flex-col gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-stone-400">
                Quick search
                <input
                  type="search"
                  name="q"
                  placeholder="Find anything…"
                  className="mt-1 rounded-md border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </label>
              <button
                type="submit"
                className="mt-3 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                Search
              </button>
            </form>
          </div>
          <div className="flex flex-col gap-2 text-sm">
            <Link
              href={`/${DEFAULT_LOCALE}`}
              className="inline-flex items-center justify-center rounded-lg border border-stone-200 px-3 py-2 font-semibold text-emerald-600 transition hover:bg-stone-100 hover:text-emerald-700"
            >
              View site
            </Link>
            <LogoutButton />
          </div>
        </aside>
        <main className="flex-1 space-y-8 pb-12">{children}</main>
      </div>
    </div>
  );
}
