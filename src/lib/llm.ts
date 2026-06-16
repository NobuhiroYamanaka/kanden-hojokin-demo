import type { ChatMessage, ChatResponse, MatchResult, UserProfile } from "./types";

const baseUrl = import.meta.env.VITE_API_BASE_URL ?? "";

export interface LlmApi {
  chat(messages: ChatMessage[]): Promise<ChatResponse>;
  match(profile: UserProfile): Promise<MatchResult>;
}

export function createServerLlmApi(): LlmApi {
  return {
    async chat(messages) {
      const res = await fetch(`${baseUrl}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
      });
      if (!res.ok) {
        // フォールバック：通信エラー時はとりあえず質問を続ける形にする
        return {
          type: "question",
          question:
            "（通信エラーが発生しました）もう一度お話を伺えますか？お住まいの市区町村を教えてください。",
          profileSoFar: {
            cityCode: null,
            cityName: null,
            childAges: null,
            themes: [],
            otherConditions: null,
          },
        };
      }
      return (await res.json()) as ChatResponse;
    },

    async match(profile) {
      const res = await fetch(`${baseUrl}/api/match`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) {
        return { ok: false, errors: ["EE_NETWORK"], hitCount: 0, matches: [] };
      }
      return (await res.json()) as MatchResult;
    },
  };
}

export const llmApi: LlmApi = createServerLlmApi();
