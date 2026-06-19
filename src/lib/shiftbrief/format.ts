// Display labels and a plain-text exporter shared by server + client.

import type {
  CombinedBrief,
  Priority,
  RiskLevel,
  ShiftStatus,
  TaskStatus,
  TeamType,
} from "./types";

const TEAM_TYPE_LABELS: Record<TeamType, string> = {
  cafe: "Café",
  retail: "Retail",
  repair_shop: "Repair shop",
  cleaning: "Cleaning",
  event: "Event crew",
  warehouse: "Warehouse",
  homestay: "Homestay",
  other: "Other",
};

const SHIFT_STATUS_LABELS: Record<ShiftStatus, string> = {
  open: "Collecting updates",
  analyzing: "Analyzing",
  brief_ready: "Brief ready",
  closed: "Closed",
};

const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

const RISK_LABELS: Record<RiskLevel, string> = {
  low: "Low risk",
  medium: "Medium risk",
  high: "High risk",
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To Do",
  in_progress: "In Progress",
  done: "Done",
};

export function teamTypeLabel(value: TeamType): string {
  return TEAM_TYPE_LABELS[value] ?? "Other";
}

export function shiftStatusLabel(value: ShiftStatus): string {
  return SHIFT_STATUS_LABELS[value] ?? value;
}

export function priorityLabel(value: Priority): string {
  return PRIORITY_LABELS[value] ?? value;
}

export function riskLabel(value: RiskLevel): string {
  return RISK_LABELS[value] ?? value;
}

export function taskStatusLabel(value: TaskStatus): string {
  return TASK_STATUS_LABELS[value] ?? value;
}

export const TEAM_TYPE_OPTIONS = (
  Object.keys(TEAM_TYPE_LABELS) as TeamType[]
).map((value) => ({ value, label: TEAM_TYPE_LABELS[value] }));

export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return "";
  const diffMs = Date.now() - then;
  const seconds = Math.round(diffMs / 1000);
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

/** Export the brief as a clean, copy/paste-friendly plain-text document. */
export function briefToPlainText(
  brief: CombinedBrief,
  shiftTitle: string,
): string {
  const lines: string[] = [];
  lines.push(brief.briefTitle.toUpperCase());
  lines.push(`Shift: ${shiftTitle}`);
  lines.push(`Risk: ${riskLabel(brief.riskLevel)}`);
  lines.push("");
  lines.push("SUMMARY");
  lines.push(brief.summary);

  if (brief.tasks.length > 0) {
    lines.push("");
    lines.push("TASKS");
    for (const task of brief.tasks) {
      const owner = task.owner ? ` (@${task.owner})` : "";
      lines.push(`- [${priorityLabel(task.priority)}] ${task.title}${owner}`);
      if (task.reason) lines.push(`    ${task.reason}`);
    }
  }

  if (brief.issues.length > 0) {
    lines.push("");
    lines.push("ISSUES");
    for (const issue of brief.issues) {
      lines.push(`- [${riskLabel(issue.severity)}] ${issue.title}`);
      if (issue.details) lines.push(`    ${issue.details}`);
    }
  }

  if (brief.missingInformation.length > 0) {
    lines.push("");
    lines.push("MISSING INFORMATION");
    for (const item of brief.missingInformation) {
      lines.push(`- ${item.question}`);
      if (item.whyNeeded) lines.push(`    Why: ${item.whyNeeded}`);
    }
  }

  if (brief.nextShiftChecklist.length > 0) {
    lines.push("");
    lines.push("NEXT-SHIFT CHECKLIST");
    for (const item of brief.nextShiftChecklist) {
      lines.push(`- [ ] ${item}`);
    }
  }

  lines.push("");
  lines.push("FOLLOW-UP MESSAGE");
  lines.push(brief.followUpMessage);

  return lines.join("\n");
}
