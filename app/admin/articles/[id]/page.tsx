import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getDefaultLocale } from "@/lib/settings";
import ArticleEditor from "./ArticleEditor";
import { getAdminDictionary } from "@/lib/admin-i18n";

export const dynamic = "force-dynamic";

export default async function EditArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    notFound();
  }

  const article = await prisma.article.findUnique({
    where: { id },
    include: { categories: true },
  });

  if (!article) {
    notFound();
  }

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
  });

  const defaultLocale = await getDefaultLocale();
  const dictionary = await getAdminDictionary(defaultLocale);

  return (
    <ArticleEditor
      article={article}
      categories={categories}
      defaultLocale={defaultLocale}
      dictionary={dictionary}
    />
  );
}
