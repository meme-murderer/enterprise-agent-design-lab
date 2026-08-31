import { NextResponse } from "next/server";
import { validFacilitatorPin } from "@/lib/auth";
import {
  listSubmissions,
  purgeSubmissions,
  sharingAvailable,
  storageMode,
} from "@/lib/share-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
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
  if (!sharingAvailable()) {
    return NextResponse.json(
      {
        error:
          "Live sharing is unavailable. Use the seeded offline examples instead.",
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    submissions: (await listSubmissions()) ?? [],
    storageMode: storageMode(),
  });
}

export async function DELETE(request: Request) {
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
  if (!sharingAvailable()) {
    return NextResponse.json(
      { error: "Shared canvases are not stored in this environment." },
      { status: 503 },
    );
  }

  const removed = await purgeSubmissions();
  if (removed === false) {
    return NextResponse.json(
      { error: "Shared canvases could not be purged." },
      { status: 503 },
    );
  }
  return NextResponse.json({ removed });
}
