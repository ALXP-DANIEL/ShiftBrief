import { JoinLookupForm } from "@/components/shiftbrief/join-lookup-form";
import { PageShell } from "@/components/shiftbrief/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Join a shift",
  description: "Enter your room code to join a shift and submit an update.",
  path: "/join",
  type: "Join",
});

export default function JoinPage() {
  return (
    <PageShell
      eyebrow="Join"
      heading="Join your shift room"
      description="Enter the room code your manager shared, then add your update."
    >
      <JoinLookupForm />
    </PageShell>
  );
}
