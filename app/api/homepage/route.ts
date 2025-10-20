import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdminSession } from "@/lib/auth";
import { homepageContentSchema } from "@/lib/validators";
import {
  getHomepageContentState,
  isSupportedLocale,
  mapDataToUpdateInput,
} from "@/lib/homepage";
import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n";

function resolveLocale(searchParams: URLSearchParams): Locale {
  const value = searchParams.get("locale");
  if (value && isSupportedLocale(value)) {
    return value;
  }
  return DEFAULT_LOCALE;
}

export async function GET(request: Request) {
  await requireAdminSession();

  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams);
  const includeDefaults = url.searchParams.get("includeDefaults") === "true";

  const state = await getHomepageContentState(locale);

  return NextResponse.json({
    locale,
    data: state.data,
    source: state.source,
    defaults: includeDefaults ? state.defaults : undefined,
  });
}

export async function PUT(request: Request) {
  await requireAdminSession();

  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams);

  try {
    const body = await request.json();
    const parsed = homepageContentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ errors: parsed.error.flatten() }, { status: 400 });
    }

    const data = mapDataToUpdateInput(parsed.data);
    const record = await prisma.homepageContent.upsert({
      where: { locale },
      create: {
        locale,
        ...data,
      },
      update: data,
    });

    return NextResponse.json({
      locale,
      data: parsed.data,
      source: "database" as const,
    });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update homepage content." },
      { status: 500 },
    );
  }
}

export async function DELETE(request: Request) {
  await requireAdminSession();

  const url = new URL(request.url);
  const locale = resolveLocale(url.searchParams);

  await prisma.homepageContent.delete({ where: { locale } }).catch(() => undefined);

  return NextResponse.json({ success: true, locale });
}
