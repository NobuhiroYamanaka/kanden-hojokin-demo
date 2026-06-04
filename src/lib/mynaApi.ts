import fixture from "../mocks/subsidies.fixture.json";
import type {
  ListSearchParams,
  ListSearchResult,
  SubsidyDetail,
  SubsidyListItem,
} from "./types";

export interface MynaApi {
  searchList(params: ListSearchParams): Promise<ListSearchResult>;
  searchDetail(psid: string): Promise<SubsidyDetail | null>;
}

type FixtureMap = Record<string, SubsidyDetail[]>;
const FIXTURE = fixture as FixtureMap;

function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function createMockMynaApi(): MynaApi {
  return {
    async searchList(params: ListSearchParams): Promise<ListSearchResult> {
      await delay(300);
      const items = FIXTURE[params.cityCode] ?? [];

      // 件数超過の擬似（モックではトリガしないが将来用に分岐は残す）
      if (params.keyword.length > 8) {
        return { ok: false, hitCount: 0, errors: ["EE003"], items: [] };
      }

      const filtered: SubsidyListItem[] = items.map(
        ({ psid, cityCode, cityName, officialName, summary, serviceCode, isEApplicable, acceptStart, acceptEnd }) => ({
          psid,
          cityCode,
          cityName,
          officialName,
          summary,
          serviceCode,
          isEApplicable,
          acceptStart,
          acceptEnd,
        })
      );

      return {
        ok: true,
        hitCount: filtered.length,
        errors: filtered.length === 0 ? ["EE_NONE"] : [],
        items: filtered,
      };
    },

    async searchDetail(psid: string): Promise<SubsidyDetail | null> {
      await delay(200);
      for (const list of Object.values(FIXTURE)) {
        const hit = list.find((s) => s.psid === psid);
        if (hit) return hit;
      }
      return null;
    },
  };
}

// 将来: 実サーバ実装
export function createServerMynaApi(baseUrl: string): MynaApi {
  return {
    async searchList(params) {
      const res = await fetch(`${baseUrl}/api/myna/list`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      if (!res.ok) {
        return { ok: false, hitCount: 0, errors: ["EE_NETWORK"], items: [] };
      }
      return res.json();
    },
    async searchDetail(psid) {
      const res = await fetch(
        `${baseUrl}/api/myna/detail?psid=${encodeURIComponent(psid)}`
      );
      if (!res.ok) return null;
      return res.json();
    },
  };
}

const useMock = (import.meta.env.VITE_USE_MOCK ?? "true") !== "false";
const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3001";

export const mynaApi: MynaApi = useMock
  ? createMockMynaApi()
  : createServerMynaApi(baseUrl);
