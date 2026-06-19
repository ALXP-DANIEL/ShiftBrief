import { CaretDownIcon } from "@phosphor-icons/react/dist/ssr/CaretDown";
import type * as React from "react";

import { cn } from "@/lib/utils";

/**
 * A styled native <select>. Native is intentional here: it is fully accessible,
 * works on every device (great for the worker-on-a-phone flow), and needs no
 * extra dependencies.
 */
function Select({
  className,
  children,
  ...props
}: React.ComponentProps<"select">) {
  return (
    <div className="relative">
      <select
        data-slot="select"
        className={cn(
          "flex h-10 w-full appearance-none rounded-full border border-input bg-background/50 px-4 py-1 pr-9 text-sm shadow-xs backdrop-blur-sm transition-[color,box-shadow] outline-none",
          "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
          "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30",
          className,
        )}
        {...props}
      >
        {children}
      </select>
      <CaretDownIcon
        size={14}
        weight="bold"
        className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground"
      />
    </div>
  );
}

export { Select };
