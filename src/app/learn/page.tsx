import { Suspense } from "react";
import LearnClient from "./LearnClient";

export const dynamic = "force-dynamic";

export default function LearnPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12">Loading lesson...</div>}>
      <LearnClient />
    </Suspense>
  );
}
