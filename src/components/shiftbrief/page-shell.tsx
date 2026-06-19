import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { cn } from "@/lib/utils";

type PageShellProps = {
  children: React.ReactNode;
  /** Optional eyebrow/section label shown above the heading. */
  eyebrow?: string;
  heading?: string;
  description?: string;
  className?: string;
  width?: "md" | "lg" | "xl";
};

/**
 * Consistent page container that accounts for the fixed floating nav
 * (top on desktop, bottom on mobile).
 */
export function PageShell({
  children,
  eyebrow,
  heading,
  description,
  className,
  width = "md",
}: PageShellProps) {
  return (
    <main className="px-4 pt-16 pb-28 text-[var(--shift-home-text)] lg:pt-28 lg:pb-16">
      <div
        className={cn(
          "mx-auto w-full",
          width === "xl"
            ? "max-w-6xl"
            : width === "lg"
              ? "max-w-3xl"
              : "max-w-xl",
          className,
        )}
      >
        {(eyebrow || heading || description) && (
          <header className="mb-6 space-y-2">
            {eyebrow && (
              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide text-[var(--shift-home-muted)] uppercase">
                <SparkleIcon weight="fill" size={12} />
                {eyebrow}
              </span>
            )}
            {heading && (
              <h1 className="text-2xl font-bold tracking-tight">{heading}</h1>
            )}
            {description && (
              <p className="text-sm text-[var(--shift-home-muted)]">
                {description}
              </p>
            )}
          </header>
        )}
        {children}
      </div>
    </main>
  );
}
