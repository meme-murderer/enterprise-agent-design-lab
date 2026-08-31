import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { FacilitatorDashboard } from "@/components/facilitator-dashboard";

export const metadata: Metadata = { title: "Facilitator dashboard" };

export default function FacilitatorPage() {
  return (
    <AppShell facilitator>
      <FacilitatorDashboard />
    </AppShell>
  );
}
