import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ErrorBanner from "../components/ErrorBanner";
import SubsidyCard from "../components/SubsidyCard";
import { llmApi } from "../lib/llm";
import { mynaApi } from "../lib/mynaApi";
import type {
  ApiErrorCode,
  MatchResult,
  MatchedSubsidy,
  SubsidyListItem,
  UserProfile,
} from "../lib/types";

type DisplayItem = SubsidyListItem & {
  matchScore?: number;
  matchReason?: string;
};

type DisplayState = {
  ok: boolean;
  hitCount: number;
  errors: ApiErrorCode[];
  items: DisplayItem[];
  source: "chat" | "quick";
  profileSummary?: string;
};

function isMatched(item: DisplayItem): item is MatchedSubsidy & DisplayItem {
  return typeof item.matchScore === "number";
}

export default function Result() {
  const [searchParams] = useSearchParams();
  const cityCode = searchParams.get("cityCode") ?? "";
  const source = (searchParams.get("source") ?? "quick") as "chat" | "quick";
  const forcedErr = searchParams.get("err");
  const [state, setState] = useState<DisplayState | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    if (forcedErr === "403") {
      setState({
        ok: false,
        hitCount: 0,
        errors: ["EE000"],
        items: [],
        source,
      });
      setLoading(false);
      return;
    }
    if (forcedErr === "500") {
      setState({
        ok: false,
        hitCount: 0,
        errors: ["EE_NETWORK"],
        items: [],
        source,
      });
      setLoading(false);
      return;
    }

    if (source === "chat") {
      // チャット経由: セッションストレージのプロフィールから /api/match を叩く
      let profile: UserProfile | null = null;
      try {
        const raw = sessionStorage.getItem("hojokin_profile");
        if (raw) profile = JSON.parse(raw) as UserProfile;
      } catch {
        /* noop */
      }
      const usedCity = profile?.cityCode ?? cityCode;
      if (!usedCity) {
        const summary = [
          profile?.cityName,
          profile?.childAges,
          profile && profile.themes.length > 0
            ? profile.themes.join("・")
            : null,
        ]
          .filter(Boolean)
          .join(" / ");
        setState({
          ok: false,
          hitCount: 0,
          errors: ["EE002"],
          items: [],
          source,
          profileSummary: summary || undefined,
        });
        setLoading(false);
        return;
      }
      const finalProfile: UserProfile = profile ?? {
        cityCode: usedCity,
        cityName: null,
        childAges: null,
        themes: ["子育て"],
        otherConditions: null,
      };
      // cityCode が未設定なら埋める
      if (!finalProfile.cityCode) finalProfile.cityCode = usedCity;

      const summary = [
        finalProfile.cityName,
        finalProfile.childAges,
        finalProfile.themes.length > 0 ? finalProfile.themes.join("・") : null,
      ]
        .filter(Boolean)
        .join(" / ");

      const applyMatchResult = (r: MatchResult) => {
        setState({
          ok: r.ok,
          hitCount: r.hitCount,
          errors: r.errors,
          items: r.matches.map<DisplayItem>((m) => ({
            psid: m.psid,
            cityCode: m.cityCode,
            cityName: m.cityName,
            officialName: m.officialName,
            summary: m.summary,
            serviceCode: m.serviceCode,
            isEApplicable: m.isEApplicable,
            acceptStart: m.acceptStart,
            acceptEnd: m.acceptEnd,
            matchScore: m.matchScore,
            matchReason: m.matchReason,
          })),
          source: "chat",
          profileSummary: summary || undefined,
        });
        setLoading(false);
      };

      // ChatFlow 側で事前取得済みの結果があれば即時表示（API再呼出しなし）
      try {
        const cached = sessionStorage.getItem("hojokin_match_result");
        if (cached) {
          const cachedResult = JSON.parse(cached) as MatchResult;
          sessionStorage.removeItem("hojokin_match_result");
          if (!cancelled) applyMatchResult(cachedResult);
          return;
        }
      } catch {
        /* キャッシュが壊れていれば API 呼出にフォールバック */
      }

      // 直接 /result にアクセスされた場合のフォールバック: API 呼出
      llmApi.match(finalProfile).then((r: MatchResult) => {
        if (cancelled) return;
        applyMatchResult(r);
      });
    } else {
      // クイック経由: 直接 mynaApi.searchList
      // URLクエリ ?keywords=a,b,c から検索キーワードを取得（空文字なら全件取得）
      const keywordsParam = searchParams.get("keywords");
      const keyword =
        keywordsParam && keywordsParam.length > 0 ? keywordsParam.split(",") : [];
      mynaApi
        .searchList({ cityCode, keyword })
        .then((r) => {
          if (cancelled) return;
          setState({
            ok: r.ok,
            hitCount: r.hitCount,
            errors: r.errors,
            items: r.items,
            source: "quick",
          });
          setLoading(false);
        });
    }
    return () => {
      cancelled = true;
    };
  }, [cityCode, forcedErr, source]);

  const backTo = source === "chat" ? "/chat" : "/quick";

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <Link to={backTo} className="text-sm text-ink-500 hover:text-ink-900">
        ← 戻る
      </Link>
      <div className="text-sm text-ink-500 mt-3">
        検索結果 ・ {source === "chat" ? "じっくり相談" : `クイック検索`} ・ cityCode=
        {cityCode || "（未指定）"}
      </div>
      <h1 className="text-xl font-semibold text-ink-900 mt-2">
        あなたに合いそうな補助金
      </h1>

      {state?.profileSummary && (
        <div className="mt-2 text-xs text-ink-500">
          ヒアリング条件: {state.profileSummary}
        </div>
      )}

      {loading && <div className="mt-8 text-sm text-ink-500">検索中…</div>}

      {!loading && state && state.errors.includes("EE000") && (
        <ErrorBanner
          tone="warn"
          title="ただいまメンテナンス中です"
          message="一時的に検索サービスをご利用いただけません。時間をおいて再度お試しください。"
        />
      )}

      {!loading && state && state.errors.includes("EE_NETWORK") && (
        <ErrorBanner
          tone="error"
          title="通信エラーが発生しました"
          message="ネットワークの状態を確認のうえ、再度お試しください。"
        />
      )}

      {!loading && state && state.errors.includes("EE003") && (
        <ErrorBanner
          tone="info"
          title="該当が多すぎます"
          message="条件をもう少し絞ってください（例: 児童手当、医療費 など）。"
        />
      )}

      {!loading && state && state.errors.includes("EE002") && (
        <div className="mt-8 rounded-lg border border-amber-300 bg-amber-50 p-6">
          <div className="font-semibold text-ink-900">
            お住まいの自治体を特定できませんでした
          </div>
          <p className="text-sm text-ink-700 mt-2">
            {state.profileSummary ? (
              <>
                ヒアリング条件「<span className="font-medium">{state.profileSummary}</span>」
                から自治体コードを解決できませんでした。
              </>
            ) : (
              <>自治体情報が取得できませんでした。</>
            )}
            <br />
            「東京都新宿区」「大阪府豊中市」のように
            <strong>都道府県名 + 市区町村名</strong>の正式表記でもう一度お試しください。
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              to="/chat"
              className="rounded-md border border-ink-300 bg-white px-3 py-1.5 text-sm text-ink-900 hover:border-ink-700"
            >
              もう一度ヒアリング
            </Link>
            <Link
              to="/quick"
              className="rounded-md border border-ink-300 bg-white px-3 py-1.5 text-sm text-ink-900 hover:border-ink-700"
            >
              クイック検索
            </Link>
          </div>
        </div>
      )}

      {!loading && state && state.ok && state.items.length > 0 && (
        <div className="mt-6 grid gap-3">
          <div className="text-sm text-ink-500">
            {state.hitCount}件ヒット、うち{state.items.length}件をご紹介します
          </div>
          {state.items.map((s) => (
            <SubsidyCard
              key={s.psid}
              item={s}
              matchReason={isMatched(s) ? s.matchReason : undefined}
              matchScore={isMatched(s) ? s.matchScore : undefined}
            />
          ))}
        </div>
      )}

      {!loading && state && state.errors.includes("EE_NONE") && (
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
            <Link
              to="/chat"
              className="rounded-md border border-ink-300 bg-white px-3 py-1.5 text-sm text-ink-900 hover:border-ink-700"
            >
              じっくり相談する
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
