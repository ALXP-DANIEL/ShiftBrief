"use client";

import { CheckCircleIcon } from "@phosphor-icons/react/dist/ssr/CheckCircle";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { WarningCircleIcon } from "@phosphor-icons/react/dist/ssr/WarningCircle";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
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
import { useShiftRoom } from "@/hooks/use-shift-room";
import { isSpeechRecognitionSupported } from "@/hooks/use-speech-recognition";
import { submitUpdate } from "@/lib/shiftbrief/client";
import { teamTypeLabel } from "@/lib/shiftbrief/format";
import type { UpdateSource } from "@/lib/shiftbrief/types";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/shiftbrief/validation";
import { FloatingVoiceCapture } from "./floating-voice-capture";
import { RoomCodeBadge } from "./room-code-badge";
import { TranscriptEditor } from "./transcript-editor";

const NAME_KEY = "shiftbrief:workerName";
const ROLE_KEY = "shiftbrief:role";

export function JoinRoomForm({ code }: { code: string }) {
  const { bundle, status } = useShiftRoom(code, { poll: false });
  const { grantAccess, role: appRole } = useAppAccess();

  const [workerName, setWorkerName] = useState("");
  const [role, setRole] = useState("");
  const [transcript, setTranscript] = useState("");
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [source, setSource] = useState<UpdateSource>("paste");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submittedCount, setSubmittedCount] = useState(0);
  const [voiceAvailable, setVoiceAvailable] = useState(false);

  useEffect(() => {
    setVoiceAvailable(isSpeechRecognitionSupported());
  }, []);

  const handleVoiceTranscript = useCallback((finalText: string) => {
    setSource("speech");
    setTranscript((prev) => (prev ? `${prev.trim()} ${finalText}` : finalText));
  }, []);

  // Restore the worker's name/role on their own device for quick re-submits.
  useEffect(() => {
    setWorkerName(localStorage.getItem(NAME_KEY) ?? "");
    setRole(localStorage.getItem(ROLE_KEY) ?? "");
  }, []);

  useEffect(() => {
    if (bundle && !appRole) {
      grantAccess(`/room/${bundle.room.code}`, bundle.room.code, "worker");
    }
  }, [appRole, bundle, grantAccess]);

  if (status === "loading") {
    return (
      <Card>
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Loading room…
        </CardContent>
      </Card>
    );
  }

  if (!bundle) {
    return (
      <Card className="border-destructive/30">
        <CardContent className="space-y-4 py-8 text-center">
          <WarningCircleIcon
            size={32}
            weight="fill"
            className="mx-auto text-destructive"
          />
          <div>
            <p className="text-sm font-semibold">Room not found</p>
            <p className="text-xs text-muted-foreground">
              Check the code <RoomCodeBadge code={code} /> with your manager.
            </p>
          </div>
          <Button asChild variant="outline" className="rounded-full">
            <Link href="/join">Try another code</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const { room } = bundle;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (submitting) return;
    const name = workerName.trim();
    const roleValue = role.trim();
    const text = transcript.trim();
    if (!name || !roleValue) {
      setError("Enter your name and role.");
      return;
    }
    if (text.length < 3) {
      setError("Add a short update before submitting.");
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await submitUpdate(code, {
        workerName: name,
        role: roleValue,
        transcript: text,
        audioDataUrl,
        source,
      });
      localStorage.setItem(NAME_KEY, name);
      localStorage.setItem(ROLE_KEY, roleValue);
      setTranscript("");
      setAudioDataUrl(null);
      setSource("paste");
      setSubmittedCount((count) => count + 1);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center justify-between gap-2">
            <span>{room.title}</span>
            <RoomCodeBadge code={room.code} />
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            {teamTypeLabel(room.teamType)} shift · {bundle.updates.length}{" "}
            update
            {bundle.updates.length === 1 ? "" : "s"} so far
          </p>
        </CardHeader>
        <CardContent>
          {submittedCount > 0 && (
            <div className="mb-4 flex items-center gap-2 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircleIcon weight="fill" size={16} />
              Update sent. The manager will see it shortly. Add another if you
              remember more.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="worker-name">Your name</Label>
                <Input
                  id="worker-name"
                  value={workerName}
                  onChange={(event) => setWorkerName(event.target.value)}
                  placeholder="e.g. Aina"
                  maxLength={80}
                  autoComplete="name"
                  disabled={submitting}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="worker-role">Role</Label>
                <Input
                  id="worker-role"
                  value={role}
                  onChange={(event) => setRole(event.target.value)}
                  placeholder="e.g. Cashier"
                  maxLength={80}
                  autoComplete="off"
                  disabled={submitting}
                />
              </div>
            </div>

            <TranscriptEditor
              value={transcript}
              onChange={setTranscript}
              onSourceChange={setSource}
              voiceAvailable={voiceAvailable}
              disabled={submitting}
            />

            {error && (
              <p className="text-xs text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex flex-col gap-2">
              <Button
                type="submit"
                size="lg"
                className="rounded-full sm:flex-1"
                disabled={submitting}
              >
                <PaperPlaneTiltIcon weight="fill" />
                {submitting ? "Sending…" : "Submit update"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <FloatingVoiceCapture
        onTranscript={handleVoiceTranscript}
        onAudioReady={setAudioDataUrl}
        atCapacity={transcript.length >= MAX_TRANSCRIPT_CHARS}
        onType={() => {
          setSource("paste");
          document.getElementById("transcript")?.focus();
        }}
        disabled={submitting}
      />
    </>
  );
}
