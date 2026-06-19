import { verifyAdminPin } from "@/lib/shiftbrief/admin-pin";
import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { store } from "@/lib/shiftbrief/store";
import { adminLoginSchema } from "@/lib/shiftbrief/validation";

export async function POST(request: Request) {
  try {
    const parsed = adminLoginSchema.safeParse(await request.json());
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? "Invalid login");
    }

    const code = normalizeRoomCode(parsed.data.code);
    const [room, pinHash] = await Promise.all([
      store.getRoomByCode(code),
      store.getAdminPinHash(code),
    ]);
    if (!room || !pinHash) return apiError("Room or admin PIN not found", 404);

    const valid = await verifyAdminPin(parsed.data.pin, pinHash);
    if (!valid) return apiError("Incorrect admin PIN", 401);

    return apiOk(room);
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
