import type { ReactNode } from "react";
import { ArticleModalProvider } from "@/components/ArticleModalProvider";

export default async function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return <ArticleModalProvider locale={locale}>{children}</ArticleModalProvider>;
}
