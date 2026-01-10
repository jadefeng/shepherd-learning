import type { QuizQuestion as Question } from "@/lib/quiz";
import type { AnswerChoice } from "@/lib/storage";

type QuizResultsProps = {
  questions: Question[];
  answers: Record<string, AnswerChoice>;
};

export default function QuizResults({ questions, answers }: QuizResultsProps) {
  const score = questions.reduce((total, question) => {
    return total + (answers[question.id] === question.correct ? 1 : 0);
  }, 0);

  return (
    <section className="space-y-4 rounded-3xl border border-black/10 bg-white/95 p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-lg font-semibold">Quiz feedback</h3>
        <span className="rounded-full bg-[var(--accent)] px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-black/70">
          Score {score} / {questions.length}
        </span>
      </div>
      {questions.map((question) => {
        const selected = answers[question.id];
        const isCorrect = selected === question.correct;
        return (
          <details
            key={question.id}
            className={`rounded-2xl border px-4 py-3 ${
              isCorrect
                ? "border-emerald-200 bg-emerald-50"
                : "border-rose-200 bg-rose-50"
            }`}
          >
            <summary className="cursor-pointer text-sm font-semibold">
              {isCorrect ? "Correct" : "Needs review"} · {question.prompt}
            </summary>
            <div className="mt-3 space-y-2 text-sm text-black/70">
              <p>
                Your answer:{" "}
                <span className="font-semibold text-black/80">
                  {selected ?? "No answer"}
                </span>
              </p>
              <p>
                Correct answer:{" "}
                <span className="font-semibold text-black/80">
                  {question.correct}
                </span>
              </p>
              <p className="rounded-xl border border-black/10 bg-white/80 p-3 text-sm">
                {question.explanation}
              </p>
            </div>
          </details>
        );
      })}
    </section>
  );
}
