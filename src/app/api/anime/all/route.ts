const ANIME_THEMES_ANIME_URL = "https://api.animethemes.moe/anime";
const API_USER_AGENT = "AnimeRater/0.1";
const PAGE_SIZE = 100;
const MAX_PAGES = 100;
const MAX_RATE_LIMIT_RETRIES = 3;
const CACHE_SECONDS = 86_400;
const INCLUDE = "animesynonyms,animethemes.animethemeentries.videos,animethemes.song";

type AnimeThemeVideo = {
  id: number;
  basename?: string;
  filename?: string;
  link?: string;
  [key: string]: unknown;
};

type AnimeTheme = {
  slug?: string;
  type?: "OP" | "ED";
  song?: { title?: string | null } | null;
  animethemeentries?: Array<{ videos?: AnimeThemeVideo[] }>;
};

type Anime = {
  id: number;
  name: string;
  year?: number | null;
  animesynonyms?: Array<{ text?: string }>;
  animethemes?: AnimeTheme[];
};

type AnimeThemesPage = {
  anime?: Anime[];
  links?: { next?: string | null };
};

export const maxDuration = 300;

function wait(milliseconds: number) {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function retryDelay(response: Response) {
  const retryAfter = response.headers.get("retry-after");
  if (!retryAfter) return 60_000;
  const seconds = Number(retryAfter);
  if (Number.isFinite(seconds)) return Math.max(seconds * 1_000, 1_000);
  const retryAt = Date.parse(retryAfter);
  return Number.isNaN(retryAt) ? 60_000 : Math.max(retryAt - Date.now(), 1_000);
}

function getNextUrl(next: string | null | undefined) {
  if (!next) return null;
  const url = new URL(next);
  if (url.protocol !== "https:" || url.hostname !== "api.animethemes.moe") {
    throw new Error("AnimeThemes returned an invalid pagination URL.");
  }
  return url;
}

async function fetchPage(url: URL) {
  for (let attempt = 0; attempt <= MAX_RATE_LIMIT_RETRIES; attempt += 1) {
    const response = await fetch(url, {
      headers: { Accept: "application/json", "User-Agent": API_USER_AGENT },
      next: { revalidate: CACHE_SECONDS },
    });
    if (response.status !== 429) {
      if (!response.ok) throw new Error(`AnimeThemes returned ${response.status}.`);
      return (await response.json()) as AnimeThemesPage;
    }
    if (attempt === MAX_RATE_LIMIT_RETRIES) {
      throw new Error("AnimeThemes rate limit retries were exhausted.");
    }
    await wait(retryDelay(response));
  }
  throw new Error("AnimeThemes page could not be loaded.");
}

function themeNumber(slug: string | undefined) {
  const match = slug?.match(/(?:OP|ED)(\d+)/i);
  return match ? Number(match[1]) : null;
}

export async function GET() {
  const firstUrl = new URL(ANIME_THEMES_ANIME_URL);
  firstUrl.searchParams.set("page[number]", "1");
  firstUrl.searchParams.set("page[size]", String(PAGE_SIZE));
  firstUrl.searchParams.set("include", INCLUDE);

  const videos = new Map<number, Record<string, unknown>>();
  let nextUrl: URL | null = firstUrl;
  let pages = 0;

  try {
    while (nextUrl && pages < MAX_PAGES) {
      const page = await fetchPage(nextUrl);
      for (const anime of page.anime ?? []) {
        for (const theme of anime.animethemes ?? []) {
          for (const entry of theme.animethemeentries ?? []) {
            for (const video of entry.videos ?? []) {
              videos.set(video.id, {
                ...video,
                filename: video.basename ?? video.filename ?? `video-${video.id}.webm`,
                link: video.link ?? "",
                animeId: anime.id,
                animeName: anime.name,
                animeSynonyms: (anime.animesynonyms ?? []).flatMap((synonym) => synonym.text ? [synonym.text] : []),
                songTitle: theme.song?.title ?? null,
                year: anime.year ?? null,
                releasePeriod: anime.year ? String(anime.year) : null,
                themeType: theme.type ?? null,
                themeNumber: themeNumber(theme.slug),
              });
            }
          }
        }
      }
      nextUrl = getNextUrl(page.links?.next);
      pages += 1;
    }

    if (nextUrl) throw new Error(`AnimeThemes pagination exceeded ${MAX_PAGES} pages.`);
    return Response.json(
      { videos: Array.from(videos.values()), meta: { count: videos.size, pages } },
      { headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=604800` } },
    );
  } catch (error) {
    console.error("Failed to aggregate AnimeThemes anime catalog", error);
    return Response.json(
      { error: "The complete AnimeThemes anime catalog could not be loaded." },
      { status: 502 },
    );
  }
}
