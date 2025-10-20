import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import { getDictionary, locales, type Locale } from "@/lib/i18n";
import LocaleSwitcher from "@/components/LocaleSwitcher";

type HomePageProps = {
  params: { locale: Locale };
};

export const dynamic = "force-dynamic";

export default async function HomePage({ params }: HomePageProps) {
  const { locale } = params;
  if (!locales.includes(locale)) {
    notFound();
  }

  const dictionary = await getDictionary(locale);

  const [articles, categories] = await Promise.all([
    prisma.article.findMany({
      where: { published: true },
      orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
      include: { categories: true },
    }),
    prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        articles: {
          where: { published: true },
          select: { id: true },
        },
      },
    }),
  ]);

  const storyCountLabel =
    articles.length === 1
      ? dictionary.stories.countSingular
      : dictionary.stories.countPlural;

  const topicsCountSingular = dictionary.topics.countSingular;
  const topicsCountPlural = dictionary.topics.countPlural;

  return (
    <div className="relative min-h-screen text-stone-900">
      <div className="absolute inset-0 bg-gradient-to-b from-white/92 via-white/88 to-white/94 backdrop-blur-sm" />
      <div className="relative">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-6 py-10 lg:flex-row">
          <aside className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-lg shadow-emerald-100/40 backdrop-blur lg:sticky lg:top-12 lg:h-fit lg:w-72">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
              CCJM Homesteading
            </p>
            <p className="mt-2 text-sm text-stone-500">{dictionary.nav.tagline}</p>
            <nav className="mt-6 flex flex-col gap-3 text-sm">
              <LocaleSwitcher
                currentLocale={locale}
                labels={{
                  label: dictionary.switcher.label,
                  english: dictionary.switcher.english,
                  dutch: dictionary.switcher.dutch,
                }}
              />
              <Link
                href={`/${locale}#stories`}
                className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white/80 px-4 py-2 font-medium text-emerald-700 transition hover:border-emerald-300 hover:bg-white"
              >
                {dictionary.nav.latestStories}
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center rounded-full bg-emerald-600 px-4 py-2 font-semibold text-white transition hover:bg-emerald-700"
              >
                {dictionary.nav.signIn}
              </Link>
            </nav>
          </aside>
          <div className="flex-1 space-y-12">
            <header className="grid gap-8 rounded-3xl border border-white/70 bg-white/85 p-10 shadow-xl shadow-emerald-100/40 backdrop-blur lg:grid-cols-[1.7fr_1fr] lg:p-12">
              <div>
                <h1 className="text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl">
                  {dictionary.hero.title}
                </h1>
                <p className="mt-6 text-lg text-stone-600">
                  {dictionary.hero.description}
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <Link
                    href={`/${locale}#stories`}
                    className="rounded-full bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-emerald-200/50 transition hover:bg-emerald-700"
                  >
                    {dictionary.hero.ctaPrimary}
                  </Link>
                  <Link
                    href={`/${locale}#topics`}
                    className="rounded-full border border-stone-300 bg-white/70 px-6 py-3 text-sm font-semibold text-stone-700 transition hover:border-emerald-200 hover:text-emerald-700"
                  >
                    {dictionary.hero.ctaSecondary}
                  </Link>
                </div>
              </div>
              <div className="rounded-3xl border border-emerald-200/70 bg-emerald-50/70 p-8 text-sm text-stone-700 shadow-lg shadow-emerald-100/60">
                <p className="text-emerald-700">{dictionary.hero.editorTitle}</p>
                <p className="mt-3 leading-relaxed text-stone-600">
                  {dictionary.hero.editorDescription}
                </p>
                <Link
                  href="/admin"
                  className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-300 bg-white/80 px-5 py-2 text-sm font-semibold text-emerald-700 transition hover:border-emerald-400 hover:text-emerald-800"
                >
                  {dictionary.hero.editorLink}
                </Link>
              </div>
            </header>

            <main className="flex flex-col gap-12 pb-12">
              <section
                id="topics"
                className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl shadow-stone-200/30"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-900">
                      {dictionary.topics.title}
                    </h2>
                    <p className="mt-2 max-w-xl text-sm text-stone-600">
                      {dictionary.topics.description}
                    </p>
                  </div>
                </div>
                <div className="mt-8 flex flex-wrap gap-3">
                  {categories.length === 0 ? (
                    <p className="rounded-2xl border border-dashed border-stone-300 bg-white/70 px-4 py-3 text-sm text-stone-500">
                      {dictionary.topics.empty}
                    </p>
                  ) : (
                    categories.map((category) => (
                      <Link
                        key={category.id}
                        href={`/${locale}/categories/${category.slug}`}
                        className="group flex items-center gap-2 rounded-full border border-stone-200/80 bg-white px-5 py-2 text-sm font-medium text-stone-700 shadow-sm transition hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                      >
                        <span
                          className="inline-block h-2.5 w-2.5 rounded-full"
                          style={{
                            backgroundColor: category.color ?? "#65a30d",
                          }}
                        />
                        {category.name}
                        <span className="rounded-full bg-stone-100 px-2 py-0.5 text-xs text-stone-500 transition group-hover:bg-white group-hover:text-emerald-700">
                          {category.articles.length}{" "}
                          {category.articles.length === 1
                            ? topicsCountSingular
                            : topicsCountPlural}
                        </span>
                      </Link>
                    ))
                  )}
                </div>
              </section>

              <section
                id="stories"
                className="rounded-3xl border border-white/50 bg-white/70 p-8 shadow-xl shadow-stone-200/30"
              >
                <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-semibold text-stone-900">
                      {dictionary.stories.title}
                    </h2>
                    <p className="mt-2 text-sm text-stone-600">
                      {dictionary.stories.description}
                    </p>
                  </div>
                  <p className="text-sm font-medium text-stone-500">
                    {articles.length} {dictionary.stories.countLabel} {storyCountLabel}
                  </p>
                </div>
                {articles.length === 0 ? (
                  <div className="mt-8 rounded-2xl border border-dashed border-stone-300 bg-white/70 p-10 text-center">
                    <p className="text-sm text-stone-500">{dictionary.stories.empty}</p>
                  </div>
                ) : (
                  <div className="mt-8 grid gap-6 md:grid-cols-2">
                    {articles.map((article) => (
                      <article
                        key={article.id}
                        className="group flex h-full flex-col justify-between rounded-2xl border border-stone-200/80 bg-white p-6 shadow-md shadow-stone-200/60 transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-lg"
                      >
                        <div className="space-y-4">
                          <div className="flex flex-wrap gap-2 text-xs font-semibold uppercase tracking-wide text-emerald-600">
                            {article.categories.length > 0
                              ? article.categories
                                  .map((category) => category.name)
                                  .join(" · ")
                              : dictionary.stories.uncategorized}
                          </div>
                          <h3 className="text-2xl font-semibold text-stone-900 transition group-hover:text-emerald-700">
                            {article.title}
                          </h3>
                          <p className="text-sm leading-relaxed text-stone-600">
                            {article.excerpt ??
                              article.content.slice(0, 200).concat(
                                article.content.length > 200 ? "…" : "",
                              )}
                          </p>
                        </div>
                        <div className="mt-6 flex items-center justify-between text-sm text-stone-500">
                          <span>
                            {formatDate(article.publishedAt ?? article.createdAt, locale)}
                          </span>
                          <Link
                            href={`/${locale}/articles/${article.slug}`}
                            className="font-semibold text-emerald-600 transition hover:text-emerald-700"
                          >
                            {dictionary.stories.readMore}
                          </Link>
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>

        <footer className="border-t border-white/60 bg-white/75 py-6 backdrop-blur">
          <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-6 text-sm text-stone-500 sm:flex-row sm:items-center sm:justify-between">
            <p>{dictionary.footer.note.replace("{{year}}", `${new Date().getFullYear()}`)}</p>
            <p className="text-stone-400">{dictionary.footer.signature}</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
