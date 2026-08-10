"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoachSummary } from "@/components/CoachSummary";
import { LoadingState } from "@/components/LoadingState";
import { MistakeDnaBars } from "@/components/MistakeDnaBars";
import { ReadyGauge } from "@/components/ReadyGauge";
import { milestoneCrossed } from "@/lib/milestones";
import {
  getMistakeDnaPercentages,
  getTopMistakeType,
  getUserProfile,
  updateLatestSessionSummary,
} from "@/lib/storage";
import {
  ERROR_TYPE_LABEL_JA,
  type ErrorType,
  type SessionResult,
  type SummaryRequest,
} from "@/lib/types";

export default function ResultPage() {
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [dnaPercentages, setDnaPercentages] = useState<Record<ErrorType, number> | null>(null);
  const [topType, setTopType] = useState<ErrorType | null>(null);
  const [masteredWords, setMasteredWords] = useState(0);
  const [newMilestone, setNewMilestone] = useState<number | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const profile = getUserProfile();
    const latestResult = profile.latestSessionResult;
    if (!latestResult) {
      setNotFound(true);
      return;
    }

    setSessionResult(latestResult);
    setDnaPercentages(getMistakeDnaPercentages(profile.mistakeProfile));
    setTopType(getTopMistakeType(profile.mistakeProfile));
    setMasteredWords(profile.masteredWords);
    setNewMilestone(milestoneCrossed(latestResult.previousMasteredWords, profile.masteredWords));

    if (latestResult.coachSummary) return;

    setIsSummaryLoading(true);
    const payload: SummaryRequest = {
      sessionCorrect: latestResult.correctCount,
      sessionIncorrect: latestResult.incorrectCount,
      repairedCount: latestResult.repairedCount,
      mistakes: latestResult.mistakes,
      errorTypeCounts: latestResult.sessionMistakeProfile,
      previousMistakeProfile: latestResult.previousMistakeProfile,
      masteredWords: profile.masteredWords,
      readyScore: latestResult.readyScore,
    };

    fetch("/api/summary", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })
      .then((res) => {
        if (!res.ok) throw new Error("summary request failed");
        return res.json() as Promise<{ summary: string; source: "gemini" | "fallback" }>;
      })
      .then(({ summary, source }) => {
        updateLatestSessionSummary(summary, source);
        setSessionResult((prev) => (prev ? { ...prev, coachSummary: summary, coachSummarySource: source } : prev));
      })
      .catch(() => {
        const fallbackText = `今日は${latestResult.correctCount}問正解、${latestResult.repairedCount}件レベルアップしました。`;
        updateLatestSessionSummary(fallbackText, "fallback");
        setSessionResult((prev) =>
          prev ? { ...prev, coachSummary: fallbackText, coachSummarySource: "fallback" } : prev
        );
      })
      .finally(() => setIsSummaryLoading(false));
  }, []);

  if (notFound) {
    return (
      <main className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
        <p className="text-sm text-ink/60">まだ今日のセッション結果がありません。</p>
        <Link
          href="/"
          className="rounded-full bg-gradient-to-b from-primary to-primaryDark px-5 py-3 text-sm font-semibold text-white shadow-md shadow-primary/25"
        >
          ホームに戻る
        </Link>
      </main>
    );
  }

  if (!sessionResult || !dnaPercentages) {
    return <LoadingState message="結果をまとめています…" />;
  }

  const accuracyPercent =
    sessionResult.totalQuestions > 0
      ? Math.round((sessionResult.correctCount / sessionResult.totalQuestions) * 100)
      : 0;

  return (
    <main className="flex flex-col gap-6 pt-4">
      <header>
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
          Result
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">今日もひとつ、前進しました。</h1>
      </header>

      {newMilestone !== null && (
        <div className="animate-levelup-pop rounded-2xl border border-primary/25 bg-gradient-to-br from-primary to-primaryDark p-5 text-center text-white shadow-lg shadow-primary/30">
          <p className="font-display text-sm font-bold uppercase tracking-wide text-white/80">
            Milestone Reached
          </p>
          <p className="mt-1 font-display text-2xl font-extrabold">
            習得 {newMilestone} 語達成 🎉
          </p>
        </div>
      )}

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-ink/8 bg-white/80 p-3 text-center">
          <p className="font-display text-xl font-extrabold text-ink">
            {sessionResult.correctCount}/{sessionResult.totalQuestions}
          </p>
          <p className="mt-1 text-[11px] text-ink/50">正解数 ({accuracyPercent}%)</p>
        </div>
        <div className="rounded-2xl border border-levelup/20 bg-levelupSoft/70 p-3 text-center">
          <p className="font-display text-xl font-extrabold text-levelup">
            {sessionResult.repairedCount}
          </p>
          <p className="mt-1 text-[11px] font-semibold text-levelup/70">LEVEL UP</p>
        </div>
        <div className="rounded-2xl border border-ink/8 bg-white/80 p-3 text-center">
          <p className="font-display text-xl font-extrabold text-ink">{masteredWords}</p>
          <p className="mt-1 text-[11px] text-ink/50">習得済み単語</p>
        </div>
      </div>

      <ReadyGauge score={sessionResult.readyScore} />

      <section className="rounded-2xl border border-ink/8 bg-white/80 p-5">
        <p className="mb-1 font-display text-xs font-bold uppercase tracking-wide text-ink/50">
          Your Mistake DNA
        </p>
        {topType && (
          <p className="mb-3 text-sm text-ink/70">
            あなたは現在、「{ERROR_TYPE_LABEL_JA[topType]}」で最も失点しています。
          </p>
        )}
        <MistakeDnaBars percentages={dnaPercentages} />
      </section>

      <CoachSummary summary={sessionResult.coachSummary} isLoading={isSummaryLoading} />

      <div className="flex flex-col gap-3">
        <Link
          href="/"
          className="rounded-full bg-gradient-to-b from-primary to-primaryDark px-6 py-4 text-center font-display text-base font-bold text-white shadow-lg shadow-primary/30"
        >
          ホームに戻る
        </Link>
        <Link
          href="/words"
          className="rounded-full border border-ink/15 px-6 py-3 text-center text-sm font-medium text-ink/70"
        >
          単語帳を見る
        </Link>
      </div>
    </main>
  );
}
