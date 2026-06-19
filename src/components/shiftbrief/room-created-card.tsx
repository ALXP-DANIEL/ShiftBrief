"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import type { ShiftRoom } from "@/lib/shiftbrief/types";
import { CopyButton } from "./copy-button";
import { RoomCodeBadge } from "./room-code-badge";

type RoomCreatedCardProps = {
  room: ShiftRoom;
  onReset: () => void;
};

export function RoomCreatedCard({ room, onReset }: RoomCreatedCardProps) {
  const [joinUrl, setJoinUrl] = useState(`/join/${room.code}`);

  useEffect(() => {
    setJoinUrl(`${window.location.origin}/join/${room.code}`);
  }, [room.code]);

  return (
    <Card className="border-emerald-500/30">
      <CardHeader>
        <CardTitle
          id="room-created-title"
          className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400"
        >
          <CheckCircleIcon size={18} weight="fill" />
          Shift room created
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <p className="text-sm text-muted-foreground">{room.title}</p>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Room code</p>
          <div className="flex items-center gap-2">
            <RoomCodeBadge code={room.code} size="lg" />
            <CopyButton value={room.code} label="Code" size="sm" />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">Join link</p>
          <div className="flex items-center gap-2">
            <code className="min-w-0 flex-1 truncate rounded-2xl border border-border bg-muted px-4 py-2 text-xs text-foreground">
              {joinUrl}
            </code>
            <CopyButton value={joinUrl} label="Link" size="sm" />
          </div>
          <p className="text-[11px] text-muted-foreground">
            Share this with workers. They can join from any phone, tablet, or
            laptop.
          </p>
        </div>

        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild size="lg" className="rounded-full sm:flex-1">
            <Link href={`/briefs/${room.code}`}>
              Open manager dashboard
              <ArrowRightIcon weight="bold" />
            </Link>
          </Button>
          <Button
            type="button"
            variant="outline"
            size="lg"
            className="rounded-full"
            onClick={onReset}
          >
            Create another
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
