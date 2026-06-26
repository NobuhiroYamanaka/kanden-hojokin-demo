import { useState } from "react";
import { useNavigate } from "react-router-dom";
import RegionPicker from "../components/RegionPicker";

const THEMES = [
  { key: "all", label: "すべて", keywords: [] as string[] },
  { key: "childcare", label: "子育て支援", keywords: ["子育て", "保育", "児童"] },
  { key: "medical", label: "医療", keywords: ["医療", "健康", "病院"] },
  { key: "education", label: "教育", keywords: ["教育", "学校", "学習"] },
  { key: "housing", label: "住まい", keywords: ["住宅", "住まい", "家賃"] },
] as const;

export default function QuickFlow() {
  const navigate = useNavigate();
  const [cityCode, setCityCode] = useState<string | null>(null);
  const [theme, setTheme] = useState<string>("all");

  const canSubmit = Boolean(cityCode && theme);

  function submit() {
    if (!canSubmit) return;
    const selected = THEMES.find((t) => t.key === theme);
    const params = new URLSearchParams({
      cityCode: cityCode!,
      theme,
      keywords: selected ? selected.keywords.join(",") : "",
      source: "quick",
    });
    navigate(`/result?${params.toString()}`);
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-xl font-semibold text-ink-900">
        条件を選んで補助金を検索する
      </h1>
      <p className="mt-1 text-sm text-ink-700">
        地域とテーマを選ぶだけで、お住まいの自治体の補助金一覧が見られます。
      </p>

      {/* ───── Section 1: 地域選択 ───── */}
      <section className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
            1
          </span>
          <h2 className="text-base font-semibold text-ink-900">
            地域を選んでください
          </h2>
          <span className="ml-1 inline-flex items-center rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-medium text-white">
            必須
          </span>
        </div>
        <p className="mt-2 text-xs text-ink-700 leading-relaxed">
          市区町村名は全角で入力してください。ひらがな読みでも検索できます。
          ご利用の自治体が一覧に無い場合は別の自治体でお試しください（マイナポータル検証環境のデータ整備状況に依存します）。
        </p>

        <div className="mt-4 rounded-md bg-white p-4">
          <RegionPicker value={cityCode} onChange={setCityCode} />
        </div>
      </section>

      {/* ───── Section 2: テーマ選択 ───── */}
      <section className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-5">
        <div className="flex items-center gap-2">
          <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
            2
          </span>
          <h2 className="text-base font-semibold text-ink-900">
            テーマを選んでください
          </h2>
        </div>
        <p className="mt-2 text-xs text-ink-700">
          テーマを選んでください。検証環境のデータ範囲によっては、テーマによって検索結果が0件になる場合があります。
        </p>

        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {THEMES.map((t) => {
            const selected = theme === t.key;
            return (
              <button
                key={t.key}
                type="button"
                onClick={() => setTheme(t.key)}
                className={
                  "rounded-md border bg-white px-4 py-3 text-left transition-colors " +
                  (selected
                    ? "border-emerald-600 bg-emerald-50 text-ink-900"
                    : "border-ink-300 text-ink-900 hover:border-ink-700")
                }
              >
                <div className="text-sm font-medium">{t.label}</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ───── 結果を見るボタン ───── */}
      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/childcare")}
          className="text-sm text-ink-500 hover:text-ink-900"
        >
          ← 戻る
        </button>
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="rounded-md bg-emerald-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:bg-ink-300"
        >
          結果を見る →
        </button>
      </div>
    </div>
  );
}
