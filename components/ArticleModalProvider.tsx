"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type HTMLAttributes,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import clsx from "clsx";
import ReactMarkdown from "react-markdown";

type ModalArticle = {
  id: number;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  categoryColor: string;
  categoryLabel: string | null;
  formattedDate: string;
};

type ArticleModalContextValue = {
  openArticle: (article: ModalArticle) => void;
  openArticleBySlug: (slug: string) => void;
  closeArticle: () => void;
};

const ArticleModalContext = createContext<ArticleModalContextValue | null>(null);

const markdownComponents = {
  h1: ({ children }) => (
    <h2 className="mt-10 text-3xl font-semibold text-stone-900 first:mt-0">{children}</h2>
  ),
  h2: ({ children }) => (
    <h3 className="mt-8 text-2xl font-semibold text-stone-900 first:mt-0">{children}</h3>
  ),
  h3: ({ children }) => (
    <h4 className="mt-6 text-xl font-semibold text-stone-900 first:mt-0">{children}</h4>
  ),
  p: ({ children }) => (
    <p className="mt-4 text-base leading-7 text-stone-700 first:mt-0">{children}</p>
  ),
  ul: ({ children }) => (
    <ul className="mt-4 list-disc space-y-2 pl-6 text-base leading-7 text-stone-700">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="mt-4 list-decimal space-y-2 pl-6 text-base leading-7 text-stone-700">
      {children}
    </ol>
  ),
  a: ({ children, href }: { children: ReactNode; href?: string }) => (
    <a
      href={href}
      className="font-semibold text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mt-6 border-l-4 border-emerald-200 bg-emerald-50/40 px-4 py-2 text-stone-700">
      {children}
    </blockquote>
  ),
  code: ((props) => {
    const { inline, className, children, ...rest } = props as {
      inline?: boolean;
      className?: string;
      children?: ReactNode;
    } & HTMLAttributes<HTMLElement>;

    if (inline) {
      const cls = `rounded bg-stone-100 px-1 py-0.5 text-sm font-mono text-stone-700${className ? ` ${className}` : ""}`;
      return (
        <code {...rest} className={cls}>
          {children}
        </code>
      );
    }

    const blockCls = `mt-4 block whitespace-pre-wrap rounded-lg bg-stone-900 px-4 py-3 text-sm text-emerald-100${className ? ` ${className}` : ""}`;
    return (
      <code {...rest} className={blockCls}>
        {children}
      </code>
    );
  }) as Parameters<typeof ReactMarkdown>[0]["components"]["code"],
};

type ArticleModalProviderProps = {
  children: ReactNode;
  locale: string;
};

