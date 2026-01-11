"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CourseIntro from "@/components/CourseIntro";
import { useAuth } from "@/components/AuthContext";
import { courses, getTotalLessons } from "@/lib/course";
import { loadProgress } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});
  const { isAuthenticated } = useAuth();

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
          <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">
            Shepherd Learning
          </p>
          <h1 className="text-3xl font-semibold sm:text-5xl">
            Safety training built for crews on the move
          </h1>
          <p className="max-w-2xl text-base leading-7 text-black/70 sm:text-lg">
            Shepherd Learning delivers short, focused safety modules with
            knowledge checks so workers stay confident, compliant, and job-ready.
          </p>
          
        </div>
      </section>
      {isAuthenticated && (
        <div className="flex w-full max-w-5xl flex-col gap-6">
          {courses.map((course) => (
            <CourseIntro
              key={course.id}
              title={course.title}
              description={course.description}
              totalLessons={getTotalLessons(course)}
              hasProgress={progressMap[course.id] ?? false}
              course={course}
              onStart={() => router.push(`/learn?course=${course.id}`)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
