"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import { getCourseById, getTotalLessons } from "@/lib/course";
import { loadProgress } from "@/lib/storage";

type CompletedSummary = {
  videoId: string;
  score: number;
};

export default function ReviewClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [completed, setCompleted] = useState<CompletedSummary[]>([]);
  const course = getCourseById(searchParams.get("course"));

  useEffect(() => {
    const progress = loadProgress(course.id);
    const items = course.videoIds
      .filter((id) => progress.completed[id])
      .map((id) => ({
        videoId: id,
        score: progress.completed[id].score,
      }));
    setCompleted(items);
  }, [course.id, searchParams]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
      <ProgressBar course={course} />
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
          Review progress
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          Completed lessons
        </h1>
        <p className="mt-2 text-sm text-black/60">
          {completed.length} of {getTotalLessons(course)} lessons completed.
        </p>
      </header>

      <section className="space-y-3 rounded-3xl border border-black/10 bg-white/90 p-5">
        {completed.length === 0 ? (
          <p className="text-sm text-black/60">
            No completed lessons yet. Start learning to build your progress.
          </p>
        ) : (
          completed.map((item, index) => (
            <div
              key={item.videoId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-[var(--surface)] p-4 text-sm"
            >
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                  Lesson {index + 1}
                </p>
                <p className="text-base font-semibold text-black/70">
                  Video ID: {item.videoId}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                  Score
                </p>
                <p className="text-lg font-semibold text-black/70">
                  {item.score} / 3
                </p>
              </div>
            </div>
          ))
        )}
      </section>

      <button
        type="button"
        onClick={() => router.push(`/learn?course=${course.id}`)}
        className="w-full rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
      >
        Resume course
      </button>
    </main>
  );
}
