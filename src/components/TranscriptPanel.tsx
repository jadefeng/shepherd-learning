"use client";

import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";

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
  const { language } = useLanguage();
  const c = copy[language];
  const sourceText =
    sourceLabel === "auto"
      ? c.learn.sourceAuto
      : sourceLabel === "library"
        ? c.learn.sourceLibrary
        : sourceLabel === "manual"
          ? c.learn.sourceManual
          : sourceLabel;
  return (
    <details className="rounded-2xl border border-black/10 bg-white/90 p-4 open:bg-white">
      <summary className="cursor-pointer text-sm font-semibold uppercase tracking-[0.2em] text-black/60">
        {c.learn.transcriptTitle}
      </summary>
      <div className="mt-4 space-y-3 text-sm leading-6 text-black/70">
        {isLoading && <p>{c.learn.transcriptLoading}</p>}
        {sourceLabel && (
          <p className="text-xs uppercase tracking-[0.2em] text-black/40">
            {c.learn.transcriptSource}: {sourceText}
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
              {c.learn.transcriptMissing}
            </p>
          </>
        )}
      </div>
    </details>
  );
}
