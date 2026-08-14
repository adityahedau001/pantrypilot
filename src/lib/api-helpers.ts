import { NextResponse } from "next/server";
import { DatabaseUnavailableError } from "./db";

/**
 * Wraps a route handler so that any DatabaseUnavailableError becomes a clean
 * 503 with a message the UI can show, instead of a raw 500 crash.
 */
export function withApiErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<NextResponse>
) {
  return async (...args: Args): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof DatabaseUnavailableError) {
        return NextResponse.json(
          { error: "database_unavailable", message: err.message },
          { status: 503 }
        );
      }
      console.error("Unhandled API error:", err);
      return NextResponse.json(
        { error: "internal_error", message: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
  };
}
