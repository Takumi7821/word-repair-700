"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CoachSummary } from "@/components/CoachSummary";
import { LoadingState } from "@/components/LoadingState";
import { MistakeDnaBars } from "@/components/MistakeDnaBars";
import { ReadyGauge } from "@/components/ReadyGauge";
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
        const fallbackText = `今日は${latestResult.correctCount}問正解、${latestResult.repairedCount}件の弱点を修復しました。`;
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
        <Link href="/" className="rounded-full bg-ink px-5 py-3 text-sm font-semibold text-paper">
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
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">Result</p>
        <h1 className="mt-2 text-2xl font-extrabold text-ink">今日もひとつ、直しました。</h1>
      </header>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-2xl border border-ink/10 bg-white/70 p-3 text-center">
          <p className="text-xl font-extrabold text-ink">
            {sessionResult.correctCount}/{sessionResult.totalQuestions}
          </p>
          <p className="mt-1 text-[11px] text-ink/50">正解数 ({accuracyPercent}%)</p>
        </div>
        <div className="rounded-2xl border border-repair/20 bg-repairSoft/60 p-3 text-center">
          <p className="text-xl font-extrabold text-repair">{sessionResult.repairedCount}</p>
          <p className="mt-1 text-[11px] text-repair/70">REPAIRED</p>
        </div>
        <div className="rounded-2xl border border-ink/10 bg-white/70 p-3 text-center">
          <p className="text-xl font-extrabold text-ink">{masteredWords}</p>
          <p className="mt-1 text-[11px] text-ink/50">習得済み単語</p>
        </div>
      </div>

      <ReadyGauge score={sessionResult.readyScore} />

      <section className="rounded-2xl border border-ink/10 bg-white/70 p-5">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink/50">
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
        <Link href="/" className="rounded-full bg-ink px-6 py-4 text-center text-base font-bold text-paper">
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
