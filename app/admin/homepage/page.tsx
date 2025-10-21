import HomepageManager from "./HomepageManager";
import { locales, type Locale } from "@/lib/i18n";
import { getHomepageContentState, getHomepagePresets } from "@/lib/homepage";
import { getDefaultLocale } from "@/lib/settings";

export const dynamic = "force-dynamic";

type LocaleState = {
  locale: Locale;
  data: Awaited<ReturnType<typeof getHomepageContentState>>["data"];
  defaults: Awaited<ReturnType<typeof getHomepageContentState>>["defaults"];
  source: Awaited<ReturnType<typeof getHomepageContentState>>["source"];
  presets: Awaited<ReturnType<typeof getHomepagePresets>>;
};

export default async function HomepageSettingsPage() {
  const states: LocaleState[] = [];

  for (const locale of locales) {
    const state = await getHomepageContentState(locale);
    const presets = await getHomepagePresets(locale);
    states.push({
      locale,
      data: state.data,
      defaults: state.defaults,
      source: state.source,
      presets,
    });
  }

  const defaultLocale = await getDefaultLocale();

  return <HomepageManager locales={states} defaultLocale={defaultLocale} />;
}
