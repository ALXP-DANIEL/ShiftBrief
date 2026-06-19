"use client";

import { CheckIcon } from "@phosphor-icons/react/dist/ssr/Check";
import { CopyIcon } from "@phosphor-icons/react/dist/ssr/Copy";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/shadcn/button";
import { cn } from "@/lib/utils";

type CopyButtonProps = {
  value: string;
  label?: string;
  copiedLabel?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "xs" | "lg" | "icon" | "icon-sm";
};

export function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  className,
  variant = "outline",
  size = "sm",
}: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can fail on insecure origins; silently ignore.
    }
  }, [value]);

  const iconOnly = size === "icon" || size === "icon-sm";

  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      onClick={handleCopy}
      className={cn("rounded-full", className)}
      aria-label={copied ? copiedLabel : label}
    >
      {copied ? <CheckIcon weight="bold" /> : <CopyIcon weight="bold" />}
      {!iconOnly && <span>{copied ? copiedLabel : label}</span>}
    </Button>
  );
}
