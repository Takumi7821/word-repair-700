import { ERROR_TYPE_LABEL_JA, ERROR_TYPES, type ErrorType } from "@/lib/types";

type Props = { percentages: Record<ErrorType, number> };

export function MistakeDnaBars({ percentages }: Props) {
  const sorted = [...ERROR_TYPES].sort((a, b) => percentages[b] - percentages[a]);
  return (
    <div className="space-y-2.5">
      {sorted.map((type) => (
        <div key={type}>
          <div className="mb-1 flex items-center justify-between text-xs text-ink/60">
            <span>{ERROR_TYPE_LABEL_JA[type]}</span>
            <span className="font-semibold text-ink">{percentages[type]}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-ink/8">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary to-primary/70 transition-all"
              style={{ width: `${percentages[type]}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
