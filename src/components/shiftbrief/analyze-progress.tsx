"use client";

import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr/CircleNotch";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

const STEPS = [
  "Reading worker updates",
  "Merging duplicate points",
  "Extracting tasks and risks",
  "Writing the handover brief",
];

export function AnalyzeProgress() {
  const [activeStep, setActiveStep] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveStep((step) => Math.min(step + 1, STEPS.length - 1));
    }, 1200);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="glass-tile rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold">
        <CircleNotchIcon className="animate-spin" weight="bold" />
        Generating combined brief…
      </div>
      <ol className="space-y-2.5">
        {STEPS.map((step, index) => {
          const done = index < activeStep;
          const current = index === activeStep;
          return (
            <li
              key={step}
              className="flex items-center gap-3 text-xs"
              aria-current={current ? "step" : undefined}
            >
              <span
                className={`grid size-5 shrink-0 place-items-center rounded-full border text-[10px] font-bold transition-colors ${
                  done
                    ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400"
                    : current
                      ? "border-foreground bg-foreground text-background"
                      : "border-border text-muted-foreground"
                }`}
              >
                {done ? "✓" : index + 1}
              </span>
              <span
                className={
                  current
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                }
              >
                {step}
              </span>
              {current && (
                <motion.span
                  className="ml-1 inline-block size-1.5 rounded-full bg-foreground"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY }}
                />
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
