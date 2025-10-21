import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const SEARCH_LIMIT_DEFAULT = 10;
const MIN_QUERY_LENGTH = 2;

const databaseProvider = process.env.DATABASE_PROVIDER?.toLowerCase();
const databaseUrl = process.env.DATABASE_URL?.toLowerCase();
const isPostgresProvider =
  databaseProvider === "postgresql" || (!!databaseUrl && databaseUrl.startsWith("postgres"));

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

  if (!isPostgresProvider) {
    const limit = options.limit ?? SEARCH_LIMIT_DEFAULT;

    const articles = options.includeArticles
      ? await prisma.article.findMany({
          where: {
            published: true,
            OR: [
              { title: { contains: query, mode: "insensitive" } },
              { excerpt: { contains: query, mode: "insensitive" } },
              { content: { contains: query, mode: "insensitive" } },
            ],
          },
          orderBy: [{ publishedAt: "desc" }, { createdAt: "desc" }],
          take: limit,
        })
      : [];

    const categories = options.includeCategories
      ? await prisma.category.findMany({
          where: {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { description: { contains: query, mode: "insensitive" } },
            ],
          },
          orderBy: [{ name: "asc" }],
          take: limit,
        })
      : [];

    return {
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        snippet:
          article.excerpt && article.excerpt.trim().length > 0
            ? article.excerpt.trim()
            : article.content.slice(0, 200),
        publishedAt: article.publishedAt,
        rank: 0,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
        rank: 0,
      })),
    };
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

  if (!isPostgresProvider) {
    const articles = await prisma.article.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: "insensitive" } },
          { excerpt: { contains: query, mode: "insensitive" } },
          { content: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 25,
    });

    const categories = await prisma.category.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ name: "asc" }],
      take: 25,
    });

    const users = await prisma.user.findMany({
      where: {
        OR: [
          { username: { contains: query, mode: "insensitive" } },
          { usernameNormalized: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ username: "asc" }],
      take: 25,
    });

    const invitations = await prisma.invitation.findMany({
      where: {
        OR: [
          { email: { contains: query, mode: "insensitive" } },
          { token: { contains: query, mode: "insensitive" } },
        ],
      },
      orderBy: [{ createdAt: "desc" }],
      take: 25,
    });

    return {
      articles: articles.map((article) => ({
        id: article.id,
        title: article.title,
        slug: article.slug,
        published: article.published,
        rank: 0,
      })),
      categories: categories.map((category) => ({
        id: category.id,
        name: category.name,
        slug: category.slug,
        rank: 0,
      })),
      users: users.map((user) => ({
        id: user.id,
        username: user.username,
        role: user.role,
      })),
      invitations: invitations.map((invite) => ({
        id: invite.id,
        email: invite.email,
        token: invite.token,
        expiresAt: invite.expiresAt,
        usedAt: invite.usedAt,
      })),
    };
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
