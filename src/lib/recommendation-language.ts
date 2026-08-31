import type { Recommendation } from "@/lib/schemas";

export const recommendationLabel: Record<Recommendation, string> = {
  "Conventional Automation": "Fixed-rule automation",
  "AI Assistance": "AI prepares; a person decides",
  "Bounded Agentic Pilot": "Limited agent simulation",
  "No AI at This Time": "Do not test AI yet",
};

export const planTypeLabel: Record<Recommendation, string> = {
  "Conventional Automation": "Automation proof",
  "AI Assistance": "Draft-and-review test",
  "Bounded Agentic Pilot": "Offline multi-step simulation",
  "No AI at This Time": "Process-readiness plan",
};
