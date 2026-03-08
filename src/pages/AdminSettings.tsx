import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Loader2, RefreshCw, Globe, DollarSign, CreditCard, Mail, Palette, Type, Search, FileText, Truck, MessageCircle, Printer, MessageSquare, Bot, Database } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useCurrency, currencies, CurrencyCode } from "@/contexts/CurrencyContext";
import SmtpSettingsTab from "@/components/SmtpSettingsTab";
import EmailLogsViewer from "@/components/EmailLogsViewer";
import ThemeColorSettings from "@/components/ThemeColorSettings";
import LoadingAnimationSettings from "@/components/LoadingAnimationSettings";
import LanguageFontSettings from "@/components/LanguageFontSettings";
import GlobalSeoSettings from "@/components/admin/GlobalSeoSettings";
import PaymentGatewaySettings from "@/components/admin/PaymentGatewaySettings";
import DeliverySettingsAdmin from "@/components/admin/DeliverySettingsAdmin";
import InvoiceSettings from "@/components/admin/InvoiceSettings";
import { SteadfastCourierSettings } from "@/components/admin/SteadfastCourierSettings";
import { SundarbanCourierSettings } from "@/components/admin/SundarbanCourierSettings";
import { RedxCourierSettings } from "@/components/admin/RedxCourierSettings";
import { WhatsAppSettings } from "@/components/admin/WhatsAppSettings";
import POSPrintSettings from "@/components/admin/POSPrintSettings";
import SmsSettings from "@/components/admin/SmsSettings";
import ChatbotSettings from "@/components/admin/ChatbotSettings";
import MySQLBackendSettings from "@/components/admin/MySQLBackendSettings";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
}

interface PaymentSettingsState {
  payment_bkash_number: string;
  payment_bkash_type: string;
  payment_bkash_enabled: string;
  payment_nagad_number: string;
  payment_nagad_type: string;
  payment_nagad_enabled: string;
  payment_cod_enabled: string;
}

