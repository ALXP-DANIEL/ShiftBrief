// GET /api/updates/[id]/audio — fetch a single update's voice note on demand,
// so audio blobs never ride along in the polled shift bundle.

import { apiError, apiOk, errorMessage } from "@/lib/shiftbrief/api-response";
import { store } from "@/lib/shiftbrief/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/updates/[id]/audio">,
) {
  try {
    const { id } = await params;
    const audioDataUrl = await store.getUpdateAudio(id);
    if (!audioDataUrl) return apiError("No audio for this update", 404);
    return apiOk({ audioDataUrl });
  } catch (error) {
    return apiError(errorMessage(error), 500);
  }
}
