import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ArticleEditor from "./ArticleEditor";

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

  return <ArticleEditor article={article} categories={categories} />;
}
