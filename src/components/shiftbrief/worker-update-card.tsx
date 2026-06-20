"use client";

import { KeyboardIcon } from "@phosphor-icons/react/dist/ssr/Keyboard";
import { MicrophoneIcon } from "@phosphor-icons/react/dist/ssr/Microphone";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/shadcn/badge";
import { fetchUpdateAudio } from "@/lib/shiftbrief/client";
import { relativeTime } from "@/lib/shiftbrief/format";
import type { UpdateSource, WorkerUpdate } from "@/lib/shiftbrief/types";
import { AudioScrubber } from "./audio-scrubber";

const SOURCE_META: Record<
  UpdateSource,
  { label: string; Icon: typeof MicrophoneIcon }
> = {
  speech: { label: "Voice", Icon: MicrophoneIcon },
  paste: { label: "Typed", Icon: KeyboardIcon },
  seed: { label: "Demo", Icon: SparkleIcon },
};

function initials(name: string): string {
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function WorkerUpdateCard({ update }: { update: WorkerUpdate }) {
  const meta = SOURCE_META[update.source] ?? SOURCE_META.paste;
  const { Icon } = meta;
  const [audioSrc, setAudioSrc] = useState<string | null>(null);

  // Fetch the voice note once, on demand — never in the polled list payload.
  useEffect(() => {
    if (!update.hasAudio) return;
    let active = true;
    fetchUpdateAudio(update.id).then((src) => {
      if (active) setAudioSrc(src);
    });
    return () => {
      active = false;
    };
  }, [update.hasAudio, update.id]);

  return (
    <article className="glass-tile rounded-2xl p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-bold text-foreground">
          {initials(update.workerName) || "?"}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="text-sm font-semibold">{update.workerName}</span>
            <span className="text-xs text-muted-foreground">{update.role}</span>
            <Badge variant="muted" className="ml-auto">
              <Icon weight="fill" />
              {meta.label}
            </Badge>
          </div>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
            {update.transcript}
          </p>
          {audioSrc && <AudioScrubber src={audioSrc} />}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {relativeTime(update.createdAt)}
          </p>
        </div>
      </div>
    </article>
  );
}
