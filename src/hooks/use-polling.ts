"use client";

import { useEffect, useRef } from "react";

type UsePollingOptions = {
  /** Interval in milliseconds. */
  intervalMs?: number;
  /** When false, polling is paused. */
  enabled?: boolean;
  /** Pause polling while the tab is hidden (default true). */
  pauseWhenHidden?: boolean;
};

/**
 * Call `callback` on a fixed interval while enabled. The latest callback is
 * always used (no stale closures), and polling pauses on hidden tabs.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  {
    intervalMs = 4000,
    enabled = true,
    pauseWhenHidden = true,
  }: UsePollingOptions = {},
) {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (!enabled) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const tick = () => {
      if (pauseWhenHidden && document.visibilityState === "hidden") return;
      void savedCallback.current();
    };

    const start = () => {
      if (timer === null) timer = setInterval(tick, intervalMs);
    };
    const stop = () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    };

    start();

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        // Refresh immediately when returning to the tab.
        void savedCallback.current();
        start();
      } else if (pauseWhenHidden) {
        stop();
      }
    };

    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [enabled, intervalMs, pauseWhenHidden]);
}
