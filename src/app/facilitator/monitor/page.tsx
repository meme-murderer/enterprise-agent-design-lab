import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { UsageMonitor } from "@/components/usage-monitor";

export const metadata: Metadata = { title: "Live model usage" };

export default function FacilitatorMonitorPage() {
  return (
    <AppShell facilitator>
      <UsageMonitor />
    </AppShell>
  );
}
