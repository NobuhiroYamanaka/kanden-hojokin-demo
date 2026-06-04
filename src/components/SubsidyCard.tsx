import { useState } from "react";
import type { SubsidyListItem, SubsidyDetail } from "../lib/types";
import { mynaApi } from "../lib/mynaApi";

type Props = {
  item: SubsidyListItem;
};

function formatPeriod(start: string | null, end: string | null) {
  if (!start && !end) return "通年受付";
  return `${start ?? "—"} 〜 ${end ?? "随時"}`;
}

export default function SubsidyCard({ item }: Props) {
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

  return (
    <article className="rounded-lg border border-ink-300 bg-white p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <div className="text-xs text-ink-500">{item.cityName}</div>
          <h3 className="text-base font-semibold text-ink-900 mt-1">
            {item.officialName}
          </h3>
          <p className="text-sm text-ink-700 mt-2 leading-relaxed">{item.summary}</p>
        </div>
        {item.isEApplicable && (
          <span className="shrink-0 inline-flex items-center rounded-full border border-ink-300 px-2 py-0.5 text-xs text-ink-700">
            電子申請可
          </span>
        )}
      </div>

      <div className="mt-3 text-xs text-ink-500">
        受付: {formatPeriod(item.acceptStart, item.acceptEnd)}
      </div>

      <button
        type="button"
        onClick={toggle}
        className="mt-3 text-sm text-ink-700 underline-offset-2 hover:underline"
      >
        {open ? "詳細を閉じる" : "詳細を見る"}
      </button>

      {open && (
        <div className="mt-4 border-t border-ink-300 pt-4 text-sm text-ink-700 space-y-3">
          {loading && <div className="text-ink-500">読み込み中…</div>}
          {detail && (
            <>
              <div>
                <div className="text-xs text-ink-500 mb-1">制度概要</div>
                <p className="leading-relaxed">{detail.description}</p>
              </div>
              <div>
                <div className="text-xs text-ink-500 mb-1">対象者要件</div>
                <ul className="list-disc list-inside space-y-0.5">
                  {detail.eligibleConditions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="text-xs text-ink-500 mb-1">支給額</div>
                <p>{detail.benefitAmount}</p>
              </div>
              <div>
                <div className="text-xs text-ink-500 mb-1">問い合わせ</div>
                <p>{detail.contact}</p>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
