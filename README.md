# 関電補助金チャットボット デモアプリ

設計プラン v1.2 / 要件確定書 v1.0 に基づくデモ実装。

## 現状ステータス（2026-06-11 時点）

- Phase: **P1**（実 OpenAI + 実マイナポータル API 接続）
- マイナポータルAPI（検証環境）疎通: ✅ 成功（HTTP 200）
- ホスト: ローカル（Vite + Express）。Replit 移植は別途検証

## 技術スタック

- フロント: Vite + React + TypeScript + Tailwind CSS、ルーティングは react-router-dom
- バック: Node.js + Express + TypeScript（`server/`）
- LLM: OpenAI ChatCompletion API（既定 `gpt-5.4-mini`、`OPENAI_MODEL` で変更可）
- 外部API: マイナポータル「外部連携制度・手続一覧／詳細検索API」(v3.41)

## ディレクトリ構造

```
demo-app/
├── README.md
├── .gitignore
├── .env.example                ← フロント側 env テンプレート
├── package.json                ← concurrently で web/server 同時起動
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── index.html
├── src/                        ← フロント
│   ├── main.tsx, App.tsx
│   ├── routes/                 (Top, QuickFlow, ChatFlow, Result)
│   ├── components/             (ModeCard, SubsidyCard, ChatBubble, RegionPicker, ErrorBanner)
│   ├── lib/                    (mynaApi.ts, llm.ts, types.ts, regions.ts)
│   ├── mocks/                  (subsidies.fixture.json — モック切替時のみ使用)
│   └── styles/                 (index.css)
└── server/                     ← バックエンド
    ├── package.json
    ├── tsconfig.json
    ├── .env.example            ← サーバ側 env テンプレート（OpenAI / Myna 認証情報）
    └── src/
        ├── index.ts            (Express scaffold)
        ├── env.ts              (環境変数 validate)
        ├── types.ts
        ├── lib/
        │   ├── mynaClient.ts   (9-1/9-2 API クライアント・SHA-256認証)
        │   ├── mapMyna.ts      (実APIレスポンス → SubsidyListItem/SubsidyDetail マッピング)
        │   ├── openaiClient.ts
        │   ├── prompts.ts      (ヒアリング・マッチング system prompt + JSON schema)
        │   └── regionLookup.ts (cityCode↔︎自治体名)
        └── routes/
            ├── myna.ts         (POST /api/myna/list, GET /api/myna/detail)
            ├── chat.ts         (POST /api/chat — LLMヒアリング)
            └── match.ts        (POST /api/match — 一覧→詳細→LLMマッチ理由)
```

## セットアップ（ローカル）

```bash
cd 07_Deliverables/demo-app

# 1. 依存インストール（フロント + サーバを postinstall で一括）
npm install

# 2. フロント側 env（公開可情報のみ）
cp .env.example .env.local
# → そのままでOK（VITE_USE_MOCK=false / VITE_API_BASE_URL=http://localhost:3001）

# 3. サーバ側 env（機密情報）
cp server/.env.example server/.env
# → server/.env を編集して OPENAI_API_KEY を入れる
#    マイナポータルの ID/PW はテンプレートに正規値を埋め込み済み

# 4. 起動（Vite + Express を並列起動）
npm run dev
```

開いたら:
- フロント: http://localhost:5173
- サーバ ヘルスチェック: http://localhost:3001/api/health

## 環境変数

### フロント (`.env.local`)

| Key | デフォルト | 説明 |
|---|---|---|
| `VITE_USE_MOCK` | `false` | true にすると `mocks/subsidies.fixture.json` で動作（API/LLM 不要） |
| `VITE_API_BASE_URL` | `http://localhost:3001` | Express サーバのベースURL |

### サーバ (`server/.env`)

