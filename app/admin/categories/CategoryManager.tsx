"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { Category } from "@prisma/client";
import { slugify } from "@/lib/utils";

type CategoryWithCount = Category & {
  _count: {
    articles: number;
  };
};

type CategoryFormState = {
  name: string;
  slug: string;
  description: string;
  color: string;
};

const emptyForm: CategoryFormState = {
  name: "",
  slug: "",
  description: "",
  color: "#8b5cf6",
};

function toFormState(category: CategoryWithCount): CategoryFormState {
  return {
    name: category.name,
    slug: category.slug,
    description: category.description ?? "",
    color: category.color ?? "#8b5cf6",
  };
}

export default function CategoryManager({
  categories,
}: {
  categories: CategoryWithCount[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<CategoryFormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingForm, setEditingForm] = useState<CategoryFormState | null>(null);
  const [editingError, setEditingError] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);

  const handleCreateChange =
    (field: keyof CategoryFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const value = event.target.value;
      if (field === "name") {
        const derivedSlug = slugify(value);
        setForm((prev) => ({
          ...prev,
          name: value,
          slug: prev.slug.length > 0 ? prev.slug : derivedSlug,
        }));
        return;
      }

      if (field === "slug") {
        setForm((prev) => ({
          ...prev,
          slug: slugify(value),
        }));
        return;
      }

      setForm((prev) => ({
        ...prev,
        [field]: value,
      }));
    };

  async function createCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        setError(payload.message ?? firstFieldError ?? "Failed to save category.");
        return;
      }

      setForm(emptyForm);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save category.");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditing(category: CategoryWithCount) {
    setEditingId(category.id);
    setEditingForm(toFormState(category));
    setEditingError(null);
  }

  const handleEditChange =
    (field: keyof CategoryFormState) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (!editingForm) return;
      const value = event.target.value;
      if (field === "name") {
        const derivedSlug = slugify(value);
        setEditingForm((prev) =>
          prev
            ? {
                ...prev,
                name: value,
                slug: prev.slug.length > 0 ? prev.slug : derivedSlug,
              }
            : prev,
        );
        return;
      }

      if (field === "slug") {
        setEditingForm((prev) =>
          prev
            ? {
                ...prev,
                slug: slugify(value),
              }
            : prev,
        );
        return;
      }

      setEditingForm((prev) =>
        prev
          ? {
              ...prev,
              [field]: value,
            }
          : prev,
      );
    };

  async function updateCategory(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingForm || editingId === null) return;

    setSubmitting(true);
    setEditingError(null);

    try {
      const response = await fetch(`/api/categories/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editingForm),
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
        setEditingError(
          payload.message ?? firstFieldError ?? "Failed to update category.",
        );
        return;
      }

      setEditingId(null);
      setEditingForm(null);
      router.refresh();
    } catch (err) {
      setEditingError(
        err instanceof Error ? err.message : "Failed to update category.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function deleteCategory(id: number) {
    setDeleteLoadingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/categories/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const payload = (await response.json()) as { message?: string };
        setError(payload.message ?? "Unable to delete category.");
        return;
      }

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Unable to delete category.",
      );
    } finally {
      setDeleteLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="max-w-2xl space-y-4 rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div>
          <h1 className="text-xl font-semibold text-stone-900">
            Create a new category
          </h1>
          <p className="mt-1 text-sm text-stone-600">
            Categories help organize homesteading posts and make browsing easier.
          </p>
        </div>
        <form className="space-y-4" onSubmit={createCategory}>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-700">Name</label>
            <input
              required
              value={form.name}
              onChange={handleCreateChange("name")}
              placeholder="Preserving"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-700">Slug</label>
            <input
              required
              value={form.slug}
              onChange={handleCreateChange("slug")}
              placeholder="preserving"
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="grid gap-2">
            <label className="text-sm font-medium text-stone-700">
              Description
              <span className="text-stone-400"> (optional)</span>
            </label>
            <textarea
              value={form.description}
              onChange={handleCreateChange("description")}
              rows={3}
              placeholder="Recipes, techniques, and notes on food preservation."
              className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-stone-700">
              Accent color
            </label>
            <input
              type="color"
              value={form.color}
              onChange={handleCreateChange("color")}
              className="h-9 w-14 cursor-pointer rounded border border-stone-300"
            />
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
            {submitting ? "Saving..." : "Create category"}
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-900">Existing categories</h2>
        <div className="overflow-hidden rounded-xl border border-stone-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-stone-200 text-sm">
            <thead className="bg-stone-50 text-stone-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Slug</th>
                <th className="px-4 py-3 text-left font-semibold">Articles</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {categories.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-stone-500" colSpan={4}>
                    No categories yet. Create one above to get started.
                  </td>
                </tr>
              ) : (
                categories.map((category) =>
                  editingId === category.id && editingForm ? (
                    <tr key={category.id} className="bg-emerald-50/50">
                      <td className="px-4 py-3" colSpan={4}>
                        <form className="grid gap-4" onSubmit={updateCategory}>
                          <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
                            <div className="grid gap-1">
                              <label className="text-xs font-medium uppercase text-stone-600">
                                Name
                              </label>
                              <input
                                value={editingForm.name}
                                onChange={handleEditChange("name")}
                                className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                            </div>
                            <div className="grid gap-1">
                              <label className="text-xs font-medium uppercase text-stone-600">
                                Slug
                              </label>
                              <input
                                value={editingForm.slug}
                                onChange={handleEditChange("slug")}
                                className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                              />
                            </div>
                          </div>
                          <div className="grid gap-1">
                            <label className="text-xs font-medium uppercase text-stone-600">
                              Description
                            </label>
                            <textarea
                              rows={2}
                              value={editingForm.description}
                              onChange={handleEditChange("description")}
                              className="rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                            />
                          </div>
                          <div className="flex flex-wrap items-center gap-3">
                            <div>
                              <label className="text-xs font-medium uppercase text-stone-600">
                                Accent color
                              </label>
                              <input
                                type="color"
                                value={editingForm.color}
                                onChange={handleEditChange("color")}
                                className="ml-2 h-9 w-14 cursor-pointer rounded border border-stone-300"
                              />
                            </div>
                            <div className="ml-auto flex gap-2">
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(null);
                                  setEditingForm(null);
                                  setEditingError(null);
                                }}
                                className="rounded-lg border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 transition hover:bg-stone-100"
                              >
                                Cancel
                              </button>
                              <button
                                type="submit"
                                disabled={submitting}
                                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                              >
                                {submitting ? "Saving..." : "Save changes"}
                              </button>
                            </div>
                          </div>
                          {editingError && (
                            <p className="text-sm text-red-600" role="alert">
                              {editingError}
                            </p>
                          )}
                        </form>
                      </td>
                    </tr>
                  ) : (
                    <tr key={category.id}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span
                            className="inline-block h-3 w-3 rounded-full border border-stone-200"
                            style={{
                              backgroundColor: category.color ?? "#8b5cf6",
                            }}
                          />
                          <span className="font-medium text-stone-900">
                            {category.name}
                          </span>
                        </div>
                        {category.description && (
                          <p className="mt-1 text-xs text-stone-500">
                            {category.description}
                          </p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-stone-500">{category.slug}</td>
                      <td className="px-4 py-3">
                        <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs font-medium text-stone-600">
                          {category._count.articles}{" "}
                          {category._count.articles === 1 ? "article" : "articles"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-3">
                          <button
                            type="button"
                            onClick={() => startEditing(category)}
                            className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => deleteCategory(category.id)}
                            disabled={deleteLoadingId === category.id}
                            className="text-sm font-semibold text-red-600 transition hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deleteLoadingId === category.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
