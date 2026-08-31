import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { PrintButton } from "@/components/print-button";

export const metadata: Metadata = { title: "Choosing What Should Do the Work" };

const decisions = [
  [
    "1",
    "Can written rules handle almost every item?",
    "Fixed-rule automation: software follows the written rules. A person handles exceptions.",
  ],
  [
    "2",
    "Would mistakes remain hidden and be difficult to correct?",
    "Do not test AI yet. Improve the process, information, ownership, or review before reconsidering it.",
  ],
  [
    "3",
    "Must a person make the final decision?",
    "AI prepares; a person decides. The system drafts, summarizes, or flags. A person makes the decision.",
  ],
  [
    "4",
    "Can mistakes be found promptly and every result be corrected?",
    "Limited agent simulation: consider an offline multi-step test only when both answers are yes and a person can stop it.",
  ],
];

const basicSafeguards = [
  "Name one person who owns the test.",
  "Use test cases with known answers.",
  "Have a person review results before they affect anyone.",
  "Write a stop rule with a number someone can check.",
  "Test how work returns to the current process.",
];

const actionSafeguards = [
  "Give the test its own account; never use an employee's login.",
  "Allow only the data and actions needed for the test.",
  "List the actions it may take. Require approval for anything else.",
  "Limit the number and cost of actions.",
  "Name the person who can stop it immediately.",
];

export default function TakeawayPage() {
  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <header className="border-b border-fog pb-8">
          <p className="eyebrow">AICC 2026 workshop handout</p>
          <h1 className="section-title mt-3 text-4xl">
            Who or what should do the work?
          </h1>
          <p className="mt-4 max-w-3xl leading-7 text-cool-gray">
            Use these questions in order. Stop at the first answer that applies.
            Be ready to name the answer that changed your choice.
          </p>
        </header>

        <section className="mt-9" aria-labelledby="decision-title">
          <h2
            id="decision-title"
            className="text-2xl font-semibold text-aicc-deep"
          >
            Choose the least autonomous option that can do the work
          </h2>
          <div className="mt-4 space-y-3">
            {decisions.map(([number, question, answer]) => (
              <div
                className="card grid gap-3 p-5 sm:grid-cols-[2rem_1fr_1fr]"
                key={number}
              >
                <span className="font-mono text-aicc-blue">{number}</span>
                <h3 className="font-semibold leading-6 text-aicc-deep">
                  {question}
                </h3>
                <p className="text-sm leading-6 text-cool-gray">{answer}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-10 grid gap-6 lg:grid-cols-2">
          <div className="card p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-aicc-deep">
              Rules for every AI test
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate">
              {basicSafeguards.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span className="font-mono text-aicc-blue">□</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card p-5 sm:p-6">
            <h2 className="text-xl font-semibold text-aicc-deep">
              Extra rules if the system may take actions
            </h2>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate">
              {actionSafeguards.map((item) => (
                <li className="flex gap-3" key={item}>
                  <span className="font-mono text-aicc-blue">□</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="mt-5 border-l-2 border-warning pl-3 text-sm leading-6 text-slate">
              If it reads documents, messages, or websites, treat that text as
              content. It cannot change the system&apos;s rules or grant
              permission.
            </p>
          </div>
        </section>

        <section className="mt-10 bg-aicc-deep p-6 text-white sm:p-8">
          <h2 className="text-xl font-semibold">
            Write the stop rule before the test
          </h2>
          <p className="mt-4 max-w-4xl text-lg leading-8">
            Finish this sentence:{" "}
            <strong className="text-aicc-sky">We will stop the test if…</strong>
          </p>
          <p className="mt-3 max-w-4xl leading-7 text-white/75">
            Use a number someone can check. Example: “Stop if 2 of 20 test cases
            are routed incorrectly.” Then name who stops it and how the work
            returns to the current process.
          </p>
        </section>
        <div className="print-hidden mt-8">
          <PrintButton />
        </div>
      </main>
    </AppShell>
  );
}
