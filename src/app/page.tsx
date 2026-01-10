"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CourseIntro from "@/components/CourseIntro";
import { courses, getTotalLessons } from "@/lib/course";
import { loadProgress } from "@/lib/storage";

export default function Home() {
  const router = useRouter();
  const [progressMap, setProgressMap] = useState<Record<string, boolean>>({});

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
    <main className="flex min-h-screen w-full flex-col items-center justify-center gap-6 px-4 py-16 sm:px-6">
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
    </main>
  );
}
