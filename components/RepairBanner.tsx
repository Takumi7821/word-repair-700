type Props = { message: string };

export function RepairBanner({ message }: Props) {
  return (
    <div
      role="status"
      className="mt-4 animate-repair-pop rounded-2xl border border-repair/30 bg-repairSoft p-5 text-center"
    >
      <p className="text-2xl font-extrabold tracking-wide text-repair">REPAIRED</p>
      <p className="mt-1 text-sm text-repair/80">{message}</p>
    </div>
  );
}
