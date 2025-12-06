import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Settings, Save, Loader2, RefreshCw } from "lucide-react";

interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
  description: string | null;
}

const AdminSettings = () => {
  const { toast } = useToast();
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
        title: "ত্রুটি",
        description: "সেটিংস লোড করতে সমস্যা হয়েছে",
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
        title: "সফল",
        description: "সেটিংস সংরক্ষণ করা হয়েছে",
      });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "ত্রুটি",
        description: "সেটিংস সংরক্ষণ করতে সমস্যা হয়েছে",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getSettingLabel = (key: string): string => {
    const labels: Record<string, string> = {
      app_name: "অ্যাপ্লিকেশনের নাম",
      maintenance_mode: "মেইনটেনেন্স মোড",
      max_ponds_per_user: "সর্বোচ্চ পুকুর সংখ্যা",
      backup_frequency: "ব্যাকআপ ফ্রিকোয়েন্সি",
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
              {value === "true" ? "সক্রিয়" : "নিষ্ক্রিয়"}
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
              <SelectItem value="daily">দৈনিক</SelectItem>
              <SelectItem value="weekly">সাপ্তাহিক</SelectItem>
              <SelectItem value="monthly">মাসিক</SelectItem>
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
            <h1 className="text-2xl font-bold text-foreground">সিস্টেম সেটিংস</h1>
            <p className="text-muted-foreground">অ্যাপ্লিকেশন কনফিগারেশন পরিচালনা করুন</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={fetchSettings} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              রিফ্রেশ
            </Button>
            <Button onClick={saveSettings} disabled={isSaving}>
              {isSaving ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              সংরক্ষণ করুন
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {settings.map((setting) => (
              <Card key={setting.id}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Settings className="h-5 w-5 text-amber-500" />
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

        {/* Additional Settings Section */}
        <Card className="border-amber-500/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-amber-500" />
              অতিরিক্ত কনফিগারেশন
            </CardTitle>
            <CardDescription>অ্যাডভান্সড সেটিংস</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>ডিফল্ট ভাষা</Label>
                <Select defaultValue="bn">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bn">বাংলা</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>টাইমজোন</Label>
                <Select defaultValue="asia/dhaka">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="asia/dhaka">Asia/Dhaka (GMT+6)</SelectItem>
                    <SelectItem value="utc">UTC</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminSettings;
