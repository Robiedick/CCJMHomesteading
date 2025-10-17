import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export default async function AdminDashboard() {
  const [articlesCount, publishedCount, categoriesCount, latestArticles] =
    await Promise.all([
      prisma.article.count(),
      prisma.article.count({ where: { published: true } }),
      prisma.category.count(),
      prisma.article.findMany({
        orderBy: { updatedAt: "desc" },
        take: 5,
        include: { categories: true },
      }),
    ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-stone-900">
          Homestead Content Overview
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          Manage articles and categories for CCJM Homesteading.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Total Articles</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {articlesCount}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">
            Published Articles
          </p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">
            {publishedCount}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">Categories</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {categoriesCount}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            Recently Updated Articles
          </h2>
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            Manage articles
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr className="text-left text-sm font-semibold text-stone-500">
                <th className="px-4 py-3">Title</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Categories</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {latestArticles.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-stone-500" colSpan={4}>
                    No articles yet.{" "}
                    <Link
                      href="/admin/articles"
                      className="font-medium text-emerald-600"
                    >
                      Create the first one.
                    </Link>
                  </td>
                </tr>
              ) : (
                latestArticles.map((article) => (
                  <tr key={article.id}>
                    <td className="px-4 py-3 font-medium text-stone-900">
                      {article.title}
                    </td>
                    <td className="px-4 py-3">
                      {article.published ? (
                        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                          Published
                        </span>
                      ) : (
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                          Draft
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {article.categories.length > 0
                        ? article.categories.map((category) => category.name).join(", ")
                        : "Uncategorized"}
                    </td>
                    <td className="px-4 py-3 text-stone-500">
                      {formatDate(article.updatedAt)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
