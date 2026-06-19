"use client";

import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/shadcn/button";
import { AdminLoginCard } from "./admin-login-card";
import { CreateRoomCard } from "./create-room-card";
import { JoinLookupForm } from "./join-lookup-form";

export function RoomEntryPanel() {
  const [adminOpen, setAdminOpen] = useState(false);

  return (
    <section className="glass overflow-hidden rounded-[2.25rem] p-2 sm:p-3">
      <div className="grid gap-2">
        <CreateRoomCard className="border-0 bg-card/55 shadow-none backdrop-blur-none" />
        <div className="flex items-center gap-3 px-5">
          <span className="h-px flex-1 bg-border" />
          <span className="text-[10px] font-semibold tracking-[0.18em] text-muted-foreground uppercase">
            or
          </span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <JoinLookupForm className="border-0 bg-card/55 shadow-none backdrop-blur-none" />
        <Button
          type="button"
          variant="ghost"
          className="mx-3 mb-2 rounded-full text-muted-foreground"
          onClick={() => setAdminOpen(true)}
        >
          <ShieldCheckIcon weight="fill" />
          Returning admin?
        </Button>
      </div>

      {adminOpen && (
        <ResponsiveDialog labelledBy="admin-login-title">
          <div className="mb-3 flex justify-end">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-full"
              onClick={() => setAdminOpen(false)}
            >
              Close
            </Button>
          </div>
          <AdminLoginCard className="border-0 bg-transparent shadow-none backdrop-blur-none" />
        </ResponsiveDialog>
      )}
    </section>
  );
}
