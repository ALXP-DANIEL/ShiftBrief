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

type CodeLookupCardProps = {
  title: string;
  basePath: "/briefs" | "/tasks" | "/join";
  cta?: string;
};

export function CodeLookupCard({
  title,
  basePath,
  cta = "Open",
}: CodeLookupCardProps) {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const normalized = normalizeRoomCode(code);
    if (!isValidRoomCode(normalized)) {
      setError("Enter the 4–6 character room code.");
      return;
    }
    router.push(`${basePath}/${normalized}`);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="lookup-code">Room code</Label>
            <Input
              id="lookup-code"
              value={code}
              onChange={(event) => {
                setCode(normalizeRoomCode(event.target.value));
                setError(null);
              }}
              placeholder="ABCDE"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              className="text-center text-lg font-bold tracking-[0.4em] uppercase"
            />
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button type="submit" size="lg" className="w-full rounded-full">
            {cta}
            <ArrowRightIcon weight="bold" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
