import type { Recommendation, RubricResult, Signals } from "@/lib/schemas";

export const RUBRIC_VERSION = "2026-08-24" as const;

const strongDetection = (value: Signals["detectability"]) =>
  value === "Immediately and automatically" ||
  value === "A person catches it on review";

export function evaluateRubric(signals: Signals): RubricResult {
  const isConventional =
    signals.variation === "Same every time" &&
    signals.pathVariability === "No - fixed steps" &&
    (!signals.judgmentShare ||
      signals.judgmentShare === "Almost none" ||
      signals.judgmentShare === "A small minority");
  const noneCeiling =
    signals.reversibility === "Effectively irreversible" &&
    signals.detectability === "We might not find out for months";
  const assistanceCeiling =
    signals.humanRequired !== "No" ||
    (signals.blastRadius === "Regulator or auditor" &&
      signals.dataClasses.includes("Regulated")) ||
    (!strongDetection(signals.detectability) &&
      signals.furthestStep === "Execute a transaction");
  const autonomyCeiling = noneCeiling
    ? "None"
    : assistanceCeiling
      ? "Assistance"
      : "Bounded";
  const regulatedImpact =
    signals.blastRadius === "Regulator or auditor" &&
    signals.dataClasses.includes("Regulated");
  const lowEconomicFit = signals.monthlyEffort
    ? signals.monthlyEffort === "Under 5 hours"
    : signals.volume === "Under 10" &&
      (signals.frequency === "Weekly" ||
        signals.frequency === "Monthly or less");

  let recommendation: Recommendation;
  let matchedRuleId: string;
  let triggers: string[];

  if (isConventional) {
    recommendation = "Conventional Automation";
    matchedRuleId = "stable-fixed-rules";
    triggers = [
      "You said the work follows the same rules and steps each time.",
    ];
    if (autonomyCeiling !== "Bounded")
      triggers.push("Your other answers rule out autonomous AI for this work.");
  } else if (autonomyCeiling === "None") {
    recommendation = "No AI at This Time";
    matchedRuleId = "unsafe-undetectable-irreversible";
    triggers = [
      "A wrong result would be difficult to undo.",
      "The mistake might remain hidden for months.",
    ];
  } else if (lowEconomicFit) {
    recommendation = "AI Assistance";
    matchedRuleId = "low-volume-assistance-cap";
    triggers = [
      "This process handles too few cases to justify the cost and controls of an autonomous system. An assistant may still save time.",
    ];
  } else if (
    autonomyCeiling === "Bounded" &&
    [
      "Classify and route",
      "Decide within set rules",
      "Execute a transaction",
    ].includes(signals.furthestStep) &&
    signals.systemsTouched !== "One" &&
    signals.pathVariability !== "No - fixed steps" &&
    strongDetection(signals.detectability) &&
    signals.reversibility !== "Effectively irreversible"
  ) {
    recommendation = "Bounded Agentic Pilot";
    matchedRuleId = "bounded-multistep-fit";
    triggers = [
      "The work uses several systems, and the next step can change by case.",
      "A person or system can find mistakes, and the result can be corrected.",
    ];
  } else {
    recommendation = "AI Assistance";
    matchedRuleId =
      autonomyCeiling === "Assistance"
        ? "safety-ceiling-assistance"
        : "default-assistance";
    if (autonomyCeiling === "Assistance") {
      triggers =
        signals.humanRequired !== "No"
          ? [
              signals.humanRequired === "Yes"
                ? "A policy, law, or accountable role requires a person to make the final decision."
                : "The final decision owner is not confirmed, so the decision stays with a person.",
            ]
          : regulatedImpact
            ? [
                "The process uses regulated information and one error could affect a regulated decision or report.",
              ]
            : [
                "The proposed transaction could be wrong, and the team would not find the mistake before use.",
              ];
    } else {
      const missing = [
        signals.furthestStep === "Read and summarize" ||
        signals.furthestStep === "Draft for a person"
          ? "The proposed task prepares information rather than completing a multi-step path."
          : null,
        signals.systemsTouched === "One"
          ? "The work uses one system, so a multi-step agent adds no clear benefit."
          : null,
        signals.pathVariability === "No - fixed steps"
          ? "The steps do not change by case."
          : null,
        !strongDetection(signals.detectability)
          ? "The team cannot find mistakes promptly."
          : null,
        signals.reversibility === "Effectively irreversible"
          ? "A wrong result cannot be reliably corrected."
          : null,
      ].filter((item): item is string => Boolean(item));
      triggers = [
        missing[0] ??
          "AI may prepare the work, but the answers do not justify a multi-step simulation.",
      ];
    }
  }

  return {
    rubricVersion: RUBRIC_VERSION,
    recommendation,
    matchedRuleId,
    autonomyCeiling,
    triggers,
    trace: [
      {
        id: "standardized",
        label: "Can written rules determine the result?",
        passed: isConventional,
        detail: isConventional
          ? "Yes. The same written rules and steps apply."
          : "No. Exceptions or judgment change the result.",
      },
      {
        id: "human-required",
        label: "Must a person make the final decision?",
        passed: signals.humanRequired === "Yes",
        detail:
          signals.humanRequired === "Yes"
            ? "Yes. Policy, law, or accountability keeps the decision with a person."
            : signals.humanRequired === "Not sure"
              ? "Not confirmed. Treat the final decision as human-owned until clarified."
              : "No stated requirement for a person to make the final decision.",
      },
      {
        id: "economic-fit",
        label: "Is there enough work to justify added controls?",
        passed: !lowEconomicFit,
        detail: signals.monthlyEffort
          ? `${signals.monthlyEffort} of staff effort each month.`
          : `${signals.volume} items; ${signals.frequency.toLowerCase()}.`,
      },
      {
        id: "regulated-impact",
        label: "Could one error affect a regulated decision or report?",
        passed: regulatedImpact,
        detail: regulatedImpact
          ? "Yes. Regulated information and a regulated consequence are both involved."
          : "No regulated decision or reporting consequence was selected.",
      },
      {
        id: "multiple-systems",
        label: "Does the work use more than one system?",
        passed: signals.systemsTouched !== "One",
        detail:
          signals.systemsTouched === "One"
            ? "No. One system."
            : `Yes. ${signals.systemsTouched}.`,
      },
      {
        id: "judgment",
        label: "Can the next step change by case?",
        passed: signals.pathVariability !== "No - fixed steps",
        detail:
          signals.pathVariability === "No - fixed steps"
            ? "No. The steps are fixed."
            : "Yes. Findings or exceptions can change the next step.",
      },
      {
        id: "detectable",
        label: "Can the team find a mistake promptly?",
        passed: strongDetection(signals.detectability),
        detail:
          signals.detectability === "Immediately and automatically"
            ? "Yes. A system flags it immediately."
            : signals.detectability === "A person catches it on review"
              ? "Yes. A required review catches it."
              : signals.detectability === "Only when someone complains"
                ? "No. The team learns only after someone reports a problem."
                : "No. It could remain unnoticed for weeks or months.",
      },
      {
        id: "reversible",
        label: "Can every wrong result be corrected?",
        passed: signals.reversibility !== "Effectively irreversible",
        detail:
          signals.reversibility === "Trivially undone"
            ? "Yes. It can be corrected immediately."
            : signals.reversibility === "Undone with effort"
              ? "Yes, with work to correct records or contact people."
              : "No. The effect would be difficult or impossible to reverse.",
      },
    ],
  };
}
