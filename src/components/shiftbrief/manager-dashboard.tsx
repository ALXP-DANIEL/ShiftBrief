"use client";

import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { useShiftRoom } from "@/hooks/use-shift-room";
import { analyzeShift } from "@/lib/shiftbrief/client";
import type { AnalyzeMode } from "@/lib/shiftbrief/types";
import { AnalyzeProgress } from "./analyze-progress";
import { CombinedBriefCard } from "./combined-brief-card";
import { RoomCodeBadge } from "./room-code-badge";
import { WorkerUpdateFeed } from "./worker-update-feed";

export function ManagerDashboard({ code }: { code: string }) {
  const { bundle, status, error, setBundle } = useShiftRoom(code, {
    poll: true,
    intervalMs: 4000,
  });

  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState<string | null>(null);
  const [lastAnalyze, setLastAnalyze] = useState<{
    mode: AnalyzeMode;
    warning?: string;
  } | null>(null);
  async function handleAnalyze(forceFallback = false) {
    if (analyzing || !bundle) return;
    setAnalyzeError(null);
    setAnalyzing(true);
    try {
      const result = await analyzeShift(code, forceFallback);
      setLastAnalyze({ mode: result.mode, warning: result.warning });
      setBundle((prev) =>
        prev
          ? {
              ...prev,
              brief: result.data,
              tasks: result.data.tasks,
              room: { ...prev.room, status: "brief_ready" },
            }
          : prev,
      );
    } catch (caught) {
      setAnalyzeError(
        caught instanceof Error ? caught.message : "Could not generate brief",
      );
    } finally {
      setAnalyzing(false);
    }
  }

  if (status === "loading" && !bundle) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading shift room…
        </CardContent>
      </Card>
    );
  }

  if (!bundle) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="space-y-4 py-10 text-center">
          <WarningCircleIcon
            size={32}
            weight="fill"
            className="mx-auto text-destructive"
          />
          <div>
            <p className="text-sm font-semibold">Shift room not found</p>
            <p className="text-xs text-muted-foreground">
              {error ?? "Check the room code."} <RoomCodeBadge code={code} />
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/briefs">Back to briefs</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { updates, brief } = bundle;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
      <section className="glass rounded-[1.75rem] p-5 text-foreground lg:sticky lg:top-28">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
              Incoming
            </p>
            <h2 className="mt-1 text-lg font-bold tracking-tight">
              Worker updates
            </h2>
          </div>
          <span className="glass-tile rounded-full px-3 py-1.5 text-xs font-bold tabular-nums">
            {updates.length}
          </span>
        </div>
        <div className="max-h-[calc(100dvh-13rem)] overflow-y-auto pr-1">
          <WorkerUpdateFeed updates={updates} />
        </div>
      </section>

      <div className="min-w-0 space-y-5">
        <section className="glass rounded-[1.75rem] p-5 text-foreground">
          {analyzing ? (
            <AnalyzeProgress />
          ) : (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
                  Combined handover
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {brief
                    ? "Regenerate the brief when new updates arrive."
                    : "Merge the team updates into one action-ready brief."}
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="lg"
                  className="rounded-full"
                  onClick={() => void handleAnalyze(false)}
                  disabled={updates.length === 0}
                >
                  <SparkleIcon weight="fill" />
                  {brief ? "Regenerate" : "Generate brief"}
                </Button>
                {updates.length > 0 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="lg"
                    className="rounded-full text-muted-foreground"
                    onClick={() => void handleAnalyze(true)}
                    title="Generate using the offline keyword parser"
                  >
                    Offline
                  </Button>
                )}
              </div>
            </div>
          )}
          {updates.length === 0 && (
            <p className="mt-3 text-xs text-muted-foreground">
              Collect at least one worker update before generating a brief.
            </p>
          )}
          {analyzeError && (
            <p className="mt-3 text-xs text-destructive" role="alert">
              {analyzeError}
            </p>
          )}
        </section>

        {brief && !analyzing && (
          <CombinedBriefCard
            brief={brief}
            shiftTitle={bundle.room.title}
            roomCode={bundle.room.code}
            mode={lastAnalyze?.mode}
            warning={lastAnalyze?.warning}
          />
        )}
      </div>
    </div>
  );
}
