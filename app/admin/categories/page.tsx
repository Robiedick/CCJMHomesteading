import { prisma } from "@/lib/prisma";
import CategoryManager from "./CategoryManager";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await prisma.category.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { articles: true } } },
  });

  return <CategoryManager categories={categories} />;
}
