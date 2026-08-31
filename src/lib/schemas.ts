import { z } from "zod";

export const businessFunctions = [
  "Operations",
  "Finance",
  "Human Resources",
  "Information Technology",
  "Security",
  "Customer Service",
  "Sales and Marketing",
  "Supply Chain",
  "Other",
] as const;

export const recommendationValues = [
  "Conventional Automation",
  "AI Assistance",
  "Bounded Agentic Pilot",
  "No AI at This Time",
] as const;

export const chipOptions = {
  frequency: ["Many times a day", "Daily", "Weekly", "Monthly or less"],
  volume: ["Under 10", "10-100", "100-1,000", "Over 1,000"],
  variation: ["Same every time", "Minor variations", "Every case is different"],
  furthestStep: [
    "Read and summarize",
    "Draft for a person",
    "Classify and route",
    "Decide within set rules",
    "Execute a transaction",
  ],
  systemsTouched: ["One", "Two or three", "Four or more"],
  pathVariability: [
    "No - fixed steps",
    "Sometimes",
    "Yes - it has to work out the path",
  ],
  dataClasses: [
    "Public",
    "Internal only",
    "Customer personal",
    "Financial",
    "Regulated",
    "Security-sensitive",
  ],
  inputSources: [
    "Structured records from internal systems",
    "Internal documents or messages",
    "Customer or vendor content",
    "Public or web content",
  ],
  blastRadius: [
    "Nobody outside the team",
    "One customer or employee",
    "Many customers",
    "Regulator or auditor",
  ],
  reversibility: [
    "Trivially undone",
    "Undone with effort",
    "Effectively irreversible",
  ],
  detectability: [
    "Immediately and automatically",
    "A person catches it on review",
    "Only when someone complains",
    "We might not find out for months",
  ],
  humanRequired: ["No", "Not sure", "Yes"],
  monthlyEffort: [
    "Under 5 hours",
    "5-25 hours",
    "25-100 hours",
    "Over 100 hours",
  ],
  judgmentShare: ["Almost none", "A small minority", "Many", "Almost all"],
} as const;

export const processInputSchema = z.object({
  name: z.string().trim().min(3).max(80),
  outcome: z.string().trim().min(10).max(300),
  businessFunction: z.enum(businessFunctions).nullable(),
  safetyAcknowledged: z.literal(true),
});

export const signalsSchema = z.object({
  frequency: z.enum(chipOptions.frequency),
  volume: z.enum(chipOptions.volume),
  variation: z.enum(chipOptions.variation),
  furthestStep: z.enum(chipOptions.furthestStep),
  systemsTouched: z.enum(chipOptions.systemsTouched),
  pathVariability: z.enum(chipOptions.pathVariability),
  dataClasses: z.array(z.enum(chipOptions.dataClasses)).min(1),
  inputSources: z.array(z.enum(chipOptions.inputSources)).min(1),
  blastRadius: z.enum(chipOptions.blastRadius),
  reversibility: z.enum(chipOptions.reversibility),
  detectability: z.enum(chipOptions.detectability),
  humanRequired: z.enum(chipOptions.humanRequired),
  monthlyEffort: z.enum(chipOptions.monthlyEffort).optional(),
  judgmentShare: z.enum(chipOptions.judgmentShare).optional(),
});

