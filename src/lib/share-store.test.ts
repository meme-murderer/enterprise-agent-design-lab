import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { demoCanvases } from "@/lib/demo-data";
import {
  DELETE as deleteFacilitatorSubmissions,
  GET as getFacilitatorSubmissions,
} from "@/app/api/facilitator/submissions/route";
import {
  listSubmissions,
  purgeSubmissions,
  saveSubmission,
  sharingAvailable,
  storageMode,
} from "@/lib/share-store";

let temporaryDirectory = "";

describe("local workshop submission storage", () => {
  beforeEach(async () => {
    temporaryDirectory = await mkdtemp(path.join(os.tmpdir(), "agent-lab-"));
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("GCP_PROJECT_ID", "");
    vi.stubEnv("GOOGLE_CLOUD_PROJECT", "");
    vi.stubEnv("REDIS_URL", "");
    vi.stubEnv("REDIS_TOKEN", "");
    vi.stubEnv(
      "LOCAL_SHARE_FILE",
      path.join(temporaryDirectory, "submissions.json"),
    );
  });

  afterEach(async () => {
    vi.unstubAllEnvs();
    await rm(temporaryDirectory, { force: true, recursive: true });
  });

  it("stores and returns a shared canvas without cloud services", async () => {
    expect(storageMode()).toBe("local");
    expect(sharingAvailable()).toBe(true);

    await saveSubmission({
      shareId: "ABC123",
      sharedAt: new Date().toISOString(),
      canvas: demoCanvases[0],
    });

    const submissions = await listSubmissions();
    expect(submissions).toHaveLength(1);
    expect(submissions?.[0].shareId).toBe("ABC123");
    expect(submissions?.[0].canvas.process.name).toBe(
      "Vendor onboarding intake",
    );
  });

  it("keeps old submissions until a facilitator purges them", async () => {
    await saveSubmission({
      shareId: "OLD123",
      sharedAt: "2025-01-01T00:00:00.000Z",
      canvas: demoCanvases[0],
    });

    expect(await listSubmissions()).toHaveLength(1);
    expect(await purgeSubmissions()).toBe(1);
    expect(await listSubmissions()).toEqual([]);
  });

  it("returns locally stored canvases through the PIN-protected facilitator API", async () => {
    vi.stubEnv("FACILITATOR_PIN", "example-test-pin");
    await saveSubmission({
      shareId: "DEF456",
      sharedAt: new Date().toISOString(),
      canvas: demoCanvases[1],
    });

    const response = await getFacilitatorSubmissions(
      new Request("http://localhost/api/facilitator/submissions", {
        headers: { "x-facilitator-pin": "example-test-pin" },
      }),
    );
    const body = (await response.json()) as {
      submissions: Array<{ shareId: string }>;
      storageMode: string;
    };

    expect(response.status).toBe(200);
    expect(body.storageMode).toBe("local");
    expect(body.submissions[0].shareId).toBe("DEF456");
  });

  it("requires the facilitator PIN before purging all submissions", async () => {
    vi.stubEnv("FACILITATOR_PIN", "example-test-pin");
    await saveSubmission({
      shareId: "PURGE1",
      sharedAt: new Date().toISOString(),
      canvas: demoCanvases[0],
    });

    const denied = await deleteFacilitatorSubmissions(
      new Request("http://localhost/api/facilitator/submissions", {
        method: "DELETE",
        headers: { "x-facilitator-pin": "wrong" },
      }),
    );
    expect(denied.status).toBe(401);
    expect(await listSubmissions()).toHaveLength(1);

    const deleted = await deleteFacilitatorSubmissions(
      new Request("http://localhost/api/facilitator/submissions", {
        method: "DELETE",
        headers: { "x-facilitator-pin": "example-test-pin" },
      }),
    );
    expect(deleted.status).toBe(200);
    expect(await deleted.json()).toEqual({ removed: 1 });
    expect(await listSubmissions()).toEqual([]);
  });
});
