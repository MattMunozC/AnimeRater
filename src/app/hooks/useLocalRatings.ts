"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";
import type { AnimeVideo } from "../providers/AnimeCatalogProvider";

const RATINGS_STORAGE_KEY = "anime-rater-ratings-v1";
const RATINGS_CHANGE_EVENT = "anime-rater-ratings-change";

export type StoredRating = {
  videoId: number;
  filename: string;
  animeName?: string;
  themeType: AnimeVideo["themeType"];
  themeNumber: number | null;
  year: number | null;
  score: number;
  ratedAt: string;
};

type StoredRatings = Record<string, StoredRating>;

function isStoredRating(value: unknown): value is StoredRating {
  if (!value || typeof value !== "object") return false;
  const rating = value as Partial<StoredRating>;
  return typeof rating.videoId === "number"
    && typeof rating.filename === "string"
    && typeof rating.score === "number"
    && Number.isFinite(rating.score)
    && typeof rating.ratedAt === "string";
}

function parseRatings(storedValue: string | null): StoredRatings {
  if (storedValue === null) return {};

  try {
    const parsed: unknown = JSON.parse(storedValue);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return {};

    return Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, StoredRating] => isStoredRating(entry[1])),
    );
  } catch {
    return {};
  }
}

function getRatingsSnapshot() {
  try {
    return window.localStorage.getItem(RATINGS_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerRatingsSnapshot() {
  return null;
}

function subscribeToRatings(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === RATINGS_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(RATINGS_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(RATINGS_CHANGE_EVENT, onStoreChange);
  };
}

function writeRatings(ratings: StoredRatings) {
  window.localStorage.setItem(RATINGS_STORAGE_KEY, JSON.stringify(ratings));
  window.dispatchEvent(new Event(RATINGS_CHANGE_EVENT));
}

export default function useLocalRatings() {
  const storedValue = useSyncExternalStore(
    subscribeToRatings,
    getRatingsSnapshot,
    getServerRatingsSnapshot,
  );
  const ratings = useMemo(() => parseRatings(storedValue), [storedValue]);
  const ratingList = useMemo(
    () => Object.values(ratings).sort((a, b) => b.ratedAt.localeCompare(a.ratedAt)),
    [ratings],
  );

  const saveRating = useCallback((video: AnimeVideo, score: number) => {
    try {
      const currentRatings = parseRatings(getRatingsSnapshot());
      writeRatings({
        ...currentRatings,
        [String(video.id)]: {
          videoId: video.id,
          filename: video.filename,
          animeName: video.animeName,
          themeType: video.themeType,
          themeNumber: video.themeNumber,
          year: video.year,
          score,
          ratedAt: new Date().toISOString(),
        },
      });
    } catch {
      // Storage can be unavailable in privacy-restricted browser contexts.
    }
  }, []);

  const clearRatings = useCallback(() => {
    try {
      writeRatings({});
    } catch {
      // Leave the saved ratings untouched when storage is unavailable.
    }
  }, []);

  return { ratings, ratingList, saveRating, clearRatings };
}
