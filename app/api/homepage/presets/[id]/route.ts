import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteContext = {
  params: { id: string };
};

export async function DELETE(_request: Request, { params }: RouteContext) {
  await requireAdminSession();

  const presetId = Number.parseInt(params.id, 10);
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
