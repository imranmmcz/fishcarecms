import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Save, Eye, Upload, X, ImageIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Fish } from "lucide-react";

const ANIMATION_TYPES = [
  { value: "fish", label_bn: "মাছ সুইমিং", label_en: "Swimming Fish" },
  { value: "spinner", label_bn: "স্পিনার", label_en: "Spinner" },
  { value: "dots", label_bn: "বাউন্সিং ডট", label_en: "Bouncing Dots" },
  { value: "wave", label_bn: "ওয়েভ", label_en: "Wave" },
  { value: "pulse", label_bn: "পালস", label_en: "Pulse" },
  { value: "custom_image", label_bn: "কাস্টম ইমেজ/GIF", label_en: "Custom Image/GIF" },
];

interface LoadingSettings {
  loading_animation_type: string;
  loading_animation_text: string;
  loading_animation_color: string;
  loading_animation_bg: string;
  loading_animation_fullscreen: string;
  loading_animation_custom_image: string;
}

const defaultSettings: LoadingSettings = {
  loading_animation_type: "fish",
  loading_animation_text: "লোড হচ্ছে...",
  loading_animation_color: "#22D3EE",
  loading_animation_bg: "#0C1929",
  loading_animation_fullscreen: "true",
  loading_animation_custom_image: "",
};

