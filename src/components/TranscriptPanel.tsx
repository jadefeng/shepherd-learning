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
              Transcript text is loaded from the markdown library in this repo.
              Add or update it there to make it available here.
            </p>
          </>
        )}
      </div>
    </details>
  );
}
