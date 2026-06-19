// Small helpers for consistent API envelopes across route handlers.

import { NextResponse } from "next/server";

export function apiOk<T>(data: T): NextResponse {
  return NextResponse.json({ ok: true, data });
}

export function apiError(error: string, status = 400): NextResponse {
  return NextResponse.json({ ok: false, error }, { status });
}

/** Turn an unknown thrown value into a safe message string. */
export function errorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  return "Unexpected error";
}
