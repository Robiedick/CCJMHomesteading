import type { ReactNode } from "react";
import { ArticleModalProvider } from "@/components/ArticleModalProvider";

export default function LocaleLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  return <ArticleModalProvider locale={params.locale}>{children}</ArticleModalProvider>;
}
