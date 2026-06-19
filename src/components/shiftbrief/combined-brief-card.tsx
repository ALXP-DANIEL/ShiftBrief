"use client";

import { CheckSquareIcon } from "@phosphor-icons/react/dist/ssr/CheckSquare";
import { DownloadSimpleIcon } from "@phosphor-icons/react/dist/ssr/DownloadSimple";
import { ListChecksIcon } from "@phosphor-icons/react/dist/ssr/ListChecks";
import { QuestionIcon } from "@phosphor-icons/react/dist/ssr/Question";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr/Warning";
import Link from "next/link";
import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { briefToPlainText } from "@/lib/shiftbrief/format";
import type { AnalyzeMode, CombinedBrief } from "@/lib/shiftbrief/types";
import { RiskBadge } from "./badges";
import { CopyButton } from "./copy-button";

type CombinedBriefCardProps = {
  brief: CombinedBrief;
  shiftTitle: string;
  roomCode: string;
  mode?: AnalyzeMode;
  warning?: string;
};

function SectionTitle({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <h3 className="mb-2 flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
      {icon}
      {children}
    </h3>
  );
}

export function CombinedBriefCard({
  brief,
  shiftTitle,
  roomCode,
  mode,
  warning,
}: CombinedBriefCardProps) {
  function handleExport() {
    const text = briefToPlainText(brief, shiftTitle);
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `shiftbrief-${roomCode}.txt`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <CardTitle className="text-base">{brief.briefTitle}</CardTitle>
          <div className="flex items-center gap-1.5">
            <RiskBadge level={brief.riskLevel} />
            {mode && (
              <Badge variant={mode === "ai" ? "secondary" : "muted"}>
                {mode === "ai" ? "AI" : "Offline"}
              </Badge>
            )}
          </div>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Confidence {Math.round(brief.confidence * 100)}%
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {warning && (
          <div className="flex items-start gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
            <WarningIcon weight="fill" size={15} className="mt-px shrink-0" />
            <span>{warning}</span>
          </div>
        )}

        <p className="text-sm leading-relaxed text-foreground/90">
          {brief.summary}
        </p>

        {brief.issues.length > 0 && (
          <section>
            <SectionTitle icon={<WarningIcon size={14} />}>
              Issues ({brief.issues.length})
            </SectionTitle>
            <ul className="space-y-2.5">
              {brief.issues.map((issue) => (
                <li key={issue.title} className="glass-tile rounded-2xl p-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-medium">{issue.title}</span>
                    <RiskBadge level={issue.severity} />
                  </div>
                  {issue.details && (
                    <p className="mt-1 text-xs text-muted-foreground">
                      {issue.details}
                    </p>
                  )}
                  {issue.mentionedBy.length > 0 && (
                    <p className="mt-1 text-[11px] text-muted-foreground">
                      Mentioned by {issue.mentionedBy.join(", ")}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {brief.missingInformation.length > 0 && (
          <section>
            <SectionTitle icon={<QuestionIcon size={14} />}>
              Missing information
            </SectionTitle>
            <ul className="space-y-2">
              {brief.missingInformation.map((item) => (
                <li key={item.question} className="text-sm">
                  <p className="font-medium">{item.question}</p>
                  {item.whyNeeded && (
                    <p className="text-xs text-muted-foreground">
                      {item.whyNeeded}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          </section>
        )}

        {brief.nextShiftChecklist.length > 0 && (
          <section>
            <SectionTitle icon={<ListChecksIcon size={14} />}>
              Next-shift checklist
            </SectionTitle>
            <ul className="space-y-1.5">
              {brief.nextShiftChecklist.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm">
                  <span className="mt-0.5 grid size-4 shrink-0 place-items-center rounded-sm border border-border text-[10px]">
                    ☐
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        <section>
          <SectionTitle icon={<ListChecksIcon size={14} />}>
            Follow-up message
          </SectionTitle>
          <div className="glass-tile rounded-2xl p-3">
            <p className="text-sm whitespace-pre-wrap">
              {brief.followUpMessage}
            </p>
            <div className="mt-3">
              <CopyButton
                value={brief.followUpMessage}
                label="Copy message"
                copiedLabel="Copied message"
                variant="default"
                size="sm"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-4">
          <Button asChild size="sm" className="rounded-full">
            <Link href={`/tasks/${roomCode}`}>
              <CheckSquareIcon weight="bold" />
              Open tasks ({brief.tasks.length})
            </Link>
          </Button>
          <CopyButton
            value={briefToPlainText(brief, shiftTitle)}
            label="Copy full brief"
            copiedLabel="Copied brief"
            size="sm"
          />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-full"
            onClick={handleExport}
          >
            <DownloadSimpleIcon weight="bold" />
            Export .txt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
