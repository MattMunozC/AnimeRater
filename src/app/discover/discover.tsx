"use client";

import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import VideoPlayer from "../components/VideoPlayer";
import { useAnimeCatalog, type AnimeVideo } from "../providers/AnimeCatalogProvider";

const fallbackVideos: AnimeVideo[] = [
  { id: -1, filename: "ChainsawMan-OP1-KICKBACK.webm", link: "", resolution: 1080, year: 2022, themeType: "OP", themeNumber: 1 },
  { id: -2, filename: "JujutsuKaisenS2-OP1-AoNoSumika.webm", link: "", resolution: 1080, year: 2023, themeType: "OP", themeNumber: 1 },
  { id: -3, filename: "Frieren-OP2-Hareru.webm", link: "", resolution: 1080, year: 2024, themeType: "OP", themeNumber: 2 },
  { id: -4, filename: "MobPsycho100S3-OP1-1.webm", link: "", resolution: 1080, year: 2022, themeType: "OP", themeNumber: 1 },
  { id: -5, filename: "BocchiTheRock-ED1-Distortion.webm", link: "", resolution: 720, year: 2022, themeType: "ED", themeNumber: 1 },
  { id: -6, filename: "CyberpunkEdgerunners-OP1-ThisFffire.webm", link: "", resolution: 1080, year: 2022, themeType: "OP", themeNumber: 1 },
  { id: -7, filename: "Dandadan-OP1-Otonoke.webm", link: "", resolution: 1080, year: 2024, themeType: "OP", themeNumber: 1 },
  { id: -8, filename: "OshiNoKo-OP1-Idol.webm", link: "", resolution: 1080, year: 2023, themeType: "OP", themeNumber: 1 },
  { id: -9, filename: "AttackOnTitanS4-ED2-AkumaNoKo.webm", link: "", resolution: 1080, year: 2022, themeType: "ED", themeNumber: 2 },
  { id: -10, filename: "SpyXFamily-OP1-MixedNuts.webm", link: "", resolution: 1080, year: 2022, themeType: "OP", themeNumber: 1 },
  { id: -11, filename: "SoloLeveling-OP1-LEveL.webm", link: "", resolution: 1080, year: 2024, themeType: "OP", themeNumber: 1 },
  { id: -12, filename: "VinlandSagaS2-OP1-River.webm", link: "", resolution: 1080, year: 2023, themeType: "OP", themeNumber: 1 },
];

const accents = ["ember", "violet", "cyan", "rose", "lime"];

function titleFromFilename(filename: string) {
  const stem = filename.replace(/\.[^/.]+$/, "").replace(/[-_.]+/g, " ");
  const match = stem.match(/^(.+?)(OP|ED)(\d+)?(?:v\d+)?/i);
  return (match?.[1]?.trim() || stem).replace(/([a-z])([A-Z])/g, "$1 $2");
}

function themeLabel(video: AnimeVideo) {
  if (!video.themeType) return "Theme";
  return `${video.themeType === "OP" ? "Opening" : "Ending"}${video.themeNumber ? ` ${video.themeNumber}` : ""}`;
}

function videoQualityScore(video: AnimeVideo) {
  const sourcePriority = video.source === "BD" ? 3 : video.source === "DVD" ? 2 : video.source === "WEB" ? 1 : 0;
  const isPrimaryVersion = /v\d+$/i.test(video.filename) ? 0 : 1;
  return (video.resolution ?? 0) * 100 + sourcePriority * 10 + isPrimaryVersion;
}

