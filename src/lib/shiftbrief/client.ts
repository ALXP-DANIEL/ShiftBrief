// Browser-side typed API client. Throws Error(message) on failure so callers
// can surface a friendly message. Safe to import from client components
// (type-only imports from ./types are erased at build time).

import type {
  AnalyzeMode,
  CombinedBrief,
  ShiftBundle,
  ShiftRoom,
  ShiftTask,
  TaskStatus,
  TeamType,
  UpdateSource,
  WorkerUpdate,
} from "./types";

async function readJson<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as
    | { ok: boolean; error?: string; data?: T }
    | ({ ok: boolean; error?: string } & Record<string, unknown>)
    | null;

  if (!payload || payload.ok !== true) {
    throw new Error(payload?.error ?? `Request failed (${response.status})`);
  }
  return payload as T;
}

export async function createShift(input: {
  title: string;
  teamType: TeamType;
  adminPin: string;
}): Promise<ShiftRoom> {
  const response = await fetch("/api/shifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const { data } = await readJson<{ data: ShiftRoom }>(response);
  return data;
}

export async function loginAdmin(input: {
  code: string;
  pin: string;
}): Promise<ShiftRoom> {
  const response = await fetch("/api/admin/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const { data } = await readJson<{ data: ShiftRoom }>(response);
  return data;
}

export async function createDemoShift(): Promise<ShiftRoom> {
  const response = await fetch("/api/shifts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ demo: true }),
  });
  const { data } = await readJson<{ data: ShiftRoom }>(response);
  return data;
}

export async function fetchBundle(
  code: string,
  signal?: AbortSignal,
): Promise<ShiftBundle> {
  const response = await fetch(`/api/shifts/${encodeURIComponent(code)}`, {
    signal,
    cache: "no-store",
  });
  const { data } = await readJson<{ data: ShiftBundle }>(response);
  return data;
}

export async function submitUpdate(
  code: string,
  input: {
    workerName: string;
    role: string;
    transcript: string;
    audioDataUrl?: string | null;
    source: UpdateSource;
  },
): Promise<WorkerUpdate> {
  const response = await fetch(
    `/api/shifts/${encodeURIComponent(code)}/updates`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    },
  );
  const { data } = await readJson<{ data: WorkerUpdate }>(response);
  return data;
}

/** Lazily fetch one update's voice note (only when the user wants to hear it). */
export async function fetchUpdateAudio(
  updateId: string,
): Promise<string | null> {
  const response = await fetch(
    `/api/updates/${encodeURIComponent(updateId)}/audio`,
    { cache: "force-cache" },
  );
  if (!response.ok) return null;
  const payload = (await response.json().catch(() => null)) as {
    ok?: boolean;
    data?: { audioDataUrl?: string };
  } | null;
  return payload?.ok ? (payload.data?.audioDataUrl ?? null) : null;
}

export type AnalyzeResult = {
  mode: AnalyzeMode;
  data: CombinedBrief;
  warning?: string;
};

export async function analyzeShift(
  code: string,
  forceFallback = false,
): Promise<AnalyzeResult> {
  const response = await fetch(
    `/api/shifts/${encodeURIComponent(code)}/analyze`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ forceFallback }),
    },
  );
  return readJson<AnalyzeResult>(response);
}

export async function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
): Promise<ShiftTask> {
  const response = await fetch(`/api/tasks/${encodeURIComponent(taskId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const { data } = await readJson<{ data: ShiftTask }>(response);
  return data;
}
