import { WORDS } from "./words";
import type { DiagnosisResult, MasteryStatus, QuestionItem, Word, WordHistory } from "./types";

export const NORMAL_QUESTION_COUNT = 8;
export const MAX_TOTAL_QUESTIONS = 10;
export const MAX_REPAIR_QUESTIONS = 3;
export const REPAIR_REINSERT_OFFSETS = [2, 3] as const;

function weightForStatus(status: MasteryStatus): number {
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

let questionIdCounter = 0;
function nextQuestionId(prefix: string): string {
  questionIdCounter += 1;
  return `${prefix}-${Date.now()}-${questionIdCounter}`;
}

function buildQuestionFromWord(word: Word, kind: "normal" | "transfer"): QuestionItem {
  return {
    id: nextQuestionId(kind),
    kind,
    wordId: word.id,
    word: word.word,
    partOfSpeech: word.partOfSpeech,
    meaningJa: word.meaningJa,
    sentence: word.blankSentence,
    translationJa: word.blankTranslationJa,
    choices: shuffle([word.word, ...word.distractors]),
    correctAnswer: word.word,
  };
}

/** Builds the initial ~9-question queue: weighted normal questions plus a final Transfer question. */
export function buildInitialQueue(histories: Record<string, WordHistory>): QuestionItem[] {
  const normalPool = weightedSample(WORDS, histories, NORMAL_QUESTION_COUNT);
  const usedIds = new Set(normalPool.map((w) => w.id));
  const transferPool = WORDS.filter((w) => !usedIds.has(w.id));
  const transferWord = weightedSample(transferPool, histories, 1)[0] ?? normalPool[0];

  const queue = normalPool.map((w) => buildQuestionFromWord(w, "normal"));
  if (transferWord) {
    queue.push(buildQuestionFromWord(transferWord, "transfer"));
  }
  return queue;
}

/** Converts Gemini's (or the fallback's) diagnosis into a queueable Repair question. */
export function buildRepairQuestionItem(
  diagnosis: DiagnosisResult,
  sourceWord: Word,
  sourceQuestionId: string
): QuestionItem {
  const rq = diagnosis.repairQuestion;
  return {
    id: nextQuestionId("repair"),
    kind: "repair",
    wordId: sourceWord.id,
    word: sourceWord.word,
    partOfSpeech: sourceWord.partOfSpeech,
    meaningJa: sourceWord.meaningJa,
    sentence: rq.sentence,
    translationJa: "",
    choices: shuffle([...rq.choices]),
    correctAnswer: rq.correctAnswer,
    repairMeta: {
      sourceWordId: sourceWord.id,
      sourceQuestionId,
      errorType: diagnosis.errorType,
      diagnosisSummary: diagnosis.keyInsight,
    },
  };
}

export function countRepairQuestions(queue: QuestionItem[]): number {
  return queue.filter((q) => q.kind === "repair").length;
}

/**
 * Schedules a Repair question 2-3 questions after the mistake, replacing a not-yet-answered
 * normal question. If no normal slot exists at that distance, it is inserted immediately after
 * the current question instead, dropping a later normal question to keep the session at ~10.
 */
export function insertRepairQuestion(
  queue: QuestionItem[],
  currentIndex: number,
  repairItem: QuestionItem
): QuestionItem[] {
  const transferIndex = queue.findIndex((q) => q.kind === "transfer");
  const lastNonTransferIndex = transferIndex === -1 ? queue.length - 1 : transferIndex - 1;

  for (const offset of REPAIR_REINSERT_OFFSETS) {
    const targetIndex = currentIndex + offset;
    if (targetIndex <= lastNonTransferIndex && queue[targetIndex]?.kind === "normal") {
      const next = [...queue];
      next[targetIndex] = repairItem;
      return next;
    }
  }

  const insertPos = currentIndex + 1;
  const next = [...queue];
  next.splice(insertPos, 0, repairItem);
  if (next.length > MAX_TOTAL_QUESTIONS) {
    for (let i = next.length - 1; i > insertPos; i--) {
      if (next[i]?.kind === "normal") {
        next.splice(i, 1);
        break;
      }
    }
  }
  return next;
}
