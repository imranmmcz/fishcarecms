import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { 
  Sun, 
  Moon, 
  Bell, 
  BellOff, 
  Mail, 
  Smartphone, 
  Volume2, 
  VolumeX,
  Save,
  Palette,
  Monitor
} from "lucide-react";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

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

  useEffect(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem("dashboardSettings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }
    
    // Apply theme on load
    const savedTheme = localStorage.getItem("theme") || "system";
    applyTheme(savedTheme as "light" | "dark" | "system");
  }, []);

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
      notifications: {
        ...prev.notifications,
        [key]: value,
      },
    }));
  };

  const handleSave = () => {
    setSaving(true);
    localStorage.setItem("dashboardSettings", JSON.stringify(settings));
    
    setTimeout(() => {
      setSaving(false);
      toast.success("সেটিংস সফলভাবে সংরক্ষিত হয়েছে!");
    }, 500);
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">সেটিংস</h1>
          <p className="text-muted-foreground">আপনার ড্যাশবোর্ড কাস্টমাইজ করুন</p>
        </div>

        {/* Theme Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              থিম সেটিংস
            </CardTitle>
            <CardDescription>আপনার পছন্দ অনুযায়ী থিম নির্বাচন করুন</CardDescription>
          </CardHeader>
          <CardContent>
            <RadioGroup
              value={settings.theme}
              onValueChange={(value) => handleThemeChange(value as "light" | "dark" | "system")}
              className="grid grid-cols-3 gap-4"
            >
              <div>
                <RadioGroupItem value="light" id="light" className="peer sr-only" />
                <Label
                  htmlFor="light"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <Sun className="h-6 w-6 mb-2 text-yellow-500" />
                  <span className="text-sm font-medium">লাইট</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="dark" id="dark" className="peer sr-only" />
                <Label
                  htmlFor="dark"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <Moon className="h-6 w-6 mb-2 text-blue-500" />
                  <span className="text-sm font-medium">ডার্ক</span>
                </Label>
              </div>
              <div>
                <RadioGroupItem value="system" id="system" className="peer sr-only" />
                <Label
                  htmlFor="system"
                  className="flex flex-col items-center justify-between rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary cursor-pointer transition-all"
                >
                  <Monitor className="h-6 w-6 mb-2 text-gray-500" />
                  <span className="text-sm font-medium">সিস্টেম</span>
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
              নোটিফিকেশন সেটিংস
            </CardTitle>
            <CardDescription>কোন নোটিফিকেশন পেতে চান তা নির্বাচন করুন</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Notification Channels */}
            <div className="space-y-4">
              <h4 className="text-sm font-medium text-muted-foreground">নোটিফিকেশন চ্যানেল</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/10">
                    <Mail className="h-5 w-5 text-blue-500" />
                  </div>
                  <div>
                    <Label htmlFor="email-notif" className="text-base">ইমেইল নোটিফিকেশন</Label>
                    <p className="text-sm text-muted-foreground">গুরুত্বপূর্ণ আপডেট ইমেইলে পান</p>
                  </div>
                </div>
                <Switch
                  id="email-notif"
                  checked={settings.notifications.email}
                  onCheckedChange={(checked) => handleNotificationChange("email", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-500/10">
                    <Smartphone className="h-5 w-5 text-green-500" />
                  </div>
                  <div>
                    <Label htmlFor="push-notif" className="text-base">পুশ নোটিফিকেশন</Label>
                    <p className="text-sm text-muted-foreground">ব্রাউজার নোটিফিকেশন পান</p>
                  </div>
                </div>
                <Switch
                  id="push-notif"
                  checked={settings.notifications.push}
                  onCheckedChange={(checked) => handleNotificationChange("push", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10">
                    {settings.notifications.sound ? (
                      <Volume2 className="h-5 w-5 text-purple-500" />
                    ) : (
                      <VolumeX className="h-5 w-5 text-purple-500" />
                    )}
                  </div>
                  <div>
                    <Label htmlFor="sound-notif" className="text-base">সাউন্ড নোটিফিকেশন</Label>
                    <p className="text-sm text-muted-foreground">নোটিফিকেশনের সাথে শব্দ বাজুক</p>
                  </div>
                </div>
                <Switch
                  id="sound-notif"
                  checked={settings.notifications.sound}
                  onCheckedChange={(checked) => handleNotificationChange("sound", checked)}
                />
              </div>
            </div>

            {/* Alert Types */}
            <div className="space-y-4 pt-4 border-t">
              <h4 className="text-sm font-medium text-muted-foreground">অ্যালার্ট টাইপ</h4>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <Bell className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div>
                    <Label htmlFor="income-alert" className="text-base">আয় অ্যালার্ট</Label>
                    <p className="text-sm text-muted-foreground">নতুন আয় যোগ হলে জানান</p>
                  </div>
                </div>
                <Switch
                  id="income-alert"
                  checked={settings.notifications.incomeAlerts}
                  onCheckedChange={(checked) => handleNotificationChange("incomeAlerts", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-rose-500/10">
                    <Bell className="h-5 w-5 text-rose-500" />
                  </div>
                  <div>
                    <Label htmlFor="expense-alert" className="text-base">ব্যয় অ্যালার্ট</Label>
                    <p className="text-sm text-muted-foreground">নতুন ব্যয় যোগ হলে জানান</p>
                  </div>
                </div>
                <Switch
                  id="expense-alert"
                  checked={settings.notifications.expenseAlerts}
                  onCheckedChange={(checked) => handleNotificationChange("expenseAlerts", checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Bell className="h-5 w-5 text-amber-500" />
                  </div>
                  <div>
                    <Label htmlFor="report-reminder" className="text-base">রিপোর্ট রিমাইন্ডার</Label>
                    <p className="text-sm text-muted-foreground">সাপ্তাহিক রিপোর্ট রিমাইন্ডার</p>
                  </div>
                </div>
                <Switch
                  id="report-reminder"
                  checked={settings.notifications.reportReminders}
                  onCheckedChange={(checked) => handleNotificationChange("reportReminders", checked)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button onClick={handleSave} disabled={saving} className="w-full" size="lg">
          {saving ? (
            <>সংরক্ষণ হচ্ছে...</>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              সেটিংস সংরক্ষণ করুন
            </>
          )}
        </Button>
      </div>
    </DashboardLayout>
  );
}
