"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/button";
import { Progress } from "@/components/progress";
import { judgmentQuestions } from "@/lib/judgment-questions";
import { recommendationLabel } from "@/lib/recommendation-language";
import {
  businessFunctions,
  chipOptions,
  type CanvasV2,
  type GovernanceInput,
  type JudgmentTurn,
  type ProcessInput,
  type Signals,
} from "@/lib/schemas";
import {
  clearParticipantSession,
  readSession,
  sessionKeys,
  type LabSession,
  useHydrated,
  writeSession,
  workshopRequestHeaders,
} from "@/lib/session";

type Step =
  | "safety"
  | "process"
  | "shape"
  | "action"
  | "touch"
  | "wrong"
  | "judgment1"
  | "judgment2"
  | "reveal";

const resumableSteps: Step[] = [
  "safety",
  "process",
  "shape",
  "action",
  "touch",
  "wrong",
  "judgment1",
  "judgment2",
];

const emptyProcess: ProcessInput = {
  name: "",
  outcome: "",
  businessFunction: null,
  safetyAcknowledged: true,
};
const stepNumber: Record<Step, number> = {
  safety: 1,
  process: 2,
  shape: 3,
  action: 4,
  touch: 5,
  wrong: 6,
  judgment1: 7,
  judgment2: 8,
  reveal: 8,
};
const stepLabel: Record<Step, string> = {
  safety: "Safety",
  process: "Choose the work",
  shape: "Workload",
  action: "System role",
  touch: "Information",
  wrong: "Mistakes",
  judgment1: "Hard cases",
  judgment2: "Review and stop",
  reveal: "Recommendation",
};

const optionLabels: Record<string, string> = {
  "Under 10": "Under 10 per month",
  "10-100": "10 to 100 per month",
  "100-1,000": "100 to 1,000 per month",
  "Over 1,000": "More than 1,000 per month",
  "Same every time": "Nearly every case follows the same rules",
  "Minor variations": "Most cases are similar, with common exceptions",
  "Every case is different": "Each case needs separate judgment",
  "Read and summarize": "Read information and summarize it",
  "Draft for a person": "Prepare a draft for a person to review",
  "Classify and route": "Put a case in a category or queue",
  "Decide within set rules": "Choose an action using written rules",
  "Execute a transaction": "Complete an action in a business system",
  One: "One system",
  "Two or three": "Two or three systems",
  "Four or more": "Four or more systems",
  "No - fixed steps": "Yes. The steps are fixed.",
  Sometimes: "Usually. A few conditions change the next step.",
  "Yes - it has to work out the path":
    "No. The next step depends on what the system finds.",
  Public: "Public information",
  "Internal only": "Internal company information",
  "Customer personal": "Customer or employee personal information",
  Financial: "Payments, budgets, or financial records",
  Regulated: "Information covered by a law or regulation",
  "Security-sensitive": "Security information or access details",
  "Structured records from internal systems":
    "Structured records created by internal systems",
  "Internal documents or messages":
    "Documents or messages written by employees",
  "Customer or vendor content":
    "Documents or messages sent by customers or vendors",
  "Public or web content": "Public websites or other outside sources",
  "Nobody outside the team": "Internal rework only",
  "One customer or employee": "One person receives a wrong decision or message",
  "Many customers": "Many people receive wrong results",
  "Regulator or auditor":
    "A payment, required report, or regulated decision is wrong",
  "Trivially undone": "Yes. It can be corrected immediately.",
  "Undone with effort": "Yes, but someone must fix records or contact people.",
  "Effectively irreversible":
    "No. The effect would be difficult or impossible to reverse.",
  "Immediately and automatically": "A system flags it immediately",
  "A person catches it on review": "A person finds it during review",
  "Only when someone complains":
    "We learn about it after someone reports a problem",
  "We might not find out for months":
    "It may remain hidden for weeks or months",
  No: "No. Written rules can determine the result.",
  "Not sure": "Not sure yet",
  Yes: "Yes. A person must make the final decision.",
  "Under 5 hours": "Less than 5 hours",
  "5-25 hours": "5 to 25 hours",
  "25-100 hours": "25 to 100 hours",
  "Over 100 hours": "More than 100 hours",
  "Almost none": "Almost none",
  "A small minority": "A small minority",
  Many: "Many cases",
  "Almost all": "Almost every case",
};

