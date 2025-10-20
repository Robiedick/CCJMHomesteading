import type { HomepageContent } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getDictionary, locales, type Locale } from "@/lib/i18n";

export type HomepageContentData = {
  siteName: string;
  siteAdminTitle: string;
  siteAdminSubtitle: string;
  siteBackToHomeLabel: string;
  siteLogoUrl: string;
  heroImageUrl: string;
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
  articleBackLabel: string;
  articleUpdatedLabel: string;
  articlePublishedLabel: string;
  categoryHeaderLabel: string;
  categoryEmptyLabel: string;
  loginUsernameLabel: string;
  loginUsernamePlaceholder: string;
  loginPasswordLabel: string;
  loginPasswordPlaceholder: string;
  loginSignInButtonLabel: string;
  loginSigningInLabel: string;
  loginSessionExpiredMessage: string;
  loginInvalidCredentialsMessage: string;
  loginSuccessMessage: string;
  loginLoadingMessage: string;
  searchTitle: string;
  searchPlaceholder: string;
  searchNoResults: string;
  searchArticlesHeading: string;
  searchCategoriesHeading: string;
  searchFiltersLabel: string;
  searchFilterArticlesLabel: string;
  searchFilterCategoriesLabel: string;
  searchClearLabel: string;
  searchButtonLabel: string;
  searchResultsHeadingTemplate: string;
  searchMinimumCharactersMessage: string;
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
    siteName: dictionary.brand?.siteName ?? "CCJM Homesteading",
    siteAdminTitle: dictionary.brand?.adminTitle ?? "CCJM Homesteading Admin",
    siteAdminSubtitle:
      dictionary.brand?.adminSubtitle ??
      "Sign in to manage articles, categories, and homepage copy.",
    siteBackToHomeLabel: dictionary.brand?.backToHome ?? "Back to homestead",
    siteLogoUrl: dictionary.brand?.logoUrl ?? "/favicon.ico",
    heroImageUrl: dictionary.brand?.heroImageUrl ?? "",
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
    articleBackLabel: dictionary.article.back,
    articleUpdatedLabel: dictionary.article.updated,
    articlePublishedLabel: dictionary.article.published,
    categoryHeaderLabel: dictionary.category.headerLabel,
    categoryEmptyLabel: dictionary.category.empty,
    loginUsernameLabel: dictionary.login?.usernameLabel ?? "Username",
    loginUsernamePlaceholder: dictionary.login?.usernamePlaceholder ?? "Enter your username",
    loginPasswordLabel: dictionary.login?.passwordLabel ?? "Password",
    loginPasswordPlaceholder: dictionary.login?.passwordPlaceholder ?? "Enter your password",
    loginSignInButtonLabel: dictionary.login?.signInButton ?? "Sign in",
    loginSigningInLabel: dictionary.login?.signingIn ?? "Signing in...",
    loginSessionExpiredMessage:
      dictionary.login?.sessionExpired ?? "Your session has expired. Please sign in again.",
    loginInvalidCredentialsMessage:
      dictionary.login?.invalidCredentials ?? "Invalid username or password.",
    loginSuccessMessage:
      dictionary.login?.success ??
      "Account created. You can sign in now.",
    loginLoadingMessage: dictionary.login?.loading ?? "Loading form…",
    searchTitle: dictionary.search?.title ?? "Search",
    searchPlaceholder: dictionary.search?.placeholder ?? "Search stories or topics…",
    searchNoResults:
      dictionary.search?.noResults ??
      "No matches found. Try a different keyword or adjust the filters.",
    searchArticlesHeading: dictionary.search?.articlesHeading ?? "Articles",
    searchCategoriesHeading: dictionary.search?.categoriesHeading ?? "Categories",
    searchFiltersLabel: dictionary.search?.filtersLabel ?? "Filter results",
    searchFilterArticlesLabel: dictionary.search?.filterArticlesLabel ?? "Articles",
    searchFilterCategoriesLabel:
      dictionary.search?.filterCategoriesLabel ?? "Categories",
    searchClearLabel: dictionary.search?.clearLabel ?? "Clear search",
    searchButtonLabel: dictionary.search?.buttonLabel ?? "Search",
    searchResultsHeadingTemplate:
      dictionary.search?.resultsHeadingTemplate ?? 'Results for “{{query}}”',
    searchMinimumCharactersMessage:
      dictionary.search?.minimumCharactersMessage ??
      "Type at least 2 characters to search.",
    footerNote: dictionary.footer.note,
    footerSignature: dictionary.footer.signature,
  };
}