const AdminSettings = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get("tab") || "language";
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency, currencyInfo } = useCurrency();
  const [settings, setSettings] = useState<SystemSetting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [localSettings, setLocalSettings] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .order("setting_key");

      if (error) throw error;

      setSettings(data || []);

      // Initialize local settings
      const settingsMap: Record<string, string> = {};
      (data || []).forEach((s) => {
        settingsMap[s.setting_key] = s.setting_value || "";
      });
      setLocalSettings(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: t.error,
        description: t.settingsError,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSettingChange = (key: string, value: string) => {
    setLocalSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const saveSettings = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(localSettings)) {
        const { error } = await supabase
          .from("system_settings")
          .update({ setting_value: value })
          .eq("setting_key", key);

        if (error) throw error;
      }

      toast({
        title: t.success,
        description: t.settingsSaved,
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: t.error,
        description: t.settingsError,
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    toast({
      title: t.success,
      description: t.settingsSaved,
    });
  };

  const handleCurrencyChange = (curr: CurrencyCode) => {
    setCurrency(curr);
    toast({
      title: t.success,
      description: t.settingsSaved,
    });
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      app_name: t.appName,
      maintenance_mode: t.maintenanceMode,
      max_ponds_per_user: t.maxPonds,
      backup_frequency: t.backupFrequency,
    };
    return labels[key] || key;
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const value = localSettings[setting.setting_key] || "";

    switch (setting.setting_key) {
      case "maintenance_mode":
        return (
          <div className="flex items-center space-x-2">
            <Switch
              id={setting.setting_key}
              checked={value === "true"}
              onCheckedChange={(checked) =>
                handleSettingChange(setting.setting_key, checked.toString())
              }
            />
            <Label htmlFor={setting.setting_key}>
              {value === "true" ? t.active : t.inactive}
            </Label>
          </div>
        );

      case "backup_frequency":
        return (
          <Select
            value={value}
            onValueChange={(v) => handleSettingChange(setting.setting_key, v)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">{t.daily}</SelectItem>
              <SelectItem value="weekly">{t.weekly}</SelectItem>
              <SelectItem value="monthly">{t.monthly}</SelectItem>
            </SelectContent>
          </Select>
        );

      case "max_ponds_per_user":
        return (
          <Input
            type="number"
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
            min="1"
            max="1000"
          />
        );

      default:
        return (
          <Input
            value={value}
            onChange={(e) => handleSettingChange(setting.setting_key, e.target.value)}
          />
        );
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.systemSettings}</h1>
            <p className="text-muted-foreground">{t.advancedSettings}</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSettings} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              {t.refresh}
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              {t.save}
            </Button>
          </div>
        </div>

        <Tabs defaultValue={initialTab} key={initialTab} className="w-full">
          <TabsList className="flex flex-wrap h-auto gap-1 w-full lg:w-auto">
            <TabsTrigger value="language" className="flex items-center gap-2">
              <Globe className="h-4 w-4" />
              {language === "bn" ? "ভাষা" : "Language"}
            </TabsTrigger>
            <TabsTrigger value="font" className="flex items-center gap-2">
              <Type className="h-4 w-4" />
              {language === "bn" ? "ফন্ট" : "Font"}
            </TabsTrigger>
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              {language === "bn" ? "থিম" : "Theme"}
            </TabsTrigger>
            <TabsTrigger value="currency" className="flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              {language === "bn" ? "মুদ্রা" : "Currency"}
            </TabsTrigger>
            <TabsTrigger value="payment" className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              {language === "bn" ? "পেমেন্ট" : "Payment"}
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              {language === "bn" ? "ইমেইল" : "Email"}
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              {language === "bn" ? "সাধারণ" : "General"}
            </TabsTrigger>
            <TabsTrigger value="seo" className="flex items-center gap-2">
              <Search className="h-4 w-4" />
              SEO
            </TabsTrigger>
            <TabsTrigger value="invoice" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              {language === "bn" ? "ইনভয়েস" : "Invoice"}
            </TabsTrigger>
            <TabsTrigger value="courier" className="flex items-center gap-2">
              <Truck className="h-4 w-4" />
              {language === "bn" ? "কুরিয়ার" : "Courier"}
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              WhatsApp
            </TabsTrigger>
            <TabsTrigger value="sms" className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              SMS
            </TabsTrigger>
            <TabsTrigger value="pos-print" className="flex items-center gap-2">
              <Printer className="h-4 w-4" />
              {language === "bn" ? "POS প্রিন্ট" : "POS Print"}
            </TabsTrigger>
            <TabsTrigger value="chatbot" className="flex items-center gap-2">
              <Bot className="h-4 w-4" />
              {language === "bn" ? "চ্যাটবট" : "Chatbot"}
            </TabsTrigger>
            <TabsTrigger value="backend" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              {language === "bn" ? "ব্যাকএন্ড" : "Backend"}
            </TabsTrigger>
          </TabsList>

          {/* Theme Color Settings Tab */}
          <TabsContent value="theme" className="space-y-6 mt-6">
            <ThemeColorSettings />
            <LoadingAnimationSettings />
          </TabsContent>

          {/* Language Settings Tab */}
          <TabsContent value="language" className="space-y-6 mt-6">
            <Card className="border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  {t.languageSettings}
                </CardTitle>
                <CardDescription>
                  {language === "bn" 
                    ? "ওয়েবসাইটের প্রাথমিক ভাষা নির্বাচন করুন। সমস্ত লেবেল, বাটন, নোটিফিকেশন এবং রিপোর্ট স্বয়ংক্রিয়ভাবে অনুবাদ হবে।"
                    : "Select the primary language for the website. All labels, buttons, notifications, and reports will be dynamically translated."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">{t.primaryLanguage}</Label>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div
                      onClick={() => handleLanguageChange("bn")}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                        language === "bn" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          language === "bn" ? "border-primary" : "border-muted-foreground"
                        }`}>
                          {language === "bn" && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">বাংলা</p>
                          <p className="text-sm text-muted-foreground">Bengali / Bangla</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        সমগ্র ওয়েবসাইট বাংলায় প্রদর্শিত হবে
                      </p>
                    </div>

                    <div
                      onClick={() => handleLanguageChange("en")}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                        language === "en" 
                          ? "border-primary bg-primary/5" 
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          language === "en" ? "border-primary" : "border-muted-foreground"
                        }`}>
                          {language === "en" && (
                            <div className="h-2 w-2 rounded-full bg-primary" />
                          )}
                        </div>
                        <div>
                          <p className="font-semibold">English</p>
                          <p className="text-sm text-muted-foreground">ইংরেজি</p>
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        Entire website will be displayed in English
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>{language === "bn" ? "নোট:" : "Note:"}</strong>{" "}
                    {language === "bn"
                      ? "ভাষা পরিবর্তন করলে সমস্ত পৃষ্ঠায় অবিলম্বে প্রযোজ্য হবে। ব্যবহারকারীর তৈরি করা বিষয়বস্তু (যেমন রিপোর্ট, নোট) অনুবাদ হবে না।"
                      : "Language changes will apply immediately across all pages. User-generated content (like reports, notes) will not be translated."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Font Settings Tab */}
          <TabsContent value="font" className="space-y-6 mt-6">
            <LanguageFontSettings />
          </TabsContent>

          {/* Currency Settings Tab */}
          <TabsContent value="currency" className="space-y-6 mt-6">
            <Card className="border-secondary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-secondary" />
                  {t.currencySettings}
                </CardTitle>
                <CardDescription>
                  {language === "bn"
                    ? "দেশের মুদ্রা নির্বাচন করুন। ওয়েবসাইটে ব্যবহৃত সমস্ত মুদ্রা নির্বাচিত মুদ্রায় রূপান্তরিত হবে।"
                    : "Select country currency. All currencies used on the website will be converted to the selected currency immediately."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <Label className="text-base font-semibold">{t.defaultCurrency}</Label>
                  <Select value={currency} onValueChange={(v) => handleCurrencyChange(v as CurrencyCode)}>
                    <SelectTrigger className="w-full md:w-[300px]">
                      <SelectValue>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">{currencyInfo.symbol}</span>
                          <span>{language === "bn" ? currencyInfo.nameBn : currencyInfo.name}</span>
                          <span className="text-muted-foreground">({currencyInfo.code})</span>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(currencies).map((curr) => (
                        <SelectItem key={curr.code} value={curr.code}>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold w-6">{curr.symbol}</span>
                            <span>{language === "bn" ? curr.nameBn : curr.name}</span>
                            <span className="text-muted-foreground">({curr.code})</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  {Object.values(currencies).slice(0, 6).map((curr) => (
                    <div
                      key={curr.code}
                      onClick={() => handleCurrencyChange(curr.code)}
                      className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-secondary/50 ${
                        currency === curr.code
                          ? "border-secondary bg-secondary/5"
                          : "border-border"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-2xl font-bold">{curr.symbol}</p>
                          <p className="text-sm font-medium">{curr.code}</p>
                        </div>
                        <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                          currency === curr.code ? "border-secondary" : "border-muted-foreground"
                        }`}>
                          {currency === curr.code && (
                            <div className="h-2 w-2 rounded-full bg-secondary" />
                          )}
                        </div>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {language === "bn" ? curr.nameBn : curr.name}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="rounded-lg bg-muted/50 p-4">
                  <p className="text-sm text-muted-foreground">
                    <strong>{language === "bn" ? "নোট:" : "Note:"}</strong>{" "}
                    {language === "bn"
                      ? "মুদ্রা রূপান্তর বর্তমান বিনিময় হারের উপর ভিত্তি করে। প্রকৃত মূল্য সামান্য ভিন্ন হতে পারে।"
                      : "Currency conversion is based on approximate exchange rates. Actual prices may vary slightly."
                    }
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Settings Tab */}
          <TabsContent value="payment" className="space-y-6 mt-6">
            <Card className="border-pink-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-pink-500 flex items-center justify-center text-white font-bold text-xs">
                    bK
                  </div>
                  {language === "bn" ? "বিকাশ সেটিংস" : "bKash Settings"}
                </CardTitle>
                <CardDescription>
                  {language === "bn" 
                    ? "বিকাশ পেমেন্ট অপশন কনফিগার করুন"
                    : "Configure bKash payment option"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="bkash_enabled">{language === "bn" ? "বিকাশ সক্রিয়" : "bKash Enabled"}</Label>
                  <Switch
                    id="bkash_enabled"
                    checked={localSettings.payment_bkash_enabled !== "false"}
                    onCheckedChange={(checked) =>
                      handleSettingChange("payment_bkash_enabled", checked.toString())
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "বিকাশ নম্বর" : "bKash Number"}</Label>
                    <Input
                      value={localSettings.payment_bkash_number || ""}
                      onChange={(e) => handleSettingChange("payment_bkash_number", e.target.value)}
                      placeholder="01711-XXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "একাউন্ট টাইপ" : "Account Type"}</Label>
                    <Select
                      value={localSettings.payment_bkash_type || "Personal"}
                      onValueChange={(v) => handleSettingChange("payment_bkash_type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Merchant">Merchant</SelectItem>
                        <SelectItem value="Agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-orange-500 flex items-center justify-center text-white font-bold text-xs">
                    N
                  </div>
                  {language === "bn" ? "নগদ সেটিংস" : "Nagad Settings"}
                </CardTitle>
                <CardDescription>
                  {language === "bn" 
                    ? "নগদ পেমেন্ট অপশন কনফিগার করুন"
                    : "Configure Nagad payment option"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="nagad_enabled">{language === "bn" ? "নগদ সক্রিয়" : "Nagad Enabled"}</Label>
                  <Switch
                    id="nagad_enabled"
                    checked={localSettings.payment_nagad_enabled !== "false"}
                    onCheckedChange={(checked) =>
                      handleSettingChange("payment_nagad_enabled", checked.toString())
                    }
                  />
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "নগদ নম্বর" : "Nagad Number"}</Label>
                    <Input
                      value={localSettings.payment_nagad_number || ""}
                      onChange={(e) => handleSettingChange("payment_nagad_number", e.target.value)}
                      placeholder="01811-XXXXXX"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>{language === "bn" ? "একাউন্ট টাইপ" : "Account Type"}</Label>
                    <Select
                      value={localSettings.payment_nagad_type || "Personal"}
                      onValueChange={(v) => handleSettingChange("payment_nagad_type", v)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Personal">Personal</SelectItem>
                        <SelectItem value="Merchant">Merchant</SelectItem>
                        <SelectItem value="Agent">Agent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-green-500/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded bg-green-500 flex items-center justify-center text-white font-bold text-xs">
                    COD
                  </div>
                  {language === "bn" ? "ক্যাশ অন ডেলিভারি" : "Cash on Delivery"}
                </CardTitle>
                <CardDescription>
                  {language === "bn" 
                    ? "পণ্য হাতে পেয়ে পেমেন্ট করার অপশন"
                    : "Pay when product is delivered"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <Label htmlFor="cod_enabled">{language === "bn" ? "COD সক্রিয়" : "COD Enabled"}</Label>
                  <Switch
                    id="cod_enabled"
                    checked={localSettings.payment_cod_enabled !== "false"}
                    onCheckedChange={(checked) =>
                      handleSettingChange("payment_cod_enabled", checked.toString())
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <div className="rounded-lg bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                <strong>{language === "bn" ? "নোট:" : "Note:"}</strong>{" "}
                {language === "bn"
                  ? "পেমেন্ট সেটিংস পরিবর্তন করলে চেকআউট পেজে অবিলম্বে প্রযোজ্য হবে। সেভ করতে ভুলবেন না।"
                  : "Payment settings changes will apply immediately on checkout page. Don't forget to save."
                }
              </p>
            </div>

            <Separator className="my-6" />

            {/* Merchant API Gateway Settings */}
            <PaymentGatewaySettings />

            <Separator className="my-6" />

            {/* Delivery & Partial Payment Settings */}
            <DeliverySettingsAdmin />
          </TabsContent>

          {/* Email/SMTP Settings Tab */}
          <TabsContent value="email" className="space-y-6 mt-6">
            <SmtpSettingsTab />
            <EmailLogsViewer />
          </TabsContent>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6 mt-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                {settings
                  .filter(s => !s.setting_key.startsWith("payment_") && !s.setting_key.startsWith("theme_"))
                  .map((setting) => (
                  <Card key={setting.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-lg">
                        <Settings className="h-5 w-5 text-accent" />
                        {getSettingLabel(setting.setting_key)}
                      </CardTitle>
                      {setting.description && (
                        <CardDescription>{setting.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent>{renderSettingInput(setting)}</CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Timezone Settings */}
            <Card className="border-accent/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5 text-accent" />
                  {t.additionalConfig}
                </CardTitle>
                <CardDescription>{t.advancedSettings}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>{t.timezone}</Label>
                    <Select defaultValue="asia/dhaka">
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="asia/dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                        <SelectItem value="utc">UTC</SelectItem>
                        <SelectItem value="asia/kolkata">Asia/Kolkata (GMT+5:30)</SelectItem>
                        <SelectItem value="europe/london">Europe/London (GMT)</SelectItem>
                        <SelectItem value="america/new_york">America/New_York (GMT-5)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* SEO Settings Tab */}
          <TabsContent value="seo" className="space-y-6 mt-6">
            <GlobalSeoSettings />
          </TabsContent>

          {/* Invoice Settings Tab */}
          <TabsContent value="invoice" className="space-y-6 mt-6">
            <InvoiceSettings />
          </TabsContent>

          {/* Courier Settings Tab */}
          <TabsContent value="courier" className="space-y-6 mt-6">
            <Tabs defaultValue="steadfast" className="w-full">
              <TabsList className="w-full">
                <TabsTrigger value="steadfast" className="flex-1">
                  <Truck className="h-4 w-4 mr-2" />
                  Steadfast
                </TabsTrigger>
                <TabsTrigger value="sundarban" className="flex-1">
                  <Truck className="h-4 w-4 mr-2" />
                  সুন্দরবন
                </TabsTrigger>
                <TabsTrigger value="redx" className="flex-1">
                  <Truck className="h-4 w-4 mr-2" />
                  RedX
                </TabsTrigger>
              </TabsList>
              <TabsContent value="steadfast" className="mt-4">
                <SteadfastCourierSettings />
              </TabsContent>
              <TabsContent value="sundarban" className="mt-4">
                <SundarbanCourierSettings />
              </TabsContent>
              <TabsContent value="redx" className="mt-4">
                <RedxCourierSettings />
              </TabsContent>
            </Tabs>
          </TabsContent>

          {/* WhatsApp Settings Tab */}
          <TabsContent value="whatsapp" className="space-y-6 mt-6">
            <WhatsAppSettings />
          </TabsContent>

          {/* SMS Settings Tab */}
          <TabsContent value="sms" className="space-y-6 mt-6">
            <SmsSettings />
          </TabsContent>

          {/* POS Print Settings Tab */}
          <TabsContent value="pos-print" className="space-y-6 mt-6">
            <POSPrintSettings />
          </TabsContent>

          {/* Chatbot Settings Tab */}
          <TabsContent value="chatbot" className="space-y-6 mt-6">
            <ChatbotSettings />
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
