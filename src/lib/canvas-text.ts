import type { Canvas } from "@/lib/schemas";
import {
  recommendationLabel,
  planTypeLabel,
} from "@/lib/recommendation-language";

export function canvasToText(canvas: Canvas) {
  const clean = (value: string) => value.replace(/\s+/g, " ").trim();
  const useful = (value: string) =>
    !/\b(not sure|unsure|don['’]?t know|no idea)\b/i.test(value);
  const bullets = (items: string[], limit: number) =>
    items
      .filter(useful)
      .slice(0, limit)
      .map((item) => `- ${clean(item)}`);
  const stopConditions = bullets(canvas.controls.stopConditions, 3);

  return [
    "WORKSHOP DECISION",
    "",
    `Process: ${clean(canvas.process.name)}`,
    `Result to improve: ${clean(canvas.process.outcome)}`,
    `Best fit: ${recommendationLabel[canvas.recommendation]}`,
    "",
    "WHY",
    ...bullets(canvas.whyThisFit, 2),
    "",
    "SMALL TEST / READINESS WORK",
    `Plan: ${planTypeLabel[canvas.recommendation]}`,
    `Owner: ${clean(canvas.humanOversight.ownerRole)}`,
    `Approver: ${clean(canvas.humanOversight.approvals[0] ?? "Must be assigned")}`,
    `Duration: ${clean(canvas.experiment.duration)}`,
    `Allowed: ${canvas.experiment.scopeIn.slice(0, 2).map(clean).join("; ")}`,
    `Not allowed: ${canvas.experiment.scopeOut.slice(0, 2).map(clean).join("; ")}`,
    "",
    "DECISION RULES",
    `Success: ${clean(canvas.successMeasures[0]?.metric ?? "Agreed result")}: ${clean(canvas.successMeasures[0]?.target ?? "Target must be defined")}`,
    "Stop:",
    ...(stopConditions.length
      ? stopConditions
      : ["- The owner cannot state a clear, observable reason to stop."]),
    `Return to current process: ${clean(canvas.controls.rollbackPlan)}`,
    ...(canvas.version === 2 &&
    canvas.preMortem &&
    useful(canvas.preMortem.revision)
      ? ["", "RULE YOU ADDED", clean(canvas.preMortem.revision)]
      : []),
    "",
    "FIRST STEP",
    clean(canvas.nextStep),
    "",
    "Workshop exercise only. This is not approval for a production deployment.",
  ].join("\n");
}
