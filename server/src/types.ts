// フロントエンド側 src/lib/types.ts と互換になる型定義

export type ServiceCode = "CHILDCARE";

export type ListSearchParams = {
  cityCode: string;
  keyword: string[];
  serviceCode?: ServiceCode;
  isEApplicable?: boolean;
};

export type SubsidyListItem = {
  psid: string;
  cityCode: string;
  cityName: string;
  officialName: string;
  summary: string;
  serviceCode: ServiceCode;
  isEApplicable: boolean;
  acceptStart: string | null;
  acceptEnd: string | null;
};

export type SubsidyDetail = SubsidyListItem & {
  description: string;
  eligibleConditions: string[];
  benefitAmount: string;
  contact: string;
  url?: string;
};

export type ApiErrorCode = "EE000" | "EE002" | "EE003" | "EE_NONE" | "EE_NETWORK";

export type ListSearchResult = {
  ok: boolean;
  hitCount: number;
  errors: ApiErrorCode[];
  items: SubsidyListItem[];
};

// --- LLM ヒアリング関連 ---

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type UserProfile = {
  cityCode: string | null;
  cityName: string | null;
  childAges: string | null;
  themes: string[];
  otherConditions: string | null;
};

export type ChatResponse =
  | {
      type: "question";
      question: string;
      profileSoFar: UserProfile;
    }
  | {
      type: "ready";
      message: string;
      profile: UserProfile;
    };

// --- マッチング結果 ---

export type MatchedSubsidy = SubsidyDetail & {
  matchScore: number;
  matchReason: string;
};

export type MatchResult = {
  ok: boolean;
  errors: ApiErrorCode[];
  hitCount: number;
  matches: MatchedSubsidy[];
};
