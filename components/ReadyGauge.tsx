type Props = { score: number };

const PRIMARY_HEX = "#1552d1";
const PRIMARY_TRACK = "rgba(21,82,209,0.12)";

export function ReadyGauge({ score }: Props) {
  return (
    <div className="flex items-center gap-4 rounded-2xl border border-primary/15 bg-gradient-to-br from-primarySoft to-primarySoft/40 p-4">
      <div className="relative flex h-20 w-20 shrink-0 items-center justify-center rounded-full">
        <div
          className="absolute inset-0 rounded-full transition-[background]"
          style={{
            background: `conic-gradient(${PRIMARY_HEX} ${score * 3.6}deg, ${PRIMARY_TRACK} 0deg)`,
          }}
        />
        <div className="absolute inset-1.5 flex items-center justify-center rounded-full bg-paper">
          <span className="font-display text-lg font-extrabold text-primary">{score}%</span>
        </div>
      </div>
      <div>
        <p className="font-display text-sm font-bold uppercase tracking-wide text-primary">
          700 READY
        </p>
        <p className="text-xs text-ink/60">習得度と正答率から算出した到達度の目安です</p>
      </div>
    </div>
  );
}
