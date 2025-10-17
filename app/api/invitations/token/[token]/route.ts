import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { invitationRedeemSchema } from "@/lib/validators";

function isExpired(expiresAt: Date | null | undefined) {
  return expiresAt ? expiresAt.getTime() < Date.now() : false;
}

export async function GET(
  _request: Request,
  { params }: { params: { token: string } },
) {
  const invitation = await prisma.invitation.findUnique({
    where: { token: params.token },
    select: {
      id: true,
      token: true,
      email: true,
      role: true,
      createdAt: true,
      expiresAt: true,
      usedAt: true,
    },
  });

  if (!invitation) {
    return NextResponse.json({ message: "Invitation not found." }, { status: 404 });
  }

  if (invitation.usedAt) {
    return NextResponse.json(
      { message: "Invitation already used.", usedAt: invitation.usedAt },
      { status: 410 },
    );
  }

  if (isExpired(invitation.expiresAt)) {
    return NextResponse.json(
      { message: "Invitation expired.", expiresAt: invitation.expiresAt },
      { status: 410 },
    );
  }

  return NextResponse.json(invitation);
}

export async function POST(
  request: Request,
  { params }: { params: { token: string } },
) {
  try {
    const body = await request.json();
    const parsed = invitationRedeemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const { username, password } = parsed.data;
    const normalizedUsername = username.toLowerCase();

    const result = await prisma.$transaction(async (tx) => {
      const invitation = await tx.invitation.findUnique({
        where: { token: params.token },
        select: {
          id: true,
          role: true,
          email: true,
          expiresAt: true,
          usedAt: true,
        },
      });

      if (!invitation) {
        return {
          error: { message: "Invitation not found.", status: 404 },
        } as const;
      }

      if (invitation.usedAt) {
        return {
          error: { message: "Invitation already used.", status: 410 },
        } as const;
      }

      if (isExpired(invitation.expiresAt)) {
        return {
          error: { message: "Invitation expired.", status: 410 },
        } as const;
      }

      const existing = await tx.user.findFirst({
        where: {
          OR: [{ username }, { usernameNormalized: normalizedUsername }],
        },
        select: { id: true },
      });

      if (existing) {
        return {
          error: { message: "A user with that username already exists.", status: 409 },
        } as const;
      }

      const passwordHash = await bcrypt.hash(password, 10);

      const user = await tx.user.create({
        data: {
          username,
          usernameNormalized: normalizedUsername,
          passwordHash,
          role: invitation.role,
        },
        select: {
          id: true,
          username: true,
          role: true,
        },
      });

      await tx.invitation.update({
        where: { id: invitation.id },
        data: {
          usedAt: new Date(),
          consumedById: user.id,
        },
      });

      return { user } as const;
    });

    if ("error" in result) {
      return NextResponse.json({ message: result.error.message }, { status: result.error.status });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to redeem invitation", error);
    return NextResponse.json(
      { message: "Unable to redeem invitation." },
      { status: 500 },
    );
  }
}