| Key | デフォルト | 説明 |
|---|---|---|
| `OPENAI_API_KEY` | （要設定） | OpenAI Chat Completion 用 |
| `OPENAI_MODEL` | `gpt-5.4-mini` | 設計プラン記載のモデル。`gpt-4o-mini`, `gpt-4o` 等に変更可 |
| `MYNA_PROVIDER_ID` | （テンプレート埋込） | 民間サービス事業者ID |
| `MYNA_PROVIDER_PASSWORD` | （テンプレート埋込） | 平文PW（サーバ側で SHA-256 ハッシュ化して送信） |
| `MYNA_API_BASE` | `https://app-st-local.oss.myna.go.jp` | 検証環境ドメイン |
| `PORT` | `3001` | サーバポート |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | CORS 許可オリジン |
| `MYNA_LIST_LIMIT` | `30` | 一覧APIから取得する最大件数 |
| `MATCH_DETAIL_TOP_N` | `8` | マッチ理由生成する上位件数 |

## アーキテクチャ

```
[Browser]
  ├─ クイックモード: 地域 → テーマ → /api/myna/list → カード表示
  └─ じっくりモード: /api/chat (LLMヒアリング、4項目埋める) ────────┐
                                                                  ↓
[Express]  /api/match ─ /api/myna/list ─→ Myna 一覧検索（実API）
              │                          ↓ 上位N件
              │       /api/myna/detail ─→ Myna 詳細検索（並列）
              │                          ↓
              └────── OpenAI ───────→ マッチ理由・スコア生成 → カード表示
```

## 認証情報

- ローカル: `server/.env`（gitignore済、テンプレートは `server/.env.example`）
- Replit: Secrets で管理（`VITE_*` 以外は機密扱い）
- マスター: `_Credentials/マイナポータル申請管理_認証情報.md`（コミット禁止）

## 注意事項（CLAUDE.md 順守）

- ブラウザ側コードに `OPENAI_API_KEY` を含めない（必ず `server/` 経由）
- Replit プロジェクトは Private 固定、GitHub 公開は明示承認なしに行わない
- `_Credentials/` 配下を `demo-app/` 内にコピーしない

## 動作確認シナリオ

| 経路 | 操作 | 期待挙動 |
|---|---|---|
| クイック・正常系 | トップ → クイック → 新宿区 → 子育て | 30件前後の補助金カード表示（マッチ理由なし） |
| じっくり・正常系 | トップ → じっくり → 4項目を会話で答える | LLMが項目を順に質問→4項目揃ったら自動検索→上位N件にマッチ理由付き表示 |
| 該当なし | クイックで「該当なしテスト用」/ じっくりで実在しない自治体 | 「該当する制度が見つかりませんでした」 |
| エラー系 | URL: `/result?cityCode=13104&err=403` | メンテナンス警告バナー |
| エラー系 | URL: `/result?cityCode=13104&err=500` | 通信エラー警告 |

## トラブルシューティング

- **サーバ起動時に "OPENAI_API_KEY が未設定" エラー** → `server/.env` に有効な API キーを設定
- **403/EE000 が返る** → `server/.env` の `MYNA_PROVIDER_ID` / `MYNA_PROVIDER_PASSWORD` が正しいか、`_Credentials/...md` と照合
- **CORSエラー** → `server/.env` の `CORS_ORIGINS` を確認
- **モックで動かしたい** → `.env.local` で `VITE_USE_MOCK=true` に変更（サーバ不要、`npm run dev:web` のみで可）

---

## Replit 動作（参考、未検証）

P1 では未対応。Replit 移植時の注意：

- `npm run dev` を Run コマンドにすると Vite + Express が並列起動するが、Replit はポート1個しか公開しないため、フロントを `/api/` のみ Express 経由に振る reverse proxy 構成が必要
- Replit の egress IP を マイナポータル に追加登録する必要あり（要件確定書 §9 B1）
- Secrets には `OPENAI_API_KEY` / `MYNA_PROVIDER_*` 等、 `VITE_` を付けずに登録

詳しい移植手順は別途検証時に追記する。
