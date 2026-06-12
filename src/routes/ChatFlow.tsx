import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBubble from "../components/ChatBubble";
import { llmApi } from "../lib/llm";
import type { ChatMessage, UserProfile } from "../lib/types";

type DisplayMessage = ChatMessage;

const OPENING_QUESTION =
  "こんにちは。あなたに最適な子育て支援補助金を見つけるため、いくつか質問させていただきます。まず、お住まいの市区町村を教えてください（例: 東京都新宿区）。";

const EMPTY_PROFILE: UserProfile = {
  cityCode: null,
  cityName: null,
  childAges: null,
  themes: [],
  otherConditions: null,
};

export default function ChatFlow() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<DisplayMessage[]>([
    { role: "assistant", content: OPENING_QUESTION },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searching, setSearching] = useState(false);
  const [done, setDone] = useState(false);
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [error, setError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  // LLM 応答後（送信が完了し、入力可能な状態に戻ったタイミング）に入力欄へフォーカス
  useEffect(() => {
    if (!sending && !done && !searching) {
      inputRef.current?.focus();
    }
  }, [sending, done, searching]);

  // 初回マウント時にも入力欄へフォーカス
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  async function send() {
    if (!input.trim() || sending || done) return;
    setError(null);
    const userMsg: DisplayMessage = { role: "user", content: input.trim() };
    const baseMessages = [...messages, userMsg];
    setMessages(baseMessages);
    setInput("");
    setSending(true);
    try {
      const resp = await llmApi.chat(baseMessages);
      if (resp.type === "ready") {
        setProfile(resp.profile);
        setMessages([
          ...baseMessages,
          { role: "assistant", content: resp.message },
        ]);
        setDone(true);
        setSending(false);
        setSearching(true);

        // セッションストレージにプロフィールを保存
        try {
          sessionStorage.setItem("hojokin_profile", JSON.stringify(resp.profile));
        } catch {
          /* noop */
        }

        // チャット画面内で match API を呼び、結果を取得してから遷移する
        try {
          const matchResult = await llmApi.match(resp.profile);
          try {
            sessionStorage.setItem(
              "hojokin_match_result",
              JSON.stringify(matchResult)
            );
          } catch {
            /* noop */
          }
        } catch (e) {
          console.error("[ChatFlow] match failed:", e);
          // 失敗しても遷移は続ける（Result 画面で fallback 取得が走る）
        }

        const cc = resp.profile.cityCode;
        const params = new URLSearchParams();
        if (cc) params.set("cityCode", cc);
        params.set("source", "chat");
        navigate(`/result?${params.toString()}`);
        return;
      } else {
        setProfile(resp.profileSoFar);
        setMessages([...baseMessages, { role: "assistant", content: resp.question }]);
      }
    } catch (e: any) {
      console.error(e);
      setError("通信エラーが発生しました。少し時間をおいて再度お試しください。");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-sm text-ink-500">じっくり相談</div>
      <h1 className="text-xl font-semibold text-ink-900 mt-2">
        ご家庭の状況をお聞きします
      </h1>

      <div className="mt-6 space-y-3">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role}>
            {m.content}
          </ChatBubble>
        ))}
        {sending && (
          <ChatBubble role="assistant">
            <span className="inline-block animate-pulse text-ink-500">考え中…</span>
          </ChatBubble>
        )}
        {searching && (
          <ChatBubble role="assistant">
            <div className="flex items-center gap-2 text-ink-700">
              <svg
                className="animate-spin h-4 w-4 text-emerald-600"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                />
              </svg>
              <span>条件にマッチする補助金を検索しています…少々お待ちください</span>
            </div>
          </ChatBubble>
        )}
        <div ref={bottomRef} />
      </div>

      {error && (
        <div className="mt-4 rounded-md border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-6 flex gap-2">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) send();
          }}
          placeholder={
            searching
              ? "検索中です…"
              : done
              ? "検索結果に移動します…"
              : "入力してください"
          }
          disabled={sending || done || searching}
          className="flex-1 rounded-md border border-ink-300 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-ink-700 disabled:bg-ink-100"
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim() || sending || done || searching}
          className="rounded-md bg-ink-900 px-5 py-2 text-sm text-white disabled:bg-ink-300"
        >
          送信
        </button>
      </div>

      <p className="mt-6 text-xs text-ink-500 leading-relaxed">
        ヒアリング中の情報: {profile.cityName ? `自治体=${profile.cityName}` : "自治体未確定"} /
        {" "}
        {profile.childAges ? `お子様=${profile.childAges}` : "お子様情報未確定"} /
        {" "}
        テーマ={profile.themes.length > 0 ? profile.themes.join("・") : "未確定"}
      </p>

      <div className="mt-6 flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate("/childcare")}
          className="text-sm text-ink-500 hover:text-ink-900"
        >
          ← 戻る
        </button>
      </div>
    </div>
  );
}
