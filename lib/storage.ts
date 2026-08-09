import { WORDS } from "./words";
import {
  EMPTY_MISTAKE_PROFILE,
  type ErrorType,
  type MasteryStatus,
  type MistakeProfile,
  type SessionResult,
  type UserProfile,
  type WordHistory,
} from "./types";

const WORD_HISTORY_KEY = "wr700:wordHistory:v1";
const USER_PROFILE_KEY = "wr700:userProfile:v1";

const isBrowser = () => typeof window !== "undefined";

function readJson<T>(key: string, fallback: T): T {
  if (!isBrowser()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T): void {
  if (!isBrowser()) return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode, quota exceeded) — fail silently,
    // the session still works in-memory for the current page load.
  }
}

function defaultUserProfile(): UserProfile {
  return {
    totalSessions: 0,
    totalQuestions: 0,
    totalCorrect: 0,
    masteredWords: 0,
    repairedWords: 0,
    mistakeProfile: { ...EMPTY_MISTAKE_PROFILE },
    latestSessionResult: null,
  };
}

function defaultWordHistory(wordId: string): WordHistory {
  return {
    wordId,
    seenCount: 0,
    correctCount: 0,
    incorrectCount: 0,
    repairSuccessCount: 0,
    lastSeenAt: "",
    masteryStatus: "new",
    lastErrorType: null,
  };
}

export function getWordHistoryMap(): Record<string, WordHistory> {
  return readJson<Record<string, WordHistory>>(WORD_HISTORY_KEY, {});
}

function saveWordHistoryMap(map: Record<string, WordHistory>): void {
  writeJson(WORD_HISTORY_KEY, map);
}

export function getWordHistory(wordId: string): WordHistory {
  const map = getWordHistoryMap();
  return map[wordId] ?? defaultWordHistory(wordId);
}

export function getUserProfile(): UserProfile {
  return readJson<UserProfile>(USER_PROFILE_KEY, defaultUserProfile());
}

function saveUserProfile(profile: UserProfile): void {
  writeJson(USER_PROFILE_KEY, profile);
}

function nextMasteryStatus(
  current: MasteryStatus,
  wasCorrect: boolean,
  correctCount: number
): MasteryStatus {
  if (!wasCorrect) {
    return "fragile";
  }
  if (current === "new") return "learning";
  if (current === "fragile") return "learning";
  if (current === "learning") return correctCount >= 3 ? "mastered" : "learning";
  if (current === "repaired") return correctCount >= 2 ? "mastered" : "repaired";
  return "mastered";
}

/** Records the outcome of a single answered question for one word. */
export function recordAnswer(params: {
  wordId: string;
  correct: boolean;
  errorType?: ErrorType;
}): WordHistory {
  const { wordId, correct, errorType } = params;
  const map = getWordHistoryMap();
  const existing = map[wordId] ?? defaultWordHistory(wordId);

  const correctCount = existing.correctCount + (correct ? 1 : 0);
  const updated: WordHistory = {
    ...existing,
    seenCount: existing.seenCount + 1,
    correctCount,
    incorrectCount: existing.incorrectCount + (correct ? 0 : 1),
    lastSeenAt: new Date().toISOString(),
    masteryStatus: nextMasteryStatus(existing.masteryStatus, correct, correctCount),
    lastErrorType: correct ? existing.lastErrorType : errorType ?? existing.lastErrorType,
  };
  map[wordId] = updated;
  saveWordHistoryMap(map);

  if (!correct && errorType) {
    const profile = getUserProfile();
    profile.mistakeProfile = {
      ...profile.mistakeProfile,
      [errorType]: (profile.mistakeProfile[errorType] ?? 0) + 1,
    };
    saveUserProfile(profile);
  }

  return updated;
}

/** Marks a word as repaired after the user answers its Repair question correctly. */
export function recordRepairSuccess(wordId: string): WordHistory {
  const map = getWordHistoryMap();
  const existing = map[wordId] ?? defaultWordHistory(wordId);
  const updated: WordHistory = {
    ...existing,
    repairSuccessCount: existing.repairSuccessCount + 1,
    masteryStatus: "repaired",
  };
  map[wordId] = updated;
  saveWordHistoryMap(map);
  return updated;
}

function countByStatus(map: Record<string, WordHistory>, status: MasteryStatus): number {
  return Object.values(map).filter((h) => h.masteryStatus === status).length;
}

function countEverRepaired(map: Record<string, WordHistory>): number {
  return Object.values(map).filter((h) => h.repairSuccessCount > 0).length;
}

/** 700 READY: a gamified proxy score blending overall accuracy and vocabulary mastery depth. */
export function computeReadyScore(profile: UserProfile): number {
  const totalWords = WORDS.length;
  const masteryScore = totalWords > 0 ? profile.masteredWords / totalWords : 0;
  const accuracyScore =
    profile.totalQuestions > 0 ? profile.totalCorrect / profile.totalQuestions : 0;
  const score = masteryScore * 0.6 + accuracyScore * 0.4;
  return Math.max(0, Math.min(100, Math.round(score * 100)));
}

export function getTopMistakeType(profile: MistakeProfile): ErrorType | null {
  const entries = Object.entries(profile) as [ErrorType, number][];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  if (total === 0) return null;
  return entries.reduce((top, entry) => (entry[1] > top[1] ? entry : top))[0];
}

export function getMistakeDnaPercentages(profile: MistakeProfile): Record<ErrorType, number> {
  const entries = Object.entries(profile) as [ErrorType, number][];
  const total = entries.reduce((sum, [, count]) => sum + count, 0);
  const result = { ...EMPTY_MISTAKE_PROFILE };
  if (total === 0) return result;
  for (const [type, count] of entries) {
    result[type] = Math.round((count / total) * 100);
  }
  return result;
}

/** Persists the results of a completed session and updates the running user profile. */
export function finalizeSession(sessionResult: SessionResult): UserProfile {
  const wordMap = getWordHistoryMap();
  const profile = getUserProfile();

  profile.totalSessions += 1;
  profile.totalQuestions += sessionResult.totalQuestions;
  profile.totalCorrect += sessionResult.correctCount;
  profile.masteredWords = countByStatus(wordMap, "mastered");
  profile.repairedWords = countEverRepaired(wordMap);
  profile.latestSessionResult = sessionResult;

  saveUserProfile(profile);
  return profile;
}

/** Persists the Gemini-generated (or fallback) coach summary onto the latest session result. */
export function updateLatestSessionSummary(
  summary: string,
  source: "gemini" | "fallback"
): UserProfile {
  const profile = getUserProfile();
  if (profile.latestSessionResult) {
    profile.latestSessionResult = {
      ...profile.latestSessionResult,
      coachSummary: summary,
      coachSummarySource: source,
    };
    saveUserProfile(profile);
  }
  return profile;
}

export function getAllWordHistories(): WordHistory[] {
  const map = getWordHistoryMap();
  return WORDS.map((w) => map[w.id] ?? defaultWordHistory(w.id));
}
