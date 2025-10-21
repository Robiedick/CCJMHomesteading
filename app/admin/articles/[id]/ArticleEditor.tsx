"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Article, Category } from "@prisma/client";
import { slugify, toDatetimeLocal } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
import RichTextEditor from "@/components/RichTextEditor";

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

function toFormState(article: ArticleWithCategories): ArticleFormState {
  return {
    title: article.title,
    slug: article.slug,
    excerpt: article.excerpt ?? "",
    content: article.content,
    published: article.published,
    publishedAt: toDatetimeLocal(article.publishedAt ?? article.updatedAt),
    categoryIds: article.categories.map((category) => String(category.id)),
  };
}

export default function ArticleEditor({
  article,
  categories,
  defaultLocale,
}: {
  article: ArticleWithCategories;
  categories: Category[];
  defaultLocale: Locale;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ArticleFormState>(() => toFormState(article));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  async function updateArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
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
        setError(payload.message ?? firstFieldError ?? "Unable to update article.");
        return;
      }

      router.refresh();
      router.push("/admin/articles");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update article.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">Edit article</h1>
          <p className="mt-1 text-sm text-stone-600">
            Update content, publication status, and categories.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href={`/${defaultLocale}/articles/${article.slug}`}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            View live post
          </Link>
          <Link
            href="/admin/articles"
            className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-stone-700"
          >
            Back to articles
          </Link>
        </div>
      </div>

      <form className="space-y-5 rounded-xl border border-stone-200 bg-white p-6 shadow-sm" onSubmit={updateArticle}>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-stone-700">Title</label>
          <input
            required
            value={form.title}
            onChange={handleChange("title")}
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <div className="grid gap-2">
          <label className="text-sm font-medium text-stone-700">Slug</label>
          <input
            required
            value={form.slug}
            onChange={handleChange("slug")}
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
            className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
          />
        </div>
        <RichTextEditor
          id="article-content"
          label="Content"
          required
          description="Use the toolbar or Markdown shortcuts to format your article."
          value={form.content}
          onChange={(next) =>
            setForm((prev) => ({
              ...prev,
              content: next,
            }))
          }
        />
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
            Published
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
        <div className="flex gap-3">
          <button
            type="submit"
            disabled={submitting}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            onClick={() => router.push("/admin/articles")}
            className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
