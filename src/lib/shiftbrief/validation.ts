// Zod request schemas for the API routes.

import { z } from "zod";

// Max transcript length, enforced both in the schema below and in the client
// voice capture (so recording auto-stops at the database limit).
export const MAX_TRANSCRIPT_CHARS = 5000;

export const TEAM_TYPES = [
  "cafe",
  "retail",
  "repair_shop",
  "cleaning",
  "event",
  "warehouse",
  "homestay",
  "other",
] as const;

export const createShiftSchema = z.object({
  title: z.string().trim().min(2, "Title is too short").max(120),
  teamType: z.enum(TEAM_TYPES),
  adminPin: z.string().regex(/^\d{4,8}$/, "PIN must be 4–8 digits"),
});

export const adminLoginSchema = z.object({
  code: z.string().trim().min(4).max(6),
  pin: z.string().regex(/^\d{4,8}$/, "PIN must be 4–8 digits"),
});

// Body for POST /api/shifts when seeding the demo room instead of creating one.
export const demoShiftSchema = z.object({
  demo: z.literal(true),
});

export const createOrDemoSchema = z.union([demoShiftSchema, createShiftSchema]);

export const workerUpdateSchema = z.object({
  workerName: z.string().trim().min(1, "Name is required").max(80),
  role: z.string().trim().min(1, "Role is required").max(80),
  transcript: z
    .string()
    .trim()
    .min(3, "Update is too short")
    .max(MAX_TRANSCRIPT_CHARS, "Update is too long"),
  audioDataUrl: z
    .string()
    .max(3_000_000, "Audio note is too large")
    // Allow MIME params like `;codecs=opus` that MediaRecorder emits, e.g.
    // `data:audio/webm;codecs=opus;base64,...`.
    .regex(/^data:audio\/[\w.+-]+(?:;[\w.+=-]+)*;base64,/, "Invalid audio note")
    .nullable()
    .optional(),
  source: z.enum(["speech", "paste", "seed"]).default("paste"),
});

export const analyzeSchema = z
  .object({
    forceFallback: z.boolean().default(false),
  })
  .default({ forceFallback: false });

export const taskStatusSchema = z.object({
  status: z.enum(["todo", "in_progress", "done"]),
});

export type CreateShiftInput = z.infer<typeof createShiftSchema>;
export type WorkerUpdateInput = z.infer<typeof workerUpdateSchema>;
