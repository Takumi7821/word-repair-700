type Props = { score: number };

const ACCENT_HEX = "#1f6f5c";

export function ReadyGauge({ score }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-accent/20 bg-accentSoft/60 p-4">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full">
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `conic-gradient(${ACCENT_HEX} ${score * 3.6}deg, rgba(31,111,92,0.15) 0deg)`,
          }}
        />
        <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-paper">
          <span className="text-lg font-extrabold text-accent">{score}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-accent">700 READY</p>
        <p className="text-xs text-ink/60">習得度と正答率から算出した到達度の目安です</p>
      </div>
    </div>
  );
}
