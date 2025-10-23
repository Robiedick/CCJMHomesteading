import { NextResponse } from "next/server";
import { searchPublicContent, minimumSearchCharacters } from "@/lib/search";

const MIN_LENGTH = minimumSearchCharacters;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = (searchParams.get("q") ?? "").trim();
  const includeArticles = searchParams.get("articles") !== "0";
  const includeCategories = searchParams.get("categories") !== "0";
  const limitParam = searchParams.get("limit");
  const limit = limitParam ? Number.parseInt(limitParam, 10) : undefined;

  if (query.length < MIN_LENGTH) {
    return NextResponse.json(
      {
        articles: [],
        categories: [],
        minimumCharacters: MIN_LENGTH,
      },
      { status: 200 },
    );
  }

  const results = await searchPublicContent(query, {
    includeArticles,
    includeCategories,
    limit,
  });

  return NextResponse.json(results, { status: 200 });
}
