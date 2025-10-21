import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { createAdminTranslator, getAdminDictionary } from "@/lib/admin-i18n";
import { getDefaultLocale } from "@/lib/settings";

export const dynamic = "force-dynamic";

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

  const locale = await getDefaultLocale();
  const dictionary = await getAdminDictionary(locale);
  const t = createAdminTranslator(dictionary);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-semibold text-stone-900">
          {t("dashboard.title")}
        </h1>
        <p className="mt-2 text-sm text-stone-600">
          {t("dashboard.subtitle")}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">{t("dashboard.stats.articles")}</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {articlesCount}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">
            {t("dashboard.stats.published")}
          </p>
          <p className="mt-2 text-3xl font-semibold text-emerald-600">
            {publishedCount}
          </p>
        </div>
        <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-stone-500">{t("dashboard.stats.categories")}</p>
          <p className="mt-2 text-3xl font-semibold text-stone-900">
            {categoriesCount}
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            {t("dashboard.recent.title")}
          </h2>
          <Link
            href="/admin/articles"
            className="text-sm font-medium text-emerald-600 hover:underline"
          >
            {t("dashboard.recent.cta")}
          </Link>
        </div>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200">
            <thead className="bg-stone-50">
              <tr className="text-left text-sm font-semibold text-stone-500">
                <th className="px-4 py-3">{t("dashboard.recent.table.title")}</th>
                <th className="px-4 py-3">{t("dashboard.recent.table.status")}</th>
                <th className="px-4 py-3">{t("dashboard.recent.table.categories")}</th>
                <th className="px-4 py-3">{t("dashboard.recent.table.updated")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200 text-sm">
              {latestArticles.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-stone-500" colSpan={4}>
                    {t("dashboard.recent.empty")} {" "}
                    <Link
                      href="/admin/articles"
                      className="font-medium text-emerald-600"
                    >
                      {t("dashboard.recent.emptyLink")}
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
                          {t("dashboard.recent.status.published")}
                        </span>
                      ) : (
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                          {t("dashboard.recent.status.draft")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {article.categories.length > 0
                        ? article.categories.map((category) => category.name).join(", ")
                        : t("dashboard.recent.uncategorized")}
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
