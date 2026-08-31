"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Check,
  Clipboard,
  FlaskConical,
  Mail,
  Printer,
  Share2,
} from "lucide-react";
import { Button } from "@/components/button";
import { CanvasView } from "@/components/canvas-view";
import { Progress } from "@/components/progress";
import { canvasToText } from "@/lib/canvas-text";
import { isCanvasV2, type Canvas, type StressTest } from "@/lib/schemas";
import {
  clearParticipantSession,
  readSession,
  sessionKeys,
  useHydrated,
  writeSession,
  workshopRequestHeaders,
} from "@/lib/session";

export function ParticipantCanvas() {
  const hydrated = useHydrated();
  if (!hydrated) return <main className="min-h-[70vh]" />;
  return (
    <HydratedParticipantCanvas
      initialCanvas={readSession<Canvas>(sessionKeys.canvas)}
    />
  );
}

function HydratedParticipantCanvas({
  initialCanvas,
}: {
  initialCanvas: Canvas | null;
}) {
  const router = useRouter();
  const [canvas, setCanvas] = useState<Canvas | null>(initialCanvas);
  const [consent, setConsent] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [shareStatus, setShareStatus] = useState("");
  const [stressStatus, setStressStatus] = useState("");
  const [stressLoading, setStressLoading] = useState(false);
  const [revision, setRevision] = useState("");
  const [revisionLoading, setRevisionLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const [showFullPlan, setShowFullPlan] = useState(false);
  const [shared, setShared] = useState(false);
  const [selectedFailure, setSelectedFailure] = useState<number | null>(null);

  if (!canvas) {
    return (
      <main className="mx-auto min-h-[70vh] max-w-xl px-4 py-16 text-center sm:px-6">
        <p className="eyebrow">No canvas found</p>
        <h1 className="section-title mt-3">
          Complete the interview on this device first.
        </h1>
        <p className="mt-4 leading-7 text-cool-gray">
          For privacy, workshop answers remain in this browser tab and are not
          linked to an account.
        </p>
        <Button href="/lab" variant="accent" className="mt-7">
          Start the lab
        </Button>
      </main>
    );
  }

  const revisionIsSpecific =
    revision.trim().length >= 20 &&
    !/\b(not sure|unsure|don['’]?t know|no idea|what should i)\b/i.test(
      revision,
    );

  async function copyCanvas() {
    if (!canvas) return;
    const text = canvasToText(canvas);
    setCopyStatus("");
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error("Clipboard unavailable");
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyStatus("Canvas copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      const field = document.createElement("textarea");
      field.value = text;
      field.setAttribute("readonly", "");
      field.style.position = "fixed";
      field.style.opacity = "0";
      document.body.appendChild(field);
      field.select();
      const copiedWithFallback = document.execCommand("copy");
      field.remove();
      setCopied(copiedWithFallback);
      setCopyStatus(
        copiedWithFallback
          ? "Canvas copied."
          : "Your browser blocked copying. Use Print plan or Open email draft.",
      );
      if (copiedWithFallback) window.setTimeout(() => setCopied(false), 1800);
    }
  }

  function emailCanvas() {
    if (!canvas) return;
    const subject = `Workshop decision: ${canvas.process.name}`;
    const body = `${canvasToText(canvas)}\n\nCreated in the AICC 2026 Enterprise Agent Design Lab.`;
    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  async function stressTest() {
    if (!canvas) return;
    setStressLoading(true);
    setStressStatus("");
    try {
      const response = await fetch("/api/interview/stress-test", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...workshopRequestHeaders(),
        },
        body: JSON.stringify({ canvas }),
      });
      const data = (await response.json()) as {
        stressTests?: StressTest[];
        error?: string;
      };
      if (!response.ok || !data.stressTests)
        throw new Error(data.error || "The stress test could not run.");
      const updated = { ...canvas, stressTests: data.stressTests } as Canvas;
      setCanvas(updated);
      writeSession(sessionKeys.canvas, updated);
      setStressStatus(
        "Choose the failure that seems most likely, then add one stop rule.",
      );
      window.setTimeout(
        () =>
          document
            .getElementById("failure-exercise")
            ?.scrollIntoView({ behavior: "smooth" }),
        0,
      );
    } catch (caught) {
      setStressStatus(
        caught instanceof Error
          ? caught.message
          : "The stress test could not run.",
      );
    } finally {
      setStressLoading(false);
    }
  }

  async function addSafeguard() {
    if (
      !canvas ||
      !isCanvasV2(canvas) ||
      !canvas.stressTests ||
      !revisionIsSpecific
    )
      return;
    setRevisionLoading(true);
    setStressStatus("");
    try {
      const response = await fetch("/api/interview/revision", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...workshopRequestHeaders(),
        },
        body: JSON.stringify({
          canvas,
          failureModes: canvas.stressTests,
          revision,
        }),
      });
      const data = (await response.json()) as {
        coachResponse?: string;
        error?: string;
      };
      if (!response.ok || !data.coachResponse)
        throw new Error(data.error || "The revision could not be reviewed.");
      const revisedStopConditions = [
        revision.trim(),
        ...canvas.controls.stopConditions.slice(1, 4),
      ];
      const updated: Canvas = {
        ...canvas,
        controls: {
          ...canvas.controls,
          stopConditions: revisedStopConditions,
        },
        preMortem: {
          failureModes: canvas.stressTests,
          revision: revision.trim(),
          coachResponse: data.coachResponse,
          revisedAfterPreMortem: true as const,
          before: {
            controlIds: canvas.controls.requiredControls.map(
              (control) => control.id,
            ),
            stopConditions: canvas.controls.stopConditions,
          },
          revisedAt: new Date().toISOString(),
        },
      };
      setCanvas(updated);
      writeSession(sessionKeys.canvas, updated);
      setStressStatus("Rule added to your plan.");
    } catch (caught) {
      setStressStatus(
        caught instanceof Error
          ? caught.message
          : "The revision could not be reviewed.",
      );
    } finally {
      setRevisionLoading(false);
    }
  }

  async function shareCanvas() {
    if (!canvas || !consent) return;
    setSharing(true);
    setShareStatus("");
    try {
      const response = await fetch("/api/share", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...workshopRequestHeaders(),
        },
        body: JSON.stringify({ canvas, consent: true }),
      });
      const data = (await response.json()) as {
        shareId?: string;
        error?: string;
      };
      if (!response.ok)
        throw new Error(data.error || "Sharing is unavailable.");
      setShareStatus(`Shared anonymously. Discussion code: ${data.shareId}`);
      setShared(true);
    } catch (caught) {
      setShareStatus(
        caught instanceof Error
          ? caught.message
          : "Sharing is unavailable. Your canvas is still complete.",
      );
    } finally {
      setSharing(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="print-hidden">
        <Progress current={8} label="Your canvas" />
      </div>
      <div className="mt-9 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Agent Experiment Canvas</p>
          <h1 className="section-title mt-2 text-3xl sm:text-4xl">
            Your recommendation and test plan
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-cool-gray">
            {canvas.process.name} · {canvas.process.outcome}
          </p>
        </div>
        <div className="print-hidden flex flex-wrap gap-2">
          <Button variant="secondary" onClick={copyCanvas}>
            {copied ? (
              <Check className="h-4 w-4" />
            ) : (
              <Clipboard className="h-4 w-4" />
            )}
            {copied ? "Copied" : "Copy summary"}
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Print plan
          </Button>
          <Button variant="secondary" onClick={emailCanvas}>
            <Mail className="h-4 w-4" /> Open email draft
          </Button>
        </div>
      </div>
      {copyStatus ? (
        <p
          className="print-hidden mt-2 text-right text-xs text-cool-gray"
          role="status"
        >
          {copyStatus}
        </p>
      ) : null}
      <p className="print-hidden mt-2 text-right text-xs text-cool-gray">
        Open email draft launches your email app with the summary filled in.
      </p>

      <div className="print-hidden mt-8">
        <CanvasView
          canvas={canvas}
          summaryOnly={!showFullPlan}
          showStressTests={false}
        />
        <Button
          className="mt-5"
          variant="secondary"
          onClick={() => setShowFullPlan((value) => !value)}
        >
          {showFullPlan ? "Show decision summary" : "See the full test plan"}
        </Button>
      </div>
      <div className="hidden print:block">
        <CanvasView canvas={canvas} showStressTests={false} />
      </div>

      <section className="print-hidden mt-6 grid gap-6 lg:grid-cols-2">
        <div id="failure-exercise" className="card p-5 sm:p-6">
          <FlaskConical className="h-5 w-5 text-aicc-blue" />
          <h2 className="mt-4 text-lg font-semibold text-aicc-deep">
            Try to break the plan (2 minutes)
          </h2>
          <p className="mt-2 text-sm leading-6 text-cool-gray">
            Choose the failure that seems most likely. Then change one rule so
            the test stops before the mistake affects anyone.
          </p>
          <Button
            className="mt-5"
            variant="primary"
            disabled={stressLoading}
            onClick={stressTest}
          >
            {stressLoading
              ? "Checking…"
              : canvas.stressTests?.length
                ? "Try different examples"
                : "Show possible failures"}
          </Button>
          {canvas.stressTests?.length ? (
            <div className="mt-5 space-y-3">
              {canvas.stressTests.map((test, index) => (
                <div
                  className="border-l-2 border-warning pl-3"
                  key={`${test.scenario}-${index}`}
                >
                  <p className="text-sm font-semibold text-aicc-deep">
                    {test.scenario}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-cool-gray">
                    Watch for: {test.signal}
                  </p>
                  <button
                    type="button"
                    className="mt-2 min-h-11 text-sm font-semibold text-aicc-blue underline underline-offset-4"
                    onClick={() => {
                      setSelectedFailure(index);
                      setRevision(
                        `The process owner will stop the test when ${test.signal.toLowerCase()}. Work will return to the current process.`,
                      );
                    }}
                  >
                    {selectedFailure === index
                      ? "Failure selected"
                      : "Use this failure"}
                  </button>
                </div>
              ))}
            </div>
          ) : null}
          {isCanvasV2(canvas) &&
          !canvas.preMortem &&
          canvas.stressTests?.length ? (
            <div className="mt-6">
              <label className="block">
                <span className="text-sm font-semibold text-aicc-deep">
                  Add one stop rule
                </span>
                <span className="mt-1 block text-xs leading-5 text-cool-gray">
                  Complete this pattern: The [owner role] will stop the test
                  when [observable threshold]. Work will return to [current
                  method].
                </span>
                <textarea
                  className="field mt-2 min-h-28"
                  maxLength={500}
                  value={revision}
                  onChange={(event) => setRevision(event.target.value)}
                  placeholder="The process owner will stop the test if 2 of 20 results are wrong. Work will return to the current process."
                />
                <span className="mt-1 block text-right font-mono text-xs text-cool-gray">
                  {revision.length}/500 · minimum 20
                </span>
              </label>
              <div className="mt-3 flex flex-wrap gap-2">
                {[
                  "The process owner will stop the test if 2 of 20 results are wrong. Work will return to the current process.",
                  "The process owner will stop the test if any output contains personal or confidential information. Work will return to the current process.",
                ].map((example) => (
                  <button
                    className="border border-fog bg-white px-3 py-2 text-left text-xs font-medium leading-4 text-aicc-blue hover:border-aicc-blue"
                    key={example}
                    type="button"
                    onClick={() => setRevision(example)}
                  >
                    {example}
                  </button>
                ))}
              </div>
              <Button
                className="mt-4"
                variant="accent"
                disabled={!revisionIsSpecific || revisionLoading}
                onClick={addSafeguard}
              >
                {revisionLoading
                  ? "Checking safeguard…"
                  : "Replace my stop rule"}
              </Button>
            </div>
          ) : null}
          {isCanvasV2(canvas) && canvas.preMortem ? (
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="border border-fog bg-white p-4">
                <p className="eyebrow">Original stop rule</p>
                <p className="mt-2 text-sm leading-6 text-slate">
                  {canvas.preMortem.before.stopConditions[0]}
                </p>
              </div>
              <div className="border border-success/30 bg-success/[0.05] p-4">
                <p className="eyebrow">Revised stop rule</p>
                <p className="mt-2 text-sm font-medium leading-6 text-aicc-deep">
                  {canvas.preMortem.revision}
                </p>
              </div>
            </div>
          ) : null}
          {stressStatus && (
            <p className="mt-3 text-sm leading-5 text-cool-gray" role="status">
              {stressStatus}
            </p>
          )}
        </div>

        <div className="card p-5 sm:p-6">
          <Share2 className="h-5 w-5 text-aicc-blue" />
          <h2 className="mt-4 text-lg font-semibold text-aicc-deep">
            Optional anonymous sharing
          </h2>
          <p className="mt-2 text-sm leading-6 text-cool-gray">
            Share this plan with the facilitators for live discussion. No
            identity or contact information is collected. It remains stored
            until a facilitator deletes all shared plans.
          </p>
          <label className="mt-4 flex cursor-pointer items-start gap-3 text-sm leading-5 text-slate">
            <input
              className="mt-0.5 h-5 w-5 accent-aicc-blue"
              type="checkbox"
              checked={consent}
              onChange={(event) => setConsent(event.target.checked)}
            />
            I understand this plan may be visible on the facilitator dashboard
            during the workshop.
          </label>
          <Button
            className="mt-5"
            variant="primary"
            disabled={!consent || sharing || shared}
            onClick={shareCanvas}
          >
            {sharing ? "Sharing…" : shared ? "Shared" : "Share anonymously"}
          </Button>
          {shareStatus && (
            <p
              className="mt-3 text-sm font-medium leading-5 text-cool-gray"
              role="status"
            >
              {shareStatus}
            </p>
          )}
        </div>
      </section>

      <div className="print-hidden mt-8 flex flex-col items-center gap-3 border-t border-fog pt-8 text-center">
        <Button href="/takeaway" variant="secondary">
          Open the workshop reference
        </Button>
        <p className="max-w-2xl text-xs leading-5 text-cool-gray">
          Educational exercise only. Validate assumptions, governance, and risk
          with the appropriate people before any real-world test.
        </p>
        <button
          className="inline-flex min-h-11 items-center text-sm font-semibold text-aicc-blue underline decoration-aicc-sky underline-offset-4"
          onClick={() => {
            if (
              !window.confirm(
                "Start a new process and remove this plan from this browser tab?",
              )
            )
              return;
            clearParticipantSession();
            router.push("/lab");
          }}
        >
          Evaluate another process
        </button>
      </div>
    </main>
  );
}
