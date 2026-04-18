import { useState, useEffect, useRef, useCallback } from "react";
import { Send } from "lucide-react";
import { fetchChatReply, type ChatMessagePayload } from "@/lib/gistLensApi";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
}

interface ChatTabProps {
  initialMessage?: string | null;
  onClearInitial?: () => void;
  /** Flattened paper text for RAG-style prompting (server-side) */
  paperContext: string;
  welcomeMessage: string;
  suggestions: string[];
}

const ChatTab = ({ initialMessage, onClearInitial, paperContext, welcomeMessage, suggestions }: ChatTabProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: welcomeMessage,
      time: "now",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const toPayload = useCallback(
    (msgs: Message[]): ChatMessagePayload[] =>
      msgs
        .filter((m) => m.id !== "1" || m.role === "user")
        .map((m) => ({
          role: m.role === "user" ? "user" : "assistant",
          text: m.text,
        })),
    []
  );

  const sendMessage = useCallback(
    async (text: string) => {
      if (!text.trim()) return;
      const userMsg: Message = { id: Date.now().toString(), role: "user", text, time: "now" };
      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setIsTyping(true);

      try {
        const history = toPayload([...messages, userMsg]);
        const reply = await fetchChatReply(paperContext || "No paper text loaded.", history, text);
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: reply,
          time: "now",
        };
        setMessages((prev) => [...prev, aiMsg]);
      } catch {
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: "ai",
          text: "Could not reach the reading assistant. Start the API (`python run.py` from the repo root) and ensure GEMINI_API_KEY is set.",
          time: "now",
        };
        setMessages((prev) => [...prev, aiMsg]);
      } finally {
        setIsTyping(false);
      }
    },
    [messages, paperContext, toPayload]
  );

  useEffect(() => {
    if (initialMessage) {
      const t = `Tell me about: "${initialMessage.slice(0, 100)}${initialMessage.length > 100 ? "..." : ""}"`;
      void sendMessage(t);
      onClearInitial?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when initialMessage appears
  }, [initialMessage]);

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="flex flex-wrap gap-1.5 px-3.5 pt-2.5 shrink-0">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => void sendMessage(s)}
            className="text-[10.5px] px-2.5 py-1.5 border border-accent-mid/20 rounded-full text-accent-dark bg-accent-light cursor-pointer whitespace-nowrap transition-all hover:bg-accent-mid/15 hover:-translate-y-px active:scale-[0.97] font-medium"
          >
            {s}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-3.5 py-3 flex flex-col gap-2.5 thin-scrollbar">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col gap-1 ${msg.role === "user" ? "items-end" : "items-start"}`}>
            <div
              className={`max-w-[88%] px-3.5 py-2.5 text-[12.5px] leading-relaxed ${
                msg.role === "user"
                  ? "bg-accent text-primary-foreground rounded-xl rounded-br-sm font-normal"
                  : "bg-surface-2 text-foreground rounded-xl rounded-bl-sm border border-border font-light"
              }`}
            >
              {msg.text}
            </div>
            <span className="text-[9px] text-text-tertiary px-1">{msg.time}</span>
          </div>
        ))}

        {isTyping && (
          <div className="flex flex-col gap-1 items-start">
            <div className="bg-surface-2 border border-border rounded-xl rounded-bl-sm px-4 py-3 flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-text-tertiary typing-dot" />
              <div className="w-2 h-2 rounded-full bg-text-tertiary typing-dot" />
              <div className="w-2 h-2 rounded-full bg-text-tertiary typing-dot" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="flex gap-2 items-center px-3.5 py-2.5 border-t border-border shrink-0 bg-surface">
        <input
          type="text"
          placeholder="Ask about the paper..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void sendMessage(input)}
          className="flex-1 py-2 px-3.5 text-[12.5px] border border-border rounded-full outline-none bg-surface-2 text-foreground transition-colors focus:border-accent-mid focus:bg-surface placeholder:text-text-tertiary font-light"
        />
        <button
          type="button"
          onClick={() => void sendMessage(input)}
          className="w-8 h-8 rounded-full bg-accent border-none cursor-pointer flex items-center justify-center shrink-0 transition-all hover:bg-accent-dark active:scale-[0.93]"
        >
          <Send className="w-3.5 h-3.5 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default ChatTab;
