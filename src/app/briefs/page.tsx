import Link from "next/link";
import { CodeLookupCard } from "@/components/shiftbrief/code-lookup-card";
import { PageShell } from "@/components/shiftbrief/page-shell";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Briefs",
  description: "Open a manager dashboard by room code to monitor updates.",
  path: "/briefs",
  type: "Briefs",
});

export default function BriefsPage() {
  return (
    <PageShell
      eyebrow="Briefs"
      heading="Manager dashboard"
      description="Enter a room code to monitor worker updates and generate the combined brief."
    >
      <div className="space-y-4">
        <CodeLookupCard
          title="Open a shift room"
          basePath="/briefs"
          cta="Open dashboard"
        />
        <p className="text-center text-xs text-muted-foreground">
          No room yet?{" "}
          <Link href="/" className="font-semibold text-foreground underline">
            Create one
          </Link>
          .
        </p>
      </div>
    </PageShell>
  );
}
