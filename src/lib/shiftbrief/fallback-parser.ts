// Offline keyword parser. Produces the same shaped brief as the AI when AI is
// unavailable, using simple, deterministic rules over the worker transcripts.

import { teamTypeLabel } from "./format";
import type {
  BriefIssue,
  CombinedBriefAIResult,
  MissingInformation,
  Priority,
  RiskLevel,
  ShiftRoom,
  WorkerUpdate,
} from "./types";

const STOCK = [
  "stock",
  "low",
  "habis",
  "tinggal",
  "restock",
  "supplier",
  "buy",
  "cup",
  "plastic",
  "item",
  "inventory",
];
const CUSTOMER = [
  "complain",
  "customer",
  "waiting",
  "angry",
  "refund",
  "issue",
];
const EQUIPMENT = [
  "machine",
  "freezer",
  "fan",
  "slow",
  "broken",
  "bunyi",
  "leaking",
  "leak",
  "error",
  "lag",
  "loose",
  "screw",
];
const CASH = [
  "cash",
  "drawer",
  "invoice",
  "receipt",
  "payment",
  "system",
  "close",
];
const NEXT_SHIFT = [
  "tomorrow",
  "morning",
  "esok",
  "next shift",
  "before opening",
  "tonight",
  "later",
];
const HIGH = [
  "urgent",
  "asap",
  "today",
  "before opening",
  "system down",
  "freezer",
  "cash",
  "lag",
  "broken",
];
const CLEANING = ["clean", "sticky", "dirty", "arrange", "arranged", "tidy"];
const UNCERTAIN = [
  "maybe",
  "not sure",
  "belum",
  "if ",
  "still not",
  "check",
  "might",
  "should",
];

function has(text: string, words: string[]): boolean {
  return words.some((word) => text.includes(word));
}

function splitClauses(transcript: string): string[] {
  return transcript
    .split(/[.!?\n;]+|\bbut\b|\balso\b|\band also\b/gi)
    .map((part) => part.trim())
    .filter((part) => part.length >= 4);
}

function toTitle(clause: string, max = 80): string {
  const cleaned = clause.replace(/\s+/g, " ").trim();
  const sliced =
    cleaned.length > max ? `${cleaned.slice(0, max - 1).trim()}…` : cleaned;
  return sliced.charAt(0).toUpperCase() + sliced.slice(1);
}

function clausePriority(lower: string): Priority {
  if (has(lower, HIGH)) return "high";
  if (has(lower, [...CUSTOMER, ...EQUIPMENT, ...STOCK, ...CASH])) {
    return "medium";
  }
  return "low";
}

export function generateBriefWithFallback(
  room: Pick<ShiftRoom, "title" | "teamType">,
  updates: Pick<WorkerUpdate, "workerName" | "role" | "transcript">[],
): CombinedBriefAIResult {
  const tasks: CombinedBriefAIResult["tasks"] = [];
  const issues: BriefIssue[] = [];
  const checklist: string[] = [];
  const missing: MissingInformation[] = [];
  const seenTaskTitles = new Set<string>();
  const seenChecklist = new Set<string>();
  const categories = new Set<string>();
  let uncertaintyDetected = false;

  for (const update of updates) {
    for (const clause of splitClauses(update.transcript)) {
      const lower = clause.toLowerCase();
      const isStock = has(lower, STOCK);
      const isCustomer = has(lower, CUSTOMER);
      const isEquipment = has(lower, EQUIPMENT);
      const isCash = has(lower, CASH);
      const isCleaning = has(lower, CLEANING);
      const isNextShift = has(lower, NEXT_SHIFT);

      if (has(lower, UNCERTAIN)) uncertaintyDetected = true;

      const priority = clausePriority(lower);

      if (isStock) categories.add("stock");
      if (isCustomer) categories.add("customer");
      if (isEquipment) categories.add("equipment");
      if (isCash) categories.add("cash");

      // Tasks: anything actionable.
      if (isStock || isEquipment || isCash || isCleaning || isCustomer) {
        const title = toTitle(clause);
        const key = title.toLowerCase();
        if (!seenTaskTitles.has(key) && tasks.length < 8) {
          seenTaskTitles.add(key);
          tasks.push({
            title,
            priority,
            owner: null,
            status: "todo",
            reason: `Reported by ${update.workerName} (${update.role}).`,
          });
        }
      }

      // Issues: things that went wrong.
      if ((isCustomer || isEquipment) && issues.length < 6) {
        const severity: RiskLevel = priority;
        const issueTitle = toTitle(clause, 70);
        if (!issues.some((existing) => existing.title === issueTitle)) {
          issues.push({
            title: issueTitle,
            severity,
            details: clause.trim(),
            mentionedBy: [update.workerName],
          });
        }
      }

      // Checklist: forward-looking items for the next shift.
      if (isNextShift) {
        const item = toTitle(clause, 90);
        const key = item.toLowerCase();
        if (!seenChecklist.has(key) && checklist.length < 8) {
          seenChecklist.add(key);
          checklist.push(item);
        }
      }
    }
  }

  // Grounded follow-up questions based on detected categories + uncertainty.
  if (uncertaintyDetected && categories.has("cash") && missing.length < 5) {
    missing.push({
      question: "Was the cash drawer fully closed and reconciled?",
      whyNeeded: "An update suggested it may not have been completed.",
    });
  }
  if (categories.has("stock") && missing.length < 5) {
    missing.push({
      question: "Which supplier and quantity is needed for the restock?",
      whyNeeded: "Stock was flagged as running low without exact amounts.",
    });
  }
  if (categories.has("equipment") && missing.length < 5) {
    missing.push({
      question: "Should the flagged equipment be serviced before opening?",
      whyNeeded: "Equipment was reported as faulty or noisy.",
    });
  }

  const riskLevel: RiskLevel = tasks.some((task) => task.priority === "high")
    ? "high"
    : tasks.some((task) => task.priority === "medium")
      ? "medium"
      : "low";

  const topTitles = tasks.slice(0, 3).map((task) => task.title);
  const summary =
    updates.length === 0
      ? "No worker updates were submitted for this shift yet."
      : `${updates.length} worker update${
          updates.length === 1 ? "" : "s"
        } merged for the ${teamTypeLabel(room.teamType)} shift "${room.title}". ` +
        `Detected ${tasks.length} task${tasks.length === 1 ? "" : "s"}, ` +
        `${issues.length} issue${issues.length === 1 ? "" : "s"}, and ` +
        `${checklist.length} next-shift item${
          checklist.length === 1 ? "" : "s"
        }. Generated offline — review before relying on it.`;

  const followUpMessage =
    tasks.length === 0
      ? `Shift handover for "${room.title}": no action items detected. Please confirm.`
      : `Shift handover — ${room.title}: ${tasks.length} task${
          tasks.length === 1 ? "" : "s"
        }, ${issues.length} issue${issues.length === 1 ? "" : "s"}. ` +
        `Top: ${topTitles.join("; ")}. Please review before next shift.`;

  return {
    briefTitle: `${room.title} — Handover`,
    summary,
    riskLevel,
    tasks,
    issues,
    missingInformation: missing,
    nextShiftChecklist: checklist,
    followUpMessage,
    confidence: 0.4,
  };
}
