import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Loads Google Analytics gtag.js script dynamically based on system settings.
 */
const GoogleAnalyticsLoader = () => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadGA = async () => {
      try {
        const { data, error } = await supabase
          .from("system_settings")
          .select("setting_key, setting_value")
          .in("setting_key", ["google_analytics_enabled", "google_analytics_measurement_id"]);

        if (error) throw error;

        const settings: Record<string, string> = {};
        (data || []).forEach((s: any) => {
          settings[s.setting_key] = s.setting_value || "";
        });

        const isEnabled = settings["google_analytics_enabled"] === "true";
        const measurementId = settings["google_analytics_measurement_id"];

        if (isEnabled && measurementId && !loaded) {
          // Load gtag.js script
          const script = document.createElement("script");
          script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
          script.async = true;
          document.head.appendChild(script);

          // Initialize gtag
          const inlineScript = document.createElement("script");
          inlineScript.textContent = `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}');
          `;
          document.head.appendChild(inlineScript);

          setLoaded(true);
        }
      } catch (err) {
        console.error("Error loading Google Analytics:", err);
      }
    };

    loadGA();
  }, [loaded]);

  return null;
};

export default GoogleAnalyticsLoader;
