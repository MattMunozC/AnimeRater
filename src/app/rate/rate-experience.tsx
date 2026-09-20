"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Header from "../components/Header";
import RatingPanel from "../components/RatingPanel";
import ThemeQueue from "../components/ThemeQueue";
import VideoPlayer from "../components/VideoPlayer";
import { CURATED_THEME_NAMES } from "../data/curatedThemes";
import resolvedCuratedThemes from "../data/resolvedCuratedThemes.json";
import useLocalDiscardedThemes from "../hooks/useLocalDiscardedThemes";
import useLocalQueue from "../hooks/useLocalQueue";
import useLocalRatedVideo from "../hooks/useLocalRatedVideo";
import useLocalRatings, { type StoredRating } from "../hooks/useLocalRatings";
import type { AnimeVideo } from "../providers/AnimeCatalogProvider";

const curatedVideos = resolvedCuratedThemes as unknown as AnimeVideo[];

function subscribeToHydration() {
  return () => {};
}

function getClientHydrationSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function titleFromFilename(filename: string) {
  const stem = filename.replace(/\.[^/.]+$/, "").replace(/[-_.]+/g, " ");
  const match = stem.match(/^(.+?)(OP|ED)(\d+)?(?:v\d+)?/i);
  return (match?.[1]?.trim() || stem).replace(/([a-z])([A-Z])/g, "$1 $2");
}

function themeLabel(video: AnimeVideo) {
  if (!video.themeType) return "Anime theme";
  const type = video.themeType === "OP" ? "Opening" : "Ending";
  return `${type}${video.themeNumber ? ` ${video.themeNumber}` : ""}`;
}

function songFromFilename(filename: string) {
  return filename.replace(/\.[^/.]+$/, "").split("-").slice(2).join(" · ") || "Anime theme";
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.25 5.2c0-1.03 1.14-1.65 2.01-1.1l10.02 6.36a1.3 1.3 0 0 1 0 2.2L10.26 19c-.87.56-2.01-.07-2.01-1.1V5.2Z" /></svg>;
}

function ArrowIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function TrashIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13M10 11v5m4-5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function downloadText(text: string, filename: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/plain;charset=utf-8" }));
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function downloadRatings(ratings: StoredRating[]) {
  const text = ratings
    .map((rating) => {
      const theme = rating.themeType
        ? `${rating.themeType}${rating.themeNumber ?? ""}`
        : "Theme";
      return `${rating.animeName ?? titleFromFilename(rating.filename)} ${theme} - ${rating.score.toFixed(1)}`;
    })
    .join("\n");
  downloadText(text, `anime-rater-scores-${new Date().toISOString().slice(0, 10)}.txt`);
}

function downloadFormattedList(ratings: Record<string, StoredRating>) {
  const entries = CURATED_THEME_NAMES.map((originalName, index) => {
    const video = curatedVideos[index];
    const rating = video
      ? ratings[String(video.id)] ?? (video.sourceVideoId ? ratings[String(video.sourceVideoId)] : undefined)
      : undefined;
    return `${originalName} - ${rating ? rating.score.toFixed(1) : "Unrated"}`;
  });
  const text = [
    "LISTADO DE OPENINGS Y ENDINGS",
    `Total: ${CURATED_THEME_NAMES.length} archivos`,
    "============================================================",
    ...entries,
  ].join("\n");

  downloadText(text, `anime-rater-full-list-${new Date().toISOString().slice(0, 10)}.txt`);
}

export default function RateExperience() {
  const videos = curatedVideos;
  const { ratings, ratingList, saveRating, clearRatings } = useLocalRatings();
  const [ratingDrafts, setRatingDrafts] = useState<Record<string, number>>({});
  const [confirmClearOpen, setConfirmClearOpen] = useState(false);
  const hasMounted = useSyncExternalStore(
    subscribeToHydration,
    getClientHydrationSnapshot,
    getServerHydrationSnapshot,
  );
  const { current, currentIndex, setCurrent } = useLocalRatedVideo(videos, videos[0]);
  const ratingKey = String(current.id);
  const persistedRating = ratings[ratingKey]
    ?? (current.sourceVideoId ? ratings[String(current.sourceVideoId)] : undefined);
  const hasRatingDraft = Object.hasOwn(ratingDrafts, ratingKey);
  const rating = ratingDrafts[ratingKey] ?? persistedRating?.score ?? 8.0;
  const savedRating = hasRatingDraft ? null : persistedRating?.score ?? null;
  const defaultQueue = useMemo(() => videos, [videos]);
  const { queue: storedQueue, setQueue } = useLocalQueue(defaultQueue);
  const { discardedIds, discardTheme } = useLocalDiscardedThemes();
  const curatedIds = useMemo(() => new Set(videos.map((video) => video.id)), [videos]);
  const queue = useMemo(
    () => {
      const seen = new Set<number>();
      const storedUnrated = storedQueue.filter((video) => {
        const alreadyRated = ratings[String(video.id)]
          || (video.sourceVideoId ? ratings[String(video.sourceVideoId)] : undefined);
        if (!curatedIds.has(video.id) || discardedIds.has(video.id) || alreadyRated || seen.has(video.id)) return false;
        seen.add(video.id);
        return true;
      });
      const missingUnrated = videos.filter((video) => {
        const alreadyRated = ratings[String(video.id)]
          || (video.sourceVideoId ? ratings[String(video.sourceVideoId)] : undefined);
        return !discardedIds.has(video.id) && !alreadyRated && !seen.has(video.id);
      });
      return [...storedUnrated, ...missingUnrated];
    },
    [curatedIds, discardedIds, ratings, storedQueue, videos],
  );

  function selectVideo(video: AnimeVideo) {
    const nextIndex = videos.findIndex((candidate) => candidate.id === video.id);
    if (nextIndex < 0) return;
    setCurrent(videos[nextIndex]);
  }

  function showNext() {
    if (!queue.length) return;
    const queueIndex = queue.findIndex((video) => video.id === current.id);
    selectVideo(queue[(queueIndex + 1 + queue.length) % queue.length]);
  }

  function discardVideo(video: AnimeVideo) {
    const discardedIndex = queue.findIndex((candidate) => candidate.id === video.id);
    const remainingQueue = queue.filter((candidate) => candidate.id !== video.id);

    discardTheme(video.id);
    setQueue(remainingQueue);

    if (video.id === current.id && remainingQueue.length) {
      selectVideo(remainingQueue[Math.min(Math.max(discardedIndex, 0), remainingQueue.length - 1)]);
    }
  }

  function submitRating() {
    const remainingQueue = queue.filter((video) => video.id !== current.id);
    saveRating(current, rating);
    setQueue(remainingQueue);
    setRatingDrafts((drafts) => {
      const nextDrafts = { ...drafts };
      delete nextDrafts[ratingKey];
      return nextDrafts;
    });
    if (remainingQueue[0]) setCurrent(remainingQueue[0]);
  }

  return (
    <>
      <Header activePage="rate" queueCount={queue.length} />
      <div className="rate-page">
        <header className="rate-intro">
          <div>
            <p className="eyebrow"><span /> Solo session</p>
          </div>
          <p>Give every opening and ending a score. Move through the catalog one theme at a time.</p>
        </header>

        <section className="rate-stage" aria-label="Theme rating">
          <article className="player-card rate-player">
            <div className="video-wrap">
              {current.link ? (
                <VideoPlayer
                  key={current.link}
                  src={current.link}
                  title={current.animeName ?? titleFromFilename(current.filename)}
                  autoPlay
                />
              ) : (
                <div className="demo-art" role="img" aria-label="Abstract anime theme backdrop">
                  <div className="sun" />
                  <div className="speed-lines" />
                  <div className="hero-silhouette" />
                  <span className="demo-label">Preview unavailable</span>
                  <button className="big-play" type="button" aria-label="Play preview"><PlayIcon /></button>
                </div>
              )}
              <div className="now-playing-pill"><span /> Now rating</div>
              <div className="video-count">{String(currentIndex + 1).padStart(2, "0")} / {String(videos.length).padStart(2, "0")}</div>
            </div>

            <div className="player-details">
              <div className="track-copy">
                <p>{themeLabel(current)} <span>•</span> {current.releasePeriod ?? current.year ?? "Release unknown"}</p>
                <h2>{current.animeName ?? titleFromFilename(current.filename)}</h2>
                <span className="track-name">{current.songTitle ?? songFromFilename(current.filename)}</span>
              </div>
              <button className="next-button" type="button" onClick={showNext}>
                Skip <ArrowIcon />
              </button>
            </div>
          </article>

          <div className="rate-sidebar">
            <ThemeQueue
              items={queue}
              activeId={current.id}
              totalCount={queue.length}
              onSelect={selectVideo}
              onDiscard={discardVideo}
            />
            <RatingPanel
              key={current.id}
              compact
              rating={rating}
              savedRating={savedRating}
              onRatingChange={(nextRating) => {
                setRatingDrafts((drafts) => ({ ...drafts, [ratingKey]: nextRating }));
              }}
              onSubmit={submitRating}
            />
          </div>
        </section>

        <footer className="rate-footer">
          <span>{ratingList.length} ratings saved · {videos.length} themes in this list</span>
          <div className="rate-footer-actions">
            <button type="button" disabled={!hasMounted || !ratingList.length} onClick={() => downloadRatings(ratingList)}><DownloadIcon /> Download ratings</button>
            <button type="button" disabled={!hasMounted} onClick={() => downloadFormattedList(ratings)}><DownloadIcon /> Full formatted list</button>
            <button className="delete-ratings-button" type="button" disabled={!hasMounted || !ratingList.length} onClick={() => setConfirmClearOpen(true)} aria-label="Delete all saved ratings"><TrashIcon /></button>
            <button type="button" onClick={showNext}>Next theme <ArrowIcon /></button>
          </div>
        </footer>

        {confirmClearOpen && (
          <div className="rating-modal-backdrop" role="presentation" onClick={() => setConfirmClearOpen(false)}>
            <div className="rating-modal" role="dialog" aria-modal="true" aria-labelledby="clear-ratings-title" onClick={(event) => event.stopPropagation()}>
              <span className="rating-modal-icon"><TrashIcon /></span>
              <p className="eyebrow">Permanent action</p>
              <h2 id="clear-ratings-title">Delete every saved rating?</h2>
              <p>This will permanently remove all {ratingList.length} scores stored in this browser. This cannot be undone.</p>
              <div className="rating-modal-actions">
                <button type="button" onClick={() => setConfirmClearOpen(false)}>Cancel</button>
                <button type="button" onClick={() => { clearRatings(); setConfirmClearOpen(false); }}>Delete all ratings</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
