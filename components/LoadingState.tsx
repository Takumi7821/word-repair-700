export function LoadingState({ message = "読み込み中…" }: { message?: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink/50"
      role="status"
      aria-live="polite"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary/20 border-t-primary" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
