"use client";

import { useState, type ChangeEvent } from "react";
import type { Locale } from "@/lib/i18n";

type HomepageContentData = {
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

type LocaleState = {
  locale: Locale;
  data: HomepageContentData;
  defaults: HomepageContentData;
  source: "database" | "default";
};

type FieldDefinition = {
  key: keyof HomepageContentData;
  label: string;
  description?: string;
  textarea?: boolean;
  rows?: number;
};

const GROUPS: { title: string; fields: FieldDefinition[] }[] = [
  {
    title: "Branding",
    fields: [
      { key: "siteName", label: "Site name" },
      { key: "siteBackToHomeLabel", label: "Back-to-home link label" },
      {
        key: "siteAdminTitle",
        label: "Admin login title",
        description: "Heading shown on the admin sign-in page.",
      },
      {
        key: "siteAdminSubtitle",
        label: "Admin login subtitle",
        description: "Short paragraph under the admin sign-in heading.",
        textarea: true,
        rows: 3,
      },
      {
        key: "siteLogoUrl",
        label: "Site logo image URL",
        description: "Shown on the login page (defaults to /favicon.ico). Leave blank to hide.",
      },
      {
        key: "heroImageUrl",
        label: "Homepage hero image URL",
        description: "Optional image displayed beside the hero content.",
      },
    ],
  },
  {
    title: "Navigation",
    fields: [
      { key: "navTagline", label: "Tagline" },
      { key: "navLatestStoriesLabel", label: "Latest stories link label" },
      { key: "navSignInLabel", label: "Sign in button label" },
      { key: "switcherLabel", label: "Language switcher label" },
      { key: "switcherEnglishLabel", label: "Language option – English" },
      { key: "switcherDutchLabel", label: "Language option – Dutch" },
    ],
  },
  {
    title: "Hero",
    fields: [
      { key: "heroTitle", label: "Headline" },
      { key: "heroDescription", label: "Supporting paragraph", textarea: true, rows: 4 },
      { key: "heroCtaPrimaryLabel", label: "Primary CTA label" },
      { key: "heroCtaSecondaryLabel", label: "Secondary CTA label" },
      { key: "heroEditorTitle", label: "Editor card title" },
      { key: "heroEditorDescription", label: "Editor card description", textarea: true, rows: 4 },
      { key: "heroEditorLinkLabel", label: "Editor link label" },
    ],
  },
  {
    title: "Topics section",
    fields: [
      { key: "topicsTitle", label: "Section title" },
      { key: "topicsDescription", label: "Description", textarea: true, rows: 4 },
      { key: "topicsEmpty", label: "Empty state text", textarea: true, rows: 3 },
      { key: "topicsCountSingular", label: "Singular label (e.g. “story”)" },
      { key: "topicsCountPlural", label: "Plural label (e.g. “stories”)" },
    ],
  },
  {
    title: "Stories section",
    fields: [
      { key: "storiesTitle", label: "Section title" },
      { key: "storiesDescription", label: "Description", textarea: true, rows: 4 },
      { key: "storiesEmpty", label: "Empty state text", textarea: true, rows: 3 },
      { key: "storiesCountLabel", label: "Count connector (e.g. “published”)" },
      { key: "storiesCountSingular", label: "Singular label (e.g. “story”)" },
      { key: "storiesCountPlural", label: "Plural label (e.g. “stories”)" },
      { key: "storiesReadMore", label: "Read more link label" },
      { key: "storiesUncategorized", label: "Fallback category label" },
    ],
  },
  {
    title: "Article page",
    fields: [
      { key: "articleBackLabel", label: "Back link label" },
      { key: "articleUpdatedLabel", label: "“Updated” label" },
      { key: "articlePublishedLabel", label: "“Published” label" },
    ],
  },
  {
    title: "Category page",
    fields: [
      { key: "categoryHeaderLabel", label: "Category header label" },
      { key: "categoryEmptyLabel", label: "Empty state text", textarea: true, rows: 3 },
    ],
  },
  {
    title: "Login page",
    fields: [
      { key: "loginUsernameLabel", label: "Username label" },
      { key: "loginUsernamePlaceholder", label: "Username placeholder" },
      { key: "loginPasswordLabel", label: "Password label" },
      { key: "loginPasswordPlaceholder", label: "Password placeholder" },
      { key: "loginSignInButtonLabel", label: "Sign-in button label" },
      { key: "loginSigningInLabel", label: "Signing-in state label" },
      {
        key: "loginSessionExpiredMessage",
        label: "Session expired message",
        textarea: true,
        rows: 3,
      },
      {
        key: "loginInvalidCredentialsMessage",
        label: "Invalid credentials message",
        textarea: true,
        rows: 3,
      },
      {
        key: "loginSuccessMessage",
        label: "Account created message",
        textarea: true,
        rows: 3,
      },
      {
        key: "loginLoadingMessage",
        label: "Login form loading message",
        textarea: true,
        rows: 2,
      },
    ],
  },
  {
    title: "Search",
    fields: [
      { key: "searchTitle", label: "Search section title" },
      { key: "searchPlaceholder", label: "Search input placeholder" },
      {
        key: "searchNoResults",
        label: "No results message",
        textarea: true,
        rows: 3,
      },
      { key: "searchArticlesHeading", label: "Articles heading" },
      { key: "searchCategoriesHeading", label: "Categories heading" },
      { key: "searchFiltersLabel", label: "Filters label" },
      { key: "searchFilterArticlesLabel", label: "Articles filter label" },
      { key: "searchFilterCategoriesLabel", label: "Categories filter label" },
      { key: "searchClearLabel", label: "Clear search label" },
      { key: "searchButtonLabel", label: "Search button label" },
      {
        key: "searchResultsHeadingTemplate",
        label: "Results heading template",
        description: "Use {{query}} as a placeholder for the search term.",
      },
      {
        key: "searchMinimumCharactersMessage",
        label: "Minimum characters helper",
        textarea: true,
        rows: 2,
      },
    ],
  },
  {
    title: "Footer",
    fields: [
      {
        key: "footerNote",
        label: "Footer note",
        textarea: true,
        rows: 3,
        description: "Use {{year}} as a placeholder; it will be replaced with the current year.",
      },
      { key: "footerSignature", label: "Footer signature", textarea: true, rows: 3 },
    ],
  },
];

type HomepageManagerProps = {
  locales: LocaleState[];
};

export default function HomepageManager({ locales }: HomepageManagerProps) {
  const initialForms = Object.fromEntries(
    locales.map(({ locale, data }) => [locale, { ...data }]),
  ) as Record<Locale, HomepageContentData>;
  const defaults = Object.fromEntries(
    locales.map(({ locale, defaults }) => [locale, { ...defaults }]),
  ) as Record<Locale, HomepageContentData>;

  const sources = Object.fromEntries(
    locales.map(({ locale, source }) => [locale, source]),
  ) as Record<Locale, LocaleState["source"]>;

  const [activeLocale, setActiveLocale] = useState<Locale>(locales[0]?.locale ?? "en");
  const [forms, setForms] = useState(initialForms);
  const [status, setStatus] = useState<Record<Locale, { saving: boolean; message: string | null; error: string | null }>>(
    () =>
      Object.fromEntries(
        locales.map(({ locale }) => [locale, { saving: false, message: null, error: null }]),
      ) as Record<Locale, { saving: boolean; message: string | null; error: string | null }>,
  );

  function updateField(locale: Locale, key: keyof HomepageContentData, value: string) {
    setForms((prev) => ({
      ...prev,
      [locale]: {
        ...prev[locale],
        [key]: value,
      },
    }));
  }

  async function saveLocale(locale: Locale) {
    setStatus((prev) => ({
      ...prev,
      [locale]: { saving: true, message: null, error: null },
    }));

    try {
      const response = await fetch(`/api/homepage?locale=${locale}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forms[locale]),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const firstFieldError = payload?.errors
          ? Object.values(payload.errors.fieldErrors ?? {})
              .flat()
              .at(0)
          : null;
        throw new Error(payload?.message ?? firstFieldError ?? "Unable to save changes.");
      }

      setStatus((prev) => ({
        ...prev,
        [locale]: { saving: false, message: "Saved!", error: null },
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        [locale]: {
          saving: false,
          message: null,
          error: error instanceof Error ? error.message : "Unable to save changes.",
        },
      }));
    }
  }

  async function resetLocale(locale: Locale) {
    setForms((prev) => ({
      ...prev,
      [locale]: { ...defaults[locale] },
    }));
    setStatus((prev) => ({
      ...prev,
      [locale]: { saving: false, message: "Defaults restored (remember to save)", error: null },
    }));
  }

  async function clearLocale(locale: Locale) {
    setStatus((prev) => ({
      ...prev,
      [locale]: { saving: true, message: null, error: null },
    }));

    try {
      await fetch(`/api/homepage?locale=${locale}`, {
        method: "DELETE",
      });
      setForms((prev) => ({
        ...prev,
        [locale]: { ...defaults[locale] },
      }));
      setStatus((prev) => ({
        ...prev,
        [locale]: {
          saving: false,
          message: "Custom copy removed. Defaults restored.",
          error: null,
        },
      }));
    } catch (error) {
      setStatus((prev) => ({
        ...prev,
        [locale]: {
          saving: false,
          message: null,
          error: error instanceof Error ? error.message : "Unable to reset content.",
        },
      }));
    }
  }

  const activeForm = forms[activeLocale];
  const localeStatus = status[activeLocale];
  const source = sources[activeLocale];

  return (
    <div className="space-y-8">
      <header className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-semibold text-stone-900">Homepage copy</h1>
        <p className="mt-2 text-sm text-stone-600">
          Update the words on the public homepage. Each language can have its own phrasing. Any
          unset locale falls back to the defaults shown here.
        </p>
      </header>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {locales.map(({ locale }) => (
              <button
                key={locale}
                type="button"
                onClick={() => setActiveLocale(locale)}
                className={`rounded-lg px-4 py-2 text-sm font-semibold transition ${
                  activeLocale === locale
                    ? "bg-emerald-600 text-white shadow-sm"
                    : "bg-stone-100 text-stone-600 hover:bg-stone-200"
                }`}
              >
                {locale.toUpperCase()}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-stone-500">
            <span>
              Current source:{" "}
              <strong className="text-stone-700">
                {source === "database" ? "Custom copy" : "Defaults"}
              </strong>
            </span>
            <button
              type="button"
              onClick={() => resetLocale(activeLocale)}
              className="rounded-lg border border-stone-300 px-3 py-1.5 font-medium text-stone-600 transition hover:bg-stone-100"
            >
              Load defaults
            </button>
            <button
              type="button"
              onClick={() => clearLocale(activeLocale)}
              className="rounded-lg border border-red-200 px-3 py-1.5 font-medium text-red-600 transition hover:bg-red-50"
            >
              Remove saved copy
            </button>
          </div>
        </div>

        <form
          className="mt-6 space-y-8"
          onSubmit={(event) => {
            event.preventDefault();
            void saveLocale(activeLocale);
          }}
        >
          {GROUPS.map((group) => (
            <fieldset key={group.title} className="space-y-4 rounded-lg border border-stone-200 p-5">
              <legend className="text-sm font-semibold uppercase tracking-wide text-stone-500">
                {group.title}
              </legend>
              <div className="grid gap-4 md:grid-cols-2">
                {group.fields.map((field) => {
                  const value = activeForm[field.key];
                  const id = `${activeLocale}-${field.key}`;
                  const commonProps = {
                    id,
                    name: id,
                    value,
                    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
                      updateField(activeLocale, field.key, event.target.value),
                    className:
                      "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-200",
                  };

                  return (
                    <label key={field.key} className="flex flex-col gap-1 text-sm text-stone-700">
                      <span className="font-medium text-stone-800">{field.label}</span>
                      {field.description && (
                        <span className="text-xs text-stone-500">{field.description}</span>
                      )}
                      {field.textarea ? (
                        <textarea {...commonProps} rows={field.rows ?? 3} />
                      ) : (
                        <input {...commonProps} />
                      )}
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={localeStatus.saving}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {localeStatus.saving ? "Saving…" : "Save changes"}
            </button>
            {localeStatus.message && (
              <p className="text-sm font-medium text-emerald-600">{localeStatus.message}</p>
            )}
            {localeStatus.error && (
              <p className="text-sm font-medium text-red-600">{localeStatus.error}</p>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
