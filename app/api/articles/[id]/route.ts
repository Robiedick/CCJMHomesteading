import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { articleInputSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

function getArticleId(params: { id: string }) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    throw new Error("Invalid article id");
  }
  return id;
}

export async function GET(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const id = getArticleId(params);
    const article = await prisma.article.findUnique({
      where: { id },
      include: { categories: true },
    });

    if (!article) {
      return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid article id") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    return NextResponse.json({ message: "Unable to load article." }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminSession();

    const id = getArticleId(params);
    const existing = await prisma.article.findUnique({
      where: { id },
      select: {
        slug: true,
        categories: { select: { slug: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ message: "Article not found" }, { status: 404 });
    }

    const body = await request.json();
    const parsed = articleInputSchema.safeParse({
      ...body,
      slug: slugify(body.slug || body.title || ""),
      categoryIds: Array.isArray(body.categoryIds)
        ? body.categoryIds.map((value: unknown) => Number(value))
        : [],
    });

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { categoryIds, published, publishedAt, ...rest } = parsed.data;

    const article = await prisma.article.update({
      where: { id },
      data: {
        ...rest,
        published,
        publishedAt: published ? publishedAt ?? new Date() : null,
        categories: {
          set: categoryIds.map((categoryId) => ({ id: categoryId })),
        },
      },
      include: { categories: true },
    });

    revalidatePath("/");
    revalidatePath("/admin/articles");
    revalidatePath(`/articles/${article.slug}`);

    if (existing.slug !== article.slug) {
      revalidatePath(`/articles/${existing.slug}`);
    }

    const existingCategorySlugs = new Set(
      existing.categories.map((category) => category.slug),
    );

    existing.categories.forEach((category) => {
      revalidatePath(`/categories/${category.slug}`);
    });

    article.categories.forEach((category) => {
      if (!existingCategorySlugs.has(category.slug)) {
        revalidatePath(`/categories/${category.slug}`);
      }
    });

    return NextResponse.json(article);
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Invalid article id") {
      return NextResponse.json({ message: error.message }, { status: 400 });
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
      { message: "Unable to update article." },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminSession();

    const id = getArticleId(params);

    const existing = await prisma.article.delete({
      where: { id },
      select: {
        slug: true,
        categories: { select: { slug: true } },
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/articles");
    revalidatePath(`/articles/${existing.slug}`);
    existing.categories.forEach((category) => {
      revalidatePath(`/categories/${category.slug}`);
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }
    if (error instanceof Error && error.message === "Invalid article id") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { message: "Unable to delete article." },
      { status: 500 },
    );
  }
}
