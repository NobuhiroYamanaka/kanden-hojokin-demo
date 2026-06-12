import cors from "cors";
import express from "express";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { env } from "./env.js";
import { chatRouter } from "./routes/chat.js";
import { matchRouter } from "./routes/match.js";
import { mynaRouter } from "./routes/myna.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
// 本番ビルド時は server/dist/index.js が実行され、demo-app/dist/ にフロントが配置される。
// 開発時は tsx で server/src/index.ts を実行するため、相対パスが異なる。
// どちらでも対応できるよう候補パスを2つ用意。
const FRONT_DIST_CANDIDATES = [
  join(__dirname, "../../dist"),       // 本番: server/dist/index.js から見た demo-app/dist
  join(__dirname, "../../../dist"),    // 開発: server/src/index.ts から見た demo-app/dist
];
const frontDistPath = FRONT_DIST_CANDIDATES.find((p) => existsSync(p));

const app = express();

// CORS は basic-auth より前に置く（プリフライトを認証で弾かないため）
app.use(
  cors({
    origin: env.corsOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);

// ─── ベーシック認証ミドルウェア ───
const EXPECTED_AUTH = "Basic " + Buffer.from(`${env.basicAuth.user}:${env.basicAuth.pass}`).toString("base64");
app.use((req, res, next) => {
  // プリフライトは認証不要
  if (req.method === "OPTIONS") {
    return next();
  }
  // /api/health はヘルスチェック用に認証不要
  if (req.path === "/api/health") {
    return next();
  }
  const header = req.headers.authorization;
  if (header === EXPECTED_AUTH) {
    return next();
  }
  res.setHeader("WWW-Authenticate", 'Basic realm="kanden-subsidy-demo-api", charset="UTF-8"');
  res.status(401).type("text/plain").send("Authentication required");
});

app.use(express.json({ limit: "256kb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, model: env.openai.model, mynaBase: env.myna.base });
});

app.use("/api/myna", mynaRouter);
app.use("/api/chat", chatRouter);
app.use("/api/match", matchRouter);

// ─── 本番モード: フロント dist/ を静的配信 + SPA fallback ───
// （dev時は Vite dev server がフロントを配信するためここはスキップされる）
if (frontDistPath) {
  app.use(express.static(frontDistPath));
  // React Router の SPA: /api/* 以外のパスは index.html にフォールバック
  app.get(/^(?!\/api\/).*/, (_req, res) => {
    res.sendFile(join(frontDistPath, "index.html"));
  });
}

// 共通エラーハンドラ
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("[server] unhandled", err);
  res.status(500).json({ error: "internal server error" });
});

app.listen(env.port, () => {
  console.log(`[server] listening on http://localhost:${env.port}`);
  console.log(`[server] OPENAI_MODEL=${env.openai.model}`);
  console.log(`[server] MYNA_API_BASE=${env.myna.base}`);
  console.log(`[server] BASIC_AUTH user=${env.basicAuth.user} (pass=*** length=${env.basicAuth.pass.length})`);
  if (frontDistPath) {
    console.log(`[server] serving static frontend from ${frontDistPath}`);
  } else {
    console.log(`[server] no dist/ found — API-only mode (dev mode expected: Vite serves frontend separately)`);
  }
});
