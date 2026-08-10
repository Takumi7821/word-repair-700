"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { FlashCard } from "@/components/FlashCard";
import { LoadingState } from "@/components/LoadingState";
import { getAllWordHistories, recordAnswer } from "@/lib/storage";
import type { MasteryStatus } from "@/lib/types";
import { WORDS } from "@/lib/words";

const FILTERS: { value: MasteryStatus | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "fragile", label: "レベルアップ待ち" },
  { value: "learning", label: "学習中" },
  { value: "new", label: "未着手" },
];

export default function FlashcardsPage() {
  const [historyMap, setHistoryMap] = useState<Map<string, MasteryStatus> | null>(null);
  const [filter, setFilter] = useState<MasteryStatus | "all">("all");
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    const histories = getAllWordHistories();
    setHistoryMap(new Map(histories.map((h) => [h.wordId, h.masteryStatus])));
  }, []);

  const deck = useMemo(() => {
    if (!historyMap) return [];
    if (filter === "all") return WORDS;
    return WORDS.filter((w) => (historyMap.get(w.id) ?? "new") === filter);
  }, [historyMap, filter]);

  useEffect(() => {
    setIndex(0);
    setFlipped(false);
  }, [filter]);

  if (!historyMap) {
    return <LoadingState message="カードを準備しています…" />;
  }

  const word = deck[index];

  function goNext() {
    setFlipped(false);
    setIndex((i) => Math.min(i + 1, deck.length - 1));
  }

  function goPrev() {
    setFlipped(false);
    setIndex((i) => Math.max(i - 1, 0));
  }

  function markKnown(known: boolean) {
    if (!word) return;
    recordAnswer({ wordId: word.id, correct: known });
    goNext();
  }

  return (
    <main className="flex flex-col gap-5 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-ink/40" aria-label="ホームに戻る">
          ← ホーム
        </Link>
        <p className="text-xs text-ink/40">
          {deck.length > 0 ? index + 1 : 0} / {deck.length}
        </p>
      </div>

      <header>
        <h1 className="text-2xl font-extrabold text-ink">暗記カード</h1>
        <p className="mt-1 text-sm text-ink/60">カードをタップすると意味が表示されます。</p>
      </header>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            onClick={() => setFilter(f.value)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
              (filter === f.value
                ? "border-primary bg-primary text-white"
                : "border-ink/15 bg-white/70 text-ink/60")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {word ? (
        <>
          <FlashCard word={word} flipped={flipped} onFlip={() => setFlipped((f) => !f)} />

          <div className="flex gap-3">
            <button
              type="button"
              onClick={goPrev}
              disabled={index === 0}
              className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-medium text-ink/70 disabled:opacity-30"
            >
              ← 前へ
            </button>
            <button
              type="button"
              onClick={goNext}
              disabled={index >= deck.length - 1}
              className="flex-1 rounded-full border border-ink/15 py-3 text-sm font-medium text-ink/70 disabled:opacity-30"
            >
              次へ →
            </button>
          </div>

          {flipped && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => markKnown(false)}
                className="flex-1 rounded-full bg-weakSoft py-3 text-sm font-semibold text-weak"
              >
                まだ覚えていない
              </button>
              <button
                type="button"
                onClick={() => markKnown(true)}
                className="flex-1 rounded-full bg-successSoft py-3 text-sm font-semibold text-success"
              >
                覚えた
              </button>
            </div>
          )}
        </>
      ) : (
        <p className="py-10 text-center text-sm text-ink/40">該当する単語はありません。</p>
      )}
    </main>
  );
}
