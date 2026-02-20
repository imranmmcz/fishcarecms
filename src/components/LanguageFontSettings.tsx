import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Type, Save, Loader2, Upload, Eye } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const WEB_SAFE_FONTS = [
  { label: "Hind Siliguri (Default Bengali)", value: "Hind Siliguri" },
  { label: "Noto Sans Bengali", value: "Noto Sans Bengali" },
  { label: "Kalpurush", value: "Kalpurush" },
  { label: "Arial", value: "Arial" },
  { label: "Georgia", value: "Georgia" },
  { label: "Inter", value: "Inter" },
  { label: "Roboto", value: "Roboto" },
  { label: "Open Sans", value: "Open Sans" },
  { label: "Lato", value: "Lato" },
  { label: "Poppins", value: "Poppins" },
  { label: "Merriweather", value: "Merriweather" },
  { label: "Playfair Display", value: "Playfair Display" },
];

interface FontConfig {
  bn_font: string;
  en_font: string;
  custom_font_name: string;
  custom_font_url: string;
}

const DEFAULT_CONFIG: FontConfig = {
  bn_font: "Hind Siliguri",
  en_font: "Inter",
  custom_font_name: "",
  custom_font_url: "",
};

function applyFontToDocument(bnFont: string, enFont: string, customFontName?: string, customFontUrl?: string) {
  // Inject custom font face if provided
  if (customFontName && customFontUrl) {
    const existingStyle = document.getElementById("custom-font-style");
    if (existingStyle) existingStyle.remove();
    const style = document.createElement("style");
    style.id = "custom-font-style";
    style.textContent = `@font-face { font-family: '${customFontName}'; src: url('${customFontUrl}'); }`;
    document.head.appendChild(style);
  }
  document.documentElement.style.setProperty("--font-bn", `'${bnFont}', sans-serif`);
  document.documentElement.style.setProperty("--font-en", `'${enFont}', sans-serif`);
}

