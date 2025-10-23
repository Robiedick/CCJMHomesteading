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
    <div id="topics" className={clsx("space-y-4", className)}>
      <div className="flex flex-col gap-3">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-600">
            {title}
          </h2>
          <p className="mt-2 text-xs text-stone-500">{description}</p>
        </div>
        {isAdmin ? (
          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/articles"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-emerald-200 bg-white px-3 py-1.5 text-xs font-semibold text-emerald-700 shadow-sm transition hover:border-emerald-300 hover:text-emerald-800 sm:flex-none"
            >
              <Plus className="h-3.5 w-3.5" />
              {isDutch ? "Nieuw verhaal" : "New article"}
            </Link>
            <Link
              href="/admin/categories"
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-xs font-semibold text-stone-600 shadow-sm transition hover:border-emerald-200 hover:text-emerald-700 sm:flex-none"
            >
              <Plus className="h-3.5 w-3.5" />
              {isDutch ? "Nieuwe categorie" : "New category"}
            </Link>
          </div>
        ) : null}
      </div>
      {categories.length === 0 ? (
        <p className="rounded-xl border border-dashed border-stone-300 bg-white/70 px-3 py-3 text-xs text-stone-500">
          {emptyLabel}
        </p>
      ) : (
        <ul className="space-y-2">
          {categories.map((category) => {
            const countLabel = `${category.articleCount} ${
              category.articleCount === 1 ? countSingular : countPlural
            }`;
            return (
              <li
                key={category.id}
                className="group flex items-center justify-between gap-3 rounded-xl border border-stone-200/60 bg-white/90 px-3 py-2 text-xs font-medium text-stone-600 shadow-sm transition hover:border-emerald-200 hover:bg-white"
              >
                <Link
                  href={`/${locale}/categories/${category.slug}`}
                  className="flex flex-1 items-center gap-2 text-[0.9rem] font-medium text-stone-700 transition group-hover:text-emerald-700"
                >
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: category.color ?? "#65a30d" }}
                  />
                  <span className="truncate">{category.name}</span>
                </Link>
                <div className="flex flex-shrink-0 items-center gap-2">
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 text-[0.65rem] text-stone-500 transition group-hover:bg-white group-hover:text-emerald-700">
                    {countLabel}
                  </span>
                  {isAdmin ? (
                    <>
                      <Link
                        href={`/admin/categories`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/95 text-emerald-600 shadow transition hover:border-emerald-300 hover:text-emerald-700"
                        aria-label={isDutch ? "Bewerk categorie" : "Edit category"}
                      >
                        <Edit3 className="h-3 w-3" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(category)}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-white/70 bg-white/95 text-red-500 shadow transition hover:border-red-300 hover:text-red-600 disabled:cursor-not-allowed"
                        aria-label={isDutch ? "Verwijder categorie" : "Delete category"}
                        disabled={deleteLoadingId === category.id}
                      >
                        <Trash2 className={clsx("h-3 w-3", deleteLoadingId === category.id && "animate-pulse")} />
                      </button>
                    </>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
      {error ? <p className="text-xs font-semibold text-red-600">{error}</p> : null}
    </div>
  );
}
