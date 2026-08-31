import type {
  GovernanceInput,
  ModelCanvasV2,
  ProcessInput,
  Recommendation,
  Signals,
} from "@/lib/schemas";

const nonEnglishScript =
  /[\u3040-\u30ff\u3400-\u9fff\u0400-\u04ff\u0600-\u06ff]/u;
const incompleteEnding =
  /(?:\b(?:and|or|the|a|an|to|for|with|before|after|from|if|when)|[-,:;])$/i;

export function generatedCanvasIsUsable(value: unknown): boolean {
  const strings: string[] = [];
  collectStrings(value, strings);
  return strings.every((item) => {
    const text = item.trim();
    return (
      text.length > 0 &&
      !nonEnglishScript.test(text) &&
      !incompleteEnding.test(text) &&
      balanced(text, "(", ")") &&
      balanced(text, "[", "]")
    );
  });
}

function collectStrings(value: unknown, target: string[]) {
  if (typeof value === "string") target.push(value);
  else if (Array.isArray(value))
    value.forEach((item) => collectStrings(item, target));
  else if (value && typeof value === "object")
    Object.values(value).forEach((item) => collectStrings(item, target));
}

function balanced(text: string, open: string, close: string) {
  return text.split(open).length === text.split(close).length;
}

export function standardCanvas(
  process: ProcessInput,
  signals: Signals,
  recommendation: Recommendation,
  governance: GovernanceInput,
): ModelCanvasV2 {
  const common = {
    duration: "2 weeks",
    inputs: ["Fictional or sanitized examples", "Approved written rules"],
    dataBoundaries: [
      "Use fictional or sanitized cases only.",
      "Do not connect the test to business systems.",
    ],
  };
  const stopConditions = [
    governance.stopRule,
    "Stop if personal, confidential, regulated, or proprietary information appears.",
  ];
  const base = {
    humanOversight: {
      ownerRole: governance.ownerRole,
      approvals: [
        `${governance.approverRole} approves every result before it is used.`,
      ],
      reviewCadence:
        "Review every result and discuss findings at the end of each week.",
    },
    controls: {
      monitoring: [
        "Reviewer corrections by case",
        "Errors and exceptions by case",
      ],
      stopConditions,
      rollbackPlan:
        "End the exercise, discard its drafts, and complete all remaining work with the current process.",
      dataBoundaries: common.dataBoundaries,
    },
    successMeasures: [
      {
        metric: "Result quality",
        target: "Meet the agreed reference answer on at least 18 of 20 cases.",
      },
      {
        metric: "Business result",
        target:
          process.outcome.length > 120
            ? `${process.outcome.slice(0, 117).trim()}...`
            : process.outcome,
      },
    ],
    risks: [
      {
        risk: "A result is wrong or incomplete.",
        mitigation: "Require review against the reference answer before use.",
      },
      {
        risk: "A reviewer relies on a draft without checking it.",
        mitigation:
          "Record the reviewer correction and final decision for every case.",
      },
    ],
    nextStep: `Have ${governance.ownerRole} assemble 20 sanitized cases with known answers and record the current result before testing.`,
    confidence: "Medium" as const,
  };

  if (recommendation === "Conventional Automation") {
    return {
      ...base,
      recommendationSummary:
        "Written rules appear sufficient. Prove those rules on normal cases and exceptions before changing the current process.",
      whyThisFit: [
        "The same rules and steps apply to most cases.",
        "Fixed-rule software is easier to test and explain than AI for this work.",
      ],
      experiment: {
        title: `Automation proof for ${process.name}`,
        duration: common.duration,
        scopeIn: [
          "Write the decision rules",
          "Test the rules on reference cases",
        ],
        scopeOut: ["AI-generated decisions", "Live system changes"],
        autonomyBoundary:
          "Fixed rules may produce an offline result. A person reviews it before any real work changes.",
        inputs: common.inputs,
        outputs: ["Rule-based result", "List of exceptions for review"],
      },
    };
  }

  if (recommendation === "No AI at This Time") {
    return {
      ...base,
      recommendationSummary:
        "Do not test AI on this process yet. First make mistakes easier to find, easier to correct, and clearly owned.",
      whyThisFit: [
        "A wrong result could remain hidden and be difficult to reverse.",
        "The first work is process readiness, not an AI experiment.",
      ],
      experiment: {
        title: `Readiness review for ${process.name}`,
        duration: common.duration,
        scopeIn: ["Map decision rights", "Define checks and a return path"],
        scopeOut: ["Model testing", "Automated decisions or actions"],
        autonomyBoundary:
          "No AI is tested. The team documents ownership, evidence, checks, and safer process conditions.",
        inputs: common.inputs,
        outputs: ["Decision-rights map", "Readiness checklist"],
      },
    };
  }

  const bounded = recommendation === "Bounded Agentic Pilot";
  return {
    ...base,
    recommendationSummary: bounded
      ? "An offline multi-step simulation can test whether the work stays inside strict limits while every result remains under human review."
      : "AI may prepare the work, but a person must review it and make every decision.",
    whyThisFit: bounded
      ? [
          "The work crosses several steps or systems and the path can change by case.",
          "Mistakes can be found promptly and every simulated result can be discarded.",
        ]
      : [
          signals.humanRequired === "Yes"
            ? "A person must make the final decision."
            : "The evidence does not support autonomous action.",
          "A draft-and-review test keeps the result visible and reversible.",
        ],
    experiment: {
      title: bounded
        ? `Offline multi-step simulation for ${process.name}`
        : `Draft-and-review test for ${process.name}`,
      duration: common.duration,
      scopeIn: bounded
        ? [
            "Follow an allowed path through fictional cases",
            "Prepare a review packet",
          ]
        : ["Prepare a draft", "Flag missing information and exceptions"],
      scopeOut: [
        "Final decisions",
        "Messages, transactions, routing, or system updates",
      ],
      autonomyBoundary: bounded
        ? "The simulation may choose among listed offline steps and prepare a packet. It may not use tools, contact anyone, or change a record."
        : "The assistant may prepare an offline draft. It may not decide, approve, send, route, or update anything.",
      inputs: common.inputs,
      outputs: bounded
        ? ["Simulated path", "Review packet"]
        : ["Draft", "Exception list"],
    },
  };
}