export default function LanguageFontSettings() {
  const { language } = useLanguage();
  const [config, setConfig] = useState<FontConfig>(DEFAULT_CONFIG);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewText, setPreviewText] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const bn = language === "bn";

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .like("setting_key", "font_%");

      const map: Record<string, string> = {};
      (data || []).forEach((d) => {
        map[d.setting_key] = d.setting_value || "";
      });

      const loaded: FontConfig = {
        bn_font: map.font_bn || DEFAULT_CONFIG.bn_font,
        en_font: map.font_en || DEFAULT_CONFIG.en_font,
        custom_font_name: map.font_custom_name || "",
        custom_font_url: map.font_custom_url || "",
      };
      setConfig(loaded);
      applyFontToDocument(loaded.bn_font, loaded.en_font, loaded.custom_font_name, loaded.custom_font_url);
    } catch (err) {
      console.error("Error loading font config:", err);
    } finally {
      setLoading(false);
    }
  };

  const upsertSetting = async (key: string, value: string) => {
    const { data: existing } = await supabase
      .from("system_settings")
      .select("id")
      .eq("setting_key", key)
      .maybeSingle();

    if (existing) {
      await supabase.from("system_settings").update({ setting_value: value }).eq("setting_key", key);
    } else {
      await supabase.from("system_settings").insert({ setting_key: key, setting_value: value, description: `Font setting: ${key}` });
    }
  };

  const saveConfig = async () => {
    setSaving(true);
    try {
      await Promise.all([
        upsertSetting("font_bn", config.bn_font),
        upsertSetting("font_en", config.en_font),
        upsertSetting("font_custom_name", config.custom_font_name),
        upsertSetting("font_custom_url", config.custom_font_url),
      ]);
      applyFontToDocument(config.bn_font, config.en_font, config.custom_font_name, config.custom_font_url);
      toast.success(bn ? "ফন্ট সেটিংস সংরক্ষিত হয়েছে" : "Font settings saved");
    } catch (err) {
      console.error("Error saving font config:", err);
      toast.error(bn ? "সংরক্ষণে সমস্যা হয়েছে" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(ttf|otf|woff|woff2)$/i)) {
      toast.error(bn ? "শুধুমাত্র TTF, OTF, WOFF, WOFF2 ফরম্যাট সমর্থিত" : "Only TTF, OTF, WOFF, WOFF2 supported");
      return;
    }
    setUploading(true);
    try {
      const path = `fonts/${Date.now()}_${file.name}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const fontName = file.name.replace(/\.(ttf|otf|woff|woff2)$/i, "");
      setConfig((prev) => ({ ...prev, custom_font_name: fontName, custom_font_url: urlData.publicUrl }));
      toast.success(bn ? "ফন্ট আপলোড সফল হয়েছে" : "Font uploaded successfully");
    } catch (err) {
      console.error("Font upload error:", err);
      toast.error(bn ? "আপলোড ব্যর্থ হয়েছে" : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handlePreview = () => {
    applyFontToDocument(config.bn_font, config.en_font, config.custom_font_name, config.custom_font_url);
    toast.info(bn ? "ফন্ট প্রিভিউ প্রয়োগ হয়েছে" : "Font preview applied");
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
          <Type className="h-5 w-5 text-primary" />
          {bn ? "ভাষা ও ফন্ট সেটিংস" : "Language & Font Settings"}
        </CardTitle>
        <CardDescription>
          {bn
            ? "প্রতিটি ভাষার জন্য আলাদা ফন্ট নির্ধারণ করুন এবং কাস্টম ফন্ট আপলোড করুন।"
            : "Assign a font family per language and optionally upload a custom font."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Font selectors */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="font-semibold">
              {bn ? "বাংলা ফন্ট ফ্যামিলি" : "Bengali Font Family"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {bn ? "বাংলা ভাষার জন্য ফন্ট নির্বাচন করুন" : "Font used when Bengali is active"}
            </p>
            <Select value={config.bn_font} onValueChange={(v) => setConfig((p) => ({ ...p, bn_font: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEB_SAFE_FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
                {config.custom_font_name && (
                  <SelectItem value={config.custom_font_name}>
                    🔤 {config.custom_font_name} (Custom)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="font-semibold">
              {bn ? "ইংরেজি ফন্ট ফ্যামিলি" : "English Font Family"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {bn ? "ইংরেজি ভাষার জন্য ফন্ট নির্বাচন করুন" : "Font used when English is active"}
            </p>
            <Select value={config.en_font} onValueChange={(v) => setConfig((p) => ({ ...p, en_font: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEB_SAFE_FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
                {config.custom_font_name && (
                  <SelectItem value={config.custom_font_name}>
                    🔤 {config.custom_font_name} (Custom)
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Custom font upload */}
        <div className="rounded-lg border border-dashed border-border p-4 space-y-3">
          <Label className="font-semibold">
            {bn ? "কাস্টম ফন্ট আপলোড" : "Upload Custom Font"}
          </Label>
          <p className="text-xs text-muted-foreground">
            {bn ? "TTF, OTF, WOFF বা WOFF2 ফরম্যাটে ফন্ট আপলোড করুন" : "Upload a font file in TTF, OTF, WOFF, or WOFF2 format"}
          </p>
          <input ref={fileRef} type="file" accept=".ttf,.otf,.woff,.woff2" className="hidden" onChange={handleFontUpload} />
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="outline" onClick={() => fileRef.current?.click()} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
              {bn ? "ফন্ট ফাইল বেছে নিন" : "Choose Font File"}
            </Button>
            {config.custom_font_name && (
              <span className="text-sm text-primary font-medium">
                ✅ {config.custom_font_name}
              </span>
            )}
          </div>
          {config.custom_font_url && (
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">{bn ? "ফন্টের নাম" : "Font Name"}</Label>
                <Input
                  value={config.custom_font_name}
                  onChange={(e) => setConfig((p) => ({ ...p, custom_font_name: e.target.value }))}
                  placeholder="MyCustomFont"
                  className="text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">{bn ? "ফন্ট URL" : "Font URL"}</Label>
                <Input
                  value={config.custom_font_url}
                  onChange={(e) => setConfig((p) => ({ ...p, custom_font_url: e.target.value }))}
                  placeholder="https://..."
                  className="text-sm font-mono"
                />
              </div>
            </div>
          )}
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <Label className="font-semibold">{bn ? "ফন্ট প্রিভিউ" : "Font Preview"}</Label>
          <Input
            value={previewText}
            onChange={(e) => setPreviewText(e.target.value)}
            placeholder={bn ? "এখানে টাইপ করুন প্রিভিউ দেখতে..." : "Type here to preview the font..."}
          />
          <div className="space-y-2">
            <div
              className="rounded-md bg-muted/40 p-3 text-lg"
              style={{ fontFamily: `'${config.bn_font}', sans-serif` }}
            >
              {previewText || "আমার সোনার বাংলা, আমি তোমায় ভালোবাসি"}
              <span className="text-xs text-muted-foreground ml-2">({config.bn_font})</span>
            </div>
            <div
              className="rounded-md bg-muted/40 p-3 text-lg"
              style={{ fontFamily: `'${config.en_font}', sans-serif` }}
            >
              {previewText || "The quick brown fox jumps over the lazy dog"}
              <span className="text-xs text-muted-foreground ml-2">({config.en_font})</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={handlePreview} variant="outline">
            <Eye className="h-4 w-4 mr-2" />
            {bn ? "প্রিভিউ প্রয়োগ করুন" : "Apply Preview"}
          </Button>
          <Button onClick={saveConfig} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {bn ? "সংরক্ষণ করুন" : "Save Font Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
