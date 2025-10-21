"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent,
} from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { Article, Category } from "@prisma/client";
import { toDatetimeLocal } from "@/lib/utils";
import type { Locale } from "@/lib/i18n";
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

function toFormState(article: ArticleWithCategories): ArticleFormState {
  return {
    title: article.title,
    content: article.content,
    published: article.published,
    publishedAt: toDatetimeLocal(article.publishedAt ?? article.updatedAt),
    categoryIds: article.categories.map((category) => String(category.id)),
  };
}

const MIN_WINDOW_WIDTH = 520;
const MIN_WINDOW_HEIGHT = 520;

export default function ArticleEditor({
  article,
  categories,
  defaultLocale,
  dictionary,
}: {
  article: ArticleWithCategories;
  categories: Category[];
  defaultLocale: Locale;
  dictionary: AdminDictionary;
}) {
  const router = useRouter();
  const [form, setForm] = useState<ArticleFormState>(() => toFormState(article));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [windowPosition, setWindowPosition] = useState({ x: 80, y: 80 });
  const [windowSize, setWindowSize] = useState({ width: 720, height: 760 });

  const windowRef = useRef<HTMLDivElement | null>(null);
  const dragOffsetRef = useRef({ x: 0, y: 0 });
  const resizeStartRef = useRef({ x: 0, y: 0, width: 720, height: 760 });
  const isDraggingRef = useRef(false);
  const isResizingRef = useRef(false);
  const t = createAdminTranslator(dictionary);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        router.push("/admin/articles");
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    const frame = requestAnimationFrame(() => {
      const panel = windowRef.current;
      if (!panel) return;

      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const panelWidth = panel.offsetWidth || MIN_WINDOW_WIDTH;
      const panelHeight = panel.offsetHeight || MIN_WINDOW_HEIGHT;

      const nextX = Math.max(
        16,
        Math.min(viewportWidth - panelWidth - 16, viewportWidth / 2 - panelWidth / 2),
      );
      const nextY = Math.max(
        16,
        Math.min(viewportHeight - panelHeight - 16, viewportHeight / 6),
      );

      setWindowPosition({ x: nextX, y: nextY });
      setWindowSize((prev) => ({
        width: Math.min(prev.width, Math.max(MIN_WINDOW_WIDTH, viewportWidth - 32)),
        height: Math.min(prev.height, Math.max(MIN_WINDOW_HEIGHT, viewportHeight - 32)),
      }));
    });

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      cancelAnimationFrame(frame);
    };
  }, [router]);

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

  async function updateArticle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/articles/${article.id}`, {
        method: "PUT",
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
        setError(payload.message ?? firstFieldError ?? t("articleEditor.error"));
        return;
      }

      router.refresh();
      router.push("/admin/articles");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("articleEditor.error"));
    } finally {
      setSubmitting(false);
    }
  }

  function handlePointerDown(event: PointerEvent<HTMLDivElement>) {
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

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!isDraggingRef.current) return;

    const panel = windowRef.current;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const panelWidth = panel?.offsetWidth ?? windowSize.width;
    const panelHeight = panel?.offsetHeight ?? windowSize.height;

    const nextX = event.clientX - dragOffsetRef.current.x;
    const nextY = event.clientY - dragOffsetRef.current.y;

    setWindowPosition({
      x: Math.max(16, Math.min(nextX, viewportWidth - panelWidth - 16)),
      y: Math.max(16, Math.min(nextY, viewportHeight - panelHeight - 16)),
    });
  }

  function handlePointerUp(event: PointerEvent<HTMLDivElement>) {
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

    const maxWidth = Math.max(
      MIN_WINDOW_WIDTH,
      window.innerWidth - windowPosition.x - 16,
    );
    const maxHeight = Math.max(
      MIN_WINDOW_HEIGHT,
      window.innerHeight - windowPosition.y - 16,
    );

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

  function cancelEditing() {
    router.push("/admin/articles");
  }

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-stone-900/60 backdrop-blur-sm"
        aria-hidden
        onClick={cancelEditing}
      />
      <div
        ref={windowRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-article-window-title"
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
          <span id="edit-article-window-title">{t("articleEditor.title")}</span>
          <div className="flex items-center gap-2">
            <Link
              href={`/${defaultLocale}/articles/${article.slug}`}
              prefetch={false}
              target="_blank"
              rel="noreferrer"
              data-no-drag
              className="hidden rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-900 sm:inline-flex"
            >
              {t("articleEditor.viewLive")}
            </Link>
            <button
              type="button"
              onClick={cancelEditing}
              data-no-drag
              className="rounded-md border border-stone-300 px-2 py-1 text-xs font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-900"
            >
              {t("articleEditor.close")}
            </button>
          </div>
        </div>

        <form className="flex h-full flex-col overflow-hidden" onSubmit={updateArticle}>
          <div className="flex-1 overflow-auto">
            <div className="space-y-5 p-6 pr-8">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-stone-900">{t("articleEditor.subtitle")}</h2>
                  <p className="text-xs text-stone-500">{t("articleEditor.summary")}</p>
                </div>
                <Link
                  href={`/${defaultLocale}/articles/${article.slug}`}
                  prefetch={false}
                  target="_blank"
                  rel="noreferrer"
                  data-no-drag
                  className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 transition hover:bg-stone-100"
                >
                  {t("articleEditor.viewLive")}
                </Link>
              </div>

              <div className="grid gap-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="edit-article-title">
                  {t("articleEditor.form.title")}
                </label>
                <input
                  id="edit-article-title"
                  required
                  value={form.title}
                  onChange={handleChange("title")}
                  className="w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200"
                />
                <p className="text-xs text-stone-500">
                  {t("articleEditor.liveAt")}
                  {" "}
                  <span className="font-medium text-stone-600">/{defaultLocale}/articles/{article.slug}</span>
                </p>
              </div>

              <RichTextEditor
                id="edit-article-content"
                label={t("articleEditor.form.content")}
                required
                description={t("articleEditor.form.contentDescription")}
                value={form.content}
                onChange={(next) =>
                  setForm((prev) => ({
                    ...prev,
                    content: next,
                  }))
                }
                className="flex min-h-[320px] flex-col"
              />

              <div className="grid gap-2">
                <label className="text-sm font-medium text-stone-700" htmlFor="edit-article-categories">
                  {t("articleEditor.form.categories")} <span className="text-stone-400">{t("common.optional")}</span>
                </label>
                <select
                  id="edit-article-categories"
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
                <p className="text-xs text-stone-500">{t("articleEditor.form.categoriesHint")}</p>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <label className="flex items-center gap-2 text-sm font-medium text-stone-700">
                  <input
                    type="checkbox"
                    checked={form.published}
                    onChange={handleChange("published")}
                    className="h-4 w-4 rounded border-stone-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  {t("articleEditor.form.published")}
                </label>
                {form.published && (
                  <div className="flex flex-wrap items-center gap-2 text-sm text-stone-600">
                    <label className="font-medium text-stone-700" htmlFor="edit-article-published-at">
                      {t("articleEditor.form.publishDate")}
                    </label>
                    <input
                      id="edit-article-published-at"
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
              onClick={cancelEditing}
              className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-medium text-stone-600 transition hover:border-stone-400 hover:text-stone-800"
            >
              {t("articleEditor.form.cancel")}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? t("articleEditor.loading") : t("articleEditor.form.save")}
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
  );
}
