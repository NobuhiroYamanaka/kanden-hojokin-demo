// 全国地方公共団体マスター（市区町村 + 政令指定都市の区）に基づく双方向ルックアップ
// データ出典: nojimage/local-gov-code-jp (https://github.com/nojimage/local-gov-code-jp)
// 総務省「全国地方公共団体コード」をベースに 5桁形式に正規化
// total: 1918 entries (cities 1747 + wards 171)

import municipalities from "../data/japan_municipalities.json" with { type: "json" };

export type Municipality = {
  code: string;
  prefecture: string;
  city: string;
  kana?: string;
};

const ALL = municipalities as Municipality[];

// インデックス（O(1)ルックアップ用）
const BY_CODE = new Map<string, Municipality>();
const BY_FULL_NAME = new Map<string, Municipality>(); // "東京都新宿区"
const BY_CITY_NAME = new Map<string, Municipality[]>(); // "新宿区" (同名複数の可能性)

for (const m of ALL) {
  BY_CODE.set(m.code, m);
  BY_FULL_NAME.set(`${m.prefecture}${m.city}`, m);
  const list = BY_CITY_NAME.get(m.city) ?? [];
  list.push(m);
  BY_CITY_NAME.set(m.city, list);
}

/** code(5桁) → 自治体情報 */
export function lookupCityName(cityCode: string): { prefecture: string; city: string } | null {
  const m = BY_CODE.get(cityCode);
  if (!m) return null;
  return { prefecture: m.prefecture, city: m.city };
}

/** cityName（表記揺れ許容）→ cityCode(5桁)。失敗時 null。
 *  優先順位:
 *   1) 完全一致「都道府県+市区町村」（例: "東京都新宿区"）
 *   2) 含有マッチ（cityName 文字列に「都道府県+市区町村」が含まれる）
 *   3) 市区町村名のみ一致（同名複数なら最初の1件）
 */
export function resolveCityCode(cityName: string | null | undefined): string | null {
  if (!cityName) return null;
  const s = cityName.trim();
  if (!s) return null;

  // 1) 完全一致
  const exact = BY_FULL_NAME.get(s);
  if (exact) return exact.code;

  // 2) 含有マッチ（部分文字列）
  // 都道府県名と市区町村名の両方を s に含むレコードを優先
  // 全レコードスキャンになるが ALL は ~1900件なので許容
  for (const m of ALL) {
    if (s.includes(m.prefecture) && s.includes(m.city)) {
      return m.code;
    }
  }

  // 3) 市区町村名のみマッチ（"新宿区" だけ来た場合など）
  // 同名複数の場合（例: "府中市" は東京と広島の2件）は最初を返す
  // → 都道府県名のヒントが無い場合の保険。実運用ではプロンプトで都道府県も含めさせる
  const byCity = BY_CITY_NAME.get(s);
  if (byCity && byCity.length > 0) return byCity[0].code;

  // 「市」「区」「町」「村」だけ取り除いて再試行
  const trimmed = s.replace(/[市区町村]$/, "");
  if (trimmed && trimmed !== s) {
    const byCity2 = BY_CITY_NAME.get(trimmed);
    if (byCity2 && byCity2.length > 0) return byCity2[0].code;
  }

  return null;
}

/** targetArea("131041;新宿区" 形式) から都道府県・市区を取り出す。失敗時 null */
export function parseTargetArea(
  targetArea: string | undefined
): { code: string; city: string } | null {
  if (!targetArea) return null;
  const [code, city] = targetArea.split(";");
  if (!code || !city) return null;
  return { code: code.trim(), city: city.trim() };
}
