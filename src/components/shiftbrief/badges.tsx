import { Badge } from "@/components/ui/shadcn/badge";
import {
  priorityLabel,
  riskLabel,
  shiftStatusLabel,
  taskStatusLabel,
  teamTypeLabel,
} from "@/lib/shiftbrief/format";
import type {
  Priority,
  RiskLevel,
  ShiftStatus,
  TaskStatus,
  TeamType,
} from "@/lib/shiftbrief/types";

const RISK_VARIANT = {
  low: "success",
  medium: "warning",
  high: "destructive",
} as const;

export function RiskBadge({ level }: { level: RiskLevel }) {
  return <Badge variant={RISK_VARIANT[level]}>{riskLabel(level)}</Badge>;
}

const PRIORITY_VARIANT = {
  low: "muted",
  medium: "warning",
  high: "destructive",
} as const;

export function PriorityBadge({ priority }: { priority: Priority }) {
  return (
    <Badge variant={PRIORITY_VARIANT[priority]}>
      {priorityLabel(priority)}
    </Badge>
  );
}

const SHIFT_STATUS_VARIANT = {
  open: "secondary",
  analyzing: "warning",
  brief_ready: "success",
  closed: "muted",
} as const;

export function ShiftStatusBadge({ status }: { status: ShiftStatus }) {
  return (
    <Badge variant={SHIFT_STATUS_VARIANT[status]}>
      {shiftStatusLabel(status)}
    </Badge>
  );
}

const TASK_STATUS_VARIANT = {
  todo: "muted",
  in_progress: "warning",
  done: "success",
} as const;

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return (
    <Badge variant={TASK_STATUS_VARIANT[status]}>
      {taskStatusLabel(status)}
    </Badge>
  );
}

export function TeamTypeBadge({ teamType }: { teamType: TeamType }) {
  return <Badge variant="outline">{teamTypeLabel(teamType)}</Badge>;
}
