import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import { shareRequestSchema } from "@/lib/schemas";
import {
  saveSubmission,
  sharingAvailable,
  storageMode,
} from "@/lib/share-store";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!sharingAvailable()) {
      return NextResponse.json(
        {
          error:
            "Anonymous sharing is not available. Your canvas is still complete on this device.",
        },
        { status: 503 },
      );
    }
    if (
      !checkRateLimit(`share:${clientKey(request)}`, 4, 60 * 60 * 1000).allowed
    ) {
      return NextResponse.json(
        { error: "This device has reached the sharing limit." },
        { status: 429 },
      );
    }

    const { canvas } = shareRequestSchema.parse(await request.json());
    const shareId = randomBytes(3).toString("hex").toUpperCase();
    await saveSubmission({
      shareId,
      sharedAt: new Date().toISOString(),
      canvas,
    });
    return NextResponse.json({
      shared: true,
      shareId,
      storageMode: storageMode(),
    });
  } catch (error) {
    return apiError(error);
  }
}
