import { Link } from "react-router-dom";

type Props = {
  to: string;
  icon: string;
  title: string;
  subtitle: string;
  description: string;
};

export default function ModeCard({ to, icon, title, subtitle, description }: Props) {
  return (
    <Link
      to={to}
      className="block rounded-lg border border-ink-300 bg-white p-6 hover:border-ink-700 transition-colors"
    >
      <div className="flex items-start gap-4">
        <div className="text-3xl" aria-hidden>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-lg font-semibold text-ink-900">{title}</div>
          <div className="text-sm text-ink-500 mt-0.5">{subtitle}</div>
          <p className="text-sm text-ink-700 mt-3 leading-relaxed">{description}</p>
        </div>
      </div>
    </Link>
  );
}
