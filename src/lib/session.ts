import "client-only";
import type {
  GovernanceInput,
  InterviewTurn,
  ProcessInput,
  Signals,
} from "@/lib/schemas";
import { useEffect, useState } from "react";

export type LabSession = {
  step: string;
  process?: ProcessInput;
  turns: InterviewTurn[];
  signals?: Partial<Signals>;
  currentQuestion?: string;
  governance?: Partial<GovernanceInput>;
};

export const sessionKeys = {
  lab: "aicc-agent-lab-session-v1",
  canvas: "aicc-agent-lab-canvas-v1",
  facilitatorPin: "aicc-agent-lab-facilitator-pin-v1",
  requestId: "aicc-agent-lab-request-id-v1",
};

let memoryRequestId: string | undefined;

function newRequestId() {
  if (typeof window.crypto?.randomUUID === "function") {
    return window.crypto.randomUUID();
  }
  return `workshop-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}

export function workshopRequestHeaders() {
  try {
    let requestId = window.sessionStorage.getItem(sessionKeys.requestId);
    if (!requestId) {
      requestId = memoryRequestId ?? newRequestId();
      window.sessionStorage.setItem(sessionKeys.requestId, requestId);
    }
    memoryRequestId = requestId;
  } catch {
    memoryRequestId ??= newRequestId();
  }
  return { "x-workshop-session": memoryRequestId };
}

export function readSession<T>(key: string): T | null {
  if (typeof window === "undefined") return null;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as T) : null;
  } catch {
    return null;
  }
}

export function writeSession<T>(key: string, value: T) {
  try {
    window.sessionStorage.setItem(key, JSON.stringify(value));
  } catch {
    // The activity still works without browser persistence in restricted modes.
  }
}

export function clearParticipantSession() {
  try {
    window.sessionStorage.removeItem(sessionKeys.lab);
    window.sessionStorage.removeItem(sessionKeys.canvas);
  } catch {
    // Nothing persisted, so there is nothing to clear.
  }
}

export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setHydrated(true), 0);
    return () => window.clearTimeout(timeout);
  }, []);
  return hydrated;
}
