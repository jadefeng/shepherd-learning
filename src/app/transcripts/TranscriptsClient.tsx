"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getCourseById } from "@/lib/course";
import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";

type TranscriptDraft = {
  videoId: string;
  text: string;
  status: "loading" | "available" | "missing";
};

export default function TranscriptsClient() {
  const searchParams = useSearchParams();
  const course = getCourseById(searchParams.get("course"));
  const [drafts, setDrafts] = useState<TranscriptDraft[]>([]);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const { language } = useLanguage();
  const c = copy[language];

  const translationPrefix = useMemo(
    () => `shepherd-translation:library:${course.id}`,
    [course.id],
  );

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

  useEffect(() => {
    if (language !== "es") {
      setTranslations({});
      return;
    }
    let isMounted = true;
    const translateAll = async () => {
      await Promise.all(
        drafts
          .filter((draft) => draft.status === "available" && draft.text)
          .map(async (draft) => {
            const cacheKey = `${translationPrefix}:${draft.videoId}:es`;
            if (typeof window !== "undefined") {
              const cached = window.localStorage.getItem(cacheKey);
              if (cached) {
                if (!isMounted) {
                  return;
                }
                setTranslations((prev) => ({ ...prev, [draft.videoId]: cached }));
                return;
              }
            }
            try {
              const response = await fetch("/api/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: draft.text, target: "es" }),
              });
              if (!response.ok) {
                return;
              }
              const data = (await response.json()) as { translatedText: string };
              if (!isMounted) {
                return;
              }
              setTranslations((prev) => ({
                ...prev,
                [draft.videoId]: data.translatedText,
              }));
              if (typeof window !== "undefined") {
                window.localStorage.setItem(cacheKey, data.translatedText);
              }
            } catch {
              // Ignore translation failures.
            }
          }),
      );
    };
    translateAll();
    return () => {
      isMounted = false;
    };
  }, [drafts, language, translationPrefix]);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 pb-16 pt-8 sm:px-6">
      <header className="rounded-3xl border border-black/10 bg-white/80 p-6">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
          {c.transcriptLibrary.title}
        </p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">
          {c.transcriptLibrary.subtitle} {course.title}
        </h1>
        <p className="mt-2 text-sm text-black/60">
          {c.transcriptLibrary.body}
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
                  {c.learn.lesson} {index + 1}
                </p>
                <p className="text-base font-semibold text-black/70">
                  {c.review.videoId} {draft.videoId}
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
                  ? c.transcriptLibrary.loaded
                  : draft.status === "loading"
                    ? c.transcriptLibrary.loading
                    : c.transcriptLibrary.missing}
              </span>
            </div>
            <div className="min-h-[120px] whitespace-pre-wrap rounded-2xl border border-black/10 bg-[var(--surface)] p-3 text-sm text-black/70">
              {draft.status === "loading"
                ? c.transcriptLibrary.loadingMessage
                : (language === "es"
                    ? translations[draft.videoId] ?? draft.text
                    : draft.text) || c.transcriptLibrary.missingMessage}
            </div>
          </div>
        ))}
      </section>
    </main>
  );
}
