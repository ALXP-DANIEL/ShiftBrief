import { generateHeadlineWithAI, isAIConfigured } from "@/lib/shiftbrief/ai";
import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { teamTypeLabel } from "@/lib/shiftbrief/format";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { store } from "@/lib/shiftbrief/store";
import type {
  CombinedBrief,
  ShiftTask,
  WorkerUpdate,
} from "@/lib/shiftbrief/types";

export const dynamic = "force-dynamic";

/** Deterministic headline when AI is unavailable, so this never hard-fails. */
function fallbackHeadline(
  updates: WorkerUpdate[],
  brief: CombinedBrief | null,
  tasks: ShiftTask[],
): string {
  const open = tasks.filter((task) => task.status !== "done");
  const high = open.find((task) => task.priority === "high");
  if (high) return `Priority: ${high.title}`.slice(0, 110);
  if (open.length > 0) {
    return `${open.length} open task${open.length === 1 ? "" : "s"} to clear this shift`;
  }
  if (tasks.length > 0) return "All tasks done — strong shift, keep it up";
  if (brief) return "Combined brief is ready — review the handover";
  return `${updates.length} update${
    updates.length === 1 ? "" : "s"
  } in — generate the combined brief`;
}

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/shifts/[code]/headline">,
) {
  try {
    const { code } = await params;
    const room = await store.getRoomByCode(normalizeRoomCode(code));
    if (!room) return apiError("Shift room not found", 404);

    const [updates, brief, tasks] = await Promise.all([
      store.listUpdates(room.id),
      store.getLatestBrief(room.id),
      store.listTasks(room.id),
    ]);
    if (updates.length === 0) return apiError("No updates yet", 400);

    const fallback = fallbackHeadline(updates, brief, tasks);

    if (!isAIConfigured())
      return apiOk({ headline: fallback, mode: "fallback" });

    const context = [
      `Shift: ${room.title}`,
      `Team: ${teamTypeLabel(room.teamType)}`,
      `Status: ${room.status}`,
      `Voice and text updates:\n${updates
        .slice(-8)
        .map(
          (update) =>
            `${update.workerName} (${update.role}): ${update.transcript}`,
        )
        .join("\n")}`,
      brief ? `Current brief: ${brief.summary}` : "",
      tasks.length
        ? `Tasks:\n${tasks
            .slice(0, 8)
            .map((task) => `${task.title} [${task.priority}, ${task.status}]`)
            .join("\n")}`
        : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    try {
      const headline = await generateHeadlineWithAI(context);
      return apiOk({ headline, mode: "ai" });
    } catch {
      return apiOk({ headline: fallback, mode: "fallback" });
    }
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
