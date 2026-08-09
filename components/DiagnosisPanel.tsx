import { ERROR_TYPE_LABEL_JA, type DiagnosisResult } from "@/lib/types";

type Props = {
  diagnosis: DiagnosisResult | null;
  isLoading: boolean;
};

export function DiagnosisPanel({ diagnosis, isLoading }: Props) {
  return (
    <div className="mt-4 rounded-2xl border border-weak/30 bg-weakSoft/50 p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="rounded-full bg-weak px-2 py-0.5 text-xs font-bold uppercase tracking-wide text-white">
          WEAK FOUND
        </span>
        {diagnosis && (
          <span className="text-xs font-medium text-weak">
            {ERROR_TYPE_LABEL_JA[diagnosis.errorType]}
          </span>
        )}
      </div>

      {isLoading || !diagnosis ? (
        <div className="space-y-2" aria-live="polite" aria-busy="true">
          <div className="h-3 w-4/5 animate-pulse rounded bg-ink/10" />
          <div className="h-3 w-3/5 animate-pulse rounded bg-ink/10" />
          <p className="pt-1 text-xs text-ink/40">AIコーチが診断しています…</p>
        </div>
      ) : (
        <div className="space-y-2 text-sm text-ink/80">
          <p>{diagnosis.diagnosis}</p>
          <p className="font-medium text-ink">{diagnosis.keyInsight}</p>
          <div className="rounded-lg bg-white/60 p-2.5 text-xs text-ink/70">
            <p>{diagnosis.businessExample.english}</p>
            <p className="text-ink/50">{diagnosis.businessExample.japanese}</p>
          </div>
        </div>
      )}
    </div>
  );
}
