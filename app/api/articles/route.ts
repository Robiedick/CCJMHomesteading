import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { articleInputSchema } from "@/lib/validators";
import { generateExcerpt, slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { categories: true },
  });

  return NextResponse.json(articles);
}

async function createUniqueSlug(rawTitle: unknown) {
  const base = slugify(typeof rawTitle === "string" ? rawTitle : "") || "article";
  let candidate = base;
  let attempts = 0;

  while (attempts < 6) {
    const existing = await prisma.article.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });

    if (!existing) {
      return candidate;
    }

    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    candidate = slugify(`${base}-${randomSuffix}`);
    attempts += 1;
  }

  return slugify(`${base}-${Date.now()}`);
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const body = await request.json();
    const slug = await createUniqueSlug(body.title);
    const excerpt = generateExcerpt(typeof body.content === "string" ? body.content : "");
    const parsed = articleInputSchema.safeParse({
      ...body,
      slug,
      excerpt,
      categoryIds: Array.isArray(body.categoryIds)
        ? body.categoryIds.map((id: unknown) => Number(id))
        : [],
    });

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { categoryIds, published, publishedAt, ...rest } = parsed.data;

    const article = await prisma.article.create({
      data: {
        ...rest,
        published,
        publishedAt: published ? publishedAt ?? new Date() : null,
        categories: {
          connect: categoryIds.map((id) => ({ id })),
        },
      },
      include: { categories: true },
    });

    revalidatePath("/");
    revalidatePath("/admin/articles");
    revalidatePath(`/articles/${article.slug}`);
    article.categories.forEach((category) => {
      revalidatePath(`/categories/${category.slug}`);
    });

    return NextResponse.json(article, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "An article with that slug already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Unable to create article." },
      { status: 500 },
    );
  }
}
