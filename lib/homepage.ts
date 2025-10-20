import type { HomepageContent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

export type HomepageContentData = {
  navTagline: string;
  navLatestStoriesLabel: string;
  navSignInLabel: string;
  switcherLabel: string;
  switcherEnglishLabel: string;
  switcherDutchLabel: string;
  heroTitle: string;
  heroDescription: string;
  heroCtaPrimaryLabel: string;
  heroCtaSecondaryLabel: string;
  heroEditorTitle: string;
  heroEditorDescription: string;
  heroEditorLinkLabel: string;
  topicsTitle: string;
  topicsDescription: string;
  topicsEmpty: string;
  topicsCountSingular: string;
  topicsCountPlural: string;
  storiesTitle: string;
  storiesDescription: string;
  storiesEmpty: string;
  storiesCountLabel: string;
  storiesCountSingular: string;
  storiesCountPlural: string;
  storiesReadMore: string;
  storiesUncategorized: string;
  footerNote: string;
  footerSignature: string;
};

type HomepageContentState = {
  data: HomepageContentData;
  defaults: HomepageContentData;
  source: "database" | "default";
};

export async function getHomepageContent(locale: Locale): Promise<HomepageContentData> {
  const state = await getHomepageContentState(locale);
  return state.data;
}

export async function getHomepageContentState(locale: Locale): Promise<HomepageContentState> {
  const defaults = await getDefaultHomepageContent(locale);
  const record = await prisma.homepageContent.findUnique({
    where: { locale },
  });

  if (!record) {
    return {
      data: defaults,
      defaults,
      source: "default",
    };
  }

  return {
    data: mapRecordToData(record),
    defaults,
    source: "database",
  };
}

export function isSupportedLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

export async function getDefaultHomepageContent(locale: Locale): Promise<HomepageContentData> {
  const dictionary = await getDictionary(locale);
  return {
    navTagline: dictionary.nav.tagline,
    navLatestStoriesLabel: dictionary.nav.latestStories,
    navSignInLabel: dictionary.nav.signIn,
    switcherLabel: dictionary.switcher.label,
    switcherEnglishLabel: dictionary.switcher.english,
    switcherDutchLabel: dictionary.switcher.dutch,
    heroTitle: dictionary.hero.title,
    heroDescription: dictionary.hero.description,
    heroCtaPrimaryLabel: dictionary.hero.ctaPrimary,
    heroCtaSecondaryLabel: dictionary.hero.ctaSecondary,
    heroEditorTitle: dictionary.hero.editorTitle,
    heroEditorDescription: dictionary.hero.editorDescription,
    heroEditorLinkLabel: dictionary.hero.editorLink,
    topicsTitle: dictionary.topics.title,
    topicsDescription: dictionary.topics.description,
    topicsEmpty: dictionary.topics.empty,
    topicsCountSingular: dictionary.topics.countSingular,
    topicsCountPlural: dictionary.topics.countPlural,
    storiesTitle: dictionary.stories.title,
    storiesDescription: dictionary.stories.description,
    storiesEmpty: dictionary.stories.empty,
    storiesCountLabel: dictionary.stories.countLabel,
    storiesCountSingular: dictionary.stories.countSingular,
    storiesCountPlural: dictionary.stories.countPlural,
    storiesReadMore: dictionary.stories.readMore,
    storiesUncategorized: dictionary.stories.uncategorized,
    footerNote: dictionary.footer.note,
    footerSignature: dictionary.footer.signature,
  };
}

export function mapDataToUpdateInput(data: HomepageContentData): Omit<HomepageContent, "id" | "createdAt" | "updatedAt" | "locale"> {
  return {
    navTagline: data.navTagline,
    navLatestStoriesLabel: data.navLatestStoriesLabel,
    navSignInLabel: data.navSignInLabel,
    switcherLabel: data.switcherLabel,
    switcherEnglishLabel: data.switcherEnglishLabel,
    switcherDutchLabel: data.switcherDutchLabel,
    heroTitle: data.heroTitle,
    heroDescription: data.heroDescription,
    heroCtaPrimaryLabel: data.heroCtaPrimaryLabel,
    heroCtaSecondaryLabel: data.heroCtaSecondaryLabel,
    heroEditorTitle: data.heroEditorTitle,
    heroEditorDescription: data.heroEditorDescription,
    heroEditorLinkLabel: data.heroEditorLinkLabel,
    topicsTitle: data.topicsTitle,
    topicsDescription: data.topicsDescription,
    topicsEmpty: data.topicsEmpty,
    topicsCountSingular: data.topicsCountSingular,
    topicsCountPlural: data.topicsCountPlural,
    storiesTitle: data.storiesTitle,
    storiesDescription: data.storiesDescription,
    storiesEmpty: data.storiesEmpty,
    storiesCountLabel: data.storiesCountLabel,
    storiesCountSingular: data.storiesCountSingular,
    storiesCountPlural: data.storiesCountPlural,
    storiesReadMore: data.storiesReadMore,
    storiesUncategorized: data.storiesUncategorized,
    footerNote: data.footerNote,
    footerSignature: data.footerSignature,
  };
}

function mapRecordToData(record: HomepageContent): HomepageContentData {
  return {
    navTagline: record.navTagline,
    navLatestStoriesLabel: record.navLatestStoriesLabel,
    navSignInLabel: record.navSignInLabel,
    switcherLabel: record.switcherLabel,
    switcherEnglishLabel: record.switcherEnglishLabel,
    switcherDutchLabel: record.switcherDutchLabel,
    heroTitle: record.heroTitle,
    heroDescription: record.heroDescription,
    heroCtaPrimaryLabel: record.heroCtaPrimaryLabel,
    heroCtaSecondaryLabel: record.heroCtaSecondaryLabel,
    heroEditorTitle: record.heroEditorTitle,
    heroEditorDescription: record.heroEditorDescription,
    heroEditorLinkLabel: record.heroEditorLinkLabel,
    topicsTitle: record.topicsTitle,
    topicsDescription: record.topicsDescription,
    topicsEmpty: record.topicsEmpty,
    topicsCountSingular: record.topicsCountSingular,
    topicsCountPlural: record.topicsCountPlural,
    storiesTitle: record.storiesTitle,
    storiesDescription: record.storiesDescription,
    storiesEmpty: record.storiesEmpty,
    storiesCountLabel: record.storiesCountLabel,
    storiesCountSingular: record.storiesCountSingular,
    storiesCountPlural: record.storiesCountPlural,
    storiesReadMore: record.storiesReadMore,
    storiesUncategorized: record.storiesUncategorized,
    footerNote: record.footerNote,
    footerSignature: record.footerSignature,
  };
}
