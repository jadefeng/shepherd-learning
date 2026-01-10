"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCourseById } from "@/lib/course";
import { loadProgress, saveProgress } from "@/lib/storage";

type TranscriptDraft = {
  videoId: string;
  text: string;
};

export default function TranscriptsPage() {
  const searchParams = useSearchParams();
  const course = getCourseById(searchParams.get("course"));
  const [drafts, setDrafts] = useState<TranscriptDraft[]>([]);

  useEffect(() => {
    const progress = loadProgress(course.id);
    const initial = course.videoIds.map((id) => ({
      videoId: id,
      text: progress.transcripts[id]?.text ?? "",
    }));
    setDrafts(initial);
  }, [course.id]);

  const updateDraft = (videoId: string, text: string) => {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.videoId === videoId ? { ...draft, text } : draft,
      ),
    );
  };

  const saveTranscript = (videoId: string, text: string) => {
    if (!text.trim()) {
      return;
    }
    const progress = loadProgress(course.id);
    progress.transcripts[videoId] = {
      source: "manual",
      text: text.trim(),
      updatedAt: Date.now(),
    };
    saveProgress(course.id, progress);
  };

  const loadFromLibrary = async (videoId: string) => {
    try {
      const response = await fetch(
        `/api/transcript-library?course=${course.id}&videoId=${videoId}`,
      );
      if (!response.ok) {
        return;
      }
      const data = (await response.json()) as { transcript?: string };
      if (data.transcript) {
        updateDraft(videoId, data.transcript);
      }
    } catch {
      // Ignore failures for manual input.
    }
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
          Transcript manager
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          Paste transcripts for {course.title}
        </h1>
        <p className="mt-2 text-sm text-black/60">
          Saved transcripts will override auto-fetched text and improve quiz
          quality.
        </p>
      </header>

      <section className="space-y-4">
        {drafts.map((draft, index) => (
          <div
            key={draft.videoId}
            className="space-y-3 rounded-3xl border border-black/10 bg-white/90 p-5"
          >
            <div className="flex flex-wrap items-center gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                  Lesson {index + 1}
                </p>
                <p className="text-base font-semibold text-black/70">
                  Video ID: {draft.videoId}
                </p>
              </div>
              <button
                type="button"
                onClick={() => saveTranscript(draft.videoId, draft.text)}
                className="rounded-full border border-black/10 bg-[var(--secondary)] px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white"
              >
                Save transcript
              </button>
              <button
                type="button"
                onClick={() => loadFromLibrary(draft.videoId)}
                className="rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
              >
                Load from files
              </button>
            </div>
            <textarea
              className="min-h-[160px] w-full rounded-2xl border border-black/20 bg-white p-3 text-sm text-black/80 focus:outline-none focus:ring-2 focus:ring-[var(--accent)]"
              placeholder="Paste transcript text here."
              value={draft.text}
              onChange={(event) =>
                updateDraft(draft.videoId, event.target.value)
              }
            />
          </div>
        ))}
      </section>
    </main>
  );
}
