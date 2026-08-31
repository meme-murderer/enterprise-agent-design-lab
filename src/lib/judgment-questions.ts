import type { Signals } from "@/lib/schemas";

export type JudgmentPrompt = {
  question: string;
  help: string;
  placeholder: string;
};

export function judgmentQuestions(
  signals: Signals,
): [JudgmentPrompt, JudgmentPrompt] {
  let first: JudgmentPrompt = {
    question: "Which cases require the most judgment from a person?",
    help: "Think about missing information, conflicting rules, or an exception that changes the answer.",
    placeholder:
      "Example: A request matches two policies, and only a manager can decide which one applies.",
  };

  if (signals.variation === "Same every time") {
    first = {
      question: "What is the most common exception to the normal rules?",
      help: "If there are no exceptions, say so. That is useful evidence for regular automation.",
      placeholder:
        "Example: The normal steps work unless a required approval is missing.",
    };
  } else if (signals.pathVariability === "Yes - it has to work out the path") {
    first = {
      question:
        "What information would make a person choose a different next step?",
      help: "Name the condition, not a real person, company, or record.",
      placeholder:
        "Example: A missing approval sends the case back; a policy exception sends it to a manager.",
    };
  } else if (signals.furthestStep === "Execute a transaction") {
    first = {
      question:
        "What is the most serious wrong action this process could take?",
      help: "Describe the action and its effect. Keep the example hypothetical.",
      placeholder:
        "Example: It could issue the wrong payment before a reviewer sees the exception.",
    };
  }

  const second: JudgmentPrompt = {
    question: "Name the owner, approver, and stop rule.",
    help: "Use roles, not names. Write a stop rule the team can observe and count.",
    placeholder:
      "The process owner will stop the test if 2 of 20 results are wrong. Work returns to the current process.",
  };

  return [first, second];
}
