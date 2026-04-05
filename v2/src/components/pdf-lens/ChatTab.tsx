import { useState, useEffect, useRef } from "react";
import { Send } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "ai";
  text: string;
  time: string;
}

interface ChatTabProps {
  initialMessage?: string | null;
  onClearInitial?: () => void;
}

const suggestions = ["Summarize the paper", "Quiz me on §2", "Compare §2 & §4", "What to read next?"];

const ChatTab = ({ initialMessage, onClearInitial }: ChatTabProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "ai",
      text: "Hi! I've read the whole paper. Ask me anything — compare sections, quiz yourself, or get the big picture.",
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

  // Handle initial message from text selection
  useEffect(() => {
    if (initialMessage) {
      sendMessage(`Tell me about: "${initialMessage.slice(0, 100)}${initialMessage.length > 100 ? '...' : ''}"`);
      onClearInitial?.();
    }
  }, [initialMessage]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", text, time: "now" };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    // Simulate AI response with delay
    const aiResponses: Record<string, string> = {
      "Quiz me on §2": "Sure! Here's one: In Meridian, what does 'malleable' mean when describing an ODI? (Hint: think about who can change it and how.)",
      "Compare §2 and §4": "§2 defines what ODIs are — the pattern itself. §4 zooms into the people: developers control data, designers control visuals, end users control layout. They're related — §4 explains *who* makes ODIs malleable, which §2 introduces as a goal.",
      "Compare §2 & §4": "§2 defines what ODIs are — the pattern itself. §4 zooms into the people: developers control data, designers control visuals, end users control layout. They're related — §4 explains *who* makes ODIs malleable, which §2 introduces as a goal.",
    };

    const aiText = aiResponses[text] || "That's a great question! The paper discusses this in the context of overview-detail interfaces and their malleable properties. Would you like me to dive deeper into any specific section?";

    setTimeout(() => {
      setIsTyping(false);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "ai", text: aiText, time: "now" };
      setMessages((prev) => [...prev, aiMsg]);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 px-3.5 pt-2.5 shrink-0">
        {suggestions.map((s) => (
          <button
            key={s}
            onClick={() => sendMessage(s)}
            className="text-[10.5px] px-2.5 py-1.5 border border-accent-mid/20 rounded-full text-accent-dark bg-accent-light cursor-pointer whitespace-nowrap transition-all hover:bg-accent-mid/15 hover:-translate-y-px active:scale-[0.97] font-medium"
          >
            {s}
          </button>
        ))}
      </div>

      {/* Messages */}
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

        {/* Typing indicator */}
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

      {/* Input */}
      <div className="flex gap-2 items-center px-3.5 py-2.5 border-t border-border shrink-0 bg-surface">
        <input
          type="text"
          placeholder="Ask about the paper..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
          className="flex-1 py-2 px-3.5 text-[12.5px] border border-border rounded-full outline-none bg-surface-2 text-foreground transition-colors focus:border-accent-mid focus:bg-surface placeholder:text-text-tertiary font-light"
        />
        <button
          onClick={() => sendMessage(input)}
          className="w-8 h-8 rounded-full bg-accent border-none cursor-pointer flex items-center justify-center shrink-0 transition-all hover:bg-accent-dark active:scale-[0.93]"
        >
          <Send className="w-3.5 h-3.5 text-primary-foreground" />
        </button>
      </div>
    </div>
  );
};

export default ChatTab;
