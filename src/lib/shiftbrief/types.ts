// Core domain types for ShiftBrief. This file is the source of truth that
// the storage layer, API routes, AI schema, and UI all share.

export type TeamType =
  | "cafe"
  | "retail"
  | "repair_shop"
  | "cleaning"
  | "event"
  | "warehouse"
  | "homestay"
  | "other";

export type ShiftStatus = "open" | "analyzing" | "brief_ready" | "closed";
export type UpdateSource = "speech" | "paste" | "seed";
export type Priority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "in_progress" | "done";
export type RiskLevel = "low" | "medium" | "high";

export type ShiftRoom = {
  id: string;
  code: string;
  title: string;
  teamType: TeamType;
  status: ShiftStatus;
  createdAt: string;
  updatedAt: string;
};

export type WorkerUpdate = {
  id: string;
  shiftId: string;
  workerName: string;
  role: string;
  transcript: string;
  /** Whether a voice note is attached. The audio itself is fetched on demand
   * (GET /api/updates/[id]/audio) so it never rides along in the polled list. */
  hasAudio: boolean;
  source: UpdateSource;
  createdAt: string;
};

export type ShiftTask = {
  id: string;
  shiftId: string;
  title: string;
  priority: Priority;
  owner: string | null;
  status: TaskStatus;
  reason: string;
  createdAt: string;
  updatedAt: string;
};

export type BriefIssue = {
  title: string;
  severity: RiskLevel;
  details: string;
  mentionedBy: string[];
};

export type MissingInformation = {
  question: string;
  whyNeeded: string;
};

// Shape returned by the AI (and matched by the fallback parser). Tasks here are
// pre-persistence (no ids yet); the store turns them into ShiftTask rows.
export type CombinedBriefAIResult = {
  briefTitle: string;
  summary: string;
  riskLevel: RiskLevel;
  tasks: Array<{
    title: string;
    priority: Priority;
    owner: string | null;
    status: "todo";
    reason: string;
  }>;
  issues: BriefIssue[];
  missingInformation: MissingInformation[];
  nextShiftChecklist: string[];
  followUpMessage: string;
  confidence: number;
};

export type CombinedBrief = {
  id: string;
  shiftId: string;
  briefTitle: string;
  summary: string;
  riskLevel: RiskLevel;
  tasks: ShiftTask[];
  issues: BriefIssue[];
  missingInformation: MissingInformation[];
  nextShiftChecklist: string[];
  followUpMessage: string;
  confidence: number;
  createdAt: string;
  updatedAt: string;
};

// Bundle returned by GET /api/shifts/[code].
export type ShiftBundle = {
  room: ShiftRoom;
  updates: WorkerUpdate[];
  brief: CombinedBrief | null;
  tasks: ShiftTask[];
};

export type AnalyzeMode = "ai" | "fallback";

// Standard API envelopes.
export type ApiOk<T> = { ok: true; data: T };
export type ApiErr = { ok: false; error: string };
export type ApiResult<T> = ApiOk<T> | ApiErr;
