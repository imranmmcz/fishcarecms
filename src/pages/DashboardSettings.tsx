import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Sun, 
  Moon, 
  Bell, 
  Mail, 
  Smartphone, 
  Volume2, 
  VolumeX,
  Save,
  Palette,
  Monitor,
  CloudUpload,
  ChevronRight,
  Globe,
  DollarSign
} from "lucide-react";
import { Link } from "react-router-dom";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useLanguage, Language } from "@/contexts/LanguageContext";
import { useCurrency, currencies, CurrencyCode } from "@/contexts/CurrencyContext";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Settings {
  theme: "light" | "dark" | "system";
  notifications: {
    email: boolean;
    push: boolean;
    sound: boolean;
    incomeAlerts: boolean;
    expenseAlerts: boolean;
    reportReminders: boolean;
  };
}

const defaultSettings: Settings = {
  theme: "system",
  notifications: {
    email: true,
    push: true,
    sound: true,
    incomeAlerts: true,
    expenseAlerts: true,
    reportReminders: true,
  },
};

export default function DashboardSettings() {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const { language, setLanguage, t } = useLanguage();
  const { currency, setCurrency, currencyInfo } = useCurrency();
  const { user } = useAuth();

  useEffect(() => {
    const loadSettings = async () => {
      if (!user) { setLoading(false); return; }
      try {
        const { data, error } = await supabase.from("profiles").select("dashboard_settings").eq("user_id", user.id).single();
        if (!error && data?.dashboard_settings) {
          const saved = data.dashboard_settings as unknown as Settings;
          setSettings(saved);
          applyTheme(saved.theme);
        } else {
          const savedTheme = localStorage.getItem("theme") || "system";
          applyTheme(savedTheme as "light" | "dark" | "system");
        }
      } catch {
        const savedTheme = localStorage.getItem("theme") || "system";
        applyTheme(savedTheme as "light" | "dark" | "system");
      }
      setLoading(false);
    };
    loadSettings();
  }, [user]);

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
      root.classList.remove("light", "dark");
      root.classList.add(systemTheme);
    } else {
      root.classList.remove("light", "dark");
      root.classList.add(theme);
    }
    localStorage.setItem("theme", theme);
  };

  const handleThemeChange = (theme: "light" | "dark" | "system") => {
    setSettings(prev => ({ ...prev, theme }));
    applyTheme(theme);
  };

  const handleNotificationChange = (key: keyof Settings["notifications"], value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notifications: { ...prev.notifications, [key]: value },
    }));
  };

  const handleLanguageChange = (lang: Language) => {
    setLanguage(lang);
    toast.success(t.settingsSaved);
  };

  const handleCurrencyChange = (curr: CurrencyCode) => {
    setCurrency(curr);
    toast.success(t.settingsSaved);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (user) {
        const { error } = await supabase.from("profiles").update({ dashboard_settings: settings as any }).eq("user_id", user.id);
        if (error) throw error;
      } else {
        localStorage.setItem("dashboardSettings", JSON.stringify(settings));
      }
      toast.success(t.settingsSaved);
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error(language === "bn" ? "সেটিংস সংরক্ষণে সমস্যা হয়েছে" : "Failed to save settings");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t.settings}</h1>
          <p className="text-muted-foreground">
            {language === "bn" ? "আপনার ড্যাশবোর্ড কাস্টমাইজ করুন" : "Customize your dashboard"}
          </p>
        </div>

        {/* Language Settings */}
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-primary" />
              {t.languageSettings}
            </CardTitle>
            <CardDescription>
              {language === "bn" ? "ওয়েবসাইটের ভাষা নির্বাচন করুন" : "Select the website language"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div
                onClick={() => handleLanguageChange("bn")}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                  language === "bn" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    language === "bn" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {language === "bn" && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-semibold">বাংলা</p>
                    <p className="text-sm text-muted-foreground">Bengali</p>
                  </div>
                </div>
              </div>
              <div
                onClick={() => handleLanguageChange("en")}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:border-primary/50 ${
                  language === "en" ? "border-primary bg-primary/5" : "border-border"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                    language === "en" ? "border-primary" : "border-muted-foreground"
                  }`}>
                    {language === "en" && <div className="h-2 w-2 rounded-full bg-primary" />}
                  </div>
                  <div>
                    <p className="font-semibold">English</p>
                    <p className="text-sm text-muted-foreground">ইংরেজি</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Currency Settings */}
        <Card className="border-secondary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-secondary" />
              {t.currencySettings}
            </CardTitle>
            <CardDescription>
              {language === "bn" ? "মূল্য প্রদর্শনের জন্য মুদ্রা নির্বাচন করুন" : "Select currency for price display"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={currency} onValueChange={(v) => handleCurrencyChange(v as CurrencyCode)}>
              <SelectTrigger className="w-full">
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
            <div className="grid grid-cols-3 gap-3">
              {Object.values(currencies).slice(0, 6).map((curr) => (
                <div
                  key={curr.code}
                  onClick={() => handleCurrencyChange(curr.code)}
                  className={`cursor-pointer rounded-lg border-2 p-3 transition-all hover:border-secondary/50 text-center ${
                    currency === curr.code ? "border-secondary bg-secondary/5" : "border-border"
                  }`}
                >
                  <p className="text-xl font-bold">{curr.symbol}</p>
                  <p className="text-xs text-muted-foreground">{curr.code}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              {t.themeSettings}
            </CardTitle>
            <CardDescription>
              {language === "bn" ? "আপনার পছন্দ অনুযায়ী থিম নির্বাচন করুন" : "Select your preferred theme"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings.theme}
              onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "system")}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label htmlFor="light" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                  <Sun className="h-6 w-6 mb-2 text-yellow-500" />
                  <span className="text-sm font-medium">{t.lightTheme}</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label htmlFor="dark" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                  <Moon className="h-6 w-6 mb-2 text-blue-500" />
                  <span className="text-sm font-medium">{t.darkTheme}</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label htmlFor="system" className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                  <Monitor className="h-6 w-6 mb-2 text-gray-500" />
                  <span className="text-sm font-medium">{t.systemTheme}</span>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Notification Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              {t.notificationSettings}
            </CardTitle>
            <CardDescription>
              {language === "bn" ? "কোন নোটিফিকেশন পেতে চান তা নির্বাচন করুন" : "Choose which notifications to receive"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">
                {language === "bn" ? "নোটিফিকেশন চ্যানেল" : "Notification Channels"}
              </h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10"><Mail className="h-5 w-5 text-blue-500" /></div>
                  <div>
                    <Label htmlFor="email-notif" className="text-base">{t.emailNotifications}</Label>
                    <p className="text-sm text-muted-foreground">{language === "bn" ? "গুরুত্বপূর্ণ আপডেট ইমেইলে পান" : "Receive important updates via email"}</p>
                  </div>
                </div>
                <Switch id="email-notif" checked={settings.notifications.email} onCheckedChange={(checked) => handleNotificationChange("email", checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10"><Smartphone className="h-5 w-5 text-green-500" /></div>
                  <div>
                    <Label htmlFor="push-notif" className="text-base">{t.pushNotifications}</Label>
                    <p className="text-sm text-muted-foreground">{language === "bn" ? "ব্রাউজার নোটিফিকেশন পান" : "Receive browser notifications"}</p>
                  </div>
                </div>
                <Switch id="push-notif" checked={settings.notifications.push} onCheckedChange={(checked) => handleNotificationChange("push", checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    {settings.notifications.sound ? <Volume2 className="h-5 w-5 text-purple-500" /> : <VolumeX className="h-5 w-5 text-purple-500" />}
                  </div>
                  <div>
                    <Label htmlFor="sound-notif" className="text-base">{language === "bn" ? "সাউন্ড নোটিফিকেশন" : "Sound Notifications"}</Label>
                    <p className="text-sm text-muted-foreground">{language === "bn" ? "নোটিফিকেশনের সাথে শব্দ বাজুক" : "Play sound with notifications"}</p>
                  </div>
                </div>
                <Switch id="sound-notif" checked={settings.notifications.sound} onCheckedChange={(checked) => handleNotificationChange("sound", checked)} />
              </div>
            </div>
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">{language === "bn" ? "অ্যালার্ট টাইপ" : "Alert Types"}</h4>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10"><Bell className="h-5 w-5 text-emerald-500" /></div>
                  <div>
                    <Label htmlFor="income-alert" className="text-base">{language === "bn" ? "আয় অ্যালার্ট" : "Income Alerts"}</Label>
                    <p className="text-sm text-muted-foreground">{language === "bn" ? "নতুন আয় যোগ হলে জানান" : "Get notified on new income"}</p>
                  </div>
                </div>
                <Switch id="income-alert" checked={settings.notifications.incomeAlerts} onCheckedChange={(checked) => handleNotificationChange("incomeAlerts", checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10"><Bell className="h-5 w-5 text-rose-500" /></div>
                  <div>
                    <Label htmlFor="expense-alert" className="text-base">{language === "bn" ? "ব্যয় অ্যালার্ট" : "Expense Alerts"}</Label>
                    <p className="text-sm text-muted-foreground">{language === "bn" ? "নতুন ব্যয় যোগ হলে জানান" : "Get notified on new expenses"}</p>
                  </div>
                </div>
                <Switch id="expense-alert" checked={settings.notifications.expenseAlerts} onCheckedChange={(checked) => handleNotificationChange("expenseAlerts", checked)} />
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10"><Bell className="h-5 w-5 text-amber-500" /></div>
                  <div>
                    <Label htmlFor="report-reminder" className="text-base">{language === "bn" ? "রিপোর্ট রিমাইন্ডার" : "Report Reminders"}</Label>
                    <p className="text-sm text-muted-foreground">{language === "bn" ? "সাপ্তাহিক রিপোর্ট রিমাইন্ডার" : "Weekly report reminders"}</p>
                  </div>
                </div>
                <Switch id="report-reminder" checked={settings.notifications.reportReminders} onCheckedChange={(checked) => handleNotificationChange("reportReminders", checked)} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Backup Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CloudUpload className="h-5 w-5" />
              {language === "bn" ? "ব্যাকআপ সেটিংস" : "Backup Settings"}
            </CardTitle>
            <CardDescription>
              {language === "bn" ? "আপনার ডেটা ব্যাকআপ ও রিস্টোর করুন" : "Backup and restore your data"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link to="/dashboard/backup" className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-accent transition-colors group">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10"><CloudUpload className="h-5 w-5 text-indigo-500" /></div>
                <div>
                  <p className="font-medium text-foreground">{language === "bn" ? "ব্যাকআপ ম্যানেজার" : "Backup Manager"}</p>
                  <p className="text-sm text-muted-foreground">{language === "bn" ? "ডেটা ব্যাকআপ ও রিস্টোর করুন" : "Backup and restore data"}</p>
                </div>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground transition-colors" />
            </Link>
          </CardContent>
        </Card>

        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? (
            <>{language === "bn" ? "সংরক্ষণ হচ্ছে..." : "Saving..."}</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              {t.save}
            </>
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}
