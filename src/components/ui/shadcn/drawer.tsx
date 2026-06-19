"use client";

import type * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

function Drawer(props: React.ComponentProps<typeof DrawerPrimitive.Root>) {
  return <DrawerPrimitive.Root data-slot="drawer" {...props} />;
}

function DrawerPortal(
  props: React.ComponentProps<typeof DrawerPrimitive.Portal>,
) {
  return <DrawerPrimitive.Portal data-slot="drawer-portal" {...props} />;
}

function DrawerOverlay({
  className,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Overlay>) {
  return (
    <DrawerPrimitive.Overlay
      data-slot="drawer-overlay"
      className={cn(
        "fixed inset-0 z-[80] bg-black/35 backdrop-blur-md",
        className,
      )}
      {...props}
    />
  );
}

function DrawerContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Content>) {
  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        data-slot="drawer-content"
        className={cn(
          "glass fixed inset-x-0 bottom-0 z-[81] flex max-h-[92dvh] flex-col rounded-t-[2rem] text-foreground outline-none",
          className,
        )}
        {...props}
      >
        <div className="mx-auto mt-3 h-1.5 w-12 shrink-0 rounded-full bg-muted-foreground/30" />
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
}

function DrawerTitle(
  props: React.ComponentProps<typeof DrawerPrimitive.Title>,
) {
  return <DrawerPrimitive.Title data-slot="drawer-title" {...props} />;
}

function DrawerDescription(
  props: React.ComponentProps<typeof DrawerPrimitive.Description>,
) {
  return (
    <DrawerPrimitive.Description data-slot="drawer-description" {...props} />
  );
}

export {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerOverlay,
  DrawerPortal,
  DrawerTitle,
};
