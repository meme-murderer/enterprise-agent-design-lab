import { describe, expect, it } from "vitest";
import { summarizeUsage, type ModelUsageEvent } from "@/lib/usage-monitor";

function event(overrides: Partial<ModelUsageEvent> = {}): ModelUsageEvent {
  return {
    id: "event-1",
    occurredAt: "2026-08-27T05:00:00.000Z",
    operation: "canvas",
    model: "example-model",
    outcome: "completed",
    inputTokens: 1_000,
    cachedInputTokens: 100,
    cacheWriteTokens: 0,
    outputTokens: 500,
    reasoningTokens: 0,
    totalTokens: 1_500,
    latencyMs: 10_000,
    requestLimit: 5_000,
    remainingRequests: 4_999,
    tokenLimit: 4_000_000,
    remainingTokens: 3_998_000,
    ...overrides,
  };
}

describe("summarizeUsage", () => {
  it("aggregates tokens, latency, failures, and the last minute", () => {
    const summary = summarizeUsage(
      [
        event(),
        event({
          id: "event-2",
          occurredAt: "2026-08-27T05:00:30.000Z",
          operation: "stress-test",
          outcome: "failed",
          inputTokens: 0,
          cachedInputTokens: 0,
          outputTokens: 0,
          totalTokens: 0,
          latencyMs: 12_000,
        }),
      ],
      new Date("2026-08-27T05:01:00.000Z"),
    );

    expect(summary).toMatchObject({
      totalCalls: 2,
      completedCalls: 1,
      failedCalls: 1,
      inputTokens: 1_000,
      outputTokens: 500,
      totalTokens: 1_500,
      callsLastMinute: 2,
      tokensLastMinute: 1_500,
      averageLatencyMs: 11_000,
      p95LatencyMs: 12_000,
      currentLimits: {
        requestLimit: 5_000,
        remainingRequests: 4_999,
        tokenLimit: 4_000_000,
        remainingTokens: 3_998_000,
        observedAt: "2026-08-27T05:00:00.000Z",
      },
    });
    expect(summary.byOperation).toEqual([
      {
        operation: "canvas",
        calls: 1,
        failedCalls: 0,
        totalTokens: 1_500,
        averageLatencyMs: 10_000,
      },
      {
        operation: "stress-test",
        calls: 1,
        failedCalls: 1,
        totalTokens: 0,
        averageLatencyMs: 12_000,
      },
    ]);
  });
});
