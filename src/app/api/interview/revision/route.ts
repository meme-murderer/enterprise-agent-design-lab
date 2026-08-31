import { NextResponse } from "next/server";
import { reviewRevision } from "@/lib/openai";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { revisionRequestSchema } from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!checkRateLimit(`revision:${clientKey(request)}`, 8).allowed) {
    return NextResponse.json(
      { error: "Please wait before submitting another revision." },
      { status: 429 },
    );
  }
  const parsed = revisionRequestSchema.safeParse(await request.json());
  if (!parsed.success)
    return NextResponse.json(
      {
        error:
          "Add a specific rule. State what stops the test, who checks the work, or what a person must approve.",
      },
      { status: 400 },
    );
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12_000);
  try {
    return NextResponse.json(
      await reviewRevision(
        parsed.data.canvas,
        parsed.data.failureModes,
        parsed.data.revision,
        controller.signal,
      ),
    );
  } catch {
    return NextResponse.json({
      coachResponse:
        "Make the rule observable. Add a number, name who stops the test, and say that the work returns to the current process.",
    });
  } finally {
    clearTimeout(timeout);
  }
}
