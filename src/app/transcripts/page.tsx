import { Suspense } from "react";
import TranscriptsClient from "./TranscriptsClient";

export const dynamic = "force-dynamic";

export default function TranscriptsPage() {
  return (
    <Suspense fallback={<div className="px-4 py-12">Loading transcripts...</div>}>
      <TranscriptsClient />
    </Suspense>
  );
}
