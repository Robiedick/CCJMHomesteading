import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SEARCH_LIMIT_DEFAULT = 10;
const MIN_QUERY_LENGTH = 2;

const articleVector = Prisma.sql`
  (
    setweight(to_tsvector('simple', coalesce("title", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("excerpt", '')), 'B') ||
    setweight(to_tsvector('simple', coalesce("content", '')), 'C')
  )
`;

const categoryVector = Prisma.sql`
  (
    setweight(to_tsvector('simple', coalesce("name", '')), 'A') ||
    setweight(to_tsvector('simple', coalesce("description", '')), 'B')
  )
`;

export type PublicSearchResultArticle = {
  id: number;
  title: string;
  slug: string;
  snippet: string | null;
  publishedAt: Date | null;
  rank: number;
};

export type PublicSearchResultCategory = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  rank: number;
};

export type PublicSearchResults = {
  articles: PublicSearchResultArticle[];
  categories: PublicSearchResultCategory[];
};

export async function searchPublicContent(
  query: string,
  options: {
    includeArticles: boolean;
    includeCategories: boolean;
    limit?: number;
  },
): Promise<PublicSearchResults> {
  if (query.trim().length < MIN_QUERY_LENGTH) {
    return { articles: [], categories: [] };
  }

  const tsQuery = Prisma.sql`plainto_tsquery('simple', ${query})`;
  const limit = options.limit ?? SEARCH_LIMIT_DEFAULT;

  const articlesPromise = options.includeArticles
    ? prisma.$queryRaw<PublicSearchResultArticle[]>(Prisma.sql`
        SELECT
          "id",
          "title",
          COALESCE(NULLIF(trim("excerpt"), ''), substring("content", 1, 200)) AS "snippet",
          "slug",
          "publishedAt",
          ts_rank_cd(${articleVector}, ${tsQuery}) AS "rank"
        FROM "Article"
        WHERE "published" = true
          AND ${articleVector} @@ ${tsQuery}
        ORDER BY "rank" DESC, "publishedAt" DESC NULLS LAST
        LIMIT ${limit}
      `)
    : Promise.resolve([]);

  const categoriesPromise = options.includeCategories
    ? prisma.$queryRaw<PublicSearchResultCategory[]>(Prisma.sql`
        SELECT
          "id",
          "name",
          "slug",
          "description",
          ts_rank_cd(${categoryVector}, ${tsQuery}) AS "rank"
        FROM "Category"
        WHERE ${categoryVector} @@ ${tsQuery}
        ORDER BY "rank" DESC, "name" ASC
        LIMIT ${limit}
      `)
    : Promise.resolve([]);

  const [articlesRaw, categoriesRaw] = await Promise.all([articlesPromise, categoriesPromise]);

  const articles = articlesRaw.map((article) => ({
    ...article,
    snippet: article.snippet
      ? article.snippet.replace(/\s+/g, " ").trim()
      : null,
  }));

  const categories = categoriesRaw.map((category) => ({
    ...category,
    description: category.description
      ? category.description.replace(/\s+/g, " ").trim()
      : null,
  }));

  return {
    articles,
    categories,
  };
}

type AdminArticleSearchResult = {
  id: number;
  title: string;
  slug: string;
  published: boolean;
  rank: number;
};

type AdminCategorySearchResult = {
  id: number;
  name: string;
  slug: string;
  rank: number;
};

type AdminUserSearchResult = {
  id: number;
  username: string;
  role: string;
};

type AdminInvitationSearchResult = {
  id: number;
  email: string | null;
  token: string;
  expiresAt: Date | null;
  usedAt: Date | null;
};

export type AdminSearchResults = {
  articles: AdminArticleSearchResult[];
  categories: AdminCategorySearchResult[];
  users: AdminUserSearchResult[];
  invitations: AdminInvitationSearchResult[];
};

export async function searchAdminEntities(query: string): Promise<AdminSearchResults> {
  if (query.trim().length < MIN_QUERY_LENGTH) {
    return { articles: [], categories: [], users: [], invitations: [] };
  }

  const tsQuery = Prisma.sql`plainto_tsquery('simple', ${query})`;
  const likeQuery = `%${query}%`;

  const [articles, categories, users, invitations] = await Promise.all([
    prisma.$queryRaw<AdminArticleSearchResult[]>(Prisma.sql`
      SELECT
        "id",
        "title",
        "slug",
        "published",
        ts_rank_cd(${articleVector}, ${tsQuery}) AS "rank"
      FROM "Article"
      WHERE ${articleVector} @@ ${tsQuery}
      ORDER BY "rank" DESC, "updatedAt" DESC
      LIMIT 25
    `),
    prisma.$queryRaw<AdminCategorySearchResult[]>(Prisma.sql`
      SELECT
        "id",
        "name",
        "slug",
        ts_rank_cd(${categoryVector}, ${tsQuery}) AS "rank"
      FROM "Category"
      WHERE ${categoryVector} @@ ${tsQuery}
      ORDER BY "rank" DESC, "name" ASC
      LIMIT 25
    `),
    prisma.$queryRaw<AdminUserSearchResult[]>(Prisma.sql`
      SELECT
        "id",
        "username",
        "role"
      FROM "User"
      WHERE "username" ILIKE ${likeQuery}
         OR coalesce("usernameNormalized", '') ILIKE ${likeQuery}
      ORDER BY "username" ASC
      LIMIT 25
    `),
    prisma.$queryRaw<AdminInvitationSearchResult[]>(Prisma.sql`
      SELECT
        "id",
        "email",
        "token",
        "expiresAt",
        "usedAt"
      FROM "Invitation"
      WHERE coalesce("email", '') ILIKE ${likeQuery}
         OR "token" ILIKE ${likeQuery}
      ORDER BY "createdAt" DESC
      LIMIT 25
    `),
  ]);

  return {
    articles,
    categories,
    users,
    invitations,
  };
}

export const minimumSearchCharacters = MIN_QUERY_LENGTH;
