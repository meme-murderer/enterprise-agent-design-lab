import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createQuestion } from "@/lib/openai";
import { detectSensitiveContent, privacyMessage } from "@/lib/privacy";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { processInputSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`interview:${clientKey(request)}`).allowed) {
      return NextResponse.json(
        { error: "Please wait a few minutes before trying again." },
        { status: 429 },
      );
    }

    const processInput = processInputSchema.parse(await request.json());
    const sensitive = detectSensitiveContent([
      processInput.name,
      processInput.outcome,
    ]);
    if (sensitive) {
      return NextResponse.json(
        { error: `${privacyMessage} We detected a possible ${sensitive}.` },
        { status: 422 },
      );
    }

    const result = await createQuestion(processInput, [], 1);
    return NextResponse.json({ ...result, questionNumber: 1 });
  } catch (error) {
    return apiError(error);
  }
}
