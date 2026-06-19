"use client";

import { UserIcon } from "@phosphor-icons/react/dist/ssr/User";
import { taskStatusLabel } from "@/lib/shiftbrief/format";
import type { ShiftTask, TaskStatus } from "@/lib/shiftbrief/types";
import { cn } from "@/lib/utils";
import { PriorityBadge } from "./badges";

const STATUS_ORDER: TaskStatus[] = ["todo", "in_progress", "done"];

type TaskCardProps = {
  task: ShiftTask;
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  pending?: boolean;
};

export function TaskCard({ task, onStatusChange, pending }: TaskCardProps) {
  return (
    <article
      className={cn(
        "glass-tile rounded-2xl p-3.5 transition-opacity",
        pending && "opacity-60",
        task.status === "done" && "opacity-80",
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <p
          className={cn(
            "text-sm font-medium",
            task.status === "done" &&
              "line-through decoration-muted-foreground",
          )}
        >
          {task.title}
        </p>
        <PriorityBadge priority={task.priority} />
      </div>

      {task.reason && (
        <p className="mt-1.5 text-xs text-muted-foreground">{task.reason}</p>
      )}

      {task.owner && (
        <p className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground">
          <UserIcon size={12} weight="fill" />
          {task.owner}
        </p>
      )}

      <fieldset
        className="mt-3 grid grid-cols-3 gap-1 rounded-full border border-border p-0.5"
        aria-label="Task status"
      >
        {STATUS_ORDER.map((status) => {
          const active = task.status === status;
          return (
            <button
              key={status}
              type="button"
              disabled={pending || active}
              onClick={() => onStatusChange(task.id, status)}
              className={cn(
                "rounded-full px-1.5 py-1 text-[10px] font-semibold transition-colors disabled:cursor-default",
                active
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              {taskStatusLabel(status)}
            </button>
          );
        })}
      </fieldset>
    </article>
  );
}
