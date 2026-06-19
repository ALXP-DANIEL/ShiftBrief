"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in the DOM lib by default).
interface SpeechAlternative {
  transcript: string;
}
interface SpeechResult {
  isFinal: boolean;
  0: SpeechAlternative;
}
interface SpeechResultList {
  length: number;
  [index: number]: SpeechResult;
}
interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: SpeechResultList;
}
interface SpeechRecognitionErrorLike {
  error: string;
}
interface SpeechRecognitionLike {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorLike) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechRecognitionSupported(): boolean {
  return getRecognitionCtor() !== null;
}

type UseSpeechRecognitionOptions = {
  lang?: string;
  /** Called with each finalized chunk of speech. */
  onResult: (finalText: string) => void;
};

export function useSpeechRecognition({
  lang = "en-US",
  onResult,
}: UseSpeechRecognitionOptions) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const onResultRef = useRef(onResult);
  const manualStopRef = useRef(false);

  useEffect(() => {
    onResultRef.current = onResult;
  }, [onResult]);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  const stop = useCallback(() => {
    manualStopRef.current = true;
    recognitionRef.current?.stop();
    setListening(false);
    setInterim("");
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) {
      setError("Speech recognition is not supported in this browser.");
      return;
    }
    setError(null);
    manualStopRef.current = false;

    const recognition = new Ctor();
    recognition.lang = lang;
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      let interimText = "";
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        const text = result[0]?.transcript ?? "";
        if (result.isFinal) {
          const trimmed = text.trim();
          if (trimmed) onResultRef.current(trimmed);
        } else {
          interimText += text;
        }
      }
      setInterim(interimText);
    };

    recognition.onerror = (event) => {
      if (event.error === "no-speech" || event.error === "aborted") return;
      setError(
        event.error === "not-allowed"
          ? "Microphone access was denied."
          : `Speech error: ${event.error}`,
      );
    };

    recognition.onend = () => {
      setInterim("");
      // Auto-restart for continuous capture unless the user stopped it.
      if (!manualStopRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // fall through to stopped state
        }
      }
      setListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Could not start speech recognition.");
      setListening(false);
    }
  }, [lang]);

  useEffect(() => {
    return () => {
      manualStopRef.current = true;
      recognitionRef.current?.abort();
    };
  }, []);

  return { supported, listening, interim, error, start, stop };
}
