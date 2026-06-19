import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { RoomEntryPanel } from "@/components/shiftbrief/room-entry-panel";
import { createPageMetadata } from "@/lib/metadata";

export const metadata = createPageMetadata({
  title: "Create or join a shift room",
  description:
    "Create a new shift room or join an existing room to start using ShiftBrief.",
  path: "/",
  type: "Get started",
});

export default function CreatePage() {
  return (
    <main className="relative min-h-svh overflow-hidden px-4 py-8 text-[var(--shift-home-text)] sm:px-6 lg:grid lg:place-items-center lg:px-10 lg:py-12">
      <div className="pointer-events-none absolute top-[-12rem] left-[-10rem] size-[28rem] rounded-full bg-foreground/5 blur-3xl" />
      <div className="pointer-events-none absolute right-[-12rem] bottom-[-14rem] size-[32rem] rounded-full bg-foreground/5 blur-3xl" />

      <div className="relative mx-auto grid w-full max-w-5xl gap-8 lg:grid-cols-[1fr_0.85fr] lg:items-center lg:gap-14">
        <section className="flex flex-col items-start py-4 lg:py-10">
          <div className="glass mb-8 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-semibold">
            <SparkleIcon size={15} weight="fill" />
            ShiftBrief
          </div>

          <p className="mb-3 text-xs font-semibold tracking-[0.18em] text-[var(--shift-home-muted)] uppercase">
            Your shift starts here
          </p>
          <h1 className="max-w-xl text-4xl leading-[1.05] font-bold tracking-[-0.045em] text-balance sm:text-5xl lg:text-6xl">
            One place for a clear shift handover.
          </h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-[var(--shift-home-muted)] sm:text-base">
            Create a room for your team or join one with a code. Your briefs,
            updates, and tasks become available after you connect.
          </p>

          <ul className="mt-8 grid gap-3 text-sm text-[var(--shift-home-muted)] sm:grid-cols-3 lg:grid-cols-1">
            {[
              "No account setup required",
              "Works across phones and laptops",
              "One shared handover for the team",
            ].map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckCircleIcon
                  size={17}
                  weight="fill"
                  className="shrink-0 text-[var(--shift-home-text)]"
                />
                {item}
              </li>
            ))}
          </ul>
        </section>

        <RoomEntryPanel />
      </div>
    </main>
  );
}
