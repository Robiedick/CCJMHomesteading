import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { invitationCreateSchema } from "@/lib/validators";

export async function GET() {
  await requireAdminSession();

  const invitations = await prisma.invitation.findMany({
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invitations);
}

export async function POST(request: Request) {
  try {
    const session = await requireAdminSession();
    const body = await request.json();
    const parsed = invitationCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const { email, role, expiresAt } = parsed.data;
    const token = crypto.randomUUID();

    const invitation = await prisma.invitation.create({
      data: {
        token,
        email,
        role,
        expiresAt,
        createdById: session.user?.id ? Number(session.user.id) : undefined,
      },
    });

    return NextResponse.json(invitation, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Unable to create invitation." },
      { status: 500 },
    );
  }
}
