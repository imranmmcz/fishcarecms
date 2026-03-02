import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Bot, Save, Loader2, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const AI_MODELS = [
  { value: "google/gemini-3-flash-preview", label: "Gemini 3 Flash (দ্রুত)" },
  { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash (ব্যালান্সড)" },
  { value: "google/gemini-2.5-flash-lite", label: "Gemini 2.5 Flash Lite (সবচেয়ে দ্রুত)" },
  { value: "google/gemini-2.5-pro", label: "Gemini 2.5 Pro (সবচেয়ে স্মার্ট)" },
  { value: "google/gemini-3-pro-preview", label: "Gemini 3 Pro (অ্যাডভান্সড)" },
  { value: "openai/gpt-5-mini", label: "GPT-5 Mini (ব্যালান্সড)" },
  { value: "openai/gpt-5", label: "GPT-5 (পাওয়ারফুল)" },
  { value: "openai/gpt-5-nano", label: "GPT-5 Nano (দ্রুত ও সাশ্রয়ী)" },
  { value: "openai/gpt-5.2", label: "GPT-5.2 (সর্বাধুনিক)" },
];

interface ChatbotSettings {
  chatbot_enabled: string;
  chatbot_name: string;
  chatbot_model: string;
  chatbot_greeting: string;
  chatbot_system_prompt: string;
  chatbot_max_products: string;
  chatbot_company_name: string;
  chatbot_company_info: string;
  chatbot_auto_open_delay: string;
}

const defaultSettings: ChatbotSettings = {
  chatbot_enabled: "true",
  chatbot_name: "FishCare Smart AI",
  chatbot_model: "google/gemini-3-flash-preview",
  chatbot_greeting: "👋 স্বাগতম! মাছ চাষ, পণ্য বা অর্ডার নিয়ে কোনো প্রশ্ন আছে?",
  chatbot_system_prompt: "",
  chatbot_max_products: "50",
  chatbot_company_name: "FishCare BD",
  chatbot_company_info: "Bangladesh's leading aquaculture e-commerce platform. Located in Jessore. Payment: bKash, Nagad, Rocket, COD. Delivery: 2-5 business days. Return: 7-day policy. Support: 9 AM – 10 PM daily.",
  chatbot_auto_open_delay: "20",
};

export default function ChatbotSettings() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<ChatbotSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .like("setting_key", "chatbot_%");

      if (data && data.length > 0) {
        const loaded = { ...defaultSettings };
        data.forEach((d) => {
          if (d.setting_value !== null && d.setting_key in loaded) {
            (loaded as any)[d.setting_key] = d.setting_value;
          }
        });
        setSettings(loaded);
      }
    } catch (err) {
      console.error("Error loading chatbot settings:", err);
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(settings)) {
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", key)
          .maybeSingle();

        if (existing) {
          await supabase.from("system_settings").update({ setting_value: value }).eq("setting_key", key);
        } else {
          await supabase.from("system_settings").insert({ setting_key: key, setting_value: value, description: `Chatbot: ${key}` });
        }
      }
      toast.success(language === "bn" ? "চ্যাটবট সেটিংস সংরক্ষিত হয়েছে" : "Chatbot settings saved");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error(language === "bn" ? "সংরক্ষণে সমস্যা হয়েছে" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof ChatbotSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const resetDefaults = () => {
    setSettings(defaultSettings);
    toast.success(language === "bn" ? "ডিফল্টে রিসেট হয়েছে" : "Reset to defaults");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5 text-primary" />
          {language === "bn" ? "চ্যাটবট সেটিংস" : "Chatbot Settings"}
        </CardTitle>
        <CardDescription>
          {language === "bn"
            ? "ফ্লোটিং চ্যাটবটের AI মডেল, নাম, সিস্টেম প্রম্পট এবং অন্যান্য সেটিংস কনফিগার করুন।"
            : "Configure the floating chatbot's AI model, name, system prompt, and other settings."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between rounded-lg border border-border p-4">
          <div>
            <Label className="font-semibold text-base">
              {language === "bn" ? "চ্যাটবট সক্রিয়" : "Chatbot Enabled"}
            </Label>
            <p className="text-sm text-muted-foreground">
              {language === "bn" ? "ওয়েবসাইটে ফ্লোটিং চ্যাটবট দেখানো হবে কিনা" : "Show floating chatbot on the website"}
            </p>
          </div>
          <Switch
            checked={settings.chatbot_enabled === "true"}
            onCheckedChange={(checked) => handleChange("chatbot_enabled", checked.toString())}
          />
        </div>

        {/* Basic Info */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-semibold">
              {language === "bn" ? "চ্যাটবটের নাম" : "Chatbot Name"}
            </Label>
            <Input
              value={settings.chatbot_name}
              onChange={(e) => handleChange("chatbot_name", e.target.value)}
              placeholder="FishCare Smart AI"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">
              {language === "bn" ? "কোম্পানির নাম" : "Company Name"}
            </Label>
            <Input
              value={settings.chatbot_company_name}
              onChange={(e) => handleChange("chatbot_company_name", e.target.value)}
              placeholder="FishCare BD"
            />
          </div>
        </div>

        {/* AI Model */}
        <div className="space-y-2">
          <Label className="font-semibold">
            {language === "bn" ? "AI মডেল" : "AI Model"}
          </Label>
          <p className="text-xs text-muted-foreground">
            {language === "bn"
              ? "চ্যাটবটের জন্য কোন AI মডেল ব্যবহার হবে তা নির্বাচন করুন। দ্রুত মডেল কম খরচে কাজ করে, স্মার্ট মডেল ভালো উত্তর দেয়।"
              : "Select which AI model powers the chatbot. Faster models cost less, smarter models give better answers."}
          </p>
          <Select value={settings.chatbot_model} onValueChange={(v) => handleChange("chatbot_model", v)}>
            <SelectTrigger className="w-full md:w-[400px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Greeting */}
        <div className="space-y-2">
          <Label className="font-semibold">
            {language === "bn" ? "স্বাগত বার্তা" : "Greeting Message"}
          </Label>
          <Input
            value={settings.chatbot_greeting}
            onChange={(e) => handleChange("chatbot_greeting", e.target.value)}
            placeholder="👋 স্বাগতম! কিছু জানতে চান?"
          />
        </div>

        {/* Company Info */}
        <div className="space-y-2">
          <Label className="font-semibold">
            {language === "bn" ? "কোম্পানির তথ্য (AI কে জানানো হবে)" : "Company Info (provided to AI)"}
          </Label>
          <Textarea
            value={settings.chatbot_company_info}
            onChange={(e) => handleChange("chatbot_company_info", e.target.value)}
            rows={3}
            placeholder="Company description, location, payment methods, delivery info..."
          />
        </div>

        {/* Custom System Prompt */}
        <div className="space-y-2">
          <Label className="font-semibold">
            {language === "bn" ? "কাস্টম সিস্টেম প্রম্পট (ঐচ্ছিক)" : "Custom System Prompt (Optional)"}
          </Label>
          <p className="text-xs text-muted-foreground">
            {language === "bn"
              ? "চ্যাটবটকে অতিরিক্ত নির্দেশনা দিতে এখানে লিখুন। খালি রাখলে ডিফল্ট প্রম্পট ব্যবহার হবে।"
              : "Add extra instructions for the chatbot. Leave blank to use the default prompt."}
          </p>
          <Textarea
            value={settings.chatbot_system_prompt}
            onChange={(e) => handleChange("chatbot_system_prompt", e.target.value)}
            rows={5}
            placeholder={language === "bn" ? "অতিরিক্ত নির্দেশনা লিখুন..." : "Additional instructions..."}
          />
        </div>

        {/* Max Products & Auto Open */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-semibold">
              {language === "bn" ? "সর্বোচ্চ পণ্য সংখ্যা" : "Max Products to Load"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === "bn" ? "AI কে কতগুলো পণ্যের তথ্য দেওয়া হবে" : "How many products to provide to AI"}
            </p>
            <Input
              type="number"
              value={settings.chatbot_max_products}
              onChange={(e) => handleChange("chatbot_max_products", e.target.value)}
              min="10"
              max="200"
            />
          </div>
          <div className="space-y-2">
            <Label className="font-semibold">
              {language === "bn" ? "অটো-ওপেন ডিলে (সেকেন্ড)" : "Auto-Open Delay (seconds)"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === "bn" ? "কত সেকেন্ড পর চ্যাটবট পালস দেখাবে (0 = বন্ধ)" : "Seconds before chatbot pulse shows (0 = disabled)"}
            </p>
            <Input
              type="number"
              value={settings.chatbot_auto_open_delay}
              onChange={(e) => handleChange("chatbot_auto_open_delay", e.target.value)}
              min="0"
              max="120"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {language === "bn" ? "সংরক্ষণ করুন" : "Save Settings"}
          </Button>
          <Button variant="outline" onClick={resetDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {language === "bn" ? "ডিফল্ট রিসেট" : "Reset Defaults"}
          </Button>
        </div>

        {/* Note */}
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>{language === "bn" ? "নোট:" : "Note:"}</strong>{" "}
            {language === "bn"
              ? "সেটিংস সংরক্ষণের পর চ্যাটবট পরবর্তী কথোপকথনে নতুন সেটিংস ব্যবহার করবে। AI মডেল পরিবর্তন করলে উত্তরের মান ও গতি পরিবর্তন হতে পারে।"
              : "After saving, the chatbot will use new settings in the next conversation. Changing the AI model may affect response quality and speed."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
