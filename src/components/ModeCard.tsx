import { Link } from "react-router-dom";

type Props = {
  to?: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
  disabled?: boolean;
  status?: string; // 例: "利用可能" / "準備中"
};

export default function ModeCard({
  to,
  icon,
  title,
  subtitle,
  description,
  disabled = false,
  status,
}: Props) {
  const inner = (
    <div className="flex items-start gap-4">
      <div className={"text-3xl " + (disabled ? "opacity-50" : "")} aria-hidden>
        {icon}
      </div>
      <div className="flex-1">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-lg font-semibold text-ink-900">{title}</div>
            <div className="text-sm text-ink-500 mt-0.5">{subtitle}</div>
          </div>
          {status && (
            <span
              className={
                "shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-xs " +
                (disabled
                  ? "border border-ink-300 bg-ink-100 text-ink-500"
                  : "bg-emerald-600 text-white")
              }
            >
              {status}
            </span>
          )}
        </div>
        <p className="text-sm text-ink-700 mt-3 leading-relaxed">{description}</p>
      </div>
    </div>
  );

  if (disabled) {
    return (
      <div
        aria-disabled="true"
        className="block rounded-lg border border-ink-300 bg-ink-100/40 p-6 opacity-70 cursor-not-allowed"
      >
        {inner}
      </div>
    );
  }

  return (
    <Link
      to={to ?? "/"}
      className="block rounded-lg border border-ink-300 bg-white p-6 hover:border-emerald-600 hover:shadow-sm transition-colors"
    >
      {inner}
    </Link>
  );
}
