"use client";

import { PlusCircleIcon } from "@phosphor-icons/react/dist/ssr/PlusCircle";
import { SparkleIcon } from "@phosphor-icons/react/dist/ssr/Sparkle";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppAccess } from "@/components/layouts/app-access-gate";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Select } from "@/components/ui/shadcn/select";
import { createDemoShift, createShift } from "@/lib/shiftbrief/client";
import { TEAM_TYPE_OPTIONS } from "@/lib/shiftbrief/format";
import type { ShiftRoom, TeamType } from "@/lib/shiftbrief/types";
import { cn } from "@/lib/utils";
import { RoomCreatedCard } from "./room-created-card";

export function CreateRoomCard({ className }: { className?: string }) {
  const router = useRouter();
  const { grantAccess } = useAppAccess();
  const [title, setTitle] = useState("");
  const [teamType, setTeamType] = useState<TeamType>("cafe");
  const [adminPin, setAdminPin] = useState("");
  const [pending, setPending] = useState<"create" | "demo" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<ShiftRoom | null>(null);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    const trimmed = title.trim();
    if (trimmed.length < 2) {
      setError("Give the shift a short title.");
      return;
    }
    setError(null);
    setPending("create");
    try {
      const created = await createShift({
        title: trimmed,
        teamType,
        adminPin,
      });
      grantAccess(`/room/${created.code}`, created.code, "admin");
      setRoom(created);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not create room",
      );
    } finally {
      setPending(null);
    }
  }

  async function handleDemo() {
    if (pending) return;
    setError(null);
    setPending("demo");
    try {
      const created = await createDemoShift();
      grantAccess(`/room/${created.code}`, created.code, "admin");
      router.push(`/room/${created.code}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not start demo",
      );
      setPending(null);
    }
  }

  if (room) {
    return (
      <>
        <div className="grid min-h-48 place-items-center px-5 text-center">
          <p className="text-sm text-muted-foreground">
            Room created. Opening room details…
          </p>
        </div>
        <ResponsiveDialog labelledBy="room-created-title">
          <RoomCreatedCard room={room} onReset={() => setRoom(null)} />
        </ResponsiveDialog>
      </>
    );
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <span className="mb-2 grid size-10 place-items-center rounded-2xl bg-foreground text-background">
          <PlusCircleIcon size={21} weight="bold" />
        </span>
        <CardTitle className="text-base">Create a shift room</CardTitle>
        <p className="text-xs text-muted-foreground">
          Set up the room, then invite your team with a shareable code.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="shift-title">Shift title</Label>
            <Input
              id="shift-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="e.g. Evening Café Shift"
              maxLength={120}
              autoComplete="off"
              disabled={pending !== null}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="team-type">Team type</Label>
            <Select
              id="team-type"
              value={teamType}
              onChange={(event) => setTeamType(event.target.value as TeamType)}
              disabled={pending !== null}
            >
              {TEAM_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="admin-pin">Admin PIN</Label>
            <Input
              id="admin-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={adminPin}
              onChange={(event) =>
                setAdminPin(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="4–8 digits"
              minLength={4}
              maxLength={8}
              autoComplete="new-password"
              disabled={pending !== null}
              required
            />
            <p className="text-[11px] text-muted-foreground">
              Use this PIN to restore admin access on another device.
            </p>
          </div>

          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              type="submit"
              size="lg"
              className="rounded-full sm:flex-1"
              disabled={pending !== null}
            >
              <PlusCircleIcon weight="bold" />
              {pending === "create" ? "Creating…" : "Create room"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="lg"
              className="rounded-full"
              onClick={handleDemo}
              disabled={pending !== null}
            >
              <SparkleIcon weight="fill" />
              {pending === "demo" ? "Loading…" : "Demo room"}
            </Button>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Demo room loads the Evening Café Shift with five worker updates so
            you can try the full flow on one device.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
