"use client";

import { useState } from "react";
import { ArrowLeft, MonitorPlay, ShieldAlert } from "lucide-react";
import { Button } from "@/components/button";
import { CanvasView, RecommendationBadge } from "@/components/canvas-view";
import { demoCanvases } from "@/lib/demo-data";

export function DemoGallery() {
  const [selectedId, setSelectedId] = useState(demoCanvases[3].id);
  const selected =
    demoCanvases.find((item) => item.id === selectedId) ?? demoCanvases[0];

  return (
    <main className="mx-auto min-h-[calc(100vh-8rem)] max-w-7xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="flex flex-col gap-5 border-b border-fog pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow">Always available</p>
          <h1 className="section-title mt-2 text-3xl sm:text-4xl">
            Prepared examples
          </h1>
          <p className="mt-3 text-sm text-cool-gray">
            Use these examples if participant sharing is unavailable or while
            the room is getting started.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button href="/facilitator" variant="secondary">
            <ArrowLeft className="h-4 w-4" /> Live dashboard
          </Button>
          <Button href="/facilitator/injection" variant="accent">
            <ShieldAlert className="h-4 w-4" /> Document attack demo
          </Button>
          <Button href="/takeaway" variant="secondary">
            Takeaway
          </Button>
        </div>
      </div>

      <div className="mt-7 grid gap-7 lg:grid-cols-[360px_1fr]">
        <aside className="space-y-2">
          {demoCanvases.map((canvas) => (
            <button
              className={`w-full border bg-white p-4 text-left ${selectedId === canvas.id ? "border-aicc-blue" : "border-fog hover:border-cool-gray"}`}
              key={canvas.id}
              aria-pressed={selectedId === canvas.id}
              onClick={() => setSelectedId(canvas.id)}
            >
              <h2 className="font-semibold text-aicc-deep">
                {canvas.process.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-sm leading-5 text-cool-gray">
                {canvas.process.outcome}
              </p>
              <div className="mt-3">
                <RecommendationBadge recommendation={canvas.recommendation} />
              </div>
            </button>
          ))}
          <div className="mt-5 flex gap-3 border border-info/20 bg-info/5 p-4 text-sm leading-5 text-info">
            <MonitorPlay className="h-5 w-5 shrink-0" />
            <p>
              These examples are stored in the app and require no model or
              sharing service.
            </p>
          </div>
        </aside>
        <section>
          <div className="mb-4">
            <p className="eyebrow">Example canvas</p>
            <h2 className="mt-1 text-xl font-semibold text-aicc-deep">
              {selected.process.name}
            </h2>
          </div>
          <CanvasView canvas={selected} summaryOnly />
          <details className="mt-5 card p-5">
            <summary className="cursor-pointer font-semibold text-aicc-blue">
              See full prepared plan
            </summary>
            <div className="mt-5">
              <CanvasView canvas={selected} />
            </div>
          </details>
        </section>
      </div>
    </main>
  );
}
