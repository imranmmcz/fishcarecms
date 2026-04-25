import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyThemeColors } from "@/components/ThemeColorSettings";

export type ButtonAnimationStyle =
  | "default"
  | "scale"
  | "lift"
  | "glow"
  | "shine"
  | "push"
  | "pulse"
  | "neon";

export function applyButtonStyle(style: string | null | undefined) {
  const root = document.documentElement;
  if (!style || style === "default") {
    root.removeAttribute("data-btn-style");
  } else {
    root.setAttribute("data-btn-style", style);
  }
}

export function ThemeLoader() {
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("setting_key, setting_value")
          .or("setting_key.like.theme_%,setting_key.eq.button_animation_style");

        if (data && data.length > 0) {
          const colors: Record<string, string> = {};
          let btnStyle: string | null = null;
          data.forEach((d) => {
            if (!d.setting_value) return;
            if (d.setting_key === "button_animation_style") {
              btnStyle = d.setting_value;
            } else {
              colors[d.setting_key] = d.setting_value;
            }
          });
          if (Object.keys(colors).length > 0) {
            applyThemeColors(colors);
          }
          applyButtonStyle(btnStyle);
        }
      } catch (err) {
        console.error("Error loading theme:", err);
      }
    };
    loadTheme();
  }, []);

  return null;
}
