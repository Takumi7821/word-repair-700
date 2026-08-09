"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ReadyGauge } from "@/components/ReadyGauge";
import { computeReadyScore, getAllWordHistories, getUserProfile } from "@/lib/storage";
import type { UserProfile } from "@/lib/types";

type HomeData = {
  profile: UserProfile;
  readyScore: number;
  fragileCount: number;
};

export default function HomePage() {
  const [data, setData] = useState<HomeData | null>(null);

  useEffect(() => {
    const profile = getUserProfile();
    const histories = getAllWordHistories();
    const fragileCount = histories.filter((h) => h.masteryStatus === "fragile").length;
    setData({ profile, readyScore: computeReadyScore(profile), fragileCount });
  }, []);

  const hasPlayedBefore = (data?.profile.totalSessions ?? 0) > 0;

  return (
    <main className="flex flex-col gap-6 pt-4">
      <header>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-accent">
          Word Repair 700
        </p>
        <h1 className="mt-2 text-2xl font-extrabold text-ink sm:text-3xl">
          間違いを、次の3問で直す。
        </h1>
        <p className="mt-2 text-sm text-ink/60">
          TOEIC700点を目指す社会人のための、AI弱点修復型の英単語トレーニング。
        </p>
      </header>

      {data ? (
        <>
          <ReadyGauge score={data.readyScore} />

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
              <p className="text-2xl font-extrabold text-ink">{data.profile.masteredWords}</p>
              <p className="mt-1 text-xs text-ink/50">習得済み単語</p>
            </div>
            <div className="rounded-2xl border border-ink/10 bg-white/70 p-4">
              <p className="text-2xl font-extrabold text-weak">{data.fragileCount}</p>
              <p className="mt-1 text-xs text-ink/50">修復待ちの単語</p>
            </div>
          </div>

          <div className="rounded-2xl border border-ink/10 bg-white/70 p-4 text-sm text-ink/70">
            {hasPlayedBefore ? (
              <p>
                これまでに<span className="font-semibold text-ink">{data.profile.totalSessions}</span>
                回のセッションを完了。直近のRepair成功数は
                <span className="font-semibold text-repair">
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

      <div className="mt-2 flex flex-col gap-3">
        <Link
          href="/session"
          className="rounded-full bg-ink px-6 py-4 text-center text-base font-bold text-paper shadow-sm transition-transform active:scale-[0.98]"
        >
          今日の10問を始める
        </Link>
        <p className="text-center text-xs text-ink/40">目安時間 8〜10分</p>
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
