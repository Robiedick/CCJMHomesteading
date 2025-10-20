import { Prisma } from "@prisma/client";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await requireAdminSession();

  const { id } = await context.params;
  const presetId = Number.parseInt(id, 10);
  if (!Number.isFinite(presetId)) {
    return NextResponse.json({ message: "Invalid preset id." }, { status: 400 });
  }

  try {
    await prisma.homepagePreset.delete({
      where: { id: presetId },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return NextResponse.json({ message: "Preset not found." }, { status: 404 });
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to delete preset." },
      { status: 500 },
    );
  }
}
