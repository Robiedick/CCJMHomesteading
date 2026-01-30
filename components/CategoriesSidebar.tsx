"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit3, Plus, Trash2 } from "lucide-react";
import clsx from "clsx";

type SidebarCategory = {
  id: number;
  name: string;
  slug: string;
  color: string | null;
  articleCount: number;
};

type CategoriesSidebarProps = {
  categories: SidebarCategory[];
  locale: string;
  description: string;
  title: string;
  emptyLabel: string;
  countSingular: string;
  countPlural: string;
  isAdmin: boolean;
  className?: string;
};

export default function CategoriesSidebar({
  categories,
  locale,
  description,
  title,
  emptyLabel,
  countSingular,
  countPlural,
  isAdmin,
  className,
}: CategoriesSidebarProps) {
  const router = useRouter();
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isDutch = locale.startsWith("nl");

  const handleDelete = async (category: SidebarCategory) => {
    const confirmation = isDutch
      ? `Weet je zeker dat je de categorie "${category.name}" wilt verwijderen?`
      : `Are you sure you want to delete the category "${category.name}"?`;
    if (!window.confirm(confirmation)) {
      return;
    }
    setError(null);
    setDeleteLoadingId(category.id);
    try {
      const response = await fetch(`/api/categories/${category.id}`, { method: "DELETE" });
      if (!response.ok) {
        throw new Error(
          isDutch ? "Kon categorie niet verwijderen." : "Failed to delete category.",
        );
      }
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : isDutch
            ? "Kon categorie niet verwijderen."
            : "Failed to delete category.",
      );
    } finally {
      setDeleteLoadingId(null);
    }
  };

  return (
    <div id="topics" className={clsx("space-y-6", className)}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-emerald-600">
            {title}
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-gray-600">{description}</p>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/articles"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-emerald-200 bg-gradient-to-br from-white to-emerald-50/30 px-4 py-2.5 text-xs font-bold text-emerald-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:shadow-md hover:-translate-y-0.5 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              {isDutch ? "Nieuw verhaal" : "New article"}
            </Link>
            <Link
              href="/admin/categories"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl border-2 border-gray-300 bg-white px-4 py-2.5 text-xs font-bold text-gray-700 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md hover:-translate-y-0.5 sm:flex-none"
            >
              <Plus className="h-4 w-4" />
              {isDutch ? "Nieuwe categorie" : "New category"}
            </Link>
          </div>
        ) : null}
      </div>
      {categories.length === 0 ? (
        <p className="rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 px-4 py-4 text-sm text-gray-500">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-3">
          {categories.map((category) => {
            const countLabel = `${category.articleCount} ${
              category.articleCount === 1 ? countSingular : countPlural
            }`;
            return (
              <li
                key={category.id}
                className="group flex items-center justify-between gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-3 shadow-sm transition-all duration-200 hover:border-gray-300 hover:shadow-md hover:-translate-y-0.5"
              >
                <Link
                  href={`/${locale}/categories/${category.slug}`}
                  className="flex flex-1 items-center gap-3 text-sm font-semibold text-gray-700 transition-colors duration-200 group-hover:text-emerald-700"
                >
                  <span
                    className="inline-block h-3 w-3 rounded-full shadow-sm ring-2 ring-white"
                    style={{ backgroundColor: category.color ?? "#10b981" }}
                  />
                  <span className="truncate">{category.name}</span>
                </Link>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="rounded-lg bg-gradient-to-br from-gray-100 to-gray-50 px-3 py-1 text-xs font-bold text-gray-600 shadow-sm transition-all duration-200 group-hover:from-emerald-100 group-hover:to-emerald-50 group-hover:text-emerald-700">
                    {countLabel}
                  </span>
                  {isAdmin ? (
                    <>
                      <Link
                        href={`/admin/categories`}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-200 bg-white text-emerald-600 shadow-sm transition-all duration-200 hover:border-emerald-300 hover:text-emerald-700 hover:shadow-md hover:-translate-y-0.5"
                        aria-label={isDutch ? "Bewerk categorie" : "Edit category"}
                      >
                        <Edit3 className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border-2 border-gray-200 bg-white text-red-500 shadow-sm transition-all duration-200 hover:border-red-300 hover:text-red-600 hover:shadow-md hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label={isDutch ? "Verwijder categorie" : "Delete category"}
                        disabled={deleteLoadingId === category.id}
                      >
                        <Trash2 className={clsx("h-3.5 w-3.5", deleteLoadingId === category.id && "animate-pulse")} />
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error ? <p className="text-sm font-bold text-red-600">{error}</p> : null}
    </div>
  );
}
