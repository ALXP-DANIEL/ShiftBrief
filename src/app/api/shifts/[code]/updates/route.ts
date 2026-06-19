// POST /api/shifts/[code]/updates — a worker submits their transcript update.

import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { store } from "@/lib/shiftbrief/store";
import { workerUpdateSchema } from "@/lib/shiftbrief/validation";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/shifts/[code]/updates">,
) {
  const { code } = await params;
  const normalized = normalizeRoomCode(code);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const parsed = workerUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
  }

  try {
    const room = await store.getRoomByCode(normalized);
    if (!room) return apiError("Shift room not found", 404);

    // A new update means there is fresh material to (re)analyze.
    if (room.status === "brief_ready") {
      await store.setRoomStatus(room.id, "open");
    }

    const update = await store.addUpdate(room.id, parsed.data);
    return apiOk(update);
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
