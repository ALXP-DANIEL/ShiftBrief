import { generateHeadlineWithAI, isAIConfigured } from "@/lib/shiftbrief/ai";
import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { teamTypeLabel } from "@/lib/shiftbrief/format";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { store } from "@/lib/shiftbrief/store";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    if (!isAIConfigured()) return apiError("AI is not configured", 503);

    const { code } = await params;
    const room = await store.getRoomByCode(normalizeRoomCode(code));
    if (!room) return apiError("Shift room not found", 404);

    const [updates, brief, tasks] = await Promise.all([
      store.listUpdates(room.id),
      store.getLatestBrief(room.id),
      store.listTasks(room.id),
    ]);
    if (updates.length === 0) return apiError("No updates yet", 400);

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

    return apiOk({ headline: await generateHeadlineWithAI(context) });
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
