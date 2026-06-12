import type { Region } from "./types";
import municipalities from "../data/japan_municipalities.json";

// 既存互換: 3件のクイック選択候補（必要な箇所のために残置）
export const REGIONS: Region[] = [
  { prefectureName: "東京都", cityName: "新宿区", cityCode: "13104" },
  { prefectureName: "大阪府", cityName: "大阪市", cityCode: "27100" },
  { prefectureName: "（デモ）", cityName: "該当なしテスト用", cityCode: "EMPTY_DEMO" },
];

export type Municipality = {
  code: string;
  prefecture: string;
  city: string;
  kana?: string;
};

export const MUNICIPALITIES: Municipality[] = municipalities as Municipality[];

/** 検索文字列で前方一致／部分一致候補を返す（最大 limit 件）。
 *  - 都道府県名・市区町村名・読み（ひらがな）を対象
 *  - 完全一致 → 先頭一致 → 部分一致 の優先度
 */
export function searchMunicipalities(query: string, limit = 12): Municipality[] {
  const q = query.trim();
  if (!q) return [];

  const qLower = q.toLowerCase();

  const exact: Municipality[] = [];
  const startsWith: Municipality[] = [];
  const contains: Municipality[] = [];

  for (const m of MUNICIPALITIES) {
    const full = `${m.prefecture}${m.city}`;
    const kana = (m.kana ?? "").toLowerCase();

    if (full === q || m.city === q) {
      exact.push(m);
    } else if (
      full.startsWith(q) ||
      m.city.startsWith(q) ||
      m.prefecture.startsWith(q) ||
      kana.startsWith(qLower)
    ) {
      startsWith.push(m);
    } else if (full.includes(q) || kana.includes(qLower)) {
      contains.push(m);
    }

    if (exact.length + startsWith.length >= limit) break;
  }

  return [...exact, ...startsWith, ...contains].slice(0, limit);
}

/** cityCode → Municipality */
export function findByCityCode(code: string): Municipality | null {
  return MUNICIPALITIES.find((m) => m.code === code) ?? null;
}

// 都道府県の表示順（北から南）
const PREFECTURE_ORDER = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県",
  "岐阜県", "静岡県", "愛知県", "三重県",
  "滋賀県", "京都府", "大阪府", "兵庫県", "奈良県", "和歌山県",
  "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県",
  "福岡県", "佐賀県", "長崎県", "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

/** 47都道府県を地理順で返す */
export function listPrefectures(): string[] {
  return PREFECTURE_ORDER;
}

/** 指定都道府県の市区町村を返す（cityCode昇順） */
export function listCitiesByPrefecture(prefecture: string): Municipality[] {
  return MUNICIPALITIES
    .filter((m) => m.prefecture === prefecture)
    .sort((a, b) => a.code.localeCompare(b.code));
}
