"use client";

import {
  MediaControlBar,
  MediaController,
  MediaFullscreenButton,
  MediaMuteButton,
  MediaPipButton,
  MediaPlaybackRateButton,
  MediaPlayButton,
  MediaTimeDisplay,
  MediaTimeRange,
  MediaVolumeRange,
} from "media-chrome/react";

type VideoPlayerProps = {
  src: string;
  title: string;
  autoPlay?: boolean;
  muted?: boolean;
  poster?: string;
};

export default function VideoPlayer({
  src,
  title,
  autoPlay = false,
  muted = false,
  poster,
}: VideoPlayerProps) {
  return (
    <MediaController
      className="anime-media-controller"
      aria-label={`${title} video player`}
    >
      <video
        slot="media"
        src={src}
        title={title}
        poster={poster}
        autoPlay={autoPlay}
        muted={muted}
        playsInline
        preload="metadata"
        tabIndex={-1}
      />

      <MediaControlBar className="anime-media-controls">
        <MediaPlayButton aria-label="Play or pause" />
        <MediaTimeDisplay aria-label="Current time" />
        <MediaTimeRange aria-label="Seek through video" />
        <MediaTimeDisplay showDuration aria-label="Video duration" />
        <MediaMuteButton aria-label="Mute or unmute" />
        <MediaVolumeRange aria-label="Volume" />
        <MediaPlaybackRateButton aria-label="Change playback speed" />
        <MediaPipButton aria-label="Picture in picture" />
        <MediaFullscreenButton aria-label="Fullscreen" />
      </MediaControlBar>
    </MediaController>
  );
}
