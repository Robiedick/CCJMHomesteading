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
    <div className="mt-10">
      <div className="grid gap-8 md:grid-cols-2">
        {articles.map((article) => (
          <article
            key={article.id}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border-2 border-gray-200 bg-white shadow-lg transition-all duration-300 hover:shadow-2xl hover:-translate-y-2 hover:border-gray-300"
            style={{ borderTopColor: article.categoryColor, borderTopWidth: '4px' }}
          >
            <div
              className="relative overflow-hidden px-8 py-5 transition-all duration-300 group-hover:brightness-95"
              style={{ backgroundColor: article.categoryColor }}
            >
              <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
                <p
                  aria-hidden="true"
                  className="absolute inset-x-8 -top-10 flex h-[220%] flex-col justify-start whitespace-pre-wrap text-4xl font-bold uppercase leading-tight text-white/8 opacity-60 group-hover:[animation:article-card-scroll_12s_ease-in-out_infinite] motion-reduce:[animation:none!important]"
                >
                  {article.overlayText}
                </p>
              </div>
              <div className="relative z-10 space-y-2">
                <div className="flex flex-wrap gap-1.5 text-[0.65rem] font-bold uppercase tracking-[0.2em] text-white/90 sm:text-xs">
                  {article.categoryLabel}
                </div>
                <h3 className="text-base font-bold text-white sm:text-lg">{article.title}</h3>
              </div>
            </div>
            <div className="flex flex-1 flex-col justify-between px-8 pb-8 pt-6">
              <p className="text-base leading-relaxed text-gray-600">{article.excerpt}</p>
              <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6 text-sm">
                <span className="font-medium text-gray-500">{article.formattedDate}</span>
                <button
                  type="button"
                  className="group/btn relative overflow-hidden rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 px-5 py-2.5 font-bold text-white shadow-md shadow-emerald-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                  onClick={() => openArticle(article)}
                >
                  <span className="relative z-10">{readMoreLabel}</span>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400 to-emerald-500 opacity-0 transition-opacity duration-200 group-hover/btn:opacity-100" />
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
