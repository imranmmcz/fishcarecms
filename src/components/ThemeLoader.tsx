import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { applyThemeColors } from "@/components/ThemeColorSettings";

export function ThemeLoader() {
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const { data } = await supabase
          .from("system_settings")
          .select("setting_key, setting_value")
          .like("setting_key", "theme_%");

        if (data && data.length > 0) {
          const colors: Record<string, string> = {};
          data.forEach((d) => {
            if (d.setting_value) colors[d.setting_key] = d.setting_value;
          });
          if (Object.keys(colors).length > 0) {
            applyThemeColors(colors);
          }
        }
      } catch (err) {
        console.error("Error loading theme:", err);
      }
    };
    loadTheme();
  }, []);

  return null;
}
