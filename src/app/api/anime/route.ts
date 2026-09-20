import type { NextRequest } from "next/server";

const ANIME_THEMES_VIDEOS_URL = "https://api.animethemes.moe/video";
const DEFAULT_PAGE = 1;
const DEFAULT_PAGE_SIZE = 100;
const MAX_PAGE_SIZE = 100;
const API_USER_AGENT = "AnimeRater/0.1";

function parsePositiveInteger(value: string | null, fallback: number) {
  if (value === null) {
    return fallback;
  }

  if (!/^\d+$/.test(value)) {
    return null;
  }

  const parsedValue = Number(value);

  return Number.isSafeInteger(parsedValue) && parsedValue > 0
    ? parsedValue
    : null;
}

export async function GET(request: NextRequest) {
  const page = parsePositiveInteger(
    request.nextUrl.searchParams.get("page"),
    DEFAULT_PAGE,
  );
  const pageSize = parsePositiveInteger(
    request.nextUrl.searchParams.get("pageSize"),
    DEFAULT_PAGE_SIZE,
  );

  if (page === null || pageSize === null || pageSize > MAX_PAGE_SIZE) {
    return Response.json(
      {
        error:
          "Invalid pagination. page must be a positive integer and pageSize must be between 1 and 100.",
      },
      { status: 400 },
    );
  }

  const upstreamUrl = new URL(ANIME_THEMES_VIDEOS_URL);
  upstreamUrl.searchParams.set("page[number]", String(page));
  upstreamUrl.searchParams.set("page[size]", String(pageSize));

  try {
    const upstreamResponse = await fetch(upstreamUrl, {
      headers: {
        Accept: "application/json",
        "User-Agent": API_USER_AGENT,
      },
      next: { revalidate: 3600 },
    });

    if (!upstreamResponse.ok) {
      return Response.json(
        { error: "AnimeThemes could not provide the anime videos." },
        { status: 502 },
      );
    }

    const data: unknown = await upstreamResponse.json();

    return Response.json(data);
  } catch {
    return Response.json(
      { error: "The AnimeThemes service is currently unavailable." },
      { status: 502 },
    );
  }
}
