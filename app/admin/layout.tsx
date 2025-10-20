import Link from "next/link";
import type { ReactNode } from "react";
import { headers } from "next/headers";
import { getServerAuthSession } from "@/lib/auth";
import LogoutButton from "./LogoutButton";
import { DEFAULT_LOCALE } from "@/lib/i18n";

const links = [
  { href: "/admin", label: "Overview" },
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
  const pathname = headers().get("x-invoke-path") ?? "";

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
