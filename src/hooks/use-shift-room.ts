"use client";

import { useCallback, useEffect, useState } from "react";
import { fetchBundle } from "@/lib/shiftbrief/client";
import type { ShiftBundle } from "@/lib/shiftbrief/types";
import { usePolling } from "./use-polling";

type Status = "loading" | "ready" | "error";

type UseShiftRoomOptions = {
  poll?: boolean;
  intervalMs?: number;
};

/**
 * Load a shift bundle by code and keep it fresh with polling + manual refresh.
 * `setBundle` is exposed for optimistic UI updates (e.g. task status changes).
 */
export function useShiftRoom(
  code: string,
  { poll = true, intervalMs = 4000 }: UseShiftRoomOptions = {},
) {
  const [bundle, setBundle] = useState<ShiftBundle | null>(null);
  const [status, setStatus] = useState<Status>("loading");
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const data = await fetchBundle(code);
      setBundle(data);
      setStatus("ready");
      setError(null);
      setLastSyncedAt(Date.now());
    } catch (caught) {
      const message =
        caught instanceof Error ? caught.message : "Failed to load shift";
      setError(message);
      // Only flip to a hard error state if we never loaded any data.
      setStatus((prev) => (prev === "ready" ? "ready" : "error"));
    } finally {
      setIsRefreshing(false);
    }
  }, [code]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  usePolling(refresh, { enabled: poll, intervalMs });

  return {
    bundle,
    status,
    error,
    isRefreshing,
    lastSyncedAt,
    refresh,
    setBundle,
  };
}
