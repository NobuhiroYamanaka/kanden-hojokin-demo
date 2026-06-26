import { Fragment, useState } from "react";
import type { ReactNode } from "react";
import type { SubsidyDetail, SubsidyListItem } from "../lib/types";
import { mynaApi } from "../lib/mynaApi";

type Props = {
  item: SubsidyListItem;
  matchReason?: string;
  matchScore?: number;
};

function formatPeriod(start: string | null, end: string | null) {
  if (!start && !end) return "通年受付";
  return `${start ?? "—"} 〜 ${end ?? "随時"}`;
}

/**
 * テキスト中の URL を <a> タグでリンク化する。
 * URL は http(s):// で始まり、空白・全角文字・終端記号で区切られた範囲とみなす。
 */
function renderTextWithLinks(text: string): ReactNode {
  if (!text) return null;
  // URLは ASCII の URL-safe 文字のみとし、日本語等は含めない。
  // 末尾の句読点（,.;:）はリンクから除外（自然文の終端と URL の混同を防ぐ）
  const urlRegex = /(https?:\/\/[A-Za-z0-9\-._~:/?#@!$&'*+=%]+[A-Za-z0-9\-._~:/?#@!$&'*+=%])/g;
  const parts = text.split(urlRegex);
  return parts.map((p, i) => {
    if (i % 2 === 1) {
      return (
        <a
          key={i}
          href={p}
          target="_blank"
          rel="noreferrer"
          className="text-emerald-700 underline underline-offset-2 break-all hover:text-emerald-800"
        >
          {p}
        </a>
      );
    }
    return <Fragment key={i}>{p}</Fragment>;
  });
}

export default function SubsidyCard({ item, matchReason, matchScore }: Props) {
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<SubsidyDetail | null>(null);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    if (!open && !detail) {
      setLoading(true);
      const d = await mynaApi.searchDetail(item.psid);
      setDetail(d);
      setLoading(false);
    }
    setOpen(!open);
  }

  const isOutOfScope = matchScore === 0;
  const articleClass = isOutOfScope
    ? "rounded-lg border border-ink-300 bg-ink-100/50 p-5 opacity-70 overflow-hidden"
    : "rounded-lg border border-ink-300 bg-white p-5 overflow-hidden";

  return (
    <article className={articleClass}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="text-xs text-ink-500">{item.cityName}</div>
          <h3 className="text-base font-semibold text-ink-900 mt-1">
            {item.officialName}
          </h3>
          <p className="text-sm text-ink-700 mt-2 leading-relaxed">{item.summary}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          {isOutOfScope ? (
            <span className="shrink-0 inline-flex items-center rounded-full border border-ink-500 bg-ink-100 px-2 py-0.5 text-xs text-ink-700">
              対象外
            </span>
          ) : typeof matchScore === "number" ? (
            <span className="shrink-0 inline-flex items-center rounded-full bg-ink-900 px-2 py-0.5 text-xs text-white">
              マッチ度 {matchScore}/10
            </span>
          ) : null}
          {item.isEApplicable && (
            <span className="shrink-0 inline-flex items-center rounded-full border border-ink-300 px-2 py-0.5 text-xs text-ink-700">
              電子申請可
            </span>
          )}
        </div>
      </div>

      {matchReason && (
        <div
          className={
            isOutOfScope
              ? "mt-3 rounded-md bg-white border border-ink-300 px-3 py-2 text-sm text-ink-700"
              : "mt-3 rounded-md bg-ink-100 px-3 py-2 text-sm text-ink-900"
          }
        >
          <span className="text-xs text-ink-500 mr-1">
            {isOutOfScope ? "判定:" : "なぜあなたに合いそうか:"}
          </span>
          {matchReason}
        </div>
      )}

      <div className="mt-3 text-xs text-ink-500">
        受付: {formatPeriod(item.acceptStart, item.acceptEnd)}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-ink-300 bg-ink-100 px-3.5 py-2 text-sm font-medium text-ink-900 hover:bg-ink-200 hover:border-ink-700 transition-colors"
      >
        {open ? "詳細を閉じる" : "詳細を見る"}
        <span className={"text-xs transition-transform " + (open ? "rotate-180" : "")}>
          ∨
        </span>
      </button>

      {open && (
        <div className="mt-4 border-t border-ink-300 pt-4 text-sm text-ink-700 space-y-3">
          {loading && <div className="text-ink-500">読み込み中…</div>}
          {detail && (
            <>
              <div>
                <div className="text-xs text-ink-500 mb-1">制度概要</div>
                <p className="leading-relaxed whitespace-pre-wrap break-words">
                  {renderTextWithLinks(detail.description)}
                </p>
              </div>
              {detail.eligibleConditions.length > 0 && (
                <div>
                  <div className="text-xs text-ink-500 mb-1">対象者要件</div>
                  <ul className="list-disc list-inside space-y-0.5">
                    {detail.eligibleConditions.map((c, i) => (
                      <li key={i}>{renderTextWithLinks(c)}</li>
                    ))}
                  </ul>
                </div>
              )}
              {detail.benefitAmount && (
                <div>
                  <div className="text-xs text-ink-500 mb-1">支給内容</div>
                  <p className="whitespace-pre-wrap break-words">
                    {renderTextWithLinks(detail.benefitAmount)}
                  </p>
                </div>
              )}
              {detail.contact && detail.contact !== "—" && (
                <div>
                  <div className="text-xs text-ink-500 mb-1">問い合わせ</div>
                  <p className="whitespace-pre-wrap break-words">
                    {renderTextWithLinks(detail.contact)}
                  </p>
                </div>
              )}
              {detail.url && (
                <div>
                  <div className="text-xs text-ink-500 mb-1">関連リンク</div>
                  <a
                    href={detail.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-ink-900 underline underline-offset-2"
                  >
                    {detail.url}
                  </a>
                </div>
              )}
            </>
          )}
          {!loading && !detail && (
            <div className="text-ink-500">詳細情報が取得できませんでした。</div>
          )}
        </div>
      )}
    </article>
  );
}
