import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { DemoGallery } from "@/components/demo-gallery";

export const metadata: Metadata = { title: "Prepared examples" };

export default function DemoPage() {
  return (
    <AppShell facilitator>
      <DemoGallery />
    </AppShell>
  );
}
