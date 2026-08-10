import type { MasteryStatus, Word, WordHistory } from "@/lib/types";

const STATUS_LABEL: Record<MasteryStatus, string> = {
  new: "未着手",
  learning: "学習中",
  fragile: "レベルアップ待ち",
  repaired: "レベルアップ済み",
  mastered: "習得済み",
};

const STATUS_CLASS: Record<MasteryStatus, string> = {
  new: "bg-ink/5 text-ink/50",
  learning: "bg-primarySoft text-primary",
  fragile: "bg-weakSoft text-weak",
  repaired: "bg-levelupSoft text-levelup",
  mastered: "bg-primary text-white",
};

export type WordRow = { word: Word; history: WordHistory };

export function WordListTable({ rows }: { rows: WordRow[] }) {
  if (rows.length === 0) {
    return <p className="py-10 text-center text-sm text-ink/40">該当する単語はありません。</p>;
  }
  return (
    <ul className="divide-y divide-ink/8">
      {rows.map(({ word, history }) => (
        <li key={word.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="truncate font-semibold text-ink">{word.word}</p>
            <p className="truncate text-xs text-ink/50">{word.meaningJa}</p>
          </div>
          <span
            className={
              "shrink-0 rounded-full px-2.5 py-1 font-display text-[11px] font-bold " +
              STATUS_CLASS[history.masteryStatus]
            }
          >
            {STATUS_LABEL[history.masteryStatus]}
          </span>
        </li>
      ))}
    </ul>
  );
}
