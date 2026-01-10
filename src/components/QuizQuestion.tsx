import type { QuizQuestion as Question } from "@/lib/quiz";
import type { AnswerChoice } from "@/lib/storage";

type QuizQuestionProps = {
  question: Question;
  selected?: AnswerChoice;
  onSelect: (choice: AnswerChoice) => void;
  disabled?: boolean;
};

export default function QuizQuestion({
  question,
  selected,
  onSelect,
  disabled = false,
}: QuizQuestionProps) {
  return (
    <fieldset className="space-y-3 rounded-2xl border border-black/10 bg-white/90 p-4">
      <legend className="text-base font-semibold text-black/80">
        {question.prompt}
      </legend>
      {(
        Object.entries(question.choices) as [AnswerChoice, string][]
      ).map(([choice, label]) => (
        <label
          key={choice}
          className={`flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            selected === choice
              ? "border-[var(--primary)] bg-[var(--surface-strong)]"
              : "border-black/10 bg-white"
          } ${disabled ? "cursor-not-allowed opacity-70" : ""}`}
        >
          <input
            type="radio"
            name={question.id}
            value={choice}
            checked={selected === choice}
            onChange={() => onSelect(choice)}
            disabled={disabled}
            className="mt-1 h-4 w-4 accent-[var(--primary)]"
          />
          <span>
            <span className="mr-2 font-semibold text-black/60">{choice}.</span>
            {label}
          </span>
        </label>
      ))}
    </fieldset>
  );
}
