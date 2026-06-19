import Link from "next/link";
import { CodeLookupCard } from "@/components/shiftbrief/code-lookup-card";
import { PageShell } from "@/components/shiftbrief/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Tasks",
  description: "Track extracted shift tasks by room code.",
  path: "/tasks",
  type: "Tasks",
});

export default function TasksPage() {
  return (
    <PageShell
      eyebrow="Tasks"
      heading="Shift task board"
      description="Enter a room code to track the tasks extracted from the combined brief."
    >
      <div className="space-y-4">
        <CodeLookupCard
          title="Open a task board"
          basePath="/tasks"
          cta="Open tasks"
        />
        <p className="text-center text-xs text-muted-foreground">
          Tasks appear after a brief is generated on the{" "}
          <Link
            href="/briefs"
            className="font-semibold text-foreground underline"
          >
            manager dashboard
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