export const governanceInputSchema = z.object({
  ownerRole: z.string().trim().min(3).max(80),
  approverRole: z.string().trim().min(3).max(80),
  stopRule: z
    .string()
    .trim()
    .min(20)
    .max(300)
    .refine(
      (value) =>
        !/\b(not sure|unsure|don['’]?t know|no idea|what should i|what to enter)\b/i.test(
          value,
        ),
      "Write a specific stop rule.",
    ),
});

export const interviewTurnSchema = z.object({
  question: z.string().trim().min(5).max(500),
  answer: z.string().trim().min(2).max(1000),
});
export const judgmentTurnSchema = interviewTurnSchema.extend({
  answer: z.string().trim().min(8).max(1000),
});
export const interviewRequestSchema = z.object({
  process: processInputSchema,
  turns: z.array(interviewTurnSchema).max(6),
});
export const answerRequestSchema = interviewRequestSchema.extend({
  currentQuestion: z.string().trim().min(5).max(500),
  answer: z.string().trim().min(2).max(1000),
});
export const v2AnswerRequestSchema = z.object({
  version: z.literal(2),
  process: processInputSchema,
  signals: signalsSchema,
  turns: z.array(judgmentTurnSchema).length(2),
  governance: governanceInputSchema,
});

export const questionResponseSchema = z.object({
  question: z.string().trim().min(10).max(500),
  focus: z.enum([
    "process",
    "volume",
    "decisions",
    "data",
    "exceptions",
    "risk-and-oversight",
  ]),
});

const generatedCanvasFields = z.object({
  recommendationSummary: z.string().min(20).max(500),
  whyThisFit: z.array(z.string().min(5).max(240)).min(2).max(4),
  experiment: z.object({
    title: z.string().min(5).max(120),
    duration: z.string().min(3).max(60),
    scopeIn: z.array(z.string().min(3).max(180)).min(2).max(5),
    scopeOut: z.array(z.string().min(3).max(180)).min(2).max(5),
    autonomyBoundary: z.string().min(10).max(400),
    inputs: z.array(z.string().min(3).max(160)).min(1).max(5),
    outputs: z.array(z.string().min(3).max(160)).min(1).max(5),
  }),
  humanOversight: z.object({
    ownerRole: z.string().min(3).max(100),
    approvals: z.array(z.string().min(3).max(180)).min(1).max(5),
    reviewCadence: z.string().min(3).max(160),
  }),
  controls: z.object({
    monitoring: z.array(z.string().min(3).max(180)).min(2).max(5),
    stopConditions: z.array(z.string().min(3).max(180)).min(2).max(5),
    rollbackPlan: z.string().min(10).max(400),
    dataBoundaries: z.array(z.string().min(3).max(180)).min(2).max(5),
  }),
  successMeasures: z
    .array(
      z.object({
        metric: z.string().min(3).max(120),
        target: z.string().min(2).max(120),
      }),
    )
    .min(2)
    .max(4),
  risks: z
    .array(
      z.object({
        risk: z.string().min(3).max(160),
        mitigation: z.string().min(3).max(200),
      }),
    )
    .min(2)
    .max(4),
  nextStep: z.string().min(10).max(300),
  confidence: z.enum(["Low", "Medium", "High"]),
});

export const modelCanvasSchema = generatedCanvasFields.extend({
  recommendation: z.enum(recommendationValues),
});
export const modelCanvasV2Schema = generatedCanvasFields;
export const stressTestSchema = z.object({
  scenario: z.string().min(3).max(160),
  expectedResponse: z.string().min(3).max(240),
  signal: z.string().min(3).max(160),
});

export const canvasV1Schema = modelCanvasSchema.extend({
  version: z.literal(1).optional(),
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  process: processInputSchema.omit({ safetyAcknowledged: true }),
  stressTests: z.array(stressTestSchema).max(4).optional(),
});

export const rubricTraceItemSchema = z.object({
  id: z.string().min(2).max(80),
  label: z.string().min(3).max(120),
  passed: z.boolean(),
  detail: z.string().min(3).max(200),
});
export const rubricResultSchema = z.object({
  rubricVersion: z.literal("2026-08-24"),
  recommendation: z.enum(recommendationValues),
  matchedRuleId: z.string().min(2).max(80),
  autonomyCeiling: z.enum(["None", "Assistance", "Bounded"]),
  triggers: z.array(z.string().min(2).max(180)).min(1).max(6),
  trace: z.array(rubricTraceItemSchema).min(3).max(8),
});
export const requiredControlSchema = z.object({
  id: z.string().min(2).max(80),
  label: z.string().min(5).max(220),
  reason: z.string().min(5).max(260),
});
export const preMortemSchema = z.object({
  failureModes: z.array(stressTestSchema).min(2).max(4),
  revision: z.string().trim().min(20).max(500),
  coachResponse: z.string().min(10).max(500),
  revisedAfterPreMortem: z.literal(true),
  before: z.object({
    controlIds: z.array(z.string()).max(20),
    stopConditions: z.array(z.string()).max(8),
  }),
  revisedAt: z.string().datetime(),
});

export const canvasV2Schema = generatedCanvasFields.extend({
  version: z.literal(2),
  id: z.string().uuid(),
  createdAt: z.string().datetime(),
  process: processInputSchema.omit({ safetyAcknowledged: true }),
  signals: signalsSchema,
  rubric: rubricResultSchema,
  recommendation: z.enum(recommendationValues),
  controls: generatedCanvasFields.shape.controls.extend({
    requiredControls: z.array(requiredControlSchema).min(1).max(20),
  }),
  stressTests: z.array(stressTestSchema).max(4).optional(),
  preMortem: preMortemSchema.optional(),
});

export const canvasSchema = z.union([canvasV2Schema, canvasV1Schema]);
export const stressTestRequestSchema = z.object({ canvas: canvasSchema });
export const stressTestResponseSchema = z.object({
  stressTests: z.array(stressTestSchema).min(2).max(4),
  degraded: z.boolean().optional(),
});
export const revisionRequestSchema = z.object({
  canvas: canvasV2Schema,
  failureModes: z.array(stressTestSchema).min(2).max(4),
  revision: z
    .string()
    .trim()
    .min(20)
    .max(500)
    .refine(
      (value) =>
        !/\b(not sure|unsure|don['’]?t know|no idea|what should i)\b/i.test(
          value,
        ),
      "Write a specific safeguard.",
    ),
});
export const revisionResponseSchema = z.object({
  coachResponse: z.string().min(10).max(500),
});
export const shareRequestSchema = z.object({
  canvas: canvasSchema,
  consent: z.literal(true),
});

export type ProcessInput = z.infer<typeof processInputSchema>;
export type Signals = z.infer<typeof signalsSchema>;
export type InterviewTurn = z.infer<typeof interviewTurnSchema>;
export type JudgmentTurn = z.infer<typeof judgmentTurnSchema>;
export type GovernanceInput = z.infer<typeof governanceInputSchema>;
export type ModelCanvas = z.infer<typeof modelCanvasSchema>;
export type ModelCanvasV2 = z.infer<typeof modelCanvasV2Schema>;
export type CanvasV1 = z.infer<typeof canvasV1Schema>;
export type CanvasV2 = z.infer<typeof canvasV2Schema>;
export type Canvas = z.infer<typeof canvasSchema>;
export type Recommendation = (typeof recommendationValues)[number];
export type RubricResult = z.infer<typeof rubricResultSchema>;
export type StressTest = z.infer<typeof stressTestSchema>;

export function isCanvasV2(canvas: Canvas): canvas is CanvasV2 {
  return canvas.version === 2;
}
