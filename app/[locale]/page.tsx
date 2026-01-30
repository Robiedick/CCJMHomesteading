import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import clsx from "clsx";
import SearchFlyout from "@/components/SearchFlyout";
import StoryGrid from "@/components/StoryGrid";
import CategoriesSidebar from "@/components/CategoriesSidebar";
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
      className="hero-title relative text-5xl font-bold leading-tight text-gray-900 sm:text-6xl"
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

  const sidebarCategories = categories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    color: category.color,
    articleCount: category.articles.length,
  }));

  const storyCountLabel =
    totalArticles === 1
      ? content.storiesCountSingular
      : content.storiesCountPlural;

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
    resultsHeadingTemplate: content.searchResultsHeadingTemplate,
  };

  return (
    <div className="relative min-h-screen text-gray-900 animate-fade-in">
      <SearchFlyout
        locale={locale}
        searchQuery={searchQuery}
        includeArticles={includeArticles}
        includeCategories={includeCategories}
        searchResults={searchResults}
        labels={searchLabels}
      />
      <div className="relative">
        <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-6 py-10 lg:flex-row">
          <div className="flex w-full flex-col gap-6 lg:w-80 lg:flex-none">
            <aside className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-900/5 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-900/10 animate-fade-up">
              <div>
                {content.siteLogoUrl ? (
                  <Image
                    src={content.siteLogoUrl}
                    alt={content.siteName}
                    width={64}
                    height={64}
                    className="h-14 w-14 rounded-2xl shadow-lg ring-2 ring-emerald-100"
                    unoptimized
                  />
                ) : null}
                <p className="mt-5 text-xs font-bold uppercase tracking-[0.25em] text-emerald-600">
                  {content.siteName}
                </p>
                <p className="mt-3 text-sm leading-relaxed text-gray-600">{content.navTagline}</p>
              </div>
              <nav className="mt-8 flex flex-col gap-3 text-sm">
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
                  className="inline-flex items-center justify-center rounded-xl border-2 border-emerald-100 bg-gradient-to-br from-white to-emerald-50/30 px-5 py-3 font-semibold text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-200 hover:shadow-md hover:-translate-y-0.5"
                >
                  {content.navLatestStoriesLabel}
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-3 font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/40 hover:-translate-y-0.5"
                >
                  {content.navSignInLabel}
                </Link>
              </nav>
            </aside>

            <aside className="rounded-2xl border border-gray-200 bg-white p-8 shadow-xl shadow-gray-900/5 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-900/10">
              <CategoriesSidebar
                categories={sidebarCategories}
                locale={locale}
                description={content.topicsDescription}
                title={content.topicsTitle}
                emptyLabel={content.topicsEmpty}
                countSingular={content.topicsCountSingular}
                countPlural={content.topicsCountPlural}
                isAdmin={false}
              />
            </aside>
          </div>
          <div className="flex-1 space-y-12">
            <header className="group relative overflow-hidden rounded-2xl border border-gray-200 bg-gradient-to-br from-white via-emerald-50/20 to-white p-12 shadow-xl shadow-gray-900/5 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-900/10 lg:p-16 animate-fade-up">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
              <div className="relative grid gap-10 lg:grid-cols-[minmax(0,1.8fr)_1fr]">
              <div className="relative">
                <AnimatedHeroTitle text={content.heroTitle} />
                <p className="mt-8 text-lg leading-relaxed text-gray-600">
                  {content.heroDescription}
                </p>
                <div className="mt-10 flex flex-wrap gap-4">
                  <Link
                    href={`/${locale}#stories`}
                    className="group relative overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-8 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-emerald-500/50 hover:-translate-y-1"
                  >
                    <span className="relative z-10">{content.heroCtaPrimaryLabel}</span>
                    <div className="absolute inset-0 z-0 bg-gradient-to-br from-emerald-400 to-emerald-500 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                  </Link>
                  <Link
                    href={`/${locale}#topics`}
                    className="rounded-xl border-2 border-gray-300 bg-white px-8 py-4 text-base font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md hover:-translate-y-1"
                  >
                    {content.heroCtaSecondaryLabel}
                  </Link>
                </div>
              </div>
              <div className="flex flex-col gap-6">
                {content.heroImageUrl ? (
                  <div className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
                    <Image
                      src={content.heroImageUrl}
                      alt={content.siteName}
                      width={640}
                      height={480}
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                ) : null}
                <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-teal-50 p-8 shadow-lg shadow-emerald-500/10 transition-all duration-300 hover:shadow-xl hover:shadow-emerald-500/20">
                  <p className="text-sm font-bold uppercase tracking-wider text-emerald-700">{content.heroEditorTitle}</p>
                  <p className="mt-4 leading-relaxed text-gray-700">
                    {content.heroEditorDescription}
                  </p>
                  <Link
                    href="/admin"
                    className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-emerald-300 bg-white px-6 py-2.5 text-sm font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-400 hover:shadow-md hover:-translate-y-0.5"
                  >
                    {content.heroEditorLinkLabel}
                  </Link>
                </div>
              </div>
              </div>
            </header>

            <main className="flex flex-col gap-12 pb-12">
              <section
                id="stories"
                className="rounded-2xl border border-gray-200 bg-white p-10 shadow-xl shadow-gray-900/5 transition-all duration-300 hover:shadow-2xl hover:shadow-gray-900/10"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                      {content.storiesTitle}
                    </h2>
                    <p className="mt-3 text-base text-gray-600">
                      {content.storiesDescription}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-500">
                    {totalArticles} {content.storiesCountLabel} {storyCountLabel}
                  </p>
                </div>
                {visibleArticles.length === 0 ? (
                  <div className="mt-10 rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 p-12 text-center">
                    <p className="text-base text-gray-500">{content.storiesEmpty}</p>
                  </div>
                ) : (
                  <>
                    <StoryGrid
                      articles={articleCards}
                      readMoreLabel={content.storiesReadMore}
                    />
                    <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-semibold tracking-wide text-gray-400">
                        {paginationSummary}
                      </p>
                      <div className="flex items-center gap-3">
                        {hasPreviousPage ? (
                          <Link
                            href={createPageHref(safeCurrentPage - 1)}
                            aria-label="Previous page"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md hover:-translate-y-0.5"
                          >
                            ←
                          </Link>
                        ) : (
                          <span
                            aria-hidden
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-2 text-sm font-bold text-gray-300"
                          >
                            ←
                          </span>
                        )}
                        <span className="rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-600 px-4 py-2 text-sm font-bold text-white shadow-md">
                          {safeCurrentPage} / {totalPages}
                        </span>
                        {hasNextPage ? (
                          <Link
                            href={createPageHref(safeCurrentPage + 1)}
                            aria-label="Next page"
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2 text-sm font-bold text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md hover:-translate-y-0.5"
                          >
                            →
                          </Link>
                        ) : (
                          <span
                            aria-hidden
                            className="inline-flex items-center gap-2 rounded-xl border-2 border-gray-200 bg-gray-100 px-4 py-2 text-sm font-bold text-gray-300"
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

        <footer className="border-t border-gray-200 bg-white/90 py-8 backdrop-blur-sm">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-6 text-sm text-gray-600 sm:flex-row sm:items-center sm:justify-between">
            <p className="font-medium">{content.footerNote.replace("{{year}}", `${new Date().getFullYear()}`)}</p>
            <p className="text-gray-500">{content.footerSignature}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
