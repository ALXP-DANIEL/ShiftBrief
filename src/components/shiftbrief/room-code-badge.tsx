import { cn } from "@/lib/utils";

type RoomCodeBadgeProps = {
  code: string;
  className?: string;
  size?: "sm" | "lg";
};

/** Displays a room code with the characters spaced out for easy reading. */
export function RoomCodeBadge({
  code,
  className,
  size = "sm",
}: RoomCodeBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border bg-muted font-bold tracking-[0.35em] text-foreground",
        size === "lg"
          ? "px-4 py-2 text-2xl"
          : "px-2.5 py-1 text-sm tracking-[0.25em]",
        className,
      )}
    >
      {/* Trailing margin compensation for letter-spacing on the last char. */}
      <span className="-mr-[0.35em]">{code}</span>
    </span>
  );
}
