"use client";

import { useCallback, useMemo, useSyncExternalStore } from "react";

const DISCARDED_STORAGE_KEY = "anime-rater-discarded-themes-v1";
const DISCARDED_CHANGE_EVENT = "anime-rater-discarded-themes-change";

function getDiscardedSnapshot() {
  try {
    return window.localStorage.getItem(DISCARDED_STORAGE_KEY);
  } catch {
    return null;
  }
}

function getServerDiscardedSnapshot() {
  return null;
}

function parseDiscardedIds(storedValue: string | null) {
  if (storedValue === null) return [];

  try {
    const parsed: unknown = JSON.parse(storedValue);
    return Array.isArray(parsed)
      ? parsed.filter((id): id is number => typeof id === "number" && Number.isFinite(id))
      : [];
  } catch {
    return [];
  }
}

function subscribeToDiscarded(onStoreChange: () => void) {
  function handleStorage(event: StorageEvent) {
    if (event.key === DISCARDED_STORAGE_KEY) onStoreChange();
  }

  window.addEventListener("storage", handleStorage);
  window.addEventListener(DISCARDED_CHANGE_EVENT, onStoreChange);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener(DISCARDED_CHANGE_EVENT, onStoreChange);
  };
}

export default function useLocalDiscardedThemes() {
  const storedValue = useSyncExternalStore(
    subscribeToDiscarded,
    getDiscardedSnapshot,
    getServerDiscardedSnapshot,
  );
  const discardedIds = useMemo(
    () => new Set(parseDiscardedIds(storedValue)),
    [storedValue],
  );

  const discardTheme = useCallback((videoId: number) => {
    try {
      const nextIds = new Set(parseDiscardedIds(getDiscardedSnapshot()));
      nextIds.add(videoId);
      window.localStorage.setItem(DISCARDED_STORAGE_KEY, JSON.stringify([...nextIds]));
      window.dispatchEvent(new Event(DISCARDED_CHANGE_EVENT));
    } catch {
      // Leave the queue untouched when storage is unavailable.
    }
  }, []);

  return { discardedIds, discardTheme };
}
