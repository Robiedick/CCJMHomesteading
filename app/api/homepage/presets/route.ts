import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { homepageContentSchema } from "@/lib/validators";
import { isSupportedLocale } from "@/lib/homepage";

const createPresetSchema = z.object({
  locale: z.string(),
  name: z
    .string()
    .transform((value) => value.trim())
    .pipe(z.string().min(1, "Preset name is required").max(120, "Name is too long")),
  data: homepageContentSchema,
});

export async function GET(request: NextRequest) {
  await requireAdminSession();

  const url = new URL(request.url);
  const locale = url.searchParams.get("locale");

  if (!locale || !isSupportedLocale(locale)) {
    return NextResponse.json({ message: "Invalid or missing locale." }, { status: 400 });
  }

  const presets = await prisma.homepagePreset.findMany({
    where: { locale },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({
    presets: presets.map((preset) => ({
      id: preset.id,
      name: preset.name,
      updatedAt: preset.updatedAt.toISOString(),
      data: homepageContentSchema.parse(preset.data),
    })),
  });
}

export async function POST(request: NextRequest) {
  await requireAdminSession();

  try {
    const body = await request.json();
    const parsed = createPresetSchema.parse(body);

    if (!isSupportedLocale(parsed.locale)) {
      return NextResponse.json({ message: "Unsupported locale." }, { status: 400 });
    }

    const preset = await prisma.homepagePreset.upsert({
      where: { locale_name: { locale: parsed.locale, name: parsed.name } },
      create: {
        locale: parsed.locale,
        name: parsed.name,
        data: parsed.data,
      },
      update: {
        data: parsed.data,
      },
    });

    return NextResponse.json({
      preset: {
        id: preset.id,
        name: preset.name,
        updatedAt: preset.updatedAt.toISOString(),
        data: parsed.data,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { message: "Invalid request.", errors: error.flatten() },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to save preset." },
      { status: 500 },
    );
  }
}
