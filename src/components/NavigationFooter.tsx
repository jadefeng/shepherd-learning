"use client";

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
          Previous lesson
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
        {isLastLesson ? "Finish course" : "Next lesson"}
      </button>
      </div>
      {isLastLesson && onReview && (
        <button
          type="button"
          className="w-full rounded-full border border-black/15 bg-white px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-black/70"
          onClick={onReview}
        >
          Review lessons
        </button>
      )}
    </div>
  );
}
