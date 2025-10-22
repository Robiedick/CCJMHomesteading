import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import clsx from "clsx";
import SearchFlyout from "@/components/SearchFlyout";
import StoryGrid from "@/components/StoryGrid";
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

const STORIES_PER_PAGE = 6;

const accentLetterPattern = /[A-ZÀ-ÖØ-Þ]/;

function AnimatedHeroTitle({ text }: { text: string }) {
  const letters = Array.from(text);

  return (
    <h1
      className="hero-title relative text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl"
      aria-label={text}
    >
      <span className="sr-only">{text}</span>
      <span aria-hidden className="hero-title-layer">
        {letters.map((char, index) => {
          if (char === "\n") {
            return <br key={`break-${index}`} />;
          }
          if (char === " ") {
            return (
              <span key={`space-${index}`} className="hero-title-space">
                &nbsp;
              </span>
            );
          }
          const isAccent = accentLetterPattern.test(char);
          return (
            <span
              key={`${char}-${index}`}
              className={clsx("hero-title-char", isAccent && "hero-title-char-accent")}
              style={isAccent ? { animationDelay: `${index * 90}ms` } : undefined}
            >
              {char}
            </span>
          );
        })}
      </span>
    </h1>
  );
}

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

  const rawPage = Array.isArray(resolvedSearchParams.page)
    ? resolvedSearchParams.page[0]
    : resolvedSearchParams.page;
  const parsedPage = rawPage ? Number.parseInt(rawPage, 10) : 1;
  const currentPage = Number.isNaN(parsedPage) || parsedPage < 1 ? 1 : parsedPage;
  const skip = (currentPage - 1) * STORIES_PER_PAGE;

  const [paginatedArticles, totalArticles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: { categories: true },
      skip,
      take: STORIES_PER_PAGE,
    }),
    prisma.article.count({
      where: { published: true },
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

  const preservedParams = new URLSearchParams();
  Object.entries(resolvedSearchParams).forEach(([key, value]) => {
    if (key === "page") return;
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (typeof entry === "string") {
          preservedParams.append(key, entry);
        }
      });
    } else if (typeof value === "string") {
      preservedParams.append(key, value);
    }
  });

  const createPageHref = (page: number) => {
    const params = new URLSearchParams(preservedParams);
    if (page > 1) {
      params.set("page", `${page}`);
    } else {
      params.delete("page");
    }
    const query = params.toString();
    return query ? `/${locale}?${query}` : `/${locale}`;
  };

  const totalPages = Math.max(1, Math.ceil(totalArticles / STORIES_PER_PAGE));
  if (totalArticles > 0 && currentPage > totalPages) {
    redirect(createPageHref(totalPages));
  }
  if (totalArticles === 0 && currentPage > 1) {
    redirect(createPageHref(1));
  }

  const safeCurrentPage = totalArticles === 0 ? 1 : currentPage;
  const effectiveSkip = totalArticles === 0 ? 0 : (safeCurrentPage - 1) * STORIES_PER_PAGE;
  const visibleArticles = paginatedArticles;
  const hasPreviousPage = safeCurrentPage > 1;
  const hasNextPage = safeCurrentPage < totalPages;
  const pageStart = totalArticles === 0 ? 0 : effectiveSkip + 1;
  const pageEnd = totalArticles === 0 ? 0 : effectiveSkip + visibleArticles.length;
  const paginationSummary =
    totalArticles === 0 ? "0 / 0" : `${pageStart}\u2013${pageEnd} / ${totalArticles}`;

  const articleCards = visibleArticles.map((article) => {
    const primaryCategory = article.categories[0];
    const categoryColor = primaryCategory?.color ?? "#047857";
    const categoryLabel =
      article.categories.length > 0
        ? article.categories.map((category) => category.name).join(" · ")
        : content.storiesUncategorized;
    const rawExcerpt = article.excerpt ?? article.content;
    const truncatedContent = article.content.slice(0, 200);
    const displayExcerpt =
      article.excerpt ?? `${truncatedContent}${article.content.length > 200 ? "…" : ""}`;
    const cleanOverlay = rawExcerpt.replace(/\s+/g, " ").trim();
    const overlaySource = cleanOverlay.length > 0 ? cleanOverlay : article.title;
    const overlayText = `${overlaySource} ${overlaySource}`.slice(0, 260);

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      excerpt: displayExcerpt,
      overlayText,
      categoryColor,
      categoryLabel,
      formattedDate: formatDate(article.publishedAt ?? article.createdAt, locale),
    };
  });

  const storyCountLabel =
    totalArticles === 1
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

  const searchLabels = {
    title: content.searchTitle,
    minimumCharactersMessage: content.searchMinimumCharactersMessage,
    clearLabel: content.searchClearLabel,
    placeholder: content.searchPlaceholder,
    filtersLabel: content.searchFiltersLabel,
    filterArticlesLabel: content.searchFilterArticlesLabel,
    filterCategoriesLabel: content.searchFilterCategoriesLabel,
    buttonLabel: content.searchButtonLabel,
    articlesHeading: content.searchArticlesHeading,
    categoriesHeading: content.searchCategoriesHeading,
    noResults: content.searchNoResults,
  };

  return (
    <div className="relative min-h-screen text-stone-900 animate-fade-in">
      <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/88 to-white/94 backdrop-blur-sm" />
      <SearchFlyout
        locale={locale}
        searchQuery={searchQuery}
        includeArticles={includeArticles}
        includeCategories={includeCategories}
        showMinimumCharactersHint={showMinimumCharactersHint}
        shouldSearch={shouldSearch}
        hasActiveQuery={hasActiveQuery}
        resultsHeading={resultsHeading}
        searchResults={searchResults}
        labels={searchLabels}
      />
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
            <div id="topics" className="mt-10 space-y-4">
              <div>
                <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600">
                  {content.topicsTitle}
                </h2>
                <p className="mt-2 text-xs text-stone-500">{content.topicsDescription}</p>
              </div>
              {categories.length === 0 ? (
                <p className="rounded-xl border border-dashed border-stone-300 bg-white/70 px-3 py-3 text-xs text-stone-500">
                  {content.topicsEmpty}
                </p>
              ) : (
                <ul className="space-y-2">
                  {categories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/${locale}/categories/${category.slug}`}
                        className="group flex items-center justify-between gap-3 rounded-xl border border-stone-200/60 bg-white/90 px-3 py-2 text-xs font-medium text-stone-600 shadow-sm transition hover:border-emerald-200 hover:bg-white hover:text-emerald-700"
                      >
                        <span className="flex items-center gap-2 text-[0.9rem] font-medium text-stone-700 transition group-hover:text-emerald-700">
                          <span
                            className="inline-block h-2.5 w-2.5 rounded-full"
                            style={{
                              backgroundColor: category.color ?? "#65a30d",
                            }}
                          />
                          {category.name}
                        </span>
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[0.65rem] text-stone-500 transition group-hover:bg-white group-hover:text-emerald-700">
                          {category.articles.length}{" "}
                          {category.articles.length === 1
                            ? topicsCountSingular
                            : topicsCountPlural}
                        </span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>
          <div className="flex-1 space-y-12">
            <header className="grid gap-8 rounded-3xl border border-white/70 bg-white/90 p-10 shadow-2xl shadow-stone-900/15 backdrop-blur lg:grid-cols-[1.7fr_1fr] lg:p-12 animate-fade-up">
              <div>
                <AnimatedHeroTitle text={content.heroTitle} />
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

            <main className="flex flex-col gap-12 pb-12">
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
                    {totalArticles} {content.storiesCountLabel} {storyCountLabel}
                  </p>
                </div>
                {visibleArticles.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/70 p-10 text-center">
                    <p className="text-sm text-stone-500">{content.storiesEmpty}</p>
                  </div>
                ) : (
                  <>
                    <StoryGrid
                      articles={articleCards}
                      locale={locale}
                      readMoreLabel={content.storiesReadMore}
                      storyBackLabel={content.articleBackLabel}
                    />
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-xs font-medium tracking-wider text-stone-400">
                        {paginationSummary}
                      </p>
                      <div className="flex items-center gap-2">
                        {hasPreviousPage ? (
                          <Link
                            href={createPageHref(safeCurrentPage - 1)}
                            aria-label="Previous page"
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
                          >
                            ←
                          </Link>
                        ) : (
                          <span
                            aria-hidden
                            className="inline-flex items-center gap-2 rounded-full border border-stone-100 bg-stone-100/70 px-3 py-1.5 text-xs font-semibold text-stone-300"
                          >
                            ←
                          </span>
                        )}
                        <span className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-500">
                          {safeCurrentPage} / {totalPages}
                        </span>
                        {hasNextPage ? (
                          <Link
                            href={createPageHref(safeCurrentPage + 1)}
                            aria-label="Next page"
                            className="inline-flex items-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700"
                          >
                            →
                          </Link>
                        ) : (
                          <span
                            aria-hidden
                            className="inline-flex items-center gap-2 rounded-full border border-stone-100 bg-stone-100/70 px-3 py-1.5 text-xs font-semibold text-stone-300"
                          >
                            →
                          </span>
                        )}
                      </div>
                    </div>
                  </>
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
