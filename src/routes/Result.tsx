import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { mynaApi } from "../lib/mynaApi";
import type { ListSearchResult } from "../lib/types";
import SubsidyCard from "../components/SubsidyCard";
import ErrorBanner from "../components/ErrorBanner";

export default function Result() {
  const [searchParams] = useSearchParams();
  const cityCode = searchParams.get("cityCode") ?? "";
  const forcedErr = searchParams.get("err");
  const [result, setResult] = useState<ListSearchResult | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (forcedErr === "403") {
      setResult({ ok: false, hitCount: 0, errors: ["EE000"], items: [] });
      setLoading(false);
      return;
    }
    if (forcedErr === "500") {
      setResult({ ok: false, hitCount: 0, errors: ["EE_NETWORK"], items: [] });
      setLoading(false);
      return;
    }

    mynaApi
      .searchList({ cityCode, keyword: ["子育て"], serviceCode: "CHILDCARE" })
      .then((r) => {
        if (!cancelled) {
          setResult(r);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [cityCode, forcedErr]);

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-sm text-ink-500">
        検索結果 ・ cityCode={cityCode || "（未指定）"}
      </div>
      <h1 className="text-xl font-semibold text-ink-900 mt-2">
        該当する補助金（子育て支援）
      </h1>

      {loading && <div className="mt-8 text-sm text-ink-500">検索中…</div>}

      {!loading && result && result.errors.includes("EE000") && (
        <ErrorBanner
          tone="warn"
          title="ただいまメンテナンス中です"
          message="一時的に検索サービスをご利用いただけません。時間をおいて再度お試しください。"
        />
      )}

      {!loading && result && result.errors.includes("EE_NETWORK") && (
        <ErrorBanner
          tone="error"
          title="通信エラーが発生しました"
          message="ネットワークの状態を確認のうえ、再度お試しください。"
        />
      )}

      {!loading && result && result.errors.includes("EE003") && (
        <ErrorBanner
          tone="info"
          title="該当が多すぎます"
          message="条件をもう少し絞ってください（例: 児童手当、医療費 など）。"
        />
      )}

      {!loading && result && result.ok && result.items.length > 0 && (
        <div className="mt-6 grid gap-3">
          <div className="text-sm text-ink-500">{result.hitCount}件の制度が見つかりました</div>
          {result.items.map((s) => (
            <SubsidyCard key={s.psid} item={s} />
          ))}
        </div>
      )}

      {!loading && result && result.errors.includes("EE_NONE") && (
        <div className="mt-8 rounded-lg border border-ink-300 bg-ink-100 p-6">
          <div className="font-semibold text-ink-900">該当する制度が見つかりませんでした</div>
          <p className="text-sm text-ink-700 mt-2">
            条件を変更して再検索するか、近隣自治体・全国共通制度をご確認ください。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/quick"
              className="rounded-md border border-ink-300 bg-white px-3 py-1.5 text-sm text-ink-900 hover:border-ink-700"
            >
              条件を変えて再検索
            </Link>
            <button
              type="button"
              className="rounded-md border border-ink-300 bg-white px-3 py-1.5 text-sm text-ink-900 hover:border-ink-700"
            >
              近隣自治体を検索（準備中）
            </button>
            <button
              type="button"
              className="rounded-md border border-ink-300 bg-white px-3 py-1.5 text-sm text-ink-900 hover:border-ink-700"
            >
              全国共通の制度を見る（準備中）
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
