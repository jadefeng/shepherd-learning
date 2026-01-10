"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCourseById } from "@/lib/course";

type TranscriptDraft = {
  videoId: string;
  text: string;
  status: "loading" | "available" | "missing";
};

export default function TranscriptsPage() {
  const searchParams = useSearchParams();
  const course = getCourseById(searchParams.get("course"));
  const [drafts, setDrafts] = useState<TranscriptDraft[]>([]);

  useEffect(() => {
    let isMounted = true;
    const loadLibrary = async () => {
      const initial = course.videoIds.map((id) => ({
        videoId: id,
        text: "",
        status: "loading" as const,
      }));
      setDrafts(initial);
      await Promise.all(
        course.videoIds.map(async (id) => {
          try {
            const response = await fetch(
              `/api/transcript-library?course=${course.id}&videoId=${id}`,
            );
            if (!response.ok) {
              throw new Error("missing");
            }
            const data = (await response.json()) as { transcript?: string };
            if (!isMounted) {
              return;
            }
            setDrafts((prev) =>
              prev.map((draft) =>
                draft.videoId === id
                  ? {
                      ...draft,
                      text: data.transcript ?? "",
                      status: data.transcript ? "available" : "missing",
                    }
                  : draft,
              ),
            );
          } catch {
            if (!isMounted) {
              return;
            }
            setDrafts((prev) =>
              prev.map((draft) =>
                draft.videoId === id
                  ? { ...draft, text: "", status: "missing" }
                  : draft,
              ),
            );
          }
        }),
      );
    };
    loadLibrary();
    return () => {
      isMounted = false;
    };
  }, [course.id]);

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
          Transcripts are loaded from markdown files in the repository. Edit the
          files and redeploy to update the lesson content.
        </p>
      </header>

      <section className="space-y-4">
        {drafts.map((draft, index) => (
          <div
            key={draft.videoId}
            className="space-y-3 rounded-3xl border border-black/10 bg-white/90 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/40">
                  Lesson {index + 1}
                </p>
                <p className="text-base font-semibold text-black/70">
                  Video ID: {draft.videoId}
                </p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${
                  draft.status === "available"
                    ? "bg-emerald-100 text-emerald-800"
                    : draft.status === "loading"
                      ? "bg-black/5 text-black/40"
                      : "bg-amber-100 text-amber-800"
                }`}
              >
                {draft.status === "available"
                  ? "Loaded"
                  : draft.status === "loading"
                    ? "Loading"
                    : "Missing"}
              </span>
            </div>
            <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border border-black/10 bg-[var(--surface)] p-3 text-sm text-black/70">
              {draft.status === "loading"
                ? "Loading transcript from repository..."
                : draft.text || "Transcript not found in markdown yet."}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
