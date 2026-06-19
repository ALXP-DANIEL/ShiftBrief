"use client";

import { ArrowRightIcon } from "@phosphor-icons/react/dist/ssr/ArrowRight";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { isValidRoomCode, normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { cn } from "@/lib/utils";

export function JoinLookupForm({ className }: { className?: string }) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError("Enter the 4–6 character room code from your manager.");
      return;
    }
    router.push(`/join/${normalized}`);
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <span className="mb-2 grid size-10 place-items-center rounded-2xl bg-foreground text-background">
          <ArrowRightIcon size={21} weight="bold" />
        </span>
        <CardTitle className="text-base">Join a shift room</CardTitle>
        <p className="text-xs text-muted-foreground">
          Use the code shared by your manager to open your team workspace.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="room-code">Room code</Label>
            <Input
              id="room-code"
              value={code}
              onChange={(event) => {
                setCode(normalizeRoomCode(event.target.value));
                setError(null);
              }}
              placeholder="ABCDE"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              inputMode="text"
              className="text-center text-lg font-bold tracking-[0.4em] uppercase"
            />
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full rounded-full">
            Continue
            <ArrowRightIcon weight="bold" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
