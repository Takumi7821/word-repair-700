"use client";

import { useEffect, useState } from "react";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { MilestoneTrack } from "@/components/MilestoneTrack";
import { ModeCard } from "@/components/ModeCard";
import { ReadyGauge } from "@/components/ReadyGauge";
import { getMilestoneProgress, type MilestoneProgress } from "@/lib/milestones";
import {
  computeReadyScore,
  getAllWordHistories,
  getUserProfile,
  resetAllProgress,
} from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

type HomeData = {
  profile: UserProfile;
  readyScore: number;
  fragileCount: number;
  milestone: MilestoneProgress;
};

function loadHomeData(): HomeData {
  const profile = getUserProfile();
  const histories = getAllWordHistories();
  const fragileCount = histories.filter((h) => h.masteryStatus === "fragile").length;
  return {
    profile,
    readyScore: computeReadyScore(profile),
    fragileCount,
    milestone: getMilestoneProgress(profile.masteredWords),
  };
}

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  useEffect(() => {
    setData(loadHomeData());
  }, []);

  const hasPlayedBefore = (data?.profile.totalSessions ?? 0) > 0;

  function handleReset() {
    resetAllProgress();
    setConfirmResetOpen(false);
    setData(loadHomeData());
  }

  return (
    <main className="flex flex-col gap-6 pt-4">
      <header>
        <p className="font-display text-xs font-bold uppercase tracking-[0.2em] text-primary">
          TOEIC700 MASTER
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
          今日も、700点に近づく。
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          AI診断・4択クイズ・暗記カードで鍛える、社会人のためのTOEIC700点対策。
        </p>
      </header>

      <div className="flex flex-col gap-3">
        <ModeCard
          href="/session"
          title="AI診断セッション"
          description="間違いを、次の3問で突破する。10問・8〜10分。"
          badge="おすすめ"
          featured
        />
        <div className="grid grid-cols-2 gap-3">
          <ModeCard
            href="/quiz-en-ja"
            title="英→日 4択クイズ"
            description="単語を見て意味を選ぶ。"
          />
          <ModeCard
            href="/quiz-ja-en"
            title="日→英 4択クイズ"
            description="意味から単語を選ぶ。"
          />
          <ModeCard href="/flashcards" title="暗記カード" description="カードをめくって覚える。" />
          <ModeCard href="/words" title="単語帳" description="300語の習得状況を見る。" />
        </div>
      </div>

      {data ? (
        <>
          <ReadyGauge score={data.readyScore} />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-ink/8 bg-white/80 p-4">
              <p className="font-display text-2xl font-extrabold text-primary">
                {data.profile.masteredWords}
              </p>
              <p className="mt-1 text-xs text-ink/50">習得済み単語</p>
            </div>
            <div className="rounded-2xl border border-ink/8 bg-white/80 p-4">
              <p className="font-display text-2xl font-extrabold text-weak">
                {data.fragileCount}
              </p>
              <p className="mt-1 text-xs text-ink/50">レベルアップ待ちの単語</p>
            </div>
          </div>

          <MilestoneTrack progress={data.milestone} />

          <div className="rounded-2xl border border-ink/8 bg-white/80 p-4 text-sm text-ink/70">
            {hasPlayedBefore ? (
              <p>
                これまでに
                <span className="font-semibold text-ink">{data.profile.totalSessions}</span>
                回のセッションを完了。直近のレベルアップ数は
                <span className="font-semibold text-levelup">
                  {data.profile.latestSessionResult?.repairedCount ?? 0}
                </span>
                件です。
              </p>
            ) : (
              <p>まだ学習を始めていません。今日の10問で最初の弱点を見つけましょう。</p>
            )}
          </div>
        </>
      ) : (
        <div className="h-40 animate-pulse rounded-2xl bg-ink/5" />
      )}

      {hasPlayedBefore && (
        <button
          type="button"
          onClick={() => setConfirmResetOpen(true)}
          className="mt-2 text-center text-xs text-ink/30 underline-offset-2 hover:text-weak hover:underline"
        >
          学習データをリセット
        </button>
      )}

      <ConfirmDialog
        open={confirmResetOpen}
        title="学習データをリセットしますか？"
        message="習得済み単語、Mistake DNA、マイルストーンなど、これまでの学習記録がすべて削除されます。この操作は元に戻せません。"
        confirmLabel="リセットする"
        danger
        onConfirm={handleReset}
        onCancel={() => setConfirmResetOpen(false)}
      />
    </main>
  );
}
