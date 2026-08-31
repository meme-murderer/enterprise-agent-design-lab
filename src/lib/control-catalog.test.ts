import { describe, expect, it } from "vitest";
import { controlsFor } from "@/lib/control-catalog";
import type { Signals } from "@/lib/schemas";

const signals: Signals = {
  frequency: "Daily",
  volume: "10-100",
  variation: "Minor variations",
  furthestStep: "Draft for a person",
  systemsTouched: "Two or three",
  pathVariability: "Sometimes",
  dataClasses: ["Internal only"],
  inputSources: ["Structured records from internal systems"],
  blastRadius: "Nobody outside the team",
  reversibility: "Undone with effort",
  detectability: "A person catches it on review",
  humanRequired: "No",
};

describe("control profiles", () => {
  it("gives assistance a proportionate baseline", () => {
    const ids = controlsFor("AI Assistance", signals).map(
      (control) => control.id,
    );
    expect(ids).toEqual(
      expect.arrayContaining([
        "human-review",
        "eval-set",
        "audit-log",
        "escalation",
        "stop-conditions",
      ]),
    );
  });
  it("adds untrusted-input handling for externally authored content", () => {
    const ids = controlsFor("Bounded Agentic Pilot", {
      ...signals,
      inputSources: ["Customer or vendor content"],
    }).map((control) => control.id);
    expect(ids).toContain("untrusted-input");
  });
  it("does not trigger untrusted-input for structured internal records", () => {
    expect(
      controlsFor("Bounded Agentic Pilot", signals).map(
        (control) => control.id,
      ),
    ).not.toContain("untrusted-input");
  });
});
