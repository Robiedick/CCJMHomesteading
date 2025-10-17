import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { categoryInputSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

function getCategoryId(params: { id: string }) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    throw new Error("Invalid category id");
  }
  return id;
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } },
) {
  try {
    await requireAdminSession();

    const id = getCategoryId(params);
    const body = await request.json();

    const existing = await prisma.category.findUnique({
      where: { id },
      include: { articles: { select: { slug: true } } },
    });

    if (!existing) {
      return NextResponse.json({ message: "Category not found." }, { status: 404 });
    }

    const parsed = categoryInputSchema.safeParse({
      ...body,
      slug: slugify(body.slug || body.name || ""),
    });

    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const category = await prisma.category.update({
      where: { id },
      data: parsed.data,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath(`/categories/${category.slug}`);
    if (existing.slug !== category.slug) {
      revalidatePath(`/categories/${existing.slug}`);
    }
    const articleSlugs = existing.articles.map((article) => article.slug);
    if (articleSlugs.length > 0) {
      articleSlugs.forEach((slug) => revalidatePath(`/articles/${slug}`));
    }

    return NextResponse.json(category);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      if (error.message === "Invalid category id") {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { message: "A category with that name or slug already exists." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Unable to update category." },
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

    const id = getCategoryId(params);

    const existing = await prisma.category.delete({
      where: { id },
      include: { articles: { select: { slug: true } } },
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath(`/categories/${existing.slug}`);
    const articleSlugs = existing.articles.map((article) => article.slug);
    articleSlugs.forEach((slug) => revalidatePath(`/articles/${slug}`));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "UNAUTHORIZED") {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
      }

      if (error.message === "Invalid category id") {
        return NextResponse.json({ message: error.message }, { status: 400 });
      }
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      return NextResponse.json(
        {
          message:
            "Cannot delete category that is linked to existing articles. Remove the associations first.",
        },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { message: "Unable to delete category." },
      { status: 500 },
    );
  }
}
