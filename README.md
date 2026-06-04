# 関電補助金チャットボット デモアプリ

設計プラン v1.2 / 要件確定書 v1.0 に基づくデモ実装。

## 現状ステータス（2026-05-22 時点）

- Phase: **P0**（全モック、UI試作中）
- ホスト: ローカル（claude code内）。完成後に Replit へ移植
- 実API接続: 5/24 IP判定後（B1ブロッカー）

## 技術スタック

- Vite + React + TypeScript + Tailwind CSS
- ルーティング: react-router-dom
- バック（後追い）: Node.js + Express（`server/`、OpenAI/マイナAPI中継）

## ディレクトリ構造

```
demo-app/
├── README.md
├── .gitignore
├── .env.example
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── postcss.config.js
├── tsconfig.json
├── tsconfig.node.json
├── index.html
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── routes/      (Top, QuickFlow, ChatFlow, Result)
    ├── components/  (ModeCard, SubsidyCard, ChatBubble, RegionPicker, ErrorBanner)
    ├── lib/         (mynaApi.ts, llm.ts, prompts/, types.ts)
    ├── mocks/       (subsidies.fixture.json)
    └── styles/      (index.css)
```

## セットアップ手順（ユーザー承認後に実行）

```bash
cd 07_Deliverables/demo-app
npm install
npm run dev
```

→ http://localhost:5173 で起動

## 認証情報

- ローカル開発: `server/.env`（gitignore済、空の `.env.example` のみコミット）
- Replit: Secrets で管理
- マスター: `_Credentials/マイナポータル申請管理_認証情報.md`（コピー禁止、手で .env に貼る）

## 注意事項（CLAUDE.md 順守）

- ブラウザ側コードに `OPENAI_API_KEY` を含めない（必ず `server/` 経由）
- Replit プロジェクトは Private 固定、GitHub 公開は明示承認なしに行わない
- `_Credentials/` 配下を `demo-app/` 内にコピーしない

---

## Replit Workspace で動かす手順

### 前提
- Replit Teams プラン（または Core 以上、Private repo Import 可能なプラン）
- GitHub Private リポジトリ（推奨名: `dxr-kanden-subsidy-demo`）

### 1. GitHub Private リポジトリへ push（ユーザー手動）
```bash
cd 07_Deliverables/demo-app
git init
git status                                # _Credentials/ や .env が出ていないこと確認
git add .
git commit -m "Initial commit: demo app P0 with mocks"
git branch -M main
git remote add origin git@github.com:<USER>/dxr-kanden-subsidy-demo.git
git push -u origin main
```

### 2. Replit Import
1. https://replit.com/import → "Import from GitHub"
2. 初回は GitHub OAuth 認可（Private repo の scope 許可）
3. `dxr-kanden-subsidy-demo` を選択 → "Import"
4. Replit 側で `npm install` が自動実行される（60〜120秒）
5. もし `package-lock.json` 由来で optional deps エラーが出たら、Shell で `rm -rf node_modules && npm install` を実行

### 3. Replit Secrets 設定（左サイドバーの鍵アイコン）

**登録するもの（P0段階）**
| Key | Value |
|---|---|
| `VITE_USE_MOCK` | `true` |
| `VITE_API_BASE_URL` | `http://localhost:3001`（P0未使用のプレースホルダ） |

**Secrets命名規約（重要）**
- `VITE_*` プレフィックスの変数は **Viteがブラウザバンドルに literal 埋め込み** するため、ブラウザに露出する
- `OPENAI_API_KEY` 等の秘匿情報は **`VITE_` を付けずに** 登録し、`server/` プロセスからのみ参照する（サーバ実装フェーズで対応）
- 命名違反例: `VITE_OPENAI_API_KEY` → 絶対禁止

### 4. Run + 動作確認
1. Run ボタン押下 → Vite ログに `ready in XXXms` が出る
2. 右上 Webview で localhost:5173 が表示される
3. "Open in new tab" → `https://<repl>.<user>.replit.dev` を取得
4. 確認シナリオ:
   - クイック・正常系: 新宿区 → 子育て → 3件カード表示
   - じっくり・正常系: 4ターン → 結果画面遷移
   - 該当なし: クイックで「該当なしテスト用」選択 → 代替フロー
   - エラー系: `https://<repl>.<user>.replit.dev/result?cityCode=13104&err=403`

### 5. レビューURL共有運用
- Repl 自体は **Private 維持**（要件確定書 v1.0 §4.4）
- レビュアー（社内DXR）には **dev URL のみ Slack/メールで配布**
- IDE 編集が必要なメンバーのみ Collaborator 追加（Teams プランで複数名OK）
- **関電へのURL共有は社内レビュー完了後**に別途実施

### 構成ファイル

- `.replit`: Replit Run ボタンの起動コマンド・ポート設定
- `replit.nix`: Replit Nix module 定義（nodejs_20）
- `vite.config.ts` の `server.allowedHosts: [".replit.dev"]` と `hmr.clientPort: 443` で `*.replit.dev` 経由のアクセス・HMRを許可
