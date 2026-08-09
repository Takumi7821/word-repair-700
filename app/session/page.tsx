"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { DiagnosisPanel } from "@/components/DiagnosisPanel";
import { LoadingState } from "@/components/LoadingState";
import { ProgressDots, type DotItem } from "@/components/ProgressDots";
import { QuestionCard } from "@/components/QuestionCard";
import { RepairBanner } from "@/components/RepairBanner";
import { fallbackDiagnosis } from "@/lib/fallback";
import {
  MAX_REPAIR_QUESTIONS,
  buildInitialQueue,
  buildRepairQuestionItem,
  countRepairQuestions,
  insertRepairQuestion,
} from "@/lib/quiz-engine";
import {
  computeReadyScore,
  finalizeSession,
  getAllWordHistories,
  getUserProfile,
  getWordHistoryMap,
  getTopMistakeType,
  recordAnswer,
  recordRepairSuccess,
} from "@/lib/storage";
import {
  EMPTY_MISTAKE_PROFILE,
  ERROR_TYPE_LABEL_JA,
  type DiagnoseRequest,
  type DiagnosisResult,
  type ErrorType,
  type MistakeProfile,
  type QuestionItem,
  type SessionMistake,
  type SessionResult,
  type UserProfile,
} from "@/lib/types";
import { getWordById } from "@/lib/words";

type Outcome = "correct" | "incorrect";

