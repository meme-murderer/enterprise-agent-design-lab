import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { apiError } from "@/lib/api";
import { createCanvas, createCanvasV2, createQuestion } from "@/lib/openai";
import { controlsFor } from "@/lib/control-catalog";
import { generatedCanvasIsUsable, standardCanvas } from "@/lib/canvas-fallback";
import { evaluateRubric } from "@/lib/rubric";
import { detectSensitiveContent, privacyMessage } from "@/lib/privacy";
import { checkRateLimit, clientKey } from "@/lib/rate-limit";
import {
  answerRequestSchema,
  v2AnswerRequestSchema,
  type InterviewTurn,
} from "@/lib/schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    if (!checkRateLimit(`interview:${clientKey(request)}`).allowed) {
      return NextResponse.json(
        { error: "Please wait a few minutes before trying again." },
        { status: 429 },
      );
    }

    const body: unknown = await request.json();
    const v2 = v2AnswerRequestSchema.safeParse(body);
    if (v2.success) {
      const input = v2.data;
      const sensitive = detectSensitiveContent(
        input.turns.map((turn) => turn.answer),
      );
      if (sensitive)
        return NextResponse.json(
          { error: `${privacyMessage} We detected a possible ${sensitive}.` },
          { status: 422 },
        );
      const rubric = evaluateRubric(input.signals);
      let degraded = false;
      let modelCanvas;
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 25_000);
      try {
        modelCanvas = await createCanvasV2(
          input.process,
          input.signals,
          input.turns,
          rubric.recommendation,
          controller.signal,
        );
        if (!generatedCanvasIsUsable(modelCanvas))
          throw new Error("MODEL_OUTPUT_INCOMPLETE");
      } catch (error) {
        degraded = true;
        console.warn("Canvas generation used the standard plan", {
          reason: controller.signal.aborted
            ? "timeout"
            : error instanceof Error
              ? error.message
              : "unknown",
        });
        modelCanvas = standardCanvas(
          input.process,
          input.signals,
          rubric.recommendation,
          input.governance,
        );
      } finally {
        clearTimeout(timeout);
      }
      modelCanvas = {
        ...modelCanvas,
        humanOversight: {
          ...modelCanvas.humanOversight,
          ownerRole: input.governance.ownerRole,
          approvals: [
            `${input.governance.approverRole} approves every result before it is used.`,
          ],
        },
        controls: {
          ...modelCanvas.controls,
          stopConditions: [
            input.governance.stopRule,
            ...modelCanvas.controls.stopConditions
              .filter((item) => item !== input.governance.stopRule)
              .slice(0, 3),
          ],
        },
      };
      return NextResponse.json({
        status: "complete",
        degraded,
        canvas: {
          ...modelCanvas,
          version: 2,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          process: {
            name: input.process.name,
            outcome: input.process.outcome,
            businessFunction: input.process.businessFunction,
          },
          signals: input.signals,
          rubric,
          recommendation: rubric.recommendation,
          controls: {
            ...modelCanvas.controls,
            requiredControls: controlsFor(rubric.recommendation, input.signals),
          },
        },
      });
    }

    const input = answerRequestSchema.parse(body);
    const sensitive = detectSensitiveContent([input.answer]);
    if (sensitive) {
      return NextResponse.json(
        { error: `${privacyMessage} We detected a possible ${sensitive}.` },
        { status: 422 },
      );
    }

    if (input.turns.length >= 6) {
      return NextResponse.json(
        { error: "This interview is already complete." },
        { status: 409 },
      );
    }

    const turns: InterviewTurn[] = [
      ...input.turns,
      { question: input.currentQuestion, answer: input.answer },
    ];

    if (turns.length >= 6) {
      const modelCanvas = await createCanvas(input.process, turns);
      return NextResponse.json({
        status: "complete",
        canvas: {
          ...modelCanvas,
          id: randomUUID(),
          createdAt: new Date().toISOString(),
          process: {
            name: input.process.name,
            outcome: input.process.outcome,
            businessFunction: input.process.businessFunction,
          },
        },
      });
    }

    const nextQuestion = await createQuestion(
      input.process,
      turns,
      turns.length + 1,
    );
    return NextResponse.json({
      status: "question",
      ...nextQuestion,
      questionNumber: turns.length + 1,
      turns,
    });
  } catch (error) {
    return apiError(error);
  }
}
