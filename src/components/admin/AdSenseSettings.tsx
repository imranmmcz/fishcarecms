import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, RefreshCw, Tv, LayoutTemplate, PanelBottom, FileText, Layers, Code, Globe } from "lucide-react";
import { Separator } from "@/components/ui/separator";

interface AdSettings {
  id: string;
  ad_client_id: string | null;
  header_ad_enabled: boolean;
  header_ad_slot: string | null;
  sidebar_ad_enabled: boolean;
  sidebar_ad_slot: string | null;
  footer_ad_enabled: boolean;
  footer_ad_slot: string | null;
  in_article_ad_enabled: boolean;
  in_article_ad_slot: string | null;
  between_modules_ad_enabled: boolean;
  between_modules_ad_slot: string | null;
}

export function AdSenseSettings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<AdSettings | null>(null);

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("ad_settings")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (!data) {
        const { data: newData, error: insertError } = await supabase
          .from("ad_settings")
          .insert({})
          .select()
          .single();
        if (insertError) throw insertError;
        setSettings(newData);
      } else {
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching ad settings:", error);
      toast.error("অ্যাড সেটিংস লোড করতে সমস্যা হয়েছে");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("ad_settings")
        .update({
          ad_client_id: settings.ad_client_id,
          header_ad_enabled: settings.header_ad_enabled,
          header_ad_slot: settings.header_ad_slot,
          sidebar_ad_enabled: settings.sidebar_ad_enabled,
          sidebar_ad_slot: settings.sidebar_ad_slot,
          footer_ad_enabled: settings.footer_ad_enabled,
          footer_ad_slot: settings.footer_ad_slot,
          in_article_ad_enabled: settings.in_article_ad_enabled,
          in_article_ad_slot: settings.in_article_ad_slot,
          between_modules_ad_enabled: settings.between_modules_ad_enabled,
          between_modules_ad_slot: settings.between_modules_ad_slot,
        })
        .eq("id", settings.id);

      if (error) throw error;
      toast.success("অ্যাডসেন্স সেটিংস সফলভাবে সংরক্ষিত হয়েছে");
    } catch (error) {
      console.error("Error saving ad settings:", error);
      toast.error("সেটিংস সংরক্ষণে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof AdSettings, value: any) => {
    if (settings) {
      setSettings({ ...settings, [key]: value });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <RefreshCw className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const adPositions = [
    {
      icon: LayoutTemplate,
      title: "হেডার বিজ্ঞাপন (Header Ad)",
      description: "পেজের উপরে হেডার সেকশনে বিজ্ঞাপন দেখাবে",
      enabledKey: "header_ad_enabled" as keyof AdSettings,
      slotKey: "header_ad_slot" as keyof AdSettings,
    },
    {
      icon: FileText,
      title: "বডি / আর্টিকেল বিজ্ঞাপন (Body Ad)",
      description: "কন্টেন্ট / আর্টিকেলের মধ্যে বিজ্ঞাপন দেখাবে",
      enabledKey: "in_article_ad_enabled" as keyof AdSettings,
      slotKey: "in_article_ad_slot" as keyof AdSettings,
    },
    {
      icon: Layers,
      title: "মডিউল বিজ্ঞাপন (Between Modules Ad)",
      description: "মডিউল কার্ডের মধ্যে বিজ্ঞাপন দেখাবে",
      enabledKey: "between_modules_ad_enabled" as keyof AdSettings,
      slotKey: "between_modules_ad_slot" as keyof AdSettings,
    },
    {
      icon: LayoutTemplate,
      title: "সাইডবার বিজ্ঞাপন (Sidebar Ad)",
      description: "সাইডবারে বিজ্ঞাপন দেখাবে",
      enabledKey: "sidebar_ad_enabled" as keyof AdSettings,
      slotKey: "sidebar_ad_slot" as keyof AdSettings,
    },
    {
      icon: PanelBottom,
      title: "ফুটার বিজ্ঞাপন (Footer Ad)",
      description: "পেজের নিচে ফুটার সেকশনে বিজ্ঞাপন দেখাবে",
      enabledKey: "footer_ad_enabled" as keyof AdSettings,
      slotKey: "footer_ad_slot" as keyof AdSettings,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Global AdSense Connection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            সাইটে AdSense সংযুক্ত করুন
          </CardTitle>
          <CardDescription>
            আপনার Google AdSense পাবলিশার আইডি দিয়ে পুরো সাইটকে AdSense এর সাথে সংযুক্ত করুন। 
            এই আইডি সকল বিজ্ঞাপন স্লটে ব্যবহৃত হবে।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="font-medium">AdSense Client ID (Publisher ID)</Label>
            <Input
              placeholder="ca-pub-XXXXXXXXXXXXXXXXXX"
              value={settings?.ad_client_id || ""}
              onChange={(e) => updateSetting("ad_client_id", e.target.value)}
              className="max-w-md font-mono"
            />
            <p className="text-xs text-muted-foreground">
              আপনার Google AdSense অ্যাকাউন্ট থেকে Publisher ID কপি করুন (যেমন: ca-pub-1234567890123456)
            </p>
          </div>

          {settings?.ad_client_id && (
            <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
              <p className="text-sm text-primary flex items-center gap-2">
                <Globe className="h-4 w-4" />
                ✅ AdSense সংযুক্ত আছে: <code className="font-mono bg-primary/10 px-1 rounded">{settings.ad_client_id}</code>
              </p>
            </div>
          )}

          {!settings?.ad_client_id && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-destructive flex items-center gap-2">
                ⚠️ AdSense এখনো সংযুক্ত হয়নি। বিজ্ঞাপন দেখাতে Publisher ID দিন।
              </p>
            </div>
          )}

          <Separator />

          <div className="space-y-2">
            <Label className="font-medium flex items-center gap-2">
              <Code className="h-4 w-4" />
              AdSense Auto Ads Script (ঐচ্ছিক)
            </Label>
            <p className="text-xs text-muted-foreground mb-2">
              Google AdSense থেকে প্রাপ্ত সম্পূর্ণ স্ক্রিপ্ট কোড এখানে পেস্ট করুন। এটি সাইটের &lt;head&gt; এ যুক্ত হবে।
              Auto Ads চালু থাকলে Google নিজে থেকে সেরা জায়গায় বিজ্ঞাপন দেখাবে।
            </p>
            <Textarea
              placeholder={`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-XXXXXXXXXX" crossorigin="anonymous"></script>`}
              className="font-mono text-xs min-h-[80px]"
              readOnly
              value={
                settings?.ad_client_id
                  ? `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.ad_client_id}" crossorigin="anonymous"></script>`
                  : ""
              }
            />
            <p className="text-xs text-muted-foreground">
              ℹ️ Publisher ID দেওয়া হলে এই স্ক্রিপ্ট স্বয়ংক্রিয়ভাবে সাইটে যুক্ত হবে।
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Ad Position Cards */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tv className="h-5 w-5 text-primary" />
            বিজ্ঞাপনের অবস্থান (Ad Positions)
          </CardTitle>
          <CardDescription>
            হেডার, বডি এবং ফুটারে কোন কোন জায়গায় বিজ্ঞাপন দেখাবে তা নির্ধারণ করুন। 
            প্রতিটি অবস্থানের জন্য আলাদা Ad Slot ID দিন।
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {adPositions.map((pos) => {
            const Icon = pos.icon;
            const isEnabled = settings?.[pos.enabledKey] as boolean;
            return (
              <Card key={pos.enabledKey} className="border-border/50">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{pos.title}</h4>
                          <p className="text-sm text-muted-foreground">{pos.description}</p>
                        </div>
                        <Switch
                          checked={isEnabled}
                          onCheckedChange={(checked) => updateSetting(pos.enabledKey, checked)}
                        />
                      </div>
                      {isEnabled && (
                        <div className="space-y-2">
                          <Label className="text-sm">Ad Slot ID</Label>
                          <Input
                            placeholder="1234567890"
                            value={(settings?.[pos.slotKey] as string) || ""}
                            onChange={(e) => updateSetting(pos.slotKey, e.target.value)}
                            className="font-mono"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={fetchSettings} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          রিফ্রেশ
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "সংরক্ষণ হচ্ছে..." : "সংরক্ষণ করুন"}
        </Button>
      </div>
    </div>
  );
}
