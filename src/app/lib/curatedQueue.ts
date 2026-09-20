import { CURATED_THEME_NAMES } from "../data/curatedThemes";
import type { AnimeVideo } from "../providers/AnimeCatalogProvider";

type CuratedTarget = {
  name: string;
  title: string;
  normalizedTitle: string;
  themeType: "OP" | "ED" | null;
  themeNumber: number | null;
  songTitle: string | null;
  special: boolean;
};

const TITLE_ALIASES: Record<string, string[]> = {
  chainsawmanrezearc: ["chainsawmanthemovierezearc", "chainsawmanrezehen"],
  demonslayermugentrain: ["demonslayerkimetsunoyaibamugentrainarc", "kimetsunoyaibamugenresshahen"],
  futurediary: ["thefuturediary", "mirainikki"],
  vigilantebokuheroacademiaillegals: ["myheroacademiavigilantes"],
  vigilantemyheroacademiaillegals: ["myheroacademiavigilantes", "vigilantebokuheroacademiaillegals"],
  yamadakunandthesevenwitches: ["yamadaandthe7witches", "yamadakunto7ninnomajotv"],
};

const SONG_OVERRIDES: Record<string, string> = {
  "Chainsaw Man： Reze Arc Movie SONG": "IRIS OUT",
  "Demon Slayer： Mugen Train Movie SONG": "Homura",
};

const UNAVAILABLE_CURATED_VIDEOS: Record<string, AnimeVideo> = {
  "Kiba OP 1": {
    id: -10_001,
    animeName: "Kiba",
    filename: "Kiba-OP1-Sanctuary.webm",
    link: "",
    year: 2006,
    releasePeriod: "2006",
    themeType: "OP",
    themeNumber: 1,
    songTitle: "Sanctuary",
  },
  "One Piece Film： Red Movie SONG (Backlight)": {
    id: -10_002,
    animeName: "One Piece Film: Red",
    filename: "OnePieceFilmRed-SONG-Backlight.webm",
    link: "",
    year: 2022,
    releasePeriod: "2022",
    themeType: null,
    themeNumber: null,
    songTitle: "Backlight",
  },
  "One Piece Film： Red Movie SONG (Shin Jidai)": {
    id: -10_003,
    animeName: "One Piece Film: Red",
    filename: "OnePieceFilmRed-SONG-ShinJidai.webm",
    link: "",
    year: 2022,
    releasePeriod: "2022",
    themeType: null,
    themeNumber: null,
    songTitle: "Shin Jidai",
  },
  "Powerpuff Girls Z OP 1": {
    id: -10_004,
    animeName: "Powerpuff Girls Z",
    filename: "PowerpuffGirlsZ-OP1-KibouNoKakera.webm",
    link: "",
    year: 2006,
    releasePeriod: "2006",
    themeType: "OP",
    themeNumber: 1,
    songTitle: "Kibou no Kakera",
  },
};

