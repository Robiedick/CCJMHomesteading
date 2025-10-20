-- Enable extensions and add search infrastructure
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Extend HomepageContent with search-related copy
ALTER TABLE "HomepageContent"
  ADD COLUMN "searchTitle" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchPlaceholder" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchNoResults" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchArticlesHeading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchCategoriesHeading" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchFiltersLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchFilterArticlesLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchFilterCategoriesLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchClearLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchButtonLabel" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchResultsHeadingTemplate" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "searchMinimumCharactersMessage" TEXT NOT NULL DEFAULT '';

-- Seed defaults for English locale
UPDATE "HomepageContent"
SET
  "searchTitle" = 'Search',
  "searchPlaceholder" = 'Search stories or topics…',
  "searchNoResults" = 'No matches found. Try a different keyword or adjust the filters.',
  "searchArticlesHeading" = 'Articles',
  "searchCategoriesHeading" = 'Categories',
  "searchFiltersLabel" = 'Filter results',
  "searchFilterArticlesLabel" = 'Articles',
  "searchFilterCategoriesLabel" = 'Categories',
  "searchClearLabel" = 'Clear search',
  "searchButtonLabel" = 'Search',
  "searchResultsHeadingTemplate" = 'Results for “{{query}}”',
  "searchMinimumCharactersMessage" = 'Type at least 2 characters to search.'
WHERE "locale" = 'en';

-- Seed defaults for Dutch locale
UPDATE "HomepageContent"
SET
  "searchTitle" = 'Zoeken',
  "searchPlaceholder" = 'Zoek verhalen of onderwerpen…',
  "searchNoResults" = 'Geen resultaten gevonden. Probeer een andere zoekterm of pas de filters aan.',
  "searchArticlesHeading" = 'Artikelen',
  "searchCategoriesHeading" = 'Categorieën',
  "searchFiltersLabel" = 'Filter resultaten',
  "searchFilterArticlesLabel" = 'Artikelen',
  "searchFilterCategoriesLabel" = 'Categorieën',
  "searchClearLabel" = 'Zoekopdracht wissen',
  "searchButtonLabel" = 'Zoeken',
  "searchResultsHeadingTemplate" = 'Resultaten voor “{{query}}”',
  "searchMinimumCharactersMessage" = 'Typ minimaal 2 tekens om te zoeken.'
WHERE "locale" = 'nl';

-- Create full-text search indexes for articles and categories
CREATE INDEX IF NOT EXISTS "Article_search_idx"
  ON "Article"
  USING GIN (
    (
      setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
      setweight(to_tsvector('simple', coalesce("excerpt", '')), 'B') ||
      setweight(to_tsvector('simple', coalesce("content", '')), 'C')
    )
  );

CREATE INDEX IF NOT EXISTS "Category_search_idx"
  ON "Category"
  USING GIN (
    (
      setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
      setweight(to_tsvector('simple', coalesce("description", '')), 'B')
    )
  );

-- Trigram indexes to support fuzzy admin searches
CREATE INDEX IF NOT EXISTS "User_username_trgm_idx" ON "User" USING GIN ("username" gin_trgm_ops);
CREATE INDEX IF NOT EXISTS "Invitation_email_trgm_idx" ON "Invitation" USING GIN (coalesce("email", '') gin_trgm_ops);
