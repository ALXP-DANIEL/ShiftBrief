// POST /api/shifts — create a shift room, or seed the demo room with {demo:true}.

import { hashAdminPin } from "@/lib/shiftbrief/admin-pin";
import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { generateUniqueRoomCode } from "@/lib/shiftbrief/room-code";
import { SEED_SHIFT, SEED_UPDATES } from "@/lib/shiftbrief/seed-data";
import { store } from "@/lib/shiftbrief/store";
import { createShiftSchema } from "@/lib/shiftbrief/validation";

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return apiError("Invalid JSON body");
  }

  const isDemo =
    typeof body === "object" &&
    body !== null &&
    (body as { demo?: unknown }).demo === true;

  try {
    if (isDemo) {
      const code = await generateUniqueRoomCode((value) =>
        store.roomExists(value),
      );
      const room = await store.createRoom({
        code,
        ...SEED_SHIFT,
        adminPinHash: await hashAdminPin("0000"),
      });
      for (const update of SEED_UPDATES) {
        await store.addUpdate(room.id, update);
      }
      return apiOk(room);
    }

    const parsed = createShiftSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid input");
    }

    const code = await generateUniqueRoomCode((value) =>
      store.roomExists(value),
    );
    const { adminPin, ...roomInput } = parsed.data;
    const room = await store.createRoom({
      code,
      ...roomInput,
      adminPinHash: await hashAdminPin(adminPin),
    });
    return apiOk(room);
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
