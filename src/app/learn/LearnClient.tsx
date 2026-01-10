"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import NavigationFooter from "@/components/NavigationFooter";
import ProgressBar from "@/components/ProgressBar";
import QuizQuestion from "@/components/QuizQuestion";
import QuizResults from "@/components/QuizResults";
import TranscriptPanel from "@/components/TranscriptPanel";
import VideoPlayer from "@/components/VideoPlayer";
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

  const courseId = searchParams.get("course");
  const course = getCourseById(courseId);
  const totalLessons = getTotalLessons(course);
  const videoId = course.videoIds[currentIndex];
  const isLastLesson = currentIndex === totalLessons - 1;
  const isFirstLesson = currentIndex === 0;

  const availableTranscript = transcriptState.text;

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
        setTranscriptError(
          error instanceof Error
            ? error.message
            : "Transcript unavailable. Paste it manually.",
        );
      } finally {
        setTranscriptLoading(false);
      }
    };
    fetchTranscript();
  }, [course.id, videoId]);

  const handleGenerateQuiz = async () => {
    if (!videoId) {
      setQuizError("Lesson video is unavailable.");
      return;
    }
    const fallbackTranscript = [
      `${videoTitle} covers core expectations for safe work in ${course.title}.`,
      "Workers should follow required procedures, report hazards, and use protective equipment.",
      "The lesson emphasizes identifying risks early and communicating safety concerns.",
      "Always follow supervisor guidance and safety rules to reduce incidents.",
    ].join(" ");
    setQuizError(null);
    setIsGenerating(true);
    const seed = Date.now();
    try {
      const response = await fetch("/api/generate-quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          videoId,
          videoTitle,
          transcriptText: availableTranscript ?? fallbackTranscript,
          seed,
        }),
      });
      if (!response.ok) {
        const message = await response.json();
        throw new Error(message?.error ?? "Quiz generation failed.");
      }
      const data = (await response.json()) as { questions: QuizQuestionType[] };
      setQuizQuestions(data.questions);
      const progress = loadProgress(course.id);
      if (progress.completed[videoId]) {
        setAnswers(progress.completed[videoId].answers);
        setSubmitted(true);
      } else {
        setAnswers({});
        setSubmitted(false);
      }
    } catch (error) {
      setQuizError(
        error instanceof Error ? error.message : "Quiz generation failed.",
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
    progress.completed[videoId] = {
      completedAt: Date.now(),
      score,
      answers,
    };
    progress.currentStepIndex = Math.min(currentIndex + 1, totalLessons - 1);
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
          Lesson {currentIndex + 1} of {totalLessons}
        </p>
        <h1 className="text-2xl font-semibold sm:text-3xl">{videoTitle}</h1>
        <p className="text-sm text-black/60">
          Generate the quiz after reviewing the transcript for this lesson.
        </p>
      </header>

      <VideoPlayer videoId={videoId} title={videoTitle} />

      <TranscriptPanel
        transcript={transcriptState.text}
        sourceLabel={transcriptState.source}
        isLoading={transcriptLoading}
        errorMessage={transcriptError}
      />
      <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
        <span>Need to paste a transcript?</span>
        <Link href={`/transcripts?course=${course.id}`} className="text-black/70">
          View transcript library
        </Link>
      </div>

      <section className="space-y-4 rounded-3xl border border-black/10 bg-white/85 p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">Knowledge check</h2>
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
            {isGenerating ? "Generating..." : "Generate quiz"}
          </button>
        </div>
        {quizError && (
          <p className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-900">
            {quizError}
          </p>
        )}
        {quizQuestions.length === 0 && (
          <p className="text-sm text-black/60">
            Generate the quiz to answer three quick questions about this lesson.
          </p>
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
            Submit answers
          </button>
        )}
        {submitted && (
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleRetakeQuiz}
              className="w-full rounded-full border border-black/15 bg-white px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-black/70"
            >
              Retake quiz
            </button>
            <button
              type="button"
              onClick={handleRegenerateQuiz}
              className="w-full rounded-full bg-[var(--secondary)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.2em] text-white"
            >
              New questions
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
            You need a perfect score to advance. Retake the quiz or generate new
            questions to continue.
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
