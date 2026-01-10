import { Suspense } from "react";
import ReviewClient from "./ReviewClient";

export const dynamic = "force-dynamic";

export default function ReviewPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12">Loading review...</div>}>
      <ReviewClient />
    </Suspense>
  );
}
