"use client";

import { PauseIcon } from "@phosphor-icons/react/dist/ssr/Pause";
import { PlayIcon } from "@phosphor-icons/react/dist/ssr/Play";
import * as motion from "motion/react-client";
import { useCallback, useMemo, useRef, useState } from "react";

const BAR_COUNT = 44;

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) return "0:00";
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60)
    .toString()
    .padStart(2, "0")}`;
}

export function AudioScrubber({ src }: { src: string }) {
  const audioRef = useRef<HTMLAudioElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const bars = useMemo(
    () =>
      Array.from({ length: BAR_COUNT }, (_, index) => ({
        id: index,
        height:
          0.24 +
          ((Math.sin(index * 1.73) + Math.sin(index * 0.57 + 1.4) + 2) / 4) *
            0.76,
      })),
    [],
  );
  const progress = duration > 0 ? currentTime / duration : 0;

  const timeFromPointer = useCallback(
    (clientX: number) => {
      const track = trackRef.current;
      if (!track || duration <= 0) return 0;
      const bounds = track.getBoundingClientRect();
      const ratio = Math.min(
        1,
        Math.max(0, (clientX - bounds.left) / bounds.width),
      );
      return ratio * duration;
    },
    [duration],
  );

  function scrub(clientX: number) {
    const audio = audioRef.current;
    if (!audio) return;
    const nextTime = timeFromPointer(clientX);
    audio.currentTime = nextTime;
    setCurrentTime(nextTime);
  }

  async function togglePlay() {
    const audio = audioRef.current;
    if (!audio) return;
    if (audio.paused) await audio.play();
    else audio.pause();
  }

  return (
    <div className="glass-tile mt-3 rounded-2xl px-3 py-3">
      {/* biome-ignore lint/a11y/useMediaCaption: the transcript accompanies this audio */}
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onLoadedMetadata={(event) => setDuration(event.currentTarget.duration)}
        onTimeUpdate={(event) =>
          setCurrentTime(event.currentTarget.currentTime)
        }
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => setPlaying(false)}
      />

      <div className="flex items-center gap-3">
        <motion.button
          type="button"
          whileTap={{ scale: 0.9 }}
          onClick={() => void togglePlay()}
          className="grid size-9 shrink-0 place-items-center rounded-full bg-foreground text-background"
          aria-label={playing ? "Pause voice update" : "Play voice update"}
        >
          {playing ? (
            <PauseIcon size={15} weight="fill" />
          ) : (
            <PlayIcon size={15} weight="fill" className="translate-x-px" />
          )}
        </motion.button>

        <div
          ref={trackRef}
          className="relative flex h-10 flex-1 touch-none items-center justify-between"
          onPointerDown={(event) => {
            draggingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            scrub(event.clientX);
          }}
          onPointerMove={(event) => {
            if (draggingRef.current) scrub(event.clientX);
          }}
          onPointerUp={(event) => {
            draggingRef.current = false;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            draggingRef.current = false;
          }}
          role="slider"
          tabIndex={0}
          aria-label="Voice update playback position"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(currentTime)}
        >
          {bars.map((bar, index) => (
            <span
              key={bar.id}
              className="w-0.5 shrink-0 rounded-full"
              style={{
                height: `${bar.height * 100}%`,
                background:
                  index / (BAR_COUNT - 1) <= progress
                    ? "var(--foreground)"
                    : "color-mix(in oklch, var(--foreground) 20%, transparent)",
              }}
            />
          ))}
          <motion.span
            className="absolute top-0 h-full w-0.5 -translate-x-1/2 rounded-full bg-destructive"
            animate={{ left: `${progress * 100}%` }}
            transition={{ duration: 0.08, ease: "linear" }}
          />
        </div>

        <span className="w-20 text-right text-[11px] font-semibold tabular-nums text-muted-foreground">
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
      </div>
    </div>
  );
}
