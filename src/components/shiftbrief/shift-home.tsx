"use client";

import { useEffect, useRef, useState } from "react";
import { useAppAccess } from "@/components/layouts/app-access-gate";
import { Card, CardContent, CardHeader } from "@/components/ui/shadcn/card";
import { useShiftRoom } from "@/hooks/use-shift-room";
import type { AppRole } from "@/lib/shiftbrief/access";
import type { TeamType } from "@/lib/shiftbrief/types";
import { TeamTypeBadge } from "./badges";
import { CopyButton } from "./copy-button";
import { HomeVoiceUpdate } from "./home-voice-update";
import { RoomCodeBadge } from "./room-code-badge";

const TEAM_HEADLINES: Record<TeamType, string[]> = {
  cafe: [
    "A smooth service starts with a clear handover.",
    "Small details make the next rush easier.",
  ],
  retail: [
    "Keep the floor ready and the next team confident.",
    "Every clear update keeps the day moving.",
  ],
  repair_shop: [
    "Leave the next technician a clear path forward.",
    "Good notes turn unfinished work into an easy start.",
  ],
  cleaning: [
    "A clear handover keeps every space on track.",
    "Finish strong so the next team can start stronger.",
  ],
  event: [
    "Great events run on teams that stay in sync.",
    "Pass the details forward and keep the momentum.",
  ],
  warehouse: [
    "Clear updates keep every handoff moving safely.",
    "Accuracy now saves time on the next shift.",
  ],
  homestay: [
    "Thoughtful handovers create smoother guest stays.",
    "Leave the next host ready for every arrival.",
  ],
  other: [
    "Clear updates make the next shift easier.",
    "Strong teams leave useful context behind.",
  ],
};

function contextualHeadline({
  role,
  teamType,
  updateCount,
  hour,
}: {
  role: AppRole | null;
  teamType: TeamType;
  updateCount: number;
  hour: number | null;
}) {
  if (role === "worker" && updateCount === 0) {
    return "What should the next shift know?";
  }
  if (role === "admin" && updateCount === 0) {
    return "Give your team a clear place to start.";
  }
  if (updateCount >= 5) {
    return "The team has spoken. Turn the details into direction.";
  }
  if (hour !== null && hour < 10) {
    return "Start clear, stay focused, and keep the shift moving.";
  }
  if (hour !== null && hour >= 18) {
    return "Finish strong and leave the next team ready.";
  }

  const messages = TEAM_HEADLINES[teamType];
  return messages[updateCount % messages.length];
}

function useLocalTime() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    function syncTime() {
      setTime(new Date());
    }

    syncTime();
    const timer = window.setInterval(syncTime, 1_000);
    return () => window.clearInterval(timer);
  }, []);

  return {
    hour: time?.getHours() ?? null,
    hours: time?.getHours().toString().padStart(2, "0") ?? "--",
    minutes: time?.getMinutes().toString().padStart(2, "0") ?? "--",
  };
}

