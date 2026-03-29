/**
 * Payment Gateway Settings - bKash & Nagad Merchant API Configuration
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import { Save, Loader2, ShieldCheck, TestTube, AlertTriangle } from "lucide-react";

interface MerchantSettings {
  // bKash
  bkash_merchant_api_enabled: string;
  bkash_app_key: string;
  bkash_app_secret: string;
  bkash_username: string;
  bkash_password: string;
  bkash_api_environment: string;
  // Nagad
  nagad_merchant_api_enabled: string;
  nagad_merchant_id: string;
  nagad_merchant_private_key: string;
  nagad_pg_public_key: string;
  nagad_api_environment: string;
}

const defaultSettings: MerchantSettings = {
  bkash_merchant_api_enabled: "false",
  bkash_app_key: "",
  bkash_app_secret: "",
  bkash_username: "",
  bkash_password: "",
  bkash_api_environment: "sandbox",
  nagad_merchant_api_enabled: "false",
  nagad_merchant_id: "",
  nagad_merchant_private_key: "",
  nagad_pg_public_key: "",
  nagad_api_environment: "sandbox",
};

const settingKeys = Object.keys(defaultSettings) as (keyof MerchantSettings)[];

export default function PaymentGatewaySettings() {
  const { toast } = useToast();
  const { language } = useLanguage();
  const [settings, setSettings] = useState<MerchantSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", settingKeys);

      if (error) throw error;

      if (data) {
        const updated = { ...defaultSettings };
        data.forEach((item) => {
          const key = item.setting_key as keyof MerchantSettings;
          if (key in updated) {
            updated[key] = item.setting_value || "";
          }
        });
        setSettings(updated);
      }
    } catch (err) {
      console.error("Error fetching merchant settings:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (key: keyof MerchantSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      for (const key of settingKeys) {
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", key)
          .single();

        if (existing) {
          await supabase
            .from("system_settings")
            .update({ setting_value: settings[key] })
            .eq("setting_key", key);
        } else {
          await supabase
            .from("system_settings")
            .insert({
              setting_key: key,
              setting_value: settings[key],
              description: `Merchant API setting: ${key}`,
            });
        }
      }

      toast({
        title: language === "bn" ? "সফল" : "Success",
        description: language === "bn" ? "মার্চেন্ট API সেটিংস সেভ হয়েছে" : "Merchant API settings saved",
      });
    } catch (err) {
      console.error("Error saving merchant settings:", err);
      toast({
        title: language === "bn" ? "ত্রুটি" : "Error",
        description: language === "bn" ? "সেটিংস সেভ করতে সমস্যা হয়েছে" : "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Save button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base sm:text-lg font-semibold">
            {language === "bn" ? "পেমেন্ট গেটওয়ে সেটিংস" : "Payment Gateway Settings"}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground">
            {language === "bn"
              ? "বিকাশ ও নগদ মার্চেন্ট API কনফিগার করুন। API credentials সেট করলে পেমেন্ট স্বয়ংক্রিয়ভাবে ভেরিফাই হবে।"
              : "Configure bKash & Nagad Merchant API. When configured, payments will be verified automatically."}
          </p>
        </div>
        <Button onClick={saveSettings} disabled={isSaving} size="sm" className="w-full sm:w-auto">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          {language === "bn" ? "সেভ করুন" : "Save"}
        </Button>
      </div>

      {/* Info Banner */}
      <div className="rounded-lg border border-blue-500/20 bg-blue-500/5 p-4">
        <div className="flex items-start gap-3">
          <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
          <div className="text-sm">
            <p className="font-medium text-blue-700 dark:text-blue-400">
              {language === "bn" ? "স্বয়ংক্রিয় পেমেন্ট ভেরিফিকেশন" : "Automatic Payment Verification"}
            </p>
            <p className="text-muted-foreground mt-1">
              {language === "bn"
                ? "মার্চেন্ট API সক্রিয় থাকলে, গ্রাহক TrxID ও সেন্ডার নম্বর দিলে সিস্টেম স্বয়ংক্রিয়ভাবে API কল করে পেমেন্ট ভেরিফাই করবে, Amount ও Number ম্যাচ করবে, এবং সফল হলে অর্ডার Approve করবে।"
                : "When Merchant API is active, the system will automatically call the API to verify payment when a customer submits TrxID & sender number, match amount & number, and approve the order if verified."}
            </p>
          </div>
        </div>
      </div>

      {/* bKash Merchant API */}
      <Card className="border-pink-500/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                bK
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base">{language === "bn" ? "বিকাশ মার্চেন্ট API" : "bKash Merchant API"}</CardTitle>
                <CardDescription className="text-xs">
                  {language === "bn" ? "বিকাশ পেমেন্ট গেটওয়ে ইন্টিগ্রেশন" : "bKash Payment Gateway Integration"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.bkash_merchant_api_enabled === "true" ? "default" : "secondary"} className="text-xs">
                {settings.bkash_merchant_api_enabled === "true"
                  ? (language === "bn" ? "সক্রিয়" : "Active")
                  : (language === "bn" ? "নিষ্ক্রিয়" : "Inactive")}
              </Badge>
              <Switch
                checked={settings.bkash_merchant_api_enabled === "true"}
                onCheckedChange={(checked) => handleChange("bkash_merchant_api_enabled", checked.toString())}
              />
            </div>
          </div>
        </CardHeader>
        {settings.bkash_merchant_api_enabled === "true" && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "এনভায়রনমেন্ট" : "Environment"}</Label>
              <Select
                value={settings.bkash_api_environment}
                onValueChange={(v) => handleChange("bkash_api_environment", v)}
              >
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Sandbox (টেস্ট)
                    </div>
                  </SelectItem>
                  <SelectItem value="production">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Production (লাইভ)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {settings.bkash_api_environment === "sandbox" && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {language === "bn" ? "Sandbox মোডে আসল টাকা কাটা হবে না" : "No real money in sandbox mode"}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>App Key</Label>
                <Input
                  type="password"
                  value={settings.bkash_app_key}
                  onChange={(e) => handleChange("bkash_app_key", e.target.value)}
                  placeholder="Enter bKash App Key"
                />
              </div>
              <div className="space-y-2">
                <Label>App Secret</Label>
                <Input
                  type="password"
                  value={settings.bkash_app_secret}
                  onChange={(e) => handleChange("bkash_app_secret", e.target.value)}
                  placeholder="Enter bKash App Secret"
                />
              </div>
              <div className="space-y-2">
                <Label>Username</Label>
                <Input
                  value={settings.bkash_username}
                  onChange={(e) => handleChange("bkash_username", e.target.value)}
                  placeholder="Enter bKash Username"
                />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={settings.bkash_password}
                  onChange={(e) => handleChange("bkash_password", e.target.value)}
                  placeholder="Enter bKash Password"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Nagad Merchant API */}
      <Card className="border-orange-500/20">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm flex-shrink-0">
                N
              </div>
              <div>
                <CardTitle className="text-sm sm:text-base">{language === "bn" ? "নগদ মার্চেন্ট API" : "Nagad Merchant API"}</CardTitle>
                <CardDescription className="text-xs">
                  {language === "bn" ? "নগদ পেমেন্ট গেটওয়ে ইন্টিগ্রেশন" : "Nagad Payment Gateway Integration"}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={settings.nagad_merchant_api_enabled === "true" ? "default" : "secondary"} className="text-xs">
                {settings.nagad_merchant_api_enabled === "true"
                  ? (language === "bn" ? "সক্রিয়" : "Active")
                  : (language === "bn" ? "নিষ্ক্রিয়" : "Inactive")}
              </Badge>
              <Switch
                checked={settings.nagad_merchant_api_enabled === "true"}
                onCheckedChange={(checked) => handleChange("nagad_merchant_api_enabled", checked.toString())}
              />
            </div>
          </div>
        </CardHeader>
        {settings.nagad_merchant_api_enabled === "true" && (
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>{language === "bn" ? "এনভায়রনমেন্ট" : "Environment"}</Label>
              <Select
                value={settings.nagad_api_environment}
                onValueChange={(v) => handleChange("nagad_api_environment", v)}
              >
                <SelectTrigger className="w-full md:w-[250px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sandbox">
                    <div className="flex items-center gap-2">
                      <TestTube className="h-4 w-4" />
                      Sandbox (টেস্ট)
                    </div>
                  </SelectItem>
                  <SelectItem value="production">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      Production (লাইভ)
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
              {settings.nagad_api_environment === "sandbox" && (
                <p className="text-xs text-amber-600 flex items-center gap-1">
                  <AlertTriangle className="h-3 w-3" />
                  {language === "bn" ? "Sandbox মোডে আসল টাকা কাটা হবে না" : "No real money in sandbox mode"}
                </p>
              )}
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Merchant ID</Label>
                <Input
                  value={settings.nagad_merchant_id}
                  onChange={(e) => handleChange("nagad_merchant_id", e.target.value)}
                  placeholder="Enter Nagad Merchant ID"
                />
              </div>
              <div className="space-y-2">
                <Label>Merchant Private Key</Label>
                <Input
                  type="password"
                  value={settings.nagad_merchant_private_key}
                  onChange={(e) => handleChange("nagad_merchant_private_key", e.target.value)}
                  placeholder="Enter Merchant Private Key"
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>PG Public Key</Label>
                <Input
                  type="password"
                  value={settings.nagad_pg_public_key}
                  onChange={(e) => handleChange("nagad_pg_public_key", e.target.value)}
                  placeholder="Enter Nagad PG Public Key"
                />
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* How it works */}
      <Card className="border-muted">
        <CardHeader>
          <CardTitle className="text-base">
            {language === "bn" ? "কিভাবে কাজ করে?" : "How does it work?"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm text-muted-foreground">
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">1</span>
              <p>{language === "bn" ? "গ্রাহক চেকআউটে বিকাশ/নগদে সেন্ড মানি করে TrxID ও সেন্ডার নম্বর দেয়" : "Customer sends money via bKash/Nagad and submits TrxID & sender number"}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">2</span>
              <p>{language === "bn" ? "সিস্টেম মার্চেন্ট API কল করে TrxID দিয়ে পেমেন্ট খুঁজে বের করে" : "System calls Merchant API to search for the transaction by TrxID"}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">3</span>
              <p>{language === "bn" ? "Amount ও Sender Number ম্যাচ করে কিনা যাচাই করে" : "Verifies if Amount and Sender Number match"}</p>
            </div>
            <div className="flex items-start gap-3">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center text-xs font-bold">✓</span>
              <p>{language === "bn" ? "সব ঠিক থাকলে অটো-Approve হয়, নাহলে ম্যানুয়াল ভেরিফিকেশনে যায়" : "If everything matches, auto-approves; otherwise goes to manual verification"}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
