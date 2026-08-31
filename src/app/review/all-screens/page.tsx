import type { Metadata } from "next";
import { AllScreensReview } from "@/components/all-screens-review";

export const metadata: Metadata = {
  title: "All Screens Review",
  robots: { index: false, follow: false },
};

export default function AllScreensReviewPage() {
  return <AllScreensReview />;
}
