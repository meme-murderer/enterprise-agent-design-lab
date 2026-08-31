import { describe, expect, it } from "vitest";
import { evaluateRubric } from "@/lib/rubric";
import type { Signals } from "@/lib/schemas";

const base: Signals = {
  frequency: "Daily",
  volume: "100-1,000",
  variation: "Minor variations",
  furthestStep: "Decide within set rules",
  systemsTouched: "Two or three",
  pathVariability: "Sometimes",
  dataClasses: ["Internal only", "Financial"],
  inputSources: ["Structured records from internal systems"],
  blastRadius: "Nobody outside the team",
  reversibility: "Undone with effort",
  detectability: "Immediately and automatically",
  humanRequired: "No",
};

describe("deterministic recommendation rubric", () => {
  it.each([
    ["A — invoice exceptions", base, "Bounded Agentic Pilot"],
    [
      "B — expense policy",
      {
        ...base,
        variation: "Same every time",
        furthestStep: "Classify and route",
        systemsTouched: "One",
        pathVariability: "No - fixed steps",
        reversibility: "Trivially undone",
      },
      "Conventional Automation",
    ],
    [
      "C — complaint response",
      {
        ...base,
        frequency: "Many times a day",
        volume: "10-100",
        variation: "Every case is different",
        furthestStep: "Draft for a person",
        detectability: "A person catches it on review",
      },
      "AI Assistance",
    ],
    [
      "D — benefits appeals",
      {
        ...base,
        frequency: "Weekly",
        volume: "Under 10",
        variation: "Every case is different",
        systemsTouched: "Four or more",
        pathVariability: "Yes - it has to work out the path",
        dataClasses: ["Customer personal", "Regulated"],
        blastRadius: "Regulator or auditor",
        reversibility: "Effectively irreversible",
        detectability: "We might not find out for months",
        humanRequired: "Yes",
      },
      "No AI at This Time",
    ],
    [
      "E1 — vendor review",
      {
        ...base,
        frequency: "Weekly",
        volume: "10-100",
        furthestStep: "Classify and route",
        detectability: "A person catches it on review",
      },
      "Bounded Agentic Pilot",
    ],
    [
      "E2 — same vendor, delayed detection",
      {
        ...base,
        frequency: "Weekly",
        volume: "10-100",
        furthestStep: "Classify and route",
        detectability: "Only when someone complains",
      },
      "AI Assistance",
    ],
  ] as const)("maps %s", (_name, signals, expected) => {
    expect(evaluateRubric(signals as Signals).recommendation).toBe(expected);
  });

  it("changes the controlled vendor pair only on detectability", () => {
    const e1 = {
      ...base,
      frequency: "Weekly" as const,
      volume: "10-100" as const,
      furthestStep: "Classify and route" as const,
      detectability: "A person catches it on review" as const,
    };
    const e2 = { ...e1, detectability: "Only when someone complains" as const };
    expect(
      Object.keys(e1).filter(
        (key) =>
          JSON.stringify(e1[key as keyof Signals]) !==
          JSON.stringify(e2[key as keyof Signals]),
      ),
    ).toEqual(["detectability"]);
  });

  it("caps a required human decision at assistance instead of rejecting AI", () => {
    expect(
      evaluateRubric({ ...base, humanRequired: "Yes" }).recommendation,
    ).toBe("AI Assistance");
  });

  it("caps low-volume work at assistance for economic reasons", () => {
    const result = evaluateRubric({
      ...base,
      frequency: "Monthly or less",
      volume: "Under 10",
    });
    expect(result.recommendation).toBe("AI Assistance");
    expect(result.matchedRuleId).toBe("low-volume-assistance-cap");
  });

  it("keeps fixed-rule automation outside the AI autonomy ceiling", () => {
    const result = evaluateRubric({
      ...base,
      variation: "Same every time",
      pathVariability: "No - fixed steps",
      reversibility: "Effectively irreversible",
      detectability: "We might not find out for months",
    });
    expect(result.recommendation).toBe("Conventional Automation");
    expect(result.autonomyCeiling).toBe("None");
  });
});
