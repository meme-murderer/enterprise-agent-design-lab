import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { LabExperience } from "@/components/lab-experience";

export const metadata: Metadata = { title: "Participant lab" };

export default function LabPage() {
  return (
    <AppShell>
      <LabExperience />
    </AppShell>
  );
}
