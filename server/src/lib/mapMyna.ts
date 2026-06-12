import type {
  ApiErrorCode,
  ListSearchResult,
  SubsidyDetail,
  SubsidyListItem,
} from "../types.js";
import {
  type MynaDetailResponse,
  type MynaListRawItem,
  type MynaListResponse,
} from "./mynaClient.js";
import { lookupCityName, parseTargetArea } from "./regionLookup.js";

/** 仕様書のエラーコード → フロント側 ApiErrorCode へマッピング */
function mapMynaErrors(errors: string[] | undefined): ApiErrorCode[] {
  if (!errors || errors.length === 0) return [];
  const out: ApiErrorCode[] = [];
  for (const code of errors) {
    if (code === "EE000") out.push("EE000");
    else if (code === "EE002") out.push("EE002");
    else if (code === "EE003") out.push("EE003");
    else if (code === "EE_NETWORK") out.push("EE_NETWORK");
    // EE001 はサーバ障害なので汎用 EE_NETWORK 扱い
    else if (code === "EE001") out.push("EE_NETWORK");
  }
  return out;
}

/** "20260401" / "20260401134100" / "" → "2026-04-01" / null */
function formatDateMaybe(s: string | undefined): string | null {
  if (!s) return null;
  const cleaned = s.replace(/[^0-9]/g, "");
  if (cleaned.length < 8) return null;
  const y = cleaned.slice(0, 4);
  const m = cleaned.slice(4, 6);
  const d = cleaned.slice(6, 8);
  return `${y}-${m}-${d}`;
}

function getCityInfo(cityCode: string): { cityCode: string; cityName: string } {
  const hit = lookupCityName(cityCode);
  if (hit) return { cityCode, cityName: `${hit.prefecture}${hit.city}` };
  return { cityCode, cityName: cityCode };
}

export function mapListResponse(
  cityCode: string,
  raw: MynaListResponse
): ListSearchResult {
  const { cityName } = getCityInfo(cityCode);
  const errors = mapMynaErrors(raw.result?.errors);
  const ok = raw.result?.resultName === "OK";
  const items: SubsidyListItem[] = (raw.eLinkServProcInfoList ?? []).map(
    (r: MynaListRawItem) => ({
      psid: r.psid,
      cityCode,
      cityName,
      officialName: r.aliasName?.trim() || r.officialName,
      summary: r.summary ?? "",
      serviceCode: "CHILDCARE",
      isEApplicable: Boolean(r.isEApplicable),
      acceptStart: formatDateMaybe(r.procedurePeriodDateFrom),
      acceptEnd: formatDateMaybe(r.procedurePeriodDateTo),
    })
  );
  const hitCount = Number(raw.result?.hitCount ?? items.length);
  const errorsOut: ApiErrorCode[] = [...errors];
  if (ok && items.length === 0 && errorsOut.length === 0) {
    errorsOut.push("EE_NONE");
  }
  return {
    ok,
    hitCount,
    errors: errorsOut,
    items,
  };
}

function joinNonEmpty(parts: Array<string | undefined>, sep = "\n"): string {
  return parts.map((p) => (p ?? "").trim()).filter((p) => p.length > 0).join(sep);
}

/**
 * マイナポータルAPI のリッチテキスト本文に混入するマークアップトークンを整形する。
 * 残しているもの: 改行、URL（http(s)://...）、通常の日本語/英数字
 * 除去/変換するもの:
 *   - <br>, <br/>, <br /> → 改行
 *   - パイプ表記の行 |a|b|c| → "a / b / c" に変換
 *   - 行末や行頭の余分な |
 *   - |^| (rowspan継続マーク) → 改行
 *   - |<| (colspan/merge-left マーク) → 空白
 *   - セミコロン直前+URL（"テキスト;https://..."）→ "テキスト https://..."
 *   - 連続する空行を最大2行に正規化
 */
