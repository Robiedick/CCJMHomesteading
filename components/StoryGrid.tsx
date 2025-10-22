"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import ReactMarkdown, { type Components } from "react-markdown";

type ArticleCard = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  overlayText: string;
  categoryColor: string;
  categoryLabel: string;
  formattedDate: string;
};

type StoryGridProps = {
  articles: ArticleCard[];
  locale: string;
  readMoreLabel: string;
  storyBackLabel: string;
};

const markdownComponents: Components = {
  h1: ({ children }) => (
    <h2 className="mt-10 text-3xl font-semibold text-stone-900 first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-8 text-2xl font-semibold text-stone-900 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-6 text-xl font-semibold text-stone-900 first:mt-0">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-7 text-stone-700 first:mt-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-stone-700">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-7 text-stone-700">
      {children}
    </ol>
  ),
  a: ({ children, href }) => (
    <a
      href={href}
      className="font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-4 border-emerald-200 bg-emerald-50/40 px-4 py-2 text-stone-700">
      {children}
    </blockquote>
  ),
  code: ((props) => {
    const {
      inline,
      className,
      children,
      ...rest
    } = props as {
      inline?: boolean;
      className?: string;
      children?: React.ReactNode;
    } & React.HTMLAttributes<HTMLElement>;

    if (inline) {
      const cls = `rounded bg-stone-100 px-1 py-0.5 text-sm font-mono text-stone-700${className ? ` ${className}` : ""}`;
      return (
        <code {...rest} className={cls}>
          {children}
        </code>
      );
    }

    const blockCls = `mt-4 block whitespace-pre-wrap rounded-lg bg-stone-900 px-4 py-3 text-sm text-emerald-100${className ? ` ${className}` : ""}`;
    return (
      <code {...rest} className={blockCls}>
        {children}
      </code>
    );
  }) as Components["code"],
};

export default function StoryGrid({ articles, locale, readMoreLabel, storyBackLabel }: StoryGridProps) {
  const [activeArticle, setActiveArticle] = useState<ArticleCard | null>(null);
  const [isAnimatingOut, setIsAnimatingOut] = useState(false);

  useEffect(() => {
    if (!activeArticle) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeModal();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeArticle]);

  const closeModal = () => {
    setIsAnimatingOut(true);
    window.setTimeout(() => {
      setActiveArticle(null);
      setIsAnimatingOut(false);
    }, 260);
  };

  const openArticle = (article: ArticleCard) => {
    setActiveArticle(article);
  };

  const overlayClasses = clsx(
    "story-modal-backdrop fixed inset-0 z-50 flex flex-col justify-end bg-stone-950/60 backdrop-blur-sm transition-opacity duration-200",
    isAnimatingOut ? "opacity-0" : "opacity-100",
  );

  const modalPanelClasses = clsx(
    "story-modal-panel pointer-events-auto relative mx-auto w-full max-w-4xl rounded-t-3xl border border-white/40 bg-white/98 p-6 shadow-2xl shadow-stone-900/30 transition-transform duration-300 ease-out will-change-transform",
    activeArticle && !isAnimatingOut ? "translate-y-0" : "translate-y-full",
  );

  const selected = activeArticle;
  const overlay = selected ? (
    <div className={overlayClasses}>
      <button
        type="button"
        aria-label="Sluit artikel"
        className="absolute inset-0 cursor-default bg-transparent"
        onClick={closeModal}
      />
      <div className={modalPanelClasses}>
        <div className="mb-4 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-stone-400">
              {selected.categoryLabel}
            </p>
            <h2 className="mt-2 text-2xl font-semibold text-stone-900">{selected.title}</h2>
            <p className="mt-1 text-sm text-stone-500">{selected.formattedDate}</p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={`/${locale}/articles/${selected.slug}`}
              className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
            >
              {storyBackLabel}
            </Link>
            <button
              type="button"
              onClick={closeModal}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-700"
              aria-label="Sluit"
            >
              ×
            </button>
          </div>
        </div>
        <div className="max-h-[68vh] overflow-y-auto pr-2 text-sm leading-7 text-stone-700">
          <ReactMarkdown components={markdownComponents}>{selected.content}</ReactMarkdown>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <Fragment>
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        {articles.map((article) => (
          <article
            key={article.id}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border bg-white shadow-lg shadow-stone-300/40 transition hover:-translate-y-1 hover:shadow-2xl"
            style={{ borderColor: article.categoryColor }}
          >
            <div
              className="relative overflow-hidden px-6 py-3 transition group-hover:brightness-95"
              style={{ backgroundColor: article.categoryColor }}
            >
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <p
                  aria-hidden="true"
                  className="absolute inset-x-6 -top-10 flex h-[220%] flex-col justify-start whitespace-pre-wrap text-3xl font-semibold uppercase leading-tight text-white/5 opacity-70 group-hover:[animation:article-card-scroll_12s_ease-in-out_infinite] motion-reduce:[animation:none!important]"
                >
                  {article.overlayText}
                </p>
              </div>
              <div className="relative z-10 space-y-1">
                <div className="flex flex-wrap gap-1 text-[0.4rem] font-semibold uppercase tracking-[0.3em] text-white/75 sm:text-[0.55rem]">
                  {article.categoryLabel}
                </div>
                <h3 className="text-sm font-semibold text-white sm:text-base">{article.title}</h3>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between px-6 pb-6 pt-5">
              <p className="text-sm leading-relaxed text-stone-600">{article.excerpt}</p>
              <div className="mt-6 flex items-center justify-between text-sm text-stone-500">
                <span>{article.formattedDate}</span>
                <button
                  type="button"
                  className="font-semibold text-emerald-600 transition hover:text-emerald-700"
                  onClick={() => openArticle(article)}
                >
                  {readMoreLabel}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {overlay}
    </Fragment>
  );
}
