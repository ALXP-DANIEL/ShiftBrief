// Storage facade. Picks a backend at module load:
//   - SupabaseStore when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set.
//   - MemoryStore otherwise (default; persisted on globalThis across dev HMR).
// Both implement the same ShiftStore interface used by the API routes.

import { isSupabaseConfigured, sbRest } from "@/lib/supabase/server";
import type {
  CombinedBrief,
  CombinedBriefAIResult,
  ShiftRoom,
  ShiftStatus,
  ShiftTask,
  TaskStatus,
  TeamType,
  UpdateSource,
  WorkerUpdate,
} from "./types";

type CreateRoomInput = {
  code: string;
  title: string;
  teamType: TeamType;
  adminPinHash: string;
};
type AddUpdateInput = {
  workerName: string;
  role: string;
  transcript: string;
  audioDataUrl?: string | null;
  source: UpdateSource;
};

export interface ShiftStore {
  roomExists(code: string): Promise<boolean>;
  createRoom(input: CreateRoomInput): Promise<ShiftRoom>;
  getRoomByCode(code: string): Promise<ShiftRoom | null>;
  getAdminPinHash(code: string): Promise<string | null>;
  setRoomStatus(shiftId: string, status: ShiftStatus): Promise<void>;
  addUpdate(shiftId: string, input: AddUpdateInput): Promise<WorkerUpdate>;
  listUpdates(shiftId: string): Promise<WorkerUpdate[]>;
  saveBriefAndTasks(
    shiftId: string,
    result: CombinedBriefAIResult,
  ): Promise<CombinedBrief>;
  getLatestBrief(shiftId: string): Promise<CombinedBrief | null>;
  listTasks(shiftId: string): Promise<ShiftTask[]>;
  getTaskById(taskId: string): Promise<ShiftTask | null>;
  updateTaskStatus(
    taskId: string,
    status: TaskStatus,
  ): Promise<ShiftTask | null>;
}

function newId(): string {
  return crypto.randomUUID();
}

function now(): string {
  return new Date().toISOString();
}

function assembleBrief(params: {
  id: string;
  shiftId: string;
  result: CombinedBriefAIResult;
  tasks: ShiftTask[];
  createdAt: string;
  updatedAt: string;
}): CombinedBrief {
  const { id, shiftId, result, tasks, createdAt, updatedAt } = params;
  return {
    id,
    shiftId,
    briefTitle: result.briefTitle,
    summary: result.summary,
    riskLevel: result.riskLevel,
    tasks,
    issues: result.issues,
    missingInformation: result.missingInformation,
    nextShiftChecklist: result.nextShiftChecklist,
    followUpMessage: result.followUpMessage,
    confidence: result.confidence,
    createdAt,
    updatedAt,
  };
}

function tasksFromResult(
  shiftId: string,
  result: CombinedBriefAIResult,
): ShiftTask[] {
  const timestamp = now();
  return result.tasks.map((task) => ({
    id: newId(),
    shiftId,
    title: task.title,
    priority: task.priority,
    owner: task.owner,
    status: "todo" as const,
    reason: task.reason,
    createdAt: timestamp,
    updatedAt: timestamp,
  }));
}

// --------------------------------------------------------------------------
// In-memory backend
// --------------------------------------------------------------------------

type MemoryData = {
  rooms: Map<string, ShiftRoom>;
  adminPinHashes: Map<string, string>;
  updates: WorkerUpdate[];
  tasks: ShiftTask[];
  briefs: Array<{ brief: CombinedBrief; result: CombinedBriefAIResult }>;
};

function memoryData(): MemoryData {
  const g = globalThis as unknown as { __shiftbrief?: MemoryData };
  if (!g.__shiftbrief) {
    g.__shiftbrief = {
      rooms: new Map(),
      adminPinHashes: new Map(),
      updates: [],
      tasks: [],
      briefs: [],
    };
  }
  g.__shiftbrief.adminPinHashes ??= new Map();
  return g.__shiftbrief;
}

class MemoryStore implements ShiftStore {
  async roomExists(code: string): Promise<boolean> {
    return [...memoryData().rooms.values()].some((room) => room.code === code);
  }

  async createRoom(input: CreateRoomInput): Promise<ShiftRoom> {
    const timestamp = now();
    const room: ShiftRoom = {
      id: newId(),
      code: input.code,
      title: input.title,
      teamType: input.teamType,
      status: "open",
      createdAt: timestamp,
      updatedAt: timestamp,
    };
    memoryData().rooms.set(room.id, room);
    memoryData().adminPinHashes.set(room.code, input.adminPinHash);
    return room;
  }

  async getRoomByCode(code: string): Promise<ShiftRoom | null> {
    return (
      [...memoryData().rooms.values()].find((room) => room.code === code) ??
      null
    );
  }

  async getAdminPinHash(code: string): Promise<string | null> {
    return memoryData().adminPinHashes.get(code) ?? null;
  }

