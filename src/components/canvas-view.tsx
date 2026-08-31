import {
  Activity,
  CircleStop,
  Eye,
  RotateCcw,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { isCanvasV2, type Canvas, type Recommendation } from "@/lib/schemas";
import {
  planTypeLabel,
  recommendationLabel,
} from "@/lib/recommendation-language";

const recommendationStyles: Record<Recommendation, string> = {
  "Conventional Automation": "border-info/25 bg-info/10 text-info",
  "AI Assistance": "border-success/25 bg-success/10 text-success",
  "Bounded Agentic Pilot": "border-warning/25 bg-amber-50 text-warning",
  "No AI at This Time": "border-error/25 bg-red-50 text-error",
};

export function RecommendationBadge({
  recommendation,
}: {
  recommendation: Recommendation;
}) {
  return (
    <span
      className={`inline-flex border px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${recommendationStyles[recommendation]}`}
    >
      {recommendationLabel[recommendation]}
    </span>
  );
}

export function CanvasView({
  canvas,
  compact = false,
  summaryOnly = false,
  showStressTests = true,
}: {
  canvas: Canvas;
  compact?: boolean;
  summaryOnly?: boolean;
  showStressTests?: boolean;
}) {
  if (summaryOnly) {
    return (
      <div className="space-y-4">
        <section className="card lead-card p-5 sm:p-7">
          <p className="eyebrow">Best fit for this workshop exercise</p>
          <div className="mt-3">
            <RecommendationBadge recommendation={canvas.recommendation} />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-aicc-deep">
            {canvas.recommendationSummary}
          </h2>
          <p className="mt-3 text-xs font-semibold uppercase tracking-[0.08em] text-cool-gray">
            {planTypeLabel[canvas.recommendation]}
          </p>
          <List
            title="Why"
            items={canvas.whyThisFit.slice(0, 2)}
            className="mt-5"
          />
        </section>
        <section className="grid gap-px border border-fog bg-fog sm:grid-cols-2">
          <div className="bg-white p-5">
            <p className="eyebrow">Owner and approval</p>
            <p className="mt-3 font-semibold text-aicc-deep">
              {canvas.humanOversight.ownerRole}
            </p>
            <p className="mt-2 text-sm leading-6 text-slate">
              {canvas.humanOversight.approvals[0]}
            </p>
          </div>
          <div className="bg-white p-5">
            <List
              title="Software may"
              items={canvas.experiment.scopeIn.slice(0, 2)}
            />
            <List
              title="Software may not"
              items={canvas.experiment.scopeOut.slice(0, 2)}
              className="mt-5"
            />
          </div>
          <div className="bg-white p-5">
            <List
              title="Stop rule"
              items={canvas.controls.stopConditions.slice(0, 1)}
            />
          </div>
          <div className="bg-white p-5">
            <p className="eyebrow">Return to the current process</p>
            <p className="mt-3 text-sm leading-6 text-slate">
              {canvas.controls.rollbackPlan}
            </p>
          </div>
        </section>
        <section className="bg-aicc-deep p-6 text-white">
          <p className="text-xs font-semibold uppercase tracking-[0.1em] text-aicc-sky">
            First preparation task
          </p>
          <p className="mt-3 text-base font-medium leading-7">
            {canvas.nextStep}
          </p>
        </section>
      </div>
    );
  }
  return (
    <div className={compact ? "space-y-4" : "space-y-6"}>
      <section className="card lead-card p-5 sm:p-7">
        <RecommendationBadge recommendation={canvas.recommendation} />
        <h2 className="mt-5 text-xl font-semibold tracking-tight text-aicc-deep sm:text-2xl">
          {canvas.recommendationSummary}
        </h2>
        <ul className="mt-5 grid gap-2 text-sm leading-6 text-slate sm:grid-cols-2">
          {canvas.whyThisFit.map((item) => (
            <li className="flex gap-2" key={item}>
              <span className="mt-2 h-1.5 w-1.5 shrink-0 bg-aicc-blue" />
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="card p-5 sm:p-7">
        <div className="flex items-start gap-3">
          <Activity className="mt-0.5 h-5 w-5 text-aicc-blue" />
          <div>
            <p className="eyebrow">{planTypeLabel[canvas.recommendation]}</p>
            <h2 className="mt-2 text-xl font-semibold text-aicc-deep">
              {canvas.experiment.title}
            </h2>
            <p className="mt-1 font-mono text-xs uppercase tracking-[0.06em] text-cool-gray">
              {canvas.experiment.duration}
            </p>
          </div>
        </div>
        <p className="mt-5 border-l-2 border-aicc-blue pl-4 text-sm font-medium leading-6 text-aicc-deep">
          {canvas.experiment.autonomyBoundary}
        </p>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <List
            title="Included in the test"
            items={canvas.experiment.scopeIn}
          />
          <List title="Not allowed" items={canvas.experiment.scopeOut} />
          <List title="Information used" items={canvas.experiment.inputs} />
          <List title="What it produces" items={canvas.experiment.outputs} />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="card p-5 sm:p-6">
          <UserCheck className="h-5 w-5 text-aicc-blue" />
          <p className="eyebrow mt-4">Who checks the work</p>
          <h2 className="mt-2 font-semibold text-aicc-deep">
            {canvas.humanOversight.ownerRole}
          </h2>
          <p className="mt-2 text-sm text-cool-gray">
            {canvas.humanOversight.reviewCadence}
          </p>
          <List
            title="A person must approve"
            items={canvas.humanOversight.approvals}
            className="mt-5"
          />
        </section>
        <section className="card p-5 sm:p-6">
          <Eye className="h-5 w-5 text-aicc-blue" />
          <p className="eyebrow mt-4">What to watch</p>
          <List
            title="Check each time"
            items={canvas.controls.monitoring}
            className="mt-4"
          />
        </section>
      </div>

      {isCanvasV2(canvas) && (
        <section className="card p-5 sm:p-7">
          <ShieldCheck className="h-5 w-5 text-aicc-blue" />
          <p className="eyebrow mt-4">Rules for this test</p>
          <h2 className="mt-2 text-xl font-semibold text-aicc-deep">
            Put these rules in place before the test starts
          </h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {canvas.controls.requiredControls.map((control) => (
              <div className="border border-fog p-4" key={control.id}>
                <h3 className="text-sm font-semibold leading-5 text-aicc-deep">
                  {control.label}
                </h3>
                <p className="mt-2 text-xs leading-5 text-cool-gray">
                  {control.reason}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="grid gap-px overflow-hidden border border-fog bg-fog sm:grid-cols-2">
        <div className="bg-white p-5 sm:p-6">
          <CircleStop className="h-5 w-5 text-error" />
          <List
            title="Stop the test when"
            items={canvas.controls.stopConditions}
            className="mt-4"
          />
        </div>
        <div className="bg-white p-5 sm:p-6">
          <RotateCcw className="h-5 w-5 text-info" />
          <p className="eyebrow mt-4">If the test stops</p>
          <p className="mt-3 text-sm leading-6 text-slate">
            {canvas.controls.rollbackPlan}
          </p>
        </div>
      </section>

      {!compact && (
        <>
          <section className="card p-5 sm:p-7">
            <ShieldCheck className="h-5 w-5 text-aicc-blue" />
            <div className="mt-5 grid gap-7 sm:grid-cols-2">
              <List
                title="Information allowed"
                items={canvas.controls.dataBoundaries}
              />
              <div>
                <p className="eyebrow text-slate">How to judge the test</p>
                <div className="mt-3 space-y-3">
                  {canvas.successMeasures.map((measure) => (
                    <div
                      className="border-l-2 border-fog pl-3"
                      key={measure.metric}
                    >
                      <p className="text-sm font-medium text-aicc-deep">
                        {measure.metric}
                      </p>
                      <p className="mt-1 font-mono text-xs text-cool-gray">
                        {measure.target}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          <section className="card p-5 sm:p-7">
            <p className="eyebrow">What could go wrong</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {canvas.risks.map((item) => (
                <div className="border border-fog p-4" key={item.risk}>
                  <h3 className="text-sm font-semibold text-aicc-deep">
                    {item.risk}
                  </h3>
                  <p className="mt-2 text-sm leading-5 text-cool-gray">
                    {item.mitigation}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {showStressTests && canvas.stressTests?.length ? (
            <section className="card border-t-[3px] border-t-aicc-blue p-5 sm:p-7">
              <p className="eyebrow">Possible failures</p>
              <div className="mt-4 space-y-4">
                {canvas.stressTests.map((test, index) => (
                  <div
                    className="grid gap-2 border-t border-fog pt-4 first:border-0 first:pt-0 sm:grid-cols-[2rem_1fr]"
                    key={test.scenario}
                  >
                    <span className="font-mono text-xs text-aicc-blue">
                      0{index + 1}
                    </span>
                    <div>
                      <h3 className="font-semibold text-aicc-deep">
                        {test.scenario}
                      </h3>
                      <p className="mt-1 text-sm leading-5 text-slate">
                        <strong>Response:</strong> {test.expectedResponse}
                      </p>
                      <p className="mt-1 text-sm leading-5 text-cool-gray">
                        <strong>Warning sign:</strong> {test.signal}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          {isCanvasV2(canvas) && canvas.preMortem ? (
            <section className="card border-t-[3px] border-t-success p-5 sm:p-7">
              <p className="eyebrow">Rule you added</p>
              <p className="mt-4 text-sm font-medium leading-6 text-aicc-deep">
                {canvas.preMortem.revision}
              </p>
              <p className="mt-3 border-l-2 border-aicc-sky pl-4 text-sm leading-6 text-slate">
                {canvas.preMortem.coachResponse}
              </p>
            </section>
          ) : null}

          <section className="bg-aicc-deep p-6 text-white sm:p-8">
            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-aicc-sky">
              Do this first
            </p>
            <p className="mt-3 text-lg font-medium leading-7">
              {canvas.nextStep}
            </p>
            <p className="mt-5 text-xs leading-5 text-white/65">
              Recheck this recommendation if the workload, decision rights,
              ability to find mistakes, or ability to correct results changes.
            </p>
          </section>
        </>
      )}
    </div>
  );
}

function List({
  title,
  items,
  className = "",
}: {
  title: string;
  items: string[];
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="eyebrow text-slate">{title}</p>
      <ul className="mt-3 space-y-2 text-sm leading-5 text-slate">
        {items.map((item) => (
          <li className="flex gap-2" key={item}>
            <span className="mt-2 h-1 w-1 shrink-0 bg-cool-gray" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
