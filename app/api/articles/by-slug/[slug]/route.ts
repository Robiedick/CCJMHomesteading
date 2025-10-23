import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { locales, type Locale } from "@/lib/i18n";

export async function GET(
  request: Request,
  { params }: { params: { slug: string } },
) {
  const slug = params.slug;
  const { searchParams } = new URL(request.url);
  const localeParam = searchParams.get("locale");
  const locale = locales.includes(localeParam as Locale) ? (localeParam as Locale) : locales[0];

  const article = await prisma.article.findUnique({
    where: { slug },
    include: { categories: true },
  });

  if (!article || !article.published) {
    return NextResponse.json({ message: "Article not found." }, { status: 404 });
  }

  const primaryCategory = article.categories[0] ?? null;

  return NextResponse.json(
    {
      id: article.id,
      slug: article.slug,
      title: article.title,
      content: article.content,
      excerpt:
        article.excerpt && article.excerpt.trim().length > 0
          ? article.excerpt
          : article.content.slice(0, 200),
      categoryColor: primaryCategory?.color ?? "#047857",
      categoryLabel:
        article.categories.length > 0
          ? article.categories.map((category) => category.name).join(" · ")
          : null,
      formattedDate: formatDate(article.publishedAt ?? article.createdAt, locale),
    },
    { status: 200 },
  );
}
