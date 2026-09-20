"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

export type AnimeVideo = {
  id: number;
  filename: string;
  link: string;
  path?: string;
  resolution?: number;
  nc?: boolean;
  year: number | null;
  releasePeriod?: string | null;
  themeType: "OP" | "ED" | null;
  themeNumber: number | null;
  [key: string]: unknown;
};

type CatalogStatus = "loading" | "refreshing" | "ready" | "error";

type AnimeCatalogContextValue = {
  videos: AnimeVideo[];
  status: CatalogStatus;
  error: string | null;
  isStoredLocally: boolean;
  refresh: () => Promise<void>;
};

type StoredCatalog = {
  videos: AnimeVideo[];
  storedAt: number;
};

const DATABASE_NAME = "anime-rater";
const DATABASE_VERSION = 1;
const STORE_NAME = "catalogs";
const CATALOG_KEY = "anime-videos-v1";
const MAX_CACHE_AGE = 86_400_000;

const AnimeCatalogContext = createContext<AnimeCatalogContextValue | null>(null);
let catalogRequest: Promise<AnimeVideo[]> | null = null;

function normalizeVideo(video: AnimeVideo) {
  const yearSegment = typeof video.path === "string" ? video.path.split("/")[0] : "";
  const themeMatch = video.filename.match(/(?:^|-)(OP|ED)(\d+)/i);
  const parsedYear = /^\d{4}$/.test(yearSegment) ? Number(yearSegment) : null;
  const decadeMatch = yearSegment.match(/^(\d{2})s$/);
  const releasePeriod = parsedYear
    ? String(parsedYear)
    : decadeMatch
      ? `19${decadeMatch[1]}s`
      : null;

  return {
    ...video,
    year: parsedYear,
    releasePeriod,
    themeType: themeMatch ? themeMatch[1].toUpperCase() as "OP" | "ED" : null,
    themeNumber: themeMatch ? Number(themeMatch[2]) : null,
  } satisfies AnimeVideo;
}

function normalizeCatalog(videos: AnimeVideo[]) {
  return videos.map(normalizeVideo);
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function readStoredCatalog() {
  const database = await openDatabase();

  return new Promise<StoredCatalog | null>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readonly");
    const request = transaction.objectStore(STORE_NAME).get(CATALOG_KEY);

    request.onsuccess = () => resolve((request.result as StoredCatalog | undefined) ?? null);
    request.onerror = () => reject(request.error);
    transaction.oncomplete = () => database.close();
  });
}

async function storeCatalog(videos: AnimeVideo[]) {
  const database = await openDatabase();

  return new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, "readwrite");
    transaction.objectStore(STORE_NAME).put(
      { videos, storedAt: Date.now() } satisfies StoredCatalog,
      CATALOG_KEY,
    );

    transaction.oncomplete = () => {
      database.close();
      resolve();
    };
    transaction.onerror = () => {
      database.close();
      reject(transaction.error);
    };
  });
}

function fetchCompleteCatalog() {
  if (!catalogRequest) {
    catalogRequest = fetch("/api/anime/all")
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("The anime catalog could not be loaded.");
        }

        const data = (await response.json()) as { videos?: AnimeVideo[] };

        if (!Array.isArray(data.videos)) {
          throw new Error("The anime catalog response was invalid.");
        }

        return normalizeCatalog(data.videos);
      })
      .finally(() => {
        catalogRequest = null;
      });
  }

  return catalogRequest;
}

export default function AnimeCatalogProvider({ children }: { children: ReactNode }) {
  const [videos, setVideos] = useState<AnimeVideo[]>([]);
  const [status, setStatus] = useState<CatalogStatus>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isStoredLocally, setIsStoredLocally] = useState(false);

  const refresh = useCallback(async () => {
    setStatus((current) => current === "ready" ? "refreshing" : "loading");
    setError(null);

    try {
      const freshVideos = await fetchCompleteCatalog();
      setVideos(freshVideos);
      setStatus("ready");

      try {
        await storeCatalog(freshVideos);
        setIsStoredLocally(true);
      } catch {
        setIsStoredLocally(false);
      }
    } catch (catalogError) {
      setStatus("error");
      setError(catalogError instanceof Error ? catalogError.message : "The anime catalog could not be loaded.");
    }
  }, []);

  useEffect(() => {
    let active = true;

    async function hydrateCatalog() {
      try {
        const stored = await readStoredCatalog();

        if (!active) return;

        if (stored?.videos.length) {
          setVideos(normalizeCatalog(stored.videos));
          setIsStoredLocally(true);
          setStatus("ready");

          if (Date.now() - stored.storedAt < MAX_CACHE_AGE) {
            return;
          }
        }
      } catch {
        if (!active) return;
        setIsStoredLocally(false);
      }

      if (active) {
        await refresh();
      }
    }

    hydrateCatalog();
    return () => {
      active = false;
    };
  }, [refresh]);

  const value = useMemo(
    () => ({ videos, status, error, isStoredLocally, refresh }),
    [error, isStoredLocally, refresh, status, videos],
  );

  return <AnimeCatalogContext.Provider value={value}>{children}</AnimeCatalogContext.Provider>;
}

export function useAnimeCatalog() {
  const context = useContext(AnimeCatalogContext);

  if (!context) {
    throw new Error("useAnimeCatalog must be used inside AnimeCatalogProvider.");
  }

  return context;
}
