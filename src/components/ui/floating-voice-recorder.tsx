"use client";

import {
  ArrowCounterClockwiseIcon,
  CaretRightIcon,
  CheckIcon,
  DownloadSimpleIcon,
  MicrophoneIcon,
  PauseIcon,
  PlayIcon,
  StopIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

type RecorderState = "idle" | "recording" | "recorded" | "error";

const spring = {
  type: "spring" as const,
  stiffness: 320,
  damping: 30,
  mass: 0.8,
};

const bars = [
  { id: "a", height: 12 },
  { id: "b", height: 20 },
  { id: "c", height: 30 },
  { id: "d", height: 18 },
  { id: "e", height: 36 },
  { id: "f", height: 24 },
  { id: "g", height: 32 },
  { id: "h", height: 16 },
  { id: "i", height: 28 },
  { id: "j", height: 20 },
  { id: "k", height: 34 },
  { id: "l", height: 14 },
];

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}

function getMimeType() {
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  return types.find((type) => MediaRecorder.isTypeSupported(type));
}

export function FloatingVoiceRecorder() {
  const [recorderState, setRecorderState] = useState<RecorderState>("idle");
  const [duration, setDuration] = useState(0);
  const [audioUrl, setAudioUrl] = useState<string>();
  const [error, setError] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackTime, setPlaybackTime] = useState(0);
  const [playbackDuration, setPlaybackDuration] = useState(0);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const scrubberRef = useRef<HTMLDivElement>(null);
  const isScrubbingRef = useRef(false);

  const releaseStream = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => {
      track.stop();
    });
    streamRef.current = null;
  }, []);

  const clearRecording = useCallback(() => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(undefined);
    setDuration(0);
    setIsPlaying(false);
    setPlaybackTime(0);
    setPlaybackDuration(0);
    setError("");
    setRecorderState("idle");
  }, [audioUrl]);

  useEffect(() => {
    if (recorderState !== "recording") return;

    const timer = window.setInterval(() => {
      setDuration((current) => current + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [recorderState]);

  useEffect(() => {
    return () => {
      releaseStream();
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl, releaseStream]);

  const startRecording = async () => {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      setError("Voice recording is not supported in this browser.");
      setRecorderState("error");
      return;
    }

    try {
      setError("");
      setDuration(0);
      chunksRef.current = [];

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = getMimeType();
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );

      streamRef.current = stream;
      recorderRef.current = recorder;

      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });

      recorder.addEventListener("stop", () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        setAudioUrl(URL.createObjectURL(blob));
        setRecorderState("recorded");
        releaseStream();
      });

      recorder.start();
      setRecorderState("recording");
    } catch {
      releaseStream();
      setError("Microphone access was denied. Allow access and try again.");
      setRecorderState("error");
    }
  };

  const stopRecording = () => {
    if (recorderRef.current?.state === "recording") {
      recorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") {
      recorder.ondataavailable = null;
      recorder.onstop = null;
      recorder.stop();
    }
    chunksRef.current = [];
    releaseStream();
    clearRecording();
  };

  const togglePlayback = async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      await audio.play();
    } else {
      audio.pause();
    }
  };

  const seekFromPointer = (clientX: number) => {
    const audio = audioRef.current;
    const scrubber = scrubberRef.current;
    if (!audio || !scrubber || playbackDuration <= 0) return;

    const bounds = scrubber.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (clientX - bounds.left) / bounds.width),
    );
    const nextTime = ratio * playbackDuration;
    audio.currentTime = nextTime;
    setPlaybackTime(nextTime);
  };

  const handleScrubStart = (event: React.PointerEvent<HTMLDivElement>) => {
    isScrubbingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    seekFromPointer(event.clientX);
  };

  const handleScrubMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbingRef.current) seekFromPointer(event.clientX);
  };

  const handleScrubEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isScrubbingRef.current) return;
    isScrubbingRef.current = false;
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const playbackProgress =
    playbackDuration > 0 ? playbackTime / playbackDuration : 0;

  return (
    <motion.aside
      layout
      transition={spring}
      className="fixed right-4 bottom-5 z-50 max-w-[calc(100vw-2rem)]"
      aria-label="Voice recorder"
    >
      <motion.div
        layout
        transition={spring}
        className="glass overflow-hidden rounded-[1.75rem]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {recorderState === "idle" ? (
            <motion.button
              key="idle"
              layout
              type="button"
              onClick={startRecording}
              whileTap={{ scale: 0.92 }}
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={spring}
              className="group flex size-14 items-center justify-center rounded-full text-foreground"
              aria-label="Start voice recording"
            >
              <MicrophoneIcon
                size={23}
                weight="fill"
                className="transition-transform group-hover:scale-110"
              />
            </motion.button>
          ) : recorderState === "recording" ? (
            <motion.div
              key="recording"
              layout
              initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              transition={spring}
              className="flex h-14 items-center gap-3 px-2"
            >
              <button
                type="button"
                onClick={cancelRecording}
                className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
                aria-label="Cancel recording"
              >
                <XIcon size={18} weight="bold" />
              </button>

              <div className="flex min-w-32 items-center gap-3 sm:min-w-44">
                <span className="size-2.5 shrink-0 animate-pulse rounded-full bg-red-500" />
                <span className="w-10 text-xs font-semibold tabular-nums">
                  {formatDuration(duration)}
                </span>
                <div
                  className="flex h-8 flex-1 items-center justify-center gap-0.5"
                  aria-hidden="true"
                >
                  {bars.map((bar, index) => (
                    <span
                      key={bar.id}
                      className="voice-wave-bar w-0.5 rounded-full bg-foreground/70"
                      style={{
                        height: bar.height,
                        animationDelay: `${index * -90}ms`,
                      }}
                    />
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={stopRecording}
                className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
                aria-label="Stop recording"
              >
                <StopIcon size={15} weight="fill" />
              </button>
            </motion.div>
          ) : recorderState === "recorded" ? (
            <motion.div
              key="recorded"
              layout
              initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              transition={spring}
              className="w-[min(28rem,calc(100vw-2rem))] space-y-3 p-3"
            >
              {/* A fresh user recording has no transcript track to attach. */}
              {/* biome-ignore lint/a11y/useMediaCaption: local voice preview */}
              <audio
                ref={audioRef}
                src={audioUrl}
                onLoadedMetadata={(event) => {
                  const mediaDuration = event.currentTarget.duration;
                  if (Number.isFinite(mediaDuration)) {
                    setPlaybackDuration(mediaDuration);
                  }
                }}
                onDurationChange={(event) => {
                  const mediaDuration = event.currentTarget.duration;
                  if (Number.isFinite(mediaDuration)) {
                    setPlaybackDuration(mediaDuration);
                  }
                }}
                onTimeUpdate={(event) => {
                  if (!isScrubbingRef.current) {
                    setPlaybackTime(event.currentTarget.currentTime);
                  }
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  setPlaybackTime(0);
                }}
              />
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={clearRecording}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-foreground transition-transform hover:scale-105"
                  aria-label="Close voice preview"
                >
                  <CaretRightIcon size={17} weight="bold" />
                </button>

                <div className="flex min-w-0 flex-1 items-center gap-3 rounded-full border border-foreground/10 bg-foreground/5 px-4 py-2.5">
                  <span className="size-2 shrink-0 rounded-full bg-red-500" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">Voice note</p>
                    <p className="text-[10px] text-muted-foreground">
                      Ready to preview
                    </p>
                  </div>
                  <span className="ml-auto text-xs font-semibold tabular-nums">
                    {formatDuration(
                      Math.ceil(playbackDuration || Math.max(duration, 1)),
                    )}
                  </span>
                </div>

                <div className="flex shrink-0 items-center gap-1">
                  <a
                    href={audioUrl}
                    download={`voice-note-${Date.now()}.webm`}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-foreground/8 hover:text-foreground"
                    aria-label="Download recording"
                  >
                    <DownloadSimpleIcon size={18} weight="bold" />
                  </a>
                  <button
                    type="button"
                    onClick={clearRecording}
                    className="flex size-9 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-red-500/10 hover:text-red-500"
                    aria-label="Delete recording"
                  >
                    <TrashIcon size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={clearRecording}
                    className="flex size-9 items-center justify-center rounded-full bg-foreground text-background"
                    aria-label="Use recording"
                  >
                    <CheckIcon size={17} weight="bold" />
                  </button>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <motion.button
                  type="button"
                  onClick={togglePlayback}
                  whileTap={{ scale: 0.9 }}
                  transition={spring}
                  className="mt-7 flex size-10 shrink-0 items-center justify-center rounded-full border border-foreground/10 bg-foreground/5 text-foreground"
                  aria-label={isPlaying ? "Pause recording" : "Play recording"}
                >
                  {isPlaying ? (
                    <PauseIcon size={15} weight="fill" />
                  ) : (
                    <PlayIcon
                      size={15}
                      weight="fill"
                      className="translate-x-px"
                    />
                  )}
                </motion.button>

                <div className="relative min-w-0 flex-1 pt-7">
                  <motion.div
                    className="pointer-events-none absolute top-0 z-10 -translate-x-1/2 rounded-full bg-white px-3 py-1.5 text-xs font-semibold whitespace-nowrap text-[#14151a] shadow-[0_4px_14px_-4px_rgba(0,0,0,0.4)]"
                    animate={{
                      left: `${Math.min(1, Math.max(0.03, playbackProgress)) * 100}%`,
                    }}
                    transition={{
                      type: "tween",
                      duration: 0.08,
                      ease: "linear",
                    }}
                  >
                    {formatDuration(Math.floor(playbackTime))}
                  </motion.div>

                  <div
                    ref={scrubberRef}
                    role="slider"
                    tabIndex={0}
                    aria-label="Recording playback position"
                    aria-valuemin={0}
                    aria-valuemax={Math.round(playbackDuration)}
                    aria-valuenow={Math.round(playbackTime)}
                    onPointerDown={handleScrubStart}
                    onPointerMove={handleScrubMove}
                    onPointerUp={handleScrubEnd}
                    onPointerCancel={handleScrubEnd}
                    onKeyDown={(event) => {
                      const audio = audioRef.current;
                      if (!audio || playbackDuration <= 0) return;
                      if (
                        event.key !== "ArrowLeft" &&
                        event.key !== "ArrowRight"
                      ) {
                        return;
                      }
                      event.preventDefault();
                      const direction = event.key === "ArrowRight" ? 1 : -1;
                      const nextTime = Math.min(
                        playbackDuration,
                        Math.max(0, audio.currentTime + direction),
                      );
                      audio.currentTime = nextTime;
                      setPlaybackTime(nextTime);
                    }}
                    className="relative flex h-11 cursor-pointer touch-none items-center justify-between outline-none"
                  >
                    {bars.map((bar, index) => {
                      const barProgress = index / (bars.length - 1);
                      return (
                        <span
                          key={bar.id}
                          className="w-0.5 shrink-0 rounded-full transition-colors duration-100"
                          style={{
                            height: `${35 + (bar.height / 36) * 65}%`,
                            background:
                              barProgress <= playbackProgress
                                ? "var(--foreground)"
                                : "color-mix(in oklch, var(--foreground) 20%, transparent)",
                          }}
                        />
                      );
                    })}

                    <motion.span
                      className="pointer-events-none absolute top-0 h-full w-0.5 -translate-x-1/2 rounded-full bg-red-500"
                      animate={{ left: `${playbackProgress * 100}%` }}
                      transition={{
                        type: "tween",
                        duration: 0.08,
                        ease: "linear",
                      }}
                    />
                  </div>

                  <div className="mt-1 flex justify-between text-[10px] font-semibold tabular-nums text-muted-foreground">
                    <span>0:00</span>
                    <span>
                      {formatDuration(
                        Math.ceil(playbackDuration || Math.max(duration, 1)),
                      )}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="error"
              layout
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={spring}
              className="flex min-h-14 max-w-sm items-center gap-2 px-3 py-2"
            >
              <p className="flex-1 text-xs leading-relaxed text-foreground">
                {error}
              </p>
              <button
                type="button"
                onClick={startRecording}
                className="flex size-9 shrink-0 items-center justify-center rounded-full bg-foreground text-background"
                aria-label="Try recording again"
              >
                <ArrowCounterClockwiseIcon size={17} weight="bold" />
              </button>
              <button
                type="button"
                onClick={clearRecording}
                className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground"
                aria-label="Close error"
              >
                <XIcon size={17} weight="bold" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.aside>
  );
}
