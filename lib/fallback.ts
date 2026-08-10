// Deterministic, offline diagnosis + summary generation used whenever the Gemini API is
// unavailable (no key configured, network error, timeout, or malformed response). This keeps
// the app fully usable end-to-end without ever exposing the failure to the learner.

import { getTopMistakeType } from "./storage";
import {
  ERROR_TYPE_LABEL_JA,
  type DiagnoseRequest,
  type DiagnosisResult,
  type ErrorType,
  type PartOfSpeech,
  type SummaryRequest,
  type Word,
} from "./types";

const POS_LABEL_JA: Record<PartOfSpeech, string> = {
  noun: "名詞",
  verb: "動詞",
  adjective: "形容詞",
  adverb: "副詞",
  phrase: "熟語",
};

const GENERIC_TEMPLATES: Record<PartOfSpeech, string[]> = {
  verb: [
    "Management decided to ___ the plan after further review.",
    "The team will ___ the results at next week's meeting.",
    "Staff are required to ___ the report before Friday.",
  ],
  noun: [
    "The ___ was mentioned several times during the presentation.",
    "Please include the ___ in your next status update.",
    "The client asked about the ___ during the call.",
  ],
  adjective: [
    "The proposal looked ___ compared to last year's version.",
    "Investors found the strategy ___ during the review.",
    "The results were considered ___ by the committee.",
  ],
  adverb: [
    "The team completed the task ___, as expected.",
    "Sales figures improved ___ after the campaign launched.",
    "The report was submitted ___ before the deadline.",
  ],
  phrase: [
    "The department relies on the ___ to stay on track.",
    "Everyone referred to the ___ during the discussion.",
    "The manager highlighted the ___ in the summary.",
  ],
};

function shuffleFour(
  correct: string,
  distractors: readonly string[]
): [string, string, string, string] {
  const arr = [correct, ...distractors];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = arr[i] as string;
    arr[i] = arr[j] as string;
    arr[j] = tmp;
  }
  return arr as [string, string, string, string];
}

function pickRepairSentence(word: Word): string {
  const templates = GENERIC_TEMPLATES[word.partOfSpeech];
  const candidates = templates.filter((t) => t !== word.blankSentence);
  const pool = candidates.length > 0 ? candidates : templates;
  return pool[Math.floor(Math.random() * pool.length)] ?? word.blankSentence;
}

function determineErrorType(request: DiagnoseRequest, word: Word): ErrorType {
  const wasMissedRecently = request.recentMistakes.some((m) => m.word === word.word);
  if (wasMissedRecently) return "memory_slip";
  if (!word.distractors.includes(request.userAnswer)) return "vocabulary_gap";
  return word.distractorType;
}

function buildDiagnosisText(errorType: ErrorType, word: Word, userAnswer: string): string {
  const correct = word.word;
  switch (errorType) {
    case "part_of_speech":
      return `「${userAnswer}」は品詞が異なり、この文の位置には合いません。正解の「${correct}」は${POS_LABEL_JA[word.partOfSpeech]}として使われる点を意識しましょう。`;
    case "confusion":
      return `「${userAnswer}」と「${correct}」は形や意味が近く混同しやすい単語です。文脈の中でどちらが自然かを見比べてみましょう。`;
    case "context_gap":
      return `「${correct}」の意味は理解できていますが、この文脈での使い方がまだ定着していません。前後のつながりを意識して読み直してみましょう。`;
    case "memory_slip":
      return `以前は正解できていた「${correct}」ですが、記憶が少し薄れているようです。今のうちにもう一度定着させましょう。`;
    case "vocabulary_gap":
    default:
      return `「${correct}」（${word.meaningJa}）自体の記憶がまだ定着していないようです。意味とスペルをセットで覚え直しましょう。`;
  }
}

function buildKeyInsight(errorType: ErrorType, word: Word): string {
  const correct = word.word;
  switch (errorType) {
    case "part_of_speech":
      return `${correct}は${POS_LABEL_JA[word.partOfSpeech]}。文中の役割に合わせて語形を選び分けましょう。`;
    case "confusion":
      return `似た単語はスペルの違いに注目すると区別しやすくなります。`;
    case "context_gap":
      return `意味を知っていても、ビジネス文脈での使われ方には注意が必要です。`;
    case "memory_slip":
      return `一度覚えた単語も反復しないと記憶は薄れます。短い間隔での復習が効果的です。`;
    case "vocabulary_gap":
    default:
      return `${correct}の意味は「${word.meaningJa}」。まず意味から確実に覚えましょう。`;
  }
}

export function fallbackDiagnosis(request: DiagnoseRequest, word: Word): DiagnosisResult {
  const errorType = determineErrorType(request, word);
  return {
    errorType,
    diagnosis: buildDiagnosisText(errorType, word, request.userAnswer),
    keyInsight: buildKeyInsight(errorType, word),
    businessExample: {
      english: word.exampleSentence,
      japanese: word.exampleTranslationJa,
    },
    repairQuestion: {
      sentence: pickRepairSentence(word),
      choices: shuffleFour(word.word, word.distractors),
      correctAnswer: word.word,
    },
  };
}

export function fallbackSummary(request: SummaryRequest): string {
  const total = request.sessionCorrect + request.sessionIncorrect;
  const topType = getTopMistakeType(request.errorTypeCounts);
  const topLabel = topType ? ERROR_TYPE_LABEL_JA[topType] : null;
  const mistakeWords = request.mistakes.slice(0, 2).map((m) => m.word).join("、");

  const parts: string[] = [`今日は${total}問中${request.sessionCorrect}問正解でした。`];
  if (request.repairedCount > 0) {
    parts.push(`${request.repairedCount}件の弱点をレベルアップ問題で突破できました。`);
  }
  if (topLabel && mistakeWords) {
    parts.push(`特に${mistakeWords}などで${topLabel}が目立ちました。`);
  }
  parts.push(`700 READYは${request.readyScore}%です。次回も同じ弱点を意識して取り組みましょう。`);
  return parts.join("");
}
