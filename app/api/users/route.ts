import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { userCreateSchema } from "@/lib/validators";

export async function GET() {
  await requireAdminSession();

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
    },
  });

  return NextResponse.json(users);
}

export async function POST(request: Request) {
  try {
    await requireAdminSession();

    const body = await request.json();
    const parsed = userCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const { username, password, role } = parsed.data;
    const normalizedUsername = username.toLowerCase();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { usernameNormalized: normalizedUsername }],
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "A user with that username already exists." },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        usernameNormalized: normalizedUsername,
        passwordHash,
        role,
      },
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Unable to create user account." },
      { status: 500 },
    );
  }
}