  async setRoomStatus(shiftId: string, status: ShiftStatus): Promise<void> {
    const room = memoryData().rooms.get(shiftId);
    if (room) {
      room.status = status;
      room.updatedAt = now();
    }
  }

  async addUpdate(
    shiftId: string,
    input: AddUpdateInput,
  ): Promise<WorkerUpdate> {
    const update: WorkerUpdate = {
      id: newId(),
      shiftId,
      workerName: input.workerName,
      role: input.role,
      transcript: input.transcript,
      audioDataUrl: input.audioDataUrl ?? null,
      source: input.source,
      createdAt: now(),
    };
    memoryData().updates.push(update);
    return update;
  }

  async listUpdates(shiftId: string): Promise<WorkerUpdate[]> {
    return memoryData()
      .updates.filter((update) => update.shiftId === shiftId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async saveBriefAndTasks(
    shiftId: string,
    result: CombinedBriefAIResult,
  ): Promise<CombinedBrief> {
    const data = memoryData();
    // Replace tasks for this shift.
    data.tasks = data.tasks.filter((task) => task.shiftId !== shiftId);
    const tasks = tasksFromResult(shiftId, result);
    data.tasks.push(...tasks);

    const timestamp = now();
    const brief = assembleBrief({
      id: newId(),
      shiftId,
      result,
      tasks,
      createdAt: timestamp,
      updatedAt: timestamp,
    });
    data.briefs = data.briefs.filter(
      (entry) => entry.brief.shiftId !== shiftId,
    );
    data.briefs.push({ brief, result });
    return brief;
  }

  async getLatestBrief(shiftId: string): Promise<CombinedBrief | null> {
    const entry = memoryData()
      .briefs.filter((item) => item.brief.shiftId === shiftId)
      .sort((a, b) => b.brief.createdAt.localeCompare(a.brief.createdAt))[0];
    if (!entry) return null;
    // Reflect live task statuses.
    return { ...entry.brief, tasks: await this.listTasks(shiftId) };
  }

  async listTasks(shiftId: string): Promise<ShiftTask[]> {
    return memoryData()
      .tasks.filter((task) => task.shiftId === shiftId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }

  async getTaskById(taskId: string): Promise<ShiftTask | null> {
    return memoryData().tasks.find((task) => task.id === taskId) ?? null;
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
  ): Promise<ShiftTask | null> {
    const task = memoryData().tasks.find((item) => item.id === taskId);
    if (!task) return null;
    task.status = status;
    task.updatedAt = now();
    return task;
  }
}

// --------------------------------------------------------------------------
// Supabase REST backend
// --------------------------------------------------------------------------

type RoomRow = {
  id: string;
  code: string;
  title: string;
  team_type: string;
  status: string;
  created_at: string;
  updated_at: string;
  admin_pin_hash: string | null;
};
type UpdateRow = {
  id: string;
  shift_id: string;
  worker_name: string;
  role: string;
  transcript: string;
  audio_data_url: string | null;
  source: string;
  created_at: string;
};
type TaskRow = {
  id: string;
  shift_id: string;
  title: string;
  priority: string;
  owner: string | null;
  status: string;
  reason: string;
  created_at: string;
  updated_at: string;
};
type BriefRow = {
  id: string;
  shift_id: string;
  brief_title: string;
  summary: string;
  risk_level: string;
  follow_up_message: string;
  ai_result_json: CombinedBriefAIResult;
  confidence: number;
  created_at: string;
  updated_at: string;
};

function rowToRoom(row: RoomRow): ShiftRoom {
  return {
    id: row.id,
    code: row.code,
    title: row.title,
    teamType: row.team_type as TeamType,
    status: row.status as ShiftStatus,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
function rowToUpdate(row: UpdateRow): WorkerUpdate {
  return {
    id: row.id,
    shiftId: row.shift_id,
    workerName: row.worker_name,
    role: row.role,
    transcript: row.transcript,
    audioDataUrl: row.audio_data_url,
    source: row.source as UpdateSource,
    createdAt: row.created_at,
  };
}
function rowToTask(row: TaskRow): ShiftTask {
  return {
    id: row.id,
    shiftId: row.shift_id,
    title: row.title,
    priority: row.priority as ShiftTask["priority"],
    owner: row.owner,
    status: row.status as TaskStatus,
    reason: row.reason,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

class SupabaseStore implements ShiftStore {
  async roomExists(code: string): Promise<boolean> {
    const rows = await sbRest<RoomRow[]>("shift_rooms", {
      query: `code=eq.${encodeURIComponent(code)}&select=id&limit=1`,
    });
    return rows.length > 0;
  }

  async createRoom(input: CreateRoomInput): Promise<ShiftRoom> {
    const rows = await sbRest<RoomRow[]>("shift_rooms", {
      method: "POST",
      prefer: "return=representation",
      body: {
        code: input.code,
        title: input.title,
        team_type: input.teamType,
        status: "open",
        admin_pin_hash: input.adminPinHash,
      },
    });
    return rowToRoom(rows[0]);
  }

  async getRoomByCode(code: string): Promise<ShiftRoom | null> {
    const rows = await sbRest<RoomRow[]>("shift_rooms", {
      query: `code=eq.${encodeURIComponent(code)}&select=*&limit=1`,
    });
    return rows[0] ? rowToRoom(rows[0]) : null;
  }

  async getAdminPinHash(code: string): Promise<string | null> {
    const rows = await sbRest<Pick<RoomRow, "admin_pin_hash">[]>(
      "shift_rooms",
      {
        query: `code=eq.${encodeURIComponent(code)}&select=admin_pin_hash&limit=1`,
      },
    );
    return rows[0]?.admin_pin_hash ?? null;
  }

  async setRoomStatus(shiftId: string, status: ShiftStatus): Promise<void> {
    await sbRest("shift_rooms", {
      method: "PATCH",
      query: `id=eq.${shiftId}`,
      body: { status, updated_at: now() },
    });
  }

  async addUpdate(
    shiftId: string,
    input: AddUpdateInput,
  ): Promise<WorkerUpdate> {
    const rows = await sbRest<UpdateRow[]>("worker_updates", {
      method: "POST",
      prefer: "return=representation",
      body: {
        shift_id: shiftId,
        worker_name: input.workerName,
        role: input.role,
        transcript: input.transcript,
        audio_data_url: input.audioDataUrl ?? null,
        source: input.source,
      },
    });
    return rowToUpdate(rows[0]);
  }

  async listUpdates(shiftId: string): Promise<WorkerUpdate[]> {
    const rows = await sbRest<UpdateRow[]>("worker_updates", {
      query: `shift_id=eq.${shiftId}&select=*&order=created_at.asc`,
    });
    return rows.map(rowToUpdate);
  }

  async saveBriefAndTasks(
    shiftId: string,
    result: CombinedBriefAIResult,
  ): Promise<CombinedBrief> {
    const briefRows = await sbRest<BriefRow[]>("combined_briefs", {
      method: "POST",
      prefer: "return=representation",
      body: {
        shift_id: shiftId,
        brief_title: result.briefTitle,
        summary: result.summary,
        risk_level: result.riskLevel,
        follow_up_message: result.followUpMessage,
        ai_result_json: result,
        confidence: result.confidence,
      },
    });
    const briefRow = briefRows[0];

    await sbRest("shift_tasks", {
      method: "DELETE",
      query: `shift_id=eq.${shiftId}`,
    });

    let tasks: ShiftTask[] = [];
    if (result.tasks.length > 0) {
      const taskRows = await sbRest<TaskRow[]>("shift_tasks", {
        method: "POST",
        prefer: "return=representation",
        body: result.tasks.map((task) => ({
          shift_id: shiftId,
          title: task.title,
          priority: task.priority,
          owner: task.owner,
          status: "todo",
          reason: task.reason,
        })),
      });
      tasks = taskRows.map(rowToTask);
    }

    return assembleBrief({
      id: briefRow.id,
      shiftId,
      result,
      tasks,
      createdAt: briefRow.created_at,
      updatedAt: briefRow.updated_at,
    });
  }

  async getLatestBrief(shiftId: string): Promise<CombinedBrief | null> {
    const rows = await sbRest<BriefRow[]>("combined_briefs", {
      query: `shift_id=eq.${shiftId}&select=*&order=created_at.desc&limit=1`,
    });
    const row = rows[0];
    if (!row) return null;
    const tasks = await this.listTasks(shiftId);
    return assembleBrief({
      id: row.id,
      shiftId,
      result: row.ai_result_json,
      tasks,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  async listTasks(shiftId: string): Promise<ShiftTask[]> {
    const rows = await sbRest<TaskRow[]>("shift_tasks", {
      query: `shift_id=eq.${shiftId}&select=*&order=created_at.asc`,
    });
    return rows.map(rowToTask);
  }

  async getTaskById(taskId: string): Promise<ShiftTask | null> {
    const rows = await sbRest<TaskRow[]>("shift_tasks", {
      query: `id=eq.${taskId}&select=*&limit=1`,
    });
    return rows[0] ? rowToTask(rows[0]) : null;
  }

  async updateTaskStatus(
    taskId: string,
    status: TaskStatus,
  ): Promise<ShiftTask | null> {
    const rows = await sbRest<TaskRow[]>("shift_tasks", {
      method: "PATCH",
      query: `id=eq.${taskId}`,
      prefer: "return=representation",
      body: { status, updated_at: now() },
    });
    return rows[0] ? rowToTask(rows[0]) : null;
  }
}

export const store: ShiftStore = isSupabaseConfigured()
  ? new SupabaseStore()
  : new MemoryStore();

export const storageBackend: "supabase" | "memory" = isSupabaseConfigured()
  ? "supabase"
  : "memory";
