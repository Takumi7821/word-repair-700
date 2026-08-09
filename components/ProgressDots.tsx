type DotStatus = "correct" | "incorrect" | "current" | "upcoming";
type DotKind = "normal" | "repair" | "transfer";

export type DotItem = { status: DotStatus; kind: DotKind };

export function ProgressDots({ items }: { items: DotItem[] }) {
  const answeredCount = items.filter((i) => i.status !== "upcoming").length;
  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      role="progressbar"
      aria-valuenow={answeredCount}
      aria-valuemin={0}
      aria-valuemax={items.length}
    >
      {items.map((item, i) => (
        <span
          key={i}
          className={
            "h-2 rounded-full transition-all " +
            (item.status === "current" ? "w-5 " : "w-2 ") +
            (item.kind === "repair" ? "ring-2 ring-repair/40 " : "") +
            (item.status === "correct"
              ? "bg-accent"
              : item.status === "incorrect"
                ? "bg-weak"
                : item.status === "current"
                  ? "bg-ink/70"
                  : "bg-ink/15")
          }
        />
      ))}
    </div>
  );
}
