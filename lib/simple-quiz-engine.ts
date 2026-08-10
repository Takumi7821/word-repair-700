import { WORDS } from "./words";
import type { PartOfSpeech, Word, WordHistory } from "./types";

export type QuizDirection = "en-ja" | "ja-en";

export type SimpleQuestion = {
  id: string;
  wordId: string;
  prompt: string;
  promptPartOfSpeech: PartOfSpeech;
  choices: string[];
  correctAnswer: string;
};

function weightForStatus(status: WordHistory["masteryStatus"]): number {
  switch (status) {
    case "fragile":
      return 5;
    case "new":
      return 4;
    case "learning":
      return 3;
    case "repaired":
      return 2;
    case "mastered":
      return 1;
  }
}

/** Weighted random sample (without replacement), favoring words the learner hasn't mastered yet. */
function weightedSample(
  pool: Word[],
  histories: Record<string, WordHistory>,
  count: number
): Word[] {
  const remaining = [...pool];
  const picked: Word[] = [];
  for (let i = 0; i < count && remaining.length > 0; i++) {
    const weights = remaining.map((w) => weightForStatus(histories[w.id]?.masteryStatus ?? "new"));
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    let idx = 0;
    for (; idx < weights.length; idx++) {
      r -= weights[idx] ?? 0;
      if (r <= 0) break;
    }
    const chosenIdx = Math.min(idx, remaining.length - 1);
    const word = remaining[chosenIdx];
    if (word) picked.push(word);
    remaining.splice(chosenIdx, 1);
  }
  return picked;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i] as T;
    arr[i] = arr[j] as T;
    arr[j] = tmp;
  }
  return arr;
}

/** Picks distractor words, preferring the same part of speech so choices stay plausible. */
function pickDistractorWords(correct: Word, count: number): Word[] {
  const pool = WORDS.filter((w) => w.id !== correct.id);
  const samePos = pool.filter((w) => w.partOfSpeech === correct.partOfSpeech);
  const source = samePos.length >= count ? samePos : pool;
  return shuffle(source).slice(0, count);
}

let idCounter = 0;
function nextId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now()}-${idCounter}`;
}

/** Builds a weighted 4-choice quiz queue in either direction, no AI involved. */
export function buildSimpleQuizQueue(
  direction: QuizDirection,
  histories: Record<string, WordHistory>,
  count: number
): SimpleQuestion[] {
  const words = weightedSample(WORDS, histories, count);
  return words.map((word) => {
    const distractors = pickDistractorWords(word, 3);
    if (direction === "en-ja") {
      return {
        id: nextId("q"),
        wordId: word.id,
        prompt: word.word,
        promptPartOfSpeech: word.partOfSpeech,
        choices: shuffle([word.meaningJa, ...distractors.map((d) => d.meaningJa)]),
        correctAnswer: word.meaningJa,
      };
    }
    return {
      id: nextId("q"),
      wordId: word.id,
      prompt: word.meaningJa,
      promptPartOfSpeech: word.partOfSpeech,
      choices: shuffle([word.word, ...distractors.map((d) => d.word)]),
      correctAnswer: word.word,
    };
  });
}
