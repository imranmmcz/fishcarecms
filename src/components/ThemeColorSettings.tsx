import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palette, Save, Loader2, RotateCcw } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ColorConfig {
  key: string;
  label_bn: string;
  label_en: string;
  description_bn: string;
  description_en: string;
  defaultValue: string;
}

const colorConfigs: ColorConfig[] = [
  {
    key: "theme_primary",
    label_bn: "প্রাইমারি কালার",
    label_en: "Primary Color",
    description_bn: "মূল ব্র্যান্ড কালার (হেডার, বাটন, লিংক)",
    description_en: "Main brand color (header, buttons, links)",
    defaultValue: "#00899A",
  },
  {
    key: "theme_secondary",
    label_bn: "সেকেন্ডারি কালার",
    label_en: "Secondary Color",
    description_bn: "সেকেন্ডারি হাইলাইট কালার",
    description_en: "Secondary highlight color",
    defaultValue: "#2DA84F",
  },
  {
    key: "theme_accent",
    label_bn: "অ্যাকসেন্ট কালার",
    label_en: "Accent Color",
    description_bn: "বিশেষ হাইলাইট, ব্যাজ, নোটিফিকেশন",
    description_en: "Special highlights, badges, notifications",
    defaultValue: "#E8930C",
  },
  {
    key: "theme_background",
    label_bn: "ব্যাকগ্রাউন্ড কালার",
    label_en: "Background Color",
    description_bn: "পেজের পটভূমির রঙ",
    description_en: "Page background color",
    defaultValue: "#F5F7FA",
  },
  {
    key: "theme_foreground",
    label_bn: "ফন্ট/টেক্সট কালার",
    label_en: "Font/Text Color",
    description_bn: "সাধারণ টেক্সট এবং হেডিং এর রঙ",
    description_en: "General text and heading color",
    defaultValue: "#1E2D3D",
  },
  {
    key: "theme_card",
    label_bn: "কার্ড ব্যাকগ্রাউন্ড",
    label_en: "Card Background",
    description_bn: "কার্ড এবং পপআপের পটভূমি",
    description_en: "Card and popup background",
    defaultValue: "#FFFFFF",
  },
  {
    key: "theme_hover",
    label_bn: "হোভার কালার",
    label_en: "Hover Color",
    description_bn: "মাউস হোভারে রঙ পরিবর্তন",
    description_en: "Color change on mouse hover",
    defaultValue: "#007A8A",
  },
  {
    key: "theme_button",
    label_bn: "বাটন কালার",
    label_en: "Button Color",
    description_bn: "প্রধান বাটনের পটভূমি রঙ",
    description_en: "Primary button background color",
    defaultValue: "#00899A",
  },
  {
    key: "theme_button_hover",
    label_bn: "বাটন হোভার কালার",
    label_en: "Button Hover Color",
    description_bn: "বাটনে হোভারের সময় রঙ",
    description_en: "Button background color on hover",
    defaultValue: "#006E7D",
  },
  {
    key: "theme_link",
    label_bn: "লিংক কালার",
    label_en: "Link Color",
    description_bn: "হাইপারলিংক রঙ",
    description_en: "Hyperlink text color",
    defaultValue: "#0077B6",
  },
  {
    key: "theme_header_bg",
    label_bn: "হেডার ব্যাকগ্রাউন্ড",
    label_en: "Header Background",
    description_bn: "সাইটের হেডার বার রঙ",
    description_en: "Site header bar background color",
    defaultValue: "#FFFFFF",
  },
  {
    key: "theme_footer_bg",
    label_bn: "ফুটার ব্যাকগ্রাউন্ড",
    label_en: "Footer Background",
    description_bn: "সাইটের ফুটার বার রঙ",
    description_en: "Site footer bar background color",
    defaultValue: "#1E2D3D",
  },
  {
    key: "theme_border",
    label_bn: "বর্ডার কালার",
    label_en: "Border Color",
    description_bn: "কার্ড ও ইনপুটের বর্ডার রঙ",
    description_en: "Card and input border color",
    defaultValue: "#E2E8F0",
  },
  {
    key: "theme_alert",
    label_bn: "অ্যালার্ট কালার",
    label_en: "Alert Color",
    description_bn: "সতর্কতা ও বিপদ বার্তার রঙ",
    description_en: "Warning and error alert color",
    defaultValue: "#EF4444",
  },
];

