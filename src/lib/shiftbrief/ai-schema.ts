// Zod schema + normalizer for the AI's combined-brief output. This validates
// whatever the model returns and clamps it to the MVP limits so the UI is safe.

import { z } from "zod";
import type { CombinedBriefAIResult } from "./types";

const riskLevel = z.enum(["low", "medium", "high"]);
const priority = z.enum(["low", "medium", "high"]);

const aiTaskSchema = z.object({
  title: z.string().trim().min(1).max(160),
  priority: priority.catch("medium"),
  owner: z
    .union([z.string(), z.null()])
    .transform((value) => {
      if (value == null) return null;
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed.slice(0, 80) : null;
    })
    .catch(null),
  status: z.literal("todo").catch("todo"),
  reason: z.string().trim().max(400).catch(""),
});

const aiIssueSchema = z.object({
  title: z.string().trim().min(1).max(160),
  severity: riskLevel.catch("medium"),
  details: z.string().trim().max(400).catch(""),
  mentionedBy: z.array(z.string().trim().min(1).max(80)).catch([]),
});

const aiMissingInfoSchema = z.object({
  question: z.string().trim().min(1).max(240),
  whyNeeded: z.string().trim().max(240).catch(""),
});

export const combinedBriefAISchema = z.object({
  briefTitle: z.string().trim().min(1).max(160).catch("Shift Handover Brief"),
  summary: z.string().trim().min(1).max(2000),
  riskLevel: riskLevel.catch("medium"),
  tasks: z.array(aiTaskSchema).catch([]),
  issues: z.array(aiIssueSchema).catch([]),
  missingInformation: z.array(aiMissingInfoSchema).catch([]),
  nextShiftChecklist: z.array(z.string().trim().min(1).max(240)).catch([]),
  followUpMessage: z.string().trim().min(1).max(1200),
  confidence: z.coerce.number().catch(0.5),
});

export const LIMITS = {
  tasks: 8,
  issues: 6,
  missingInformation: 5,
  nextShiftChecklist: 8,
} as const;

/**
 * Validate + clamp raw parsed JSON into a CombinedBriefAIResult. Throws if the
 * shape is unrecoverable (callers then fall back to the keyword parser).
 */
export function normalizeAIResult(raw: unknown): CombinedBriefAIResult {
  const parsed = combinedBriefAISchema.parse(raw);

  return {
    briefTitle: parsed.briefTitle,
    summary: parsed.summary,
    riskLevel: parsed.riskLevel,
    tasks: parsed.tasks.slice(0, LIMITS.tasks).map((task) => ({
      ...task,
      status: "todo" as const,
    })),
    issues: parsed.issues.slice(0, LIMITS.issues),
    missingInformation: parsed.missingInformation.slice(
      0,
      LIMITS.missingInformation,
    ),
    nextShiftChecklist: parsed.nextShiftChecklist.slice(
      0,
      LIMITS.nextShiftChecklist,
    ),
    followUpMessage: parsed.followUpMessage,
    confidence: Math.min(1, Math.max(0, parsed.confidence)),
  };
}
