"use client";

import { KeyboardIcon } from "@phosphor-icons/react/dist/ssr/Keyboard";
import { MicrophoneIcon } from "@phosphor-icons/react/dist/ssr/Microphone";
import { PaperPlaneTiltIcon } from "@phosphor-icons/react/dist/ssr/PaperPlaneTilt";
import { XIcon } from "@phosphor-icons/react/dist/ssr/X";
import { useCallback, useEffect, useState } from "react";
import { ResponsiveDialog } from "@/components/ui/responsive-dialog";
import { Button } from "@/components/ui/shadcn/button";
import { Input } from "@/components/ui/shadcn/input";
import { Label } from "@/components/ui/shadcn/label";
import { Textarea } from "@/components/ui/shadcn/textarea";
import type { AppRole } from "@/lib/shiftbrief/access";
import { submitUpdate } from "@/lib/shiftbrief/client";
import { MAX_TRANSCRIPT_CHARS } from "@/lib/shiftbrief/validation";
import { AudioScrubber } from "./audio-scrubber";
import { FloatingVoiceCapture } from "./floating-voice-capture";

type Profile = {
  name: string;
  jobRole: string;
  inputMode: "voice" | "text";
};

function profileKey(code: string, role: AppRole) {
  return `shiftbrief:profile:${code}:${role}`;
}

