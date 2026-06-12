import { createHash } from "node:crypto";
import { env } from "../env.js";

const TIMEOUT_MS = 30_000;

export type MynaListRawItem = {
  psid: string;
  officialName: string;
  aliasName?: string;
  summary: string;
  serviceCode?: string;
  isEApplicable?: boolean;
  procedurePeriodDateFrom?: string;
  procedurePeriodDateTo?: string;
  procedurePeriodTimeFrom?: string;
  procedurePeriodTimeTo?: string;
  jurisdictionDepartment?: string;
  openStartDatetime?: string;
  openEndDatetime?: string;
  procedureVersion?: string;
  updateDateTime?: string;
};

export type MynaListResponse = {
  result: { resultName: "OK" | "NG"; errors: string[]; hitCount?: string };
  eLinkServProcInfoList?: MynaListRawItem[];
};

export type MynaDetailRawInfo = MynaListRawItem & {
  body?: string;
  target?: string;
  targetAgeFrom?: string;
  targetAgeInMonthsFrom?: string;
  targetAgeTo?: string;
  targetAgeInMonthsTo?: string;
  targetAgeCondition?: string;
  allowanceDetailBody?: string;
  allowanceDetailFinancialSupport?: string;
  allowanceDetailMaterialSupport?: string;
  usageFee?: string;
  procedureMethod?: string;
  eligiblePerson?: string;
  requirements?: string;
  contactName?: string;
  contactTelNo?: string;
  contactEmailAddress?: string;
  contactFormUrl?: string;
  contactNotes?: string;
  contactAddress?: string;
  targetArea?: string;
  relatedLinkList?: Array<{ relatedLinkUri: string; relatedLinkTitle: string }>;
  muniServLinkList?: Array<{ muniServLinkUri: string; muniServLinkTitle: string }>;
  formLinkList?: Array<{ formLinkUri: string; formLinkTitle: string }>;
};

export type MynaDetailResponse = {
  result: { resultName: "OK" | "NG"; errors: string[] };
  eLinkServProcInfo?: MynaDetailRawInfo;
};

function sha256Hex(s: string): string {
  return createHash("sha256").update(s, "utf8").digest("hex");
}

async function postJson<T>(url: string, payload: unknown): Promise<{ status: number; body: T | null; rawText: string }> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: ac.signal,
    });
    const text = await res.text();
    let parsed: T | null = null;
    try {
      parsed = JSON.parse(text) as T;
    } catch {
      parsed = null;
    }
    return { status: res.status, body: parsed, rawText: text };
  } finally {
    clearTimeout(timer);
  }
}

function authPayload() {
  return {
    id: env.myna.id,
    password: sha256Hex(env.myna.password),
  };
}

export async function mynaSearchList(params: {
  cityCode: string;
  keyword: string[];
  serviceCode?: string;
  isEApplicable?: boolean;
}): Promise<MynaListResponse> {
  const url = `${env.myna.base}/Application/api/v1/ws/eLinkServProcListSearch`;
  const payload = {
    ...authPayload(),
    cityCode: params.cityCode,
    keyword: params.keyword,
    ...(params.serviceCode ? { serviceCode: params.serviceCode } : {}),
    ...(typeof params.isEApplicable === "boolean" ? { isEApplicable: params.isEApplicable } : {}),
  };
  const { body } = await postJson<MynaListResponse>(url, payload);
  if (!body) {
    return { result: { resultName: "NG", errors: ["EE_NETWORK"], hitCount: "0" }, eLinkServProcInfoList: [] };
  }
  return body;
}

export async function mynaSearchDetail(psid: string): Promise<MynaDetailResponse> {
  const url = `${env.myna.base}/Application/api/v1/ws/eLinkServProcDetailSearch`;
  const payload = { ...authPayload(), psid };
  const { body } = await postJson<MynaDetailResponse>(url, payload);
  if (!body) {
    return { result: { resultName: "NG", errors: ["EE_NETWORK"] } };
  }
  return body;
}
