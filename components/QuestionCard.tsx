"use client";

import type { QuestionItem } from "@/lib/types";
import { ChoiceButton } from "./ChoiceButton";

type Props = {
  question: QuestionItem;
  selectedAnswer: string | null;
  isAnswered: boolean;
  onSelect: (choice: string) => void;
};

function renderBlankSentence(sentence: string) {
  const parts = sentence.split("___");
  return (
    <p className="text-lg leading-relaxed text-ink sm:text-xl">
      {parts.map((part, i) => (
        <span key={i}>
          {part}
          {i < parts.length - 1 && (
            <span
              aria-hidden="true"
              className="mx-1 inline-block min-w-[4.5rem] border-b-2 border-dashed border-ink/40 align-baseline"
            >
              &nbsp;
            </span>
          )}
        </span>
      ))}
    </p>
  );
}

const KIND_LABEL: Record<QuestionItem["kind"], string> = {
  normal: "通常問題",
  repair: "REPAIR",
  transfer: "TRANSFER",
};

export function QuestionCard({ question, selectedAnswer, isAnswered, onSelect }: Props) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/70 p-5 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <span
          className={
            "rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide " +
            (question.kind === "repair"
              ? "bg-repairSoft text-repair"
              : question.kind === "transfer"
                ? "bg-accentSoft text-accent"
                : "bg-ink/5 text-ink/60")
          }
        >
          {KIND_LABEL[question.kind]}
        </span>
        <span className="text-xs text-ink/40">{question.partOfSpeech}</span>
      </div>

      {renderBlankSentence(question.sentence)}

      <div className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {question.choices.map((choice) => (
          <ChoiceButton
            key={choice}
            label={choice}
            isSelected={selectedAnswer === choice}
            isCorrectChoice={choice === question.correctAnswer}
            isAnswered={isAnswered}
            onClick={() => onSelect(choice)}
          />
        ))}
      </div>

      {isAnswered && question.translationJa && (
        <p className="mt-4 text-sm text-ink/60">{question.translationJa}</p>
      )}
    </div>
  );
}
