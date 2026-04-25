import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Palette, Save, Loader2, RotateCcw, Check, Sparkles, Layout, Monitor, ShoppingBag, Store, Plus, Trash2, Route as RouteIcon } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLayout, type LayoutType } from "@/contexts/LayoutContext";
import { applyButtonStyle, invalidateButtonStyleCache, type ButtonAnimationStyle, type ButtonStyleOverride } from "@/components/ThemeLoader";

interface ButtonStylePreset {
  id: ButtonAnimationStyle;
  name_bn: string;
  name_en: string;
  description_bn: string;
  description_en: string;
}

const buttonStylePresets: ButtonStylePreset[] = [
  { id: "default", name_bn: "ডিফল্ট", name_en: "Default", description_bn: "সাধারণ স্টাইল, কোনো অতিরিক্ত এনিমেশন নয়", description_en: "Standard style, no extra animation" },
  { id: "scale", name_bn: "স্কেল", name_en: "Scale", description_bn: "হোভারে বড় হবে, ক্লিকে ছোট হবে", description_en: "Grows on hover, shrinks on click" },
  { id: "lift", name_bn: "লিফট", name_en: "Lift", description_bn: "শ্যাডো সহ উপরে উঠবে", description_en: "Lifts up with shadow on hover" },
  { id: "glow", name_bn: "গ্লো", name_en: "Glow", description_bn: "চারপাশে আলোর আভা", description_en: "Glowing halo around button" },
  { id: "shine", name_bn: "শাইন", name_en: "Shine", description_bn: "তির্যক আলোর ঝলক চলবে", description_en: "Diagonal light sweep" },
  { id: "push", name_bn: "পুশ", name_en: "Push", description_bn: "৩ডি প্রেস হবে চাবির মত", description_en: "3D press like a key" },
  { id: "pulse", name_bn: "পালস", name_en: "Pulse", description_bn: "হোভারে স্পন্দন তরঙ্গ", description_en: "Pulse wave on hover" },
  { id: "neon", name_bn: "নিয়ন", name_en: "Neon", description_bn: "নিয়ন গ্লো আউটলাইন", description_en: "Neon glow outline" },
];

interface ThemePreset {
  name_bn: string;
  name_en: string;
  colors: {
    theme_primary: string;
    theme_secondary: string;
    theme_accent: string;
    theme_background: string;
    theme_foreground: string;
    theme_card: string;
    theme_hover: string;
    theme_button: string;
    theme_button_hover: string;
    theme_link: string;
    theme_header_utility_bg: string;
    theme_header_utility_text: string;
    theme_header_bg: string;
    theme_header_nav_bg: string;
    theme_header_nav_text: string;
    theme_footer_bg: string;
    theme_footer_text: string;
    theme_footer_heading: string;
    theme_border: string;
    theme_alert: string;
  };
  swatches: string[]; // 4 preview colors
}

