import { ArrowRight, CheckCircle2, Clock3 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/button";

const workshopSteps = [
  [
    "01",
    "Choose one process and target",
    "Use a process you know. State today’s result and what should improve.",
  ],
  [
    "02",
    "Compare four ways to improve it",
    "Your answers test whether fixed rules, AI assistance, a limited simulation, or no AI fits best.",
  ],
  [
    "03",
    "Set the human boundary",
    "Name the owner, approver, allowed work, and an observable rule that stops the test.",
  ],
  [
    "04",
    "Take away a decision record",
    "Keep the recommendation, decisive reasons, small test, stop rule, and return path.",
  ],
];

export default function Home() {
  return (
    <AppShell>
      <main>
        <section className="hex-grid text-white">
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_.9fr] lg:py-24">
            <div>
              <div className="mb-6 flex items-center gap-3">
                <span className="h-px w-10 bg-aicc-sky" />
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-white/65">
                  AICC 2026 workshop
                </span>
              </div>
              <h1 className="max-w-4xl text-4xl font-normal leading-[1.08] tracking-[-0.035em] sm:text-5xl lg:text-6xl">
                Enterprise Agent
                <br />
                Design Lab
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80 sm:text-xl">
                Decide how one business process should be improved.
              </p>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">
                Compare fixed-rule automation, AI assistance, a limited agent
                simulation, and no AI. Leave with a decision record that names
                the target, owner, allowed work, stop rule, and return path.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Button href="/lab" variant="accent" className="sm:min-w-44">
                  Build my decision record <ArrowRight className="h-4 w-4" />
                </Button>
                <span className="flex items-center gap-2 text-sm text-white/65">
                  <Clock3 className="h-4 w-4" /> About 10 minutes
                </span>
              </div>
            </div>

            <div className="border border-white/15 bg-white/[0.06] p-6 backdrop-blur-sm sm:p-8">
              <h2 className="text-lg font-semibold">What you will do</h2>
              <div className="mt-6 space-y-5">
                {workshopSteps.map(([number, title, description]) => (
                  <div
                    key={number}
                    className="grid grid-cols-[2.5rem_1fr] gap-3 border-t border-white/10 pt-4 first:border-0 first:pt-0"
                  >
                    <span className="font-mono text-xs text-aicc-sky">
                      {number}
                    </span>
                    <div>
                      <h3 className="font-medium">{title}</h3>
                      <p className="mt-1 text-sm leading-5 text-white/60">
                        {description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:py-20">
          <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:gap-16">
            <div>
              <p className="eyebrow">What you receive</p>
              <h2 className="section-title mt-3">
                A decision you can explain and a test someone can stop.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="card p-5">
                <CheckCircle2 className="mb-6 h-5 w-5 text-success" />
                <h3 className="font-semibold text-aicc-deep">
                  One of four clear choices
                </h3>
                <p className="mt-2 text-sm leading-6 text-cool-gray">
                  Fixed-rule automation, AI prepares while a person decides, a
                  limited offline simulation, or no AI yet.
                </p>
              </div>
              <div className="card p-5">
                <CheckCircle2 className="mb-6 h-5 w-5 text-success" />
                <h3 className="font-semibold text-aicc-deep">
                  A test someone can stop
                </h3>
                <p className="mt-2 text-sm leading-6 text-cool-gray">
                  The plan states what is allowed, who reviews the work, what to
                  measure, when to stop, and how to return to the current
                  process.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </AppShell>
  );
}
