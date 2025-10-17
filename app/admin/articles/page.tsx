import { prisma } from "@/lib/prisma";
import ArticleManager from "./ArticleManager";

export const dynamic = "force-dynamic";

export default async function ArticlesPage() {
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      orderBy: { createdAt: "desc" },
      include: { categories: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
    }),
  ]);

  return <ArticleManager articles={articles} categories={categories} />;
}
