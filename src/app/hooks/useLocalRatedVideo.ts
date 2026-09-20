"use client";

import { useCallback, useMemo, useState, useSyncExternalStore } from "react";
import type { AnimeVideo } from "../providers/AnimeCatalogProvider";

const CURRENT_VIDEO_STORAGE_KEY = "anime-rater-current-video-v2";
const CURRENT_VIDEO_CHANGE_EVENT = "anime-rater-current-video-change";

function getCurrentVideoSnapshot() {
  try {
    return window.localStorage.getItem(CURRENT_VIDEO_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerCurrentVideoSnapshot() {
  return null;
}

function subscribeToCurrentVideo(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === CURRENT_VIDEO_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(CURRENT_VIDEO_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(CURRENT_VIDEO_CHANGE_EVENT, onStoreChange);
  };
}

function parseStoredId(storedValue: string | null) {
  if (storedValue === null) return null;
  const parsed: unknown = JSON.parse(storedValue);
  return typeof parsed === "number" && Number.isFinite(parsed) ? parsed : null;
}

export default function useLocalRatedVideo(videos: AnimeVideo[], fallback: AnimeVideo) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const storedValue = useSyncExternalStore(
    subscribeToCurrentVideo,
    getCurrentVideoSnapshot,
    getServerCurrentVideoSnapshot,
  );
  const storedId = useMemo(() => {
    try {
      return parseStoredId(storedValue);
    } catch {
      return null;
    }
  }, [storedValue]);
  const effectiveId = selectedId ?? storedId;
  const storedIndex = effectiveId === null
    ? -1
    : videos.findIndex((video) => video.id === effectiveId || video.sourceVideoId === effectiveId);
  const currentIndex = storedIndex >= 0 ? storedIndex : 0;
  const current = videos[currentIndex] ?? fallback;

  const setCurrent = useCallback((video: AnimeVideo) => {
    setSelectedId(video.id);
    try {
      window.localStorage.setItem(CURRENT_VIDEO_STORAGE_KEY, JSON.stringify(video.id));
      window.dispatchEvent(new Event(CURRENT_VIDEO_CHANGE_EVENT));
    } catch {
      // Keep the current rendered video when storage is unavailable.
    }
  }, []);

  return { current, currentIndex, setCurrent };
}
