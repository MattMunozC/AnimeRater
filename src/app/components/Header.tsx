"use client";

import Link from "next/link";

type HeaderProps = {
  activePage?: "room" | "discover" | "history";
  queueCount?: number;
  onQueueToggle?: () => void;
};

function QueueIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 7h11M4 12h8M4 17h6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path d="m16 13 4 3-4 3v-6Z" fill="currentColor" />
    </svg>
  );
}

export default function Header({
  activePage = "room",
  queueCount = 0,
  onQueueToggle,
}: HeaderProps) {
  return (
    <header className="topbar">
      <Link className="brand" href="/" aria-label="AnimeRater home">
        <span className="brand-mark" aria-hidden="true">
          <span>R</span>
        </span>
        <span className="brand-word">
          Anime<span>Rater</span>
        </span>
      </Link>

      <nav className="nav-links" aria-label="Primary navigation">
        <Link className={activePage === "room" ? "active" : ""} href="/#room">Room</Link>
        <Link className={activePage === "discover" ? "active" : ""} href="/discover">Discover</Link>
        <Link className={activePage === "history" ? "active" : ""} href="/#history">History</Link>
      </nav>

      <div className="header-actions">
        {onQueueToggle ? (
          <button className="queue-button" onClick={onQueueToggle}>
            <QueueIcon /><span>Queue</span><b>{queueCount}</b>
          </button>
        ) : (
          <Link className="queue-button" href="/#library">
            <QueueIcon /><span>Queue</span><b>{queueCount}</b>
          </Link>
        )}
        <div className="profile-avatar" aria-label="Signed in as you">Y</div>
      </div>
    </header>
  );
}
