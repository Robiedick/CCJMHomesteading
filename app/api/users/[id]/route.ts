import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { userUpdateSchema } from "@/lib/validators";

function parseUserId(params: { id: string }) {
  const id = Number.parseInt(params.id, 10);
  if (!Number.isFinite(id)) {
    throw new Error("Invalid user id");
  }
  return id;
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await requireAdminSession();
    const id = parseUserId(params);

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    const body = await request.json();
    const parsed = userUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const { username, role, password } = parsed.data;
    const normalizedUsername = username.toLowerCase();

    const duplicate = await prisma.user.findFirst({
      where: {
        id: { not: id },
        OR: [{ username }, { usernameNormalized: normalizedUsername }],
      },
      select: { id: true },
    });

    if (duplicate) {
      return NextResponse.json(
        { message: "A user with that username already exists." },
        { status: 409 },
      );
    }

    if (existing.role === "admin" && role !== "admin") {
      const remainingAdmins = await prisma.user.count({
        where: {
          role: "admin",
          id: { not: id },
        },
      });
      if (remainingAdmins === 0) {
        return NextResponse.json(
          { message: "Cannot change role. At least one admin is required." },
          { status: 409 },
        );
      }
    }

    const data: Prisma.UserUpdateInput = {
      username,
      usernameNormalized: normalizedUsername,
      role,
    };

    if (password) {
      data.passwordHash = await bcrypt.hash(password, 10);
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        username: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (Number(session.user?.id) === id && role !== session.user.role) {
      // If the current user demoted themselves, refresh auth on the client.
      // We simply return a hint; client can act accordingly if needed.
      return NextResponse.json({ user, roleChanged: true });
    }

    return NextResponse.json({ user });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid user id") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message: "Unable to update user." }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await requireAdminSession();
    const id = parseUserId(params);

    if (Number(session.user?.id) === id) {
      return NextResponse.json(
        { message: "You cannot delete your own account." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ message: "User not found." }, { status: 404 });
    }

    if (existing.role === "admin") {
      const remainingAdmins = await prisma.user.count({
        where: {
          role: "admin",
          id: { not: id },
        },
      });
      if (remainingAdmins === 0) {
        return NextResponse.json(
          { message: "Cannot delete the last admin account." },
          { status: 409 },
        );
      }
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid user id") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json({ message: "Unable to delete user." }, { status: 500 });
  }
}
