import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ChatBubble from "../components/ChatBubble";

type Message = { role: "user" | "assistant"; text: string };

const SCRIPT: { question: string; placeholder: string }[] = [
  {
    question: "こんにちは。お住まいの市区町村を教えてください（例: 東京都新宿区）。",
    placeholder: "東京都新宿区",
  },
  {
    question: "ありがとうございます。お子さまの年齢を教えてください（例: 3歳、6歳など、複数いれば全員）。",
    placeholder: "3歳",
  },
  {
    question: "ご関心のあるテーマはどれですか？（児童手当 / 医療費助成 / 保育料 / 出産関連 など、自由記述で構いません）",
    placeholder: "児童手当と医療費助成が気になります",
  },
  {
    question: "最後に、追加で考慮したい条件はありますか？（ひとり親、所得状況、特になし、など）",
    placeholder: "特になし",
  },
];

export default function ChatFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", text: SCRIPT[0].question },
  ]);
  const [input, setInput] = useState("");

  function send() {
    if (!input.trim()) return;
    const userMsg: Message = { role: "user", text: input.trim() };
    const next = step + 1;
    const newMessages: Message[] = [...messages, userMsg];

    if (next < SCRIPT.length) {
      newMessages.push({ role: "assistant", text: SCRIPT[next].question });
      setMessages(newMessages);
      setStep(next);
      setInput("");
    } else {
      newMessages.push({
        role: "assistant",
        text: "ありがとうございます。条件をもとに制度を検索しています…（デモでは新宿区の固定結果を表示します）",
      });
      setMessages(newMessages);
      setInput("");
      setTimeout(() => navigate("/result?cityCode=13104"), 1200);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-10">
      <div className="text-sm text-ink-500">じっくり相談 ・ ターン {Math.min(step + 1, SCRIPT.length)}/{SCRIPT.length}</div>
      <h1 className="text-xl font-semibold text-ink-900 mt-2">
        ご家庭の状況をお聞きします
      </h1>

      <div className="mt-6 space-y-3">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role}>
            {m.text}
          </ChatBubble>
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.nativeEvent.isComposing) send();
          }}
          placeholder={SCRIPT[step]?.placeholder ?? "入力してください"}
          className="flex-1 rounded-md border border-ink-300 bg-white px-4 py-2 text-sm text-ink-900 outline-none focus:border-ink-700"
        />
        <button
          type="button"
          onClick={send}
          disabled={!input.trim()}
          className="rounded-md bg-ink-900 px-5 py-2 text-sm text-white disabled:bg-ink-300"
        >
          送信
        </button>
      </div>

      <p className="mt-6 text-xs text-ink-500 leading-relaxed">
        ※ P0段階のため AI 応答は固定シナリオです。Phase 3（6/8〜）から OpenAI gpt-5.4-mini による動的応答に差し替えます。
      </p>
    </div>
  );
}
