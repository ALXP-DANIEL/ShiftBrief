// GET /api/ai/health — report whether AI + storage are configured, no secrets.

import { aiModel, isAIConfigured } from "@/lib/shiftbrief/ai";
import { apiOk } from "@/lib/shiftbrief/api-response";
import { storageBackend } from "@/lib/shiftbrief/store";

export const dynamic = "force-dynamic";

export function GET() {
  return apiOk({
    aiConfigured: isAIConfigured(),
    model: isAIConfigured() ? aiModel() : null,
    storage: storageBackend,
  });
}
