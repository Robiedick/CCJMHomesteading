"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Article, Category } from "@prisma/client";
import { formatDate, slugify } from "@/lib/utils";

type ArticleWithCategories = Article & { categories: Category[] };

type ArticleFormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  published: boolean;
  publishedAt: string;
  categoryIds: string[];
};

const emptyArticleForm: ArticleFormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  published: false,
  publishedAt: "",
  categoryIds: [],
};

export default function ArticleManager({
  articles,
  categories,
}: {
  articles: ArticleWithCategories[];
  categories: Category[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<ArticleFormState>(emptyArticleForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const handleChange =
    (field: keyof ArticleFormState) =>
    (
      event:
        | React.ChangeEvent<HTMLInputElement>
        | React.ChangeEvent<HTMLTextAreaElement>
        | React.ChangeEvent<HTMLSelectElement>,
    ) => {
      const value =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;

      if (field === "title") {
        const derivedSlug = slugify(String(value));
        setForm((prev) => ({
          ...prev,
          title: String(value),
          slug: prev.slug.length > 0 ? prev.slug : derivedSlug,
        }));
        return;
      }

      if (field === "slug") {
        setForm((prev) => ({
          ...prev,
          slug: slugify(String(value)),
        }));
        return;
      }

      if (field === "categoryIds") {
        const options = Array.from(
          (event.target as HTMLSelectElement).selectedOptions,
        ).map((option) => option.value);

        setForm((prev) => ({
          ...prev,
          categoryIds: options,
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  async function createArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          categoryIds: form.categoryIds.map((value) => Number(value)),
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as {
          message?: string;
          errors?: { fieldErrors?: Record<string, string[]> };
        };
        const firstFieldError = payload.errors
          ? Object.values(payload.errors.fieldErrors ?? {})
              .flat()
              .at(0)
          : null;
        setError(payload.message ?? firstFieldError ?? "Unable to create article.");
        return;
      }

      setForm(emptyArticleForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to create article.");
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteArticle(id: number) {
    setDeleteLoadingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setError(payload.message ?? "Unable to delete article.");
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete article.");
    } finally {
      setDeleteLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-2 pb-4">
          <h1 className="text-xl font-semibold text-stone-900">New article</h1>
          <p className="text-sm text-stone-600">
            Draft and publish homestead stories, guides, and notes. You can add photos
            later when you are ready.
          </p>
        </div>
        <form className="space-y-5" onSubmit={createArticle}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-700">Title</label>
            <input
              required
              value={form.title}
              onChange={handleChange("title")}
              placeholder="How we built our raised garden beds"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-700">
              Slug
              <span className="ml-1 text-xs text-stone-400">
                (URL path, auto-generated)
              </span>
            </label>
            <input
              required
              value={form.slug}
              onChange={handleChange("slug")}
              placeholder="raised-garden-beds"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-700">
              Excerpt <span className="text-stone-400">(optional)</span>
            </label>
            <textarea
              value={form.excerpt}
              onChange={handleChange("excerpt")}
              rows={2}
              placeholder="A quick summary for the homepage cards."
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-700">
              Content <span className="text-stone-400">(supports Markdown)</span>
            </label>
            <textarea
              required
              value={form.content}
              onChange={handleChange("content")}
              rows={10}
              placeholder="Write your story, include headers using markdown like ## First steps"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-700">
              Categories <span className="text-stone-400">(optional)</span>
            </label>
            <select
              multiple
              value={form.categoryIds}
              onChange={handleChange("categoryIds")}
              className="h-28 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-stone-500">
              Hold Cmd (⌘) or Ctrl to select multiple categories.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
              <input
                type="checkbox"
                checked={form.published}
                onChange={handleChange("published")}
                className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
              />
              Publish immediately
            </label>
            {form.published && (
              <div className="flex items-center gap-2 text-sm text-stone-600">
                <label className="font-medium text-stone-700">Publish date</label>
                <input
                  type="datetime-local"
                  value={form.publishedAt}
                  onChange={handleChange("publishedAt")}
                  className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
              </div>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save article"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Existing articles</h2>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Title</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Categories</th>
                <th className="px-4 py-3 text-left font-semibold">Last updated</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {articles.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-stone-500" colSpan={5}>
                    No articles yet. Use the form above to write the first post.
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id}>
                    <td className="px-4 py-3">
                      <div className="font-medium text-stone-900">{article.title}</div>
                      {article.excerpt && (
                        <p className="mt-1 text-xs text-stone-500">{article.excerpt}</p>
                      )}
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
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                        >
                          Edit
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteArticle(article.id)}
                          disabled={deleteLoadingId === article.id}
                          className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deleteLoadingId === article.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
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
