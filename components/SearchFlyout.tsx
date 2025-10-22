"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Search } from "lucide-react";

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
};

type SearchFlyoutProps = {
  locale: string;
  searchQuery: string;
  includeArticles: boolean;
  includeCategories: boolean;
  showMinimumCharactersHint: boolean;
  shouldSearch: boolean;
  hasActiveQuery: boolean;
  resultsHeading: string;
  searchResults: SearchResults;
  labels: SearchLabels;
};

const HIDE_DELAY_MS = 3000;

export default function SearchFlyout({
  locale,
  searchQuery,
  includeArticles,
  includeCategories,
  showMinimumCharactersHint,
  shouldSearch,
  hasActiveQuery,
  resultsHeading,
  searchResults,
  labels,
}: SearchFlyoutProps) {
  const [open, setOpen] = useState(false);
  const hideTimerRef = useRef<number | null>(null);

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
    (event: React.FocusEvent<HTMLDivElement>) => {
      const relatedTarget = event.relatedTarget as Node | null;
      if (!event.currentTarget.contains(relatedTarget)) {
        scheduleClose();
      }
    },
    [scheduleClose],
  );

  useEffect(
    () => () => {
      clearHideTimer();
    },
    [clearHideTimer],
  );

  const panelClasses = clsx(
    "absolute right-0 mt-3 w-[min(90vw,26rem)] origin-top transition duration-200 ease-out",
    open
      ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
      : "pointer-events-none -translate-y-4 scale-95 opacity-0",
  );

  const {
    title,
    minimumCharactersMessage,
    clearLabel,
    placeholder,
    filtersLabel,
    filterArticlesLabel,
    filterCategoriesLabel,
    buttonLabel,
    articlesHeading,
    categoriesHeading,
    noResults,
  } = labels;

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
          <span className="sr-only">{title}</span>
        </button>
        <div className={panelClasses} role="dialog" aria-label={title}>
          <div className="max-h-[72vh] overflow-y-auto rounded-3xl border border-white/70 bg-white/95 p-6 shadow-2xl shadow-stone-900/25 backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold text-stone-900">{title}</h2>
                {!hasActiveQuery ? (
                  <p className="mt-1 text-xs text-stone-500">{minimumCharactersMessage}</p>
                ) : null}
              </div>
              {hasActiveQuery ? (
                <Link
                  href={`/${locale}`}
                  className="text-xs font-semibold text-emerald-600 transition hover:text-emerald-700"
                >
                  {clearLabel}
                </Link>
              ) : null}
            </div>
            <form action={`/${locale}`} method="get" className="mt-4 space-y-4">
              <label className="block">
                <span className="sr-only">{title}</span>
                <input
                  type="search"
                  name="q"
                  aria-label={title}
                  defaultValue={searchQuery}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-stone-200 bg-white/85 px-4 py-2.5 text-sm text-stone-700 shadow-sm transition focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                />
              </label>
              <div className="flex flex-wrap items-center gap-3 text-xs font-medium uppercase tracking-[0.2em] text-stone-400">
                <span>{filtersLabel}</span>
                <label className="flex items-center gap-2 normal-case tracking-normal text-stone-500">
                  <input
                    type="checkbox"
                    name="types"
                    value="articles"
                    defaultChecked={includeArticles}
                    className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                    {filterArticlesLabel}
                  </span>
                </label>
                <label className="flex items-center gap-2 normal-case tracking-normal text-stone-500">
                  <input
                    type="checkbox"
                    name="types"
                    value="categories"
                    defaultChecked={includeCategories}
                    className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-stone-500">
                    {filterCategoriesLabel}
                  </span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700"
                >
                  {buttonLabel}
                </button>
              </div>
            </form>
            {showMinimumCharactersHint ? (
              <p className="mt-4 text-xs text-stone-500">{minimumCharactersMessage}</p>
            ) : null}
            {shouldSearch ? (
              <div className="mt-5 space-y-5">
                <p className="text-sm font-semibold text-stone-900">{resultsHeading}</p>
                {includeArticles ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                      {articlesHeading}
                    </h3>
                    {searchResults.articles.length === 0 ? (
                      <p className="mt-2 rounded-xl border border-dashed border-stone-200 bg-white/70 px-4 py-3 text-xs text-stone-500">
                        {noResults}
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {searchResults.articles.map((item) => (
                          <li
                            key={`article-${item.id}`}
                            className="rounded-xl border border-stone-200 bg-white px-4 py-3 text-sm shadow-sm transition hover:border-emerald-200 hover:shadow-md"
                          >
                            <Link
                              href={`/${locale}/articles/${item.slug}`}
                              className="font-semibold text-stone-900 transition hover:text-emerald-600"
                            >
                              {item.title}
                            </Link>
                            {item.snippet ? (
                              <p className="mt-1 text-xs text-stone-500">{item.snippet}</p>
                            ) : null}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ) : null}
                {includeCategories ? (
                  <div>
                    <h3 className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-600">
                      {categoriesHeading}
                    </h3>
                    {searchResults.categories.length === 0 ? (
                      <p className="mt-2 rounded-xl border border-dashed border-stone-200 bg-white/70 px-4 py-3 text-xs text-stone-500">
                        {noResults}
                      </p>
                    ) : (
                      <ul className="mt-2 space-y-2">
                        {searchResults.categories.map((item) => (
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
                {includeArticles &&
                includeCategories &&
                searchResults.articles.length === 0 &&
                searchResults.categories.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-stone-200 bg-white/70 px-4 py-3 text-xs text-stone-500">
                    {noResults}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
