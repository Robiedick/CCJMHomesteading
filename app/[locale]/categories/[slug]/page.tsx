import Link from "next/link";
import { notFound } from "next/navigation";
import StoryGrid from "@/components/StoryGrid";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { locales, type Locale } from "@/lib/i18n";
import { getHomepageContent } from "@/lib/homepage";

type CategoryPageProps = {
  params: { locale: Locale; slug: string };
};

export const dynamic = "force-dynamic";

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { locale, slug } = params;
  if (!locales.includes(locale)) {
    notFound();
  }

  const content = await getHomepageContent(locale);

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

  const articleCards = category.articles.map((article) => {
    const primaryCategory = article.categories[0];
    const categoryColor = primaryCategory?.color ?? "#047857";
    const categoryLabel =
      article.categories.length > 0
        ? article.categories.map((categoryItem) => categoryItem.name).join(" · ")
        : content.storiesUncategorized;
    const rawExcerpt = article.excerpt ?? article.content;
    const truncatedContent = article.content.slice(0, 200);
    const excerpt =
      article.excerpt ?? `${truncatedContent}${article.content.length > 200 ? "…" : ""}`;
    const cleanOverlay = rawExcerpt.replace(/\s+/g, " ").trim();
    const overlaySource = cleanOverlay.length > 0 ? cleanOverlay : article.title;
    const overlayText = `${overlaySource} ${overlaySource}`.slice(0, 260);

    return {
      id: article.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      excerpt,
      overlayText,
      categoryColor,
      categoryLabel,
      formattedDate: formatDate(article.publishedAt ?? article.createdAt, locale),
    };
  });

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <header className="border-b border-stone-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-6 py-16">
          <Link
            href={`/${locale}`}
            className="text-sm font-semibold text-emerald-600 hover:text-emerald-700"
          >
            {content.articleBackLabel}
          </Link>
          <div className="flex items-center gap-3">
            <span
              className="inline-block h-3 w-3 rounded-full border border-stone-200"
              style={{ backgroundColor: category.color ?? "#65a30d" }}
            />
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-emerald-600">
              {content.categoryHeaderLabel}
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
            {content.categoryEmptyLabel}
          </div>
        ) : (
          <StoryGrid articles={articleCards} readMoreLabel={content.storiesReadMore} />
        )}
      </main>
    </div>
  );
}
