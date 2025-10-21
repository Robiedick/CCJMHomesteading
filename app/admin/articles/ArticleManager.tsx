"use client";

import { useEffect, useRef, useState, type ChangeEvent, type PointerEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Article, Category } from "@prisma/client";
import { formatDate } from "@/lib/utils";
import RichTextEditor from "@/components/RichTextEditor";
import { createAdminTranslator, type AdminDictionary } from "@/lib/admin-i18n";

type ArticleWithCategories = Article & { categories: Category[] };

type ArticleFormState = {
  title: string;
  content: string;
  published: boolean;
  publishedAt: string;
  categoryIds: string[];
};

const emptyArticleForm: ArticleFormState = {
  title: "",
  content: "",
  published: false,
  publishedAt: "",
  categoryIds: [],
};

const MIN_WINDOW_WIDTH = 520;
const MIN_WINDOW_HEIGHT = 520;

export default function ArticleManager({
  articles,
  categories,
  dictionary,
}: {
  articles: ArticleWithCategories[];
  categories: Category[];
  dictionary: AdminDictionary;
}) {
  const router = useRouter();
  const t = createAdminTranslator(dictionary);
  const [form, setForm] = useState<ArticleFormState>(emptyArticleForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<number | null>(null);
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 80, y: 80 });
  const [windowSize, setWindowSize] = useState({ width: 720, height: 760 });
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const resizeStartRef = useRef({ x: 0, y: 0, width: 720, height: 760 });
  const windowRef = useRef<HTMLDivElement | null>(null);
  const titleInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!isWindowOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsWindowOpen(false);
        setError(null);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const centerTimeout = requestAnimationFrame(() => {
      const panel = windowRef.current;
      if (panel) {
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        const panelWidth = panel.offsetWidth;
        const panelHeight = panel.offsetHeight;
        setWindowPosition({
          x: Math.max(16, Math.min(viewportWidth - panelWidth - 16, viewportWidth / 2 - panelWidth / 2)),
          y: Math.max(16, Math.min(viewportHeight - panelHeight - 16, viewportHeight / 4)),
        });
      }
      titleInputRef.current?.focus();
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(centerTimeout);
    };
  }, [isWindowOpen]);

  function openWindow() {
    if (typeof window !== "undefined") {
      const maxWidth = Math.max(MIN_WINDOW_WIDTH, window.innerWidth - 32);
      const maxHeight = Math.max(MIN_WINDOW_HEIGHT, window.innerHeight - 32);
      setWindowSize((prev) => ({
        width: Math.min(prev.width, maxWidth),
        height: Math.min(prev.height, maxHeight),
      }));
    }
    setError(null);
    setIsWindowOpen(true);
  }

  function closeWindow() {
    isDraggingRef.current = false;
    setIsWindowOpen(false);
    setError(null);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target && target.closest("[data-no-drag]")) {
      return;
    }
    dragOffsetRef.current = {
      x: event.clientX - windowPosition.x,
      y: event.clientY - windowPosition.y,
    };
    isDraggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    const panel = windowRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = panel?.offsetWidth ?? 0;
    const panelHeight = panel?.offsetHeight ?? 0;

    const nextX = event.clientX - dragOffsetRef.current.x;
    const nextY = event.clientY - dragOffsetRef.current.y;

    setWindowPosition({
      x: Math.max(16, Math.min(nextX, viewportWidth - panelWidth - 16)),
      y: Math.max(16, Math.min(nextY, viewportHeight - panelHeight - 16)),
    });
  }

  function handlePointerUp(event: React.PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;
    isDraggingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleResizePointerDown(event: PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    isResizingRef.current = true;
    resizeStartRef.current = {
      x: event.clientX,
      y: event.clientY,
      width: windowSize.width,
      height: windowSize.height,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handleResizePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isResizingRef.current) return;

    const deltaX = event.clientX - resizeStartRef.current.x;
    const deltaY = event.clientY - resizeStartRef.current.y;

    const maxWidth = Math.max(MIN_WINDOW_WIDTH, window.innerWidth - windowPosition.x - 16);
    const maxHeight = Math.max(MIN_WINDOW_HEIGHT, window.innerHeight - windowPosition.y - 16);

    const nextWidth = Math.max(
      MIN_WINDOW_WIDTH,
      Math.min(resizeStartRef.current.width + deltaX, maxWidth),
    );
    const nextHeight = Math.max(
      MIN_WINDOW_HEIGHT,
      Math.min(resizeStartRef.current.height + deltaY, maxHeight),
    );

    setWindowSize({ width: nextWidth, height: nextHeight });
  }

  function handleResizePointerUp(event: PointerEvent<HTMLDivElement>) {
    if (!isResizingRef.current) return;
    isResizingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  const handleChange =
    (field: keyof ArticleFormState) =>
    (
      event:
        | ChangeEvent<HTMLInputElement>
        | ChangeEvent<HTMLTextAreaElement>
        | ChangeEvent<HTMLSelectElement>,
    ) => {
      const value =
        event.target.type === "checkbox"
          ? (event.target as HTMLInputElement).checked
          : event.target.value;

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

      if (field === "published") {
        const next = Boolean(value);
        setForm((prev) => ({
          ...prev,
          published: next,
          publishedAt: next ? prev.publishedAt : "",
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
          title: form.title,
          content: form.content,
          published: form.published,
          publishedAt: form.published ? form.publishedAt : "",
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
        setError(payload.message ?? firstFieldError ?? t("articles.messages.createError"));
        return;
      }

      setForm(emptyArticleForm);
      closeWindow();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("articles.messages.createError"));
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
        setError(payload.message ?? t("articles.messages.deleteError"));
        return;
      }

      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("articles.messages.deleteError"));
    } finally {
      setDeleteLoadingId(null);
    }
  }

  return (
    <div className="space-y-8">
      <section className="rounded-xl border border-stone-200 bg-white/90 p-6 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <h1 className="text-xl font-semibold text-stone-900">{t("articles.intro.title")}</h1>
            <p className="text-sm text-stone-600">{t("articles.intro.description")}</p>
            <p className="text-xs text-stone-500">{t("articles.intro.note")}</p>
          </div>
          <button
            type="button"
            onClick={openWindow}
            className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500"
          >
            {t("articles.intro.button")}
          </button>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-stone-100">{t("articles.existing.title")}</h2>
        <div className="overflow-hidden rounded-xl border border-white/10 bg-white/90 shadow-lg shadow-stone-900/10">
          <table className="min-w-full divide-y divide-stone-200 text-sm text-stone-800">
            <thead className="bg-stone-100 text-stone-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">{t("articles.existing.table.title")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("articles.existing.table.status")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("articles.existing.table.categories")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("articles.existing.table.updated")}</th>
                <th className="px-4 py-3 text-left font-semibold">{t("articles.existing.table.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-200">
              {articles.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-center text-stone-500" colSpan={5}>
                    {t("articles.existing.empty")}
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
                          {t("articles.existing.status.published")}
                        </span>
                      ) : (
                        <span className="rounded-full bg-stone-200 px-2.5 py-1 text-xs font-medium text-stone-700">
                          {t("articles.existing.status.draft")}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-stone-600">
                      {article.categories.length > 0
                        ? article.categories.map((category) => category.name).join(", ")
                        : t("articles.existing.uncategorized")}
                    </td>
                    <td className="px-4 py-3 text-stone-500">{formatDate(article.updatedAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-3">
                        <Link
                          href={`/admin/articles/${article.id}`}
                          className="text-sm font-semibold text-emerald-600 transition hover:text-emerald-700"
                        >
                          {t("articles.actions.edit")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteArticle(article.id)}
                          disabled={deleteLoadingId === article.id}
                          className="text-sm font-semibold text-red-500 transition hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deleteLoadingId === article.id
                            ? t("articles.actions.deleting")
                            : t("articles.actions.delete")}
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

      {isWindowOpen ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-stone-900/50 backdrop-blur-sm"
            onClick={closeWindow}
            aria-hidden
          />
          <div
            ref={windowRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby="new-article-window-title"
            className="fixed z-50 flex flex-col rounded-2xl border border-stone-700/20 bg-white shadow-2xl"
            style={{
              left: `${windowPosition.x}px`,
              top: `${windowPosition.y}px`,
              width: `${windowSize.width}px`,
              height: `${windowSize.height}px`,
            }}
          >
        <div
          className="flex cursor-move select-none items-center justify-between rounded-t-2xl border-b border-stone-200 bg-white px-5 py-3 text-sm font-semibold text-stone-900"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          style={{ touchAction: "none" }}
        >
          <span id="new-article-window-title">{t("articles.modal.title")}</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={closeWindow}
              data-no-drag
              className="rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
            >
              {t("articles.modal.close")}
            </button>
          </div>
        </div>
            <form className="flex h-full flex-col overflow-hidden" onSubmit={createArticle}>
              <div className="flex-1 overflow-auto">
                <div className="space-y-5 p-6 pr-8">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-stone-700" htmlFor="new-article-title">
                      {t("articles.modal.form.title")}
                    </label>
                    <input
                      id="new-article-title"
                      ref={titleInputRef}
                      required
                      value={form.title}
                      onChange={handleChange("title")}
                      placeholder={t("articles.modal.form.titlePlaceholder")}
                      className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                    />
                  </div>
                  <RichTextEditor
                    id="new-article-content"
                    label={t("articles.modal.form.content")}
                    required
                    description={t("articles.modal.form.contentDescription")}
                    value={form.content}
                    onChange={(next) =>
                      setForm((prev) => ({
                        ...prev,
                        content: next,
                      }))
                    }
                    placeholder={t("articles.modal.form.contentPlaceholder")}
                    className="flex min-h-[280px] flex-col"
                  />
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-stone-700" htmlFor="new-article-categories">
                      {t("articles.modal.form.categories")} <span className="text-stone-400">{t("common.optional")}</span>
                    </label>
                    <select
                      id="new-article-categories"
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
                    <p className="text-xs text-stone-500">{t("articles.modal.form.categoriesHint")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-6">
                    <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                      <input
                        type="checkbox"
                        checked={form.published}
                        onChange={handleChange("published")}
                        className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                      />
                      {t("articles.modal.form.publish")}
                    </label>
                    {form.published && (
                      <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
                        <label className="font-medium text-stone-700" htmlFor="new-article-published-at">
                          {t("articles.modal.form.publishDate")}
                        </label>
                        <input
                          id="new-article-published-at"
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
                </div>
              </div>
              <div className="flex items-center justify-end gap-3 border-t border-stone-200 bg-white/90 px-6 py-4">
                <button
                  type="button"
                  onClick={closeWindow}
                  className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-800"
                >
                  {t("articles.modal.form.cancel")}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? t("articles.modal.loading") : t("articles.modal.form.save")}
                </button>
              </div>
            </form>
            <div
              className="absolute bottom-2 right-2 h-4 w-4 cursor-se-resize rounded border border-stone-400/60 bg-white/80 shadow-sm"
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              onPointerCancel={handleResizePointerUp}
              aria-hidden
            />
          </div>
        </>
      ) : null}
    </div>
  );
}
