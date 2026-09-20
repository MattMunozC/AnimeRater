"use client";

import type { AnimeVideo } from "../providers/AnimeCatalogProvider";

type ThemeQueueProps = {
  items: AnimeVideo[];
  onSelect: (video: AnimeVideo) => void;
  activeId?: number;
  totalCount?: number;
};

const accents = ["ember", "violet", "cyan", "rose", "lime"];

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

function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.25 5.2c0-1.03 1.14-1.65 2.01-1.1l10.02 6.36a1.3 1.3 0 0 1 0 2.2L10.26 19c-.87.56-2.01-.07-2.01-1.1V5.2Z" /></svg>;
}

export default function ThemeQueue({
  items,
  onSelect,
  activeId,
  totalCount = items.length,
}: ThemeQueueProps) {
  return (
    <aside className="rate-queue" aria-label="Unrated theme queue">
      <div className="rate-queue-head">
        <div>
          <p className="eyebrow">Pick any theme</p>
          <h2>Rating list</h2>
        </div>
        <div className="rate-queue-meta"><span>{totalCount} unrated</span></div>
      </div>

      <div className="rate-queue-list">
        {items.map((video, index) => (
          <button
            className={`rate-queue-item${video.id === activeId ? " active" : ""}`}
            type="button"
            key={`${video.id}-${index}`}
            onClick={() => onSelect(video)}
            aria-current={video.id === activeId ? "true" : undefined}
          >
            <span className={`rate-queue-art ${accents[index % accents.length]}`}>
              <PlayIcon />
            </span>
            <span className="rate-queue-copy">
              <strong>{video.animeName ?? titleFromFilename(video.filename)}</strong>
              <small>{themeLabel(video)} · {video.releasePeriod ?? video.year ?? "Unknown year"}</small>
            </span>
            <b>{String(index + 1).padStart(2, "0")}</b>
          </button>
        ))}

        {!items.length && <p className="rate-queue-empty">Every theme has been rated.</p>}
      </div>
    </aside>
  );
}
