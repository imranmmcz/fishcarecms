/**
 * Hook to fetch delivery settings and calculate delivery charge
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface DeliveryRule {
  id: string;
  rule_type: string;
  district_name: string | null;
  min_value: number;
  max_value: number | null;
  charge_amount: number;
  is_active: boolean;
  priority: number;
}

export interface DeliverySettings {
  enabled: boolean;
  defaultCharge: number;
  freeAbove: number;
  deliveryChargeMandatory: 'none' | 'all' | 'cod_only';
  partialPaymentEnabled: boolean;
  partialPaymentMinPercent: number;
  partialPaymentMethods: string[];
  rules: DeliveryRule[];
}

const defaultSettings: DeliverySettings = {
  enabled: true,
  defaultCharge: 100,
  freeAbove: 0,
  deliveryChargeMandatory: 'none',
  partialPaymentEnabled: false,
  partialPaymentMinPercent: 50,
  partialPaymentMethods: ["bkash", "nagad"],
  rules: [],
};

export function useDeliverySettings() {
  const [settings, setSettings] = useState<DeliverySettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: sysData } = await supabase
        .from("system_settings")
        .select("setting_key, setting_value")
        .in("setting_key", [
          "delivery_charge_enabled",
          "delivery_default_charge",
          "delivery_free_above",
          "delivery_charge_mandatory",
          "partial_payment_enabled",
          "partial_payment_min_percent",
          "partial_payment_methods",
        ]);

      const { data: rulesData } = await supabase
        .from("delivery_charge_rules" as any)
        .select("*")
        .eq("is_active", true)
        .order("priority", { ascending: false });

      const map: Record<string, string> = {};
      sysData?.forEach((s) => {
        map[s.setting_key] = s.setting_value || "";
      });

      const parsedRules: DeliveryRule[] = ((rulesData as any[]) || []).map((r: any) => ({
        id: r.id,
        rule_type: r.rule_type,
        district_name: r.district_name,
        min_value: r.min_value || 0,
        max_value: r.max_value,
        charge_amount: r.charge_amount,
        is_active: r.is_active,
        priority: r.priority,
      }));

      setSettings({
        enabled: map.delivery_charge_enabled !== "false",
        defaultCharge: parseFloat(map.delivery_default_charge || "100"),
        freeAbove: parseFloat(map.delivery_free_above || "0"),
        deliveryChargeMandatory: (map.delivery_charge_mandatory as 'none' | 'all' | 'cod_only') || 'none',
        partialPaymentEnabled: map.partial_payment_enabled === "true",
        partialPaymentMinPercent: parseFloat(map.partial_payment_min_percent || "50"),
        partialPaymentMethods: (map.partial_payment_methods || "bkash,nagad").split(","),
        rules: parsedRules,
      });
    } catch (err) {
      console.error("Error fetching delivery settings:", err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const calculateDeliveryCharge = useCallback(
    (district: string, orderAmount: number, totalWeight: number, paymentMethod?: string): number => {
      if (!settings.enabled) return 0;

      // Check if delivery charge is mandatory
      const isMandatory = settings.deliveryChargeMandatory === 'all' ||
        (settings.deliveryChargeMandatory === 'cod_only' && paymentMethod === 'cod');

      if (!isMandatory && settings.freeAbove > 0 && orderAmount >= settings.freeAbove) return 0;

      const sortedRules = [...settings.rules].sort((a, b) => b.priority - a.priority);

      for (const rule of sortedRules) {
        if (!rule.is_active) continue;

        if (rule.rule_type === "district" && district) {
          if (rule.district_name?.toLowerCase() === district.toLowerCase()) {
            return rule.charge_amount;
          }
        }

        if (rule.rule_type === "order_amount") {
          const min = rule.min_value || 0;
          const max = rule.max_value || Infinity;
          if (orderAmount >= min && orderAmount <= max) {
            return rule.charge_amount;
          }
        }

        if (rule.rule_type === "product_weight") {
          const min = rule.min_value || 0;
          const max = rule.max_value || Infinity;
          if (totalWeight >= min && totalWeight <= max) {
            return rule.charge_amount;
          }
        }
      }

      return settings.defaultCharge;
    },
    [settings]
  );

  const calculatePartialPayment = useCallback(
    (totalAmount: number) => {
      if (!settings.partialPaymentEnabled) {
        return { advanceAmount: totalAmount, dueAmount: 0, minPercent: 100 };
      }

      const minPercent = settings.partialPaymentMinPercent;
      const advanceAmount = Math.ceil((totalAmount * minPercent) / 100);
      const dueAmount = totalAmount - advanceAmount;

      return { advanceAmount, dueAmount, minPercent };
    },
    [settings]
  );

  return {
    settings,
    isLoading,
    calculateDeliveryCharge,
    calculatePartialPayment,
    refetch: fetchSettings,
  };
}
