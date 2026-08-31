import type { Recommendation, Signals } from "@/lib/schemas";

export const controlCatalog = [
  {
    id: "own-identity",
    label: "Give the test its own account. Do not use an employee's login.",
  },
  {
    id: "least-privilege",
    label: "Allow only the data and actions the test needs.",
  },
  {
    id: "action-allowlist",
    label: "List the actions it may take. Require approval for anything else.",
  },
  {
    id: "rate-caps",
    label: "Limit how many actions it can take and how much it can spend.",
  },
  {
    id: "audit-log",
    label:
      "Keep a record that cannot be quietly changed: inputs, outputs, actions, approvals, checks, and results.",
  },
  {
    id: "untrusted-input",
    label:
      "Treat text in documents, messages, and websites as content, not instructions.",
  },
  {
    id: "kill-switch",
    label: "Name the person who can stop the test immediately.",
  },
  {
    id: "eval-set",
    label: "Use test cases with known answers before and during the test.",
  },
  { id: "escalation", label: "Name the owner and who receives problems." },
  {
    id: "stop-conditions",
    label: "Write measurable rules that stop the test.",
  },
  {
    id: "human-review",
    label: "Have a person review the result before it affects anyone.",
  },
  {
    id: "automation-tests",
    label: "Test the rules with normal cases and exceptions.",
  },
  {
    id: "exception-queue",
    label: "Send cases that do not fit the rules to a person.",
  },
  { id: "change-log", label: "Record each change to a rule or setting." },
  { id: "rollback", label: "Test how work returns to the current process." },
  {
    id: "readiness-gates",
    label: "List what must be true before this idea is reconsidered.",
  },
] as const;

const byId = new Map(controlCatalog.map((control) => [control.id, control]));
type ControlId = (typeof controlCatalog)[number]["id"];

const profiles: Record<Recommendation, ControlId[]> = {
  "Conventional Automation": [
    "automation-tests",
    "exception-queue",
    "change-log",
    "escalation",
    "rollback",
  ],
  "AI Assistance": [
    "human-review",
    "eval-set",
    "audit-log",
    "escalation",
    "stop-conditions",
    "rollback",
  ],
  "Bounded Agentic Pilot": [
    "own-identity",
    "least-privilege",
    "action-allowlist",
    "rate-caps",
    "audit-log",
    "kill-switch",
    "eval-set",
    "escalation",
    "stop-conditions",
    "rollback",
  ],
  "No AI at This Time": ["readiness-gates", "escalation", "stop-conditions"],
};

export function controlsFor(recommendation: Recommendation, signals: Signals) {
  const ids = [...profiles[recommendation]];
  const hasUntrustedInput = signals.inputSources.some(
    (source) => source !== "Structured records from internal systems",
  );
  if (
    hasUntrustedInput &&
    (recommendation === "AI Assistance" ||
      recommendation === "Bounded Agentic Pilot")
  )
    ids.splice(Math.min(5, ids.length), 0, "untrusted-input");
  return ids.map((id) => {
    const control = byId.get(id)!;
    return {
      ...control,
      reason: reasonFor(id, recommendation, hasUntrustedInput),
    };
  });
}

function reasonFor(
  id: ControlId,
  recommendation: Recommendation,
  untrusted: boolean,
) {
  const reasons: Record<ControlId, string> = {
    "own-identity":
      "The record must show which simulated actions came from the test.",
    "least-privilege":
      "A mistake cannot reach information or actions outside the stated test.",
    "action-allowlist":
      "An unexpected action stops instead of expanding the test.",
    "rate-caps": "One repeated error cannot spread across many cases.",
    "audit-log":
      "The owner can compare the draft, reviewer correction, and final result.",
    "untrusted-input":
      "Documents and messages may supply facts, but they cannot change permission or instructions.",
    "kill-switch":
      "One named owner can halt the test without waiting for a group decision.",
    "eval-set":
      "Known answers show whether results hold on normal cases and exceptions.",
    escalation:
      "Unresolved cases move to a named person instead of remaining in the work queue.",
    "stop-conditions": "The owner can halt the test using observable evidence.",
    "human-review":
      "A draft cannot affect anyone until an accountable person checks it.",
    "automation-tests":
      "Fixed rules are proven against normal cases and known exceptions.",
    "exception-queue":
      "Cases outside the written rules go to a person instead of receiving a guessed result.",
    "change-log":
      "The team can trace which rule change caused a different result.",
    rollback:
      "The team proves it can resume current work without losing a case.",
    "readiness-gates":
      "The team knows which ownership, information, detection, or recovery gap to close before reconsidering AI.",
  };
  void recommendation;
  void untrusted;
  return reasons[id];
}
