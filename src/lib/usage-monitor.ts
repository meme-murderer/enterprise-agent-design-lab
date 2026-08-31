import "server-only";

import { randomUUID } from "node:crypto";
import { Firestore } from "@google-cloud/firestore";

export const modelOperations = [
  "canvas",
  "stress-test",
  "revision",
  "question",
  "legacy-canvas",
] as const;

export type ModelOperation = (typeof modelOperations)[number];
export type ModelCallOutcome = "completed" | "failed";

export type ModelUsageEvent = {
  id: string;
  occurredAt: string;
  operation: ModelOperation;
  model: string;
  outcome: ModelCallOutcome;
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  latencyMs: number;
  requestLimit: number | null;
  remainingRequests: number | null;
  tokenLimit: number | null;
  remainingTokens: number | null;
};

export type UsageSummary = {
  totalCalls: number;
  completedCalls: number;
  failedCalls: number;
  inputTokens: number;
  cachedInputTokens: number;
  cacheWriteTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
  callsLastMinute: number;
  tokensLastMinute: number;
  averageLatencyMs: number;
  p95LatencyMs: number;
  firstRecordedAt: string | null;
  updatedAt: string;
  currentLimits: {
    requestLimit: number;
    remainingRequests: number;
    tokenLimit: number;
    remainingTokens: number;
    observedAt: string;
  } | null;
  byOperation: Array<{
    operation: ModelOperation;
    calls: number;
    failedCalls: number;
    totalTokens: number;
    averageLatencyMs: number;
  }>;
  recent: ModelUsageEvent[];
};

type NewUsageEvent = Omit<ModelUsageEvent, "id" | "occurredAt">;

let firestoreClient: Firestore | null = null;
let memoryEvents: ModelUsageEvent[] = [];

function projectId() {
  return (
    process.env.GOOGLE_CLOUD_PROJECT?.trim() ||
    process.env.GCP_PROJECT_ID?.trim() ||
    ""
  );
}

function firestore() {
  const id = projectId();
  if (!id) return null;
  firestoreClient ??= new Firestore({ projectId: id });
  return firestoreClient;
}

function collectionName() {
  return (
    process.env.FIRESTORE_USAGE_COLLECTION?.trim() ||
    `${process.env.FIRESTORE_COLLECTION?.trim() || "agent-design-lab-submissions"}-usage`
  );
}

export function usageStorageMode() {
  if (projectId()) return "firestore" as const;
  if (process.env.NODE_ENV !== "production") return "memory" as const;
  return "disabled" as const;
}

export async function recordModelCall(event: NewUsageEvent) {
  const row: ModelUsageEvent = {
    ...event,
    id: randomUUID(),
    occurredAt: new Date().toISOString(),
  };

  try {
    const mode = usageStorageMode();
    if (mode === "firestore") {
      const store = firestore();
      if (!store) return false;
      await store.collection(collectionName()).doc(row.id).set(row);
      return true;
    }
    if (mode === "memory") {
      memoryEvents = [row, ...memoryEvents].slice(0, 1_000);
      return true;
    }
  } catch (error) {
    console.error("Usage telemetry could not be recorded", error);
  }
  return false;
}

export async function listUsageEvents(limit = 1_000) {
  const boundedLimit = Math.max(1, Math.min(limit, 1_000));
  const mode = usageStorageMode();
  if (mode === "firestore") {
    const store = firestore();
    if (!store) return null;
    const snapshot = await store
      .collection(collectionName())
      .orderBy("occurredAt", "desc")
      .limit(boundedLimit)
      .get();
    return snapshot.docs.map((document) => document.data() as ModelUsageEvent);
  }
  if (mode === "memory") return memoryEvents.slice(0, boundedLimit);
  return null;
}

export async function purgeUsageEvents() {
  const mode = usageStorageMode();
  if (mode === "firestore") {
    const store = firestore();
    if (!store) return false;
    let removed = 0;
    const collection = store.collection(collectionName());
    while (true) {
      const snapshot = await collection.limit(500).get();
      if (snapshot.empty) break;
      const batch = store.batch();
      snapshot.docs.forEach((document) => batch.delete(document.ref));
      await batch.commit();
      removed += snapshot.size;
      if (snapshot.size < 500) break;
    }
    return removed;
  }
  if (mode === "memory") {
    const removed = memoryEvents.length;
    memoryEvents = [];
    return removed;
  }
  return false;
}

export function summarizeUsage(
  events: ModelUsageEvent[],
  now = new Date(),
): UsageSummary {
  const nowMs = now.getTime();
  const lastMinute = events.filter(
    (event) => nowMs - new Date(event.occurredAt).getTime() <= 60_000,
  );
  const latencies = events
    .map((event) => event.latencyMs)
    .sort((left, right) => left - right);
  const sum = (field: keyof ModelUsageEvent, rows = events) =>
    rows.reduce((total, event) => total + Number(event[field] || 0), 0);
  const operationRows = modelOperations
    .map((operation) => {
      const rows = events.filter((event) => event.operation === operation);
      return {
        operation,
        calls: rows.length,
        failedCalls: rows.filter((event) => event.outcome === "failed").length,
        totalTokens: sum("totalTokens", rows),
        averageLatencyMs: rows.length
          ? Math.round(sum("latencyMs", rows) / rows.length)
          : 0,
      };
    })
    .filter((row) => row.calls > 0);
  const latestLimits = events.find(
    (event) => event.requestLimit !== null && event.tokenLimit !== null,
  );

  return {
    totalCalls: events.length,
    completedCalls: events.filter((event) => event.outcome === "completed")
      .length,
    failedCalls: events.filter((event) => event.outcome === "failed").length,
    inputTokens: sum("inputTokens"),
    cachedInputTokens: sum("cachedInputTokens"),
    cacheWriteTokens: sum("cacheWriteTokens"),
    outputTokens: sum("outputTokens"),
    reasoningTokens: sum("reasoningTokens"),
    totalTokens: sum("totalTokens"),
    callsLastMinute: lastMinute.length,
    tokensLastMinute: sum("totalTokens", lastMinute),
    averageLatencyMs: events.length
      ? Math.round(sum("latencyMs") / events.length)
      : 0,
    p95LatencyMs: latencies.length
      ? latencies[
          Math.min(latencies.length - 1, Math.floor(latencies.length * 0.95))
        ]
      : 0,
    firstRecordedAt: events.at(-1)?.occurredAt ?? null,
    updatedAt: now.toISOString(),
    currentLimits: latestLimits
      ? {
          requestLimit: latestLimits.requestLimit!,
          remainingRequests: latestLimits.remainingRequests ?? 0,
          tokenLimit: latestLimits.tokenLimit!,
          remainingTokens: latestLimits.remainingTokens ?? 0,
          observedAt: latestLimits.occurredAt,
        }
      : null,
    byOperation: operationRows,
    recent: events.slice(0, 20),
  };
}
