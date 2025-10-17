"use client";

import { usePathname, useRouter } from "next/navigation";
import { useTransition } from "react";
import clsx from "clsx";
import { locales, type Locale, getLocaleLabel } from "@/lib/i18n";

export default function LocaleSwitcher({
  currentLocale,
  labels,
}: {
  currentLocale: Locale;
  labels: { label: string; english: string; dutch: string };
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchLocale(nextLocale: Locale) {
    if (nextLocale === currentLocale) return;
    const segments = pathname.split("/").filter(Boolean);
    if (segments.length > 0 && locales.includes(segments[0] as Locale)) {
      segments[0] = nextLocale;
    } else {
      segments.unshift(nextLocale);
    }
    const targetPath = `/${segments.join("/")}`;
    startTransition(() => {
      router.replace(targetPath || `/${nextLocale}`);
    });
  }

  return (
    <div className="flex items-center gap-3 rounded-full border border-white/50 bg-white/60 px-3 py-1 text-xs text-stone-600 shadow-sm shadow-emerald-100/40 backdrop-blur">
      <span className="font-medium uppercase tracking-[0.2em]">
        {labels.label}
      </span>
      <div className="flex overflow-hidden rounded-full border border-stone-200">
        {locales.map((locale) => {
          const { short, label } = getLocaleLabel(locale);
          const isActive = currentLocale === locale;
          return (
            <button
              key={locale}
              type="button"
              onClick={() => switchLocale(locale)}
              disabled={isPending}
              className={clsx(
                "px-3 py-1 text-xs font-semibold transition",
                isActive
                  ? "bg-emerald-600 text-white"
                  : "bg-white/0 text-stone-600 hover:bg-white/70",
              )}
              aria-label={label}
            >
              {short}
            </button>
          );
        })}
      </div>
    </div>
  );
}
