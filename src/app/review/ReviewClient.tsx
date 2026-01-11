"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ProgressBar from "@/components/ProgressBar";
import { courses, getTotalLessons } from "@/lib/course";
import { defaultProgress, loadProgress, saveProgress } from "@/lib/storage";
import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";

type CompletedSummary = {
  videoId: string;
  score: number;
};

type CourseSummary = {
  courseId: string;
  title: string;
  completed: CompletedSummary[];
};

export default function ReviewClient() {
  const router = useRouter();
  const [summaries, setSummaries] = useState<CourseSummary[]>([]);
  const [showReset, setShowReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetCourseId, setResetCourseId] = useState<string | null>(null);
  const { language } = useLanguage();
  const c = copy[language];

  useEffect(() => {
    const nextSummaries = courses.map((course) => {
      const progress = loadProgress(course.id);
      const items = course.videoIds
        .filter((id) => progress.completed[id])
        .map((id) => ({
          videoId: id,
          score: progress.completed[id].score,
        }));
      return {
        courseId: course.id,
        title: course.title,
        completed: items,
      };
    });
    setSummaries(nextSummaries);
  }, []);

  const handleReset = (courseId: string) => {
    setResetCourseId(courseId);
    setShowReset(true);
  };

  const confirmReset = () => {
    setResetting(true);
    if (resetCourseId) {
      saveProgress(resetCourseId, { ...defaultProgress });
      setSummaries((prev) =>
        prev.map((summary) =>
          summary.courseId === resetCourseId
            ? { ...summary, completed: [] }
            : summary,
        ),
      );
    }
    setShowReset(false);
    setResetting(false);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
          {c.review.title}
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          {c.review.completedLessons}
        </h1>
        <p className="mt-2 text-sm text-black/60">
          {c.review.subtitle}
        </p>
      </header>

      {summaries.map((summary) => {
        const course = courses.find((item) => item.id === summary.courseId);
        if (!course) {
          return null;
        }
        return (
          <section
            key={summary.courseId}
            className="space-y-4 rounded-3xl border border-black/10 bg-white/90 p-5"
          >
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">{summary.title}</h2>
              <p className="text-sm text-black/60">
                {summary.completed.length} {c.progress.of}{" "}
                {getTotalLessons(course)} {c.home.lessonsMeta}
              </p>
            </div>
            <ProgressBar variant="embedded" course={course} />
            {summary.completed.length === 0 ? (
              <p className="text-sm text-black/60">
                {c.review.noCompleted}
              </p>
            ) : (
              summary.completed.map((item, index) => (
                <div
                  key={item.videoId}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-black/10 bg-[var(--surface)] p-4 text-sm"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.3em] text-black/40">
                      {c.learn.lesson} {index + 1}
                    </p>
                    <p className="text-base font-semibold text-black/70">
                      {c.review.videoId} {item.videoId}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-[0.2em] text-black/40">
                      {c.review.score}
                    </p>
                    <p className="text-lg font-semibold text-black/70">
                      {item.score} / 3
                    </p>
                  </div>
                </div>
              ))
            )}
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => router.push(`/learn?course=${course.id}`)}
                className="w-full rounded-full bg-[var(--primary)] px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white"
              >
                {c.review.resumeCourse}
              </button>
              <button
                type="button"
                onClick={() => handleReset(course.id)}
                className="w-full rounded-full border border-rose-300 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-rose-700"
              >
                {c.review.resetCourse}
              </button>
            </div>
          </section>
        );
      })}

      {showReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4 py-10">
          <div className="w-full max-w-md space-y-4 rounded-3xl border border-black/10 bg-white p-6">
            <h3 className="text-lg font-semibold">
              {c.review.resetConfirmTitle}
            </h3>
            <p className="text-sm text-black/60">
              {c.review.resetConfirmBody}
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setShowReset(false)}
                className="w-full rounded-full border border-black/15 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
              >
                {c.review.cancel}
              </button>
              <button
                type="button"
                onClick={confirmReset}
                disabled={resetting}
                className="w-full rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-white disabled:opacity-70"
              >
                {resetting ? c.review.resetting : c.review.confirmReset}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