export function LoadingAnimationSettings() {
  const { language } = useLanguage();
  const [settings, setSettings] = useState<LoadingSettings>(defaultSettings);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showPreview, setShowPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error(language === "bn" ? "শুধুমাত্র PNG, JPG, GIF, WebP, SVG ফাইল অনুমোদিত" : "Only PNG, JPG, GIF, WebP, SVG files allowed");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error(language === "bn" ? "ফাইল সাইজ ৫MB এর বেশি হতে পারবে না" : "File size must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'png';
      const fileName = `loading-animation-${Date.now()}.${ext}`;

      // Delete old file if exists
      if (settings.loading_animation_custom_image) {
        try {
          const oldPath = settings.loading_animation_custom_image.split('/product-images/')[1];
          if (oldPath) {
            await supabase.storage.from('product-images').remove([oldPath]);
          }
        } catch {}
      }

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(`loading/${fileName}`, file, { contentType: file.type, upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('product-images')
        .getPublicUrl(`loading/${fileName}`);

      handleChange("loading_animation_custom_image", urlData.publicUrl);
      toast.success(language === "bn" ? "ইমেজ আপলোড সফল হয়েছে" : "Image uploaded successfully");
    } catch (err) {
      console.error("Upload error:", err);
      toast.error(language === "bn" ? "আপলোড ব্যর্থ হয়েছে" : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeCustomImage = async () => {
    if (settings.loading_animation_custom_image) {
      try {
        const oldPath = settings.loading_animation_custom_image.split('/product-images/')[1];
        if (oldPath) {
          await supabase.storage.from('product-images').remove([oldPath]);
        }
      } catch {}
    }
    handleChange("loading_animation_custom_image", "");
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .like("setting_key", "loading_animation_%");

      if (data && data.length > 0) {
        const loaded = { ...defaultSettings };
        data.forEach((d) => {
          if (d.setting_value && d.setting_key in loaded) {
            (loaded as any)[d.setting_key] = d.setting_value;
          }
        });
        setSettings(loaded);
      }
    } catch (err) {
      console.error("Error loading animation settings:", err);
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
          await supabase.from("system_settings").insert({ setting_key: key, setting_value: value, description: `Loading animation: ${key}` });
        }
      }
      toast.success(language === "bn" ? "লোডিং এনিমেশন সেটিংস সংরক্ষিত হয়েছে" : "Loading animation settings saved");
    } catch (err) {
      console.error("Error saving:", err);
      toast.error(language === "bn" ? "সংরক্ষণে সমস্যা হয়েছে" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: keyof LoadingSettings, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
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
          <Loader2 className="h-5 w-5 text-primary" />
          {language === "bn" ? "লোডিং এনিমেশন সেটিংস" : "Loading Animation Settings"}
        </CardTitle>
        <CardDescription>
          {language === "bn"
            ? "পেজ লোডিং এর সময় কোন এনিমেশন দেখানো হবে তা কাস্টমাইজ করুন।"
            : "Customize the animation shown during page loading."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Animation Type */}
        <div className="space-y-2">
          <Label className="font-semibold">
            {language === "bn" ? "এনিমেশন টাইপ" : "Animation Type"}
          </Label>
          <Select value={settings.loading_animation_type} onValueChange={(v) => handleChange("loading_animation_type", v)}>
            <SelectTrigger className="w-full md:w-[300px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ANIMATION_TYPES.map((t) => (
                <SelectItem key={t.value} value={t.value}>
                  {language === "bn" ? t.label_bn : t.label_en}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom Image Upload - shown when custom_image type selected */}
        {settings.loading_animation_type === "custom_image" && (
          <div className="space-y-3 rounded-lg border border-primary/30 bg-primary/5 p-4">
            <Label className="font-semibold flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-primary" />
              {language === "bn" ? "কাস্টম ইমেজ / GIF আপলোড" : "Custom Image / GIF Upload"}
            </Label>
            <p className="text-xs text-muted-foreground">
              {language === "bn" 
                ? "PNG, JPG, GIF, WebP, SVG ফাইল আপলোড করুন (সর্বোচ্চ ৫MB)। GIF ফাইল এনিমেটেড হিসেবে দেখানো হবে।" 
                : "Upload PNG, JPG, GIF, WebP, SVG files (max 5MB). GIF files will be displayed animated."}
            </p>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/gif,image/webp,image/svg+xml"
              onChange={handleImageUpload}
              className="hidden"
            />

            {settings.loading_animation_custom_image ? (
              <div className="flex items-center gap-4">
                <div className="relative w-24 h-24 rounded-lg border border-border overflow-hidden bg-background">
                  <img
                    src={settings.loading_animation_custom_image}
                    alt="Custom loading"
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    {uploading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Upload className="h-4 w-4 mr-2" />}
                    {language === "bn" ? "পরিবর্তন করুন" : "Change"}
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={removeCustomImage}
                  >
                    <X className="h-4 w-4 mr-2" />
                    {language === "bn" ? "মুছে ফেলুন" : "Remove"}
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="border-dashed border-2 h-24 w-full"
              >
                {uploading ? (
                  <Loader2 className="h-6 w-6 animate-spin mr-2" />
                ) : (
                  <Upload className="h-6 w-6 mr-2 text-muted-foreground" />
                )}
                <span className="text-muted-foreground">
                  {language === "bn" ? "ক্লিক করে ইমেজ বা GIF আপলোড করুন" : "Click to upload image or GIF"}
                </span>
              </Button>
            )}
          </div>
        )}
        <div className="space-y-2">
          <Label className="font-semibold">
            {language === "bn" ? "লোডিং টেক্সট" : "Loading Text"}
          </Label>
          <Input
            value={settings.loading_animation_text}
            onChange={(e) => handleChange("loading_animation_text", e.target.value)}
            placeholder={language === "bn" ? "লোড হচ্ছে..." : "Loading..."}
            className="w-full md:w-[400px]"
          />
        </div>

        {/* Colors */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2 rounded-lg border border-border p-4">
            <Label className="font-semibold">
              {language === "bn" ? "এনিমেশন কালার" : "Animation Color"}
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.loading_animation_color}
                onChange={(e) => handleChange("loading_animation_color", e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border"
              />
              <Input
                value={settings.loading_animation_color}
                onChange={(e) => handleChange("loading_animation_color", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-2 rounded-lg border border-border p-4">
            <Label className="font-semibold">
              {language === "bn" ? "ব্যাকগ্রাউন্ড কালার" : "Background Color"}
            </Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={settings.loading_animation_bg}
                onChange={(e) => handleChange("loading_animation_bg", e.target.value)}
                className="h-10 w-14 cursor-pointer rounded border border-border"
              />
              <Input
                value={settings.loading_animation_bg}
                onChange={(e) => handleChange("loading_animation_bg", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
          </div>
        </div>

        {/* Fullscreen toggle */}
        <div className="flex items-center gap-3">
          <Switch
            checked={settings.loading_animation_fullscreen === "true"}
            onCheckedChange={(checked) => handleChange("loading_animation_fullscreen", checked.toString())}
          />
          <Label className="font-semibold">
            {language === "bn" ? "ফুলস্ক্রিন লোডিং" : "Fullscreen Loading"}
          </Label>
        </div>

        {/* Preview */}
        <div className="space-y-3">
          <Button variant="outline" onClick={() => setShowPreview(!showPreview)}>
            <Eye className="h-4 w-4 mr-2" />
            {language === "bn" ? (showPreview ? "প্রিভিউ বন্ধ করুন" : "প্রিভিউ দেখুন") : (showPreview ? "Hide Preview" : "Show Preview")}
          </Button>

          {showPreview && (
            <div
              className="relative rounded-lg overflow-hidden"
              style={{
                backgroundColor: settings.loading_animation_bg,
                height: "250px",
              }}
            >
              <div className="flex flex-col items-center justify-center h-full gap-4">
                <AnimationPreview type={settings.loading_animation_type} color={settings.loading_animation_color} customImage={settings.loading_animation_custom_image} />
                <p className="text-sm font-medium" style={{ color: settings.loading_animation_color }}>
                  {settings.loading_animation_text}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Save */}
        <div className="flex gap-3">
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {language === "bn" ? "সংরক্ষণ করুন" : "Save Settings"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function AnimationPreview({ type, color, customImage }: { type: string; color: string; customImage?: string }) {
  switch (type) {
    case "custom_image":
      return customImage ? (
        <img src={customImage} alt="Custom loading" className="h-16 w-auto object-contain animate-pulse" />
      ) : (
        <div className="flex items-center gap-2 text-muted-foreground">
          <ImageIcon className="h-10 w-10" />
          <span className="text-sm">No image uploaded</span>
        </div>
      );
    case "fish":
      return (
        <div className="relative w-48 h-16">
          <div className="absolute animate-[swim_2s_ease-in-out_infinite]" style={{ left: 0 }}>
            <Fish className="h-10 w-10 drop-shadow-lg" style={{ color, transform: "scaleX(-1)" }} />
          </div>
          <div className="absolute animate-[swim_2.5s_ease-in-out_infinite]" style={{ left: "-10%", top: "60%", animationDelay: "0.3s" }}>
            <Fish className="h-6 w-6 opacity-70" style={{ color, transform: "scaleX(-1)" }} />
          </div>
          <style>{`
            @keyframes swim {
              0%, 100% { transform: translateX(0) translateY(0); }
              25% { transform: translateX(40px) translateY(-8px); }
              50% { transform: translateX(80px) translateY(0); }
              75% { transform: translateX(120px) translateY(8px); }
              100% { transform: translateX(160px) translateY(0); }
            }
          `}</style>
        </div>
      );

    case "spinner":
      return (
        <div
          className="h-12 w-12 rounded-full border-4 border-t-transparent animate-spin"
          style={{ borderColor: `${color}33`, borderTopColor: color }}
        />
      );

    case "dots":
      return (
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full animate-bounce"
              style={{ backgroundColor: color, animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      );

    case "wave":
      return (
        <div className="flex items-end gap-1 h-10">
          {[0, 1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="w-2 rounded-full animate-pulse"
              style={{
                backgroundColor: color,
                height: `${20 + Math.sin(i * 1.2) * 15}px`,
                animationDelay: `${i * 0.1}s`,
                animationDuration: "0.8s",
              }}
            />
          ))}
          <style>{`
            @keyframes waveBar {
              0%, 100% { height: 10px; }
              50% { height: 35px; }
            }
          `}</style>
        </div>
      );

    case "pulse":
      return (
        <div className="relative">
          <div
            className="h-12 w-12 rounded-full animate-ping absolute inset-0 opacity-30"
            style={{ backgroundColor: color }}
          />
          <div
            className="h-12 w-12 rounded-full"
            style={{ backgroundColor: color }}
          />
        </div>
      );

    default:
      return <Loader2 className="h-10 w-10 animate-spin" style={{ color }} />;
  }
}

export default LoadingAnimationSettings;
