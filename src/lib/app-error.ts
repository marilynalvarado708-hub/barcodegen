import { NextResponse } from "next/server";

/**
 * Expected client error (validation, auth, insufficient credits, etc.).
 * Its message is safe to return to the browser; its status code is preserved.
 */
export class AppError extends Error {
  readonly statusCode: number;
  constructor(message: string, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
    this.name = "AppError";
  }
}

/**
 * Handle an unexpected error: log the real details server-side and return a
 * generic message to the client so internals never leak to the browser.
 */
export function handleError(e: unknown, context = "api") {
  console.error(`[${context}]`, e);
  if (e instanceof AppError) {
    return NextResponse.json(
      { ok: false, error: e.message },
      { status: e.statusCode },
    );
  }
  return NextResponse.json(
    { ok: false, error: "An unexpected error occurred" },
    { status: 500 },
  );
}
