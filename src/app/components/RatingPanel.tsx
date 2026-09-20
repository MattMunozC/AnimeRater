"use client";

import type { CSSProperties } from "react";

type RatingPanelProps = {
  rating: number;
  savedRating: number | null;
  onRatingChange: (rating: number) => void;
  onSubmit: () => void;
  average?: number;
  averageLabel?: string;
  title?: string;
  compact?: boolean;
};

export default function RatingPanel({
  rating,
  savedRating,
  onRatingChange,
  onSubmit,
  average = 8.9,
  averageLabel = "Community average",
  title = "How did it hit?",
  compact = false,
}: RatingPanelProps) {
  return (
    <aside className={`score-card${compact ? " score-card-compact" : ""}`}>
      <div className="score-card-head">
        <div>
          <p className="eyebrow">Your rating</p>
          <h2>{title}</h2>
        </div>
        <span className="rating-status">
          {savedRating === null ? "Unrated" : "Rated"}
        </span>
      </div>

      <div className="score-display" aria-live="polite">
        <strong>{rating.toFixed(1)}</strong>
        <span>/ 10</span>
      </div>

      <input
        className="rating-range"
        type="range"
        min="0"
        max="10"
        step="0.1"
        value={rating}
        aria-label="Rating from zero to ten"
        style={{ "--rating": `${rating * 10}%` } as CSSProperties}
        onChange={(event) => onRatingChange(Number(event.target.value))}
      />
      <div className="range-labels">
        <span>Not for me</span>
        <span>On repeat</span>
      </div>

      <button className="submit-score" type="button" onClick={onSubmit}>
        {savedRating === null
          ? "Lock in rating"
          : `Rating saved · ${savedRating.toFixed(1)}`}
      </button>

      <div className="room-average">
        <span>{averageLabel}</span>
        <div>
          <strong>{average.toFixed(1)}</strong>
          <span className="stars" aria-hidden="true">★★★★<i>★</i></span>
        </div>
      </div>
    </aside>
  );
}
