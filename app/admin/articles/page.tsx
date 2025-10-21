import { prisma } from "@/lib/prisma";
import ArticleManager from "./ArticleManager";
import { getDefaultLocale } from "@/lib/settings";
import { getAdminDictionary } from "@/lib/admin-i18n";

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

  const locale = await getDefaultLocale();
  const dictionary = await getAdminDictionary(locale);

  return (
    <ArticleManager
      articles={articles}
      categories={categories}
      dictionary={dictionary}
    />
  );
}
