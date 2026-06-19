"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/shadcn/dialog";
import {
  Drawer,
  DrawerContent,
  DrawerTitle,
} from "@/components/ui/shadcn/drawer";
import { cn } from "@/lib/utils";

/**
 * A modal that renders as a centered shadcn Dialog on desktop and a vaul bottom
 * sheet on mobile. Always open while mounted (the parent controls visibility by
 * conditionally rendering it) and not user-dismissible — the content provides
 * its own actions.
 */
export function ResponsiveDialog({
  children,
  className,
  labelledBy,
}: {
  children: React.ReactNode;
  className?: string;
  labelledBy: string;
}) {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 640px)");
    const sync = () => setDesktop(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  if (!desktop) {
    return (
      <Drawer open modal dismissible={false}>
        <DrawerContent className={className}>
          <DrawerTitle className="sr-only">Dialog</DrawerTitle>
          <div className="overflow-y-auto px-6 pt-2 pb-8">{children}</div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open>
      <DialogContent
        showCloseButton={false}
        aria-labelledby={labelledBy}
        // Override the compact registry defaults with the app's glass aesthetic
        // and a comfortable size (these win via tailwind-merge).
        className={cn(
          "glass block max-h-[92dvh] overflow-y-auto rounded-[2rem] bg-transparent p-7 text-sm text-foreground ring-0 sm:max-w-lg",
          className,
        )}
      >
        <DialogTitle className="sr-only">Dialog</DialogTitle>
        {children}
      </DialogContent>
    </Dialog>
  );
}
