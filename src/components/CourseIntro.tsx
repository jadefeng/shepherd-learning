"use client";

import type { Course } from "@/lib/course";
import ProgressBar from "@/components/ProgressBar";
import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";

type CourseIntroProps = {
  title: string;
  description: string;
  totalLessons: number;
  hasProgress: boolean;
  course: Course;
  onStart: () => void;
};

export default function CourseIntro({
  title,
  description,
  totalLessons,
  hasProgress,
  course,
  onStart,
}: CourseIntroProps) {
  const { language } = useLanguage();
  const c = copy[language];
  return (
    <section className="mx-auto flex w-full max-w-4xl flex-col gap-6 rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.5)] backdrop-blur sm:p-10">
      <div className="flex flex-col gap-4">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/60">
          {c.home.safetySeries}
        </p>
        <h1 className="text-3xl font-semibold sm:text-5xl">{title}</h1>
        <p className="max-w-2xl text-base leading-7 text-black/70 sm:text-lg">
          {description}
        </p>
      </div>
      <ProgressBar variant="embedded" course={course} />
      <div className="flex flex-col gap-2 rounded-2xl border border-black/10 bg-[var(--surface)] p-4 text-sm font-medium text-black/70 sm:flex-row sm:items-center sm:justify-between">
        <span>
          {totalLessons} {c.home.lessonsMeta}
        </span>
      </div>

      <button
        type="button"
        onClick={onStart}
        className="mt-2 inline-flex items-center justify-center rounded-full bg-[var(--primary)] px-6 py-4 text-base font-semibold text-white transition hover:translate-y-[-1px] hover:bg-[#f06a45] active:translate-y-0"
      >
        {hasProgress ? c.home.resumeCourse : c.home.startCourse}
      </button>
    </section>
  );
}
