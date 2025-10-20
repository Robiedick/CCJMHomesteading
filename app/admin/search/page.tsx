import Link from "next/link";
import { searchAdminEntities, minimumSearchCharacters } from "@/lib/search";

type AdminSearchPageProps = {
  searchParams?: Record<string, string | string[] | undefined>;
};

export const dynamic = "force-dynamic";

export default async function AdminSearchPage({ searchParams }: AdminSearchPageProps) {
  const rawQuery = typeof searchParams?.q === "string" ? searchParams.q : "";
  const query = rawQuery?.trim() ?? "";
  const hasQuery = query.length > 0;
  const meetsMinimumLength = query.length >= minimumSearchCharacters;

  const results = meetsMinimumLength
    ? await searchAdminEntities(query)
    : { articles: [], categories: [], users: [], invitations: [] };

  const totalResults =
    results.articles.length +
    results.categories.length +
    results.users.length +
    results.invitations.length;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm">
        <form className="space-y-4" method="get" action="/admin/search">
          <div>
            <h1 className="text-2xl font-semibold text-stone-900">Search admin</h1>
            <p className="mt-1 text-sm text-stone-500">
              Look up articles, categories, users, or invitation tokens. Type at least{" "}
              {minimumSearchCharacters} characters.
            </p>
          </div>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <label className="relative flex-1">
              <span className="sr-only">Search the admin dashboard</span>
              <input
                type="search"
                name="q"
                defaultValue={query}
                placeholder="Search everything (articles, categories, users, invitations)…"
                className="w-full rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-200"
              />
            </label>
            <button
              type="submit"
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
            >
              Search
            </button>
          </div>
        </form>
        {hasQuery && !meetsMinimumLength ? (
          <p className="mt-4 text-sm text-stone-500">
            Please enter at least {minimumSearchCharacters} characters to search.
          </p>
        ) : null}
      </div>

      {meetsMinimumLength ? (
        <section className="space-y-8">
          <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-stone-900">
              Results for “{query}”
            </h2>
            <p className="text-sm text-stone-500">
              {totalResults} match{totalResults === 1 ? "" : "es"}
            </p>
          </header>

          <div className="grid gap-6 lg:grid-cols-2">
            <SearchResultPanel
              title="Articles"
              emptyMessage="No articles found."
              items={results.articles.map((article) => ({
                key: `article-${article.id}`,
                href: `/admin/articles/${article.id}`,
                primary: article.title,
                secondary: article.published ? "Published" : "Draft",
              }))}
            />
            <SearchResultPanel
              title="Categories"
              emptyMessage="No categories found."
              items={results.categories.map((category) => ({
                key: `category-${category.id}`,
                href: "/admin/categories",
                primary: category.name,
                secondary: category.slug,
              }))}
            />
            <SearchResultPanel
              title="Users"
              emptyMessage="No users found."
              items={results.users.map((user) => ({
                key: `user-${user.id}`,
                href: "/admin/users",
                primary: user.username,
                secondary: user.role,
              }))}
            />
            <SearchResultPanel
              title="Invitations"
              emptyMessage="No invitations found."
              items={results.invitations.map((invite) => ({
                key: `invite-${invite.id}`,
                href: `/admin/users?invite=${invite.id}`,
                primary: invite.email ?? "(no email)",
                secondary: invite.token,
              }))}
            />
          </div>
        </section>
      ) : null}
    </div>
  );
}

type PanelItem = {
  key: string;
  href?: string;
  primary: string;
  secondary?: string | null;
};

function SearchResultPanel({
  title,
  emptyMessage,
  items,
}: {
  title: string;
  emptyMessage: string;
  items: PanelItem[];
}) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <h3 className="text-sm font-semibold uppercase tracking-[0.3em] text-emerald-600">
        {title}
      </h3>
      <div className="mt-4 space-y-3">
        {items.length === 0 ? (
          <p className="text-sm text-stone-500">{emptyMessage}</p>
        ) : (
          items.map((item) => (
            item.href ? (
              <Link
                key={item.key}
                href={item.href}
                className="block rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm transition hover:border-emerald-200 hover:text-emerald-700"
              >
                <span className="font-semibold text-stone-900">{item.primary}</span>
                {item.secondary ? (
                  <span className="mt-1 block text-xs uppercase tracking-wide text-stone-400">
                    {item.secondary}
                  </span>
                ) : null}
              </Link>
            ) : (
              <div
                key={item.key}
                className="rounded-lg border border-stone-200 bg-white px-4 py-3 text-sm"
              >
                <span className="font-semibold text-stone-900">{item.primary}</span>
                {item.secondary ? (
                  <span className="mt-1 block text-xs uppercase tracking-wide text-stone-400">
                    {item.secondary}
                  </span>
                ) : null}
              </div>
            )
          ))
        )}
      </div>
    </div>
  );
}
