import { describe, expect, it } from "vitest";
import { generatedCanvasIsUsable, standardCanvas } from "@/lib/canvas-fallback";
import { modelCanvasV2Schema, type Signals } from "@/lib/schemas";

const signals: Signals = {
  frequency: "Daily",
  volume: "100-1,000",
  variation: "Minor variations",
  furthestStep: "Draft for a person",
  systemsTouched: "Two or three",
  pathVariability: "Sometimes",
  dataClasses: ["Internal only"],
  inputSources: ["Internal documents or messages"],
  blastRadius: "Nobody outside the team",
  reversibility: "Trivially undone",
  detectability: "A person catches it on review",
  humanRequired: "Yes",
  monthlyEffort: "25-100 hours",
  judgmentShare: "Many",
};

describe("deterministic canvas fallback", () => {
  it("rejects non-English and visibly incomplete generated text", () => {
    expect(generatedCanvasIsUsable({ owner: "Operations lead下一" })).toBe(
      false,
    );
    expect(
      generatedCanvasIsUsable({ target: "Finish the review before the" }),
    ).toBe(false);
    expect(
      generatedCanvasIsUsable({ target: "Finish every review before use." }),
    ).toBe(true);
  });

  it("creates a complete schema-valid plan using participant roles", () => {
    const canvas = standardCanvas(
      {
        name: "Time-off review",
        outcome: "Reduce review time from three days to one day.",
        businessFunction: "Human Resources",
        safetyAcknowledged: true,
      },
      signals,
      "AI Assistance",
      {
        ownerRole: "HR process owner",
        approverRole: "HR manager",
        stopRule: "Stop if 2 of 20 drafts miss a policy exception.",
      },
    );
    expect(modelCanvasV2Schema.safeParse(canvas).success).toBe(true);
    expect(canvas.humanOversight.ownerRole).toBe("HR process owner");
  });
});
