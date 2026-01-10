"use client";

import Link from "next/link";

type TranscriptPanelProps = {
  transcript: string | null;
  sourceLabel: string | null;
  isLoading: boolean;
  errorMessage: string | null;
};

export default function TranscriptPanel({
  transcript,
  sourceLabel,
  isLoading,
  errorMessage,
}: TranscriptPanelProps) {
  return (
    <details className="rounded-2xl border border-black/10 bg-white/90 p-4 open:bg-white">
      <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.2em] text-black/60">
        Transcript
      </summary>
      <div className="mt-4 space-y-3 text-sm leading-6 text-black/70">
        {isLoading && <p>Fetching transcript…</p>}
        {sourceLabel && (
          <p className="text-xs uppercase tracking-[0.2em] text-black/40">
            Source: {sourceLabel}
          </p>
        )}
        {transcript ? (
          <p className="whitespace-pre-wrap">{transcript}</p>
        ) : (
          <>
            {errorMessage && (
              <p className="rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900">
                {errorMessage}
              </p>
            )}
            <p className="text-sm text-black/60">
              No transcript is saved yet. You can manage transcripts for every
              lesson on the transcripts page.
            </p>
            <Link
              href="/transcripts"
              className="inline-flex items-center justify-center rounded-full border border-black/10 bg-[var(--secondary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              Manage transcripts
            </Link>
          </>
        )}
      </div>
    </details>
  );
}
