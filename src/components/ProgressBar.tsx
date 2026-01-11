"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Course } from "@/lib/course";
import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";
import { loadProgress, saveProgress } from "@/lib/storage";

type ProgressBarProps = {
  variant?: "sticky" | "embedded";
  course: Course;
  showLessonMeta?: boolean;
};

export default function ProgressBar({
  variant = "sticky",
  course,
  showLessonMeta = true,
}: ProgressBarProps) {
  const router = useRouter();
  const [completedIds, setCompletedIds] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const { language } = useLanguage();
  const c = copy[language];

  const totalLessons = course.videoIds.length;
  const progress = useMemo(() => {
    if (totalLessons === 0) {
      return 0;
    }
    return completedIds.length / totalLessons;
  }, [completedIds.length, totalLessons]);

  useEffect(() => {
    const update = () => {
      const progressState = loadProgress(course.id);
      setCompletedIds(Object.keys(progressState.completed));
      setCurrentIndex(progressState.currentStepIndex);
    };
    update();
    window.addEventListener("shepherd-progress", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("shepherd-progress", update);
      window.removeEventListener("storage", update);
    };
  }, [course.id]);

  const wrapperClass =
    variant === "sticky"
      ? "sticky top-0 z-20 w-full border-b border-black/10 bg-[#fff7ea]/90 backdrop-blur"
      : "w-full rounded-2xl border border-black/10 bg-[var(--surface)]";

  const innerClass =
    variant === "sticky"
      ? "mx-auto flex w-full max-w-5xl flex-col gap-2 px-4 py-3 sm:px-6"
      : "flex w-full flex-col gap-2 px-4 py-3";

  return (
    <div className={wrapperClass}>
      <div className={innerClass}>
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-black/60">
          <span>{c.progress.title}</span>
          <span>
            {Math.round(progress * 100)}% {c.progress.completed}
            {showLessonMeta && (
              <>
                {" "}
                · {c.progress.lesson} {Math.min(currentIndex + 1, totalLessons)}{" "}
                {c.progress.of} {totalLessons}
              </>
            )}
          </span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-black/10">
          <div
            className="h-full rounded-full bg-[var(--primary)] transition-all"
            style={{ width: `${progress * 100}%` }}
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {course.videoIds.map((id, index) => {
            const isComplete = completedIds.includes(id);
            const isCurrent = index === currentIndex;
            const isLocked = index > currentIndex;
            return (
              <button
                type="button"
                key={id}
                className={`flex h-6 w-6 items-center justify-center rounded-full border text-[10px] font-semibold ${
                  isComplete
                    ? "border-[var(--primary)] bg-[var(--primary)]"
                  : isCurrent
                    ? "border-[var(--secondary)] bg-[var(--accent)]"
                    : "border-black/20 bg-white"
                }`}
                disabled={isLocked}
                title={isLocked ? c.progress.locked : undefined}
                onClick={() => {
                  if (isLocked) {
                    return;
                  }
                  const progress = loadProgress(course.id);
                  progress.currentStepIndex = index;
                  saveProgress(course.id, progress);
                  router.push(`/learn?course=${course.id}&step=${index + 1}`);
                }}
                aria-label={`Lesson ${index + 1} ${isComplete ? "completed" : ""}`}
              >
                <span
                  className={
                    isComplete
                      ? "text-white"
                      : isLocked
                        ? "text-black/30"
                        : "text-black/60"
                  }
                >
                  {index + 1}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
