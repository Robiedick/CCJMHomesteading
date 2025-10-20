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

export const homepageContentSchema = z.object({
  siteName: z.string().min(1),
  siteAdminTitle: z.string().min(1),
  siteAdminSubtitle: z.string().min(1),
  siteBackToHomeLabel: z.string().min(1),
  siteLogoUrl: z
    .union([z.literal(""), z.string().url("Please provide a valid URL")])
    .transform((value) => value ?? ""),
  heroImageUrl: z
    .union([z.literal(""), z.string().url("Please provide a valid URL")])
    .transform((value) => value ?? ""),
  navTagline: z.string().min(1),
  navLatestStoriesLabel: z.string().min(1),
  navSignInLabel: z.string().min(1),
  switcherLabel: z.string().min(1),
  switcherEnglishLabel: z.string().min(1),
  switcherDutchLabel: z.string().min(1),
  heroTitle: z.string().min(1),
  heroDescription: z.string().min(1),
  heroCtaPrimaryLabel: z.string().min(1),
  heroCtaSecondaryLabel: z.string().min(1),
  heroEditorTitle: z.string().min(1),
  heroEditorDescription: z.string().min(1),
  heroEditorLinkLabel: z.string().min(1),
  topicsTitle: z.string().min(1),
  topicsDescription: z.string().min(1),
  topicsEmpty: z.string().min(1),
  topicsCountSingular: z.string().min(1),
  topicsCountPlural: z.string().min(1),
  storiesTitle: z.string().min(1),
  storiesDescription: z.string().min(1),
  storiesEmpty: z.string().min(1),
  storiesCountLabel: z.string().min(1),
  storiesCountSingular: z.string().min(1),
  storiesCountPlural: z.string().min(1),
  storiesReadMore: z.string().min(1),
  storiesUncategorized: z.string().min(1),
  articleBackLabel: z.string().min(1),
  articleUpdatedLabel: z.string().min(1),
  articlePublishedLabel: z.string().min(1),
  categoryHeaderLabel: z.string().min(1),
  categoryEmptyLabel: z.string().min(1),
  loginUsernameLabel: z.string().min(1),
  loginUsernamePlaceholder: z.string().min(1),
  loginPasswordLabel: z.string().min(1),
  loginPasswordPlaceholder: z.string().min(1),
  loginSignInButtonLabel: z.string().min(1),
  loginSigningInLabel: z.string().min(1),
  loginSessionExpiredMessage: z.string().min(1),
  loginInvalidCredentialsMessage: z.string().min(1),
  loginSuccessMessage: z.string().min(1),
  loginLoadingMessage: z.string().min(1),
  searchTitle: z.string().min(1),
  searchPlaceholder: z.string().min(1),
  searchNoResults: z.string().min(1),
  searchArticlesHeading: z.string().min(1),
  searchCategoriesHeading: z.string().min(1),
  searchFiltersLabel: z.string().min(1),
  searchFilterArticlesLabel: z.string().min(1),
  searchFilterCategoriesLabel: z.string().min(1),
  searchClearLabel: z.string().min(1),
  searchButtonLabel: z.string().min(1),
  searchResultsHeadingTemplate: z.string().min(1),
  searchMinimumCharactersMessage: z.string().min(1),
  footerNote: z.string().min(1),
  footerSignature: z.string().min(1),
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
