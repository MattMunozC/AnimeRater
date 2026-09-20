"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Header from "./components/Header";
import { useAnimeCatalog, type AnimeVideo } from "./providers/AnimeCatalogProvider";

type IconProps = { className?: string };

function SearchIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function PlusIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function ChevronIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function PlayIcon({ className }: IconProps) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.25 5.2c0-1.03 1.14-1.65 2.01-1.1l10.02 6.36a1.3 1.3 0 0 1 0 2.2L10.26 19c-.87.56-2.01-.07-2.01-1.1V5.2Z" /></svg>;
}

function titleFromFilename(filename: string) {
  const stem = filename.replace(/\.[^/.]+$/, "").replace(/[-_.]+/g, " ");
  const match = stem.match(/^(.+?)(OP|ED)(\d+)?(?:v\d+)?/i);
  const rawTitle = match?.[1]?.trim() || stem.split(/(?:NC|BD|1080|720)/i)[0].trim();
  return rawTitle.replace(/([a-z])([A-Z])/g, "$1 $2") || "Untitled theme";
}

function themeFromFilename(filename: string) {
  const match = filename.match(/(OP|ED)(\d+)?/i);
  if (!match) return "Theme song";
  return `${match[1].toUpperCase() === "OP" ? "Opening" : "Ending"}${match[2] ? ` ${match[2]}` : ""}`;
}

function accentFor(index: number) {
  return ["ember", "violet", "cyan", "rose", "lime"][index % 5];
}

const people = [
  { name: "Mika", initials: "MK", score: "9.2", color: "coral" },
  { name: "Yuto", initials: "YU", score: "8.7", color: "blue" },
  { name: "Rin", initials: "RN", score: "—", color: "purple" },
];

const demoVideos: AnimeVideo[] = [
  { id: -1, filename: "ChainsawMan-OP1-KICKBACK.webm", link: "" },
  { id: -2, filename: "JujutsuKaisenS2-OP1-AoNoSumika.webm", link: "" },
  { id: -3, filename: "Frieren-OP2-Hareru.webm", link: "" },
  { id: -4, filename: "MobPsycho100S3-OP1-1.webm", link: "" },
  { id: -5, filename: "BocchiTheRock-ED1-Distortion.webm", link: "" },
  { id: -6, filename: "CyberpunkEdgerunners-OP1-ThisFffire.webm", link: "" },
];

