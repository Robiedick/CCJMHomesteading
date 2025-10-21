import { redirect } from "next/navigation";
import { getDefaultLocale } from "@/lib/settings";

export default async function RootRedirect() {
  const locale = await getDefaultLocale();
  redirect(`/${locale}`);
}
