import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";

async function parseInvitationId(
  params: { id: string } | Promise<{ id: string }>,
) {
  const resolved = await params;
  const id = Number.parseInt(resolved.id, 10);
  if (!Number.isFinite(id)) {
    throw new Error("Invalid invitation id");
  }
  return id;
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    await requireAdminSession();
    const id = await parseInvitationId(context.params);

    await prisma.invitation.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid invitation id") {
      return NextResponse.json({ message: error.message }, { status: 400 });
    }
    if (error instanceof Error && error.message === "UNAUTHORIZED") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    return NextResponse.json(
      { message: "Unable to delete invitation." },
      { status: 500 },
    );
  }
}
