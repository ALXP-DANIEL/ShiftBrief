// POST /api/shifts/[code]/analyze — merge all worker updates into one brief.
// Tries AI first; falls back to the offline keyword parser on any failure.

import { NextResponse } from "next/server";
import { generateBriefWithAI, isAIConfigured } from "@/lib/shiftbrief/ai";
import { apiError, errorMessage } from "@/lib/shiftbrief/api-response";
import { generateBriefWithFallback } from "@/lib/shiftbrief/fallback-parser";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { store } from "@/lib/shiftbrief/store";
import type {
  AnalyzeMode,
  CombinedBriefAIResult,
} from "@/lib/shiftbrief/types";
import { analyzeSchema } from "@/lib/shiftbrief/validation";

export async function POST(
  request: Request,
  { params }: RouteContext<"/api/shifts/[code]/analyze">,
) {
  const { code } = await params;
  const normalized = normalizeRoomCode(code);

  // Body is optional; default to AI-first.
  let forceFallback = false;
  try {
    const raw = await request.json();
    forceFallback = analyzeSchema.parse(raw).forceFallback;
  } catch {
    forceFallback = false;
  }

  try {
    const room = await store.getRoomByCode(normalized);
    if (!room) return apiError("Shift room not found", 404);

    const updates = await store.listUpdates(room.id);
    if (updates.length === 0) {
      return apiError("Add at least one worker update before analyzing.", 400);
    }

    await store.setRoomStatus(room.id, "analyzing");

    let result: CombinedBriefAIResult;
    let mode: AnalyzeMode;
    let warning: string | undefined;

    if (!forceFallback && isAIConfigured()) {
      try {
        result = await generateBriefWithAI(room, updates);
        mode = "ai";
      } catch (aiError) {
        result = generateBriefWithFallback(room, updates);
        mode = "fallback";
        warning = `AI unavailable (${errorMessage(aiError)}). Used offline parser.`;
      }
    } else {
      result = generateBriefWithFallback(room, updates);
      mode = "fallback";
      warning = forceFallback
        ? undefined
        : "AI is not configured. Used offline parser.";
    }

    const brief = await store.saveBriefAndTasks(room.id, result);
    await store.setRoomStatus(room.id, "brief_ready");

    return NextResponse.json({ ok: true, mode, data: brief, warning });
  } catch (error) {
    // Best-effort: leave the room in a recoverable state.
    try {
      const room = await store.getRoomByCode(normalized);
      if (room) await store.setRoomStatus(room.id, "open");
    } catch {
      // ignore
    }
    return apiError(errorMessage(error), 500);
  }
}
