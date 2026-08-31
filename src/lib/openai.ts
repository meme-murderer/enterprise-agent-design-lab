import "server-only";
import OpenAI from "openai";
import { zodTextFormat } from "openai/helpers/zod";
import {
  modelCanvasSchema,
  modelCanvasV2Schema,
  questionResponseSchema,
  revisionResponseSchema,
  stressTestSchema,
  type Canvas,
  type InterviewTurn,
  type ProcessInput,
  type Recommendation,
  type Signals,
} from "@/lib/schemas";
import {
  canvasInstructions,
  canvasV2Instructions,
  questionInstructions,
  revisionInstructions,
  serializeCanvas,
  serializeInterview,
  serializeV2Interview,
  stressTestInstructions,
} from "@/lib/prompts";
import { recordModelCall, type ModelOperation } from "@/lib/usage-monitor";
import { z } from "zod";

function model() {
  const configured = process.env.OPENAI_MODEL?.trim();
  if (!configured) throw new Error("OPENAI_MODEL_REQUIRED");
  return configured;
}

let openAIClient: OpenAI | undefined;

function client() {
  openAIClient ??= new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    maxRetries: 0,
    timeout: 30_000,
  });
  return openAIClient;
}

type TrackableResponse = {
  model?: string;
  usage?: {
    input_tokens: number;
    input_tokens_details?: {
      cached_tokens?: number;
      cache_write_tokens?: number;
    };
    output_tokens: number;
    output_tokens_details?: { reasoning_tokens?: number };
    total_tokens: number;
  } | null;
};

async function measuredResponse<T extends TrackableResponse>(
  operation: ModelOperation,
  request: () => Promise<{ data: T; response: Response }>,
) {
  const startedAt = performance.now();
  try {
    const result = await request();
    const response = result.data;
    const headerNumber = (name: string) => {
      const value = result.response.headers.get(name);
      if (!value) return null;
      const parsed = Number.parseInt(value, 10);
      return Number.isFinite(parsed) ? parsed : null;
    };
    await recordModelCall({
      operation,
      model: response.model || model(),
      outcome: "completed",
      inputTokens: response.usage?.input_tokens ?? 0,
      cachedInputTokens:
        response.usage?.input_tokens_details?.cached_tokens ?? 0,
      cacheWriteTokens:
        response.usage?.input_tokens_details?.cache_write_tokens ?? 0,
      outputTokens: response.usage?.output_tokens ?? 0,
      reasoningTokens:
        response.usage?.output_tokens_details?.reasoning_tokens ?? 0,
      totalTokens: response.usage?.total_tokens ?? 0,
      latencyMs: Math.round(performance.now() - startedAt),
      requestLimit: headerNumber("x-ratelimit-limit-requests"),
      remainingRequests: headerNumber("x-ratelimit-remaining-requests"),
      tokenLimit: headerNumber("x-ratelimit-limit-tokens"),
      remainingTokens: headerNumber("x-ratelimit-remaining-tokens"),
    });
    return response;
  } catch (error) {
    await recordModelCall({
      operation,
      model: model(),
      outcome: "failed",
      inputTokens: 0,
      cachedInputTokens: 0,
      cacheWriteTokens: 0,
      outputTokens: 0,
      reasoningTokens: 0,
      totalTokens: 0,
      latencyMs: Math.round(performance.now() - startedAt),
      requestLimit: null,
      remainingRequests: null,
      tokenLimit: null,
      remainingTokens: null,
    });
    throw error;
  }
}

export async function createQuestion(
  processInput: ProcessInput,
  turns: InterviewTurn[],
  questionNumber: number,
) {
  const response = await measuredResponse("question", () =>
    client()
      .responses.parse({
        model: model(),
        store: false,
        tools: [],
        reasoning: { effort: "none" },
        max_output_tokens: 300,
        instructions: questionInstructions(questionNumber),
        input: serializeInterview(processInput, turns),
        text: {
          format: zodTextFormat(questionResponseSchema, "interview_question"),
        },
      })
      .withResponse(),
  );

  if (!response.output_parsed) throw new Error("MODEL_OUTPUT_MISSING");
  return response.output_parsed;
}

export async function createCanvas(
  processInput: ProcessInput,
  turns: InterviewTurn[],
) {
  const response = await measuredResponse("legacy-canvas", () =>
    client()
      .responses.parse({
        model: model(),
        store: false,
        tools: [],
        reasoning: { effort: "none" },
        max_output_tokens: 2_500,
        instructions: canvasInstructions,
        input: serializeInterview(processInput, turns),
        text: {
          format: zodTextFormat(modelCanvasSchema, "agent_experiment_canvas"),
        },
      })
      .withResponse(),
  );

  if (!response.output_parsed) throw new Error("MODEL_OUTPUT_MISSING");
  return response.output_parsed;
}

export async function createCanvasV2(
  processInput: ProcessInput,
  signals: Signals,
  turns: InterviewTurn[],
  recommendation: Recommendation,
  signal?: AbortSignal,
) {
  const response = await measuredResponse("canvas", () =>
    client()
      .responses.parse(
        {
          model: model(),
          store: false,
          tools: [],
          reasoning: { effort: "none" },
          max_output_tokens: 2_500,
          instructions: canvasV2Instructions(recommendation),
          input: serializeV2Interview(
            processInput,
            signals,
            turns,
            recommendation,
          ),
          text: {
            format: zodTextFormat(
              modelCanvasV2Schema,
              "agent_experiment_canvas_v2",
            ),
          },
        },
        { signal },
      )
      .withResponse(),
  );
  if (!response.output_parsed) throw new Error("MODEL_OUTPUT_MISSING");
  return response.output_parsed;
}

export async function createStressTests(canvas: Canvas, signal?: AbortSignal) {
  const processSpecificSchema = z.object({
    stressTests: z.array(stressTestSchema).length(2),
  });
  const response = await measuredResponse("stress-test", () =>
    client()
      .responses.parse(
        {
          model: model(),
          store: false,
          tools: [],
          reasoning: { effort: "none" },
          max_output_tokens: 700,
          instructions: stressTestInstructions,
          input: serializeCanvas(canvas),
          text: {
            format: zodTextFormat(processSpecificSchema, "canvas_stress_tests"),
          },
        },
        { signal },
      )
      .withResponse(),
  );

  if (!response.output_parsed) throw new Error("MODEL_OUTPUT_MISSING");
  return response.output_parsed;
}

export async function reviewRevision(
  canvas: Canvas,
  failureModes: unknown,
  revision: string,
  signal?: AbortSignal,
) {
  const response = await measuredResponse("revision", () =>
    client()
      .responses.parse(
        {
          model: model(),
          store: false,
          tools: [],
          reasoning: { effort: "none" },
          max_output_tokens: 300,
          instructions: revisionInstructions,
          input: JSON.stringify({
            canvas: JSON.parse(serializeCanvas(canvas)),
            failureModes,
            participantRevision: revision,
          }),
          text: {
            format: zodTextFormat(
              revisionResponseSchema,
              "pre_mortem_revision",
            ),
          },
        },
        { signal },
      )
      .withResponse(),
  );
  if (!response.output_parsed) throw new Error("MODEL_OUTPUT_MISSING");
  return response.output_parsed;
}
