import { useEffect, useMemo, useRef, useState } from "react";
import {
  findByCityCode,
  listCitiesByPrefecture,
  listPrefectures,
  searchMunicipalities,
  type Municipality,
} from "../lib/regions";

type Props = {
  value: string | null;
  onChange: (cityCode: string) => void;
};

export default function RegionPicker({ value, onChange }: Props) {
  // ── (a) 入力検索方式 ───────────────────────────────
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const inputRef = useRef<HTMLDivElement>(null);

  const candidates: Municipality[] = useMemo(
    () => (query.trim() ? searchMunicipalities(query, 12) : []),
    [query]
  );

  // ── (b) ドロップダウン方式 ─────────────────────────
  const prefectures = useMemo(() => listPrefectures(), []);
  const [selectedPref, setSelectedPref] = useState<string>("");
  const cities = useMemo(
    () => (selectedPref ? listCitiesByPrefecture(selectedPref) : []),
    [selectedPref]
  );

  // 選択中の自治体
  const selected = useMemo(
    () => (value ? findByCityCode(value) : null),
    [value]
  );

  // 外側クリックで候補を閉じる
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (inputRef.current && !inputRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function pickMunicipality(m: Municipality) {
    onChange(m.code);
    setQuery("");
    setOpen(false);
    setHighlight(0);
  }

  function handleSearchClick() {
    if (candidates[0]) pickMunicipality(candidates[0]);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.nativeEvent.isComposing) return;
    if (!open && e.key !== "Enter") return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, candidates.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (candidates[highlight]) pickMunicipality(candidates[highlight]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  function handleCitySelect(code: string) {
    if (!code) return;
    onChange(code);
  }

  return (
    <div className="space-y-4">
      {/* ───────────────── (a) テキスト入力で検索 ───────────────── */}
      <div ref={inputRef} className="relative">
        <label className="block text-xs text-ink-500 mb-1">
          市区町村名・郵便番号・読みで検索（例: 大阪府豊中市 / しんじゅく / 横浜）
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={query}
            placeholder="市区町村名を入力"
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={handleKeyDown}
            className="flex-1 rounded-md border border-ink-300 bg-white px-4 py-2.5 text-sm text-ink-900 outline-none focus:border-emerald-600"
          />
          <button
            type="button"
            onClick={handleSearchClick}
            disabled={candidates.length === 0}
            className="shrink-0 rounded-md bg-emerald-600 px-4 py-2.5 text-sm text-white hover:bg-emerald-700 disabled:bg-ink-300"
          >
            地域を検索
          </button>
        </div>

        {/* 候補リスト */}
        {open && candidates.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-md border border-ink-300 bg-white shadow-md">
            {candidates.map((m, i) => {
              const active = i === highlight;
              return (
                <li
                  key={m.code}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pickMunicipality(m);
                  }}
                  onMouseEnter={() => setHighlight(i)}
                  className={
                    "cursor-pointer px-4 py-2 text-sm " +
                    (active ? "bg-ink-100" : "hover:bg-ink-100")
                  }
                >
                  <span className="text-ink-900 font-medium">
                    {m.prefecture}
                    {m.city}
                  </span>
                  <span className="ml-2 text-xs text-ink-500">{m.code}</span>
                </li>
              );
            })}
          </ul>
        )}
        {open && query && candidates.length === 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-md border border-ink-300 bg-white p-3 text-sm text-ink-500">
            該当する自治体が見つかりません
          </div>
        )}
      </div>

      {/* ───────────────── (b) 都道府県→市区町村ドロップダウン ───────────────── */}
      <div>
        <label className="block text-xs text-ink-500 mb-1">
          または 都道府県・市区町村から選択
        </label>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <select
            value={selectedPref}
            onChange={(e) => setSelectedPref(e.target.value)}
            className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-emerald-600"
          >
            <option value="">都道府県を選択</option>
            {prefectures.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
          <select
            value={value ?? ""}
            onChange={(e) => handleCitySelect(e.target.value)}
            disabled={!selectedPref}
            className="w-full rounded-md border border-ink-300 bg-white px-3 py-2 text-sm text-ink-900 outline-none focus:border-emerald-600 disabled:bg-ink-100"
          >
            <option value="">
              {selectedPref ? "市区町村を選択" : "先に都道府県を選択"}
            </option>
            {cities.map((c) => (
              <option key={c.code} value={c.code}>
                {c.city}
              </option>
            ))}
          </select>
        </div>
        {!selectedPref && (
          <div className="mt-1 text-xs text-ink-500">
            最初に、都道府県を選択してください
          </div>
        )}
      </div>

      {/* ───────────────── 選択中の表示 ───────────────── */}
      {selected && (
        <div className="rounded-md border border-emerald-300 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          選択中: <strong>{selected.prefecture}{selected.city}</strong>
          <span className="ml-2 text-xs text-emerald-700">cityCode: {selected.code}</span>
        </div>
      )}
    </div>
  );
}
