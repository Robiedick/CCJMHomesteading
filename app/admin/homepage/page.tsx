import HomepageManager from "./HomepageManager";
import { locales, type Locale } from "@/lib/i18n";
import { getHomepageContentState } from "@/lib/homepage";

export const dynamic = "force-dynamic";

type LocaleState = {
  locale: Locale;
  data: Awaited<ReturnType<typeof getHomepageContentState>>["data"];
  defaults: Awaited<ReturnType<typeof getHomepageContentState>>["defaults"];
  source: Awaited<ReturnType<typeof getHomepageContentState>>["source"];
};

export default async function HomepageSettingsPage() {
  const states: LocaleState[] = [];

  for (const locale of locales) {
    const state = await getHomepageContentState(locale);
    states.push({
      locale,
      data: state.data,
      defaults: state.defaults,
      source: state.source,
    });
  }

  return <HomepageManager locales={states} />;
}
