// Server-only AI client. Calls an OpenAI-compatible chat-completions endpoint
// (LiteLLM, Google Gemini's OpenAI endpoint, OpenAI, etc.) to produce a
// combined brief. Never import this from client code:
// it reads server-only env vars, which @t3-oss/env throws on if read client-side.

import { env } from "@/env";
import { normalizeAIResult } from "./ai-schema";
import { buildUserPrompt, SYSTEM_PROMPT } from "./prompts";
import type { CombinedBriefAIResult, ShiftRoom, WorkerUpdate } from "./types";

const REQUEST_TIMEOUT_MS = 30_000;

export function isAIConfigured(): boolean {
  return Boolean(env.AI_BASE_URL && env.AI_API_KEY);
}

export function aiModel(): string {
  return env.AI_MODEL;
}

export async function generateHeadlineWithAI(context: string): Promise<string> {
  if (!isAIConfigured()) throw new Error("AI is not configured");

  const baseUrl = env.AI_BASE_URL?.replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature: 0.65,
        max_tokens: 120,
        // Disable model "thinking" so output tokens aren't consumed by
        // reasoning (Gemini 3.x reasons by default). Other providers ignore it.
        reasoning_effort: "none",
        messages: [
          {
            role: "system",
            content:
              "Write one motivating operational headline for a shift team. Use the supplied facts only. Reflect the most useful work context, issue, progress, or next action. Be warm but practical. Maximum 12 words. Plain text only, no quotes or punctuation at the end.",
          },
          { role: "user", content: context },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) throw new Error(`AI request failed: ${response.status}`);
    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const headline = payload.choices?.[0]?.message?.content
      ?.replace(/^["']|["'.]$/g, "")
      .trim();
    if (!headline) throw new Error("AI response had no headline");
    return headline.slice(0, 120);
  } finally {
    clearTimeout(timeout);
  }
}

/** Pull the first balanced JSON object out of a model response. */
function extractJson(content: string): string {
  const withoutFences = content
    .replace(/```json/gi, "```")
    .replace(/```/g, "")
    .trim();
  const start = withoutFences.indexOf("{");
  const end = withoutFences.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("No JSON object found in AI response");
  }
  return withoutFences.slice(start, end + 1);
}

/**
 * Generate a combined brief via AI. Throws on any failure (missing config,
 * network/timeout, bad JSON, schema mismatch) so callers can fall back.
 */
export async function generateBriefWithAI(
  room: Pick<ShiftRoom, "title" | "teamType">,
  updates: Pick<WorkerUpdate, "workerName" | "role" | "transcript">[],
): Promise<CombinedBriefAIResult> {
  if (!isAIConfigured()) {
    throw new Error("AI is not configured");
  }

  const baseUrl = env.AI_BASE_URL?.replace(/\/$/, "");
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature: 0.2,
        max_tokens: 2048,
        // Disable model "thinking" (Gemini 3.x reasons by default and would
        // otherwise spend the token budget before emitting the JSON).
        reasoning_effort: "none",
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(room, updates) },
        ],
      }),
      signal: controller.signal,
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new Error(
        `AI request failed: ${response.status} ${detail.slice(0, 200)}`,
      );
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI response had no content");

    return normalizeAIResult(JSON.parse(extractJson(content)));
  } finally {
    clearTimeout(timeout);
  }
}
