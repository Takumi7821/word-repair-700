"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChoiceButton } from "@/components/ChoiceButton";
import { LoadingState } from "@/components/LoadingState";
import { ProgressDots, type DotItem } from "@/components/ProgressDots";
import {
  buildSimpleQuizQueue,
  type QuizDirection,
  type SimpleQuestion,
} from "@/lib/simple-quiz-engine";
import { getWordHistoryMap, recordAnswer, recordSimpleSession } from "@/lib/storage";
import { getWordById } from "@/lib/words";

type Outcome = "correct" | "incorrect";

const QUESTION_COUNT = 10;

const COPY: Record<QuizDirection, { badge: string; instruction: string }> = {
  "en-ja": { badge: "英→日", instruction: "単語の意味として正しいものを選んでください。" },
  "ja-en": { badge: "日→英", instruction: "意味に合う単語を選んでください。" },
};

function buildQueue(direction: QuizDirection): SimpleQuestion[] {
  return buildSimpleQuizQueue(direction, getWordHistoryMap(), QUESTION_COUNT);
}

export function SimpleQuizSession({ direction }: { direction: QuizDirection }) {
  const router = useRouter();
  const copy = COPY[direction];

  const [queue, setQueue] = useState<SimpleQuestion[]>([]);
  const [ready, setReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});
  const [correctCount, setCorrectCount] = useState(0);
  const [finished, setFinished] = useState(false);

  useEffect(() => {
    setQueue(buildQueue(direction));
    setReady(true);
  }, [direction]);

  if (!ready || queue.length === 0) {
    return <LoadingState message="問題を準備しています…" />;
  }

  if (finished) {
    const total = queue.length;
    const accuracy = total > 0 ? Math.round((correctCount / total) * 100) : 0;
    return (
      <main className="flex flex-col items-center gap-6 pt-16 text-center">
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
          {copy.badge} 4択クイズ
        </p>
        <p className="font-display text-5xl font-extrabold text-ink">
          {correctCount}
          <span className="text-2xl text-ink/40">/{total}</span>
        </p>
        <p className="text-sm text-ink/60">正答率 {accuracy}%</p>
        <div className="flex w-full flex-col gap-3">
          <button
            type="button"
            onClick={() => {
              setQueue(buildQueue(direction));
              setCurrentIndex(0);
              setOutcomes({});
              setCorrectCount(0);
              setSelectedAnswer(null);
              setIsAnswered(false);
              setFinished(false);
            }}
            className="rounded-full bg-gradient-to-b from-primary to-primaryDark px-6 py-4 font-display text-base font-bold text-white shadow-lg shadow-primary/30"
          >
            もう一度挑戦する
          </button>
          <button
            type="button"
            onClick={() => router.push("/")}
            className="rounded-full border border-ink/15 px-6 py-3 text-sm font-medium text-ink/70"
          >
            ホームに戻る
          </button>
        </div>
      </main>
    );
  }

  const question = queue[currentIndex];
  if (!question) {
    return <LoadingState message="問題を準備しています…" />;
  }

  const progressItems: DotItem[] = queue.map((_, i) => ({
    kind: "normal",
    status:
      i === currentIndex
        ? "current"
        : i < currentIndex
          ? outcomes[i] === "incorrect"
            ? "incorrect"
            : "correct"
          : "upcoming",
  }));

  function handleSelect(choice: string) {
    const currentQuestion = queue[currentIndex];
    if (isAnswered || !currentQuestion) return;
    const correct = choice === currentQuestion.correctAnswer;
    setSelectedAnswer(choice);
    setIsAnswered(true);
    setOutcomes((prev) => ({ ...prev, [currentIndex]: correct ? "correct" : "incorrect" }));
    if (correct) setCorrectCount((n) => n + 1);
    recordAnswer({ wordId: currentQuestion.wordId, correct });
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;
    setSelectedAnswer(null);
    setIsAnswered(false);
    if (nextIndex >= queue.length) {
      recordSimpleSession(queue.length, correctCount);
      setFinished(true);
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  const word = getWordById(question.wordId);
  const correctForCurrent = selectedAnswer === question.correctAnswer;

  return (
    <main className="flex flex-col gap-5 pt-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/")}
          className="text-sm text-ink/40"
          aria-label="ホームに戻る"
        >
          ← ホーム
        </button>
        <p className="text-xs font-semibold text-ink/40">
          {Math.min(currentIndex + 1, queue.length)} / {queue.length}
        </p>
      </div>

      <ProgressDots items={progressItems} />

      <div className="rounded-3xl border border-ink/8 bg-white/80 p-5 shadow-lg shadow-primary/5">
        <div className="mb-1 flex items-center justify-between">
          <span className="rounded-full bg-primarySoft px-2.5 py-1 font-display text-xs font-bold tracking-wide text-primary">
            {copy.badge}
          </span>
          <span className="text-xs text-ink/40">{question.promptPartOfSpeech}</span>
        </div>
        <p className="mb-4 text-xs text-ink/40">{copy.instruction}</p>

        <p className="py-6 text-center text-2xl font-bold text-ink">{question.prompt}</p>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {question.choices.map((choice) => (
            <ChoiceButton
              key={choice}
              label={choice}
              isSelected={selectedAnswer === choice}
              isCorrectChoice={choice === question.correctAnswer}
              isAnswered={isAnswered}
              onClick={() => handleSelect(choice)}
            />
          ))}
        </div>

        {isAnswered && word && (
          <div className="mt-4 rounded-lg bg-ink/5 p-3 text-xs text-ink/60">
            <p>{word.exampleSentence}</p>
            <p className="mt-0.5 text-ink/45">{word.exampleTranslationJa}</p>
          </div>
        )}
      </div>

      {isAnswered && correctForCurrent && (
        <p className="rounded-2xl border border-success/25 bg-successSoft/70 p-4 text-center font-display text-sm font-bold text-success">
          KNOWN — 正解です
        </p>
      )}

      {isAnswered && (
        <button
          type="button"
          onClick={handleNext}
          className="rounded-full bg-gradient-to-b from-primary to-primaryDark px-6 py-4 text-center font-display text-base font-bold text-white shadow-md shadow-primary/25"
        >
          {currentIndex + 1 >= queue.length ? "結果を見る" : "次へ"}
        </button>
      )}
    </main>
  );
}
