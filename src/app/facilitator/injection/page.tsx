import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { InjectionDemo } from "@/components/injection-demo";

export const metadata: Metadata = { title: "Poisoned Document Demo" };
export default function InjectionPage() {
  return (
    <AppShell facilitator>
      <InjectionDemo />
    </AppShell>
  );
}
