type Props = { message: string; onRetry?: () => void };

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center gap-3 px-6 text-center"
      role="alert"
    >
      <p className="text-sm text-ink/60">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-gradient-to-b from-primary to-primaryDark px-4 py-2 text-sm font-medium text-white shadow-sm shadow-primary/30"
        >
          もう一度試す
        </button>
      )}
    </div>
  );
}
