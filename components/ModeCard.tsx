import Link from "next/link";

type Props = {
  href: string;
  title: string;
  description: string;
  badge?: string;
  featured?: boolean;
};

export function ModeCard({ href, title, description, badge, featured }: Props) {
  return (
    <Link
      href={href}
      className={
        "block rounded-2xl border p-4 transition-transform active:scale-[0.98] " +
        (featured
          ? "border-primary/20 bg-gradient-to-br from-primary to-primaryDark text-white shadow-lg shadow-primary/30"
          : "border-ink/8 bg-white/80 text-ink hover:border-primary/25")
      }
    >
      <div className="flex items-center justify-between gap-2">
        <p className={"font-display text-sm font-bold " + (featured ? "text-white" : "text-ink")}>
          {title}
        </p>
        {badge && (
          <span
            className={
              "shrink-0 rounded-full px-2 py-0.5 font-display text-[10px] font-bold uppercase tracking-wide " +
              (featured ? "bg-white/20 text-white" : "bg-primarySoft text-primary")
            }
          >
            {badge}
          </span>
        )}
      </div>
      <p className={"mt-1.5 text-xs leading-relaxed " + (featured ? "text-white/80" : "text-ink/50")}>
        {description}
      </p>
    </Link>
  );
}
