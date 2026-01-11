"use client";

import { useLanguage } from "@/components/LanguageContext";
import { copy } from "@/lib/i18n";
type NavigationFooterProps = {
  canGoNext: boolean;
  canGoPrev: boolean;
  isLastLesson: boolean;
  isFirstLesson: boolean;
  onPrev: () => void;
  onNext: () => void;
  onReview?: () => void;
};

export default function NavigationFooter({
  canGoNext,
  canGoPrev,
  isLastLesson,
  isFirstLesson,
  onPrev,
  onNext,
  onReview,
}: NavigationFooterProps) {
  const { language } = useLanguage();
  const c = copy[language];
  return (
    <div className="sticky bottom-4 z-10 flex w-full flex-col gap-3 rounded-3xl border border-black/10 bg-white/95 p-4 shadow-[0_18px_50px_-40px_rgba(0,0,0,0.6)] backdrop-blur">
      <div className="flex w-full flex-col gap-3 sm:flex-row">
        <button
          type="button"
          className={`w-full rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
            canGoPrev && !isFirstLesson
              ? "border border-black/15 bg-white text-black/70 hover:bg-black/5"
              : "cursor-not-allowed border border-black/10 bg-black/5 text-black/40"
          }`}
          onClick={onPrev}
          disabled={!canGoPrev || isFirstLesson}
        >
          {c.learn.prevLesson}
        </button>
        <button
          type="button"
          className={`w-full rounded-full px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] transition ${
            canGoNext
              ? "bg-[var(--primary)] text-white hover:bg-[#f06a45]"
              : "cursor-not-allowed border border-black/10 bg-black/5 text-black/40"
          }`}
          onClick={onNext}
          disabled={!canGoNext}
        >
          {isLastLesson ? c.learn.finishCourse : c.learn.nextLesson}
        </button>
      </div>
      {isLastLesson && onReview && (
        <button
          type="button"
          className="w-full rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black/70"
          onClick={onReview}
        >
          {c.nav.review}
        </button>
      )}
    </div>
  );
}
