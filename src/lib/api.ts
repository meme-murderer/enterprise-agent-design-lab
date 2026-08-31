import { NextResponse } from "next/server";
import { ZodError } from "zod";

export function apiError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        error:
          "Some information was missing or too long. Please review the form and try again.",
      },
      { status: 400 },
    );
  }

  if (error instanceof Error && error.message === "OPENAI_MODEL_REQUIRED") {
    return NextResponse.json(
      {
        error:
          "The workshop model is not configured. Ask the facilitator to set OPENAI_MODEL.",
      },
      { status: 503 },
    );
  }

  console.error("API request failed", error);
  return NextResponse.json(
    {
      error:
        "The interview paused for a moment. Your answers are safe in this browser; please retry.",
    },
    { status: 502 },
  );
}
