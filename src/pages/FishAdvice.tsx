import { useState, useRef, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Button3D } from "@/components/ui/button-3d";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Send, Bot, User, MessageSquare, HelpCircle, Loader2 } from "lucide-react";
import { fishFaqData, faqCategories } from "@/data/fishFaqData";
import { useToast } from "@/hooks/use-toast";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fish-advice-chat`;

const FishAdvice = () => {
  const [activeCategory, setActiveCategory] = useState("সকল");
  const [searchQuery, setSearchQuery] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const filteredFaqs = fishFaqData.filter((faq) => {
    const matchesCategory = activeCategory === "সকল" || faq.category === activeCategory;
    const matchesSearch = 
      faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const streamChat = async (userMessages: Message[]) => {
    const resp = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
      },
      body: JSON.stringify({ messages: userMessages }),
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      throw new Error(errorData.error || "AI সার্ভিসে সমস্যা হয়েছে");
    }

    if (!resp.body) throw new Error("No response body");

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let textBuffer = "";
    let assistantContent = "";

    while (true) {
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
        if (jsonStr === "[DONE]") break;

        try {
          const parsed = JSON.parse(jsonStr);
          const content = parsed.choices?.[0]?.delta?.content as string | undefined;
          if (content) {
            assistantContent += content;
            setMessages((prev) => {
              const last = prev[prev.length - 1];
              if (last?.role === "assistant") {
                return prev.map((m, i) => 
                  i === prev.length - 1 ? { ...m, content: assistantContent } : m
                );
              }
              return [...prev, { role: "assistant", content: assistantContent }];
            });
          }
        } catch {
          textBuffer = line + "\n" + textBuffer;
          break;
        }
      }
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMsg: Message = { role: "user", content: inputMessage };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage("");
    setIsLoading(true);

    try {
      await streamChat([...messages, userMsg]);
    } catch (error) {
      console.error("Chat error:", error);
      toast({
        title: "সমস্যা হয়েছে",
        description: error instanceof Error ? error.message : "আবার চেষ্টা করুন",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleFaqClick = (question: string) => {
    setInputMessage(question);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            🐟 ফিস এডভাইস
          </h1>
          <p className="text-muted-foreground">
            মাছ চাষ সম্পর্কিত সকল সমস্যার সমাধান পান AI এর মাধ্যমে
          </p>
        </div>

        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              AI পরামর্শ
            </TabsTrigger>
            <TabsTrigger value="faq" className="flex items-center gap-2">
              <HelpCircle className="h-4 w-4" />
              সাধারণ প্রশ্ন
            </TabsTrigger>
          </TabsList>

          {/* AI Chat Tab */}
          <TabsContent value="chat">
            <Card className="max-w-3xl mx-auto">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  AI মৎস্য পরামর্শদাতা
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[400px] pr-4 mb-4">
                  {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                      <Bot className="h-16 w-16 mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">আপনার প্রশ্ন জিজ্ঞাসা করুন</p>
                      <p className="text-sm">মাছের রোগ, খাবার, পানি ব্যবস্থাপনা সম্পর্কে জানুন</p>
                      <div className="mt-4 flex flex-wrap gap-2 justify-center">
                        {["মাছের গায়ে সাদা দাগ দেখা দিলে কী করব?", "পুকুরে চুন কখন দিতে হয়?", "মাছকে দিনে কতবার খাবার দেব?"].map((q) => (
                          <Badge 
                            key={q} 
                            variant="outline" 
                            className="cursor-pointer hover:bg-primary/10 text-xs"
                            onClick={() => handleFaqClick(q)}
                          >
                            {q}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          {msg.role === "assistant" && (
                            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                              <Bot className="h-4 w-4 text-primary" />
                            </div>
                          )}
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === "user"
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            }`}
                          >
                            <p className="whitespace-pre-wrap text-sm">{msg.content}</p>
                          </div>
                          {msg.role === "user" && (
                            <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                              <User className="h-4 w-4" />
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && messages[messages.length - 1]?.role === "user" && (
                        <div className="flex gap-3 justify-start">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <Bot className="h-4 w-4 text-primary" />
                          </div>
                          <div className="bg-muted rounded-lg px-4 py-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                          </div>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>

                <div className="flex gap-2">
                  <Input
                    placeholder="আপনার প্রশ্ন লিখুন..."
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button3D 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                    variant="primary"
                    size="md"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </Button3D>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* FAQ Tab */}
          <TabsContent value="faq">
            <div className="max-w-3xl mx-auto">
              {/* Search */}
              <div className="relative mb-6">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="প্রশ্ন খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Category Filter */}
              <div className="flex flex-wrap gap-2 mb-6">
                {faqCategories.map((category) => (
                  <Badge
                    key={category}
                    variant={activeCategory === category ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </Badge>
                ))}
              </div>

              {/* FAQ List */}
              <Card>
                <CardContent className="pt-6">
                  <Accordion type="single" collapsible className="w-full">
                    {filteredFaqs.map((faq) => (
                      <AccordionItem key={faq.id} value={faq.id}>
                        <AccordionTrigger className="text-left">
                          <div className="flex flex-col items-start gap-1">
                            <Badge variant="secondary" className="text-xs mb-1">
                              {faq.category}
                            </Badge>
                            <span>{faq.question}</span>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <p className="text-muted-foreground leading-relaxed">
                            {faq.answer}
                          </p>
                          <Button
                            variant="link"
                            size="sm"
                            className="mt-2 p-0 h-auto"
                            onClick={() => {
                              handleFaqClick(faq.question);
                              document.querySelector('[data-value="chat"]')?.dispatchEvent(
                                new MouseEvent('click', { bubbles: true })
                              );
                            }}
                          >
                            AI এ আরও জিজ্ঞাসা করুন →
                          </Button>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>

                  {filteredFaqs.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      <HelpCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>কোনো প্রশ্ন পাওয়া যায়নি</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default FishAdvice;