function uniqueBestQuality(videos: AnimeVideo[]) {
  const uniqueVideos = new Map<string, AnimeVideo>();

  for (const video of videos) {
    const themeKey = video.filename.replace(/v\d+$/i, "").toLowerCase();
    const current = uniqueVideos.get(themeKey);

    if (!current || videoQualityScore(video) > videoQualityScore(current)) {
      uniqueVideos.set(themeKey, video);
    }
  }

  return Array.from(uniqueVideos.values());
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

function ChevronIcon({ direction }: { direction: "left" | "right" }) {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: direction === "left" ? "rotate(180deg)" : undefined }}><path d="m9 5 7 7-7 7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function Discover() {
  const { videos: catalogVideos, status } = useAnimeCatalog();
  const videos = useMemo(
    () => uniqueBestQuality(catalogVideos.length ? catalogVideos : fallbackVideos),
    [catalogVideos],
  );
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "op" | "ed">("all");
  const [sort, setSort] = useState<"featured" | "az">("featured");
  const [queue, setQueue] = useState<number[]>([]);
  const [showQueueOnly, setShowQueueOnly] = useState(false);
  const [includeEndings, setIncludeEndings] = useState(false);
  const [playback, setPlayback] = useState<{ history: number[]; index: number }>({ history: [], index: -1 });
  const loading = status === "loading";

  const uniqueCatalogVideos = useMemo(() => uniqueBestQuality(catalogVideos), [catalogVideos]);

  const playableVideos = useMemo(
    () => uniqueCatalogVideos.filter((video) => includeEndings || video.themeType !== "ED"),
    [includeEndings, uniqueCatalogVideos],
  );

  useEffect(() => {
    if (!playableVideos.length) return;

    const selectionTask = window.setTimeout(() => {
      setPlayback((current) => {
        const allowedIds = new Set(playableVideos.map((video) => video.id));
        const currentId = current.history[current.index];
        const filteredHistory = current.history.filter((id) => allowedIds.has(id));

        if (currentId !== undefined && allowedIds.has(currentId)) {
          return { history: filteredHistory, index: filteredHistory.indexOf(currentId) };
        }

        const randomId = playableVideos[Math.floor(Math.random() * playableVideos.length)].id;
        return { history: [...filteredHistory, randomId], index: filteredHistory.length };
      });
    }, 0);

    return () => window.clearTimeout(selectionTask);
  }, [playableVideos]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const filtered = videos.filter((video) => {
      const type = video.themeType?.toLowerCase();
      return (!normalized || video.filename.toLowerCase().includes(normalized)) && (filter === "all" || type === filter);
    });
    const visible = showQueueOnly ? filtered.filter((video) => queue.includes(video.id)) : filtered;
    return sort === "az" ? [...visible].sort((a, b) => titleFromFilename(a.filename).localeCompare(titleFromFilename(b.filename))) : visible;
  }, [filter, query, queue, showQueueOnly, sort, videos]);

  const selectedVideoId = playback.history[playback.index] ?? null;
  const selectedVideo = selectedVideoId === null
    ? null
    : uniqueCatalogVideos.find((video) => video.id === selectedVideoId) ?? null;

  function toggleQueue(id: number) {
    setQueue((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  }

  function playPrevious() {
    setPlayback((current) => current.index > 0 ? { ...current, index: current.index - 1 } : current);
  }

  function playNext() {
    if (!playableVideos.length) return;

    setPlayback((current) => {
      const unseenVideos = playableVideos.filter((video) => !current.history.includes(video.id));
      const candidates = unseenVideos.length
        ? unseenVideos
        : playableVideos.filter((video) => video.id !== current.history[current.index]);
      const randomVideo = candidates[Math.floor(Math.random() * candidates.length)] ?? playableVideos[0];
      const previousHistory = current.history.slice(0, current.index + 1);

      return {
        history: unseenVideos.length ? [...previousHistory, randomVideo.id] : [current.history[current.index], randomVideo.id],
        index: unseenVideos.length ? previousHistory.length : 1,
      };
    });
  }

  function playCatalogVideo(video: AnimeVideo) {
    if (video.themeType === "ED") setIncludeEndings(true);

    setPlayback((current) => {
      const history = [...current.history.slice(0, current.index + 1), video.id];
      return { history, index: history.length - 1 };
    });
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

        <section className="discover-player-section" aria-label="Random anime theme player">
          <div className="discover-player-nav">
            <button onClick={playPrevious} disabled={playback.index <= 0}><ChevronIcon direction="left" /> Previous</button>
            <div className="discover-player-pool">
              <span className="discover-player-count">Random pick from {playableVideos.length.toLocaleString()} themes</span>
              <label className="discover-ending-toggle">
                <input type="checkbox" role="switch" checked={includeEndings} onChange={(event) => setIncludeEndings(event.target.checked)} />
                <span aria-hidden="true" />
                Include endings
              </label>
            </div>
            <button onClick={playNext} disabled={!selectedVideo}>Next <ChevronIcon direction="right" /></button>
          </div>
          <div className="discover-player-frame">
            {selectedVideo ? (
              <VideoPlayer
                key={selectedVideo.id}
                src={selectedVideo.link}
                title={titleFromFilename(selectedVideo.filename)}
                autoPlay
                muted
              />
            ) : (
              <div className="discover-player-loading">Choosing a random theme…</div>
            )}
          </div>
          {selectedVideo && (
            <div className="discover-player-details">
              <div>
                <p>{themeLabel(selectedVideo)} <span>•</span> {selectedVideo.releasePeriod ?? selectedVideo.year ?? "Release unknown"} <span>•</span> {selectedVideo.resolution ? `${selectedVideo.resolution}p` : "HD"}</p>
                <h2>{titleFromFilename(selectedVideo.filename)}</h2>
                <span>{songFromFilename(selectedVideo.filename)}</span>
              </div>
              <button className={queue.includes(selectedVideo.id) ? "added" : ""} onClick={() => toggleQueue(selectedVideo.id)}>{queue.includes(selectedVideo.id) ? "Added to queue" : "Add to queue"}<PlusIcon /></button>
            </div>
          )}
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
                      <button onClick={() => playCatalogVideo(video)} aria-label={`Play ${titleFromFilename(video.filename)}`}><PlayIcon /></button>
                    </div>
                    <div className="discover-card-copy">
                      <p>{themeLabel(video)} <span>•</span> {video.releasePeriod ?? video.year ?? "—"}</p>
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
