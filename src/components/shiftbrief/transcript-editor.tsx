"use client";

import { Label } from "@/components/ui/shadcn/label";
import { Textarea } from "@/components/ui/shadcn/textarea";

type TranscriptEditorProps = {
  value: string;
  onChange: (value: string) => void;
  onSourceChange?: (source: "speech" | "paste") => void;
  /** Whether the floating voice widget is available on this device. */
  voiceAvailable?: boolean;
  disabled?: boolean;
};

export function TranscriptEditor({
  value,
  onChange,
  onSourceChange,
  voiceAvailable,
  disabled,
}: TranscriptEditorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="transcript">Shift update</Label>

      <Textarea
        id="transcript"
        value={value}
        onChange={(event) => {
          onSourceChange?.("paste");
          onChange(event.target.value);
        }}
        placeholder="Type or paste your update. Example: Customer complained coffee machine was slow. Cash drawer not closed because of system lag."
        rows={6}
        maxLength={5000}
        disabled={disabled}
      />

      <p className="text-[11px] text-muted-foreground">
        {voiceAvailable
          ? "Tip: tap the floating mic to speak — your words fill this box and you can edit before submitting. Audio is never stored."
          : "Type or paste your update. Audio is never stored."}
      </p>
    </div>
  );
}
