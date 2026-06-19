"use client";

import {
  type CollisionDetection,
  closestCorners,
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { snapCenterToCursor } from "@dnd-kit/modifiers";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { taskStatusLabel } from "@/lib/shiftbrief/format";
import type { ShiftTask, TaskStatus } from "@/lib/shiftbrief/types";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";

const COLUMNS: TaskStatus[] = ["todo", "in_progress", "done"];

const collisionDetection: CollisionDetection = (args) => {
  const pointerCollisions = pointerWithin(args);

  return pointerCollisions.length > 0
    ? pointerCollisions
    : closestCorners(args);
};

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

function DraggableTaskCard({
  task,
  onStatusChange,
  pending,
}: {
  task: ShiftTask;
  onStatusChange: TasksBoardProps["onStatusChange"];
  pending: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: task.id,
      data: { type: "task", status: task.status },
      disabled: pending,
    });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
    >
      <TaskCard
        task={task}
        onStatusChange={onStatusChange}
        pending={pending}
        dragging={isDragging}
        dragHandleProps={{ attributes, listeners }}
      />
    </div>
  );
}

function TaskColumn({
  status,
  tasks,
  onStatusChange,
  pendingTaskId,
}: {
  status: TaskStatus;
  tasks: ShiftTask[];
  onStatusChange: TasksBoardProps["onStatusChange"];
  pendingTaskId?: string | null;
}) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column:${status}`,
    data: { type: "column", status },
  });

  return (
    <section
      ref={setNodeRef}
      className={cn(
        "min-h-40 space-y-3 rounded-2xl p-2 transition-colors",
        isOver && "bg-primary/8 ring-1 ring-primary/25",
      )}
    >
      <div className="flex items-center justify-between px-1">
        <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
          {taskStatusLabel(status)}
        </h2>
        <span className="text-xs tabular-nums text-muted-foreground">
          {tasks.length}
        </span>
      </div>
      <div className="space-y-3">
        <AnimatePresence initial={false}>
          {tasks.map((task) => (
            <motion.div
              key={task.id}
              layout
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 380, damping: 32 }}
            >
              <DraggableTaskCard
                task={task}
                onStatusChange={onStatusChange}
                pending={pendingTaskId === task.id}
              />
            </motion.div>
          ))}
        </AnimatePresence>
        {tasks.length === 0 && (
          <p
            className={cn(
              "rounded-2xl border border-dashed border-border px-3 py-8 text-center text-[11px] text-muted-foreground transition-colors",
              isOver && "border-primary/40 text-foreground",
            )}
          >
            Drop task here
          </p>
        )}
      </div>
    </section>
  );
}

export function TasksBoard({
  tasks,
  onStatusChange,
  pendingTaskId,
}: TasksBoardProps) {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);
  const [activeTaskWidth, setActiveTaskWidth] = useState<number | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor),
  );

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
  const activeTask = tasks.find((task) => task.id === activeTaskId) ?? null;

  function handleDragStart(event: DragStartEvent) {
    setActiveTaskId(String(event.active.id));
    setActiveTaskWidth(event.active.rect.current.initial?.width ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveTaskId(null);
    setActiveTaskWidth(null);
    if (!event.over) return;

    const task = tasks.find((item) => item.id === event.active.id);
    const nextStatus = event.over.data.current?.status as
      | TaskStatus
      | undefined;

    if (task && nextStatus && task.status !== nextStatus) {
      onStatusChange(task.id, nextStatus);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={handleDragStart}
      onDragCancel={() => {
        setActiveTaskId(null);
        setActiveTaskWidth(null);
      }}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-5">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <SummaryCard label="Total" count={tasks.length} />
          <SummaryCard label="To Do" count={counts.todo} />
          <SummaryCard label="In Progress" count={counts.in_progress} />
          <SummaryCard label="Done" count={counts.done} />
        </div>

        <div className="grid gap-2 lg:grid-cols-3">
          {COLUMNS.map((status) => (
            <TaskColumn
              key={status}
              status={status}
              tasks={tasks.filter((task) => task.status === status)}
              onStatusChange={onStatusChange}
              pendingTaskId={pendingTaskId}
            />
          ))}
        </div>
      </div>
      <DragOverlay modifiers={[snapCenterToCursor]}>
        {activeTask && (
          <div
            className="cursor-grabbing"
            style={{ width: activeTaskWidth ?? undefined }}
          >
            <TaskCard
              task={activeTask}
              onStatusChange={onStatusChange}
              pending
            />
          </div>
        )}
      </DragOverlay>
    </DndContext>
  );
}
