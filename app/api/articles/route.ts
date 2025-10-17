import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { articleInputSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const articles = await prisma.article.findMany({
    orderBy: { createdAt: "desc" },
    include: { categories: true },
  });

  return NextResponse.json(articles);
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const body = await request.json();
    const parsed = articleInputSchema.safeParse({
      ...body,
      slug: slugify(body.slug || body.title || ""),
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
