"use client";

import { useMemo, useState } from "react";
import Header from "../components/Header";
import { useAnimeCatalog, type AnimeVideo } from "../providers/AnimeCatalogProvider";

const fallbackVideos: AnimeVideo[] = [
  { id: -1, filename: "ChainsawMan-OP1-KICKBACK.webm", link: "", resolution: 1080 },
  { id: -2, filename: "JujutsuKaisenS2-OP1-AoNoSumika.webm", link: "", resolution: 1080 },
  { id: -3, filename: "Frieren-OP2-Hareru.webm", link: "", resolution: 1080 },
  { id: -4, filename: "MobPsycho100S3-OP1-1.webm", link: "", resolution: 1080 },
  { id: -5, filename: "BocchiTheRock-ED1-Distortion.webm", link: "", resolution: 720 },
  { id: -6, filename: "CyberpunkEdgerunners-OP1-ThisFffire.webm", link: "", resolution: 1080 },
  { id: -7, filename: "Dandadan-OP1-Otonoke.webm", link: "", resolution: 1080 },
  { id: -8, filename: "OshiNoKo-OP1-Idol.webm", link: "", resolution: 1080 },
  { id: -9, filename: "AttackOnTitanS4-ED2-AkumaNoKo.webm", link: "", resolution: 1080 },
  { id: -10, filename: "SpyXFamily-OP1-MixedNuts.webm", link: "", resolution: 1080 },
  { id: -11, filename: "SoloLeveling-OP1-LEveL.webm", link: "", resolution: 1080 },
  { id: -12, filename: "VinlandSagaS2-OP1-River.webm", link: "", resolution: 1080 },
];

const accents = ["ember", "violet", "cyan", "rose", "lime"];

function titleFromFilename(filename: string) {
  const stem = filename.replace(/\.[^/.]+$/, "").replace(/[-_.]+/g, " ");
  const match = stem.match(/^(.+?)(OP|ED)(\d+)?(?:v\d+)?/i);
  return (match?.[1]?.trim() || stem).replace(/([a-z])([A-Z])/g, "$1 $2");
}

function themeFromFilename(filename: string) {
  const match = filename.match(/(OP|ED)(\d+)?/i);
  if (!match) return "Theme";
  return `${match[1].toUpperCase() === "OP" ? "Opening" : "Ending"}${match[2] ? ` ${match[2]}` : ""}`;
}

function songFromFilename(filename: string) {
  return filename.replace(/\.[^/.]+$/, "").split("-").slice(2).join(" · ") || "Anime theme";
}

function SearchIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" /><path d="m16 16 4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

function PlayIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8.25 5.2c0-1.03 1.14-1.65 2.01-1.1l10.02 6.36a1.3 1.3 0 0 1 0 2.2L10.26 19c-.87.56-2.01-.07-2.01-1.1V5.2Z" /></svg>;
}

function PlusIcon() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" /></svg>;
}

export default function Discover() {
  const { videos: catalogVideos, status } = useAnimeCatalog();
  const videos = catalogVideos.length ? catalogVideos : fallbackVideos;
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "op" | "ed">("all");
  const [sort, setSort] = useState<"featured" | "az">("featured");
  const [queue, setQueue] = useState<number[]>([]);
  const [showQueueOnly, setShowQueueOnly] = useState(false);
  const loading = status === "loading";

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = videos.filter((video) => {
      const type = video.filename.match(/(?:^|[-_.])(OP|ED)/i)?.[1]?.toLowerCase();
      return (!normalized || video.filename.toLowerCase().includes(normalized)) && (filter === "all" || type === filter);
    });
    const visible = showQueueOnly ? filtered.filter((video) => queue.includes(video.id)) : filtered;
    return sort === "az" ? [...visible].sort((a, b) => titleFromFilename(a.filename).localeCompare(titleFromFilename(b.filename))) : visible;
  }, [filter, query, queue, showQueueOnly, sort, videos]);

  const featured = videos[0] ?? fallbackVideos[0];

  function toggleQueue(id: number) {
    setQueue((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  return (
    <>
      <Header activePage="discover" queueCount={queue.length} onQueueToggle={() => setShowQueueOnly((current) => !current)} />
      <div className="discover-page" id="top">
        <section className="discover-intro">
          <p className="eyebrow"><span /> Theme archive</p>
          <div className="discover-title-row">
            <h1>Find your next<br /><em>all-time favorite.</em></h1>
            <p>Explore anime openings and endings, preview every track, and build the perfect queue for your next rating room.</p>
          </div>
        </section>

        <section className="featured-theme">
          <div className="featured-art">
            <div className="featured-orb" />
            <div className="featured-rings" />
            <span className="featured-index">FEATURED / 01</span>
            <button className="featured-play" aria-label={`Play ${titleFromFilename(featured.filename)}`}><PlayIcon /></button>
          </div>
          <div className="featured-copy">
            <p className="eyebrow">Editor&apos;s pick</p>
            <span className="featured-type">{themeFromFilename(featured.filename)}</span>
            <h2>{titleFromFilename(featured.filename)}</h2>
            <p className="featured-song">{songFromFilename(featured.filename)}</p>
            <div className="featured-stats"><span><b>9.4</b> community score</span><span><b>12.8k</b> ratings</span></div>
            <button className={queue.includes(featured.id) ? "featured-add added" : "featured-add"} onClick={() => toggleQueue(featured.id)}>{queue.includes(featured.id) ? "Added to queue" : "Add to queue"}<PlusIcon /></button>
          </div>
        </section>

        <section className="catalog-section">
          <div className="catalog-head">
            <div><p className="eyebrow">{showQueueOnly ? "Saved picks" : "Browse all"}</p><h2>{showQueueOnly ? "Your queue" : "Popular right now"}</h2></div>
            <div className="catalog-controls">
              <label className="discover-search"><SearchIcon /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search anime or song" /></label>
              <div className="discover-filters">{(["all", "op", "ed"] as const).map((value) => <button key={value} className={filter === value ? "active" : ""} onClick={() => setFilter(value)}>{value === "all" ? "All" : value === "op" ? "Openings" : "Endings"}</button>)}</div>
              <select value={sort} onChange={(event) => setSort(event.target.value as "featured" | "az")} aria-label="Sort themes"><option value="featured">Featured</option><option value="az">A—Z</option></select>
            </div>
          </div>

          {loading ? <div className="discover-loading">Loading the archive…</div> : (
            <div className="discover-grid">
              {results.slice(0, 18).map((video, index) => {
                const isQueued = queue.includes(video.id);
                return (
                  <article className="discover-card" key={video.id}>
                    <div className={`discover-card-art ${accents[index % accents.length]}`}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <button aria-label={`Play ${titleFromFilename(video.filename)}`}><PlayIcon /></button>
                    </div>
                    <div className="discover-card-copy">
                      <p>{themeFromFilename(video.filename)} <span>•</span> {video.resolution ? `${video.resolution}p` : "HD"}</p>
                      <h3>{titleFromFilename(video.filename)}</h3>
                      <span>{songFromFilename(video.filename)}</span>
                    </div>
                    <button className={isQueued ? "card-add added" : "card-add"} onClick={() => toggleQueue(video.id)} aria-label={isQueued ? "Remove from queue" : "Add to queue"}>{isQueued ? "✓" : <PlusIcon />}</button>
                  </article>
                );
              })}
              {!results.length && <p className="discover-empty">{showQueueOnly ? "Your queue is empty. Add a few themes, then come back here." : "No themes found. Try a broader search."}</p>}
            </div>
          )}
        </section>
      </div>
    </>
  );
}
