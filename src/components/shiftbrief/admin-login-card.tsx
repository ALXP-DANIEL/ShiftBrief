"use client";

import { ShieldCheckIcon } from "@phosphor-icons/react/dist/ssr/ShieldCheck";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppAccess } from "@/components/layouts/app-access-gate";
import { Button } from "@/components/ui/shadcn/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/shadcn/card";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { loginAdmin } from "@/lib/shiftbrief/client";
import { normalizeRoomCode } from "@/lib/shiftbrief/room-code";
import { cn } from "@/lib/utils";

export function AdminLoginCard({ className }: { className?: string }) {
  const router = useRouter();
  const { grantAccess } = useAppAccess();
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (pending) return;
    setPending(true);
    setError(null);
    try {
      const room = await loginAdmin({ code: normalizeRoomCode(code), pin });
      grantAccess(`/room/${room.code}`, room.code, "admin");
      router.push(`/room/${room.code}`);
    } catch (caught) {
      setError(
        caught instanceof Error ? caught.message : "Could not restore access",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <span className="mb-2 grid size-10 place-items-center rounded-2xl bg-foreground text-background">
          <ShieldCheckIcon size={21} weight="fill" />
        </span>
        <CardTitle id="admin-login-title" className="text-base">
          Admin login
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Restore an existing room using its code and admin PIN.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="admin-room-code">Room code</Label>
            <Input
              id="admin-room-code"
              value={code}
              onChange={(event) =>
                setCode(normalizeRoomCode(event.target.value))
              }
              placeholder="ABCDE"
              maxLength={6}
              autoCapitalize="characters"
              autoComplete="off"
              className="text-center font-bold tracking-[0.3em] uppercase"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="admin-login-pin">Admin PIN</Label>
            <Input
              id="admin-login-pin"
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              value={pin}
              onChange={(event) =>
                setPin(event.target.value.replace(/\D/g, "").slice(0, 8))
              }
              placeholder="••••"
              minLength={4}
              maxLength={8}
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p className="text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            size="lg"
            className="w-full rounded-full"
            disabled={pending}
          >
            <ShieldCheckIcon weight="fill" />
            {pending ? "Checking…" : "Restore admin access"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