export function ArticleModalProvider({ children, locale }: ArticleModalProviderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [currentArticle, setCurrentArticle] = useState<ModalArticle | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isClosing, setIsClosing] = useState(false);
  const cachedArticlesRef = useRef(new Map<string, ModalArticle>());
  const isDutch = locale.startsWith("nl");

  const slugParam = searchParams.get("article");

  const updateUrl = useCallback(
    (slug?: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (!slug) {
        params.delete("article");
      } else {
        params.set("article", slug);
      }
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.push(href, { scroll: false });
    },
    [pathname, router, searchParams],
  );

  const fetchArticle = useCallback(
    async (slug: string) => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/articles/by-slug/${slug}?locale=${locale}`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error(isDutch ? "Kon het verhaal niet laden." : "Unable to load the story.");
        }
        const payload = (await response.json()) as ModalArticle;
        cachedArticlesRef.current.set(slug, payload);
        setCurrentArticle(payload);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : isDutch
              ? "Kon het verhaal niet laden."
              : "Unable to load the story.",
        );
        setCurrentArticle(null);
      } finally {
        setLoading(false);
      }
    },
    [isDutch, locale],
  );

  useEffect(() => {
    if (!slugParam) {
      setCurrentArticle(null);
      setLoading(false);
      setError(null);
      document.body.style.overflow = "";
      return;
    }

    const cached = cachedArticlesRef.current.get(slugParam);
    if (cached) {
      setCurrentArticle(cached);
      setLoading(false);
      setError(null);
      document.body.style.overflow = "hidden";
      return;
    }

    fetchArticle(slugParam).catch(() => {
      /* error handled in fetch */
    });
    document.body.style.overflow = "hidden";
  }, [fetchArticle, slugParam]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const openArticle = useCallback(
    (article: ModalArticle) => {
      cachedArticlesRef.current.set(article.slug, article);
      setCurrentArticle(article);
      setError(null);
      setLoading(false);
      setIsClosing(false);
      document.body.style.overflow = "hidden";
      updateUrl(article.slug);
    },
    [updateUrl],
  );

  const openArticleBySlug = useCallback(
    (slug: string) => {
      const cached = cachedArticlesRef.current.get(slug);
      if (cached) {
        openArticle(cached);
        return;
      }
      updateUrl(slug);
      fetchArticle(slug).catch(() => {
        /* handled */
      });
    },
    [fetchArticle, openArticle, updateUrl],
  );

  const closeArticle = useCallback(() => {
    setIsClosing(true);
    window.setTimeout(() => {
      setIsClosing(false);
      setCurrentArticle(null);
      setError(null);
      setLoading(false);
      document.body.style.overflow = "";
      const params = new URLSearchParams(searchParams.toString());
      params.delete("article");
      const query = params.toString();
      const href = query ? `${pathname}?${query}` : pathname;
      router.replace(href, { scroll: false });
    }, 260);
  }, [pathname, router, searchParams]);

  const contextValue = useMemo<ArticleModalContextValue>(
    () => ({
      openArticle,
      openArticleBySlug,
      closeArticle,
    }),
    [closeArticle, openArticle, openArticleBySlug],
  );

  const overlayVisible = Boolean(slugParam) || (!!currentArticle && !isClosing);

  return (
    <ArticleModalContext.Provider value={contextValue}>
      {children}
      {overlayVisible ? (
        <div
          className={clsx(
            "fixed inset-0 z-50 flex items-center justify-center bg-stone-950/70 p-4 sm:p-10",
            isClosing || (!currentArticle && !loading) ? "opacity-0 pointer-events-none" : "opacity-100",
          )}
        >
          <div
            className={clsx(
              "relative w-full max-w-4xl overflow-hidden rounded-3xl border border-emerald-100/40 bg-white/98 shadow-2xl shadow-emerald-200/30 transition-transform duration-300 ease-out",
              isClosing ? "translate-y-12 opacity-0" : "translate-y-0 opacity-100",
            )}
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/60 opacity-80" aria-hidden />
            <div className="relative px-6 pb-6 pt-5 sm:px-8">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {currentArticle?.categoryLabel ? (
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-600">
                      {currentArticle.categoryLabel}
                    </p>
                  ) : null}
                  <h2 className="mt-2 text-2xl font-semibold text-stone-900 sm:text-3xl">
                    {currentArticle?.title ?? "Verhalen laden…"}
                  </h2>
                  {currentArticle ? (
                    <p className="text-sm text-stone-500">{currentArticle.formattedDate}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  {currentArticle ? (
                    <a
                      href={`/${locale}/articles/${currentArticle.slug}`}
                      className="inline-flex items-center justify-center rounded-full border border-emerald-200 bg-white px-4 py-1.5 text-xs font-semibold text-emerald-700 transition hover:border-emerald-300 hover:text-emerald-800"
                    >
                      {isDutch ? "Open volledige pagina" : "Open full article"}
                    </a>
                  ) : null}
                  <button
                    type="button"
                    onClick={closeArticle}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-500 transition hover:border-stone-300 hover:text-stone-700"
                    aria-label={isDutch ? "Sluit artikel" : "Close article"}
                  >
                    ×
                  </button>
                </div>
              </div>
              <div className="mt-6 max-h-[70vh] overflow-y-auto pr-1 text-sm leading-7 text-stone-700">
                {loading ? (
                  <div className="rounded-2xl border border-dashed border-stone-200 bg-white/80 p-6 text-center text-sm text-stone-500">
                    {isDutch ? "Het verhaal wordt geladen…" : "Loading story…"}
                  </div>
                ) : error ? (
                  <div className="rounded-2xl border border-red-200 bg-red-50/80 p-6 text-center text-sm text-red-700">
                    {error}
                  </div>
                ) : currentArticle ? (
                  <ReactMarkdown components={markdownComponents}>
                    {currentArticle.content}
                  </ReactMarkdown>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </ArticleModalContext.Provider>
  );
}

export function useArticleModal() {
  const context = useContext(ArticleModalContext);
  if (!context) {
    throw new Error("useArticleModal must be used within an ArticleModalProvider");
  }
  return context;
}

export type { ModalArticle };
