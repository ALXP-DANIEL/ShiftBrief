// GET /api/shifts/[code] — load the full bundle (room, updates, brief, tasks).

import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { store } from "@/lib/shiftbrief/store";
import type { ShiftBundle } from "@/lib/shiftbrief/types";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/shifts/[code]">,
) {
  const { code } = await params;
  const normalized = normalizeRoomCode(code);

  try {
    const room = await store.getRoomByCode(normalized);
    if (!room) return apiError("Shift room not found", 404);

    const [updates, brief, tasks] = await Promise.all([
      store.listUpdates(room.id),
      store.getLatestBrief(room.id),
      store.listTasks(room.id),
    ]);

    const bundle: ShiftBundle = { room, updates, brief, tasks };
    return apiOk(bundle);
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
