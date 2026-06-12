import { Router } from "express";
import { env } from "../env.js";
import { mynaSearchDetail, mynaSearchList } from "../lib/mynaClient.js";
import { mapDetailResponse, mapListResponse } from "../lib/mapMyna.js";
import { OPENAI_MODEL, getOpenAI } from "../lib/openaiClient.js";
import {
  MATCH_RESPONSE_JSON_SCHEMA,
  MATCH_SYSTEM_PROMPT,
} from "../lib/prompts.js";
import type {
  ApiErrorCode,
  MatchResult,
  MatchedSubsidy,
  SubsidyDetail,
  UserProfile,
} from "../types.js";

export const matchRouter = Router();

matchRouter.post("/", async (req, res) => {
  const profile = req.body?.profile as UserProfile | undefined;
  if (!profile || !profile.cityCode) {
    res.status(400).json({
      ok: false,
      errors: ["EE002"],
      hitCount: 0,
      matches: [],
    } satisfies MatchResult);
    return;
  }

  // キーワード組み立て：themes をそのまま渡す。空なら "子育て" を入れる
  const keyword =
    profile.themes && profile.themes.length > 0
      ? profile.themes.slice(0, 5)
      : ["子育て"];

  try {
    // Step 1: 一覧検索
    const listRaw = await mynaSearchList({
      cityCode: profile.cityCode,
      keyword,
    });
    const list = mapListResponse(profile.cityCode, listRaw);
    if (!list.ok || list.items.length === 0) {
      res.json({
        ok: list.ok,
        errors: list.errors.length > 0 ? list.errors : (["EE_NONE"] as ApiErrorCode[]),
        hitCount: list.hitCount,
        matches: [],
      } satisfies MatchResult);
      return;
    }

    // Step 2: 上位N件を並列に詳細取得
    const topN = Math.min(env.match.detailTopN, list.items.length);
    const targets = list.items.slice(0, topN);
    const details = await Promise.all(
      targets.map(async (it) => {
        const raw = await mynaSearchDetail(it.psid);
        return mapDetailResponse(profile.cityCode!, raw);
      })
    );
    const detailsFiltered = details.filter((d): d is SubsidyDetail => Boolean(d));

    if (detailsFiltered.length === 0) {
      res.json({
        ok: true,
        errors: ["EE_NONE"],
        hitCount: list.hitCount,
        matches: [],
      } satisfies MatchResult);
      return;
    }

    // Step 3: LLM にマッチ理由を生成させる
    const userBlock = {
      profile,
      candidates: detailsFiltered.map((d) => ({
        psid: d.psid,
        officialName: d.officialName,
        summary: d.summary,
        description: d.description.slice(0, 1000),
        eligibleConditions: d.eligibleConditions.slice(0, 10),
        benefitAmount: d.benefitAmount.slice(0, 400),
      })),
    };

    // LLM 呼び出しは失敗しても Myna データは返す（マッチ理由なしで表示）
    let scoreMap = new Map<string, { score: number; reason: string }>();
    let llmFailed = false;
    try {
      const client = getOpenAI();
      const completion = await client.chat.completions.create({
        model: OPENAI_MODEL,
        temperature: 0.3,
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "match_response",
            strict: true,
            schema: MATCH_RESPONSE_JSON_SCHEMA,
          },
        },
        messages: [
          { role: "system", content: MATCH_SYSTEM_PROMPT },
          { role: "user", content: JSON.stringify(userBlock) },
        ],
      });
      const raw = completion.choices[0]?.message?.content?.trim();
      if (raw) {
        try {
          const parsed = JSON.parse(raw) as {
            matches?: Array<{ psid: string; score: number; reason: string }>;
          };
          for (const m of parsed.matches ?? []) {
            scoreMap.set(m.psid, { score: m.score, reason: m.reason });
          }
        } catch (e) {
          console.error("[match] LLM returned non-JSON:", raw);
        }
      }
    } catch (e: any) {
      console.error("[match] LLM call failed, returning items without reasons:", e?.message ?? e);
      llmFailed = true;
    }

    // ヒットした全件をマッチ度（score）降順で表示する。
    // score=0（対象外）も画面には残し、ユーザーが「なぜ対象外か」の理由を読めるようにする。
    // LLMが失敗した場合は全件 score=5 でマッチ理由なしのフォールバック。
    const matched: MatchedSubsidy[] = detailsFiltered
      .map((d) => {
        const judged = scoreMap.get(d.psid);
        return {
          ...d,
          matchScore: judged?.score ?? 5,
          matchReason: judged?.reason
            ?? (llmFailed
              ? "（マッチ理由の生成に失敗したため、API取得結果のみ表示しています）"
              : "（このカードは判定対象に含まれませんでした）"),
        };
      })
      .sort((a, b) => b.matchScore - a.matchScore);

    res.json({
      ok: true,
      errors: matched.length === 0 ? (["EE_NONE"] as ApiErrorCode[]) : [],
      hitCount: list.hitCount,
      matches: matched,
    } satisfies MatchResult);
  } catch (e: any) {
    console.error("[match] error", e);
    res.status(502).json({
      ok: false,
      errors: ["EE_NETWORK"],
      hitCount: 0,
      matches: [],
    } satisfies MatchResult);
  }
});
