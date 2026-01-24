/**
 * Hook to fetch payment settings from system_settings
 */
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PaymentSettings {
  bkash: {
    number: string;
    type: string;
    enabled: boolean;
  };
  nagad: {
    number: string;
    type: string;
    enabled: boolean;
  };
  cod: {
    enabled: boolean;
  };
}

const defaultSettings: PaymentSettings = {
  bkash: { number: "01711-XXXXXX", type: "Personal", enabled: true },
  nagad: { number: "01811-XXXXXX", type: "Personal", enabled: true },
  cod: { enabled: true },
};

export function usePaymentSettings() {
  const [settings, setSettings] = useState<PaymentSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "payment_bkash_number",
          "payment_bkash_type",
          "payment_bkash_enabled",
          "payment_nagad_number",
          "payment_nagad_type",
          "payment_nagad_enabled",
          "payment_cod_enabled",
        ]);

      if (error) throw error;

      if (data) {
        const settingsMap: Record<string, string> = {};
        data.forEach((item) => {
          settingsMap[item.setting_key] = item.setting_value || "";
        });

        setSettings({
          bkash: {
            number: settingsMap.payment_bkash_number || defaultSettings.bkash.number,
            type: settingsMap.payment_bkash_type || defaultSettings.bkash.type,
            enabled: settingsMap.payment_bkash_enabled !== "false",
          },
          nagad: {
            number: settingsMap.payment_nagad_number || defaultSettings.nagad.number,
            type: settingsMap.payment_nagad_type || defaultSettings.nagad.type,
            enabled: settingsMap.payment_nagad_enabled !== "false",
          },
          cod: {
            enabled: settingsMap.payment_cod_enabled !== "false",
          },
        });
      }
    } catch (error) {
      console.error("Error fetching payment settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return { settings, isLoading, refetch: fetchSettings };
}