function cleanRichText(s: string | undefined): string {
  if (!s) return "";
  let out = s;

  // ── ステップ1: パイプ表のセル内 <br> を一時マーカーに退避 ──
  // （後で改行に戻す。行単位処理で <br> を改行扱いすると pipe 行が断片化するため）
  const BR_PLACEHOLDER = "BR";
  out = out.replace(/<br\s*\/?>/gi, BR_PLACEHOLDER);

  // ── ステップ2: パイプ表 cell マーカー（行構造を維持するため | に置換）──
  //   |^|  rowspan継続 → 単に | （上の行と同じ値を繰り返さず空セル扱い）
  //   |<|  colspan/merge-left → セル区切り削除して隣接結合
  //   連続する |^|^| のため固定点まで反復
  let prev: string;
  do {
    prev = out;
    out = out.replace(/\|\^\|/g, "|").replace(/\|\s*<\s*\|/g, "|");
  } while (out !== prev);

  // ── ステップ2.5: マークダウンテーブル区切り行（|:---|:---|---:|---|等）を除去 ──
  //   ハイフン・コロン・パイプ・空白のみで構成されハイフンを含む行 = 表区切り
  out = out
    .split("\n")
    .filter((line) => {
      const t = line.trim();
      if (t === "") return true;
      if (/^[|:\-\s]+$/.test(t) && t.includes("-")) return false;
      return true;
    })
    .join("\n");

  // ── ステップ3: パイプ行 |a|b|c| → "a / b / c"（行単位で処理）──
  out = out
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (t.startsWith("|") && t.endsWith("|") && t.length > 2) {
        const cells = t
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
        return cells.join(" / ");
      }
      return line;
    })
    .join("\n");

  // ── ステップ4: 退避していた <br> プレースホルダを改行に戻す ──
  out = out.split(BR_PLACEHOLDER).join("\n");

  // ── ステップ4.5: セル変換後に残った "^"単独セルを除去 ──
  //   "X / ^ / Y" → "X / Y"（rowspan継続の名残り）
  let prev2: string;
  do {
    prev2 = out;
    out = out.replace(/\s\/\s\^(?=\s\/|\s*$|\n)/g, "");
    out = out.replace(/^\^\s*\/\s*/gm, "");
  } while (out !== prev2);

  // ── ステップ5: セミコロン+URL の整形（"テキスト;https://..." → "テキスト https://..."）──
  out = out.replace(/(\S);(https?:\/\/)/g, "$1 $2");

  // ── ステップ6: 連続改行を最大2行に ──
  out = out.replace(/\n{3,}/g, "\n\n");

  return out.trim();
}

export function mapDetailResponse(
  fallbackCityCode: string,
  raw: MynaDetailResponse
): SubsidyDetail | null {
  if (raw.result?.resultName !== "OK" || !raw.eLinkServProcInfo) return null;
  const r = raw.eLinkServProcInfo;
  const area = parseTargetArea(r.targetArea);
  const cityCode = area?.code?.slice(0, 5) ?? fallbackCityCode;
  const cityName = area?.city
    ? area.city
    : getCityInfo(cityCode).cityName;

  const description = cleanRichText(joinNonEmpty([r.body, r.summary]));
  const eligibleConditions: string[] = [
    r.target,
    r.targetAgeCondition,
    r.eligiblePerson,
    r.requirements,
  ]
    .map((s) => cleanRichText(s ?? ""))
    .filter((s) => s.length > 0)
    .flatMap((s) => s.split(/\r?\n+/).map((line) => line.trim()).filter(Boolean));

  const benefitAmount = cleanRichText(
    joinNonEmpty([
      r.allowanceDetailBody,
      r.allowanceDetailFinancialSupport,
      r.allowanceDetailMaterialSupport,
      r.usageFee ? `費用: ${r.usageFee}` : undefined,
    ])
  );

  const contactParts: string[] = [];
  if (r.contactName) contactParts.push(r.contactName);
  if (r.contactTelNo) contactParts.push(`TEL: ${r.contactTelNo}`);
  if (r.contactEmailAddress) contactParts.push(`Email: ${r.contactEmailAddress}`);
  if (r.contactNotes) contactParts.push(r.contactNotes);
  if (r.jurisdictionDepartment) contactParts.push(r.jurisdictionDepartment);
  const contact = cleanRichText(contactParts.join(" / ")) || "—";

  const linkUrl =
    r.formLinkList?.[0]?.formLinkUri ||
    r.muniServLinkList?.[0]?.muniServLinkUri ||
    r.relatedLinkList?.[0]?.relatedLinkUri ||
    r.contactFormUrl ||
    undefined;

  return {
    psid: r.psid,
    cityCode,
    cityName,
    officialName: r.aliasName?.trim() || r.officialName,
    summary: r.summary ?? "",
    serviceCode: "CHILDCARE",
    isEApplicable: Boolean(r.isEApplicable),
    acceptStart: formatDateMaybe(r.procedurePeriodDateFrom),
    acceptEnd: formatDateMaybe(r.procedurePeriodDateTo),
    description: description || r.summary || "",
    eligibleConditions,
    benefitAmount: benefitAmount || "支給額の記載なし",
    contact,
    url: linkUrl,
  };
}
