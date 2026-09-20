const ANIME_THEMES_VIDEOS_URL = "https://api.animethemes.moe/video";
const API_USER_AGENT = "AnimeRater/0.1";
const PAGE_SIZE = 100;
const MAX_PAGES = 500;
const MAX_RATE_LIMIT_RETRIES = 3;
const CACHE_SECONDS = 86_400;

type AnimeVideo = {
  id: number;
  [key: string]: unknown;
};

type AnimeThemesPage = {
  videos?: AnimeVideo[];
  links?: {
    next?: string | null;
  };
};

export const maxDuration = 300;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelay(response: Response) {
  const retryAfter = response.headers.get("retry-after");

  if (!retryAfter) {
    return 60_000;
  }

  const seconds = Number(retryAfter);

  if (Number.isFinite(seconds)) {
    return Math.max(seconds * 1_000, 1_000);
  }

  const retryAt = Date.parse(retryAfter);
  return Number.isNaN(retryAt) ? 60_000 : Math.max(retryAt - Date.now(), 1_000);
}

function getNextUrl(next: string | null | undefined) {
  if (!next) {
    return null;
  }

  const url = new URL(next);

  if (url.protocol !== "https:" || url.hostname !== "api.animethemes.moe") {
    throw new Error("AnimeThemes returned an invalid pagination URL.");
  }

  return url;
}

async function fetchPage(url: URL) {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      headers: {
        Accept: "application/json",
        "User-Agent": API_USER_AGENT,
      },
      next: { revalidate: CACHE_SECONDS },
    });

    if (response.status !== 429) {
      if (!response.ok) {
        throw new Error(`AnimeThemes returned ${response.status}.`);
      }

      return (await response.json()) as AnimeThemesPage;
    }

    if (attempt === MAX_RATE_LIMIT_RETRIES) {
      throw new Error("AnimeThemes rate limit retries were exhausted.");
    }

    await wait(retryDelay(response));
  }

  throw new Error("AnimeThemes page could not be loaded.");
}

export async function GET() {
  const firstUrl = new URL(ANIME_THEMES_VIDEOS_URL);
  firstUrl.searchParams.set("page[number]", "1");
  firstUrl.searchParams.set("page[size]", String(PAGE_SIZE));

  const videos = new Map<number, AnimeVideo>();
  let nextUrl: URL | null = firstUrl;
  let pages = 0;

  try {
    while (nextUrl && pages < MAX_PAGES) {
      const page = await fetchPage(nextUrl);

      for (const video of page.videos ?? []) {
        videos.set(video.id, video);
      }

      nextUrl = getNextUrl(page.links?.next);
      pages += 1;
    }

    if (nextUrl) {
      throw new Error(`AnimeThemes pagination exceeded ${MAX_PAGES} pages.`);
    }

    return Response.json(
      {
        videos: Array.from(videos.values()),
        meta: {
          count: videos.size,
          pages,
        },
      },
      {
        headers: {
          "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=604800`,
        },
      },
    );
  } catch (error) {
    console.error("Failed to aggregate AnimeThemes videos", error);

    return Response.json(
      { error: "The complete AnimeThemes video catalog could not be loaded." },
      { status: 502 },
    );
  }
}
