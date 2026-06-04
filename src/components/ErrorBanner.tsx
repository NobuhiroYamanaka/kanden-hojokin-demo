type Tone = "info" | "warn" | "error";

type Props = {
  tone: Tone;
  title: string;
  message: string;
};

const TONE_STYLE: Record<Tone, string> = {
  info: "border-ink-300 bg-ink-100 text-ink-900",
  warn: "border-ink-300 bg-white text-ink-900",
  error: "border-ink-700 bg-white text-ink-900",
};

export default function ErrorBanner({ tone, title, message }: Props) {
  return (
    <div className={"mt-6 rounded-lg border p-4 " + TONE_STYLE[tone]}>
      <div className="font-semibold">{title}</div>
      <p className="text-sm mt-1 leading-relaxed text-ink-700">{message}</p>
    </div>
  );
}
