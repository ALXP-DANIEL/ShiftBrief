"use client";

import { UsersThreeIcon } from "@phosphor-icons/react/dist/ssr/UsersThree";
import { AnimatePresence, motion } from "motion/react";
import type { WorkerUpdate } from "@/lib/shiftbrief/types";
import { WorkerUpdateCard } from "./worker-update-card";

export function WorkerUpdateFeed({ updates }: { updates: WorkerUpdate[] }) {
  if (updates.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted/20 px-4 py-10 text-center">
        <UsersThreeIcon
          size={28}
          className="mx-auto mb-3 text-muted-foreground"
        />
        <p className="text-sm font-medium">No worker updates yet</p>
        <p className="mx-auto mt-1 max-w-xs text-xs text-muted-foreground">
          Share the room code or join link. Updates from any device will appear
          here automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence initial={false}>
        {updates.map((update) => (
          <motion.div
            key={update.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ type: "spring", stiffness: 360, damping: 30 }}
          >
            <WorkerUpdateCard update={update} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
