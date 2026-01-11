"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CourseIntro from "@/components/CourseIntro";
import { useAuth } from "@/components/AuthContext";
import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";
import { courses, getCourseCopy, getTotalLessons } from "@/lib/course";
import { loadProgress } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const { isAuthenticated } = useAuth();
  const { language } = useLanguage();
  const c = copy[language];

  useEffect(() => {
    const nextMap: Record<string, boolean> = {};
    courses.forEach((course) => {
      const progress = loadProgress(course.id);
      const hasAny =
        progress.currentStepIndex > 0 ||
        Object.keys(progress.completed).length > 0;
      nextMap[course.id] = hasAny;
    });
    setProgressMap(nextMap);
  }, []);

  return (
    <main className="flex min-h-screen w-full flex-col items-center gap-10 px-4 py-16 sm:px-6">
      <section className="w-full max-w-5xl rounded-3xl border border-black/10 bg-white/80 p-6 shadow-[0_30px_80px_-60px_rgba(0,0,0,0.5)]">
        <div className="flex flex-col gap-4">
          <img
            src="/shepherd-logo.png"
            alt="Shepherd Learning logo"
            className="block max-w-[200px] h-auto"
          />
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">
            {c.home.heroLabel}
          </p>
          <h1 className="text-3xl font-semibold sm:text-5xl">
            {c.home.heroTitle}
          </h1>
          <p className="max-w-2xl text-base leading-7 text-black/70 sm:text-lg">
            {c.home.heroBody}
          </p>
          <div className="flex flex-wrap gap-3 text-sm font-medium text-black/60">
            <span className="rounded-full border border-black/10 bg-[var(--surface)] px-4 py-2">
              {c.home.chip1}
            </span>
            <span className="rounded-full border border-black/10 bg-[var(--surface)] px-4 py-2">
              {c.home.chip2}
            </span>
            <span className="rounded-full border border-black/10 bg-[var(--surface)] px-4 py-2">
              {c.home.chip3}
            </span>
          </div>
          
        </div>
      </section>
      {isAuthenticated && (
        <div className="flex w-full max-w-5xl flex-col gap-6">
          {courses.map((course) => {
            const courseCopy = getCourseCopy(course, language);
            return (
              <CourseIntro
                key={course.id}
                title={courseCopy.title}
                description={courseCopy.description}
                totalLessons={getTotalLessons(course)}
                hasProgress={progressMap[course.id] ?? false}
                course={course}
                onStart={() => router.push(`/learn?course=${course.id}`)}
              />
            );
          })}
        </div>
      )}
    </main>
  );
}
