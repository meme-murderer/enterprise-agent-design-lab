"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/button";
import { sessionKeys, useHydrated } from "@/lib/session";
import type { ModelOperation, UsageSummary } from "@/lib/usage-monitor";

const operationLabels: Record<ModelOperation, string> = {
  canvas: "Workshop plans",
  "stress-test": "Failure checks",
  revision: "Stop-rule coaching",
  question: "Legacy interview questions",
  "legacy-canvas": "Legacy plans",
};

const number = new Intl.NumberFormat("en-US");

function savedPin() {
  try {
    return window.sessionStorage.getItem(sessionKeys.facilitatorPin) ?? "";
  } catch {
    return "";
  }
}

export function UsageMonitor() {
  const hydrated = useHydrated();
  if (!hydrated) return <main className="min-h-[70vh]" />;
  return <HydratedUsageMonitor initialPin={savedPin()} />;
}

function HydratedUsageMonitor({ initialPin }: { initialPin: string }) {
  const [pin, setPin] = useState(initialPin);
  const [showPin, setShowPin] = useState(false);
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [status, setStatus] = useState(
    "Enter the facilitator PIN to start the monitor.",
  );

  const loadUsage = useCallback(
    async (quiet = false) => {
      if (!pin) return;
      if (!quiet) setLoading(true);
      try {
        const response = await fetch("/api/facilitator/usage", {
          headers: { "x-facilitator-pin": pin },
          cache: "no-store",
        });
        const data = (await response.json()) as {
          summary?: UsageSummary;
          error?: string;
        };
        if (!response.ok || !data.summary) {
          throw new Error(data.error || "Live usage could not be loaded.");
        }
        try {
          window.sessionStorage.setItem(sessionKeys.facilitatorPin, pin);
        } catch {
          // PIN persistence is optional.
        }
        setAuthenticated(true);
        setSummary(data.summary);
        setStatus(
          `Updated ${new Date(data.summary.updatedAt).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
          })}. Refreshes every 5 seconds.`,
        );
      } catch (caught) {
        setAuthenticated(false);
        setSummary(null);
        setStatus(
          caught instanceof Error
            ? caught.message
            : "Live usage could not be loaded.",
        );
      } finally {
        if (!quiet) setLoading(false);
      }
    },
    [pin],
  );

  useEffect(() => {
    if (!authenticated) return;
    const interval = window.setInterval(() => void loadUsage(true), 5_000);
    return () => window.clearInterval(interval);
  }, [authenticated, loadUsage]);

  async function clearUsage() {
    if (
      !window.confirm(
        "Clear the token monitor? Shared workshop plans will not be deleted.",
      )
    )
      return;
    setClearing(true);
    try {
      const response = await fetch("/api/facilitator/usage", {
        method: "DELETE",
        headers: { "x-facilitator-pin": pin },
      });
      const data = (await response.json()) as {
        removed?: number;
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error || "Live usage could not be cleared.");
      }
      await loadUsage(true);
      setStatus(
        `${data.removed ?? 0} monitor record${data.removed === 1 ? "" : "s"} cleared. Shared plans were not changed.`,
      );
    } catch (caught) {
      setStatus(
        caught instanceof Error
          ? caught.message
          : "Live usage could not be cleared.",
      );
    } finally {
      setClearing(false);
    }
  }

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="border-b border-fog pb-7">
        <Button href="/facilitator" variant="secondary">
          <ArrowLeft className="h-4 w-4" /> Workshop canvases
        </Button>
        <div className="mt-6 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Facilitator view</p>
            <h1 className="section-title mt-2 text-3xl sm:text-4xl">
              Live model usage
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-cool-gray">
              This page counts model calls, tokens, and response time. It does
              not store participant answers or generated plans.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <label className="relative block">
              <span className="sr-only">Facilitator PIN</span>
              <input
                className="field min-h-12 pr-11 sm:w-52"
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                placeholder="Facilitator PIN"
                value={pin}
                onChange={(event) => {
                  setPin(event.target.value);
                  setAuthenticated(false);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") void loadUsage();
                }}
              />
              <button
                type="button"
                className="absolute right-1 top-0 flex h-12 w-11 items-center justify-center text-cool-gray"
                onClick={() => setShowPin((current) => !current)}
                aria-label={showPin ? "Hide PIN" : "Show PIN"}
              >
                {showPin ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </label>
            <Button
              variant="primary"
              disabled={!pin || loading || clearing}
              onClick={() => void loadUsage()}
            >
              <RefreshCw
                className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
              />
              {authenticated ? "Refresh now" : "Start monitor"}
            </Button>
            <Button
              variant="danger"
              disabled={!authenticated || clearing || !summary?.totalCalls}
              onClick={clearUsage}
            >
              <Trash2 className="h-4 w-4" />
              {clearing ? "Clearing…" : "Clear monitor"}
            </Button>
          </div>
        </div>
      </div>

      <div
        className="mt-4 flex items-center gap-2 text-sm text-cool-gray"
        role="status"
      >
        <span
          className={`h-2.5 w-2.5 rounded-full ${authenticated ? "bg-success" : "bg-cool-gray"}`}
          aria-hidden="true"
        />
        {status}
      </div>

      {authenticated && summary && (
        <>
          <section className="mt-7 grid grid-cols-2 gap-px border border-fog bg-fog md:grid-cols-4">
            <Metric
              label="Model calls"
              value={number.format(summary.totalCalls)}
            />
            <Metric
              label="Total tokens"
              value={number.format(summary.totalTokens)}
            />
            <Metric
              label="Calls in last minute"
              value={number.format(summary.callsLastMinute)}
            />
            <Metric
              label="Tokens in last minute"
              value={number.format(summary.tokensLastMinute)}
            />
            <Metric
              label="Input tokens"
              value={number.format(summary.inputTokens)}
            />
            <Metric
              label="Output tokens"
              value={number.format(summary.outputTokens)}
            />
            <Metric
              label="Average response"
              value={duration(summary.averageLatencyMs)}
            />
            <Metric
              label="95th percentile"
              value={duration(summary.p95LatencyMs)}
            />
          </section>

          {summary.currentLimits && (
            <section className="mt-6 border-l-4 border-aicc-blue bg-white p-5">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-aicc-blue" />
                <h2 className="font-semibold text-aicc-deep">
                  Production API headroom
                </h2>
              </div>
              <div className="mt-4 grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <Limit
                  label="Request limit"
                  value={`${number.format(summary.currentLimits.requestLimit)} / minute`}
                />
                <Limit
                  label="Requests remaining"
                  value={number.format(summary.currentLimits.remainingRequests)}
                />
                <Limit
                  label="Token limit"
                  value={`${number.format(summary.currentLimits.tokenLimit)} / minute`}
                />
                <Limit
                  label="Tokens remaining"
                  value={number.format(summary.currentLimits.remainingTokens)}
                />
              </div>
              <p className="mt-4 text-xs leading-5 text-cool-gray">
                Observed from the most recent successful production response.
                The OpenAI Platform remains the billing record of authority.
              </p>
            </section>
          )}

          <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.25fr]">
            <section className="card p-5">
              <h2 className="text-lg font-semibold text-aicc-deep">
                Calls by activity
              </h2>
              {summary.byOperation.length ? (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="border-b border-fog text-cool-gray">
                      <tr>
                        <th className="pb-3 font-medium">Activity</th>
                        <th className="pb-3 text-right font-medium">Calls</th>
                        <th className="pb-3 text-right font-medium">Tokens</th>
                        <th className="pb-3 text-right font-medium">Average</th>
                      </tr>
                    </thead>
                    <tbody>
                      {summary.byOperation.map((row) => (
                        <tr
                          className="border-b border-fog last:border-0"
                          key={row.operation}
                        >
                          <td className="py-3 pr-3">
                            <p className="font-medium text-aicc-deep">
                              {operationLabels[row.operation]}
                            </p>
                            {row.failedCalls > 0 && (
                              <p className="mt-1 text-xs text-error">
                                {row.failedCalls} interrupted or failed
                              </p>
                            )}
                          </td>
                          <td className="py-3 text-right font-mono">
                            {number.format(row.calls)}
                          </td>
                          <td className="py-3 text-right font-mono">
                            {number.format(row.totalTokens)}
                          </td>
                          <td className="py-3 text-right font-mono">
                            {duration(row.averageLatencyMs)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mt-4 text-sm text-cool-gray">
                  No model calls have been recorded since the monitor was last
                  cleared.
                </p>
              )}
            </section>

            <section className="card p-5">
              <h2 className="text-lg font-semibold text-aicc-deep">
                Recent calls
              </h2>
              {summary.recent.length ? (
                <div className="mt-4 space-y-2">
                  {summary.recent.map((event) => (
                    <div
                      className="grid grid-cols-[1fr_auto] gap-4 border-b border-fog py-3 last:border-0"
                      key={event.id}
                    >
                      <div>
                        <p className="font-medium text-aicc-deep">
                          {operationLabels[event.operation]}
                        </p>
                        <p className="mt-1 text-xs text-cool-gray">
                          {event.model} ·{" "}
                          {new Date(event.occurredAt).toLocaleTimeString([], {
                            hour: "numeric",
                            minute: "2-digit",
                            second: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-mono text-sm text-aicc-deep">
                          {number.format(event.totalTokens)} tokens
                        </p>
                        <p
                          className={`mt-1 text-xs ${event.outcome === "completed" ? "text-cool-gray" : "text-error"}`}
                        >
                          {duration(event.latencyMs)} ·{" "}
                          {event.outcome === "completed"
                            ? "complete"
                            : "interrupted"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-4 text-sm text-cool-gray">
                  Waiting for the first model call.
                </p>
              )}
            </section>
          </div>
        </>
      )}
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white p-4 sm:p-5">
      <p className="font-mono text-2xl font-medium text-aicc-deep sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-sm leading-5 text-cool-gray">{label}</p>
    </div>
  );
}

function Limit({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-cool-gray">
        {label}
      </p>
      <p className="mt-1 font-mono text-lg text-aicc-deep">{value}</p>
    </div>
  );
}

function duration(milliseconds: number) {
  if (milliseconds < 1_000) return `${milliseconds} ms`;
  return `${(milliseconds / 1_000).toFixed(1)} s`;
}
