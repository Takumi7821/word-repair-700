"use client";

type Props = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel = "キャンセル",
  danger = false,
  onConfirm,
  onCancel,
}: Props) {
  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 px-6 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl shadow-ink/10">
        <h2 id="confirm-dialog-title" className="font-display text-lg font-bold text-ink">
          {title}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-ink/60">{message}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 rounded-full border border-ink/15 py-2.5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/5"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={
              "flex-1 rounded-full py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 " +
              (danger ? "bg-weak" : "bg-primary")
            }
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
