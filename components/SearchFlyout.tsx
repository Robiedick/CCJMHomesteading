"use client";

import { useCallback, useEffect, useRef, useState, type FocusEvent } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import { Search } from "lucide-react";
import { useArticleModal } from "@/components/ArticleModalProvider";

type SearchResultArticle = {
  id: string | number;
  slug: string;
  title: string;
  snippet?: string | null;
};

type SearchResultCategory = {
  id: string | number;
  slug: string;
  name: string;
  description?: string | null;
};

type SearchResults = {
  articles: SearchResultArticle[];
  categories: SearchResultCategory[];
};

type SearchLabels = {
  title: string;
  minimumCharactersMessage: string;
  clearLabel: string;
  placeholder: string;
  filtersLabel: string;
  filterArticlesLabel: string;
  filterCategoriesLabel: string;
  buttonLabel: string;
  articlesHeading: string;
  categoriesHeading: string;
  noResults: string;
  resultsHeadingTemplate: string;
};

type SearchFlyoutProps = {
  locale: string;
  searchQuery: string;
  includeArticles: boolean;
  includeCategories: boolean;
  searchResults: SearchResults;
  labels: SearchLabels;
};

const HIDE_DELAY_MS = 3000;
const MIN_QUERY_LENGTH = 2;

export default function SearchFlyout({
  locale,
  searchQuery,
  includeArticles,
  includeCategories,
  searchResults,
  labels,
}: SearchFlyoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { openArticleBySlug } = useArticleModal();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(searchQuery);
  const [articlesEnabled, setArticlesEnabled] = useState(includeArticles);
  const [categoriesEnabled, setCategoriesEnabled] = useState(includeCategories);
  const [results, setResults] = useState<SearchResults>(searchResults);
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const hideTimerRef = useRef<number | null>(null);
  const debounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const hydratedRef = useRef(false);

  const trimmedQuery = query.trim();
  const hasActiveQuery = trimmedQuery.length > 0;
  const shouldSearch = trimmedQuery.length >= MIN_QUERY_LENGTH;
  const showMinimumHint = hasActiveQuery && !shouldSearch;

  const resultsHeading = trimmedQuery.length >= MIN_QUERY_LENGTH
    ? labels.resultsHeadingTemplate.includes("{{query}}")
      ? labels.resultsHeadingTemplate.replace(/{{query}}/g, trimmedQuery)
      : `${labels.resultsHeadingTemplate} “${trimmedQuery}”`
    : labels.title;

  const updateUrl = useCallback(
    (nextQuery: string, articles: boolean, categories: boolean) => {
      const params = new URLSearchParams(searchParams.toString());
      if (nextQuery.trim().length >= MIN_QUERY_LENGTH) {
        params.set("q", nextQuery.trim());
      } else {
        params.delete("q");
      }
      params.delete("types");
      if (articles && categories) {
        // Default behaviour: show both
      } else if (articles) {
        params.set("types", "articles");
      } else if (categories) {
        params.set("types", "categories");
      }
      const queryString = params.toString();
      if (queryString === searchParams.toString()) {
        return;
      }
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const clearHideTimer = useCallback(() => {
    if (hideTimerRef.current !== null) {
      window.clearTimeout(hideTimerRef.current);
      hideTimerRef.current = null;
    }
  }, []);

  const openPanel = useCallback(() => {
    clearHideTimer();
    setOpen(true);
  }, [clearHideTimer]);

  const scheduleClose = useCallback(() => {
    clearHideTimer();
    hideTimerRef.current = window.setTimeout(() => {
      setOpen(false);
    }, HIDE_DELAY_MS);
  }, [clearHideTimer]);

  const handleButtonClick = useCallback(() => {
    clearHideTimer();
    setOpen((prev) => !prev);
  }, [clearHideTimer]);

  const handleMouseEnter = useCallback(() => {
    openPanel();
  }, [openPanel]);

  const handleMouseLeave = useCallback(() => {
    if (!open) return;
    scheduleClose();
  }, [open, scheduleClose]);

  const handleBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (!event.currentTarget.contains(relatedTarget)) {
        scheduleClose();
      }
    },
    [scheduleClose],
  );

  useEffect(() => () => {
    clearHideTimer();
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
    }
    abortRef.current?.abort();
  }, [clearHideTimer]);

  useEffect(() => {
    setQuery(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    setArticlesEnabled(includeArticles);
  }, [includeArticles]);

  useEffect(() => {
    setCategoriesEnabled(includeCategories);
  }, [includeCategories]);

  useEffect(() => {
    setResults(searchResults);
  }, [searchResults]);

  const performSearch = useCallback(
    (immediate: boolean) => {
      if (debounceRef.current) {
        window.clearTimeout(debounceRef.current);
      }
      abortRef.current?.abort();

      if (!shouldSearch) {
        setLoading(false);
        setSearchError(null);
        setResults({ articles: [], categories: [] });
        updateUrl(query, articlesEnabled, categoriesEnabled);
        return;
      }

      const execute = async () => {
        setLoading(true);
        setSearchError(null);
        const controller = new AbortController();
        abortRef.current = controller;
        try {
          const params = new URLSearchParams();
          params.set("q", trimmedQuery);
          params.set("articles", articlesEnabled ? "1" : "0");
          params.set("categories", categoriesEnabled ? "1" : "0");
          const response = await fetch(`/api/search?${params.toString()}`, {
            method: "GET",
            signal: controller.signal,
          });
          if (!response.ok) {
            throw new Error(labels.noResults);
          }
          const payload = (await response.json()) as SearchResults;
          setResults(payload);
          updateUrl(query, articlesEnabled, categoriesEnabled);
        } catch (error) {
          if ((error as Error).name === "AbortError") {
            return;
          }
          setSearchError(error instanceof Error ? error.message : labels.noResults);
        } finally {
          setLoading(false);
        }
      };

      if (immediate) {
        execute().catch(() => {
          /* handled via state */
        });
      } else {
        debounceRef.current = window.setTimeout(() => execute().catch(() => undefined), 250);
      }
    },
    [articlesEnabled, categoriesEnabled, labels.noResults, query, shouldSearch, trimmedQuery, updateUrl],
  );

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true;
      return;
    }

    if (!hasActiveQuery) {
      setSearchError(null);
      setResults(searchResults);
      updateUrl("", articlesEnabled, categoriesEnabled);
      return;
    }

    performSearch(false);
  }, [articlesEnabled, categoriesEnabled, hasActiveQuery, performSearch, searchResults, updateUrl]);

  const handleFormSubmit = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      performSearch(true);
    },
    [performSearch],
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setResults({ articles: [], categories: [] });
    setSearchError(null);
    updateUrl("", true, true);
    setArticlesEnabled(true);
    setCategoriesEnabled(true);
  }, [updateUrl]);

  const panelClasses = clsx(
    "absolute right-0 mt-3 w-[min(90vw,26rem)] origin-top transition duration-200 ease-out",
    open
      ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
      : "pointer-events-none -translate-y-4 scale-95 opacity-0",
  );

  return (
    <div className="fixed right-4 top-4 z-50 flex justify-end sm:right-8 sm:top-6">
      <div
        className="relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onFocusCapture={openPanel}
        onBlurCapture={handleBlur}
      >
        <button
          type="button"
          onClick={handleButtonClick}
          aria-haspopup="dialog"
          aria-expanded={open}
          className="flex h-11 w-11 items-center justify-center rounded-full border border-white/70 bg-white/95 text-stone-600 shadow-lg shadow-stone-900/20 transition hover:-translate-y-0.5 hover:text-emerald-700 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300"
        >
          <Search className="h-5 w-5" strokeWidth={2.3} />
          <span className="sr-only">{labels.title}</span>
        </button>
        <div className={panelClasses} role="dialog" aria-label={labels.title}>
          <div className="max-h-[72vh] overflow-y-auto rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-stone-900/25 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">{labels.title}</h2>
                {!hasActiveQuery ? (
                  <p className="mt-1 text-xs text-stone-500">{labels.minimumCharactersMessage}</p>
                ) : null}
              </div>
              {hasActiveQuery ? (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
                >
                  {labels.clearLabel}
                </button>
              ) : null}
            </div>
            <form className="mt-4 space-y-4" onSubmit={handleFormSubmit}>
              <label className="block">
                <span className="sr-only">{labels.title}</span>
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  aria-label={labels.title}
                  placeholder={labels.placeholder}
                  className="w-full rounded-xl border border-stone-200 bg-white/85 px-4 py-2.5 text-sm text-stone-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
                <span>{labels.filtersLabel}</span>
                <label className="flex items-center gap-2 normal-case tracking-normal text-stone-500">
                  <input
                    type="checkbox"
                    checked={articlesEnabled}
                    onChange={(event) => {
                      const nextChecked = event.target.checked;
                      if (!nextChecked && !categoriesEnabled) {
                        setCategoriesEnabled(true);
                      }
                      setArticlesEnabled(nextChecked);
                    }}
                    className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                    {labels.filterArticlesLabel}
                  </span>
                </label>
                <label className="flex items-center gap-2 normal-case tracking-normal text-stone-500">
                  <input
                    type="checkbox"
                    checked={categoriesEnabled}
                    onChange={(event) => {
                      const nextChecked = event.target.checked;
                      if (!nextChecked && !articlesEnabled) {
                        setArticlesEnabled(true);
                      }
                      setCategoriesEnabled(nextChecked);
                    }}
                    className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                    {labels.filterCategoriesLabel}
                  </span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  {labels.buttonLabel}
                </button>
              </div>
            </form>
            {showMinimumHint ? (
              <p className="mt-4 text-xs text-stone-500">{labels.minimumCharactersMessage}</p>
            ) : null}
            {searchError ? (
              <p className="mt-5 rounded-xl border border-red-200 bg-red-50/80 px-4 py-3 text-xs text-red-600">
                {searchError}
              </p>
            ) : null}
            {shouldSearch && !showMinimumHint ? (
              <div className="mt-5 space-y-5">
                <p className="text-sm font-semibold text-stone-900">
                  {loading ? `${resultsHeading}…` : resultsHeading}
                </p>
                {articlesEnabled ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                      {labels.articlesHeading}
                    </h3>
                    {results.articles.length === 0 && !loading ? (
                      <p className="mt-2 rounded-xl border border-dashed border-stone-200 bg-white/70 px-4 py-3 text-xs text-stone-500">
                        {labels.noResults}
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {results.articles.map((item) => (
                          <li
                            key={`article-${item.id}`}
                            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                          >
                            <button
                              type="button"
                              onClick={() => {
                                clearHideTimer();
                                setOpen(false);
                                openArticleBySlug(String(item.slug));
                              }}
                              className="w-full text-left font-semibold text-stone-900 transition hover:text-emerald-600"
                            >
                              {item.title}
                            </button>
                            {item.snippet ? (
                              <p className="mt-1 text-xs text-stone-500">{item.snippet}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
                {categoriesEnabled ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                      {labels.categoriesHeading}
                    </h3>
                    {results.categories.length === 0 && !loading ? (
                      <p className="mt-2 rounded-xl border border-dashed border-stone-200 bg-white/70 px-4 py-3 text-xs text-stone-500">
                        {labels.noResults}
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {results.categories.map((item) => (
                          <li
                            key={`category-${item.id}`}
                            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                          >
                            <Link
                              href={`/${locale}/categories/${item.slug}`}
                              className="font-semibold text-stone-900 transition hover:text-emerald-600"
                            >
                              {item.name}
                            </Link>
                            {item.description ? (
                              <p className="mt-1 text-xs text-stone-500">
                                {item.description.slice(0, 120)}
                                {item.description.length > 120 ? "…" : ""}
                              </p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
