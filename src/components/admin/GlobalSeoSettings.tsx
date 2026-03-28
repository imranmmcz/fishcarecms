import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Loader2, Globe, FileText, Bot, RefreshCw, Download, Copy } from "lucide-react";

const GlobalSeoSettings = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [seoSettings, setSeoSettings] = useState({
    seo_browser_tab_title: "",
    seo_site_name_suffix: "",
    seo_default_title: "",
    seo_default_description: "",
    seo_site_keywords: "",
    seo_robots_txt: `User-agent: Googlebot\nAllow: /\n\nUser-agent: Bingbot\nAllow: /\n\nUser-agent: Twitterbot\nAllow: /\n\nUser-agent: facebookexternalhit\nAllow: /\n\nUser-agent: *\nAllow: /`,
  });

  useEffect(() => {
    fetchSeoSettings();
  }, []);

  const fetchSeoSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("*")
        .in("setting_key", [
          "seo_browser_tab_title",
          "seo_site_name_suffix",
          "seo_default_title",
          "seo_default_description",
          "seo_site_keywords",
          "seo_robots_txt",
        ]);

      if (error) throw error;

      const settings: Record<string, string> = {};
      (data || []).forEach((s) => {
        settings[s.setting_key] = s.setting_value || "";
      });

      setSeoSettings((prev) => ({
        ...prev,
        ...settings,
      }));
    } catch (error) {
      console.error("Error fetching SEO settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveSeoSettings = async () => {
    setIsSaving(true);
    try {
      for (const [key, value] of Object.entries(seoSettings)) {
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", key)
          .single();

        if (existing) {
          await supabase
            .from("system_settings")
            .update({ setting_value: value })
            .eq("setting_key", key);
        } else {
          await supabase.from("system_settings").insert({
            setting_key: key,
            setting_value: value,
            description: `SEO Setting: ${key}`,
          });
        }
      }
      toast.success("SEO সেটিংস সফলভাবে সেভ হয়েছে");
    } catch (error) {
      console.error("Error saving SEO settings:", error);
      toast.error("SEO সেটিংস সেভ করতে সমস্যা হয়েছে");
    } finally {
      setIsSaving(false);
    }
  };

  const generateSitemap = () => {
    const baseUrl = "https://fishcal.lovable.app";
    const staticRoutes = [
      "/", "/shop", "/modules", "/market-price", "/fish-advice",
      "/pond-calculator", "/fish-stocking", "/feed-management",
      "/water-quality", "/cost-calculator", "/fisheries-contact",
    ];

    let xml = `<?xml version="1.0" encoding="UTF-8"?>\n`;
    xml += `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`;
    staticRoutes.forEach((route) => {
      xml += `  <url>\n`;
      xml += `    <loc>${baseUrl}${route}</loc>\n`;
      xml += `    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n`;
      xml += `    <changefreq>${route === "/" ? "daily" : "weekly"}</changefreq>\n`;
      xml += `    <priority>${route === "/" ? "1.0" : "0.8"}</priority>\n`;
      xml += `  </url>\n`;
    });
    xml += `</urlset>`;
    return xml;
  };

  const downloadSitemap = () => {
    const xml = generateSitemap();
    const blob = new Blob([xml], { type: "application/xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sitemap.xml";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("সাইটম্যাপ ডাউনলোড হয়েছে");
  };

  const copySitemap = () => {
    const xml = generateSitemap();
    navigator.clipboard.writeText(xml);
    toast.success("সাইটম্যাপ কপি হয়েছে");
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
      {/* Browser Tab Title Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            ব্রাউজার ট্যাব টাইটেল সেটিংস
          </CardTitle>
          <CardDescription>
            ব্রাউজারের ট্যাবে যে নাম দেখাবে তা এখানে সেট করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>হোম পেজ ট্যাব টাইটেল</Label>
            <Input
              value={seoSettings.seo_browser_tab_title}
              onChange={(e) => setSeoSettings((prev) => ({ ...prev, seo_browser_tab_title: e.target.value }))}
              placeholder="বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা | মৎস্য খাত ক্যালকুলেটর"
            />
            <p className="text-xs text-muted-foreground">এটি হোম পেজে ব্রাউজার ট্যাবে দেখাবে</p>
          </div>

          <div className="grid gap-2">
            <Label>সাইটের নাম (সাফিক্স)</Label>
            <Input
              value={seoSettings.seo_site_name_suffix}
              onChange={(e) => setSeoSettings((prev) => ({ ...prev, seo_site_name_suffix: e.target.value }))}
              placeholder="FishCare BD"
            />
            <p className="text-xs text-muted-foreground">
              অন্যান্য পেজে টাইটেলের শেষে যুক্ত হবে। যেমন: "শপ | FishCare BD"
            </p>
          </div>

          {/* Preview */}
          <div className="border rounded-lg p-3 bg-muted/30 space-y-2">
            <p className="text-xs text-muted-foreground font-medium">ব্রাউজার ট্যাব প্রিভিউ:</p>
            <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-2">
              <div className="h-4 w-4 rounded bg-primary/20 flex-shrink-0" />
              <span className="text-sm truncate">
                {seoSettings.seo_browser_tab_title || "বৈজ্ঞানিক মাছ চাষ ব্যবস্থাপনা | মৎস্য খাত ক্যালকুলেটর"}
              </span>
            </div>
            <div className="flex items-center gap-2 bg-background border rounded-md px-3 py-2">
              <div className="h-4 w-4 rounded bg-primary/20 flex-shrink-0" />
              <span className="text-sm truncate">
                শপ | {seoSettings.seo_site_name_suffix || "FishCare BD"}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Default Meta Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            ডিফল্ট মেটা সেটিংস
          </CardTitle>
          <CardDescription>
            সার্চ ইঞ্জিনে আপনার সাইটের ডিফল্ট তথ্য
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>ডিফল্ট মেটা টাইটেল</Label>
              <span className={`text-xs ${seoSettings.seo_default_title.length > 60 ? "text-destructive" : "text-muted-foreground"}`}>
                {seoSettings.seo_default_title.length}/60
              </span>
            </div>
            <Input
              value={seoSettings.seo_default_title}
              onChange={(e) => setSeoSettings((prev) => ({ ...prev, seo_default_title: e.target.value }))}
              placeholder="FishCare BD - মাছ চাষ ও একুয়াকালচার সলিউশন"
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>ডিফল্ট মেটা ডেসক্রিপশন</Label>
              <span className={`text-xs ${seoSettings.seo_default_description.length > 160 ? "text-destructive" : "text-muted-foreground"}`}>
                {seoSettings.seo_default_description.length}/160
              </span>
            </div>
            <Textarea
              value={seoSettings.seo_default_description}
              onChange={(e) => setSeoSettings((prev) => ({ ...prev, seo_default_description: e.target.value }))}
              placeholder="মাছ চাষের জন্য সম্পূর্ণ সমাধান। পুকুর ক্যালকুলেটর, ফিড ম্যানেজমেন্ট, ঔষধ ও সরঞ্জাম।"
              rows={3}
            />
          </div>

          <div className="grid gap-2">
            <Label>সাইট কীওয়ার্ড</Label>
            <Textarea
              value={seoSettings.seo_site_keywords}
              onChange={(e) => setSeoSettings((prev) => ({ ...prev, seo_site_keywords: e.target.value }))}
              placeholder="মাছ চাষ, একুয়াকালচার, ফিশ ফার্মিং, পুকুর ব্যবস্থাপনা, মাছের খাবার, মাছের ঔষধ"
              rows={2}
            />
            <p className="text-xs text-muted-foreground">কমা দিয়ে আলাদা করুন</p>
          </div>

          {/* SEO Preview */}
          {seoSettings.seo_default_title && (
            <div className="border rounded-lg p-3 bg-muted/30 space-y-1">
              <p className="text-xs text-muted-foreground font-medium">গুগল সার্চ প্রিভিউ:</p>
              <p className="text-blue-600 text-sm font-medium truncate">
                {seoSettings.seo_default_title}
              </p>
              <p className="text-green-700 text-xs">fishcal.lovable.app</p>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {seoSettings.seo_default_description || "কোনো ডেসক্রিপশন দেওয়া হয়নি..."}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sitemap Generator */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            সাইটম্যাপ জেনারেটর
          </CardTitle>
          <CardDescription>
            সার্চ ইঞ্জিনের জন্য XML সাইটম্যাপ তৈরি করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border rounded-lg p-3 bg-muted/30">
            <pre className="text-xs text-muted-foreground overflow-x-auto max-h-48 whitespace-pre-wrap">
              {generateSitemap()}
            </pre>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={downloadSitemap}>
              <Download className="h-4 w-4 mr-2" />
              ডাউনলোড XML
            </Button>
            <Button variant="outline" size="sm" onClick={copySitemap}>
              <Copy className="h-4 w-4 mr-2" />
              কপি করুন
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Robots.txt Editor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            Robots.txt এডিটর
          </CardTitle>
          <CardDescription>
            সার্চ ইঞ্জিন ক্রলারের জন্য নিয়ম নির্ধারণ করুন
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={seoSettings.seo_robots_txt}
            onChange={(e) => setSeoSettings((prev) => ({ ...prev, seo_robots_txt: e.target.value }))}
            rows={10}
            className="font-mono text-sm"
            placeholder="User-agent: *&#10;Allow: /"
          />
          <p className="text-xs text-muted-foreground">
            সতর্কতা: ভুল কনফিগারেশন সার্চ ইঞ্জিন থেকে আপনার সাইট ব্লক করতে পারে
          </p>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button onClick={saveSeoSettings} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          SEO সেটিংস সেভ করুন
        </Button>
      </div>
    </div>
  );
};

export default GlobalSeoSettings;
