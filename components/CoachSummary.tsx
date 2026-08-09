type Props = { summary: string; isLoading: boolean };

export function CoachSummary({ summary, isLoading }: Props) {
  return (
    <div className="rounded-2xl border border-ink/10 bg-white/70 p-5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
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
