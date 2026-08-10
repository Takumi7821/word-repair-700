"use client";

import type { Word } from "@/lib/types";

type Props = {
  word: Word;
  flipped: boolean;
  onFlip: () => void;
};

export function FlashCard({ word, flipped, onFlip }: Props) {
  return (
    <div style={{ perspective: "1400px" }}>
      <div
        role="button"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? "カードの表を見る" : "カードをめくって意味を見る"}
        onClick={onFlip}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onFlip();
          }
        }}
        className="relative h-64 w-full cursor-pointer outline-none"
        style={{
          transformStyle: "preserve-3d",
          transition: "transform 500ms cubic-bezier(0.4, 0.2, 0.2, 1)",
          transform: flipped ? "rotateY(180deg)" : "rotateY(0deg)",
        }}
      >
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-ink/8 bg-white/90 p-6 text-center shadow-lg shadow-primary/10"
          style={{ backfaceVisibility: "hidden" }}
        >
          <span className="rounded-full bg-primarySoft px-2.5 py-1 font-display text-xs font-bold text-primary">
            {word.partOfSpeech}
          </span>
          <p className="font-display text-3xl font-extrabold text-ink">{word.word}</p>
          <p className="text-xs text-ink/40">タップして意味を見る</p>
        </div>

        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 rounded-3xl border border-primary/20 bg-primarySoft p-6 text-center shadow-lg shadow-primary/10"
          style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
        >
          <p className="font-display text-2xl font-extrabold text-primary">{word.meaningJa}</p>
          <div className="mt-2 text-xs leading-relaxed text-ink/70">
            <p>{word.exampleSentence}</p>
            <p className="mt-1 text-ink/50">{word.exampleTranslationJa}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
