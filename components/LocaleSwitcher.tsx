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
    <div className="flex items-center gap-3 rounded-xl border-2 border-gray-200 bg-white px-4 py-2.5 text-xs text-gray-700 shadow-sm">
      <span className="font-bold uppercase tracking-[0.2em]">
        {labels.label}
      </span>
      <div className="flex overflow-hidden rounded-lg border-2 border-gray-200">
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
                "px-3 py-1 text-xs font-bold transition-all duration-200",
                isActive
                  ? "bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm"
                  : "bg-white text-gray-600 hover:bg-gray-50",
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
