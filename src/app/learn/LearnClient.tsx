"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import NavigationFooter from "@/components/NavigationFooter";
import ProgressBar from "@/components/ProgressBar";
import QuizQuestion from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import TranscriptPanel from "@/components/TranscriptPanel";
import VideoPlayer from "@/components/VideoPlayer";
import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";
import { getCourseById, getTotalLessons, getVideoWatchUrl } from "@/lib/course";
import type { QuizQuestion as QuizQuestionType } from "@/lib/quiz";
import { loadProgress, saveProgress, type AnswerChoice } from "@/lib/storage";

type TranscriptState = {
  text: string | null;
  source: "auto" | "manual" | "library" | null;
};

const getStoredTranscript = (courseId: string, videoId: string) => {
  const progress = loadProgress(courseId);
  return progress.transcripts[videoId] ?? null;
};

export default function LearnClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [videoTitle, setVideoTitle] = useState("Safety Lesson");
  const [transcriptState, setTranscriptState] = useState<TranscriptState>({
    text: null,
    source: null,
  });
  const [transcriptLoading, setTranscriptLoading] = useState(false);
  const [transcriptError, setTranscriptError] = useState<string | null>(null);
  const [quizQuestions, setQuizQuestions] = useState<QuizQuestionType[]>([]);
  const [answers, setAnswers] = useState<Record<string, AnswerChoice>>({});
  const [submitted, setSubmitted] = useState(false);
  const [quizError, setQuizError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [translatedTranscript, setTranslatedTranscript] = useState<string | null>(
    null,
  );
  const [isTranslating, setIsTranslating] = useState(false);

  const courseId = searchParams.get("course");
  const course = getCourseById(courseId);
  const totalLessons = getTotalLessons(course);
  const videoId = course.videoIds[currentIndex];
  const isLastLesson = currentIndex === totalLessons - 1;
  const isFirstLesson = currentIndex === 0;
  const { language } = useLanguage();
  const c = copy[language];

  const availableTranscript = transcriptState.text;
  const displayTranscript =
    language === "es" ? translatedTranscript ?? transcriptState.text : transcriptState.text;

  const transcriptKey = useMemo(
    () => `shepherd-translation:${course.id}:${videoId}:${language}`,
    [course.id, language, videoId],
  );

  useEffect(() => {
    const progress = loadProgress(course.id);
    const stepParam = searchParams.get("step");
    const parsedStep = stepParam ? Number(stepParam) - 1 : Number.NaN;
    const fromParam = Number.isFinite(parsedStep) ? parsedStep : null;
    const safeIndex = Math.min(
      Math.max(fromParam ?? progress.currentStepIndex, 0),
      totalLessons - 1,
    );
    progress.currentStepIndex = safeIndex;
    saveProgress(course.id, progress);
    setCurrentIndex(safeIndex);
  }, [course.id, searchParams, totalLessons]);

  useEffect(() => {
    if (!videoId) {
      return;
    }
    const stored = getStoredTranscript(course.id, videoId);
    if (stored) {
      setTranscriptState({ text: stored.text, source: stored.source });
      setTranscriptError(null);
    } else {
      setTranscriptState({ text: null, source: null });
      setTranscriptError(null);
    }

    const progress = loadProgress(course.id);
    const completion = progress.completed[videoId];
    if (completion) {
      setAnswers(completion.answers);
      setSubmitted(true);
    } else {
      setAnswers({});
      setSubmitted(false);
    }
    setQuizQuestions([]);
  }, [course.id, videoId]);

  useEffect(() => {
    if (!videoId) {
      return;
    }
    let isActive = true;
    const fetchTitle = async () => {
      try {
        const response = await fetch(
          `https://www.youtube.com/oembed?url=${encodeURIComponent(
            getVideoWatchUrl(videoId),
          )}&format=json`,
        );
        if (!response.ok) {
          throw new Error("Unable to load title");
        }
        const data = (await response.json()) as { title?: string };
        if (isActive && data.title) {
          setVideoTitle(data.title);
        }
      } catch {
        if (isActive) {
          setVideoTitle(`Lesson ${currentIndex + 1}`);
        }
      }
    };
    fetchTitle();
    return () => {
      isActive = false;
    };
  }, [videoId, currentIndex]);

  useEffect(() => {
    const fetchTranscript = async () => {
      if (!videoId) {
        return;
      }
      const stored = getStoredTranscript(course.id, videoId);
      if (stored) {
        return;
      }
      setTranscriptLoading(true);
      setTranscriptError(null);
      try {
        const libraryResponse = await fetch(
          `/api/transcript-library?course=${course.id}&videoId=${videoId}`,
        );
        if (libraryResponse.ok) {
          const data = (await libraryResponse.json()) as { transcript: string };
          if (data.transcript) {
            const progress = loadProgress(course.id);
            progress.transcripts[videoId] = {
              source: "library",
              text: data.transcript,
              updatedAt: Date.now(),
            };
            saveProgress(course.id, progress);
            setTranscriptState({ text: data.transcript, source: "library" });
            return;
          }
        }

        const response = await fetch(`/api/transcript?videoId=${videoId}`);
        if (!response.ok) {
          const message = await response.json();
          throw new Error(message?.error ?? "Transcript unavailable");
        }
        const data = (await response.json()) as { transcript: string };
        if (data.transcript) {
          const progress = loadProgress(course.id);
          progress.transcripts[videoId] = {
            source: "auto",
            text: data.transcript,
            updatedAt: Date.now(),
          };
          saveProgress(course.id, progress);
          setTranscriptState({ text: data.transcript, source: "auto" });
        }
      } catch (error) {
        setTranscriptError(c.learn.transcriptUnavailable);
      } finally {
        setTranscriptLoading(false);
      }
    };
    fetchTranscript();
  }, [course.id, videoId]);

  useEffect(() => {
    const translateTranscript = async () => {
      if (!availableTranscript || language !== "es") {
        setTranslatedTranscript(null);
        return;
      }
      if (typeof window !== "undefined") {
        const cached = window.localStorage.getItem(transcriptKey);
        if (cached) {
          setTranslatedTranscript(cached);
          return;
        }
      }
      setIsTranslating(true);
      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: availableTranscript, target: "es" }),
        });
        if (!response.ok) {
          throw new Error("Translation failed.");
        }
        const data = (await response.json()) as { translatedText: string };
        setTranslatedTranscript(data.translatedText);
        if (typeof window !== "undefined") {
          window.localStorage.setItem(transcriptKey, data.translatedText);
        }
      } catch {
        setTranslatedTranscript(availableTranscript);
      } finally {
        setIsTranslating(false);
      }
    };
    translateTranscript();
  }, [availableTranscript, language, transcriptKey]);

  const handleGenerateQuiz = async () => {
    if (!videoId) {
      setQuizError(c.learn.quizFailed);
      return;
    }
    const fallbackTranscript = [
      `${videoTitle} covers core expectations for safe work in ${course.title}.`,
      "Workers should follow required procedures, report hazards, and use protective equipment.",
      "The module emphasizes identifying risks early and communicating safety concerns.",
      "Always follow supervisor guidance and safety rules to reduce incidents.",
    ].join(" ");
    setQuizError(null);
    setIsGenerating(true);
    const seed = Date.now() + Math.floor(Math.random() * 1000);
    resetCompletion();
    setAnswers({});
    setSubmitted(false);
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          videoTitle,
          transcriptText: displayTranscript ?? availableTranscript ?? fallbackTranscript,
          seed,
          language,
        }),
      });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message?.error ?? "Quiz generation failed.");
      }
      const data = (await response.json()) as { questions: QuizQuestionType[] };
      setQuizQuestions(data.questions);
    } catch (error) {
      setQuizError(
        error instanceof Error ? error.message : c.learn.quizFailed,
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = () => {
    if (!quizQuestions.length) {
      return;
    }
    const score = quizQuestions.reduce((total, question) => {
      return total + (answers[question.id] === question.correct ? 1 : 0);
    }, 0);
    const progress = loadProgress(course.id);
    if (score === quizQuestions.length) {
      progress.completed[videoId] = {
        completedAt: Date.now(),
        score,
        answers,
      };
      progress.currentStepIndex = Math.min(currentIndex + 1, totalLessons - 1);
    } else {
      progress.currentStepIndex = currentIndex;
    }
    saveProgress(course.id, progress);
    setSubmitted(true);
  };

  const currentScore = quizQuestions.reduce((total, question) => {
    return total + (answers[question.id] === question.correct ? 1 : 0);
  }, 0);

  const resetCompletion = () => {
    const progress = loadProgress(course.id);
    delete progress.completed[videoId];
    saveProgress(course.id, progress);
  };

  const handleRetakeQuiz = () => {
    resetCompletion();
    setAnswers({});
    setSubmitted(false);
  };

  const handleRegenerateQuiz = async () => {
    resetCompletion();
    setAnswers({});
    setSubmitted(false);
    await handleGenerateQuiz();
  };

  const canSubmit =
    quizQuestions.length > 0 &&
    quizQuestions.every((question) => answers[question.id]);

  const goNext = () => {
    if (isLastLesson) {
      router.push(`/review?course=${course.id}`);
      return;
    }
    const nextIndex = Math.min(currentIndex + 1, totalLessons - 1);
    const progress = loadProgress(course.id);
    progress.currentStepIndex = nextIndex;
    saveProgress(course.id, progress);
    setCurrentIndex(nextIndex);
  };

  const goPrev = () => {
    if (isFirstLesson) {
      return;
    }
    const prevIndex = Math.max(currentIndex - 1, 0);
    const progress = loadProgress(course.id);
    progress.currentStepIndex = prevIndex;
    saveProgress(course.id, progress);
    setCurrentIndex(prevIndex);
  };

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl flex-col gap-6 px-4 pb-24 pt-8 sm:px-6">
      <ProgressBar course={course} />
      <header className="flex flex-col gap-2 rounded-3xl border border-black/10 bg-white/80 p-5">
        <p className="text-xs font-semibold uppercase tracking-[0.4em] text-black/50">
          {c.learn.lesson} {currentIndex + 1} {c.learn.of} {totalLessons}
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{videoTitle}</h1>
        <p className="text-sm text-black/60">
          {c.learn.subtitle}
        </p>
      </header>

      <VideoPlayer videoId={videoId} title={videoTitle} />

      <TranscriptPanel
        transcript={displayTranscript}
        sourceLabel={transcriptState.source}
        isLoading={transcriptLoading || isTranslating}
        errorMessage={transcriptError}
      />

      <section className="space-y-4 rounded-3xl border border-black/10 bg-white/85 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">{c.learn.knowledgeCheck}</h2>
          <button
            type="button"
            onClick={handleGenerateQuiz}
            disabled={isGenerating}
            className={`rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] ${
              !isGenerating
                ? "bg-[var(--secondary)] text-white"
                : "cursor-not-allowed border border-black/10 bg-black/5 text-black/40"
            }`}
          >
            {isGenerating ? c.learn.generating : c.learn.generateQuiz}
          </button>
        </div>
        {quizError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {quizError}
          </p>
        )}
        {quizQuestions.length === 0 && (
          <p className="text-sm text-black/60">{c.learn.quizPrompt}</p>
        )}
        <div className="space-y-4">
          {quizQuestions.map((question) => (
            <QuizQuestion
              key={question.id}
              question={question}
              selected={answers[question.id]}
              onSelect={(choice) =>
                setAnswers((prev) => ({ ...prev, [question.id]: choice }))
              }
              disabled={submitted}
            />
          ))}
        </div>
        {quizQuestions.length > 0 && !submitted && (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit}
            className={`w-full rounded-full px-4 py-3 text-sm font-semibold uppercase tracking-[0.2em] ${
              canSubmit
                ? "bg-[var(--primary)] text-white hover:bg-[#f06a45]"
                : "cursor-not-allowed border border-black/10 bg-black/5 text-black/40"
            }`}
          >
            {c.learn.submitAnswers}
          </button>
        )}
        {submitted && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRetakeQuiz}
              className="w-full rounded-full border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
            >
              {c.learn.retakeQuiz}
            </button>
            <button
              type="button"
              onClick={handleRegenerateQuiz}
              className="w-full rounded-full bg-[var(--secondary)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              {c.learn.newQuestions}
            </button>
          </div>
        )}
      </section>

      {submitted && quizQuestions.length > 0 && (
        <QuizResults questions={quizQuestions} answers={answers} />
      )}
      {submitted &&
        quizQuestions.length > 0 &&
        currentScore < quizQuestions.length && (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {c.learn.blocked}
          </p>
        )}

      <NavigationFooter
        canGoNext={submitted && currentScore === quizQuestions.length}
        canGoPrev
        isLastLesson={isLastLesson}
        isFirstLesson={isFirstLesson}
        onPrev={goPrev}
        onNext={goNext}
        onReview={() => router.push(`/review?course=${course.id}`)}
      />
    </main>
  );
}