export default function AnimeRater() {
  const { videos: catalogVideos, status } = useAnimeCatalog();
  const videos = catalogVideos.length ? catalogVideos : demoVideos;
  const [selectedOverride, setSelected] = useState<AnimeVideo | null>(null);
  const [queueOverride, setQueue] = useState<AnimeVideo[] | null>(null);
  const selected = selectedOverride ?? videos[0] ?? demoVideos[0];
  const queue = queueOverride ?? videos.slice(1, 4);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "op" | "ed">("all");
  const [rating, setRating] = useState(8.6);
  const [savedRating, setSavedRating] = useState<number | null>(null);
  const [libraryOpen, setLibraryOpen] = useState(true);
  const loading = status === "loading";

  const filteredVideos = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return videos.filter((video) => {
      const matchesSearch = !normalized || video.filename.toLowerCase().includes(normalized);
      const marker = video.filename.match(/(?:^|[-_.])(OP|ED)/i)?.[1]?.toLowerCase();
      return matchesSearch && (filter === "all" || marker === filter);
    });
  }, [videos, query, filter]);

  function addToQueue(video: AnimeVideo) {
    setQueue((currentOverride) => {
      const current = currentOverride ?? queue;
      return current.some((queued) => queued.id === video.id) || selected.id === video.id ? current : [...current, video];
    });
  }

  function playNext() {
    const [next, ...rest] = queue;
    if (!next) return;
    setSelected(next);
    setQueue(rest);
    setSavedRating(null);
  }

  return (
    <>
      <Header
        queueCount={queue.length}
        onQueueToggle={() => setLibraryOpen((open) => !open)}
      />
      <div className="page" id="top">
        <section className="room-heading" id="room">
          <div><p className="eyebrow"><span /> Live session</p><h1>Friday night <em>openings</em></h1></div>
          <div className="room-meta"><span className="stacked-avatars" aria-hidden="true"><i>MK</i><i>YU</i><i>RN</i></span><span><strong>4 friends</strong> in the room</span><button aria-label="Room options">•••</button></div>
        </section>

        <section className="stage-grid">
          <article className="player-card">
            <div className="video-wrap">
              {selected.link ? <video key={selected.link} src={selected.link} controls autoPlay playsInline preload="metadata" /> : (
                <div className="demo-art" role="img" aria-label="Abstract anime theme backdrop"><div className="sun" /><div className="speed-lines" /><div className="hero-silhouette" /><span className="demo-label">Live preview</span><button className="big-play" aria-label="Play preview"><PlayIcon /></button></div>
              )}
              <div className="now-playing-pill"><span /> Now playing</div><div className="video-count">01 / {String(Math.max(queue.length + 1, 1)).padStart(2, "0")}</div>
            </div>
            <div className="player-details">
              <div className="track-copy"><p>{themeFromFilename(selected.filename)} <span>•</span> 2024</p><h2>{titleFromFilename(selected.filename)}</h2><span className="track-name">{selected.filename.replace(/\.[^/.]+$/, "").split("-").slice(2).join(" · ") || "Anime theme"}</span></div>
              <button className="next-button" onClick={playNext} disabled={!queue.length}>Next up <ChevronIcon /></button>
            </div>
          </article>

          <aside className="score-card">
            <div className="score-card-head"><div><p className="eyebrow">Your rating</p><h2>How did it hit?</h2></div><span className="rating-status">{savedRating === null ? "Unrated" : "Rated"}</span></div>
            <div className="score-display"><strong>{rating.toFixed(1)}</strong><span>/ 10</span></div>
            <input className="rating-range" type="range" min="0" max="10" step="0.1" value={rating} aria-label="Rating from zero to ten" style={{ "--rating": `${rating * 10}%` } as CSSProperties} onChange={(event) => { setRating(Number(event.target.value)); setSavedRating(null); }} />
            <div className="range-labels"><span>Not for me</span><span>On repeat</span></div>
            <button className="submit-score" onClick={() => setSavedRating(rating)}>{savedRating === null ? "Lock in rating" : `Rating saved · ${savedRating.toFixed(1)}`}</button>
            <div className="room-average"><span>Room average</span><div><strong>8.9</strong><span className="stars">★★★★<i>★</i></span></div></div>
          </aside>
        </section>

        <section className="social-grid" id="history">
          <div className="panel people-panel">
            <div className="panel-title"><div><p className="eyebrow">The room</p><h2>Everyone&apos;s scores</h2></div><span>4 / 8 seats</span></div>
            <div className="people-list">
              {people.map((person) => <div className="person" key={person.name}><div className={`person-avatar ${person.color}`}>{person.initials}</div><div><strong>{person.name}</strong><span>{person.score === "—" ? "Still deciding" : "Rating locked"}</span></div><b className={person.score === "—" ? "waiting" : ""}>{person.score}</b></div>)}
              <div className="person me"><div className="person-avatar amber">YOU</div><div><strong>You</strong><span>{savedRating === null ? "Still deciding" : "Rating locked"}</span></div><b className={savedRating === null ? "waiting" : ""}>{savedRating?.toFixed(1) ?? "—"}</b></div>
            </div>
          </div>

          <div className="panel queue-panel">
            <div className="panel-title"><div><p className="eyebrow">Coming up</p><h2>Room queue</h2></div><button onClick={() => setLibraryOpen(true)}>Edit queue</button></div>
            <div className="queue-list">
              {queue.slice(0, 3).map((video, index) => <button className="queue-item" key={`${video.id}-${index}`} onClick={() => { setSelected(video); setQueue((items) => (items ?? queue).filter((_, itemIndex) => itemIndex !== index)); }}><span className={`queue-art ${accentFor(index)}`}><PlayIcon /></span><span><strong>{titleFromFilename(video.filename)}</strong><small>{themeFromFilename(video.filename)}</small></span><b>{String(index + 2).padStart(2, "0")}</b></button>)}
              {!queue.length && <p className="empty-queue">The queue is empty. Add a theme from the library.</p>}
            </div>
          </div>
        </section>

        {libraryOpen && <section className="library-section" id="library">
          <div className="library-head">
            <div><p className="eyebrow">Pick the next one</p><h2>Theme library</h2></div>
            <div className="library-tools">
              <div className="filters" aria-label="Theme filters">{(["all", "op", "ed"] as const).map((value) => <button className={filter === value ? "active" : ""} key={value} onClick={() => setFilter(value)}>{value === "all" ? "All themes" : value === "op" ? "Openings" : "Endings"}</button>)}</div>
              <label className="search-box"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search the library" /></label>
            </div>
          </div>
          {loading ? <div className="loading-grid" aria-label="Loading anime themes">{Array.from({ length: 6 }).map((_, index) => <span key={index} />)}</div> : (
            <div className="theme-grid">
              {filteredVideos.slice(0, 10).map((video, index) => {
                const queued = queue.some((item) => item.id === video.id) || selected.id === video.id;
                return <article className="theme-card" key={video.id}><button className={`theme-art ${accentFor(index + 1)}`} onClick={() => setSelected(video)} aria-label={`Play ${titleFromFilename(video.filename)}`}><span className="theme-type">{themeFromFilename(video.filename)}</span><PlayIcon /></button><div className="theme-info"><div><strong>{titleFromFilename(video.filename)}</strong><span>{video.resolution ? `${video.resolution}p` : "Anime theme"}</span></div><button className={queued ? "added" : ""} onClick={() => addToQueue(video)} aria-label={queued ? "Already in queue" : "Add to queue"}>{queued ? "✓" : <PlusIcon />}</button></div></article>;
              })}
              {!filteredVideos.length && <p className="no-results">No themes match that search.</p>}
            </div>
          )}
        </section>}
      </div>
    </>
  );
}