export function LabExperience() {
  const hydrated = useHydrated();
  if (!hydrated)
    return (
      <main className="mx-auto min-h-[70vh] max-w-3xl px-4 py-12 sm:px-6" />
    );
  return (
    <HydratedLab initialSession={readSession<LabSession>(sessionKeys.lab)} />
  );
}

function HydratedLab({
  initialSession,
}: {
  initialSession: LabSession | null;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(() => {
    if (
      initialSession?.step &&
      resumableSteps.includes(initialSession.step as Step)
    )
      return initialSession.step as Step;
    return initialSession?.process ? "process" : "safety";
  });
  const [acknowledged, setAcknowledged] = useState(
    Boolean(initialSession?.process?.safetyAcknowledged),
  );
  const [processInput, setProcessInput] = useState<ProcessInput>(
    initialSession?.process ?? emptyProcess,
  );
  const [signals, setSignals] = useState<Partial<Signals>>(
    initialSession?.signals ?? { dataClasses: [], inputSources: [] },
  );
  const [turns, setTurns] = useState<JudgmentTurn[]>(
    initialSession?.turns?.filter((turn) => turn.answer.length >= 8) ?? [],
  );
  const [answer, setAnswer] = useState("");
  const [governance, setGovernance] = useState<Partial<GovernanceInput>>(
    initialSession?.governance ?? {},
  );
  const [canvas, setCanvas] = useState<CanvasV2 | null>(null);
  const [visibleTrace, setVisibleTrace] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingSeconds, setLoadingSeconds] = useState(0);
  const [error, setError] = useState("");

  useEffect(() => {
    writeSession<LabSession>(sessionKeys.lab, {
      step,
      process: processInput.name ? processInput : undefined,
      turns,
      signals,
      governance,
    });
  }, [governance, processInput, signals, step, turns]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
    const frame = window.requestAnimationFrame(() => {
      document.querySelector<HTMLElement>("[data-step-heading]")?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [step]);

  useEffect(() => {
    if (step !== "reveal" || !canvas) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      const immediate = window.setTimeout(
        () => setVisibleTrace(canvas.rubric.trace.length + 1),
        0,
      );
      return () => window.clearTimeout(immediate);
    }
    const timers = canvas.rubric.trace.map((_, index) =>
      window.setTimeout(() => setVisibleTrace(index + 1), 300 * (index + 1)),
    );
    timers.push(
      window.setTimeout(
        () => setVisibleTrace(canvas.rubric.trace.length + 1),
        300 * (canvas.rubric.trace.length + 1),
      ),
    );
    return () => timers.forEach(window.clearTimeout);
  }, [canvas, step]);

  useEffect(() => {
    if (!loading) return;
    const timer = window.setInterval(
      () => setLoadingSeconds((value) => value + 1),
      1000,
    );
    return () => window.clearInterval(timer);
  }, [loading]);

  const processValid =
    processInput.name.trim().length >= 3 &&
    processInput.outcome.trim().length >= 10;
  const governanceValid =
    (governance.ownerRole?.trim().length ?? 0) >= 3 &&
    (governance.approverRole?.trim().length ?? 0) >= 3 &&
    (governance.stopRule?.trim().length ?? 0) >= 20 &&
    !/\b(not sure|unsure|don['’]?t know|no idea|what should i|what to enter)\b/i.test(
      governance.stopRule ?? "",
    );
  const completeSignals = signals as Signals;
  const questions = useMemo(() => {
    try {
      return judgmentQuestions(completeSignals);
    } catch {
      return [
        {
          question: "Which cases require the most judgment from a person?",
          help: "Think about a missing fact, conflicting rule, or exception.",
          placeholder:
            "Example: A policy exception requires a manager to decide what happens next.",
        },
        {
          question:
            "Who will check the results, and what mistake should stop the test?",
          help: "Name a role and use a number when possible.",
          placeholder:
            "Example: A manager reviews every result. Stop after 2 errors in 20 test cases.",
        },
      ];
    }
  }, [completeSignals]);

  function single<K extends keyof Signals>(key: K, value: Signals[K]) {
    setSignals((current) => ({ ...current, [key]: value }));
  }
  function multi(
    key: "dataClasses" | "inputSources",
    value: Signals[typeof key][number],
  ) {
    setSignals((current) => {
      const selected = (current[key] ?? []) as string[];
      return {
        ...current,
        [key]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  }

  async function completeInterview() {
    if (!governanceValid) return;
    const finalTurn: JudgmentTurn = {
      question: questions[1].question,
      answer: `Owner: ${governance.ownerRole}. Approver: ${governance.approverRole}. Stop rule: ${governance.stopRule}`,
    };
    setLoading(true);
    setLoadingSeconds(0);
    setError("");
    try {
      const response = await fetch("/api/interview/answer", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...workshopRequestHeaders(),
        },
        body: JSON.stringify({
          version: 2,
          process: processInput,
          signals: completeSignals,
          turns: [turns[0], finalTurn],
          governance,
        }),
      });
      const data = (await response.json()) as {
        canvas?: CanvasV2;
        error?: string;
      };
      if (!response.ok || !data.canvas)
        throw new Error(data.error || "The canvas could not be built.");
      setTurns([turns[0], finalTurn]);
      setCanvas(data.canvas);
      writeSession(sessionKeys.canvas, data.canvas);
      setVisibleTrace(0);
      setStep("reveal");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "The canvas could not be built.",
      );
    } finally {
      setLoading(false);
    }
  }

  function startOver() {
    if (
      !window.confirm(
        "Start over and clear this workshop session from the browser?",
      )
    )
      return;
    clearParticipantSession();
    setStep("safety");
    setAcknowledged(false);
    setProcessInput(emptyProcess);
    setSignals({ dataClasses: [], inputSources: [] });
    setTurns([]);
    setAnswer("");
    setGovernance({});
    setCanvas(null);
    setError("");
  }

  const nav = (back: Step, next: Step, ready: boolean) => (
    <div className="mt-8 flex items-center justify-between gap-3">
      <Button variant="ghost" onClick={() => setStep(back)}>
        <ArrowLeft className="h-4 w-4" /> Back
      </Button>
      <Button variant="accent" disabled={!ready} onClick={() => setStep(next)}>
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </div>
  );

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <Progress current={stepNumber[step]} total={8} label={stepLabel[step]} />
      {step !== "safety" && step !== "reveal" && (
        <button
          className="mt-5 flex min-h-11 items-center gap-1 text-xs font-medium text-cool-gray"
          onClick={startOver}
        >
          <RotateCcw className="h-3.5 w-3.5" /> Start over
        </button>
      )}

      {step === "safety" && (
        <section className="mt-10" aria-labelledby="safety-title">
          <div className="mb-5 flex h-12 w-12 items-center justify-center bg-aicc-blue/[0.08] text-aicc-blue">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="eyebrow">Before you begin</p>
          <h1
            id="safety-title"
            data-step-heading
            tabIndex={-1}
            className="section-title mt-3 text-3xl sm:text-4xl"
          >
            Protect the information in the room.
          </h1>
          <div className="card lead-card mt-7 p-5 sm:p-6">
            <p className="text-base font-medium leading-7 text-aicc-deep sm:text-lg">
              Use a hypothetical or sanitized process. Do not enter customer,
              employee, patient, financial, credential, security-sensitive,
              regulated, proprietary, or confidential information.
            </p>
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 border border-fog bg-white p-4">
            <input
              className="mt-1 h-5 w-5 accent-aicc-blue"
              type="checkbox"
              checked={acknowledged}
              onChange={(event) => {
                setAcknowledged(event.target.checked);
                setProcessInput((current) => ({
                  ...current,
                  safetyAcknowledged: event.target.checked as true,
                }));
              }}
            />
            <span>
              <span className="block font-medium text-aicc-deep">
                I will use generalized or hypothetical information.
              </span>
              <span className="mt-1 block text-sm leading-5 text-cool-gray">
                Do not include names, employers, account details, or real
                records.
              </span>
            </span>
          </label>
          <div className="mt-8 flex justify-end">
            <Button
              variant="accent"
              disabled={!acknowledged}
              onClick={() => setStep("process")}
            >
              Continue <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </section>
      )}

      {step === "process" && (
        <section className="mt-8">
          <p className="eyebrow">Pick work you know well</p>
          <h1
            data-step-heading
            tabIndex={-1}
            className="section-title mt-3 text-3xl sm:text-4xl"
          >
            Choose the process and the result to improve.
          </h1>
          <p className="mt-3 leading-7 text-cool-gray">
            Choose one process that happens repeatedly. It may be simple or
            require judgment. Keep the description generalized.
          </p>
          <div className="mt-6 border-l-4 border-aicc-blue bg-aicc-blue/[0.05] p-4 text-sm leading-6 text-slate">
            <p className="font-semibold text-aicc-deep">
              Your answers will compare four choices.
            </p>
            <ul className="mt-2 space-y-1">
              <li>Fixed-rule software follows written rules.</li>
              <li>AI assistance prepares work for a person.</li>
              <li>
                A limited agent simulation completes several offline steps
                within strict limits.
              </li>
              <li>No AI yet means the process needs safer conditions first.</li>
            </ul>
          </div>
          <div className="mt-7 space-y-5">
            <label className="block">
              <span className="eyebrow text-slate">Process name</span>
              <input
                className="field mt-2"
                value={processInput.name}
                maxLength={80}
                aria-describedby="process-name-help"
                aria-invalid={Boolean(
                  processInput.name && processInput.name.trim().length < 3,
                )}
                placeholder="Reviewing time-off requests"
                onChange={(event) =>
                  setProcessInput((current) => ({
                    ...current,
                    name: event.target.value,
                  }))
                }
              />
              <span
                id="process-name-help"
                className="mt-1 block text-xs text-cool-gray"
              >
                Required · 3–80 characters · {processInput.name.length}/80
              </span>
            </label>
            <label className="block">
              <span className="eyebrow text-slate">
                What result must improve?
              </span>
              <textarea
                className="field mt-2 min-h-28"
                value={processInput.outcome}
                maxLength={300}
                aria-describedby="process-outcome-help"
                aria-invalid={Boolean(
                  processInput.outcome &&
                  processInput.outcome.trim().length < 10,
                )}
                placeholder="Cut review time from three days to one without removing manager approval."
                onChange={(event) =>
                  setProcessInput((current) => ({
                    ...current,
                    outcome: event.target.value,
                  }))
                }
              />
              <span
                id="process-outcome-help"
                className="mt-1 block text-xs leading-5 text-cool-gray"
              >
                Required · Include today’s result and the target, if known ·{" "}
                {processInput.outcome.length}/300
              </span>
            </label>
            <label className="block">
              <span className="eyebrow text-slate">
                Business function (optional)
              </span>
              <select
                className="field mt-2"
                value={processInput.businessFunction ?? ""}
                onChange={(event) =>
                  setProcessInput((current) => ({
                    ...current,
                    businessFunction: (event.target.value ||
                      null) as ProcessInput["businessFunction"],
                  }))
                }
              >
                <option value="">Select a function</option>
                {businessFunctions.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
          {nav("safety", "shape", processValid)}
        </section>
      )}

      {step === "shape" && (
        <SignalScreen
          eyebrow="How the process runs"
          title="How much work is there, and how consistent is it?"
          groups={[
            {
              label: "How often does new work enter this process?",
              description:
                "For example, each time a request, invoice, order, or incident arrives.",
              options: chipOptions.frequency,
              value: signals.frequency,
              choose: (v) => single("frequency", v as Signals["frequency"]),
            },
            {
              label: "How much staff effort does this process use each month?",
              description:
                "Add the time spent across everyone involved. A rough estimate is enough.",
              options: chipOptions.monthlyEffort,
              value: signals.monthlyEffort,
              choose: (v) =>
                single("monthlyEffort", v as Signals["monthlyEffort"]),
            },
            {
              label:
                "About how many items does the process handle in a typical month?",
              description:
                "An item could be one request, invoice, order, application, or incident. A rough estimate is enough.",
              options: chipOptions.volume,
              value: signals.volume,
              choose: (v) => single("volume", v as Signals["volume"]),
            },
            {
              label: "How often do the same rules work?",
              description:
                "Choose whether most items follow the same rules or need separate judgment.",
              options: chipOptions.variation,
              value: signals.variation,
              choose: (v) => single("variation", v as Signals["variation"]),
            },
            {
              label: "What share of cases requires a person to use judgment?",
              description:
                "Count cases where written rules do not settle the answer.",
              options: chipOptions.judgmentShare,
              value: signals.judgmentShare,
              choose: (v) =>
                single("judgmentShare", v as Signals["judgmentShare"]),
            },
          ]}
        >
          {nav(
            "process",
            "action",
            Boolean(
              signals.frequency &&
              signals.volume &&
              signals.monthlyEffort &&
              signals.variation &&
              signals.judgmentShare,
            ),
          )}
        </SignalScreen>
      )}

      {step === "action" && (
        <SignalScreen
          eyebrow="What the system may do"
          title="What could software do in a small test?"
          groups={[
            {
              label: "During a small test, what is the most software could do?",
              description:
                "Choose one. The result may recommend less authority.",
              options: chipOptions.furthestStep,
              value: signals.furthestStep,
              choose: (v) =>
                single("furthestStep", v as Signals["furthestStep"]),
            },
            {
              label:
                "How many apps or databases does a person use to complete one item?",
              description: "Count systems they read from or update.",
              options: chipOptions.systemsTouched,
              value: signals.systemsTouched,
              choose: (v) =>
                single("systemsTouched", v as Signals["systemsTouched"]),
            },
            {
              label: "Do people usually follow the same steps?",
              description:
                "Think about whether an answer or exception changes what they do next.",
              options: chipOptions.pathVariability,
              value: signals.pathVariability,
              choose: (v) =>
                single("pathVariability", v as Signals["pathVariability"]),
            },
          ]}
        >
          {nav(
            "shape",
            "touch",
            Boolean(
              signals.furthestStep &&
              signals.systemsTouched &&
              signals.pathVariability,
            ),
          )}
        </SignalScreen>
      )}

      {step === "touch" && (
        <SignalScreen
          eyebrow="Information and consequences"
          title="What information does the work use, and what could one mistake cause?"
          groups={[
            {
              label: "What kind of information does the process use?",
              description:
                "Select all that apply. Do not enter an example or any real information.",
              options: chipOptions.dataClasses,
              value: signals.dataClasses ?? [],
              choose: (v) =>
                multi("dataClasses", v as Signals["dataClasses"][number]),
              multiple: true,
            },
            {
              label: "Where does that information come from?",
              description: "Select all sources the process reads.",
              options: chipOptions.inputSources,
              value: signals.inputSources ?? [],
              choose: (v) =>
                multi("inputSources", v as Signals["inputSources"][number]),
              multiple: true,
            },
            {
              label: "What is the largest consequence of one wrong result?",
              description:
                "Choose the most serious likely result of one mistake.",
              options: chipOptions.blastRadius,
              value: signals.blastRadius,
              choose: (v) => single("blastRadius", v as Signals["blastRadius"]),
            },
          ]}
        >
          {nav(
            "action",
            "wrong",
            Boolean(
              signals.dataClasses?.length &&
              signals.inputSources?.length &&
              signals.blastRadius,
            ),
          )}
        </SignalScreen>
      )}

      {step === "wrong" && (
        <SignalScreen
          eyebrow="When something is wrong"
          title="How would the team find and correct a mistake?"
          groups={[
            {
              label: "Can a wrong result be undone?",
              description:
                "Could someone correct every record, payment, message, or decision affected?",
              options: chipOptions.reversibility,
              value: signals.reversibility,
              choose: (v) =>
                single("reversibility", v as Signals["reversibility"]),
            },
            {
              label: "How is a mistake usually discovered?",
              description:
                "Choose the first reliable way anyone would discover it.",
              options: chipOptions.detectability,
              value: signals.detectability,
              choose: (v) =>
                single("detectability", v as Signals["detectability"]),
            },
            {
              label:
                "Does a policy, law, or accountable role require a person to make the final decision?",
              description:
                "Choose Yes when a policy, law, or accountable role requires a person to decide.",
              options: chipOptions.humanRequired,
              value: signals.humanRequired,
              choose: (v) =>
                single("humanRequired", v as Signals["humanRequired"]),
            },
          ]}
        >
          {nav(
            "touch",
            "judgment1",
            Boolean(
              signals.reversibility &&
              signals.detectability &&
              signals.humanRequired,
            ),
          )}
        </SignalScreen>
      )}

      {(step === "judgment1" || step === "judgment2") && (
        <section className="mt-8">
          <p className="font-mono text-xs font-medium uppercase tracking-[0.08em] text-aicc-blue">
            Short answer {step === "judgment1" ? 1 : 2} of 2
          </p>
          <h1
            data-step-heading
            tabIndex={-1}
            className="mt-5 text-2xl font-normal leading-9 text-aicc-deep sm:text-3xl"
          >
            {step === "judgment1"
              ? questions[0].question
              : "Name the owner, approver, and stop rule."}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-cool-gray">
            {step === "judgment1"
              ? questions[0].help
              : "Use job roles, not names. The stop rule must be something the team can observe, preferably with a number."}
          </p>
          {step === "judgment1" ? (
            <label className="mt-7 block">
              <span className="eyebrow text-slate">Your answer</span>
              <textarea
                className="field mt-2 min-h-40"
                maxLength={1000}
                value={answer}
                placeholder={questions[0].placeholder}
                onChange={(event) => setAnswer(event.target.value)}
              />
              <span className="mt-1 block text-right font-mono text-xs text-cool-gray">
                {answer.length}/1,000 · minimum 8
              </span>
            </label>
          ) : (
            <div className="mt-7 space-y-5">
              <label className="block">
                <span className="eyebrow text-slate">Who owns this test?</span>
                <span className="mt-1 block text-xs text-cool-gray">
                  Enter a job role, not a name · minimum 3 characters.
                </span>
                <input
                  className="field mt-2"
                  maxLength={80}
                  value={governance.ownerRole ?? ""}
                  placeholder="Operations manager"
                  onChange={(event) =>
                    setGovernance((current) => ({
                      ...current,
                      ownerRole: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="eyebrow text-slate">
                  Who approves each result before it is used?
                </span>
                <span className="mt-1 block text-xs text-cool-gray">
                  The owner and approver may be the same role · minimum 3
                  characters.
                </span>
                <input
                  className="field mt-2"
                  maxLength={80}
                  value={governance.approverRole ?? ""}
                  placeholder="Department manager"
                  onChange={(event) =>
                    setGovernance((current) => ({
                      ...current,
                      approverRole: event.target.value,
                    }))
                  }
                />
              </label>
              <label className="block">
                <span className="eyebrow text-slate">Stop the test if…</span>
                <span className="mt-1 block text-xs leading-5 text-cool-gray">
                  Use something observable, preferably with a number · minimum
                  20 characters.
                </span>
                <textarea
                  className="field mt-2 min-h-28"
                  maxLength={300}
                  value={governance.stopRule ?? ""}
                  placeholder="The process owner will stop the test if 2 of 20 results are wrong. Work returns to the current process."
                  onChange={(event) =>
                    setGovernance((current) => ({
                      ...current,
                      stopRule: event.target.value,
                    }))
                  }
                />
              </label>
            </div>
          )}
          {error && (
            <ErrorNotice
              message={error}
              onRetry={() => void completeInterview()}
            />
          )}
          <div className="mt-6 flex items-center justify-between gap-3">
            <Button
              variant="ghost"
              onClick={() => {
                if (step === "judgment1") setStep("wrong");
                else {
                  setStep("judgment1");
                  setAnswer(turns[0]?.answer ?? "");
                  setTurns([]);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <Button
              variant="accent"
              disabled={
                loading ||
                (step === "judgment1"
                  ? answer.trim().length < 8
                  : !governanceValid)
              }
              onClick={() => {
                if (step === "judgment1") {
                  setTurns([
                    { question: questions[0].question, answer: answer.trim() },
                  ]);
                  setAnswer("");
                  setStep("judgment2");
                } else void completeInterview();
              }}
            >
              {loading
                ? "Preparing your result…"
                : step === "judgment1"
                  ? "Next question"
                  : "Evaluate my process"}{" "}
              {!loading && <ArrowRight className="h-4 w-4" />}
            </Button>
          </div>
          {loading && (
            <div
              className="mt-4 border border-fog bg-white p-4 text-center text-sm text-cool-gray"
              role="status"
            >
              <p className="font-medium text-aicc-deep">
                {loadingSeconds < 5
                  ? "Checking your answers…"
                  : loadingSeconds < 15
                    ? "Writing your plan…"
                    : "Still working. Your answers are saved in this tab."}
              </p>
              <p className="mt-1 text-xs">This can take about 25 seconds.</p>
            </div>
          )}
        </section>
      )}

      {step === "reveal" && canvas && (
        <section className="mt-10" aria-live="polite">
          <p className="eyebrow">How your answers led to this result</p>
          <h1
            data-step-heading
            tabIndex={-1}
            className="section-title mt-3 text-3xl"
          >
            Why this option fits your process
          </h1>
          <div className="card mt-7 p-5 sm:p-7">
            <div className="border-l-4 border-aicc-blue bg-aicc-blue/[0.05] p-4">
              <p className="eyebrow">Answers that set the result</p>
              <ul className="mt-2 space-y-2 text-sm font-semibold leading-6 text-aicc-deep">
                {canvas.rubric.triggers.map((trigger) => (
                  <li key={trigger}>{trigger}</li>
                ))}
              </ul>
            </div>
            <p className="eyebrow mb-4 mt-6">
              Other answers that shaped the plan
            </p>
            <div className="space-y-4 font-mono text-sm">
              {canvas.rubric.trace.slice(0, visibleTrace).map((item) => (
                <div
                  className="grid grid-cols-[1fr_auto] gap-4 border-b border-fog pb-3"
                  key={item.id}
                >
                  <span>
                    {item.label}
                    <span className="mt-1 block font-sans text-xs text-cool-gray">
                      {optionLabels[item.detail] ?? item.detail}
                    </span>
                  </span>
                  <span className="font-sans text-xs font-semibold text-aicc-blue">
                    {item.detail.startsWith("Yes")
                      ? "Yes"
                      : item.detail.startsWith("No")
                        ? "No"
                        : "Review"}
                  </span>
                </div>
              ))}
            </div>
            {visibleTrace > canvas.rubric.trace.length && (
              <div className="mt-7 border-l-4 border-aicc-blue pl-4">
                <p className="eyebrow">Best fit for this workshop exercise</p>
                <p className="mt-2 text-2xl font-semibold text-aicc-deep">
                  {recommendationLabel[canvas.recommendation]}
                </p>
                <p className="mt-2 text-sm leading-6 text-cool-gray">
                  {canvas.rubric.triggers.join(" ")}
                </p>
              </div>
            )}
          </div>
          {visibleTrace <= canvas.rubric.trace.length ? (
            <Button
              className="mt-5"
              variant="secondary"
              onClick={() => setVisibleTrace(canvas.rubric.trace.length + 1)}
            >
              Show all now
            </Button>
          ) : (
            <div className="mt-7 flex justify-end">
              <Button
                variant="accent"
                onClick={() => {
                  window.sessionStorage.removeItem(sessionKeys.lab);
                  router.push("/canvas");
                }}
              >
                Open my plan <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </section>
      )}
    </main>
  );
}

type Group = {
  label: string;
  description?: string;
  options: readonly string[];
  value: string | readonly string[] | undefined;
  choose: (value: string) => void;
  multiple?: boolean;
};
function SignalScreen({
  eyebrow,
  title,
  groups,
  children,
}: {
  eyebrow: string;
  title: string;
  groups: Group[];
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <p className="eyebrow">{eyebrow}</p>
      <h1
        data-step-heading
        tabIndex={-1}
        className="section-title mt-3 text-3xl sm:text-4xl"
      >
        {title}
      </h1>
      <div className="mt-7 space-y-7">
        {groups.map((group) => (
          <fieldset key={group.label}>
            <legend className="mb-3 text-sm font-semibold text-aicc-deep">
              {group.label}
            </legend>
            {group.description ? (
              <p className="-mt-1 mb-3 text-xs leading-5 text-cool-gray">
                {group.description}
              </p>
            ) : null}
            <div className="grid gap-2 sm:grid-cols-2">
              {group.options.map((option) => {
                const selected = Array.isArray(group.value)
                  ? group.value.includes(option)
                  : group.value === option;
                return (
                  <button
                    type="button"
                    aria-pressed={selected}
                    className={`flex min-h-12 items-center justify-between border px-4 py-3 text-left text-sm font-medium transition-colors ${selected ? "border-aicc-blue bg-aicc-blue text-white" : "border-fog bg-white text-aicc-deep hover:border-aicc-blue"}`}
                    key={option}
                    onClick={() => group.choose(option)}
                  >
                    <span>{optionLabels[option] ?? option}</span>
                    {selected && <Check className="h-4 w-4 shrink-0" />}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      {children}
    </section>
  );
}

function ErrorNotice({
  message,
  onRetry,
}: {
  message: string;
  onRetry: () => void;
}) {
  return (
    <div
      className="mt-5 flex gap-3 border border-error/25 bg-red-50 p-4 text-sm text-error"
      role="alert"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
      <div>
        <p className="font-semibold">We could not finish the plan.</p>
        <p className="mt-1 leading-5">{message}</p>
        <Button className="mt-3" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      </div>
    </div>
  );
}
