import Link from "next/link";
import { notFound } from "next/navigation";
import ReactMarkdown, { type Components } from "react-markdown";
import type { HTMLAttributes, ReactNode } from "react";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { locales, type Locale } from "@/lib/i18n";
import { getHomepageContent } from "@/lib/homepage";

type ArticlePageProps = {
  params: { locale: Locale; slug: string };
};

export const dynamic = "force-dynamic";

const markdownComponents = {
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
      children?: ReactNode;
    } & HTMLAttributes<HTMLElement>;

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
} as Components;

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { locale, slug } = params;
  if (!locales.includes(locale)) {
    notFound();
  }

  const content = await getHomepageContent(locale);

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { categories: true },
  });

  if (!article || !article.published) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50/80 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-16">
          <Link
            href={`/${locale}`}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {content.articleBackLabel}
          </Link>
          <div className="flex flex-wrap gap-3 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
            {article.categories.length > 0
              ? article.categories.map((category) => category.name).join(" · ")
              : content.storiesUncategorized}
          </div>
          <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
            {article.title}
          </h1>
          <p className="text-sm text-stone-500">
            {content.articleUpdatedLabel} {formatDate(article.updatedAt, locale)} ·{" "}
            {content.articlePublishedLabel}{" "}
            {formatDate(article.publishedAt ?? article.createdAt, locale)}
          </p>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-6 py-12">
        <article className="text-base leading-7">
          <ReactMarkdown components={markdownComponents}>{article.content}</ReactMarkdown>
        </article>
      </main>
    </div>
  );
}
