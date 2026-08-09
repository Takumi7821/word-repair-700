"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { WordListTable, type WordRow } from "@/components/WordListTable";
import { getAllWordHistories } from "@/lib/storage";
import type { MasteryStatus } from "@/lib/types";
import { WORDS } from "@/lib/words";

const FILTERS: { value: MasteryStatus | "all"; label: string }[] = [
  { value: "all", label: "すべて" },
  { value: "fragile", label: "修復待ち" },
  { value: "learning", label: "学習中" },
  { value: "repaired", label: "修復済み" },
  { value: "mastered", label: "習得済み" },
  { value: "new", label: "未着手" },
];

export default function WordsPage() {
  const [rows, setRows] = useState<WordRow[] | null>(null);
  const [filter, setFilter] = useState<MasteryStatus | "all">("all");

  useEffect(() => {
    const histories = getAllWordHistories();
    const historyMap = new Map(histories.map((h) => [h.wordId, h]));
    setRows(
      WORDS.map((word) => ({
        word,
        history: historyMap.get(word.id) ?? {
          wordId: word.id,
          seenCount: 0,
          correctCount: 0,
          incorrectCount: 0,
          repairSuccessCount: 0,
          lastSeenAt: "",
          masteryStatus: "new",
          lastErrorType: null,
        },
      }))
    );
  }, []);

  const filteredRows = useMemo(() => {
    if (!rows) return [];
    if (filter === "all") return rows;
    return rows.filter((r) => r.history.masteryStatus === filter);
  }, [rows, filter]);

  return (
    <main className="flex flex-col gap-5 pt-4">
      <div className="flex items-center justify-between">
        <Link href="/" className="text-sm text-ink/40" aria-label="ホームに戻る">
          ← ホーム
        </Link>
        <p className="text-xs text-ink/40">{WORDS.length}語</p>
      </div>

      <header>
        <h1 className="text-2xl font-extrabold text-ink">単語帳</h1>
        <p className="mt-1 text-sm text-ink/60">TOEIC700レベルのビジネス単語300語の進捗状況です。</p>
      </header>

      <div className="flex flex-wrap gap-2" role="tablist" aria-label="習得状況で絞り込み">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            type="button"
            role="tab"
            aria-selected={filter === f.value}
            onClick={() => setFilter(f.value)}
            className={
              "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors " +
              (filter === f.value
                ? "border-ink bg-ink text-paper"
                : "border-ink/15 bg-white/70 text-ink/60")
            }
          >
            {f.label}
          </button>
        ))}
      </div>

      {rows === null ? (
        <div className="h-40 animate-pulse rounded-2xl bg-ink/5" />
      ) : (
        <div className="rounded-2xl border border-ink/10 bg-white/70 px-4">
          <WordListTable rows={filteredRows} />
        </div>
      )}
    </main>
  );
}
