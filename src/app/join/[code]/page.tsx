import { JoinRoomForm } from "@/components/shiftbrief/join-room-form";
import { PageShell } from "@/components/shiftbrief/page-shell";
import { createPageMetadata } from "@/lib/metadata";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";

export const metadata = createPageMetadata({
  title: "Submit shift update",
  description: "Add your shift update to the room.",
  path: "/join",
  type: "Join",
});

export default async function JoinCodePage({
  params,
}: PageProps<"/join/[code]">) {
  const { code } = await params;
  return (
    <PageShell
      eyebrow="Join"
      heading="Add your update"
      description="Type, paste, or speak what happened on your part of the shift."
    >
      <JoinRoomForm code={normalizeRoomCode(code)} />
    </PageShell>
  );
}