function normalize(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function parseTarget(name: string): CuratedTarget {
  const numberedTheme = name.match(/^(.*?)\s+(OP|ED)\s+(\d+)$/);
  const specialEnding = name.match(/^(.*?)\s+ED\s+\(Special\)$/);
  const movieSong = name.match(/^(.*?)\s+Movie\s+SONG(?:\s+\((.+)\))?$/);
  const title = numberedTheme?.[1] ?? specialEnding?.[1] ?? movieSong?.[1] ?? name;

  return {
    name,
    title,
    normalizedTitle: normalize(title),
    themeType: (numberedTheme?.[2] as "OP" | "ED" | undefined) ?? (specialEnding ? "ED" : null),
    themeNumber: numberedTheme ? Number(numberedTheme[3]) : null,
    songTitle: movieSong?.[2] ?? null,
    special: Boolean(specialEnding),
  };
}

function videoTitles(video: AnimeVideo) {
  return [video.animeName, ...(video.animeSynonyms ?? [])]
    .flatMap((title) => title ? [normalize(title)] : []);
}

function targetTitles(target: CuratedTarget) {
  return [target.normalizedTitle, ...(TITLE_ALIASES[target.normalizedTitle] ?? [])];
}

function hasExactTitle(video: AnimeVideo, target: CuratedTarget) {
  const targets = targetTitles(target);
  return videoTitles(video).some((title) => targets.includes(title));
}

function belongsToFranchise(video: AnimeVideo, target: CuratedTarget) {
  return videoTitles(video).some((title) => targetTitles(target).some((targetTitle) => {
    if (title === targetTitle) return true;
    const shorter = title.length < targetTitle.length ? title : targetTitle;
    const longer = title.length < targetTitle.length ? targetTitle : title;
    return shorter.length >= 6 && longer.startsWith(shorter);
  }));
}

function qualityScore(video: AnimeVideo) {
  const sourcePriority = video.source === "BD" ? 3 : video.source === "DVD" ? 2 : video.source === "WEB" ? 1 : 0;
  const primaryVersion = /v\d+(?:\.[^/.]+)?$/i.test(video.filename) ? 0 : 1;
  const creditless = video.nc === true ? 1 : 0;
  return (video.resolution ?? 0) * 100 + sourcePriority * 10 + primaryVersion * 2 + creditless;
}

function bestVideo(videos: AnimeVideo[]) {
  return [...videos].sort((a, b) => qualityScore(b) - qualityScore(a))[0];
}

function distinctThemes(videos: AnimeVideo[]) {
  const grouped = new Map<string, AnimeVideo[]>();
  for (const video of videos) {
    const key = [video.animeId ?? video.animeName, video.themeType, video.themeNumber, video.songTitle].join("|");
    grouped.set(key, [...(grouped.get(key) ?? []), video]);
  }
  return Array.from(grouped.values())
    .map(bestVideo)
    .filter((video): video is AnimeVideo => Boolean(video))
    .sort((a, b) => {
      const yearDifference = (a.year ?? Number.MAX_SAFE_INTEGER) - (b.year ?? Number.MAX_SAFE_INTEGER);
      if (yearDifference) return yearDifference;
      const animeDifference = (a.animeId ?? Number.MAX_SAFE_INTEGER) - (b.animeId ?? Number.MAX_SAFE_INTEGER);
      if (animeDifference) return animeDifference;
      return (a.themeNumber ?? Number.MAX_SAFE_INTEGER) - (b.themeNumber ?? Number.MAX_SAFE_INTEGER);
    });
}

function findTarget(videos: AnimeVideo[], target: CuratedTarget) {
  const songOverride = SONG_OVERRIDES[target.name];
  if (target.songTitle || songOverride) {
    const wantedSong = normalize(target.songTitle ?? songOverride);
    return bestVideo(videos.filter((video) =>
      belongsToFranchise(video, target)
      && Boolean(video.songTitle)
      && normalize(video.songTitle ?? "").includes(wantedSong),
    ));
  }

  if (target.themeType && target.themeNumber !== null) {
    const wantedType = target.name === "Bakemonogatari ED 4" ? "OP" : target.themeType;
    const exactAnimeAndTheme = videos.filter((video) =>
      hasExactTitle(video, target)
      && video.themeType === wantedType
      && video.themeNumber === target.themeNumber,
    );
    const exactMatch = bestVideo(exactAnimeAndTheme);
    if (exactMatch) return exactMatch;

    const franchiseThemes = distinctThemes(videos.filter((video) =>
      belongsToFranchise(video, target) && video.themeType === wantedType,
    ));
    return franchiseThemes[target.themeNumber - 1];
  }

  const titleMatches = distinctThemes(videos.filter((video) =>
    hasExactTitle(video, target) && (!target.themeType || video.themeType === target.themeType),
  ));
  if (target.special) return titleMatches.at(-1);
  return titleMatches[0];
}

function placeholderVideo(target: CuratedTarget, index: number): AnimeVideo {
  return {
    id: -20_000 - index,
    animeName: target.title,
    filename: `curated-theme-${index + 1}.webm`,
    link: "",
    year: null,
    releasePeriod: null,
    themeType: target.themeType,
    themeNumber: target.themeNumber,
    songTitle: target.songTitle ?? SONG_OVERRIDES[target.name] ?? null,
  };
}

export function matchCuratedThemes(videos: AnimeVideo[]) {
  const claimedVideoIds = new Set<number>();
  const matches: AnimeVideo[] = [];
  const unmatched: string[] = [];

  for (const [index, target] of CURATED_THEME_NAMES.map(parseTarget).entries()) {
    const catalogMatch = findTarget(videos, target);
    const uniqueCatalogMatch = catalogMatch && !claimedVideoIds.has(catalogMatch.id)
      ? catalogMatch
      : null;
    const match = uniqueCatalogMatch
      ?? UNAVAILABLE_CURATED_VIDEOS[target.name]
      ?? placeholderVideo(target, index);

    if (uniqueCatalogMatch) {
      claimedVideoIds.add(match.id);
    } else {
      unmatched.push(target.name);
    }
    matches.push({
      ...match,
      sourceVideoId: match.id > 0 ? match.id : undefined,
      id: -20_000 - index,
    });
  }

  return { matches, unmatched, total: CURATED_THEME_NAMES.length };
}
