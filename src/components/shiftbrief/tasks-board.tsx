"use client";

import { AnimatePresence, motion } from "motion/react";
import { taskStatusLabel } from "@/lib/shiftbrief/format";
import type { ShiftTask, TaskStatus } from "@/lib/shiftbrief/types";
import { TaskCard } from "./task-card";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

type TasksBoardProps = {
  tasks: ShiftTask[];
  onStatusChange: (taskId: string, status: TaskStatus) => void;
  pendingTaskId?: string | null;
};

function SummaryCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="glass-tile rounded-2xl px-4 py-3 text-center">
      <p className="text-2xl font-bold tabular-nums">{count}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </div>
  );
}

export function TasksBoard({
  tasks,
  onStatusChange,
  pendingTaskId,
}: TasksBoardProps) {
  if (tasks.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-12 text-center">
        <p className="text-sm font-medium">No tasks yet</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
          Generate a combined brief from the manager dashboard to extract tasks.
        </p>
      </div>
    );
  }

  const counts: Record<TaskStatus, number> = {
    todo: tasks.filter((task) => task.status === "todo").length,
    in_progress: tasks.filter((task) => task.status === "in_progress").length,
    done: tasks.filter((task) => task.status === "done").length,
  };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <SummaryCard label="Total" count={tasks.length} />
        <SummaryCard label="To Do" count={counts.todo} />
        <SummaryCard label="In Progress" count={counts.in_progress} />
        <SummaryCard label="Done" count={counts.done} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {COLUMNS.map((status) => {
          const columnTasks = tasks.filter((task) => task.status === status);
          return (
            <section key={status} className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold tracking-wide uppercase text-muted-foreground">
                  {taskStatusLabel(status)}
                </h2>
                <span className="text-xs tabular-nums text-muted-foreground">
                  {columnTasks.length}
                </span>
              </div>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                  {columnTasks.map((task) => (
                    <motion.div
                      key={task.id}
                      layout
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    >
                      <TaskCard
                        task={task}
                        onStatusChange={onStatusChange}
                        pending={pendingTaskId === task.id}
                      />
                    </motion.div>
                  ))}
                </AnimatePresence>
                {columnTasks.length === 0 && (
                  <p className="rounded-2xl border border-dashed border-border px-3 py-6 text-center text-[11px] text-muted-foreground">
                    Nothing here
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
