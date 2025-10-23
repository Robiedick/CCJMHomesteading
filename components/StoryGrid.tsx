"use client";

import { useArticleModal, type ModalArticle } from "@/components/ArticleModalProvider";

export type StoryGridArticle = ModalArticle & {
  excerpt: string;
  overlayText: string;
  categoryColor: string;
};

type StoryGridProps = {
  articles: StoryGridArticle[];
  readMoreLabel: string;
};

export default function StoryGrid({ articles, readMoreLabel }: StoryGridProps) {
  const { openArticle } = useArticleModal();

  return (
    <div className="mt-8">
      <div className="grid gap-6 md:grid-cols-2">
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
    </div>
  );
}
