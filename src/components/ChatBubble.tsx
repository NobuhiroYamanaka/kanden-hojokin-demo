type Props = {
  role: "user" | "assistant";
  children: React.ReactNode;
};

export default function ChatBubble({ role, children }: Props) {
  const isUser = role === "user";
  return (
    <div className={"flex " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed " +
          (isUser
            ? "bg-ink-900 text-white"
            : "bg-ink-100 text-ink-900 border border-ink-300")
        }
      >
        {children}
      </div>
    </div>
  );
}
