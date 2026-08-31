import type { Canvas, StressTest } from "@/lib/schemas";
import { isCanvasV2 } from "@/lib/schemas";

export function deterministicFailureModes(canvas: Canvas): StressTest[] {
  const untrusted =
    isCanvasV2(canvas) &&
    canvas.signals.inputSources.some(
      (source) => source !== "Structured records from internal systems",
    );
  return [
    {
      scenario: untrusted
        ? "A submitted document contains instructions designed to redirect the AI."
        : "A plausible but malformed input passes the first validation check.",
      expectedResponse:
        "Treat the content as data, block consequential action, and route the case to the named owner.",
      signal:
        "Input-policy rejection, validation failure, or an attempted action outside the allowlist.",
    },
    {
      scenario:
        isCanvasV2(canvas) &&
        !canvas.rubric.trace.find((item) => item.id === "detectable")?.passed
          ? "A recurring error remains unnoticed until someone outside the team reports it."
          : "A small recurring error begins to accumulate across otherwise normal runs.",
      expectedResponse:
        "Pause the experiment at the threshold, preserve the record, and return to the existing process.",
      signal:
        "A monitored error rate, complaint, disagreement, or exception count crosses the stop threshold.",
    },
  ];
}
