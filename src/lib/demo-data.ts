import { controlsFor } from "@/lib/control-catalog";
import { evaluateRubric } from "@/lib/rubric";
import type { Canvas, Signals } from "@/lib/schemas";

export const demoCanvases: Canvas[] = [
  {
    id: "5a2f1449-6ce7-49ab-a7d9-58824ed2b17b",
    createdAt: "2026-08-21T14:05:00.000Z",
    process: {
      name: "Vendor onboarding intake",
      outcome: "Reduce avoidable delays while preserving compliance approvals.",
      businessFunction: "Operations",
    },
    recommendation: "AI Assistance",
    recommendationSummary:
      "Use AI to summarize intake packages and flag missing categories, while a procurement reviewer owns every decision and communication.",
    whyThisFit: [
      "The work is language-heavy but approval criteria remain human-owned.",
      "Exceptions and incomplete submissions make fully deterministic automation brittle.",
      "A draft-and-review pattern is reversible and easy to observe.",
    ],
    experiment: {
      title: "Intake completeness copilot",
      duration: "3 weeks",
      scopeIn: [
        "Synthetic intake packets",
        "Completeness summaries",
        "Reviewer feedback capture",
      ],
      scopeOut: [
        "Supplier communication",
        "Approval decisions",
        "Production system access",
      ],
      autonomyBoundary:
        "The assistant drafts a completeness summary only; a reviewer accepts, edits, or discards it.",
      inputs: ["Sanitized policy excerpt", "Synthetic intake packet"],
      outputs: ["Draft summary", "Missing-information checklist"],
    },
    humanOversight: {
      ownerRole: "Procurement operations lead",
      approvals: [
        "Approve every checklist",
        "Approve all evaluation criteria changes",
      ],
      reviewCadence: "Daily sample review; twice-weekly experiment review",
    },
    controls: {
      monitoring: [
        "Reviewer edit rate",
        "False missing-item flags",
        "Processing time by case",
      ],
      stopConditions: [
        "Any sensitive detail appears in output",
        "False-flag rate exceeds 15% for two sessions",
      ],
      rollbackPlan:
        "Stop using generated drafts and return immediately to the existing intake checklist.",
      dataBoundaries: [
        "Synthetic or fully sanitized packets only",
        "No supplier identifiers",
        "No external tools or connectors",
      ],
    },
    successMeasures: [
      { metric: "Median review time", target: "20% lower than baseline" },
      { metric: "Checklist precision", target: "At least 90%" },
    ],
    risks: [
      {
        risk: "Reviewer over-trust",
        mitigation: "Require explicit accept or edit for every item",
      },
      {
        risk: "Policy nuance is lost",
        mitigation: "Review exceptions separately and log disagreements",
      },
    ],
    nextStep:
      "Prepare ten synthetic cases and establish a manual baseline before testing any model output.",
    confidence: "High",
  },
  {
    id: "92ca9246-106f-4e86-b2f0-f4cc2a9db295",
    createdAt: "2026-08-21T14:11:00.000Z",
    process: {
      name: "Weekly inventory threshold report",
      outcome:
        "Give planners a consistent view of items below fixed reorder thresholds.",
      businessFunction: "Supply Chain",
    },
    recommendation: "Conventional Automation",
    recommendationSummary:
      "The workflow is rule-based, repeatable, and explainable; deterministic reporting is sufficient and easier to govern than an AI system.",
    whyThisFit: [
      "Thresholds and calculations are explicit.",
      "The same structured fields are used each week.",
      "AI adds variability without improving the stated outcome.",
    ],
    experiment: {
      title: "Threshold report automation proof",
      duration: "2 weeks",
      scopeIn: [
        "Synthetic inventory table",
        "Fixed thresholds",
        "Draft exception report",
      ],
      scopeOut: ["Purchase orders", "Supplier contact", "Forecast changes"],
      autonomyBoundary:
        "A deterministic script produces a draft report; a planner reviews it before use.",
      inputs: ["Synthetic item counts", "Approved threshold table"],
      outputs: ["Below-threshold report", "Calculation audit log"],
    },
    humanOversight: {
      ownerRole: "Inventory planning lead",
      approvals: ["Approve threshold changes", "Approve the weekly report"],
      reviewCadence: "Review every run during the proof",
    },
    controls: {
      monitoring: ["Row-count reconciliation", "Calculation error rate"],
      stopConditions: [
        "Source totals do not reconcile",
        "Any unapproved threshold is used",
      ],
      rollbackPlan:
        "Use the existing spreadsheet procedure and archive the draft report.",
      dataBoundaries: [
        "Synthetic records only",
        "No live inventory connection",
      ],
    },
    successMeasures: [
      {
        metric: "Calculation accuracy",
        target: "100% against reference cases",
      },
      { metric: "Preparation time", target: "50% lower than manual baseline" },
    ],
    risks: [
      {
        risk: "Stale thresholds",
        mitigation: "Version and approve the threshold table",
      },
      {
        risk: "Missing rows",
        mitigation: "Reconcile row counts before review",
      },
    ],
    nextStep:
      "Write reference cases with expected calculations and compare a deterministic script to the manual process.",
    confidence: "High",
  },
  {
    id: "2cce00c9-e901-4e12-9552-eb27f3461c6f",
    createdAt: "2026-08-21T14:18:00.000Z",
    process: {
      name: "Security incident containment",
      outcome:
        "Reduce the time required to contain high-impact security events.",
      businessFunction: "Security",
    },
    recommendation: "No AI at This Time",
    recommendationSummary:
      "The proposed action has high consequences, incomplete context, and limited reversibility; first improve playbooks, evidence quality, and accountable ownership.",
    whyThisFit: [
      "Incorrect containment can interrupt critical operations.",
      "The input context is uncertain during an active incident.",
      "The desired autonomous action is not safely reversible.",
    ],
    experiment: {
      title: "Containment readiness tabletop",
      duration: "2 weeks",
      scopeIn: [
        "Existing playbook review",
        "Synthetic incident scenarios",
        "Decision-rights mapping",
      ],
      scopeOut: [
        "Live containment",
        "Credential use",
        "Network or endpoint access",
      ],
      autonomyBoundary:
        "No model action; the exercise documents human decisions and missing evidence only.",
      inputs: ["Synthetic incident summaries", "Generalized playbook steps"],
      outputs: ["Decision-rights map", "Evidence gap list"],
    },
    humanOversight: {
      ownerRole: "Incident response leader",
      approvals: [
        "Approve all playbook changes",
        "Approve future experiment scope",
      ],
      reviewCadence: "Review after every tabletop scenario",
    },
    controls: {
      monitoring: [
        "Unresolved decision ownership",
        "Missing evidence categories",
      ],
      stopConditions: [
        "A scenario requires real credentials",
        "A participant proposes live execution",
      ],
      rollbackPlan:
        "End the tabletop and continue with the approved incident-response process.",
      dataBoundaries: [
        "Synthetic scenarios only",
        "No indicators, credentials, or system details",
      ],
    },
    successMeasures: [
      { metric: "Named decision owners", target: "100% of containment steps" },
      {
        metric: "Playbook ambiguity",
        target: "No unresolved high-impact step",
      },
    ],
    risks: [
      {
        risk: "Tabletop is mistaken for authorization",
        mitigation: "Label every artifact non-operational",
      },
      {
        risk: "Sensitive examples enter notes",
        mitigation: "Use prewritten synthetic scenarios",
      },
    ],
    nextStep:
      "Clarify decision rights and test the current human playbook with synthetic incidents before reconsidering AI.",
    confidence: "High",
  },
];