export function ShiftHome({ code }: { code: string }) {
  const { role } = useAppAccess();
  const { bundle, refresh } = useShiftRoom(code, {
    poll: role === "admin",
    intervalMs: 4000,
  });
  const time = useLocalTime();
  const [aiHeadline, setAiHeadline] = useState<string | null>(null);
  const [joinUrl, setJoinUrl] = useState(`/join/${code}`);
  const requestedContext = useRef("");
  const roomTitle = bundle?.room.title ?? "Loading your shift…";
  const updateCount = bundle?.updates.length ?? 0;
  const fallbackHeadline = contextualHeadline({
    role,
    teamType: bundle?.room.teamType ?? "other",
    updateCount,
    hour: time.hour,
  });
  const contextVersion = bundle
    ? [
        bundle.updates.at(-1)?.id,
        bundle.brief?.updatedAt,
        bundle.tasks.map((task) => `${task.id}:${task.status}`).join(","),
      ].join(":")
    : "";

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/join/${code}`);
  }, [code]);

  useEffect(() => {
    if (updateCount === 0) {
      setAiHeadline(null);
      return;
    }
    if (requestedContext.current === contextVersion) return;
    requestedContext.current = contextVersion;

    const controller = new AbortController();
    fetch(`/api/shifts/${encodeURIComponent(code)}/headline`, {
      signal: controller.signal,
      cache: "no-store",
    })
      .then(async (response) => {
        if (!response.ok) return null;
        return (await response.json()) as {
          data?: { headline?: string };
        };
      })
      .then((payload) => {
        if (payload?.data?.headline) setAiHeadline(payload.data.headline);
      })
      .catch(() => {
        requestedContext.current = "";
      });

    return () => controller.abort();
  }, [code, contextVersion, updateCount]);

  return (
    <main className="relative flex min-h-dvh w-full flex-col overflow-x-hidden text-[var(--shift-home-text)]">
      <div
        className={
          role === "worker"
            ? "relative z-20 flex min-h-dvh flex-1 flex-col px-5 pt-[max(6.5rem,calc(env(safe-area-inset-top)+5.5rem))] pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:px-6 lg:px-10 lg:pt-24 lg:pb-8 xl:px-16"
            : "relative z-20 flex min-h-dvh flex-1 flex-col px-5 pt-[max(5rem,calc(env(safe-area-inset-top)+4.5rem))] pb-24 sm:px-6 lg:px-10 lg:pt-24 lg:pb-8 xl:px-16"
        }
      >
        <header className="max-w-4xl">
          <h1 className="text-[clamp(2.75rem,7vw,6.5rem)] leading-[0.95] font-bold tracking-[-0.055em] text-balance lg:text-[clamp(3.5rem,5vw,5rem)]">
            {aiHeadline ?? fallbackHeadline}
          </h1>
        </header>

        <div className="min-h-20 flex-1" />

        <section className="grid items-end gap-6">
          <div className="min-w-0">
            <div className="flex items-start font-sans text-[clamp(5.5rem,18vw,13rem)] leading-[0.72] font-semibold tracking-[-0.1em] tabular-nums lg:text-[clamp(7rem,12vw,10rem)]">
              <span>{time.hours}</span>
              <span className="mx-[0.035em] -translate-y-[0.06em] font-light opacity-40">
                :
              </span>
              <span>{time.minutes}</span>
            </div>

            {bundle && (
              <Card className="mt-7 w-full max-w-2xl gap-0 overflow-hidden py-0">
                <div className="flex flex-col sm:flex-row sm:items-stretch">
                  <CardHeader className="flex-1 justify-center px-5 py-5 sm:px-6">
                    <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                      Active room
                    </p>
                    <h2 className="mt-1 truncate text-xl font-bold tracking-[-0.035em] sm:text-2xl">
                      {roomTitle}
                    </h2>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <TeamTypeBadge teamType={bundle.room.teamType} />
                      <span className="text-[11px] text-muted-foreground">
                        Room code
                      </span>
                      <RoomCodeBadge code={bundle.room.code} />
                    </div>
                  </CardHeader>

                  <CardContent className="flex items-center border-t border-border/60 px-5 py-4 sm:min-w-52 sm:border-t-0 sm:border-l sm:px-6">
                    <div className="grid w-full gap-2">
                      <CopyButton
                        value={joinUrl}
                        label="Share room link"
                        copiedLabel="Link copied"
                        variant="default"
                        size="default"
                        className="w-full justify-start px-4"
                      />
                      <CopyButton
                        value={bundle.room.code}
                        label={`Copy code · ${bundle.room.code}`}
                        copiedLabel="Code copied"
                        variant="outline"
                        size="default"
                        className="w-full justify-start px-4"
                      />
                    </div>
                  </CardContent>
                </div>
              </Card>
            )}
          </div>
        </section>

        {role === "worker" && (
          <HomeVoiceUpdate
            code={code}
            appRole={role}
            onSubmitted={() => void refresh()}
          />
        )}
      </div>
    </main>
  );
}
