import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { categoryInputSchema } from "@/lib/validators";
import { slugify } from "@/lib/utils";
import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/auth";

export async function GET() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { articles: true } } },
  });

  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const body = await request.json();
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

    const category = await prisma.category.create({
      data: parsed.data,
    });

    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath(`/categories/${category.slug}`);

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
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
      { message: "Unable to create category." },
      { status: 500 },
    );
  }
}
