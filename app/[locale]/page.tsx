import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { locales, type Locale } from "@/lib/i18n";
import { getHomepageContent } from "@/lib/homepage";
import { searchPublicContent, minimumSearchCharacters } from "@/lib/search";
import LocaleSwitcher from "@/components/LocaleSwitcher";

type HomePageProps = {
  params: Promise<{ locale: Locale }> | { locale: Locale };
  searchParams?:
    | Promise<Record<string, string | string[] | undefined>>
    | Record<string, string | string[] | undefined>;
};

export const dynamic = "force-dynamic";

export default async function HomePage({ params, searchParams }: HomePageProps) {
  const resolvedParams = await params;
  const { locale } = resolvedParams;
  if (!locales.includes(locale)) {
    notFound();
  }

  const content = await getHomepageContent(locale);

  const resolvedSearchParams = (await searchParams) ?? {};

  const rawQuery = typeof resolvedSearchParams.q === "string" ? resolvedSearchParams.q : "";
  const searchQuery = rawQuery?.trim() ?? "";

  const rawTypes = resolvedSearchParams.types;
  const requestedTypes = new Set<string>();
  if (Array.isArray(rawTypes)) {
    rawTypes.forEach((value) => {
      if (typeof value === "string") {
        requestedTypes.add(value);
      }
    });
  } else if (typeof rawTypes === "string") {
    requestedTypes.add(rawTypes);
  }

  const defaultTypes = ["articles", "categories"];
  if (requestedTypes.size === 0) {
    defaultTypes.forEach((type) => requestedTypes.add(type));
  }

  const includeArticles = requestedTypes.has("articles");
  const includeCategories = requestedTypes.has("categories");
  const shouldSearch = searchQuery.length >= minimumSearchCharacters;

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: { categories: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        articles: {
          where: { published: true },
          select: { id: true },
        },
      },
    }),
  ]);

  const searchResults = shouldSearch
    ? await searchPublicContent(searchQuery, {
        includeArticles,
        includeCategories,
        limit: 8,
      })
    : { articles: [], categories: [] };

  const storyCountLabel =
    articles.length === 1
      ? content.storiesCountSingular
      : content.storiesCountPlural;

  const topicsCountSingular = content.topicsCountSingular;
  const topicsCountPlural = content.topicsCountPlural;
  const hasActiveQuery = searchQuery.length > 0;
  const showMinimumCharactersHint =
    hasActiveQuery && !shouldSearch && searchQuery.length > 0;
  const resultsHeading = content.searchResultsHeadingTemplate.includes("{{query}}")
    ? content.searchResultsHeadingTemplate.replace(/{{query}}/g, searchQuery)
    : `${content.searchResultsHeadingTemplate} “${searchQuery}”`;

  return (
    <div className="relative min-h-screen text-stone-900 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/88 to-white/94 backdrop-blur-sm" />
      <div className="relative">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row">
          <aside className="rounded-3xl border border-white/70 bg-white/85 p-6 shadow-2xl shadow-stone-900/15 backdrop-blur lg:sticky lg:top-12 lg:h-fit lg:w-72 animate-fade-up">
            <div>
              {content.siteLogoUrl ? (
                <Image
                  src={content.siteLogoUrl}
                  alt={content.siteName}
                  width={64}
                  height={64}
                  className="h-12 w-12 rounded-xl shadow-sm"
                  unoptimized
                />
              ) : null}
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                {content.siteName}
              </p>
              <p className="mt-2 text-sm text-stone-500">{content.navTagline}</p>
            </div>
            <nav className="mt-6 flex flex-col gap-3 text-sm">
              <LocaleSwitcher
                currentLocale={locale}
                labels={{
                  label: content.switcherLabel,
                  english: content.switcherEnglishLabel,
                  dutch: content.switcherDutchLabel,
                }}
              />
              <Link
                href={`/${locale}#stories`}
                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white/80 px-4 py-2 font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-white"
              >
                {content.navLatestStoriesLabel}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
              >
                {content.navSignInLabel}
              </Link>
            </nav>
          </aside>
          <div className="flex-1 space-y-12">
            <header className="grid gap-8 rounded-3xl border border-white/70 bg-white/90 p-10 shadow-2xl shadow-stone-900/15 backdrop-blur lg:grid-cols-[1.7fr_1fr] lg:p-12 animate-fade-up">
              <div>
                <h1 className="text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl">
                  {content.heroTitle}
                </h1>
                <p className="mt-6 text-lg text-stone-600">
                  {content.heroDescription}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}#stories`}
                    className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/50 transition hover:bg-emerald-700"
                  >
                    {content.heroCtaPrimaryLabel}
                  </Link>
                  <Link
                    href={`/${locale}#topics`}
                    className="rounded-full border border-stone-300 bg-white/70 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-emerald-200 hover:text-emerald-700"
                  >
                    {content.heroCtaSecondaryLabel}
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                {content.heroImageUrl ? (
                  <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/60 shadow-xl shadow-emerald-100/40">
                    <Image
                      src={content.heroImageUrl}
                      alt={content.siteName}
                      width={640}
                      height={480}
                      className="h-full w-full object-cover"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-8 text-sm text-stone-700 shadow-lg shadow-emerald-100/60">
                  <p className="text-emerald-700">{content.heroEditorTitle}</p>
                  <p className="mt-3 leading-relaxed text-stone-600">
                    {content.heroEditorDescription}
                  </p>
                  <Link
                    href="/admin"
                    className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/80 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800"
                  >
                    {content.heroEditorLinkLabel}
                  </Link>
                </div>
              </div>
            </header>

            <section className="rounded-3xl border border-white/70 bg-white/90 p-6 shadow-2xl shadow-stone-900/12 backdrop-blur animate-fade-up">
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-900">
                      {content.searchTitle}
                    </h2>
                    {!hasActiveQuery ? (
                      <p className="text-sm text-stone-500">
                        {content.searchMinimumCharactersMessage}
                      </p>
                    ) : null}
                  </div>
                  {hasActiveQuery ? (
                    <Link
                      href={`/${locale}`}
                      className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                    >
                      {content.searchClearLabel}
                    </Link>
                  ) : null}
                </div>
                <form
                  action={`/${locale}`}
                  method="get"
                  className="flex flex-col gap-4 sm:flex-row sm:items-center"
                >
                  <label className="relative flex-1">
                    <span className="sr-only">{content.searchTitle}</span>
                    <input
                      type="search"
                      name="q"
                      aria-label={content.searchTitle}
                      defaultValue={searchQuery}
                      placeholder={content.searchPlaceholder}
                      className="w-full rounded-xl border border-stone-200 bg-white/80 px-4 py-3 text-sm text-stone-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                    />
                  </label>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-stone-600">
                    <span className="font-medium uppercase tracking-[0.2em] text-stone-400">
                      {content.searchFiltersLabel}
                    </span>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="types"
                        value="articles"
                        defaultChecked={includeArticles}
                        className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{content.searchFilterArticlesLabel}</span>
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="types"
                        value="categories"
                        defaultChecked={includeCategories}
                        className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span>{content.searchFilterCategoriesLabel}</span>
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                  >
                    {content.searchButtonLabel}
                  </button>
                </form>
                {showMinimumCharactersHint ? (
                  <p className="text-sm text-stone-500">
                    {content.searchMinimumCharactersMessage}
                  </p>
                ) : null}
                {shouldSearch ? (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-stone-900">
                        {resultsHeading}
                      </h3>
                    </div>
                    <div className="grid gap-6 lg:grid-cols-2">
                      {includeArticles ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
                            {content.searchArticlesHeading}
                          </h4>
                          {searchResults.articles.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-stone-300 bg-white/80 px-4 py-3 text-sm text-stone-500">
                              {content.searchNoResults}
                            </p>
                          ) : (
                            <ul className="space-y-3">
                              {searchResults.articles.map((item) => (
                                <li
                                  key={`article-${item.id}`}
                                  className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                                >
                                  <Link
                                    href={`/${locale}/articles/${item.slug}`}
                                    className="font-semibold text-stone-900 transition hover:text-emerald-600"
                                  >
                                    {item.title}
                                  </Link>
                                  {item.snippet ? (
                                    <p className="mt-2 text-stone-500">
                                      {item.snippet}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : null}
                      {includeCategories ? (
                        <div className="space-y-3">
                          <h4 className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
                            {content.searchCategoriesHeading}
                          </h4>
                          {searchResults.categories.length === 0 ? (
                            <p className="rounded-xl border border-dashed border-stone-300 bg-white/80 px-4 py-3 text-sm text-stone-500">
                              {content.searchNoResults}
                            </p>
                          ) : (
                            <ul className="space-y-3">
                              {searchResults.categories.map((item) => (
                                <li
                                  key={`category-${item.id}`}
                                  className="rounded-xl border border-stone-200 bg-white p-4 text-sm shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                                >
                                  <Link
                                    href={`/${locale}/categories/${item.slug}`}
                                    className="font-semibold text-stone-900 transition hover:text-emerald-600"
                                  >
                                    {item.name}
                                  </Link>
                                  {item.description ? (
                                    <p className="mt-2 text-stone-500">
                                      {item.description.slice(0, 160)}
                                      {item.description.length > 160 ? "…" : ""}
                                    </p>
                                  ) : null}
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ) : null}
                    </div>
                    {includeArticles && includeCategories
                    && searchResults.articles.length === 0
                    && searchResults.categories.length === 0 ? (
                      <p className="text-sm text-stone-500">
                        {content.searchNoResults}
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </section>

            <main className="flex flex-col gap-12 pb-12">
              <section
                id="topics"
                className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl shadow-stone-200/30"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-900">
                      {content.topicsTitle}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-stone-600">
                      {content.topicsDescription}
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {categories.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-4 py-3 text-sm text-stone-500">
                      {content.topicsEmpty}
                    </p>
                  ) : (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/${locale}/categories/${category.slug}`}
                        className="group flex items-center gap-2 rounded-full border border-stone-200/80 bg-white px-5 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: category.color ?? "#65a30d",
                          }}
                        />
                        {category.name}
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500 transition group-hover:bg-white group-hover:text-emerald-700">
                          {category.articles.length}{" "}
                          {category.articles.length === 1
                            ? topicsCountSingular
                            : topicsCountPlural}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              <section
                id="stories"
                className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl shadow-stone-200/30"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-900">
                      {content.storiesTitle}
                    </h2>
                    <p className="mt-2 text-sm text-stone-600">
                      {content.storiesDescription}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-stone-500">
                    {articles.length} {content.storiesCountLabel} {storyCountLabel}
                  </p>
                </div>
                {articles.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/70 p-10 text-center">
                    <p className="text-sm text-stone-500">{content.storiesEmpty}</p>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    {articles.map((article) => (
                      <article
                        key={article.id}
                        className="group flex h-full flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-6 shadow-md shadow-stone-200/60 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                      >
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            {article.categories.length > 0
                              ? article.categories
                                  .map((category) => category.name)
                                  .join(" · ")
                              : content.storiesUncategorized}
                          </div>
                          <h3 className="text-2xl font-semibold text-stone-900 transition group-hover:text-emerald-700">
                            {article.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-stone-600">
                            {article.excerpt ??
                              article.content.slice(0, 200).concat(
                                article.content.length > 200 ? "…" : "",
                              )}
                          </p>
                        </div>
                        <div className="mt-6 flex items-center justify-between text-sm text-stone-500">
                          <span>
                            {formatDate(article.publishedAt ?? article.createdAt, locale)}
                          </span>
                          <Link
                            href={`/${locale}/articles/${article.slug}`}
                            className="font-semibold text-emerald-600 transition hover:text-emerald-700"
                          >
                            {content.storiesReadMore}
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>

        <footer className="border-t border-white/60 bg-white/75 py-6 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>{content.footerNote.replace("{{year}}", `${new Date().getFullYear()}`)}</p>
            <p className="text-stone-400">{content.footerSignature}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
