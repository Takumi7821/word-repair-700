type Props = { message: string };

export function RepairBanner({ message }: Props) {
  return (
    <div
      role="status"
      className="mt-4 animate-levelup-pop rounded-2xl border border-levelup/25 bg-levelupSoft p-5 text-center"
    >
      <p className="font-display text-2xl font-extrabold tracking-wide text-levelup">
        LEVEL UP!
      </p>
      <p className="mt-1 text-sm text-levelup/80">{message}</p>
    </div>
  );
}