export default function SessionPage() {
  const router = useRouter();

  const [queue, setQueue] = useState<QuestionItem[]>([]);
  const [ready, setReady] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [outcomes, setOutcomes] = useState<Record<number, Outcome>>({});

  const [diagnosis, setDiagnosis] = useState<DiagnosisResult | null>(null);
  const [isDiagnosing, setIsDiagnosing] = useState(false);
  const [repairBanner, setRepairBanner] = useState<string | null>(null);

  const [sessionCorrect, setSessionCorrect] = useState(0);
  const [sessionIncorrect, setSessionIncorrect] = useState(0);
  const [sessionRepaired, setSessionRepaired] = useState(0);
  const [sessionMistakes, setSessionMistakes] = useState<SessionMistake[]>([]);
  const [recentMistakes, setRecentMistakes] = useState<{ word: string; errorType: ErrorType }[]>(
    []
  );
  const [previousMistakeProfile, setPreviousMistakeProfile] =
    useState<MistakeProfile>(EMPTY_MISTAKE_PROFILE);

  const [isFinishing, setIsFinishing] = useState(false);

  useEffect(() => {
    const histories = getWordHistoryMap();
    setQueue(buildInitialQueue(histories));
    setPreviousMistakeProfile(getUserProfile().mistakeProfile);
    setReady(true);
  }, []);

  if (!ready || queue.length === 0) {
    return <LoadingState message="今日の10問を準備しています…" />;
  }

  const question = queue[currentIndex];
  if (!question) {
    return <LoadingState message="今日の10問を準備しています…" />;
  }
  const correctForCurrent = selectedAnswer === question.correctAnswer;

  const progressItems: DotItem[] = queue.map((q, i) => ({
    kind: q.kind,
    status:
      i === currentIndex
        ? "current"
        : i < currentIndex
          ? outcomes[i] === "incorrect"
            ? "incorrect"
            : "correct"
          : "upcoming",
  }));

  async function handleSelect(choice: string) {
    const currentQuestion = queue[currentIndex];
    if (isAnswered || !currentQuestion) return;
    setSelectedAnswer(choice);
    setIsAnswered(true);
    const correct = choice === currentQuestion.correctAnswer;
    setOutcomes((prev) => ({ ...prev, [currentIndex]: correct ? "correct" : "incorrect" }));

    if (currentQuestion.kind === "repair") {
      if (correct) {
        recordRepairSuccess(currentQuestion.wordId);
        recordAnswer({ wordId: currentQuestion.wordId, correct: true });
        setSessionRepaired((n) => n + 1);
        setSessionCorrect((n) => n + 1);
        setSessionMistakes((prev) =>
          prev.map((m) =>
            m.wordId === currentQuestion.repairMeta?.sourceWordId && !m.wasRepaired
              ? { ...m, wasRepaired: true }
              : m
          )
        );
        setRepairBanner(
          `${ERROR_TYPE_LABEL_JA[currentQuestion.repairMeta?.errorType ?? "context_gap"]}を1つ修復しました`
        );
      } else {
        recordAnswer({
          wordId: currentQuestion.wordId,
          correct: false,
          errorType: currentQuestion.repairMeta?.errorType,
        });
        setSessionIncorrect((n) => n + 1);
        setRepairBanner(null);
      }
      return;
    }

    setRepairBanner(null);

    if (correct) {
      recordAnswer({ wordId: currentQuestion.wordId, correct: true });
      setSessionCorrect((n) => n + 1);
      return;
    }

    setSessionIncorrect((n) => n + 1);
    setIsDiagnosing(true);
    setDiagnosis(null);

    const word = getWordById(currentQuestion.wordId);
    const requestPayload: DiagnoseRequest = {
      wordId: currentQuestion.wordId,
      word: currentQuestion.word,
      partOfSpeech: currentQuestion.partOfSpeech,
      meaningJa: currentQuestion.meaningJa,
      sentence: currentQuestion.sentence,
      choices: currentQuestion.choices,
      userAnswer: choice,
      correctAnswer: currentQuestion.correctAnswer,
      recentMistakes,
    };

    let diagnosisResult: DiagnosisResult;
    try {
      const res = await fetch("/api/diagnose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestPayload),
      });
      if (!res.ok) throw new Error("diagnose request failed");
      const data = (await res.json()) as { result: DiagnosisResult };
      diagnosisResult = data.result;
    } catch {
      diagnosisResult = word
        ? fallbackDiagnosis(requestPayload, word)
        : {
            errorType: "vocabulary_gap",
            diagnosis: `「${currentQuestion.correctAnswer}」の意味を確認しましょう。`,
            keyInsight: `意味は「${currentQuestion.meaningJa}」です。`,
            businessExample: {
              english: currentQuestion.sentence,
              japanese: currentQuestion.translationJa,
            },
            repairQuestion: {
              sentence: currentQuestion.sentence,
              choices: currentQuestion.choices as [string, string, string, string],
              correctAnswer: currentQuestion.correctAnswer,
            },
          };
    }

    recordAnswer({
      wordId: currentQuestion.wordId,
      correct: false,
      errorType: diagnosisResult.errorType,
    });
    setDiagnosis(diagnosisResult);
    setIsDiagnosing(false);

    setSessionMistakes((prev) => [
      ...prev,
      {
        wordId: currentQuestion.wordId,
        word: currentQuestion.word,
        errorType: diagnosisResult.errorType,
        diagnosis: diagnosisResult.diagnosis,
        wasRepaired: false,
      },
    ]);
    setRecentMistakes((prev) =>
      [...prev, { word: currentQuestion.word, errorType: diagnosisResult.errorType }].slice(-5)
    );

    if (word && countRepairQuestions(queue) < MAX_REPAIR_QUESTIONS) {
      const repairItem = buildRepairQuestionItem(diagnosisResult, word, currentQuestion.id);
      setQueue((prev) => insertRepairQuestion(prev, currentIndex, repairItem));
    }
  }

  function handleNext() {
    const nextIndex = currentIndex + 1;
    setSelectedAnswer(null);
    setIsAnswered(false);
    setDiagnosis(null);
    setRepairBanner(null);

    if (nextIndex >= queue.length) {
      finishSession();
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  function finishSession() {
    setIsFinishing(true);
    const wordHistories = getAllWordHistories();
    const masteredWordsNow = wordHistories.filter((h) => h.masteryStatus === "mastered").length;
    const priorProfile = getUserProfile();

    const totalQuestions = queue.length;
    const remainingWeakCount = sessionMistakes.filter((m) => !m.wasRepaired).length;
    const sessionMistakeProfile = sessionMistakes.reduce<MistakeProfile>(
      (acc, m) => ({ ...acc, [m.errorType]: acc[m.errorType] + 1 }),
      { ...EMPTY_MISTAKE_PROFILE }
    );

    const projectedProfile: UserProfile = {
      ...priorProfile,
      totalQuestions: priorProfile.totalQuestions + totalQuestions,
      totalCorrect: priorProfile.totalCorrect + sessionCorrect,
      masteredWords: masteredWordsNow,
    };
    const readyScore = computeReadyScore(projectedProfile);

    const sessionResult: SessionResult = {
      completedAt: new Date().toISOString(),
      totalQuestions,
      correctCount: sessionCorrect,
      incorrectCount: sessionIncorrect,
      repairedCount: sessionRepaired,
      remainingWeakCount,
      readyScore,
      mistakeDnaTop: getTopMistakeType(priorProfile.mistakeProfile),
      sessionMistakeProfile,
      previousMistakeProfile,
      mistakes: sessionMistakes,
      coachSummary: "",
      coachSummarySource: "fallback",
    };

    finalizeSession(sessionResult);
    router.push("/result");
  }

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

      <QuestionCard
        question={question}
        selectedAnswer={selectedAnswer}
        isAnswered={isAnswered}
        onSelect={handleSelect}
      />

      {isAnswered && question.kind !== "repair" && !correctForCurrent && (
        <DiagnosisPanel diagnosis={diagnosis} isLoading={isDiagnosing} />
      )}

      {isAnswered && question.kind !== "repair" && correctForCurrent && (
        <p className="mt-4 rounded-2xl border border-accent/30 bg-accentSoft/60 p-4 text-center text-sm font-semibold text-accent">
          KNOWN — 正解です
        </p>
      )}

      {isAnswered && question.kind === "repair" && repairBanner && (
        <RepairBanner message={repairBanner} />
      )}

      {isAnswered && question.kind === "repair" && !repairBanner && (
        <p className="mt-4 rounded-2xl border border-ink/10 bg-white/70 p-4 text-center text-sm text-ink/60">
          まだ定着していないようです。正解は「{question.correctAnswer}」でした。
        </p>
      )}

      {isAnswered && (
        <button
          type="button"
          onClick={handleNext}
          disabled={isDiagnosing || isFinishing}
          className="mt-2 rounded-full bg-ink px-6 py-4 text-center text-base font-bold text-paper transition-opacity disabled:opacity-50"
        >
          {isFinishing
            ? "結果をまとめています…"
            : currentIndex + 1 >= queue.length
              ? "結果を見る"
              : "次へ"}
        </button>
      )}
    </main>
  );
}
