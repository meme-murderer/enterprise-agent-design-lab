import { NextResponse } from "next/server";
import { validFacilitatorPin } from "@/lib/auth";
import {
  listUsageEvents,
  purgeUsageEvents,
  summarizeUsage,
  usageStorageMode,
} from "@/lib/usage-monitor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function authorize(request: Request) {
  if (!process.env.FACILITATOR_PIN) {
    return NextResponse.json(
      { error: "Facilitator access is not configured." },
      { status: 503 },
    );
  }
  if (!validFacilitatorPin(request.headers.get("x-facilitator-pin"))) {
    return NextResponse.json(
      { error: "Incorrect facilitator PIN." },
      { status: 401 },
    );
  }
  if (usageStorageMode() === "disabled") {
    return NextResponse.json(
      { error: "Live usage monitoring is not configured." },
      { status: 503 },
    );
  }
  return null;
}

export async function GET(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

  try {
    const events = (await listUsageEvents()) ?? [];
    return NextResponse.json({
      summary: summarizeUsage(events),
      storageMode: usageStorageMode(),
    });
  } catch (error) {
    console.error("Usage monitor could not be loaded", error);
    return NextResponse.json(
      { error: "Live usage could not be loaded." },
      { status: 503 },
    );
  }
}

export async function DELETE(request: Request) {
  const denied = authorize(request);
  if (denied) return denied;

  try {
    const removed = await purgeUsageEvents();
    if (removed === false) throw new Error("USAGE_PURGE_UNAVAILABLE");
    return NextResponse.json({ removed });
  } catch (error) {
    console.error("Usage monitor could not be cleared", error);
    return NextResponse.json(
      { error: "Live usage could not be cleared." },
      { status: 503 },
    );
  }
}
