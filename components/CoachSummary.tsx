type Props = { summary: string; isLoading: boolean };

export function CoachSummary({ summary, isLoading }: Props) {
  return (
    <div className="rounded-2xl border border-ink/8 bg-white/80 p-5 shadow-sm shadow-primary/5">
      <p className="mb-2 font-display text-xs font-bold uppercase tracking-wide text-primary/70">
        Today&apos;s Coach
      </p>
      {isLoading ? (
        <div className="space-y-2" aria-busy="true" aria-live="polite">
          <div className="h-3 w-full animate-pulse rounded bg-ink/10" />
          <div className="h-3 w-4/5 animate-pulse rounded bg-ink/10" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-ink/10" />
        </div>
      ) : (
        <p className="whitespace-pre-line text-sm leading-relaxed text-ink/80">{summary}</p>
      )}
    </div>
  );
}
