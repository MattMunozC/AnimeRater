"use client";

import {
  useCallback,
  useMemo,
  useSyncExternalStore,
  type Dispatch,
  type SetStateAction,
} from "react";
import type { AnimeVideo } from "../providers/AnimeCatalogProvider";

const QUEUE_STORAGE_KEY = "anime-rater-curated-queue-v2";
const QUEUE_CHANGE_EVENT = "anime-rater-queue-change";

function isAnimeVideo(value: unknown): value is AnimeVideo {
  if (!value || typeof value !== "object") return false;
  const video = value as Partial<AnimeVideo>;
  return typeof video.id === "number"
    && typeof video.filename === "string"
    && typeof video.link === "string";
}

function parseStoredQueue(stored: string | null) {
  if (stored === null) return null;

  try {
    const parsed: unknown = JSON.parse(stored);
    return Array.isArray(parsed) && parsed.every(isAnimeVideo) ? parsed : null;
  } catch {
    return null;
  }
}

function getQueueSnapshot() {
  try {
    return window.localStorage.getItem(QUEUE_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerQueueSnapshot() {
  return null;
}

function subscribeToQueue(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === QUEUE_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(QUEUE_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(QUEUE_CHANGE_EVENT, onStoreChange);
  };
}

export default function useLocalQueue(fallbackQueue: AnimeVideo[]) {
  const storedValue = useSyncExternalStore(
    subscribeToQueue,
    getQueueSnapshot,
    getServerQueueSnapshot,
  );
  const storedQueue = useMemo(() => parseStoredQueue(storedValue), [storedValue]);
  const queue = storedValue !== null && storedQueue !== null ? storedQueue : fallbackQueue;

  const setQueue: Dispatch<SetStateAction<AnimeVideo[]>> = useCallback((update) => {
    const nextQueue = typeof update === "function" ? update(queue) : update;

    try {
      window.localStorage.setItem(QUEUE_STORAGE_KEY, JSON.stringify(nextQueue));
      window.dispatchEvent(new Event(QUEUE_CHANGE_EVENT));
    } catch {
      // Leave the current queue untouched when storage is unavailable.
    }
  }, [queue]);

  return { queue, setQueue };
}
