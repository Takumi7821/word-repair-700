"use client";

type Props = {
  label: string;
  isSelected: boolean;
  isCorrectChoice: boolean;
  isAnswered: boolean;
  onClick: () => void;
};

export function ChoiceButton({ label, isSelected, isCorrectChoice, isAnswered, onClick }: Props) {
  let stateClass =
    "border-ink/10 bg-white hover:border-primary/40 hover:bg-primarySoft/50 hover:-translate-y-0.5";
  if (isAnswered) {
    if (isCorrectChoice) {
      stateClass = "border-success bg-successSoft text-success shadow-sm shadow-success/10";
    } else if (isSelected) {
      stateClass = "border-weak bg-weakSoft text-weak shadow-sm shadow-weak/10";
    } else {
      stateClass = "border-ink/8 bg-white/50 text-ink/35";
    }
  } else if (isSelected) {
    stateClass = "border-primary bg-primarySoft/70";
  }

  return (
    <button
      type="button"
      disabled={isAnswered}
      onClick={onClick}
      aria-pressed={isSelected}
      className={
        "rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all duration-150 disabled:cursor-default sm:text-base " +
        stateClass
      }
    >
      {label}
      {isAnswered && isCorrectChoice && (
        <span className="ml-2 align-middle font-display text-[10px] font-bold uppercase tracking-wide text-success">
          KNOWN
        </span>
      )}
      {isAnswered && isSelected && !isCorrectChoice && (
        <span className="ml-2 align-middle font-display text-[10px] font-bold uppercase tracking-wide text-weak">
          WEAK FOUND
        </span>
      )}
    </button>
  );
}
