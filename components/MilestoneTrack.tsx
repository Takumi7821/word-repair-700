import { Fragment } from "react";
import type { MilestoneProgress } from "@/lib/milestones";

export function MilestoneTrack({ progress }: { progress: MilestoneProgress }) {
  const { allMilestones, achievedMilestones, nextMilestone, wordsUntilNext, progressPercent } =
    progress;

  return (
    <div className="rounded-2xl border border-primary/15 bg-white/70 p-5">
      <div className="mb-4 flex items-center justify-between gap-2">
        <p className="font-display text-xs font-bold uppercase tracking-wide text-primary/70">
          Milestones
        </p>
        {nextMilestone !== null ? (
          <p className="text-right text-xs text-ink/50">
            次のマイルストーンまであと
            <span className="font-display font-bold text-primary"> {wordsUntilNext} </span>語
          </p>
        ) : (
          <p className="font-display text-xs font-bold text-primary">全マイルストーン達成 🎉</p>
        )}
      </div>

      <div className="flex items-center">
        {allMilestones.map((m, i) => {
          const achieved = achievedMilestones.includes(m);
          const isNext = m === nextMilestone;
          return (
            <Fragment key={m}>
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className={
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors " +
                    (achieved
                      ? "border-primary bg-primary text-white"
                      : isNext
                        ? "border-primary bg-primarySoft"
                        : "border-ink/15 bg-white")
                  }
                >
                  {achieved && (
                    <svg viewBox="0 0 20 20" fill="none" className="h-3.5 w-3.5" aria-hidden="true">
                      <path
                        d="M4 10.5 8 14.5 16 6"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  )}
                </div>
                <span
                  className={
                    "font-display text-[10px] font-bold " +
                    (achieved || isNext ? "text-primary" : "text-ink/30")
                  }
                >
                  {m}
                </span>
              </div>
              {i < allMilestones.length - 1 && (
                <span
                  className={
                    "mx-0.5 mb-4 h-[2px] flex-1 rounded-full " +
                    (achieved ? "bg-primary/40" : "bg-ink/10")
                  }
                />
              )}
            </Fragment>
          );
        })}
      </div>

      {nextMilestone !== null && (
        <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-ink/8">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      )}
    </div>
  );
}