export function mapDataToUpdateInput(data: HomepageContentData): Omit<HomepageContent, "id" | "createdAt" | "updatedAt" | "locale"> {
  return {
    siteName: data.siteName,
    siteAdminTitle: data.siteAdminTitle,
    siteAdminSubtitle: data.siteAdminSubtitle,
    siteBackToHomeLabel: data.siteBackToHomeLabel,
    siteLogoUrl: data.siteLogoUrl,
    heroImageUrl: data.heroImageUrl,
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
    articleBackLabel: data.articleBackLabel,
    articleUpdatedLabel: data.articleUpdatedLabel,
    articlePublishedLabel: data.articlePublishedLabel,
    categoryHeaderLabel: data.categoryHeaderLabel,
    categoryEmptyLabel: data.categoryEmptyLabel,
    loginUsernameLabel: data.loginUsernameLabel,
    loginUsernamePlaceholder: data.loginUsernamePlaceholder,
    loginPasswordLabel: data.loginPasswordLabel,
    loginPasswordPlaceholder: data.loginPasswordPlaceholder,
    loginSignInButtonLabel: data.loginSignInButtonLabel,
    loginSigningInLabel: data.loginSigningInLabel,
    loginSessionExpiredMessage: data.loginSessionExpiredMessage,
    loginInvalidCredentialsMessage: data.loginInvalidCredentialsMessage,
    loginSuccessMessage: data.loginSuccessMessage,
    loginLoadingMessage: data.loginLoadingMessage,
    searchTitle: data.searchTitle,
    searchPlaceholder: data.searchPlaceholder,
    searchNoResults: data.searchNoResults,
    searchArticlesHeading: data.searchArticlesHeading,
    searchCategoriesHeading: data.searchCategoriesHeading,
    searchFiltersLabel: data.searchFiltersLabel,
    searchFilterArticlesLabel: data.searchFilterArticlesLabel,
    searchFilterCategoriesLabel: data.searchFilterCategoriesLabel,
    searchClearLabel: data.searchClearLabel,
    searchButtonLabel: data.searchButtonLabel,
    searchResultsHeadingTemplate: data.searchResultsHeadingTemplate,
    searchMinimumCharactersMessage: data.searchMinimumCharactersMessage,
    footerNote: data.footerNote,
    footerSignature: data.footerSignature,
  };
}

function mapRecordToData(record: HomepageContent): HomepageContentData {
  return {
    siteName: record.siteName,
    siteAdminTitle: record.siteAdminTitle,
    siteAdminSubtitle: record.siteAdminSubtitle,
    siteBackToHomeLabel: record.siteBackToHomeLabel,
    siteLogoUrl: record.siteLogoUrl,
    heroImageUrl: record.heroImageUrl,
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
    articleBackLabel: record.articleBackLabel,
    articleUpdatedLabel: record.articleUpdatedLabel,
    articlePublishedLabel: record.articlePublishedLabel,
    categoryHeaderLabel: record.categoryHeaderLabel,
    categoryEmptyLabel: record.categoryEmptyLabel,
    loginUsernameLabel: record.loginUsernameLabel,
    loginUsernamePlaceholder: record.loginUsernamePlaceholder,
    loginPasswordLabel: record.loginPasswordLabel,
    loginPasswordPlaceholder: record.loginPasswordPlaceholder,
    loginSignInButtonLabel: record.loginSignInButtonLabel,
    loginSigningInLabel: record.loginSigningInLabel,
    loginSessionExpiredMessage: record.loginSessionExpiredMessage,
    loginInvalidCredentialsMessage: record.loginInvalidCredentialsMessage,
    loginSuccessMessage: record.loginSuccessMessage,
    loginLoadingMessage: record.loginLoadingMessage,
    searchTitle: record.searchTitle,
    searchPlaceholder: record.searchPlaceholder,
    searchNoResults: record.searchNoResults,
    searchArticlesHeading: record.searchArticlesHeading,
    searchCategoriesHeading: record.searchCategoriesHeading,
    searchFiltersLabel: record.searchFiltersLabel,
    searchFilterArticlesLabel: record.searchFilterArticlesLabel,
    searchFilterCategoriesLabel: record.searchFilterCategoriesLabel,
    searchClearLabel: record.searchClearLabel,
    searchButtonLabel: record.searchButtonLabel,
    searchResultsHeadingTemplate: record.searchResultsHeadingTemplate,
    searchMinimumCharactersMessage: record.searchMinimumCharactersMessage,
    footerNote: record.footerNote,
    footerSignature: record.footerSignature,
  };
}
