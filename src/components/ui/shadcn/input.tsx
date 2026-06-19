import type * as React from "react";

import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-10 w-full min-w-0 rounded-full border border-input bg-background/50 px-4 py-1 text-sm shadow-xs backdrop-blur-sm transition-[color,box-shadow] outline-none",
        "placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground",
        "focus-visible:border-ring focus-visible:ring-1 focus-visible:ring-ring/50",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        "aria-invalid:border-destructive aria-invalid:ring-1 aria-invalid:ring-destructive/20 dark:bg-input/30",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
