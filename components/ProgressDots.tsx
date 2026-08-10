import { Fragment } from "react";

export type DotStatus = "correct" | "incorrect" | "current" | "upcoming";
export type DotKind = "normal" | "repair" | "transfer";
export type DotItem = { status: DotStatus; kind: DotKind };

// Level-up checkpoints render as a diamond, transfer as a ringed circle, everything
// else as a plain circle — so the path itself communicates what kind of stop it is.
function nodeShapeClass(kind: DotKind): string {
  return kind === "repair" ? "rotate-45 rounded-[2px]" : "rounded-full";
}

function nodeColorClass(status: DotStatus): string {
  switch (status) {
    case "correct":
      return "border-success bg-success";
    case "incorrect":
      return "border-weak bg-weak";
    case "current":
      return "border-primary bg-primary";
    case "upcoming":
    default:
      return "border-ink/15 bg-white";
  }
}

function isResolved(status: DotStatus): boolean {
  return status === "correct" || status === "incorrect";
}

export function ProgressDots({ items }: { items: DotItem[] }) {
  const answeredCount = items.filter((i) => i.status !== "upcoming").length;
  return (
    <div
      className="flex items-center"
      role="progressbar"
      aria-valuenow={answeredCount}
      aria-valuemin={0}
      aria-valuemax={items.length}
    >
      {items.map((item, i) => (
        <Fragment key={i}>
          <div className="relative flex h-3.5 w-3.5 shrink-0 items-center justify-center">
            {item.status === "current" && (
              <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary" />
            )}
            <span
              className={
                "relative h-2.5 w-2.5 shrink-0 border-2 transition-colors " +
                nodeShapeClass(item.kind) +
                " " +
                nodeColorClass(item.status) +
                (item.kind === "transfer" ? " ring-2 ring-primary/20 ring-offset-1" : "")
              }
            />
          </div>
          {i < items.length - 1 && (
            <span
              className={
                "mx-0.5 h-[2px] flex-1 rounded-full transition-colors " +
                (isResolved(item.status) ? "bg-primary/35" : "bg-ink/10")
              }
            />
          )}
        </Fragment>
      ))}
    </div>
  );
}
