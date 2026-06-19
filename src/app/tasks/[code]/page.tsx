import { PageShell } from "@/components/shiftbrief/page-shell";
import { TasksView } from "@/components/shiftbrief/tasks-view";
import { createPageMetadata } from "@/lib/metadata";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";

export const metadata = createPageMetadata({
  title: "Shift tasks",
  description: "Track and update the status of extracted shift tasks.",
  path: "/tasks",
  type: "Tasks",
});

export default async function TaskCodePage({
  params,
}: PageProps<"/tasks/[code]">) {
  const { code } = await params;
  return (
    <PageShell width="xl">
      <TasksView code={normalizeRoomCode(code)} />
    </PageShell>
  );
}
