import cors from "cors";
import express from "express";
import { env } from "./env.js";
import { chatRouter } from "./routes/chat.js";
import { matchRouter } from "./routes/match.js";
import { mynaRouter } from "./routes/myna.js";

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
});
