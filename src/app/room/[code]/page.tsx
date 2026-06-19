import { ShiftHome } from "@/components/shiftbrief/shift-home";
import { createPageMetadata } from "@/lib/metadata";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";

export const metadata = createPageMetadata({
  title: "Shift home",
  description: "Your active ShiftBrief room.",
  path: "/room",
  type: "Home",
});

export default async function RoomPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  return <ShiftHome code={normalizeRoomCode(code)} />;
}
