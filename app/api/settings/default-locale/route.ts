import { NextResponse } from "next/server";
import { requireAdminSession } from "@/lib/auth";
import { getDefaultLocale, setDefaultLocale } from "@/lib/settings";
import { isSupportedLocale } from "@/lib/i18n";

export async function GET() {
  const locale = await getDefaultLocale();
  return NextResponse.json({ locale });
}

export async function PUT(request: Request) {
  await requireAdminSession();

  try {
    const body = (await request.json()) as { locale?: string };
    const locale = body.locale;

    if (!locale || !isSupportedLocale(locale)) {
      return NextResponse.json({ message: "Unsupported locale." }, { status: 400 });
    }

    const updated = await setDefaultLocale(locale);
    return NextResponse.json({ locale: updated });
  } catch (error) {
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Unable to update default locale." },
      { status: 500 },
    );
  }
}