const themePresets: ThemePreset[] = [
  {
    name_bn: "ডিফল্ট (অ্যাকুয়া)",
    name_en: "Default (Aqua)",
    swatches: ["#00899A", "#2DA84F", "#E8930C", "#1E2D3D"],
    colors: {
      theme_primary: "#00899A", theme_secondary: "#2DA84F", theme_accent: "#E8930C",
      theme_background: "#F5F7FA", theme_foreground: "#1E2D3D", theme_card: "#FFFFFF",
      theme_hover: "#007A8A", theme_button: "#00899A", theme_button_hover: "#006E7D",
      theme_link: "#0077B6", theme_header_utility_bg: "#00899A", theme_header_utility_text: "#FFFFFF",
      theme_header_bg: "#FFFFFF", theme_header_nav_bg: "#1E2D3D", theme_header_nav_text: "#FFFFFF",
      theme_footer_bg: "#1E2D3D", theme_footer_text: "#CBD5E1", theme_footer_heading: "#FFFFFF",
      theme_border: "#E2E8F0", theme_alert: "#EF4444",
    },
  },
  {
    name_bn: "সবুজ প্রকৃতি",
    name_en: "Green Nature",
    swatches: ["#25671E", "#4CAF10", "#E8A317", "#F5F5F0"],
    colors: {
      theme_primary: "#25671E", theme_secondary: "#4CAF10", theme_accent: "#E8A317",
      theme_background: "#F5F5F0", theme_foreground: "#1B3A15", theme_card: "#FFFFFF",
      theme_hover: "#1E5518", theme_button: "#25671E", theme_button_hover: "#1E5518",
      theme_link: "#2E7D32", theme_header_utility_bg: "#25671E", theme_header_utility_text: "#FFFFFF",
      theme_header_bg: "#FFFFFF", theme_header_nav_bg: "#1B3A15", theme_header_nav_text: "#FFFFFF",
      theme_footer_bg: "#1B3A15", theme_footer_text: "#A5D6A7", theme_footer_heading: "#FFFFFF",
      theme_border: "#C8E6C9", theme_alert: "#D32F2F",
    },
  },
  {
    name_bn: "বেগুনি রাত",
    name_en: "Purple Night",
    swatches: ["#3D2C5E", "#6C3FBF", "#1DA0E0", "#D4E843"],
    colors: {
      theme_primary: "#6C3FBF", theme_secondary: "#1DA0E0", theme_accent: "#D4E843",
      theme_background: "#F3F0FA", theme_foreground: "#2D1F4E", theme_card: "#FFFFFF",
      theme_hover: "#5A33A3", theme_button: "#6C3FBF", theme_button_hover: "#5A33A3",
      theme_link: "#1DA0E0", theme_header_utility_bg: "#3D2C5E", theme_header_utility_text: "#FFFFFF",
      theme_header_bg: "#FFFFFF", theme_header_nav_bg: "#2D1F4E", theme_header_nav_text: "#FFFFFF",
      theme_footer_bg: "#2D1F4E", theme_footer_text: "#B39DDB", theme_footer_heading: "#FFFFFF",
      theme_border: "#D1C4E9", theme_alert: "#EF4444",
    },
  },
  {
    name_bn: "জলপাই সবুজ",
    name_en: "Olive Green",
    swatches: ["#558B2F", "#9E9D24", "#827717", "#6D7040"],
    colors: {
      theme_primary: "#558B2F", theme_secondary: "#9E9D24", theme_accent: "#FF8F00",
      theme_background: "#F9F8F3", theme_foreground: "#33421A", theme_card: "#FFFFFF",
      theme_hover: "#467525", theme_button: "#558B2F", theme_button_hover: "#467525",
      theme_link: "#558B2F", theme_header_utility_bg: "#558B2F", theme_header_utility_text: "#FFFFFF",
      theme_header_bg: "#FFFFFF", theme_header_nav_bg: "#33421A", theme_header_nav_text: "#FFFFFF",
      theme_footer_bg: "#33421A", theme_footer_text: "#C5E1A5", theme_footer_heading: "#FFFFFF",
      theme_border: "#DCEDC8", theme_alert: "#E53935",
    },
  },
  {
    name_bn: "সমুদ্র নীল",
    name_en: "Ocean Blue",
    swatches: ["#0D47A1", "#1976D2", "#03A9F4", "#E3F2FD"],
    colors: {
      theme_primary: "#1565C0", theme_secondary: "#0288D1", theme_accent: "#FF9800",
      theme_background: "#F0F4FA", theme_foreground: "#0D2137", theme_card: "#FFFFFF",
      theme_hover: "#0D47A1", theme_button: "#1565C0", theme_button_hover: "#0D47A1",
      theme_link: "#1976D2", theme_header_utility_bg: "#0D47A1", theme_header_utility_text: "#FFFFFF",
      theme_header_bg: "#FFFFFF", theme_header_nav_bg: "#0D2137", theme_header_nav_text: "#FFFFFF",
      theme_footer_bg: "#0D2137", theme_footer_text: "#90CAF9", theme_footer_heading: "#FFFFFF",
      theme_border: "#BBDEFB", theme_alert: "#E53935",
    },
  },
  {
    name_bn: "সূর্যাস্ত কমলা",
    name_en: "Sunset Orange",
    swatches: ["#E65100", "#FF9800", "#FFD54F", "#3E2723"],
    colors: {
      theme_primary: "#E65100", theme_secondary: "#FF9800", theme_accent: "#FFD54F",
      theme_background: "#FFF8F0", theme_foreground: "#3E2723", theme_card: "#FFFFFF",
      theme_hover: "#BF360C", theme_button: "#E65100", theme_button_hover: "#BF360C",
      theme_link: "#E65100", theme_header_utility_bg: "#E65100", theme_header_utility_text: "#FFFFFF",
      theme_header_bg: "#FFFFFF", theme_header_nav_bg: "#3E2723", theme_header_nav_text: "#FFFFFF",
      theme_footer_bg: "#3E2723", theme_footer_text: "#FFCC80", theme_footer_heading: "#FFFFFF",
      theme_border: "#FFE0B2", theme_alert: "#D32F2F",
    },
  },
  {
    name_bn: "গোলাপী মিষ্টি",
    name_en: "Sweet Pink",
    swatches: ["#AD1457", "#E91E63", "#F48FB1", "#FCE4EC"],
    colors: {
      theme_primary: "#C2185B", theme_secondary: "#E91E63", theme_accent: "#FF9800",
      theme_background: "#FFF0F3", theme_foreground: "#4A0E2B", theme_card: "#FFFFFF",
      theme_hover: "#AD1457", theme_button: "#C2185B", theme_button_hover: "#AD1457",
      theme_link: "#C2185B", theme_header_utility_bg: "#AD1457", theme_header_utility_text: "#FFFFFF",
      theme_header_bg: "#FFFFFF", theme_header_nav_bg: "#4A0E2B", theme_header_nav_text: "#FFFFFF",
      theme_footer_bg: "#4A0E2B", theme_footer_text: "#F48FB1", theme_footer_heading: "#FFFFFF",
      theme_border: "#F8BBD0", theme_alert: "#D32F2F",
    },
  },
  {
    name_bn: "ধূসর পেশাদার",
    name_en: "Gray Professional",
    swatches: ["#37474F", "#546E7A", "#78909C", "#ECEFF1"],
    colors: {
      theme_primary: "#37474F", theme_secondary: "#546E7A", theme_accent: "#FF6F00",
      theme_background: "#F5F6F7", theme_foreground: "#212121", theme_card: "#FFFFFF",
      theme_hover: "#263238", theme_button: "#37474F", theme_button_hover: "#263238",
      theme_link: "#37474F", theme_header_utility_bg: "#37474F", theme_header_utility_text: "#FFFFFF",
      theme_header_bg: "#FFFFFF", theme_header_nav_bg: "#212121", theme_header_nav_text: "#FFFFFF",
      theme_footer_bg: "#212121", theme_footer_text: "#B0BEC5", theme_footer_heading: "#FFFFFF",
      theme_border: "#CFD8DC", theme_alert: "#EF4444",
    },
  },
];

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
    key: "theme_header_utility_bg",
    label_bn: "হেডার ইউটিলিটি বার ব্যাকগ্রাউন্ড",
    label_en: "Header Utility Bar Background",
    description_bn: "সবচেয়ে উপরের প্রাইমারি বারের পটভূমি",
    description_en: "Top utility bar background color",
    defaultValue: "#00899A",
  },
  {
    key: "theme_header_utility_text",
    label_bn: "হেডার ইউটিলিটি বার টেক্সট",
    label_en: "Header Utility Bar Text",
    description_bn: "ইউটিলিটি বারের লেখার রঙ",
    description_en: "Utility bar text color",
    defaultValue: "#FFFFFF",
  },
  {
    key: "theme_header_bg",
    label_bn: "হেডার ব্যাকগ্রাউন্ড",
    label_en: "Header Background",
    description_bn: "লোগো ও সার্চ বারের সারির পটভূমি",
    description_en: "Logo and search bar row background",
    defaultValue: "#FFFFFF",
  },
  {
    key: "theme_header_nav_bg",
    label_bn: "হেডার নেভিগেশন বার ব্যাকগ্রাউন্ড",
    label_en: "Header Navigation Bar Background",
    description_bn: "নিচের মেনু বারের পটভূমি",
    description_en: "Bottom navigation menu bar background",
    defaultValue: "#1E2D3D",
  },
  {
    key: "theme_header_nav_text",
    label_bn: "হেডার নেভিগেশন বার টেক্সট",
    label_en: "Header Navigation Bar Text",
    description_bn: "নিচের মেনু বারের লেখার রঙ",
    description_en: "Navigation menu text color",
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
    key: "theme_footer_text",
    label_bn: "ফুটার টেক্সট কালার",
    label_en: "Footer Text Color",
    description_bn: "ফুটারের লেখার রঙ",
    description_en: "Footer text color",
    defaultValue: "#CBD5E1",
  },
  {
    key: "theme_footer_heading",
    label_bn: "ফুটার হেডিং কালার",
    label_en: "Footer Heading Color",
    description_bn: "ফুটারের শিরোনামের রঙ",
    description_en: "Footer heading color",
    defaultValue: "#FFFFFF",
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
  theme_header_utility_bg: ["--header-utility-bg"],
  theme_header_utility_text: ["--header-utility-text"],
  theme_header_bg: ["--header-bg"],
  theme_header_nav_bg: ["--header-nav-bg"],
  theme_header_nav_text: ["--header-nav-text"],
  theme_footer_bg: ["--footer-bg"],
  theme_footer_text: ["--footer-text"],
  theme_footer_heading: ["--footer-heading"],
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
  const { layout, setLayout } = useLayout();
  const [colors, setColors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedLayout, setSelectedLayout] = useState<LayoutType>(layout);
  const [buttonStyle, setButtonStyle] = useState<ButtonAnimationStyle>("default");
  const [buttonOverrides, setButtonOverrides] = useState<ButtonStyleOverride[]>([]);

  useEffect(() => {
    setSelectedLayout(layout);
  }, [layout]);

  useEffect(() => {
    loadColors();
  }, []);

  const loadColors = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("system_settings")
        .select("*")
        .or(
          "setting_key.like.theme_%,setting_key.eq.button_animation_style,setting_key.eq.button_animation_overrides"
        );

      const map: Record<string, string> = {};
      colorConfigs.forEach((c) => {
        const found = data?.find((d) => d.setting_key === c.key);
        map[c.key] = found?.setting_value || c.defaultValue;
      });
      setColors(map);
      const btn = data?.find((d) => d.setting_key === "button_animation_style");
      if (btn?.setting_value) {
        setButtonStyle(btn.setting_value as ButtonAnimationStyle);
      }
      const ovr = data?.find((d) => d.setting_key === "button_animation_overrides");
      if (ovr?.setting_value) {
        try {
          const parsed = JSON.parse(ovr.setting_value);
          if (Array.isArray(parsed)) setButtonOverrides(parsed);
        } catch {
          /* ignore malformed */
        }
      }
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
      // Save colors
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

      // Save layout
      const { data: existingLayout } = await supabase
        .from("system_settings")
        .select("id")
        .eq("setting_key", "theme_layout")
        .maybeSingle();

      if (existingLayout) {
        await supabase
          .from("system_settings")
          .update({ setting_value: selectedLayout })
          .eq("setting_key", "theme_layout");
      } else {
        await supabase
          .from("system_settings")
          .insert({ setting_key: "theme_layout", setting_value: selectedLayout, description: "Site layout theme" });
      }

      // Save button animation style
      const { data: existingBtn } = await supabase
        .from("system_settings")
        .select("id")
        .eq("setting_key", "button_animation_style")
        .maybeSingle();

      if (existingBtn) {
        await supabase
          .from("system_settings")
          .update({ setting_value: buttonStyle })
          .eq("setting_key", "button_animation_style");
      } else {
        await supabase
          .from("system_settings")
          .insert({ setting_key: "button_animation_style", setting_value: buttonStyle, description: "Global button animation style" });
      }
      applyButtonStyle(buttonStyle);

      // Save per-page button animation overrides (JSON array)
      const overridesJson = JSON.stringify(buttonOverrides);
      const { data: existingOverrides } = await supabase
        .from("system_settings")
        .select("id")
        .eq("setting_key", "button_animation_overrides")
        .maybeSingle();
      if (existingOverrides) {
        await supabase
          .from("system_settings")
          .update({ setting_value: overridesJson })
          .eq("setting_key", "button_animation_overrides");
      } else {
        await supabase
          .from("system_settings")
          .insert({
            setting_key: "button_animation_overrides",
            setting_value: overridesJson,
            description: "Per-page button animation style overrides (JSON array)",
          });
      }
      invalidateButtonStyleCache();

      setLayout(selectedLayout);
      toast.success(language === "bn" ? "থিম ও লেআউট সংরক্ষিত হয়েছে" : "Theme & layout saved");
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
        {/* Layout Selection */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <Layout className="h-4 w-4" />
            {language === "bn" ? "লেআউট ডিজাইন" : "Layout Design"}
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            {language === "bn"
              ? "সাইটের সম্পূর্ণ লেআউট (হেডার, ফুটার, হোমপেজ) পরিবর্তন করুন। সেভ করার পর প্রযোজ্য হবে।"
              : "Change the entire site layout (header, footer, homepage). Applied after saving."}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Classic */}
            <button
              onClick={() => setSelectedLayout("classic")}
              className={`relative rounded-xl border-2 p-4 transition-all hover:scale-[1.02] hover:shadow-medium cursor-pointer text-left ${
                selectedLayout === "classic" ? "border-primary ring-2 ring-primary/30 shadow-medium" : "border-border hover:border-primary/40"
              }`}
            >
              {selectedLayout === "classic" && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5 z-10">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="space-y-2">
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="h-2 bg-primary" />
                  <div className="h-3 bg-card border-b border-border" />
                  <div className="h-2 bg-foreground/80" />
                  <div className="h-8 bg-muted/30 flex items-center justify-center">
                    <div className="w-2/3 h-4 bg-primary/20 rounded" />
                  </div>
                  <div className="h-6 bg-card p-1">
                    <div className="grid grid-cols-3 gap-0.5 h-full">
                      <div className="bg-muted rounded-sm" />
                      <div className="bg-muted rounded-sm" />
                      <div className="bg-muted rounded-sm" />
                    </div>
                  </div>
                  <div className="h-3 bg-foreground/80" />
                </div>
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-bold">{language === "bn" ? "ক্লাসিক" : "Classic"}</p>
                    <p className="text-[10px] text-muted-foreground">{language === "bn" ? "৩-সারি হেডার, মডিউল গ্রিড" : "3-row header, module grid"}</p>
                  </div>
                </div>
              </div>
            </button>

            {/* Modern */}
            <button
              onClick={() => setSelectedLayout("modern")}
              className={`relative rounded-xl border-2 p-4 transition-all hover:scale-[1.02] hover:shadow-medium cursor-pointer text-left ${
                selectedLayout === "modern" ? "border-primary ring-2 ring-primary/30 shadow-medium" : "border-border hover:border-primary/40"
              }`}
            >
              {selectedLayout === "modern" && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5 z-10">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="space-y-2">
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="h-4 bg-card flex items-center justify-between px-1">
                    <div className="w-3 h-2 bg-primary rounded" />
                    <div className="flex gap-0.5">
                      <div className="w-2 h-1.5 bg-muted rounded-full" />
                      <div className="w-2 h-1.5 bg-muted rounded-full" />
                      <div className="w-2 h-1.5 bg-muted rounded-full" />
                    </div>
                    <div className="w-2 h-2 bg-primary rounded-full" />
                  </div>
                  <div className="h-8 bg-primary/10 flex items-center justify-center">
                    <div className="w-1/2 h-4 bg-primary/20 rounded-full" />
                  </div>
                  <div className="h-2 bg-primary/5 flex items-center justify-center">
                    <div className="flex gap-1">
                      <div className="w-3 h-1 bg-primary/30 rounded" />
                      <div className="w-3 h-1 bg-primary/30 rounded" />
                      <div className="w-3 h-1 bg-primary/30 rounded" />
                    </div>
                  </div>
                  <div className="h-6 bg-card p-1">
                    <div className="grid grid-cols-4 gap-0.5 h-full">
                      <div className="bg-muted rounded" />
                      <div className="bg-muted rounded" />
                      <div className="bg-muted rounded" />
                      <div className="bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-3 bg-foreground/80" />
                </div>
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-bold">{language === "bn" ? "মডার্ন মিনিমাল" : "Modern Minimal"}</p>
                    <p className="text-[10px] text-muted-foreground">{language === "bn" ? "সিঙ্গেল হেডার, পিল নেভ" : "Single header, pill nav"}</p>
                  </div>
                </div>
              </div>
            </button>

            {/* MegaShop */}
            <button
              onClick={() => setSelectedLayout("megashop")}
              className={`relative rounded-xl border-2 p-4 transition-all hover:scale-[1.02] hover:shadow-medium cursor-pointer text-left ${
                selectedLayout === "megashop" ? "border-primary ring-2 ring-primary/30 shadow-medium" : "border-border hover:border-primary/40"
              }`}
            >
              {selectedLayout === "megashop" && (
                <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5 z-10">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
              <div className="space-y-2">
                <div className="rounded-lg border border-border overflow-hidden">
                  <div className="h-1.5 bg-primary" />
                  <div className="h-4 bg-card flex items-center gap-0.5 px-1">
                    <div className="w-3 h-2 bg-primary rounded" />
                    <div className="flex-1 h-2 bg-muted rounded mx-0.5" />
                    <div className="w-2 h-2 bg-muted rounded" />
                  </div>
                  <div className="h-2 bg-foreground/80 flex items-center px-1">
                    <div className="w-4 h-1 bg-primary rounded mr-0.5" />
                    <div className="flex gap-0.5">
                      <div className="w-2 h-1 bg-white/30 rounded" />
                      <div className="w-2 h-1 bg-white/30 rounded" />
                    </div>
                    <div className="ml-auto w-3 h-1 bg-yellow-400 rounded" />
                  </div>
                  <div className="h-7 bg-muted/30 p-0.5 grid grid-cols-4 gap-0.5">
                    <div className="col-span-3 bg-primary/15 rounded" />
                    <div className="flex flex-col gap-0.5">
                      <div className="flex-1 bg-primary/20 rounded" />
                      <div className="flex-1 bg-accent/20 rounded" />
                    </div>
                  </div>
                  <div className="h-5 bg-card p-0.5">
                    <div className="grid grid-cols-4 gap-0.5 h-full">
                      <div className="bg-muted rounded" />
                      <div className="bg-muted rounded" />
                      <div className="bg-muted rounded" />
                      <div className="bg-muted rounded" />
                    </div>
                  </div>
                  <div className="h-2 bg-muted/50 flex items-center justify-center gap-1 px-1">
                    <div className="w-2 h-1 bg-primary/30 rounded" />
                    <div className="w-2 h-1 bg-primary/30 rounded" />
                    <div className="w-2 h-1 bg-primary/30 rounded" />
                    <div className="w-2 h-1 bg-primary/30 rounded" />
                  </div>
                  <div className="h-3 bg-foreground/80" />
                </div>
                <div className="flex items-center gap-2">
                  <Store className="h-4 w-4 text-primary" />
                  <div>
                    <p className="text-sm font-bold">{language === "bn" ? "মেগা শপ" : "Mega Shop"}</p>
                    <p className="text-[10px] text-muted-foreground">{language === "bn" ? "মেগা সার্চ, ক্যাটাগরি ড্রপডাউন" : "Mega search, category dropdown"}</p>
                  </div>
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* Button Animation Style */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {language === "bn" ? "বাটন এনিমেশন স্টাইল" : "Button Animation Style"}
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            {language === "bn"
              ? "একটি স্টাইল বেছে নিন — পুরো ওয়েবসাইটের সকল বাটনে এই এনিমেশন প্রয়োগ হবে। লাইভ প্রিভিউ দেখতে হোভার করুন।"
              : "Pick a style — it will be applied to every button across the website. Hover to see the live preview."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {buttonStylePresets.map((preset) => {
              const isActive = buttonStyle === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => {
                    setButtonStyle(preset.id);
                    applyButtonStyle(preset.id);
                  }}
                  className={`relative rounded-xl border-2 p-3 transition-all hover:shadow-medium cursor-pointer text-left ${
                    isActive
                      ? "border-primary ring-2 ring-primary/30 shadow-medium bg-primary/5"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5 z-10">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  <p className="text-sm font-bold mb-1">
                    {language === "bn" ? preset.name_bn : preset.name_en}
                  </p>
                  <p className="text-[10px] text-muted-foreground mb-3 leading-snug min-h-[28px]">
                    {language === "bn" ? preset.description_bn : preset.description_en}
                  </p>
                  {/* Demo button — temporarily wraps the data attribute so this preview always shows the preset effect */}
                  <div data-btn-style={preset.id === "default" ? undefined : preset.id} className="flex justify-center">
                    <span
                      role="button"
                      tabIndex={-1}
                      className="inline-flex items-center justify-center px-4 py-2 rounded-md text-xs font-medium bg-primary text-primary-foreground select-none"
                    >
                      {language === "bn" ? "প্রিভিউ" : "Preview"}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Theme Presets */}
        <div>
          <h4 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            {language === "bn" ? "থিম প্রিসেট" : "Theme Presets"}
          </h4>
          <p className="text-xs text-muted-foreground mb-4">
            {language === "bn" 
              ? "একটি থিম সিলেক্ট করলে সকল কালার স্বয়ংক্রিয়ভাবে পরিবর্তন হবে। পরে আলাদা কালারও কাস্টমাইজ করতে পারবেন।" 
              : "Select a theme to auto-apply all colors. You can customize individual colors afterward."}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {themePresets.map((preset) => {
              const isActive = preset.colors.theme_primary === colors.theme_primary &&
                preset.colors.theme_secondary === colors.theme_secondary &&
                preset.colors.theme_accent === colors.theme_accent;
              return (
                <button
                  key={preset.name_en}
                  onClick={() => {
                    const newColors = { ...colors, ...preset.colors };
                    setColors(newColors);
                    // Live preview all colors
                    Object.entries(preset.colors).forEach(([key, value]) => {
                      const vars = cssVarMap[key];
                      if (vars) {
                        const hsl = hexToHsl(value);
                        vars.forEach((v) => document.documentElement.style.setProperty(v, hsl));
                      }
                    });
                    toast.success(language === "bn" 
                      ? `"${preset.name_bn}" থিম প্রয়োগ হয়েছে` 
                      : `"${preset.name_en}" theme applied`);
                  }}
                  className={`relative rounded-xl border-2 p-3 transition-all hover:scale-[1.03] hover:shadow-medium cursor-pointer text-left ${
                    isActive 
                      ? "border-primary ring-2 ring-primary/30 shadow-medium" 
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  {isActive && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground rounded-full p-0.5 z-10">
                      <Check className="h-3.5 w-3.5" />
                    </div>
                  )}
                  {/* Color swatches */}
                  <div className="rounded-lg overflow-hidden mb-2">
                    {preset.swatches.map((swatch, i) => (
                      <div
                        key={i}
                        className="h-5"
                        style={{ backgroundColor: swatch }}
                      />
                    ))}
                  </div>
                  <p className="text-xs font-semibold truncate">
                    {language === "bn" ? preset.name_bn : preset.name_en}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

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
          {/* Utility bar preview */}
          <div className="rounded-md overflow-hidden">
            <div className="flex items-center justify-between px-4 py-1.5 text-xs font-medium"
              style={{ backgroundColor: colors.theme_header_utility_bg || "#00899A", color: colors.theme_header_utility_text || "#FFFFFF" }}>
              <span>✉ info@fishcare.com.bd</span>
              <span>{language === "bn" ? "আমার অ্যাকাউন্ট" : "MY ACCOUNT"}</span>
            </div>
            {/* Header row preview */}
            <div className="flex items-center justify-between px-4 py-2 text-sm font-medium"
              style={{ backgroundColor: colors.theme_header_bg || "#FFFFFF", color: colors.theme_foreground || "#1E2D3D", borderBottom: `1px solid ${colors.theme_border || "#E2E8F0"}` }}>
              <span className="font-bold">{language === "bn" ? "🐟 লোগো" : "🐟 Logo"}</span>
              <span className="text-xs" style={{ color: colors.theme_link || "#0077B6" }}>🔍 📞 🛒</span>
            </div>
            {/* Nav bar preview */}
            <div className="flex items-center gap-4 px-4 py-1.5 text-xs font-semibold uppercase"
              style={{ backgroundColor: colors.theme_header_nav_bg || "#1E2D3D", color: colors.theme_header_nav_text || "#FFFFFF" }}>
              <span>{language === "bn" ? "হোম" : "Home"}</span>
              <span>{language === "bn" ? "শপ" : "Shop"}</span>
              <span>{language === "bn" ? "মডিউল" : "Modules"}</span>
            </div>
          </div>
          {/* Buttons & badges */}
          <div className="flex flex-wrap gap-3">
            <div className="px-4 py-2 rounded-md text-sm font-medium transition-colors cursor-default"
              style={{ backgroundColor: colors.theme_button || colors.theme_primary, color: "#fff" }}>
              {language === "bn" ? "বাটন" : "Button"}
            </div>
            <div className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: colors.theme_secondary, color: "#fff" }}>
              {language === "bn" ? "সেকেন্ডারি" : "Secondary"}
            </div>
            <div className="px-4 py-2 rounded-md text-sm font-medium"
              style={{ backgroundColor: colors.theme_accent, color: "#fff" }}>
              {language === "bn" ? "অ্যাকসেন্ট" : "Accent"}
            </div>
          </div>
          {/* Footer preview */}
          <div className="rounded-md overflow-hidden">
            <div className="px-4 py-3 text-sm"
              style={{ backgroundColor: colors.theme_footer_bg || "#1E2D3D" }}>
              <span className="font-semibold" style={{ color: colors.theme_footer_heading || "#FFFFFF" }}>
                {language === "bn" ? "ফুটার শিরোনাম" : "Footer Heading"}
              </span>
              <p className="text-xs mt-1" style={{ color: colors.theme_footer_text || "#CBD5E1" }}>
                {language === "bn" ? "ফুটারের টেক্সট এখানে দেখাবে" : "Footer text will appear here"}
              </p>
            </div>
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
