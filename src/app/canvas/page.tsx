import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { ParticipantCanvas } from "@/components/participant-canvas";

export const metadata: Metadata = { title: "Agent Experiment Canvas" };

export default function CanvasPage() {
  return (
    <AppShell>
      <ParticipantCanvas />
    </AppShell>
  );
}
