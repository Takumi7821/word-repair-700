"use client";

type Props = {
  label: string;
  isSelected: boolean;
  isCorrectChoice: boolean;
  isAnswered: boolean;
  onClick: () => void;
};

export function ChoiceButton({ label, isSelected, isCorrectChoice, isAnswered, onClick }: Props) {
  let stateClass = "border-ink/15 bg-white hover:border-accent/50 hover:bg-accentSoft/40";
  if (isAnswered) {
    if (isCorrectChoice) {
      stateClass = "border-accent bg-accentSoft text-accent";
    } else if (isSelected) {
      stateClass = "border-weak bg-weakSoft text-weak";
    } else {
      stateClass = "border-ink/10 bg-white/40 text-ink/40";
    }
  } else if (isSelected) {
    stateClass = "border-accent bg-accentSoft/60";
  }

  return (
    <button
      type="button"
      disabled={isAnswered}
      onClick={onClick}
      aria-pressed={isSelected}
      className={
        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-colors disabled:cursor-default sm:text-base " +
        stateClass
      }
    >
      {label}
      {isAnswered && isCorrectChoice && (
        <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-accent">
          KNOWN
        </span>
      )}
      {isAnswered && isSelected && !isCorrectChoice && (
        <span className="ml-2 align-middle text-[10px] font-bold uppercase tracking-wide text-weak">
          WEAK FOUND
        </span>
      )}
    </button>
  );
}
