import { Router } from "express";
import { OPENAI_MODEL, getOpenAI } from "../lib/openaiClient.js";
import {
  HEARING_RESPONSE_JSON_SCHEMA,
  HEARING_SYSTEM_PROMPT,
} from "../lib/prompts.js";
import { resolveCityCode } from "../lib/regionLookup.js";
import type { ChatMessage, ChatResponse, UserProfile } from "../types.js";

export const chatRouter = Router();

/** ブレースの深さを追って、最初の JSON object の終端位置 (排他、closing-brace の次) を返す。
 *  文字列リテラル内のブレースは無視する。失敗時は -1。
 */
function findEndOfFirstJSON(s: string): number {
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (escape) { escape = false; continue; }
    if (c === "\\") { escape = true; continue; }
    if (c === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (c === "{") depth++;
    else if (c === "}") {
      depth--;
      if (depth === 0) return i + 1;
    }
  }
  return -1;
}

chatRouter.post("/", async (req, res) => {
  const messages = (req.body?.messages ?? []) as ChatMessage[];
  if (!Array.isArray(messages)) {
    res.status(400).json({ error: "messages must be array" });
    return;
  }

  try {
    const client = getOpenAI();
    const completion = await client.chat.completions.create({
      model: OPENAI_MODEL,
      temperature: 0.4,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "hearing_response",
          strict: true,
          schema: HEARING_RESPONSE_JSON_SCHEMA,
        },
      },
      messages: [
        { role: "system", content: HEARING_SYSTEM_PROMPT },
        ...messages.map((m) => ({ role: m.role, content: m.content })),
      ],
    });
    const raw = completion.choices[0]?.message?.content?.trim();
    if (!raw) {
      res.status(502).json({ error: "empty LLM response" });
      return;
    }

    let parsed: any;
    try {
      parsed = JSON.parse(raw);
    } catch (e: any) {
      // 稀に LLM が JSON を2つ連結して返すケースに対する recovery
      // （strict: json_schema でも、特に長く複雑なプロンプト時に発生する）
      const firstObjEnd = findEndOfFirstJSON(raw);
      if (firstObjEnd > 0) {
        try {
          parsed = JSON.parse(raw.slice(0, firstObjEnd));
        } catch {
          console.error("[chat] LLM returned non-JSON:", raw);
          res.status(502).json({ error: "LLM returned non-JSON", detail: e?.message });
          return;
        }
      } else {
        console.error("[chat] LLM returned non-JSON:", raw);
        res.status(502).json({ error: "LLM returned non-JSON", detail: e?.message });
        return;
      }
    }

    // cityCode を補完
    const completeProfile = (p: UserProfile | null | undefined): UserProfile => ({
      cityCode: resolveCityCode(p?.cityName ?? null),
      cityName: p?.cityName ?? null,
      childAges: p?.childAges ?? null,
      themes: Array.isArray(p?.themes) ? p!.themes : [],
      otherConditions: p?.otherConditions ?? null,
    });

    let response: ChatResponse;
    if (parsed.type === "ready") {
      response = {
        type: "ready",
        message: String(parsed.message ?? "条件をもとに検索を開始します。"),
        profile: completeProfile(parsed.profile),
      };
    } else {
      response = {
        type: "question",
        question: String(parsed.question ?? "もう少しお話を伺えますか？"),
        profileSoFar: completeProfile(parsed.profileSoFar),
      };
    }
    res.json(response);
  } catch (e: any) {
    console.error("[chat] error", e);
    res.status(502).json({ error: e?.message ?? "LLM error" });
  }
});
