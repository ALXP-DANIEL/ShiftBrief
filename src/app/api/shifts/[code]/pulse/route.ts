import { generatePulseWithAI, isAIConfigured } from "@/lib/shiftbrief/ai";
import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { store } from "@/lib/shiftbrief/store";

const CATEGORY_MESSAGES = [
  [/\b(clean|sanitize|wipe|mop|sweep)\b/i, "Cleaning progress shared"],
  [/\b(stock|inventory|supply|restock)\b/i, "Stock status updated"],
  [
    /\b(customer|guest|client|complaint|order)\b/i,
    "Customer activity reported",
  ],
  [/\b(broken|repair|damage|fault|maintenance)\b/i, "Equipment issue reported"],
  [/\b(done|complete|finished|ready|resolved)\b/i, "Work completed"],
  [/\b(safety|danger|hazard|urgent|risk)\b/i, "Safety concern reported"],
  [/\b(delivery|shipment|pickup|arrived)\b/i, "Delivery activity reported"],
] as const;

function fallbackMessage(transcript: string) {
  return (
    CATEGORY_MESSAGES.find(([pattern]) => pattern.test(transcript))?.[1] ??
    "New shift activity shared"
  );
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> },
) {
  try {
    const { code } = await params;
    const room = await store.getRoomByCode(normalizeRoomCode(code));
    if (!room) return apiError("Shift room not found", 404);

    const updates = (await store.listUpdates(room.id)).slice(-6);
    if (updates.length === 0) return apiOk({ items: [] });

    const fallbackItems = updates.map((update) => ({
      id: update.id,
      message: fallbackMessage(update.transcript),
    }));
    if (!isAIConfigured()) return apiOk({ items: fallbackItems });

    try {
      const generated = await generatePulseWithAI(updates);
      const generatedById = new Map(
        generated.map((item) => [item.id, item.message]),
      );

      return apiOk({
        items: fallbackItems.map((item) => ({
          ...item,
          message: generatedById.get(item.id) ?? item.message,
        })),
      });
    } catch {
      return apiOk({ items: fallbackItems });
    }
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
