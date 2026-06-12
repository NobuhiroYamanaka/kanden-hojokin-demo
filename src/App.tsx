import { Routes, Route, Link, useLocation } from "react-router-dom";
import Top from "./routes/Top";
import ChildcareTop from "./routes/ChildcareTop";
import QuickFlow from "./routes/QuickFlow";
import ChatFlow from "./routes/ChatFlow";
import Result from "./routes/Result";

export default function App() {
  const location = useLocation();
  const isTop = location.pathname === "/";

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-ink-300 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-lg font-semibold text-ink-900">
            関西電力 暮らしサポートAI（テスト）
          </Link>
          {!isTop && (
            <Link to="/" className="text-sm text-ink-500 hover:text-ink-900">
              AI 一覧に戻る
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Top />} />
          <Route path="/childcare" element={<ChildcareTop />} />
          <Route path="/quick" element={<QuickFlow />} />
          <Route path="/chat" element={<ChatFlow />} />
          <Route path="/result" element={<Result />} />
        </Routes>
      </main>

      <footer className="border-t border-ink-300 bg-white">
        <div className="mx-auto max-w-3xl px-6 py-3 text-xs text-ink-500">
          テスト版 ・ マイナポータルAPI連携 ・ 子育て支援1カテゴリ提供中
        </div>
      </footer>
    </div>
  );
}
