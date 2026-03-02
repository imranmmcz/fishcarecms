import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { MessageCircle, X, Send, Bot, User, Trash2, ShoppingBag, HelpCircle, Truck, Fish, ExternalLink, ShoppingCart, Package, Clock, CheckCircle2, MapPin, CreditCard, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation, useNavigate } from "react-router-dom";
import { useProducts, getDiscountedPrice } from "@/contexts/ProductsContext";
import { useCart } from "@/contexts/CartContext";
import { supabase } from "@/integrations/supabase/client";
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

const QUICK_REPLIES: Record<string, { label: string; message: string; icon: string }[]> = {
  default: [
    { label: "পণ্য দেখুন", message: "আপনাদের জনপ্রিয় পণ্যগুলো দেখান", icon: "shop" },
    { label: "অর্ডার ট্র্যাক", message: "আমার অর্ডার ট্র্যাক করতে চাই", icon: "track" },
    { label: "ডেলিভারি তথ্য", message: "ডেলিভারি কতদিন লাগে?", icon: "truck" },
    { label: "মাছ চাষ পরামর্শ", message: "মাছ চাষের পরামর্শ দিন", icon: "fish" },
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
    case "track": return <Search className="h-3 w-3" />;
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

// Product card component for inline display
const ChatProductCard = ({ productId }: { productId: string }) => {
  const { products } = useProducts();
  const { addToCart } = useCart();
  const navigate = useNavigate();

  const product = useMemo(() => products.find(p => p.id === productId), [products, productId]);

  if (!product) return null;

  const finalPrice = product.discount_percentage && product.discount_percentage > 0
    ? getDiscountedPrice(product.price, product.discount_percentage)
    : product.price;

  return (
    <div
      className="my-2 border border-border rounded-lg overflow-hidden bg-background shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => navigate(`/product/${product.id}`)}
    >
      <div className="flex gap-2 p-2">
        {/* Image */}
        <div className="w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-muted-foreground/40" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-foreground truncate">{product.name}</p>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-sm font-bold text-primary">৳{finalPrice}</span>
            {product.discount_percentage && product.discount_percentage > 0 && (
              <>
                <span className="text-[10px] text-muted-foreground line-through">৳{product.price}</span>
                <span className="text-[10px] font-medium text-destructive bg-destructive/10 px-1 rounded">
                  -{product.discount_percentage}%
                </span>
              </>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            {product.stock_quantity > 0 ? `স্টকে আছে (${product.stock_quantity})` : "স্টক নেই"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex border-t border-border">
        <button
          onClick={(e) => {
            e.stopPropagation();
            addToCart(product, 1);
          }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-primary hover:bg-primary/5 transition-colors"
        >
          <ShoppingCart className="h-3 w-3" /> কার্টে যোগ
        </button>
        <div className="w-px bg-border" />
        <button
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/product/${product.id}`);
          }}
          className="flex-1 flex items-center justify-center gap-1 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
        >
          <ExternalLink className="h-3 w-3" /> বিস্তারিত
        </button>
      </div>
    </div>
  );
};

// Order tracking card component
const OrderTrackingCard = ({ orderNumber }: { orderNumber: string }) => {
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrder = async () => {
      setLoading(true);
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("order_number", orderNumber.trim())
        .single();
      setOrder(data);
      setLoading(false);
    };
    fetchOrder();
  }, [orderNumber]);

  if (loading) {
    return (
      <div className="my-2 border border-border rounded-lg p-3 bg-background animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2 mb-2" />
        <div className="h-3 bg-muted rounded w-3/4 mb-1" />
        <div className="h-3 bg-muted rounded w-2/3" />
      </div>
    );
  }

  if (!order) return null;

  const statusConfig: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: "অপেক্ষমান", color: "bg-yellow-500", icon: <Clock className="h-3 w-3" /> },
    confirmed: { label: "নিশ্চিত", color: "bg-blue-500", icon: <CheckCircle2 className="h-3 w-3" /> },
    processing: { label: "প্রসেসিং", color: "bg-primary", icon: <Package className="h-3 w-3" /> },
    shipped: { label: "শিপ করা হয়েছে", color: "bg-indigo-500", icon: <Truck className="h-3 w-3" /> },
    delivered: { label: "ডেলিভারি সম্পন্ন", color: "bg-green-600", icon: <CheckCircle2 className="h-3 w-3" /> },
    cancelled: { label: "বাতিল", color: "bg-destructive", icon: <X className="h-3 w-3" /> },
  };

  const statusSteps = ["pending", "confirmed", "processing", "shipped", "delivered"];
  const currentStepIndex = statusSteps.indexOf(order.status);
  const isCancelled = order.status === "cancelled";
  const currentStatus = statusConfig[order.status] || statusConfig.pending;

  return (
    <div className="my-2 border border-border rounded-lg overflow-hidden bg-background shadow-sm">
      {/* Header */}
      <div className="bg-primary/5 px-3 py-2 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Package className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold text-foreground">{order.order_number}</span>
        </div>
        <span className={`text-[10px] font-medium text-white px-2 py-0.5 rounded-full ${currentStatus.color}`}>
          {currentStatus.label}
        </span>
      </div>

      {/* Progress Steps */}
      {!isCancelled && (
        <div className="px-3 py-2">
          <div className="flex items-center justify-between mb-1">
            {statusSteps.map((step, i) => {
              const isActive = i <= currentStepIndex;
              const stepConf = statusConfig[step];
              return (
                <div key={step} className="flex flex-col items-center flex-1">
                  <div className={`w-5 h-5 rounded-full flex items-center justify-center text-white ${isActive ? stepConf.color : "bg-muted"}`}>
                    {stepConf.icon}
                  </div>
                  {i < statusSteps.length - 1 && (
                    <div className={`h-0.5 w-full mt-1 ${i < currentStepIndex ? "bg-primary" : "bg-muted"}`} />
                  )}
                </div>
              );
            })}
          </div>
          <div className="flex justify-between text-[9px] text-muted-foreground">
            <span>অপেক্ষমান</span>
            <span>নিশ্চিত</span>
            <span>প্রসেসিং</span>
            <span>শিপড</span>
            <span>ডেলিভারি</span>
          </div>
        </div>
      )}

      {/* Details */}
      <div className="px-3 py-2 space-y-1.5 text-[11px] border-t border-border">
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <User className="h-3 w-3" />
          <span>{order.customer_name} • {order.customer_phone}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <MapPin className="h-3 w-3" />
          <span className="truncate">{order.shipping_address}{order.district ? `, ${order.district}` : ''}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <CreditCard className="h-3 w-3" />
          <span>{order.payment_method.toUpperCase()} • ৳{order.total_amount}</span>
        </div>
        <div className="flex items-center gap-1.5 text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span>{new Date(order.created_at).toLocaleDateString('bn-BD', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
        </div>
      </div>
    </div>
  );
};

// Parse message content and render product/order cards inline
const RenderMessageContent = ({ content }: { content: string }) => {
  // Split on both PRODUCT_CARD and ORDER_TRACK patterns
  const parts = content.split(/\[PRODUCT_CARD:([^\]]+)\]|\[ORDER_TRACK:([^\]]+)\]/g);

  if (parts.length === 1) {
    return (
      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  const elements: React.ReactNode[] = [];
  let i = 0;
  while (i < parts.length) {
    const text = parts[i];
    const productId = parts[i + 1];
    const orderNum = parts[i + 2];

    if (text && text.trim()) {
      elements.push(
        <div key={`t-${i}`} className="prose prose-sm dark:prose-invert max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
          <ReactMarkdown>{text}</ReactMarkdown>
        </div>
      );
    }

    if (productId) {
      elements.push(<ChatProductCard key={`p-${i}`} productId={productId.trim()} />);
    }
    if (orderNum) {
      elements.push(<OrderTrackingCard key={`o-${i}`} orderNumber={orderNum.trim()} />);
    }

    i += 3;
  }

  return <div>{elements}</div>;
};

const FloatingChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>(loadMessages);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [autoMessageShown, setAutoMessageShown] = useState(false);
  const [chatbotEnabled, setChatbotEnabled] = useState(true);
  const [chatbotGreeting, setChatbotGreeting] = useState("");
  const [chatbotName, setChatbotName] = useState("FishCare Smart AI");
  const [autoOpenDelay, setAutoOpenDelay] = useState(20);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLanguage();
  const location = useLocation();
  const autoTimerRef = useRef<ReturnType<typeof setTimeout>>();

  // Load chatbot settings
  useEffect(() => {
    const loadChatbotSettings = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["chatbot_enabled", "chatbot_greeting", "chatbot_name", "chatbot_auto_open_delay"]);

        (data || []).forEach((s) => {
          if (!s.setting_value) return;
          if (s.setting_key === "chatbot_enabled") setChatbotEnabled(s.setting_value === "true");
          if (s.setting_key === "chatbot_greeting") setChatbotGreeting(s.setting_value);
          if (s.setting_key === "chatbot_name") setChatbotName(s.setting_value);
          if (s.setting_key === "chatbot_auto_open_delay") setAutoOpenDelay(parseInt(s.setting_value, 10) || 20);
        });
      } catch (err) {
        // use defaults
      }
    };
    loadChatbotSettings();
  }, []);

  // Save messages
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
  }, [messages]);

  // Auto-open after delay
  useEffect(() => {
    if (isOpen || autoMessageShown || autoOpenDelay <= 0) return;
    autoTimerRef.current = setTimeout(() => {
      if (!isOpen && !autoMessageShown) {
        setShowPulse(true);
        setAutoMessageShown(true);
      }
    }, autoOpenDelay * 1000);
    return () => clearTimeout(autoTimerRef.current);
  }, [isOpen, autoMessageShown, location.pathname, autoOpenDelay]);

  const scrollToBottom = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { if (isOpen && inputRef.current) inputRef.current.focus(); }, [isOpen]);

  const getGreeting = useCallback(() => {
    if (chatbotGreeting) return chatbotGreeting;
    const path = location.pathname;
    if (PAGE_GREETINGS[path]) return PAGE_GREETINGS[path];
    if (path.startsWith("/product/")) return "🔍 এই পণ্য সম্পর্কে কিছু জানতে চান?";
    if (path.startsWith("/category/")) return "📂 এই ক্যাটাগরির পণ্য সম্পর্কে প্রশ্ন করুন!";
    return `👋 আমি ${chatbotName}! আপনাকে কিভাবে সাহায্য করতে পারি?`;
  }, [location.pathname, chatbotGreeting, chatbotName]);

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

  if (!chatbotEnabled) return null;

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
                <div className="rounded-full p-1.5 shrink-0 bg-primary/10">
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
                    <RenderMessageContent content={msg.content} />
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

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
