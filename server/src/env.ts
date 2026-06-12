import "dotenv/config";

function required(name: string): string {
  const v = process.env[name];
  if (!v) {
    throw new Error(`環境変数 ${name} が未設定です。server/.env を確認してください。`);
  }
  return v;
}

function optional(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

export const env = {
  port: Number(optional("PORT", "3001")),
  corsOrigins: optional("CORS_ORIGINS", "http://localhost:5173").split(",").map((s) => s.trim()),

  myna: {
    base: optional("MYNA_API_BASE", "https://app-st-local.oss.myna.go.jp"),
    id: required("MYNA_PROVIDER_ID"),
    password: required("MYNA_PROVIDER_PASSWORD"),
    listLimit: Number(optional("MYNA_LIST_LIMIT", "30")),
  },

  openai: {
    apiKey: required("OPENAI_API_KEY"),
    model: optional("OPENAI_MODEL", "gpt-4o-mini"),
  },

  match: {
    detailTopN: Number(optional("MATCH_DETAIL_TOP_N", "8")),
  },

  basicAuth: {
    user: optional("BASIC_AUTH_USER", "test"),
    pass: optional("BASIC_AUTH_PASS", "test"),
  },
};
