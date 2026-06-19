import { ManagerDashboard } from "@/components/shiftbrief/manager-dashboard";
import { PageShell } from "@/components/shiftbrief/page-shell";
import { createPageMetadata } from "@/lib/metadata";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";

export const metadata = createPageMetadata({
  title: "Manager dashboard",
  description: "Monitor worker updates and generate the combined shift brief.",
  path: "/briefs",
  type: "Briefs",
});

export default async function BriefCodePage({
  params,
}: PageProps<"/briefs/[code]">) {
  const { code } = await params;
  return (
    <PageShell width="xl">
      <ManagerDashboard code={normalizeRoomCode(code)} />
    </PageShell>
  );
}