const vendorSignals: Signals = {
  frequency: "Weekly",
  volume: "10-100",
  variation: "Minor variations",
  furthestStep: "Classify and route",
  systemsTouched: "Two or three",
  pathVariability: "Sometimes",
  dataClasses: ["Internal only", "Financial"],
  inputSources: ["Customer or vendor content"],
  blastRadius: "Nobody outside the team",
  reversibility: "Undone with effort",
  detectability: "A person catches it on review",
  humanRequired: "No",
};

function vendorPair(
  id: string,
  detectability: Signals["detectability"],
): Canvas {
  const signals = { ...vendorSignals, detectability };
  const rubric = evaluateRubric(signals);
  const base = demoCanvases[0];
  return {
    ...base,
    version: 2,
    id,
    createdAt: "2026-08-24T14:05:00.000Z",
    process: {
      ...base.process,
      name:
        detectability === "A person catches it on review"
          ? "Invoice exception triage (review before payment)"
          : "Invoice exception triage (supplier complaints)",
      outcome:
        "Reduce exception-triage time while preserving payment approval and reconciliation.",
    },
    signals,
    rubric,
    recommendation: rubric.recommendation,
    recommendationSummary:
      rubric.recommendation === "Bounded Agentic Pilot"
        ? "Test a narrow routing loop because errors are caught in review and every effect can be reversed."
        : "Keep the work at AI assistance because errors may surface only after a complaint.",
    whyThisFit:
      rubric.triggers.length >= 2
        ? rubric.triggers
        : [...rubric.triggers, `Detectability: ${detectability}.`],
    humanOversight: {
      ownerRole: "Accounts payable process owner",
      approvals: [
        "Accounts payable manager approves every proposed exception path and payment decision.",
      ],
      reviewCadence:
        "Review every fictional case and compare results at the end of each week.",
    },
    experiment:
      rubric.recommendation === "Bounded Agentic Pilot"
        ? {
            title: "Offline invoice-exception path simulation",
            duration: "2 weeks",
            scopeIn: [
              "Compare fictional invoice, purchase-order, and receipt records",
              "Choose among listed exception paths",
              "Prepare a review packet",
            ],
            scopeOut: [
              "Approve payment",
              "Contact a supplier",
              "Update a business system",
            ],
            autonomyBoundary:
              "The simulation may follow listed offline steps and prepare a packet. It may not approve, pay, communicate, or update records.",
            inputs: [
              "Fictional invoice",
              "Fictional purchase order",
              "Fictional receipt",
            ],
            outputs: ["Simulated exception path", "Review packet"],
          }
        : {
            title: "Invoice-exception draft-and-review test",
            duration: "2 weeks",
            scopeIn: [
              "Summarize fictional mismatches",
              "Flag missing evidence",
            ],
            scopeOut: [
              "Choose an exception path",
              "Approve payment",
              "Update a business system",
            ],
            autonomyBoundary:
              "The assistant may summarize a fictional exception. A person chooses the path and makes every decision.",
            inputs: [
              "Fictional invoice",
              "Fictional purchase order",
              "Fictional receipt",
            ],
            outputs: ["Draft mismatch summary", "Missing-evidence list"],
          },
    controls: {
      monitoring: [
        "Mismatch category chosen for each case",
        "Reviewer correction and missed evidence for each case",
        "Time required to prepare the review packet",
      ],
      stopConditions: [
        "Stop if 2 of 20 cases use the wrong exception path.",
        "Stop if any proposed path could release or change a payment.",
      ],
      rollbackPlan:
        "Discard the simulated packets and return every fictional case to the current manual exception-triage method.",
      dataBoundaries: [
        "Use fictional invoices, purchase orders, and receipts only.",
        "Do not connect to payment, supplier, or accounting systems.",
      ],
      requiredControls: controlsFor(rubric.recommendation, signals),
    },
    successMeasures: [
      {
        metric: "Exception-path agreement",
        target: "At least 18 of 20 cases match the approved answer.",
      },
      {
        metric: "Review-packet preparation time",
        target: "At least 25% below the manual baseline.",
      },
    ],
    risks: [
      {
        risk: "A mismatch is summarized incorrectly.",
        mitigation:
          "Compare each field with the fictional source records before review.",
      },
      {
        risk: "A reviewer treats a proposed path as payment approval.",
        mitigation:
          "Label every packet simulated and require a separate human decision.",
      },
    ],
    nextStep:
      "Prepare 20 fictional invoice exceptions with approved paths and record the current review time for each case.",
  } as Canvas;
}

demoCanvases.push(
  vendorPair(
    "66c174d4-59f0-44ee-9c12-6f5b0d25385c",
    "A person catches it on review",
  ),
  vendorPair(
    "a4665f10-c625-4ceb-ad02-1ee4a5f79e3e",
    "Only when someone complains",
  ),
);
