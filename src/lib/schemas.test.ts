import { describe, expect, it } from "vitest";
import {
  canvasSchema,
  processInputSchema,
  revisionRequestSchema,
  signalsSchema,
} from "@/lib/schemas";
import { demoCanvases } from "@/lib/demo-data";

describe("workshop schemas", () => {
  it("requires the safety acknowledgement", () => {
    const parsed = processInputSchema.safeParse({
      name: "Vendor onboarding",
      outcome: "Reduce avoidable delays in generalized review work.",
      businessFunction: "Operations",
      safetyAcknowledged: false,
    });
    expect(parsed.success).toBe(false);
  });

  it("accepts every offline example as a complete canvas", () => {
    for (const canvas of demoCanvases)
      expect(canvasSchema.safeParse(canvas).success).toBe(true);
  });

  it("rejects partial structured signals", () => {
    expect(signalsSchema.safeParse({ frequency: "Daily" }).success).toBe(false);
  });

  it("rejects unsupported recommendation labels", () => {
    expect(
      canvasSchema.safeParse({
        ...demoCanvases[0],
        recommendation: "Deploy an autonomous agent",
      }).success,
    ).toBe(false);
  });

  it("rejects uncertainty entered as a safeguard", () => {
    expect(
      revisionRequestSchema.safeParse({
        canvas: demoCanvases[0],
        failureModes: [
          {
            scenario: "A wrong result is used.",
            expectedResponse: "Stop the test.",
            signal: "One wrong result.",
          },
          {
            scenario: "Private data appears.",
            expectedResponse: "Delete it and stop.",
            signal: "Private data is present.",
          },
        ],
        revision: "not sure. what should i enter here?",
      }).success,
    ).toBe(false);
  });
});
