// Core domain types shared between client components, API routes, and lib modules.

export const ERROR_TYPES = [
  "vocabulary_gap",
  "confusion",
  "part_of_speech",
  "context_gap",
  "memory_slip",
] as const;

export type ErrorType = (typeof ERROR_TYPES)[number];

export const MASTERY_STATUSES = [
  "new",
  "learning",
  "fragile",
  "repaired",
  "mastered",
] as const;

export type MasteryStatus = (typeof MASTERY_STATUSES)[number];

export type PartOfSpeech = "noun" | "verb" | "adjective" | "adverb" | "phrase";

/** A single headword in the 300-word TOEIC700 business vocabulary set. */
export type Word = {
  id: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  meaningJa: string;
  /** Business-context fill-in-the-blank sentence containing "___". */
  blankSentence: string;
  blankTranslationJa: string;
  /** The same sentence with the blank filled in, for review/example display. */
  exampleSentence: string;
  exampleTranslationJa: string;
  /** Three wrong choices tailored to this word (word-family forms or confusable synonyms). */
  distractors: [string, string, string];
  /** The dominant confusion category these distractors are designed to probe. */
  distractorType: Exclude<ErrorType, "vocabulary_gap" | "memory_slip">;
  theme: string;
};

/** One question instance inside an active learning session. */
export type QuestionItem = {
  id: string;
  kind: "normal" | "repair" | "transfer";
  wordId: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  meaningJa: string;
  sentence: string;
  translationJa: string;
  choices: string[];
  correctAnswer: string;
  repairMeta?: {
    sourceWordId: string;
    sourceQuestionId: string;
    errorType: ErrorType;
    diagnosisSummary: string;
  };
};

/** Structured JSON contract for Gemini's per-mistake diagnosis. */
export type DiagnosisResult = {
  errorType: ErrorType;
  diagnosis: string;
  keyInsight: string;
  businessExample: {
    english: string;
    japanese: string;
  };
  repairQuestion: {
    sentence: string;
    choices: [string, string, string, string];
    correctAnswer: string;
  };
};

export type DiagnoseRequest = {
  wordId: string;
  word: string;
  partOfSpeech: PartOfSpeech;
  meaningJa: string;
  sentence: string;
  choices: string[];
  userAnswer: string;
  correctAnswer: string;
  recentMistakes: { word: string; errorType: ErrorType }[];
};

export type WordHistory = {
  wordId: string;
  seenCount: number;
  correctCount: number;
  incorrectCount: number;
  repairSuccessCount: number;
  lastSeenAt: string;
  masteryStatus: MasteryStatus;
  lastErrorType: ErrorType | null;
};

export type MistakeProfile = Record<ErrorType, number>;

export type SessionMistake = {
  wordId: string;
  word: string;
  errorType: ErrorType;
  diagnosis: string;
  wasRepaired: boolean;
};

export type SessionResult = {
  completedAt: string;
  totalQuestions: number;
  correctCount: number;
  incorrectCount: number;
  repairedCount: number;
  remainingWeakCount: number;
  readyScore: number;
  mistakeDnaTop: ErrorType | null;
  sessionMistakeProfile: MistakeProfile;
  previousMistakeProfile: MistakeProfile;
  previousMasteredWords: number;
  mistakes: SessionMistake[];
  coachSummary: string;
  coachSummarySource: "gemini" | "fallback";
};

export type UserProfile = {
  totalSessions: number;
  totalQuestions: number;
  totalCorrect: number;
  masteredWords: number;
  repairedWords: number;
  mistakeProfile: MistakeProfile;
  latestSessionResult: SessionResult | null;
};

export type SummaryRequest = {
  sessionCorrect: number;
  sessionIncorrect: number;
  repairedCount: number;
  mistakes: SessionMistake[];
  errorTypeCounts: MistakeProfile;
  previousMistakeProfile: MistakeProfile;
  masteredWords: number;
  readyScore: number;
};

export type SummaryResult = {
  summary: string;
};

export const EMPTY_MISTAKE_PROFILE: MistakeProfile = {
  vocabulary_gap: 0,
  confusion: 0,
  part_of_speech: 0,
  context_gap: 0,
  memory_slip: 0,
};

export const ERROR_TYPE_LABEL_JA: Record<ErrorType, string> = {
  vocabulary_gap: "語彙不足",
  confusion: "類義語混同",
  part_of_speech: "品詞混同",
  context_gap: "文脈判断",
  memory_slip: "記憶の弱化",
};
