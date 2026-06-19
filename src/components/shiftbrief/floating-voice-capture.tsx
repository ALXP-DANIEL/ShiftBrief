"use client";

import { KeyboardIcon } from "@phosphor-icons/react/dist/ssr/Keyboard";
import { MicrophoneIcon } from "@phosphor-icons/react/dist/ssr/Microphone";
import { StopIcon } from "@phosphor-icons/react/dist/ssr/Stop";
import { AnimatePresence, motion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSpeechRecognition } from "@/hooks/use-speech-recognition";

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
  { id: "j", height: 22 },
];

function formatDuration(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

type FloatingVoiceCaptureProps = {
  /** Called with each finalized chunk of recognized speech. */
  onTranscript: (finalText: string) => void;
  onAudioReady?: (audioDataUrl: string) => void;
  onType: () => void;
  /** Fired when the user taps Stop (or capacity is reached) — open the review. */
  onStop?: () => void;
  /** When true, recording auto-stops (transcript hit the database limit). */
  atCapacity?: boolean;
  disabled?: boolean;
  dockToBottom?: boolean;
};

/**
 * Floating glass mic widget that turns speech into transcript text via the
 * Web Speech API. It never records or stores audio — only the recognized text
 * is emitted to `onTranscript`. Renders nothing if speech isn't supported.
 */
export function FloatingVoiceCapture({
  onTranscript,
  onAudioReady,
  onType,
  onStop,
  atCapacity = false,
  disabled,
  dockToBottom = false,
}: FloatingVoiceCaptureProps) {
  const [duration, setDuration] = useState(0);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const { supported, listening, interim, error, start, stop } =
    useSpeechRecognition({ onResult: onTranscript });

  const stopAudioRecording = useCallback(() => {
    const recorder = recorderRef.current;
    if (recorder?.state === "recording") recorder.stop();
  }, []);

  useEffect(() => {
    if (!listening) return;
    setDuration(0);
    const timer = window.setInterval(() => {
      setDuration((current) => current + 1);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [listening]);

  useEffect(() => {
    if (disabled && listening) {
      stop();
      stopAudioRecording();
    }
  }, [disabled, listening, stop, stopAudioRecording]);

  const handleStart = useCallback(async () => {
    if (disabled) return;
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) {
      start();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = [
        "audio/webm;codecs=opus",
        "audio/webm",
        "audio/mp4",
      ].find((type) => MediaRecorder.isTypeSupported(type));
      const recorder = new MediaRecorder(
        stream,
        mimeType ? { mimeType } : undefined,
      );
      chunksRef.current = [];
      streamRef.current = stream;
      recorderRef.current = recorder;
      recorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      });
      recorder.addEventListener("stop", () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || "audio/webm",
        });
        const reader = new FileReader();
        reader.addEventListener("load", () => {
          if (typeof reader.result === "string") onAudioReady?.(reader.result);
        });
        reader.readAsDataURL(blob);
        stream.getTracks().forEach((track) => {
          track.stop();
        });
        streamRef.current = null;
        recorderRef.current = null;
      });
      recorder.start();
      start();
    } catch {
      start();
    }
  }, [disabled, onAudioReady, start]);

  const handleStop = useCallback(() => {
    stop();
    stopAudioRecording();
    onStop?.();
  }, [stop, stopAudioRecording, onStop]);

  // Auto-stop when the transcript reaches the database limit.
  useEffect(() => {
    if (atCapacity && listening) handleStop();
  }, [atCapacity, listening, handleStop]);

  useEffect(() => {
    return () => {
      stopAudioRecording();
      streamRef.current?.getTracks().forEach((track) => {
        track.stop();
      });
    };
  }, [stopAudioRecording]);

  return (
    <motion.aside
      layout
      transition={spring}
      className={
        dockToBottom
          ? "fixed right-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 max-w-[calc(100vw-2.5rem)] sm:right-6 lg:right-10 lg:bottom-8 xl:right-16"
          : "fixed right-5 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 max-w-[calc(100vw-2.5rem)] sm:right-6 lg:right-10 lg:bottom-8 xl:right-16"
      }
      aria-label="Voice to transcript"
    >
      <motion.div
        layout
        transition={spring}
        className="glass overflow-hidden rounded-[1.75rem]"
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {!listening ? (
            <motion.div
              key="idle"
              layout
              initial={{ opacity: 0, filter: "blur(8px)" }}
              animate={{ opacity: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, filter: "blur(8px)" }}
              transition={spring}
              className="flex h-14 items-center text-foreground"
            >
              {supported && (
                <>
                  <motion.button
                    type="button"
                    onClick={handleStart}
                    disabled={disabled}
                    whileTap={{ scale: 0.9 }}
                    className="group grid size-14 place-items-center disabled:opacity-50"
                    aria-label="Record voice update"
                    title="Voice update"
                  >
                    <MicrophoneIcon
                      size={23}
                      weight="fill"
                      className="transition-transform group-hover:scale-110"
                    />
                  </motion.button>
                  <span className="h-7 w-px bg-border" />
                </>
              )}
              <motion.button
                type="button"
                onClick={onType}
                disabled={disabled}
                whileTap={{ scale: 0.9 }}
                className="group grid size-14 place-items-center disabled:opacity-50"
                aria-label="Type shift update"
                title="Type update"
              >
                <KeyboardIcon
                  size={23}
                  weight="fill"
                  className="transition-transform group-hover:scale-110"
                />
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              key="listening"
              layout
              initial={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.96, filter: "blur(8px)" }}
              transition={spring}
              className="w-[min(22rem,calc(100vw-2rem))] space-y-2 p-3"
            >
              <div className="flex items-center gap-3">
                <div className="flex min-w-0 flex-1 items-center gap-3">
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
                  onClick={handleStop}
                  className="flex size-10 shrink-0 items-center justify-center rounded-full bg-foreground text-background transition-transform hover:scale-105"
                  aria-label="Stop and use transcript"
                >
                  <StopIcon size={15} weight="fill" />
                </button>
              </div>

              <p className="px-1 text-[11px] leading-relaxed text-muted-foreground">
                {interim ? (
                  <span className="italic text-foreground/80">{interim}</span>
                ) : (
                  "Listening… talk as long as you need, then tap stop to review."
                )}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {error && (
        <p className="mt-2 max-w-[min(22rem,calc(100vw-2rem))] rounded-full bg-background/80 px-3 py-1.5 text-[11px] text-destructive shadow-sm backdrop-blur">
          {error}
        </p>
      )}
    </motion.aside>
  );
}
