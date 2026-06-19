"use client";

import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { Card, CardContent } from "@/components/ui/shadcn/card";
import { useShiftRoom } from "@/hooks/use-shift-room";
import { updateTaskStatus } from "@/lib/shiftbrief/client";
import type { TaskStatus } from "@/lib/shiftbrief/types";
import { RoomCodeBadge } from "./room-code-badge";
import { TasksBoard } from "./tasks-board";

export function TasksView({ code }: { code: string }) {
  const { bundle, status, error, refresh, setBundle } = useShiftRoom(code, {
    poll: true,
    intervalMs: 5000,
  });
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);

  async function handleStatusChange(taskId: string, next: TaskStatus) {
    setPendingTaskId(taskId);
    setBundle((prev) =>
      prev
        ? {
            ...prev,
            tasks: prev.tasks.map((task) =>
              task.id === taskId ? { ...task, status: next } : task,
            ),
            brief: prev.brief
              ? {
                  ...prev.brief,
                  tasks: prev.brief.tasks.map((task) =>
                    task.id === taskId ? { ...task, status: next } : task,
                  ),
                }
              : prev.brief,
          }
        : prev,
    );
    try {
      await updateTaskStatus(taskId, next);
    } catch {
      // Revert to server truth on failure.
      await refresh();
    } finally {
      setPendingTaskId(null);
    }
  }

  if (status === "loading" && !bundle) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          Loading tasks…
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
            <Link href="/tasks">Back to tasks</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { tasks } = bundle;

  return (
    <div className="space-y-5">
      <Card className="px-1 sm:px-2">
        <CardContent>
          <TasksBoard
            tasks={tasks}
            onStatusChange={handleStatusChange}
            pendingTaskId={pendingTaskId}
          />
        </CardContent>
      </Card>
    </div>
  );
}
