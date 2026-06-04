import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegionPicker from "../components/RegionPicker";

const THEMES = [
  { key: "childcare", label: "子育て支援", available: true },
  { key: "medical", label: "医療", available: false },
  { key: "education", label: "教育", available: false },
  { key: "housing", label: "住まい", available: false },
] as const;

export default function QuickFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2>(1);
  const [cityCode, setCityCode] = useState<string | null>(null);
  const [theme, setTheme] = useState<string | null>(null);

  function next() {
    if (step === 1 && cityCode) setStep(2);
    else if (step === 2 && theme) {
      const params = new URLSearchParams({ cityCode: cityCode!, theme });
      navigate(`/result?${params.toString()}`);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-sm text-ink-500">クイック検索 ・ ステップ {step}/2</div>
      <h1 className="text-xl font-semibold text-ink-900 mt-2">
        {step === 1 ? "お住まいの地域を選んでください" : "ご関心のテーマを選んでください"}
      </h1>

      <div className="mt-6">
        {step === 1 && <RegionPicker value={cityCode} onChange={setCityCode} />}
        {step === 2 && (
          <div className="grid gap-2 sm:grid-cols-2">
            {THEMES.map((t) => {
              const selected = theme === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  disabled={!t.available}
                  onClick={() => setTheme(t.key)}
                  className={
                    "rounded-md border px-4 py-3 text-left transition-colors " +
                    (!t.available
                      ? "border-ink-300 bg-ink-100 text-ink-500 cursor-not-allowed"
                      : selected
                      ? "border-ink-900 bg-ink-100 text-ink-900"
                      : "border-ink-300 bg-white text-ink-900 hover:border-ink-700")
                  }
                >
                  <div className="text-sm font-medium">{t.label}</div>
                  {!t.available && (
                    <div className="text-xs mt-1">Phase 2 対応予定</div>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-8 flex items-center justify-between">
        <button
          type="button"
          onClick={() => (step === 2 ? setStep(1) : navigate("/"))}
          className="text-sm text-ink-500 hover:text-ink-900"
        >
          ← 戻る
        </button>
        <button
          type="button"
          onClick={next}
          disabled={(step === 1 && !cityCode) || (step === 2 && !theme)}
          className="rounded-md bg-ink-900 px-5 py-2 text-sm text-white disabled:bg-ink-300"
        >
          {step === 1 ? "次へ" : "結果を見る"}
        </button>
      </div>
    </div>
  );
}
