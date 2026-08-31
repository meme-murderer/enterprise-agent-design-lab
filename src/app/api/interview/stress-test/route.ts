import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createStressTests } from "@/lib/openai";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { stressTestRequestSchema } from "@/lib/schemas";
import { deterministicFailureModes } from "@/lib/pre-mortem";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`stress:${clientKey(request)}`, 8).allowed) {
      return NextResponse.json(
        { error: "Please wait before running another stress test." },
        { status: 429 },
      );
    }
    const { canvas } = stressTestRequestSchema.parse(await request.json());
    const deterministic = deterministicFailureModes(canvas);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const generated = await createStressTests(canvas, controller.signal);
      return NextResponse.json({
        stressTests: [...deterministic, ...generated.stressTests].slice(0, 4),
      });
    } catch {
      return NextResponse.json({ stressTests: deterministic, degraded: true });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    return apiError(error);
  }
}