export function HomeVoiceUpdate({
  code,
  appRole,
  onSubmitted,
}: {
  code: string;
  appRole: AppRole;
  onSubmitted?: () => void;
}) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [jobRole, setJobRole] = useState(appRole === "admin" ? "Manager" : "");
  const [pendingProfile, setPendingProfile] = useState<Omit<
    Profile,
    "inputMode"
  > | null>(null);
  const [transcript, setTranscript] = useState("");
  const [audioDataUrl, setAudioDataUrl] = useState<string | null>(null);
  const [showReview, setShowReview] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [coolingDown, setCoolingDown] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(profileKey(code, appRole));
    if (!saved) return;

    try {
      const parsed = JSON.parse(saved) as Profile;
      if (parsed.name && parsed.jobRole && parsed.inputMode) setProfile(parsed);
    } catch {
      localStorage.removeItem(profileKey(code, appRole));
    }
  }, [appRole, code]);

  const handleTranscript = useCallback((text: string) => {
    setTranscript((current) => (current ? `${current.trim()} ${text}` : text));
  }, []);

  async function continueProfile(event: React.FormEvent) {
    event.preventDefault();
    const nextProfile = {
      name: name.trim(),
      jobRole: jobRole.trim(),
    };
    if (!nextProfile.name || !nextProfile.jobRole) {
      setError("Enter your name and role.");
      return;
    }
    setError(null);

    try {
      const permission = await navigator.permissions?.query({
        name: "microphone" as PermissionName,
      });
      if (permission?.state === "granted") {
        completeProfile("voice", nextProfile);
        return;
      }
      if (permission?.state === "denied") {
        completeProfile("text", nextProfile);
        return;
      }
    } catch {
      // Some browsers do not expose microphone through Permissions API.
    }

    setPendingProfile(nextProfile);
  }

  function completeProfile(
    inputMode: Profile["inputMode"],
    details = pendingProfile,
  ) {
    if (!details) return;
    const nextProfile = { ...details, inputMode };
    localStorage.setItem(
      profileKey(code, appRole),
      JSON.stringify(nextProfile),
    );
    setProfile(nextProfile);
    setPendingProfile(null);
    setError(null);
  }

  async function requestVoiceAccess() {
    if (!navigator.mediaDevices?.getUserMedia) {
      completeProfile("text");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => {
        track.stop();
      });
      completeProfile("voice");
    } catch {
      completeProfile("text");
    }
  }

  async function sendUpdate() {
    if (!profile || transcript.trim().length < 3 || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await submitUpdate(code, {
        workerName: profile.name,
        role: profile.jobRole,
        transcript: transcript.trim(),
        audioDataUrl,
        source: audioDataUrl ? "speech" : "paste",
      });
      setTranscript("");
      setAudioDataUrl(null);
      setShowReview(false);
      setCoolingDown(true);
      window.setTimeout(() => setCoolingDown(false), 1500);
      onSubmitted?.();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Could not submit");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {!profile && (
        <ResponsiveDialog labelledBy="profile-title">
          <p className="text-xs font-semibold tracking-[0.16em] text-muted-foreground uppercase">
            First time here
          </p>
          <h2
            id="profile-title"
            className="mt-2 text-2xl font-bold tracking-tight"
          >
            Tell your team who you are.
          </h2>
          <p className="mt-2 text-sm text-muted-foreground">
            This name and role will be attached to your voice updates.
          </p>

          {!pendingProfile ? (
            <form onSubmit={continueProfile} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="profile-name">Your name</Label>
                <Input
                  id="profile-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="e.g. Aina"
                  autoFocus
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="profile-role">Role</Label>
                <Input
                  id="profile-role"
                  value={jobRole}
                  onChange={(event) => setJobRole(event.target.value)}
                  placeholder={appRole === "admin" ? "Manager" : "e.g. Cashier"}
                />
              </div>
              {error && (
                <p className="text-xs text-destructive" role="alert">
                  {error}
                </p>
              )}
              <Button type="submit" size="lg" className="w-full rounded-full">
                Continue
              </Button>
            </form>
          ) : (
            <div className="mt-6 space-y-4">
              <div className="glass-tile rounded-3xl p-4">
                <div className="flex items-start gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background">
                    <MicrophoneIcon size={19} weight="fill" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      Allow voice updates?
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                      Your browser will request microphone access. Audio is
                      never stored—only recognized text is submitted.
                    </p>
                  </div>
                </div>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Button
                  type="button"
                  size="lg"
                  className="rounded-full"
                  onClick={() => void requestVoiceAccess()}
                >
                  <MicrophoneIcon weight="fill" />
                  Allow voice
                </Button>
                <Button
                  type="button"
                  size="lg"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => completeProfile("text")}
                >
                  <KeyboardIcon weight="bold" />
                  Use text only
                </Button>
              </div>
            </div>
          )}
        </ResponsiveDialog>
      )}

      {profile && showReview && (
        <ResponsiveDialog labelledBy="voice-review-title">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <p id="voice-review-title" className="text-sm font-semibold">
                {audioDataUrl ? "Review voice update" : "Write update"}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {profile.name} · {profile.jobRole}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setTranscript("");
                setAudioDataUrl(null);
                setShowReview(false);
              }}
              className="grid size-8 place-items-center rounded-full hover:bg-foreground/10"
              aria-label="Discard update"
            >
              <XIcon size={16} weight="bold" />
            </button>
          </div>
          {audioDataUrl ? (
            <>
              <AudioScrubber src={audioDataUrl} />
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                The transcript will be generated and shown with this recording
                after you send it.
              </p>
            </>
          ) : (
            <Textarea
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              disabled={submitting}
              autoFocus
            />
          )}
          {error && (
            <p className="mt-2 text-xs text-destructive" role="alert">
              {error}
            </p>
          )}
          <Button
            type="button"
            className="mt-3 w-full rounded-full"
            onClick={() => void sendUpdate()}
            disabled={submitting || transcript.trim().length < 3}
          >
            <PaperPlaneTiltIcon weight="fill" />
            {submitting ? "Sending…" : "Send update"}
          </Button>
        </ResponsiveDialog>
      )}

      {profile?.inputMode === "voice" && (
        <FloatingVoiceCapture
          onTranscript={handleTranscript}
          onAudioReady={setAudioDataUrl}
          onStop={() => setShowReview(true)}
          atCapacity={transcript.length >= MAX_TRANSCRIPT_CHARS}
          onType={() => {
            setAudioDataUrl(null);
            setTranscript("");
            setShowReview(true);
          }}
          disabled={submitting || coolingDown || showReview}
          dockToBottom={appRole === "worker"}
        />
      )}

      {profile?.inputMode === "text" && !showReview && (
        <button
          type="button"
          onClick={() => {
            setTranscript("");
            setShowReview(true);
          }}
          className={
            appRole === "worker"
              ? "glass fixed right-5 bottom-[max(1.5rem,env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full text-foreground sm:right-6 lg:right-10 lg:bottom-8 xl:right-16"
              : "glass fixed right-5 bottom-[calc(6.25rem+env(safe-area-inset-bottom))] z-40 grid size-14 place-items-center rounded-full text-foreground sm:right-6 lg:right-10 lg:bottom-8 xl:right-16"
          }
          aria-label="Type shift update"
          title="Type update"
        >
          <KeyboardIcon size={23} weight="fill" />
        </button>
      )}
    </>
  );
}
