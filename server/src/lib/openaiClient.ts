import OpenAI from "openai";
import { env } from "../env.js";

let _client: OpenAI | null = null;
export function getOpenAI(): OpenAI {
  if (!_client) {
    _client = new OpenAI({ apiKey: env.openai.apiKey });
  }
  return _client;
}

export const OPENAI_MODEL = env.openai.model;
