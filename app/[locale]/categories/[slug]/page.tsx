import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

type CategoryPageProps = {
  params: { locale: Locale; slug: string };
};

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = params;
  if (!locales.includes(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  const category = await prisma.category.findUnique({
    where: { slug },
    include: {
      articles: {
        where: { published: true },
        include: { categories: true },
        orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      },
    },
  });

  if (!category) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-16">
          <Link
            href={`/${locale}`}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {dictionary.article.back}
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-3 w-3 rounded-full border border-stone-200"
              style={{ backgroundColor: category.color ?? "#65a30d" }}
            />
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              {dictionary.category.headerLabel}
            </p>
          </div>
          <h1 className="text-4xl font-semibold text-stone-900 sm:text-5xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="max-w-2xl text-base text-stone-600">{category.description}</p>
          )}
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-6 py-12">
        {category.articles.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-200 bg-white p-8 text-center text-sm text-stone-500">
            {dictionary.category.empty}
          </div>
        ) : (
          <div className="space-y-6">
            {category.articles.map((article) => (
              <article
                key={article.id}
                className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm transition hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-baseline sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-900">
                      {article.title}
                    </h2>
                    <p className="mt-2 text-sm text-stone-600">
                      {article.excerpt ??
                        article.content.slice(0, 200).concat(
                          article.content.length > 200 ? "…" : "",
                        )}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                      {article.categories
                        .map((categoryItem) => categoryItem.name)
                        .join(" · ")}
                    </div>
                  </div>
                  <p className="text-sm text-stone-500">
                    {formatDate(article.publishedAt ?? article.createdAt, locale)}
                  </p>
                </div>
                <div className="mt-4">
                  <Link
                    href={`/${locale}/articles/${article.slug}`}
                    className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                  >
                    {dictionary.stories.readMore}
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
