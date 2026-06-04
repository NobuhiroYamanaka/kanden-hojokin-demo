import type { Region } from "../lib/types";
import { REGIONS } from "../lib/regions";

type Props = {
  value: string | null;
  onChange: (cityCode: string) => void;
};

export default function RegionPicker({ value, onChange }: Props) {
  return (
    <div className="grid gap-2">
      {REGIONS.map((r: Region) => {
        const selected = value === r.cityCode;
        return (
          <button
            key={r.cityCode}
            type="button"
            onClick={() => onChange(r.cityCode)}
            className={
              "rounded-md border px-4 py-3 text-left transition-colors " +
              (selected
                ? "border-ink-900 bg-ink-100"
                : "border-ink-300 bg-white hover:border-ink-700")
            }
          >
            <div className="text-xs text-ink-500">{r.prefectureName}</div>
            <div className="text-sm font-medium text-ink-900">{r.cityName}</div>
            <div className="text-xs text-ink-500 mt-0.5">cityCode: {r.cityCode}</div>
          </button>
        );
      })}
    </div>
  );
}
