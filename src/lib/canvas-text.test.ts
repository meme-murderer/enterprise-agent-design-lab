import { describe, expect, it } from "vitest";
import { canvasToText } from "@/lib/canvas-text";
import { demoCanvases } from "@/lib/demo-data";
import type { Canvas } from "@/lib/schemas";

describe("plain-text canvas", () => {
  it("creates a short, scannable copy without coaching commentary", () => {
    const text = canvasToText(demoCanvases[0]);

    expect(text).toContain("WORKSHOP DECISION");
    expect(text).toContain("Process: Vendor onboarding intake");
    expect(text).toContain("DECISION RULES");
    expect(text).toContain("Return to current process:");
    expect(text).not.toContain("Coach response");
    expect(text.split(/\s+/).length).toBeLessThan(350);
  });

  it("does not repeat a participant's uncertainty as a stop rule", () => {
    const canvas = {
      ...demoCanvases[0],
      controls: {
        ...demoCanvases[0].controls,
        stopConditions: [
          "not sure. what should i enter here?",
          "Stop if 2 of 20 cases are wrong.",
        ],
      },
    };

    const text = canvasToText(canvas as Canvas);
    expect(text).not.toMatch(/not sure/i);
    expect(text).toContain("Stop if 2 of 20 cases are wrong.");
  });
});
