import { UserRole } from "@prisma/client";
import { z } from "zod";
import { slugify } from "./utils";

export const categoryInputSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters"),
  slug: z
    .string()
    .min(2, "Slug must be at least 2 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  description: z.string().optional(),
  color: z
    .string()
    .regex(/^#([0-9a-fA-F]{3}){1,2}$/, "Color must be a valid hex code")
    .optional()
    .or(z.literal(""))
    .transform((val) => (val === "" ? undefined : val)),
});

export const articleInputSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  slug: z
    .string()
    .min(3, "Slug must be at least 3 characters")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Slug can only contain lowercase letters, numbers, and hyphens"),
  excerpt: z.string().max(260, "Excerpt must be 260 characters or less").optional().or(z.literal("")),
  content: z.string().min(20, "Content must be at least 20 characters"),
  published: z.boolean(),
  publishedAt: z
    .union([
      z.literal(""),
      z
        .string()
        .refine(
          (value) => !Number.isNaN(Date.parse(value)),
          "Publish date must be a valid date and time",
        ),
    ])
    .transform((val) => (val ? new Date(val) : undefined)),
  categoryIds: z.array(z.number().int().positive()).max(6, "Select up to 6 categories"),
});

export const userCreateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.nativeEnum(UserRole),
});

export const userUpdateSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  role: z.nativeEnum(UserRole),
  password: z
    .union([z.literal(""), z.string().min(8, "Password must be at least 8 characters")])
    .optional()
    .transform((val) => (val ? val : undefined)),
});

export const invitationCreateSchema = z.object({
  email: z
    .union([z.literal(""), z.string().email("Please provide a valid email address")])
    .optional()
    .transform((value) => (value ? value : undefined)),
  role: z.nativeEnum(UserRole),
  expiresAt: z
    .union([
      z.literal(""),
      z
        .string()
        .refine(
          (value) => !Number.isNaN(Date.parse(value)),
          "Expiration must be a valid date and time",
        ),
    ])
    .optional()
    .transform((value) => (value ? new Date(value) : undefined)),
});

export const invitationRedeemSchema = z.object({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

const homepageStringField = z.string().optional().default("");
const homepageUrlField = z
  .union([z.literal(""), z.string().url("Please provide a valid URL")])
  .optional()
  .default("");

export const homepageContentSchema = z.object({
  siteName: homepageStringField,
  siteAdminTitle: homepageStringField,
  siteAdminSubtitle: homepageStringField,
  siteBackToHomeLabel: homepageStringField,
  siteLogoUrl: homepageUrlField,
  heroImageUrl: homepageUrlField,
  navTagline: homepageStringField,
  navLatestStoriesLabel: homepageStringField,
  navSignInLabel: homepageStringField,
  switcherLabel: homepageStringField,
  switcherEnglishLabel: homepageStringField,
  switcherDutchLabel: homepageStringField,
  heroTitle: homepageStringField,
  heroDescription: homepageStringField,
  heroCtaPrimaryLabel: homepageStringField,
  heroCtaSecondaryLabel: homepageStringField,
  heroEditorTitle: homepageStringField,
  heroEditorDescription: homepageStringField,
  heroEditorLinkLabel: homepageStringField,
  topicsTitle: homepageStringField,
  topicsDescription: homepageStringField,
  topicsEmpty: homepageStringField,
  topicsCountSingular: homepageStringField,
  topicsCountPlural: homepageStringField,
  storiesTitle: homepageStringField,
  storiesDescription: homepageStringField,
  storiesEmpty: homepageStringField,
  storiesCountLabel: homepageStringField,
  storiesCountSingular: homepageStringField,
  storiesCountPlural: homepageStringField,
  storiesReadMore: homepageStringField,
  storiesUncategorized: homepageStringField,
  articleBackLabel: homepageStringField,
  articleUpdatedLabel: homepageStringField,
  articlePublishedLabel: homepageStringField,
  categoryHeaderLabel: homepageStringField,
  categoryEmptyLabel: homepageStringField,
  loginUsernameLabel: homepageStringField,
  loginUsernamePlaceholder: homepageStringField,
  loginPasswordLabel: homepageStringField,
  loginPasswordPlaceholder: homepageStringField,
  loginSignInButtonLabel: homepageStringField,
  loginSigningInLabel: homepageStringField,
  loginSessionExpiredMessage: homepageStringField,
  loginInvalidCredentialsMessage: homepageStringField,
  loginSuccessMessage: homepageStringField,
  loginLoadingMessage: homepageStringField,
  searchTitle: homepageStringField,
  searchPlaceholder: homepageStringField,
  searchNoResults: homepageStringField,
  searchArticlesHeading: homepageStringField,
  searchCategoriesHeading: homepageStringField,
  searchFiltersLabel: homepageStringField,
  searchFilterArticlesLabel: homepageStringField,
  searchFilterCategoriesLabel: homepageStringField,
  searchClearLabel: homepageStringField,
  searchButtonLabel: homepageStringField,
  searchResultsHeadingTemplate: homepageStringField,
  searchMinimumCharactersMessage: homepageStringField,
  footerNote: homepageStringField,
  footerSignature: homepageStringField,
});

export function extractCategoryInput(formData: FormData) {
  const name = formData.get("name")?.toString().trim() ?? "";
  const slugInput = formData.get("slug")?.toString().trim();
  const slug = slugify(slugInput && slugInput.length > 0 ? slugInput : name);

  return categoryInputSchema.parse({
    name,
    slug,
    description: formData.get("description")?.toString().trim() || undefined,
    color: formData.get("color")?.toString().trim(),
  });
}

export function extractArticleInput(formData: FormData) {
  const published = formData.get("published") === "on" || formData.get("published") === "true";

  const publishedAtRaw = formData.get("publishedAt")?.toString().trim();

  const categoryIds = formData
    .getAll("categoryIds")
    .map((value) => Number.parseInt(value.toString(), 10))
    .filter((value) => Number.isFinite(value));

  const title = formData.get("title")?.toString().trim() ?? "";
  const slugInput = formData.get("slug")?.toString().trim();
  const slug = slugify(slugInput && slugInput.length > 0 ? slugInput : title);

  return articleInputSchema.parse({
    title,
    slug,
    excerpt: formData.get("excerpt")?.toString().trim(),
    content: formData.get("content")?.toString().trim() ?? "",
    published,
    publishedAt: publishedAtRaw && published ? publishedAtRaw : undefined,
    categoryIds,
  });
}
