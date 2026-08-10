import { WORDS } from "./words";

export const MILESTONE_STEP = 50;
export const TOTAL_WORDS = WORDS.length;

export type MilestoneProgress = {
  currentMilestone: number;
  nextMilestone: number | null;
  wordsUntilNext: number;
  progressPercent: number;
  achievedMilestones: number[];
  allMilestones: number[];
};

function buildMilestoneList(): number[] {
  const milestones: number[] = [];
  for (let m = MILESTONE_STEP; m <= TOTAL_WORDS; m += MILESTONE_STEP) {
    milestones.push(m);
  }
  return milestones;
}

export function getMilestoneProgress(masteredWords: number): MilestoneProgress {
  const allMilestones = buildMilestoneList();
  const achievedMilestones = allMilestones.filter((m) => masteredWords >= m);
  const currentMilestone = achievedMilestones[achievedMilestones.length - 1] ?? 0;
  const nextMilestone = allMilestones.find((m) => m > currentMilestone) ?? null;

  const wordsUntilNext = nextMilestone !== null ? nextMilestone - masteredWords : 0;
  const bandSize = nextMilestone !== null ? nextMilestone - currentMilestone : MILESTONE_STEP;
  const progressPercent =
    nextMilestone !== null
      ? Math.max(0, Math.min(100, Math.round(((masteredWords - currentMilestone) / bandSize) * 100)))
      : 100;

  return {
    currentMilestone,
    nextMilestone,
    wordsUntilNext,
    progressPercent,
    achievedMilestones,
    allMilestones,
  };
}

/** Returns the highest milestone threshold newly crossed between two mastered-word counts. */
export function milestoneCrossed(before: number, after: number): number | null {
  const crossed = buildMilestoneList().filter((m) => before < m && after >= m);
  return crossed.length > 0 ? (crossed[crossed.length - 1] ?? null) : null;
}
