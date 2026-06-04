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

export type Region = {
  prefectureName: string;
  cityName: string;
  cityCode: string;
};
