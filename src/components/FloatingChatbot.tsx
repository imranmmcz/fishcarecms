import { useState, useRef, useEffect, useCallback } from "react";
import { MessageCircle, X, Send, Bot, User, Trash2, ShoppingBag, HelpCircle, Truck, Fish } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "react-router-dom";
import ReactMarkdown from "react-markdown";

type Message = { role: "user" | "assistant"; content: string };

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chatbot`;
const STORAGE_KEY = "fishcare_chatbot_history";

// Page-aware greetings
const PAGE_GREETINGS: Record<string, string> = {
  "/": "👋 স্বাগতম FishCare এ! মাছ চাষ, অ্যাকুরিয়াম বা ফিশ ফিড নিয়ে কোনো তথ্য জানতে চান?",
  "/shop": "🛍️ কোন ধরনের ফিশ ফিড বা অ্যাকুরিয়াম পণ্য খুঁজছেন? বলুন, আমি সাজেস্ট করছি।",
  "/checkout": "🛒 অর্ডার সম্পন্ন করতে সমস্যা হচ্ছে? আমি এখনই সাহায্য করছি!",
  "/fish-advice": "🐟 মাছের স্বাস্থ্য ও চাষ পরামর্শ নিয়ে প্রশ্ন করুন!",
  "/market-price": "📊 বাজারদর নিয়ে কোনো প্রশ্ন আছে?",
  "/contact": "📞 আমাদের টিমের সাথে কথা বলতে চান? এখানেই চ্যাট করুন!",
  "/modules": "📚 মাছ চাষের টুলস ব্যবহার নিয়ে কোনো প্রশ্ন?",
  "/pond-calculator": "📐 পুকুরের মাপ ক্যালকুলেট করছেন? সাহায্য দরকার?",
  "/feed-management": "🐟 ফিড ম্যানেজমেন্ট নিয়ে জানতে চান?",
  "/medicine-application": "💊 মাছের ওষুধ প্রয়োগ নিয়ে প্রশ্ন করুন!",
  "/water-quality": "💧 পানির গুণাগুণ নিয়ে পরামর্শ নিন!",
};

// Quick reply buttons per page context
const QUICK_REPLIES: Record<string, { label: string; message: string; icon: string }[]> = {
  default: [
    { label: "পণ্য দেখুন", message: "আপনাদের জনপ্রিয় পণ্যগুলো কি কি?", icon: "shop" },
    { label: "ডেলিভারি তথ্য", message: "ডেলিভারি কতদিন লাগে?", icon: "truck" },
    { label: "মাছ চাষ পরামর্শ", message: "মাছ চাষের পরামর্শ দিন", icon: "fish" },
    { label: "সাহায্য", message: "আমার সাহায্য দরকার", icon: "help" },
  ],
  "/shop": [
    { label: "ফিশ ফিড", message: "ফিশ ফিড দেখতে চাই", icon: "fish" },
    { label: "অ্যাকুরিয়াম পণ্য", message: "অ্যাকুরিয়াম পণ্য দেখান", icon: "shop" },
    { label: "দাম জানতে চাই", message: "পণ্যের দাম কত?", icon: "help" },
    { label: "স্টক আছে?", message: "এই পণ্য স্টকে আছে?", icon: "truck" },
  ],
  "/checkout": [
    { label: "পেমেন্ট পদ্ধতি", message: "কোন কোন পেমেন্ট পদ্ধতিতে অর্ডার করা যায়?", icon: "help" },
    { label: "ডেলিভারি চার্জ", message: "ডেলিভারি চার্জ কত?", icon: "truck" },
    { label: "অর্ডার সমস্যা", message: "অর্ডার করতে সমস্যা হচ্ছে", icon: "help" },
  ],
};

const getQuickIconComponent = (icon: string) => {
  switch (icon) {
    case "shop": return <ShoppingBag className="h-3 w-3" />;
    case "truck": return <Truck className="h-3 w-3" />;
    case "fish": return <Fish className="h-3 w-3" />;
    default: return <HelpCircle className="h-3 w-3" />;
  }
};

async function streamChat({
  messages,
  currentPage,
  onDelta,
  onDone,
  onError,
}: {
  messages: Message[];
  currentPage: string;
  onDelta: (text: string) => void;
  onDone: () => void;
  onError: (msg: string) => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages, currentPage }),
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    onError(data.error || "দুঃখিত, সার্ভারে সমস্যা হয়েছে।");
    return;
  }

  if (!resp.body) { onError("Stream not available"); return; }

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let textBuffer = "";
  let streamDone = false;

  while (!streamDone) {
    const { done, value } = await reader.read();
    if (done) break;
    textBuffer += decoder.decode(value, { stream: true });

    let newlineIndex: number;
    while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
      let line = textBuffer.slice(0, newlineIndex);
      textBuffer = textBuffer.slice(newlineIndex + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || line.trim() === "") continue;
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (jsonStr === "[DONE]") { streamDone = true; break; }
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch {
        textBuffer = line + "\n" + textBuffer;
        break;
      }
    }
  }

  if (textBuffer.trim()) {
    for (let raw of textBuffer.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (raw.startsWith(":") || raw.trim() === "") continue;
      if (!raw.startsWith("data: ")) continue;
      const jsonStr = raw.slice(6).trim();
      if (jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const content = parsed.choices?.[0]?.delta?.content as string | undefined;
        if (content) onDelta(content);
      } catch { /* ignore */ }
    }
  }
  onDone();
}

const loadMessages = (): Message[] => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
};

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [autoMessageShown, setAutoMessageShown] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const location = useLocation();
  const autoTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Save messages
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto-open after 20s idle
  useEffect(() => {
    if (isOpen || autoMessageShown) return;
    autoTimerRef.current = setTimeout(() => {
      if (!isOpen && !autoMessageShown) {
        setShowPulse(true);
        setAutoMessageShown(true);
      }
    }, 20000);
    return () => clearTimeout(autoTimerRef.current);
  }, [isOpen, autoMessageShown, location.pathname]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

  // Get greeting based on current page
  const getGreeting = useCallback(() => {
    const path = location.pathname;
    // Check exact match first
    if (PAGE_GREETINGS[path]) return PAGE_GREETINGS[path];
    // Check if product page
    if (path.startsWith("/product/")) return "🔍 এই পণ্য সম্পর্কে কিছু জানতে চান?";
    // Check category
    if (path.startsWith("/category/")) return "📂 এই ক্যাটাগরির পণ্য সম্পর্কে প্রশ্ন করুন!";
    // Default
    return "👋 আমি FishCare Smart AI! আপনাকে কিভাবে সাহায্য করতে পারি?";
  }, [location.pathname]);

  // Get quick replies based on page
  const getQuickReplies = useCallback(() => {
    const path = location.pathname;
    if (QUICK_REPLIES[path]) return QUICK_REPLIES[path];
    if (path.startsWith("/product/")) return QUICK_REPLIES["/shop"];
    return QUICK_REPLIES["default"];
  }, [location.pathname]);

  const handleSend = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg || isLoading) return;

    const userMsg: Message = { role: "user", content: msg };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setShowPulse(false);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        currentPage: location.pathname,
        onDelta: (chunk) => upsertAssistant(chunk),
        onDone: () => setIsLoading(false),
        onError: (msg) => {
          setMessages((prev) => [...prev, { role: "assistant", content: msg }]);
          setIsLoading(false);
        },
      });
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "🙏 দুঃখিত, কিছু সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।" },
      ]);
      setIsLoading(false);
    }
  };

  const clearHistory = () => {
    setMessages([]);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <>
      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-20 right-4 z-50 w-[380px] max-w-[calc(100vw-2rem)] h-[520px] max-h-[calc(100vh-6rem)] bg-background border border-border rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
            <div className="relative">
              <Bot className="h-7 w-7" />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-accent rounded-full border-2 border-primary" />
            </div>
            <div className="flex-1">
              <p className="font-bold text-sm">FishCare Smart AI</p>
              <p className="text-xs opacity-80 flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-accent rounded-full inline-block" />
                অনলাইন
              </p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
              onClick={clearHistory}
              title="চ্যাট মুছুন"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-primary-foreground hover:bg-primary-foreground/20"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-muted/20">
            {/* Welcome / Page Greeting */}
            {messages.length === 0 && (
              <>
                <div className="flex gap-2 items-start">
                  <div className="bg-primary/10 rounded-full p-1.5 shrink-0">
                    <Bot className="h-4 w-4 text-primary" />
                  </div>
                  <div className="bg-background border border-border rounded-xl rounded-tl-none px-3 py-2 text-sm max-w-[85%] shadow-sm">
                    {getGreeting()}
                  </div>
                </div>
                {/* Quick Replies */}
                <div className="flex flex-wrap gap-1.5 pl-8">
                  {getQuickReplies().map((qr, i) => (
                    <button
                      key={i}
                      onClick={() => handleSend(qr.message)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition-colors border border-primary/20"
                    >
                      {getQuickIconComponent(qr.icon)}
                      {qr.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-2 items-start ${msg.role === "user" ? "flex-row-reverse" : ""}`}
              >
                <div className={`rounded-full p-1.5 shrink-0 ${msg.role === "user" ? "bg-primary/10" : "bg-primary/10"}`}>
                  {msg.role === "user" ? (
                    <User className="h-4 w-4 text-primary" />
                  ) : (
                    <Bot className="h-4 w-4 text-primary" />
                  )}
                </div>
                <div
                  className={`rounded-xl px-3 py-2 text-sm max-w-[85%] shadow-sm ${
                    msg.role === "user"
                      ? "bg-primary text-primary-foreground rounded-tr-none"
                      : "bg-background border border-border rounded-tl-none"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Show quick replies after assistant response too */}
            {messages.length > 0 && !isLoading && messages[messages.length - 1]?.role === "assistant" && (
              <div className="flex flex-wrap gap-1.5 pl-8">
                {getQuickReplies().slice(0, 3).map((qr, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(qr.message)}
                    className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-muted text-muted-foreground rounded-full hover:bg-primary/10 hover:text-primary transition-colors border border-border"
                  >
                    {getQuickIconComponent(qr.icon)}
                    {qr.label}
                  </button>
                ))}
              </div>
            )}

            {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2 items-start">
                <div className="bg-primary/10 rounded-full p-1.5 shrink-0">
                  <Bot className="h-4 w-4 text-primary" />
                </div>
                <div className="bg-background border border-border rounded-xl rounded-tl-none px-3 py-2 shadow-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-primary/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Powered by */}
          <div className="text-center text-[10px] text-muted-foreground/50 py-1 bg-muted/30">
            Powered by FishCare Smart AI
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border bg-background">
            <form
              onSubmit={(e) => { e.preventDefault(); handleSend(); }}
              className="flex gap-2"
            >
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="আপনার প্রশ্ন লিখুন..."
                className="flex-1 bg-muted rounded-full px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/50 placeholder:text-muted-foreground/60"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-full"
                disabled={!input.trim() || isLoading}
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        onClick={() => { setIsOpen(!isOpen); setShowPulse(false); }}
        className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center hover:scale-105 active:scale-95"
        aria-label="Chat"
      >
        {showPulse && !isOpen && (
          <span className="absolute inset-0 rounded-full bg-primary animate-ping opacity-30" />
        )}
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <MessageCircle className="h-6 w-6" />
        )}
      </button>
    </>
  );
};

export default FloatingChatbot;
