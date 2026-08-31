"use client";

import { useMemo, useState } from "react";
import {
  Activity,
  Eye,
  EyeOff,
  Presentation,
  RefreshCw,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/button";
import { CanvasView, RecommendationBadge } from "@/components/canvas-view";
import type { SharedCanvas, StorageMode } from "@/lib/share-store";
import { recommendationValues } from "@/lib/schemas";
import { recommendationLabel } from "@/lib/recommendation-language";
import { sessionKeys, useHydrated } from "@/lib/session";

export function FacilitatorDashboard() {
  const hydrated = useHydrated();
  if (!hydrated) return <main className="min-h-[70vh]" />;
  return (
    <HydratedFacilitatorDashboard
      initialPin={
        window.sessionStorage.getItem(sessionKeys.facilitatorPin) ?? ""
      }
    />
  );
}

function HydratedFacilitatorDashboard({ initialPin }: { initialPin: string }) {
  const [pin, setPin] = useState(initialPin);
  const [showPin, setShowPin] = useState(false);
  const [submissions, setSubmissions] = useState<SharedCanvas[]>([]);
  const [selected, setSelected] = useState<SharedCanvas | null>(null);
  const [storageMode, setStorageMode] = useState<StorageMode | null>(null);
  const [status, setStatus] = useState(
    "Enter the facilitator PIN to load anonymous submissions.",
  );
  const [loading, setLoading] = useState(false);
  const [purging, setPurging] = useState(false);

  async function loadSubmissions() {
    setLoading(true);
    setStatus("");
    try {
      const response = await fetch("/api/facilitator/submissions", {
        headers: { "x-facilitator-pin": pin },
        cache: "no-store",
      });
      const data = (await response.json()) as {
        submissions?: SharedCanvas[];
        storageMode?: StorageMode;
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error || "Submissions could not be loaded.");
      const rows = data.submissions ?? [];
      setStorageMode(data.storageMode ?? null);
      window.sessionStorage.setItem(sessionKeys.facilitatorPin, pin);
      setSubmissions(rows);
      setSelected(
        (current) =>
          rows.find((row) => row.shareId === current?.shareId) ??
          rows[0] ??
          null,
      );
      setStatus(
        rows.length
          ? `${rows.length} anonymous canvas${rows.length === 1 ? "" : "es"} loaded.`
          : "No canvases have been shared yet.",
      );
    } catch (caught) {
      setSubmissions([]);
      setStorageMode(null);
      setStatus(
        caught instanceof Error
          ? caught.message
          : "Submissions could not be loaded.",
      );
    } finally {
      setLoading(false);
    }
  }

  async function purgeAll() {
    if (
      !window.confirm(
        "Permanently delete all shared canvases? This cannot be undone.",
      )
    )
      return;
    setPurging(true);
    setStatus("");
    try {
      const response = await fetch("/api/facilitator/submissions", {
        method: "DELETE",
        headers: { "x-facilitator-pin": pin },
      });
      const data = (await response.json()) as {
        removed?: number;
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error || "Shared canvases could not be purged.");
      const removed = data.removed ?? 0;
      setSubmissions([]);
      setSelected(null);
      setStatus(
        removed === 1
          ? "1 shared canvas was permanently deleted."
          : `${removed} shared canvases were permanently deleted.`,
      );
    } catch (caught) {
      setStatus(
        caught instanceof Error
          ? caught.message
          : "Shared canvases could not be purged.",
      );
    } finally {
      setPurging(false);
    }
  }

  const counts = useMemo(() => {
    const values: Record<string, number> = {};
    submissions.forEach((row) => {
      values[row.canvas.recommendation] =
        (values[row.canvas.recommendation] ?? 0) + 1;
    });
    return values;
  }, [submissions]);

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-5 border-b border-fog pb-7 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="eyebrow">Facilitator view</p>
          <h1 className="section-title mt-2 text-3xl sm:text-4xl">
            Workshop canvases
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-cool-gray">
            Only canvases participants explicitly choose to share are stored.
            Refresh manually when you are ready to discuss.
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
              onChange={(event) => setPin(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") void loadSubmissions();
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
            disabled={!pin || loading || purging}
            onClick={loadSubmissions}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />{" "}
            Refresh
          </Button>
          <Button
            variant="danger"
            disabled={!pin || loading || purging || submissions.length === 0}
            onClick={purgeAll}
          >
            <Trash2 className="h-4 w-4" />
            {purging ? "Deleting…" : "Delete all shared plans"}
          </Button>
          <Button href="/facilitator/demo" variant="accent">
            <Presentation className="h-4 w-4" /> Prepared examples
          </Button>
          <Button href="/facilitator/injection" variant="secondary">
            <ShieldAlert className="h-4 w-4" /> Document attack demo
          </Button>
          <Button href="/facilitator/monitor" variant="secondary">
            <Activity className="h-4 w-4" /> Live usage
          </Button>
        </div>
      </div>

      <p className="mt-4 text-sm text-cool-gray" role="status">
        {status}
      </p>
      {storageMode && (
        <p className="mt-1 text-xs text-cool-gray">
          Saved in workshop storage until you delete all shared plans.
        </p>
      )}

      {submissions.length > 0 && (
        <div className="mt-7 grid gap-7 lg:grid-cols-[360px_1fr]">
          <aside>
            <div className="grid grid-cols-2 gap-px border border-fog bg-fog">
              {recommendationValues.map((name) => (
                <div className="bg-white p-4" key={name}>
                  <p className="font-mono text-2xl font-medium text-aicc-deep">
                    {counts[name] ?? 0}
                  </p>
                  <p className="mt-1 text-xs leading-4 text-cool-gray">
                    {recommendationLabel[name]}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 space-y-2">
              {submissions.map((submission) => (
                <button
                  className={`w-full border p-4 text-left transition-colors ${selected?.shareId === submission.shareId ? "border-aicc-blue bg-white" : "border-fog bg-white hover:border-cool-gray"}`}
                  key={submission.shareId}
                  onClick={() => setSelected(submission)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <h2 className="font-semibold text-aicc-deep">
                      {submission.canvas.process.name}
                    </h2>
                    <span className="font-mono text-[10px] text-cool-gray">
                      {submission.shareId}
                    </span>
                  </div>
                  <div className="mt-3">
                    <RecommendationBadge
                      recommendation={submission.canvas.recommendation}
                    />
                  </div>
                  <p className="mt-2 line-clamp-2 text-xs leading-5 text-cool-gray">
                    {submission.canvas.process.outcome}
                  </p>
                </button>
              ))}
            </div>
          </aside>
          <section>
            {selected ? (
              <>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="font-mono text-lg font-semibold tracking-[0.08em] text-aicc-blue">
                      Discussion code {selected.shareId}
                    </p>
                    <h2 className="mt-1 text-xl font-semibold text-aicc-deep">
                      {selected.canvas.process.name}
                    </h2>
                  </div>
                  <span className="font-mono text-xs text-cool-gray">
                    {new Date(selected.sharedAt).toLocaleString([], {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="mb-4 border border-fog bg-white p-4">
                  <p className="eyebrow">Ask the room</p>
                  <ul className="mt-3 grid gap-2 text-sm leading-5 text-slate sm:grid-cols-2">
                    <li>Which answer most affected this recommendation?</li>
                    <li>What decision must remain with a person?</li>
                    <li>Is the stop rule observable?</li>
                    <li>What fact would support a less autonomous choice?</li>
                  </ul>
                </div>
                <CanvasView canvas={selected.canvas} summaryOnly />
              </>
            ) : (
              <div className="card flex min-h-80 items-center justify-center p-8 text-center text-cool-gray">
                Select a canvas to present.
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