function hexToHsl(hex: string): string {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hslStringToHex(hsl: string): string {
  const parts = hsl.match(/(\d+\.?\d*)/g);
  if (!parts || parts.length < 3) return "#000000";
  const h = parseFloat(parts[0]) / 360;
  const s = parseFloat(parts[1]) / 100;
  const l = parseFloat(parts[2]) / 100;

  let r: number, g: number, b: number;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p: number, q: number, t: number) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (x: number) => {
    const hex = Math.round(x * 255).toString(16);
    return hex.length === 1 ? "0" + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Map from theme key to CSS variable names
const cssVarMap: Record<string, string[]> = {
  theme_primary: ["--primary", "--ring"],
  theme_secondary: ["--secondary"],
  theme_accent: ["--accent"],
  theme_background: ["--background"],
  theme_foreground: ["--foreground", "--card-foreground", "--popover-foreground"],
  theme_card: ["--card", "--popover"],
  theme_hover: ["--primary-glow"],
  theme_button: ["--primary"],
  theme_button_hover: ["--primary-glow"],
  theme_link: ["--ring"],
  theme_header_bg: ["--header-bg"],
  theme_footer_bg: ["--footer-bg"],
  theme_border: ["--border", "--input"],
  theme_alert: ["--destructive"],
};

export function applyThemeColors(colors: Record<string, string>) {
  const root = document.documentElement;
  Object.entries(colors).forEach(([key, hex]) => {
    const vars = cssVarMap[key];
    if (!vars || !hex) return;
    const hsl = hexToHsl(hex);
    vars.forEach((v) => root.style.setProperty(v, hsl));
  });
}

export default function ThemeColorSettings() {
  const { language } = useLanguage();
  const [colors, setColors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .like("setting_key", "theme_%");

      const map: Record<string, string> = {};
      colorConfigs.forEach((c) => {
        const found = data?.find((d) => d.setting_key === c.key);
        map[c.key] = found?.setting_value || c.defaultValue;
      });
      setColors(map);
    } catch (err) {
      console.error("Error loading theme colors:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleColorChange = (key: string, value: string) => {
    setColors((prev) => ({ ...prev, [key]: value }));
    // Live preview
    const vars = cssVarMap[key];
    if (vars) {
      const hsl = hexToHsl(value);
      vars.forEach((v) => document.documentElement.style.setProperty(v, hsl));
    }
  };

  const saveColors = async () => {
    setSaving(true);
    try {
      for (const [key, value] of Object.entries(colors)) {
        const { data: existing } = await supabase
          .from("system_settings")
          .select("id")
          .eq("setting_key", key)
          .maybeSingle();

        if (existing) {
          await supabase
            .from("system_settings")
            .update({ setting_value: value })
            .eq("setting_key", key);
        } else {
          await supabase
            .from("system_settings")
            .insert({ setting_key: key, setting_value: value, description: `Theme color: ${key}` });
        }
      }
      toast.success(language === "bn" ? "থিম কালার সংরক্ষিত হয়েছে" : "Theme colors saved");
    } catch (err) {
      console.error("Error saving theme:", err);
      toast.error(language === "bn" ? "সংরক্ষণে সমস্যা হয়েছে" : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const resetDefaults = () => {
    const defaults: Record<string, string> = {};
    colorConfigs.forEach((c) => {
      defaults[c.key] = c.defaultValue;
      const vars = cssVarMap[c.key];
      if (vars) {
        const hsl = hexToHsl(c.defaultValue);
        vars.forEach((v) => document.documentElement.style.setProperty(v, hsl));
      }
    });
    setColors(defaults);
    toast.success(language === "bn" ? "ডিফল্ট কালারে রিসেট হয়েছে" : "Reset to defaults");
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
          <Palette className="h-5 w-5 text-primary" />
          {language === "bn" ? "থিম কালার কাস্টমাইজ" : "Theme Color Customization"}
        </CardTitle>
        <CardDescription>
          {language === "bn"
            ? "ওয়েবসাইটের প্রাইমারি, সেকেন্ডারি, ফন্ট কালার সহ সমস্ত রঙ পরিবর্তন করুন। পরিবর্তন লাইভ প্রিভিউ দেখা যাবে।"
            : "Change all website colors including primary, secondary, and font colors. Changes preview live."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Base Colors */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            {language === "bn" ? "মূল কালার" : "Base Colors"}
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {colorConfigs.slice(0, 6).map((config) => (
              <div key={config.key} className="space-y-2 rounded-lg border border-border p-4">
                <Label className="font-semibold">
                  {language === "bn" ? config.label_bn : config.label_en}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {language === "bn" ? config.description_bn : config.description_en}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colors[config.key] || config.defaultValue}
                    onChange={(e) => handleColorChange(config.key, e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={colors[config.key] || config.defaultValue}
                    onChange={(e) => handleColorChange(config.key, e.target.value)}
                    placeholder="#000000"
                    className="font-mono text-sm"
                  />
                </div>
                <div
                  className="h-3 rounded-full"
                  style={{ backgroundColor: colors[config.key] || config.defaultValue }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Extended Colors */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">
            {language === "bn" ? "বিস্তারিত কালার" : "Extended Colors"}
          </h4>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {colorConfigs.slice(6).map((config) => (
              <div key={config.key} className="space-y-2 rounded-lg border border-border p-4">
                <Label className="font-semibold">
                  {language === "bn" ? config.label_bn : config.label_en}
                </Label>
                <p className="text-xs text-muted-foreground">
                  {language === "bn" ? config.description_bn : config.description_en}
                </p>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={colors[config.key] || config.defaultValue}
                    onChange={(e) => handleColorChange(config.key, e.target.value)}
                    className="h-10 w-14 cursor-pointer rounded border border-border"
                  />
                  <Input
                    value={colors[config.key] || config.defaultValue}
                    onChange={(e) => handleColorChange(config.key, e.target.value)}
                    placeholder="#000000"
                    className="font-mono text-sm"
                  />
                </div>
                <div
                  className="h-3 rounded-full"
                  style={{ backgroundColor: colors[config.key] || config.defaultValue }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Preview */}
        <div className="rounded-lg border border-border p-4 space-y-3">
          <h4 className="font-semibold text-sm">
            {language === "bn" ? "লাইভ প্রিভিউ" : "Live Preview"}
          </h4>
          {/* Header bar preview */}
          <div className="rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 text-white text-sm font-medium"
              style={{ backgroundColor: colors.theme_header_bg || "#FFFFFF", color: colors.theme_foreground || "#1E2D3D", borderBottom: `2px solid ${colors.theme_border || "#E2E8F0"}` }}>
              <span>{language === "bn" ? "হেডার" : "Header"}</span>
              <span className="text-xs" style={{ color: colors.theme_link || "#0077B6" }}>{language === "bn" ? "লিংক →" : "Link →"}</span>
            </div>
          </div>
          {/* Buttons & badges */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-default"
              style={{ backgroundColor: colors.theme_button || colors.theme_primary, color: "#fff" }}>
              {language === "bn" ? "বাটন" : "Button"}
            </div>
            <div className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: colors.theme_button_hover || "#006E7D", color: "#fff" }}>
              {language === "bn" ? "বাটন হোভার" : "Button Hover"}
            </div>
            <div className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: colors.theme_secondary, color: "#fff" }}>
              {language === "bn" ? "সেকেন্ডারি" : "Secondary"}
            </div>
            <div className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: colors.theme_accent, color: "#fff" }}>
              {language === "bn" ? "অ্যাকসেন্ট" : "Accent"}
            </div>
            <div className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: colors.theme_alert || "#EF4444", color: "#fff" }}>
              {language === "bn" ? "অ্যালার্ট" : "Alert"}
            </div>
          </div>
          {/* Card preview */}
          <div className="rounded-md p-3"
            style={{ backgroundColor: colors.theme_card, border: `1px solid ${colors.theme_border || "#E2E8F0"}` }}>
            <p className="text-sm font-semibold" style={{ color: colors.theme_foreground }}>
              {language === "bn" ? "এটি একটি কার্ডের উদাহরণ।" : "This is an example card."}
            </p>
            <p className="text-xs mt-1" style={{ color: colors.theme_link || "#0077B6" }}>
              {language === "bn" ? "লিংক উদাহরণ" : "Example link"}
            </p>
          </div>
          {/* Footer preview */}
          <div className="rounded-md px-4 py-2 text-white text-sm"
            style={{ backgroundColor: colors.theme_footer_bg || "#1E2D3D" }}>
            {language === "bn" ? "ফুটার এরিয়া" : "Footer Area"}
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={saveColors} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            {language === "bn" ? "সংরক্ষণ করুন" : "Save Colors"}
          </Button>
          <Button variant="outline" onClick={resetDefaults}>
            <RotateCcw className="h-4 w-4 mr-2" />
            {language === "bn" ? "ডিফল্ট রিসেট" : "Reset Defaults"}
          </Button>
        </div>

        <div className="rounded-lg bg-muted/50 p-4">
          <p className="text-sm text-muted-foreground">
            <strong>{language === "bn" ? "নোট:" : "Note:"}</strong>{" "}
            {language === "bn"
              ? "কালার পরিবর্তন সংরক্ষণ করার পর সকল পেজে প্রযোজ্য হবে। পেজ রিলোড করলে সংরক্ষিত কালার স্বয়ংক্রিয়ভাবে লোড হবে।"
              : "Color changes will apply to all pages after saving. Saved colors will load automatically on page reload."}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
